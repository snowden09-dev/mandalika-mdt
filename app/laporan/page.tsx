"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Target, Zap, Search,
    Camera, Clock, Calendar as CalendarIcon, ArrowLeft,
    ShieldCheck, X, Ticket, ClipboardList
} from 'lucide-react';
import { format, parseISO } from "date-fns";
import { toast, Toaster } from "sonner";
import TacticalTransition from '@/app/dashboard/components/TacticalTransition';

// --- UTILS (MOBILE SCALED) ---
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[2px] border-slate-950";
const cardShadow = "shadow-[4px_4px_0px_#000]";
const fontBlack = "font-mono font-black italic uppercase tracking-tighter";

const inputStyle = `w-full bg-[#f8fafc] ${boxBorder} rounded-lg px-3 py-2.5 text-[11px] font-bold outline-none focus:bg-white focus:border-blue-600 transition-all shadow-[2px_2px_0px_#000]`;
const labelStyle = `text-[9px] ${fontBlack} text-slate-500 mb-1 flex items-center gap-1.5 tracking-wider`;

export default function LaporanMultiForm() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [tipe, setTipe] = useState("");
    const [loading, setLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const [formData, setFormData] = useState({
        nama_petugas: "", pangkat: "", tanggal: new Date(), waktu_shift: "",
        nama_pelaku: "", ktp_pelaku: "", pasal: "", total_denda: "", hukuman: "",
        divisi: "", jenis_kasus: "", lokasi: "", barang_bukti: "", hasil_akhir: "", keterangan: "",
        kendaraan: "", masa_penilangan: "", denda: "", kesalahan: "",
        // 🚀 NEW FIELDS UNTUK ADMINISTRASI
        jam_buka: "", jam_tutup: "", kendala_1: "", kendala_2: "", keterangan_1: "", keterangan_2: ""
    });

    const [foto, setFoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const MENTION_ROLE = "<@&1393366590942085220>";

    // --- CONFIG --- 
    const CONFIG: any = {
        tangkap: { color: "#22c55e", label: "Penangkapan", poin: 3, icon: ShieldAlert },
        kasus: { color: "#eab308", label: "Kasus Besar", poin: 10, icon: Target },
        patroli: { color: "#3b82f6", label: "Patroli", poin: 5, icon: Search },
        backup: { color: "#ef4444", label: "Backup", poin: 3, icon: Zap },
        tilang: { color: "#f97316", label: "Penilangan", poin: 2, icon: Ticket },
        admin: { color: "#8b5cf6", label: "Administrasi", poin: 6, icon: ClipboardList } // 🚀 NEW MENU
    };

    const getFormatMessage = (d: any) => {
        const tglStr = format(d.tanggal, "yyyy-MM-dd");
        if (tipe === 'tangkap') return `📁 **LAPORAN PENANGKAPAN**\n\`\`\`\nNama Pelaku : ${d.nama_pelaku || '-'}\nKTP Pelaku : ${d.ktp_pelaku || '-'}\nTanggal : ${tglStr}\n\nNama Petugas : ${d.nama_petugas}\n\nPasal Dilanggar: ${d.pasal || '-'}\nHukuman: ${d.hukuman || '-'}\nTotal Denda: $ ${d.total_denda || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (tipe === 'kasus') return `📁 **LAPORAN PENANGANAN KASUS BESAR**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nUnit / Divisi : ${d.divisi || '-'}\n\nJenis Kasus : ${d.jenis_kasus || '-'}\nLokasi Kejadian : ${d.lokasi || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil Akhir : ${d.hasil_akhir || '-'}\n\nBarang Bukti : ${d.barang_bukti || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (tipe === 'patroli') return `📁 **LAPORAN PATROLI**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\n\nArea Patroli : ${d.lokasi || '-'}\n\nHasil Singkat : ${d.keterangan || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (tipe === 'backup') return `📁 **LAPORAN MEMBANTU BACKUP**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nUnit / Divisi : ${d.divisi || '-'}\n\nLokasi Backup : ${d.lokasi || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil : ${d.hasil_akhir || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (tipe === 'tilang') return `📁 **LAPORAN PENILANGAN**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\n\nKendaraan Berjenis : ${d.kendaraan || '-'}\nMasa Penilangan : ${d.masa_penilangan || '-'}\nDenda : $ ${d.denda || '-'}\nKesalahan : ${d.kesalahan || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (tipe === 'admin') return `📁 **LAPORAN JAGA ADMINISTRASI**\n\`\`\`\nNama        : ${d.nama_petugas}\nPangkat     : ${d.pangkat}\nTanggal     : ${tglStr}\n\nBuka        : ${d.jam_buka || '-'}\nTutup       : ${d.jam_tutup || '-'}\n\nKendala 1   : ${d.kendala_1 || '-'}\nKendala 2   : ${d.kendala_2 || '-'}\n\nKeterangan 1: ${d.keterangan_1 || '-'}\nKeterangan 2: ${d.keterangan_2 || '-'}\n\`\`\`\n${MENTION_ROLE}`;
    };

    // --- SYNC SESSION DATA ---
    useEffect(() => {
        const sessionData = localStorage.getItem('police_session');
        if (!sessionData) return router.push('/');
        const parsed = JSON.parse(sessionData);

        const loadProfile = async () => {
            const { data } = await supabase.from('users').select('name, pangkat, divisi').eq('discord_id', parsed.discord_id).single();
            if (data) {
                const cleanName = data.name.includes('|') ? data.name.split('|').pop()?.trim() : data.name;
                setFormData(prev => ({ ...prev, nama_petugas: cleanName || "", pangkat: data.pangkat, divisi: data.divisi || "" }));
            }
        };
        loadProfile();
    }, [router]);

    const handleInputChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleNavigation = (path: string) => {
        setIsNavigating(true);
        setTimeout(() => router.push(path), 3000);
    };

    // --- 🚀 LOGIKA SUBMIT ---
    const submitLaporan = async (e: any) => {
        e.preventDefault();
        if (!foto) return toast.error("FOTO BUKTI WAJIB DILAMPIRKAN!");

        setLoading(true);
        const conf = CONFIG[tipe];
        const sessionData = JSON.parse(localStorage.getItem('police_session') || '{}');
        const formattedReport = getFormatMessage(formData);

        try {
            const tId = toast.loading("Mengirim Laporan ke HQ Discord...");

            const { data: configData } = await supabase.from('admin_config').select('*');

            const typeMapping: any = {
                tangkap: 'penangkapan',
                kasus: 'kasus_besar',
                patroli: 'patroli',
                backup: 'backup',
                tilang: 'penilangan',
                admin: 'admin' // 🚀 MAPPING WEBHOOK & THREAD ADMIN
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
            formDataDiscord.append("file", foto);
            formDataDiscord.append("payload_json", JSON.stringify({ content: formattedReport }));

            const discordResponse = await fetch(finalWebhookUrl, { method: "POST", body: formDataDiscord });
            if (!discordResponse.ok) throw new Error("Discord Webhook menolak laporan! Cek kembali URL/Thread ID.");

            const discordData = await discordResponse.json();
            const discordImageUrl = discordData.attachments && discordData.attachments[0] ? discordData.attachments[0].url : "";
            if (!discordImageUrl) throw new Error("Gagal mengekstrak URL Foto dari Discord!");

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

            toast.success(`LAPORAN ${conf.label.toUpperCase()} TERKIRIM! (Menunggu ACC)`, { id: tId });
            setTimeout(() => handleNavigation('/dashboard'), 1500);

        } catch (err: any) {
            toast.error("TRANSMISI GAGAL", { description: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#e2e8f0] text-slate-900 font-mono p-4 pb-24 flex flex-col items-center overflow-x-hidden relative">
            <TacticalTransition isVisible={isNavigating} type="COMPUTER" />
            <Toaster position="top-center" richColors />

            {/* 🚀 COMPACT HEADER */}
            <div className="w-full max-w-md flex items-center justify-between mb-6 mt-2">
                <button
                    onClick={() => step === 0 ? handleNavigation('/dashboard') : setStep(0)}
                    className="p-2.5 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] active:translate-y-px transition-all"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-1">
                        <ShieldCheck className="text-blue-600 animate-pulse" size={14} />
                        <span className="text-[8px] font-black tracking-widest uppercase opacity-50 italic">Mandalika PD</span>
                    </div>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">
                        {step === 0 ? "Laporan Ops" : CONFIG[tipe]?.label}
                    </h1>
                </div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <AnimatePresence mode="wait">
                    {step === 0 ? (
                        <motion.div key="s0" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-2 gap-3">
                            {Object.entries(CONFIG).map(([id, conf]: any) => (
                                <button key={id} onClick={() => { setTipe(id); setStep(1); }} className={`bg-white ${boxBorder} p-4 rounded-2xl ${cardShadow} flex flex-col items-center justify-center gap-3 hover:bg-slate-50 active:translate-y-1 active:shadow-none transition-all`}>
                                    <div className="p-3 rounded-xl border-2 border-black bg-slate-50" style={{ color: conf.color }}><conf.icon size={24} /></div>
                                    <div className="text-center">
                                        <p className={`${fontBlack} text-xs leading-none mb-1`}>{conf.label}</p>
                                        <span className="bg-slate-950 text-white px-2 py-0.5 rounded-md text-[8px] font-black">+{conf.poin} PRP (Pending)</span>
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`bg-white ${boxBorder} rounded-[24px] ${cardShadow} p-5`}>

                            {/* 🚀 COMPACT IDENTITY BADGE */}
                            <div className="flex justify-between items-center bg-slate-100 border-2 border-slate-950 p-2.5 rounded-xl mb-5 shadow-inner">
                                <div className="truncate flex-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase italic">Petugas Pelapor</p>
                                    <p className="text-xs font-black uppercase truncate">{formData.nama_petugas}</p>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                    <p className="text-[8px] font-black text-slate-400 uppercase italic">Pangkat</p>
                                    <p className="text-xs font-black uppercase text-blue-600">{formData.pangkat}</p>
                                </div>
                            </div>

                            <form onSubmit={submitLaporan} className="space-y-4">

                                {/* 🚀 DATE & SHIFT GRID */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className={labelStyle}><CalendarIcon size={12} /> Tanggal</label>
                                        <input
                                            type="date"
                                            value={format(formData.tanggal, 'yyyy-MM-dd')}
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

                                {/* 🚀 DYNAMIC FIELDS: TANGKAP */}
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

                                {/* 🚀 DYNAMIC FIELDS: KASUS, PATROLI, BACKUP */}
                                {(tipe === 'kasus' || tipe === 'patroli' || tipe === 'backup') && (
                                    <>
                                        {tipe === 'kasus' && <div className="space-y-1"><label className={labelStyle}>Jenis Kasus</label><input name="jenis_kasus" placeholder="Misal: Perampokan..." required onChange={handleInputChange} className={inputStyle} /></div>}
                                        <div className="space-y-1"><label className={labelStyle}>Lokasi Kejadian</label><input name="lokasi" placeholder="Area / Nama Jalan..." required onChange={handleInputChange} className={inputStyle} /></div>
                                        <div className="space-y-1"><label className={labelStyle}>Kronologi / Laporan</label><textarea name="keterangan" placeholder="Ceritakan detail operasi..." required onChange={handleInputChange} className={cn(inputStyle, "min-h-[100px] resize-none")} /></div>
                                        {(tipe === 'kasus' || tipe === 'backup') && <div className="space-y-1"><label className={labelStyle}>Hasil Akhir</label><input name="hasil_akhir" placeholder="Status pelaku/situasi..." required onChange={handleInputChange} className={inputStyle} /></div>}
                                        {tipe === 'kasus' && <div className="space-y-1"><label className={labelStyle}>Barang Bukti Sitaan</label><input name="barang_bukti" placeholder="Senjata, Uang..." required onChange={handleInputChange} className={inputStyle} /></div>}
                                    </>
                                )}

                                {/* 🚀 DYNAMIC FIELD: PENILANGAN */}
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
                                            <textarea name="kesalahan" placeholder="Tuliskan kesalahan pelanggar..." required onChange={handleInputChange} className={cn(inputStyle, "min-h-[80px] resize-none")} />
                                        </div>
                                    </>
                                )}

                                {/* 🚀 DYNAMIC FIELD: ADMINISTRASI */}
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
                                            <label className={labelStyle}>Keterangan 2</label>
                                            <input name="keterangan_2" placeholder="cth. Tidak ditemukan pelanggaran" required onChange={handleInputChange} className={inputStyle} />
                                        </div>
                                    </>
                                )}

                                {/* 🚀 COMPACT UPLOAD BUKTI */}
                                <div className="space-y-1 pt-2">
                                    <label className={labelStyle}><Camera size={12} /> BUKTI VISUAL / SS</label>
                                    <div className="flex gap-2 items-center">
                                        {preview && (
                                            <div className={`relative w-16 h-16 shrink-0 ${boxBorder} rounded-lg overflow-hidden shadow-[2px_2px_0px_#000]`}>
                                                <img src={preview} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => { setFoto(null); setPreview(null); }} className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded border border-black active:scale-90"><X size={10} /></button>
                                            </div>
                                        )}
                                        {!preview && (
                                            <label className={`w-full h-16 ${boxBorder} border-dashed rounded-lg bg-slate-50 flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_#000] hover:bg-slate-100 transition-colors`}>
                                                <Camera size={16} className="text-slate-400" />
                                                <span className="text-[10px] font-black italic text-slate-400 uppercase">Lampirkan Foto</span>
                                                <input type="file" accept="image/*" required onChange={(e: any) => { const f = e.target.files[0]; if (f) { setFoto(f); setPreview(URL.createObjectURL(f)); } }} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <button disabled={loading} type="submit" className={cn("w-full py-4 mt-4 rounded-xl font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2", boxBorder, cardShadow, "bg-slate-950 active:translate-y-1 shadow-none disabled:opacity-50")}>
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