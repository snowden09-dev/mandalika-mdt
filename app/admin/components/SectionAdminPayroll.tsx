"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import QRCode from "react-qr-code";
import {
    Trash2, Eye, X, AlertOctagon, Shield, MapPin, Database, Loader2, Send, FileSpreadsheet, Target, UserX, PlusCircle
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, startOfDay, eachDayOfInterval } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast, Toaster } from 'sonner';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

export default function SectionAdminPayroll() {
    const slipRef = useRef<HTMLDivElement>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [allPersonnel, setAllPersonnel] = useState<any[]>([]);
    const [duties, setDuties] = useState<any[]>([]);
    const [cutis, setCutis] = useState<any[]>([]);
    const [laporans, setLaporans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'PAID' | 'REJECTED' | 'NOT_SENT' | 'REKAP'>('PENDING');
    const [adminSession, setAdminSession] = useState<any>(null);

    // STATE BONUS MANUAL
    const [manualBonus, setManualBonus] = useState<Record<string, number>>({});

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

        const { data: userData } = await supabase.from('users').select('discord_id, name, pangkat');
        if (userData) setAllPersonnel(userData);

        const { data: dutyData } = await supabase.from('presensi_duty').select('user_id_discord, start_time');
        if (dutyData) setDuties(dutyData);

        const { data: cutiData } = await supabase.from('pengajuan_cuti').select('user_id_discord, tanggal_mulai, tanggal_selesai, status');
        if (cutiData) setCutis(cutiData);

        // Fetch untuk cek target Satlantas
        const { data: lapData } = await supabase.from('laporan_aktivitas').select('user_id_discord, created_at').eq('jenis_laporan', 'Penilangan').eq('status', 'APPROVED');
        if (lapData) setLaporans(lapData);

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

    // 🚀 ENGINE SUPER KALKULASI (HADIR, ALPHA, TARGET, POTONGAN & BONUS)
    const augmentedRequests = useMemo(() => {
        return requests.map(req => {
            const start = startOfDay(new Date(req.tanggal_mulai));
            const end = startOfDay(new Date(req.tanggal_selesai));
            const daysInPeriod = eachDayOfInterval({ start, end });
            const discordId = req.user_id_discord;

            let hadirCount = 0;
            let cutiCount = 0;

            daysInPeriod.forEach(day => {
                const targetStr = format(day, 'yyyy-MM-dd');
                const isHadir = duties.some(d => d.user_id_discord === discordId && format(new Date(d.start_time), 'yyyy-MM-dd') === targetStr);

                if (isHadir) {
                    hadirCount++;
                } else {
                    const isCuti = cutis.some(c => c.status === 'APPROVED' && c.user_id_discord === discordId && day >= startOfDay(new Date(c.tanggal_mulai)) && day <= startOfDay(new Date(c.tanggal_selesai)));
                    if (isCuti) cutiCount++;
                }
            });

            const alphaCount = Math.max(0, daysInPeriod.length - hadirCount - cutiCount);

            // Cek Target Tilang
            const tilangData = laporans.filter(l => l.user_id_discord === discordId && new Date(l.created_at) >= start && new Date(l.created_at) <= end);
            const isTargetMet = tilangData.length >= 15;

            const baseGaji = Number(req.jumlah_gaji); // Nilai awal dari DB (sudah termasuk auto-bonus jika target tercapai dari sistem frontend member)
            const potongan = alphaCount * (0.05 * baseGaji); // Potong 5% per Alpha
            const tambahanBonus = manualBonus[req.id] || 0;
            const finalGaji = baseGaji - potongan + tambahanBonus;

            return {
                ...req,
                hadir: hadirCount,
                cuti: cutiCount,
                alpha: alphaCount,
                total_hari: daysInPeriod.length,
                tilangCount: tilangData.length,
                isTargetMet,
                baseGaji,
                potongan,
                tambahanBonus,
                finalGaji
            };
        });
    }, [requests, duties, cutis, laporans, manualBonus]);

    const filteredData = useMemo(() => {
        if (activeTab === 'NOT_SENT') return augmentedRequests.filter(r => r.status === 'PAID' && !r.bukti_transfer);
        if (activeTab === 'REKAP') return [];
        return augmentedRequests.filter(r => r.status === activeTab);
    }, [augmentedRequests, activeTab]);

    const financialStats = useMemo(() => {
        if (!requests || requests.length === 0) return { weeklyPaid: 0, totalPending: 0, forecast: 0 };
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });

        const weeklyPaid = requests.filter(r => r.status === 'PAID' && isWithinInterval(new Date(r.created_at), { start, end })).reduce((sum, r) => sum + Number(r.jumlah_gaji), 0);
        const totalPending = augmentedRequests.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.finalGaji, 0);

        const latestSalaries = new Map<string, number>();
        requests.forEach(req => { if (req.user_id_discord && req.status === 'PAID' && !latestSalaries.has(req.user_id_discord)) latestSalaries.set(req.user_id_discord, Number(req.jumlah_gaji)); });
        let forecast = 0; latestSalaries.forEach((gaji) => { forecast += gaji; });

        return { weeklyPaid, totalPending, forecast };
    }, [requests, augmentedRequests]);

    // 🚀 ENGINE GENERATOR SLIP GAJI
    const handleOpenAndCapture = async (req: any) => {
        setCurrentSlipData(req);
        setIsGenerating(true);
        setCapturedImg(null);

        const tId = toast.loading("Mencetak Dokumen Payslip...");
        setTimeout(async () => {
            if (!slipRef.current) {
                toast.error("Gagal inisialisasi mesin cetak.", { id: tId });
                setIsGenerating(false); return;
            }
            try {
                const dataUrl = await toPng(slipRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: '#ffffff' });
                setCapturedImg(dataUrl);
                toast.success("Payslip Berhasil Dicetak!", { id: tId });
            } catch (err) {
                toast.error("Sistem gagal mengambil foto slip.", { id: tId });
                setCurrentSlipData(null);
            } finally { setIsGenerating(false); }
        }, 800);
    };

    // 🚀 ENGINE PENGIRIMAN DISCORD
    const handleTransmit = async () => {
        if (!capturedImg || !currentSlipData) return;
        setIsTransmitting(true);
        const tId = toast.loading("Menghubungkan ke HQ Discord...");

        try {
            const { data: configData } = await supabase.from('admin_config').select('key, value').in('key', ['webhook_payroll', 'thread_payroll']);
            const WEBHOOK_URL = configData?.find(c => c.key === 'webhook_payroll')?.value || "https://discord.com/api/webhooks/1486137739022700634/m9jKqS2O9DV8L8DcaHgIVGSI1yriyKwYAECgul6Te3W2S-t5isC9r_5x13Zcu-VaT20O";
            const THREAD_ID = configData?.find(c => c.key === 'thread_payroll')?.value || "1467455553214353440";

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

            const res = await fetch(`${WEBHOOK_URL}?thread_id=${THREAD_ID}`, { method: 'POST', body: formData });

            if (res.ok) {
                await supabase.from('pengajuan_gaji').update({ bukti_transfer: 'SENT_AS_IMAGE_QR' }).eq('id', currentSlipData.id);
                toast.success("PAYSLIP TERKIRIM KE DISCORD!", { id: tId });
                setCapturedImg(null); setCurrentSlipData(null); fetchData();
            } else { throw new Error("Discord Webhook Menolak Permintaan"); }

        } catch (err: any) { toast.error(err.message, { id: tId }); } finally { setIsTransmitting(false); }
    };

    // 🚀 HANDLE ACTION DENGAN SIMPAN RINCIAN (BASE, POTONGAN, BONUS) KE DATABASE
    const handleAction = async (id: string, status: string) => {
        const tId = toast.loading(`Updating status...`);
        const reqToApprove = augmentedRequests.find(r => r.id === id);

        // Simpan rincian ke keterangan_admin agar bisa dirender di slip nanti
        const adminNotes = status === 'PAID'
            ? `AUTH BY ${adminSession?.name || 'ADMIN'} | ALPH:${reqToApprove.alpha} | DEDC:${Math.round(reqToApprove.potongan)} | BONS:${reqToApprove.tambahanBonus} | BASE:${reqToApprove.baseGaji}`
            : `REJECTED BY ${adminSession?.name || 'ADMIN'}`;

        const { error } = await supabase.from('pengajuan_gaji').update({
            status,
            jumlah_gaji: status === 'PAID' ? reqToApprove.finalGaji : reqToApprove.baseGaji,
            keterangan_admin: adminNotes
        }).eq('id', id);

        if (error) toast.error("Error Database!");
        else { toast.success("Success!", { id: tId }); fetchData(); }
    };

    const executeDelete = async () => {
        if (deleteModal.type === 'ALL' && confirmInput !== "BERSIHKAN") return toast.error("Kode Salah!");
        const tId = toast.loading("Processing Purge...");
        try {
            if (deleteModal.type === 'ALL') { await supabase.from('pengajuan_gaji').delete().neq('status', 'PENDING'); }
            else { await supabase.from('pengajuan_gaji').delete().eq('id', deleteModal.id); }
            toast.success("DATA PURGED!", { id: tId }); fetchData();
            setDeleteModal({ show: false, type: 'ALL' }); setConfirmInput("");
        } catch (e) { toast.error("Gagal hapus data!"); }
    };

    // Helper untuk Parsing Note di Slip
    const getSlipDetails = (slip: any) => {
        const notes = slip.keterangan_admin || "";
        const extract = (key: string) => { const match = notes.match(new RegExp(`${key}:(\\d+)`)); return match ? parseInt(match[1]) : 0; };
        return {
            alpha: extract('ALPH'),
            dedc: extract('DEDC'),
            bons: extract('BONS'),
            base: extract('BASE') || slip.jumlah_gaji
        };
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 font-mono pb-20 text-slate-950">
            <Toaster position="top-center" />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div className={`col-span-2 md:col-span-1 bg-[#3B82F6] p-5 md:p-6 ${boxBorder} ${hardShadow} rounded-[20px] md:rounded-3xl text-white`}>
                    <p className="text-[10px] font-black uppercase opacity-80">System Forecast (Based on Previous Data)</p>
                    <h3 className="text-3xl md:text-4xl font-[1000] italic mt-1 leading-none truncate">${financialStats.forecast.toLocaleString()}</h3>
                </div>
                <div className={`bg-[#FFD100] p-5 md:p-6 ${boxBorder} ${hardShadow} rounded-[20px] md:rounded-3xl`}>
                    <p className="text-[10px] font-black uppercase opacity-60">Pending Needs</p>
                    <h3 className="text-2xl md:text-4xl font-[1000] italic mt-1 leading-none truncate">${financialStats.totalPending.toLocaleString()}</h3>
                </div>
                <div className={`bg-[#00E676] p-5 md:p-6 ${boxBorder} ${hardShadow} rounded-[20px] md:rounded-3xl`}>
                    <p className="text-[10px] font-black uppercase opacity-60">Weekly Paid</p>
                    <h3 className="text-2xl md:text-4xl font-[1000] italic mt-1 leading-none truncate">${financialStats.weeklyPaid.toLocaleString()}</h3>
                </div>
            </div>

            <div className={`bg-white ${boxBorder} ${hardShadow} p-4 md:p-6 rounded-xl md:rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 mb-6`}>
                <div className="flex justify-between items-center w-full md:w-auto">
                    <h2 className="font-[1000] text-xl md:text-2xl italic uppercase tracking-tighter text-slate-950">Payroll Command</h2>
                </div>

                <div className="flex w-full md:w-auto items-center gap-2">
                    <div className="flex flex-1 md:flex-none bg-slate-100 p-1.5 rounded-xl border-2 border-black gap-1 overflow-x-auto custom-scrollbar">
                        {['PENDING', 'NOT_SENT', 'PAID', 'REJECTED', 'REKAP'].map((t) => (
                            <button key={t} onClick={() => setActiveTab(t as any)} className={cn("px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase italic whitespace-nowrap flex items-center gap-2", activeTab === t ? "bg-[#00E676] border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40 hover:bg-black/5")}>
                                {t === 'REKAP' && <FileSpreadsheet size={14} />}
                                {t.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    {activeTab !== 'PENDING' && (
                        <button onClick={() => setDeleteModal({ show: true, type: 'ALL' })} className="bg-red-500 text-white p-2.5 rounded-xl border-2 border-black hover:scale-110 transition-all shadow-[2px_2px_0px_#000] active:translate-y-1 active:shadow-none"><Trash2 size={20} /></button>
                    )}
                </div>
            </div>

            {/* KONDISIONAL RENDER TABEL REKAP */}
            {!loading && activeTab === 'REKAP' && (
                <div className="bg-white border-[4px] border-black rounded-[30px] shadow-[10px_10px_0px_#000] overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-950 text-white">
                                    <th className="p-4 border-r-2 border-white/10 font-black uppercase italic text-xs">Nama Personel</th>
                                    <th className="p-4 border-r-2 border-white/10 font-black uppercase italic text-[10px]">Periode Gaji</th>
                                    <th className="p-4 border-r-2 border-white/10 font-black uppercase italic text-[10px] text-center">Rekap (H/C/A)</th>
                                    <th className="p-4 border-r-2 border-white/10 font-black uppercase italic text-[10px] text-right">Total Gaji</th>
                                    <th className="p-4 border-white/10 font-black uppercase italic text-[10px]">Pencairan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {augmentedRequests.filter(r => r.status === 'PAID').length === 0 ? (
                                    <tr><td colSpan={5} className="p-10 text-center font-black italic opacity-40 uppercase">Belum ada data gaji yang telah dibayarkan.</td></tr>
                                ) : (
                                    augmentedRequests.filter(r => r.status === 'PAID').map((req, idx) => (
                                        <tr key={req.id} className={cn("border-b-2 border-slate-100 hover:bg-slate-50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                                            <td className="p-4 border-r-2 border-slate-100">
                                                <p className="text-xs font-[1000] uppercase italic leading-none">{req.nama_panggilan}</p>
                                                <p className="text-[9px] text-[#3B82F6] font-bold mt-1 uppercase">{req.pangkat}</p>
                                            </td>
                                            <td className="p-4 border-r-2 border-slate-100 text-[10px] font-bold uppercase italic opacity-80">
                                                {format(new Date(req.tanggal_mulai), 'dd/MM/yy')} - {format(new Date(req.tanggal_selesai), 'dd/MM/yy')}
                                            </td>
                                            <td className="p-4 border-r-2 border-slate-100 text-center text-[10px] font-black tracking-widest">
                                                <span className="text-green-500">{req.hadir}</span> / <span className="text-yellow-500">{req.cuti}</span> / <span className="text-red-500">{req.alpha}</span>
                                            </td>
                                            <td className="p-4 border-r-2 border-slate-100 text-right font-[1000] text-[#00E676] text-sm italic">
                                                ${Number(req.jumlah_gaji).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-[10px] font-bold uppercase italic opacity-80">
                                                {format(new Date(req.updated_at || req.created_at), 'dd MMM yyyy')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* KONDISIONAL RENDER KARTU KLAIM */}
            {!loading && activeTab !== 'REKAP' && (
                filteredData.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-10 md:p-20 flex flex-col items-center justify-center text-center mt-8`}>
                        <div className="bg-slate-100 p-5 md:p-6 border-[3.5px] border-slate-900 rounded-3xl mb-4 shadow-[6px_6px_0_0_#000]">
                            <Database size={56} className="text-slate-400" />
                        </div>
                        <h3 className="text-2xl md:text-4xl font-[1000] italic uppercase tracking-tighter text-slate-900">NIHIL DATA</h3>
                        <p className="text-xs font-black uppercase opacity-50 mt-2 max-w-sm">Saat ini tidak ada laporan di antrian <span className="text-blue-500">{activeTab.replace('_', ' ')}</span>.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        {filteredData.map((req) => (
                            <div key={req.id} className={`bg-white ${boxBorder} ${hardShadow} rounded-[20px] md:rounded-[25px] overflow-hidden flex flex-col group relative`}>
                                <div className="bg-slate-950 text-white p-4 md:p-5 flex justify-between items-start border-b-[4px] border-black">
                                    <div>
                                        <h4 className="font-black uppercase italic leading-none truncate text-sm md:text-lg">{req.nama_panggilan}</h4>
                                        <p className="text-[9px] font-bold text-[#A3E635] mt-1 uppercase italic">{req.pangkat} • {req.divisi || 'UNIT'}</p>
                                    </div>
                                    <div className="bg-slate-800 p-1.5 rounded-lg border-2 border-slate-700 text-[9px] font-black uppercase text-center shrink-0">
                                        <p className="text-slate-400">Periode</p>
                                        <p>{format(new Date(req.tanggal_mulai), 'dd/MM')} - {format(new Date(req.tanggal_selesai), 'dd/MM')}</p>
                                    </div>
                                </div>

                                <div className="p-4 md:p-6 flex-1 flex flex-col space-y-4">
                                    {/* RADAR INFO (Hadir, Target) */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Attendance Box */}
                                        <div className="bg-slate-50 border-2 border-black rounded-xl p-3 relative overflow-hidden">
                                            <p className="text-[8px] font-black uppercase opacity-50 mb-1">Kehadiran ({req.total_hari} Hari)</p>
                                            <div className="flex gap-2 text-[10px] font-black">
                                                <span className="text-green-600 bg-green-100 px-2 rounded border border-green-300">H: {req.hadir}</span>
                                                <span className="text-yellow-600 bg-yellow-100 px-2 rounded border border-yellow-300">C: {req.cuti}</span>
                                                <span className={req.alpha > 0 ? "text-white bg-red-500 px-2 rounded border-2 border-black" : "text-red-500 bg-red-100 px-2 rounded border border-red-300"}>A: {req.alpha}</span>
                                            </div>
                                            {req.alpha > 0 && <UserX size={40} className="absolute -right-2 -bottom-2 opacity-10 text-red-500" />}
                                        </div>

                                        {/* Target Box */}
                                        <div className="bg-slate-50 border-2 border-black rounded-xl p-3 relative overflow-hidden flex flex-col justify-center">
                                            <p className="text-[8px] font-black uppercase opacity-50 mb-1">Target Ops</p>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("text-xs font-[1000] italic px-2 py-0.5 border border-black rounded shadow-[2px_2px_0px_#000]", req.isTargetMet ? "bg-[#00E676] text-black" : "bg-[#FFD100] text-black")}>
                                                    {req.tilangCount}/15
                                                </span>
                                                <span className="text-[8px] font-black uppercase italic">{req.isTargetMet ? 'Terpenuhi' : 'Belum'}</span>
                                            </div>
                                            <Target size={40} className="absolute -right-2 -bottom-2 opacity-10" />
                                        </div>
                                    </div>

                                    {/* KALKULASI PENDAPATAN */}
                                    <div className="border-t-2 border-dashed border-slate-300 pt-3 space-y-1">
                                        <div className="flex justify-between text-[10px] font-black uppercase opacity-60"><span>Gaji Pokok / Awal</span><span>${req.baseGaji.toLocaleString()}</span></div>
                                        {req.potongan > 0 && <div className="flex justify-between text-[10px] font-black uppercase text-red-500"><span>Potongan Alpha (5%)</span><span>- ${Math.round(req.potongan).toLocaleString()}</span></div>}
                                        {req.tambahanBonus > 0 && <div className="flex justify-between text-[10px] font-black uppercase text-blue-600"><span>Bonus Manual Admin</span><span>+ ${req.tambahanBonus.toLocaleString()}</span></div>}
                                    </div>

                                    {/* TOMBOL MANUAL BONUS (Hanya saat Pending) */}
                                    {activeTab === 'PENDING' && (
                                        <div className="flex gap-2 justify-center border-t-2 border-black pt-3">
                                            <button onClick={() => setManualBonus({ ...manualBonus, [req.id]: 35000 })} className="flex-1 bg-slate-950 text-white py-2 rounded-xl text-[8px] font-black uppercase italic border-2 border-black active:scale-95 flex items-center justify-center gap-1 shadow-[2px_2px_0px_#3B82F6]">
                                                <PlusCircle size={12} /> $35k (Lantas/Sab)
                                            </button>
                                            <button onClick={() => setManualBonus({ ...manualBonus, [req.id]: 50000 })} className="flex-1 bg-slate-950 text-white py-2 rounded-xl text-[8px] font-black uppercase italic border-2 border-black active:scale-95 flex items-center justify-center gap-1 shadow-[2px_2px_0px_#00E676]">
                                                <PlusCircle size={12} /> $50k (Brimob/Pro)
                                            </button>
                                            {req.tambahanBonus > 0 && (
                                                <button onClick={() => setManualBonus({ ...manualBonus, [req.id]: 0 })} className="bg-red-500 text-white px-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:scale-95"><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    )}

                                    {/* FINAL SALARY & ACTIONS */}
                                    <div className="mt-auto flex items-end justify-between bg-slate-100 p-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_#000]">
                                        <div>
                                            <p className="text-[9px] font-black uppercase opacity-60 italic leading-none mb-1">Final Payout</p>
                                            <p className="text-2xl font-[1000] italic text-[#00E676] leading-none text-shadow-sm tracking-tighter">${req.finalGaji.toLocaleString()}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            {activeTab === 'PENDING' ? (
                                                <>
                                                    <button onClick={() => handleAction(req.id, 'REJECTED')} className="bg-[#FF4D4D] border-2 border-black px-3 py-2 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 text-slate-950">Deny</button>
                                                    <button onClick={() => handleAction(req.id, 'PAID')} className="bg-[#00E676] border-2 border-black px-3 py-2 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 text-slate-950">Approve</button>
                                                </>
                                            ) : activeTab === 'NOT_SENT' ? (
                                                <button disabled={isGenerating} onClick={() => handleOpenAndCapture(req)} className="bg-blue-500 text-white border-2 border-black px-4 py-2 rounded-xl font-black text-[10px] uppercase flex justify-center items-center gap-2 shadow-[4px_4px_0px_#000] active:translate-y-1 disabled:opacity-50">
                                                    {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Eye size={14} />} Kirim Slip
                                                </button>
                                            ) : (
                                                <button onClick={() => handleOpenAndCapture(req)} className="bg-slate-300 text-slate-950 border-2 border-black px-4 py-2 rounded-xl font-black text-[10px] uppercase flex justify-center items-center gap-2 shadow-[4px_4px_0px_#000] active:translate-y-1"><Eye size={14} /> Arsip Slip</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* MODAL PREVIEW & KIRIM PAYSLIP */}
            <AnimatePresence>
                {currentSlipData && (
                    <div className="fixed inset-0 z-[200] bg-black/95 p-4 flex items-center justify-center overflow-y-auto backdrop-blur-md text-slate-950">
                        <div className="max-w-2xl w-full flex flex-col items-center gap-6 my-10 relative">
                            <div className="bg-white p-3 border-[6px] border-slate-950 rounded-[35px] shadow-[15px_15px_0px_#3B82F6] relative">
                                {capturedImg ? <img src={capturedImg} alt="Official Slip" className="w-full h-auto rounded-[25px] border-4 border-slate-950" /> : <div className="w-[300px] md:w-[500px] h-[400px] md:h-[600px] flex flex-col items-center justify-center gap-4 bg-slate-100 rounded-[25px]"><Loader2 className="animate-spin text-blue-600" size={40} /><p className="font-black italic uppercase text-xs text-black text-center">Menyusun Slip Gaji Resmi...</p></div>}
                            </div>
                            <div className="flex flex-col gap-3 w-full max-w-sm">
                                {activeTab === 'NOT_SENT' && (
                                    <button disabled={!capturedImg || isTransmitting} onClick={handleTransmit} className="w-full bg-[#00E676] text-black py-5 rounded-2xl font-[1000] uppercase italic text-sm shadow-[6px_6px_0px_#000] border-[3.5px] border-black flex items-center justify-center gap-4 active:translate-y-1 transition-all disabled:opacity-50">
                                        <Send size={20} strokeWidth={3} /> {isTransmitting ? "MENGIRIM..." : "KIRIM KE DISCORD"}
                                    </button>
                                )}
                                <button onClick={() => { setCurrentSlipData(null); setCapturedImg(null); }} className="bg-white border-4 border-black text-black py-3 rounded-xl font-black uppercase italic shadow-[4px_4px_0px_#000] active:translate-y-1 transition-all">Tutup Arsip</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- ELEMEN TERSEMBUNYI UNTUK GENERATOR GAMBAR HTML-TO-IMAGE --- */}
            {currentSlipData && (
                <div className="fixed top-[-9999px] left-[-9999px] opacity-0 pointer-events-none z-[-1000]">
                    <div ref={slipRef} className="bg-white w-[650px] border-[12px] border-black p-12 space-y-10 text-slate-950 font-mono relative">
                        {/* Background Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
                            <img src="/logo-polisi-blackwhite.png" alt="Watermark" className="w-[400px] h-[400px] object-contain grayscale" />
                        </div>

                        {/* Header Slip */}
                        <div className="flex justify-between items-start border-b-[8px] border-black pb-8 relative z-10">
                            <div className="flex gap-4 items-center">
                                <img src="/logo-polisi-blackwhite.png" alt="Logo MPD" className="w-16 h-16 object-contain" />
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-blue-600 mb-1 font-black italic text-sm tracking-[0.3em]">MPD HQ FINANCE</div>
                                    <h2 className="text-4xl font-[1000] italic tracking-tighter leading-none text-slate-950">OFFICIAL PAYSLIP</h2>
                                </div>
                            </div>
                            <div className="bg-black text-white px-5 py-3 rounded-xl font-black italic text-xs">#MPD-{currentSlipData.id.substring(0, 6).toUpperCase()}</div>
                        </div>

                        {/* DETAIL LENGKAP KARYAWAN */}
                        <div className="grid grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Nama Personel</p><p className="font-black text-xl uppercase italic border-b-4 border-black/5">{currentSlipData.nama_panggilan}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Pangkat / Divisi</p><p className="font-black text-xl uppercase italic text-blue-600 border-b-4 border-black/5">{currentSlipData.pangkat} / {currentSlipData.divisi || 'UNIT'}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Periode Gaji</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(new Date(currentSlipData.tanggal_mulai), 'dd MMM')} - {format(new Date(currentSlipData.tanggal_selesai), 'dd MMM yyyy')}</p></div>
                            </div>
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Tanggal Pencairan</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(new Date(currentSlipData.updated_at || currentSlipData.created_at), 'dd MMMM yyyy', { locale: localeId })}</p></div>
                                <div className="bg-slate-50 border-4 border-dashed border-black p-4 rounded-xl text-center">
                                    <p className="text-[9px] font-black uppercase opacity-30 leading-none mb-1 text-slate-900">Approved By</p>
                                    <p className="text-[11px] font-black uppercase leading-none text-blue-600">{(currentSlipData.keterangan_admin?.split(' |')[0]?.replace('AUTH BY ', '')) || 'HIGH COMMAND'}</p>
                                </div>
                            </div>
                        </div>

                        {/* RINCIAN PENDAPATAN & POTONGAN */}
                        <div className="border-4 border-black p-6 rounded-2xl relative z-10 bg-white">
                            <h4 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-2 mb-4">Rincian Kompensasi</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-bold uppercase italic">
                                    <span className="opacity-60">Gaji Awal / Pokok</span>
                                    <span>${getSlipDetails(currentSlipData).base.toLocaleString()}</span>
                                </div>

                                {getSlipDetails(currentSlipData).bons > 0 && (
                                    <div className="flex justify-between items-center text-sm font-bold uppercase italic text-blue-600">
                                        <span>Bonus Kinerja (Divisi)</span>
                                        <span>+ ${getSlipDetails(currentSlipData).bons.toLocaleString()}</span>
                                    </div>
                                )}

                                {getSlipDetails(currentSlipData).alpha > 0 && (
                                    <div className="flex justify-between items-center text-sm font-bold uppercase italic text-red-500">
                                        <span>Potongan Alpha ({getSlipDetails(currentSlipData).alpha} Hari)</span>
                                        <span>- ${getSlipDetails(currentSlipData).dedc.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PAYOUT TOTAL & QR CODE */}
                        <div className="bg-slate-950 p-8 rounded-[35px] flex justify-between items-center shadow-[10px_10px_0px_#00E676] relative z-10">
                            <div><p className="text-xs font-black uppercase text-white/40 italic tracking-[0.4em] mb-1">Total Net Payout</p><h3 className="text-6xl font-[1000] text-[#00E676] italic tracking-tighter leading-none">${Number(currentSlipData.jumlah_gaji).toLocaleString()}</h3></div>
                            <div className="bg-white p-2 border-4 border-black">
                                <QRCode size={85} value={`AUTH:${currentSlipData.id}|${currentSlipData.nama_panggilan}`} viewBox={`0 0 256 256`} />
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-center pt-2 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] bg-black text-white px-4 py-1 rounded">Mandalika Police Department</p>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
}