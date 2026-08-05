"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Banknote, FileText, ChevronLeft, ChevronRight, 
    CheckCircle2, XCircle, Clock, ShieldCheck, Calendar, Send, Loader2, Award, AlertCircle 
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, getDay, parseISO, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PayrollLog {
    id: string | number;
    jumlah_gaji: number | string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: string;
}

interface PayrollProps {
    currentLogs: PayrollLog[];
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
    discordId: string;
    onRefresh?: () => void;
}

const inputStyle = "w-full bg-[#18181b] border-2 border-zinc-800 focus:border-red-500 rounded-xl p-3.5 text-xs font-bold outline-none text-zinc-100 placeholder-zinc-600 transition-all uppercase tracking-wider cursor-pointer";

export default function SectionPayroll({ currentLogs, currentPage, setCurrentPage, totalPages, discordId, onRefresh }: PayrollProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userProfile, setUserProfile] = useState<{ pangkat: string; gaji_pokok: number } | null>(null);

    // Default minggu ini (Senin - Minggu)
    const today = new Date();
    const defaultStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const defaultEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const [form, setForm] = useState({
        tanggal_mulai: defaultStart,
        tanggal_selesai: defaultEnd
    });

    // Ambil data pangkat & gaji user dari database
    useEffect(() => {
        async function fetchUserProfile() {
            if (!discordId) return;
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('pangkat, gaji_pokok')
                    .eq('discord_id', discordId)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setUserProfile({
                        pangkat: data.pangkat || 'Anggota',
                        gaji_pokok: data.gaji_pokok || 0
                    });
                }
            } catch (err) {
                console.error("Gagal memuat profil gaji:", err);
            }
        }
        fetchUserProfile();
    }, [discordId]);

    // Handler Pengajuan Gaji Mingguan dengan Validasi Ketat
    const handleSubmitClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!discordId) {
            return toast.error("Identitas Discord tidak ditemukan. Silakan login ulang.");
        }
        if (!form.tanggal_mulai || !form.tanggal_selesai) {
            return toast.error("Rentang periode tanggal wajib dipilih!");
        }

        const startDate = parseISO(form.tanggal_mulai);
        const endDate = parseISO(form.tanggal_selesai);

        // 1. Validasi Hari Senin - Minggu
        const startDay = getDay(startDate); // 1 = Senin
        const endDay = getDay(endDate);     // 0 = Minggu

        if (startDay !== 1 || endDay !== 0) {
            return toast.error("Periode wajib dipilih dari hari SENIN sampai MINGGU!");
        }

        // 2. Validasi Maksimal 2 Minggu ke Belakang (14 hari)
        const diffDays = differenceInDays(new Date(), startDate);
        if (diffDays > 14) {
            return toast.error("Maksimal pengajuan gaji adalah 2 minggu ke belakang!");
        }

        if (startDate > new Date()) {
            return toast.error("Tanggal mulai tidak boleh di masa depan!");
        }

        setIsSubmitting(true);
        const tId = toast.loading("Memvalidasi dan mengirim pengajuan gaji...");

        try {
            // 3. Cek Keamanan Database: Apakah sudah pernah mengajukan di rentang periode yang sama
            const { data: existing, error: checkError } = await supabase
                .from('gaji')
                .select('id')
                .eq('user_id_discord', discordId)
                .eq('tanggal_mulai', form.tanggal_mulai)
                .eq('tanggal_selesai', form.tanggal_selesai)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existing) {
                setIsSubmitting(false);
                return toast.error("Gagal: Anda sudah pernah mengajukan klaim untuk rentang periode minggu ini!", { id: tId });
            }

            // Insert pengajuan baru dengan status PENDING ke tabel database admin
            const { error: insertError } = await supabase.from('gaji').insert([
                {
                    user_id_discord: discordId,
                    tanggal_mulai: form.tanggal_mulai,
                    tanggal_selesai: form.tanggal_selesai,
                    status: 'PENDING',
                    jumlah_gaji: userProfile?.gaji_pokok || 0 
                }
            ]);

            if (insertError) throw insertError;

            toast.success("Pengajuan gaji mingguan berhasil dikirim! Menunggu verifikasi pimpinan.", { id: tId });
            setForm({ tanggal_mulai: defaultStart, tanggal_selesai: defaultEnd });
            if (onRefresh) onRefresh();

        } catch (error: any) {
            console.error("Gagal ajukan gaji:", error);
            toast.error(error.message || "Gagal mengirim pengajuan gaji ke sistem.", { id: tId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20 text-white"
        >
            {/* INFORMASI GAJI BERDASARKAN PANGKAT */}
            <div className="bg-[#18181b] border-2 border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500">
                        <Award size={28} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Informasi Pangkat & Gaji Standar</span>
                        <h3 className="text-lg font-black uppercase tracking-wider text-zinc-100">
                            {userProfile?.pangkat || 'Memuat Pangkat...'}
                        </h3>
                    </div>
                </div>
                <div className="text-right bg-[#121214] px-5 py-3 rounded-xl border-2 border-zinc-800 w-full md:w-auto">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">Estimasi Gaji / Minggu</span>
                    <span className="text-xl font-black text-emerald-400">
                        ${Number(userProfile?.gaji_pokok || 0).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* FORM PENGAJUAN GAJI */}
            <div className="bg-[#121214] border-2 border-zinc-800 rounded-[28px] p-6 md:p-10 shadow-[4px_4px_0px_#ef4444] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-600/10 border-2 border-red-500/20 rounded-2xl text-red-500">
                        <Banknote size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-zinc-100">
                            Form Pengajuan Gaji Mingguan
                        </h2>
                        <p className="text-xs text-zinc-400 font-medium">
                            Pilih periode kalender mingguan sesuai ketentuan kedinasan.
                        </p>
                    </div>
                </div>

                <div className="mb-6 p-4 bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-400 text-xs font-bold tracking-wide">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <span className="block font-black uppercase mb-0.5">Catatan Penting Periode:</span>
                        Pilih periode kalender wajib dari hari **Senin** sampai hari **Minggu**. Jika rentang bukan Senin–Minggu atau melewati batas maksimal 2 minggu ke belakang, sistem akan menolak pengajuan secara otomatis.
                    </div>
                </div>

                <form onSubmit={handleSubmitClaim} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                <Calendar size={12} className="text-red-500" /> Tanggal Mulai (Wajib Hari Senin)
                            </label>
                            <input 
                                type="date"
                                value={form.tanggal_mulai}
                                onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
                                className={inputStyle}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic flex items-center gap-2">
                                <Calendar size={12} className="text-red-500" /> Tanggal Selesai (Wajib Hari Minggu)
                            </label>
                            <input 
                                type="date"
                                value={form.tanggal_selesai}
                                onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
                                className={inputStyle}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 mt-4 rounded-xl font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 border-2 border-zinc-950 shadow-[4px_4px_0px_#000] active:translate-y-1 disabled:opacity-50 cursor-pointer"
                    >
                        {isSubmitting ? (
                            <><Loader2 size={18} className="animate-spin" /> MEMPROSES PENGAJUAN...</>
                        ) : (
                            <><Send size={18} /> AJUKAN GAJI PERIODE INI</>
                        )}
                    </button>
                </form>
            </div>

            {/* RIWAYAT PENGAJUAN GAJI */}
            <div className="bg-[#121214] border-2 border-zinc-800 rounded-[28px] flex flex-col overflow-hidden shadow-[4px_4px_0px_#27272a]">
                <div className="border-b-2 border-zinc-800 bg-[#18181b] p-5 md:px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl">
                            <FileText size={18} className="text-red-500" />
                        </div>
                        <h3 className="font-black uppercase tracking-wider text-sm text-zinc-100">Riwayat Pengajuan Gaji</h3>
                    </div>
                    <ShieldCheck size={20} className="text-emerald-500 hidden md:block" />
                </div>

                <div className="p-5 md:p-6 min-h-[300px]">
                    <AnimatePresence mode='wait'>
                        <motion.div 
                            key={currentPage} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            {currentLogs.length === 0 ? (
                                <div className="text-center py-20 flex flex-col items-center justify-center text-zinc-500">
                                    <Clock size={40} className="mb-3 opacity-30 text-red-500" />
                                    <p className="text-xs font-black uppercase tracking-widest">Belum Ada Riwayat Pengajuan</p>
                                </div>
                            ) : (
                                currentLogs.map((log) => (
                                    <div 
                                        key={log.id} 
                                        className="p-4 md:p-5 border-2 border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#18181b] hover:border-zinc-700 transition-all"
                                    >
                                        <div>
                                            <div className="flex items-baseline gap-1 mb-1">
                                                <span className="text-xs font-black text-red-500">$</span>
                                                <h4 className="text-xl font-black tracking-tight text-zinc-100">
                                                    {Number(log.jumlah_gaji || 0).toLocaleString()}
                                                </h4>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                <Clock size={12} className="text-red-500" />
                                                {format(parseISO(log.tanggal_mulai), 'dd MMM yyyy', { locale: id })} - {format(parseISO(log.tanggal_selesai), 'dd MMM yyyy', { locale: id })}
                                            </p>
                                        </div>

                                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit border-2
                                            ${log.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                                              log.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                                              'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}
                                        >
                                            {log.status === 'PAID' ? <CheckCircle2 size={14} /> : 
                                             log.status === 'REJECTED' ? <XCircle size={14} /> : 
                                             <Clock size={14} />}
                                            
                                            {log.status === 'PAID' ? 'CAIR' : 
                                             log.status === 'REJECTED' ? 'DITOLAK' : 'MENUNGGU VERIFIKASI'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="p-4 md:p-5 border-t-2 border-zinc-800 flex justify-between items-center bg-[#18181b]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Halaman {currentPage} dari {totalPages || 1}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(p => p - 1)} 
                            className="p-2.5 rounded-xl bg-[#121214] text-zinc-300 border-2 border-zinc-800 hover:border-red-500 disabled:opacity-30 disabled:hover:border-zinc-800 transition-all cursor-pointer"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            disabled={currentPage === totalPages || totalPages === 0} 
                            onClick={() => setCurrentPage(p => p + 1)} 
                            className="p-2.5 rounded-xl bg-[#121214] text-zinc-300 border-2 border-zinc-800 hover:border-red-500 disabled:opacity-30 disabled:hover:border-zinc-800 transition-all cursor-pointer"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}