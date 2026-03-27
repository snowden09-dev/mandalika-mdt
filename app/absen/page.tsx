"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Camera, Clock, Calendar as CalendarIcon,
    X, ShieldAlert, Zap, Briefcase, FileSearch, Send, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { format, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { toast, Toaster } from "sonner";

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const boxBorder = "border-[3.5px] border-slate-950";
const cardShadow = "shadow-[8px_8px_0px_#000]";
const tabShadow = "shadow-[4px_4px_0px_#000]";
const inputStyle = `w-full bg-[#f1f5f9] ${boxBorder} rounded-xl px-4 py-3 text-xs font-mono font-bold focus:border-blue-600 focus:bg-white outline-none text-slate-900 transition-all shadow-[4px_4px_0px_#000]`;
const labelStyle = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-950 ml-2 mb-2 flex items-center gap-2 italic";

export default function AbsenPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'DUTY' | 'CUTI'>('DUTY');
    const [loading, setLoading] = useState(false);
    const [identity, setIdentity] = useState({ nama: 'MENDETEKSI...', pangkat: '...', divisi: '...', discordId: '' });

    const [tanggalDuty, setTanggalDuty] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [jamAwal, setJamAwal] = useState('08:00');
    const [jamAkhir, setJamAkhir] = useState('16:00');
    const [mulaiCuti, setMulaiCuti] = useState('');
    const [selesaiCuti, setSelesaiCuti] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // FIX: PERHITUNGAN TANGGAL BATAS (HARI INI & H-3)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const hMin3Str = format(addDays(new Date(), -3), 'yyyy-MM-dd'); // Mundur 3 hari

    useEffect(() => {
        async function getActiveUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const dId = user.user_metadata?.provider_id || user.id;
            const { data } = await supabase.from('users').select('name, pangkat, divisi').eq('discord_id', dId).maybeSingle();
            if (data) {
                const cleanName = data.name.includes('|') ? data.name.split('|')[1].trim() : data.name;
                setIdentity({ nama: cleanName.toUpperCase(), pangkat: data.pangkat.toUpperCase(), divisi: data.divisi?.toUpperCase() || 'UNIT', discordId: dId });
            }
        }
        getActiveUser();
    }, []);

    const showErrorToast = (pesan: string) => {
        toast.custom((t) => (
            <div className="bg-[#FF4D4D] border-[3.5px] border-slate-950 shadow-[6px_6px_0px_#000] rounded-2xl p-4 flex gap-4 font-mono items-center w-full max-w-[340px] relative">
                <div className="bg-slate-950 text-[#FF4D4D] p-2.5 rounded-xl shrink-0">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h1 className="font-black uppercase text-sm italic tracking-wider text-slate-950 leading-none">LAPORAN DITOLAK</h1>
                    <p className="text-[10px] font-bold uppercase text-slate-900 mt-1 leading-tight">{pesan}</p>
                </div>
                <button onClick={() => toast.dismiss(t)} className="absolute top-2 right-2 p-1 opacity-50 hover:opacity-100 transition-opacity">
                    <X size={14} className="text-slate-950" />
                </button>
            </div>
        ), { duration: 4000 });
    };

    const handleTransmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        if (!identity.discordId) return toast.error("Identitas belum terdeteksi!");
        if (!keterangan) return toast.error("Keterangan wajib diisi!");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // --- VALIDASI DUTY ---
        if (activeTab === 'DUTY') {
            const selectedDutyDate = new Date(tanggalDuty);
            selectedDutyDate.setHours(0, 0, 0, 0);
            const diffDutyDays = Math.round((today.getTime() - selectedDutyDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDutyDays < 0) return showErrorToast("Tidak bisa absen Duty untuk masa depan (H+1)!");
            if (diffDutyDays > 3) return showErrorToast("Batas maksimal absen Duty mundur hanya 3 hari!");
            if (images.length === 0) return toast.error("Lampirkan minimal 1 foto bukti!");
        }

        // --- VALIDASI CUTI ---
        if (activeTab === 'CUTI') {
            if (!mulaiCuti || !selesaiCuti) return toast.error("Lengkapi tanggal cuti!");

            const selectedMulaiCuti = new Date(mulaiCuti);
            selectedMulaiCuti.setHours(0, 0, 0, 0);
            const selectedSelesaiCuti = new Date(selesaiCuti);
            selectedSelesaiCuti.setHours(0, 0, 0, 0);

            if (selectedSelesaiCuti < selectedMulaiCuti) {
                return showErrorToast("Tanggal selesai tidak boleh lebih cepat dari tanggal mulai!");
            }

            const diffMulaiDays = Math.round((today.getTime() - selectedMulaiCuti.getTime()) / (1000 * 60 * 60 * 24));

            if (diffMulaiDays < 0) return showErrorToast("Mulai cuti tidak bisa melebihi hari ini (H+1)!");
            if (diffMulaiDays > 3) return showErrorToast("Pengajuan cuti mundur maksimal hanya H-3 dari hari ini!");
        }

        setLoading(true);
        const tId = toast.loading("Processing transmission...");

        try {
            if (activeTab === 'DUTY') {
                let photoUrls: string[] = [];
                for (const file of images) {
                    const fName = `${identity.discordId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                    const { error: upErr } = await supabase.storage.from('bukti-absen').upload(`duty/${fName}`, file);
                    if (upErr) throw upErr;
                    const { data: { publicUrl } } = supabase.storage.from('bukti-absen').getPublicUrl(`duty/${fName}`);
                    photoUrls.push(publicUrl);
                }

                let startObj = new Date(`${tanggalDuty}T${jamAwal}:00`);
                let endObj = new Date(`${tanggalDuty}T${jamAkhir}:00`);

                if (endObj < startObj) endObj.setDate(endObj.getDate() + 1);

                let diff = (endObj.getTime() - startObj.getTime()) / 1000 / 60 / 60;
                const durasiJam = parseFloat(diff.toFixed(1));

                const { error: insErr } = await supabase.from('presensi_duty').insert([{
                    user_id_discord: identity.discordId,
                    nama_panggilan: identity.nama,
                    pangkat: identity.pangkat,
                    divisi: identity.divisi,
                    start_time: startObj.toISOString(),
                    end_time: endObj.toISOString(),
                    durasi_menit: Math.round(durasiJam * 60),
                    status: 'SUCCESS',
                    catatan_duty: keterangan,
                    bukti_foto: photoUrls
                }]);
                if (insErr) throw insErr;

                const { data: uData } = await supabase.from('users').select('total_jam_duty').eq('discord_id', identity.discordId).single();
                const newTotal = (Number(uData?.total_jam_duty) || 0) + durasiJam;
                await supabase.from('users').update({ total_jam_duty: newTotal }).eq('discord_id', identity.discordId);

                // FIX NOTIF: Timpa toast langsung tanpa dismiss!
                toast.custom((t) => (
                    <div className="bg-[#A3E635] border-[3.5px] border-slate-950 shadow-[6px_6px_0px_#000] rounded-2xl p-4 flex gap-4 font-mono items-center w-full max-w-[340px] relative">
                        <div className="bg-slate-950 text-[#A3E635] p-2.5 rounded-xl shrink-0">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <h1 className="font-black uppercase text-sm italic tracking-wider text-slate-950 leading-none">TRANSMISI SUKSES</h1>
                            <p className="text-[10px] font-bold uppercase text-slate-900 mt-1 leading-tight">Presensi sudah dikirim ke database.</p>
                        </div>
                        <button onClick={() => toast.dismiss(t)} className="absolute top-2 right-2 p-1 opacity-50 hover:opacity-100 transition-opacity">
                            <X size={14} className="text-slate-950" />
                        </button>
                    </div>
                ), { id: tId, duration: 4000 });

            } else {
                const { error: cutiErr } = await supabase.from('pengajuan_cuti').insert([{
                    user_id_discord: identity.discordId,
                    nama_panggilan: identity.nama,
                    pangkat: identity.pangkat,
                    divisi: identity.divisi,
                    tanggal_mulai: mulaiCuti,
                    tanggal_selesai: selesaiCuti,
                    alasan: keterangan,
                    status: 'PENDING'
                }]);
                if (cutiErr) throw cutiErr;

                // FIX NOTIF: Timpa toast langsung tanpa dismiss!
                toast.custom((t) => (
                    <div className="bg-[#FFD100] border-[3.5px] border-slate-950 shadow-[6px_6px_0px_#000] rounded-2xl p-4 flex gap-4 font-mono items-center w-full max-w-[340px] relative">
                        <div className="bg-slate-950 text-[#FFD100] p-2.5 rounded-xl shrink-0">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h1 className="font-black uppercase text-sm italic tracking-wider text-slate-950 leading-none">PENGAJUAN CUTI</h1>
                            <p className="text-[10px] font-bold uppercase text-slate-900 mt-1 leading-tight">Cuti dikirim. Menunggu approved HC.</p>
                        </div>
                        <button onClick={() => toast.dismiss(t)} className="absolute top-2 right-2 p-1 opacity-50 hover:opacity-100 transition-opacity">
                            <X size={14} className="text-slate-950" />
                        </button>
                    </div>
                ), { id: tId, duration: 4000 });
            }

            setTimeout(() => router.push('/dashboard'), 4000);

        } catch (err: any) {
            console.error("DEBUG ERROR:", JSON.stringify(err, null, 2));
            toast.error(`ERROR: ${err.message}`, { id: tId });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#e2e8f0] text-slate-950 font-mono p-4 pb-24 flex flex-col items-center overflow-x-hidden">
            <Toaster position="top-center" />

            <div className="mb-10 text-center mt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <ShieldAlert className="text-blue-600 animate-pulse" size={20} />
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 italic">Mandalika Tactical System</span>
                </div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">Unit Reporting</h1>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`w-full max-w-md bg-white ${boxBorder} rounded-[40px] ${cardShadow} p-6 md:p-10`}>
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="relative">
                        <span className={`absolute -top-3 -left-1 bg-slate-950 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase italic ${tabShadow}`}>Personnel</span>
                        <div className={cn(inputStyle, "pt-6 bg-slate-100 truncate")}>{identity.nama}</div>
                    </div>
                    <div className="relative">
                        <span className={`absolute -top-3 -left-1 bg-blue-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase italic ${tabShadow}`}>Rank</span>
                        <div className={cn(inputStyle, "pt-6 bg-slate-100 text-blue-700 truncate")}>{identity.pangkat}</div>
                    </div>
                </div>

                <div className="space-y-3 mb-8">
                    <label className={labelStyle}><Zap size={14} /> Operational Status</label>
                    <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950 rounded-2xl">
                        <button type="button" onClick={() => setActiveTab('DUTY')} className={cn("py-3 rounded-xl font-black uppercase italic text-[10px] transition-all", activeTab === 'DUTY' ? 'bg-[#A3E635] text-black shadow-inner' : 'text-white opacity-40')}>Duty Log</button>
                        <button type="button" onClick={() => setActiveTab('CUTI')} className={cn("py-3 rounded-xl font-black uppercase italic text-[10px] transition-all", activeTab === 'CUTI' ? 'bg-[#FF4D4D] text-white shadow-inner' : 'text-white opacity-40')}>Izin Cuti</button>
                    </div>
                </div>

                <form onSubmit={handleTransmit} className="space-y-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'DUTY' ? (
                            <motion.div key="duty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <p className={labelStyle}><CalendarIcon size={14} /> Operation Date</p>
                                        <input
                                            type="date"
                                            value={tanggalDuty}
                                            min={hMin3Str} // Pagar UI: Maksimal H-3
                                            max={todayStr} // Pagar UI: Maksimal Hari Ini
                                            onChange={e => setTanggalDuty(e.target.value)}
                                            className={inputStyle}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1"><p className={labelStyle}>Start</p><input type="time" value={jamAwal} onChange={e => setJamAwal(e.target.value)} className={inputStyle} /></div>
                                        <div className="space-y-1"><p className={labelStyle}>End</p><input type="time" value={jamAkhir} onChange={e => setJamAkhir(e.target.value)} className={inputStyle} /></div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className={labelStyle}><Camera size={14} /> Evidence</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {previews.map((src, idx) => (
                                            <div key={idx} className={`relative aspect-square ${boxBorder} rounded-xl overflow-hidden shadow-[3px_3px_0px_#000]`}>
                                                <img src={src} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => { setImages(images.filter((_, i) => i !== idx)); setPreviews(previews.filter((_, i) => i !== idx)); }} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-lg border-2 border-black active:scale-90"><X size={12} /></button>
                                            </div>
                                        ))}
                                        {images.length < 3 && <label className={`aspect-square ${boxBorder} border-dashed rounded-xl bg-slate-50 flex items-center justify-center cursor-pointer shadow-[3px_3px_0px_#000]`}><Camera size={18} className="text-slate-300" /><input type="file" accept="image/*" multiple className="hidden" onChange={e => { const f = Array.from(e.target.files || []); setImages([...images, ...f]); setPreviews([...previews, ...f.map(file => URL.createObjectURL(file))]); }} /></label>}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="cuti" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className={labelStyle}>Mulai</p>
                                        <input
                                            type="date"
                                            value={mulaiCuti}
                                            min={hMin3Str} // Pagar UI: Maksimal mundur H-3
                                            max={todayStr} // Pagar UI: Gabisa mulai di hari besok (H+1)
                                            onChange={e => setMulaiCuti(e.target.value)}
                                            className={inputStyle}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className={labelStyle}>Selesai</p>
                                        <input
                                            type="date"
                                            value={selesaiCuti}
                                            min={mulaiCuti || hMin3Str} // Selesai gabisa sblm Mulai
                                            onChange={e => setSelesaiCuti(e.target.value)}
                                            className={inputStyle}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-1">
                        <p className={labelStyle}><FileSearch size={14} /> Details</p>
                        <textarea rows={3} className={cn(inputStyle, "resize-none h-24")} value={keterangan} onChange={e => setKeterangan(e.target.value)} />
                    </div>

                    <button type="submit" disabled={loading} className={cn("w-full py-5 rounded-[25px] font-black uppercase tracking-[0.2em] text-white transition-all flex items-center justify-center gap-3", boxBorder, cardShadow, "active:translate-y-1 shadow-none disabled:opacity-50", activeTab === 'DUTY' ? 'bg-slate-950' : 'bg-red-600')}>
                        {loading ? "TRANSMITTING..." : <><Send size={18} /> TRANSMIT DATA</>}
                    </button>
                </form>
            </motion.div>

            <button onClick={() => router.push('/dashboard')} className="mt-8 mb-10 flex items-center gap-2 bg-white border-[3px] border-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase italic shadow-[4px_4px_0px_#000] active:translate-y-1 transition-all">
                <ArrowLeft size={16} /> Kembali ke Dashboard
            </button>
        </div>
    );
}