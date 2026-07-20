"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import starAnimation from '@/public/star.json';
import computerAnimation from '@/public/computer.json';

type TransitionType = 'STAR' | 'COMPUTER';

export default function TacticalTransition({ isVisible, type = 'STAR' }: { isVisible: boolean, type?: TransitionType }) {
    const [textIndex, setTextIndex] = useState(0);

    const loadingTexts = type === 'COMPUTER'
        ? ["MENGHUBUNGKAN SERVER...", "MENARIK DATA ARSIP...", "MENYINKRONKAN LOG...", "OTORISASI ENKRIPSI...", "MEMBUKA PORT DATA..."]
        : ["MEMULAI PROTOKOL...", "VERIFIKASI IDENTITAS...", "MENYANDI DATA...", "RADAR AKTIF...", "STANDBY..."];

    useEffect(() => {
        if (!isVisible) return;
        const interval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % loadingTexts.length);
        }, 600);
        return () => clearInterval(interval);
    }, [isVisible, type, loadingTexts.length]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.3 } }}
                    className="fixed inset-0 z-[9999] bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-hidden"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/80 rounded-3xl p-6 md:p-8 w-full max-w-sm flex flex-col items-center relative overflow-hidden"
                    >
                        {/* Header Minimalist Dark Tab */}
                        <div className="absolute top-0 left-0 right-0 h-9 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between px-4">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                                {type === 'COMPUTER' ? 'Data_Transfer.exe' : 'System_Protocol.sys'}
                            </span>
                        </div>

                        {/* Animasi Lottie */}
                        <div className="w-32 h-32 mb-5 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center p-4 mt-6 shadow-inner">
                            <Lottie
                                animationData={type === 'COMPUTER' ? computerAnimation : starAnimation}
                                loop={true}
                                className="w-full h-full filter invert opacity-90"
                            />
                        </div>

                        {/* Teks Status */}
                        <div className="h-10 w-full flex items-center justify-center border border-zinc-800 bg-zinc-950 rounded-xl shadow-xs">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={textIndex}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                    className="text-red-500 font-mono font-bold text-[11px] tracking-wide text-center uppercase"
                                >
                                    {loadingTexts[textIndex]}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    <div className="absolute bottom-10 flex flex-col items-center">
                        <motion.div
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="bg-zinc-900 text-red-500 px-5 py-2 rounded-xl font-mono font-semibold text-[10px] uppercase tracking-[0.3em] border border-zinc-800 shadow-lg shadow-black/50"
                        >
                            PROCESSING...
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}