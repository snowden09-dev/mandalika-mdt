"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import starAnimation from '@/public/star.json'; // Pastikan path ini benar

const loadingTexts = [
    "MEMBANGUN KONEKSI...",
    "MEMVERIFIKASI ID JENDRAL...",
    "MENGAKSES DATABASE...",
    "MENYANDI DATA INTELIJEN...",
    "MENYIAPKAN RADAR..."
];

export default function TacticalTransition({ isVisible }: { isVisible: boolean }) {
    const [textIndex, setTextIndex] = useState(0);

    // Efek mengganti teks setiap 600ms (lebih cepat agar terasa agresif)
    useEffect(() => {
        if (!isVisible) return;
        const interval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % loadingTexts.length);
        }, 600);
        return () => clearInterval(interval);
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.3 } }}
                    // Background kuning khas garis polisi/caution
                    className="fixed inset-0 z-[9999] bg-[#FFD100] flex flex-col items-center justify-center p-4 overflow-hidden"
                >
                    {/* Kotak Loading Neo-Brutalism */}
                    <motion.div
                        initial={{ scale: 0.8, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white border-[6px] border-slate-950 shadow-[12px_12px_0px_#000] rounded-[40px] p-8 md:p-12 w-full max-w-sm flex flex-col items-center relative overflow-hidden"
                    >
                        {/* Garis-garis caution di background kotak (opsional untuk estetika) */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none"
                            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)' }}
                        />

                        {/* Animasi Bintang Jendral */}
                        <div className="w-40 h-40 mb-6 bg-slate-100 rounded-3xl border-4 border-slate-950 shadow-inner flex items-center justify-center p-4">
                            <Lottie animationData={starAnimation} loop={true} className="w-full h-full" />
                        </div>

                        {/* Teks Status */}
                        <div className="h-10 w-full flex items-center justify-center border-t-4 border-b-4 border-slate-950 py-2 bg-[#A3E635]">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={textIndex}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    transition={{ duration: 0.15 }}
                                    className="text-slate-950 font-mono font-[1000] text-[11px] md:text-sm tracking-widest text-center uppercase italic leading-none"
                                >
                                    {loadingTexts[textIndex]}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Footer Warning Neo-Brutalism */}
                    <div className="absolute bottom-10 flex flex-col items-center">
                        <motion.div
                            animate={{ x: [-10, 10, -10] }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="bg-slate-950 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] border-[3px] border-white shadow-[4px_4px_0px_#000]"
                        >
                            STANDBY
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}