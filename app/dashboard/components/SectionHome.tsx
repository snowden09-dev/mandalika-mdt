"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { supabase } from "@/lib/supabase";
import {
    Zap, Clock, Calendar, FileText, Award,
    ChevronRight, Radar, Fingerprint, Target,
    Crosshair, Activity, ShieldAlert, TrendingUp,
    UserCheck, HelpCircle, AlertTriangle, GraduationCap, Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import TacticalTransition from './TacticalTransition';
import { format, startOfWeek, endOfWeek } from "date-fns";
import { id } from "date-fns/locale";

// 🚀 STRUKTUR PANGKAT TERBARU (+20% Beban Poin & Jam)
const RANKS_DB = [
    { name: "CASIS", prp: 0, hrs: 0 },
    { name: "RECRUIT", prp: 0, hrs: 0 },
    { name: "BHARADA", prp: 0, hrs: 0 },
    { name: "ABRIPTU", prp: 60, hrs: 12 },
    { name: "ABRIGPOL", prp: 120, hrs: 24 },
    { name: "BRIPDA", prp: 180, hrs: 36 },
    { name: "BRIPTU", prp: 300, hrs: 48 },
    { name: "BRIGPOL", prp: 420, hrs: 60 },
    { name: "BRIPKA", prp: 600, hrs: 78 },
    { name: "AIPDA", prp: 780, hrs: 96 },
    { name: "AIPTU", prp: 960, hrs: 120 },
    { name: "IPDA", prp: 1200, hrs: 144 },
    { name: "IPTU", prp: 1500, hrs: 180 },
    { name: "AKP", prp: 1800, hrs: 216 },
    { name: "KOMPOL", prp: 2160, hrs: 264 },
    { name: "AKBP", prp: 2640, hrs: 312 },
    { name: "KOMBESPOL", prp: 3240, hrs: 384 },
    { name: "BRIGJEN", prp: 6000, hrs: 600 },
    { name: "IRJEN", prp: 9000, hrs: 900 },
    { name: "KOMJEN", prp: 12000, hrs: 1200 },
    { name: "JENDRAL", prp: 18000, hrs: 1800 },
];

const PETINGGI_ROLE_ID = "1449382385090166844";

export default function SectionHome({ nickname, realtimeData }: { nickname: string, realtimeData: any }) {
    const router = useRouter();

    const [userData, setUserData] = useState<any>(realtimeData);
    const [navState, setNavState] = useState<{ active: boolean, type: 'STAR' | 'COMPUTER' }>({
        active: false,
        type: 'STAR'
    });
    const [totalTilang, setTotalTilang] = useState(0);

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

    useEffect(() => {
        const syncFreshData = async () => {
            const sessionData = localStorage.getItem('police_session');
            if (!sessionData) return;
            const parsed = JSON.parse(sessionData);
            const discordId = parsed.discord_id;

            if (discordId) {
                try {
                    await fetch('/api/check-role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: discordId })
                    });
                } catch (err) { console.error("Sync Error:", err); }

                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('discord_id', discordId)
                    .single();

                if (data && !error) {
                    setUserData(data);
                    const updatedSession = { ...parsed, ...data };
                    localStorage.setItem('police_session', JSON.stringify(updatedSession));
                }
            }
        };
        syncFreshData();
    }, []);

    const handleAction = (path: string, type: 'STAR' | 'COMPUTER') => {
        setNavState({ active: true, type });
        setTimeout(() => { router.push(path); }, 3000);
    };

    // 🚀 ENGINE PARSING NAMA DAN BADGE
    const parsedName = useMemo(() => {
        let rawName = userData.name || nickname || "OFFICER";
        let badge = null;

        // 1. Backward Compatibility: Bersihkan format lama (Pangkat | Nama)
        if (rawName.includes('|')) {
            rawName = rawName.split('|').pop()?.trim() || rawName;
        }

        // 2. Format Baru: Ekstrak Badge (#3105 Nama)
        if (rawName.startsWith('#')) {
            const spaceIndex = rawName.indexOf(' ');
            if (spaceIndex !== -1) {
                badge = rawName.substring(1, spaceIndex); // Ambil angka badge
                rawName = rawName.substring(spaceIndex + 1).trim(); // Ambil nama sisanya
            } else {
                badge = rawName.substring(1); // Kalau cuma ketik #3105 tanpa nama
                rawName = "OFFICER";
            }
        }

        return { displayName: rawName, badgeNumber: badge };
    }, [userData.name, nickname]);

    const progress = useMemo(() => {
        const currentPRP = Number(userData.point_prp) || 0;
        const currentHRS = Number(userData.total_jam_duty) || 0;
        const currentRankName = userData.pangkat?.toUpperCase() || "CASIS";
        const currentRankIndex = RANKS_DB.findIndex(r => r.name === currentRankName);
        const nextR = RANKS_DB[currentRankIndex + 1] || RANKS_DB[currentRankIndex] || RANKS_DB[0];

        return {
            next: nextR.name,
            targetPrp: nextR.prp,
            targetHrs: nextR.hrs,
            prpPct: Math.min((currentPRP / nextR.prp) * 100 || 100, 100).toFixed(0),
            hrPct: Math.min((currentHRS / nextR.hrs) * 100 || 100, 100).toFixed(0),
            prpNeed: Math.max(nextR.prp - currentPRP, 0),
            hrNeed: parseFloat(Math.max(nextR.hrs - currentHRS, 0).toFixed(1)),
            isReady: currentPRP >= nextR.prp && currentHRS >= nextR.hrs
        };
    }, [userData]);

    const isCasis = userData.pangkat?.toUpperCase() === 'CASIS';
    const isSatlantas = userData.divisi?.toUpperCase().includes('SATLANTAS');
    const isPetinggi = userData.roles ? String(userData.roles).includes(PETINGGI_ROLE_ID) : false;

    const cleanDivisi = userData.divisi &&
        userData.divisi.toUpperCase() !== 'PETINGGI' &&
        userData.divisi.toUpperCase() !== 'NON DIVISI'
        ? userData.divisi.toUpperCase()
        : null;

    const TARGET_TILANG = 15;
    const tilangPct = Math.min((totalTilang / TARGET_TILANG) * 100, 100).toFixed(0);

    const now = new Date();
    const startW = startOfWeek(now, { weekStartsOn: 1 });
    const endW = endOfWeek(now, { weekStartsOn: 1 });
    const periodText = `${format(startW, 'dd MMM')} - ${format(endW, 'dd MMM yyyy', { locale: id })}`;

    useEffect(() => {
        const fetchTilangMingguan = async () => {
            if (!isSatlantas || !userData.discord_id) return;
            const startStr = startW.toISOString();
            const endStr = endW.toISOString();

            const { count, error } = await supabase
                .from('laporan_aktivitas')
                .select('*', { count: 'exact', head: true })
                .eq('user_id_discord', userData.discord_id)
                .eq('jenis_laporan', 'Penilangan')
                .eq('status', 'APPROVED')
                .gte('created_at', startStr)
                .lte('created_at', endStr);

            if (!error && count !== null) setTotalTilang(count);
        };
        fetchTilangMingguan();
    }, [isSatlantas, userData.discord_id, startW, endW]);

    // 🎨 INLINE STYLE UNTUK RPG BAR
    const stripeBg = {
        backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)',
        backgroundSize: '20px 20px'
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-6 max-w-5xl mx-auto pb-32 p-4 relative pt-4 md:pt-8">
            <TacticalTransition isVisible={navState.active} type={navState.type} />

            {/* --- HERO SECTION --- */}
            <motion.div variants={item} className={`col-span-2 bg-[#3B82F6] p-6 md:p-8 ${boxBorder} ${hardShadow} relative flex flex-col justify-end min-h-[240px] group`} style={{ zIndex: 10 }}>

                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:rotate-12 transition-transform duration-500 overflow-hidden">
                    <Fingerprint size={160} className="text-black" />
                </div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                <div className="relative z-10 mt-10 md:mt-0">
                    <motion.div animate={{ opacity: [1, 0.7, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="bg-black text-[#00E676] px-3 py-1 inline-block text-[10px] font-black mb-3 uppercase italic border-2 border-[#00E676] shadow-[0_0_15px_rgba(0,230,118,0.6)]">
                        {isCasis ? "Siswa Diklat Terdeteksi" : "Akses Terverifikasi"}
                    </motion.div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-[1000] italic tracking-tighter uppercase leading-none truncate mb-5 text-white" style={{ textShadow: '4px 4px 0 #000, 2px 2px 0 #CCFF00' }}>
                        {parsedName.displayName}
                    </h1>

                    <div className="flex flex-wrap gap-2 md:gap-3">
                        {/* 1. RANK TAG */}
                        <span className="relative overflow-hidden bg-[#FFD100] px-3 md:px-4 py-1.5 border-[3px] border-black text-[10px] md:text-[12px] font-black italic shadow-[3px_3px_0_0_#000]">
                            <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }} className="absolute inset-0 w-full bg-white/70 skew-x-12" />
                            {userData.pangkat || 'NO RANK'}
                        </span>

                        {/* 2. BADGE TAG (NEW) */}
                        {parsedName.badgeNumber && (
                            <span className="bg-white text-black px-3 md:px-4 py-1.5 border-[3px] border-black text-[10px] md:text-[12px] font-black italic shadow-[3px_3px_0_0_#000]">
                                BADGE #{parsedName.badgeNumber}
                            </span>
                        )}

                        {/* 3. DIVISI TAG */}
                        {cleanDivisi && (
                            <span className="bg-[#CCFF00] px-3 md:px-4 py-1.5 border-[3px] border-black text-[10px] md:text-[12px] font-black italic shadow-[3px_3px_0_0_#000]">
                                {cleanDivisi}
                            </span>
                        )}

                        {/* 4. PETINGGI TAG */}
                        {isPetinggi && (
                            <span className="bg-slate-950 text-[#00E676] px-3 md:px-4 py-1.5 border-[3px] border-black text-[10px] md:text-[12px] font-black italic shadow-[3px_3px_0_0_#00E676] flex items-center gap-1.5">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}><Star size={14} className="fill-[#00E676] text-[#00E676]" /></motion.div> PETINGGI
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* --- BIG STATS: REP POINTS --- */}
            <motion.div variants={item} className={`bg-[#FFD100] p-4 md:p-6 ${boxBorder} ${hardShadow} flex flex-col relative group overflow-hidden`}>
                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute -right-2 -top-2 opacity-15">
                    <Zap size={100} />
                </motion.div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <p className="text-[10px] md:text-[12px] font-black uppercase italic text-black bg-black/10 px-2 py-1">Reputation Points</p>
                    <TrendingUp size={24} className="hidden md:block" />
                </div>
                <div className="relative z-10 mb-4">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-[1000] leading-none tracking-tighter italic truncate drop-shadow-[2px_2px_0_#fff]">
                        {userData.point_prp || 0}
                    </h2>
                    <p className="text-[10px] md:text-xs font-black uppercase italic mt-1 text-black/60">Points Collected</p>
                </div>
                <div className="mt-auto relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                        <span>Progress</span><span>{progress.prpPct}%</span>
                    </div>
                    {/* 🚀 RPG EXP BAR PURE FRAMER MOTION */}
                    <div className="bg-slate-900 h-6 border-[3px] border-black p-[3px] shadow-[3px_3px_0_0_#000] rounded-sm overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.prpPct}%`, backgroundPosition: ["0px 0px", "40px 0px"] }}
                            transition={{ width: { duration: 1.5, ease: "easeOut" }, backgroundPosition: { repeat: Infinity, duration: 1, ease: "linear" } }}
                            style={stripeBg}
                            className="h-full bg-[#00E676] border-r-[3px] border-black"
                        />
                    </div>
                </div>
            </motion.div>

            {/* --- BIG STATS: DUTY HOURS --- */}
            <motion.div variants={item} className={`bg-[#00E676] p-4 md:p-6 ${boxBorder} ${hardShadow} flex flex-col relative group overflow-hidden`}>
                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 1 }} className="absolute -right-2 -top-2 opacity-15">
                    <Activity size={100} />
                </motion.div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <p className="text-[10px] md:text-[12px] font-black uppercase italic text-black bg-black/10 px-2 py-1">Duty Records</p>
                    <Clock size={24} className="hidden md:block" />
                </div>
                <div className="relative z-10 mb-4">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-[1000] leading-none tracking-tighter italic truncate drop-shadow-[2px_2px_0_#fff]">
                        {userData.total_jam_duty || 0}
                    </h2>
                    <p className="text-[10px] md:text-xs font-black uppercase italic mt-1 text-black/60">Total Hours</p>
                </div>
                <div className="mt-auto relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                        <span>Active Time</span><span>{progress.hrPct}%</span>
                    </div>
                    {/* 🚀 RPG EXP BAR PURE FRAMER MOTION */}
                    <div className="bg-slate-900 h-6 border-[3px] border-black p-[3px] shadow-[3px_3px_0_0_#000] rounded-sm overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.hrPct}%`, backgroundPosition: ["0px 0px", "40px 0px"] }}
                            transition={{ width: { duration: 1.5, ease: "easeOut" }, backgroundPosition: { repeat: Infinity, duration: 1, ease: "linear" } }}
                            style={stripeBg}
                            className="h-full bg-[#FF4D4D] border-r-[3px] border-black"
                        />
                    </div>
                </div>
            </motion.div>

            {/* --- PROMOTION PATHWAY --- */}
            <motion.div variants={item} className={`col-span-2 bg-white p-4 md:p-6 ${boxBorder} ${hardShadow} relative group overflow-hidden`}>
                <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                    <Target size={180} />
                </div>
                <div className="flex items-center gap-4 md:gap-6 mb-6 relative z-10">
                    <motion.div animate={progress.isReady ? { y: [0, -5, 0] } : {}} transition={{ repeat: Infinity, duration: 1 }} className="bg-[#A78BFA] p-3 md:p-4 border-[4px] border-black shadow-[6px_6px_0_0_#000] -rotate-2 group-hover:rotate-0 transition-transform">
                        <Award size={32} className="md:w-10 md:h-10" />
                    </motion.div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] md:text-[11px] font-black opacity-50 italic uppercase leading-none mb-2">
                            {progress.isReady ? "Status: MEMENUHI SYARAT" : (isCasis ? "Kelulusan Siswa Diklat" : "Next Promotion Goal")}
                        </p>
                        <h3 className={`text-2xl sm:text-3xl md:text-4xl font-[1000] italic leading-none tracking-tighter truncate ${progress.isReady ? 'text-[#00E676] drop-shadow-[2px_2px_0_#000]' : 'text-black'}`}>
                            {progress.next}
                        </h3>
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

            {/* --- 🔥 KHUSUS SATLANTAS: TARGET PENILANGAN --- */}
            {isSatlantas && !isCasis && (
                <motion.div variants={item} className={`col-span-2 bg-[#F97316] p-4 md:p-6 ${boxBorder} ${hardShadow} relative group overflow-hidden`}>
                    <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Crosshair size={180} />
                    </div>

                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="bg-black text-[#F97316] px-3 py-1 inline-block text-[10px] font-black uppercase italic border-2 border-black">
                            Traffic Enforcement
                        </div>
                        <p className="text-[10px] md:text-[11px] font-black uppercase bg-white border-2 border-black px-3 py-1 shadow-[3px_3px_0px_#000]">
                            {periodText}
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                        <div>
                            <h3 className="text-5xl md:text-6xl font-[1000] italic leading-none tracking-tighter text-white drop-shadow-[3px_3px_0_#000]">
                                {totalTilang} <span className="text-3xl md:text-4xl text-black">/ {TARGET_TILANG}</span>
                            </h3>
                            <p className="text-[10px] md:text-xs font-black uppercase italic mt-1 text-black">Kendaraan Ditilang</p>
                        </div>
                        <div className="bg-white p-3 md:p-4 border-[4px] border-black shadow-[5px_5px_0px_#000] shrink-0 text-center transform group-hover:-translate-y-1 transition-transform">
                            <p className="text-[9px] md:text-[10px] font-black opacity-50 uppercase mb-1">Status Target</p>
                            <motion.p animate={totalTilang >= TARGET_TILANG ? { scale: [1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }} className={`text-lg md:text-xl font-[1000] italic uppercase leading-none ${totalTilang >= TARGET_TILANG ? 'text-[#00E676]' : 'text-[#FF4D4D]'}`}>
                                {totalTilang >= TARGET_TILANG ? 'ACHIEVED' : 'PENDING'}
                            </motion.p>
                        </div>
                    </div>

                    <div className="mt-auto relative z-10">
                        <div className="bg-slate-900 h-6 border-[3px] border-black p-[3px] shadow-[3px_3px_0_0_#000] rounded-sm overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${tilangPct}%`, backgroundPosition: ["0px 0px", "40px 0px"] }}
                                transition={{ width: { duration: 1.5 }, backgroundPosition: { repeat: Infinity, duration: 1, ease: "linear" } }}
                                style={stripeBg}
                                className={`h-full border-r-[3px] border-black ${totalTilang >= TARGET_TILANG ? 'bg-[#00E676]' : 'bg-[#FFD100]'}`}
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* --- 🔥 CONDITIONAL ACTIONS: CASIS VS POLICE --- */}
            {isCasis ? (
                <>
                    <motion.button variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction('/absen-diklat', 'STAR')} className={`bg-[#A3E635] p-6 md:p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group relative overflow-hidden`}>
                        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bg-white/30 w-32 h-32 rounded-full blur-2xl z-0" />
                        <div className="bg-white p-3 md:p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#FFD100] transition-all group-hover:rotate-12 relative z-10">
                            <GraduationCap size={40} className="md:w-12 md:h-12 text-black" />
                        </div>
                        <span className="text-lg md:text-xl font-[1000] italic uppercase tracking-widest text-black drop-shadow-[2px_2px_0_#fff] relative z-10">Absen Diklat</span>
                    </motion.button>

                    <motion.button variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction('/izin-diklat', 'COMPUTER')} className={`bg-[#FFD100] p-6 md:p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group relative overflow-hidden`}>
                        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} className="absolute bg-white/30 w-32 h-32 rounded-full blur-2xl z-0" />
                        <div className="bg-white p-3 md:p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#CCFF00] transition-all group-hover:-rotate-12 relative z-10">
                            <HelpCircle size={40} className="md:w-12 md:h-12 text-black" />
                        </div>
                        <span className="text-lg md:text-xl font-[1000] italic uppercase tracking-widest text-black drop-shadow-[2px_2px_0_#fff] relative z-10">Izin/Sakit</span>
                    </motion.button>
                </>
            ) : (
                <>
                    <motion.button variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction('/absen', 'STAR')} className={`bg-[#FF4D4D] p-6 md:p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group relative overflow-hidden`}>
                        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bg-white/30 w-40 h-40 rounded-full blur-2xl z-0" />
                        <div className="bg-white p-3 md:p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#FFD100] transition-all group-hover:-rotate-12 relative z-10">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }}>
                                <Radar size={40} className="md:w-12 md:h-12 text-black" />
                            </motion.div>
                        </div>
                        <span className="text-lg md:text-xl font-[1000] italic uppercase tracking-widest text-white drop-shadow-[2px_2px_0_#000] relative z-10">Absensi</span>
                    </motion.button>

                    <motion.button variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction('/laporan', 'COMPUTER')} className={`bg-[#A78BFA] p-6 md:p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group relative overflow-hidden`}>
                        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} className="absolute bg-white/30 w-40 h-40 rounded-full blur-2xl z-0" />
                        <div className="bg-white p-3 md:p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#CCFF00] transition-all group-hover:rotate-12 relative z-10">
                            <FileText size={40} className="md:w-12 md:h-12 text-black" />
                        </div>
                        <span className="text-lg md:text-xl font-[1000] italic uppercase tracking-widest text-white drop-shadow-[2px_2px_0_#000] relative z-10">Laporan</span>
                    </motion.button>
                </>
            )}
        </motion.div>
    );
}