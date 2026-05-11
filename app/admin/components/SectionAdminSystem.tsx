"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Image as ImageIcon, Clock,
    AlertOctagon, X, Bomb, Activity, Database, ScanLine,
    Eye, FileText, Loader2, ShieldCheck, Download, Settings, Users
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfDay, subDays } from "date-fns";
import { id } from "date-fns/locale";
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

// Daftar pangkat petinggi yang kebal radar absen
const EXCLUDED_RANKS = ['JENDRAL', 'KOMJEN', 'IRJEN', 'BRIGJEN', 'KOMBESPOL', 'AKBP', 'KOMPOL'];

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
    const [photoGallery, setPhotoGallery] = useState<{ photos: string[], index: number } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, type: 'SINGLE' | 'PURGE' | 'STORAGE_CLEAN', data?: any }>({ show: false, type: 'SINGLE' });
    const [purgeInput, setPurgeInput] = useState("");

    // --- 🚀 MANIPULATION MODAL STATES ---
    const [showManipulateModal, setShowManipulateModal] = useState(false);
    const [isManipulating, setIsManipulating] = useState(false);
    const [manForm, setManForm] = useState({
        targetId: '',
        type: 'DUTY', // DUTY | LAPORAN
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '08:00',
        endTime: '10:00',
        jenisLaporan: 'Penilangan',
        catatan: 'Lupa absen, data diinput Manual oleh High Command'
    });

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

        const { data: users } = await supabase.from('users').select('discord_id, name, pangkat, divisi, is_highadmin').order('pangkat', { ascending: false });
        if (users) setPersonnel(users);

        const { data: dutyData } = await supabase.from('presensi_duty').select('*').gte('start_time', weekStart.toISOString()).lte('start_time', weekEnd.toISOString());
        if (dutyData) setDuties(dutyData);

        const { data: cutiData } = await supabase.from('pengajuan_cuti').select('*');
        if (cutiData) setCutis(cutiData);

        setLoading(false);
    };

    useEffect(() => { verifyAndFetch(); }, [currentDate]);

    // --- 📡 LOGIKA RADAR: DETEKSI RANTAI ALPHA 4 HARI BERUNTUN ---
    const inactiveStats = useMemo(() => {
        const regularPersonnel = personnel.filter(p => {
            const isHigh = p.is_highadmin === true;
            const isTopRank = EXCLUDED_RANKS.includes(p.pangkat?.toUpperCase());
            return !isHigh && !isTopRank;
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

    // --- 🚀 EKSEKUSI MANIPULASI DATA ---
    const executeManipulation = async () => {
        if (!manForm.targetId) return toast.error("Pilih target personel!");

        setIsManipulating(true);
        const tId = toast.loading("Menyuntikkan data ke server...");

        try {
            const targetUser = personnel.find(p => p.discord_id === manForm.targetId);
            if (!targetUser) throw new Error("User tidak ditemukan di sistem.");

            if (manForm.type === 'DUTY') {
                const startStr = `${manForm.date}T${manForm.startTime}:00+07:00`;
                const endStr = `${manForm.date}T${manForm.endTime}:00+07:00`;

                const dStart = new Date(startStr);
                const dEnd = new Date(endStr);
                const diffMs = dEnd.getTime() - dStart.getTime();
                const durasiMenit = Math.floor(diffMs / 60000);

                if (durasiMenit <= 0) throw new Error("Waktu selesai harus lebih besar dari waktu mulai!");

                const { error } = await supabase.from('presensi_duty').insert([{
                    user_id_discord: targetUser.discord_id,
                    nama_panggilan: targetUser.name, // 🚀 FIX: Menambahkan nama panggilan
                    start_time: startStr,
                    end_time: endStr,
                    durasi_menit: durasiMenit,
                    catatan_duty: `[SYSTEM OVERRIDE] ${manForm.catatan}`,
                    bukti_foto: []
                }]);
                if (error) throw error;

            } else {
                // Manipulasi Laporan
                const createdStr = `${manForm.date}T12:00:00+07:00`; // Default siang hari

                const { error } = await supabase.from('laporan_aktivitas').insert([{
                    user_id_discord: targetUser.discord_id,
                    nama_panggilan: targetUser.name, // 🚀 FIX: Menambahkan nama panggilan
                    jenis_laporan: manForm.jenisLaporan,
                    catatan: `[SYSTEM OVERRIDE] ${manForm.catatan}`,
                    bukti_foto: [],
                    status: 'APPROVED',
                    created_at: createdStr // Force custom date
                }]);
                if (error) throw error;
            }

            toast.success("MANIPULASI DATA BERHASIL!", { id: tId });
            setShowManipulateModal(false);
            verifyAndFetch(); // Refresh tabel
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: tId });
        } finally {
            setIsManipulating(false);
        }
    };

    const handleGenerateReport = async () => {
        setIsPreviewing(true);
        setIsGenerating(true);
        setGeneratedImage(null);

        setTimeout(async () => {
            if (reportRef.current) {
                try {
                    const dataUrl = await toPng(reportRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: '#ffffff' });
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
        const { data, error } = await supabase.from(confirmModal.data.table).delete().eq('id', confirmModal.data.id).select();

        if (error) { toast.error("Gagal: " + error.message, { id: tId }); }
        else if (!data || data.length === 0) { toast.error("Gagal: RLS Database Memblokir Hapus Data!", { id: tId }); }
        else { toast.success("DATA TERHAPUS", { id: tId }); }

        setConfirmModal({ show: false, type: 'SINGLE' });
        verifyAndFetch();
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

    if (!isAuthorized && loading) return <div className="py-20 text-center animate-pulse font-black">AUTHORIZING RADAR...</div>;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 font-mono text-slate-950">
            <Toaster position="top-center" richColors />

            {/* HEADER & HIGH ADMIN TOOLS */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-2xl flex flex-col lg:flex-row gap-6 justify-between items-center`}>
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="p-3 bg-slate-950 text-white rounded-xl shadow-[3px_3px_0px_#A78BFA]"><Activity /></div>
                    <div>
                        <h2 className="font-[1000] italic uppercase text-xl md:text-2xl tracking-tighter leading-none">Operational Monitoring</h2>
                        <p className="text-[10px] font-black uppercase opacity-40 italic mt-1">Mandalika Tactical Command v3.0</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border-2 border-black w-full md:w-auto justify-center">
                        <button onClick={() => setViewMode('DETAIL')} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all", viewMode === 'DETAIL' ? "bg-white border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40 hover:bg-black/5")}>Rekap Detail</button>
                        <button onClick={() => setViewMode('ANALYSIS')} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all", viewMode === 'ANALYSIS' ? "bg-[#3B82F6] text-white border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40 hover:bg-black/5")}>Analisis Singkat</button>
                    </div>

                    {isHighAdmin && (
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t-2 md:border-t-0 border-black/10 md:pl-2 md:border-l-2">
                            <button
                                onClick={() => setShowManipulateModal(true)}
                                className="bg-[#3B82F6] text-white border-2 border-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] hover:translate-y-px transition-all flex items-center justify-center gap-2"
                            >
                                <Settings size={16} /> Override Data
                            </button>
                            <button
                                onClick={handleGenerateReport}
                                className="bg-[#FFD100] text-black border-2 border-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] hover:translate-y-px transition-all flex items-center justify-center gap-2"
                            >
                                <ScanLine size={16} /> Laporan Alpha
                            </button>
                            <button
                                onClick={() => setConfirmModal({ show: true, type: 'STORAGE_CLEAN' })}
                                className="bg-orange-500 text-white border-2 border-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] hover:translate-y-px transition-all flex items-center justify-center gap-2"
                            >
                                <Database size={16} /> Hapus Foto
                            </button>
                            <button
                                onClick={() => setConfirmModal({ show: true, type: 'PURGE' })}
                                className="bg-[#FF4D4D] text-white border-2 border-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] hover:translate-y-px transition-all flex items-center justify-center gap-2"
                            >
                                <Bomb size={16} /> Hapus Data
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* TABEL DAN NAVIGASI */}
            <div className="flex justify-center items-center gap-4">
                <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-xl active:translate-y-1"><ChevronLeft /></button>
                <div className="bg-slate-950 text-[#00E676] px-10 py-3 rounded-xl font-black italic uppercase border-2 border-white shadow-[4px_4px_0px_#000] min-w-[300px] text-center tracking-tighter text-sm">
                    {format(weekStart, 'dd MMM', { locale: id })} - {format(weekEnd, 'dd MMM yyyy', { locale: id })}
                </div>
                <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-xl active:translate-y-1"><ChevronRight /></button>
            </div>

            {/* MAIN TABLE */}
            <div className="bg-white border-[4px] border-black rounded-[30px] shadow-[10px_10px_0px_#000] overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-slate-950 text-white">
                                <th className="p-5 border-r-2 border-white/10 font-black uppercase italic text-xs sticky left-0 bg-slate-950 z-10 w-[200px]">Personel</th>
                                {daysInWeek.map((day, idx) => (
                                    <th key={idx} className="p-4 text-center border-r-2 border-white/10 font-black uppercase italic text-[10px]">
                                        {format(day, 'EEEE', { locale: id })}<br /><span className="text-[#00E676] opacity-80">{format(day, 'dd/MM')}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {personnel.map((p) => {
                                // 🚀 PARSING LOGIC: Pisah Nama dan Badge
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
                                    <tr key={p.discord_id} className="border-b-2 border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 border-r-2 border-slate-100 font-black sticky left-0 bg-white group-hover:bg-slate-50 z-10 transition-colors">
                                            <p className="text-xs uppercase leading-none">{cleanName}</p>
                                            <p className="text-[9px] text-[#3B82F6] font-bold mt-1 uppercase italic opacity-70">{p.pangkat} • #{badgeNumber}</p>
                                        </td>
                                        {daysInWeek.map((day, idx) => {
                                            const status = getDayStatus(p.discord_id, day);
                                            return (
                                                <td key={idx} className="p-3 border-r-2 border-slate-100 min-w-[150px] align-top">
                                                    {viewMode === 'DETAIL' ? (
                                                        <>
                                                            {status.type === 'DUTY' && (
                                                                <div className="bg-[#A3E635] border-2 border-black p-3 rounded-2xl shadow-[4px_4px_0px_#000] flex flex-col min-h-[130px] justify-start relative">
                                                                    <div className="border-b-2 border-black/20 pb-1 mb-2 flex flex-col items-center">
                                                                        <div className="font-[1000] text-[11px] uppercase italic flex justify-between w-full text-slate-900">
                                                                            <span>
                                                                                {(() => {
                                                                                    const totalMinutes = status.data.reduce((acc: number, d: any) => acc + (d.durasi_menit || 0), 0);
                                                                                    return `${Math.floor(totalMinutes / 60)}H ${totalMinutes % 60}M`;
                                                                                })()}
                                                                            </span>
                                                                            <Clock size={14} />
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-col gap-2">
                                                                        {status.data.map((duty: any) => (
                                                                            <div key={duty.id} className="bg-black/10 border border-black/20 text-slate-900 p-2 rounded-lg flex flex-col gap-1.5 group/item relative">
                                                                                <div className="flex justify-between items-center border-b border-black/10 pb-1 w-full">
                                                                                    <span className="font-black text-[9px] uppercase tracking-widest">
                                                                                        {duty.start_time ? format(new Date(duty.start_time), 'HH:mm') : '--'} - {duty.end_time ? format(new Date(duty.end_time), 'HH:mm') : '--'}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        {duty.bukti_foto && duty.bukti_foto.length > 0 && (
                                                                                            <button onClick={() => setPhotoGallery({ photos: duty.bukti_foto, index: 0 })} className="text-blue-700 hover:text-blue-900 transition-colors">
                                                                                                <ImageIcon size={14} />
                                                                                            </button>
                                                                                        )}
                                                                                        <button onClick={() => setConfirmModal({ show: true, type: 'SINGLE', data: { id: duty.id, table: 'presensi_duty' } })} className="text-red-600 hover:text-red-800 transition-colors opacity-0 group-hover/item:opacity-100">
                                                                                            <X size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <p className="text-[8px] font-bold italic opacity-80 leading-tight whitespace-normal break-words line-clamp-3">
                                                                                    {duty.catatan_duty || "Tidak ada laporan"}
                                                                                </p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {status.type === 'CUTI' && (
                                                                <div className="bg-[#FFD100] border-2 border-black p-3 rounded-2xl shadow-[4px_4px_0px_#000] flex flex-col min-h-[130px] justify-center items-center text-center relative group/card">
                                                                    <button onClick={() => setConfirmModal({ show: true, type: 'SINGLE', data: { id: status.data.id, table: 'pengajuan_cuti' } })} className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full border-2 border-black opacity-0 group-hover/card:opacity-100 z-10"><X size={10} /></button>
                                                                    <p className="text-[10px] font-black uppercase italic">OFF DUTY</p>
                                                                    <div className="w-full mt-2 bg-yellow-400/30 p-2 rounded border border-black/10">
                                                                        <p className="text-[9px] font-bold opacity-80 uppercase italic whitespace-normal break-words leading-tight">{status.data.alasan}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="flex justify-center items-center h-full">
                                                            {status.type === 'DUTY' ? (
                                                                <div className="bg-[#A3E635] text-slate-950 font-[1000] text-[10px] py-2 px-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] uppercase italic">DUTY</div>
                                                            ) : status.type === 'CUTI' ? (
                                                                <div className="bg-[#FFD100] text-slate-950 font-[1000] text-[10px] py-2 px-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] uppercase italic">CUTI</div>
                                                            ) : (
                                                                <div className="bg-[#FF4D4D] text-white font-[1000] text-[10px] py-2 px-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] uppercase italic opacity-80">ALPHA</div>
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

            {/* --- 🛑 MODAL MANIPULASI DATA (GOD MODE) 🛑 --- */}
            <AnimatePresence>
                {showManipulateModal && (
                    <div className="fixed inset-0 z-[500] bg-black/90 p-4 flex items-center justify-center overflow-y-auto">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`bg-white max-w-xl w-full rounded-[30px] p-6 md:p-8 ${boxBorder} shadow-[10px_10px_0px_#3B82F6] text-slate-950 my-8`}>
                            <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
                                <div className="flex items-center gap-3 text-blue-600">
                                    <Settings size={28} />
                                    <div>
                                        <h3 className="font-[1000] text-xl italic uppercase tracking-tighter">System Override</h3>
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">High Command Auth</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowManipulateModal(false)} className="hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all border-2 border-transparent hover:border-black"><X /></button>
                            </div>

                            <div className="space-y-5">
                                {/* Pilihan Target */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block opacity-60">Target Personel</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <select
                                            value={manForm.targetId}
                                            onChange={(e) => setManForm({ ...manForm, targetId: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-black pl-10 pr-4 py-3 rounded-xl font-black text-xs outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#000] transition-all appearance-none uppercase"
                                        >
                                            <option value="">-- Pilih Anggota --</option>
                                            {personnel.map(p => {
                                                let rName = p.name || 'UNKNOWN';
                                                if (rName.includes('|')) rName = rName.split('|').pop()?.trim() || rName;
                                                return <option key={p.discord_id} value={p.discord_id}>{rName.toUpperCase()} - {p.pangkat}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                {/* Pilihan Tipe Data */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block opacity-60">Tipe Injeksi Data</label>
                                    <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border-2 border-black">
                                        <button
                                            onClick={() => setManForm({ ...manForm, type: 'DUTY' })}
                                            className={cn("flex-1 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all", manForm.type === 'DUTY' ? "bg-white border-2 border-black shadow-[3px_3px_0px_#000]" : "opacity-40")}
                                        >
                                            Absen / Duty
                                        </button>
                                        <button
                                            onClick={() => setManForm({ ...manForm, type: 'LAPORAN' })}
                                            className={cn("flex-1 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all", manForm.type === 'LAPORAN' ? "bg-white border-2 border-black shadow-[3px_3px_0px_#000]" : "opacity-40")}
                                        >
                                            Laporan Aktivitas
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Input Tanggal (Global) */}
                                    <div className={manForm.type === 'LAPORAN' ? 'sm:col-span-2' : ''}>
                                        <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block opacity-60">Tanggal (WIB)</label>
                                        <input
                                            type="date"
                                            value={manForm.date}
                                            onChange={(e) => setManForm({ ...manForm, date: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-black px-4 py-3 rounded-xl font-black text-xs outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#000] transition-all uppercase"
                                        />
                                    </div>

                                    {/* Jika Absen: Jam Mulai & Selesai */}
                                    {manForm.type === 'DUTY' && (
                                        <>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block opacity-60">Jam Mulai</label>
                                                <input
                                                    type="time"
                                                    value={manForm.startTime}
                                                    onChange={(e) => setManForm({ ...manForm, startTime: e.target.value })}
                                                    className="w-full bg-slate-50 border-2 border-black px-4 py-3 rounded-xl font-black text-xs outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#000] transition-all uppercase"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block opacity-60">Jam Selesai</label>
                                                <input
                                                    type="time"
                                                    value={manForm.endTime}
                                                    onChange={(e) => setManForm({ ...manForm, endTime: e.target.value })}
                                                    className="w-full bg-slate-50 border-2 border-black px-4 py-3 rounded-xl font-black text-xs outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#000] transition-all uppercase"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Jika Laporan: Jenis Laporan */}
                                    {manForm.type === 'LAPORAN' && (
                                        <div className="sm:col-span-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block opacity-60">Jenis Laporan</label>
                                            <select
                                                value={manForm.jenisLaporan}
                                                onChange={(e) => setManForm({ ...manForm, jenisLaporan: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-black px-4 py-3 rounded-xl font-black text-xs outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#000] transition-all uppercase appearance-none"
                                            >
                                                <option value="Penilangan">Penilangan</option>
                                                <option value="Penangkapan">Penangkapan</option>
                                                <option value="Penyitaan">Penyitaan</option>
                                                <option value="Patroli">Patroli</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Catatan (Global) */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block opacity-60">Catatan Override</label>
                                    <textarea
                                        rows={3}
                                        value={manForm.catatan}
                                        onChange={(e) => setManForm({ ...manForm, catatan: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-black px-4 py-3 rounded-xl font-black text-xs outline-none focus:bg-white focus:shadow-[4px_4px_0_0_#000] transition-all resize-none"
                                        placeholder="Alasan input manual..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button disabled={isManipulating} onClick={() => setShowManipulateModal(false)} className="flex-1 bg-slate-200 border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all">Batal</button>
                                <button
                                    disabled={isManipulating}
                                    onClick={executeManipulation}
                                    className="flex-[2] bg-[#3B82F6] text-white border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    {isManipulating ? <Loader2 className="animate-spin" size={16} /> : <><Activity size={16} /> Suntik Data</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- 🛑 MODAL KONFIRMASI PURGE / DELETE 🛑 --- */}
            <AnimatePresence>
                {confirmModal.show && (
                    <div className="fixed inset-0 z-[500] bg-black/90 p-4 flex items-center justify-center">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`bg-white max-w-sm w-full rounded-[30px] p-8 ${boxBorder} shadow-[10px_10px_0px_#FF4D4D] text-slate-950 space-y-6`}>
                            <div className="flex items-center gap-3 text-red-600">
                                <AlertOctagon size={32} />
                                <h3 className="font-[1000] text-xl italic uppercase tracking-tighter">
                                    {confirmModal.type === 'SINGLE' ? 'Hapus Data?' : 'Operasi Bahaya'}
                                </h3>
                            </div>

                            {(confirmModal.type === 'PURGE' || confirmModal.type === 'STORAGE_CLEAN') ? (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase text-slate-500">
                                        {confirmModal.type === 'PURGE' ? 'Menghapus seluruh rekap presensi dan cuti SEBELUM minggu ini.' : 'Menghapus SELURUH file bukti foto di storage dan membersihkan memori database.'}
                                        <br />Masukkan kode otorisasi:
                                    </p>
                                    <input
                                        value={purgeInput}
                                        onChange={(e) => setPurgeInput(e.target.value)}
                                        placeholder="MANDALIKA"
                                        className="w-full bg-slate-100 border-2 border-black p-3 rounded-xl font-black text-xs outline-none focus:bg-white shadow-inner"
                                    />
                                </div>
                            ) : (
                                <p className="text-xs font-bold uppercase text-slate-500">Hapus laporan/izin ini secara permanen?</p>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => { setConfirmModal({ show: false, type: 'SINGLE' }); setPurgeInput(""); }} className="flex-1 bg-slate-200 border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all">Batal</button>
                                <button onClick={confirmModal.type === 'SINGLE' ? executeDeleteSingle : executePurgeOperation} className="flex-1 bg-red-500 text-white border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all">Eksekusi</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- 📸 IMAGE GALLERY PREVIEW --- */}
            <AnimatePresence>
                {photoGallery && (
                    <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4" onClick={() => setPhotoGallery(null)}>
                        <button className="absolute top-6 right-6 text-white hover:text-red-500 transition-colors z-[610]" onClick={() => setPhotoGallery(null)}>
                            <X size={36} />
                        </button>

                        <div className="relative w-full max-w-4xl flex items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
                            {photoGallery.photos.length > 1 && (
                                <button onClick={() => setPhotoGallery(p => p ? { ...p, index: (p.index - 1 + p.photos.length) % p.photos.length } : null)} className="bg-white/10 hover:bg-white text-white hover:text-black p-3 rounded-full border-2 border-transparent hover:border-black transition-all hidden md:block">
                                    <ChevronLeft size={32} />
                                </button>
                            )}

                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={photoGallery.index} className={`bg-white p-2 ${boxBorder} rounded-3xl w-full max-w-2xl shadow-[10px_10px_0px_#A3E635]`}>
                                <img src={photoGallery.photos[photoGallery.index]} className="w-full max-h-[75vh] object-contain rounded-2xl border-4 border-black" alt={`Evidence ${photoGallery.index + 1}`} />
                                {photoGallery.photos.length > 1 && (
                                    <div className="text-center font-black italic uppercase text-xs mt-3 mb-1 text-slate-900">
                                        Foto {photoGallery.index + 1} dari {photoGallery.photos.length}
                                    </div>
                                )}
                            </motion.div>

                            {photoGallery.photos.length > 1 && (
                                <button onClick={() => setPhotoGallery(p => p ? { ...p, index: (p.index + 1) % p.photos.length } : null)} className="bg-white/10 hover:bg-white text-white hover:text-black p-3 rounded-full border-2 border-transparent hover:border-black transition-all hidden md:block">
                                    <ChevronRight size={32} />
                                </button>
                            )}
                        </div>

                        {/* Mobile Controls */}
                        {photoGallery.photos.length > 1 && (
                            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 md:hidden z-[610]" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setPhotoGallery(p => p ? { ...p, index: (p.index - 1 + p.photos.length) % p.photos.length } : null)} className="bg-white p-3 rounded-full border-4 border-black"><ChevronLeft size={24} /></button>
                                <button onClick={() => setPhotoGallery(p => p ? { ...p, index: (p.index + 1) % p.photos.length } : null)} className="bg-white p-3 rounded-full border-4 border-black"><ChevronRight size={24} /></button>
                            </div>
                        )}
                    </div>
                )}
            </AnimatePresence>

            {/* --- 🛑 MODAL PREVIEW SURAT LAPORAN ALPHA 🛑 --- */}
            <AnimatePresence>
                {isPreviewing && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/95 text-slate-950 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`bg-white ${boxBorder} ${hardShadow} rounded-[35px] p-6 md:p-8 w-full max-w-2xl flex flex-col max-h-[90vh]`}>
                            <div className="flex justify-between items-start border-b-[4px] border-black pb-4 mb-6 shrink-0">
                                <div>
                                    <h3 className="font-[1000] italic uppercase text-xl md:text-2xl flex items-center gap-2"><FileText size={28} /> Surat Peringatan Alpha</h3>
                                    <p className="text-[10px] font-black uppercase opacity-50 mt-1">Sistem Otomatis Penindakan Internal MPD</p>
                                </div>
                                <button onClick={() => setIsPreviewing(false)} className="hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all border-2 border-black shadow-[2px_2px_0px_#000] active:shadow-none active:translate-y-px"><X /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-6 bg-slate-100 border-4 border-dashed border-slate-300 rounded-3xl flex justify-center items-center">
                                {generatedImage ? (
                                    <img src={generatedImage} alt="Laporan Alpha" className="w-full h-auto rounded-xl border-4 border-black shadow-[6px_6px_0px_#000]" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-10 opacity-50">
                                        <Loader2 className="animate-spin mb-4" size={40} />
                                        <p className="font-black italic uppercase">Menyusun Dokumen Resmi...</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 flex gap-4 shrink-0">
                                <button onClick={() => setIsPreviewing(false)} className="flex-1 bg-slate-200 border-2 border-black py-3 md:py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all">Tutup</button>
                                <button
                                    disabled={!generatedImage}
                                    onClick={() => {
                                        if (!generatedImage) return;
                                        const link = document.createElement('a');
                                        link.download = `MPD_Laporan_Alpha_${format(weekStart, 'dd')}_${format(weekEnd, 'dd_MMM_yyyy')}.png`;
                                        link.href = generatedImage;
                                        link.click();
                                    }}
                                    className="flex-1 bg-[#00E676] border-2 border-black py-3 md:py-4 px-2 md:px-4 rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 md:gap-3 active:translate-y-1 active:shadow-none disabled:opacity-50 transition-all"
                                >
                                    <Download size={18} /> Unduh Surat Gambar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- HIDDEN ENGINE UNTUK GENERATOR GAMBAR (HTML-TO-IMAGE) --- */}
            <div className="fixed top-[-9999px] left-[-9999px] opacity-0 pointer-events-none z-[-1000]">
                <div ref={reportRef} className="w-[800px] bg-white border-[12px] border-slate-950 font-mono text-slate-950">
                    <div className="p-12 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white">
                        {/* Header Surat */}
                        <div className="flex justify-between items-center border-b-[8px] border-slate-950 pb-6 bg-white p-4 rounded-2xl border-4 shadow-[8px_8px_0px_#000]">
                            <div className="flex items-center gap-4">
                                <div className="bg-slate-950 p-4 rounded-xl text-white"><ShieldCheck size={48} /></div>
                                <div>
                                    <h1 className="text-4xl font-[1000] uppercase italic tracking-tighter leading-none">Laporan Inaktif</h1>
                                    <p className="font-black text-lg opacity-60 mt-1 uppercase tracking-widest">Mandalika Police Department</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-[1000] text-2xl italic">{format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM/yyyy')}</p>
                                <p className="font-black text-sm bg-red-600 text-white px-3 py-1 inline-block mt-2 rounded-lg border-2 border-black">CONFIDENTIAL AUDIT</p>
                            </div>
                        </div>

                        {/* List >= 7 Hari */}
                        <div className="bg-red-50 border-[6px] border-red-600 p-8 rounded-3xl shadow-[8px_8px_0px_#DC2626]">
                            <div className="flex items-center gap-3 mb-6 border-b-4 border-red-200 pb-4">
                                <Bomb className="text-red-600" size={32} />
                                <h2 className="text-3xl font-[1000] text-red-600 uppercase italic">Tindakan Keras (Alpha 1 Minggu Full)</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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
                                            <div key={i} className="bg-white border-4 border-red-300 p-4 rounded-xl flex items-center justify-between">
                                                <span className="font-[1000] text-lg uppercase truncate">{cleanName}</span>
                                                <span className="bg-red-600 text-white px-2 py-1 text-[10px] font-black rounded">{p.pangkat} • #{badgeNumber}</span>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="col-span-2 text-center py-4 font-black italic opacity-40 text-red-800">Nihil. Seluruh personel aman.</div>
                                )}
                            </div>
                        </div>

                        {/* List >= 4 Hari Berturut-turut */}
                        <div className="bg-yellow-50 border-[6px] border-yellow-500 p-8 rounded-3xl shadow-[8px_8px_0px_#EAB308]">
                            <div className="flex items-center gap-3 mb-6 border-b-4 border-yellow-200 pb-4">
                                <AlertOctagon className="text-yellow-600" size={32} />
                                <h2 className="text-3xl font-[1000] text-yellow-600 uppercase italic">Teguran (Alpha &ge; 4 Hari Beruntun)</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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
                                            <div key={i} className="bg-white border-4 border-yellow-300 p-4 rounded-xl flex items-center justify-between">
                                                <span className="font-[1000] text-lg uppercase truncate">{cleanName}</span>
                                                <span className="bg-yellow-500 text-slate-900 px-2 py-1 text-[10px] font-black rounded">{p.pangkat} • #{badgeNumber}</span>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="col-span-2 text-center py-4 font-black italic opacity-40 text-yellow-800">Nihil. Seluruh personel aman.</div>
                                )}
                            </div>
                        </div>

                        <div className="text-center pt-8 opacity-40 border-t-4 border-black/20">
                            <p className="font-black text-xs uppercase tracking-[0.5em] italic">System Auto-Generated • Divisi Internal MPD</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
}