"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import QRCode from "react-qr-code";
import {
    Trash2, Eye, X, AlertOctagon, Shield, MapPin, Database, Loader2, Send
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { id as localeId } from "date-fns/locale";
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

    const financialStats = useMemo(() => {
        if (!requests || requests.length === 0) return { weeklyPaid: 0, totalPending: 0, forecast: 0 };

        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });

        const weeklyPaid = requests.filter(r => r.status === 'PAID' && isWithinInterval(new Date(r.created_at), { start, end }))
            .reduce((sum, r) => sum + Number(r.jumlah_gaji), 0);

        const totalPending = requests.filter(r => r.status === 'PENDING')
            .reduce((sum, r) => sum + Number(r.jumlah_gaji), 0);

        const latestSalaries = new Map<string, number>();
        requests.forEach(req => {
            if (req.user_id_discord && req.status === 'PAID' && !latestSalaries.has(req.user_id_discord)) {
                latestSalaries.set(req.user_id_discord, Number(req.jumlah_gaji));
            }
        });

        let forecast = 0;
        latestSalaries.forEach((gaji) => { forecast += gaji; });

        return { weeklyPaid, totalPending, forecast };
    }, [requests]);

    const filteredData = useMemo(() => {
        if (activeTab === 'NOT_SENT') return requests.filter(r => r.status === 'PAID' && !r.bukti_transfer);
        return requests.filter(r => r.status === activeTab);
    }, [requests, activeTab]);

    // 🚀 ENGINE GENERATOR SLIP GAJI
    const handleOpenAndCapture = async (req: any) => {
        setCurrentSlipData(req);
        setIsGenerating(true);
        setCapturedImg(null);

        const tId = toast.loading("Mencetak Dokumen Payslip...");

        // Memberikan waktu agar React me-render div tersembunyi dengan sempurna
        setTimeout(async () => {
            if (!slipRef.current) {
                toast.error("Gagal inisialisasi mesin cetak.", { id: tId });
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
                toast.success("Payslip Berhasil Dicetak!", { id: tId });
            } catch (err) {
                console.error(err);
                toast.error("Sistem gagal mengambil foto slip.", { id: tId });
                setCurrentSlipData(null);
            } finally {
                setIsGenerating(false);
            }
        }, 800); // Waktu di-extend sedikit agar QR Code dan Font me-render sempurna
    };

    // 🚀 ENGINE PENGIRIMAN DISCORD DINAMIS
    const handleTransmit = async () => {
        if (!capturedImg || !currentSlipData) return;

        setIsTransmitting(true);
        const tId = toast.loading("Menghubungkan ke HQ Discord...");

        try {
            // 1. Ambil config Webhook dari Database (Jika ada)
            const { data: configData } = await supabase.from('admin_config').select('key, value').in('key', ['webhook_payroll', 'thread_payroll']);

            // 2. Set Link & Thread (Gunakan fallback default jika tabel/data belum ada)
            const WEBHOOK_URL = configData?.find(c => c.key === 'webhook_payroll')?.value || "https://discord.com/api/webhooks/1486137739022700634/m9jKqS2O9DV8L8DcaHgIVGSI1yriyKwYAECgul6Te3W2S-t5isC9r_5x13Zcu-VaT20O";
            const THREAD_ID = configData?.find(c => c.key === 'thread_payroll')?.value || "1467455553214353440";

            // 3. Konversi Base64 gambar ke File Blob
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

            // 4. Kirim ke Discord
            const res = await fetch(`${WEBHOOK_URL}?thread_id=${THREAD_ID}`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                // Update status bahwa bukti gambar sudah dikirim
                await supabase.from('pengajuan_gaji').update({ bukti_transfer: 'SENT_AS_IMAGE_QR' }).eq('id', currentSlipData.id);
                toast.success("PAYSLIP TERKIRIM KE DISCORD!", { id: tId });
                setCapturedImg(null);
                setCurrentSlipData(null);
                fetchData();
            } else { throw new Error("Discord Webhook Menolak Permintaan"); }

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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div className={`col-span-2 md:col-span-1 bg-[#3B82F6] p-5 md:p-6 ${boxBorder} ${hardShadow} rounded-[20px] md:rounded-3xl text-white`}>
                    <p className="text-[10px] font-black uppercase opacity-80">System Forecast (Based on Previous Data)</p>
                    <h3 className="text-3xl md:text-4xl font-[1000] italic mt-1 leading-none truncate">${financialStats.forecast.toLocaleString()}</h3>
                </div>
                <div className={`bg-[#FFD100] p-5 md:p-6 ${boxBorder} ${hardShadow} rounded-[20px] md:rounded-3xl`}>
                    <p className="text-[10px] font-black uppercase opacity-60">Pending</p>
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
                    {activeTab !== 'PENDING' && (
                        <button onClick={() => setDeleteModal({ show: true, type: 'ALL' })} className="md:hidden bg-red-500 text-white p-2 rounded-lg border-2 border-black active:translate-y-1"><Trash2 size={16} /></button>
                    )}
                </div>

                <div className="flex w-full md:w-auto items-center gap-2">
                    <div className="flex flex-1 md:flex-none bg-slate-100 p-1.5 rounded-xl border-2 border-black gap-1 overflow-x-auto custom-scrollbar">
                        {['PENDING', 'NOT_SENT', 'PAID', 'REJECTED'].map((t) => (
                            <button key={t} onClick={() => setActiveTab(t as any)} className={cn("px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase italic whitespace-nowrap", activeTab === t ? "bg-[#00E676] border-2 border-black shadow-[2px_2px_0px_#000]" : "opacity-40")}>{t.replace('_', ' ')}</button>
                        ))}
                    </div>
                    {activeTab !== 'PENDING' && (
                        <button onClick={() => setDeleteModal({ show: true, type: 'ALL' })} className="hidden md:flex bg-red-500 text-white p-2.5 rounded-xl border-2 border-black hover:scale-110 transition-all shadow-[2px_2px_0px_#000] active:translate-y-1 active:shadow-none"><Trash2 size={20} /></button>
                    )}
                </div>
            </div>

            {!loading && (
                filteredData.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-10 md:p-20 flex flex-col items-center justify-center text-center mt-8`}>
                        <div className="bg-slate-100 p-5 md:p-6 border-[3.5px] border-slate-900 rounded-3xl mb-4 shadow-[6px_6px_0_0_#000]">
                            <Database size={56} className="text-slate-400" />
                        </div>
                        <h3 className="text-2xl md:text-4xl font-[1000] italic uppercase tracking-tighter text-slate-900">NIHIL DATA</h3>
                        <p className="text-xs font-black uppercase opacity-50 mt-2 max-w-sm">Saat ini tidak ada laporan di antrian <span className="text-blue-500">{activeTab.replace('_', ' ')}</span>.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {filteredData.map((req) => (
                            <div key={req.id} className={`bg-white ${boxBorder} ${hardShadow} rounded-[20px] md:rounded-[25px] overflow-hidden flex flex-col group relative`}>
                                <button onClick={() => setDeleteModal({ show: true, type: 'SINGLE', id: req.id })} className="absolute top-2 right-2 z-20 bg-white/10 hover:bg-red-500 hover:text-white p-1.5 rounded-lg border-2 border-black opacity-0 group-hover:opacity-100 transition-all text-slate-950"><X size={14} /></button>

                                <div className="bg-slate-950 text-white p-4 md:p-5 flex justify-between items-center border-b-4 border-black">
                                    <div className="overflow-hidden mr-2">
                                        <h4 className="font-black uppercase italic leading-none truncate text-sm md:text-base">{req.nama_panggilan}</h4>
                                        <p className="text-[9px] font-bold text-blue-400 mt-1 uppercase italic">{req.pangkat}</p>
                                    </div>
                                    <div className="text-[#00E676] font-black text-lg md:text-xl italic leading-none tracking-tighter shrink-0">${Number(req.jumlah_gaji).toLocaleString()}</div>
                                </div>

                                <div className="p-4 md:p-6 flex-1 flex flex-col space-y-4">
                                    <div className="bg-slate-50 border-2 border-black p-2 md:p-3 rounded-xl text-center font-black text-[9px] md:text-[10px] italic text-slate-900 uppercase">
                                        {format(new Date(req.tanggal_mulai), 'dd MMM')} — {format(new Date(req.tanggal_selesai), 'dd MMM yyyy')}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 md:gap-3 mt-auto">
                                        {activeTab === 'PENDING' ? (
                                            <>
                                                <button onClick={() => handleAction(req.id, 'REJECTED')} className="bg-[#FF4D4D] border-2 border-black py-2.5 md:py-2 rounded-xl font-black text-[9px] md:text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 text-slate-950">Deny</button>
                                                <button onClick={() => handleAction(req.id, 'PAID')} className="bg-[#00E676] border-2 border-black py-2.5 md:py-2 rounded-xl font-black text-[9px] md:text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 text-slate-950">Approve</button>
                                            </>
                                        ) : activeTab === 'NOT_SENT' ? (
                                            <button disabled={isGenerating} onClick={() => handleOpenAndCapture(req)} className="col-span-2 bg-blue-500 text-white border-2 border-black py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase flex justify-center items-center gap-2 shadow-[4px_4px_0px_#000] active:translate-y-1 disabled:opacity-50">
                                                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Eye size={16} />} Buka & Kirim Slip
                                            </button>
                                        ) : (
                                            <div className="col-span-2 text-center text-[10px] font-black opacity-20 uppercase italic text-slate-950 py-1">Recorded</div>
                                        )}
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
                                <button disabled={!capturedImg || isTransmitting} onClick={handleTransmit} className="w-full bg-[#00E676] text-black py-5 rounded-2xl font-[1000] uppercase italic text-sm shadow-[6px_6px_0px_#000] border-[3.5px] border-black flex items-center justify-center gap-4 active:translate-y-1 transition-all disabled:opacity-50">
                                    <Send size={20} strokeWidth={3} /> {isTransmitting ? "MENGIRIM..." : "KIRIM KE DISCORD"}
                                </button>
                                <button onClick={() => { setCurrentSlipData(null); setCapturedImg(null); }} className="text-white text-[10px] font-black uppercase italic opacity-50 hover:opacity-100 transition-opacity">Batal & Tutup</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- ELEMEN TERSEMBUNYI UNTUK GENERATOR GAMBAR HTML-TO-IMAGE --- */}
            {/* 🚀 Menggunakan fixed top-[-9999px] agar browser bisa render sempurna sebelum difoto */}
            {currentSlipData && (
                <div className="fixed top-[-9999px] left-[-9999px] opacity-0 pointer-events-none z-[-1000]">
                    <div ref={slipRef} className="bg-white w-[600px] border-[10px] border-black p-12 space-y-10 text-slate-950 font-mono">
                        {/* Header Slip */}
                        <div className="flex justify-between items-start border-b-[8px] border-black pb-8">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-blue-600 mb-2 font-black italic text-sm tracking-[0.3em]"><Shield size={24} /> MPD HQ</div>
                                <h2 className="text-5xl font-[1000] italic tracking-tighter leading-none text-slate-950">PAYSLIP RESMI</h2>
                                <p className="text-xs font-black uppercase opacity-40 italic text-slate-900"><MapPin size={12} className="inline mr-1" /> HQ Mandalika • Central District</p>
                            </div>
                            <div className="bg-black text-white px-5 py-3 rounded-xl font-black italic text-xs">#MPD-{currentSlipData.id.substring(0, 6).toUpperCase()}</div>
                        </div>

                        {/* DETAIL LENGKAP KARYAWAN */}
                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Nama Personel</p><p className="font-black text-xl uppercase italic border-b-4 border-black/5">{currentSlipData.nama_panggilan}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Pangkat / Divisi</p><p className="font-black text-xl uppercase italic text-blue-600 border-b-4 border-black/5">{currentSlipData.pangkat} / {currentSlipData.divisi || 'UNIT'}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Periode Gaji</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(new Date(currentSlipData.tanggal_mulai), 'dd MMM')} - {format(new Date(currentSlipData.tanggal_selesai), 'dd MMM yyyy')}</p></div>
                            </div>
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Tanggal Pengajuan</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(parseISO(currentSlipData.created_at), 'dd MMMM yyyy', { locale: localeId })}</p></div>
                                <div><p className="text-[10px] font-black uppercase opacity-40 italic">Tanggal Pencairan</p><p className="font-black text-sm uppercase italic border-b-4 border-black/5">{format(new Date(), 'dd MMMM yyyy', { locale: localeId })}</p></div>
                                <div className="bg-slate-50 border-4 border-dashed border-black p-4 rounded-xl text-center">
                                    <p className="text-[9px] font-black uppercase opacity-30 leading-none mb-1 text-slate-900">Approved By</p>
                                    <p className="text-[11px] font-black uppercase leading-none text-blue-600">{currentSlipData.keterangan_admin?.replace('AUTH BY ', '') || adminSession?.name || 'HIGH COMMAND'}</p>
                                </div>
                            </div>
                        </div>

                        {/* PAYOUT TOTAL & QR CODE */}
                        <div className="bg-slate-950 p-8 rounded-[35px] flex justify-between items-center shadow-[10px_10px_0px_#00E676]">
                            <div><p className="text-xs font-black uppercase text-white/40 italic tracking-[0.4em] mb-1">Total Net Payout</p><h3 className="text-6xl font-[1000] text-[#00E676] italic tracking-tighter leading-none">${Number(currentSlipData.jumlah_gaji).toLocaleString()}</h3></div>
                            <div className="bg-white p-2 border-4 border-black">
                                <QRCode size={85} value={`AUTH:${currentSlipData.id}|${currentSlipData.nama_panggilan}`} viewBox={`0 0 256 256`} />
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-center opacity-20 pt-4">
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

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            `}</style>
        </div>
    );
}