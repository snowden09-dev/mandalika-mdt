"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays, Trash2, ChevronLeft, ChevronRight,
    Image as ImageIcon, Clock, AlertTriangle, CheckCircle2, X,
    Skull, Bomb, AlertOctagon, Lock, UserX, Send, ShieldAlert, XCircle,
    LayoutDashboard, Activity, UserCheck, UserMinus, HelpCircle, PieChart, Database
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfDay, subDays } from "date-fns";
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

    // --- MODAL STATES ---
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [showWarningModal, setShowWarningModal] = useState<any>(null);
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

        const { data: cutiData } = await supabase.from('pengajuan_cuti').select('*').eq('status', 'APPROVED');
        if (cutiData) setCutis(cutiData);

        setLoading(false);
    };

    useEffect(() => { verifyAndFetch(); }, [currentDate]);

    // --- 🛠️ LOGIKA PEMBERSIHAN (PURGE & STORAGE) ---
    const executePurgeOperation = async () => {
        if (purgeInput !== "MANDALIKA") return toast.error("KODE OTORISASI SALAH!");

        const tId = toast.loading("Memulai Operasi Pembersihan...");
        try {
            if (confirmModal.type === 'PURGE') {
                // HAPUS DATA DATABASE (REKAP SEBULAN SEKALI)
                const limitDate = subDays(new Date(), 30).toISOString();

                await supabase.from('presensi_duty').delete().lt('created_at', limitDate);
                await supabase.from('pengajuan_cuti').delete().lt('created_at', limitDate);

                toast.success("REKAP > 30 HARI TELAH DIMUSNAHKAN!", { id: tId });
            }

            else if (confirmModal.type === 'STORAGE_CLEAN') {
                // HAPUS SEMUA FOTO DI BUCKET 'bukti_absen'
                const { data: files, error: listError } = await supabase.storage.from('bukti_absen').list();

                if (listError) throw listError;
                if (files && files.length > 0) {
                    const fileNames = files.map(f => f.name);
                    const { error: delError } = await supabase.storage.from('bukti_absen').remove(fileNames);
                    if (delError) throw delError;
                }

                toast.success("SELURUH BUKTI FOTO TELAH DIHAPUS!", { id: tId });
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
        await supabase.from(confirmModal.data.table).delete().eq('id', confirmModal.data.id);
        toast.success("DATA TERHAPUS", { id: tId });
        setConfirmModal({ show: false, type: 'SINGLE' });
        verifyAndFetch();
    };

    const handleSendWarning = (user: any) => {
        const tId = toast.loading(`Menyiapkan Surat Peringatan...`);
        // Simulator for Discord Webhook Delay
        setTimeout(() => {
            toast.success(`DISCORD WEBHOOK TERKIRIM UNTUK ${user?.name?.split('|').pop()?.trim() || 'PERSONEL'}!`, { id: tId });
        }, 1500);
    };

    // (Helper functions: inactivePersonnel, getDayStatus)
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

    if (!isAuthorized && loading) return <div className="py-20 text-center animate-pulse font-black">AUTHORIZING RADAR...</div>;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 font-mono text-slate-950">
            <Toaster position="top-center" richColors />

            {/* HEADER & SUPER ADMIN TOOLS */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-center`}>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-950 text-white rounded-xl shadow-[3px_3px_0px_#A78BFA]"><Activity /></div>
                    <div>
                        <h2 className="font-[1000] italic uppercase text-2xl tracking-tighter leading-none">Operational Monitoring</h2>
                        <p className="text-[10px] font-black uppercase opacity-40 italic mt-1">Mandalika Tactical Command v3.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl border-2 border-black mr-2">
                        <button onClick={() => setViewMode('DETAIL')} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all", viewMode === 'DETAIL' ? "bg-white border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40")}>Detail</button>
                        <button onClick={() => setViewMode('ANALYSIS')} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all", viewMode === 'ANALYSIS' ? "bg-[#3B82F6] text-white border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40")}>Analisis</button>
                    </div>

                    {isSuperAdmin && (
                        <div className="flex gap-2">
                            {/* Tombol Hapus Foto */}
                            <button
                                onClick={() => setConfirmModal({ show: true, type: 'STORAGE_CLEAN' })}
                                className="bg-orange-500 text-white border-2 border-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] hover:translate-y-px transition-all"
                                title="Hapus Semua Bukti Foto"
                            >
                                <Database size={16} />
                            </button>
                            {/* Tombol Purge Database */}
                            <button
                                onClick={() => setConfirmModal({ show: true, type: 'PURGE' })}
                                className="bg-[#FF4D4D] text-white border-2 border-black px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] hover:translate-y-px transition-all"
                                title="Purge Rekap > 30 Hari"
                            >
                                <Bomb size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* TABEL DAN NAVIGASI (Sama seperti sebelumnya) */}
            <div className="flex justify-center items-center gap-4">
                <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-xl active:translate-y-1"><ChevronLeft /></button>
                <div className="bg-slate-950 text-[#00E676] px-10 py-3 rounded-xl font-black italic uppercase border-2 border-white shadow-[4px_4px_0px_#000] min-w-[300px] text-center tracking-tighter text-sm">
                    {format(weekStart, 'dd MMM', { locale: id })} - {format(weekEnd, 'dd MMM yyyy', { locale: id })}
                </div>
                <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-xl active:translate-y-1"><ChevronRight /></button>
            </div>

            {/* MAIN TABLE (Sama seperti sebelumnya) */}
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
                                <tr key={p.discord_id} className="border-b-2 border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 border-r-2 border-slate-100 font-black sticky left-0 bg-white z-10">
                                        <p className="text-xs uppercase leading-none">{p.name?.split('|').pop()}</p>
                                        <p className="text-[9px] text-[#3B82F6] font-bold mt-1 uppercase italic opacity-70">{p.pangkat}</p>
                                    </td>
                                    {daysInWeek.map((day, idx) => {
                                        const status = getDayStatus(p.discord_id, day);
                                        return (
                                            <td key={idx} className="p-3 border-r-2 border-slate-100 min-w-[150px]">
                                                {status.type === 'DUTY' && (
                                                    <div className="bg-[#A3E635] border-2 border-black p-3 rounded-2xl shadow-[4px_4px_0px_#000] flex flex-col h-[120px] justify-between relative group">
                                                        <button onClick={() => setConfirmModal({ show: true, type: 'SINGLE', data: { id: status.data.id, table: 'presensi_duty' } })} className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full border-2 border-black opacity-0 group-hover:opacity-100 z-10"><X size={10} /></button>
                                                        <div className="font-[1000] text-[10px] uppercase italic border-b border-black/20 pb-1 flex justify-between"><span>{Math.floor(status.data.durasi_menit / 60)}H {status.data.durasi_menit % 60}M</span><Clock size={12} /></div>
                                                        <p className="text-[9px] font-black italic leading-tight uppercase my-2 line-clamp-3">{status.data.catatan_duty}</p>
                                                        {status.data.bukti_foto?.[0] && <button onClick={() => setSelectedPhoto(status.data.bukti_foto[0])} className="bg-black text-white rounded-lg py-1.5 flex justify-center hover:bg-blue-600"><ImageIcon size={14} /></button>}
                                                    </div>
                                                )}
                                                {status.type === 'CUTI' && (
                                                    <div className="bg-[#FFD100] border-2 border-black p-3 rounded-2xl shadow-[4px_4px_0px_#000] flex flex-col h-[120px] justify-center items-center text-center">
                                                        <ShieldAlert size={20} className="mb-2" />
                                                        <p className="text-[10px] font-black uppercase italic">OFF DUTY</p>
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

            {/* --- 🛑 MODAL KONFIRMASI PURGE / DELETE 🛑 --- */}
            <AnimatePresence>
                {confirmModal.show && (
                    <div className="fixed inset-0 z-[300] bg-black/90 p-4 flex items-center justify-center">
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
                                        {confirmModal.type === 'PURGE' ? 'Menghapus seluruh rekap presensi di atas 30 hari.' : 'Menghapus SELURUH file bukti foto di storage.'}
                                        <br />Masukkan kode otorisasi:
                                    </p>
                                    <input
                                        value={purgeInput}
                                        onChange={(e) => setPurgeInput(e.target.value)}
                                        placeholder="KODE..."
                                        className="w-full bg-slate-100 border-2 border-black p-3 rounded-xl font-black text-xs outline-none"
                                    />
                                </div>
                            ) : (
                                <p className="text-xs font-bold uppercase text-slate-500">Hapus laporan ini secara permanen?</p>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => { setConfirmModal({ show: false, type: 'SINGLE' }); setPurgeInput(""); }} className="flex-1 bg-slate-200 border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase">Batal</button>
                                <button onClick={confirmModal.type === 'SINGLE' ? executeDeleteSingle : executePurgeOperation} className="flex-1 bg-red-500 text-white border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase">Eksekusi</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* (MODAL WARNING & IMAGE PREVIEW - Tetap Sama) */}
            <AnimatePresence>
                {showWarningModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`w-full max-w-lg bg-white ${boxBorder} ${hardShadow} rounded-[40px] overflow-hidden`}>
                            <div className="bg-slate-950 p-6 text-white flex items-center gap-4">
                                <div className="bg-[#FF4D4D] p-3 rounded-2xl border-2 border-white"><AlertOctagon size={32} /></div>
                                <div><h2 className="font-[1000] text-2xl uppercase italic tracking-tighter">OFFICIAL SP-1</h2></div>
                            </div>
                            <div className="p-8 space-y-6 text-slate-950">
                                <div className="border-l-8 border-black pl-5 py-2 bg-slate-50">
                                    <p className="font-[1000] text-2xl uppercase italic">{showWarningModal.name?.split('|').pop()}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setShowWarningModal(null)} className="py-4 bg-slate-200 border-2 border-black rounded-2xl font-black uppercase text-xs">Batal</button>
                                    <button onClick={() => { handleSendWarning(showWarningModal); setShowWarningModal(null); }} className="py-4 bg-[#FF4D4D] text-white border-2 border-black rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2"><Send size={18} /> Kirim SP</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedPhoto && (
                    <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`bg-white p-2 ${boxBorder} rounded-3xl max-w-4xl w-full`}>
                            <img src={selectedPhoto} className="w-full rounded-2xl border-2 border-black" alt="Evidence" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}