"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
    Zap, Clock, FileText, Award, Radar, Fingerprint, Target,
    Activity, TrendingUp, BookOpen, Scale, Info, LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import TacticalTransition from './TacticalTransition';
import { supabase } from '@/lib/supabase';

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
    const [navState, setNavState] = useState<{ active: boolean, type: 'STAR' | 'COMPUTER' }>({ active: false, type: 'STAR' });

    // 🚀 STATE UNTUK DROPDOWN PROFIL
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const boxBorder = "border-[4.5px] border-black";
    const hardShadow = "shadow-[10px_10px_0px_#000]";

    const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const item: Variants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } } };

    // FUNGSI TUTUP DROPDOWN JIKA KLIK DI LUAR
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAction = (path: string, type: 'STAR' | 'COMPUTER') => {
        setNavState({ active: true, type });
        setTimeout(() => router.push(path), 3000);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('police_session');
        router.push('/');
    };

    const progress = useMemo(() => {
        const currentPRP = Number(realtimeData.point_prp) || 0;
        const currentHRS = Number(realtimeData.total_jam_duty) || 0;
        const currentRankName = realtimeData.pangkat?.toUpperCase() || "RECRUIT";
        const currentRankIndex = RANKS_DB.findIndex(r => r.name === currentRankName);
        const nextR = RANKS_DB[currentRankIndex + 1] || RANKS_DB[currentRankIndex];

        return {
            next: nextR.name,
            targetPrp: nextR.prp, targetHrs: nextR.hrs,
            prpPct: Math.min((currentPRP / nextR.prp) * 100 || 100, 100).toFixed(0),
            hrPct: Math.min((currentHRS / nextR.hrs) * 100 || 100, 100).toFixed(0),
            prpNeed: Math.max(nextR.prp - currentPRP, 0),
            hrNeed: Math.max(nextR.hrs - currentHRS, 0)
        };
    }, [realtimeData]);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-6 max-w-5xl mx-auto pb-32 p-4 pt-16 relative">
            <TacticalTransition isVisible={navState.active} type={navState.type} />

            {/* 🚀 FOTO PROFIL MURNI SEBAGAI TOMBOL (ABSOLUTE TOP RIGHT) */}
            <div className="absolute top-2 right-4 z-[100]" ref={dropdownRef}>
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="outline-none hover:-translate-y-1 active:translate-y-0 transition-transform relative group"
                >
                    {/* Fotonya langsung dikasih border tebal dan shadow gaya Neo-Brutalism */}
                    <img
                        src={realtimeData.image || "https://cdn.discordapp.com/embed/avatars/0.png"}
                        alt="Profile"
                        className={`w-14 h-14 rounded-[18px] object-cover bg-slate-200 border-[3.5px] border-black shadow-[4px_4px_0_0_#000] group-hover:shadow-[6px_6px_0_0_#000] transition-shadow`}
                    />

                    {/* Indikator Online Hijau Kecil */}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00E676] border-2 border-black rounded-full shadow-[2px_2px_0_0_#000]"></span>
                </button>

                <AnimatePresence>
                    {isProfileOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute top-20 right-0 w-64 bg-white ${boxBorder} rounded-2xl shadow-[8px_8px_0_0_#000] p-2 flex flex-col gap-1`}
                        >
                            <div className="p-3 border-b-4 border-black mb-2 bg-slate-950 text-white rounded-xl">
                                <p className="text-[10px] font-black italic uppercase tracking-widest opacity-50">Log In As:</p>
                                <p className="text-sm font-black truncate">{nickname}</p>
                            </div>

                            <button onClick={() => router.push('/panduan')} className="flex items-center gap-3 p-3 hover:bg-[#CCFF00] rounded-xl border-2 border-transparent hover:border-black transition-all group">
                                <div className="bg-blue-100 p-1.5 border-2 border-black rounded-lg group-hover:bg-blue-500 group-hover:text-white"><BookOpen size={16} /></div>
                                <span className="font-black text-xs uppercase italic">Panduan Sistem</span>
                            </button>

                            <button onClick={() => router.push('/sop')} className="flex items-center gap-3 p-3 hover:bg-[#CCFF00] rounded-xl border-2 border-transparent hover:border-black transition-all group">
                                <div className="bg-emerald-100 p-1.5 border-2 border-black rounded-lg group-hover:bg-emerald-500 group-hover:text-white"><FileText size={16} /></div>
                                <span className="font-black text-xs uppercase italic">SOP Anggota</span>
                            </button>

                            <button onClick={() => router.push('/uu')} className="flex items-center gap-3 p-3 hover:bg-[#CCFF00] rounded-xl border-2 border-transparent hover:border-black transition-all group">
                                <div className="bg-amber-100 p-1.5 border-2 border-black rounded-lg group-hover:bg-amber-500 group-hover:text-white"><Scale size={16} /></div>
                                <span className="font-black text-xs uppercase italic">UU Kepolisian</span>
                            </button>

                            <button onClick={() => router.push('/about')} className="flex items-center gap-3 p-3 hover:bg-[#CCFF00] rounded-xl border-2 border-transparent hover:border-black transition-all group">
                                <div className="bg-purple-100 p-1.5 border-2 border-black rounded-lg group-hover:bg-purple-500 group-hover:text-white"><Info size={16} /></div>
                                <span className="font-black text-xs uppercase italic">About MDT</span>
                            </button>

                            <div className="h-1 bg-black my-1 rounded-full" />

                            <button onClick={handleLogout} className="flex items-center gap-3 p-3 hover:bg-red-500 hover:text-white rounded-xl border-2 border-transparent hover:border-black transition-all group">
                                <div className="bg-red-100 p-1.5 border-2 border-black rounded-lg group-hover:bg-white group-hover:text-red-600"><LogOut size={16} /></div>
                                <span className="font-black text-xs uppercase italic">Cabut Kabel (Logout)</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:rotate-45 transition-transform"><Zap size={100} /></div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <p className="text-[12px] font-black uppercase italic text-black bg-black/10 px-2 py-1">Reputation Points</p>
                    <TrendingUp size={24} />
                </div>
                <div className="relative z-10 mb-4">
                    <h2 className="text-7xl font-[1000] leading-none tracking-tighter italic">{realtimeData.point_prp}</h2>
                    <p className="text-xs font-black uppercase italic mt-1 text-black/60">Points Collected</p>
                </div>
                <div className="mt-auto relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase mb-1"><span>Progress</span><span>{progress.prpPct}%</span></div>
                    <div className="bg-black h-6 border-[3px] border-black p-[3px] shadow-[3px_3px_0_0_#000]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress.prpPct}%` }} className="h-full bg-[#00E676] border-r-2 border-black" />
                    </div>
                </div>
            </motion.div>

            {/* --- BIG STATS: DUTY HOURS --- */}
            <motion.div variants={item} className={`bg-[#00E676] p-6 ${boxBorder} ${hardShadow} flex flex-col relative group overflow-hidden`}>
                <div className="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform"><Activity size={100} /></div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <p className="text-[12px] font-black uppercase italic text-black bg-black/10 px-2 py-1">Duty Records</p>
                    <Clock size={24} />
                </div>
                <div className="relative z-10 mb-4">
                    <h2 className="text-7xl font-[1000] leading-none tracking-tighter italic">{realtimeData.total_jam_duty}</h2>
                    <p className="text-xs font-black uppercase italic mt-1 text-black/60">Total Hours</p>
                </div>
                <div className="mt-auto relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase mb-1"><span>Active Time</span><span>{progress.hrPct}%</span></div>
                    <div className="bg-black h-6 border-[3px] border-black p-[3px] shadow-[3px_3px_0_0_#000]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress.hrPct}%` }} className="h-full bg-[#FF4D4D] border-r-2 border-black" />
                    </div>
                </div>
            </motion.div>

            {/* --- PROMOTION PATHWAY --- */}
            <motion.div variants={item} className={`col-span-2 bg-white p-6 ${boxBorder} ${hardShadow} relative group overflow-hidden`}>
                <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-125 transition-transform duration-1000"><Target size={180} /></div>
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

            {/* --- ACTION BUTTONS --- */}
            <motion.button variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction('/absen', 'STAR')} className={`bg-[#FF4D4D] p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group`}>
                <div className="bg-white p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#FFD100] transition-all group-hover:-rotate-12"><Radar size={48} className="animate-spin-slow text-black" /></div>
                <span className="text-xl font-[1000] italic uppercase tracking-widest text-white drop-shadow-[2px_2px_0_#000]">Absensi</span>
            </motion.button>
            <motion.button variants={item} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction('/laporan', 'COMPUTER')} className={`bg-[#A78BFA] p-8 ${boxBorder} ${hardShadow} flex flex-col items-center justify-center gap-4 group`}>
                <div className="bg-white p-4 border-[4px] border-black shadow-[5px_5px_0_0_#000] group-hover:bg-[#CCFF00] transition-all group-hover:rotate-12"><FileText size={48} className="text-black" /></div>
                <span className="text-xl font-[1000] italic uppercase tracking-widest text-white drop-shadow-[2px_2px_0_#000]">Laporan</span>
            </motion.button>

            <style jsx global>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 8s linear infinite; }`}</style>
        </motion.div>
    );
}