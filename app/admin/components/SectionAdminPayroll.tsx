"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import QRCode from "react-qr-code";
import {
    Banknote, CheckCircle2, XCircle, Clock, Send, Trash2,
    Eye, X, AlertOctagon, Zap, ShieldCheck, DollarSign,
    Calendar, User, Shield, FileText, Check, Fingerprint, MapPin, QrCode, TrendingUp, Loader2
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { id } from "date-fns/locale";
import { toast, Toaster } from 'sonner';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

export default function SectionAdminPayroll() {
    const slipRef = useRef<HTMLDivElement>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [allPersonnel, setAllPersonnel] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'PAID' | 'REJECTED' | 'NOT_SENT'>('PENDING');
    const [adminSession, setAdminSession] = useState<any>(null);

    // --- PREVIEW STATES ---
    const [currentSlipData, setCurrentSlipData] = useState<any>(null);
    const [capturedImg, setCapturedImg] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isTransmitting, setIsTransmitting] = useState(false);

    // DELETE MODAL STATE
    const [deleteModal, setDeleteModal] = useState<{ show: boolean, type: 'SINGLE' | 'ALL', id?: string }>({ show: false, type: 'ALL' });
    const [confirmInput, setConfirmInput] = useState("");

    const fetchData = async () => {
        setLoading(true);
        const { data: reqData } = await supabase.from('pengajuan_gaji').select('*').order('created_at', { ascending: false });
        if (reqData) setRequests(reqData);

        const { data: userData } = await supabase.from('users').select('pangkat');
        if (userData) setAllPersonnel(userData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const sessionData = localStorage.getItem('police_session');
        if (sessionData) {
            const parsed = JSON.parse(sessionData);
            supabase.from('users').select('name, pangkat, divisi').eq('discord_id', parsed.discord_id).single()
                .then(({ data }) => { if (data) setAdminSession(data); });
        }
    }, []);

    // --- BENTO STATS LOGIC ---
    const financialStats = useMemo(() => {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });

        const weeklyPaid = requests.filter(r => r.status === 'PAID' && isWithinInterval(new Date(r.created_at), { start, end }))
            .reduce((sum, r) => sum + Number(r.jumlah_gaji), 0);

        const totalPending = requests.filter(r => r.status === 'PENDING')
            .reduce((sum, r) => sum + Number(r.jumlah_gaji), 0);

        const getGaji = (pangkat: string) => {
            const p = pangkat?.toUpperCase() || "";
            if (p.includes("JENDRAL")) return 65000;
            if (p.includes("KOMJEN")) return 64000;
            if (p.includes("IRJEN")) return 62000;
            if (p.includes("BRIGJEN")) return 57000;
            if (p.includes("KOMBES")) return 56000;
            if (p.includes("AKBP")) return 50000;
            if (p.includes("KOMPOL")) return 47000;
            if (p.includes("AKP")) return 45000;
            if (p.includes("IPTU")) return 37000;
            if (p.includes("IPDA")) return 36000;
            if (p.includes("AIPTU")) return 35000;
            if (p.includes("AIPDA")) return 34000;
            if (p.includes("BRIPKA")) return 28000;
            if (p.includes("BRIGPOL")) return 27000;
            if (p.includes("BRIPTU")) return 26000;
            if (p.includes("BRIPDA")) return 24000;
            if (p.includes("BHARADA")) return 22000;
            return 15000;
        };

        const forecast = allPersonnel.reduce((sum, p) => sum + getGaji(p.pangkat), 0);
        return { weeklyPaid, totalPending, forecast };
    }, [requests, allPersonnel]);

    const filteredData = useMemo(() => {
        if (activeTab === 'NOT_SENT') return requests.filter(r => r.status === 'PAID' && !r.bukti_transfer);
        return requests.filter(r => r.status === activeTab);
    }, [requests, activeTab]);

    const handleOpenAndCapture = async (req: any) => {
        setCurrentSlipData(req);
        setIsGenerating(true);
        setCapturedImg(null);

        const tId = toast.loading("Generating Official Document Image...");

        setTimeout(async () => {
            if (!slipRef.current) {
                toast.error("Gagal inisialisasi engine potret.", { id: tId });
                setIsGenerating(false);
                return;
            }

            try {
                const dataUrl = await toPng(slipRef.current, {
                    cacheBust: true,
                    pixelRatio: 3,
                    backgroundColor: '#ffffff'
                });

                setCapturedImg(dataUrl);
                toast.success("Slip Image Generated!", { id: tId });
            } catch (err) {
                toast.error("Gagal mengambil foto slip.", { id: tId });
                setCurrentSlipData(null);
            } finally {
                setIsGenerating(false);
            }
        }, 400);
    };

    const handleTransmit = async () => {
        if (!capturedImg || !currentSlipData) return;

        setIsTransmitting(true);
        const tId = toast.loading("Sending Payslip to Discord HQ...");

        const WEBHOOK_URL = "https://discord.com/api/webhooks/1486137739022700634/m9jKqS2O9DV8L8DcaHgIVGSI1yriyKwYAECgul6Te3W2S-t5isC9r_5x13Zcu-VaT20O";
        const THREAD_ID = "1467455553214353440";

        try {
            const blob = await (await fetch(capturedImg)).blob();
            const file = new File([blob], `Payslip_${currentSlipData.nama_panggilan}.png`, { type: 'image/png' });

            const formData = new FormData();
            formData.append("file", file);
            formData.append("payload_json", JSON.stringify({
                content: `<@${currentSlipData.user_id_discord || ''}> **PENGIRIMAN PAYSLIP BERHASIL**`,
                embeds: [{
                    title: "🏛️ MANDALIKA POLICE - OFFICIAL PAYSLIP",
                    description: `Payslip resmi Jendral telah diterbitkan dan divalidasi oleh **${adminSession?.name || 'High Command'}**.`,
                    color: 0,
                    footer: { text: "Mandalika Automated Payroll System" },
                    timestamp: new Date().toISOString()
                }]
            }));

            const res = await fetch(`${WEBHOOK_URL}?thread_id=${THREAD_ID}`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                await supabase.from('pengajuan_gaji').update({ bukti_transfer: 'SENT_AS_IMAGE_QR' }).eq('id', currentSlipData.id);
                toast.success("PAYSLIP IMAGE SENT TO DISCORD!", { id: tId });
                setCapturedImg(null);
                setCurrentSlipData(null);
                fetchData();
            } else { throw new Error("Discord Webhook Error"); }

        } catch (err: any) {
            toast.error(err.message, { id: tId });
        } finally {
            setIsTransmitting(false);
        }
    };

    const handleAction = async (id: string, status: string) => {
        const tId = toast.loading(`Updating status...`);
        const { error } = await supabase.from('pengajuan_gaji').update({
            status,
            keterangan_admin: `AUTH BY ${adminSession?.name || 'ADMIN'}`
        }).eq('id', id);

        if (error) toast.error("Error!");
        else { toast.success("Success!", { id: tId }); fetchData(); }
    };

    const executeDelete = async () => {
        if (deleteModal.type === 'ALL' && confirmInput !== "BERSIHKAN") return toast.error("Kode Salah!");
        const tId = toast.loading("Processing Purge...");
        try {
            if (deleteModal.type === 'ALL') { await supabase.from('pengajuan_gaji').delete().neq('status', 'PENDING'); }
            else { await supabase.from('pengajuan_gaji').delete().eq('id', deleteModal.id); }
            toast.success("DATA PURGED!", { id: tId }); fetchData();
            setDeleteModal({ show: false, type: 'ALL' });
            setConfirmInput("");
        } catch (e) { toast.error("Gagal hapus data!"); }
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 font-mono pb-20 text-slate-950">
            <Toaster position="top-center" />

            {/* BENTO STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className={`bg-[#00E676] p-6 ${boxBorder} ${hardShadow} rounded-3xl`}><p className="text-[10px] font-black uppercase opacity-60">Weekly Paid</p><h3 className="text-4xl font-[1000] italic mt-1 leading-none">${financialStats.weeklyPaid.toLocaleString()}</h3></div>
                <div className={`bg-[#FFD100] p-6 ${boxBorder} ${hardShadow} rounded-3xl`}><p className="text-[10px] font-black uppercase opacity-60">Pending</p><h3 className="text-4xl font-[1000] italic mt-1 leading-none">${financialStats.totalPending.toLocaleString()}</h3></div>
                <div className={`bg-[#3B82F6] p-6 ${boxBorder} ${hardShadow} rounded-3xl text-white`}><p className="text-[10px] font-black uppercase opacity-60">Forecast</p><h3 className="text-4xl font-[1000] italic mt-1 leading-none">${financialStats.forecast.toLocaleString()}</h3></div>
            </div>

            {/* HEADER & TABS + TRASH ALL */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative z-10`}>
                <div className="flex items-center gap-4">
                    <h2 className="font-[1000] text-2xl italic uppercase tracking-tighter text-slate-950">Payroll Command</h2>
                    {activeTab !== 'PENDING' && (
                        <button onClick={() => setDeleteModal({ show: true, type: 'ALL' })} className="bg-red-500 text-white p-2 rounded-xl border-2 border-black hover:scale-110 transition-all shadow-[2px_2px_0px_#000] active:translate-y-1 active:shadow-none"><Trash2 size={20} /></button>
                    )}
                </div>
                <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl border-2 border-black gap-1 overflow-x-auto">
                    {['PENDING', 'NOT_SENT', 'PAID', 'REJECTED'].map((t) => (
                        <button key={t} onClick={() => setActiveTab(t as any)} className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase italic whitespace-nowrap", activeTab === t ? "bg-[#00E676] border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40")}>{t.replace('_', ' ')}</button>
                    ))}
                </div>
            </div>

            {/* GRID DATA */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredData.map((req) => (
                        <div key={req.id} className={`bg-white ${boxBorder} ${hardShadow} rounded-[25px] overflow-hidden flex flex-col group relative`}>
                            <button onClick={() => setDeleteModal({ show: true, type: 'SINGLE', id: req.id })} className="absolute top-2 right-2 z-20 bg-white/10 hover:bg-red-500 hover:text-white p-1.5 rounded-lg border-2 border-black opacity-0 group-hover:opacity-100 transition-all text-slate-950"><X size={14} /></button>
                            <div className="bg-slate-950 text-white p-5 flex justify-between items-center border-b-4 border-black">
                                <div><h4 className="font-black uppercase italic leading-none truncate w-32">{req.nama_panggilan}</h4><p className="text-[9px] font-bold text-blue-400 mt-1 uppercase italic">{req.pangkat}</p></div>
                                <div className="text-[#00E676] font-black text-xl italic leading-none tracking-tighter">${Number(req.jumlah_gaji).toLocaleString()}</div>
                            </div>
                            <div className="p-6 flex-1 space-y-4">
                                <div className="bg-slate-50 border-2 border-black p-3 rounded-xl text-center font-black text-[10px] italic text-slate-900 uppercase">
                                    {format(new Date(req.tanggal_mulai), 'dd MMM')} — {format(new Date(req.tanggal_selesai), 'dd MMM yyyy')}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {activeTab === 'PENDING' ? (
                                        <>
                                            <button onClick={() => handleAction(req.id, 'REJECTED')} className="bg-[#FF4D4D] border-2 border-black py-2 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 text-slate-950">Deny</button>
                                            <button onClick={() => handleAction(req.id, 'PAID')} className="bg-[#00E676] border-2 border-black py-2 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 text-slate-950">Approve</button>
                                        </>
                                    ) : activeTab === 'NOT_SENT' ? (
                                        <button disabled={isGenerating} onClick={() => handleOpenAndCapture(req)} className="col-span-2 bg-blue-500 text-white border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase flex justify-center items-center gap-2 shadow-[4px_4px_0px_#000] active:translate-y-1 disabled:opacity-50">
                                            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Eye size={16} />} Open Slip
                                        </button>
                                    ) : <div className="col-span-2 text-center text-[10px] font-black opacity-20 uppercase italic text-slate-950">Recorded</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL PREVIEW IMAGE */}
            <AnimatePresence>
                {currentSlipData && (
                    <div className="fixed inset-0 z-[200] bg-black/95 p-4 flex items-center justify-center overflow-y-auto backdrop-blur-md text-slate-950">
                        <div className="max-w-2xl w-full flex flex-col items-center gap-6 my-10 relative">
                            <div className="bg-white p-3 border-[6px] border-slate-950 rounded-[35px] shadow-[15px_15px_0px_#3B82F6] relative">
                                {capturedImg ? <img src={capturedImg} alt="Official Slip" className="w-full h-auto rounded-[25px] border-4 border-slate-950" /> : <div className="w-[500px] h-[600px] flex flex-col items-center justify-center gap-4 bg-slate-100 rounded-[25px]"><Loader2 className="animate-spin text-blue-600" size={40} /><p className="font-black italic uppercase text-xs text-black">Generating Image...</p></div>}
                            </div>
                            <div className="flex flex-col gap-3 w-full max-w-sm">
                                <button disabled={!capturedImg || isTransmitting} onClick={handleTransmit} className="w-full bg-[#00E676] text-black py-5 rounded-2xl font-[1000] uppercase italic text-sm shadow-[6px_6px_0px_#000] border-[3.5px] border-black flex items-center justify-center gap-4 active:translate-y-1 transition-all disabled:opacity-50">
                                    <Send size={20} strokeWidth={3} /> {isTransmitting ? "SENDING..." : "CONFIRM & TRANSMIT"}
                                </button>
                                <button onClick={() => { setCurrentSlipData(null); setCapturedImg(null); }} className="text-white text-[10px] font-black uppercase italic opacity-50 hover:opacity-100 transition-opacity">Discard</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- ELEMEN TERSEMBUNYI UNTUK DIFOTO (slipRef) --- */}
            {currentSlipData && (
                <div style={{ position: 'absolute', top: '-4000px', left: '-4000px', zIndex: -100 }}>
                    <div ref={slipRef} className="bg-white w-[600px] border-[10px] border-black p-12 space-y-10 text-slate-950 font-mono">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-[8px] border-black pb-8">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-blue-600 mb-2 font-black italic text-sm tracking-[0.3em]"><Shield size={24} /> MPD HQ</div>
                                <h2 className="text-5xl font-[1000] italic tracking-tighter leading-none text-slate-950">OFFICIAL PAYSLIP</h2>
                                <p className="text-xs font-black uppercase opacity-40 italic text-slate-900"><MapPin size={12} className="inline mr-1" /> HQ Mandalika • Central District</p>
                            </div>
                            <div className="bg-black text-white px-5 py-3 rounded-xl font-black italic text-xs">#MPD-{currentSlipData.id.substring(0, 6).toUpperCase()}</div>
                        </div>

                        {/* DETAIL LENGKAP JANGAN DIKURANGIN */}
                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Nama Lengkap</p><p className="font-black text-xl uppercase italic border-b-4 border-black/5">{currentSlipData.nama_panggilan}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Pangkat / Divisi</p><p className="font-black text-xl uppercase italic text-blue-600 border-b-4 border-black/5">{currentSlipData.pangkat} / {currentSlipData.divisi || 'UNIT'}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Periode Gaji</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(new Date(currentSlipData.tanggal_mulai), 'dd MMM')} - {format(new Date(currentSlipData.tanggal_selesai), 'dd MMM yyyy')}</p></div>
                            </div>
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Tanggal Pengajuan</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(parseISO(currentSlipData.created_at), 'dd MMMM yyyy', { locale: id })}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Tanggal Pencairan</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(new Date(), 'dd MMMM yyyy', { locale: id })}</p></div>
                                <div className="bg-slate-50 border-4 border-dashed border-black p-4 rounded-xl text-center">
                                    <p className="text-[9px] font-black uppercase opacity-30 leading-none mb-1 text-slate-900">Approved By</p>
                                    <p className="text-[11px] font-black uppercase leading-none">{adminSession?.name || 'HIGH COMMAND'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payout & QR */}
                        <div className="bg-slate-950 p-8 rounded-[35px] flex justify-between items-center shadow-[10px_10px_0px_#00E676]">
                            <div><p className="text-xs font-black uppercase text-white/40 italic tracking-[0.4em] mb-1">Total Net Payout</p><h3 className="text-6xl font-[1000] text-[#00E676] italic tracking-tighter leading-none">${Number(currentSlipData.jumlah_gaji).toLocaleString()}</h3></div>
                            <div className="bg-white p-2 border-4 border-black">
                                <QRCode size={85} value={`AUTH:${currentSlipData.id}`} viewBox={`0 0 256 256`} />
                            </div>
                        </div>

                        <div className="flex justify-center opacity-10 pt-4">
                            <p className="text-[9px] font-black uppercase tracking-[1em]">Mandalika Police Department • Official Audit</p>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            <AnimatePresence>
                {deleteModal.show && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 text-slate-950">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-8 max-w-sm w-full space-y-6`}>
                            <h3 className="font-black italic uppercase text-xl text-red-600 flex items-center gap-2"><AlertOctagon /> Confirm Purge</h3>
                            <p className="text-xs font-black uppercase italic opacity-50">{deleteModal.type === 'ALL' ? "Hapus seluruh arsip payroll?" : "Hapus laporan ini?"}</p>
                            {deleteModal.type === 'ALL' && <input type="text" placeholder="Ketik 'BERSIHKAN'" value={confirmInput} onChange={e => setConfirmInput(e.target.value.toUpperCase())} className="w-full bg-slate-100 border-2 border-black p-3 rounded-xl font-black text-center outline-none" />}
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => { setDeleteModal({ show: false, type: 'ALL' }); setConfirmInput(""); }} className="bg-slate-200 border-2 border-black py-3 rounded-xl font-black uppercase text-[10px] active:translate-y-1 transition-all">Batal</button>
                                <button onClick={executeDelete} className="bg-red-500 text-white border-2 border-black py-3 rounded-xl font-black uppercase text-[10px] shadow-[4px_4px_0px_#000] active:translate-y-1 transition-all">Konfirmasi</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}