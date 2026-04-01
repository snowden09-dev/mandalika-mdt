"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 🚀 CLEAN IMPORT: Ikon tidak terpakai sudah dibersihkan untuk menghindari ESLint Error
import {
    Clock, CalendarDays, History, ShieldAlert,
    CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight,
    Zap, Receipt
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// --- STYLING CONSTANTS ---
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";
const pageBtnStyle = "p-2 bg-white border-[3px] border-slate-950 shadow-[4px_4px_0px_#000] rounded-xl active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0px_#000]";

export default function SectionLog() {
    const [activeTab, setActiveTab] = useState<'DUTY' | 'CUTI' | 'LAPORAN'>('DUTY');
    const [loading, setLoading] = useState(true);

    const [logsDuty, setLogsDuty] = useState<any[]>([]);
    const [logsCuti, setLogsCuti] = useState<any[]>([]);
    const [logsLaporan, setLogsLaporan] = useState<any[]>([]);

    // --- PAGINATION STATES ---
    const [page, setPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true);
            const sessionData = localStorage.getItem('police_session');
            if (!sessionData) return;
            const parsed = JSON.parse(sessionData);
            const discordId = parsed.discord_id;

            // 1. Ambil Riwayat Duty
            const { data: dutyData } = await supabase
                .from('presensi_duty')
                .select('*')
                .eq('user_id_discord', discordId)
                .order('created_at', { ascending: false });

            // 2. Ambil Riwayat Cuti
            const { data: cutiData } = await supabase
                .from('pengajuan_cuti')
                .select('*')
                .eq('user_id_discord', discordId)
                .order('created_at', { ascending: false });

            // 3. Ambil Riwayat Laporan (Fitur Baru Jendral!)
            const { data: lapData } = await supabase
                .from('laporan_aktivitas')
                .select('*')
                .eq('user_id_discord', discordId)
                .order('created_at', { ascending: false });

            if (dutyData) setLogsDuty(dutyData);
            if (cutiData) setLogsCuti(cutiData);
            if (lapData) setLogsLaporan(lapData);

            setLoading(false);
        }
        fetchLogs();
    }, []);

    // Reset halaman ke 1 kalau ganti tab
    useEffect(() => { setPage(1); }, [activeTab]);

    // 🚀 FIX: Helper Status Badges (Duty Otomatis ACC/Valid)
    const getStatusBadge = (status: string, currentTab: string) => {
        // Jika Tab Duty, paksa menjadi hijau (Valid/Hadir)
        if (currentTab === 'DUTY') {
            return { color: 'bg-[#A3E635]', text: 'VALID', icon: <CheckCircle2 size={12} /> };
        }

        switch (status?.toUpperCase()) {
            case 'APPROVED':
            case 'PAID':
            case 'SUCCESS':
                return { color: 'bg-[#A3E635]', text: 'APPROVED', icon: <CheckCircle2 size={12} /> };
            case 'REJECTED':
            case 'DENIED':
                return { color: 'bg-[#FF4D4D]', text: 'REJECTED', icon: <XCircle size={12} /> };
            default:
                return { color: 'bg-[#FFD100]', text: 'PENDING', icon: <AlertCircle size={12} /> };
        }
    };

    // --- LOGIC POTONG DATA PAGINATION ---
    const getDataByTab = () => {
        if (activeTab === 'DUTY') return logsDuty;
        if (activeTab === 'CUTI') return logsCuti;
        return logsLaporan;
    };

    const currentLogs = getDataByTab().slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(getDataByTab().length / itemsPerPage);

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8 pb-24 font-mono text-slate-950">

            {/* TAB SWITCHER - 3 MENU NEO-BRUTALISM */}
            <div className="max-w-xl mx-auto grid grid-cols-3 gap-3 p-1.5 bg-slate-950 rounded-2xl w-full">
                <button
                    onClick={() => setActiveTab('DUTY')}
                    className={cn(
                        "py-3 rounded-xl font-black uppercase italic text-[10px] transition-all flex items-center justify-center gap-2",
                        activeTab === 'DUTY' ? 'bg-[#A3E635] text-black shadow-inner' : 'text-white opacity-40 hover:opacity-100'
                    )}
                >
                    <History size={14} /> <span className="hidden md:inline">Duty</span>
                </button>
                <button
                    onClick={() => setActiveTab('CUTI')}
                    className={cn(
                        "py-3 rounded-xl font-black uppercase italic text-[10px] transition-all flex items-center justify-center gap-2",
                        activeTab === 'CUTI' ? 'bg-[#FFD100] text-black shadow-inner' : 'text-white opacity-40 hover:opacity-100'
                    )}
                >
                    <CalendarDays size={14} /> <span className="hidden md:inline">Cuti</span>
                </button>
                <button
                    onClick={() => setActiveTab('LAPORAN')}
                    className={cn(
                        "py-3 rounded-xl font-black uppercase italic text-[10px] transition-all flex items-center justify-center gap-2",
                        activeTab === 'LAPORAN' ? 'bg-[#3B82F6] text-white shadow-inner' : 'text-white opacity-40 hover:opacity-100'
                    )}
                >
                    <Receipt size={14} /> <span className="hidden md:inline">Laporan</span>
                </button>
            </div>

            {/* CONTENT AREA */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <ShieldAlert className="animate-pulse mb-2 text-blue-600" size={40} />
                    <p className="font-black uppercase tracking-widest text-xs italic">Syncing Markas Data...</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {currentLogs.length === 0 ? (
                            <div className={`max-w-md mx-auto bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-10 text-center`}>
                                <h2 className="font-black text-xl italic uppercase tracking-tighter text-slate-950">DATA TIDAK DITEMUKAN</h2>
                                <p className="text-[10px] font-bold uppercase mt-2 opacity-50 italic">Belum ada riwayat tercatat di kategori ini.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {currentLogs.map((log) => {
                                        const badge = getStatusBadge(log.status, activeTab); // 🚀 FIX: Mengirimkan info Tab yang sedang aktif
                                        return (
                                            <div key={log.id} className={`bg-white ${boxBorder} ${hardShadow} rounded-[25px] overflow-hidden flex flex-col h-full group`}>

                                                {/* Header Log */}
                                                <div className="bg-slate-50 border-b-[3.5px] border-slate-950 p-4 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase opacity-40 italic leading-none mb-1">Log Date</p>
                                                        <p className="font-black text-xs uppercase italic tracking-tighter">
                                                            {format(parseISO(log.created_at), 'dd MMMM yyyy', { locale: id })}
                                                        </p>
                                                    </div>
                                                    <div className={cn(badge.color, "border-2 border-slate-950 rounded-lg px-2 py-1 flex items-center gap-1 shadow-[2px_2px_0px_#000]")}>
                                                        {badge.icon}
                                                        <span className="text-[9px] font-black uppercase">{badge.text}</span>
                                                    </div>
                                                </div>

                                                {/* Body Log */}
                                                <div className="p-5 space-y-4 flex-1 flex flex-col">

                                                    {/* KONTEN BERBEDA TIAP TAB */}
                                                    {activeTab === 'DUTY' && (
                                                        <div className="flex justify-between items-center bg-blue-50 border-2 border-slate-950 rounded-xl p-3 shadow-[3px_3px_0px_#000]">
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={16} className="text-blue-600" />
                                                                <p className="text-xs font-black uppercase">Durasi Duty</p>
                                                            </div>
                                                            <p className="font-black text-xs italic">{Math.floor(log.durasi_menit / 60)}J {log.durasi_menit % 60}M</p>
                                                        </div>
                                                    )}

                                                    {activeTab === 'LAPORAN' && (
                                                        <div className="flex justify-between items-center bg-[#A3E635] border-2 border-slate-950 rounded-xl p-3 shadow-[3px_3px_0px_#000]">
                                                            <div className="flex items-center gap-2">
                                                                <Zap size={16} />
                                                                <p className="text-[10px] font-black uppercase">Poin PRP</p>
                                                            </div>
                                                            <p className="font-black text-xs">+{log.poin || log.poin_estimasi} POIN</p>
                                                        </div>
                                                    )}

                                                    <div className="bg-[#f8fafc] border-2 border-slate-950 rounded-2xl p-4 flex-1">
                                                        <p className="text-[9px] font-black uppercase opacity-40 italic mb-1">
                                                            {activeTab === 'DUTY' ? 'Log Aktivitas' : activeTab === 'CUTI' ? 'Alasan Cuti' : `Laporan ${log.jenis || log.jenis_laporan}`}
                                                        </p>
                                                        <p className="text-[11px] font-bold uppercase leading-relaxed line-clamp-4">
                                                            {log.catatan_duty || log.alasan || log.isi_laporan?.substring(0, 100)}
                                                        </p>
                                                    </div>

                                                    {/* Foto Bukti jika ada (Khusus Duty/Laporan) */}
                                                    {log.bukti_foto && (
                                                        <div className="h-12 flex gap-2 overflow-hidden">
                                                            <div className="w-12 h-12 rounded-lg border-2 border-black overflow-hidden shadow-[2px_2px_0px_#000]">
                                                                <img src={Array.isArray(log.bukti_foto) ? log.bukti_foto[0] : log.bukti_foto} className="w-full h-full object-cover" alt="bukti" />
                                                            </div>
                                                            <div className="bg-slate-950 text-white flex-1 rounded-lg flex items-center justify-center text-[8px] font-black uppercase px-2 italic tracking-tighter">
                                                                Document Attached
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* PAGINATION CONTROLLER */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-4 mt-10">
                                        <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className={pageBtnStyle}>
                                            <ChevronLeft size={20} strokeWidth={3} />
                                        </button>
                                        <div className="bg-slate-950 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase italic shadow-[5px_5px_0px_#A3E635]">
                                            Unit Log: {page} / {totalPages}
                                        </div>
                                        <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className={pageBtnStyle}>
                                            <ChevronRight size={20} strokeWidth={3} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}