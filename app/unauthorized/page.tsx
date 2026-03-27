'use client';

import { motion, Variants } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- ANIMASI Bouncy (Khas Mobile App) ---
const mobilePopup: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { type: "spring", stiffness: 300, damping: 20 }
    }
};

const pulse: Variants = {
    animate: {
        scale: [1, 1.1, 1],
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    }
};

export default function UnauthorizedPage() {

    const handleLogoutAndRetry = async () => {
        // Logout dulu biar sesi lama ilang
        await supabase.auth.signOut();
        // Pindah ke Login
        window.location.href = '/';
    };

    return (
        // BACKGROUND: Soft Magenta biar cerah dan gak monopolton
        <main className="min-h-screen bg-[#F0E0FF] text-black flex items-center justify-center p-4 overflow-hidden relative font-sans">

            {/* 1. MOBILE NATIVE CONTAINER */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={mobilePopup}
                className="w-full max-w-sm bg-white border-[8px] border-black shadow-[20px_20px_0px_0px_#000] z-10 relative overflow-hidden"
            >
                {/* TOP STATUS BAR (Ala Game/HP) */}
                <div className="bg-[#FFD100] border-b-4 border-black p-2 flex justify-between items-center px-4 font-black italic text-xs uppercase">
                    <span>Official MDT Error</span>
                    <span className="text-red-700 animate-pulse">● System Kick</span>
                </div>

                {/* LOGO PENOLAKAN: Tangan Kalo Berhenti */}
                <div className="p-8 flex flex-col items-center">
                    <motion.div
                        variants={pulse}
                        animate="animate"
                        className="bg-[#00E676] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] mb-8 rotate-[-5deg]"
                    >
                        <span className="text-6xl cursor-default">✋</span> {/* Dummy Icon Hand */}
                    </motion.div>

                    <h1 className="text-5xl font-[1000] text-center uppercase leading-none tracking-tighter italic mb-4">
                        AKSES<br />
                        <span className="text-[#3B82F6] underline decoration-black decoration-8 underline-offset-4 italic">DITOLAK!</span>
                    </h1>

                    {/* WARNING BOX (Coral Red yang nabrak Cyan/Yellow) */}
                    <div className="bg-[#FF4D4D] border-4 border-black p-4 mb-8 shadow-[8px_8px_0_0_#000] rotate-2">
                        <p className="font-[1000] text-sm uppercase text-black leading-tight text-center">
                            ⚠️ LU BUKAN POLISI BRAY!
                        </p>
                    </div>

                    <p className="font-bold text-center text-sm leading-tight mb-8">
                        Sistem MDT Mandalika mendeteksi akun Discord Anda tidak memiliki Role POLISI yang valid. Akses dibatasi hanya untuk personil resmi.
                    </p>

                    {/* TOMBOL BESAR (Kuning Emas yang cerah) */}
                    <motion.div className="w-full">
                        <motion.button
                            onClick={handleLogoutAndRetry}
                            whileHover={{ scale: 1.05, x: 5, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full bg-[#FFD100] text-black font-[1000] text-2xl py-5 border-4 border-black shadow-[10px_10px_0px_0px_#000] flex items-center justify-center gap-4 transition-all"
                        >
                            <img src="/discord-login.png" alt="Discord" className="w-10 h-10" />
                            <span>BALIK KE LOGIN</span>
                        </motion.button>

                        <p className="text-[10px] font-black text-center mt-4 uppercase italic opacity-60">
                            Property of Mandalika Police Dept.
                        </p>
                    </motion.div>
                </div>

                {/* FOOTER BAR */}
                <div className="bg-black py-2 px-4 flex justify-end items-center border-t-4 border-black">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 bg-blue-400 border border-black rounded-full" />
                        <div className="w-2.5 h-2.5 bg-yellow-400 border border-black rounded-full" />
                        <div className="w-2.5 h-2.5 bg-green-400 border border-black rounded-full" />
                    </div>
                </div>
            </motion.div>

            {/* 2. BACKGROUND DECOR (Desktop Only - biar tetep rame) */}
            <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-[#00E676] border-4 border-black shadow-[8px_8px_0_0_#000] rotate-12 hidden lg:block opacity-60" />
            <div className="absolute bottom-[10%] right-[5%] w-40 h-40 bg-[#FFD100] border-4 border-black rounded-full shadow-[10px_10px_0_0_#000] -rotate-12 hidden lg:block opacity-60" />

        </main>
    );
}