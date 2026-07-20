"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, ShieldAlert, ExternalLink, MessageSquare, CheckCircle2, Radio
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { Toaster } from "sonner";
import TacticalTransition from '@/app/dashboard/components/TacticalTransition';

const boxBorder = "border-[2px] border-slate-950";
const cardShadow = "shadow-[4px_4px_0px_#000]";

export default function AbsenPage() {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const [identity, setIdentity] = useState({ nama: 'MENDETEKSI...', pangkat: '...', badgeNumber: '...', divisi: '...', discordId: '' });

    useEffect(() => {
        async function getActiveUser() {
            try {
                const sessionData = localStorage.getItem('police_session');
                if (!sessionData) {
                    router.push('/');
                    return;
                }
                const parsed = JSON.parse(sessionData);
                const dId = parsed.discord_id;

                const { data } = await supabase.from('users').select('name, pangkat, divisi').eq('discord_id', dId).maybeSingle();

                if (data) {
                    let rawName = data.name.includes('|') ? data.name.split('|').pop()?.trim() : data.name;
                    let badge = "-";

                    if (rawName && rawName.startsWith('#')) {
                        const spaceIndex = rawName.indexOf(' ');
                        if (spaceIndex !== -1) {
                            badge = rawName.substring(1, spaceIndex);
                            rawName = rawName.substring(spaceIndex + 1).trim();
                        } else {
                            badge = rawName.substring(1);
                            rawName = "OFFICER";
                        }
                    }

                    setIdentity({
                        nama: rawName?.toUpperCase() || 'UNKNOWN',
                        pangkat: data.pangkat?.toUpperCase() || '...',
                        badgeNumber: badge,
                        divisi: data.divisi?.toUpperCase() || 'UNIT',
                        discordId: dId
                    });
                } else {
                    setIdentity(prev => ({ ...prev, nama: 'DATA TIDAK DITEMUKAN' }));
                }
            } catch (error) {
                console.error("Gagal mendeteksi profil:", error);
                setIdentity(prev => ({ ...prev, nama: 'GAGAL MEMUAT DATA' }));
            }
        }
        getActiveUser();
    }, [router]);

    const handleNavigation = (path: string) => {
        setIsNavigating(true);
        setTimeout(() => router.push(path), 3000);
    };

    const handleOpenDiscord = () => {
        // Ganti URL di bawah dengan link invite Discord server kepolisian Anda
        window.open('https://discord.gg/mandalikapd', '_blank');
    };

    return (
        <div className="min-h-screen bg-[#e2e8f0] text-slate-950 font-mono p-4 flex flex-col items-center overflow-x-hidden relative">
            <TacticalTransition isVisible={isNavigating} />
            <Toaster position="top-center" />

            {/* 🚀 HEADER */}
            <div className="w-full max-w-md flex items-center justify-between mb-6 mt-2">
                <button onClick={() => handleNavigation('/dashboard')} className="p-2.5 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] active:translate-y-px transition-all">
                    <ArrowLeft size={18} />
                </button>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-1">
                        <ShieldAlert className="text-blue-600 animate-pulse" size={14} />
                        <span className="text-[8px] font-black tracking-widest uppercase opacity-50 italic">Mandalika PD</span>
                    </div>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">Discord Portal</h1>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-md bg-white ${boxBorder} rounded-[24px] ${cardShadow} p-5`}>

                {/* 🚀 IDENTITY BADGE */}
                <div className="grid grid-cols-3 gap-2 items-center bg-slate-100 border-2 border-slate-950 p-2.5 rounded-xl mb-5 shadow-inner text-center">
                    <div className="truncate text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase italic">Personnel</p>
                        <p className="text-[10px] md:text-xs font-black uppercase truncate">{identity.nama}</p>
                    </div>
                    <div className="truncate border-x-2 border-slate-300 px-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase italic">Rank</p>
                        <p className="text-[10px] md:text-xs font-black uppercase text-blue-600 truncate">{identity.pangkat}</p>
                    </div>
                    <div className="truncate text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase italic">Badge</p>
                        <p className="text-[10px] md:text-xs font-black uppercase text-slate-800 truncate">#{identity.badgeNumber}</p>
                    </div>
                </div>

                {/* 🚀 DISCORD REDIRECTION BANNER / INFO */}
                <div className="space-y-4 text-center py-2">
                    <div className="w-16 h-16 bg-[#5865F2] text-white mx-auto rounded-2xl flex items-center justify-center border-2 border-slate-950 shadow-[3px_3px_0px_#000] rotate-3">
                        <MessageSquare size={32} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-black uppercase italic tracking-wider text-slate-950">
                            Sistem Absen & Cuti Pindah ke Discord
                        </h2>
                        <p className="text-[10px] font-bold text-slate-600 uppercase leading-relaxed px-2">
                            Berdasarkan instruksi Divisi Kepolisian Mandalika, seluruh pencatatan Duty Log dan Pengajuan Surat Izin Cuti kini terpusat dan wajib dilakukan langsung melalui bot resmi di server Discord Kepolisian.
                        </p>
                    </div>

                    {/* 🚀 GUIDE STEPS */}
                    <div className="bg-slate-50 border-2 border-slate-950 rounded-xl p-3 text-left space-y-2 shadow-inner">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-950 italic flex items-center gap-1">
                            <Radio size={12} className="text-blue-600 animate-pulse" /> Cara Melakukan Absen:
                        </p>
                        <ul className="text-[9px] font-bold uppercase text-slate-700 space-y-1.5 pl-4 list-disc">
                            <li>Buka aplikasi atau web Discord Kepolisian Mandalika.</li>
                            <li>Masuk ke channel khusus <span className="text-blue-600 font-black">#absensi-duty</span> atau <span className="text-red-600 font-black">#pengajuan-cuti</span>.</li>
                            <li>Gunakan command bot yang telah disediakan untuk mengirim laporan.</li>
                        </ul>
                    </div>

                    {/* 🚀 ACTION BUTTON */}
                    <button
                        type="button"
                        onClick={handleOpenDiscord}
                        className={`w-full py-4 mt-2 rounded-xl font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 bg-[#5865F2] ${boxBorder} ${cardShadow} active:translate-y-1 shadow-none`}
                    >
                        <ExternalLink size={16} /> BUKA DISCORD KEPOLISIAN
                    </button>
                </div>

            </motion.div>
        </div>
    );
}