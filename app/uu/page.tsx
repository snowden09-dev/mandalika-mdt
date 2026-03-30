"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Hammer, ShieldAlert } from 'lucide-react';

export default function ComingSoonPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#e2e8f0] text-slate-950 font-mono p-6 flex flex-col items-center justify-center relative overflow-hidden">

            {/* Garis Polisi Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)' }}
            />

            <motion.div
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                className="w-full max-w-md bg-[#FFD100] border-[6px] border-black shadow-[15px_15px_0px_#000] rounded-[40px] p-8 md:p-12 flex flex-col items-center text-center relative z-10"
            >
                {/* Header Badge */}
                <div className="absolute -top-4 bg-black text-white px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest border-2 border-white shadow-[4px_4px_0_#000]">
                    RESTRICTED ZONE
                </div>

                {/* Ikon Animasi */}
                <motion.div
                    animate={{ rotate: [-10, 10, -10] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="w-24 h-24 bg-white border-[4px] border-black rounded-3xl shadow-inner flex items-center justify-center mb-6"
                >
                    <Hammer size={48} className="text-black" />
                </motion.div>

                <h1 className="text-5xl font-[1000] italic uppercase tracking-tighter leading-none mb-4 text-black">
                    AREA <br />
                    <span className="text-[#FF4D4D] underline decoration-black decoration-[6px] underline-offset-4">DIBLOKIR</span>
                </h1>

                <div className="flex items-center gap-2 bg-black text-[#CCFF00] px-4 py-2 rounded-xl border-2 border-black mb-6 shadow-[4px_4px_0_#FF4D4D]">
                    <ShieldAlert size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest italic">
                        Under Construction
                    </p>
                </div>

                <p className="text-xs font-bold mb-10 opacity-80 leading-relaxed">
                    Dokumen intelijen dan regulasi sedang dalam proses penyusunan oleh Markas Besar. Akses ditutup sementara!
                </p>

                {/* Tombol Kembali */}
                <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full flex items-center justify-center gap-3 bg-white border-[4px] border-black px-6 py-4 rounded-2xl text-sm font-black uppercase italic shadow-[6px_6px_0px_#000] active:translate-y-1 active:shadow-[0px_0px_0px_#000] transition-all group"
                >
                    <div className="bg-slate-200 p-1.5 rounded-lg border-2 border-black group-hover:bg-black group-hover:text-white transition-colors">
                        <ArrowLeft size={16} />
                    </div>
                    Kembali Ke Markas
                </button>

            </motion.div>
        </div>
    );
}