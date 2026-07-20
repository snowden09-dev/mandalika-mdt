"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Banknote, ExternalLink, FileText, ChevronLeft, 
    ChevronRight, CheckCircle2, XCircle, Clock, ShieldCheck 
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Interface untuk data log gaji agar tidak menggunakan any
interface PayrollLog {
    id: string | number;
    jumlah_gaji: number | string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: string;
}

interface PayrollProps {
    currentLogs: PayrollLog[];
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
}

export default function SectionPayroll({ currentLogs, currentPage, setCurrentPage, totalPages }: PayrollProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20 text-white"
        >
            {/* --- HERO BANNER: DISCORD REDIRECTION --- */}
            <div className="bg-[#18181B] border border-white/5 rounded-[28px] p-8 md:p-12 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-xl shadow-black/20">
                {/* Efek Gradasi Ambient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mb-6 relative z-10">
                    <Banknote size={36} className="text-indigo-400" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight relative z-10">
                    Sistem Penggajian Dialihkan
                </h2>
                
                <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed relative z-10">
                    Untuk mempermudah proses rekapitulasi, persetujuan, dan menjaga transparansi, seluruh administrasi pengajuan gaji kini <b>dilakukan sepenuhnya melalui Server Discord Resmi MPD</b>.
                </p>
                
                <a 
                    href="https://discord.com" // Ganti dengan Link Channel Discord yang sesuai
                    target="_blank" 
                    rel="noreferrer" 
                    className="relative z-10 flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-900/20"
                >
                    <span>Buka Discord HQ</span>
                    <ExternalLink size={18} />
                </a>
            </div>

            {/* --- READ-ONLY HISTORY LOG --- */}
            <div className="bg-[#18181B] border border-white/5 rounded-[28px] flex flex-col overflow-hidden shadow-xl shadow-black/20">
                
                {/* Header History */}
                <div className="border-b border-white/5 bg-white/2 p-5 md:px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <FileText size={18} className="text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-zinc-100 tracking-wide">Riwayat Pengajuan Terdahulu</h3>
                    </div>
                    <ShieldCheck size={20} className="text-emerald-500/50 hidden md:block" />
                </div>

                {/* List Data History */}
                <div className="p-5 md:p-6 flex-1 min-h-100">
                    <AnimatePresence mode='wait'>
                        <motion.div 
                            key={currentPage} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3 md:space-y-4"
                        >
                            {currentLogs.length === 0 ? (
                                <div className="text-center py-20 flex flex-col items-center justify-center text-zinc-500">
                                    <Clock size={40} className="mb-4 opacity-20" />
                                    <p className="text-sm font-medium uppercase tracking-widest">Nihil Data</p>
                                </div>
                            ) : (
                                currentLogs.map((log) => (
                                    <div 
                                        key={log.id} 
                                        className="p-4 md:p-5 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <div>
                                            <div className="flex items-baseline gap-1 mb-1">
                                                <span className="text-sm font-bold text-zinc-500">$</span>
                                                <h4 className="text-2xl font-bold tracking-tight text-zinc-100">
                                                    {Number(log.jumlah_gaji).toLocaleString()}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                                                <Clock size={12} className="text-zinc-500" />
                                                {format(new Date(log.tanggal_mulai), 'dd MMM yyyy', { locale: id })} - {format(new Date(log.tanggal_selesai), 'dd MMM yyyy', { locale: id })}
                                            </p>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 w-fit
                                            ${log.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                              log.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}
                                        >
                                            {log.status === 'PAID' ? <CheckCircle2 size={14} /> : 
                                             log.status === 'REJECTED' ? <XCircle size={14} /> : 
                                             <Clock size={14} />}
                                            
                                            {log.status === 'PAID' ? 'CAIR' : 
                                             log.status === 'REJECTED' ? 'DITOLAK' : 'MENUNGGU PROSES'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Pagination */}
                <div className="p-4 md:p-5 border-t border-white/5 flex justify-between items-center bg-white/1">
                    <span className="text-xs font-medium text-zinc-500">
                        Halaman {currentPage} dari {totalPages || 1}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(p => p - 1)} 
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            disabled={currentPage === totalPages || totalPages === 0} 
                            onClick={() => setCurrentPage(p => p + 1)} 
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}