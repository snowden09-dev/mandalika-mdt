"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Users, Shield, Zap, Clock, CheckCircle2, Loader2, AlertCircle, Crosshair } from 'lucide-react';
import { startOfWeek, endOfWeek } from "date-fns";

const boxBorder = "border-[3px] border-slate-950";
const hardShadow = "shadow-[4px_4px_0px_#000]";

type DivisionType = 'SATLANTAS' | 'SABHARA' | 'BRIMOB' | 'PROPAM';

export default function SectionAdminDivisi() {
    const [activeDiv, setActiveDiv] = useState<DivisionType>('SATLANTAS');
    const [members, setMembers] = useState<any[]>([]);
    const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async (divName: string) => {
        setLoading(true);
        // 1. Ambil Data Anggota Sesuai Divisi
        const { data: usersData } = await supabase
            .from('users')
            .select('*')
            .ilike('divisi', `%${divName}%`)
            .order('name', { ascending: true });

        if (usersData) setMembers(usersData);

        // 2. Jika Satlantas, ambil laporan Penilangan khusus minggu ini
        if (divName === 'SATLANTAS') {
            const now = new Date();
            const startW = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
            const endW = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

            const { data: reportsData } = await supabase
                .from('laporan_aktivitas')
                .select('user_id_discord')
                .eq('jenis_laporan', 'Penilangan')
                .eq('status', 'APPROVED')
                .gte('created_at', startW)
                .lte('created_at', endW);

            if (reportsData) setWeeklyReports(reportsData);
        } else {
            setWeeklyReports([]);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData(activeDiv);
    }, [activeDiv]);

    // Format Data & Kalkulasi
    const memberStats = useMemo(() => {
        return members.map(member => {
            const prp = Number(member.point_prp) || 0;
            const hours = Number(member.total_jam_duty) || 0;

            if (activeDiv === 'SATLANTAS') {
                const tilangCount = weeklyReports.filter(r => r.user_id_discord === member.discord_id).length;
                const TARGET = 15;
                return { ...member, tilangCount, isAchieved: tilangCount >= TARGET, pct: Math.min((tilangCount / TARGET) * 100, 100), prp, hours };
            }

            return { ...member, prp, hours };
        });
    }, [members, weeklyReports, activeDiv]);

    return (
        <div className="space-y-6 font-mono pb-20">
            {/* SUB-NAVIGASI DIVISI */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
                {(['SATLANTAS', 'SABHARA', 'BRIMOB', 'PROPAM'] as DivisionType[]).map((div) => (
                    <button
                        key={div}
                        onClick={() => setActiveDiv(div)}
                        className={`px-4 py-2.5 rounded-xl border-[3px] border-black font-[1000] text-xs uppercase italic transition-all whitespace-nowrap shadow-[3px_3px_0px_#000] active:translate-y-px active:shadow-none ${activeDiv === div ? 'bg-slate-950 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
                    >
                        {div}
                    </button>
                ))}
            </div>

            {/* HEADER DIVISI */}
            <div className={`bg-slate-950 p-6 rounded-[20px] border-[3.5px] border-slate-950 shadow-[6px_6px_0px_#3B82F6] text-white relative overflow-hidden`}>
                <div className="relative z-10">
                    <h2 className="text-xl md:text-2xl font-[1000] italic uppercase tracking-tighter flex items-center gap-3">
                        <Shield size={28} className={activeDiv === 'SATLANTAS' ? 'text-orange-500' : 'text-blue-500'} />
                        {activeDiv} COMMAND AREA
                    </h2>
                    <p className="text-[10px] md:text-xs font-black uppercase opacity-60 mt-1 tracking-widest">
                        {activeDiv === 'SATLANTAS' ? "Traffic Enforcement & Weekly Tickets Monitor" : "Personnel Activity & Duty Hours Monitor"}
                    </p>
                </div>
                <Crosshair size={120} className="absolute -right-8 -bottom-8 opacity-10" />
            </div>

            {/* KONTEN */}
            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 size={40} className="animate-spin text-blue-500" /></div>
            ) : memberStats.length === 0 ? (
                <div className={`bg-white border-[3.5px] border-slate-950 shadow-[6px_6px_0px_#000] rounded-[25px] p-16 text-center`}>
                    <AlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="text-lg font-[1000] italic uppercase">PERSONEL NIHIL</h3>
                    <p className="text-[10px] font-black uppercase opacity-40 mt-1">Belum ada anggota yang terdaftar di divisi {activeDiv}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {memberStats.map((user) => {
                        // 🚀 PARSING LOGIC: Pisah Nama dan Badge
                        let rawName = user.name || 'UNKNOWN';
                        if (rawName.includes('|')) {
                            rawName = rawName.split('|').pop()?.trim() || rawName;
                        }

                        let badgeNumber = "-";
                        if (rawName.startsWith('#')) {
                            const spaceIndex = rawName.indexOf(' ');
                            if (spaceIndex !== -1) {
                                badgeNumber = rawName.substring(1, spaceIndex);
                                rawName = rawName.substring(spaceIndex + 1).trim();
                            } else {
                                badgeNumber = rawName.substring(1);
                                rawName = "OFFICER";
                            }
                        }
                        const cleanName = rawName.toUpperCase();

                        return (
                            <motion.div key={user.discord_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-2xl ${boxBorder} ${hardShadow} overflow-hidden flex flex-col`}>

                                {/* STATUS HEADER (Khusus Satlantas) */}
                                {activeDiv === 'SATLANTAS' && (
                                    <div className={`px-3 py-1.5 flex justify-between items-center border-b-[3px] border-black ${user.isAchieved ? 'bg-[#00E676]' : 'bg-slate-100'}`}>
                                        <span className="text-[9px] font-black uppercase italic text-slate-900">{user.isAchieved ? 'Target Achieved' : 'On Progress'}</span>
                                        {user.isAchieved && <CheckCircle2 size={14} className="text-slate-900" />}
                                    </div>
                                )}

                                {/* IDENTITAS */}
                                <div className="p-3.5 border-b-[3px] border-slate-950 bg-slate-50">
                                    <h3 className="text-sm font-[1000] italic uppercase leading-tight truncate text-slate-900">
                                        {cleanName}
                                    </h3>
                                    <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest mt-0.5">{user.pangkat} • #{badgeNumber}</p>
                                </div>

                                {/* STATISTIK AKTIVITAS */}
                                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-center">

                                    {/* CARD PENILANGAN (Hanya jika SATLANTAS) */}
                                    {activeDiv === 'SATLANTAS' && (
                                        <div className="bg-orange-50 border-[2.5px] border-orange-500 rounded-xl p-2.5 flex justify-between items-center relative overflow-hidden">
                                            <span className="text-[9px] font-black uppercase text-orange-600 tracking-widest relative z-10 flex items-center gap-1.5"><Target size={12} /> Tilang</span>
                                            <div className="flex items-baseline gap-0.5 relative z-10">
                                                <span className="text-xl font-[1000] italic leading-none text-orange-600">{user.tilangCount}</span>
                                                <span className="text-[10px] font-bold text-orange-400">/15</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* STATISTIK UMUM (PRP & DUTY) */}
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="bg-slate-100 border-[2.5px] border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-yellow-600">
                                                <Zap size={14} />
                                                <span className="text-[9px] font-black uppercase">PRP</span>
                                            </div>
                                            <span className="text-sm font-[1000] italic leading-none text-slate-800">{user.prp}</span>
                                        </div>
                                        <div className="bg-slate-100 border-[2.5px] border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-blue-600">
                                                <Clock size={14} />
                                                <span className="text-[9px] font-black uppercase">JAM</span>
                                            </div>
                                            <span className="text-sm font-[1000] italic leading-none text-slate-800">{user.hours}</span>
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}