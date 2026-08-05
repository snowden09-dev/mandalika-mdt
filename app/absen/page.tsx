"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ShieldAlert, Send, Clock, FileText, Upload,
    Calendar, Loader2, Image as ImageIcon, Palmtree, Trash2
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";
import TacticalTransition from '@/app/dashboard/components/TacticalTransition'; // Sesuaikan path jika perlu

const boxBorder = "border-[2px] border-zinc-800";
const cardShadow = "shadow-[4px_4px_0px_#ef4444]";
const inputStyle = "w-full bg-[#18181b] border-2 border-zinc-800 focus:border-red-500 rounded-xl p-3.5 text-xs font-bold outline-none text-zinc-100 placeholder-zinc-600 transition-all uppercase tracking-wider";

type TipeAbsen = 'ON_DUTY' | 'IZIN';

// Helper: Mendapatkan YYYY-MM-DD waktu lokal perangkat
const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function AbsenPage() {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    // Setup Waktu & Batas Tanggal (Maks hari ini, Min H-3)
    const now = new Date();
    const currentDateStr = getLocalDateString(now);
    const currentTimeStr = now.toTimeString().slice(0, 5);

    const minDateObj = new Date();
    minDateObj.setDate(now.getDate() - 3);
    const minDateStr = getLocalDateString(minDateObj);

    // Identitas Pengguna
    const [identity, setIdentity] = useState({
        nama: 'MENDETEKSI...',
        pangkat: '...',
        badgeNumber: '...',
        divisi: '...',
        discordId: ''
    });

    const [tipe, setTipe] = useState<TipeAbsen>('ON_DUTY');

    // Form State untuk Presensi Duty
    const [dutyForm, setDutyForm] = useState({
        tanggal: currentDateStr,
        jam_duty: currentTimeStr,
        jam_off_duty: '',
        catatan_duty: '',
        bukti_foto_urls: [] as string[],
        kategori_presensi: 'OPERASIONAL'
    });

    // Form State untuk Pengajuan Cuti / Izin
    const [cutiForm, setCutiForm] = useState({
        tanggal_mulai: currentDateStr,
        tanggal_selesai: currentDateStr,
        jenis_izin: 'IZIN',
        alasan: ''
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

    // 📤 Upload Foto (Bisa 1 per 1 atau sekaligus, akumulatif maks 3)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const currentCount = dutyForm.bukti_foto_urls.length;
        if (currentCount >= 3) {
            toast.error("Maksimal sudah mencapai 3 foto! Hapus salah satu jika ingin mengganti.");
            return;
        }

        if (currentCount + files.length > 3) {
            toast.error(`Anda hanya dapat menambah ${3 - currentCount} foto lagi (Maksimal 3).`);
            return;
        }

        const validFiles = files.filter(f => f.type.startsWith('image/'));
        if (validFiles.length !== files.length) {
            toast.error("Semua file harus berupa format gambar (PNG/JPG/JPEG)!");
            return;
        }

        setUploadingFile(true);
        const tId = toast.loading(`Mengunggah ${validFiles.length} foto ke folder duty...`);

        try {
            const uploadedUrls: string[] = [];

            for (const file of validFiles) {
                const fileExt = file.name.split('.').pop();
                const randomStr = Math.random().toString(36).substring(7);
                const fileName = `${identity.discordId}_${Date.now()}_${randomStr}.${fileExt}`;
                const filePath = `duty/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('bukti-absen')
                    .upload(filePath, file, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('bukti-absen')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
            }

            setDutyForm(prev => ({ 
                ...prev, 
                bukti_foto_urls: [...prev.bukti_foto_urls, ...uploadedUrls] 
            }));
            toast.success(`${uploadedUrls.length} Bukti foto berhasil diunggah!`, { id: tId });
        } catch (error: unknown) {
            console.error("Gagal upload:", error);
            const message = error instanceof Error ? error.message : "Gagal mengunggah gambar ke storage.";
            toast.error(message, { id: tId });
        } finally {
            setUploadingFile(false);
            e.target.value = '';
        }
    };

    // 🗑️ Hapus Foto dari List Preview
    const handleRemovePhoto = (indexToRemove: number) => {
        setDutyForm(prev => ({
            ...prev,
            bukti_foto_urls: prev.bukti_foto_urls.filter((_, index) => index !== indexToRemove)
        }));
        toast.success("Foto berhasil dihapus dari daftar bukti.");
    };

    // 📝 Submit Form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const tId = toast.loading("Mengirim transmisi data...");

        try {
            if (tipe === 'ON_DUTY') {
                if (!dutyForm.tanggal) return toast.error("Tanggal wajib diisi!", { id: tId });
                if (!dutyForm.jam_duty) return toast.error("Jam duty wajib diisi!", { id: tId });
                if (dutyForm.bukti_foto_urls.length < 2) {
                    setIsSubmitting(false);
                    return toast.error("Minimal harus mengunggah 2 foto bukti sebelum mengirim presensi!", { id: tId });
                }
                if (dutyForm.bukti_foto_urls.length > 3) {
                    setIsSubmitting(false);
                    return toast.error("Maksimal bukti foto yang diizinkan adalah 3!", { id: tId });
                }

                let durasi = 0;
                const startMs = new Date(`${dutyForm.tanggal}T${dutyForm.jam_duty}:00`).getTime();
                const startTimeISO = new Date(startMs).toISOString();
                let endTimeISO = null;

                if (dutyForm.jam_off_duty) {
                    let endMs = new Date(`${dutyForm.tanggal}T${dutyForm.jam_off_duty}:00`).getTime();
                    
                    if (endMs < startMs) {
                        endMs += 24 * 60 * 60 * 1000; // Cross-midnight adjustment
                    }
                    
                    durasi = Math.floor((endMs - startMs) / (1000 * 60));
                    endTimeISO = new Date(endMs).toISOString();
                }

                const { error: insertError } = await supabase.from('presensi_duty').insert([
                    {
                        user_id_discord: identity.discordId,
                        nama_panggilan: identity.nama,
                        pangkat: identity.pangkat,
                        divisi: identity.divisi,
                        start_time: startTimeISO,
                        end_time: endTimeISO,
                        durasi_menit: durasi,
                        status: dutyForm.jam_off_duty ? 'OFF_DUTY' : 'ON_DUTY',
                        catatan_duty: dutyForm.catatan_duty || null,
                        bukti_foto: dutyForm.bukti_foto_urls, 
                        kategori_presensi: dutyForm.kategori_presensi
                    }
                ]);

                if (insertError) throw insertError;

                // UPDATE TOTAL JAM DUTY KE TABEL USERS
                if (durasi > 0) {
                    const durasiJam = durasi / 60;
                    
                    const { data: userData, error: userErr } = await supabase
                        .from('users')
                        .select('total_jam_duty')
                        .eq('discord_id', identity.discordId)
                        .single();
                        
                    if (!userErr && userData) {
                        const currentTotal = parseFloat(userData.total_jam_duty || "0");
                        const newTotal = (currentTotal + durasiJam).toFixed(2);
                        
                        await supabase
                            .from('users')
                            .update({ total_jam_duty: newTotal })
                            .eq('discord_id', identity.discordId);
                    }
                }

                toast.success("Presensi Duty berhasil dicatat! Mengalihkan ke halaman utama...", { id: tId });
                handleNavigation('/dashboard');

            } else {
                if (!cutiForm.tanggal_mulai) return toast.error("Tanggal mulai wajib diisi!", { id: tId });
                if (!cutiForm.tanggal_selesai) return toast.error("Tanggal selesai wajib diisi!", { id: tId });
                if (!cutiForm.alasan) return toast.error("Alasan wajib diisi!", { id: tId });

                const { error } = await supabase.from('pengajuan_cuti').insert([
                    {
                        user_id_discord: identity.discordId,
                        nama_panggilan: identity.nama,
                        pangkat: identity.pangkat,
                        divisi: identity.divisi,
                        tanggal_mulai: cutiForm.tanggal_mulai,
                        tanggal_selesai: cutiForm.tanggal_selesai,
                        alasan: cutiForm.alasan,
                        status: 'pending',
                        jenis_izin: cutiForm.jenis_izin
                    }
                ]);

                if (error) throw error;
                toast.success("Pengajuan izin/cuti berhasil terkirim! Mengalihkan ke halaman utama...", { id: tId });
                handleNavigation('/dashboard');
            }

        } catch (error: any) {
            console.error("Error submit data:", error);
            toast.error(error.message || "Gagal menyimpan data ke sistem.", { id: tId });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-mono p-4 flex flex-col items-center overflow-x-hidden relative pb-20">
            {/* <TacticalTransition isVisible={isNavigating} /> */}
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

                {/* 🚀 TAB SELECTION */}
                <div className="space-y-2 mb-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                        <Clock size={12} className="text-red-500" /> Tipe Laporan
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setTipe('ON_DUTY')}
                            className={`py-3 px-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                tipe === 'ON_DUTY'
                                    ? 'bg-red-600/10 border-red-500 text-red-500 shadow-[2px_2px_0px_#ef4444]'
                                    : 'bg-[#18181b] border-zinc-800 text-zinc-500 hover:border-zinc-700'
                            }`}
                        >
                            <Clock size={14} /> Presensi Duty
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipe('IZIN')}
                            className={`py-3 px-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                tipe === 'IZIN'
                                    ? 'bg-red-600/10 border-red-500 text-red-500 shadow-[2px_2px_0px_#ef4444]'
                                    : 'bg-[#18181b] border-zinc-800 text-zinc-500 hover:border-zinc-700'
                            }`}
                        >
                            <Palmtree size={14} /> Pengajuan Cuti
                        </button>
                    </div>
                </div>

                {/* 🚀 FORM INPUT */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    <AnimatePresence mode="wait">
                        {tipe === 'ON_DUTY' ? (
                            <motion.div
                                key="on_duty"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                {/* TANGGAL */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                        <Calendar size={12} className="text-red-500" /> Tanggal Duty
                                    </label>
                                    <input
                                        type="date"
                                        min={minDateStr} 
                                        max={currentDateStr}
                                        value={dutyForm.tanggal}
                                        onChange={(e) => setDutyForm({ ...dutyForm, tanggal: e.target.value })}
                                        className={inputStyle}
                                    />
                                </div>

                                {/* JAM DUTY & JAM OFF DUTY */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                            <Clock size={12} className="text-red-500" /> Jam Duty
                                        </label>
                                        <input
                                            type="time"
                                            value={dutyForm.jam_duty}
                                            onChange={(e) => setDutyForm({ ...dutyForm, jam_duty: e.target.value })}
                                            className={inputStyle}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                            <Clock size={12} className="text-zinc-500" /> Jam Off Duty
                                        </label>
                                        <input
                                            type="time"
                                            value={dutyForm.jam_off_duty}
                                            onChange={(e) => setDutyForm({ ...dutyForm, jam_off_duty: e.target.value })}
                                            className={inputStyle}
                                        />
                                    </div>
                                </div>

                                {/* CATATAN DUTY */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                        <FileText size={12} className="text-red-500" /> Catatan Duty / Area Patroli
                                    </label>
                                    <textarea
                                        value={dutyForm.catatan_duty}
                                        onChange={(e) => setDutyForm({ ...dutyForm, catatan_duty: e.target.value })}
                                        placeholder="Misal: Patroli area Los Santos & respon call-out 10-20..."
                                        rows={3}
                                        className={`${inputStyle} resize-none custom-scrollbar`}
                                    />
                                </div>

                                {/* UPLOAD & PREVIEW FOTO */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                        <ImageIcon size={12} className="text-red-500" /> Bukti Foto (Minimal 2, Maksimal 3)
                                    </label>

                                    {/* Grid Preview Foto */}
                                    {dutyForm.bukti_foto_urls.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            {dutyForm.bukti_foto_urls.map((url, index) => (
                                                <div key={index} className="relative group rounded-xl overflow-hidden border-2 border-zinc-800 bg-[#18181b] aspect-square">
                                                    <img src={url} alt={`Bukti ${index + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePhoto(index)}
                                                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white p-1 rounded-lg border border-zinc-950 shadow transition-all flex items-center justify-center cursor-pointer"
                                                        title="Hapus foto"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                    <span className="absolute bottom-1 left-1 bg-zinc-950/80 text-[8px] px-1.5 py-0.5 rounded text-zinc-300 font-bold">
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Tombol Upload (Hanya muncul jika belum 3 foto) */}
                                    {dutyForm.bukti_foto_urls.length < 3 && (
                                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-[#18181b] hover:border-red-500 transition-all">
                                            <div className="flex flex-col items-center justify-center pt-2 pb-2 px-4 text-center">
                                                {uploadingFile ? (
                                                    <Loader2 className="w-5 h-5 text-red-500 animate-spin mb-1" />
                                                ) : (
                                                    <Upload className="w-5 h-5 text-zinc-500 mb-1" />
                                                )}
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase truncate max-w-[260px]">
                                                    {uploadingFile ? "Mengunggah..." : "Klik untuk tambah foto"}
                                                </p>
                                                <p className="text-[8px] text-zinc-600 uppercase mt-0.5">
                                                    {dutyForm.bukti_foto_urls.length === 0 ? "Belum ada foto (Butuh min. 2)" : `${dutyForm.bukti_foto_urls.length}/3 foto terunggah`}
                                                </p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                disabled={uploadingFile}
                                            />
                                        </label>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="izin"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                {/* JENIS IZIN */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                        <Palmtree size={12} className="text-red-500" /> Jenis Izin
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['IZIN', 'CUTI', 'SAKIT'].map((j) => (
                                            <button
                                                key={j}
                                                type="button"
                                                onClick={() => setCutiForm({ ...cutiForm, jenis_izin: j })}
                                                className={`py-2 px-1 rounded-xl border-2 text-[9px] font-black uppercase transition-all ${
                                                    cutiForm.jenis_izin === j
                                                        ? 'bg-red-600/10 border-red-500 text-red-500'
                                                        : 'bg-[#18181b] border-zinc-800 text-zinc-500'
                                                }`}
                                            >
                                                {j}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* TANGGAL MULAI & TANGGAL SELESAI */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                            <Calendar size={12} className="text-red-500" /> Tanggal Mulai
                                        </label>
                                        <input
                                            type="date"
                                            value={cutiForm.tanggal_mulai}
                                            onChange={(e) => setCutiForm({ ...cutiForm, tanggal_mulai: e.target.value })}
                                            className={inputStyle}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                            <Calendar size={12} className="text-zinc-500" /> Tanggal Selesai
                                        </label>
                                        <input
                                            type="date"
                                            value={cutiForm.tanggal_selesai}
                                            onChange={(e) => setCutiForm({ ...cutiForm, tanggal_selesai: e.target.value })}
                                            className={inputStyle}
                                        />
                                    </div>
                                </div>

                                {/* ALASAN */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                        <FileText size={12} className="text-red-500" /> Alasan Pengajuan
                                    </label>
                                    <textarea
                                        value={cutiForm.alasan}
                                        onChange={(e) => setCutiForm({ ...cutiForm, alasan: e.target.value })}
                                        placeholder="Jelaskan alasan izin / cuti..."
                                        rows={4}
                                        className={`${inputStyle} resize-none custom-scrollbar`}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={isSubmitting || uploadingFile || isNavigating}
                        className="w-full py-4 mt-3 rounded-xl font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 border-2 border-zinc-950 shadow-[4px_4px_0px_#000] active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting || isNavigating ? (
                            <><Loader2 size={18} className="animate-spin" /> MENGIRIM / MENGALIHKAN...</>
                        ) : (
                            <><Send size={18} /> {tipe === 'ON_DUTY' ? 'SIMPAN PRESENSI DUTY' : 'KIRIM PENGAJUAN CUTI'}</>
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