"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Image as ImageIcon, Clock,
    AlertOctagon, X, Bomb, Activity, Database, ScanLine,
    FileText, Loader2, ShieldCheck, Download, Trash2
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const cardBorder = "border border-zinc-800/80";
const cardShadow = "shadow-xl shadow-black/40";

// Daftar pangkat petinggi yang kebal radar absen
const EXCLUDED_RANKS = ['JENDRAL', 'KOMJEN', 'IRJEN', 'BRIGJEN', 'KOMBESPOL', 'AKBP', 'KOMPOL', 'AKP'];

// Helper untuk ekstrak path storage dari public URL Supabase
const extractStoragePath = (url: string) => {
    try {
        if (url && url.includes('bukti-absen/')) {
            return url.split('bukti-absen/')[1];
        }
        return null;
    } catch {
        return null;
    }
};

// Helper untuk mengambil nama asli (tanpa simbol badge atau divisi) untuk keperluan sorting A-Z
const extractCleanName = (rawName: string) => {
    if (!rawName) return 'UNKNOWN';
    let name = rawName;
    
    if (name.includes('|')) {
        name = name.split('|').pop()?.trim() || name;
    }
    
    if (name.startsWith('#')) {
        const spaceIndex = name.indexOf(' ');
        if (spaceIndex !== -1) {
            name = name.substring(spaceIndex + 1).trim();
        } else {
            name = "OFFICER";
        }
    }
    return name.toUpperCase();
};

