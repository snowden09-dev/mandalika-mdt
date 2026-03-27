"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Target, Zap, Search,
    Camera, Clock, Calendar as CalendarIcon, ArrowLeft,
    ChevronLeft, ChevronRight, Fingerprint, Activity, ShieldCheck, X
} from 'lucide-react';
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { toast, Toaster } from "sonner";

// --- UTILS ---
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[5px_5px_0px_#000]";
const cardShadow = "shadow-[12px_12px_0px_#000]";
const fontBlack = "font-mono font-black italic uppercase tracking-tighter";

const inputStyle = `w-full bg-white ${boxBorder} rounded-2xl px-6 py-4 text-xs font-bold focus:bg-[#f0f9ff] focus:border-blue-600 outline-none text-slate-900 transition-all ${hardShadow}`;
const labelStyle = `text-[10px] md:text-[11px] ${fontBlack} text-slate-500 ml-2 mb-2 flex items-center gap-2 tracking-widest`;

// --- COMPONENT: NEOBRUTALISM CALENDAR ---
function Calendar({ className, ...props }: any) {
    return (
        <DayPicker
            locale={id}
            className={cn("rounded-xl border-[3.5px] border-slate-950 bg-[#A3E635] p-3 font-mono shadow-[8px_8px_0px_#000]", className)}
            classNames={{
                caption: "flex justify-center pt-1 relative items-center w-full text-slate-950",
                caption_label: "text-sm font-black uppercase italic",
                nav_button: "size-7 bg-white border-2 border-slate-950 rounded-md flex items-center justify-center hover:bg-black hover:text-white transition-all",
                day: "size-9 p-0 font-bold border-2 border-transparent hover:border-black transition-all aria-selected:bg-black! aria-selected:text-white rounded-md",
                day_today: "bg-white text-black border-black",
            }}
            components={{
                IconLeft: () => <ChevronLeft className="size-4" />,
                IconRight: () => <ChevronRight className="size-4" />,
            }}
            {...props}
        />
    );
}

// --- COMPONENT: POPOVER ---
function BrutalPopover({ trigger, children, isOpen, setIsOpen }: any) {
    const popoverRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClick(e: any) { if (popoverRef.current && !popoverRef.current.contains(e.target)) setIsOpen(false); }
        if (isOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen]);
    return (
        <div className="relative w-full" ref={popoverRef}>
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
            <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-[100] mt-2 left-0 w-full md:w-auto">{children}</motion.div>}</AnimatePresence>
        </div>
    );
}

