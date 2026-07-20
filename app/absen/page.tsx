"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, ShieldAlert, ExternalLink, MessageSquare, Radio
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { Toaster } from "sonner";
import TacticalTransition from '@/app/dashboard/components/TacticalTransition';

const boxBorder = "border-[2px] border-zinc-800";
const cardShadow = "shadow-[4px_4px_0px_#ef4444]";

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
        window.open('https://discord.gg/Rj7SN2bWXr', '_blank');
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-mono p-4 flex flex-col items-center overflow-x-hidden relative">
            <TacticalTransition isVisible={isNavigating} />
            <Toaster position="top-center" theme="dark" />

            {/* 🚀 HEADER */}
            <div className="w-full max-w-md flex items-center justify-between mb-6 mt-2">
                <button 
                    onClick={() => handleNavigation('/dashboard')} 
                    className="p-2.5 bg-[#121214] text-zinc-200 border-2 border-zinc-800 rounded-lg shadow-[2px_2px_0px_#ef4444] active:translate-y-px transition-all hover:border-red-600"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-1">
                        <ShieldAlert className="text-red-500 animate-pulse" size={14} />
                        <span className="text-[8px] font-black tracking-widest uppercase opacity-60 italic">Mandalika PD</span>
                    </div>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none text-zinc-100">Discord Portal</h1>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-md bg-[#121214] ${boxBorder} rounded-[24px] ${cardShadow} p-5`}>

                {/* 🚀 IDENTITY BADGE */}
                <div className="grid grid-cols-3 gap-2 items-center bg-[#18181b] border-2 border-zinc-800 p-2.5 rounded-xl mb-5 shadow-inner text-center">
                    <div className="truncate text-left">
                        <p className="text-[8px] font-black text-zinc-500 uppercase italic">Personnel</p>
                        <p className="text-[10px] md:text-xs font-black uppercase text-zinc-200 truncate">{identity.nama}</p>
                    </div>
                    <div className="truncate border-x-2 border-zinc-800 px-1">
                        <p className="text-[8px] font-black text-zinc-500 uppercase italic">Rank</p>
                        <p className="text-[10px] md:text-xs font-black uppercase text-red-500 truncate">{identity.pangkat}</p>
                    </div>
                    <div className="truncate text-right">
                        <p className="text-[8px] font-black text-zinc-500 uppercase italic">Badge</p>
                        <p className="text-[10px] md:text-xs font-black uppercase text-zinc-300 truncate">#{identity.badgeNumber}</p>
                    </div>
                </div>

                {/* 🚀 DISCORD REDIRECTION BANNER / INFO */}
                <div className="space-y-4 text-center py-2">
                    <div className="w-16 h-16 bg-[#18181b] text-red-500 mx-auto rounded-2xl flex items-center justify-center border-2 border-zinc-800 shadow-[3px_3px_0px_#ef4444] rotate-3">
                        <MessageSquare size={32} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-black uppercase italic tracking-wider text-zinc-100">
                            Sistem Absen & Cuti Pindah ke Discord
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed px-2">
                            Berdasarkan instruksi Divisi Kepolisian Mandalika, seluruh pencatatan Duty Log dan Pengajuan Surat Izin Cuti kini terpusat dan wajib dilakukan langsung melalui bot resmi di server Discord Kepolisian.
                        </p>
                    </div>

                    {/* 🚀 GUIDE STEPS */}
                    <div className="bg-[#18181b] border-2 border-zinc-800 rounded-xl p-3 text-left space-y-2 shadow-inner">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-200 italic flex items-center gap-1">
                            <Radio size={12} className="text-red-500 animate-pulse" /> Cara Melakukan Absen:
                        </p>
                        <ul className="text-[9px] font-bold uppercase text-zinc-400 space-y-1.5 pl-4 list-disc">
                            <li>Buka aplikasi atau web Discord Kepolisian Mandalika.</li>
                            <li>Masuk ke channel khusus <span className="text-red-400 font-black">#absensi-duty</span> atau <span className="text-red-400 font-black">#pengajuan-cuti</span>.</li>
                            <li>Gunakan command bot yang telah disediakan untuk mengirim laporan.</li>
                        </ul>
                    </div>

                    {/* 🚀 ACTION BUTTON */}
                    <button
                        type="button"
                        onClick={handleOpenDiscord}
                        className={`w-full py-4 mt-2 rounded-xl font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 border-2 border-zinc-950 shadow-[4px_4px_0px_#000] active:translate-y-1`}
                    >
                        <ExternalLink size={16} /> BUKA DISCORD KEPOLISIAN
                    </button>
                </div>

            </motion.div>
        </div>
    );
}