"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import QRCode from "react-qr-code";
import {
    Receipt, Wallet, Zap, User, Send, Download,
    ChevronLeft, ChevronRight, ShieldCheck, Activity,
    AlertTriangle, FileText, Lock, Fingerprint, X,
    AlertOctagon, Info, CheckCircle, Shield, MapPin, Loader2, Target
} from 'lucide-react';
import {
    format, startOfMonth, endOfMonth, startOfWeek,
    endOfWeek, addDays, isSameDay, isWithinInterval,
    addMonths, subMonths, startOfDay, endOfDay, isBefore, parseISO,
    getDay, differenceInDays, subWeeks
} from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from "@/lib/supabase";

// 🚀 TYPE DEFINITIONS
interface RealtimeData {
    pangkat?: string;
    divisi?: string;
    [key: string]: unknown;
}

interface PengajuanGaji {
    id: string;
    user_id_discord: string;
    nama_panggilan: string;
    pangkat: string;
    divisi: string;
    jumlah_gaji: number;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: 'PENDING' | 'PAID' | 'REJECTED';
    created_at: string;
    keterangan_admin?: string;
}

interface UserReport {
    created_at: string;
}

const cn = (...classes: Array<string | false | null | undefined>): string =>
    classes.filter(Boolean).join(' ');

// 🚀 ENGINE MUTLAK WIB (UTC+7)
const getWIBTime = () => {
    const d = new Date();
    const localTime = d.getTime();
    const localOffset = d.getTimezoneOffset() * 60000;
    const utc = localTime + localOffset;
    const wibOffset = 7 * 3600000; // +7 Jam (WIB)
    return new Date(utc + wibOffset);
};

