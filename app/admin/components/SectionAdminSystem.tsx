"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays, Trash2, ChevronLeft, ChevronRight,
    Image as ImageIcon, Clock, AlertTriangle, CheckCircle2, X,
    Skull, Bomb, AlertOctagon, Lock, UserX, Send, ShieldAlert, XCircle,
    LayoutDashboard, Activity, UserCheck, UserMinus, HelpCircle, PieChart,
    Database, ScanLine, Eye, Power, FileText, Loader2, ShieldCheck
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
    const [isHighAdmin, setIsHighAdmin] = useState(false);
    const [viewMode, setViewMode] = useState<'DETAIL' | 'ANALYSIS'>('DETAIL');
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- 🚀 RADAR AUTOMATION STATES ---
    const [radarConfig, setRadarConfig] = useState({ auto_report: false });
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isTransmitting, setIsTransmitting] = useState(false);

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

        if (auth.pangkat === 'JENDRAL' || auth.is_highadmin === true) {
            setIsHighAdmin(true);
            const { data: config } = await supabase.from('system_config').select('*').eq('id', 'radar_inactivity').single();
            if (config) setRadarConfig(config.settings);
        }

        const { data: users } = await supabase.from('users').select('discord_id, name, pangkat, divisi').order('pangkat', { ascending: false });
        if (users) setPersonnel(users);

        const { data: dutyData } = await supabase.from('presensi_duty').select('*').gte('start_time', weekStart.toISOString()).lte('start_time', weekEnd.toISOString());
        if (dutyData) setDuties(dutyData);

        const { data: cutiData } = await supabase.from('pengajuan_cuti').select('*');
        if (cutiData) setCutis(cutiData);

        setLoading(false);
    };

    useEffect(() => { verifyAndFetch(); }, [currentDate]);

    // --- 📡 LOGIKA RADAR (TOGGLE & TRANSMIT) ---
    const toggleAutoRadar = async () => {
        const newStatus = !radarConfig.auto_report;
        const tId = toast.loading("Updating System Protocol...");

        const { error } = await supabase.from('system_config').upsert({
            id: 'radar_inactivity',
            settings: { auto_report: newStatus },
            updated_at: new Date().toISOString()
        });

        if (error) {
            toast.error("Gagal update protokol!", { id: tId });
        } else {
            setRadarConfig({ auto_report: newStatus });
            toast.success(`AUTO RADAR: ${newStatus ? 'ENABLED' : 'DISABLED'}`, { id: tId });
        }
    };

    const handleManualTransmit = async () => {
        setIsTransmitting(true);
        const tId = toast.loading("SYSTEM: Initiating Manual Radar Scan...");

        try {
            const res = await fetch('/api/cron/inactive-radar');
            if (res.ok) {
                toast.success("SURAT LAPORAN TERKIRIM KE DISCORD!", { id: tId });
                setIsPreviewing(false);
            } else {
                throw new Error("Discord API Response Error");
            }
        } catch (err: any) {
            toast.error("Gagal Kirim: " + err.message, { id: tId });
        } finally {
            setIsTransmitting(false);
        }
    };

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
        return personnel.filter(p => {
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
    }, [personnel, duties, cutis, weekStart, weekEnd]);

    const getDayStatus = (discordId: string, date: Date) => {
        const targetDate = format(date, 'yyyy-MM-dd');

        // AMBIL SEMUA DUTY DI HARI TERSEBUT (MENGGUNAKAN FILTER, BUKAN FIND)
        const dutiesToday = duties.filter(d => {
            if (d.user_id_discord !== discordId) return false;
            if (!d.start_time) return false;
            const dutyLocalDate = format(new Date(d.start_time), 'yyyy-MM-dd');
            return dutyLocalDate === targetDate;
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
                    {isHighAdmin && (
                        <div className="flex bg-slate-100 p-1.5 rounded-xl border-2 border-black w-full md:w-auto justify-center">
                            <button
                                onClick={toggleAutoRadar}
                                className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase italic flex items-center gap-2 transition-all",
                                    radarConfig.auto_report ? "bg-[#00E676] border-2 border-black shadow-[2px_2px_0px_#000]" : "bg-white opacity-50 hover:opacity-100"
                                )}
                            >
                                <Power size={14} /> Auto Radar: {radarConfig.auto_report ? 'ON' : 'OFF'}
                            </button>
                            <button
                                onClick={() => setIsPreviewing(true)}
                                className="px-4 py-2 text-[9px] font-black uppercase italic flex items-center gap-2 hover:bg-black/5 transition-all opacity-60 hover:opacity-100"
                            >
                                <Eye size={14} /> Preview Surat
                            </button>
                        </div>
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

                    {isHighAdmin && (
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
                            {personnel.map((p) => (
                                <tr key={p.discord_id} className="border-b-2 border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-4 border-r-2 border-slate-100 font-black sticky left-0 bg-white group-hover:bg-slate-50 z-10 transition-colors">
                                        <p className="text-xs uppercase leading-none">{p.name?.split('|').pop()}</p>
                                        <p className="text-[9px] text-[#3B82F6] font-bold mt-1 uppercase italic opacity-70">{p.pangkat}</p>
                                    </td>
                                    {daysInWeek.map((day, idx) => {
                                        const status = getDayStatus(p.discord_id, day);
                                        return (
                                            <td key={idx} className="p-3 border-r-2 border-slate-100 min-w-[150px] align-top">
                                                {viewMode === 'DETAIL' ? (
                                                    // --- MODE DETAIL (KARTU BESAR) ---
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

                                                                <div className="flex flex-col gap-1.5">
                                                                    {status.data.map((duty: any) => (
                                                                        <div key={duty.id} className="bg-black/10 border border-black/20 text-slate-900 px-2 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest flex justify-between items-center group/item relative">
                                                                            <span>
                                                                                {duty.start_time ? format(new Date(duty.start_time), 'HH:mm') : '--'} - {duty.end_time ? format(new Date(duty.end_time), 'HH:mm') : '--'}
                                                                            </span>
                                                                            <div className="flex items-center gap-1.5">
                                                                                {duty.bukti_foto?.[0] && (
                                                                                    <button onClick={() => setSelectedPhoto(duty.bukti_foto[0])} className="text-blue-700 hover:text-blue-900 transition-colors">
                                                                                        <ImageIcon size={14} />
                                                                                    </button>
                                                                                )}
                                                                                <button onClick={() => setConfirmModal({ show: true, type: 'SINGLE', data: { id: duty.id, table: 'presensi_duty' } })} className="text-red-600 hover:text-red-800 transition-colors opacity-0 group-hover/item:opacity-100">
                                                                                    <X size={14} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {status.type === 'CUTI' && (
                                                            <div className="bg-[#FFD100] border-2 border-black p-3 rounded-2xl shadow-[4px_4px_0px_#000] flex flex-col min-h-[130px] justify-center items-center text-center relative group/card">
                                                                <button onClick={() => setConfirmModal({ show: true, type: 'SINGLE', data: { id: status.data.id, table: 'pengajuan_cuti' } })} className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full border-2 border-black opacity-0 group-hover/card:opacity-100 z-10"><X size={10} /></button>
                                                                <ShieldAlert size={20} className="mb-2" />
                                                                <p className="text-[10px] font-black uppercase italic">OFF DUTY</p>
                                                                <div className="w-full mt-2 bg-yellow-400/30 p-2 rounded border border-black/10">
                                                                    <p className="text-[9px] font-bold opacity-80 uppercase italic whitespace-normal break-words leading-tight">{status.data.alasan}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    // --- MODE ANALISIS SINGKAT (BADGES) ---
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- 🛑 MODAL PREVIEW SURAT LAPORAN (HIGH ADMIN ONLY) 🛑 --- */}
            <AnimatePresence>
                {isPreviewing && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/95 text-slate-950 backdrop-blur-md">
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className={`bg-white ${boxBorder} ${hardShadow} rounded-[35px] p-8 w-full max-w-2xl flex flex-col max-h-[90vh]`}>
                            <div className="flex justify-between items-start border-b-[4px] border-black pb-4 mb-6 shrink-0">
                                <div>
                                    <h3 className="font-[1000] italic uppercase text-2xl flex items-center gap-2"><FileText size={28} /> Preview Official Report</h3>
                                    <p className="text-[10px] font-black uppercase opacity-50 mt-1">Format Surat Yang Akan Terkirim Ke Discord HQ</p>
                                </div>
                                <button onClick={() => setIsPreviewing(false)} className="hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all border-2 border-black shadow-[2px_2px_0px_#000] active:shadow-none active:translate-y-px"><X /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 bg-slate-50 border-4 border-dashed border-slate-300 rounded-3xl p-6 font-mono text-[11px] leading-relaxed">
                                <div className="text-center border-b-2 border-black pb-4 mb-4">
                                    <ShieldCheck size={40} className="mx-auto mb-2 text-blue-600" />
                                    <h2 className="font-[1000] text-lg uppercase">Mandalika Police Department</h2>
                                    <p className="font-black opacity-60">INTERNAL SECURITY DIVISION • RADAR SCAN</p>
                                </div>
                                <p>**Nomor:** SP/RADAR-INACTIVE/{format(new Date(), 'MM/yyyy')}</p>
                                <p>**Perihal:** Laporan Otomatis Personel Inactive</p>
                                <p className="mt-4">**SYSTEM** mendeteksi adanya ketidakhadiran aktivitas dinas pada radar pusat.</p>
                                <p className="mt-2">Berikut adalah daftar anggota **INACTIVE** periode 7 hari terakhir:</p>

                                <div className="bg-black text-[#00E676] p-4 rounded-xl my-4 text-[10px] shadow-inner">
                                    <p className="border-b border-[#00E676]/30 pb-1 mb-1 tracking-widest">NO | NAMA | PANGKAT | DIVISI</p>
                                    {inactivePersonnel.length === 0 ? (
                                        <p className="opacity-50 italic py-2">System Clear. Seluruh personel aktif.</p>
                                    ) : (
                                        <>
                                            {inactivePersonnel.slice(0, 10).map((u, i) => (
                                                <p key={i}>{i + 1} | {u.name?.split('|').pop()} | {u.pangkat} | {u.divisi || 'UNIT'}</p>
                                            ))}
                                            {inactivePersonnel.length > 10 && <p className="mt-2 text-[#FFD100]">... Dan {inactivePersonnel.length - 10} personel lainnya.</p>}
                                        </>
                                    )}
                                </div>

                                <p className="font-black italic">**Harap segera ditindaklanjuti oleh Petinggi.**</p>
                            </div>

                            <div className="pt-6 flex gap-4 shrink-0">
                                <button onClick={() => setIsPreviewing(false)} className="flex-1 bg-slate-200 border-2 border-black py-4 rounded-2xl font-black text-xs uppercase shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all">Tutup Preview</button>
                                <button
                                    disabled={isTransmitting || inactivePersonnel.length === 0}
                                    onClick={handleManualTransmit}
                                    className="flex-1 bg-[#00E676] border-2 border-black py-4 px-4 rounded-2xl font-black text-xs uppercase shadow-[4px_4px_0px_#000] flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none disabled:opacity-50 transition-all"
                                >
                                    {isTransmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />} {isTransmitting ? "TRANSMITTING..." : "KIRIM MANUAL SEKARANG"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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