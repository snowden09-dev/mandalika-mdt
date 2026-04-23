"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, XCircle, Clock, Eye, Send,
    Trash2, ShieldCheck, Image as ImageIcon,
    Filter, ArrowRight, ExternalLink, X, Zap, AlertOctagon,
    Save, Hash, Search, Loader2, Lock, FileText, CheckSquare
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED';
type CategoryFilter = 'SEMUA' | 'PENANGKAPAN' | 'KASUS_BESAR' | 'PATROLI' | 'BACKUP' | 'PENILANGAN';

export default function SectionAdminLaporan() {
    const router = useRouter();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // FILTER STATE
    const [activeTab, setActiveTab] = useState<StatusFilter>('PENDING');
    const [activeCategory, setActiveCategory] = useState<CategoryFilter>('SEMUA');

    // PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9;

    const [previewData, setPreviewData] = useState<any>(null);
    const [isProcessingMassal, setIsProcessingMassal] = useState(false);

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

        // Ambil semua laporan beserta nama dan pangkat dari tabel users
        const { data: lap } = await supabase.from('laporan_aktivitas').select(`*, users(name, pangkat)`).order('created_at', { ascending: false });
        if (lap) setReports(lap);

        setLoading(false);
    };

    useEffect(() => { verifyAndFetch(); }, []);

    // RESET PAGE JIKA FILTER BERUBAH
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, activeCategory]);

    const filteredData = useMemo(() => {
        let data = reports.filter(r => r.status === activeTab);

        if (activeCategory !== 'SEMUA') {
            data = data.filter(r => {
                const dbType = (r.jenis_laporan || "").replace(' ', '_').toUpperCase();
                return dbType === activeCategory;
            });
        }

        return data;
    }, [reports, activeTab, activeCategory]);

    // PAGINATION LOGIC
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);


    // --- HELPER FUNGSI: PROSES 1 LAPORAN (ACC POIN SAJA) ---
    const processSingleApprove = async (report: any) => {
        // 1. Tambah PRP ke User
        if (report.user_id_discord) {
            const { data: userData } = await supabase.from('users').select('point_prp').eq('discord_id', report.user_id_discord).single();
            const currentPoin = Number(userData?.point_prp) || 0;
            const poinTambahan = Number(report.poin_estimasi) || 0;

            const { error: prpErr } = await supabase.from('users').update({ point_prp: currentPoin + poinTambahan }).eq('discord_id', report.user_id_discord);
            if (prpErr) throw prpErr;
        }

        // 2. Update Status Laporan (Tidak perlu kirim webhook lagi, karena sudah ada di Discord)
        const { error: dbErr } = await supabase.from('laporan_aktivitas').update({ status: 'APPROVED' }).eq('id', report.id);
        if (dbErr) throw dbErr;
    };

    // --- SINGLE ACTION HANDLER ---
    const handleAction = async (report: any, status: 'APPROVED' | 'REJECTED') => {
        const tId = toast.loading(`Processing ${status}...`);
        try {
            if (status === 'APPROVED') {
                await processSingleApprove(report);
                setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'APPROVED' } : r));
                toast.success(`Berhasil ACC Poin!`, { id: tId });
            } else {
                const { error } = await supabase.from('laporan_aktivitas').update({ status: 'REJECTED' }).eq('id', report.id);
                if (error) throw error;
                setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'REJECTED' } : r));
                toast.success(`Laporan DITOLAK!`, { id: tId });
            }
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: tId });
        }
    };

    // --- MASS ACTION HANDLER (ACC ALL POIN) ---
    const handleApproveAll = async () => {
        if (filteredData.length === 0) return;
        const confirm = window.confirm(`PERINGATAN: Yakin ingin menyetujui ${filteredData.length} Laporan sekaligus?\n\nSistem akan menambahkan PRP anggota secara massal. Pastikan Anda sudah mengecek keaslian foto di Discord!`);
        if (!confirm) return;

        setIsProcessingMassal(true);
        const tId = toast.loading(`Mempersiapkan ACC Massal (${filteredData.length} Laporan)...`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < filteredData.length; i++) {
            toast.loading(`Memproses Poin ${i + 1}/${filteredData.length}...`, { id: tId });
            try {
                await processSingleApprove(filteredData[i]);
                successCount++;
            } catch (err) {
                console.error("Gagal mass approve:", err);
                failCount++;
            }
        }

        toast.success(`Operasi Selesai! Poin Masuk: ${successCount} | Gagal: ${failCount}`, { id: tId, duration: 5000 });
        setIsProcessingMassal(false);
        verifyAndFetch(); // Refresh total agar state sinkron dengan database
    };

    const executeDelete = async () => {
        if (deleteModal.type === 'ALL' && confirmInput !== "MANDALIKA") return toast.error("Kode Salah!");
        const tId = toast.loading("Processing...");
        try {
            if (deleteModal.type === 'ALL') {
                await supabase.from('laporan_aktivitas').delete().neq('status', 'PENDING');
                setReports(prev => prev.filter(r => r.status === 'PENDING'));
            } else {
                await supabase.from('laporan_aktivitas').delete().eq('id', deleteModal.id);
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

            {/* HEADER UTAMA */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-4 md:p-6 rounded-[25px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <h2 className="text-xl md:text-3xl font-[1000] italic uppercase tracking-tighter leading-none">Report Verification</h2>
                    <button onClick={() => setDeleteModal({ show: true, type: 'ALL' })} className="bg-red-500 text-white p-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-y-1 active:shadow-none">
                        <Trash2 size={20} />
                    </button>
                </div>

                <div className="flex w-full md:w-auto bg-slate-100 p-1.5 rounded-xl border-2 border-black gap-1 overflow-x-auto custom-scrollbar">
                    {(['PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map((t) => (
                        <button key={t} onClick={() => setActiveTab(t)} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase italic whitespace-nowrap", activeTab === t ? "bg-slate-950 text-white shadow-[3px_3px_0px_#A3E635]" : "opacity-40 hover:opacity-100")}>
                            {t.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* BAR FILTER KATEGORI & ACTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-200 p-3 rounded-2xl border-[3.5px] border-black shadow-[4px_4px_0px_#000]">
                {/* Filter Sub-Kategori */}
                <div className="flex overflow-x-auto w-full md:w-auto gap-2 hide-scrollbar pb-2 md:pb-0">
                    {(['SEMUA', 'PENANGKAPAN', 'KASUS_BESAR', 'PATROLI', 'BACKUP', 'PENILANGAN'] as CategoryFilter[]).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase italic border-2 border-transparent transition-all whitespace-nowrap",
                                activeCategory === cat ? "bg-white border-black shadow-[2px_2px_0px_#000] text-black" : "bg-transparent text-slate-500 hover:text-black hover:bg-white/50"
                            )}
                        >
                            {cat.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* TOMBOL ACC MASSAL KHUSUS TAB PENDING */}
                {activeTab === 'PENDING' && filteredData.length > 0 && (
                    <button
                        onClick={handleApproveAll}
                        disabled={isProcessingMassal}
                        className="w-full md:w-auto bg-[#A3E635] text-black px-4 py-2 rounded-xl border-2 border-black font-[1000] text-[10px] uppercase italic shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessingMassal ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
                        ACC POIN SEMUA ({filteredData.length})
                    </button>
                )}
            </div>

            {/* LIST REPORTS & EMPTY STATE */}
            {loading ? (
                <div className="py-20 text-center animate-pulse font-black uppercase italic">Scanning Intelligence Data...</div>
            ) : (
                paginatedData.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`bg-white ${boxBorder} ${hardShadow} rounded-[30px] p-10 md:p-20 flex flex-col items-center justify-center text-center mt-8`}>
                        <div className="bg-slate-100 p-5 border-[3.5px] border-slate-900 rounded-3xl mb-4 shadow-[6px_6px_0_0_#000]">
                            <Filter size={56} className="text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-[1000] italic uppercase tracking-tighter text-slate-900">NIHIL DATA</h3>
                        <p className="text-xs font-black uppercase opacity-50 mt-2 max-w-sm leading-relaxed">
                            Tidak ada data untuk <span className="text-blue-500 font-[1000]">{activeCategory.replace('_', ' ')}</span> di antrian <span className="text-blue-500 font-[1000]">{activeTab.replace('_', ' ')}</span>.
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedData.map((lap) => (
                                <div key={lap.id} className={`bg-white ${boxBorder} ${hardShadow} rounded-[25px] overflow-hidden flex flex-col group relative`}>
                                    <button onClick={() => setDeleteModal({ show: true, type: 'SINGLE', id: lap.id })} className="absolute top-2 right-2 z-20 bg-white/20 hover:bg-red-500 hover:text-white p-2 rounded-lg border-2 border-black opacity-0 group-hover:opacity-100 transition-all text-slate-950"><X size={14} /></button>

                                    <div className="bg-slate-950 text-white p-4 flex justify-between items-start border-b-[3.5px] border-black">
                                        <div className="overflow-hidden mr-2">
                                            <h4 className="font-black uppercase italic leading-none truncate w-32 md:w-40">{lap.users?.name?.includes('|') ? lap.users.name.split('|').pop() : (lap.users?.name || "ANONIM")}</h4>
                                            <p className="text-[9px] font-bold text-[#A3E635] mt-1 uppercase italic truncate">{lap.users?.pangkat} • {lap.jenis_laporan}</p>
                                        </div>
                                        <div className="bg-blue-600 px-2 py-1 rounded-lg font-black text-[9px] italic border border-white/20 shrink-0">+{lap.poin_estimasi} PRP</div>
                                    </div>

                                    <div className="p-4 flex-1 space-y-4">
                                        <div className="bg-slate-50 border-2 border-black p-3 rounded-xl h-28 overflow-y-auto custom-scrollbar text-[10px] font-bold whitespace-pre-wrap italic text-slate-900">
                                            {lap.isi_laporan}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {lap.status === 'PENDING' ? (
                                                <>
                                                    <button disabled={isProcessingMassal} onClick={() => handleAction(lap, 'REJECTED')} className="bg-[#FF4D4D] border-2 border-black py-2.5 rounded-xl font-[1000] text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all text-slate-950 disabled:opacity-50">Reject</button>
                                                    <button disabled={isProcessingMassal} onClick={() => handleAction(lap, 'APPROVED')} className="bg-[#A3E635] border-2 border-black py-2.5 rounded-xl font-[1000] text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all text-slate-950 disabled:opacity-50">Acc Poin</button>
                                                </>
                                            ) : (
                                                <button onClick={() => setPreviewData(lap)} className="col-span-2 bg-blue-500 text-white border-2 border-black py-2.5 rounded-xl font-[1000] text-[10px] uppercase italic shadow-[4px_4px_0px_#000] active:translate-y-1 flex items-center justify-center gap-2">
                                                    <FileText size={16} /> Buka Teks Arsip
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* PAGINATION CONTROLS */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8 bg-white p-3 rounded-2xl border-[3.5px] border-black shadow-[4px_4px_0px_#000] w-fit mx-auto">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className="bg-slate-200 p-2 rounded-xl border-2 border-black font-black uppercase text-[10px] disabled:opacity-30 active:scale-95"
                                >
                                    Prev
                                </button>
                                <span className="font-[1000] text-xs italic">
                                    PAGE {currentPage} / {totalPages}
                                </span>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className="bg-[#3B82F6] text-white p-2 rounded-xl border-2 border-black font-black uppercase text-[10px] disabled:opacity-30 active:scale-95"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )
            )}

            {/* --- 🛑 MODAL DELETE 🛑 --- */}
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
                                <p className="text-xs font-bold uppercase text-slate-500">Yakin ingin menghapus laporan ini selamanya?</p>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => { setDeleteModal({ show: false, type: 'ALL' }); setConfirmInput(""); }} className="flex-1 bg-slate-200 border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all">Batal</button>
                                <button onClick={executeDelete} className="flex-1 bg-red-500 text-white border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all">Eksekusi</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL PREVIEW (TEKS ONLY) */}
            <AnimatePresence>
                {previewData && (
                    <div className="fixed inset-0 z-[400] bg-black/90 p-4 flex items-center justify-center overflow-y-auto">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white max-w-2xl w-full rounded-[30px] border-[4px] border-slate-950 shadow-[10px_10px_0px_#3B82F6] overflow-hidden text-slate-950 my-10 relative">
                            <div className="bg-slate-950 p-4 flex justify-between items-center text-white sticky top-0 z-10">
                                <h3 className="font-[1000] italic uppercase tracking-tighter">Detail Teks Laporan</h3>
                                <button onClick={() => setPreviewData(null)} className="hover:bg-red-500 hover:text-white p-1 rounded-md transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="bg-[#2C2F33] text-[#DCDDDE] p-5 rounded-[20px] font-mono text-[10px] border-4 border-black whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                                    {previewData.isi_laporan}
                                </div>

                                {previewData.bukti_foto && (
                                    <div className="pt-2">
                                        <a
                                            href={previewData.bukti_foto}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full bg-slate-100 border-[3px] border-black px-6 py-4 rounded-xl font-[1000] uppercase italic text-xs shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] active:translate-y-1 active:shadow-[0px_0px_0px_#000] transition-all flex justify-center items-center gap-3 text-blue-600"
                                        >
                                            <ExternalLink size={18} /> Lihat Bukti Foto Asli (Discord)
                                        </a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            `}</style>
        </div>
    );
}