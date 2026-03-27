"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, XCircle, Clock, Eye, Send,
    Trash2, ShieldCheck, Image as ImageIcon,
    Filter, ArrowRight, ExternalLink, X, Zap, AlertOctagon,
    Settings, Save, Hash, Search, Loader2, Lock
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
    const [isAuthorized, setIsAuthorized] = useState(false); // SECURITY LOCK
    const [activeTab, setActiveTab] = useState<StatusFilter>('PENDING');
    const [previewData, setPreviewData] = useState<any>(null);
    const [showConfig, setShowConfig] = useState(false);

    // --- STATE CONFIG THREAD ID ---
    const [threadConfigs, setThreadConfigs] = useState({
        thread_penangkapan: "",
        thread_kasus_besar: "",
        thread_patroli: "",
        thread_backup: ""
    });

    // --- DELETE STATE ---
    const [deleteModal, setDeleteModal] = useState<{ show: boolean, type: 'SINGLE' | 'ALL', id?: string }>({ show: false, type: 'ALL' });
    const [confirmInput, setConfirmInput] = useState("");

    const verifyAndFetch = async () => {
        setLoading(true);
        const sessionData = localStorage.getItem('police_session');

        if (!sessionData) {
            router.push('/');
            return;
        }

        const parsed = JSON.parse(sessionData);

        // --- STAGE 1: SECURITY CLEARANCE ---
        const { data: auth, error: authError } = await supabase
            .from('users')
            .select('is_admin, is_highadmin')
            .eq('discord_id', parsed.discord_id)
            .single();

        if (authError || (!auth.is_admin && !auth.is_highadmin)) {
            toast.error("AKSES DITOLAK: Intelijen hanya untuk High Command!");
            router.push('/portal');
            return;
        }

        // --- STAGE 2: FETCH DATA AFTER AUTH ---
        setIsAuthorized(true);

        // Ambil Laporan & Join User
        const { data: lap } = await supabase.from('laporan_aktivitas').select(`*, users(name, pangkat)`).order('created_at', { ascending: false });
        if (lap) setReports(lap);

        // Ambil Config Thread dari Database
        const { data: cfg } = await supabase.from('admin_config').select('*');
        if (cfg && cfg.length > 0) {
            const configObj = cfg.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
            setThreadConfigs(configObj);
        }
        setLoading(false);
    };

    useEffect(() => { verifyAndFetch(); }, []);

    // --- LOGIC FILTER ---
    const filteredData = useMemo(() => {
        if (activeTab === 'NOT_SENT') {
            return reports.filter(r => r.status === 'APPROVED' && r.is_sent_discord !== true);
        }
        return reports.filter(r => r.status === activeTab);
    }, [reports, activeTab]);

    // --- UPDATE GLOBAL THREAD CONFIG ---
    const updateThreadConfig = async () => {
        const tId = toast.loading("Saving Global Thread IDs...");
        try {
            const updates = Object.entries(threadConfigs).map(([key, value]) =>
                supabase.from('admin_config').upsert({ key, value })
            );
            await Promise.all(updates);
            toast.success("THREADS UPDATED!", { id: tId });
            setShowConfig(false);
        } catch (err) { toast.error("Gagal update konfigurasi!"); }
    };

    // --- ACTION: APPROVE/REJECT ---
    const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        const tId = toast.loading(`Updating status...`);
        const { error } = await supabase.from('laporan_aktivitas').update({ status }).eq('id', id);
        if (error) toast.error("Gagal!");
        else { toast.success(`Status: ${status}`, { id: tId }); verifyAndFetch(); }
    };

    // --- ACTION: TRANSMIT TO DISCORD ---
    const handleTransmit = async (report: any) => {
        const tId = toast.loading("Transmitting...");

        const mapping: any = {
            "PENANGKAPAN": "thread_penangkapan",
            "KASUS BESAR": "thread_kasus_besar",
            "PATROLI": "thread_patroli",
            "BACKUP": "thread_backup"
        };

        const targetThread = threadConfigs[mapping[report.jenis_laporan] as keyof typeof threadConfigs] || report.thread_id;

        try {
            const response = await fetch(`${report.webhook_url}?thread_id=${targetThread}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: report.isi_laporan,
                    embeds: report.bukti_foto ? [{ image: { url: report.bukti_foto } }] : []
                })
            });

            if (!response.ok) throw new Error("Discord Webhook Error!");

            await supabase.from('laporan_aktivitas').update({ is_sent_discord: true, thread_id: targetThread }).eq('id', report.id);

            toast.success("SENT TO DISCORD!", { id: tId });
            setPreviewData(null);
            verifyAndFetch();
        } catch (err: any) { toast.error(err.message, { id: tId }); }
    };

    const executeDelete = async () => {
        if (deleteModal.type === 'ALL' && confirmInput !== "MANDALIKA") return toast.error("Kode Salah!");
        const tId = toast.loading("Processing...");
        try {
            if (deleteModal.type === 'ALL') {
                await supabase.from('laporan_aktivitas').delete().neq('status', 'PENDING');
            } else {
                await supabase.from('laporan_aktivitas').delete().eq('id', deleteModal.id);
            }
            verifyAndFetch();
            setDeleteModal({ show: false, type: 'ALL' });
            setConfirmInput("");
            toast.success("BERHASIL DIHAPUS!", { id: tId });
        } catch (err) { toast.error("Gagal!"); }
    };

    // --- PROTECTED RENDER ---
    if (!isAuthorized && loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse text-slate-950">
                <Lock size={48} className="mb-4" />
                <p className="font-black italic uppercase text-xs">Verifying Intel Clearance...</p>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 font-mono pb-20 text-slate-950">
            <Toaster position="top-center" richColors />

            {/* HEADER & GLOBAL CONFIG */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-[35px] flex flex-col md:flex-row justify-between items-center gap-6`}>
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-[1000] italic uppercase tracking-tighter">Command Center</h2>
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

            {/* THREAD CONFIG PANEL */}
            <AnimatePresence>
                {showConfig && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className={`bg-[#FFD100] ${boxBorder} ${hardShadow} rounded-[35px] p-8 space-y-6`}>
                            <div className="flex items-center gap-3 text-slate-950"><Hash size={24} /><h3 className="font-[1000] italic uppercase tracking-tighter">Monthly Thread Control</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.entries(threadConfigs).map(([key, value]) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-[9px] font-black uppercase opacity-60 ml-2 text-slate-900">{key.replace('thread_', '').replace('_', ' ')}</label>
                                        <input value={value} onChange={(e) => setThreadConfigs({ ...threadConfigs, [key]: e.target.value })} className="w-full bg-white border-2 border-black p-3 rounded-xl font-black text-[10px] shadow-[3px_3px_0px_#000] outline-none text-slate-950" />
                                    </div>
                                ))}
                            </div>
                            <button onClick={updateThreadConfig} className="bg-slate-950 text-white px-8 py-3 rounded-xl font-black uppercase italic text-xs flex items-center gap-2 shadow-[4px_4px_0px_#00E676] active:translate-y-1 transition-all"><Save size={16} /> Save Changes</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN LIST */}
            {loading ? (
                <div className="py-20 text-center animate-pulse font-black uppercase italic">Scanning Intelligence Data...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredData.map((lap) => (
                        <div key={lap.id} className={`bg-white ${boxBorder} ${hardShadow} rounded-[35px] overflow-hidden flex flex-col group relative`}>
                            <button onClick={() => setDeleteModal({ show: true, type: 'SINGLE', id: lap.id })} className="absolute top-2 right-2 z-20 bg-white/20 hover:bg-red-500 hover:text-white p-2 rounded-lg border-2 border-black opacity-0 group-hover:opacity-100 transition-all text-slate-950"><X size={14} /></button>

                            <div className="bg-slate-950 text-white p-5 flex justify-between items-start border-b-[3.5px] border-black">
                                <div>
                                    <h4 className="font-black uppercase italic leading-none truncate w-32">{lap.users?.name?.split('|').pop()}</h4>
                                    <p className="text-[9px] font-bold text-[#A3E635] mt-1 uppercase italic">{lap.users?.pangkat} • {lap.jenis_laporan}</p>
                                </div>
                                <div className="bg-blue-600 px-2 py-1 rounded-lg font-black text-[9px] italic border border-white/20">+{lap.poin_estimasi} PRP</div>
                            </div>

                            <div className="p-6 flex-1 space-y-4">
                                <div className="bg-slate-50 border-2 border-black p-4 rounded-2xl h-40 overflow-y-auto scrollbar-hide text-[10px] font-bold whitespace-pre-wrap italic text-slate-900">
                                    {lap.isi_laporan}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {lap.status === 'PENDING' ? (
                                        <>
                                            <button onClick={() => handleAction(lap.id, 'REJECTED')} className="bg-[#FF4D4D] border-2 border-black py-2.5 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all text-slate-950">Reject</button>
                                            <button onClick={() => handleAction(lap.id, 'APPROVED')} className="bg-[#A3E635] border-2 border-black py-2.5 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all text-slate-950">Approve</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setPreviewData(lap)} className="col-span-2 bg-blue-500 text-white border-2 border-black py-3 rounded-xl font-[1000] text-[10px] uppercase italic shadow-[4px_4px_0px_#000] active:translate-y-1 flex items-center justify-center gap-2">
                                            <Eye size={16} /> Preview & Transmit
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL DELETE */}
            <AnimatePresence>
                {deleteModal.show && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`w-full max-w-sm bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-6 space-y-4 text-slate-950`}>
                            <div className="flex items-center gap-3 text-red-600"><AlertOctagon size={32} /><h3 className="font-black uppercase italic tracking-tighter text-xl">Confirm Delete</h3></div>
                            <p className="text-xs font-black uppercase italic opacity-60">{deleteModal.type === 'ALL' ? "Bersihkan database laporan?" : "Hapus laporan ini permanen?"}</p>
                            {deleteModal.type === 'ALL' && (
                                <input type="text" placeholder="Ketik 'MANDALIKA'" value={confirmInput} onChange={e => setConfirmInput(e.target.value.toUpperCase())} className="w-full bg-slate-100 border-2 border-black p-3 rounded-xl font-black text-center outline-none text-slate-950" />
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { setDeleteModal({ show: false, type: 'ALL' }); setConfirmInput(""); }} className="bg-slate-200 border-2 border-black py-2 rounded-xl font-black uppercase text-[10px]">Batal</button>
                                <button onClick={executeDelete} className="bg-red-500 text-white border-2 border-black py-2 rounded-xl font-black uppercase text-[10px] shadow-[3px_3px_0px_#000]">Ya, Hapus</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL PREVIEW */}
            <AnimatePresence>
                {previewData && (
                    <div className="fixed inset-0 z-[200] bg-black/90 p-4 flex items-center justify-center overflow-y-auto">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white max-w-2xl w-full rounded-[40px] border-[6px] border-slate-950 shadow-[10px_10px_0px_#3B82F6] overflow-hidden text-slate-950">
                            <div className="bg-slate-950 p-6 flex justify-between items-center text-white"><h3 className="font-[1000] italic uppercase tracking-tighter">Discord Preview</h3><button onClick={() => setPreviewData(null)}><X size={24} /></button></div>
                            <div className="p-8 space-y-6">
                                <div className="bg-[#2C2F33] text-[#DCDDDE] p-6 rounded-3xl font-mono text-xs border-4 border-black whitespace-pre-wrap">{previewData.isi_laporan}</div>
                                {previewData.bukti_foto && <img src={previewData.bukti_foto} className="w-full h-auto rounded-2xl border-4 border-black shadow-[6px_6px_0px_#000]" />}
                                <div className="flex flex-col md:flex-row gap-4 pt-4">
                                    <div className="flex-1 bg-slate-50 p-4 rounded-2xl border-2 border-black border-dashed">
                                        <p className="text-[9px] font-black uppercase opacity-40 italic">Active Thread ID:</p>
                                        <p className="text-xs font-black truncate">{threadConfigs[previewData.jenis_laporan === 'KASUS BESAR' ? 'thread_kasus_besar' : `thread_${previewData.jenis_laporan.toLowerCase().replace(' ', '_')}` as keyof typeof threadConfigs] || 'N/A'}</p>
                                    </div>
                                    <button onClick={() => handleTransmit(previewData)} className="bg-[#00E676] border-4 border-black px-10 py-5 rounded-2xl font-[1000] uppercase italic text-sm shadow-[6px_6px_0px_#000] active:translate-y-1 flex items-center gap-2 text-slate-950"><Send size={18} /> Transmit</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}