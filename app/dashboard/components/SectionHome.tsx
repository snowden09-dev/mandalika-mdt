"use client";

import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import {
    Zap, Clock, Calendar, FileText, Award,
    ChevronRight, Radar, Fingerprint, Target,
    Crosshair, Activity, ShieldAlert
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Database Pangkat (Tetap sama)
const RANKS_DB = [
    { name: "RECRUIT", prp: 0, hrs: 0 }, { name: "BHARADA", prp: 0, hrs: 0 },
    { name: "BHARATU", prp: 50, hrs: 10 }, { name: "BRIPDA", prp: 100, hrs: 20 },
    { name: "BRIPTU", prp: 150, hrs: 25 }, { name: "BRIGADIR", prp: 250, hrs: 35 },
    { name: "BRIPKA", prp: 350, hrs: 50 }, { name: "AIPDA", prp: 450, hrs: 65 },
    { name: "AIPTU", prp: 600, hrs: 80 }, { name: "IPDA", prp: 800, hrs: 100 },
    { name: "IPTU", prp: 1000, hrs: 120 }, { name: "AKP", prp: 1300, hrs: 150 },
    { name: "KOMPOL", prp: 1600, hrs: 180 }, { name: "AKBP", prp: 2000, hrs: 220 },
    { name: "KOMBESPOL", prp: 2500, hrs: 260 }, { name: "BRIGJEN", prp: 5000, hrs: 500 },
    { name: "IRJEN", prp: 7500, hrs: 750 }, { name: "KOMJEN", prp: 10000, hrs: 1000 },
    { name: "JENDRAL", prp: 15000, hrs: 1500 },
];

export default function SectionHome({ nickname, realtimeData }: { nickname: string, realtimeData: any }) {
    const router = useRouter();

    const boxBorder = "border-[4px] border-black";
    const hardShadow = "shadow-[8px_8px_0px_#000]";
    const fontBlack = "font-mono font-[1000] italic uppercase tracking-tighter text-black";

    // Animasi Variants
    const container: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item: Variants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    const progress = useMemo(() => {
        const currentPRP = Number(realtimeData.point_prp) || 0;
        const currentHRS = Number(realtimeData.total_jam_duty) || 0;
        const currentRankName = realtimeData.pangkat?.toUpperCase() || "RECRUIT";
        const currentRankIndex = RANKS_DB.findIndex(r => r.name === currentRankName);
        const nextR = RANKS_DB[currentRankIndex + 1] || RANKS_DB[currentRankIndex];

        return {
            next: nextR.name,
            targetPrp: nextR.prp,
            targetHrs: nextR.hrs,
            prpPct: Math.min((currentPRP / nextR.prp) * 100 || 100, 100).toFixed(0),
            hrPct: Math.min((currentHRS / nextR.hrs) * 100 || 100, 100).toFixed(0),
            prpNeed: Math.max(nextR.prp - currentPRP, 0),
            hrNeed: Math.max(nextR.hrs - currentHRS, 0)
        };
    }, [realtimeData]);

    return (
        <motion.div
            variants={container} initial="hidden" animate="show"
            className="grid grid-cols-2 gap-4 max-w-5xl mx-auto pb-24 p-2 relative"
        >
            {/* --- HERO SECTION --- */}
            <motion.div variants={item} className={`col-span-2 bg-[#3B82F6] p-6 ${boxBorder} ${hardShadow} relative overflow-hidden flex flex-col justify-end min-h-[200px] group`}>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform">
                    <Fingerprint size={120} className="text-black" />
                </div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 0)', backgroundSize: '15px 15px' }} />

                <div className="relative z-10">
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="bg-black text-[#00E676] px-2 py-0.5 inline-block text-[8px] font-black mb-2 uppercase italic">Akses_Terverifikasi</motion.div>
                    <h1 className="text-4xl font-[1000] italic tracking-tighter uppercase leading-none truncate mb-4 drop-shadow-[2px_2px_0_#CCFF00]">{nickname}</h1>
                    <div className="flex gap-2">
                        <span className="bg-[#FFD100] px-3 py-1 border-2 border-black text-[10px] font-black italic shadow-[3px_3px_0_0_#000]">{realtimeData.pangkat}</span>
                        <span className="bg-[#CCFF00] px-3 py-1 border-2 border-black text-[10px] font-black italic shadow-[3px_3px_0_0_#000]">{realtimeData.divisi}</span>
                    </div>
                </div>
            </motion.div>

            {/* --- STATS PRP --- */}
            <motion.div variants={item} whileHover={{ scale: 1.02, rotate: 1 }} className={`bg-[#FFD100] p-4 ${boxBorder} ${hardShadow} flex flex-col justify-between group`}>
                <div className="flex justify-between items-start">
                    <Zap size={24} className="group-hover:text-[#3B82F6] transition-colors" />
                    <span className="text-[10px] font-black bg-black text-[#FFD100] px-2 py-0.5 border-2 border-black">{progress.prpPct}%</span>
                </div>
                <div className="mt-4">
                    <h2 className="text-4xl font-[1000] leading-none mb-1">{realtimeData.point_prp}</h2>
                    <p className="text-[9px] font-black opacity-60 uppercase italic">Rep_Points</p>
                </div>
                <div className="mt-4 bg-black h-4 border-2 border-black p-[2px]">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress.prpPct}%` }} className="h-full bg-[#00E676]" />
                </div>
            </motion.div>

            {/* --- STATS HOURS --- */}
            <motion.div variants={item} whileHover={{ scale: 1.02, rotate: -1 }} className={`bg-[#00E676] p-4 ${boxBorder} ${hardShadow} flex flex-col justify-between group`}>
                <div className="flex justify-between items-start">
                    <Activity size={24} className="group-hover:text-red-600 transition-colors animate-pulse" />
                    <span className="text-[10px] font-black bg-black text-[#00E676] px-2 py-0.5 border-2 border-black">{progress.hrPct}%</span>
                </div>
                <div className="mt-4">
                    <h2 className="text-4xl font-[1000] leading-none mb-1">{realtimeData.total_jam_duty}</h2>
                    <p className="text-[9px] font-black opacity-60 uppercase italic">Duty_Hrs</p>
                </div>
                <div className="mt-4 bg-black h-4 border-2 border-black p-[2px]">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress.hrPct}%` }} className="h-full bg-[#FF4D4D]" />
                </div>
            </motion.div>

            {/* --- PROMOTION PATHWAY --- */}
            <motion.div variants={item} className={`col-span-2 bg-white p-5 ${boxBorder} ${hardShadow} relative group overflow-hidden`}>
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-150 transition-transform duration-700">
                    <Target size={120} />
                </div>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="bg-[#A78BFA] p-3 border-4 border-black shadow-[4px_4px_0_0_#000] rotate-3 group-hover:rotate-0 transition-transform">
                        <Award size={28} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black opacity-50 italic uppercase leading-none mb-1">Target_Next_Promotion</p>
                        <h3 className="text-2xl font-[1000] italic leading-none">{progress.next}</h3>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-[#FFD100] border-4 border-black p-3 flex flex-col shadow-[4px_4px_0_0_#000]">
                        <span className="text-xs font-[1000] text-black">-{progress.prpNeed} PRP</span>
                        <span className="text-[8px] font-black opacity-60 uppercase italic">Remaining</span>
                    </div>
                    <div className="bg-[#00E676] border-4 border-black p-3 flex flex-col shadow-[4px_4px_0_0_#000]">
                        <span className="text-xs font-[1000] text-black">-{progress.hrNeed} HRS</span>
                        <span className="text-[8px] font-black opacity-60 uppercase italic">Remaining</span>
                    </div>
                </div>
            </motion.div>

            {/* --- ACTION 1: ABSEN --- */}
            <motion.button
                variants={item} whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/absen')}
                className={`bg-[#FF4D4D] p-6 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-3 group`}
            >
                <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0_0_#000] group-hover:bg-[#FFD100] transition-colors">
                    <Radar size={32} className="animate-spin-slow" />
                </div>
                <span className="text-[12px] font-[1000] italic uppercase tracking-widest">Absensi</span>
            </motion.button>

            {/* --- ACTION 2: LAPORAN --- */}
            <motion.button
                variants={item} whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/laporan')}
                className={`bg-[#A78BFA] p-6 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-3 group`}
            >
                <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0_0_#000] group-hover:bg-[#CCFF00] transition-colors">
                    <FileText size={32} />
                </div>
                <span className="text-[12px] font-[1000] italic uppercase tracking-widest">Laporan</span>
            </motion.button>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}</style>

        </motion.div>
    );
}