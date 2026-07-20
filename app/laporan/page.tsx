"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Target, Zap, Search,
    Camera, Clock, Calendar as CalendarIcon, ArrowLeft,
    ShieldCheck, X, Ticket, ClipboardList, LucideIcon
} from 'lucide-react';
import { format, addDays } from "date-fns";
import { toast, Toaster } from "sonner";
import TacticalTransition from '@/app/dashboard/components/TacticalTransition';

// --- INTERFACES & TYPES ---
interface FormDataState {
    nama_petugas: string;
    pangkat: string;
    badge_number: string;
    tanggal: Date;
    waktu_shift: string;
    nama_pelaku: string;
    ktp_pelaku: string;
    pasal: string;
    total_denda: string;
    hukuman: string;
    divisi: string;
    jenis_kasus: string;
    lokasi: string;
    barang_bukti: string;
    hasil_akhir: string;
    keterangan: string;
    kendaraan: string;
    masa_penilangan: string;
    denda: string;
    kesalahan: string;
    jam_buka: string;
    jam_tutup: string;
    kendala_1: string;
    kendala_2: string;
    keterangan_1: string;
    keterangan_2: string;
    [key: string]: string | Date;
}

interface ConfigType {
    color: string;
    label: string;
    poin: number;
    icon: LucideIcon;
}

// --- UTILS ---
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border border-slate-200";
const cardShadow = "shadow-sm hover:shadow-md transition-shadow";

const inputStyle = `w-full bg-slate-50/50 ${boxBorder} rounded-xl px-3.5 py-3 text-xs font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-xs`;
const labelStyle = `text-[10px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5 tracking-wide uppercase`;

