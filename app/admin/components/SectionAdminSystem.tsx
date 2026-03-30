"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Image as ImageIcon, Clock, CheckCircle2, X,
    Skull, Bomb, AlertOctagon, UserX, Send, ShieldAlert,
    Activity, Database, ScanLine, GraduationCap, ToggleLeft, ToggleRight
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

export default function SectionAdminSystem() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [duties, setDuties] = useState<any[]>([]);
    const [cutis, setCutis] = useState<any[]>([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [viewMode, setViewMode] = useState<'DETAIL' | 'ANALYSIS'>('DETAIL');
    const [currentDate, setCurrentDate] = useState(new Date());

    // 🎓 CASIS MONITOR MODE (ON/OFF)
    const [showCasisOnly, setShowCasisOnly] = useState(false);

    // --- MODAL STATES ---
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [showInactiveModal, setShowInactiveModal] = useState(false);
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
        if (auth.pangkat === 'JENDRAL' || auth.is_highadmin === true) setIsSuperAdmin(true);

        const { data: users } = await supabase.from('users').select('discord_id, name, pangkat').order('pangkat', { ascending: false });
        if (users) setPersonnel(users);

        const { data: dutyData } = await supabase.from('presensi_duty').select('*').gte('start_time', weekStart.toISOString()).lte('start_time', weekEnd.toISOString());
        if (dutyData) setDuties(dutyData);

        const { data: cutiData } = await supabase.from('pengajuan_cuti').select('*');
        if (cutiData) setCutis(cutiData);

        setLoading(false);
    };

    useEffect(() => { verifyAndFetch(); }, [currentDate]);

    // 🚀 FILTER LOGIC: PILIH ANTARA POLISI ATAU CASIS
    const filteredPersonnel = useMemo(() => {
        if (showCasisOnly) {
            return personnel.filter(p => p.pangkat === 'CASIS');
        }
        return personnel.filter(p => p.pangkat !== 'CASIS');
    }, [personnel, showCasisOnly]);

    // --- 🛠️ LOGIKA PEMBERSIHAN (PURGE & STORAGE) ---
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

                    const { error: dbUpdateError } = await supabase.from('presensi_duty').update({ bukti_foto: null }).not('bukti_foto', 'is', null);
                    if (dbUpdateError) console.warn("Gagal update DB", dbUpdateError);

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

        if (error) {
            toast.error("Gagal: " + error.message, { id: tId });
        } else if (!data || data.length === 0) {
            toast.error("Gagal: RLS Database Memblokir Hapus Data!", { id: tId });
        } else {
            toast.success("DATA TERHAPUS", { id: tId });
        }

        setConfirmModal({ show: false, type: 'SINGLE' });
        verifyAndFetch();
    };

    const handleSendWarning = (user: any) => {
        const tId = toast.loading(`Menyiapkan Surat Peringatan...`);
        setTimeout(() => {
            toast.success(`DISCORD WEBHOOK TERKIRIM UNTUK ${user?.name?.split('|').pop()?.trim() || 'PERSONEL'}!`, { id: tId });
        }, 1500);
    };

    const inactivePersonnel = useMemo(() => {
        return filteredPersonnel.filter(p => {
            const hasDuty = duties.some(d => d.user_id_discord === p.discord_id);
            const hasCuti = cutis.some(c => {
                if (c.status !== 'APPROVED') return false;
                if (c.user_id_discord !== p.discord_id) return false;
                const start = startOfDay(new Date(c.tanggal_mulai));
                const end = startOfDay(new Date(c.tanggal_selesai));
                return (start <= weekEnd && end >= weekStart);
            });
            return !hasDuty && !hasCuti;
        });
    }, [filteredPersonnel, duties, cutis, weekStart, weekEnd]);

    const getDayStatus = (discordId: string, date: Date) => {
        const targetDate = format(date, 'yyyy-MM-dd');

        const dutyToday = duties.find(d => {
            if (d.user_id_discord !== discordId) return false;
            if (!d.start_time) return false;
            const dutyLocalDate = format(new Date(d.start_time), 'yyyy-MM-dd');
            return dutyLocalDate === targetDate;
        });

        if (dutyToday) return { type: 'DUTY', data: dutyToday };

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

            {/* HEADER & SUPER ADMIN TOOLS */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-2xl flex flex-col lg:flex-row gap-6 justify-between items-center transition-all duration-300`}>
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className={cn("p-3 text-white rounded-xl shadow-[3px_3px_0px_#000] transition-all", showCasisOnly ? "bg-orange-500" : "bg-slate-950 shadow-[3px_3px_0px_#A78BFA]")}>
                        {showCasisOnly ? <GraduationCap size={24} /> : <Activity size={24} />}
                    </div>
                    <div>
                        <h2 className="font-[1000] italic uppercase text-xl md:text-2xl tracking-tighter leading-none">
                            {showCasisOnly ? "Pendidikan & Latihan" : "Operational Monitoring"}
                        </h2>
                        <p className="text-[10px] font-black uppercase opacity-40 italic mt-1">Mandalika Tactical Command v3.0</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
                    {/* 🎓 TOGGLE CASIS ON/OFF */}
                    {isSuperAdmin && (
                        <button
                            onClick={() => setShowCasisOnly(!showCasisOnly)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black font-black text-[10px] uppercase italic transition-all shadow-[3px_3px_0px_#000] w-full md:w-auto justify-center",
                                showCasisOnly ? "bg-orange-500 text-white" : "bg-white text-slate-950"
                            )}
                        >
                            {showCasisOnly ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            {showCasisOnly ? "CASIS ON" : "CASIS OFF"}
                        </button>
                    )}

                    <div className="flex bg-slate-100 p-1.5 rounded-xl border-2 border-black w-full md:w-auto justify-center">
                        <button onClick={() => setViewMode('DETAIL')} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all", viewMode === 'DETAIL' ? "bg-white border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40 hover:bg-black/5")}>Rekap Detail</button>
                        <button onClick={() => setViewMode('ANALYSIS')} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all", viewMode === 'ANALYSIS' ? "bg-[#3B82F6] text-white border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40 hover:bg-black/5")}>Analisis Singkat</button>
                    </div>

                    <button
                        onClick={() => setShowInactiveModal(true)}
                        className="bg-slate-950 text-[#FFD100] border-2 border-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#A3E635] hover:translate-y-px transition-all flex items-center justify-center gap-2 w-full md:w-auto"
                    >
                        <ScanLine size={16} /> Radar Inactive
                    </button>

                    {isSuperAdmin && (
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t-2 md:border-t-0 border-black/10 md:pl-2 md:border-l-2">
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
                <div className={cn("px-10 py-3 rounded-xl font-black italic uppercase border-2 shadow-[4px_4px_0px_#000] min-w-[300px] text-center tracking-tighter text-sm transition-colors", showCasisOnly ? "bg-orange-500 text-white border-black" : "bg-slate-950 text-[#00E676] border-white")}>
                    {format(weekStart, 'dd MMM', { locale: id })} - {format(weekEnd, 'dd MMM yyyy', { locale: id })}
                </div>
                <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-xl active:translate-y-1"><ChevronRight /></button>
            </div>

            {/* MAIN TABLE */}
            <div className={cn("bg-white border-[4px] border-black rounded-[30px] shadow-[10px_10px_0px_#000] overflow-hidden transition-all", showCasisOnly && "shadow-[10px_10px_0px_#f97316]")}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className={cn("text-white transition-colors", showCasisOnly ? "bg-orange-600" : "bg-slate-950")}>
                                <th className="p-5 border-r-2 border-white/10 font-black uppercase italic text-xs sticky left-0 bg-inherit z-10 w-[200px]">
                                    {showCasisOnly ? "Siswa Casis" : "Personel"}
                                </th>
                                {daysInWeek.map((day, idx) => (
                                    <th key={idx} className="p-4 text-center border-r-2 border-white/10 font-black uppercase italic text-[10px]">
                                        {format(day, 'EEEE', { locale: id })}<br /><span className={cn("opacity-80", showCasisOnly ? "text-white" : "text-[#00E676]")}>{format(day, 'dd/MM')}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPersonnel.map((p) => (
                                <tr key={p.discord_id} className="border-b-2 border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-4 border-r-2 border-slate-100 font-black sticky left-0 bg-white group-hover:bg-slate-50 z-10 transition-colors">
                                        <p className="text-xs uppercase leading-none">{p.name?.split('|').pop()}</p>
                                        <p className={cn("text-[9px] font-bold mt-1 uppercase italic opacity-70", showCasisOnly ? "text-orange-500" : "text-[#3B82F6]")}>{p.pangkat}</p>
                                    </td>
                                    {daysInWeek.map((day, idx) => {
                                        const status = getDayStatus(p.discord_id, day);
                                        return (
                                            <td key={idx} className="p-3 border-r-2 border-slate-100 min-w-[150px] align-middle">
                                                {viewMode === 'DETAIL' ? (
                                                    // --- MODE DETAIL (KARTU BESAR) ---
                                                    <>
                                                        {status.type === 'DUTY' && (
                                                            <div className={cn("border-2 border-black p-3 rounded-2xl shadow-[4px_4px_0px_#000] flex flex-col h-[120px] justify-between relative group/card transition-colors", showCasisOnly ? "bg-orange-300" : "bg-[#A3E635]")}>
                                                                <button onClick={() => setConfirmModal({ show: true, type: 'SINGLE', data: { id: status.data.id, table: 'presensi_duty' } })} className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full border-2 border-black opacity-0 group-hover/card:opacity-100 z-10"><X size={10} /></button>
                                                                <div className="font-[1000] text-[10px] uppercase italic border-b border-black/20 pb-1 flex justify-between">
                                                                    <span>{showCasisOnly ? "HADIR DIKLAT" : `${Math.floor(status.data.durasi_menit / 60)}H ${status.data.durasi_menit % 60}M`}</span>
                                                                    {showCasisOnly ? <GraduationCap size={12} /> : <Clock size={12} />}
                                                                </div>
                                                                <p className="text-[9px] font-black italic leading-tight uppercase my-2 line-clamp-3">{status.data.catatan_duty}</p>
                                                                {status.data.bukti_foto?.[0] && <button onClick={() => setSelectedPhoto(status.data.bukti_foto[0])} className="bg-black text-white rounded-lg py-1.5 flex justify-center hover:bg-blue-600 active:scale-95 transition-all"><ImageIcon size={14} /></button>}
                                                            </div>
                                                        )}
                                                        {status.type === 'CUTI' && (
                                                            <div className="bg-[#FFD100] border-2 border-black p-3 rounded-2xl shadow-[4px_4px_0px_#000] flex flex-col h-[120px] justify-center items-center text-center relative group/card">
                                                                <button onClick={() => setConfirmModal({ show: true, type: 'SINGLE', data: { id: status.data.id, table: 'pengajuan_cuti' } })} className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full border-2 border-black opacity-0 group-hover/card:opacity-100 z-10"><X size={10} /></button>
                                                                <ShieldAlert size={20} className="mb-2" />
                                                                <p className="text-[10px] font-black uppercase italic">{showCasisOnly ? "IZIN/SAKIT" : "OFF DUTY"}</p>
                                                                <p className="text-[8px] font-bold opacity-50 uppercase mt-1 italic truncate w-full">{status.data.alasan}</p>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    // --- MODE ANALISIS SINGKAT (BADGES) ---
                                                    <div className="flex justify-center items-center h-full">
                                                        {status.type === 'DUTY' ? (
                                                            <div className={cn("text-slate-950 font-[1000] text-[10px] py-2 px-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] uppercase italic", showCasisOnly ? "bg-orange-400" : "bg-[#A3E635]")}>
                                                                {showCasisOnly ? "HADIR" : "DUTY"}
                                                            </div>
                                                        ) : status.type === 'CUTI' ? (
                                                            <div className="bg-[#FFD100] text-slate-950 font-[1000] text-[10px] py-2 px-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] uppercase italic">IZIN</div>
                                                        ) : (
                                                            <div className="bg-[#FF4D4D] text-white font-[1000] text-[10px] py-2 px-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] uppercase italic opacity-80">ALPHA</div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- 🛑 MODAL RADAR INACTIVE (DAFTAR HITAM MINGGUAN) 🛑 --- */}
            <AnimatePresence>
                {showInactiveModal && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 text-slate-950 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-6 md:p-8 w-full max-w-2xl flex flex-col max-h-[85vh]`}>
                            <div className="flex justify-between items-start border-b-[4px] border-black pb-4 mb-4 shrink-0">
                                <div>
                                    <h3 className="font-[1000] italic uppercase text-2xl text-red-600 flex items-center gap-2"><Skull size={28} /> Radar Inactive</h3>
                                    <p className="text-[10px] font-black uppercase opacity-50 mt-1">Personel tanpa aktivitas (Alpha) dalam 7 hari terakhir.</p>
                                </div>
                                <button onClick={() => setShowInactiveModal(false)} className="bg-slate-200 hover:bg-red-500 hover:text-white border-2 border-black p-2 rounded-xl transition-all shadow-[2px_2px_0px_#000] active:translate-y-px active:shadow-none"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                {inactivePersonnel.length === 0 ? (
                                    <div className="bg-slate-100 border-4 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                                        <CheckCircle2 size={48} className="text-[#00E676] mb-3" />
                                        <h4 className="font-[1000] text-xl italic uppercase">Kondisi Ideal</h4>
                                        <p className="text-xs font-black opacity-50 uppercase mt-1">Seluruh personel terpantau aktif atau sedang cuti.</p>
                                    </div>
                                ) : (
                                    inactivePersonnel.map((p) => (
                                        <div key={p.discord_id} className="bg-slate-50 border-2 border-black p-4 rounded-[20px] flex justify-between items-center group hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-red-100 border-2 border-black rounded-xl flex items-center justify-center text-red-600 shadow-[2px_2px_0px_#000]"><UserX size={18} /></div>
                                                <div>
                                                    <h4 className="font-[1000] text-sm uppercase italic leading-none">{p.name?.split('|').pop()?.trim()}</h4>
                                                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter mt-1">{p.pangkat} • {p.divisi}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleSendWarning(p)} className="bg-slate-950 text-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_#FF4D4D] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2">
                                                <Send size={14} className="text-red-400" /> <span className="hidden md:inline font-black text-[9px] uppercase italic tracking-widest">Tegur Personel</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="pt-4 mt-4 border-t-[4px] border-black flex justify-between items-center shrink-0">
                                <p className="text-[10px] font-black uppercase italic bg-red-100 text-red-600 px-3 py-1.5 border-2 border-red-600 rounded-lg">Total Alpha: {inactivePersonnel.length} Personel</p>
                                <button onClick={() => setShowInactiveModal(false)} className="bg-slate-200 border-2 border-black px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-[2px_2px_0px_#000] active:translate-y-1 transition-all">Tutup Radar</button>
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

            {/* IMAGE PREVIEW */}
            <AnimatePresence>
                {selectedPhoto && (
                    <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`bg-white p-2 ${boxBorder} rounded-3xl max-w-4xl w-full`}>
                            <img src={selectedPhoto} className="w-full rounded-2xl border-2 border-black" alt="Evidence" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
}