"use client";

import React, { useState, useMemo } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
    Zap, Clock, Calendar, FileText, Award,
    ChevronRight, Radar, Fingerprint, Target,
    Crosshair, Activity, ShieldAlert, TrendingUp,
    UserCheck, HelpCircle, AlertTriangle, GraduationCap,
    Camera, MapPin, BadgeCheck, Share2, MoreHorizontal, User,
    Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import TacticalTransition from './TacticalTransition';

const RANKS_DB = [
    { name: "CASIS", prp: 0, hrs: 0 },
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

interface SectionHomeProps {
    nickname: string;
    realtimeData: any;
    theme: 'NEO' | 'CLEAN';
    userData?: any;
}

export default function SectionHome({ nickname, realtimeData, theme, userData }: SectionHomeProps) {
    const router = useRouter();

    // 🚀 LOGIK NAVIGASI & STATS (TETAP SAMA)
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
            hrNeed: Math.max(nextR.hrs - currentHRS, 0)
        };
    }, [realtimeData]);

    const isCasis = realtimeData.pangkat?.toUpperCase() === 'CASIS';
    const totalLaporan = 12; // Mock data laporan

    // ==========================================
    // 🎨 RENDER MODE: CLEAN (TRAKTEER STYLE)
    // ==========================================
    if (theme === 'CLEAN') {
        return (
            <motion.div
                variants={container} initial="hidden" animate="show"
                className="w-full max-w-4xl mx-auto space-y-6 pb-32 p-4 font-sans"
            >
                <TacticalTransition isVisible={navState.active} type={navState.type} />

                {/* HEADER CARD */}
                <motion.div variants={item} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-200">
                    <div className="h-40 md:h-52 bg-slate-900 relative">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        <button className="absolute bottom-4 right-4 bg-black/20 hover:bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/20 text-white transition-all">
                            <Camera size={18} />
                        </button>
                    </div>

                    <div className="px-6 md:px-10 pb-8">
                        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between -mt-12 md:-mt-16">
                            <div className="flex flex-col md:flex-row md:items-end gap-5">
                                <div className="w-28 h-28 md:w-40 md:h-40 bg-white p-1.5 rounded-full shadow-md">
                                    <div className="w-full h-full bg-slate-100 rounded-full overflow-hidden relative">
                                        {userData?.image ? (
                                            <NextImage src={userData.image} alt="Avatar" width={160} height={160} className="object-cover w-full h-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><User size={50} className="text-slate-300" /></div>
                                        )}
                                    </div>
                                </div>
                                <div className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{nickname}</h1>
                                        <BadgeCheck size={22} className="text-blue-500 fill-blue-500/10" />
                                    </div>
                                    <p className="text-slate-500 font-medium tracking-tight">@{nickname.toLowerCase().replace(/\s/g, '_')}</p>
                                </div>
                            </div>

                            <div className="flex gap-6 mt-6 md:mt-0 md:pb-4 border-t md:border-t-0 pt-4 md:pt-0">
                                <div className="text-center md:text-right">
                                    <p className="text-xl font-bold text-slate-900">{totalLaporan}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Laporan</p>
                                </div>
                                <div className="text-center md:text-right">
                                    <p className="text-xl font-bold text-slate-900">{Math.floor(realtimeData.total_jam_duty)}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jam Duty</p>
                                </div>
                                <div className="text-center md:text-right">
                                    <p className="text-xl font-bold text-slate-900">{realtimeData.point_prp}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Point PRP</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex flex-wrap gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100"><MapPin size={14} /> {realtimeData.divisi}</span>
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100"><Star size={14} /> {realtimeData.pangkat}</span>
                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100"><Calendar size={14} /> Joined 2026</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction(isCasis ? '/absen-diklat' : '/absen', 'STAR')}
                                    className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                                >
                                    <Zap size={16} fill="white" /> {isCasis ? 'Absen Diklat' : 'Absensi'}
                                </button>
                                <button className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"><Share2 size={18} /></button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* PROGRESS CARD */}
                <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-900">Next Rank: {progress.next}</h4>
                            <Award size={20} className="text-blue-500" />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                    <span className="text-slate-500 uppercase">PRP Points</span>
                                    <span className="text-blue-600">{progress.prpPct}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress.prpPct}%` }} className="h-full bg-blue-500" />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium italic">Butuh {progress.prpNeed} point lagi</p>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                    <span className="text-slate-500 uppercase">Duty Hours</span>
                                    <span className="text-emerald-600">{progress.hrPct}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress.hrPct}%` }} className="h-full bg-emerald-500" />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium italic">Butuh {progress.hrNeed} jam lagi</p>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ y: -4 }}
                        onClick={() => handleAction(isCasis ? '/izin-diklat' : '/laporan', 'COMPUTER')}
                        className="bg-slate-900 p-6 rounded-3xl text-white flex flex-col justify-between group"
                    >
                        <div className="flex justify-between items-start">
                            <div className="bg-white/10 p-3 rounded-2xl"><FileText size={24} /></div>
                            <ChevronRight className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold leading-tight">{isCasis ? 'Form Izin/Sakit' : 'Kirim Laporan'}</p>
                            <p className="text-slate-400 text-xs mt-1 font-medium italic">Klik untuk mengakses gateway terminal</p>
                        </div>
                    </motion.button>
                </motion.div>
            </motion.div>
        );
    }

    // ==========================================
    // 💥 RENDER MODE: NEO-BRUTALISM (GAYA LAMA)
    // ==========================================
    return (
        <motion.div
            variants={container} initial="hidden" animate="show"
            className="grid grid-cols-2 gap-6 max-w-5xl mx-auto pb-32 p-4 relative font-mono"
        >
            <TacticalTransition isVisible={navState.active} type={navState.type} />

            {/* HERO SECTION */}
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

            {/* REP POINTS */}
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

            {/* DUTY HOURS */}
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

            {/* PROMOTION PATHWAY */}
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

            {/* 🔥 ACTIONS CASIS VS POLICE */}
            {isCasis ? (
                <>
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
                </>
            ) : (
                <>
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