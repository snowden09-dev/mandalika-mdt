"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion } from 'framer-motion';
import {
    Trophy, Skull, Star, Flame, ShieldAlert,
    Clock, Crosshair, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { startOfWeek, endOfWeek } from "date-fns";

const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

export default function SectionHallOfFame() {
    const [loading, setLoading] = useState(true);
    const [personnelData, setPersonnelData] = useState<any[]>([]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

        // 1. Tarik semua anggota
        const { data: users } = await supabase.from('users').select('discord_id, name, pangkat, divisi, avatar_url');

        // 2. Tarik duty minggu ini
        const { data: duties } = await supabase.from('presensi_duty')
            .select('*')
            .gte('start_time', weekStart)
            .lte('start_time', weekEnd);

        // 3. Tarik cuti minggu ini (untuk filter Wall of Shame)
        const { data: cutis } = await supabase.from('pengajuan_cuti')
            .select('*')
            .eq('status', 'APPROVED');

        if (users && duties) {
            const processedData = users.map(user => {
                const userDuties = duties.filter(d => d.user_id_discord === user.discord_id);
                const totalMinutes = userDuties.reduce((acc, curr) => acc + (curr.durasi_menit || 0), 0);

                const isCuti = cutis?.some(c =>
                    c.user_id_discord === user.discord_id &&
                    new Date(c.tanggal_selesai) >= new Date(weekStart)
                );

                return {
                    ...user,
                    cleanName: user.name?.split('|').pop()?.trim() || 'UNKNOWN',
                    totalMinutes,
                    isCuti
                };
            });
            setPersonnelData(processedData);
        }
        setLoading(false);
    };

    useEffect(() => { fetchLeaderboard(); }, []);

    // --- LOGIKA TOP 3 ANGGOTA (Berdasarkan Durasi Duty Tertinggi) ---
    const topAnggota = useMemo(() => {
        return personnelData
            .filter(p => p.totalMinutes > 0)
            .sort((a, b) => b.totalMinutes - a.totalMinutes)
            .slice(0, 3);
    }, [personnelData]);

    // --- LOGIKA WALL OF SHAME (0 Menit Duty & Tidak Sedang Cuti) ---
    const wallOfShame = useMemo(() => {
        return personnelData
            .filter(p => p.totalMinutes === 0 && !p.isCuti && !['JENDRAL', 'KOMJEN'].includes(p.pangkat.toUpperCase())) // Petinggi kebal Wall of Shame (Opsional)
            .slice(0, 6); // Tampilkan maksimal 6 orang agar UI tidak terlalu panjang
    }, [personnelData]);

    const getAvatar = (name: string, url?: string) => {
        return url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000000&color=fff&bold=true&size=128`;
    };

    if (loading) return <div className="py-20 text-center animate-pulse font-black text-slate-950 italic uppercase">CALCULATING MARKSMANSHIP...</div>;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 font-mono pb-20 text-slate-950">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* =========================================
                    🏆 SECTION 1: HALL OF HONOR (TOP 3)
                ========================================= */}
                <div className={`bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-6 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={100} /></div>

                    <div className="flex items-center gap-3 mb-6 relative z-10 border-b-[4px] border-black pb-4">
                        <div className="bg-[#FFD100] p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000]"><Star size={24} /></div>
                        <div>
                            <h2 className="font-[1000] text-2xl italic uppercase tracking-tighter">Hall of Honor</h2>
                            <p className="text-[10px] font-black uppercase opacity-50 mt-1">Personel dengan jam terbang tertinggi minggu ini</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {topAnggota.length === 0 ? (
                            <div className="text-center py-10 opacity-50 font-black italic uppercase">Belum ada data patroli minggu ini.</div>
                        ) : (
                            topAnggota.map((p, index) => (
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.1 }}
                                    key={p.discord_id}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-black ${index === 0 ? 'bg-[#FFD100] shadow-[4px_4px_0px_#000] scale-[1.02]' : 'bg-slate-50'}`}
                                >
                                    <div className="relative">
                                        <img src={getAvatar(p.cleanName, p.avatar_url)} alt="avatar" className="w-14 h-14 rounded-xl border-2 border-black object-cover bg-white" />
                                        {index === 0 && <div className="absolute -top-3 -right-3 bg-white border-2 border-black rounded-full p-1"><Flame size={14} className="text-orange-500" /></div>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-[1000] text-lg uppercase italic leading-none">{p.cleanName}</span>
                                            {index === 0 && <span className="bg-black text-[#FFD100] text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">MVP</span>}
                                        </div>
                                        <p className="text-[10px] font-bold mt-1 uppercase opacity-70">{p.pangkat} • {p.divisi || 'UNIT'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">Total Duty</p>
                                        <div className="flex items-center gap-1 bg-white border-2 border-black px-2 py-1 rounded-lg shadow-inner">
                                            <Clock size={12} className={index === 0 ? "text-orange-500" : ""} />
                                            <span className="text-[11px] font-[1000]">{Math.floor(p.totalMinutes / 60)}H {p.totalMinutes % 60}M</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* =========================================
                    💀 SECTION 2: WALL OF SHAME
                ========================================= */}
                <div className={`bg-[#1E293B] text-white ${boxBorder} shadow-[6px_6px_0px_#FF4D4D] rounded-[30px] p-6 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-red-500"><Skull size={100} /></div>

                    <div className="flex items-center gap-3 mb-6 relative z-10 border-b-[4px] border-black/50 pb-4">
                        <div className="bg-[#FF4D4D] text-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000]"><ShieldAlert size={24} /></div>
                        <div>
                            <h2 className="font-[1000] text-2xl italic uppercase tracking-tighter text-[#FF4D4D]">Wall of Shame</h2>
                            <p className="text-[10px] font-black uppercase opacity-60 mt-1 text-slate-300">Personel Alpha / Inactive 7 Hari Terakhir</p>
                        </div>
                    </div>

                    {wallOfShame.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center relative z-10">
                            <ShieldCheck size={48} className="text-[#00E676] mb-3 opacity-80" />
                            <p className="font-[1000] text-[#00E676] italic uppercase text-lg">MARKAS BERSIH</p>
                            <p className="text-[10px] font-black opacity-50 uppercase mt-1">Tidak ada personel indisipliner minggu ini.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            {wallOfShame.map((p, index) => (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.1 }}
                                    key={p.discord_id}
                                    className="bg-slate-900 border-2 border-black p-3 rounded-2xl flex flex-col items-center text-center group hover:bg-black transition-colors relative overflow-hidden"
                                >
                                    {/* Efek Garis Polisi Merah */}
                                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,77,77,0.1)_10px,rgba(255,77,77,0.1)_20px)] opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <img
                                        src={getAvatar(p.cleanName, p.avatar_url)}
                                        alt="avatar"
                                        className="w-12 h-12 rounded-full border-2 border-[#FF4D4D] object-cover mb-2 grayscale group-hover:grayscale-0 transition-all"
                                    />
                                    <span className="font-[1000] text-[11px] uppercase italic truncate w-full relative z-10">{p.cleanName}</span>
                                    <span className="text-[8px] font-black text-[#FF4D4D] uppercase tracking-widest mt-1 relative z-10 bg-black/50 px-2 py-0.5 rounded border border-red-900">AWOL</span>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {wallOfShame.length > 0 && (
                        <div className="mt-6 text-center border-t-2 border-white/10 pt-4 relative z-10">
                            <p className="text-[9px] font-black uppercase text-slate-400 italic flex items-center justify-center gap-1">
                                <AlertTriangle size={10} className="text-[#FFD100]" /> Menunggu penindakan High Admin
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}