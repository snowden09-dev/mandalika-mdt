"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft, Wrench, ShieldAlert } from 'lucide-react';

const fadeIn: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" }
    }
};

export default function ComingSoonPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 font-sans selection:bg-red-500 selection:text-white relative overflow-hidden">
            
            {/* CONTAINER UTAMA */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="w-full max-w-md bg-[#121214] border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            >
                {/* Aksen Garis Merah Minimalis di Atas */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

                {/* HEADER / STATUS */}
                <div className="flex justify-between items-center mb-8">
                    <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
                        MDT // Maintenance
                    </span>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-medium text-red-400 tracking-wider uppercase">Under Construction</span>
                    </div>
                </div>

                {/* KONTEN UTAMA */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                            Area Dalam Pengembangan
                        </h1>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Dokumen intelijen dan regulasi sedang dalam proses penyusunan oleh Markas Besar. Akses ditutup sementara.
                        </p>
                    </div>

                    {/* DETAIL INFO BOX */}
                    <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
                        <div className="flex gap-3">
                            <div className="text-red-500 mt-0.5">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-red-400 tracking-wide uppercase">Restricted Zone</h3>
                                <p className="text-xs text-red-300/80 mt-0.5">Silakan kembali ke dashboard utama sementara sistem diperbarui.</p>
                            </div>
                        </div>
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="pt-2">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-medium text-sm py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-red-900/20 active:scale-[0.98] group"
                        >
                            <ArrowLeft className="w-4 h-4 opacity-80 group-hover:-translate-x-1 transition-transform" />
                            <span>Kembali ke Markas</span>
                        </button>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="mt-8 pt-4 border-t border-zinc-800/60 text-center">
                    <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                        Mandalika Police Department &bull; Secure Portal
                    </p>
                </div>
            </motion.div>

        </main>
    );
}