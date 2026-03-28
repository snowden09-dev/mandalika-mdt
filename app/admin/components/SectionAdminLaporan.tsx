"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, XCircle, Clock, Eye, Send,
    Trash2, ShieldCheck, Image as ImageIcon,
    Filter, ArrowRight, ExternalLink, X, Zap, AlertOctagon,
    Settings, Save, Hash, Search, Loader2, Lock, Globe
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

    // --- STATE CONFIG (MULTI-WEBHOOK & MULTI-THREAD) ---
    const [adminConfigs, setAdminConfigs] = useState({
        webhook_penangkapan: "", webhook_kasus_besar: "", webhook_patroli: "", webhook_backup: "",
        thread_penangkapan: "", thread_kasus_besar: "", thread_patroli: "", thread_backup: ""
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

    // --- HELPER: FORMATTER URL GAMBAR DISCORD ---
    const formatImageUrlForDiscord = (url: string) => {
        if (!url) return null;
        let finalUrl = url.trim();
        if (finalUrl.includes('imgur.com') && !finalUrl.match(/\.(jpeg|jpg|gif|png)$/)) {
            finalUrl = finalUrl.replace('imgur.com', 'i.imgur.com') + '.jpg';
        }
        return finalUrl;
    };

    // --- 🛠️ LOGIKA BARU: APPROVAL OTOMATIS KIRIM KE DISCORD & CAIRKAN POIN ---
    const handleAction = async (report: any, status: 'APPROVED' | 'REJECTED') => {
        const tId = toast.loading(`Processing ${status}...`);
        try {
            if (status === 'APPROVED') {
                // 1. TAMBAH POIN PRP KE ANGGOTA
                if (report.user_id_discord) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('point_prp')
                        .eq('discord_id', report.user_id_discord)
                        .single();

                    const currentPoin = Number(userData?.point_prp) || 0;
                    const poinTambahan = Number(report.poin_estimasi) || 0;

                    await supabase
                        .from('users')
                        .update({ point_prp: currentPoin + poinTambahan })
                        .eq('discord_id', report.user_id_discord);
                }

                // 2. AMBIL CONFIG DISCORD (WEBHOOK & THREAD)
                const typeKey = (report.jenis_laporan || "").replace(' ', '_').toLowerCase();
                const targetWebhook = adminConfigs[`webhook_${typeKey}` as keyof typeof adminConfigs];
                const targetThread = adminConfigs[`thread_${typeKey}` as keyof typeof adminConfigs];

                if (!targetWebhook) {
                    throw new Error(`Webhook untuk ${report.jenis_laporan} belum diatur di Panel Config!`);
                }

                // 3. OTOMATIS TRANSMIT KE DISCORD
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

                if (!response.ok) throw new Error("Discord API Error! Gagal Mengirim.");

                // 4. UPDATE DB: HANYA STATUS & IS_SENT (thread_id dihapus agar tidak error)
                const { error } = await supabase.from('laporan_aktivitas')
                    .update({
                        status: 'APPROVED',
                        is_sent_discord: true
                    })
                    .eq('id', report.id);

                if (error) throw error;
                toast.success(`Berhasil! Poin cair & terkirim ke Discord.`, { id: tId });

            } else {
                // JIKA DIREJECT
                const { error } = await supabase.from('laporan_aktivitas').update({ status }).eq('id', report.id);
                if (error) throw error;
                toast.success(`Laporan DITOLAK!`, { id: tId });
            }

            // REFRESH DATA
            verifyAndFetch();
        } catch (err: any) {
            console.error("Detail Error:", err);
            toast.error(`Gagal: ${err.message}`, { id: tId });
        }
    };

    // --- MANUAL TRANSMIT (Digunakan saat Preview Arsip) ---
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

            if (!response.ok) throw new Error("Discord Webhook Error!");

            await supabase.from('laporan_aktivitas').update({ is_sent_discord: true, thread_id: targetThread }).eq('id', report.id);
            toast.success("RESENT SUCCESSFULLY!", { id: tId });
            setPreviewData(null);
            verifyAndFetch();
        } catch (err: any) { toast.error(err.message, { id: tId }); }
    };

    const executeDelete = async () => {
        if (deleteModal.type === 'ALL' && confirmInput !== "MANDALIKA") return toast.error("Kode Salah!");
        const tId = toast.loading("Processing...");
        try {
            if (deleteModal.type === 'ALL') await supabase.from('laporan_aktivitas').delete().neq('status', 'PENDING');
            else await supabase.from('laporan_aktivitas').delete().eq('id', deleteModal.id);
            verifyAndFetch();
            setDeleteModal({ show: false, type: 'ALL' });
            setConfirmInput("");
            toast.success("DELETED!", { id: tId });
        } catch (err) { toast.error("Gagal!"); }
    };

    if (!isAuthorized && loading) return <div className="py-20 text-center animate-pulse font-black uppercase italic">Securing Intel...</div>;
    if (!isAuthorized) return null;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 font-mono pb-20 text-slate-950">
            <Toaster position="top-center" richColors />

            {/* HEADER */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-[35px] flex flex-col md:flex-row justify-between items-center gap-6`}>
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-[1000] italic uppercase tracking-tighter leading-none">Command Center</h2>
                    <button onClick={() => setShowConfig(!showConfig)} className={cn("p-2 rounded-xl border-2 border-black transition-all shadow-[3px_3px_0px_#000]", showConfig ? "bg-blue-500 text-white" : "bg-white text-black")}><Settings size={20} /></button>
                    <button onClick={() => setDeleteModal({ show: true, type: 'ALL' })} className="bg-red-500 text-white p-2 rounded-xl border-2 border-black hover:scale-110 transition-all shadow-[3px_3px_0px_#000]"><Trash2 size={20} /></button>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl border-2 border-black gap-1 overflow-x-auto">
                    {(['PENDING', 'NOT_SENT', 'APPROVED', 'REJECTED'] as StatusFilter[]).map((t) => (
                        <button key={t} onClick={() => setActiveTab(t)} className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase italic whitespace-nowrap", activeTab === t ? "bg-slate-950 text-white shadow-[3px_3px_0px_#A3E635]" : "opacity-40")}>
                            {t.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* MULTI-WEBHOOK CONFIG PANEL */}
            <AnimatePresence>
                {showConfig && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className={`bg-[#FFD100] ${boxBorder} ${hardShadow} rounded-[35px] p-8 space-y-8`}>
                            <div className="flex items-center gap-3 text-slate-950"><Globe size={24} /><h3 className="font-[1000] italic uppercase tracking-tighter">Multi-Channel Transmit Control</h3></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {['PENANGKAPAN', 'KASUS_BESAR', 'PATROLI', 'BACKUP'].map((type) => (
                                    <div key={type} className="bg-white/50 p-6 rounded-[25px] border-2 border-black space-y-4 shadow-[4px_4px_0px_#000]">
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
                            <button onClick={updateConfigs} className="bg-slate-950 text-white px-10 py-4 rounded-2xl font-[1000] uppercase italic text-xs flex items-center gap-2 shadow-[6px_6px_0px_#00E676] active:translate-y-1 transition-all"><Save size={18} /> Deploy Multi-Configs</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LIST REPORTS */}
            {loading ? (
                <div className="py-20 text-center animate-pulse font-black uppercase italic">Scanning Intelligence Data...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredData.map((lap) => (
                        <div key={lap.id} className={`bg-white ${boxBorder} ${hardShadow} rounded-[35px] overflow-hidden flex flex-col group relative`}>
                            <button onClick={() => setDeleteModal({ show: true, type: 'SINGLE', id: lap.id })} className="absolute top-2 right-2 z-20 bg-white/20 hover:bg-red-500 hover:text-white p-2 rounded-lg border-2 border-black opacity-0 group-hover:opacity-100 transition-all text-slate-950"><X size={14} /></button>

                            <div className="bg-slate-950 text-white p-5 flex justify-between items-start border-b-[3.5px] border-black">
                                <div>
                                    <h4 className="font-black uppercase italic leading-none truncate w-32">{lap.users?.name?.includes('|') ? lap.users.name.split('|').pop() : (lap.users?.name || "ANONIM")}</h4>
                                    <p className="text-[9px] font-bold text-[#A3E635] mt-1 uppercase italic">{lap.users?.pangkat} • {lap.jenis_laporan}</p>
                                </div>
                                <div className="bg-blue-600 px-2 py-1 rounded-lg font-black text-[9px] italic border border-white/20">+{lap.poin_estimasi} PRP</div>
                            </div>

                            <div className="p-6 flex-1 space-y-4">
                                <div className="bg-slate-50 border-2 border-black p-4 rounded-2xl h-40 overflow-y-auto scrollbar-hide text-[10px] font-bold whitespace-pre-wrap italic text-slate-900">
                                    {lap.isi_laporan}
                                </div>

                                {/* Indikator Bukti Foto */}
                                {lap.bukti_foto && (
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-blue-600">
                                        <ImageIcon size={12} /> BUKTI FOTO TERLAMPIR
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    {lap.status === 'PENDING' ? (
                                        <>
                                            {/* PASS ENTIRE REPORT OBJECT (lap) to handleAction */}
                                            <button onClick={() => handleAction(lap, 'REJECTED')} className="bg-[#FF4D4D] border-2 border-black py-2.5 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all text-slate-950">Reject</button>
                                            <button onClick={() => handleAction(lap, 'APPROVED')} className="bg-[#A3E635] border-2 border-black py-2.5 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all text-slate-950">Approve</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setPreviewData(lap)} className="col-span-2 bg-blue-500 text-white border-2 border-black py-3 rounded-xl font-[1000] text-[10px] uppercase italic shadow-[4px_4px_0px_#000] active:translate-y-1 flex items-center justify-center gap-2">
                                            <Eye size={16} /> Lihat Arsip Laporan
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODALS PREVIEW */}
            <AnimatePresence>
                {previewData && (
                    <div className="fixed inset-0 z-[200] bg-black/90 p-4 flex items-center justify-center overflow-y-auto">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white max-w-2xl w-full rounded-[40px] border-[6px] border-slate-950 shadow-[10px_10px_0px_#3B82F6] overflow-hidden text-slate-950">
                            <div className="bg-slate-950 p-6 flex justify-between items-center text-white"><h3 className="font-[1000] italic uppercase tracking-tighter">Arsip & Preview</h3><button onClick={() => setPreviewData(null)}><X size={24} /></button></div>
                            <div className="p-8 space-y-6">
                                <div className="bg-[#2C2F33] text-[#DCDDDE] p-6 rounded-3xl font-mono text-xs border-4 border-black whitespace-pre-wrap">{previewData.isi_laporan}</div>

                                {/* Render Gambar di Preview */}
                                {previewData.bukti_foto && (
                                    <div className="relative">
                                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md z-10 border border-black shadow-[2px_2px_0px_#000]">Attached Evidence</div>
                                        <img src={formatImageUrlForDiscord(previewData.bukti_foto) || previewData.bukti_foto} className="w-full h-auto rounded-2xl border-4 border-black shadow-[6px_6px_0px_#000]" alt="Bukti Laporan" />
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row gap-4 pt-4">
                                    <div className="flex-1 bg-slate-50 p-4 rounded-2xl border-2 border-black border-dashed">
                                        <p className="text-[9px] font-black uppercase opacity-40 italic">Active Webhook URL:</p>
                                        <p className="text-[8px] font-black truncate text-blue-600">{adminConfigs[`webhook_${(previewData.jenis_laporan || "").replace(' ', '_').toLowerCase()}` as keyof typeof adminConfigs] || 'N/A'}</p>
                                    </div>
                                    <button onClick={() => handleTransmit(previewData)} className="bg-yellow-400 border-4 border-black px-10 py-5 rounded-2xl font-[1000] uppercase italic text-sm shadow-[6px_6px_0px_#000] active:translate-y-1 flex items-center gap-2 text-slate-950"><Send size={18} /> Resend (Manual)</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}