"use client";

import React, { useState, useEffect } from 'react';
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

// 🚀 ENGINE MUTLAK WIB (UTC+7)
// Memaksa sistem membaca waktu sekarang dalam zona waktu Jakarta, tidak peduli HP user di WITA/WIT
const getWIBTime = () => {
    const d = new Date();
    const localTime = d.getTime();
    const localOffset = d.getTimezoneOffset() * 60000;
    const utc = localTime + localOffset;
    const wibOffset = 7 * 3600000; // +7 Jam (WIB)
    return new Date(utc + wibOffset);
};

export default function AbsenPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'DUTY' | 'CUTI'>('DUTY');
    const [loading, setLoading] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [identity, setIdentity] = useState({ nama: 'MENDETEKSI...', pangkat: '...', divisi: '...', discordId: '' });

    // 🚀 Default value sekarang berpatokan pada WIB
    const [tanggalDuty, setTanggalDuty] = useState(format(getWIBTime(), 'yyyy-MM-dd'));
    const [jamAwal, setJamAwal] = useState('08:00');
    const [jamAkhir, setJamAkhir] = useState('16:00');
    const [mulaiCuti, setMulaiCuti] = useState('');
    const [selesaiCuti, setSelesaiCuti] = useState('');
    const [keterangan, setKeterangan] = useState('');

    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [previewModalInfo, setPreviewModalInfo] = useState<string | null>(null);

    // 🚀 Batas hari (Today & H-3) dipaksa menggunakan WIB
    const todayStr = format(getWIBTime(), 'yyyy-MM-dd');
    const hMin3Str = format(addDays(getWIBTime(), -3), 'yyyy-MM-dd');

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
            <div className="bg-[#FF4D4D] border-[2px] border-slate-950 shadow-[4px_4px_0px_#000] rounded-xl p-3 flex gap-3 font-mono items-center w-full max-w-[320px] relative z-50">
                <div className="bg-slate-950 text-[#FF4D4D] p-2 rounded-lg shrink-0"><AlertTriangle size={20} /></div>
                <div>
                    <h1 className="font-black uppercase text-xs italic tracking-wider text-slate-950 leading-none">DITOLAK</h1>
                    <p className="text-[9px] font-bold uppercase text-slate-900 mt-1 leading-tight">{pesan}</p>
                </div>
                <button onClick={() => toast.dismiss(t)} className="absolute top-2 right-2 p-1 opacity-50 hover:opacity-100"><X size={12} className="text-slate-950" /></button>
            </div>
        ), { duration: 5000 });
    };

    const showWarningToast = (pesan: string) => {
        toast.custom((t) => (
            <div className="bg-[#FFD100] border-[2px] border-slate-950 shadow-[4px_4px_0px_#000] rounded-xl p-3 flex gap-3 font-mono items-center w-full max-w-[320px] relative z-50">
                <div className="bg-slate-950 text-[#FFD100] p-2 rounded-lg shrink-0"><Clock size={20} /></div>
                <div>
                    <h1 className="font-black uppercase text-xs italic tracking-wider text-slate-950 leading-none">INFO MUNDUR</h1>
                    <p className="text-[9px] font-bold uppercase text-slate-900 mt-1 leading-tight">{pesan}</p>
                </div>
            </div>
        ), { duration: 4000 });
    };

    const handleTransmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        if (!identity.discordId) return toast.error("Identitas belum terdeteksi!");
        if (!keterangan) return toast.error("Keterangan wajib diisi!");

        // 🚀 Acuan 'Hari Ini' saat disubmit, mutlak menggunakan WIB
        const todayWIB = getWIBTime();
        todayWIB.setHours(0, 0, 0, 0);

        if (activeTab === 'DUTY') {
            const selectedDutyDate = new Date(tanggalDuty);
            selectedDutyDate.setHours(0, 0, 0, 0);
            const diffDutyDays = Math.round((todayWIB.getTime() - selectedDutyDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDutyDays < 0) return showErrorToast("Tidak bisa absen untuk besok (H+1) WIB!");
            if (diffDutyDays > 3) return showErrorToast("Batas absen mundur maksimal 3 hari!");
            if (images.length === 0) return toast.error("Lampirkan 1 foto bukti!");

            // 🚀 PARSING INPUT USER DENGAN +07:00 AGAR DIANGGAP SEBAGAI JAM WIB, BUKAN JAM LOKAL HP
            let startObj = new Date(`${tanggalDuty}T${jamAwal}:00+07:00`);
            let endObj = new Date(`${tanggalDuty}T${jamAkhir}:00+07:00`);

            if (endObj < startObj) endObj.setDate(endObj.getDate() + 1);

            // 🚀 Waktu saat ini (buffer 5 menit) dalam WIB
            const nowWithBuffer = new Date(getWIBTime().getTime() + 5 * 60000);

            if (startObj > nowWithBuffer) {
                return showErrorToast("Jam Mulai ada di masa depan! Jika Anda shift malam dan sudah lewat jam 12, pastikan TANGGAL diubah mundur 1 hari.");
            }
            if (endObj > nowWithBuffer) {
                return showErrorToast("Jam Selesai ada di masa depan! Anda tidak bisa absen sebelum shift benar-benar selesai.");
            }

            let diff = (endObj.getTime() - startObj.getTime()) / 1000 / 60 / 60;
            const durasiJam = parseFloat(diff.toFixed(2));
            if (durasiJam > 7) {
                return showErrorToast(`Durasi ${durasiJam} Jam DITOLAK! Maksimal 1x absen adalah 7 jam. Silakan pecah absen Anda jika ada jeda off-duty.`);
            }

            if (diffDutyDays > 0 && diffDutyDays <= 3) {
                showWarningToast(`Anda melakukan absen mundur (H-${diffDutyDays}).`);
            }

            setLoading(true);
            const tId = toast.loading("Memverifikasi Keamanan Absen...");

            try {
                const dStartSearch = new Date(startObj.getTime() - 24 * 60 * 60 * 1000).toISOString();
                const dEndSearch = new Date(endObj.getTime() + 24 * 60 * 60 * 1000).toISOString();

                const { data: existingDuties, error: errOverlap } = await supabase
                    .from('presensi_duty')
                    .select('start_time, end_time')
                    .eq('user_id_discord', identity.discordId)
                    .gte('start_time', dStartSearch)
                    .lte('end_time', dEndSearch);

                if (existingDuties && existingDuties.length > 0) {
                    const hasOverlap = existingDuties.some(duty => {
                        const exStart = new Date(duty.start_time).getTime();
                        const exEnd = new Date(duty.end_time).getTime();
                        return (startObj.getTime() < exEnd) && (endObj.getTime() > exStart);
                    });

                    if (hasOverlap) {
                        toast.dismiss(tId);
                        setLoading(false);
                        return showErrorToast("JAM BERSILANGAN! Waktu duty Anda bertabrakan dengan data absen yang sudah tercatat sebelumnya.");
                    }
                }

                toast.loading("Mengunggah Bukti Visual...", { id: tId });

                let photoUrls: string[] = [];
                for (const file of images) {
                    const fName = `${identity.discordId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                    const { error: upErr } = await supabase.storage.from('bukti-absen').upload(`duty/${fName}`, file);
                    if (upErr) throw upErr;
                    const { data: { publicUrl } } = supabase.storage.from('bukti-absen').getPublicUrl(`duty/${fName}`);
                    photoUrls.push(publicUrl);
                }

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

                setTimeout(() => handleNavigation('/dashboard'), 2000);

            } catch (err: any) {
                toast.error(`ERROR: ${err.message}`, { id: tId });
                setLoading(false);
            }

        } else if (activeTab === 'CUTI') {
            if (!mulaiCuti || !selesaiCuti) return toast.error("Lengkapi tanggal cuti!");
            const selectedMulaiCuti = new Date(mulaiCuti); selectedMulaiCuti.setHours(0, 0, 0, 0);
            const selectedSelesaiCuti = new Date(selesaiCuti); selectedSelesaiCuti.setHours(0, 0, 0, 0);

            if (selectedSelesaiCuti < selectedMulaiCuti) return showErrorToast("Tanggal selesai salah!");

            // 🚀 Acuan selisih hari Cuti juga dipaksa menggunakan WIB
            const diffMulaiDays = Math.round((todayWIB.getTime() - selectedMulaiCuti.getTime()) / (1000 * 60 * 60 * 24));
            if (diffMulaiDays < 0) return showErrorToast("Mulai cuti max hari ini!");
            if (diffMulaiDays > 3) return showErrorToast("Cuti mundur max H-3!");

            setLoading(true);
            const tId = toast.loading("Transmitting Cuti...");

            try {
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

                setTimeout(() => handleNavigation('/dashboard'), 2000);
            } catch (err: any) {
                toast.error(`ERROR: ${err.message}`, { id: tId });
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#e2e8f0] text-slate-950 font-mono p-4 flex flex-col items-center overflow-x-hidden relative">
            <TacticalTransition isVisible={isNavigating} />
            <Toaster position="top-center" />

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

                <div className="flex bg-slate-950 p-1 rounded-xl mb-5 gap-1">
                    <button type="button" onClick={() => setActiveTab('DUTY')} className={cn("flex-1 py-2 rounded-lg font-black uppercase italic text-[10px] transition-all", activeTab === 'DUTY' ? 'bg-[#A3E635] text-black' : 'text-white opacity-40')}>Duty Log</button>
                    <button type="button" onClick={() => setActiveTab('CUTI')} className={cn("flex-1 py-2 rounded-lg font-black uppercase italic text-[10px] transition-all", activeTab === 'CUTI' ? 'bg-[#FF4D4D] text-white' : 'text-white opacity-40')}>Izin Cuti</button>
                </div>

                <form onSubmit={handleTransmit} className="space-y-4">
                    <AnimatePresence mode="wait">
                        {activeTab === 'DUTY' ? (
                            <motion.div key="duty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                <div className="space-y-1">
                                    <p className={labelStyle}><CalendarIcon size={12} /> Date (WIB)</p>
                                    <input type="date" value={tanggalDuty} min={hMin3Str} max={todayStr} onChange={e => setTanggalDuty(e.target.value)} className={inputStyle} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className={labelStyle}><Clock size={12} /> Start (WIB)</p>
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
                                        <p className={labelStyle}><Clock size={12} /> End (WIB)</p>
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

                                <div className="space-y-1">
                                    <p className={labelStyle}><Camera size={12} /> Evidence</p>
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
                                                    onClick={(e) => { e.stopPropagation(); setImages(images.filter((_, i) => i !== idx)); setPreviews(previews.filter((_, i) => i !== idx)); }}
                                                    className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded border border-black active:scale-90 z-10"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                        {images.length < 3 && (
                                            <label className={`relative w-16 h-16 shrink-0 ${boxBorder} border-dashed rounded-lg bg-slate-50 flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000] hover:bg-slate-200 transition-colors`}>
                                                <Camera size={16} className="text-slate-400" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={e => { const f = Array.from(e.target.files || []); setImages([...images, ...f]); setPreviews([...previews, ...f.map(file => URL.createObjectURL(file))]); }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="cuti" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><p className={labelStyle}><CalendarIcon size={12} /> Mulai (WIB)</p><input type="date" value={mulaiCuti} min={hMin3Str} max={todayStr} onChange={e => setMulaiCuti(e.target.value)} className={inputStyle} /></div>
                                    <div className="space-y-1"><p className={labelStyle}><CalendarIcon size={12} /> Selesai (WIB)</p><input type="date" value={selesaiCuti} min={mulaiCuti || hMin3Str} onChange={e => setSelesaiCuti(e.target.value)} className={inputStyle} /></div>
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