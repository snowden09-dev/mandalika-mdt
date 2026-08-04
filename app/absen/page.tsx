"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ShieldAlert, Send, Clock, FileText, Upload,
    Calendar, Loader2, Image as ImageIcon
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";
import TacticalTransition from '@/app/dashboard/components/TacticalTransition';

const boxBorder = "border-[2px] border-zinc-800";
const cardShadow = "shadow-[4px_4px_0px_#ef4444]";
const inputStyle = "w-full bg-[#18181b] border-2 border-zinc-800 focus:border-red-500 rounded-xl p-3.5 text-xs font-bold outline-none text-zinc-100 placeholder-zinc-600 transition-all uppercase tracking-wider";

type TipeAbsen = 'ON_DUTY' | 'IZIN';

export default function AbsenPage() {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    
    const [identity, setIdentity] = useState({ nama: 'MENDETEKSI...', pangkat: '...', badgeNumber: '...', divisi: '...', discordId: '' });

    // Dapatkan tanggal dan jam lokal saat ini format YYYY-MM-DD & HH:MM
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    const [form, setForm] = useState({
        tipe: 'ON_DUTY' as TipeAbsen,
        tanggal: currentDate,
        jam_duty: currentTime,
        jam_off_duty: '',
        keterangan: '',
        bukti_foto: ''
    });

    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

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

    // Handler Upload File ke Supabase Storage Bucket: bukti_absen-duty
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("File harus berupa gambar (PNG/JPG/JPEG)!");
            return;
        }

        setUploadingFile(true);
        const tId = toast.loading("Mengunggah bukti foto ke storage...");

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${identity.discordId}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('bukti_absen-duty')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('bukti_absen-duty')
                .getPublicUrl(filePath);

            setForm(prev => ({ ...prev, bukti_foto: publicUrl }));
            setSelectedFileName(file.name);
            toast.success("Bukti foto berhasil diunggah!", { id: tId });
        } catch (error: any) {
            console.error("Gagal upload:", error);
            toast.error(error.message || "Gagal mengunggah gambar ke storage.", { id: tId });
        } finally {
            setUploadingFile(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.tanggal) return toast.error("Tanggal wajib diisi!");
        if (!form.keterangan) return toast.error("Keterangan wajib diisi!");
        
        if (form.tipe === 'ON_DUTY') {
            if (!form.jam_duty) return toast.error("Jam duty wajib diisi!");
            if (!form.bukti_foto) return toast.error("Bukti foto wajib diupload!");
        }

        setIsSubmitting(true);
        const tId = toast.loading("Mengirim laporan absensi...");

        try {
            const { error } = await supabase.from('absensi').insert([
                {
                    discord_id: identity.discordId,
                    tipe_absen: form.tipe,
                    tanggal: form.tanggal,
                    jam_duty: form.tipe === 'ON_DUTY' ? form.jam_duty : null,
                    jam_off_duty: form.tipe === 'ON_DUTY' ? (form.jam_off_duty || null) : null,
                    keterangan: form.keterangan,
                    bukti_foto: form.tipe === 'ON_DUTY' ? form.bukti_foto : null,
                    nama_ic: identity.nama,
                    pangkat: identity.pangkat
                }
            ]);

            if (error) throw error;

            toast.success(form.tipe === 'ON_DUTY' ? "Absen On Duty Berhasil Dicatat!" : "Pengajuan Izin/Cuti Berhasil Dikirim!", { id: tId });
            
            // Reset form
            setForm({
                tipe: 'ON_DUTY',
                tanggal: currentDate,
                jam_duty: currentTime,
                jam_off_duty: '',
                keterangan: '',
                bukti_foto: ''
            });
            setSelectedFileName(null);

        } catch (error: any) {
            console.error("Error submit absen:", error);
            toast.error(error.message || "Gagal mencatat data ke database.", { id: tId });
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

                {/* 🚀 FORM ABSENSI / IZIN */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* TIPE LAPORAN */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                            <Clock size={12} className="text-red-500" /> Tipe Laporan
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['ON_DUTY', 'IZIN'] as TipeAbsen[]).map((t) => (
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
                                    {t === 'ON_DUTY' ? 'On Duty' : 'Izin / Cuti'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TANGGAL */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                            <Calendar size={12} className="text-red-500" /> {form.tipe === 'ON_DUTY' ? 'Tanggal Laporan' : 'Tanggal Cuti'}
                        </label>
                        <input
                            type="date"
                            value={form.tanggal}
                            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                            className={inputStyle}
                        />
                    </div>

                    {/* FIELD KHUSUS ON DUTY */}
                    <AnimatePresence>
                        {form.tipe === 'ON_DUTY' && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 overflow-hidden"
                            >
                                {/* JAM DUTY & OFF DUTY */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                            <Clock size={12} className="text-red-500" /> Jam Duty
                                        </label>
                                        <input
                                            type="time"
                                            value={form.jam_duty}
                                            onChange={(e) => setForm({ ...form, jam_duty: e.target.value })}
                                            className={inputStyle}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                            <Clock size={12} className="text-zinc-500" /> Jam Off Duty
                                        </label>
                                        <input
                                            type="time"
                                            value={form.jam_off_duty}
                                            onChange={(e) => setForm({ ...form, jam_off_duty: e.target.value })}
                                            className={inputStyle}
                                        />
                                    </div>
                                </div>

                                {/* UPLOAD BUKTI FOTO */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                        <ImageIcon size={12} className="text-red-500" /> Bukti Foto (Storage: bukti_absen-duty)
                                    </label>
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-[#18181b] hover:border-red-500 transition-all">
                                        <div className="flex flex-col items-center justify-center pt-3 pb-3 px-4 text-center">
                                            {uploadingFile ? (
                                                <Loader2 className="w-6 h-6 text-red-500 animate-spin mb-1" />
                                            ) : (
                                                <Upload className="w-6 h-6 text-zinc-500 mb-1" />
                                            )}
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase truncate max-w-[260px]">
                                                {selectedFileName ? selectedFileName : "Klik untuk pilih gambar bukti"}
                                            </p>
                                            <p className="text-[8px] text-zinc-600 uppercase mt-0.5">PNG, JPG, JPEG (Max 5MB)</p>
                                        </div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handleFileUpload} 
                                            disabled={uploadingFile}
                                        />
                                    </label>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* KETERANGAN / KETERANGAN CUTI */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                            <FileText size={12} className="text-red-500" /> {form.tipe === 'ON_DUTY' ? 'Keterangan / Area Patroli' : 'Keterangan Cuti'}
                        </label>
                        <textarea
                            value={form.keterangan}
                            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                            placeholder={form.tipe === 'IZIN' ? "Tuliskan alasan pengajuan cuti/izin..." : "Misal: Patroli wilayah kota Mandalika..."}
                            rows={3}
                            className={`${inputStyle} resize-none custom-scrollbar`}
                        />
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={isSubmitting || uploadingFile}
                        className="w-full py-4 mt-2 rounded-xl font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 border-2 border-zinc-950 shadow-[4px_4px_0px_#000] active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <><Loader2 size={18} className="animate-spin" /> MENGIRIM...</>
                        ) : (
                            <><Send size={18} /> {form.tipe === 'ON_DUTY' ? 'KIRIM ABSENSI' : 'KIRIM PENGAJUAN CUTI'}</>
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