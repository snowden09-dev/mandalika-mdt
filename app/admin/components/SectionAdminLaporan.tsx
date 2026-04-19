"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, XCircle, Clock, Eye, Send,
    Trash2, ShieldCheck, Image as ImageIcon,
    Filter, ArrowRight, ExternalLink, X, Zap, AlertOctagon,
    Settings, Save, Hash, Search, Loader2, Lock, Globe, Camera, FileText
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from 'next/navigation';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SENT';

export default function SectionAdminLaporan() {
    const router = useRouter();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [activeTab, setActiveTab] = useState<StatusFilter>('PENDING');
    const [previewData, setPreviewData] = useState<any>(null);
    const [showConfig, setShowConfig] = useState(false);

    // --- STATE CONFIG (PENILANGAN DITAMBAHKAN) ---
    const [adminConfigs, setAdminConfigs] = useState({
        webhook_penangkapan: "", webhook_kasus_besar: "", webhook_patroli: "", webhook_backup: "", webhook_penilangan: "",
        thread_penangkapan: "", thread_kasus_besar: "", thread_patroli: "", thread_backup: "", thread_penilangan: ""
    });

    const [deleteModal, setDeleteModal] = useState<{ show: boolean, type: 'SINGLE' | 'ALL', id?: string }>({ show: false, type: 'ALL' });
    const [confirmInput, setConfirmInput] = useState("");

    const verifyAndFetch = async () => {
        setLoading(true);
        const sessionData = localStorage.getItem('police_session');
        if (!sessionData) { router.push('/'); return; }
        const parsed = JSON.parse(sessionData);

        const { data: auth, error: authError } = await supabase.from('users').select('is_admin, is_highadmin').eq('discord_id', parsed.discord_id).single();
        if (authError || (!auth.is_admin && !auth.is_highadmin)) {
            toast.error("AKSES DITOLAK!");
            router.push('/dashboard');
            return;
        }

        setIsAuthorized(true);

        const { data: lap } = await supabase.from('laporan_aktivitas').select(`*, users(name, pangkat)`).order('created_at', { ascending: false });
        if (lap) setReports(lap);

        const { data: cfg } = await supabase.from('admin_config').select('*');
        if (cfg && cfg.length > 0) {
            const configObj = cfg.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
            setAdminConfigs(prev => ({ ...prev, ...configObj }));
        }
        setLoading(false);
    };

    useEffect(() => { verifyAndFetch(); }, []);

    const filteredData = useMemo(() => {
        if (activeTab === 'NOT_SENT') {
            return reports.filter(r => r.status === 'APPROVED' && r.is_sent_discord !== true);
        }
        return reports.filter(r => r.status === activeTab);
    }, [reports, activeTab]);

    const updateConfigs = async () => {
        const tId = toast.loading("Saving Multi-Channel Configs...");
        try {
            const updates = Object.entries(adminConfigs).map(([key, value]) =>
                supabase.from('admin_config').upsert({ key, value })
            );
            await Promise.all(updates);
            toast.success("ALL CHANNELS UPDATED!", { id: tId });
            setShowConfig(false);
        } catch (err) { toast.error("Gagal update konfigurasi!"); }
    };

    // --- 🛠️ FUNGSI FILTER URL GAMBAR ---
    const formatImageUrlForDiscord = (url: string) => {
        if (!url) return null;
        let finalUrl = url.trim();

        // 1. Jika URL dari Supabase, biarkan saja karena ini sudah Direct URL
        if (finalUrl.includes('supabase.co/storage')) {
            return finalUrl;
        }

        // 2. Fix khusus untuk Imgur standard
        if (finalUrl.includes('imgur.com') && !finalUrl.includes('i.imgur.com')) {
            if (!finalUrl.includes('/a/') && !finalUrl.includes('/gallery/')) {
                finalUrl = finalUrl.replace('imgur.com', 'i.imgur.com');
                if (!finalUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                    finalUrl += '.jpg';
                }
            } else {
                return null; // Return null jika format album agar webhook tidak error
            }
        }
        return finalUrl;
    };

    // --- 🛠️ LOGIKA FIX: PENAMBAHAN SYSTEM RADAR BUKTI ---
    const handleAction = async (report: any, status: 'APPROVED' | 'REJECTED') => {
        const tId = toast.loading(`Processing ${status}...`);
        try {
            if (status === 'APPROVED') {
                if (report.user_id_discord) {
                    const { data: userData } = await supabase.from('users').select('point_prp').eq('discord_id', report.user_id_discord).single();
                    const currentPoin = Number(userData?.point_prp) || 0;
                    const poinTambahan = Number(report.poin_estimasi) || 0;

                    const { data: prpCheck, error: prpErr } = await supabase.from('users').update({ point_prp: currentPoin + poinTambahan }).eq('discord_id', report.user_id_discord).select();
                    if (prpErr) throw prpErr;
                    if (!prpCheck || prpCheck.length === 0) throw new Error("Akses Database Ditolak (RLS Users Blokir)!");
                }

                const typeKey = (report.jenis_laporan || "").replace(' ', '_').toLowerCase();
                const targetWebhook = adminConfigs[`webhook_${typeKey}` as keyof typeof adminConfigs];
                const targetThread = adminConfigs[`thread_${typeKey}` as keyof typeof adminConfigs];

                if (!targetWebhook) throw new Error(`Webhook untuk ${report.jenis_laporan} belum diatur di Panel Config!`);

                const discordImageUrl = formatImageUrlForDiscord(report.bukti_foto);
                const embedsPayload = discordImageUrl ? [{ image: { url: discordImageUrl }, color: 3447003 }] : [];

                const response = await fetch(`${targetWebhook}${targetThread ? `?thread_id=${targetThread}` : ''}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: `**[LAPORAN ${(report.jenis_laporan || "").toUpperCase()}]**\nPersonel: ${report.users?.name}\n\n${report.isi_laporan}`,
                        embeds: embedsPayload
                    })
                });

                if (!response.ok) throw new Error("Discord API Error! Mungkin link gambar tidak valid.");

                const { data: statusCheck, error } = await supabase.from('laporan_aktivitas').update({ status: 'APPROVED', is_sent_discord: true }).eq('id', report.id).select();
                if (error) throw error;
                if (!statusCheck || statusCheck.length === 0) throw new Error("Update Gagal: Database Supabase RLS Memblokir!");

                setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'APPROVED', is_sent_discord: true } : r));
                toast.success(`Berhasil! Poin cair & terkirim ke Discord.`, { id: tId });

            } else {
                const { data: statusCheck, error } = await supabase.from('laporan_aktivitas').update({ status: 'REJECTED' }).eq('id', report.id).select();
                if (error) throw error;
                if (!statusCheck || statusCheck.length === 0) throw new Error("Update Gagal: Database Supabase RLS Memblokir!");

                setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'REJECTED' } : r));
                toast.success(`Laporan DITOLAK!`, { id: tId });
            }

        } catch (err: any) {
            console.error("Detail Error:", err);
            toast.error(`Gagal: ${err.message}`, { id: tId });
        }
    };

    const handleTransmit = async (report: any) => {
        const tId = toast.loading("Resending to Dedicated Channel...");
        const typeKey = (report.jenis_laporan || "").replace(' ', '_').toLowerCase();
        const targetWebhook = adminConfigs[`webhook_${typeKey}` as keyof typeof adminConfigs];
        const targetThread = adminConfigs[`thread_${typeKey}` as keyof typeof adminConfigs];

        if (!targetWebhook) return toast.error(`Webhook belum di-set!`, { id: tId });

        const discordImageUrl = formatImageUrlForDiscord(report.bukti_foto);
        const embedsPayload = discordImageUrl ? [{ image: { url: discordImageUrl }, color: 3447003 }] : [];

        try {
            const response = await fetch(`${targetWebhook}${targetThread ? `?thread_id=${targetThread}` : ''}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `**[RESEND LAPORAN ${(report.jenis_laporan || "").toUpperCase()}]**\nPersonel: ${report.users?.name}\n\n${report.isi_laporan}`,
                    embeds: embedsPayload
                })
            });

            if (!response.ok) throw new Error("Discord Webhook Error! Periksa link URL Webhook atau Gambar.");

            const { data: transCheck, error } = await supabase.from('laporan_aktivitas').update({ is_sent_discord: true }).eq('id', report.id).select();
            if (error) throw error;
            if (!transCheck || transCheck.length === 0) throw new Error("Akses Database Ditolak RLS!");

            setReports(prev => prev.map(r => r.id === report.id ? { ...r, is_sent_discord: true } : r));

            toast.success("RESENT SUCCESSFULLY!", { id: tId });
            setPreviewData(null);
        } catch (err: any) { toast.error(err.message, { id: tId }); }
    };

    const executeDelete = async () => {
        if (deleteModal.type === 'ALL' && confirmInput !== "MANDALIKA") return toast.error("Kode Salah!");
        const tId = toast.loading("Processing...");
        try {
            if (deleteModal.type === 'ALL') {
                const { data: delCheck, error } = await supabase.from('laporan_aktivitas').delete().neq('status', 'PENDING').select();
                if (error) throw error;
                if (!delCheck || delCheck.length === 0) throw new Error("Akses Hapus Database Ditolak RLS!");

                setReports(prev => prev.filter(r => r.status === 'PENDING'));
            } else {
                const { data: delCheck, error } = await supabase.from('laporan_aktivitas').delete().eq('id', deleteModal.id).select();
                if (error) throw error;
                if (!delCheck || delCheck.length === 0) throw new Error("Akses Hapus Spesifik Ditolak RLS!");

                setReports(prev => prev.filter(r => r.id !== deleteModal.id));
            }

            setDeleteModal({ show: false, type: 'ALL' });
            setConfirmInput("");
            toast.success("DATA BERHASIL DIHAPUS!", { id: tId });
        } catch (err: any) { toast.error(err.message, { id: tId }); }
    };

    if (!isAuthorized && loading) return <div className="py-20 text-center animate-pulse font-black uppercase italic">Securing Intel...</div>;
    if (!isAuthorized) return null;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 font-mono pb-20 text-slate-950">
            <Toaster position="top-center" richColors />

            {/* HEADER */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-4 md:p-6 rounded-2xl md:rounded-[35px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6`}>
                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <h2 className="text-xl md:text-3xl font-[1000] italic uppercase tracking-tighter leading-none">Command Center</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setShowConfig(!showConfig)} className={cn("p-2 rounded-xl border-2 border-black transition-all shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none", showConfig ? "bg-blue-500 text-white" : "bg-white text-black")}><Settings size={20} /></button>
                        <button onClick={() => setDeleteModal({ show: true, type: 'ALL' })} className="bg-red-500 text-white p-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none"><Trash2 size={20} /></button>
                    </div>
                </div>

                <div className="flex w-full md:w-auto bg-slate-100 p-1.5 rounded-xl md:rounded-2xl border-2 border-black gap-1 overflow-x-auto custom-scrollbar">
                    {(['PENDING', 'NOT_SENT', 'APPROVED', 'REJECTED'] as StatusFilter[]).map((t) => (
                        <button key={t} onClick={() => setActiveTab(t)} className={cn("px-3 md:px-4 py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase italic whitespace-nowrap", activeTab === t ? "bg-slate-950 text-white shadow-[3px_3px_0px_#A3E635]" : "opacity-40")}>
                            {t.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* MULTI-WEBHOOK CONFIG PANEL */}
            <AnimatePresence>
                {showConfig && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className={`bg-[#FFD100] ${boxBorder} ${hardShadow} rounded-[25px] md:rounded-[35px] p-6 md:p-8 space-y-6 md:space-y-8`}>
                            <div className="flex items-center gap-3 text-slate-950"><Globe size={24} /><h3 className="font-[1000] italic uppercase tracking-tighter text-lg md:text-xl">Multi-Channel Transmit Control</h3></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {/* DITAMBAH PENILANGAN KE DALAM DAFTAR MAPPING */}
                                {['PENANGKAPAN', 'KASUS_BESAR', 'PATROLI', 'BACKUP', 'PENILANGAN'].map((type) => (
                                    <div key={type} className="bg-white/50 p-5 md:p-6 rounded-[20px] md:rounded-[25px] border-2 border-black space-y-4 shadow-[4px_4px_0px_#000]">
                                        <h4 className="font-black italic text-xs uppercase text-slate-900 border-b border-black/10 pb-2">{type.replace('_', ' ')}</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[8px] font-black uppercase opacity-60 ml-1">Webhook URL</label>
                                                <input value={adminConfigs[`webhook_${type.toLowerCase()}` as keyof typeof adminConfigs]} onChange={(e) => setAdminConfigs({ ...adminConfigs, [`webhook_${type.toLowerCase()}`]: e.target.value })} className="w-full bg-white border-2 border-black p-3 rounded-xl font-black text-[9px] shadow-[2px_2px_0px_#000] outline-none" placeholder="https://discord.com/api/webhooks/..." />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black uppercase opacity-60 ml-1">Thread ID</label>
                                                <input value={adminConfigs[`thread_${type.toLowerCase()}` as keyof typeof adminConfigs]} onChange={(e) => setAdminConfigs({ ...adminConfigs, [`thread_${type.toLowerCase()}`]: e.target.value })} className="w-full bg-white border-2 border-black p-3 rounded-xl font-black text-[9px] shadow-[2px_2px_0px_#000] outline-none" placeholder="1234567890..." />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={updateConfigs} className="bg-slate-950 text-white px-8 md:px-10 py-4 rounded-2xl font-[1000] uppercase italic text-xs flex items-center gap-2 shadow-[6px_6px_0px_#00E676] active:translate-y-1 transition-all"><Save size={18} /> Deploy Multi-Configs</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LIST REPORTS & EMPTY STATE */}
            {loading ? (
                <div className="py-20 text-center animate-pulse font-black uppercase italic">Scanning Intelligence Data...</div>
            ) : (
                filteredData.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-10 md:p-20 flex flex-col items-center justify-center text-center mt-8`}>
                        <div className="bg-slate-100 p-5 md:p-6 border-[3.5px] border-slate-900 rounded-3xl mb-4 shadow-[6px_6px_0_0_#000]">
                            <FileText size={56} className="text-slate-400" />
                        </div>
                        <h3 className="text-2xl md:text-4xl font-[1000] italic uppercase tracking-tighter text-slate-900">NIHIL DATA</h3>
                        <p className="text-xs font-black uppercase opacity-50 mt-2 max-w-sm leading-relaxed">
                            Saat ini tidak ada laporan di antrian <span className="text-blue-500 font-[1000]">{activeTab.replace('_', ' ')}</span>. Semua wilayah terpantau aman terkendali.
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {filteredData.map((lap) => (
                            <div key={lap.id} className={`bg-white ${boxBorder} ${hardShadow} rounded-[25px] md:rounded-[35px] overflow-hidden flex flex-col group relative`}>
                                <button onClick={() => setDeleteModal({ show: true, type: 'SINGLE', id: lap.id })} className="absolute top-2 right-2 z-20 bg-white/20 hover:bg-red-500 hover:text-white p-2 rounded-lg border-2 border-black opacity-0 group-hover:opacity-100 transition-all text-slate-950"><X size={14} /></button>

                                <div className="bg-slate-950 text-white p-4 md:p-5 flex justify-between items-start border-b-[3.5px] border-black">
                                    <div className="overflow-hidden mr-2">
                                        <h4 className="font-black uppercase italic leading-none truncate w-32 md:w-40">{lap.users?.name?.includes('|') ? lap.users.name.split('|').pop() : (lap.users?.name || "ANONIM")}</h4>
                                        <p className="text-[9px] font-bold text-[#A3E635] mt-1 uppercase italic truncate">{lap.users?.pangkat} • {lap.jenis_laporan}</p>
                                    </div>
                                    <div className="bg-blue-600 px-2 py-1 rounded-lg font-black text-[9px] italic border border-white/20 shrink-0">+{lap.poin_estimasi} PRP</div>
                                </div>

                                <div className="p-4 md:p-6 flex-1 space-y-4">
                                    <div className="bg-slate-50 border-2 border-black p-3 md:p-4 rounded-xl md:rounded-2xl h-32 md:h-40 overflow-y-auto custom-scrollbar text-[10px] font-bold whitespace-pre-wrap italic text-slate-900">
                                        {lap.isi_laporan}
                                    </div>

                                    {/* --- 📸 QUICK VIEW BUKTI --- */}
                                    {lap.bukti_foto && (
                                        <button
                                            onClick={() => setPreviewData(lap)}
                                            className="w-full flex items-center justify-center gap-2 bg-blue-50 border-2 border-black border-dashed py-2 rounded-xl text-[9px] font-[1000] uppercase italic text-blue-600 hover:bg-blue-100 transition-all active:scale-95"
                                        >
                                            <Camera size={14} /> Lihat Bukti Foto
                                        </button>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                                        {lap.status === 'PENDING' ? (
                                            <>
                                                <button onClick={() => handleAction(lap, 'REJECTED')} className="bg-[#FF4D4D] border-2 border-black py-2.5 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all text-slate-950">Reject</button>
                                                <button onClick={() => handleAction(lap, 'APPROVED')} className="bg-[#A3E635] border-2 border-black py-2.5 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all text-slate-950">Approve</button>
                                            </>
                                        ) : (
                                            <button onClick={() => setPreviewData(lap)} className="col-span-2 bg-blue-500 text-white border-2 border-black py-2.5 md:py-3 rounded-xl font-[1000] text-[10px] uppercase italic shadow-[4px_4px_0px_#000] active:translate-y-1 flex items-center justify-center gap-2">
                                                <Eye size={16} /> Lihat Arsip Laporan
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* --- 🛑 MODAL DOUBLE VERIFICATION (DELETE) 🛑 --- */}
            <AnimatePresence>
                {deleteModal.show && (
                    <div className="fixed inset-0 z-[300] bg-black/90 p-4 flex items-center justify-center">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`bg-white max-w-sm w-full rounded-[30px] p-6 md:p-8 ${boxBorder} shadow-[10px_10px_0px_#FF4D4D] text-slate-950 space-y-6`}>
                            <div className="flex items-center gap-3 text-red-600">
                                <AlertOctagon size={28} className="md:w-8 md:h-8" />
                                <h3 className="font-[1000] text-xl italic uppercase tracking-tighter">Konfirmasi</h3>
                            </div>

                            {deleteModal.type === 'ALL' ? (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Hapus semua arsip yang BUKAN PENDING. Masukkan kode otorisasi keamanan:</p>
                                    <input
                                        value={confirmInput}
                                        onChange={(e) => setConfirmInput(e.target.value)}
                                        placeholder="KODE..."
                                        className="w-full bg-slate-100 border-2 border-black p-3 rounded-xl font-black text-xs outline-none focus:bg-white transition-all shadow-inner"
                                    />
                                </div>
                            ) : (
                                <p className="text-xs font-bold uppercase text-slate-500">Yakin ingin menghapus laporan ini dari database intelijen selamanya?</p>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => { setDeleteModal({ show: false, type: 'ALL' }); setConfirmInput(""); }} className="flex-1 bg-slate-200 border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all">Batal</button>
                                <button onClick={executeDelete} className="flex-1 bg-red-500 text-white border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all">Eksekusi</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODALS PREVIEW */}
            <AnimatePresence>
                {previewData && (
                    <div className="fixed inset-0 z-[400] bg-black/90 p-4 flex items-center justify-center overflow-y-auto">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white max-w-2xl w-full rounded-[30px] md:rounded-[40px] border-[4px] md:border-[6px] border-slate-950 shadow-[10px_10px_0px_#3B82F6] overflow-hidden text-slate-950 my-10 relative">
                            <div className="bg-slate-950 p-4 md:p-6 flex justify-between items-center text-white sticky top-0 z-10">
                                <h3 className="font-[1000] italic uppercase tracking-tighter">Arsip & Preview</h3>
                                <button onClick={() => setPreviewData(null)} className="hover:bg-red-500 hover:text-white p-1 rounded-md transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-5 md:p-8 space-y-6">
                                <div className="bg-[#2C2F33] text-[#DCDDDE] p-5 md:p-6 rounded-[20px] md:rounded-3xl font-mono text-[10px] md:text-xs border-4 border-black whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">{previewData.isi_laporan}</div>

                                {/* Render Gambar di Preview */}
                                {previewData.bukti_foto && (
                                    <div className="relative">
                                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md z-10 border border-black shadow-[2px_2px_0px_#000]">Attached Evidence</div>
                                        <img src={formatImageUrlForDiscord(previewData.bukti_foto) || previewData.bukti_foto} className="w-full h-auto rounded-[20px] md:rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000] md:shadow-[6px_6px_0px_#000]" alt="Bukti Laporan" />
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
                                    <div className="flex-1 bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-black border-dashed">
                                        <p className="text-[9px] font-black uppercase opacity-40 italic">Active Webhook URL:</p>
                                        <p className="text-[8px] font-black truncate text-blue-600">{adminConfigs[`webhook_${(previewData.jenis_laporan || "").replace(' ', '_').toLowerCase()}` as keyof typeof adminConfigs] || 'N/A'}</p>
                                    </div>
                                    <button onClick={() => handleTransmit(previewData)} className="bg-yellow-400 border-[3px] md:border-4 border-black px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl font-[1000] uppercase italic text-xs md:text-sm shadow-[4px_4px_0px_#000] md:shadow-[6px_6px_0px_#000] active:translate-y-1 flex justify-center items-center gap-2 text-slate-950">
                                        <Send size={18} /> Resend (Manual)
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            `}</style>
        </div>
    );
}