export default function LaporanMultiForm() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [tipe, setTipe] = useState("");
    const [loading, setLoading] = useState(false);
    const [calOpen, setCalOpen] = useState(false);

    const [formData, setFormData] = useState({
        nama_petugas: "", pangkat: "", tanggal: new Date(), waktu_shift: "",
        nama_pelaku: "", ktp_pelaku: "", pasal: "", total_denda: "", hukuman: "",
        divisi: "", jenis_kasus: "", lokasi: "", barang_bukti: "", hasil_akhir: "", keterangan: ""
    });

    const [foto, setFoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const MENTION_ROLE = "<@&1393366590942085220>";

    // --- CONFIG: WEBHOOK & THREAD ID ---
    const CONFIG: any = {
        tangkap: {
            color: "#22c55e", label: "Penangkapan", poin: 3, icon: ShieldAlert,
            thread: "1485611644754329793",
            webhook: "https://discord.com/api/webhooks/1471360906234691657/5W5xtNgE9iCEZnAoxo-eL99BOI5-se_17l2tBfrXC3kfyUR77VKFr8GtvARZ_KXpFqkL"
        },
        kasus: {
            color: "#eab308", label: "Kasus Besar", poin: 10, icon: Target,
            thread: "1485611860970438737",
            webhook: "https://discord.com/api/webhooks/1485960116200144906/P4C5QwxdU63YR8wAdFlL0XVfOmsiGTVZa0D_4TPeIBK57RE5qvIpn0NCN7evyH_W4TN5"
        },
        patroli: {
            color: "#3b82f6", label: "Patroli", poin: 5, icon: Search,
            thread: "1485611402264838266",
            webhook: "https://discord.com/api/webhooks/1485960546506375302/GSsV5b_rxDsQb6kVWdv9wkGzsWL2f5KTcKFcbebCeuyg_Obav-R4cu1EZ2qDRRxHATRU"
        },
        backup: {
            color: "#ef4444", label: "Backup", poin: 3, icon: Zap,
            thread: "1485612034434531328",
            webhook: "https://discord.com/api/webhooks/1485960975671889930/P-l52L15m2xPRsxNiBkasOWcgQh6362sXB2oIf2A32-SwrTSjZB-kZY2xFU5LbilYXbQ"
        }
    };

    const getFormatMessage = (d: any) => {
        const tglStr = format(d.tanggal, "yyyy-MM-dd");
        if (tipe === 'tangkap') return `📁 **LAPORAN PENANGKAPAN**\n\`\`\`\nNama Pelaku : ${d.nama_pelaku || '-'}\nKTP Pelaku : ${d.ktp_pelaku || '-'}\nTanggal : ${tglStr}\n\nNama Petugas : ${d.nama_petugas}\n\nPasal Dilanggar: ${d.pasal || '-'}\nHukuman: ${d.hukuman || '-'}\nTotal Denda: Rp ${d.total_denda || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (tipe === 'kasus') return `📁 **LAPORAN PENANGANAN KASUS BESAR**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nUnit / Divisi : ${d.divisi || '-'}\n\nJenis Kasus : ${d.jenis_kasus || '-'}\nLokasi Kejadian : ${d.lokasi || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil Akhir : ${d.hasil_akhir || '-'}\n\nBarang Bukti : ${d.barang_bukti || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (tipe === 'patroli') return `📁 **LAPORAN PATROLI**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\n\nArea Patroli : ${d.lokasi || '-'}\n\nHasil Singkat : ${d.keterangan || '-'}\n\`\`\`\n${MENTION_ROLE}`;
        if (tipe === 'backup') return `📁 **LAPORAN MEMBANTU BACKUP**\n\`\`\`\nTanggal : ${tglStr}\nWaktu : ${d.waktu_shift || '-'}\n\nData Petugas\nNama IC : ${d.nama_petugas}\nPangkat : ${d.pangkat}\nUnit / Divisi : ${d.divisi || '-'}\n\nLokasi Backup : ${d.lokasi || '-'}\n\nKronologi Singkat : ${d.keterangan || '-'}\n\nHasil : ${d.hasil_akhir || '-'}\n\`\`\`\n${MENTION_ROLE}`;
    };

    // --- SYNC SESSION DATA ---
    useEffect(() => {
        const sessionData = localStorage.getItem('police_session');
        if (!sessionData) return router.push('/');
        const parsed = JSON.parse(sessionData);

        const loadProfile = async () => {
            const { data } = await supabase.from('users').select('name, pangkat, divisi').eq('discord_id', parsed.discord_id).single();
            if (data) {
                const cleanName = data.name.includes('|') ? data.name.split('|').pop().trim() : data.name;
                setFormData(prev => ({ ...prev, nama_petugas: cleanName, pangkat: data.pangkat, divisi: data.divisi || "" }));
            }
        };
        loadProfile();
    }, []);

    const handleInputChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const submitLaporan = async (e: any) => {
        e.preventDefault();
        if (!foto) return toast.error("FOTO BUKTI WAJIB!");

        setLoading(true);
        const conf = CONFIG[tipe];
        const sessionData = JSON.parse(localStorage.getItem('police_session') || '{}');

        try {
            // 1. TRANSMISI KE DISCORD (DENGAN THREAD ID)
            const payload = new FormData();
            payload.append("payload_json", JSON.stringify({ content: getFormatMessage(formData) }));
            payload.append("file", foto);

            // Kirim ke Webhook + Thread ID Query Param
            await fetch(`${conf.webhook}?thread_id=${conf.thread}`, { method: 'POST', body: payload });

            // 2. UPDATE POIN PRP DI DATABASE
            const { data: user } = await supabase.from('users').select('point_prp').eq('discord_id', sessionData.discord_id).single();
            const newPoin = (Number(user?.point_prp) || 0) + Number(conf.poin);

            await supabase.from('users').update({ point_prp: newPoin }).eq('discord_id', sessionData.discord_id);

            // 3. LOG LAPORAN
            await supabase.from('laporan_aktivitas').insert([{
                user_id_discord: sessionData.discord_id,
                jenis_laporan: conf.label,
                isi_laporan: getFormatMessage(formData),
                poin_estimasi: conf.poin
            }]);

            toast.success("TRANSMISI BERHASIL!", { description: `Poin PRP Bertambah: +${conf.poin}` });
            setTimeout(() => router.push('/dashboard'), 2000);
        } catch (err: any) {
            toast.error("KESALAHAN SISTEM", { description: err.message });
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-mono p-4 md:p-10 relative overflow-hidden">
            <Toaster position="top-center" />
            <div className="max-w-[800px] mx-auto relative z-10">

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => step === 0 ? router.push('/dashboard') : setStep(0)}
                    className={`mb-10 flex items-center gap-3 bg-white ${boxBorder} px-6 py-3 rounded-2xl ${fontBlack} text-[10px] ${hardShadow}`}
                >
                    <ArrowLeft size={16} /> {step === 0 ? "KEMBALI" : "GANTI TIPE"}
                </motion.button>

                <AnimatePresence mode="wait">
                    {step === 0 ? (
                        <motion.div key="s0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none">LAPORAN<br /><span className="text-blue-600 underline underline-offset-8">OPERASIONAL</span></h1>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {Object.entries(CONFIG).map(([id, conf]: any) => (
                                    <button key={id} onClick={() => { setTipe(id); setStep(1); }} className={`bg-white ${boxBorder} p-8 rounded-[35px] ${cardShadow} flex items-center justify-between hover:bg-slate-50 transition-all`}>
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 rounded-2xl border-2 border-black" style={{ color: conf.color }}><conf.icon size={28} /></div>
                                            <div><p className={`${fontBlack} text-lg leading-none mb-1`}>{conf.label}</p><p className="text-[10px] font-bold text-slate-400">KLIK UNTUK MELAPOR</p></div>
                                        </div>
                                        <div className="bg-slate-950 text-white px-3 py-1 rounded-xl text-[9px] font-black">+{conf.poin} PRP</div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="s1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className={`bg-white ${boxBorder} rounded-[45px] ${cardShadow} p-8 md:p-12`}>
                            <form onSubmit={submitLaporan} className="space-y-8">
                                {/* INFO PETUGAS */}
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50 ${boxBorder} rounded-[30px]`}>
                                    <div className="space-y-2"><label className={labelStyle}>Nama IC</label><input className={`${inputStyle} opacity-50`} value={formData.nama_petugas} readOnly /></div>
                                    <div className="space-y-2">
                                        <label className={labelStyle}><CalendarIcon size={12} /> Tanggal</label>
                                        <BrutalPopover isOpen={calOpen} setIsOpen={setCalOpen} trigger={<button type="button" className={inputStyle}>{format(formData.tanggal, "PPP", { locale: id })}</button>}>
                                            <Calendar mode="single" selected={formData.tanggal} onSelect={(d: any) => { if (d) setFormData({ ...formData, tanggal: d }); setCalOpen(false); }} />
                                        </BrutalPopover>
                                    </div>
                                    <div className="space-y-2"><label className={labelStyle}>Pangkat</label><input className={`${inputStyle} opacity-50`} value={formData.pangkat} readOnly /></div>
                                    <div className="space-y-2">
                                        <label className={labelStyle}><Clock size={12} /> Shift</label>
                                        <select name="waktu_shift" required value={formData.waktu_shift} onChange={handleInputChange} className={inputStyle}>
                                            <option value="">PILIH SHIFT</option>
                                            <option value="Pagi">PAGI</option><option value="Siang">SIANG</option>
                                            <option value="Sore">SORE</option><option value="Malam">MALAM</option>
                                        </select>
                                    </div>
                                </div>

                                {/* DYNAMIC FIELDS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {tipe === 'tangkap' && (
                                        <><div className="space-y-2"><label className={labelStyle}>Pelaku</label><input name="nama_pelaku" required onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-2"><label className={labelStyle}>KTP</label><input name="ktp_pelaku" required onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-2"><label className={labelStyle}>Pasal</label><input name="pasal" required onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="space-y-2"><label className={labelStyle}>Denda</label><input name="total_denda" type="number" required onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="md:col-span-2"><label className={labelStyle}>Hukuman</label><input name="hukuman" required onChange={handleInputChange} className={inputStyle} /></div></>
                                    )}
                                    {(tipe === 'kasus' || tipe === 'patroli' || tipe === 'backup') && (
                                        <><div className="md:col-span-2"><label className={labelStyle}>Lokasi / Area</label><input name="lokasi" required onChange={handleInputChange} className={inputStyle} /></div>
                                            <div className="md:col-span-2"><label className={labelStyle}>Laporan Detail</label><textarea name="keterangan" required onChange={handleInputChange} className={`${inputStyle} min-h-[150px]`} /></div></>
                                    )}
                                </div>

                                {/* UPLOAD */}
                                <div className="space-y-4">
                                    <label className={labelStyle}><Camera size={12} /> BUKTI SS</label>
                                    <label className="cursor-pointer block">
                                        <div className={`w-full ${boxBorder} border-dashed rounded-[30px] p-12 bg-slate-50 flex flex-col items-center gap-4 hover:bg-blue-50 transition-all`}>
                                            {preview ? <img src={preview} className="max-w-[300px] rounded-xl border-4 border-black" /> : <><Camera size={40} className="text-slate-300" /><p className="text-[10px] font-black italic">KLIK UNTUK UNGGAH BUKTI</p></>}
                                        </div>
                                        <input type="file" accept="image/*" required onChange={(e: any) => { const f = e.target.files[0]; if (f) { setFoto(f); setPreview(URL.createObjectURL(f)); } }} className="hidden" />
                                    </label>
                                </div>

                                <button disabled={loading} type="submit" className={`w-full bg-slate-900 text-white py-8 rounded-[30px] ${fontBlack} text-xl tracking-[0.4em] ${boxBorder} ${cardShadow} hover:bg-blue-600 disabled:opacity-50`}>
                                    {loading ? "MENGIRIM..." : "KIRIM LAPORAN"}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}