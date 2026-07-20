"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, CalendarDays, History,
    CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight,
    Zap, Receipt, Paperclip, FileText, Loader2
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface LogItem {
    id: string | number;
    created_at: string;
    status?: string;
    catatan_duty?: string;
    alasan?: string;
    isi_laporan?: string;
    jenis?: string;
    jenis_laporan?: string;
    durasi_menit?: number;
    poin?: number;
    poin_estimasi?: number;
    tanggal_mulai?: string;
    tanggal_selesai?: string;
    bukti_foto?: string;
}

export default function SectionLog() {
    const [activeTab, setActiveTab] = useState<'DUTY' | 'CUTI' | 'LAPORAN'>('DUTY');
    const [loading, setLoading] = useState(true);

    const [logsDuty, setLogsDuty] = useState<LogItem[]>([]);
    const [logsCuti, setLogsCuti] = useState<LogItem[]>([]);
    const [logsLaporan, setLogsLaporan] = useState<LogItem[]>([]);

    // --- PAGINATION STATES ---
    const [page, setPage] = useState(1);
    const itemsPerPage = 8;

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

    const handleTabChange = (tab: 'DUTY' | 'CUTI' | 'LAPORAN') => {
        setActiveTab(tab);
        setPage(1); // Reset halaman langsung saat tab diganti (menggantikan useEffect setState)
    };

    const getStatusBadge = (status: string | undefined, currentTab: string) => {
        if (currentTab === 'DUTY') return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', text: 'VALID', icon: <CheckCircle2 size={12} /> };

        switch (status?.toUpperCase()) {
            case 'APPROVED':
            case 'PAID':
            case 'SUCCESS':
                return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', text: 'APPROVED', icon: <CheckCircle2 size={12} /> };
            case 'REJECTED':
            case 'DENIED':
                return { color: 'text-red-400 bg-red-500/10 border-red-500/20', text: 'REJECTED', icon: <XCircle size={12} /> };
            default:
                return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', text: 'PENDING', icon: <AlertCircle size={12} /> };
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
        <div className="w-full max-w-5xl mx-auto space-y-6 pb-24 font-mono text-zinc-100 px-4">

            {/* TAB SWITCHER */}
            <div className="max-w-md mx-auto grid grid-cols-3 gap-1.5 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl w-full">
                <button
                    onClick={() => handleTabChange('DUTY')}
                    className={`py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === 'DUTY' 
                            ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                            : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    <History size={14} /> <span>Duty</span>
                </button>
                <button
                    onClick={() => handleTabChange('CUTI')}
                    className={`py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === 'CUTI' 
                            ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                            : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    <CalendarDays size={14} /> <span>Cuti</span>
                </button>
                <button
                    onClick={() => handleTabChange('LAPORAN')}
                    className={`py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === 'LAPORAN' 
                            ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                            : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    <Receipt size={14} /> <span>Laporan</span>
                </button>
            </div>

            {/* CONTENT AREA */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <Loader2 className="animate-spin mb-3 text-red-500" size={32} />
                    <p className="font-bold uppercase tracking-widest text-xs">Menyinkronkan Data Markas...</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="w-full"
                    >
                        {currentLogs.length === 0 ? (
                            <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center mt-6">
                                <FileText className="mx-auto text-zinc-600 mb-3" size={40} />
                                <h2 className="font-bold text-base uppercase tracking-tight text-zinc-200">Nihil Data</h2>
                                <p className="text-[11px] font-medium text-zinc-500 uppercase mt-1">Belum ada riwayat tercatat di kategori ini.</p>
                            </div>
                        ) : (
                            <>
                                {/* CLEAN MINIMALIST LIST VIEW */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl shadow-black/40">

                                    {/* Table Header (Desktop Only) */}
                                    <div className="hidden md:grid grid-cols-12 gap-4 bg-zinc-950/80 text-zinc-400 p-4 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800">
                                        <div className="col-span-3">Tanggal & Status</div>
                                        <div className="col-span-6">Keterangan / Aktivitas</div>
                                        <div className="col-span-3 text-right">Metrik Penilaian</div>
                                    </div>

                                    {/* List Items */}
                                    <div className="divide-y divide-zinc-800/60">
                                        {currentLogs.map((log) => {
                                            const badge = getStatusBadge(log.status, activeTab);
                                            return (
                                                <div key={log.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-zinc-800/30 transition-colors items-center">

                                                    {/* Kiri: Tanggal & Status */}
                                                    <div className="col-span-1 md:col-span-3 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start gap-2">
                                                        <p className="font-bold text-xs uppercase tracking-tight text-zinc-200">
                                                            {format(parseISO(log.created_at), 'dd MMM yyyy', { locale: id })}
                                                        </p>
                                                        <div className={`${badge.color} border rounded-md px-2 py-0.5 flex items-center gap-1.5 w-max text-[10px] font-bold uppercase tracking-wider`}>
                                                            {badge.icon}
                                                            <span>{badge.text}</span>
                                                        </div>
                                                    </div>

                                                    {/* Tengah: Deskripsi Utama */}
                                                    <div className="col-span-1 md:col-span-6 flex flex-col justify-center">
                                                        <p className="text-[10px] font-bold uppercase text-zinc-500 mb-0.5 tracking-wider">
                                                            {activeTab === 'DUTY' ? 'Log Aktivitas Patroli' : activeTab === 'CUTI' ? 'Alasan Izin/Cuti' : `Laporan ${log.jenis || log.jenis_laporan}`}
                                                        </p>
                                                        <p className="text-xs font-medium text-zinc-300 uppercase leading-relaxed line-clamp-2">
                                                            {log.catatan_duty || log.alasan || log.isi_laporan || '-'}
                                                        </p>
                                                    </div>

                                                    {/* Kanan: Metrik (Poin/Durasi) & Attachment */}
                                                    <div className="col-span-1 md:col-span-3 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center mt-2 md:mt-0 pt-2 md:pt-0 border-t border-zinc-800/60 md:border-t-0">

                                                        {/* Metrik Data */}
                                                        {activeTab === 'DUTY' && log.durasi_menit !== undefined && (
                                                            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-lg text-zinc-300">
                                                                <Clock size={12} className="text-zinc-400" />
                                                                <span className="font-bold text-[10px]">{Math.floor(log.durasi_menit / 60)}J {log.durasi_menit % 60}M</span>
                                                            </div>
                                                        )}
                                                        {activeTab === 'LAPORAN' && (
                                                            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-lg text-emerald-400">
                                                                <Zap size={12} />
                                                                <span className="font-bold text-[10px]">+{log.poin || log.poin_estimasi || 0} POIN</span>
                                                            </div>
                                                        )}
                                                        {activeTab === 'CUTI' && (
                                                            <span className="font-bold text-[10px] text-zinc-400">
                                                                {log.tanggal_mulai ? `${format(new Date(log.tanggal_mulai), 'dd/MM')} - ${format(new Date(log.tanggal_selesai!), 'dd/MM')}` : '-'}
                                                            </span>
                                                        )}

                                                        {/* Attachment Indicator */}
                                                        {log.bukti_foto && (
                                                            <div className="flex items-center gap-1 text-zinc-500 mt-1 md:mt-1.5">
                                                                <Paperclip size={11} />
                                                                <span className="text-[9px] font-bold uppercase tracking-wider">Dilampirkan</span>
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
                                    <div className="flex items-center justify-center gap-3 mt-6">
                                        <button 
                                            onClick={() => setPage(p => p - 1)} 
                                            disabled={page === 1} 
                                            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
                                            Halaman {page} / {totalPages}
                                        </div>
                                        <button 
                                            onClick={() => setPage(p => p + 1)} 
                                            disabled={page === totalPages} 
                                            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            <ChevronRight size={16} />
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