"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import {
    Users, Clock, FileText, Camera, Send,
    Search, ShieldAlert, X, Loader2,
    Ticket, Zap, Calendar as CalendarIcon,
    CheckCircle2, AlertTriangle, FileSearch
} from 'lucide-react';
import { format } from "date-fns";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

// --- UTILS ---
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const toTitleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// --- UI COMPACT UNTUK MOBILE ---
const boxBorder = "border-[2px] border-slate-950";
const cardShadow = "shadow-[4px_4px_0px_#000]";
const inputStyle = `w-full bg-[#f8fafc] ${boxBorder} rounded-lg px-3 py-2 text-xs font-mono font-bold focus:border-blue-600 focus:bg-white outline-none text-slate-900 transition-all shadow-[2px_2px_0px_#000]`;
const labelStyle = "text-[9px] font-black uppercase tracking-widest text-slate-950 ml-1 mb-1.5 flex items-center gap-1.5 italic";

// --- CONFIG LAPORAN ---
const CONFIG: any = {
    tangkap: { label: "Penangkapan", poin: 3, dbKey: "penangkapan" },
    kasus: { label: "Kasus Besar", poin: 10, dbKey: "kasus_besar" },
    patroli: { label: "Patroli", poin: 5, dbKey: "patroli" },
    backup: { label: "Backup", poin: 3, dbKey: "backup" },
    tilang: { label: "Penilangan", poin: 2, dbKey: "penilangan" },
    admin: { label: "Administrasi", poin: 6, dbKey: "admin" }
};

const MENTION_ROLE = "<@&1393366590942085220>";

