"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
// import Lottie from 'lottie-react';
// import starAnimation from '@/public/star.json'; // Uncomment if you have the Lottie file!

const loadingTexts = [
    "MEMULAI PROTOKOL TRANSMISI...",
    "MENGAKSES JARINGAN MANDALIKA...",
    "MENYANDI DATA INTELIJEN...",
    "MENGALIHKAN JALUR KOMUNIKASI...",
    "MEMVERIFIKASI OTORISASI JENDRAL..."
];

export default function TacticalTransition({ isVisible }: { isVisible: boolean }) {
    const [textIndex, setTextIndex] = useState(0);

    // Efek mengganti teks setiap 1.2 detik saat loading
    useEffect(() => {
        if (!isVisible) return;
        const interval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % loadingTexts.length);
        }, 1200);
        return () => clearInterval(interval);
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden"
                >
                    {/* Fallback Icon (Ganti kembali dengan Lottie jika JSON sudah ada) */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-8 p-6 bg-[#00E676] rounded-full border-[6px] border-[#00E676] shadow-[0px_0px_50px_#00E676]"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        >
                            <ShieldAlert size={80} className="text-slate-950" strokeWidth={2.5} />
                        </motion.div>
                    </motion.div>

                    {/* Teks Animasi Berganti */}
                    <div className="h-8 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={textIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="text-[#00E676] font-mono font-[1000] text-sm md:text-xl tracking-widest text-center uppercase italic"
                            >
                                {loadingTexts[textIndex]}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    {/* Footer System */}
                    <div className="absolute bottom-10 flex flex-col items-center opacity-40">
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-32 h-1 bg-[#A3E635] rounded-full mb-3 shadow-[0px_0px_10px_#A3E635]"
                        />
                        <p className="text-white font-mono text-[10px] uppercase tracking-[0.3em] font-black">
                            Mandalika Tactical Command v3.0
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}