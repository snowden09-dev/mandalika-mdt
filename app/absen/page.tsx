"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ShieldAlert, Send, Clock, FileText, Camera,
    CheckCircle, AlertOctagon, Loader2
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";
import TacticalTransition from '@/app/dashboard/components/TacticalTransition';

const boxBorder = "border-[2px] border-zinc-800";
const cardShadow = "shadow-[4px_4px_0px_#ef4444]";
const inputStyle = "w-full bg-[#18181b] border-2 border-zinc-800 focus:border-red-500 rounded-xl p-3.5 text-xs font-bold outline-none text-zinc-100 placeholder-zinc-600 transition-all uppercase tracking-wider";

type TipeAbsen = 'ON_DUTY' | 'OFF_DUTY' | 'IZIN';

export default function AbsenPage() {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [identity, setIdentity] = useState({ nama: 'MENDETEKSI...', pangkat: '...', badgeNumber: '...', divisi: '...', discordId: '' });

    const [form, setForm] = useState({
        tipe: 'ON_DUTY' as TipeAbsen,
        keterangan: '',
        bukti_foto: ''
    });

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.keterangan) return toast.error("Keterangan wajib diisi!");
        if (form.tipe === 'OFF_DUTY' && !form.bukti_foto) return toast.error("Bukti foto wajib dilampirkan saat Off Duty!");

        setIsSubmitting(true);
        const tId = toast.loading("Mengirim transmisi data...");

        try {
            // Pastikan nama tabel 'absensi' sesuai dengan yang ada di database Supabase kamu
            const { error } = await supabase.from('absensi').insert([
                {
                    discord_id: identity.discordId,
                    tipe_absen: form.tipe,
                    keterangan: form.keterangan,
                    bukti_foto: form.bukti_foto,
                    nama_ic: identity.nama, // Opsional jika ingin merekam nama saat absen
                    pangkat: identity.pangkat // Opsional
                }
            ]);

            if (error) throw error;

            toast.success("Absen Berhasil Dicatat!", { id: tId });
            setForm({ tipe: 'ON_DUTY', keterangan: '', bukti_foto: '' }); // Reset Form
            
            // Opsional: Redirect kembali ke dashboard setelah absen
            // setTimeout(() => handleNavigation('/dashboard'), 1500);

        } catch (error: any) {
            console.error("Error submit absen:", error);
            toast.error(error.message || "Gagal mencatat absen. Coba lagi.", { id: tId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-mono p-4 flex flex-col items-center overflow-x-hidden relative pb-20">
            <TacticalTransition isVisible={isNavigating} />
            <Toaster position="top-center" theme="dark" richColors />

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
                    <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none text-zinc-100">Duty Terminal</h1>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-md bg-[#121214] ${boxBorder} rounded-3xl ${cardShadow} p-5`}>

                {/* 🚀 IDENTITY BADGE */}
                <div className="grid grid-cols-3 gap-2 items-center bg-[#18181b] border-2 border-zinc-800 p-2.5 rounded-xl mb-6 shadow-inner text-center">
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

                {/* 🚀 FORM ABSENSI */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* TIPE ABSEN */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                            <Clock size={12} className="text-red-500" /> Tipe Laporan
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['ON_DUTY', 'OFF_DUTY', 'IZIN'] as TipeAbsen[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setForm({ ...form, tipe: t })}
                                    className={`py-3 px-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                                        form.tipe === t 
                                            ? 'bg-red-600/10 border-red-500 text-red-500 shadow-[2px_2px_0px_#ef4444]' 
                                            : 'bg-[#18181b] border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                    }`}
                                >
                                    {t.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* KETERANGAN */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                            <FileText size={12} className="text-red-500" /> Keterangan / Area Patroli
                        </label>
                        <textarea
                            value={form.keterangan}
                            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                            placeholder={form.tipe === 'IZIN' ? "Alasan izin/cuti..." : "Misal: Memulai patroli area LS..."}
                            rows={3}
                            className={`${inputStyle} resize-none custom-scrollbar`}
                        />
                    </div>

                    {/* BUKTI FOTO */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                            <Camera size={12} className="text-red-500" /> Link Bukti Foto (Opsional / Wajib Off-Duty)
                        </label>
                        <input
                            type="url"
                            value={form.bukti_foto}
                            onChange={(e) => setForm({ ...form, bukti_foto: e.target.value })}
                            placeholder="https://cdn.discordapp.com/..."
                            className={inputStyle}
                        />
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 mt-4 rounded-xl font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 border-2 border-zinc-950 shadow-[4px_4px_0px_#000] active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <><Loader2 size={18} className="animate-spin" /> MENGIRIM...</>
                        ) : (
                            <><Send size={18} /> KIRIM LAPORAN</>
                        )}
                    </button>
                </form>

            </motion.div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #18181b; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 8px; }
            `}</style>
        </div>
    );
}