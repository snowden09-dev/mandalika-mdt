"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wrench, CalendarCheck, FileText, Sparkles, MessageSquare, Clock, Palmtree, ArrowRight } from 'lucide-react';

export default function MaintenancePage() {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date();
            
            // Set target ke besok pagi jam 08:00:00
            target.setDate(now.getDate() + 1);
            target.setHours(8, 0, 0, 0);

            const diff = target.getTime() - now.getTime();

            if (diff > 0) {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({ hours, minutes, seconds });
            } else {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatNumber = (num: number) => String(num).padStart(2, '0');

    return (
        <div className="fixed inset-0 z-[9999] bg-zinc-950 flex items-center justify-center p-4 md:p-6 text-zinc-100 font-mono overflow-hidden">
            {/* Ambient Red Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="bg-zinc-900/90 border border-zinc-800/80 p-6 md:p-8 max-w-xl w-full rounded-2xl shadow-2xl backdrop-blur-md relative z-10 overflow-hidden"
            >
                {/* Accent Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-700" />

                <div className="flex flex-col items-center text-center space-y-6">

                    {/* Header Icon */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                        <div className="relative bg-zinc-950 border border-red-500/30 p-4 rounded-2xl text-red-500 shadow-md">
                            <Wrench size={30} className="animate-pulse" />
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3.5 py-1.5 rounded-full text-red-400 text-xs font-semibold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        Pemeliharaan & Pembaruan Sistem
                    </div>

                    {/* Title & Main Description */}
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white uppercase">
                            Sistem Segera Kembali
                        </h1>
                        <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-md mx-auto font-sans">
                            Website sedang dalam proses pemeliharaan rutin. Seluruh kegiatan administrasi akan kembali dibuka penuh besok pagi.
                        </p>
                    </div>

                    {/* --- COUNTDOWN TIMER BLOCK --- */}
                    <div className="w-full bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl shadow-inner">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center justify-center gap-1.5">
                            <Clock size={13} className="text-red-500" /> Sistem Dibuka Dalam:
                        </p>
                        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg flex flex-col items-center">
                                <span className="text-2xl md:text-3xl font-extrabold text-red-500 tracking-tight">
                                    {formatNumber(timeLeft.hours)}
                                </span>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5">Jam</span>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg flex flex-col items-center">
                                <span className="text-2xl md:text-3xl font-extrabold text-red-500 tracking-tight">
                                    {formatNumber(timeLeft.minutes)}
                                </span>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5">Menit</span>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg flex flex-col items-center">
                                <span className="text-2xl md:text-3xl font-extrabold text-red-500 tracking-tight">
                                    {formatNumber(timeLeft.seconds)}
                                </span>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5">Detik</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-semibold text-zinc-400 mt-3 uppercase tracking-wider">
                            Target Pengaktifan: <span className="text-red-400">Besok, 08:00 WIB</span>
                        </p>
                    </div>

                    {/* Info Administrasi Kembali Dijalankan */}
                    <div className="w-full pt-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3 text-left">
                            Layanan Administrasi Kembali Diberlakukan di Web:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="flex items-center gap-2.5 bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-xl text-left">
                                <div className="p-1.5 bg-red-500/10 text-red-400 rounded-lg shrink-0 border border-red-500/20">
                                    <CalendarCheck size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-zinc-200 truncate">Absensi</h4>
                                    <p className="text-[9px] text-zinc-500 truncate">Presensi Duty</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-xl text-left">
                                <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 border border-amber-500/20">
                                    <Palmtree size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-zinc-200 truncate">Pengajuan Cuti</h4>
                                    <p className="text-[9px] text-zinc-500 truncate">Izin / Off Duty</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-xl text-left">
                                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 border border-emerald-500/20">
                                    <FileText size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-zinc-200 truncate">Slip Gaji</h4>
                                    <p className="text-[9px] text-zinc-500 truncate">Rincian & Cetak</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="w-full pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-red-400 shrink-0" />
                            <span className="text-[11px]">Developer Sedang Bekerja</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400 hover:text-red-400 transition-colors">
                            <MessageSquare size={14} />
                            <span className="text-[11px]">Pengumuman Lanjutan di Discord</span>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}