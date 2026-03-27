"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays, Trash2, ChevronLeft, ChevronRight,
    Image as ImageIcon, Clock, AlertTriangle, CheckCircle2, X,
    Skull, Bomb, AlertOctagon, Lock, UserX, Send, ShieldAlert, XCircle,
    LayoutDashboard, Activity, UserCheck, UserMinus, HelpCircle, PieChart
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

    // --- NEW: TOGGLE VIEW MODE ---
    const [viewMode, setViewMode] = useState<'DETAIL' | 'ANALYSIS'>('DETAIL');

    const [currentDate, setCurrentDate] = useState(new Date());
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [showWarningModal, setShowWarningModal] = useState<any>(null);
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, type: 'SINGLE' | 'PURGE', data?: any }>({ show: false, type: 'SINGLE' });
    const [purgeInput, setPurgeInput] = useState("");

    const verifyAndFetch = async () => {
        setLoading(true);
        const sessionData = localStorage.getItem('police_session');
        if (!sessionData) { router.push('/'); return; }
        const parsed = JSON.parse(sessionData);

        // Security Check
        const { data: auth } = await supabase.from('users').select('pangkat, is_highadmin, is_admin').eq('discord_id', parsed.discord_id).single();
        if (!auth?.is_admin && !auth?.is_highadmin) {
            router.push('/dashboard');
            return;
        }

        setIsAuthorized(true);
        if (auth.pangkat === 'JENDRAL' || auth.is_highadmin === true) setIsSuperAdmin(true);

        // Fetch Data
        const { data: users } = await supabase.from('users').select('discord_id, name, pangkat').order('pangkat', { ascending: false });
        if (users) setPersonnel(users);

        const startStr = weekStart.toISOString();
        const endStr = weekEnd.toISOString();

        const { data: dutyData } = await supabase.from('presensi_duty').select('*').gte('start_time', startStr).lte('start_time', endStr);
        if (dutyData) setDuties(dutyData);

        const { data: cutiData } = await supabase.from('pengajuan_cuti').select('*').eq('status', 'APPROVED');
        if (cutiData) setCutis(cutiData);

        setLoading(false);
    };

    useEffect(() => { verifyAndFetch(); }, [currentDate]);

    const inactivePersonnel = useMemo(() => {
        return personnel.filter(p => {
            const hasDuty = duties.some(d => d.user_id_discord === p.discord_id);
            const hasCuti = cutis.some(c => {
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
        const dutyToday = duties.find(d => d.user_id_discord === discordId && d.start_time.startsWith(targetDate));
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

    const executeDelete = async () => {
        const tId = toast.loading("Inisialisasi Purge...");
        try {
            if (confirmModal.type === 'SINGLE') {
                await supabase.from(confirmModal.data.table).delete().eq('id', confirmModal.data.id);
                toast.success("DATA DIMUSNAHKAN!", { id: tId });
            } else if (confirmModal.type === 'PURGE') {
                if (purgeInput !== "MUSNAHKAN") throw new Error("Kode Salah!");
                const pastLimit = subWeeks(new Date(), 2).toISOString();
                await supabase.from('presensi_duty').delete().lt('created_at', pastLimit);
                await supabase.from('pengajuan_cuti').delete().lt('created_at', pastLimit);
                toast.success("SYSTEM PURGE COMPLETE!", { id: tId });
            }
            setConfirmModal({ show: false, type: 'SINGLE' });
            verifyAndFetch();
        } catch (err: any) { toast.error(err.message, { id: tId }); }
    };

    const handleSendWarning = (user: any) => {
        const tId = toast.loading(`Menyiapkan Surat Peringatan...`);
        // Simulator for Discord Webhook Delay
        setTimeout(() => {
            toast.success(`DISCORD WEBHOOK TERKIRIM UNTUK ${user?.name?.split('|').pop()?.trim() || 'PERSONEL'}!`, { id: tId });
        }, 1500);
    };

    if (!isAuthorized && loading) return <div className="py-20 text-center animate-pulse font-black">AUTHORIZING RADAR...</div>;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 font-mono text-slate-950">
            <Toaster position="top-center" richColors />

            {/* --- INACTIVITY SCAN BENTO --- */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-[30px] grid grid-cols-1 lg:grid-cols-3 gap-6`}>
                <div className="lg:col-span-1 bg-[#FF4D4D] text-white p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000]">
                    <div className="flex items-center gap-3 mb-2"><UserX size={32} /><h3 className="font-black italic text-xl uppercase leading-none">Inactivity Scan</h3></div>
                    <p className="text-[10px] font-bold opacity-80 uppercase italic">Minggu Ini (Tanpa Log)</p>
                    <div className="text-6xl font-[1000] italic mt-2">{inactivePersonnel.length}</div>
                </div>
                <div className="lg:col-span-2 overflow-x-auto flex gap-4 p-2 items-center">
                    {inactivePersonnel.length === 0 ? (
                        <div className="flex items-center gap-3 text-slate-400 font-black italic uppercase text-sm w-full justify-center"><CheckCircle2 /> Semua Personel Aktif</div>
                    ) : inactivePersonnel.map(p => (
                        <div key={p.discord_id} className="min-w-[180px] bg-slate-50 border-2 border-black p-3 rounded-xl flex flex-col justify-between h-full">
                            <div>
                                <p className="font-black text-[10px] uppercase truncate">{p.name?.split('|').pop()}</p>
                                <p className="text-[8px] font-bold text-red-500 uppercase">{p.pangkat}</p>
                            </div>
                            <button onClick={() => setShowWarningModal(p)} className="mt-3 bg-black text-white py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-[#FF4D4D] transition-colors"><Send size={12} /> SP-1</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* HEADER & VIEW TOGGLE */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-center`}>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-950 text-white rounded-xl shadow-[3px_3px_0px_#A78BFA]"><Activity /></div>
                    <div><h2 className="font-[1000] italic uppercase text-2xl tracking-tighter leading-none">Operational Monitoring</h2><p className="text-[10px] font-black uppercase opacity-40 italic mt-1">Mandalika Tactical Command v3.0</p></div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    {/* TOGGLE ANALISIS */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border-2 border-black">
                        <button onClick={() => setViewMode('DETAIL')} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase italic flex items-center gap-2 transition-all", viewMode === 'DETAIL' ? "bg-white border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40")}>
                            <LayoutDashboard size={14} /> Detail
                        </button>
                        <button onClick={() => setViewMode('ANALYSIS')} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase italic flex items-center gap-2 transition-all", viewMode === 'ANALYSIS' ? "bg-[#3B82F6] text-white border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40")}>
                            <PieChart size={14} /> Analisis
                        </button>
                    </div>

                    {isSuperAdmin && (
                        <button onClick={() => setConfirmModal({ show: true, type: 'PURGE' })} className="bg-[#FF4D4D] text-white border-2 border-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-px"><Bomb size={16} /></button>
                    )}
                </div>
            </div>

            {/* NAVIGATION WEEK */}
            <div className="flex justify-center items-center gap-4">
                <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-xl active:translate-y-1"><ChevronLeft /></button>
                <div className="bg-slate-950 text-[#00E676] px-10 py-3 rounded-xl font-black italic uppercase border-2 border-white shadow-[4px_4px_0px_#000] min-w-[300px] text-center tracking-tighter text-sm">
                    {format(weekStart, 'dd MMM', { locale: id })} - {format(weekEnd, 'dd MMM yyyy', { locale: id })}
                </div>
                <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-xl active:translate-y-1"><ChevronRight /></button>
            </div>

            {/* MAIN TABLE */}
            <div className="bg-white border-[4px] border-black rounded-[30px] shadow-[10px_10px_0px_#000] overflow-hidden">
                <div className="overflow-x-auto">
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
                                    <td className="p-4 border-r-2 border-slate-100 font-black sticky left-0 bg-white z-10">
                                        <p className="text-xs uppercase leading-none">{p.name?.split('|').pop()}</p>
                                        <p className="text-[9px] text-[#3B82F6] font-bold mt-1 uppercase italic opacity-70">{p.pangkat}</p>
                                    </td>
                                    {daysInWeek.map((day, idx) => {
                                        const status = getDayStatus(p.discord_id, day);

                                        // --- MODE ANALISIS (Ganti Jadi Hadir/Cuti/Tanpa Keterangan) ---
                                        if (viewMode === 'ANALYSIS') {
                                            return (
                                                <td key={idx} className="p-3 border-r-2 border-slate-100 min-w-[150px]">
                                                    {status.type === 'DUTY' && (
                                                        <div className="bg-[#00E676] border-2 border-black p-2 rounded-xl flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000]">
                                                            <UserCheck size={14} /> <span className="text-[9px] font-[1000] uppercase italic">HADIR</span>
                                                        </div>
                                                    )}
                                                    {status.type === 'CUTI' && (
                                                        <div className="bg-[#FFD100] border-2 border-black p-2 rounded-xl flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000]">
                                                            <UserMinus size={14} /> <span className="text-[9px] font-[1000] uppercase italic">CUTI</span>
                                                        </div>
                                                    )}
                                                    {status.type === 'NONE' && (
                                                        <div className="bg-[#FF4D4D] text-white border-2 border-black p-2 rounded-xl flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000] opacity-30 group-hover:opacity-100">
                                                            <HelpCircle size={14} /> <span className="text-[9px] font-[1000] uppercase italic">ALPA</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        }

                                        // --- MODE DETAIL (Tampilan Biasa) ---
                                        return (
                                            <td key={idx} className="p-3 border-r-2 border-slate-100 min-w-[150px]">
                                                {status.type === 'DUTY' && (
                                                    <div className="bg-[#A3E635] border-2 border-black p-3 rounded-2xl shadow-[4px_4px_0px_#000] flex flex-col h-[120px] justify-between relative group">
                                                        <button onClick={() => setConfirmModal({ show: true, type: 'SINGLE', data: { id: status.data.id, table: 'presensi_duty' } })} className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={10} /></button>
                                                        <div className="font-[1000] text-[10px] uppercase italic border-b border-black/20 pb-1 flex justify-between"><span>{Math.floor(status.data.durasi_menit / 60)}H {status.data.durasi_menit % 60}M</span><Clock size={12} /></div>
                                                        <p className="text-[9px] font-black italic leading-tight uppercase my-2 line-clamp-3 h-9 overflow-hidden">{status.data.catatan_duty}</p>
                                                        {status.data.bukti_foto?.[0] && <button onClick={() => setSelectedPhoto(status.data.bukti_foto[0])} className="bg-black text-white rounded-lg py-1.5 flex justify-center hover:bg-blue-600 transition-colors"><ImageIcon size={14} /></button>}
                                                    </div>
                                                )}
                                                {status.type === 'CUTI' && (
                                                    <div className="bg-[#FFD100] border-2 border-black p-3 rounded-2xl shadow-[4px_4px_0px_#000] flex flex-col h-[120px] justify-center items-center text-center">
                                                        <ShieldAlert size={20} className="mb-2" />
                                                        <p className="text-[10px] font-black uppercase italic">OFF DUTY</p>
                                                        <p className="text-[8px] font-bold opacity-50 uppercase mt-1 italic truncate w-full">{status.data.alasan}</p>
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

            {/* MODALS (Same as before but with consistent styling) */}
            <AnimatePresence>
                {showWarningModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`w-full max-w-lg bg-white ${boxBorder} ${hardShadow} rounded-[40px] overflow-hidden`}>
                            <div className="bg-slate-950 p-6 text-white flex items-center gap-4">
                                <div className="bg-[#FF4D4D] p-3 rounded-2xl border-2 border-white"><AlertOctagon size={32} /></div>
                                <div><h2 className="font-[1000] text-2xl uppercase italic tracking-tighter">OFFICIAL SP-1</h2><p className="text-[10px] font-black uppercase text-[#FF4D4D] tracking-widest mt-1">Personnel Discipline Protocol</p></div>
                            </div>
                            <div className="p-8 space-y-6 text-slate-950">
                                <div className="border-l-8 border-black pl-5 py-2 bg-slate-50">
                                    <p className="text-[10px] font-black uppercase opacity-40">Target Personel:</p>
                                    <p className="font-[1000] text-2xl uppercase italic">{showWarningModal.pangkat} {showWarningModal.name?.split('|').pop()?.trim()}</p>
                                </div>
                                <div className="bg-[#FFD100] border-2 border-black p-5 rounded-3xl font-black text-[11px] uppercase italic text-center leading-relaxed">
                                    "Terdeteksi NIHIL AKTIVITAS (Log Duty/Cuti) pada database Mandalika minggu ini. Segera koordinasikan status anda kepada High Command."
                                </div>
                                <div className="flex justify-between items-center text-slate-950 italic">
                                    <div className="opacity-40"><p className="text-[9px] font-black">Authorized by:</p><p className="text-[10px] font-[1000] uppercase">BRIGJEN OWEN DININGRAT</p></div>
                                    <p className="text-[9px] font-black opacity-30">{format(new Date(), 'dd/MM/yyyy')}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setShowWarningModal(null)} className="py-4 bg-slate-200 border-2 border-black rounded-2xl font-black uppercase text-xs">Batal</button>
                                    <button onClick={() => { handleSendWarning(showWarningModal); setShowWarningModal(null); }} className="py-4 bg-[#FF4D4D] text-white border-2 border-black rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2"><Send size={18} /> Kirim Ke Discord</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* IMAGE PREVIEW */}
            <AnimatePresence>
                {selectedPhoto && (
                    <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`bg-white p-2 ${boxBorder} rounded-3xl max-w-4xl w-full`}>
                            <img src={selectedPhoto} className="w-full rounded-2xl border-2 border-black" alt="Intelligence Evidence" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}