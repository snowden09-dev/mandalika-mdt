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
const boxBorder = "border border-zinc-800/80";
const cardShadow = "shadow-lg shadow-black/40";

const inputStyle = `w-full bg-zinc-900/90 ${boxBorder} rounded-xl px-3.5 py-3 text-xs font-medium text-zinc-100 placeholder-zinc-500 outline-none focus:bg-zinc-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-xs`;
const labelStyle = `text-[10px] font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5 tracking-wider uppercase`;

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
        kendaraan: "", masa_penilangan: "", denda: "", kesalahan: ""
    });

    const [fotos, setFotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    // --- BATAS WAKTU (H-3) ---
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const hMin3Str = format(addDays(new Date(), -3), 'yyyy-MM-dd');

    // --- CONFIG --- 
    const CONFIG: Record<string, ConfigType> = {
        tangkap: { color: "#ef4444", label: "Penangkapan", poin: 3, icon: ShieldAlert },
        kasus: { color: "#ef4444", label: "Kasus Besar", poin: 10, icon: Target },
        patroli: { color: "#ef4444", label: "Patroli", poin: 5, icon: Search },
        backup: { color: "#ef4444", label: "Backup", poin: 3, icon: Zap },
        tilang: { color: "#ef4444", label: "Penilangan", poin: 2, icon: Ticket },
        admin: { color: "#ef4444", label: "Administrasi", poin: 6, icon: ClipboardList }
    };

    // 🚀 FORMAT PESAN DISCORD
    const getFormatMessage = (d: FormDataState) => {
        const tglStr = format(d.tanggal, "yyyy-MM-dd");
        if (tipe === 'tangkap') return `📁 **LAPORAN PENANGKAPAN**\n\`\`\`\nNama Pelaku : ${d.nama_pelaku || '-'}\nKTP Pelaku : ${d.ktp_pelaku || '-'}\nTanggal : ${tglStr}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nBadge : ${d.badge_number}\n\nPasal Dilanggar: ${d.pasal || '-'}\nHukuman: ${d.hukuman || '-'}\nTotal Denda: $ ${d.total_denda || '-'}\n\`\`\``;
        if (tipe === 'kasus') return `📁 **LAPORAN PENANGANAN KASUS BESAR**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nBadge : ${d.badge_number}\nUnit / Divisi : ${d.divisi || '-'}\n\nJenis Kasus : ${d.jenis_kasus || '-'}\nLokasi Kejadian : ${d.lokasi || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil Akhir : ${d.hasil_akhir || '-'}\n\nBarang Bukti : ${d.barang_bukti || '-'}\n\`\`\``;
        if (tipe === 'patroli') return `📁 **LAPORAN PATROLI**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nBadge : ${d.badge_number}\n\nArea Patroli : ${d.lokasi || '-'}\n\nHasil Singkat : ${d.keterangan || '-'}\n\`\`\``;
        if (tipe === 'backup') return `📁 **LAPORAN MEMBANTU BACKUP**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nBadge : ${d.badge_number}\nUnit / Divisi : ${d.divisi || '-'}\n\nLokasi Backup : ${d.lokasi || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil : ${d.hasil_akhir || '-'}\n\`\`\``;
        if (tipe === 'tilang') return `📁 **LAPORAN PENILANGAN**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nBadge : ${d.badge_number}\n\nKendaraan Berjenis : ${d.kendaraan || '-'}\nMasa Penilangan : ${d.masa_penilangan || '-'}\nDenda : $ ${d.denda || '-'}\nKesalahan : ${d.kesalahan || '-'}\n\`\`\``;
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

        if (fotos.length < 1) {
            toast.error("FOTO BUKTI WAJIB DILAMPIRKAN!");
            return;
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
                backup: 'backup', tilang: 'penilangan'
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
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 pb-24 flex flex-col items-center overflow-x-hidden relative">
            <TacticalTransition isVisible={isNavigating} type="COMPUTER" />
            <Toaster position="top-center" richColors theme="dark" />

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
                    className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xs hover:bg-zinc-800 active:scale-95 transition-all text-zinc-300"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-0.5">
                        <ShieldCheck className="text-red-500 animate-pulse" size={14} />
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500">Mandalika PD</span>
                    </div>
                    <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
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
                                        onClick={() => {
                                            if (id === 'admin') {
                                                toast.info("INFORMASI ADMINISTRASI", {
                                                    description: "Laporan Jaga Administrasi dilakukan langsung melalui Discord HQ."
                                                });
                                                return;
                                            }
                                            setTipe(id); 
                                            setStep(1); 
                                        }} 
                                        className={`bg-zinc-900/60 ${boxBorder} p-4 rounded-2xl ${cardShadow} flex flex-col items-center justify-center gap-3 text-left group hover:border-red-500/50 hover:bg-zinc-900 transition-all`}
                                    >
                                        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:scale-105 group-hover:border-red-500/30 transition-all text-red-500">
                                            <IconComponent size={22} />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-xs text-zinc-200 leading-tight mb-1">{conf.label}</p>
                                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md text-[9px] font-medium">+{conf.poin} Poin</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div key="s1" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className={`bg-zinc-900/80 backdrop-blur-md ${boxBorder} rounded-3xl ${cardShadow} p-6`}>

                            {/* 🚀 IDENTITY BANNER */}
                            <div className="grid grid-cols-3 gap-2 items-center bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-2xl mb-6 shadow-xs text-center">
                                <div className="truncate text-left px-1">
                                    <p className="text-[9px] font-medium text-zinc-500 uppercase">Nama</p>
                                    <p className="text-[11px] font-bold text-zinc-200 truncate">{formData.nama_petugas}</p>
                                </div>
                                <div className="truncate border-x border-zinc-800 px-1">
                                    <p className="text-[9px] font-medium text-zinc-500 uppercase">Pangkat</p>
                                    <p className="text-[11px] font-bold text-red-500 truncate">{formData.pangkat}</p>
                                </div>
                                <div className="truncate text-right px-1">
                                    <p className="text-[9px] font-medium text-zinc-500 uppercase">Badge</p>
                                    <p className="text-[11px] font-bold text-zinc-200 truncate">#{formData.badge_number}</p>
                                </div>
                            </div>

                            <form onSubmit={submitLaporan} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className={labelStyle}><CalendarIcon size={12} className="text-red-500" /> Tanggal</label>
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
                                        <label className={labelStyle}><Clock size={12} className="text-red-500" /> Shift</label>
                                        <select name="waktu_shift" required value={formData.waktu_shift} onChange={handleInputChange} className={inputStyle}>
                                            <option value="" className="bg-zinc-900">-- PILIH --</option>
                                            <option value="Pagi" className="bg-zinc-900">PAGI</option>
                                            <option value="Siang" className="bg-zinc-900">SIANG</option>
                                            <option value="Sore" className="bg-zinc-900">SORE</option>
                                            <option value="Malam" className="bg-zinc-900">MALAM</option>
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
                                                    <option value="" className="bg-zinc-900">-- PILIH --</option>
                                                    <option value="Roda 2" className="bg-zinc-900">Roda 2</option>
                                                    <option value="Roda 4" className="bg-zinc-900">Roda 4</option>
                                                    <option value="Roda 6+" className="bg-zinc-900">Roda 6+</option>
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

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className={labelStyle}><Camera size={12} className="text-red-500" /> Bukti Visual</label>
                                    </div>

                                    <div className="flex flex-wrap gap-2.5 items-center">
                                        {previews.map((prev, index) => (
                                            <div key={index} className="relative w-16 h-16 shrink-0 border border-zinc-800 rounded-2xl overflow-hidden shadow-xs bg-zinc-900">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={prev} alt={`Bukti ${index + 1}`} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeFoto(index)} className="absolute top-1 right-1 bg-zinc-950/80 hover:bg-red-600 text-white p-1 rounded-full backdrop-blur-xs transition-colors"><X size={10} /></button>
                                            </div>
                                        ))}

                                        {previews.length < 4 && (
                                            <label className="w-16 h-16 shrink-0 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-red-500/50 hover:bg-zinc-900 transition-all">
                                                <Camera size={16} className="text-zinc-500" />
                                                <span className="text-[9px] font-medium text-zinc-500 uppercase leading-none">Tambah</span>
                                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <button disabled={loading} type="submit" className="w-full py-3.5 mt-4 rounded-xl font-semibold tracking-wider text-white transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/30 active:scale-[0.99] disabled:opacity-50">
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