"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import QRCode from "react-qr-code";
import {
    Trash2, Eye, X, AlertOctagon, Shield, MapPin, Database, Loader2, Send, FileSpreadsheet, Target, UserX, PlusCircle, ChevronLeft, ChevronRight, Settings2, Filter
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, startOfDay, eachDayOfInterval } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast, Toaster } from 'sonner';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

// 🚀 DAFTAR PANGKAT PETINGGI YANG KEBAL POTONGAN
const PETINGGI_RANKS = ['JENDRAL', 'WAKAPOLRI', 'KAPOLRI', 'KOMJEN', 'IRJEN', 'BRIGJEN', 'KOMBES', 'AKBP'];

// 🚀 ENGINE PENYELAMAT TIMEZONE WITA/WIT
const getLocalSafeDate = (isoString: string) => {
    if (!isoString) return new Date();
    const d = new Date(isoString);
    d.setHours(d.getHours() + 12);
    return d;
};

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

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');

    const [manualAdjustments, setManualAdjustments] = useState<Record<string, { amount: number, reason: string }>>({});
    const [adjInputs, setAdjInputs] = useState<Record<string, { amount: string, reason: string }>>({});

    const [currentSlipData, setCurrentSlipData] = useState<any>(null);
    const [capturedImg, setCapturedImg] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isTransmitting, setIsTransmitting] = useState(false);

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

    useEffect(() => { setCurrentPage(1); }, [activeTab, selectedPeriod]);

    // 🚀 ENGINE VALIDATOR PANGKAT
    const getGajiByRank = (pangkat: string) => {
        const p = pangkat?.toUpperCase().trim() || "";
        switch (p) {
            case "JENDRAL": return 190000;
            case "WAKAPOLRI": return 185000;
            case "KAPOLRI": return 190000;
            case "KOMJEN": return 180000;
            case "IRJEN": return 175000;
            case "BRIGJEN": return 170000;
            case "KOMBESPOL":
            case "KOMBES": return 165000;
            case "AKBP": return 160000;
            case "KOMPOL": return 155000;
            case "AKP": return 150000;
            case "IPTU": return 145000;
            case "IPDA": return 140000;
            case "AIPTU": return 135000;
            case "AIPDA": return 130000;
            case "BRIPKA": return 125000;
            case "BRIGPOL": return 120000;
            case "BRIPTU": return 115000;
            case "BRIPDA": return 110000;
            case "BHARATU": return 105000;
            case "BHARADA": return 100000;
            default: return 110000;
        }
    };

    const availablePeriods = useMemo(() => {
        const periods = new Set<string>();
        requests.filter(r => r.status === 'PAID' && r.tanggal_mulai && r.tanggal_selesai).forEach(r => {
            const s = format(getLocalSafeDate(r.tanggal_mulai), 'yyyy-MM-dd');
            const e = format(getLocalSafeDate(r.tanggal_selesai), 'yyyy-MM-dd');
            periods.add(`${s}|${e}`);
        });
        return Array.from(periods).sort().reverse();
    }, [requests]);

    // 🚀 ENGINE SUPER KALKULASI: ADMIN AUTHORITY
    const augmentedRequests = useMemo(() => {
        return requests.map(req => {
            const start = startOfDay(getLocalSafeDate(req.tanggal_mulai));
            const end = startOfDay(getLocalSafeDate(req.tanggal_selesai));
            const daysInPeriod = eachDayOfInterval({ start, end });
            const discordId = req.user_id_discord;

            // 🚀 PARSING NAMA DAN BADGE
            let rawName = req.nama_panggilan || "OFFICER";
            let badgeNumber = "-";

            if (rawName.includes('|')) {
                rawName = rawName.split('|').pop()?.trim() || rawName;
            }

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

            const cleanName = rawName.toUpperCase();

            let hadirCount = 0; let cutiCount = 0;

            daysInPeriod.forEach(day => {
                const targetStr = format(day, 'yyyy-MM-dd');
                const isHadir = duties.some(d => d.user_id_discord === discordId && format(getLocalSafeDate(d.start_time), 'yyyy-MM-dd') === targetStr);

                if (isHadir) hadirCount++;
                else {
                    const isCuti = cutis.some(c => c.status === 'APPROVED' && c.user_id_discord === discordId && day >= startOfDay(getLocalSafeDate(c.tanggal_mulai)) && day <= startOfDay(getLocalSafeDate(c.tanggal_selesai)));
                    if (isCuti) cutiCount++;
                }
            });

            const alphaCount = Math.max(0, daysInPeriod.length - hadirCount - cutiCount);
            const tilangData = laporans.filter(l => l.user_id_discord === discordId && new Date(l.created_at) >= start && new Date(l.created_at) <= end);
            const isTargetMet = tilangData.length >= 15;
            const isSatlantas = (req.divisi || "").toUpperCase().includes('SATLANTAS');
            const pangkatUser = (req.pangkat || "").toUpperCase();
            const isPetinggi = PETINGGI_RANKS.some(rank => pangkatUser.includes(rank));

            const isPAID = req.status === 'PAID' || req.status === 'REJECTED';

            const extractLegacy = (key: string) => {
                const match = (req.keterangan_admin || "").match(new RegExp(`${key}:\\s*(-?\\d+)`));
                return match ? parseInt(match[1], 10) : 0;
            };
            const extractReason = () => {
                const match = (req.keterangan_admin || "").match(/RSN:(.*?)( - BASE:|$)/);
                return match ? match[1].trim() : 'Penyesuaian Manual';
            };

            if (isPAID) {
                const legacyAdj = extractLegacy('ADJ') !== 0 ? extractLegacy('ADJ') : extractLegacy('BONS');
                return {
                    ...req, hadir: hadirCount, cuti: cutiCount, alpha: alphaCount,
                    total_hari: daysInPeriod.length, tilangCount: tilangData.length,
                    isTargetMet, isSatlantas, isPetinggi, cleanName, badgeNumber,
                    baseGaji: extractLegacy('BASE') || req.jumlah_gaji,
                    potonganAlpha: extractLegacy('ALPH'),
                    potonganCuti: extractLegacy('CUTI'),
                    totalPotongan: extractLegacy('ALPH') + extractLegacy('CUTI'),
                    adjustment: { amount: legacyAdj, reason: extractReason() },
                    finalGaji: Number(req.jumlah_gaji)
                };
            }

            const weeksCount = daysInPeriod.length >= 13 ? 2 : 1;
            const baseGajiPokok = getGajiByRank(req.pangkat) * weeksCount;

            const divisiUser = (req.divisi || "").toUpperCase();
            let earnedBonus = 0;
            if (isTargetMet) {
                if (divisiUser.includes('SATLANTAS') || divisiUser.includes('SABHARA')) earnedBonus = 35000;
                else if (divisiUser.includes('BRIMOB') || divisiUser.includes('PROPAM')) earnedBonus = 50000;
            }

            const baseGajiSubmit = baseGajiPokok + earnedBonus;

            const potonganAlpha = isPetinggi ? 0 : Math.round(alphaCount * (baseGajiPokok * 0.05));
            const potonganCuti = isPetinggi ? 0 : Math.round(cutiCount * (baseGajiPokok * 0.02));
            const totalPotongan = potonganAlpha + potonganCuti;

            const adjustment = manualAdjustments[req.id] || { amount: 0, reason: 'Penyesuaian Manual' };
            const finalGaji = baseGajiSubmit - totalPotongan + adjustment.amount;

            return {
                ...req, hadir: hadirCount, cuti: cutiCount, alpha: alphaCount,
                total_hari: daysInPeriod.length, tilangCount: tilangData.length,
                isTargetMet, isSatlantas, isPetinggi, cleanName, badgeNumber,
                baseGaji: baseGajiSubmit,
                potonganAlpha, potonganCuti, totalPotongan, adjustment, finalGaji
            };
        });
    }, [requests, duties, cutis, laporans, manualAdjustments]);

    const filteredData = useMemo(() => {
        if (activeTab === 'NOT_SENT') return augmentedRequests.filter(r => r.status === 'PAID' && !r.bukti_transfer);
        if (activeTab === 'REKAP') {
            let data = augmentedRequests.filter(r => r.status === 'PAID');
            if (selectedPeriod !== 'ALL') {
                const [startTarget, endTarget] = selectedPeriod.split('|');
                data = data.filter(r =>
                    format(getLocalSafeDate(r.tanggal_mulai), 'yyyy-MM-dd') === startTarget &&
                    format(getLocalSafeDate(r.tanggal_selesai), 'yyyy-MM-dd') === endTarget
                );
            }
            return data;
        }
        if (activeTab === 'REJECTED') return augmentedRequests.filter(r => r.status === 'REJECTED');
        return augmentedRequests.filter(r => r.status === 'PENDING');
    }, [augmentedRequests, activeTab, selectedPeriod]);

    const paginatedData = useMemo(() => {
        return filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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

    const handleTransmit = async () => {
        if (!capturedImg || !currentSlipData) return;
        setIsTransmitting(true);
        const tId = toast.loading("Menghubungkan ke HQ Discord...");

        try {
            const { data: configData } = await supabase.from('admin_config').select('key, value').in('key', ['webhook_payroll', 'thread_payroll']);
            const WEBHOOK_URL = configData?.find(c => c.key === 'webhook_payroll')?.value || "https://discord.com/api/webhooks/1486137739022700634/m9jKqS2O9DV8L8DcaHgIVGSI1yriyKwYAECgul6Te3W2S-t5isC9r_5x13Zcu-VaT20O";
            const THREAD_ID = configData?.find(c => c.key === 'thread_payroll')?.value || "1467455553214353440";

            const blob = await (await fetch(capturedImg)).blob();
            const file = new File([blob], `Payslip_${currentSlipData.cleanName}.png`, { type: 'image/png' });

            const formData = new FormData();
            formData.append("file", file);
            formData.append("payload_json", JSON.stringify({
                content: `<@${currentSlipData.user_id_discord || ''}> **PENGIRIMAN PAYSLIP BERHASIL**`,
                embeds: [{
                    title: "🏛️ MANDALIKA POLICE - OFFICIAL PAYSLIP",
                    description: `Payslip resmi telah diterbitkan dan divalidasi oleh HQ Finance.`,
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

    const handleAction = async (id: string, status: string) => {
        const tId = toast.loading(`Updating status...`);
        const reqToApprove = augmentedRequests.find(r => r.id === id);

        const rawName = adminSession?.name || 'ADMIN';
        const rawRank = adminSession?.pangkat || '';

        let cleanName = rawName;
        if (rawRank && cleanName.toUpperCase().includes(rawRank.toUpperCase())) {
            cleanName = cleanName.replace(new RegExp(rawRank, 'ig'), '').replace(/^[\s\|-]+/, '').trim();
        }
        const adminIdentity = rawRank ? `${rawRank.toUpperCase()} | ${cleanName.toUpperCase()}` : cleanName.toUpperCase();

        const adminNotes = status === 'PAID'
            ? `AUTH BY ${adminIdentity} - ALPH:${reqToApprove.potonganAlpha} - CUTI:${reqToApprove.potonganCuti} - ADJ:${reqToApprove.adjustment.amount} - RSN:${reqToApprove.adjustment.reason} - BASE:${reqToApprove.baseGaji}`
            : `REJECTED BY ${adminIdentity}`;

        const { error } = await supabase.from('pengajuan_gaji').update({
            status,
            jumlah_gaji: status === 'PAID' ? reqToApprove.finalGaji : 0,
            keterangan_admin: adminNotes
        }).eq('id', id);

        if (error) toast.error("Error Database!");
        else { toast.success("Success!", { id: tId }); fetchData(); }
    };

    const executeDelete = async () => {
        if (deleteModal.type === 'ALL' && confirmInput !== "BERSIHKAN") return toast.error("Kode Keamanan Salah!");
        const tId = toast.loading(deleteModal.type === 'ALL' ? "Processing Purge..." : "Menghapus Data Log...");
        try {
            if (deleteModal.type === 'ALL') {
                await supabase.from('pengajuan_gaji').delete().neq('status', 'PENDING');
            } else {
                await supabase.from('pengajuan_gaji').delete().eq('id', deleteModal.id);
            }
            toast.success(deleteModal.type === 'ALL' ? "SELURUH DATA ARSIP DIBERSIHKAN!" : "LOG BERHASIL DIHAPUS!", { id: tId });
            fetchData();
            setDeleteModal({ show: false, type: 'ALL' });
            setConfirmInput("");
        } catch (e) { toast.error("Gagal menghapus data!"); }
    };

    // 🚀 ENGINE MEMBERSIHKAN NAMA ADMIN DI SLIP GAJI
    const getAdminName = (notes: string) => {
        if (!notes) return 'HIGH COMMAND';
        let str = notes.replace('AUTH BY ', '').replace('REJECTED BY ', '');
        const alphIndex = str.indexOf('- ALPH:');
        if (alphIndex !== -1) str = str.substring(0, alphIndex);
        str = str.trim();

        // Parse jika admin name masih mengandung | atau #
        if (str.includes('|')) {
            str = str.split('|').pop()?.trim() || str;
        }
        if (str.startsWith('#')) {
            const spaceIndex = str.indexOf(' ');
            if (spaceIndex !== -1) {
                str = str.substring(spaceIndex + 1).trim();
            } else {
                str = "ADMIN";
            }
        }
        return str.toUpperCase();
    };

    const PaginationControls = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex justify-between items-center bg-slate-950 text-white p-4 rounded-xl border-[4px] border-black mt-6 shadow-[6px_6px_0px_#FFD100]">
                <span className="text-[10px] font-black uppercase italic tracking-widest text-[#FFD100]">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="bg-white text-black p-2 rounded-lg active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-transform"><ChevronLeft size={16} strokeWidth={3} /></button>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="bg-white text-black p-2 rounded-lg active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-transform"><ChevronRight size={16} strokeWidth={3} /></button>
                </div>
            </div>
        );
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

            <div className={`bg-white ${boxBorder} ${hardShadow} p-4 md:p-6 rounded-xl md:rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10 mb-6`}>
                <div className="flex justify-between items-center w-full lg:w-auto">
                    <h2 className="font-[1000] text-xl md:text-2xl italic uppercase tracking-tighter text-slate-950">Payroll Command</h2>
                </div>

                <div className="flex w-full lg:w-auto flex-col lg:flex-row items-center gap-3">
                    {activeTab === 'REKAP' && (
                        <div className="flex items-center gap-2 bg-slate-100 p-2 border-2 border-black rounded-xl w-full lg:w-auto">
                            <Filter size={16} className="text-slate-500" />
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="bg-transparent font-black text-[10px] uppercase outline-none w-full cursor-pointer"
                            >
                                <option value="ALL">SEMUA PERIODE</option>
                                {availablePeriods.map(p => {
                                    const [s, e] = p.split('|');
                                    return <option key={p} value={p}>{format(new Date(s), 'dd MMM')} - {format(new Date(e), 'dd MMM yyyy')}</option>
                                })}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-1 w-full lg:w-auto bg-slate-100 p-1.5 rounded-xl border-2 border-black gap-1 overflow-x-auto custom-scrollbar">
                        {['PENDING', 'NOT_SENT', 'PAID', 'REJECTED', 'REKAP'].map((t) => (
                            <button key={t} onClick={() => setActiveTab(t as any)} className={cn("px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase italic whitespace-nowrap flex items-center gap-2", activeTab === t ? "bg-[#00E676] border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40 hover:bg-black/5")}>
                                {t === 'REKAP' && <FileSpreadsheet size={14} />}
                                {t.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    {activeTab !== 'PENDING' && (
                        <button onClick={() => setDeleteModal({ show: true, type: 'ALL' })} className="bg-red-500 text-white p-2.5 rounded-xl border-2 border-black w-full lg:w-auto flex justify-center hover:scale-105 transition-all shadow-[2px_2px_0px_#000] active:translate-y-1 active:shadow-none"><Trash2 size={20} /></button>
                    )}
                </div>
            </div>

            {/* TABEL REKAP */}
            {!loading && activeTab === 'REKAP' && (
                <>
                    <div className="bg-white border-[4px] border-black rounded-[30px] shadow-[10px_10px_0px_#000] overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-950 text-white">
                                        <th className="p-4 border-r-2 border-white/10 font-black uppercase italic text-xs">Nama Personel</th>
                                        <th className="p-4 border-r-2 border-white/10 font-black uppercase italic text-[10px]">Periode Gaji</th>
                                        <th className="p-4 border-r-2 border-white/10 font-black uppercase italic text-[10px] text-center">Rekap (H/C/A)</th>
                                        <th className="p-4 border-r-2 border-white/10 font-black uppercase italic text-[10px] text-right">Total Gaji</th>
                                        <th className="p-4 border-r-2 border-white/10 font-black uppercase italic text-[10px] text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length === 0 ? (
                                        <tr><td colSpan={5} className="p-10 text-center font-black italic opacity-40 uppercase">Belum ada data gaji yang telah dibayarkan di halaman ini.</td></tr>
                                    ) : (
                                        paginatedData.map((req, idx) => (
                                            <tr key={req.id} className={cn("border-b-2 border-slate-100 hover:bg-slate-50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                                                <td className="p-4 border-r-2 border-slate-100">
                                                    <p className="text-xs font-[1000] uppercase italic leading-none">{req.cleanName}</p>
                                                    <p className="text-[9px] text-[#3B82F6] font-bold mt-1 uppercase">{req.pangkat} • #{req.badgeNumber}</p>
                                                </td>
                                                <td className="p-4 border-r-2 border-slate-100 text-[10px] font-bold uppercase italic opacity-80">
                                                    {format(getLocalSafeDate(req.tanggal_mulai), 'dd/MM/yy')} - {format(getLocalSafeDate(req.tanggal_selesai), 'dd/MM/yy')}
                                                </td>
                                                <td className="p-4 border-r-2 border-slate-100 text-center text-[10px] font-black tracking-widest">
                                                    <span className="text-green-500">{req.hadir}</span> / <span className="text-yellow-500">{req.cuti}</span> / <span className="text-red-500">{req.alpha}</span>
                                                </td>
                                                <td className="p-4 border-r-2 border-slate-100 text-right font-[1000] text-[#00E676] text-sm italic">
                                                    ${Number(req.jumlah_gaji).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center flex justify-center gap-2">
                                                    <button onClick={() => handleOpenAndCapture(req)} className="text-blue-500 bg-blue-50 hover:bg-blue-100 p-2 rounded-xl border-2 border-blue-500 active:scale-95 transition-all"><Eye size={16} /></button>
                                                    <button onClick={() => setDeleteModal({ show: true, type: 'SINGLE', id: req.id })} className="text-[#FF4D4D] bg-red-50 hover:bg-red-100 p-2 rounded-xl border-2 border-[#FF4D4D] active:scale-95 transition-all"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <PaginationControls />
                </>
            )}

            {/* KARTU KLAIM */}
            {!loading && activeTab !== 'REKAP' && (
                paginatedData.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-10 md:p-20 flex flex-col items-center justify-center text-center mt-8`}>
                        <div className="bg-slate-100 p-5 md:p-6 border-[3.5px] border-slate-900 rounded-3xl mb-4 shadow-[6px_6px_0_0_#000]">
                            <Database size={56} className="text-slate-400" />
                        </div>
                        <h3 className="text-2xl md:text-4xl font-[1000] italic uppercase tracking-tighter text-slate-900">NIHIL DATA</h3>
                        <p className="text-xs font-black uppercase opacity-50 mt-2 max-w-sm">Saat ini tidak ada laporan di antrian <span className="text-blue-500">{activeTab.replace('_', ' ')}</span>.</p>
                    </motion.div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                            {paginatedData.map((req) => (
                                <div key={req.id} className={`bg-white ${boxBorder} ${hardShadow} rounded-[20px] md:rounded-[25px] overflow-hidden flex flex-col group relative`}>
                                    <div className="bg-slate-950 text-white p-4 md:p-5 flex justify-between items-start border-b-[4px] border-black">
                                        <div>
                                            <h4 className="font-black uppercase italic leading-none truncate text-sm md:text-lg">{req.cleanName}</h4>
                                            <p className="text-[9px] font-bold text-[#A3E635] mt-1 uppercase italic">{req.pangkat} • #{req.badgeNumber} • {req.divisi || 'UNIT'}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="bg-slate-800 p-1.5 rounded-lg border-2 border-slate-700 text-[9px] font-black uppercase text-center shrink-0">
                                                <p className="text-slate-400">Periode</p>
                                                <p>{format(getLocalSafeDate(req.tanggal_mulai), 'dd/MM')} - {format(getLocalSafeDate(req.tanggal_selesai), 'dd/MM')}</p>
                                            </div>
                                            <button onClick={() => setDeleteModal({ show: true, type: 'SINGLE', id: req.id })} className="bg-[#FF4D4D] text-black p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] active:translate-y-1 hover:scale-105 transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 md:p-6 flex-1 flex flex-col space-y-4">
                                        <div className={cn("grid gap-3", req.isSatlantas ? "grid-cols-2" : "grid-cols-1")}>
                                            <div className="bg-slate-50 border-2 border-black rounded-xl p-3 relative overflow-hidden">
                                                <p className="text-[8px] font-black uppercase opacity-50 mb-1">Kehadiran ({req.total_hari} Hari)</p>
                                                <div className="flex gap-2 text-[10px] font-black">
                                                    <span className="text-green-600 bg-green-100 px-2 rounded border border-green-300">H: {req.hadir}</span>
                                                    <span className="text-yellow-600 bg-yellow-100 px-2 rounded border border-yellow-300">C: {req.cuti}</span>
                                                    <span className={req.alpha > 0 ? "text-white bg-red-500 px-2 rounded border-2 border-black" : "text-red-500 bg-red-100 px-2 rounded border border-red-300"}>A: {req.alpha}</span>
                                                </div>
                                                {req.alpha > 0 && <UserX size={40} className="absolute -right-2 -bottom-2 opacity-10 text-red-500" />}
                                            </div>

                                            {req.isSatlantas && (
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
                                            )}
                                        </div>

                                        <div className="border-t-2 border-dashed border-slate-300 pt-3 space-y-1">
                                            <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
                                                <span>Gaji Awal {req.isTargetMet ? '(Incl. Bonus Target)' : '(Pokok)'}</span>
                                                <span>${req.baseGaji.toLocaleString()}</span>
                                            </div>

                                            {req.potonganAlpha > 0 && <div className="flex justify-between text-[10px] font-black uppercase text-red-500"><span>Potongan Alpha (5% x {req.alpha})</span><span>- ${req.potonganAlpha.toLocaleString()}</span></div>}
                                            {req.potonganCuti > 0 && <div className="flex justify-between text-[10px] font-black uppercase text-red-500"><span>Potongan Cuti/Izin (2% x {req.cuti})</span><span>- ${req.potonganCuti.toLocaleString()}</span></div>}
                                            {req.isPetinggi && (req.alpha > 0 || req.cuti > 0) && <div className="flex justify-between text-[10px] font-black uppercase text-green-600"><span>Privilese Petinggi</span><span>Bebas Potongan</span></div>}

                                            {req.adjustment?.amount !== 0 && (
                                                <div className={cn("flex justify-between text-[10px] font-black uppercase", req.adjustment?.amount > 0 ? "text-blue-600" : "text-red-600")}>
                                                    <span className="truncate max-w-[200px]">Adj: {req.adjustment?.reason}</span>
                                                    <span>{req.adjustment?.amount > 0 ? '+' : '-'} ${Math.abs(req.adjustment?.amount || 0).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {activeTab === 'PENDING' && (
                                            <div className="flex flex-col gap-2 justify-center border-t-2 border-black pt-3">
                                                <div className="flex gap-2">
                                                    <button onClick={() => setManualAdjustments({ ...manualAdjustments, [req.id]: { amount: 35000, reason: 'Bonus Tambahan' } })} className="flex-1 bg-slate-950 text-white py-2 rounded-lg text-[8px] font-black uppercase italic border-2 border-black active:scale-95 flex items-center justify-center gap-1 shadow-[2px_2px_0px_#3B82F6]">
                                                        <PlusCircle size={12} /> + $35k (Manual)
                                                    </button>
                                                    <button onClick={() => setManualAdjustments({ ...manualAdjustments, [req.id]: { amount: 50000, reason: 'Bonus Ekstra' } })} className="flex-1 bg-slate-950 text-white py-2 rounded-lg text-[8px] font-black uppercase italic border-2 border-black active:scale-95 flex items-center justify-center gap-1 shadow-[2px_2px_0px_#00E676]">
                                                        <PlusCircle size={12} /> + $50k (Manual)
                                                    </button>
                                                </div>

                                                <div className="flex gap-2 items-center">
                                                    <Settings2 size={16} className="text-slate-400 shrink-0" />
                                                    <input
                                                        type="number"
                                                        placeholder="Nominal (- utk Denda)"
                                                        value={adjInputs[req.id]?.amount || ''}
                                                        onChange={(e) => setAdjInputs({ ...adjInputs, [req.id]: { ...adjInputs[req.id], amount: e.target.value } })}
                                                        className="border-2 border-black px-2 py-1.5 text-[10px] w-24 rounded outline-none focus:bg-slate-100"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Keterangan..."
                                                        value={adjInputs[req.id]?.reason || ''}
                                                        onChange={(e) => setAdjInputs({ ...adjInputs, [req.id]: { ...adjInputs[req.id], reason: e.target.value } })}
                                                        className="border-2 border-black px-2 py-1.5 text-[10px] flex-1 rounded outline-none focus:bg-slate-100"
                                                    />
                                                    <button
                                                        onClick={() => setManualAdjustments({ ...manualAdjustments, [req.id]: { amount: Number(adjInputs[req.id]?.amount || 0), reason: adjInputs[req.id]?.reason || 'Penyesuaian Sistem' } })}
                                                        className="bg-blue-500 text-white px-3 py-1.5 rounded text-[10px] border-2 border-black font-black shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none"
                                                    >Apply</button>
                                                </div>

                                                {req.adjustment?.amount !== 0 && (
                                                    <div className="flex justify-between items-center bg-yellow-100 border border-yellow-400 p-1.5 rounded mt-1">
                                                        <span className="text-[9px] font-black italic uppercase text-yellow-800">Aktif: {req.adjustment?.reason}</span>
                                                        <button onClick={() => setManualAdjustments({ ...manualAdjustments, [req.id]: { amount: 0, reason: '' } })} className="bg-red-500 text-white rounded p-1"><X size={10} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

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
                                                        {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Eye size={14} />} Preview Slip
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
                        <PaginationControls />
                    </>
                )
            )}

            {/* MODAL HAPUS DATA */}
            <AnimatePresence>
                {deleteModal.show && (
                    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0, rotate: -2 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border-[4px] border-black shadow-[8px_8px_0px_#FF4D4D] p-6 max-w-sm w-full rounded-2xl">
                            <div className="flex items-center gap-3 text-[#FF4D4D] mb-4">
                                <AlertOctagon size={32} strokeWidth={3} />
                                <h3 className="text-xl font-[1000] italic uppercase">Peringatan!</h3>
                            </div>
                            <p className="text-xs font-bold uppercase mb-4 opacity-70 leading-relaxed text-black">
                                {deleteModal.type === 'ALL'
                                    ? "Anda akan menghapus SEMUA data gaji yang sudah diproses dari server. Ketik 'BERSIHKAN' untuk melanjutkan."
                                    : "Anda yakin ingin menghapus log slip gaji ini secara permanen dari server?"}
                            </p>

                            {deleteModal.type === 'ALL' && (
                                <input
                                    type="text"
                                    value={confirmInput}
                                    onChange={(e) => setConfirmInput(e.target.value)}
                                    placeholder="Ketik BERSIHKAN"
                                    className="w-full border-2 border-black p-3 mb-4 rounded-xl font-bold uppercase outline-none focus:bg-slate-100 text-black placeholder-slate-400"
                                />
                            )}

                            <div className="flex gap-2 mt-6">
                                <button onClick={() => setDeleteModal({ show: false, type: 'ALL' })} className="flex-1 bg-slate-200 text-black border-2 border-black p-3 rounded-xl font-black uppercase text-xs active:translate-y-1 shadow-[2px_2px_0px_#000] transition-transform">Batal</button>
                                <button onClick={executeDelete} className="flex-1 bg-[#FF4D4D] text-white border-2 border-black p-3 rounded-xl font-black uppercase text-xs active:translate-y-1 shadow-[2px_2px_0px_#000] transition-transform">Hapus</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
                            <img src="/logo-polisi-blackwhite.png" alt="Watermark" className="w-[400px] h-[400px] object-contain grayscale" />
                        </div>
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

                        {/* 🚀 LAYOUT PAYSLIP HEADER BARU: PISAH BADGE & DIVISI */}
                        <div className="grid grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-4">
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Nama Personel</p><p className="font-black text-xl uppercase italic border-b-4 border-black/5">{currentSlipData.cleanName}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Pangkat / Badge</p><p className="font-black text-xl uppercase italic text-blue-600 border-b-4 border-black/5">{currentSlipData.pangkat} / #{currentSlipData.badgeNumber}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Divisi</p><p className="font-black text-lg uppercase italic border-b-4 border-black/5">{currentSlipData.divisi || 'UNIT'}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Periode Gaji</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(getLocalSafeDate(currentSlipData.tanggal_mulai), 'dd MMM')} - {format(getLocalSafeDate(currentSlipData.tanggal_selesai), 'dd MMM yyyy')}</p></div>
                            </div>
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Tanggal Pencairan</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(new Date(currentSlipData.updated_at || currentSlipData.created_at), 'dd MMMM yyyy', { locale: localeId })}</p></div>
                                <div className="bg-slate-50 border-4 border-dashed border-black p-4 rounded-xl text-center">
                                    <p className="text-[9px] font-black uppercase opacity-30 leading-none mb-1 text-slate-900">Approved By</p>
                                    <p className="text-[11px] font-black uppercase leading-none text-blue-600">
                                        {getAdminName(currentSlipData.keterangan_admin)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-4 border-black p-6 rounded-2xl relative z-10 bg-white">
                            <h4 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-2 mb-4">Rincian Kompensasi</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-bold uppercase italic">
                                    <span className="opacity-60">Gaji Awal / Pokok</span>
                                    <span>${currentSlipData.baseGaji.toLocaleString()}</span>
                                </div>

                                {currentSlipData.potonganAlpha > 0 && (
                                    <div className="flex justify-between items-center text-sm font-bold uppercase italic text-red-500">
                                        <span>Potongan Alpha (5%)</span>
                                        <span>- ${currentSlipData.potonganAlpha.toLocaleString()}</span>
                                    </div>
                                )}
                                {currentSlipData.potonganCuti > 0 && (
                                    <div className="flex justify-between items-center text-sm font-bold uppercase italic text-red-500">
                                        <span>Potongan Cuti/Izin (2%)</span>
                                        <span>- ${currentSlipData.potonganCuti.toLocaleString()}</span>
                                    </div>
                                )}

                                {currentSlipData.adjustment?.amount !== 0 && (
                                    <div className={cn("flex justify-between items-center text-sm font-bold uppercase italic", currentSlipData.adjustment?.amount > 0 ? "text-blue-600" : "text-red-500")}>
                                        <span>{currentSlipData.adjustment?.amount > 0 ? 'Bonus' : 'Denda'}: {currentSlipData.adjustment?.reason}</span>
                                        <span>{currentSlipData.adjustment?.amount > 0 ? '+' : '-'} ${Math.abs(currentSlipData.adjustment?.amount || 0).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-950 p-8 rounded-[35px] flex justify-between items-center shadow-[10px_10px_0px_#00E676] relative z-10">
                            <div><p className="text-xs font-black uppercase text-white/40 italic tracking-[0.4em] mb-1">Total Net Payout</p><h3 className="text-6xl font-[1000] text-[#00E676] italic tracking-tighter leading-none">${Number(currentSlipData.jumlah_gaji).toLocaleString()}</h3></div>
                            <div className="bg-white p-2 border-4 border-black">
                                <QRCode size={85} value={`AUTH:${currentSlipData.id}|${currentSlipData.cleanName}`} viewBox={`0 0 256 256`} />
                            </div>
                        </div>

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