export default function SectionAdminSystem() {
    const router = useRouter();
    const reportRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [duties, setDuties] = useState<any[]>([]);
    const [cutis, setCutis] = useState<any[]>([]);

    const [isHighAdmin, setIsHighAdmin] = useState(false);
    const [viewMode, setViewMode] = useState<'DETAIL' | 'ANALYSIS'>('DETAIL');
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- 🚀 REPORT GENERATOR STATES ---
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    // --- MODAL STATES ---
    const [photoGallery, setPhotoGallery] = useState<{ photos: string[], index: number, dutyId?: string } | null>(null);
    const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, type: 'SINGLE' | 'PURGE' | 'STORAGE_CLEAN', data?: any }>({ show: false, type: 'SINGLE' });
    const [purgeInput, setPurgeInput] = useState("");

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const verifyAndFetch = async () => {
        setLoading(true);
        const sessionData = localStorage.getItem('police_session');
        if (!sessionData) { router.push('/'); return; }
        const parsed = JSON.parse(sessionData);

        const { data: auth } = await supabase.from('users').select('pangkat, is_highadmin, is_admin').eq('discord_id', parsed.discord_id).single();
        if (!auth?.is_admin && !auth?.is_highadmin) {
            router.push('/dashboard');
            return;
        }

        setIsAuthorized(true);
        if (auth.pangkat === 'JENDRAL' || auth.is_highadmin === true) setIsHighAdmin(true);

        // Fetch users beserta field is_pembekuan dan urutkan A-Z
        const { data: users } = await supabase
            .from('users')
            .select('discord_id, name, pangkat, divisi, is_highadmin, is_pembekuan');
            
        if (users) {
            const sortedUsers = users.sort((a, b) => {
                const nameA = extractCleanName(a.name);
                const nameB = extractCleanName(b.name);
                return nameA.localeCompare(nameB);
            });
            setPersonnel(sortedUsers);
        }

        const { data: dutyData } = await supabase.from('presensi_duty').select('*').gte('start_time', weekStart.toISOString()).lte('start_time', weekEnd.toISOString());
        if (dutyData) setDuties(dutyData);

        const { data: cutiData } = await supabase.from('pengajuan_cuti').select('*');
        if (cutiData) setCutis(cutiData);

        setLoading(false);
    };

    useEffect(() => { verifyAndFetch(); }, [currentDate]);

    // --- 📡 LOGIKA RADAR: DETEKSI RANTAI ALPHA 4 HARI BERUNTUN ---
    const inactiveStats = useMemo(() => {
        // Mengecualikan anggota yang is_pembekuan === true agar kebal radar
        const regularPersonnel = personnel.filter(p => {
            const isHigh = p.is_highadmin === true;
            const isTopRank = EXCLUDED_RANKS.includes(p.pangkat?.toUpperCase());
            const isPembekuan = p.is_pembekuan === true;
            return !isHigh && !isTopRank && !isPembekuan;
        });

        const inactive7: any[] = [];
        const inactive4: any[] = [];

        regularPersonnel.forEach(p => {
            const attendanceMap = daysInWeek.map(day => {
                const targetStr = format(day, 'yyyy-MM-dd');
                const hasDuty = duties.some(d => d.user_id_discord === p.discord_id && format(new Date(d.start_time), 'yyyy-MM-dd') === targetStr);
                const hasCuti = cutis.some(c => {
                    if (c.status !== 'APPROVED' || c.user_id_discord !== p.discord_id) return false;
                    const s = startOfDay(new Date(c.tanggal_mulai));
                    const e = startOfDay(new Date(c.tanggal_selesai));
                    const cur = startOfDay(day);
                    return cur >= s && cur <= e;
                });
                return hasDuty || hasCuti;
            });

            const totalPresence = attendanceMap.filter(a => a === true).length;

            if (totalPresence === 0) {
                inactive7.push(p);
                return;
            }

            let maxStreak = 0;
            let currentStreak = 0;
            attendanceMap.forEach(isPresent => {
                if (!isPresent) {
                    currentStreak++;
                    if (currentStreak > maxStreak) maxStreak = currentStreak;
                } else {
                    currentStreak = 0;
                }
            });

            if (maxStreak >= 4) {
                inactive4.push(p);
            }
        });

        return { inactive7, inactive4 };
    }, [personnel, duties, cutis, weekStart, weekEnd, daysInWeek]);

    const handleGenerateReport = async () => {
        setIsPreviewing(true);
        setIsGenerating(true);
        setGeneratedImage(null);

        setTimeout(async () => {
            if (reportRef.current) {
                try {
                    const dataUrl = await toPng(reportRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: '#09090b' });
                    setGeneratedImage(dataUrl);
                } catch (err) {
                    toast.error("Gagal menyusun gambar laporan!");
                } finally {
                    setIsGenerating(false);
                }
            }
        }, 800);
    };

    const executePurgeOperation = async () => {
        if (purgeInput !== "MANDALIKA") return toast.error("KODE OTORISASI SALAH!");

        const tId = toast.loading("Memulai Operasi Pembersihan...");
        try {
            if (confirmModal.type === 'PURGE') {
                const realWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
                const { error: err1 } = await supabase.from('presensi_duty').delete().lt('created_at', realWeekStart).select();
                const { error: err2 } = await supabase.from('pengajuan_cuti').delete().lt('created_at', realWeekStart).select();

                if (err1) throw err1;
                if (err2) throw err2;
                toast.success("DATA LAMA TELAH DIMUSNAHKAN! (Sisa Minggu Ini)", { id: tId });
            }

            else if (confirmModal.type === 'STORAGE_CLEAN') {
                const { data: files, error: listError } = await supabase.storage.from('bukti-absen').list('duty', { limit: 1000 });
                if (listError) throw listError;

                if (files && files.length > 0) {
                    const filePaths = files.map(f => `duty/${f.name}`);
                    const { error: delError } = await supabase.storage.from('bukti-absen').remove(filePaths);
                    if (delError) throw delError;

                    await supabase.from('presensi_duty').update({ bukti_foto: null }).not('bukti_foto', 'is', null);
                    toast.success(`${files.length} BUKTI FOTO & DB TELAH DIBERSIHKAN!`, { id: tId });
                } else {
                    toast.info("Bucket Storage sudah kosong!", { id: tId });
                }
            }

            setConfirmModal({ show: false, type: 'SINGLE' });
            setPurgeInput("");
            verifyAndFetch();
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: tId });
        }
    };

    const executeDeleteSingle = async () => {
        const tId = toast.loading("Menghapus data spesifik...");
        try {
            if (confirmModal.data?.table === 'presensi_duty' && confirmModal.data?.id) {
                const { data: dutyItem } = await supabase
                    .from('presensi_duty')
                    .select('bukti_foto')
                    .eq('id', confirmModal.data.id)
                    .maybeSingle();

                if (dutyItem?.bukti_foto && Array.isArray(dutyItem.bukti_foto)) {
                    const paths = dutyItem.bukti_foto
                        .map((url: string) => extractStoragePath(url))
                        .filter(Boolean) as string[];

                    if (paths.length > 0) {
                        await supabase.storage.from('bukti-absen').remove(paths);
                    }
                }
            }

            const { data, error } = await supabase.from(confirmModal.data.table).delete().eq('id', confirmModal.data.id).select();

            if (error) { 
                toast.error("Gagal: " + error.message, { id: tId }); 
            } else if (!data || data.length === 0) { 
                toast.error("Gagal: RLS Database Memblokir Hapus Data!", { id: tId }); 
            } else { 
                toast.success("DATA TERHAPUS DARI DATABASE & STORAGE", { id: tId }); 
            }
        } catch (err: any) {
            toast.error("Terjadi kesalahan: " + err.message, { id: tId });
        }

        setConfirmModal({ show: false, type: 'SINGLE' });
        verifyAndFetch();
    };

    const handleDeletePhotoFromGallery = async () => {
        if (!photoGallery || !photoGallery.dutyId) return;
        
        const currentPhotoUrl = photoGallery.photos[photoGallery.index];
        setIsDeletingPhoto(true);
        const tId = toast.loading("Menghapus foto dari storage & database...");

        try {
            const filePath = extractStoragePath(currentPhotoUrl);
            if (filePath) {
                const { error: storageErr } = await supabase.storage.from('bukti-absen').remove([filePath]);
                if (storageErr) console.warn("Peringatan Storage:", storageErr);
            }

            const updatedPhotos = photoGallery.photos.filter((_, i) => i !== photoGallery.index);
            
            const { error: dbErr } = await supabase
                .from('presensi_duty')
                .update({ bukti_foto: updatedPhotos.length > 0 ? updatedPhotos : null })
                .eq('id', photoGallery.dutyId);

            if (dbErr) throw dbErr;

            toast.success("Foto berhasil dihapus!", { id: tId });

            if (updatedPhotos.length === 0) {
                setPhotoGallery(null);
            } else {
                setPhotoGallery({
                    ...photoGallery,
                    photos: updatedPhotos,
                    index: Math.min(photoGallery.index, updatedPhotos.length - 1)
                });
            }
            verifyAndFetch();
        } catch (err: any) {
            toast.error("Gagal menghapus foto: " + err.message, { id: tId });
        } finally {
            setIsDeletingPhoto(false);
        }
    };

    const getDayStatus = (discordId: string, date: Date) => {
        const targetDate = format(date, 'yyyy-MM-dd');

        const dutiesToday = duties.filter(d => {
            if (d.user_id_discord !== discordId || !d.start_time) return false;
            return format(new Date(d.start_time), 'yyyy-MM-dd') === targetDate;
        });

        if (dutiesToday.length > 0) return { type: 'DUTY', data: dutiesToday };

        const cutiToday = cutis.find(c => {
            if (c.user_id_discord !== discordId) return false;
            const start = startOfDay(new Date(c.tanggal_mulai));
            const end = startOfDay(new Date(c.tanggal_selesai));
            const current = startOfDay(date);
            return current >= start && current <= end;
        });

        if (cutiToday) return { type: 'CUTI', data: cutiToday };
        return { type: 'NONE', data: null };
    };

    if (!isAuthorized && loading) return <div className="py-20 text-center animate-pulse font-mono text-xs uppercase tracking-widest text-zinc-500 bg-zinc-950 min-h-screen">Authorizing Radar...</div>;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 font-mono text-zinc-100 bg-zinc-950 min-h-screen p-4 md:p-6">
            <Toaster position="top-center" richColors theme="dark" />

            {/* HEADER & HIGH ADMIN TOOLS */}
            <div className={`bg-zinc-900 ${cardBorder} ${cardShadow} p-5 md:p-6 rounded-2xl flex flex-col lg:flex-row gap-6 justify-between items-center`}>
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="p-3 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl"><Activity size={22} /></div>
                    <div>
                        <h2 className="font-extrabold uppercase text-lg md:text-xl tracking-tight text-white flex items-center gap-2">Operational Monitoring</h2>
                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-1">Mandalika Tactical Command v3.0</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full md:w-auto justify-center">
                        <button onClick={() => setViewMode('DETAIL')} className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer", viewMode === 'DETAIL' ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}>Rekap Detail</button>
                        <button onClick={() => setViewMode('ANALYSIS')} className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer", viewMode === 'ANALYSIS' ? "bg-red-600 text-white border border-red-500 shadow-md shadow-red-600/20" : "text-zinc-500 hover:text-zinc-300")}>Analisis Singkat</button>
                    </div>

                    {isHighAdmin && (
                        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/80 md:pl-3 md:border-l">
                            <button
                                onClick={handleGenerateReport}
                                className="bg-red-600 hover:bg-red-700 text-white border border-red-500/40 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer"
                            >
                                <ScanLine size={15} /> Generate Laporan Alpha
                            </button>
                            <button
                                onClick={() => setConfirmModal({ show: true, type: 'STORAGE_CLEAN' })}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Database size={15} /> Bersihkan Storage
                            </button>
                            <button
                                onClick={() => setConfirmModal({ show: true, type: 'PURGE' })}
                                className="bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/60 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Bomb size={15} /> Purge Data Lama
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* TABEL DAN NAVIGASI */}
            <div className="flex justify-center items-center gap-3">
                <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl transition-all cursor-pointer"><ChevronLeft size={18} /></button>
                <div className="bg-zinc-900 text-red-400 border border-zinc-800 px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-inner min-w-[280px] text-center">
                    {format(weekStart, 'dd MMM', { locale: id })} - {format(weekEnd, 'dd MMM yyyy', { locale: id })}
                </div>
                <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl transition-all cursor-pointer"><ChevronRight size={18} /></button>
            </div>

            {/* MAIN TABLE WITH STICKY HEADER & STICKY FIRST COLUMN */}
            <div className={`bg-zinc-900 ${cardBorder} ${cardShadow} rounded-2xl overflow-hidden`}>
                <div className="overflow-auto max-h-[70vh] custom-scrollbar relative">
                    <table className="w-full text-left border-collapse min-w-[1200px] relative">
                        <thead className="sticky top-0 z-20 bg-zinc-950 shadow-md">
                            <tr className="border-b border-zinc-800 text-zinc-400">
                                <th className="p-4 border-r border-zinc-800/80 font-bold uppercase text-[10px] tracking-wider sticky top-0 left-0 z-30 bg-zinc-950 w-[200px] shadow-[2px_0px_5px_rgba(0,0,0,0.5)]">
                                    Personel
                                </th>
                                {daysInWeek.map((day, idx) => (
                                    <th key={idx} className="p-3 text-center border-r border-zinc-800/80 font-bold uppercase text-[10px] tracking-wider bg-zinc-950 sticky top-0 z-20">
                                        {format(day, 'EEEE', { locale: id })}<br /><span className="text-red-500 font-extrabold">{format(day, 'dd/MM')}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {personnel.map((p) => {
                                let rawName = p.name || 'UNKNOWN';
                                if (rawName.includes('|')) {
                                    rawName = rawName.split('|').pop()?.trim() || rawName;
                                }

                                let badgeNumber = "-";
                                if (rawName.startsWith('#')) {
                                    const spaceIndex = rawName.indexOf(' ');
                                    if (spaceIndex !== -1) {
                                        badgeNumber = rawName.substring(1, spaceIndex);
                                        rawName = rawName.substring(spaceIndex + 1).trim();
                                    } else {
                                        badgeNumber = rawName.substring(1);
                                        rawName = "OFFICER";
                                    }
                                }
                                const cleanName = rawName.toUpperCase();

                                return (
                                    <tr key={p.discord_id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                                        <td className="p-4 border-r border-zinc-800/80 font-bold sticky left-0 bg-zinc-900 group-hover:bg-zinc-900/95 z-10 transition-colors shadow-[2px_0px_5px_rgba(0,0,0,0.3)]">
                                            <p className="text-xs uppercase leading-tight text-zinc-100">{cleanName}</p>
                                            
                                            {/* Badge Indikator Pembekuan */}
                                            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-tight mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                <span>{p.pangkat} • #{badgeNumber}</span>
                                                {p.is_pembekuan && (
                                                    <span className="bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                                        PEMBEKUAN
                                                    </span>
                                                )}
                                            </p>
                                        </td>
                                        {daysInWeek.map((day, idx) => {
                                            const status = getDayStatus(p.discord_id, day);
                                            return (
                                                <td key={idx} className="p-3 border-r border-zinc-800/60 min-w-[150px] align-top">
                                                    {viewMode === 'DETAIL' ? (
                                                        <>
                                                            {status.type === 'DUTY' && (
                                                                <div className="bg-zinc-950 border border-emerald-500/30 p-3 rounded-xl shadow-inner flex flex-col min-h-[130px] justify-start relative">
                                                                    <div className="border-b border-emerald-500/20 pb-1.5 mb-2 flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                                                                        <span>
                                                                            {(() => {
                                                                                const totalMinutes = status.data.reduce((acc: number, d: any) => acc + (d.durasi_menit || 0), 0);
                                                                                return `${Math.floor(totalMinutes / 60)}H ${totalMinutes % 60}M`;
                                                                            })()}
                                                                        </span>
                                                                        <Clock size={13} />
                                                                    </div>

                                                                    <div className="flex flex-col gap-2">
                                                                        {status.data.map((duty: any) => (
                                                                            <div key={duty.id} className="bg-zinc-900/90 border border-zinc-800 text-zinc-300 p-2 rounded-lg flex flex-col gap-1 group/item relative">
                                                                                <div className="flex justify-between items-center border-b border-zinc-800 pb-1 w-full">
                                                                                    <span className="font-bold text-[9px] uppercase tracking-wider text-zinc-400">
                                                                                        {duty.start_time ? format(new Date(duty.start_time), 'HH:mm') : '--'} - {duty.end_time ? format(new Date(duty.end_time), 'HH:mm') : '--'}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        {duty.bukti_foto && duty.bukti_foto.length > 0 && (
                                                                                            <button onClick={() => setPhotoGallery({ photos: duty.bukti_foto, index: 0, dutyId: duty.id })} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer" title="Lihat Foto Bukti">
                                                                                                <ImageIcon size={13} />
                                                                                            </button>
                                                                                        )}
                                                                                        <button onClick={() => setConfirmModal({ show: true, type: 'SINGLE', data: { id: duty.id, table: 'presensi_duty' } })} className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer" title="Hapus Laporan Duty Ini">
                                                                                            <X size={13} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <p className="text-[8px] font-medium text-zinc-400 leading-tight whitespace-normal break-words line-clamp-3 mt-0.5">
                                                                                    {duty.catatan_duty || "Tidak ada laporan"}
                                                                                </p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {status.type === 'CUTI' && (
                                                                <div className="bg-zinc-950 border border-amber-500/30 p-3 rounded-xl shadow-inner flex flex-col min-h-[130px] justify-center items-center text-center relative group/card">
                                                                    <button onClick={() => setConfirmModal({ show: true, type: 'SINGLE', data: { id: status.data.id, table: 'pengajuan_cuti' } })} className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer"><X size={13} /></button>
                                                                    <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">OFF DUTY</p>
                                                                    <div className="w-full mt-2 bg-zinc-900 p-2 rounded border border-zinc-800">
                                                                        <p className="text-[9px] font-medium text-zinc-400 uppercase whitespace-normal break-words leading-tight">{status.data.alasan}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        /* --- 🟢 UPDATE: STATUS DALAM MODE ANALISIS SINGKAT --- */
                                                        <div className="flex justify-center items-center h-full">
                                                            {p.is_pembekuan ? (
                                                                <div className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold text-[10px] py-1.5 px-3 rounded-lg uppercase tracking-wider">
                                                                    P/PEMBEKUAN
                                                                </div>
                                                            ) : status.type === 'DUTY' ? (
                                                                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] py-1.5 px-3 rounded-lg uppercase tracking-wider">
                                                                    DUTY
                                                                </div>
                                                            ) : status.type === 'CUTI' ? (
                                                                <div className="bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[10px] py-1.5 px-3 rounded-lg uppercase tracking-wider">
                                                                    CUTI
                                                                </div>
                                                            ) : (
                                                                <div className="bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-[10px] py-1.5 px-3 rounded-lg uppercase tracking-wider">
                                                                    ALPHA
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- 🛑 MODAL KONFIRMASI PURGE / DELETE 🛑 --- */}
            <AnimatePresence>
                {confirmModal.show && (
                    <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md p-4 flex items-center justify-center">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`bg-zinc-950 max-w-sm w-full rounded-2xl p-6 ${cardBorder} ${cardShadow} text-zinc-100 space-y-5`}>
                            <div className="flex items-center gap-3 text-red-500">
                                <AlertOctagon size={26} />
                                <h3 className="font-extrabold text-lg uppercase tracking-tight">
                                    {confirmModal.type === 'SINGLE' ? 'Hapus Data?' : 'Operasi Bahaya'}
                                </h3>
                            </div>

                            {(confirmModal.type === 'PURGE' || confirmModal.type === 'STORAGE_CLEAN') ? (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                                        {confirmModal.type === 'PURGE' ? 'Menghapus seluruh rekap presensi dan cuti SEBELUM minggu ini.' : 'Menghapus SELURUH file bukti foto di storage dan membersihkan memori database.'}
                                        <br /><span className="text-zinc-500 mt-1 block">Masukkan kode otorisasi:</span>
                                    </p>
                                    <input
                                        value={purgeInput}
                                        onChange={(e) => setPurgeInput(e.target.value)}
                                        placeholder="MANDALIKA"
                                        className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl font-mono text-xs text-zinc-100 outline-none focus:border-red-500 transition-all"
                                    />
                                </div>
                            ) : (
                                <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Hapus laporan/izin ini secara permanen? (Foto di storage juga akan dibersihkan)</p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setConfirmModal({ show: false, type: 'SINGLE' }); setPurgeInput(""); }} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">Batal</button>
                                <button onClick={confirmModal.type === 'SINGLE' ? executeDeleteSingle : executePurgeOperation} className="flex-1 bg-red-600 hover:bg-red-700 text-white border border-red-500/40 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">Eksekusi</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- 📸 IMAGE GALLERY PREVIEW WITH INDIVIDUAL DELETE --- */}
            <AnimatePresence>
                {photoGallery && (
                    <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPhotoGallery(null)}>
                        <button className="absolute top-6 right-6 text-zinc-400 hover:text-red-500 transition-colors z-[610] cursor-pointer" onClick={() => setPhotoGallery(null)}>
                            <X size={32} />
                        </button>

                        <div className="relative w-full max-w-4xl flex items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
                            {photoGallery.photos.length > 1 && (
                                <button onClick={() => setPhotoGallery(p => p ? { ...p, index: (p.index - 1 + p.photos.length) % p.photos.length } : null)} className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 p-3 rounded-full border border-zinc-800 transition-all hidden md:block cursor-pointer">
                                    <ChevronLeft size={24} />
                                </button>
                            )}

                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={photoGallery.index} className={`bg-zinc-950 p-3 ${cardBorder} ${cardShadow} rounded-2xl w-full max-w-2xl relative flex flex-col items-center`}>
                                <img src={photoGallery.photos[photoGallery.index]} className="w-full max-h-[70vh] object-contain rounded-xl border border-zinc-800" alt={`Evidence ${photoGallery.index + 1}`} />
                                
                                <div className="w-full flex items-center justify-between mt-3 px-2">
                                    <span className="font-bold uppercase text-xs text-zinc-400 tracking-wider">
                                        Foto {photoGallery.index + 1} dari {photoGallery.photos.length}
                                    </span>

                                    {photoGallery.dutyId && (
                                        <button
                                            disabled={isDeletingPhoto}
                                            onClick={handleDeletePhotoFromGallery}
                                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                        >
                                            {isDeletingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                            <span>Hapus Foto Ini</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>

                            {photoGallery.photos.length > 1 && (
                                <button onClick={() => setPhotoGallery(p => p ? { ...p, index: (p.index + 1) % p.photos.length } : null)} className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 p-3 rounded-full border border-zinc-800 transition-all hidden md:block cursor-pointer">
                                    <ChevronRight size={24} />
                                </button>
                            )}
                        </div>

                        {/* Mobile Controls */}
                        {photoGallery.photos.length > 1 && (
                            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 md:hidden z-[610]" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setPhotoGallery(p => p ? { ...p, index: (p.index - 1 + p.photos.length) % p.photos.length } : null)} className="bg-zinc-900 p-3 rounded-full border border-zinc-800 text-zinc-200"><ChevronLeft size={20} /></button>
                                <button onClick={() => setPhotoGallery(p => p ? { ...p, index: (p.index + 1) % p.photos.length } : null)} className="bg-zinc-900 p-3 rounded-full border border-zinc-800 text-zinc-200"><ChevronRight size={20} /></button>
                            </div>
                        )}
                    </div>
                )}
            </AnimatePresence>

            {/* --- 🛑 MODAL PREVIEW SURAT LAPORAN ALPHA 🛑 --- */}
            <AnimatePresence>
                {isPreviewing && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md text-zinc-100">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className={`bg-zinc-950 ${cardBorder} ${cardShadow} rounded-2xl p-6 md:p-8 w-full max-w-2xl flex flex-col max-h-[90vh]`}>
                            <div className="flex justify-between items-start border-b border-zinc-800 pb-4 mb-6 shrink-0">
                                <div>
                                    <h3 className="font-extrabold uppercase text-lg md:text-xl flex items-center gap-2 text-zinc-100"><FileText size={22} className="text-red-500" /> Surat Peringatan Alpha</h3>
                                    <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mt-1">Sistem Otomatis Penindakan Internal MPD</p>
                                </div>
                                <button onClick={() => setIsPreviewing(false)} className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 transition-all cursor-pointer"><X size={16} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-6 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl flex justify-center items-center">
                                {generatedImage ? (
                                    <img src={generatedImage} alt="Laporan Alpha" className="w-full h-auto rounded-xl border border-zinc-800 shadow-2xl" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-10 text-zinc-500">
                                        <Loader2 className="animate-spin mb-3 text-red-500" size={36} />
                                        <p className="font-bold uppercase text-xs tracking-wider">Menyusun Dokumen Resmi...</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 flex gap-3 shrink-0">
                                <button onClick={() => setIsPreviewing(false)} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">Tutup</button>
                                <button
                                    disabled={!generatedImage}
                                    onClick={() => {
                                        if (!generatedImage) return;
                                        const link = document.createElement('a');
                                        link.download = `MPD_Laporan_Alpha_${format(weekStart, 'dd')}_${format(weekEnd, 'dd_MMM_yyyy')}.png`;
                                        link.href = generatedImage;
                                        link.click();
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white border border-red-500/40 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-red-600/20 cursor-pointer"
                                >
                                    <Download size={16} /> Unduh Surat Gambar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- HIDDEN ENGINE UNTUK GENERATOR GAMBAR (HTML-TO-IMAGE) --- */}
            <div className="fixed top-[-9999px] left-[-9999px] opacity-0 pointer-events-none z-[-1000]">
                <div ref={reportRef} className="w-[800px] bg-zinc-950 border border-zinc-800 font-mono text-zinc-100">
                    <div className="p-10 space-y-6 bg-zinc-950">
                        {/* Header Surat */}
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800/80">
                            <div className="flex items-center gap-4">
                                <div className="bg-red-600/10 border border-red-500/20 p-4 rounded-xl text-red-500"><ShieldCheck size={40} /></div>
                                <div>
                                    <h1 className="text-3xl font-extrabold uppercase tracking-tight text-white">Laporan Inaktif</h1>
                                    <p className="font-bold text-xs text-zinc-400 mt-1 uppercase tracking-widest">Mandalika Police Department</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-xl text-red-400">{format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM/yyyy')}</p>
                                <p className="font-bold text-[10px] bg-red-950/80 text-red-400 border border-red-800/60 px-3 py-1 inline-block mt-2 rounded-lg tracking-wider">CONFIDENTIAL AUDIT</p>
                            </div>
                        </div>

                        {/* List >= 7 Hari */}
                        <div className="bg-red-950/20 border border-red-500/40 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-5 border-b border-red-500/30 pb-3">
                                <Bomb className="text-red-500" size={24} />
                                <h2 className="text-xl font-extrabold text-red-400 uppercase tracking-tight">Tindakan Keras (Alpha 1 Minggu Full)</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {inactiveStats.inactive7.length > 0 ? (
                                    inactiveStats.inactive7.map((p, i) => {
                                        let rawName = p.name || 'UNKNOWN';
                                        if (rawName.includes('|')) rawName = rawName.split('|').pop()?.trim() || rawName;
                                        let badgeNumber = "-";
                                        if (rawName.startsWith('#')) {
                                            const spaceIndex = rawName.indexOf(' ');
                                            if (spaceIndex !== -1) {
                                                badgeNumber = rawName.substring(1, spaceIndex);
                                                rawName = rawName.substring(spaceIndex + 1).trim();
                                            } else {
                                                badgeNumber = rawName.substring(1);
                                                rawName = "OFFICER";
                                            }
                                        }
                                        const cleanName = rawName.toUpperCase();

                                        return (
                                            <div key={i} className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
                                                <span className="font-extrabold text-sm text-zinc-100 uppercase truncate">{cleanName}</span>
                                                <span className="bg-red-600/20 text-red-400 border border-red-500/30 px-2.5 py-1 text-[9px] font-bold rounded-md">{p.pangkat} • #{badgeNumber}</span>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="col-span-2 text-center py-4 font-bold text-xs text-zinc-500 uppercase tracking-wider">Nihil. Seluruh personel aman.</div>
                                )}
                            </div>
                        </div>

                        {/* List >= 4 Hari Berturut-turut */}
                        <div className="bg-amber-950/20 border border-amber-500/40 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-5 border-b border-amber-500/30 pb-3">
                                <AlertOctagon className="text-amber-500" size={24} />
                                <h2 className="text-xl font-extrabold text-amber-400 uppercase tracking-tight">Teguran (Alpha &ge; 4 Hari Beruntun)</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {inactiveStats.inactive4.length > 0 ? (
                                    inactiveStats.inactive4.map((p, i) => {
                                        let rawName = p.name || 'UNKNOWN';
                                        if (rawName.includes('|')) rawName = rawName.split('|').pop()?.trim() || rawName;
                                        let badgeNumber = "-";
                                        if (rawName.startsWith('#')) {
                                            const spaceIndex = rawName.indexOf(' ');
                                            if (spaceIndex !== -1) {
                                                badgeNumber = rawName.substring(1, spaceIndex);
                                                rawName = rawName.substring(spaceIndex + 1).trim();
                                            } else {
                                                badgeNumber = rawName.substring(1);
                                                rawName = "OFFICER";
                                            }
                                        }
                                        const cleanName = rawName.toUpperCase();

                                        return (
                                            <div key={i} className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
                                                <span className="font-extrabold text-sm text-zinc-100 uppercase truncate">{cleanName}</span>
                                                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 text-[9px] font-bold rounded-md">{p.pangkat} • #{badgeNumber}</span>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="col-span-2 text-center py-4 font-bold text-xs text-zinc-500 uppercase tracking-wider">Nihil. Seluruh personel aman.</div>
                                )}
                            </div>
                        </div>

                        <div className="text-center pt-6 text-zinc-500 border-t border-zinc-800">
                            <p className="font-bold text-[10px] uppercase tracking-[0.3em]">System Auto-Generated • Divisi Internal MPD</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
            `}</style>
        </div>
    );
}