"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Camera, Clock, Calendar as CalendarIcon,
    X, ShieldAlert, Zap, FileSearch, Send, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { format, addDays } from "date-fns";
import { toast, Toaster } from "sonner";
import TacticalTransition from '@/app/dashboard/components/TacticalTransition';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// 🚀 UI COMPACT UNTUK MOBILE
const boxBorder = "border-[2px] border-slate-950";
const cardShadow = "shadow-[4px_4px_0px_#000]";
const inputStyle = `w-full bg-[#f8fafc] ${boxBorder} rounded-lg px-3 py-2 text-xs font-mono font-bold focus:border-blue-600 focus:bg-white outline-none text-slate-900 transition-all shadow-[2px_2px_0px_#000]`;
const labelStyle = "text-[9px] font-black uppercase tracking-widest text-slate-950 ml-1 mb-1.5 flex items-center gap-1.5 italic";

export default function AbsenPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'DUTY' | 'CUTI'>('DUTY');
    const [loading, setLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [identity, setIdentity] = useState({ nama: 'MENDETEKSI...', pangkat: '...', divisi: '...', discordId: '' });

    const [tanggalDuty, setTanggalDuty] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [jamAwal, setJamAwal] = useState('08:00');
    const [jamAkhir, setJamAkhir] = useState('16:00');
    const [mulaiCuti, setMulaiCuti] = useState('');
    const [selesaiCuti, setSelesaiCuti] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const hMin3Str = format(addDays(new Date(), -3), 'yyyy-MM-dd');

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

    const handleNavigation = (path: string) => {
        setIsNavigating(true);
        setTimeout(() => router.push(path), 3000);
    };

    const showErrorToast = (pesan: string) => {
        toast.custom((t) => (
            <div className="bg-[#FF4D4D] border-[2px] border-slate-950 shadow-[4px_4px_0px_#000] rounded-xl p-3 flex gap-3 font-mono items-center w-full max-w-[320px] relative">
                <div className="bg-slate-950 text-[#FF4D4D] p-2 rounded-lg shrink-0"><AlertTriangle size={20} /></div>
                <div>
                    <h1 className="font-black uppercase text-xs italic tracking-wider text-slate-950 leading-none">DITOLAK</h1>
                    <p className="text-[9px] font-bold uppercase text-slate-900 mt-1 leading-tight">{pesan}</p>
                </div>
                <button onClick={() => toast.dismiss(t)} className="absolute top-2 right-2 p-1 opacity-50 hover:opacity-100"><X size={12} className="text-slate-950" /></button>
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

        if (activeTab === 'DUTY') {
            const selectedDutyDate = new Date(tanggalDuty);
            selectedDutyDate.setHours(0, 0, 0, 0);
            const diffDutyDays = Math.round((today.getTime() - selectedDutyDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDutyDays < 0) return showErrorToast("Tidak bisa absen untuk besok!");
            if (diffDutyDays > 3) return showErrorToast("Batas absen mundur 3 hari!");
            if (images.length === 0) return toast.error("Lampirkan 1 foto bukti!");
        }

        if (activeTab === 'CUTI') {
            if (!mulaiCuti || !selesaiCuti) return toast.error("Lengkapi tanggal cuti!");
            const selectedMulaiCuti = new Date(mulaiCuti); selectedMulaiCuti.setHours(0, 0, 0, 0);
            const selectedSelesaiCuti = new Date(selesaiCuti); selectedSelesaiCuti.setHours(0, 0, 0, 0);

            if (selectedSelesaiCuti < selectedMulaiCuti) return showErrorToast("Tanggal selesai salah!");
            const diffMulaiDays = Math.round((today.getTime() - selectedMulaiCuti.getTime()) / (1000 * 60 * 60 * 24));
            if (diffMulaiDays < 0) return showErrorToast("Mulai cuti max hari ini!");
            if (diffMulaiDays > 3) return showErrorToast("Cuti mundur max H-3!");
        }

        setLoading(true);
        const tId = toast.loading("Transmitting...");

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
                const durasiJam = parseFloat(diff.toFixed(2));
                const durasiMenitBulat = Math.round(durasiJam * 60);

                const { error: insErr } = await supabase.from('presensi_duty').insert([{
                    user_id_discord: identity.discordId,
                    nama_panggilan: identity.nama,
                    pangkat: identity.pangkat,
                    divisi: identity.divisi,
                    start_time: startObj.toISOString(),
                    end_time: endObj.toISOString(),
                    durasi_menit: durasiMenitBulat,
                    status: 'SUCCESS',
                    catatan_duty: keterangan,
                    bukti_foto: photoUrls
                }]);
                if (insErr) throw insErr;

                const { data: currentUserData } = await supabase.from('users').select('total_jam_duty').eq('discord_id', identity.discordId).maybeSingle();
                const currentTotal = Number(currentUserData?.total_jam_duty || 0);
                const additionalHours = Number((durasiMenitBulat / 60).toFixed(2));
                const newTotalHours = Number((currentTotal + additionalHours).toFixed(2));

                await supabase.from('users').update({ total_jam_duty: newTotalHours }).eq('discord_id', identity.discordId);

                toast.custom((t) => (
                    <div className="bg-[#A3E635] border-[2px] border-slate-950 shadow-[4px_4px_0px_#000] rounded-xl p-3 flex gap-3 font-mono items-center w-full max-w-[320px] relative">
                        <div className="bg-slate-950 text-[#A3E635] p-2 rounded-lg shrink-0"><CheckCircle2 size={20} /></div>
                        <div>
                            <h1 className="font-black uppercase text-xs italic tracking-wider text-slate-950 leading-none">SUKSES</h1>
                            <p className="text-[9px] font-bold uppercase text-slate-900 mt-1 leading-tight">Presensi dikirim.</p>
                        </div>
                    </div>
                ), { id: tId, duration: 3000 });

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

                toast.custom((t) => (
                    <div className="bg-[#FFD100] border-[2px] border-slate-950 shadow-[4px_4px_0px_#000] rounded-xl p-3 flex gap-3 font-mono items-center w-full max-w-[320px] relative">
                        <div className="bg-slate-950 text-[#FFD100] p-2 rounded-lg shrink-0"><Clock size={20} /></div>
                        <div>
                            <h1 className="font-black uppercase text-xs italic tracking-wider text-slate-950 leading-none">CUTI TERKIRIM</h1>
                            <p className="text-[9px] font-bold uppercase text-slate-900 mt-1 leading-tight">Menunggu ACC.</p>
                        </div>
                    </div>
                ), { id: tId, duration: 3000 });
            }

            setTimeout(() => handleNavigation('/dashboard'), 2000);

        } catch (err: any) {
            toast.error(`ERROR: ${err.message}`, { id: tId });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#e2e8f0] text-slate-950 font-mono p-4 flex flex-col items-center overflow-x-hidden relative">
            <TacticalTransition isVisible={isNavigating} />
            <Toaster position="top-center" />

            {/* 🚀 COMPACT HEADER DENGAN TOMBOL KEMBALI */}
            <div className="w-full max-w-md flex items-center justify-between mb-6 mt-2">
                <button onClick={() => handleNavigation('/dashboard')} className="p-2.5 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] active:translate-y-px transition-all">
                    <ArrowLeft size={18} />
                </button>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-1">
                        <ShieldAlert className="text-blue-600 animate-pulse" size={14} />
                        <span className="text-[8px] font-black tracking-widest uppercase opacity-50 italic">Mandalika PD</span>
                    </div>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">Reporting</h1>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`w-full max-w-md bg-white ${boxBorder} rounded-[24px] ${cardShadow} p-5`}>

                {/* 🚀 COMPACT IDENTITY BADGE */}
                <div className="flex justify-between items-center bg-slate-100 border-2 border-slate-950 p-2.5 rounded-xl mb-5 shadow-inner">
                    <div className="truncate">
                        <p className="text-[8px] font-black text-slate-400 uppercase italic">Personnel</p>
                        <p className="text-xs font-black uppercase truncate">{identity.nama}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                        <p className="text-[8px] font-black text-slate-400 uppercase italic">Rank</p>
                        <p className="text-xs font-black uppercase text-blue-600">{identity.pangkat}</p>
                    </div>
                </div>

                {/* 🚀 COMPACT TAB SWITCHER */}
                <div className="flex bg-slate-950 p-1 rounded-xl mb-5 gap-1">
                    <button type="button" onClick={() => setActiveTab('DUTY')} className={cn("flex-1 py-2 rounded-lg font-black uppercase italic text-[10px] transition-all", activeTab === 'DUTY' ? 'bg-[#A3E635] text-black' : 'text-white opacity-40')}>Duty Log</button>
                    <button type="button" onClick={() => setActiveTab('CUTI')} className={cn("flex-1 py-2 rounded-lg font-black uppercase italic text-[10px] transition-all", activeTab === 'CUTI' ? 'bg-[#FF4D4D] text-white' : 'text-white opacity-40')}>Izin Cuti</button>
                </div>

                <form onSubmit={handleTransmit} className="space-y-4">
                    <AnimatePresence mode="wait">
                        {activeTab === 'DUTY' ? (
                            <motion.div key="duty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                <div className="space-y-1">
                                    <p className={labelStyle}><CalendarIcon size={12} /> Date</p>
                                    <input type="date" value={tanggalDuty} min={hMin3Str} max={todayStr} onChange={e => setTanggalDuty(e.target.value)} className={inputStyle} />
                                </div>

                                {/* 🚀 24-HOUR CUSTOM DROPDOWNS (ANTI AM/PM) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className={labelStyle}><Clock size={12} /> Start</p>
                                        <div className="flex items-center gap-1">
                                            <select value={jamAwal.split(':')[0]} onChange={e => setJamAwal(`${e.target.value}:${jamAwal.split(':')[1]}`)} className={cn(inputStyle, "cursor-pointer text-center !px-1 appearance-none")}>
                                                {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                                            </select>
                                            <span className="font-black text-slate-950">:</span>
                                            <select value={jamAwal.split(':')[1]} onChange={e => setJamAwal(`${jamAwal.split(':')[0]}:${e.target.value}`)} className={cn(inputStyle, "cursor-pointer text-center !px-1 appearance-none")}>
                                                {Array.from({ length: 60 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className={labelStyle}><Clock size={12} /> End</p>
                                        <div className="flex items-center gap-1">
                                            <select value={jamAkhir.split(':')[0]} onChange={e => setJamAkhir(`${e.target.value}:${jamAkhir.split(':')[1]}`)} className={cn(inputStyle, "cursor-pointer text-center !px-1 appearance-none")}>
                                                {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                                            </select>
                                            <span className="font-black text-slate-950">:</span>
                                            <select value={jamAkhir.split(':')[1]} onChange={e => setJamAkhir(`${jamAkhir.split(':')[0]}:${e.target.value}`)} className={cn(inputStyle, "cursor-pointer text-center !px-1 appearance-none")}>
                                                {Array.from({ length: 60 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 🚀 HORIZONTAL SCROLL EVIDENCE */}
                                <div className="space-y-1">
                                    <p className={labelStyle}><Camera size={12} /> Evidence</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {previews.map((src, idx) => (
                                            <div key={idx} className={`relative w-16 h-16 shrink-0 ${boxBorder} rounded-lg overflow-hidden shadow-[2px_2px_0px_#000]`}>
                                                <img src={src} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => { setImages(images.filter((_, i) => i !== idx)); setPreviews(previews.filter((_, i) => i !== idx)); }} className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded border border-black active:scale-90"><X size={10} /></button>
                                            </div>
                                        ))}
                                        {images.length < 3 && (
                                            <label className={`w-16 h-16 shrink-0 ${boxBorder} border-dashed rounded-lg bg-slate-50 flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000]`}>
                                                <Camera size={16} className="text-slate-300" />
                                                <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const f = Array.from(e.target.files || []); setImages([...images, ...f]); setPreviews([...previews, ...f.map(file => URL.createObjectURL(file))]); }} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="cuti" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><p className={labelStyle}><CalendarIcon size={12} /> Mulai</p><input type="date" value={mulaiCuti} min={hMin3Str} max={todayStr} onChange={e => setMulaiCuti(e.target.value)} className={inputStyle} /></div>
                                    <div className="space-y-1"><p className={labelStyle}><CalendarIcon size={12} /> Selesai</p><input type="date" value={selesaiCuti} min={mulaiCuti || hMin3Str} onChange={e => setSelesaiCuti(e.target.value)} className={inputStyle} /></div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-1">
                        <p className={labelStyle}><FileSearch size={12} /> Remarks</p>
                        <textarea rows={2} className={cn(inputStyle, "resize-none h-16")} value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Tulis keterangan tugas / alasan cuti..." />
                    </div>

                    <button type="submit" disabled={loading} className={cn("w-full py-4 mt-2 rounded-xl font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2", boxBorder, cardShadow, "active:translate-y-1 shadow-none disabled:opacity-50", activeTab === 'DUTY' ? 'bg-slate-950' : 'bg-red-600')}>
                        {loading ? "TRANSMITTING..." : <><Send size={16} /> TRANSMIT</>}
                    </button>
                </form>
            </motion.div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
}