export default function SectionSalary({ nickname, realtimeData }: { nickname: string, realtimeData: RealtimeData }) {
    const slipRef = useRef<HTMLDivElement>(null);
    const [currentMonth, setCurrentMonth] = useState(getWIBTime());
    const [range, setRange] = useState<{ from: Date | null, to: Date | null }>({ from: null, to: null });
    const [history, setHistory] = useState<PengajuanGaji[]>([]);
    const [userReports, setUserReports] = useState<UserReport[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [selectedSlip, setSelectedSlip] = useState<PengajuanGaji | null>(null);

    const [notif, setNotif] = useState<{ show: boolean, title: string, message: string, type: 'ERROR' | 'SUCCESS' | 'INFO' }>({
        show: false, title: '', message: '', type: 'INFO'
    });

    const showNotif = (title: string, message: string, type: 'ERROR' | 'SUCCESS' | 'INFO') => {
        setNotif({ show: true, title, message, type });
    };

    const getGajiByRank = (pangkat?: string) => {
        const p = pangkat?.toUpperCase().trim() || "";
        switch (p) {
            case "JENDRAL": return 190000;
            case "KOMJEN": return 180000;
            case "IRJEN": return 175000;
            case "BRIGJEN": return 170000;
            case "KOMBESPOL": return 165000;
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

    const baseSalary = useMemo(() => getGajiByRank(realtimeData?.pangkat), [realtimeData?.pangkat]);

    const fetchHistoryAndReports = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const discordId = user.user_metadata?.provider_id || user.id;

        const { data: historyData } = await supabase.from('pengajuan_gaji').select('*').eq('user_id_discord', discordId).order('created_at', { ascending: false });
        if (historyData) setHistory(historyData as PengajuanGaji[]);

        const { data: reportsData } = await supabase.from('laporan_aktivitas')
            .select('created_at')
            .eq('user_id_discord', discordId)
            .eq('jenis_laporan', 'Penilangan')
            .eq('status', 'APPROVED');
        if (reportsData) setUserReports(reportsData as UserReport[]);
    };

    useEffect(() => { fetchHistoryAndReports(); }, []);

    const divisiUser = realtimeData?.divisi?.toUpperCase() || "";
    const isSatlantas = divisiUser.includes('SATLANTAS');

    const bonusPotential = (divisiUser.includes('SATLANTAS') || divisiUser.includes('SABHARA')) ? 35000 :
        (divisiUser.includes('BRIMOB') || divisiUser.includes('PROPAM')) ? 50000 : 0;

    const TARGET_TILANG = 15;

    const targetProgress = useMemo(() => {
        if (!range.from || !range.to) return 0;
        const endRange = endOfDay(range.to);
        return userReports.filter(r => {
            const reportDate = parseISO(r.created_at);
            return reportDate >= range.from! && reportDate <= endRange;
        }).length;
    }, [range, userReports]);

    const isTargetMet = isSatlantas ? targetProgress >= TARGET_TILANG : false;
    const earnedBonus = isTargetMet ? bonusPotential : 0;

    const selectedWeeksCount = useMemo(() => {
        if (!range.from || !range.to) return 1;
        const startDayObj = startOfDay(range.from);
        const endDayObj = startOfDay(range.to);
        const diffDays = differenceInDays(endDayObj, startDayObj) + 1;
        return diffDays === 14 ? 2 : 1;
    }, [range]);

    const finalSalary = (baseSalary * selectedWeeksCount) + earnedBonus;

    const days = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const rows = [];
        let day = startDate;
        while (day <= endDate) { rows.push(day); day = addDays(day, 1); }
        return rows;
    }, [currentMonth]);

    const activePeriod = useMemo(() => {
        const nowWIB = getWIBTime();
        const referenceDate = getDay(nowWIB) === 0 ? nowWIB : subWeeks(nowWIB, 1);
        const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
        const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
        return { start, end };
    }, []);

    const handleDateClick = (day: Date) => {
        if (!range.from || (range.from && range.to)) setRange({ from: day, to: null });
        else day < range.from ? setRange({ from: day, to: range.from }) : setRange({ from: range.from, to: day });
    };

    const handleGenerateSalary = async () => {
        if (!range.from || !range.to) {
            showNotif("DATA BELUM LENGKAP", "Harap pilih rentang tanggal pada kalender!", "INFO");
            return;
        }

        setIsVerifying(true);
        try {
            const startDayObj = startOfDay(range.from);
            const endDayObj = startOfDay(range.to);

            if (getDay(startDayObj) !== 1 || getDay(endDayObj) !== 0) {
                showNotif("PILIHAN HARI SALAH", "Pilih periode gaji hari Senin sampai Minggu.", "ERROR");
                setIsVerifying(false); return;
            }

            const diffDays = differenceInDays(endDayObj, startDayObj) + 1;
            if (diffDays !== 7 && diffDays !== 14) {
                showNotif("DURASI TIDAK VALID", "Pengajuan gaji hanya bisa dilakukan per 1 minggu (7 hari) atau maksimal 2 minggu (14 hari).", "ERROR");
                setIsVerifying(false); return;
            }

            if (endDayObj > startOfDay(activePeriod.end)) {
                showNotif("PERIODE BELUM TERCAPAI", "Anda belum bisa mengklaim gaji untuk minggu yang belum selesai. Klaim baru bisa dilakukan pada hari Minggu.", "ERROR");
                setIsVerifying(false); return;
            }

            const maxPastStart = subWeeks(activePeriod.start, 1);
            if (startDayObj < maxPastStart) {
                showNotif("KLAIM KADALUWARSA", "Batas maksimal pengambilan gaji telat adalah 2 minggu ke belakang (x2).", "ERROR");
                setIsVerifying(false); return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            const discordId = user?.user_metadata?.provider_id || user?.id;

            const startStr = format(range.from, 'yyyy-MM-dd') + "T00:00:00+07:00";
            const endStr = format(range.to, 'yyyy-MM-dd') + "T23:59:59+07:00";

            const { data: existing } = await supabase.from('pengajuan_gaji')
                .select('tanggal_mulai, tanggal_selesai')
                .eq('user_id_discord', discordId);

            const isOverlap = existing?.some(c => (range.from! <= new Date(c.tanggal_selesai) && range.to! >= new Date(c.tanggal_mulai)));
            if (isOverlap) {
                showNotif("JANGAN OVER-CLAIM", "Tanggal ini sudah pernah diajukan (Termasuk yang telah PENDING/PAID/DITOLAK). Cek History Log.", "ERROR");
                setIsVerifying(false); return;
            }

            const { error } = await supabase.from('pengajuan_gaji').insert([{
                user_id_discord: discordId,
                nama_panggilan: nickname,
                pangkat: realtimeData?.pangkat || "RECRUIT",
                divisi: realtimeData?.divisi || "SABHARA",
                jumlah_gaji: finalSalary,
                tanggal_mulai: startStr,
                tanggal_selesai: endStr,
                status: 'PENDING'
            }]);

            if (error) throw error;

            showNotif("BERHASIL", "Pengajuan gaji telah dikirim ke Markas Besar!", "SUCCESS");
            setRange({ from: null, to: null }); fetchHistoryAndReports();
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
            showNotif("SISTEM ERROR", errorMsg, "ERROR");
        } finally { setIsVerifying(false); }
    };

    const handleDownloadSlip = async (log: PengajuanGaji) => {
        setDownloadingId(log.id);
        setSelectedSlip(log);

        setTimeout(async () => {
            if (slipRef.current) {
                try {
                    const dataUrl = await toPng(slipRef.current, {
                        cacheBust: true,
                        pixelRatio: 3,
                        backgroundColor: '#09090b'
                    });

                    const link = document.createElement('a');
                    link.download = `MPD_Payslip_${log.nama_panggilan}_${format(new Date(log.tanggal_mulai), 'MMM_yyyy')}.png`;
                    link.href = dataUrl;
                    link.click();

                    showNotif("UNDUHAN SUKSES", "Payslip resmi berhasil diunduh ke perangkat Anda.", "SUCCESS");
                } catch {
                    showNotif("ERROR", "Sistem gagal memproses dan mengekstrak foto slip.", "ERROR");
                } finally {
                    setDownloadingId(null);
                    setSelectedSlip(null);
                }
            }
        }, 500);
    };

    const currentLogs = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(history.length / itemsPerPage);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 pb-32 font-sans text-zinc-100">
            {/* HERO BENTO */}
            <div className="md:col-span-8 bg-gradient-to-br from-zinc-900 via-zinc-900 to-red-950/40 p-6 md:p-8 rounded-2xl border border-zinc-800 relative overflow-hidden shadow-xl shadow-red-950/10 flex flex-col justify-between min-h-[180px]">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                <Activity className="absolute right-6 top-6 w-36 h-36 text-red-500/5 pointer-events-none" />

                <div className="relative z-10 flex items-center gap-5">
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 shadow-inner">
                        <Fingerprint size={36} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-xs font-medium tracking-widest text-red-400 uppercase">Finance System Ready</p>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase">PAYROLL</h1>
                        <p className="text-sm text-zinc-400 mt-1">Officer: <span className="text-zinc-200 font-semibold">{nickname}</span></p>
                    </div>
                </div>
            </div>

            {/* STATS & DYNAMIC BONUS PANEL */}
            <div className="md:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
                <div className="p-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-3">
                        <div className="p-2 bg-zinc-800/80 rounded-lg text-red-400">
                            <Wallet size={20} />
                        </div>
                        <span className="text-[10px] font-semibold tracking-wider bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full uppercase">
                            {realtimeData?.pangkat || 'RECRUIT'}
                        </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Base Salary {selectedWeeksCount > 1 ? '(x2 Weeks)' : ''}</p>
                    <h2 className="text-3xl font-bold tracking-tight text-white mt-1">${(baseSalary * selectedWeeksCount).toLocaleString()}</h2>
                </div>

                <div className="bg-zinc-950/80 p-5 border-t border-zinc-800 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Performance Bonus</p>
                        <span className="text-sm font-bold text-red-400">+${earnedBonus.toLocaleString()}</span>
                    </div>

                    {isSatlantas ? (
                        range.from && range.to ? (
                            <div className="mt-2 space-y-2">
                                <div className="flex justify-between text-xs font-medium text-zinc-400">
                                    <span>Target {TARGET_TILANG} Tilang</span>
                                    <span className={isTargetMet ? "text-red-400 font-semibold" : "text-zinc-500"}>{targetProgress}/{TARGET_TILANG}</span>
                                </div>
                                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((targetProgress / TARGET_TILANG) * 100, 100)}%` }}
                                        className={`h-full rounded-full ${isTargetMet ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-red-500/60'}`}
                                    />
                                </div>
                                {!isTargetMet && <p className="text-[10px] text-red-400/80 mt-1 italic">*Penuhi target dalam rentang tanggal yg dipilih untuk buka bonus.</p>}
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-500 text-center py-2 border border-dashed border-zinc-800 rounded-xl">Pilih rentang tanggal untuk kalkulasi bonus</p>
                        )
                    ) : (
                        <div className="mt-1 border border-zinc-800/80 bg-zinc-900/50 rounded-xl p-2.5 flex items-center justify-center gap-2 text-zinc-500">
                            <Lock size={14} />
                            <p className="text-xs font-medium">System Locked (No Active Target)</p>
                        </div>
                    )}
                </div>

                <div className="bg-zinc-950 p-5 flex justify-between items-end border-t border-zinc-800">
                    <div>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Payout</p>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight mt-0.5">${finalSalary.toLocaleString()}</h2>
                    </div>
                </div>
            </div>

            {/* CALENDAR BENTO */}
            <div className="md:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col text-zinc-100">
                <div className="flex justify-between items-center mb-5 border-b border-zinc-800 pb-4">
                    <h3 className="font-semibold text-sm tracking-wide uppercase text-zinc-200 flex items-center gap-2">
                        <Receipt size={18} className="text-red-500" /> PERIODE (WIB)
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700/50">
                            {format(currentMonth, 'MMMM yyyy', { locale: id })}
                        </span>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 bg-zinc-800/60 border border-zinc-700/50 hover:bg-red-600 hover:border-red-500 rounded-lg transition-all text-zinc-300 hover:text-white">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 bg-zinc-800/60 border border-zinc-700/50 hover:bg-red-600 hover:border-red-500 rounded-lg transition-all text-zinc-300 hover:text-white">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3.5 mb-5">
                    <div className="flex items-center gap-2 mb-1 text-red-400">
                        <AlertTriangle size={14} />
                        <p className="text-xs font-semibold tracking-wider uppercase">Info Aturan Gaji</p>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                        WAJIB pilih tanggal dari hari <b className="text-zinc-200">SENIN sampai MINGGU</b> (Kelipatan 1 atau 2 Minggu). Periode gaji terbaru hanya bisa diklaim jika sudah mencapai/melewati Hari Minggu.
                    </p>
                    <div className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md inline-block">
                        Periode Dapat Diklaim: {format(activePeriod.start, 'dd MMM', { locale: id })} - {format(activePeriod.end, 'dd MMM yyyy', { locale: id })}
                    </div>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl mb-6">
                    <div className="grid grid-cols-7 mb-3 border-b border-zinc-800 pb-2 text-center text-xs font-semibold text-zinc-500">
                        {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (
                            <div key={i} className={i === 6 ? 'text-red-400' : ''}>{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => {
                            const isSelected = (range.from && isSameDay(day, range.from)) || (range.to && isSameDay(day, range.to));
                            const isBetween = range.from && range.to && isWithinInterval(day, { start: range.from, end: range.to });
                            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDateClick(day)}
                                    className={cn(
                                        "h-9 text-xs font-medium rounded-lg transition-all flex items-center justify-center",
                                        isSelected ? 'bg-red-600 text-white font-bold shadow-lg shadow-red-600/30 scale-105 z-10 border border-red-400' : '',
                                        isBetween && !isSelected ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'border border-transparent hover:bg-zinc-800 text-zinc-300',
                                        !isCurrentMonth ? 'opacity-0 pointer-events-none' : 'opacity-100'
                                    )}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    disabled={isVerifying || !range.from || !range.to}
                    onClick={handleGenerateSalary}
                    className="mt-auto w-full bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white py-3.5 px-4 rounded-xl font-semibold shadow-lg shadow-red-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isVerifying ? "Verifying..." : "Kirim Pengajuan"} <Send size={16} />
                </button>
            </div>

            {/* HISTORY LOG */}
            <div className="md:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
                <div className="bg-zinc-950/80 px-6 py-4 border-b border-zinc-800 flex justify-between items-center text-zinc-100">
                    <div className="flex items-center gap-2 font-semibold text-sm tracking-wide uppercase">
                        <FileText size={18} className="text-red-500" />
                        <span>History Log Unit</span>
                    </div>
                    <ShieldCheck size={20} className="text-red-500" />
                </div>

                <div className="p-6 flex-1 space-y-3 min-h-[380px]">
                    <AnimatePresence mode='wait'>
                        <motion.div key={currentPage} className="space-y-3">
                            {currentLogs.length === 0 ? (
                                <div className="text-center py-20 text-zinc-600 font-medium text-sm">Nihil Data</div>
                            ) : currentLogs.map((log) => (
                                <div key={log.id} className="p-4 border border-zinc-800/80 rounded-xl flex justify-between items-center bg-zinc-950/40 hover:border-zinc-700 transition-all">
                                    <div className="space-y-1.5">
                                        <h4 className="text-2xl font-bold tracking-tight text-white">${Number(log.jumlah_gaji).toLocaleString()}</h4>
                                        <p className="text-xs text-zinc-400">
                                            Period: {format(new Date(log.tanggal_mulai), 'dd MMM')} - {format(new Date(log.tanggal_selesai), 'dd MMM')}
                                        </p>

                                        <div className={cn(
                                            "text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-block border uppercase tracking-wider",
                                            log.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                                log.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                        )}>
                                            {log.status === 'PAID' ? 'SUCCESS PAID' :
                                                log.status === 'REJECTED' ? 'REJECTED BY ADMIN' : 'PENDING APPROVAL'}
                                        </div>
                                    </div>

                                    <button
                                        disabled={log.status !== 'PAID' || downloadingId === log.id}
                                        onClick={() => handleDownloadSlip(log)}
                                        className={cn(
                                            "p-3 rounded-xl border transition-all flex items-center justify-center",
                                            log.status === 'PAID'
                                                ? 'bg-red-600/10 border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-500 shadow-md shadow-red-600/10'
                                                : 'bg-zinc-800/40 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                        )}
                                    >
                                        {downloadingId === log.id ? <Loader2 className="animate-spin text-red-400" size={20} /> : log.status === 'PAID' ? <Download size={20} /> : <Lock size={20} />}
                                    </button>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex justify-between items-center text-zinc-400 text-xs">
                    <span className="font-medium">Page {currentPage} of {totalPages || 1}</span>
                    <div className="flex gap-1">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 transition-all text-zinc-300">
                            <ChevronLeft size={16} />
                        </button>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 transition-all text-zinc-300">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ELEMEN TERSEMBUNYI UNTUK GENERATE SLIP */}
            {selectedSlip && (
                <div style={{ position: 'absolute', top: '-4000px', left: '-4000px', zIndex: -100 }}>
                    <div ref={slipRef} className="bg-zinc-950 w-[600px] border border-zinc-800 p-10 space-y-8 text-zinc-100 rounded-3xl font-sans relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-red-400" />
                        
                        <div className="flex justify-between items-start border-b border-zinc-800 pb-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-red-500 font-bold text-xs tracking-widest uppercase"><Shield size={18} /> MPD HQ</div>
                                <h2 className="text-3xl font-extrabold tracking-tight text-white uppercase">OFFICIAL PAYSLIP</h2>
                                <p className="text-xs text-zinc-400 flex items-center gap-1"><MapPin size={12} /> HQ Mandalika • Central District</p>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl font-mono text-xs font-semibold">
                                #MPD-{selectedSlip.id.substring(0, 6).toUpperCase()}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 text-xs">
                            <div className="space-y-4">
                                <div><p className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">Nama Lengkap</p><p className="font-bold text-sm text-zinc-200 mt-0.5">{selectedSlip.nama_panggilan}</p></div>
                                <div><p className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">Pangkat / Divisi</p><p className="font-bold text-sm text-red-400 mt-0.5">{selectedSlip.pangkat} / {selectedSlip.divisi || 'UNIT'}</p></div>
                                <div><p className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">Periode Gaji</p><p className="font-medium text-zinc-300 mt-0.5">{format(new Date(selectedSlip.tanggal_mulai), 'dd MMM')} - {format(new Date(selectedSlip.tanggal_selesai), 'dd MMM yyyy')}</p></div>
                            </div>
                            <div className="space-y-4">
                                <div><p className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">Tanggal Pengajuan</p><p className="font-medium text-zinc-300 mt-0.5">{format(parseISO(selectedSlip.created_at), 'dd MMMM yyyy', { locale: id })}</p></div>
                                <div><p className="text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">Tanggal Pencairan</p><p className="font-medium text-zinc-300 mt-0.5">{format(new Date(), 'dd MMMM yyyy', { locale: id })}</p></div>
                                <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                                    <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">Approved By</p>
                                    <p className="text-xs font-bold text-zinc-200">{selectedSlip.keterangan_admin?.replace('AUTH BY ', '') || 'HIGH COMMAND'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-red-500/20 p-6 rounded-2xl flex justify-between items-center shadow-lg">
                            <div>
                                <p className="text-xs font-semibold uppercase text-red-400 tracking-wider mb-1">Total Net Payout</p>
                                <h3 className="text-4xl font-extrabold text-white tracking-tight">${Number(selectedSlip.jumlah_gaji).toLocaleString()}</h3>
                            </div>
                            <div className="bg-white p-2 rounded-xl shadow-md">
                                <QRCode size={75} value={`AUTH:${selectedSlip.id}`} viewBox={`0 0 256 256`} />
                            </div>
                        </div>

                        <div className="text-center opacity-40 pt-2">
                            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Mandalika Police Department • Official Audit</p>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL NOTIFIKASI MINIMALIST DARK */}
            <AnimatePresence>
                {notif.show && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100">
                            <div className={cn(
                                "p-4 border-b border-zinc-800 flex items-center justify-between",
                                notif.type === 'ERROR' ? 'bg-red-500/10 text-red-400' : notif.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-200'
                            )}>
                                <div className="flex items-center gap-2.5">
                                    {notif.type === 'ERROR' ? <AlertOctagon size={20} /> : notif.type === 'SUCCESS' ? <CheckCircle size={20} /> : <Info size={20} />}
                                    <h3 className="font-semibold text-sm tracking-wide uppercase">{notif.title}</h3>
                                </div>
                                <button onClick={() => setNotif({ ...notif, show: false })} className="text-zinc-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-zinc-300 leading-relaxed">{notif.message}</p>
                                <button
                                    onClick={() => setNotif({ ...notif, show: false })}
                                    className="w-full mt-6 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white shadow-lg shadow-red-600/20 transition-all"
                                >
                                    Mengerti
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}