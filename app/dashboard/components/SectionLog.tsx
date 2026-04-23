"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, CalendarDays, History, ShieldAlert,
    CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight,
    Zap, Receipt, Paperclip, FileText
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
    const itemsPerPage = 8; // Bisa muat lebih banyak karena sekarang bentuknya List

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true);
            const sessionData = localStorage.getItem('police_session');
            if (!sessionData) return;
            const parsed = JSON.parse(sessionData);
            const discordId = parsed.discord_id;

            const { data: dutyData } = await supabase.from('presensi_duty').select('*').eq('user_id_discord', discordId).order('created_at', { ascending: false });
            const { data: cutiData } = await supabase.from('pengajuan_cuti').select('*').eq('user_id_discord', discordId).order('created_at', { ascending: false });
            const { data: lapData } = await supabase.from('laporan_aktivitas').select('*').eq('user_id_discord', discordId).order('created_at', { ascending: false });

            if (dutyData) setLogsDuty(dutyData);
            if (cutiData) setLogsCuti(cutiData);
            if (lapData) setLogsLaporan(lapData);

            setLoading(false);
        }
        fetchLogs();
    }, []);

    useEffect(() => { setPage(1); }, [activeTab]);

    const getStatusBadge = (status: string, currentTab: string) => {
        if (currentTab === 'DUTY') return { color: 'text-green-600 bg-green-100 border-green-600', text: 'VALID', icon: <CheckCircle2 size={12} /> };

        switch (status?.toUpperCase()) {
            case 'APPROVED':
            case 'PAID':
            case 'SUCCESS':
                return { color: 'text-green-600 bg-green-100 border-green-600', text: 'APPROVED', icon: <CheckCircle2 size={12} /> };
            case 'REJECTED':
            case 'DENIED':
                return { color: 'text-red-600 bg-red-100 border-red-600', text: 'REJECTED', icon: <XCircle size={12} /> };
            default:
                return { color: 'text-yellow-600 bg-yellow-100 border-yellow-600', text: 'PENDING', icon: <AlertCircle size={12} /> };
        }
    };

    const getDataByTab = () => {
        if (activeTab === 'DUTY') return logsDuty;
        if (activeTab === 'CUTI') return logsCuti;
        return logsLaporan;
    };

    const currentLogs = getDataByTab().slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(getDataByTab().length / itemsPerPage);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 pb-24 font-mono text-slate-950 px-4">

            {/* TAB SWITCHER */}
            <div className="max-w-xl mx-auto grid grid-cols-3 gap-3 p-1.5 bg-slate-950 rounded-2xl w-full">
                <button
                    onClick={() => setActiveTab('DUTY')}
                    className={cn("py-3 rounded-xl font-black uppercase italic text-[10px] transition-all flex items-center justify-center gap-2", activeTab === 'DUTY' ? 'bg-[#A3E635] text-black shadow-inner' : 'text-white opacity-40 hover:opacity-100')}
                >
                    <History size={14} /> <span className="hidden md:inline">Duty</span>
                </button>
                <button
                    onClick={() => setActiveTab('CUTI')}
                    className={cn("py-3 rounded-xl font-black uppercase italic text-[10px] transition-all flex items-center justify-center gap-2", activeTab === 'CUTI' ? 'bg-[#FFD100] text-black shadow-inner' : 'text-white opacity-40 hover:opacity-100')}
                >
                    <CalendarDays size={14} /> <span className="hidden md:inline">Cuti</span>
                </button>
                <button
                    onClick={() => setActiveTab('LAPORAN')}
                    className={cn("py-3 rounded-xl font-black uppercase italic text-[10px] transition-all flex items-center justify-center gap-2", activeTab === 'LAPORAN' ? 'bg-[#3B82F6] text-white shadow-inner' : 'text-white opacity-40 hover:opacity-100')}
                >
                    <Receipt size={14} /> <span className="hidden md:inline">Laporan</span>
                </button>
            </div>

            {/* CONTENT AREA */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <ShieldAlert className="animate-pulse mb-2 text-blue-600" size={40} />
                    <p className="font-black uppercase tracking-widest text-xs italic">Menyinkronkan Data Markas...</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full"
                    >
                        {currentLogs.length === 0 ? (
                            <div className={`max-w-md mx-auto bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-10 text-center mt-10`}>
                                <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                                <h2 className="font-black text-xl italic uppercase tracking-tighter text-slate-950">NIHIL DATA</h2>
                                <p className="text-[10px] font-bold uppercase mt-2 opacity-50 italic">Belum ada riwayat tercatat di kategori ini.</p>
                            </div>
                        ) : (
                            <>
                                {/* 🚀 NEW: TACTICAL LIST VIEW (SUPER CLEAN) */}
                                <div className={`bg-white ${boxBorder} ${hardShadow} rounded-2xl overflow-hidden`}>

                                    {/* Table Header (Desktop Only) */}
                                    <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-950 text-white p-4 text-[10px] font-black uppercase tracking-widest italic border-b-[3.5px] border-slate-950">
                                        <div className="col-span-3">Tanggal & Status</div>
                                        <div className="col-span-6">Keterangan / Aktivitas</div>
                                        <div className="col-span-3 text-right">Metrik Penilaian</div>
                                    </div>

                                    {/* List Items */}
                                    <div className="flex flex-col">
                                        {currentLogs.map((log) => {
                                            const badge = getStatusBadge(log.status, activeTab);
                                            return (
                                                <div key={log.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 border-b-2 border-slate-100 hover:bg-slate-50 transition-colors items-center group">

                                                    {/* Kiri: Tanggal & Status */}
                                                    <div className="col-span-1 md:col-span-3 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start gap-2">
                                                        <p className="font-black text-xs uppercase italic tracking-tighter text-slate-900">
                                                            {format(parseISO(log.created_at), 'dd MMM yyyy', { locale: id })}
                                                        </p>
                                                        <div className={cn(badge.color, "border-2 rounded px-2 py-0.5 flex items-center gap-1 w-max")}>
                                                            {badge.icon}
                                                            <span className="text-[9px] font-black uppercase">{badge.text}</span>
                                                        </div>
                                                    </div>

                                                    {/* Tengah: Deskripsi Utama */}
                                                    <div className="col-span-1 md:col-span-6 flex flex-col justify-center">
                                                        <p className="text-[9px] font-black uppercase opacity-50 italic mb-0.5 text-blue-600">
                                                            {activeTab === 'DUTY' ? 'Log Aktivitas Patroli' : activeTab === 'CUTI' ? 'Alasan Izin/Cuti' : `Laporan ${log.jenis || log.jenis_laporan}`}
                                                        </p>
                                                        <p className="text-xs font-bold uppercase leading-snug line-clamp-2 text-slate-700">
                                                            {log.catatan_duty || log.alasan || log.isi_laporan || '-'}
                                                        </p>
                                                    </div>

                                                    {/* Kanan: Metrik (Poin/Durasi) & Attachment */}
                                                    <div className="col-span-1 md:col-span-3 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center mt-2 md:mt-0 pt-2 md:pt-0 border-t-2 md:border-t-0 border-dashed border-slate-200">

                                                        {/* Metrik Data */}
                                                        {activeTab === 'DUTY' && (
                                                            <div className="flex items-center gap-1.5 bg-blue-50 border-2 border-slate-900 px-2 py-1 rounded shadow-[2px_2px_0px_#000]">
                                                                <Clock size={12} className="text-blue-600" />
                                                                <span className="font-black text-[10px] italic">{Math.floor(log.durasi_menit / 60)}J {log.durasi_menit % 60}M</span>
                                                            </div>
                                                        )}
                                                        {activeTab === 'LAPORAN' && (
                                                            <div className="flex items-center gap-1.5 bg-[#A3E635] border-2 border-slate-900 px-2 py-1 rounded shadow-[2px_2px_0px_#000]">
                                                                <Zap size={12} />
                                                                <span className="font-black text-[10px] italic">+{log.poin || log.poin_estimasi} POIN</span>
                                                            </div>
                                                        )}
                                                        {activeTab === 'CUTI' && (
                                                            <span className="font-black text-[10px] text-slate-400 italic md:text-right">
                                                                {log.tanggal_mulai ? `${format(new Date(log.tanggal_mulai), 'dd/MM')} - ${format(new Date(log.tanggal_selesai), 'dd/MM')}` : '-'}
                                                            </span>
                                                        )}

                                                        {/* Icon Attachment Ringan (Bukan Load Gambar Full) */}
                                                        {log.bukti_foto && (
                                                            <div className="flex items-center gap-1 text-slate-400 mt-1 md:mt-2">
                                                                <Paperclip size={12} />
                                                                <span className="text-[8px] font-black uppercase">Dilampirkan</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* PAGINATION CONTROLLER */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-4 mt-8">
                                        <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className={pageBtnStyle}>
                                            <ChevronLeft size={20} strokeWidth={3} />
                                        </button>
                                        <div className="bg-slate-950 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase italic shadow-[5px_5px_0px_#3B82F6]">
                                            Halaman {page} / {totalPages}
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