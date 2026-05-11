"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
    Users, Clock, FileText, Camera, Send,
    Search, AlertTriangle, ShieldAlert, X, Loader2,
    Ticket, Zap, Calendar as CalendarIcon
} from 'lucide-react';
import { format } from "date-fns";
import { toast, Toaster } from "sonner";

const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";
const inputStyle = `w-full bg-[#f8fafc] ${boxBorder} rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-blue-600 transition-all shadow-[3px_3px_0px_#000]`;
const labelStyle = `text-[10px] font-black uppercase italic text-slate-500 mb-1.5 flex items-center gap-2`;

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

    const [formData, setFormData] = useState({
        // Global / Duty
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '08:00',
        endTime: '10:00',
        catatan_override: '', // Catatan Admin

        // Specific Laporan Fields
        tipeLaporan: 'tilang',
        waktu_shift: '', nama_pelaku: "", ktp_pelaku: "", pasal: "", total_denda: "", hukuman: "",
        jenis_kasus: "", lokasi: "", barang_bukti: "", hasil_akhir: "", keterangan: "",
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

    const handleFileChange = (e: any) => {
        const files = Array.from(e.target.files) as File[];
        if (files.length > 0) {
            const newFotos = [...fotos, ...files].slice(0, 4);
            setFotos(newFotos);
            setPreviews(newFotos.map(f => URL.createObjectURL(f)));
        }
    };

    const removeFoto = (idx: number) => {
        setFotos(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    // 🚀 PARSING IDENTITAS
    const parseIdentity = (user: any) => {
        let rawName = user?.name || 'UNKNOWN';
        if (rawName.includes('|')) rawName = rawName.split('|').pop()?.trim() || rawName;

        let badgeNumber = "-";
        if (rawName.startsWith('#')) {
            const spaceIndex = rawName.indexOf(' ');
            if (spaceIndex !== -1) {
                badgeNumber = rawName.substring(1, spaceIndex);
                rawName = rawName.substring(spaceIndex + 1).trim();
            } else {
                badgeNumber = rawName.substring(1);
                rawName = "OFFICER";
            }
        }
        return { nama_petugas: rawName.toUpperCase(), pangkat: user?.pangkat || '', badge_number: badgeNumber, divisi: user?.divisi || '' };
    };

    // 🚀 FORMAT DISCORD MESSAGE
    const getFormatMessage = (d: any, ident: any) => {
        const tglStr = d.date;
        const head = `🚨 **[SYSTEM OVERRIDE BY ADMIN]** 🚨\nCatatan Admin: ${d.catatan_override || '-'}\n\n`;

        if (d.tipeLaporan === 'tangkap') return `${head}📁 **LAPORAN PENANGKAPAN**\n\`\`\`\nNama Pelaku : ${d.nama_pelaku || '-'}\nKTP Pelaku : ${d.ktp_pelaku || '-'}\nTanggal : ${tglStr}\n\nData Petugas\nNama IC : ${ident.nama_petugas}\nPangkat : ${ident.pangkat}\nBadge : ${ident.badge_number}\n\nPasal Dilanggar: ${d.pasal || '-'}\nHukuman: ${d.hukuman || '-'}\nTotal Denda: $ ${d.total_denda || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (d.tipeLaporan === 'kasus') return `${head}📁 **LAPORAN PENANGANAN KASUS BESAR**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${ident.nama_petugas}\nPangkat : ${ident.pangkat}\nBadge : ${ident.badge_number}\nUnit / Divisi : ${ident.divisi || '-'}\n\nJenis Kasus : ${d.jenis_kasus || '-'}\nLokasi Kejadian : ${d.lokasi || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil Akhir : ${d.hasil_akhir || '-'}\n\nBarang Bukti : ${d.barang_bukti || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (d.tipeLaporan === 'patroli') return `${head}📁 **LAPORAN PATROLI**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${ident.nama_petugas}\nPangkat : ${ident.pangkat}\nBadge : ${ident.badge_number}\n\nArea Patroli : ${d.lokasi || '-'}\n\nHasil Singkat : ${d.keterangan || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (d.tipeLaporan === 'backup') return `${head}📁 **LAPORAN MEMBANTU BACKUP**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${ident.nama_petugas}\nPangkat : ${ident.pangkat}\nBadge : ${ident.badge_number}\nUnit / Divisi : ${ident.divisi || '-'}\n\nLokasi Backup : ${d.lokasi || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil : ${d.hasil_akhir || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (d.tipeLaporan === 'tilang') return `${head}📁 **LAPORAN PENILANGAN**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${ident.nama_petugas}\nPangkat : ${ident.pangkat}\nBadge : ${ident.badge_number}\n\nKendaraan Berjenis : ${d.kendaraan || '-'}\nMasa Penilangan : ${d.masa_penilangan || '-'}\nDenda : $ ${d.denda || '-'}\nKesalahan : ${d.kesalahan || '-'}\n\`\`\`\n${MENTION_ROLE}`;
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
                // 1. INJEKSI ABSEN / DUTY (FOTO KE SUPABASE)
                let photoUrls: string[] = [];
                for (const file of fotos) {
                    const fName = `override-${selectedUser.discord_id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                    const { error: upErr } = await supabase.storage.from('bukti-absen').upload(`duty/${fName}`, file);
                    if (upErr) throw upErr;
                    const { data: { publicUrl } } = supabase.storage.from('bukti-absen').getPublicUrl(`duty/${fName}`);
                    photoUrls.push(publicUrl);
                }

                const startStr = `${formData.date}T${formData.startTime}:00+07:00`;
                const endStr = `${formData.date}T${formData.endTime}:00+07:00`;
                const diffMs = new Date(endStr).getTime() - new Date(startStr).getTime();
                const durasiMenit = Math.floor(diffMs / 60000);

                if (durasiMenit <= 0) throw new Error("Waktu Selesai harus lebih besar dari Waktu Mulai.");

                const { error } = await supabase.from('presensi_duty').insert([{
                    user_id_discord: selectedUser.discord_id,
                    nama_panggilan: selectedUser.name,
                    pangkat: selectedUser.pangkat,
                    divisi: selectedUser.divisi,
                    start_time: startStr,
                    end_time: endStr,
                    durasi_menit: durasiMenit,
                    status: 'SUCCESS',
                    catatan_duty: `[ADMIN OVERRIDE] ${formData.catatan_override}`,
                    bukti_foto: photoUrls
                }]);
                if (error) throw error;

                const hoursToAdd = Number((durasiMenit / 60).toFixed(2));
                await supabase.rpc('increment_duty_hours', { user_id: selectedUser.discord_id, hours: hoursToAdd });
                toast.success("ABSEN BERHASIL DISUNTIKKAN!", { id: tId });

            } else {
                // 2. INJEKSI LAPORAN AKTIVITAS (FOTO & DATA KE DISCORD)
                const conf = CONFIG[formData.tipeLaporan];

                // Validasi khusus Admin
                if (formData.tipeLaporan === 'admin') {
                    if (fotos.length < 2) throw new Error("Laporan Admin wajib 2 Foto (Buka & Tutup)!");
                    if (!formData.jam_buka || !formData.jam_tutup) throw new Error("Jam Buka & Tutup wajib diisi!");
                }

                const formattedReport = getFormatMessage(formData, identity);

                // Fetch Webhook URL
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

                // Insert to Supabase as PENDING
                const { error: insertError } = await supabase.from('laporan_aktivitas').insert([{
                    user_id_discord: selectedUser.discord_id,
                    nama_panggilan: selectedUser.name,
                    jenis_laporan: conf.label,
                    isi_laporan: formattedReport,
                    poin_estimasi: conf.poin,
                    bukti_foto: discordImageUrl,
                    status: 'PENDING', // Harus ACC Admin
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
        setFormData({ ...formData, catatan_override: '' });
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 font-mono pb-20 text-slate-950">
            <Toaster position="top-center" richColors />

            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-[25px] flex flex-col md:flex-row gap-6 justify-between items-center`}>
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
                <div className={`lg:col-span-4 bg-white ${boxBorder} ${hardShadow} rounded-[25px] overflow-hidden flex flex-col h-[700px]`}>
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
                                    <div className="w-10 h-10 rounded-full bg-slate-200 border border-black shrink-0 flex items-center justify-center text-black font-black text-xs">
                                        {nama_petugas.charAt(0)}
                                    </div>
                                    <div className="truncate flex-1">
                                        <p className="text-xs font-black uppercase truncate">{nama_petugas}</p>
                                        <p className="text-[9px] opacity-70 font-bold">{p.pangkat} • #{badge_number}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Kolom Kanan: Form Injeksi */}
                <div className={`lg:col-span-8 bg-white ${boxBorder} ${hardShadow} rounded-[25px] p-6 md:p-8 h-[700px] overflow-y-auto custom-scrollbar`}>
                    <form onSubmit={handleOverride} className="space-y-6">
                        {selectedUser ? (
                            <div className="bg-blue-50 border-2 border-blue-600 p-4 rounded-xl flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Users className="text-blue-600" />
                                    <div>
                                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Target Injeksi:</p>
                                        <p className="text-sm font-black uppercase">{parseIdentity(selectedUser).nama_petugas}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setSelectedUser(null)} className="text-blue-600 bg-blue-100 p-1.5 rounded-lg border border-blue-200 hover:bg-blue-200"><X size={16} /></button>
                            </div>
                        ) : (
                            <div className="p-12 border-4 border-dashed border-slate-200 rounded-2xl text-center opacity-40">
                                <Users size={48} className="mx-auto mb-3" />
                                <p className="font-black italic uppercase text-sm">Pilih Anggota Target Terlebih Dahulu</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className={labelStyle}><CalendarIcon size={14} /> Tanggal Kejadian</label>
                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={inputStyle} required />
                            </div>

                            {dataType === 'LAPORAN' && (
                                <div className="space-y-1">
                                    <label className={labelStyle}><Ticket size={14} /> Kategori Laporan</label>
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
                                        <label className={labelStyle}><Clock size={14} /> Jam Mulai</label>
                                        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className={inputStyle} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelStyle}><Clock size={14} /> Jam Selesai</label>
                                        <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} className={inputStyle} required />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-1">
                                    <label className={labelStyle}><Clock size={14} /> Waktu Shift</label>
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
                            <div className="space-y-4 border-t-4 border-black border-dashed pt-4">
                                {formData.tipeLaporan === 'tangkap' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><label className={labelStyle}>Tersangka</label><input name="nama_pelaku" required value={formData.nama_pelaku} onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-1"><label className={labelStyle}>No. KTP</label><input name="ktp_pelaku" required value={formData.ktp_pelaku} onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><label className={labelStyle}>Pasal</label><input name="pasal" required value={formData.pasal} onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-1"><label className={labelStyle}>Denda ($)</label><input name="total_denda" type="number" required value={formData.total_denda} onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="space-y-1"><label className={labelStyle}>Vonis Hukuman</label><input name="hukuman" required value={formData.hukuman} onChange={handleInputChange} className={inputStyle} /></div>
                                    </>
                                )}

                                {(formData.tipeLaporan === 'kasus' || formData.tipeLaporan === 'patroli' || formData.tipeLaporan === 'backup') && (
                                    <>
                                        {formData.tipeLaporan === 'kasus' && <div className="space-y-1"><label className={labelStyle}>Jenis Kasus</label><input name="jenis_kasus" required value={formData.jenis_kasus} onChange={handleInputChange} className={inputStyle} /></div>}
                                        <div className="space-y-1"><label className={labelStyle}>Lokasi Kejadian</label><input name="lokasi" required value={formData.lokasi} onChange={handleInputChange} className={inputStyle} /></div>
                                        <div className="space-y-1"><label className={labelStyle}>Kronologi / Laporan</label><textarea name="keterangan" required value={formData.keterangan} onChange={handleInputChange} className={cn(inputStyle, "min-h-[80px] resize-none")} /></div>
                                        {(formData.tipeLaporan === 'kasus' || formData.tipeLaporan === 'backup') && <div className="space-y-1"><label className={labelStyle}>Hasil Akhir</label><input name="hasil_akhir" required value={formData.hasil_akhir} onChange={handleInputChange} className={inputStyle} /></div>}
                                        {formData.tipeLaporan === 'kasus' && <div className="space-y-1"><label className={labelStyle}>Barang Bukti Sitaan</label><input name="barang_bukti" required value={formData.barang_bukti} onChange={handleInputChange} className={inputStyle} /></div>}
                                    </>
                                )}

                                {formData.tipeLaporan === 'tilang' && (
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
                                            <div className="space-y-1"><label className={labelStyle}>Masa Penilangan</label><input name="masa_penilangan" required value={formData.masa_penilangan} onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="space-y-1"><label className={labelStyle}>Denda ($)</label><input name="denda" type="number" required value={formData.denda} onChange={handleInputChange} className={inputStyle} /></div>
                                        <div className="space-y-1"><label className={labelStyle}>Kesalahan</label><textarea name="kesalahan" required value={formData.kesalahan} onChange={handleInputChange} className={cn(inputStyle, "min-h-[60px] resize-none")} /></div>
                                    </>
                                )}

                                {formData.tipeLaporan === 'admin' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><label className={labelStyle}><Clock size={12} /> Jam Buka</label><input type="time" name="jam_buka" required value={formData.jam_buka} onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-1"><label className={labelStyle}><Clock size={12} /> Jam Tutup</label><input type="time" name="jam_tutup" required value={formData.jam_tutup} onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><label className={labelStyle}>Kendala 1</label><input name="kendala_1" value={formData.kendala_1} onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-1"><label className={labelStyle}>Kendala 2</label><input name="kendala_2" value={formData.kendala_2} onChange={handleInputChange} className={inputStyle} /></div>
                                        </div>
                                        <div className="space-y-1"><label className={labelStyle}>Keterangan 1</label><input name="keterangan_1" required value={formData.keterangan_1} onChange={handleInputChange} className={inputStyle} /></div>
                                        <div className="space-y-1"><label className={labelStyle}>Keterangan 2 (Opsional)</label><input name="keterangan_2" value={formData.keterangan_2} onChange={handleInputChange} className={inputStyle} /></div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* --- KETERANGAN ADMIN & FOTO BUKTI --- */}
                        <div className="space-y-4 pt-4 border-t-4 border-black">
                            <div className="space-y-1">
                                <label className={labelStyle}><FileText size={14} /> Catatan Admin (Internal)</label>
                                <textarea
                                    name="catatan_override"
                                    rows={2}
                                    value={formData.catatan_override}
                                    onChange={handleInputChange}
                                    className={cn(inputStyle, "resize-none bg-yellow-50")}
                                    placeholder="Jelaskan alasan Override ini dilakukan (cth. Lupa absen, Dispensasi, dll)..."
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className={labelStyle}><Camera size={14} /> Evidence (Bukti Foto Wajib)</label>
                                    {(dataType === 'LAPORAN' && formData.tipeLaporan === 'admin') && <span className="text-[9px] font-black italic text-red-600 bg-red-100 px-2 py-0.5 rounded border border-red-200">Min. 2 Foto</span>}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {previews.map((p, i) => (
                                        <div key={i} className="relative w-20 h-20 border-[3px] border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_#000]">
                                            <img src={p} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeFoto(i)} className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-md border border-black"><X size={12} /></button>
                                        </div>
                                    ))}
                                    {fotos.length < 4 && (
                                        <label className="w-20 h-20 border-[3px] border-black border-dashed rounded-xl flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors shadow-[3px_3px_0px_#000]">
                                            <Camera size={20} className="text-slate-400" />
                                            <span className="text-[8px] font-black uppercase text-slate-400 mt-1">Upload</span>
                                            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={loading || !selectedUser}
                            className={cn(
                                "w-full py-4 mt-8 rounded-2xl font-[1000] text-sm uppercase italic tracking-widest text-white transition-all flex items-center justify-center gap-3",
                                boxBorder, hardShadow, "bg-red-600 active:translate-y-1 active:shadow-none disabled:opacity-50"
                            )}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Zap size={20} /> Eksekusi Injeksi</>}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
}