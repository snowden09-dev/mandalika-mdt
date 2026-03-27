"use client";

import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import {
    Zap, Clock, Calendar, FileText, Award,
    ChevronRight, Radar, Fingerprint, Target,
    Crosshair, Activity, ShieldAlert, TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';

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

    const boxBorder = "border-[4.5px] border-black";
    const hardShadow = "shadow-[10px_10px_0px_#000]";
    const textBlack = "font-mono font-[1000] italic uppercase tracking-tighter text-black";

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
            className="grid grid-cols-2 gap-6 max-w-5xl mx-auto pb-32 p-4 relative"
        >
            {/* --- HERO SECTION --- */}
            <motion.div variants={item} className={`col-span-2 bg-[#3B82F6] p-8 ${boxBorder} ${hardShadow} relative overflow-hidden flex flex-col justify-end min-h-[220px] group`}>
                <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:rotate-12 transition-transform duration-500">
                    <Fingerprint size={160} className="text-black" />
                </div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                <div className="relative z-10">
                    <div className="bg-black text-[#00E676] px-3 py-1 inline-block text-[10px] font-black mb-3 uppercase italic border-2 border-[#00E676]">Akses Terverifikasi</div>
                    <h1 className="text-5xl font-[1000] italic tracking-tighter uppercase leading-none truncate mb-5 drop-shadow-[3px_3px_0_#CCFF00]">{nickname}</h1>
                    <div className="flex gap-3">
                        <span className="bg-[#FFD100] px-4 py-1.5 border-[3px] border-black text-[12px] font-black italic shadow-[4px_4px_0_0_#000]">{realtimeData.pangkat}</span>
                        <span className="bg-[#CCFF00] px-4 py-1.5 border-[3px] border-black text-[12px] font-black italic shadow-[4px_4px_0_0_#000]">{realtimeData.divisi}</span>
                    </div>
                </div>
            </motion.div>

            {/* --- BIG STATS: REP POINTS --- */}
            <motion.div variants={item} className={`bg-[#FFD100] p-6 ${boxBorder} ${hardShadow} flex flex-col relative group overflow-hidden`}>
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:rotate-45 transition-transform">
                    <Zap size={100} />
                </div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <p className="text-[12px] font-black uppercase italic text-black bg-black/10 px-2 py-1">Reputation Points</p>
                    <TrendingUp size={24} />
                </div>
                <div className="relative z-10 mb-4">
                    <h2 className="text-7xl font-[1000] leading-none tracking-tighter italic">{realtimeData.point_prp}</h2>
                    <p className="text-xs font-black uppercase italic mt-1 text-black/60">Points Collected</p>
                </div>
                <div className="mt-auto relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                        <span>Progress</span>
                        <span>{progress.prpPct}%</span>
                    </div>
                    <div className="bg-black h-6 border-[3px] border-black p-[3px] shadow-[3px_3px_0_0_#000]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress.prpPct}%` }} className="h-full bg-[#00E676] border-r-2 border-black" />
                    </div>
                </div>
            </motion.div>

            {/* --- BIG STATS: DUTY HOURS --- */}
            <motion.div variants={item} className={`bg-[#00E676] p-6 ${boxBorder} ${hardShadow} flex flex-col relative group overflow-hidden`}>
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                    <Activity size={100} />
                </div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <p className="text-[12px] font-black uppercase italic text-black bg-black/10 px-2 py-1">Duty Records</p>
                    <Clock size={24} />
                </div>
                <div className="relative z-10 mb-4">
                    <h2 className="text-7xl font-[1000] leading-none tracking-tighter italic">{realtimeData.total_jam_duty}</h2>
                    <p className="text-xs font-black uppercase italic mt-1 text-black/60">Total Hours</p>
                </div>
                <div className="mt-auto relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                        <span>Active Time</span>
                        <span>{progress.hrPct}%</span>
                    </div>
                    <div className="bg-black h-6 border-[3px] border-black p-[3px] shadow-[3px_3px_0_0_#000]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress.hrPct}%` }} className="h-full bg-[#FF4D4D] border-r-2 border-black" />
                    </div>
                </div>
            </motion.div>

            {/* --- PROMOTION PATHWAY --- */}
            <motion.div variants={item} className={`col-span-2 bg-white p-6 ${boxBorder} ${hardShadow} relative group overflow-hidden`}>
                <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                    <Target size={180} />
                </div>
                <div className="flex items-center gap-6 mb-6 relative z-10">
                    <div className="bg-[#A78BFA] p-4 border-[4px] border-black shadow-[6px_6px_0_0_#000] -rotate-2 group-hover:rotate-0 transition-transform">
                        <Award size={40} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black opacity-50 italic uppercase leading-none mb-2">Next Promotion Goal</p>
                        <h3 className="text-4xl font-[1000] italic leading-none tracking-tighter">{progress.next}</h3>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-5 relative z-10">
                    <div className="bg-[#FFD100] border-[4px] border-black p-4 flex flex-col shadow-[6px_6px_0_0_#000] group-hover:-translate-y-1 transition-transform">
                        <span className="text-2xl font-[1000] text-black italic">-{progress.prpNeed} PRP</span>
                        <span className="text-[10px] font-black uppercase italic text-black/60">Points Needed</span>
                    </div>
                    <div className="bg-[#00E676] border-[4px] border-black p-4 flex flex-col shadow-[6px_6px_0_0_#000] group-hover:-translate-y-1 transition-transform">
                        <span className="text-2xl font-[1000] text-black italic">-{progress.hrNeed} HRS</span>
                        <span className="text-[10px] font-black uppercase italic text-black/60">Hours Needed</span>
                    </div>
                </div>
            </motion.div>

            {/* --- ACTION 1: ABSEN --- */}
            <motion.button
                variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/absen')}
                className={`bg-[#FF4D4D] p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group`}
            >
                <div className="bg-white p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#FFD100] transition-all group-hover:-rotate-12">
                    <Radar size={48} className="animate-spin-slow text-black" />
                </div>
                <span className="text-xl font-[1000] italic uppercase tracking-widest text-white drop-shadow-[2px_2px_0_#000]">Absensi</span>
            </motion.button>

            {/* --- ACTION 2: LAPORAN --- */}
            <motion.button
                variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/laporan')}
                className={`bg-[#A78BFA] p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group`}
            >
                <div className="bg-white p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#CCFF00] transition-all group-hover:rotate-12">
                    <FileText size={48} className="text-black" />
                </div>
                <span className="text-xl font-[1000] italic uppercase tracking-widest text-white drop-shadow-[2px_2px_0_#000]">Laporan</span>
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