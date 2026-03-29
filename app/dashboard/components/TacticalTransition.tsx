"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import starAnimation from '@/public/star.json';
import computerAnimation from '@/public/computer.json'; // 🚀 Pastikan file ini ada di public/

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
                    className={`fixed inset-0 z-[9999] ${type === 'COMPUTER' ? 'bg-[#A78BFA]' : 'bg-[#FFD100]'} flex flex-col items-center justify-center p-4 overflow-hidden`}
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 50, rotate: -2 }}
                        animate={{ scale: 1, y: 0, rotate: 0 }}
                        className="bg-white border-[6px] border-slate-950 shadow-[15px_15px_0px_#000] rounded-[40px] p-8 md:p-12 w-full max-w-sm flex flex-col items-center relative overflow-hidden"
                    >
                        {/* Header Tab Style */}
                        <div className="absolute -top-1 left-0 right-0 h-8 bg-black flex items-center px-6">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FF4D4D]" />
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FFD100]" />
                                <div className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />
                            </div>
                            <span className="ml-4 text-[9px] font-black text-white uppercase tracking-widest italic">
                                {type === 'COMPUTER' ? 'Data_Transfer.exe' : 'System_Protocol.sys'}
                            </span>
                        </div>

                        <div className="absolute inset-0 opacity-5 pointer-events-none mt-8"
                            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)' }}
                        />

                        {/* Animasi Lottie */}
                        <div className="w-40 h-40 mb-6 bg-slate-100 rounded-3xl border-4 border-slate-950 shadow-inner flex items-center justify-center p-4 mt-4">
                            <Lottie
                                animationData={type === 'COMPUTER' ? computerAnimation : starAnimation}
                                loop={true}
                                className="w-full h-full"
                            />
                        </div>

                        {/* Teks Status */}
                        <div className="h-12 w-full flex items-center justify-center border-4 border-slate-950 bg-black shadow-[4px_4px_0px_#A3E635]">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={textIndex}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="text-[#A3E635] font-mono font-black text-[10px] md:text-xs tracking-tighter text-center uppercase italic"
                                >
                                    {loadingTexts[textIndex]}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    <div className="absolute bottom-10 flex flex-col items-center">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="bg-slate-950 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] border-[3px] border-white shadow-[6px_6px_0px_#000]"
                        >
                            PROCESSING
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}