export default function SectionAdminManipulasi() {
    const [loading, setLoading] = useState(false);
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Form States
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [dataType, setDataType] = useState<'DUTY' | 'LAPORAN'>('DUTY');
    const [fotos, setFotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [previewModalInfo, setPreviewModalInfo] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        // Global / Duty
        date: format(new Date(), 'yyyy-MM-dd'),
        jamAwal: '08:00',
        jamAkhir: '16:00',
        keterangan: '',

        // Specific Laporan Fields
        tipeLaporan: 'tilang',
        waktu_shift: '', nama_pelaku: "", ktp_pelaku: "", pasal: "", total_denda: "", hukuman: "",
        jenis_kasus: "", lokasi: "", barang_bukti: "", hasil_akhir: "",
        kendaraan: "", masa_penilangan: "", denda: "", kesalahan: "",
        jam_buka: "", jam_tutup: "", kendala_1: "", kendala_2: "", keterangan_1: "", keterangan_2: ""
    });

    useEffect(() => {
        fetchPersonnel();
    }, []);

    const fetchPersonnel = async () => {
        const { data } = await supabase.from('users').select('*').order('name', { ascending: true });
        if (data) setPersonnel(data);
    };

    const filteredPersonnel = personnel.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pangkat?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // 🚀 PARSING IDENTITAS (Format: Huruf Depan Kapital / Title Case)
    const parseIdentity = (user: any) => {
        let rawName = user?.name || 'Unknown';
        if (rawName.includes('|')) rawName = rawName.split('|').pop()?.trim() || rawName;

        let badgeNumber = "-";
        if (rawName.startsWith('#')) {
            const spaceIndex = rawName.indexOf(' ');
            if (spaceIndex !== -1) {
                badgeNumber = rawName.substring(1, spaceIndex);
                rawName = rawName.substring(spaceIndex + 1).trim();
            } else {
                badgeNumber = rawName.substring(1);
                rawName = "Officer";
            }
        }

        return {
            nama_petugas: toTitleCase(rawName),
            pangkat: user?.pangkat || '',
            badge_number: badgeNumber,
            divisi: user?.divisi || ''
        };
    };

    // 🚀 FORMAT DISCORD MESSAGE
    const getFormatMessage = (d: any, ident: any) => {
        const tglStr = d.date;
        const head = ``;

        if (d.tipeLaporan === 'tangkap') return `${head}📁 **LAPORAN PENANGKAPAN**\n\`\`\`\nNama Pelaku : ${toTitleCase(d.nama_pelaku) || '-'}\nKTP Pelaku : ${d.ktp_pelaku || '-'}\nTanggal : ${tglStr}\n\nData Petugas\nNama IC : ${ident.nama_petugas}\nPangkat : ${ident.pangkat}\nBadge : ${ident.badge_number}\n\nPasal Dilanggar: ${d.pasal || '-'}\nHukuman: ${d.hukuman || '-'}\nTotal Denda: $ ${d.total_denda || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (d.tipeLaporan === 'kasus') return `${head}📁 **LAPORAN PENANGANAN KASUS BESAR**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${toTitleCase(d.waktu_shift) || '-'}\n\nData Petugas\nNama IC : ${ident.nama_petugas}\nPangkat : ${ident.pangkat}\nBadge : ${ident.badge_number}\nUnit / Divisi : ${ident.divisi || '-'}\n\nJenis Kasus : ${toTitleCase(d.jenis_kasus) || '-'}\nLokasi Kejadian : ${toTitleCase(d.lokasi) || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil Akhir : ${toTitleCase(d.hasil_akhir) || '-'}\n\nBarang Bukti : ${toTitleCase(d.barang_bukti) || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (d.tipeLaporan === 'patroli') return `${head}📁 **LAPORAN PATROLI**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${toTitleCase(d.waktu_shift) || '-'}\n\nData Petugas\nNama IC : ${ident.nama_petugas}\nPangkat : ${ident.pangkat}\nBadge : ${ident.badge_number}\n\nArea Patroli : ${toTitleCase(d.lokasi) || '-'}\n\nHasil Singkat : ${d.keterangan || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (d.tipeLaporan === 'backup') return `${head}📁 **LAPORAN MEMBANTU BACKUP**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${toTitleCase(d.waktu_shift) || '-'}\n\nData Petugas\nNama IC : ${ident.nama_petugas}\nPangkat : ${ident.pangkat}\nBadge : ${ident.badge_number}\nUnit / Divisi : ${ident.divisi || '-'}\n\nLokasi Backup : ${toTitleCase(d.lokasi) || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil : ${toTitleCase(d.hasil_akhir) || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (d.tipeLaporan === 'tilang') return `${head}📁 **LAPORAN PENILANGAN**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${toTitleCase(d.waktu_shift) || '-'}\n\nData Petugas\nNama IC : ${ident.nama_petugas}\nPangkat : ${ident.pangkat}\nBadge : ${ident.badge_number}\n\nKendaraan Berjenis : ${toTitleCase(d.kendaraan) || '-'}\nMasa Penilangan : ${d.masa_penilangan || '-'}\nDenda : $ ${d.denda || '-'}\nKesalahan : ${d.kesalahan || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (d.tipeLaporan === 'admin') return `${head}📁 **LAPORAN JAGA ADMINISTRASI**\n\`\`\`\nData Petugas\nNama        : ${ident.nama_petugas}\nPangkat     : ${ident.pangkat}\nBadge       : ${ident.badge_number}\nTanggal     : ${tglStr}\n\nBuka        : ${d.jam_buka || '-'}\nTutup       : ${d.jam_tutup || '-'}\n\nKendala 1   : ${d.kendala_1 || '-'}\nKendala 2   : ${d.kendala_2 || '-'}\n\nKeterangan 1: ${d.keterangan_1 || '-'}\nKeterangan 2: ${d.keterangan_2 || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        return "";
    };

    const handleOverride = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return toast.error("PILIH ANGGOTA DULU!");
        if (fotos.length === 0) return toast.error("WAJIB ADA FOTO BUKTI!");

        setLoading(true);
        const tId = toast.loading("Memulai Protokol Override...");

        try {
            const identity = parseIdentity(selectedUser);

            if (dataType === 'DUTY') {
                // 1. INJEKSI ABSEN / DUTY
                let photoUrls: string[] = [];
                for (const file of fotos) {
                    const fName = `override-${selectedUser.discord_id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                    const { error: upErr } = await supabase.storage.from('bukti-absen').upload(`duty/${fName}`, file);
                    if (upErr) throw upErr;
                    const { data: { publicUrl } } = supabase.storage.from('bukti-absen').getPublicUrl(`duty/${fName}`);
                    photoUrls.push(publicUrl);
                }

                let startObj = new Date(`${formData.date}T${formData.jamAwal}:00`);
                let endObj = new Date(`${formData.date}T${formData.jamAkhir}:00`);
                if (endObj < startObj) endObj.setDate(endObj.getDate() + 1);

                let diff = (endObj.getTime() - startObj.getTime()) / 1000 / 60 / 60;
                const durasiJam = parseFloat(diff.toFixed(2));
                const durasiMenitBulat = Math.round(durasiJam * 60);

                if (durasiMenitBulat <= 0) throw new Error("Waktu Selesai harus lebih besar dari Waktu Mulai.");

                // Tabel 'presensi_duty' WAJIB pakai nama_panggilan
                const { error } = await supabase.from('presensi_duty').insert([{
                    user_id_discord: selectedUser.discord_id,
                    nama_panggilan: identity.nama_petugas, // <-- Tabel ini wajib
                    pangkat: selectedUser.pangkat,
                    divisi: selectedUser.divisi,
                    start_time: startObj.toISOString(),
                    end_time: endObj.toISOString(),
                    durasi_menit: durasiMenitBulat,
                    status: 'SUCCESS',
                    catatan_duty: formData.keterangan,
                    bukti_foto: photoUrls
                }]);
                if (error) throw error;

                const hoursToAdd = Number((durasiMenitBulat / 60).toFixed(2));
                await supabase.rpc('increment_duty_hours', { user_id: selectedUser.discord_id, hours: hoursToAdd });
                toast.success("ABSEN BERHASIL DISUNTIKKAN!", { id: tId });

            } else {
                // 2. INJEKSI LAPORAN AKTIVITAS
                const conf = CONFIG[formData.tipeLaporan];
                if (formData.tipeLaporan === 'admin' && fotos.length < 2) throw new Error("Laporan Admin wajib 2 Foto (Buka & Tutup)!");

                const formattedReport = getFormatMessage(formData, identity);

                // Fetch Webhook
                const { data: configData } = await supabase.from('admin_config').select('*');
                const webhookUrlData = configData?.find(c => c.key === `webhook_${conf.dbKey}`)?.value;
                const threadIdData = configData?.find(c => c.key === `thread_${conf.dbKey}`)?.value;

                if (!webhookUrlData) throw new Error(`Webhook Discord untuk ${conf.label} belum disetting!`);

                let finalWebhookUrl = webhookUrlData.includes('?') ? `${webhookUrlData}&wait=true` : `${webhookUrlData}?wait=true`;
                if (threadIdData && threadIdData.trim() !== '') finalWebhookUrl += `&thread_id=${threadIdData.trim()}`;

                // Send to Discord
                const formDataDiscord = new FormData();
                fotos.forEach((file, index) => {
                    formDataDiscord.append(`file[${index}]`, file);
                });
                formDataDiscord.append("payload_json", JSON.stringify({ content: formattedReport }));

                const discordResponse = await fetch(finalWebhookUrl, { method: "POST", body: formDataDiscord });
                if (!discordResponse.ok) throw new Error("Discord Webhook menolak laporan!");

                const discordData = await discordResponse.json();
                const discordImageUrl = discordData.attachments && discordData.attachments[0] ? discordData.attachments[0].url : "";

                // Tabel 'laporan_aktivitas' TIDAK PAKAI nama_panggilan (Fixed)
                const { error: insertError } = await supabase.from('laporan_aktivitas').insert([{
                    user_id_discord: selectedUser.discord_id,
                    jenis_laporan: conf.label,
                    isi_laporan: formattedReport,
                    poin_estimasi: conf.poin,
                    bukti_foto: discordImageUrl,
                    status: 'PENDING',
                    is_sent_discord: true
                }]);

                if (insertError) throw insertError;
                toast.success(`LAPORAN ${conf.label.toUpperCase()} BERHASIL DIINJEKSI!`, { id: tId });
            }

            resetForm();
        } catch (err: any) {
            toast.error("GAGAL: " + err.message, { id: tId });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedUser(null);
        setFotos([]);
        setPreviews([]);
        setFormData({ ...formData, keterangan: '' });
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 font-mono pb-20 text-slate-950">
            <Toaster position="top-center" richColors />

            <AnimatePresence>
                {previewModalInfo && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
                        onClick={() => setPreviewModalInfo(null)}
                    >
                        <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                            <img src={previewModalInfo} alt="Preview" className={`max-w-full max-h-[80vh] rounded-xl ${boxBorder} ${cardShadow} object-contain bg-slate-100`} />
                            <button
                                onClick={() => setPreviewModalInfo(null)}
                                className={`absolute -top-4 -right-4 bg-red-600 text-white p-2 rounded-full ${boxBorder} ${cardShadow} hover:bg-red-700 active:scale-95 transition-all`}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`bg-white ${boxBorder} ${cardShadow} p-6 rounded-[25px] flex flex-col md:flex-row gap-6 justify-between items-center`}>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-600 text-white rounded-xl shadow-[3px_3px_0px_#000]"><ShieldAlert /></div>
                    <div>
                        <h2 className="font-[1000] italic uppercase text-2xl tracking-tighter">System Override</h2>
                        <p className="text-[10px] font-black uppercase opacity-50">High Admin Authorization Only</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-xl border-2 border-black w-full md:w-auto">
                    <button onClick={() => setDataType('DUTY')} className={cn("flex-1 px-6 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all", dataType === 'DUTY' ? "bg-slate-950 text-white shadow-[3px_3px_0px_#00E676]" : "opacity-40")}>Absen / Duty</button>
                    <button onClick={() => setDataType('LAPORAN')} className={cn("flex-1 px-6 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all", dataType === 'LAPORAN' ? "bg-slate-950 text-white shadow-[3px_3px_0px_#00E676]" : "opacity-40")}>Laporan</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kolom Kiri: Pilih Anggota */}
                <div className={`lg:col-span-4 bg-white ${boxBorder} ${cardShadow} rounded-[25px] overflow-hidden flex flex-col h-[700px]`}>
                    <div className="p-4 border-b-2 border-black bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari Personnel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border-2 border-black pl-10 pr-4 py-3 rounded-xl text-xs font-bold outline-none shadow-inner"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {filteredPersonnel.map(p => {
                            const { nama_petugas, badge_number } = parseIdentity(p);
                            return (
                                <button
                                    key={p.discord_id}
                                    type="button"
                                    onClick={() => setSelectedUser(p)}
                                    className={cn(
                                        "w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all text-left",
                                        selectedUser?.discord_id === p.discord_id
                                            ? "bg-slate-950 text-white border-black shadow-[4px_4px_0px_#00E676]"
                                            : "border-transparent hover:bg-slate-50 hover:border-black/10"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-200 border border-black shrink-0 flex items-center justify-center text-black font-black text-xs uppercase">
                                        {nama_petugas.charAt(0)}
                                    </div>
                                    <div className="truncate flex-1">
                                        <p className="text-xs font-black truncate">{nama_petugas}</p>
                                        <p className="text-[9px] opacity-70 font-bold uppercase">{p.pangkat} • #{badge_number}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Kolom Kanan: Form Injeksi */}
                <div className={`lg:col-span-8 bg-white ${boxBorder} ${cardShadow} rounded-[25px] p-6 md:p-8 h-[700px] overflow-y-auto custom-scrollbar`}>
                    <form onSubmit={handleOverride} className="space-y-6">
                        {selectedUser ? (
                            <div className="grid grid-cols-3 gap-2 items-center bg-slate-100 border-2 border-slate-950 p-2.5 rounded-xl mb-5 shadow-inner text-center relative">
                                <div className="truncate text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase italic">Target</p>
                                    <p className="text-[10px] md:text-xs font-black truncate">{parseIdentity(selectedUser).nama_petugas}</p>
                                </div>
                                <div className="truncate border-x-2 border-slate-300 px-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase italic">Rank</p>
                                    <p className="text-[10px] md:text-xs font-black uppercase text-blue-600 truncate">{parseIdentity(selectedUser).pangkat}</p>
                                </div>
                                <div className="truncate text-right pr-6">
                                    <p className="text-[8px] font-black text-slate-400 uppercase italic">Badge</p>
                                    <p className="text-[10px] md:text-xs font-black uppercase text-slate-800 truncate">#{parseIdentity(selectedUser).badge_number}</p>
                                </div>
                                <button type="button" onClick={() => setSelectedUser(null)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600"><X size={16} /></button>
                            </div>
                        ) : (
                            <div className="p-12 border-4 border-dashed border-slate-200 rounded-2xl text-center opacity-40 mb-6">
                                <Users size={48} className="mx-auto mb-3" />
                                <p className="font-black italic uppercase text-sm">Pilih Anggota Target Terlebih Dahulu</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className={labelStyle}><CalendarIcon size={12} /> Date</p>
                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={inputStyle} required />
                            </div>

                            {dataType === 'LAPORAN' && (
                                <div className="space-y-1">
                                    <p className={labelStyle}><Ticket size={12} /> Kategori Laporan</p>
                                    <select name="tipeLaporan" value={formData.tipeLaporan} onChange={handleInputChange} className={inputStyle}>
                                        {Object.entries(CONFIG).map(([key, val]: any) => (
                                            <option key={key} value={key}>{val.label} (+{val.poin} Poin)</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {dataType === 'DUTY' ? (
                                <>
                                    <div className="space-y-1">
                                        <p className={labelStyle}><Clock size={12} /> Start</p>
                                        <div className="flex items-center gap-1">
                                            <select value={formData.jamAwal.split(':')[0]} onChange={e => setFormData({ ...formData, jamAwal: `${e.target.value}:${formData.jamAwal.split(':')[1]}` })} className={cn(inputStyle, "cursor-pointer text-center !px-1 appearance-none")}>
                                                {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                                            </select>
                                            <span className="font-black text-slate-950">:</span>
                                            <select value={formData.jamAwal.split(':')[1]} onChange={e => setFormData({ ...formData, jamAwal: `${formData.jamAwal.split(':')[0]}:${e.target.value}` })} className={cn(inputStyle, "cursor-pointer text-center !px-1 appearance-none")}>
                                                {Array.from({ length: 60 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className={labelStyle}><Clock size={12} /> End</p>
                                        <div className="flex items-center gap-1">
                                            <select value={formData.jamAkhir.split(':')[0]} onChange={e => setFormData({ ...formData, jamAkhir: `${e.target.value}:${formData.jamAkhir.split(':')[1]}` })} className={cn(inputStyle, "cursor-pointer text-center !px-1 appearance-none")}>
                                                {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                                            </select>
                                            <span className="font-black text-slate-950">:</span>
                                            <select value={formData.jamAkhir.split(':')[1]} onChange={e => setFormData({ ...formData, jamAkhir: `${formData.jamAkhir.split(':')[0]}:${e.target.value}` })} className={cn(inputStyle, "cursor-pointer text-center !px-1 appearance-none")}>
                                                {Array.from({ length: 60 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-1">
                                    <p className={labelStyle}><Clock size={12} /> Waktu Shift</p>
                                    <select name="waktu_shift" required value={formData.waktu_shift} onChange={handleInputChange} className={inputStyle}>
                                        <option value="">-- PILIH SHIFT --</option>
                                        <option value="Pagi">PAGI</option><option value="Siang">SIANG</option>
                                        <option value="Sore">SORE</option><option value="Malam">MALAM</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* --- DYNAMIC FIELDS UNTUK LAPORAN --- */}
                        {dataType === 'LAPORAN' && (
                            <div className="space-y-4 border-t-2 border-black/10 pt-4">
                                {formData.tipeLaporan === 'tangkap' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><p className={labelStyle}>Tersangka</p><input name="nama_pelaku" placeholder="Nama..." required value={formData.nama_pelaku} onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-1"><p className={labelStyle}>No. KTP</p><input name="ktp_pelaku" required value={formData.ktp_pelaku} onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><p className={labelStyle}>Pasal</p><input name="pasal" required value={formData.pasal} onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-1"><p className={labelStyle}>Denda ($)</p><input name="total_denda" type="number" required value={formData.total_denda} onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="space-y-1"><p className={labelStyle}>Vonis Hukuman</p><input name="hukuman" required value={formData.hukuman} onChange={handleInputChange} className={inputStyle} /></div>
                                    </>
                                )}

                                {(formData.tipeLaporan === 'kasus' || formData.tipeLaporan === 'patroli' || formData.tipeLaporan === 'backup') && (
                                    <>
                                        {formData.tipeLaporan === 'kasus' && <div className="space-y-1"><p className={labelStyle}>Jenis Kasus</p><input name="jenis_kasus" required value={formData.jenis_kasus} onChange={handleInputChange} className={inputStyle} /></div>}
                                        <div className="space-y-1"><p className={labelStyle}>Lokasi Kejadian</p><input name="lokasi" required value={formData.lokasi} onChange={handleInputChange} className={inputStyle} /></div>
                                        <div className="space-y-1"><p className={labelStyle}>Kronologi / Laporan</p><textarea name="keterangan" required value={formData.keterangan} onChange={handleInputChange} className={cn(inputStyle, "min-h-[80px] resize-none")} /></div>
                                        {(formData.tipeLaporan === 'kasus' || formData.tipeLaporan === 'backup') && <div className="space-y-1"><p className={labelStyle}>Hasil Akhir</p><input name="hasil_akhir" required value={formData.hasil_akhir} onChange={handleInputChange} className={inputStyle} /></div>}
                                        {formData.tipeLaporan === 'kasus' && <div className="space-y-1"><p className={labelStyle}>Barang Bukti Sitaan</p><input name="barang_bukti" required value={formData.barang_bukti} onChange={handleInputChange} className={inputStyle} /></div>}
                                    </>
                                )}

                                {formData.tipeLaporan === 'tilang' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <p className={labelStyle}>Jenis Kendaraan</p>
                                                <select name="kendaraan" required value={formData.kendaraan} onChange={handleInputChange} className={inputStyle}>
                                                    <option value="">-- PILIH --</option>
                                                    <option value="Roda 2">Roda 2</option>
                                                    <option value="Roda 4">Roda 4</option>
                                                    <option value="Roda 6+">Roda 6+</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1"><p className={labelStyle}>Masa Penilangan</p><input name="masa_penilangan" required value={formData.masa_penilangan} onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="space-y-1"><p className={labelStyle}>Denda ($)</p><input name="denda" type="number" required value={formData.denda} onChange={handleInputChange} className={inputStyle} /></div>
                                        <div className="space-y-1"><p className={labelStyle}>Kesalahan</p><textarea name="kesalahan" required value={formData.kesalahan} onChange={handleInputChange} className={cn(inputStyle, "min-h-[60px] resize-none")} /></div>
                                    </>
                                )}

                                {formData.tipeLaporan === 'admin' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><p className={labelStyle}><Clock size={12} /> Jam Buka</p><input type="time" name="jam_buka" required value={formData.jam_buka} onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-1"><p className={labelStyle}><Clock size={12} /> Jam Tutup</p><input type="time" name="jam_tutup" required value={formData.jam_tutup} onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><p className={labelStyle}>Kendala 1</p><input name="kendala_1" value={formData.kendala_1} onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-1"><p className={labelStyle}>Kendala 2</p><input name="kendala_2" value={formData.kendala_2} onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="space-y-1"><p className={labelStyle}>Keterangan 1</p><input name="keterangan_1" required value={formData.keterangan_1} onChange={handleInputChange} className={inputStyle} /></div>
                                        <div className="space-y-1"><p className={labelStyle}>Keterangan 2 (Opsional)</p><input name="keterangan_2" value={formData.keterangan_2} onChange={handleInputChange} className={inputStyle} /></div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="space-y-1 pt-4 border-t-2 border-black/10">
                            <p className={labelStyle}><FileSearch size={12} /> Remarks</p>
                            <textarea
                                name="keterangan"
                                rows={2}
                                value={formData.keterangan}
                                onChange={handleInputChange}
                                className={cn(inputStyle, "resize-none h-16")}
                                placeholder="Tulis keterangan tugas/laporan..."
                                required
                            />
                        </div>

                        {/* 🚀 COMPACT HORIZONTAL SCROLL EVIDENCE DENGAN PREVIEW */}
                        <div className="space-y-1 pt-2">
                            <div className="flex items-center justify-between">
                                <p className={labelStyle}><Camera size={12} /> Evidence</p>
                                {(dataType === 'LAPORAN' && formData.tipeLaporan === 'admin') && <span className="text-[8px] font-black italic text-red-500 uppercase bg-red-100 px-1 rounded border border-red-200">Min. 2 Foto</span>}
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {previews.map((src, idx) => (
                                    <div key={idx} className={`relative w-16 h-16 shrink-0 ${boxBorder} rounded-lg overflow-hidden shadow-[2px_2px_0px_#000] group`}>
                                        <img
                                            src={src}
                                            className="w-full h-full object-cover cursor-pointer hover:brightness-75 transition-all"
                                            onClick={() => setPreviewModalInfo(src)}
                                            alt="Preview"
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setFotos(fotos.filter((_, i) => i !== idx)); setPreviews(previews.filter((_, i) => i !== idx)); }}
                                            className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded border border-black active:scale-90 z-10"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                                {fotos.length < 3 && (
                                    <label className={`relative w-16 h-16 shrink-0 ${boxBorder} border-dashed rounded-lg bg-slate-50 flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000] hover:bg-slate-200 transition-colors`}>
                                        <Camera size={16} className="text-slate-400" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => { const f = Array.from(e.target.files || []); setFotos([...fotos, ...f]); setPreviews([...previews, ...f.map(file => URL.createObjectURL(file))]); }}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !selectedUser}
                            className={cn(
                                "w-full py-4 mt-8 rounded-xl font-[1000] text-sm uppercase italic tracking-widest text-white transition-all flex items-center justify-center gap-3",
                                boxBorder, cardShadow, "bg-slate-950 active:translate-y-1 active:shadow-none disabled:opacity-50"
                            )}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> TRANSMIT</>}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
}