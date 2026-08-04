"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ShieldAlert, Send, Clock, FileText, Upload,
    Calendar, Loader2, Image as ImageIcon, Palmtree
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

    // Identitas Pengguna
    const [identity, setIdentity] = useState({
        nama: 'MENDETEKSI...',
        pangkat: '...',
        badgeNumber: '...',
        divisi: '...',
        discordId: ''
    });

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    // Tab State
    const [tipe, setTipe] = useState<TipeAbsen>('ON_DUTY');

    // Form State untuk Presensi Duty
    const [dutyForm, setDutyForm] = useState({
        tanggal: currentDate,
        jam_duty: currentTime,
        jam_off_duty: '',
        catatan_duty: '',
        bukti_foto_url: '',
        kategori_presensi: 'OPERASIONAL'
    });

    // Form State untuk Pengajuan Cuti / Izin
    const [cutiForm, setCutiForm] = useState({
        tanggal_mulai: currentDate,
        tanggal_selesai: currentDate,
        jenis_izin: 'IZIN',
        alasan: ''
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

    // 📤 Upload Foto Ke Storage: bucket 'bukti_absen', folder 'duty/'
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("File harus berupa gambar (PNG/JPG/JPEG)!");
            return;
        }

        setUploadingFile(true);
        const tId = toast.loading("Mengunggah foto ke folder duty...");

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${identity.discordId}_${Date.now()}.${fileExt}`;
            const filePath = `duty/${fileName}`; // Folder: duty

            const { error: uploadError } = await supabase.storage
                .from('bukti-absen') // Bucket: bukti_absen
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('bukti-absen')
                .getPublicUrl(filePath);

            setDutyForm(prev => ({ ...prev, bukti_foto_url: publicUrl }));
            setSelectedFileName(file.name);
            toast.success("Bukti foto berhasil diunggah!", { id: tId });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Gagal mengunggah gambar ke storage.";
            console.error("Gagal upload:", error);
            toast.error(errorMessage, { id: tId });
        } finally {
            setUploadingFile(false);
        }
    };

    // 📝 Submit Form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const tId = toast.loading("Mengirim transmisi data...");

        try {
            if (tipe === 'ON_DUTY') {
                // Validasi On Duty
                if (!dutyForm.tanggal) return toast.error("Tanggal wajib diisi!", { id: tId });
                if (!dutyForm.jam_duty) return toast.error("Jam duty wajib diisi!", { id: tId });
                if (!dutyForm.bukti_foto_url) return toast.error("Bukti foto wajib diupload!", { id: tId });

                // Hitung durasi menit jika jam_off_duty terisi
                let durasi = 0;
                let startTimeISO = `${dutyForm.tanggal}T${dutyForm.jam_duty}:00+00`;
                let endTimeISO = null;

                if (dutyForm.jam_off_duty) {
                    endTimeISO = `${dutyForm.tanggal}T${dutyForm.jam_off_duty}:00+00`;
                    const startMs = new Date(`${dutyForm.tanggal}T${dutyForm.jam_duty}:00`).getTime();
                    const endMs = new Date(`${dutyForm.tanggal}T${dutyForm.jam_off_duty}:00`).getTime();
                    if (endMs > startMs) {
                        durasi = Math.floor((endMs - startMs) / (1000 * 60));
                    }
                }

                // Insert ke tabel: presensi_duty
                const { error } = await supabase.from('presensi_duty').insert([
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
                        bukti_foto: [dutyForm.bukti_foto_url], // Array URL foto
                        kategori_presensi: dutyForm.kategori_presensi
                    }
                ]);

                if (error) throw error;
                toast.success("Presensi Duty berhasil dicatat!", { id: tId });

                // Reset Duty Form
                setDutyForm({
                    tanggal: currentDate,
                    jam_duty: currentTime,
                    jam_off_duty: '',
                    catatan_duty: '',
                    bukti_foto_url: '',
                    kategori_presensi: 'OPERASIONAL'
                });
                setSelectedFileName(null);

            } else {
                // Validasi Cuti/Izin
                if (!cutiForm.tanggal_mulai) return toast.error("Tanggal mulai wajib diisi!", { id: tId });
                if (!cutiForm.tanggal_selesai) return toast.error("Tanggal selesai wajib diisi!", { id: tId });
                if (!cutiForm.alasan) return toast.error("Alasan wajib diisi!", { id: tId });

                // Insert ke tabel: pengajuan_cuti
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
                toast.success("Pengajuan izin/cuti berhasil terkirim!", { id: tId });

                // Reset Cuti Form
                setCutiForm({
                    tanggal_mulai: currentDate,
                    tanggal_selesai: currentDate,
                    jenis_izin: 'IZIN',
                    alasan: ''
                });
            }

        } catch (error: any) {
            console.error("Error submit data:", error);
            toast.error(error.message || "Gagal menyimpan data ke sistem.", { id: tId });
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
                            /* ---------------- ON DUTY FORM ---------------- */
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

                                {/* UPLOAD FOTO (BUCKET: bukti_absen, FOLDER: duty) */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                        <ImageIcon size={12} className="text-red-500" /> Upload Bukti Foto (duty/)
                                    </label>
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-[#18181b] hover:border-red-500 transition-all">
                                        <div className="flex flex-col items-center justify-center pt-3 pb-3 px-4 text-center">
                                            {uploadingFile ? (
                                                <Loader2 className="w-6 h-6 text-red-500 animate-spin mb-1" />
                                            ) : (
                                                <Upload className="w-6 h-6 text-zinc-500 mb-1" />
                                            )}
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase truncate max-w-[260px]">
                                                {selectedFileName ? selectedFileName : "Klik untuk unggah gambar"}
                                            </p>
                                            <p className="text-[8px] text-zinc-600 uppercase mt-0.5">Tersimpan di: bukti_absen/duty/</p>
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
                        ) : (
                            /* ---------------- CUTI / IZIN FORM ---------------- */
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
                        disabled={isSubmitting || uploadingFile}
                        className="w-full py-4 mt-3 rounded-xl font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 border-2 border-zinc-950 shadow-[4px_4px_0px_#000] active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <><Loader2 size={18} className="animate-spin" /> MENGIRIM...</>
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