"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, AlertTriangle, Send, FileText, 
    ShieldCheck, Loader2, Download, Lock, Shield, MapPin, 
    AlertOctagon, CheckCircle, Info, X 
} from 'lucide-react';
import { format, subMonths, addMonths, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import QRCode from 'react-qr-code';
import { cn } from "@/lib/utils"; // Atau helper clsx/tailwind-merge milikmu

interface PayrollLog {
    id: string;
    jumlah_gaji: number | string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: 'PAID' | 'REJECTED' | 'PENDING' | string;
    pangkat?: string;
    divisi?: string;
    created_at?: string;
    keterangan_admin?: string;
}

interface PayrollProps {
    currentMonth: Date;
    setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
    activePeriod: { start: Date; end: Date };
    days: Date[];
    range: { from: Date | null; to: Date | null };
    handleDateClick: (day: Date) => void;
    isVerifying: boolean;
    handleGenerateSalary: (forceSunday: boolean) => void;
    currentLogs: PayrollLog[];
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
    downloadingId: string | null;
    handleDownloadSlip: (log: PayrollLog) => void;
    selectedSlip: PayrollLog | null;
    slipRef: React.RefObject<HTMLDivElement>;
    slipParsed: { cleanName: string; badgeNumber: string };
    showSundayWarning: boolean;
    setShowSundayWarning: React.Dispatch<React.SetStateAction<boolean>>;
    notif: { show: boolean; type: 'SUCCESS' | 'ERROR' | 'INFO'; title: string; message: string };
    setNotif: React.Dispatch<React.SetStateAction<{ show: boolean; type: 'SUCCESS' | 'ERROR' | 'INFO'; title: string; message: string }>>;
}

export default function SectionPayrollDark({
    currentMonth, setCurrentMonth, activePeriod, days, range, handleDateClick,
    isVerifying, handleGenerateSalary, currentLogs, currentPage, setCurrentPage,
    totalPages, downloadingId, handleDownloadSlip, selectedSlip, slipRef,
    slipParsed, showSundayWarning, setShowSundayWarning, notif, setNotif
}: PayrollProps) {

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-6xl mx-auto text-zinc-100 font-sans"
        >
            {/* --- PANEL KIRI: KALENDER & PENGAJUAN GAJI --- */}
            <div className="md:col-span-5 bg-[#121214] border-2 border-zinc-800 rounded-3xl p-6 flex flex-col shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500"></div>

                {/* Header Navigasi Bulan */}
                <div className="flex justify-between items-center mb-5">
                    <span className="text-xs font-black uppercase tracking-widest bg-red-600/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-xl">
                        {format(currentMonth, 'MMMM yyyy', { locale: id })}
                    </span>
                    <div className="flex gap-1.5">
                        <button 
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                            className="p-2 bg-[#18181b] border border-zinc-800 rounded-xl hover:border-red-500 hover:text-red-500 transition-all cursor-pointer"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                            className="p-2 bg-[#18181b] border border-zinc-800 rounded-xl hover:border-red-500 hover:text-red-500 transition-all cursor-pointer"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Banner Info Aturan Gaji */}
                <div className="bg-[#18181b] border border-amber-500/30 rounded-2xl p-4 mb-5 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-2">
                        <AlertTriangle size={15} className="text-amber-400" />
                        <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">Info Aturan Gaji</p>
                    </div>
                    <p className="text-[10px] font-medium leading-relaxed text-zinc-300 uppercase mb-3">
                        WAJIB pilih tanggal dari hari <b className="text-amber-400">SENIN sampai MINGGU</b> (Kelipatan 1 atau 2 Minggu). 
                        Periode gaji terbaru hanya bisa diklaim jika sudah mencapai/melewati Hari Minggu.
                    </p>
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide inline-block">
                        Periode Dapat Diklaim: {format(activePeriod.start, 'dd MMM', { locale: id })} - {format(activePeriod.end, 'dd MMM yyyy', { locale: id })}
                    </div>
                </div>

                {/* Grid Kalender */}
                <div className="bg-[#18181b] border-2 border-zinc-800/80 rounded-2xl p-4 mb-6">
                    <div className="grid grid-cols-7 mb-3 border-b border-zinc-800 pb-2 text-center font-black text-[11px]">
                        {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (
                            <div key={i} className={i === 6 ? 'text-red-500' : 'text-zinc-400'}>{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                        {days.map((day, i) => {
                            const isSelected = (range.from && isSameDay(day, range.from)) || (range.to && isSameDay(day, range.to));
                            const isBetween = range.from && range.to && isWithinInterval(day, { start: range.from, end: range.to });
                            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                            return (
                                <button 
                                    key={i} 
                                    onClick={() => handleDateClick(day)} 
                                    className={cn(
                                        "h-9 text-xs font-bold rounded-lg border transition-all flex items-center justify-center cursor-pointer", 
                                        isSelected 
                                            ? 'bg-red-600 text-white border-red-500 scale-105 z-10 shadow-lg shadow-red-600/30' 
                                            : '', 
                                        isBetween && !isSelected 
                                            ? 'bg-red-500/20 border-red-500/40 text-red-300' 
                                            : 'border-transparent hover:border-zinc-700 bg-zinc-900/50', 
                                        !isCurrentMonth 
                                            ? 'opacity-0 pointer-events-none' 
                                            : 'opacity-100 text-zinc-200'
                                    )}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tombol Kirim Pengajuan */}
                <button 
                    disabled={isVerifying || !range.from || !range.to} 
                    onClick={() => handleGenerateSalary(false)} 
                    className="mt-auto w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-red-600/20 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                    {isVerifying ? (
                        <><Loader2 className="animate-spin" size={18} /> MEMVERIFIKASI...</>
                    ) : (
                        <><Send size={18} /> KIRIM PENGAJUAN GAJI</>
                    )}
                </button>
            </div>

            {/* --- PANEL KANAN: HISTORY LOG UNIT --- */}
            <div className="md:col-span-7 bg-[#121214] border-2 border-zinc-800 rounded-3xl flex flex-col shadow-xl overflow-hidden">
                <div className="bg-[#18181b] border-b-2 border-zinc-800 p-5 font-black uppercase tracking-wider flex justify-between items-center text-zinc-100">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500">
                            <FileText size={18} /> 
                        </div>
                        <span className="text-sm">History Log Unit</span>
                    </div>
                    <ShieldCheck className="text-emerald-500" size={22} />
                </div>

                <div className="p-6 flex-1 space-y-3.5 min-h-[400px]">
                    <AnimatePresence mode='wait'>
                        <motion.div key={currentPage} className="space-y-3">
                            {currentLogs.length === 0 ? (
                                <div className="text-center py-20 text-zinc-500 font-bold uppercase text-xs tracking-widest">
                                    Nihil Data Pengajuan
                                </div>
                            ) : currentLogs.map((log) => (
                                <div 
                                    key={log.id} 
                                    className="p-4 bg-[#18181b] border-2 border-zinc-800/80 rounded-2xl flex justify-between items-center hover:border-zinc-700 transition-all"
                                >
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-red-500 font-black text-sm">$</span>
                                            <h4 className="text-2xl font-black text-zinc-100 tracking-tight">
                                                {Number(log.jumlah_gaji).toLocaleString()}
                                            </h4>
                                        </div>
                                        <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                                            Periode: {format(new Date(log.tanggal_mulai), 'dd MMM')} - {format(new Date(log.tanggal_selesai), 'dd MMM yyyy')}
                                        </p>

                                        {/* Status Badge */}
                                        <div className={cn(
                                            "text-[9px] font-black px-2.5 py-1 mt-2.5 rounded-lg inline-block uppercase tracking-wider border",
                                            log.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                            log.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                                            'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                        )}>
                                            {log.status === 'PAID' ? 'PAID / CAIR' :
                                             log.status === 'REJECTED' ? 'DITOLAK ADMIN' : 'MENUNGGU VERIFIKASI'}
                                        </div>
                                    </div>

                                    {/* Download Slip Button */}
                                    <button
                                        disabled={log.status !== 'PAID' || downloadingId === log.id}
                                        onClick={() => handleDownloadSlip(log)}
                                        className={cn(
                                            "w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer shadow-md",
                                            log.status === 'PAID' 
                                                ? 'bg-red-600 text-white border-red-500 hover:bg-red-500 active:scale-95' 
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        {downloadingId === log.id ? (
                                            <Loader2 className="animate-spin text-white" size={20} />
                                        ) : log.status === 'PAID' ? (
                                            <Download size={20} />
                                        ) : (
                                            <Lock size={20} />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Pagination */}
                <div className="p-4 bg-[#18181b] border-t-2 border-zinc-800 flex justify-between items-center text-zinc-400">
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        Halaman {currentPage} dari {totalPages || 1}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(p => p - 1)} 
                            className="bg-[#121214] p-2 rounded-xl border border-zinc-800 text-zinc-200 hover:border-red-500 disabled:opacity-30 disabled:hover:border-zinc-800 transition-all cursor-pointer"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            disabled={currentPage === totalPages || totalPages === 0} 
                            onClick={() => setCurrentPage(p => p + 1)} 
                            className="bg-[#121214] p-2 rounded-xl border border-zinc-800 text-zinc-200 hover:border-red-500 disabled:opacity-30 disabled:hover:border-zinc-800 transition-all cursor-pointer"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- ELEMEN TERSEMBUNYI UNTUK GENERATE SLIP (EXPORT PDF/IMAGE) --- */}
            {selectedSlip && (
                <div style={{ position: 'absolute', top: '-4000px', left: '-4000px', zIndex: -100 }}>
                    <div ref={slipRef} className="bg-[#121214] w-[600px] border-4 border-zinc-800 p-10 space-y-8 text-zinc-100 font-mono rounded-3xl">
                        {/* Header Slip */}
                        <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-red-500 font-black italic text-xs tracking-[0.3em]">
                                    <Shield size={20} /> MPD HQ
                                </div>
                                <h2 className="text-4xl font-black italic tracking-tight text-white">OFFICIAL PAYSLIP</h2>
                                <p className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-1">
                                    <MapPin size={12} /> HQ Mandalika • Central District
                                </p>
                            </div>
                            <div className="bg-red-600/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl font-black text-xs">
                                #{selectedSlip.id.substring(0, 8).toUpperCase()}
                            </div>
                        </div>

                        {/* Detail Lengkap Slip */}
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-zinc-500">Nama Lengkap</p>
                                    <p className="font-black text-lg uppercase text-zinc-200 border-b border-zinc-800 pb-1">{slipParsed.cleanName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-zinc-500">Pangkat / Divisi</p>
                                    <p className="font-black text-lg uppercase text-red-500 border-b border-zinc-800 pb-1">
                                        {selectedSlip.pangkat} • #{slipParsed.badgeNumber} / {selectedSlip.divisi || 'UNIT'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-zinc-500">Periode Gaji</p>
                                    <p className="font-bold text-xs uppercase text-zinc-300 border-b border-zinc-800 pb-1">
                                        {format(new Date(selectedSlip.tanggal_mulai), 'dd MMM')} - {format(new Date(selectedSlip.tanggal_selesai), 'dd MMM yyyy')}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-zinc-500">Tanggal Pengajuan</p>
                                    <p className="font-bold text-xs uppercase text-zinc-300 border-b border-zinc-800 pb-1">
                                        {selectedSlip.created_at ? format(parseISO(selectedSlip.created_at), 'dd MMMM yyyy', { locale: id }) : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-zinc-500">Tanggal Pencairan</p>
                                    <p className="font-bold text-xs uppercase text-zinc-300 border-b border-zinc-800 pb-1">
                                        {format(new Date(), 'dd MMMM yyyy', { locale: id })}
                                    </p>
                                </div>
                                <div className="bg-[#18181b] border border-dashed border-zinc-800 p-3 rounded-xl text-center">
                                    <p className="text-[8px] font-bold uppercase text-zinc-500 mb-0.5">Approved By</p>
                                    <p className="text-[10px] font-black uppercase text-zinc-300">
                                        {selectedSlip.keterangan_admin?.replace('AUTH BY ', '') || 'HIGH COMMAND'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Total Nominal Payout & QR */}
                        <div className="bg-[#18181b] border-2 border-zinc-800 p-6 rounded-2xl flex justify-between items-center shadow-lg">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-[0.2em] mb-1">Total Net Payout</p>
                                <h3 className="text-4xl font-black text-emerald-400 tracking-tight leading-none">
                                    ${Number(selectedSlip.jumlah_gaji).toLocaleString()}
                                </h3>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-zinc-300">
                                <QRCode size={75} value={`AUTH:${selectedSlip.id}`} viewBox={`0 0 256 256`} />
                            </div>
                        </div>

                        <div className="flex justify-center opacity-30 pt-2">
                            <p className="text-[8px] font-bold uppercase tracking-[0.6em] text-zinc-400">
                                Mandalika Police Department • Official Audit Slip
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL KONFIRMASI HARI MINGGU --- */}
            <AnimatePresence>
                {showSundayWarning && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.95 }} 
                            animate={{ scale: 1 }} 
                            exit={{ scale: 0.95 }}
                            className="w-full max-w-md bg-[#18181b] border-2 border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-amber-500/10 text-amber-400">
                                <AlertTriangle size={22} />
                                <h3 className="font-black uppercase tracking-wider text-sm">Peringatan Absensi Minggu</h3>
                            </div>
                            <div className="p-6">
                                <p className="text-xs font-medium uppercase leading-relaxed text-zinc-300">
                                    Belum ada data absen/duty untuk <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">Hari Minggu</span> di periode ini. Akan dikenakan potongan alpha. Apakah Anda yakin ingin melanjutkan pengajuan gaji?
                                </p>
                                <div className="flex gap-3 mt-6">
                                    <button 
                                        onClick={() => setShowSundayWarning(false)} 
                                        className="flex-1 py-3 border border-zinc-800 rounded-xl font-bold uppercase text-xs text-zinc-400 hover:text-white hover:border-zinc-700 bg-zinc-900 transition-all cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        onClick={() => { setShowSundayWarning(false); handleGenerateSalary(true); }} 
                                        className="flex-1 py-3 border border-red-500/50 rounded-xl font-bold uppercase text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all cursor-pointer"
                                    >
                                        Lanjutkan
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MODAL NOTIFIKASI SYSTEM --- */}
            <AnimatePresence>
                {notif.show && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 10 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0 }} 
                            className="w-full max-w-sm bg-[#18181b] border-2 border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className={cn(
                                "p-4 border-b border-zinc-800 flex items-center justify-between",
                                notif.type === 'ERROR' ? 'bg-red-500/10 text-red-400' : 
                                notif.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 
                                'bg-blue-500/10 text-blue-400'
                            )}>
                                <div className="flex items-center gap-2.5">
                                    {notif.type === 'ERROR' ? <AlertOctagon size={20} /> : 
                                     notif.type === 'SUCCESS' ? <CheckCircle size={20} /> : 
                                     <Info size={20} />}
                                    <h3 className="font-black uppercase tracking-wider text-xs">{notif.title}</h3>
                                </div>
                                <button 
                                    onClick={() => setNotif({ ...notif, show: false })} 
                                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-xs font-medium uppercase leading-relaxed text-zinc-300">{notif.message}</p>
                                <button 
                                    onClick={() => setNotif({ ...notif, show: false })} 
                                    className={cn(
                                        "w-full mt-6 py-3 rounded-xl font-bold uppercase text-xs text-white transition-all cursor-pointer shadow-md",
                                        notif.type === 'ERROR' ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' : 
                                        notif.type === 'SUCCESS' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 
                                        'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                                    )}
                                >
                                    Mengerti
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}