export default function LaporanMultiForm() {
    const router = useRouter();
    const [step, setStep] = useState<number>(0);
    const [tipe, setTipe] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [isNavigating, setIsNavigating] = useState<boolean>(false);

    const [formData, setFormData] = useState<FormDataState>({
        nama_petugas: "", pangkat: "", badge_number: "",
        tanggal: new Date(), waktu_shift: "",
        nama_pelaku: "", ktp_pelaku: "", pasal: "", total_denda: "", hukuman: "",
        divisi: "", jenis_kasus: "", lokasi: "", barang_bukti: "", hasil_akhir: "", keterangan: "",
        kendaraan: "", masa_penilangan: "", denda: "", kesalahan: "",
        jam_buka: "", jam_tutup: "", kendala_1: "", kendala_2: "", keterangan_1: "", keterangan_2: ""
    });

    const [fotos, setFotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    // --- BATAS WAKTU (H-3) ---
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const hMin3Str = format(addDays(new Date(), -3), 'yyyy-MM-dd');

    // --- CONFIG --- 
    const CONFIG: Record<string, ConfigType> = {
        tangkap: { color: "#22c55e", label: "Penangkapan", poin: 3, icon: ShieldAlert },
        kasus: { color: "#eab308", label: "Kasus Besar", poin: 10, icon: Target },
        patroli: { color: "#3b82f6", label: "Patroli", poin: 5, icon: Search },
        backup: { color: "#ef4444", label: "Backup", poin: 3, icon: Zap },
        tilang: { color: "#f97316", label: "Penilangan", poin: 2, icon: Ticket },
        admin: { color: "#8b5cf6", label: "Administrasi", poin: 6, icon: ClipboardList }
    };

    // 🚀 UPDATE FORMAT PESAN DISCORD (TANPA TAG ROLE)
    const getFormatMessage = (d: FormDataState) => {
        const tglStr = format(d.tanggal, "yyyy-MM-dd");
        if (tipe === 'tangkap') return `📁 **LAPORAN PENANGKAPAN**\n\`\`\`\nNama Pelaku : ${d.nama_pelaku || '-'}\nKTP Pelaku : ${d.ktp_pelaku || '-'}\nTanggal : ${tglStr}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nBadge : ${d.badge_number}\n\nPasal Dilanggar: ${d.pasal || '-'}\nHukuman: ${d.hukuman || '-'}\nTotal Denda: $ ${d.total_denda || '-'}\n\`\`\``;
        if (tipe === 'kasus') return `📁 **LAPORAN PENANGANAN KASUS BESAR**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nBadge : ${d.badge_number}\nUnit / Divisi : ${d.divisi || '-'}\n\nJenis Kasus : ${d.jenis_kasus || '-'}\nLokasi Kejadian : ${d.lokasi || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil Akhir : ${d.hasil_akhir || '-'}\n\nBarang Bukti : ${d.barang_bukti || '-'}\n\`\`\``;
        if (tipe === 'patroli') return `📁 **LAPORAN PATROLI**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nBadge : ${d.badge_number}\n\nArea Patroli : ${d.lokasi || '-'}\n\nHasil Singkat : ${d.keterangan || '-'}\n\`\`\``;
        if (tipe === 'backup') return `📁 **LAPORAN MEMBANTU BACKUP**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nBadge : ${d.badge_number}\nUnit / Divisi : ${d.divisi || '-'}\n\nLokasi Backup : ${d.lokasi || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil : ${d.hasil_akhir || '-'}\n\`\`\``;
        if (tipe === 'tilang') return `📁 **LAPORAN PENILANGAN**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nBadge : ${d.badge_number}\n\nKendaraan Berjenis : ${d.kendaraan || '-'}\nMasa Penilangan : ${d.masa_penilangan || '-'}\nDenda : $ ${d.denda || '-'}\nKesalahan : ${d.kesalahan || '-'}\n\`\`\``;
        if (tipe === 'admin') return `📁 **LAPORAN JAGA ADMINISTRASI**\n\`\`\`\nData Petugas\nNama        : ${d.nama_petugas}\nPangkat     : ${d.pangkat}\nBadge       : ${d.badge_number}\nTanggal     : ${tglStr}\n\nBuka        : ${d.jam_buka || '-'}\nTutup       : ${d.jam_tutup || '-'}\n\nKendala 1   : ${d.kendala_1 || '-'}\nKendala 2   : ${d.kendala_2 || '-'}\n\nKeterangan 1: ${d.keterangan_1 || '-'}\nKeterangan 2: ${d.keterangan_2 || '-'}\n\`\`\``;
        return "";
    };

    // --- SYNC SESSION DATA ---
    useEffect(() => {
        const sessionData = localStorage.getItem('police_session');
        if (!sessionData) {
            router.push('/');
            return;
        }
        const parsed = JSON.parse(sessionData);

        const loadProfile = async () => {
            const { data } = await supabase.from('users').select('name, pangkat, divisi').eq('discord_id', parsed.discord_id).single();
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

                setFormData(prev => ({
                    ...prev,
                    nama_petugas: rawName || "",
                    pangkat: data.pangkat,
                    badge_number: badge,
                    divisi: data.divisi || ""
                }));
            }
        };
        loadProfile();
    }, [router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length > 0) {
            const newFotos = [...fotos, ...files].slice(0, 4);
            setFotos(newFotos);
            setPreviews(newFotos.map(f => URL.createObjectURL(f)));
        }
    };

    const removeFoto = (index: number) => {
        const newFotos = fotos.filter((_, i) => i !== index);
        setFotos(newFotos);
        setPreviews(newFotos.map(f => URL.createObjectURL(f)));
    };

    const handleNavigation = (path: string) => {
        setIsNavigating(true);
        setTimeout(() => router.push(path), 3000);
    };

    // --- 🚀 LOGIKA SUBMIT ---
    const submitLaporan = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const selectedDate = new Date(formData.tanggal);
        selectedDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffDays = Math.round((today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            toast.error("TANGGAL TIDAK VALID!", { description: "Laporan tidak bisa untuk tanggal di masa depan." });
            return;
        }
        if (diffDays > 3) {
            toast.error("LAPORAN DITOLAK!", { description: "Batas maksimal pengiriman laporan adalah 3 hari ke belakang." });
            return;
        }

        if (tipe === 'admin') {
            if (fotos.length < 2) {
                toast.error("MINIMAL 2 FOTO!", { description: "Wajib lampirkan foto Jam Buka & Jam Tutup/Selesai." });
                return;
            }
            if (!formData.jam_buka || !formData.jam_tutup) {
                toast.error("JAM BUKA & TUTUP WAJIB DIISI!");
                return;
            }

            const [bukaH, bukaM] = formData.jam_buka.split(':').map(Number);
            const [tutupH, tutupM] = formData.jam_tutup.split(':').map(Number);
            const startMinutes = bukaH * 60 + bukaM;
            let endMinutes = tutupH * 60 + tutupM;

            if (endMinutes <= startMinutes) {
                endMinutes += 24 * 60;
            }

            const diffMinutes = endMinutes - startMinutes;
            if (diffMinutes < 60) {
                toast.error("DURASI JAGA DITOLAK!", { description: "Minimal waktu jaga administrasi adalah 1 Jam (60 Menit)." });
                return;
            }
        } else {
            if (fotos.length < 1) {
                toast.error("FOTO BUKTI WAJIB DILAMPIRKAN!");
                return;
            }
        }

        setLoading(true);
        const conf = CONFIG[tipe];
        const sessionData = JSON.parse(localStorage.getItem('police_session') || '{}');
        const formattedReport = getFormatMessage(formData);

        try {
            const tId = toast.loading("Mengirim Laporan ke HQ Discord...");

            const { data: configData } = await supabase.from('admin_config').select('*');

            const typeMapping: Record<string, string> = {
                tangkap: 'penangkapan', kasus: 'kasus_besar', patroli: 'patroli',
                backup: 'backup', tilang: 'penilangan', admin: 'admin'
            };
            const configKeyPrefix = typeMapping[tipe];

            const webhookUrlData = configData?.find(c => c.key === `webhook_${configKeyPrefix}`)?.value;
            const threadIdData = configData?.find(c => c.key === `thread_${configKeyPrefix}`)?.value;

            if (!webhookUrlData) throw new Error(`Webhook Discord untuk ${conf.label} belum disetting di Admin Panel!`);

            let finalWebhookUrl = webhookUrlData.includes('?') ? `${webhookUrlData}&wait=true` : `${webhookUrlData}?wait=true`;
            if (threadIdData && threadIdData.trim() !== '') {
                finalWebhookUrl += `&thread_id=${threadIdData.trim()}`;
            }

            const formDataDiscord = new FormData();
            fotos.forEach((file, index) => {
                formDataDiscord.append(`file[${index}]`, file);
            });
            formDataDiscord.append("payload_json", JSON.stringify({ content: formattedReport }));

            const discordResponse = await fetch(finalWebhookUrl, { method: "POST", body: formDataDiscord });
            if (!discordResponse.ok) throw new Error("Discord Webhook menolak laporan! Cek kembali URL/Thread ID.");

            const discordData = await discordResponse.json();
            const discordImageUrl = discordData.attachments && discordData.attachments[0] ? discordData.attachments[0].url : "";

            toast.loading("Mencatat Laporan ke Arsip Markas...", { id: tId });

            const { error: insertError } = await supabase.from('laporan_aktivitas').insert([{
                user_id_discord: sessionData.discord_id,
                jenis_laporan: conf.label,
                isi_laporan: formattedReport,
                poin_estimasi: conf.poin,
                bukti_foto: discordImageUrl,
                status: 'PENDING',
                is_sent_discord: true
            }]);

            if (insertError) throw insertError;

            toast.success(`LAPORAN ${conf.label.toUpperCase()} TERKIRIM!`, { id: tId });
            setTimeout(() => handleNavigation('/dashboard'), 1500);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan tidak dikenal";
            toast.error("TRANSMISI GAGAL", { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans p-4 pb-24 flex flex-col items-center overflow-x-hidden relative">
            <TacticalTransition isVisible={isNavigating} type="COMPUTER" />
            <Toaster position="top-center" richColors />

            <div className="w-full max-w-md flex items-center justify-between mb-6 mt-2">
                <button
                    onClick={() => {
                        if (step === 0) {
                            handleNavigation('/dashboard');
                        } else {
                            setStep(0);
                            setFotos([]);
                            setPreviews([]);
                        }
                    }}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:bg-slate-50 active:scale-95 transition-all text-slate-700"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-0.5">
                        <ShieldCheck className="text-blue-600 animate-pulse" size={14} />
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">Mandalika PD</span>
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                        {step === 0 ? "Laporan Ops" : CONFIG[tipe]?.label}
                    </h1>
                </div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <AnimatePresence mode="wait">
                    {step === 0 ? (
                        <motion.div key="s0" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-2 gap-3">
                            {Object.entries(CONFIG).map(([id, conf]) => {
                                const IconComponent = conf.icon;
                                return (
                                    <button 
                                        key={id} 
                                        onClick={() => { setTipe(id); setStep(1); }} 
                                        className={`bg-white ${boxBorder} p-4 rounded-2xl ${cardShadow} flex flex-col items-center justify-center gap-3 text-left group`}
                                    >
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform" style={{ color: conf.color }}>
                                            <IconComponent size={22} />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-xs text-slate-800 leading-tight mb-1">{conf.label}</p>
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[9px] font-medium">+{conf.poin} Poin</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div key="s1" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className={`bg-white ${boxBorder} rounded-3xl ${cardShadow} p-6`}>

                            {/* 🚀 IDENTITY BANNER */}
                            <div className="grid grid-cols-3 gap-2 items-center bg-slate-50/80 border border-slate-200 p-3 rounded-2xl mb-6 shadow-xs text-center">
                                <div className="truncate text-left px-1">
                                    <p className="text-[9px] font-medium text-slate-400 uppercase">Nama</p>
                                    <p className="text-[11px] font-bold text-slate-800 truncate">{formData.nama_petugas}</p>
                                </div>
                                <div className="truncate border-x border-slate-200 px-1">
                                    <p className="text-[9px] font-medium text-slate-400 uppercase">Pangkat</p>
                                    <p className="text-[11px] font-bold text-blue-600 truncate">{formData.pangkat}</p>
                                </div>
                                <div className="truncate text-right px-1">
                                    <p className="text-[9px] font-medium text-slate-400 uppercase">Badge</p>
                                    <p className="text-[11px] font-bold text-slate-800 truncate">#{formData.badge_number}</p>
                                </div>
                            </div>

                            <form onSubmit={submitLaporan} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className={labelStyle}><CalendarIcon size={12} /> Tanggal</label>
                                        <input
                                            type="date"
                                            value={format(formData.tanggal, 'yyyy-MM-dd')}
                                            min={hMin3Str}
                                            max={todayStr}
                                            onChange={(e) => setFormData({ ...formData, tanggal: new Date(e.target.value || new Date()) })}
                                            className={inputStyle}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelStyle}><Clock size={12} /> Shift</label>
                                        <select name="waktu_shift" required value={formData.waktu_shift} onChange={handleInputChange} className={inputStyle}>
                                            <option value="">-- PILIH --</option>
                                            <option value="Pagi">PAGI</option><option value="Siang">SIANG</option>
                                            <option value="Sore">SORE</option><option value="Malam">MALAM</option>
                                        </select>
                                    </div>
                                </div>

                                {tipe === 'tangkap' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><label className={labelStyle}>Tersangka</label><input name="nama_pelaku" placeholder="Nama..." required onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-1"><label className={labelStyle}>No. KTP</label><input name="ktp_pelaku" placeholder="KTP..." required onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><label className={labelStyle}>Pasal</label><input name="pasal" placeholder="Pasal..." required onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-1"><label className={labelStyle}>Denda ($)</label><input name="total_denda" type="number" placeholder="Nominal..." required onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="space-y-1"><label className={labelStyle}>Vonis Hukuman</label><input name="hukuman" placeholder="Lama Kurungan..." required onChange={handleInputChange} className={inputStyle} /></div>
                                    </>
                                )}

                                {(tipe === 'kasus' || tipe === 'patroli' || tipe === 'backup') && (
                                    <>
                                        {tipe === 'kasus' && <div className="space-y-1"><label className={labelStyle}>Jenis Kasus</label><input name="jenis_kasus" placeholder="Misal: Perampokan..." required onChange={handleInputChange} className={inputStyle} /></div>}
                                        <div className="space-y-1"><label className={labelStyle}>Lokasi Kejadian</label><input name="lokasi" placeholder="Area / Nama Jalan..." required onChange={handleInputChange} className={inputStyle} /></div>
                                        <div className="space-y-1"><label className={labelStyle}>Kronologi / Laporan</label><textarea name="keterangan" placeholder="Ceritakan detail operasi..." required onChange={handleInputChange} className={cn(inputStyle, "min-h-25 resize-none")} /></div>
                                        {(tipe === 'kasus' || tipe === 'backup') && <div className="space-y-1"><label className={labelStyle}>Hasil Akhir</label><input name="hasil_akhir" placeholder="Status pelaku/situasi..." required onChange={handleInputChange} className={inputStyle} /></div>}
                                        {tipe === 'kasus' && <div className="space-y-1"><label className={labelStyle}>Barang Bukti Sitaan</label><input name="barang_bukti" placeholder="Senjata, Uang..." required onChange={handleInputChange} className={inputStyle} /></div>}
                                    </>
                                )}

                                {tipe === 'tilang' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className={labelStyle}>Jenis Kendaraan</label>
                                                <select name="kendaraan" required value={formData.kendaraan} onChange={handleInputChange} className={inputStyle}>
                                                    <option value="">-- PILIH --</option>
                                                    <option value="Roda 2">Roda 2</option>
                                                    <option value="Roda 4">Roda 4</option>
                                                    <option value="Roda 6+">Roda 6+</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelStyle}>Masa Penilangan</label>
                                                <input name="masa_penilangan" placeholder="Misal: 1 Minggu" required onChange={handleInputChange} className={inputStyle} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={labelStyle}>Denda ($)</label>
                                            <input name="denda" type="number" placeholder="Nominal Denda..." required onChange={handleInputChange} className={inputStyle} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={labelStyle}>Kesalahan</label>
                                            <textarea name="kesalahan" placeholder="Tuliskan kesalahan pelanggar..." required onChange={handleInputChange} className={cn(inputStyle, "min-h-20 resize-none")} />
                                        </div>
                                    </>
                                )}

                                {tipe === 'admin' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className={labelStyle}><Clock size={12} /> Jam Buka</label>
                                                <input type="time" name="jam_buka" required onChange={handleInputChange} className={inputStyle} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={labelStyle}><Clock size={12} /> Jam Tutup</label>
                                                <input type="time" name="jam_tutup" required onChange={handleInputChange} className={inputStyle} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={labelStyle}>Kendala 1 (Kosongkan jika aman)</label>
                                            <input name="kendala_1" placeholder="cth. Terjadi mati lampu..." onChange={handleInputChange} className={inputStyle} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={labelStyle}>Kendala 2 (Kosongkan jika aman)</label>
                                            <input name="kendala_2" placeholder="cth. Perusuh di lobi..." onChange={handleInputChange} className={inputStyle} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={labelStyle}>Keterangan 1</label>
                                            <input name="keterangan_1" placeholder="cth. Administrasi berjalan dengan tertib" required onChange={handleInputChange} className={inputStyle} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={labelStyle}>Keterangan 2 (Opsional)</label>
                                            <input name="keterangan_2" placeholder="cth. Tidak ditemukan pelanggaran" onChange={handleInputChange} className={inputStyle} />
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className={labelStyle}><Camera size={12} /> Bukti Visual</label>
                                        {tipe === 'admin' && <span className="text-[9px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">Min. 2 Foto</span>}
                                    </div>

                                    <div className="flex flex-wrap gap-2.5 items-center">
                                        {previews.map((prev, index) => (
                                            <div key={index} className="relative w-16 h-16 shrink-0 border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={prev} alt={`Bukti ${index + 1}`} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeFoto(index)} className="absolute top-1 right-1 bg-slate-900/80 hover:bg-rose-600 text-white p-1 rounded-full backdrop-blur-xs transition-colors"><X size={10} /></button>
                                            </div>
                                        ))}

                                        {previews.length < 4 && (
                                            <label className="w-16 h-16 shrink-0 border border-dashed border-slate-300 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-100/80 transition-colors">
                                                <Camera size={16} className="text-slate-400" />
                                                <span className="text-[9px] font-medium text-slate-400 uppercase leading-none">Tambah</span>
                                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <button disabled={loading} type="submit" className="w-full py-3.5 mt-4 rounded-xl font-semibold tracking-wide text-white transition-all flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 shadow-sm active:scale-[0.99] disabled:opacity-50">
                                    {loading ? "TRANSMITTING..." : "KIRIM LAPORAN"}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}