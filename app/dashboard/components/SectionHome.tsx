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

// 🚀 STRUKTUR PANGKAT BARU (Dari terendah ke tertinggi dengan estimasi Poin & Jam)
const RANKS_DB = [
    { name: "CASIS", prp: 0, hrs: 0 },
    { name: "RECRUIT", prp: 0, hrs: 0 },
    { name: "BHARADA", prp: 0, hrs: 0 },
    { name: "BHARATU", prp: 50, hrs: 10 },
    { name: "BHARAKA", prp: 100, hrs: 15 },
    { name: "ABRIGPOL", prp: 150, hrs: 20 },
    { name: "ABRIPTU", prp: 200, hrs: 25 },
    { name: "ABRIPDA", prp: 250, hrs: 30 },
    { name: "BRIPDA", prp: 300, hrs: 40 },
    { name: "BRIPTU", prp: 400, hrs: 50 },
    { name: "BRIPKA", prp: 500, hrs: 65 },
    { name: "AIPDA", prp: 650, hrs: 80 },
    { name: "AIPTU", prp: 800, hrs: 100 },
    { name: "IPDA", prp: 1000, hrs: 120 },
    { name: "IPTU", prp: 1250, hrs: 150 },
    { name: "AKP", prp: 1500, hrs: 180 },
    { name: "KOMPOL", prp: 1800, hrs: 220 },
    { name: "AKBP", prp: 2200, hrs: 260 },
    { name: "KOMBESPOL", prp: 2700, hrs: 320 },
    { name: "BRIGJEN", prp: 5000, hrs: 500 },
    { name: "IRJEN", prp: 7500, hrs: 750 },
    { name: "KOMJEN", prp: 10000, hrs: 1000 },
    { name: "JENDRAL", prp: 15000, hrs: 1500 },
];

// 🚀 ROLE ID KHUSUS PETINGGI DARI DISCORD
const PETINGGI_ROLE_ID = "1393377874077028493";

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
                // 🚀 PERBAIKAN FATAL: Memastikan payload sesuai dengan "userId" di API route!
                try {
                    await fetch('/api/check-role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: discordId }) // Sebelumnya "discord_id" yg membuat API gagal
                    });
                } catch (err) {
                    console.error("Gagal melakukan sync real-time ke Discord:", err);
                }

                // Setelah di-sync oleh API, tarik data terbarunya dari database
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
        setTimeout(() => {
            router.push(path);
        }, 3000);
    };

    // 🚀 PEMBERSIHAN NICKNAME (Menghapus pangkat)
    const cleanName = useMemo(() => {
        const rawName = userData.name || nickname || "OFFICER";
        return rawName.includes('|') ? rawName.split('|').pop()?.trim() : rawName;
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
            hrNeed: parseFloat(Math.max(nextR.hrs - currentHRS, 0).toFixed(1))
        };
    }, [userData]);

    const isCasis = userData.pangkat?.toUpperCase() === 'CASIS';
    const isSatlantas = userData.divisi?.toUpperCase().includes('SATLANTAS');

    // 🚀 DETEKSI BADGE
    const isPetinggi = userData.roles ? String(userData.roles).includes(PETINGGI_ROLE_ID) : false;

    // Tampilkan Divisi JIKA: Ada datanya, BUKAN tulisan "Petinggi", dan BUKAN "NON DIVISI"
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

            if (!error && count !== null) {
                setTotalTilang(count);
            }
        };

        fetchTilangMingguan();
    }, [isSatlantas, userData.discord_id, startW, endW]);

    return (
        <motion.div
            variants={container} initial="hidden" animate="show"
            className="grid grid-cols-2 gap-6 max-w-5xl mx-auto pb-32 p-4 relative"
        >
            <TacticalTransition isVisible={navState.active} type={navState.type} />

            {/* --- HERO SECTION --- */}
            <motion.div variants={item} className={`col-span-2 bg-[#3B82F6] p-6 md:p-8 ${boxBorder} ${hardShadow} relative overflow-hidden flex flex-col justify-end min-h-[240px] group`}>
                <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:rotate-12 transition-transform duration-500">
                    <Fingerprint size={160} className="text-black" />
                </div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                <div className="relative z-10">
                    <div className="bg-black text-[#00E676] px-3 py-1 inline-block text-[10px] font-black mb-3 uppercase italic border-2 border-[#00E676]">
                        {isCasis ? "Siswa Diklat Terdeteksi" : "Akses Terverifikasi"}
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-[1000] italic tracking-tighter uppercase leading-none truncate mb-5 drop-shadow-[3px_3px_0_#CCFF00]">
                        {cleanName}
                    </h1>

                    {/* 🚀 TAMPILAN 3 ROLE PRIORITAS */}
                    <div className="flex flex-wrap gap-2 md:gap-3">
                        {/* 1. BADGE PANGKAT */}
                        <span className="bg-[#FFD100] px-3 md:px-4 py-1.5 border-[3px] border-black text-[10px] md:text-[12px] font-black italic shadow-[3px_3px_0_0_#000]">
                            {userData.pangkat || 'NO RANK'}
                        </span>

                        {/* 2. BADGE DIVISI (SABHARA, SATLANTAS, BRIMOB, PROPAM) */}
                        {cleanDivisi && (
                            <span className="bg-[#CCFF00] px-3 md:px-4 py-1.5 border-[3px] border-black text-[10px] md:text-[12px] font-black italic shadow-[3px_3px_0_0_#000]">
                                {cleanDivisi}
                            </span>
                        )}

                        {/* 3. BADGE PETINGGI */}
                        {isPetinggi && (
                            <span className="bg-slate-950 text-[#00E676] px-3 md:px-4 py-1.5 border-[3px] border-black text-[10px] md:text-[12px] font-black italic shadow-[3px_3px_0_0_#00E676] flex items-center gap-1.5">
                                <Star size={14} className="fill-[#00E676] text-[#00E676]" /> PETINGGI
                            </span>
                        )}
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
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-[1000] leading-none tracking-tighter italic truncate">{userData.point_prp || 0}</h2>
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
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-[1000] leading-none tracking-tighter italic truncate">{userData.total_jam_duty || 0}</h2>
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
                            <p className={`text-lg md:text-xl font-[1000] italic uppercase leading-none ${totalTilang >= TARGET_TILANG ? 'text-[#00E676]' : 'text-[#FF4D4D]'}`}>
                                {totalTilang >= TARGET_TILANG ? 'ACHIEVED' : 'PENDING'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto relative z-10">
                        <div className="bg-black h-6 border-[3px] border-black p-[3px] shadow-[3px_3px_0_0_#000]">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${tilangPct}%` }}
                                className={`h-full border-r-2 border-black ${totalTilang >= TARGET_TILANG ? 'bg-[#00E676]' : 'bg-[#FFD100]'}`}
                            />
                        </div>
                    </div>
                </motion.div>
            )}

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