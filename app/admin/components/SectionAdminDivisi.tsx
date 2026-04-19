"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Users, Shield, Zap, Clock, CheckCircle2, Loader2, AlertCircle, Crosshair } from 'lucide-react';
import { startOfWeek, endOfWeek } from "date-fns";

const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[8px_8px_0px_#000]";

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
            <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2">
                {(['SATLANTAS', 'SABHARA', 'BRIMOB', 'PROPAM'] as DivisionType[]).map((div) => (
                    <button
                        key={div}
                        onClick={() => setActiveDiv(div)}
                        className={`px-5 py-3 rounded-2xl border-[3.5px] border-black font-[1000] text-sm uppercase italic transition-all whitespace-nowrap shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none ${activeDiv === div ? 'bg-slate-950 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
                    >
                        {div}
                    </button>
                ))}
            </div>

            {/* HEADER DIVISI */}
            <div className={`bg-slate-950 p-6 md:p-8 rounded-[25px] ${boxBorder} shadow-[8px_8px_0px_#3B82F6] text-white relative overflow-hidden`}>
                <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-[1000] italic uppercase tracking-tighter flex items-center gap-3">
                        <Shield size={32} className={activeDiv === 'SATLANTAS' ? 'text-orange-500' : 'text-blue-500'} />
                        {activeDiv} COMMAND AREA
                    </h2>
                    <p className="text-[10px] md:text-xs font-black uppercase opacity-60 mt-2 tracking-widest">
                        {activeDiv === 'SATLANTAS' ? "Traffic Enforcement & Weekly Tickets Monitor" : "Personnel Activity & Duty Hours Monitor"}
                    </p>
                </div>
                <Crosshair size={150} className="absolute -right-10 -bottom-10 opacity-10" />
            </div>

            {/* KONTEN */}
            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 size={40} className="animate-spin text-blue-500" /></div>
            ) : memberStats.length === 0 ? (
                <div className={`bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-20 text-center`}>
                    <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-[1000] italic uppercase">PERSONEL NIHIL</h3>
                    <p className="text-xs font-black uppercase opacity-40 mt-1">Belum ada anggota yang terdaftar di divisi {activeDiv}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memberStats.map((user) => (
                        <motion.div key={user.discord_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-[25px] ${boxBorder} ${hardShadow} overflow-hidden flex flex-col`}>

                            {/* STATUS HEADER (Khusus Satlantas) */}
                            {activeDiv === 'SATLANTAS' && (
                                <div className={`px-4 py-2 flex justify-between items-center border-b-2 border-black ${user.isAchieved ? 'bg-[#00E676]' : 'bg-slate-100'}`}>
                                    <span className="text-[10px] font-black uppercase italic text-slate-900">{user.isAchieved ? 'Target Achieved' : 'On Progress'}</span>
                                    {user.isAchieved && <CheckCircle2 size={16} className="text-slate-900" />}
                                </div>
                            )}

                            {/* IDENTITAS */}
                            <div className="p-5 border-b-2 border-slate-100 bg-slate-50">
                                <h3 className="text-lg font-[1000] italic uppercase leading-tight truncate text-slate-900">
                                    {user.name?.includes('|') ? user.name.split('|').pop() : user.name}
                                </h3>
                                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{user.pangkat}</p>
                            </div>

                            {/* STATISTIK AKTIVITAS */}
                            <div className="p-5 space-y-4 flex-1">

                                {/* CARD PENILANGAN (Hanya jika SATLANTAS) */}
                                {activeDiv === 'SATLANTAS' && (
                                    <div className="bg-orange-50 border-2 border-orange-500 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                                        <Target size={60} className="absolute -right-4 -bottom-4 text-orange-200 opacity-50" />
                                        <p className="text-[9px] font-black uppercase text-orange-600 tracking-widest mb-1 relative z-10">Tilang Minggu Ini</p>
                                        <div className="flex items-end gap-1 relative z-10">
                                            <span className="text-4xl font-[1000] italic leading-none text-orange-600">{user.tilangCount}</span>
                                            <span className="text-sm font-bold text-orange-400 mb-1">/15</span>
                                        </div>
                                    </div>
                                )}

                                {/* STATISTIK UMUM (PRP & DUTY) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-100 border-2 border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center">
                                        <Zap size={16} className="text-yellow-500 mb-1" />
                                        <span className="text-xl font-[1000] italic leading-none">{user.prp}</span>
                                        <span className="text-[8px] font-black uppercase text-slate-400 mt-1">Total PRP</span>
                                    </div>
                                    <div className="bg-slate-100 border-2 border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center">
                                        <Clock size={16} className="text-blue-500 mb-1" />
                                        <span className="text-xl font-[1000] italic leading-none">{user.hours}</span>
                                        <span className="text-[8px] font-black uppercase text-slate-400 mt-1">Jam Duty</span>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}