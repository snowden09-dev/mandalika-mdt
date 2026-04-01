"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import QRCode from "react-qr-code";
import {
    Receipt, Wallet, Zap, User, Send, Download,
    ChevronLeft, ChevronRight, ShieldCheck, Activity,
    AlertTriangle, FileText, Lock, Fingerprint, X,
    AlertOctagon, Info, CheckCircle, Shield, MapPin, Loader2
} from 'lucide-react';
import {
    format, startOfMonth, endOfMonth, startOfWeek,
    endOfWeek, addDays, isSameDay, isWithinInterval,
    addMonths, subMonths, subDays, startOfDay, isBefore, parseISO
} from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from "@/lib/supabase";

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function SectionSalary({ nickname, realtimeData }: { nickname: string, realtimeData: any }) {
    const slipRef = useRef<HTMLDivElement>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [range, setRange] = useState<{ from: Date | null, to: Date | null }>({ from: null, to: null });
    const [history, setHistory] = useState<any[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // --- DOWNLOAD STATE ---
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
        if (p.includes("BHARATU")) return 23000;
        if (p.includes("BHARADA")) return 22000;
        return 23000;
    };

    const baseSalary = useMemo(() => getGajiByRank(realtimeData?.pangkat), [realtimeData?.pangkat]);

    const fetchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const discordId = user.user_metadata?.provider_id || user.id;
        const { data } = await supabase.from('pengajuan_gaji').select('*').eq('user_id_discord', discordId).order('created_at', { ascending: false });
        if (data) setHistory(data);
    };

    useEffect(() => { fetchHistory(); }, []);

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
            const { data: { user } } = await supabase.auth.getUser();
            const discordId = user?.user_metadata?.provider_id || user?.id;
            const startStr = range.from.toISOString();
            const endStr = range.to.toISOString();

            const limitDate = startOfDay(subDays(new Date(), 14));
            if (isBefore(range.from, limitDate)) {
                showNotif("KLAIM KADALUWARSA", "Batas klaim maksimal adalah 2 minggu ke belakang!", "ERROR");
                setIsVerifying(false); return;
            }

            const { data: existing } = await supabase.from('pengajuan_gaji')
                .select('tanggal_mulai, tanggal_selesai')
                .eq('user_id_discord', discordId)
                .not('status', 'eq', 'REJECTED');

            const isOverlap = existing?.some(c => (range.from! <= new Date(c.tanggal_selesai) && range.to! >= new Date(c.tanggal_mulai)));
            if (isOverlap) {
                showNotif("JANGAN OVER-CLAIM", "Anda sudah mengajukan gaji yang mencakup tanggal ini! Cek History Log.", "ERROR");
                setIsVerifying(false); return;
            }

            const { data: duties } = await supabase.from('presensi_duty').select('id').eq('user_id_discord', discordId).gte('start_time', startStr).lte('start_time', endStr);
            const { data: cutis } = await supabase.from('pengajuan_cuti').select('id').eq('user_id_discord', discordId).eq('status', 'APPROVED').gte('tanggal_mulai', startStr).lte('tanggal_selesai', endStr);

            if ((!duties || duties.length === 0) && (!cutis || cutis.length === 0)) {
                showNotif("TIDAK ADA AKTIVITAS", "Sistem tidak menemukan log Duty atau Cuti Approved pada range tanggal tersebut!", "ERROR");
                setIsVerifying(false); return;
            }

            const { error } = await supabase.from('pengajuan_gaji').insert([{
                user_id_discord: discordId,
                nama_panggilan: nickname,
                pangkat: realtimeData?.pangkat || "RECRUIT",
                divisi: realtimeData?.divisi || "SABHARA",
                jumlah_gaji: baseSalary,
                tanggal_mulai: startStr,
                tanggal_selesai: endStr,
                status: 'PENDING'
            }]);

            if (error) throw error;

            showNotif("BERHASIL", "Pengajuan gaji telah dikirim ke Markas Besar!", "SUCCESS");
            setRange({ from: null, to: null }); fetchHistory();
        } catch (err: any) {
            showNotif("SISTEM ERROR", err.message, "ERROR");
        } finally { setIsVerifying(false); }
    };

    // 🚀 LOGIKA DOWNLOAD SLIP GAJI
    const handleDownloadSlip = async (log: any) => {
        setDownloadingId(log.id);
        setSelectedSlip(log);

        // Jeda waktu agar React me-render div tersembunyi terlebih dahulu
        setTimeout(async () => {
            if (slipRef.current) {
                try {
                    const dataUrl = await toPng(slipRef.current, {
                        cacheBust: true,
                        pixelRatio: 3,
                        backgroundColor: '#ffffff'
                    });

                    // Trigger unduhan
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
        }, 500); // 500ms delay for safe rendering
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

            {/* STATS */}
            <div className={`md:col-span-4 bg-[#00E676] p-6 ${boxBorder} ${hardShadow} flex flex-col justify-center text-black`}>
                <Wallet className="mb-4" />
                <p className="text-[10px] font-black uppercase italic opacity-60">Gaji Dasar Pangkat</p>
                <h2 className="text-4xl font-[1000] italic">${baseSalary.toLocaleString()}</h2>
                <p className="text-[8px] font-black opacity-50 uppercase mt-1 italic tracking-widest">{realtimeData?.pangkat || 'RECRUIT'}</p>
            </div>

            {/* CALENDAR BENTO */}
            <div className={`md:col-span-5 bg-[#FFD100] p-6 ${boxBorder} ${hardShadow} flex flex-col text-black`}>
                <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
                    <h3 className="font-[1000] italic uppercase flex items-center gap-2"><Receipt size={20} /> TANGGAL DUTY</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-white border-2 border-black hover:bg-black group transition-all"><ChevronLeft size={16} className="group-hover:text-white" /></button>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-white border-2 border-black hover:bg-black group transition-all"><ChevronRight size={16} className="group-hover:text-white" /></button>
                    </div>
                </div>

                {/* MANDATORY NOTE */}
                <div className="bg-black text-[#A3E635] border-2 border-black p-3 mb-4 shadow-[4px_4px_0px_#FFF]">
                    <div className="flex items-center gap-2 border-b border-[#A3E635]/30 pb-1 mb-1">
                        <AlertTriangle size={14} />
                        <p className="text-[10px] font-black uppercase italic tracking-widest text-[#A3E635]">Mandatory Note</p>
                    </div>
                    <p className="text-[9px] font-black leading-tight uppercase">
                        PILIH RANGE GAJI SEMINGGU (SENIN-MINGGU). RADAR MDT AKAN MEMVERIFIKASI LOG DUTY. JANGAN OVER-CLAIM ATAU MAKSIMAL 2 MINGGU KEBELAKANG. PELANGGARAN = BLOKIR PAYROLL!
                    </p>
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
                                <div key={log.id} className="p-4 border-4 border-black flex justify-between items-center bg-slate-50 text-black shadow-inner">
                                    <div>
                                        <h4 className="text-2xl font-[1000] italic leading-none">${Number(log.jumlah_gaji).toLocaleString()}</h4>
                                        <p className="text-[10px] font-black opacity-40 italic mt-1 uppercase">Period: {format(new Date(log.tanggal_mulai), 'dd MMM')} - {format(new Date(log.tanggal_selesai), 'dd MMM')}</p>
                                        <div className={cn("text-[8px] font-[1000] px-2 py-1 mt-2 inline-block italic border border-black shadow-[2px_2px_0_0_#000]", log.status === 'PAID' ? 'bg-[#00E676]' : 'bg-[#FFD100]')}>{log.status === 'PAID' ? 'SUCCESS PAID' : 'PENDING APPROVAL'}</div>
                                    </div>
                                    <button
                                        disabled={log.status !== 'PAID' || downloadingId === log.id}
                                        onClick={() => handleDownloadSlip(log)}
                                        className={cn("w-14 h-14 border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center", log.status === 'PAID' ? 'bg-[#00E676] hover:bg-[#3B82F6]' : 'bg-slate-200 opacity-50 cursor-not-allowed')}
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

            {/* --- ELEMEN TERSEMBUNYI UNTUK GENERATE SLIP (SAMA PERSIS DENGAN ADMIN) --- */}
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