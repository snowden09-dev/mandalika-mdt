"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, CalendarCheck, FileText, Sparkles, MessageSquare } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="fixed inset-0 z-[9999] bg-zinc-950 flex items-center justify-center p-4 md:p-6 text-zinc-100 font-sans overflow-hidden">
            {/* Ambient Red Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-red-600/10 rounded-full blur-[130px] pointer-events-none" />
            
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="bg-zinc-900/90 border border-zinc-800/80 p-8 md:p-10 max-w-lg w-full rounded-2xl shadow-2xl backdrop-blur-md relative z-10 overflow-hidden"
            >
                {/* Accent Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-700" />

                <div className="flex flex-col items-center text-center space-y-6">
                    
                    {/* Icon Header */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                        <div className="relative bg-zinc-950 border border-red-500/30 p-4 rounded-2xl text-red-500 shadow-md">
                            <Wrench size={32} className="animate-pulse" />
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3.5 py-1.5 rounded-full text-red-400 text-xs font-semibold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        Sistem Sedang Pemeliharaan
                    </div>

                    {/* Title & Main Text */}
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">
                            Pengembangan Fitur Baru
                        </h1>
                        <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-md mx-auto">
                            Web sedang dalam masa pemeliharaan rutin. Developer sedang mengintegrasikan pembaruan fitur untuk meningkatkan kenyamanan sistem.
                        </p>
                    </div>

                    {/* Feature Cards / What's Coming */}
                    <div className="w-full pt-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3 text-left">
                            Fitur Yang Sedang Ditambahkan:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800/80 p-3.5 rounded-xl text-left">
                                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg shrink-0 border border-red-500/20">
                                    <CalendarCheck size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-200">Fitur Absensi</h4>
                                    <p className="text-[10px] text-zinc-500">Pencatatan presensi personel</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800/80 p-3.5 rounded-xl text-left">
                                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg shrink-0 border border-red-500/20">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-200">Fitur Slip Gaji</h4>
                                    <p className="text-[10px] text-zinc-500">Rincian & cetak otomatis</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="w-full pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-red-400 shrink-0" />
                            <span>Developer Aktif Bekerja</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400 hover:text-red-400 transition-colors">
                            <MessageSquare size={14} />
                            <span className="text-[11px]">Informasi Lanjutan di Discord</span>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}