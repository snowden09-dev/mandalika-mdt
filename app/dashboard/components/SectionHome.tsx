"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { supabase } from "@/lib/supabase";
import {
    Zap, Clock, FileText, Award, Radar, Fingerprint, Target,
    Activity, Crosshair, HelpCircle, GraduationCap, Star,
    ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import TacticalTransition from './TacticalTransition';
import { format, startOfWeek, endOfWeek } from "date-fns";
import { id } from "date-fns/locale";
import { toast, Toaster } from "sonner";

// --- STRUKTUR PANGKAT ---
const RANKS_DB = [
    { name: "CASIS", prp: 0, hrs: 0 },
    { name: "RECRUIT", prp: 0, hrs: 0 },
    { name: "BHARADA", prp: 0, hrs: 0 },
    { name: "ABRIPTU", prp: 180, hrs: 30 },
    { name: "ABRIGPOL", prp: 250, hrs: 40 },
    { name: "BRIPDA", prp: 320, hrs: 50 },
    { name: "BRIPTU", prp: 400, hrs: 60 },
    { name: "BRIGPOL", prp: 550, hrs: 75 },
    { name: "BRIPKA", prp: 700, hrs: 90 },
    { name: "AIPDA", prp: 850, hrs: 110 },
    { name: "AIPTU", prp: 1000, hrs: 130 },
    { name: "IPDA", prp: 1200, hrs: 150 },
    { name: "IPTU", prp: 1500, hrs: 180 },
    { name: "AKP", prp: 1800, hrs: 220 },
    { name: "KOMPOL", prp: 2200, hrs: 260 },
    { name: "AKBP", prp: 2800, hrs: 320 },
    { name: "KOMBESPOL", prp: 3500, hrs: 400 },
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

    // Modern Framer Motion Variants
    const container: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const item: Variants = {
        hidden: { y: 15, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    // Styling Constants (Clean Minimalist Dark Mode)
    const cardBase = "bg-[#18181B] border border-white/5 rounded-[28px] overflow-hidden relative flex flex-col p-5 md:p-6 shadow-xl shadow-black/20";
    const glassPill = "bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] md:text-xs font-medium text-white/90 flex items-center gap-1.5";

    useEffect(() => {
        const syncFreshData = async () => {
            const sessionData = localStorage.getItem('police_session');
            if (!sessionData) return;
            const parsed = JSON.parse(sessionData);
            const discordId = parsed.discord_id;
            const currentLocalRank = parsed.pangkat?.toUpperCase();

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
                    let finalData = { ...data };
                    const newRank = data.pangkat?.toUpperCase();

                    if (currentLocalRank && newRank && currentLocalRank !== newRank) {
                        const oldRankIndex = RANKS_DB.findIndex(r => r.name === currentLocalRank);
                        const newRankIndex = RANKS_DB.findIndex(r => r.name === newRank);

                        if (newRankIndex > oldRankIndex && oldRankIndex !== -1) {
                            await supabase
                                .from('users')
                                .update({ point_prp: 0, total_jam_duty: 0 })
                                .eq('discord_id', discordId);

                            finalData.point_prp = 0;
                            finalData.total_jam_duty = 0;

                            toast.success(`Naik Pangkat: ${newRank}`, {
                                description: "Poin PRP dan Jam Duty telah di-reset untuk jenjang berikutnya."
                            });
                        }
                    }

                    setUserData(finalData);
                    const updatedSession = { ...parsed, ...finalData };
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

    // Engine Parsing
    const parsedName = useMemo(() => {
        let rawName = userData.name || nickname || "Officer";
        let badge = null;

        if (rawName.includes('|')) {
            rawName = rawName.split('|').pop()?.trim() || rawName;
        }

        if (rawName.startsWith('#')) {
            const spaceIndex = rawName.indexOf(' ');
            if (spaceIndex !== -1) {
                badge = rawName.substring(1, spaceIndex);
                rawName = rawName.substring(spaceIndex + 1).trim();
            } else {
                badge = rawName.substring(1);
                rawName = "Officer";
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
    const cleanDivisi = userData.divisi && userData.divisi.toUpperCase() !== 'PETINGGI' && userData.divisi.toUpperCase() !== 'NON DIVISI' ? userData.divisi : null;

    const TARGET_TILANG = 15;
    const tilangPct = Math.min((totalTilang / TARGET_TILANG) * 100, 100).toFixed(0);

    const now = new Date();
    const startW = startOfWeek(now, { weekStartsOn: 1 });
    const endW = endOfWeek(now, { weekStartsOn: 1 });
    const periodText = `${format(startW, 'dd MMM')} - ${format(endW, 'dd MMM', { locale: id })}`;

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

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto pb-32 p-4 pt-6 md:pt-10 text-white">
            <Toaster position="top-center" richColors theme="dark" />
            <TacticalTransition isVisible={navState.active} type={navState.type} />

            {/* --- HERO SECTION --- */}
            <motion.div variants={item} className={`col-span-2 ${cardBase} min-h-[220px] bg-gradient-to-br from-[#18181B] to-[#09090B]`}>
                <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                    <Fingerprint size={200} className="text-white" />
                </div>

                <div className="relative z-10 flex flex-col h-full justify-end mt-12 md:mt-0">
                    <div className="mb-4">
                        <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${isCasis ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            {isCasis ? "Siswa Diklat" : "Akses Terverifikasi"}
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        {parsedName.displayName}
                    </h1>

                    <div className="flex flex-wrap gap-2">
                        <span className={glassPill}>
                            <Award size={14} className="text-blue-400" />
                            {userData.pangkat || 'NO RANK'}
                        </span>

                        {parsedName.badgeNumber && (
                            <span className={glassPill}>
                                Badge #{parsedName.badgeNumber}
                            </span>
                        )}

                        {cleanDivisi && (
                            <span className={glassPill}>
                                {cleanDivisi}
                            </span>
                        )}

                        {isPetinggi && (
                            <span className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-[11px] md:text-xs font-medium text-amber-400 flex items-center gap-1.5">
                                <Star size={14} className="fill-amber-400" />
                                Petinggi
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* --- BIG STATS: REP POINTS --- */}
            <motion.div variants={item} className={`col-span-1 ${cardBase} group`}>
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <Zap size={80} />
                </div>
                <div className="flex justify-between items-start mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Zap size={20} className="text-blue-400" />
                    </div>
                </div>
                <div className="relative z-10 mb-4">
                    <p className="text-xs text-zinc-400 font-medium mb-1">Reputation Points</p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                        {userData.point_prp || 0}
                    </h2>
                </div>
                <div className="mt-auto pt-2">
                    <div className="flex justify-between text-[10px] text-zinc-400 font-medium mb-1.5">
                        <span>Progress</span>
                        <span>{progress.prpPct}%</span>
                    </div>
                    <div className="w-full bg-zinc-800/50 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${progress.prpPct}%` }} 
                            transition={{ duration: 1, ease: "easeOut" }} 
                            className="h-full bg-blue-500 rounded-full" 
                        />
                    </div>
                </div>
            </motion.div>

            {/* --- BIG STATS: DUTY HOURS --- */}
            <motion.div variants={item} className={`col-span-1 ${cardBase} group`}>
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <Activity size={80} />
                </div>
                <div className="flex justify-between items-start mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Clock size={20} className="text-emerald-400" />
                    </div>
                </div>
                <div className="relative z-10 mb-4">
                    <p className="text-xs text-zinc-400 font-medium mb-1">Duty Records</p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                        {userData.total_jam_duty || 0}
                    </h2>
                </div>
                <div className="mt-auto pt-2">
                    <div className="flex justify-between text-[10px] text-zinc-400 font-medium mb-1.5">
                        <span>Active Time</span>
                        <span>{progress.hrPct}%</span>
                    </div>
                    <div className="w-full bg-zinc-800/50 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${progress.hrPct}%` }} 
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }} 
                            className="h-full bg-emerald-500 rounded-full" 
                        />
                    </div>
                </div>
            </motion.div>

            {/* --- PROMOTION PATHWAY --- */}
            <motion.div variants={item} className={`col-span-2 ${cardBase} border-white/10 bg-zinc-900/50 backdrop-blur-xl`}>
                <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none">
                    <Target size={160} className="translate-x-4 -translate-y-4" />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2 relative z-10">
                    <div>
                        <p className="text-xs text-zinc-400 font-medium mb-1">
                            {progress.isReady ? "Siap Naik Pangkat" : (isCasis ? "Target Kelulusan" : "Target Pangkat Selanjutnya")}
                        </p>
                        <h3 className={`text-2xl md:text-3xl font-bold tracking-tight ${progress.isReady ? 'text-emerald-400' : 'text-white'}`}>
                            {progress.next}
                        </h3>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="bg-zinc-800/50 rounded-2xl p-3 px-4 flex flex-col items-center justify-center min-w-[90px]">
                            <span className="text-zinc-400 text-[10px] mb-1 font-medium">Kurang PRP</span>
                            <span className="font-bold text-lg leading-none">{progress.prpNeed}</span>
                        </div>
                        <div className="bg-zinc-800/50 rounded-2xl p-3 px-4 flex flex-col items-center justify-center min-w-[90px]">
                            <span className="text-zinc-400 text-[10px] mb-1 font-medium">Kurang Jam</span>
                            <span className="font-bold text-lg leading-none">{progress.hrNeed}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* --- KHUSUS SATLANTAS --- */}
            {isSatlantas && !isCasis && (
                <motion.div variants={item} className={`col-span-2 ${cardBase} bg-gradient-to-br from-orange-950/30 to-zinc-900 border-orange-500/20`}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Crosshair size={16} className="text-orange-500" />
                            </div>
                            <span className="text-sm font-semibold text-orange-400">Target Mingguan</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium bg-zinc-800/50 px-2.5 py-1 rounded-md">{periodText}</span>
                    </div>

                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <h3 className="text-3xl md:text-4xl font-bold">
                                {totalTilang} <span className="text-xl md:text-2xl text-zinc-500">/ {TARGET_TILANG}</span>
                            </h3>
                            <p className="text-[11px] text-zinc-400 mt-1">Kendaraan Ditilang</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${totalTilang >= TARGET_TILANG ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                            {totalTilang >= TARGET_TILANG ? 'Tercapai' : 'Proses'}
                        </div>
                    </div>

                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${tilangPct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${totalTilang >= TARGET_TILANG ? 'bg-emerald-500' : 'bg-orange-500'}`}
                        />
                    </div>
                </motion.div>
            )}

            {/* --- ACTIONS --- */}
            <div className="col-span-2 grid grid-cols-2 gap-4 md:gap-6 mt-2">
                {isCasis ? (
                    <>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('/absen-diklat', 'STAR')} className="bg-blue-600 hover:bg-blue-500 transition-colors p-4 md:p-6 rounded-[24px] flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                            <GraduationCap size={28} className="text-white" />
                            <span className="text-sm md:text-base font-semibold text-white">Absen Diklat</span>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('/izin-diklat', 'COMPUTER')} className="bg-zinc-800 hover:bg-zinc-700 transition-colors p-4 md:p-6 rounded-[24px] flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                            <HelpCircle size={28} className="text-zinc-300" />
                            <span className="text-sm md:text-base font-semibold text-zinc-200">Izin / Sakit</span>
                        </motion.button>
                    </>
                ) : (
                    <>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('/absen', 'STAR')} className="bg-blue-600 hover:bg-blue-500 transition-colors p-4 md:p-6 rounded-[24px] flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 relative overflow-hidden group col-span-1 shadow-lg shadow-blue-900/20">
                            <div className="flex flex-col items-center sm:items-start gap-1">
                                <Radar size={24} className="text-white/80 hidden sm:block mb-1" />
                                <span className="text-sm md:text-base font-semibold text-white">Absensi</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center sm:group-hover:translate-x-1 transition-transform">
                                <ArrowRight size={18} className="text-white" />
                            </div>
                        </motion.button>

                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('/laporan', 'COMPUTER')} className="bg-zinc-800 hover:bg-zinc-700 transition-colors p-4 md:p-6 rounded-[24px] flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 relative overflow-hidden group col-span-1">
                            <div className="flex flex-col items-center sm:items-start gap-1">
                                <FileText size={24} className="text-zinc-400 hidden sm:block mb-1" />
                                <span className="text-sm md:text-base font-semibold text-zinc-200">Laporan</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center sm:group-hover:translate-x-1 transition-transform">
                                <ArrowRight size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
                            </div>
                        </motion.button>
                    </>
                )}
            </div>
        </motion.div>
    );
}