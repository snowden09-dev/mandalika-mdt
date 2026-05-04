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

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// 🚀 ENGINE MUTLAK WIB (UTC+7)
const getWIBTime = () => {
    const d = new Date();
    const localTime = d.getTime();
    const localOffset = d.getTimezoneOffset() * 60000;
    const utc = localTime + localOffset;
    const wibOffset = 7 * 3600000; // +7 Jam (WIB)
    return new Date(utc + wibOffset);
};

export default function SectionSalary({ nickname, realtimeData }: { nickname: string, realtimeData: any }) {
    const slipRef = useRef<HTMLDivElement>(null);
    const [currentMonth, setCurrentMonth] = useState(getWIBTime());
    const [range, setRange] = useState<{ from: Date | null, to: Date | null }>({ from: null, to: null });
    const [history, setHistory] = useState<any[]>([]);
    const [userReports, setUserReports] = useState<any[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [selectedSlip, setSelectedSlip] = useState<any>(null);

    const [notif, setNotif] = useState<{ show: boolean, title: string, message: string, type: 'ERROR' | 'SUCCESS' | 'INFO' }>({
        show: false, title: '', message: '', type: 'INFO'
    });

    const boxBorder = "border-[4px] border-black";
    const hardShadow = "shadow-[8px_8px_0px_#000]";

    const showNotif = (title: string, message: string, type: 'ERROR' | 'SUCCESS' | 'INFO') => {
        setNotif({ show: true, title, message, type });
    };

    const getGajiByRank = (pangkat: string) => {
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
        if (historyData) setHistory(historyData);

        const { data: reportsData } = await supabase.from('laporan_aktivitas')
            .select('created_at')
            .eq('user_id_discord', discordId)
            .eq('jenis_laporan', 'Penilangan')
            .eq('status', 'APPROVED');
        if (reportsData) setUserReports(reportsData);
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

            // 🚀 BUG FIXED: Format jam untuk range.to dikunci di 00:00:00 untuk mencegah Admin System membaca sebagai hari ke-8
            const startStr = format(range.from, 'yyyy-MM-dd') + "T00:00:00+07:00";
            const endStr = format(range.to, 'yyyy-MM-dd') + "T00:00:00+07:00";

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
        } catch (err: any) {
            showNotif("SISTEM ERROR", err.message, "ERROR");
        } finally { setIsVerifying(false); }
    };

    const handleDownloadSlip = async (log: any) => {
        setDownloadingId(log.id);
        setSelectedSlip(log);

        setTimeout(async () => {
            if (slipRef.current) {
                try {
                    const dataUrl = await toPng(slipRef.current, {
                        cacheBust: true,
                        pixelRatio: 3,
                        backgroundColor: '#ffffff'
                    });

                    const link = document.createElement('a');
                    link.download = `MPD_Payslip_${log.nama_panggilan}_${format(new Date(log.tanggal_mulai), 'MMM_yyyy')}.png`;
                    link.href = dataUrl;
                    link.click();

                    showNotif("UNDUHAN SUKSES", "Payslip resmi berhasil diunduh ke perangkat Anda.", "SUCCESS");
                } catch (error) {
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6 pb-32 font-mono">
            {/* HERO BENTO */}
            <div className={`md:col-span-8 bg-[#3B82F6] p-8 ${boxBorder} ${hardShadow} relative overflow-hidden`}>
                <Activity className="absolute -right-8 -top-8 w-48 h-48 text-black opacity-10 rotate-12" />
                <div className="relative z-10 flex items-center gap-6">
                    <div className="bg-black p-4 border-4 border-white"><Fingerprint size={48} className="text-[#00E676]" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase italic bg-black text-[#00E676] px-2 py-0.5 inline-block mb-2 tracking-widest">Finance System Ready</p>
                        <h1 className="text-4xl md:text-6xl font-[1000] italic tracking-tighter uppercase leading-none text-black">PAYROLL</h1>
                        <p className="font-black text-black opacity-60 text-sm mt-2 italic">Officer: {nickname}</p>
                    </div>
                </div>
            </div>

            {/* STATS & DYNAMIC BONUS PANEL */}
            <div className={`md:col-span-4 bg-[#00E676] ${boxBorder} ${hardShadow} flex flex-col overflow-hidden text-black`}>
                <div className="p-5 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <Wallet size={24} />
                        <span className="text-[9px] font-[1000] bg-black text-white px-2 py-1 italic uppercase tracking-widest">{realtimeData?.pangkat || 'RECRUIT'}</span>
                    </div>
                    <p className="text-[10px] font-black uppercase italic opacity-60 mt-2">Base Salary {selectedWeeksCount > 1 ? '(x2 Weeks)' : ''}</p>
                    <h2 className="text-3xl font-[1000] italic">${(baseSalary * selectedWeeksCount).toLocaleString()}</h2>
                </div>

                <div className="bg-slate-950 text-white p-5 flex flex-col border-t-[4px] border-black relative">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-black uppercase italic text-[#FFD100]">Performance Bonus</p>
                        <span className="text-sm font-[1000] italic text-[#A3E635]">+${earnedBonus.toLocaleString()}</span>
                    </div>

                    {isSatlantas ? (
                        range.from && range.to ? (
                            <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400">
                                    <span>Target {TARGET_TILANG} Tilang</span>
                                    <span className={isTargetMet ? "text-[#00E676]" : "text-slate-400"}>{targetProgress}/{TARGET_TILANG}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 border border-black rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((targetProgress / TARGET_TILANG) * 100, 100)}%` }}
                                        className={`h-full ${isTargetMet ? 'bg-[#00E676]' : 'bg-[#F97316]'}`}
                                    />
                                </div>
                                {!isTargetMet && <p className="text-[8px] text-red-400 mt-1 italic uppercase">*Penuhi target dalam rentang tanggal yg dipilih untuk buka bonus.</p>}
                            </div>
                        ) : (
                            <p className="text-[9px] font-black uppercase text-slate-500 mt-1 border-2 border-slate-800 border-dashed p-2 text-center">Pilih rentang tanggal untuk kalkulasi bonus</p>
                        )
                    ) : (
                        <div className="mt-2 border-2 border-slate-800 border-dashed p-2 flex items-center justify-center gap-2">
                            <Lock size={12} className="text-slate-500" />
                            <p className="text-[8px] font-black uppercase text-slate-500">System Locked (No Active Target)</p>
                        </div>
                    )}
                </div>

                <div className="bg-white p-4 flex justify-between items-end border-t-[4px] border-black">
                    <p className="text-[10px] font-[1000] uppercase italic opacity-60">Total Payout</p>
                    <h2 className="text-4xl font-[1000] italic leading-none">${finalSalary.toLocaleString()}</h2>
                </div>
            </div>

            {/* CALENDAR BENTO */}
            <div className={`md:col-span-5 bg-[#FFD100] p-6 ${boxBorder} ${hardShadow} flex flex-col text-black`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-4 border-black pb-4 gap-3">
                    <h3 className="font-[1000] italic uppercase flex items-center gap-2"><Receipt size={20} /> PERIODE (WIB)</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-[1000] uppercase tracking-widest bg-black text-[#FFD100] px-3 py-1 border-2 border-black">
                            {format(currentMonth, 'MMMM yyyy', { locale: id })}
                        </span>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 bg-white border-2 border-black hover:bg-black group transition-all"><ChevronLeft size={16} className="group-hover:text-white" /></button>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 bg-white border-2 border-black hover:bg-black group transition-all"><ChevronRight size={16} className="group-hover:text-white" /></button>
                        </div>
                    </div>
                </div>

                <div className="bg-black text-[#A3E635] border-2 border-black p-3 mb-4 shadow-[4px_4px_0px_#FFF]">
                    <div className="flex items-center gap-2 border-b border-[#A3E635]/30 pb-1 mb-2">
                        <AlertTriangle size={14} />
                        <p className="text-[10px] font-black uppercase italic tracking-widest text-[#A3E635]">Info Aturan Gaji</p>
                    </div>
                    <p className="text-[9px] font-black leading-relaxed uppercase mb-2">
                        WAJIB pilih tanggal dari hari <b>SENIN sampai MINGGU</b> (Kelipatan 1 atau 2 Minggu).
                        Periode gaji terbaru hanya bisa diklaim jika sudah mencapai/melewati Hari Minggu.
                    </p>
                    <div className="bg-[#A3E635] text-black px-2 py-1 inline-block font-black text-[9px] uppercase italic border border-[#A3E635]">
                        Periode Dapat Diklaim: {format(activePeriod.start, 'dd MMM', { locale: id })} - {format(activePeriod.end, 'dd MMM yyyy', { locale: id })}
                    </div>
                </div>

                <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0_0_#000] mb-6">
                    <div className="grid grid-cols-7 mb-4 border-b-2 border-black pb-2 text-center font-[1000] text-[11px]">
                        {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (<div key={i} className={i === 6 ? 'text-[#FF4D4D]' : 'text-black'}>{d}</div>))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => {
                            const isSelected = (range.from && isSameDay(day, range.from)) || (range.to && isSameDay(day, range.to));
                            const isBetween = range.from && range.to && isWithinInterval(day, { start: range.from, end: range.to });
                            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                            return (
                                <button key={i} onClick={() => handleDateClick(day)} className={cn("h-10 text-xs font-[1000] border-2 transition-all flex items-center justify-center", isSelected ? 'bg-black text-white border-black scale-110 z-10 shadow-[2px_2px_0_0_#00E676]' : '', isBetween && !isSelected ? 'bg-[#A3E635] border-black text-black' : 'border-transparent hover:border-black', !isCurrentMonth ? 'opacity-0 pointer-events-none' : 'opacity-100 text-black')}>{format(day, 'd')}</button>
                            );
                        })}
                    </div>
                </div>
                <button disabled={isVerifying || !range.from || !range.to} onClick={handleGenerateSalary} className="mt-auto w-full bg-black text-[#A3E635] py-4 font-[1000] italic uppercase shadow-[6px_6px_0_0_#FF4D4D] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3">{isVerifying ? "Verifying..." : "Kirim Pengajuan"} <Send size={18} /></button>
            </div>

            {/* HISTORY LOG */}
            <div className={`md:col-span-7 bg-white ${boxBorder} ${hardShadow} flex flex-col`}>
                <div className="bg-black text-white p-4 font-[1000] italic uppercase flex justify-between items-center">
                    <div className="flex items-center gap-2"><FileText size={18} /> <span>History Log Unit</span></div>
                    <ShieldCheck className="text-[#00E676]" />
                </div>
                <div className="p-6 flex-1 space-y-4 min-h-[400px]">
                    <AnimatePresence mode='wait'>
                        <motion.div key={currentPage} className="space-y-4">
                            {currentLogs.length === 0 ? (<div className="text-center py-20 opacity-20 font-black italic uppercase text-black">Nihil Data</div>) : currentLogs.map((log) => (
                                <div key={log.id} className="p-4 border-4 border-black flex justify-between items-center bg-slate-50 text-black shadow-inner relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h4 className="text-2xl font-[1000] italic leading-none">${Number(log.jumlah_gaji).toLocaleString()}</h4>
                                        <p className="text-[10px] font-black opacity-40 italic mt-1 uppercase">Period: {format(new Date(log.tanggal_mulai), 'dd MMM')} - {format(new Date(log.tanggal_selesai), 'dd MMM')}</p>

                                        <div className={cn("text-[8px] font-[1000] px-2 py-1 mt-2 inline-block italic border border-black shadow-[2px_2px_0_0_#000]",
                                            log.status === 'PAID' ? 'bg-[#00E676] text-black' :
                                                log.status === 'REJECTED' ? 'bg-[#FF4D4D] text-white' : 'bg-[#FFD100] text-black')}
                                        >
                                            {log.status === 'PAID' ? 'SUCCESS PAID' :
                                                log.status === 'REJECTED' ? 'REJECTED BY ADMIN' : 'PENDING APPROVAL'}
                                        </div>

                                    </div>
                                    <button
                                        disabled={log.status !== 'PAID' || downloadingId === log.id}
                                        onClick={() => handleDownloadSlip(log)}
                                        className={cn("relative z-10 w-14 h-14 border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center", log.status === 'PAID' ? 'bg-[#00E676] hover:bg-[#3B82F6]' : 'bg-slate-200 opacity-50 cursor-not-allowed')}
                                    >
                                        {downloadingId === log.id ? <Loader2 className="animate-spin text-black" size={24} /> : log.status === 'PAID' ? <Download size={24} /> : <Lock size={24} />}
                                    </button>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="p-4 bg-black flex justify-between items-center mt-auto text-[#A3E635]">
                    <span className="text-[10px] font-black italic uppercase">Page {currentPage} of {totalPages || 1}</span>
                    <div className="flex gap-2 text-black">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="bg-white p-1 disabled:opacity-30"><ChevronLeft size={16} /></button>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="bg-white p-1 disabled:opacity-30"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            {/* --- ELEMEN TERSEMBUNYI UNTUK GENERATE SLIP --- */}
            {selectedSlip && (
                <div style={{ position: 'absolute', top: '-4000px', left: '-4000px', zIndex: -100 }}>
                    <div ref={slipRef} className="bg-white w-[600px] border-[10px] border-black p-12 space-y-10 text-slate-950 font-mono">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-[8px] border-black pb-8">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-blue-600 mb-2 font-black italic text-sm tracking-[0.3em]"><Shield size={24} /> MPD HQ</div>
                                <h2 className="text-5xl font-[1000] italic tracking-tighter leading-none text-slate-950">OFFICIAL PAYSLIP</h2>
                                <p className="text-xs font-black uppercase opacity-40 italic text-slate-900"><MapPin size={12} className="inline mr-1" /> HQ Mandalika • Central District</p>
                            </div>
                            <div className="bg-black text-white px-5 py-3 rounded-xl font-black italic text-xs">#MPD-{selectedSlip.id.substring(0, 6).toUpperCase()}</div>
                        </div>

                        {/* DETAIL LENGKAP */}
                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Nama Lengkap</p><p className="font-black text-xl uppercase italic border-b-4 border-black/5">{selectedSlip.nama_panggilan}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Pangkat / Divisi</p><p className="font-black text-xl uppercase italic text-blue-600 border-b-4 border-black/5">{selectedSlip.pangkat} / {selectedSlip.divisi || 'UNIT'}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Periode Gaji</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(new Date(selectedSlip.tanggal_mulai), 'dd MMM')} - {format(new Date(selectedSlip.tanggal_selesai), 'dd MMM yyyy')}</p></div>
                            </div>
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Tanggal Pengajuan</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(parseISO(selectedSlip.created_at), 'dd MMMM yyyy', { locale: id })}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Tanggal Pencairan</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(new Date(), 'dd MMMM yyyy', { locale: id })}</p></div>
                                <div className="bg-slate-50 border-4 border-dashed border-black p-4 rounded-xl text-center">
                                    <p className="text-[9px] font-black uppercase opacity-30 leading-none mb-1 text-slate-900">Approved By</p>
                                    <p className="text-[11px] font-black uppercase leading-none">{selectedSlip.keterangan_admin?.replace('AUTH BY ', '') || 'HIGH COMMAND'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payout & QR */}
                        <div className="bg-slate-950 p-8 rounded-[35px] flex justify-between items-center shadow-[10px_10px_0px_#00E676]">
                            <div><p className="text-xs font-black uppercase text-white/40 italic tracking-[0.4em] mb-1">Total Net Payout</p><h3 className="text-6xl font-[1000] text-[#00E676] italic tracking-tighter leading-none">${Number(selectedSlip.jumlah_gaji).toLocaleString()}</h3></div>
                            <div className="bg-white p-2 border-4 border-black">
                                <QRCode size={85} value={`AUTH:${selectedSlip.id}`} viewBox={`0 0 256 256`} />
                            </div>
                        </div>

                        <div className="flex justify-center opacity-10 pt-4">
                            <p className="text-[9px] font-black uppercase tracking-[1em]">Mandalika Police Department • Official Audit</p>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL NOTIFIKASI NEO-BRUTALISM */}
            <AnimatePresence>
                {notif.show && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, rotate: 2 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.9, opacity: 0 }} className={`w-full max-w-sm bg-white ${boxBorder} ${hardShadow} overflow-hidden`}>
                            <div className={cn("p-4 border-b-4 border-black flex items-center justify-between", notif.type === 'ERROR' ? 'bg-[#FF4D4D]' : notif.type === 'SUCCESS' ? 'bg-[#00E676]' : 'bg-[#3B82F6]')}>
                                <div className="flex items-center gap-3 text-black">
                                    {notif.type === 'ERROR' ? <AlertOctagon size={24} /> : notif.type === 'SUCCESS' ? <CheckCircle size={24} /> : <Info size={24} />}
                                    <h3 className="font-[1000] italic uppercase tracking-widest">{notif.title}</h3>
                                </div>
                                <button onClick={() => setNotif({ ...notif, show: false })} className="text-black hover:scale-125 transition-transform"><X size={24} strokeWidth={3} /></button>
                            </div>
                            <div className="p-6">
                                <p className="text-sm font-black uppercase italic leading-relaxed text-black">{notif.message}</p>
                                <button onClick={() => setNotif({ ...notif, show: false })} className={cn("w-full mt-6 py-3 border-[3px] border-black font-black uppercase italic shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all", notif.type === 'ERROR' ? 'bg-[#FF4D4D]' : notif.type === 'SUCCESS' ? 'bg-[#00E676]' : 'bg-[#3B82F6]')}>Mengerti!</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}