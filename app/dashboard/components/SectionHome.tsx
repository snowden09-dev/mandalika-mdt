"use client";

import React, { useState, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import {
    Zap, Clock, Calendar, FileText, Award,
    ChevronRight, Radar, Fingerprint, Target,
    Crosshair, Activity, ShieldAlert, TrendingUp,
    UserCheck, HelpCircle, AlertTriangle, GraduationCap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import TacticalTransition from './TacticalTransition';

const RANKS_DB = [
    { name: "CASIS", prp: 0, hrs: 0 }, // 🎓 Entry level untuk anak didik baru
    { name: "RECRUIT", prp: 0, hrs: 0 }, { name: "BHARADA", prp: 0, hrs: 0 },
    { name: "BHARATU", prp: 50, hrs: 10 }, { name: "BRIPDA", prp: 100, hrs: 20 },
    { name: "BRIPTU", prp: 150, hrs: 25 }, { name: "BRIGPOL", prp: 250, hrs: 35 },
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

    // 🚀 STATE NAVIGASI UNTUK LOADING SCREEN
    const [navState, setNavState] = useState<{ active: boolean, type: 'STAR' | 'COMPUTER' }>({
        active: false,
        type: 'STAR'
    });

    const boxBorder = "border-[4.5px] border-black";
    const hardShadow = "shadow-[10px_10px_0px_#000]";

    const container: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item: Variants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    const handleAction = (path: string, type: 'STAR' | 'COMPUTER') => {
        setNavState({ active: true, type });
        setTimeout(() => {
            router.push(path);
        }, 3000);
    };

    const progress = useMemo(() => {
        const currentPRP = Number(realtimeData.point_prp) || 0;
        const currentHRS = Number(realtimeData.total_jam_duty) || 0;
        const currentRankName = realtimeData.pangkat?.toUpperCase() || "CASIS";
        const currentRankIndex = RANKS_DB.findIndex(r => r.name === currentRankName);
        const nextR = RANKS_DB[currentRankIndex + 1] || RANKS_DB[currentRankIndex];

        return {
            next: nextR.name,
            targetPrp: nextR.prp,
            targetHrs: nextR.hrs,
            prpPct: Math.min((currentPRP / nextR.prp) * 100 || 100, 100).toFixed(0),
            hrPct: Math.min((currentHRS / nextR.hrs) * 100 || 100, 100).toFixed(0),
            prpNeed: Math.max(nextR.prp - currentPRP, 0),
            // 🔥 PERBAIKAN DESIMAL KEBANYAKAN: Dibulatkan max 1 angka di belakang koma
            hrNeed: parseFloat(Math.max(nextR.hrs - currentHRS, 0).toFixed(1))
        };
    }, [realtimeData]);

    const isCasis = realtimeData.pangkat?.toUpperCase() === 'CASIS';

    return (
        <motion.div
            variants={container} initial="hidden" animate="show"
            className="grid grid-cols-2 gap-6 max-w-5xl mx-auto pb-32 p-4 relative"
        >
            {/* 🚀 LAYAR TRANSISI */}
            <TacticalTransition isVisible={navState.active} type={navState.type} />

            {/* --- HERO SECTION --- */}
            <motion.div variants={item} className={`col-span-2 bg-[#3B82F6] p-8 ${boxBorder} ${hardShadow} relative overflow-hidden flex flex-col justify-end min-h-[220px] group`}>
                <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:rotate-12 transition-transform duration-500">
                    <Fingerprint size={160} className="text-black" />
                </div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                <div className="relative z-10">
                    <div className="bg-black text-[#00E676] px-3 py-1 inline-block text-[10px] font-black mb-3 uppercase italic border-2 border-[#00E676]">
                        {isCasis ? "Siswa Diklat Terdeteksi" : "Akses Terverifikasi"}
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-[1000] italic tracking-tighter uppercase leading-none truncate mb-5 drop-shadow-[3px_3px_0_#CCFF00]">{nickname}</h1>
                    <div className="flex gap-3">
                        <span className="bg-[#FFD100] px-4 py-1.5 border-[3px] border-black text-[12px] font-black italic shadow-[4px_4px_0_0_#000]">{realtimeData.pangkat}</span>
                        <span className="bg-[#CCFF00] px-4 py-1.5 border-[3px] border-black text-[12px] font-black italic shadow-[4px_4px_0_0_#000]">{realtimeData.divisi}</span>
                    </div>
                </div>
            </motion.div>

            {/* --- BIG STATS: REP POINTS --- */}
            <motion.div variants={item} className={`bg-[#FFD100] p-4 md:p-6 ${boxBorder} ${hardShadow} flex flex-col relative group overflow-hidden`}>
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:rotate-45 transition-transform">
                    <Zap size={100} />
                </div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <p className="text-[10px] md:text-[12px] font-black uppercase italic text-black bg-black/10 px-2 py-1">Reputation Points</p>
                    <TrendingUp size={24} className="hidden md:block" />
                </div>
                <div className="relative z-10 mb-4">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-[1000] leading-none tracking-tighter italic truncate">{realtimeData.point_prp}</h2>
                    <p className="text-[10px] md:text-xs font-black uppercase italic mt-1 text-black/60">Points Collected</p>
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
            <motion.div variants={item} className={`bg-[#00E676] p-4 md:p-6 ${boxBorder} ${hardShadow} flex flex-col relative group overflow-hidden`}>
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform">
                    <Activity size={100} />
                </div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <p className="text-[10px] md:text-[12px] font-black uppercase italic text-black bg-black/10 px-2 py-1">Duty Records</p>
                    <Clock size={24} className="hidden md:block" />
                </div>
                <div className="relative z-10 mb-4">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-[1000] leading-none tracking-tighter italic truncate">{realtimeData.total_jam_duty}</h2>
                    <p className="text-[10px] md:text-xs font-black uppercase italic mt-1 text-black/60">Total Hours</p>
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
            <motion.div variants={item} className={`col-span-2 bg-white p-4 md:p-6 ${boxBorder} ${hardShadow} relative group overflow-hidden`}>
                <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                    <Target size={180} />
                </div>
                <div className="flex items-center gap-4 md:gap-6 mb-6 relative z-10">
                    <div className="bg-[#A78BFA] p-3 md:p-4 border-[4px] border-black shadow-[6px_6px_0_0_#000] -rotate-2 group-hover:rotate-0 transition-transform">
                        <Award size={32} className="md:w-10 md:h-10" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] md:text-[11px] font-black opacity-50 italic uppercase leading-none mb-2">
                            {isCasis ? "Kelulusan Siswa Diklat" : "Next Promotion Goal"}
                        </p>
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-[1000] italic leading-none tracking-tighter truncate">{progress.next}</h3>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-5 relative z-10">
                    <div className="bg-[#FFD100] border-[4px] border-black p-3 md:p-4 flex flex-col shadow-[6px_6px_0_0_#000] group-hover:-translate-y-1 transition-transform">
                        <span className="text-lg sm:text-xl md:text-2xl font-[1000] text-black italic truncate">-{progress.prpNeed} PRP</span>
                        <span className="text-[9px] md:text-[10px] font-black uppercase italic text-black/60">Points Needed</span>
                    </div>
                    <div className="bg-[#00E676] border-[4px] border-black p-3 md:p-4 flex flex-col shadow-[6px_6px_0_0_#000] group-hover:-translate-y-1 transition-transform">
                        <span className="text-lg sm:text-xl md:text-2xl font-[1000] text-black italic truncate">-{progress.hrNeed} HRS</span>
                        <span className="text-[9px] md:text-[10px] font-black uppercase italic text-black/60">Hours Needed</span>
                    </div>
                </div>
            </motion.div>

            {/* --- 🔥 CONDITIONAL ACTIONS: CASIS VS POLICE --- */}
            {isCasis ? (
                <>
                    {/* MODUL KHUSUS CASIS */}
                    <motion.button
                        variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction('/absen-diklat', 'STAR')}
                        className={`bg-[#A3E635] p-6 md:p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group`}
                    >
                        <div className="bg-white p-3 md:p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#FFD100] transition-all group-hover:rotate-12">
                            <GraduationCap size={40} className="md:w-12 md:h-12 text-black" />
                        </div>
                        <span className="text-lg md:text-xl font-[1000] italic uppercase tracking-widest text-black drop-shadow-[2px_2px_0_#A3E635]">Absen Diklat</span>
                    </motion.button>

                    <motion.button
                        variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction('/izin-diklat', 'COMPUTER')}
                        className={`bg-[#FFD100] p-6 md:p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group`}
                    >
                        <div className="bg-white p-3 md:p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#CCFF00] transition-all group-hover:-rotate-12">
                            <HelpCircle size={40} className="md:w-12 md:h-12 text-black" />
                        </div>
                        <span className="text-lg md:text-xl font-[1000] italic uppercase tracking-widest text-black drop-shadow-[2px_2px_0_#FFD100]">Izin/Sakit</span>
                    </motion.button>

                    <motion.div variants={item} className="col-span-2 bg-slate-950 text-white p-4 border-[3px] border-black rounded-xl flex items-center gap-3">
                        <AlertTriangle className="text-yellow-400 shrink-0" />
                        <p className="text-[10px] font-black uppercase italic leading-tight">
                            Peringatan Siswa: Hanya diperbolehkan melakukan Presensi saat Pelatihan Resmi dimulai.
                        </p>
                    </motion.div>
                </>
            ) : (
                <>
                    {/* MODUL STANDAR POLISI */}
                    <motion.button
                        variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction('/absen', 'STAR')}
                        className={`bg-[#FF4D4D] p-6 md:p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group`}
                    >
                        <div className="bg-white p-3 md:p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#FFD100] transition-all group-hover:-rotate-12">
                            <Radar size={40} className="md:w-12 md:h-12 animate-spin-slow text-black" />
                        </div>
                        <span className="text-lg md:text-xl font-[1000] italic uppercase tracking-widest text-white drop-shadow-[2px_2px_0_#000]">Absensi</span>
                    </motion.button>

                    <motion.button
                        variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction('/laporan', 'COMPUTER')}
                        className={`bg-[#A78BFA] p-6 md:p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group`}
                    >
                        <div className="bg-white p-3 md:p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#CCFF00] transition-all group-hover:rotate-12">
                            <FileText size={40} className="md:w-12 md:h-12 text-black" />
                        </div>
                        <span className="text-lg md:text-xl font-[1000] italic uppercase tracking-widest text-white drop-shadow-[2px_2px_0_#000]">Laporan</span>
                    </motion.button>
                </>
            )}

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