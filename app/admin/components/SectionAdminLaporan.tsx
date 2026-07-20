"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2, Image as ImageIcon,
    Filter, ExternalLink, X, AlertOctagon,
    FileText, CheckSquare, Loader2
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED';
type CategoryFilter = 'SEMUA' | 'PENANGKAPAN' | 'KASUS_BESAR' | 'PATROLI' | 'BACKUP' | 'PENILANGAN';

interface UserRelation {
    name?: string;
    pangkat?: string;
}

interface ReportItem {
    id: string;
    user_id_discord?: string;
    point_estimasi?: number;
    status: StatusFilter;
    jenis_laporan?: string;
    isi_laporan?: string;
    bukti_foto?: string;
    created_at?: string;
    users?: UserRelation;
}

export default function SectionAdminLaporan() {
    const router = useRouter();
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // FILTER STATE
    const [activeTab, setActiveTab] = useState<StatusFilter>('PENDING');
    const [activeCategory, setActiveCategory] = useState<CategoryFilter>('SEMUA');

    // PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9;

    const [previewData, setPreviewData] = useState<ReportItem | null>(null);
    const [isProcessingMassal, setIsProcessingMassal] = useState(false);

    const [deleteModal, setDeleteModal] = useState<{ show: boolean, type: 'SINGLE' | 'ALL', id?: string }>({ show: false, type: 'ALL' });
    const [confirmInput, setConfirmInput] = useState("");

    const verifyAndFetch = useCallback(async () => {
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
        if (lap) setReports(lap as ReportItem[]);

        setLoading(false);
    }, [router]);

    useEffect(() => { 
        verifyAndFetch(); 
    }, [verifyAndFetch]);

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
    const processSingleApprove = async (report: ReportItem) => {
        // 1. Tambah PRP ke User
        if (report.user_id_discord) {
            const { data: userData } = await supabase.from('users').select('point_prp').eq('discord_id', report.user_id_discord).single();
            const currentPoin = Number(userData?.point_prp) || 0;
            const poinTambahan = Number(report.point_estimasi) || 0;

            const { error: prpErr } = await supabase.from('users').update({ point_prp: currentPoin + poinTambahan }).eq('discord_id', report.user_id_discord);
            if (prpErr) throw prpErr;
        }

        // 2. Update Status Laporan
        const { error: dbErr } = await supabase.from('laporan_aktivitas').update({ status: 'APPROVED' }).eq('id', report.id);
        if (dbErr) throw dbErr;
    };

    // --- SINGLE ACTION HANDLER ---
    const handleAction = async (report: ReportItem, status: 'APPROVED' | 'REJECTED') => {
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
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
            toast.error(`Gagal: ${errorMessage}`, { id: tId });
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
        verifyAndFetch();
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
        } catch (err: unknown) { 
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
            toast.error(errorMessage, { id: tId }); 
        }
    };

    if (!isAuthorized && loading) return <div className="py-20 text-center animate-pulse text-zinc-400 text-xs font-semibold uppercase tracking-wider">Securing Intel...</div>;
    if (!isAuthorized) return null;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 font-sans pb-20 text-zinc-100">
            <Toaster position="top-center" richColors />

            {/* HEADER UTAMA */}
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 p-4 md:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-tight text-zinc-100">Report Verification</h2>
                        <p className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">Internal Affairs Archive</p>
                    </div>
                    <button 
                        onClick={() => setDeleteModal({ show: true, type: 'ALL' })} 
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 p-2.5 rounded-xl border border-zinc-800 transition-all shadow-xs"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <div className="flex w-full md:w-auto bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 gap-1 overflow-x-auto hide-scrollbar">
                    {(['PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map((t) => (
                        <button 
                            key={t} 
                            onClick={() => setActiveTab(t)} 
                            className={cn(
                                "px-3.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap",
                                activeTab === t 
                                    ? "bg-red-600 text-white shadow-sm shadow-red-900/30" 
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {t.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* BAR FILTER KATEGORI & ACTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-800/80 shadow-xs">
                {/* Filter Sub-Kategori */}
                <div className="flex overflow-x-auto w-full md:w-auto gap-2 hide-scrollbar pb-2 md:pb-0">
                    {(['SEMUA', 'PENANGKAPAN', 'KASUS_BESAR', 'PATROLI', 'BACKUP', 'PENILANGAN'] as CategoryFilter[]).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-3.5 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap border",
                                activeCategory === cat 
                                    ? "bg-zinc-800 text-zinc-100 border-zinc-700 shadow-xs" 
                                    : "bg-transparent text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-800"
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
                        className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wider transition-all shadow-sm shadow-red-900/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500"
                    >
                        {isProcessingMassal ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
                        ACC POIN SEMUA ({filteredData.length})
                    </button>
                )}
            </div>

            {/* LIST REPORTS & EMPTY STATE */}
            {loading ? (
                <div className="py-20 text-center animate-pulse text-zinc-500 text-xs font-semibold uppercase tracking-wider">Scanning Intelligence Data...</div>
            ) : (
                paginatedData.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-10 md:p-16 flex flex-col items-center justify-center text-center mt-8 shadow-xs">
                        <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-2xl mb-4 text-zinc-600">
                            <Filter size={40} />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-200">Nihil Data</h3>
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mt-1 max-w-sm leading-relaxed">
                            Tidak ada data untuk <span className="text-zinc-300 font-bold">{activeCategory.replace('_', ' ')}</span> di antrian <span className="text-zinc-300 font-bold">{activeTab.replace('_', ' ')}</span>.
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedData.map((lap) => (
                                <div key={lap.id} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col group relative shadow-xs">
                                    <button 
                                        onClick={() => setDeleteModal({ show: true, type: 'SINGLE', id: lap.id })} 
                                        className="absolute top-3 right-3 z-20 bg-zinc-950/80 hover:bg-red-600 hover:text-white p-2 rounded-lg border border-zinc-800 opacity-0 group-hover:opacity-100 transition-all text-zinc-400"
                                    >
                                        <X size={14} />
                                    </button>

                                    <div className="bg-zinc-950/60 p-4 flex justify-between items-start border-b border-zinc-800">
                                        <div className="overflow-hidden mr-2">
                                            <h4 className="font-bold text-xs uppercase tracking-tight text-zinc-200 truncate w-32 md:w-40">
                                                {lap.users?.name?.includes('|') ? lap.users.name.split('|').pop() : (lap.users?.name || "ANONIM")}
                                            </h4>
                                            <p className="text-[10px] font-semibold text-red-500 mt-1 uppercase tracking-wider truncate">
                                                {lap.users?.pangkat} • {lap.jenis_laporan}
                                            </p>
                                        </div>
                                        <div className="bg-red-950/60 text-red-400 border border-red-900/50 px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-wider shrink-0">
                                            +{lap.point_estimasi} PRP
                                        </div>
                                    </div>

                                    <div className="p-4 flex-1 space-y-4">
                                        <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl h-28 overflow-y-auto custom-scrollbar text-xs font-medium text-zinc-300 whitespace-pre-wrap">
                                            {lap.isi_laporan}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {lap.status === 'PENDING' ? (
                                                <>
                                                    <button 
                                                        disabled={isProcessingMassal} 
                                                        onClick={() => handleAction(lap, 'REJECTED')} 
                                                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-red-400 py-2.5 rounded-xl font-semibold text-xs tracking-wider transition-all disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button 
                                                        disabled={isProcessingMassal} 
                                                        onClick={() => handleAction(lap, 'APPROVED')} 
                                                        className="bg-red-600 hover:bg-red-500 text-white border border-red-500 py-2.5 rounded-xl font-semibold text-xs tracking-wider transition-all shadow-sm shadow-red-900/30 disabled:opacity-50"
                                                    >
                                                        Acc Poin
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => setPreviewData(lap)} 
                                                    className="col-span-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 py-2.5 rounded-xl font-semibold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs"
                                                >
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
                            <div className="flex justify-center items-center gap-4 mt-8 bg-zinc-900/80 backdrop-blur-md p-3 rounded-2xl border border-zinc-800 shadow-xs w-fit mx-auto">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className="bg-zinc-950 text-zinc-300 px-3.5 py-2 rounded-xl border border-zinc-800 font-semibold uppercase text-xs disabled:opacity-30 active:scale-95 transition-all"
                                >
                                    Prev
                                </button>
                                <span className="font-semibold text-xs text-zinc-400 uppercase tracking-wider">
                                    Page {currentPage} / {totalPages}
                                </span>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className="bg-red-600 text-white px-3.5 py-2 rounded-xl border border-red-500 font-semibold uppercase text-xs disabled:opacity-30 active:scale-95 transition-all shadow-sm shadow-red-900/30"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )
            )}

            {/* --- MODAL DELETE --- */}
            <AnimatePresence>
                {deleteModal.show && (
                    <div className="fixed inset-0 z-300 bg-zinc-950/80 backdrop-blur-md p-4 flex items-center justify-center">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-950 max-w-sm w-full rounded-2xl p-6 md:p-8 border border-zinc-800 text-zinc-100 space-y-6 shadow-2xl">
                            <div className="flex items-center gap-3 text-red-500">
                                <AlertOctagon size={24} />
                                <h3 className="font-bold text-sm uppercase tracking-tight text-zinc-100">Konfirmasi Penghapusan</h3>
                            </div>

                            {deleteModal.type === 'ALL' ? (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">Hapus semua arsip yang BUKAN PENDING. Masukkan kode otorisasi keamanan:</p>
                                    <input
                                        value={confirmInput}
                                        onChange={(e) => setConfirmInput(e.target.value)}
                                        placeholder="KODE..."
                                        className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl font-medium text-xs text-zinc-100 outline-none focus:border-red-500 transition-all"
                                    />
                                </div>
                            ) : (
                                <p className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">Yakin ingin menghapus laporan ini selamanya?</p>
                            )}

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setDeleteModal({ show: false, type: 'ALL' }); setConfirmInput(""); }} 
                                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider text-zinc-300 transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={executeDelete} 
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white border border-red-500 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all shadow-sm shadow-red-900/30"
                                >
                                    Eksekusi
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL PREVIEW */}
            <AnimatePresence>
                {previewData && (
                    <div className="fixed inset-0 z-400 bg-zinc-950/80 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-950 max-w-2xl w-full rounded-2xl border border-zinc-800 overflow-hidden text-zinc-100 my-10 relative shadow-2xl">
                            <div className="bg-zinc-900/80 backdrop-blur-md p-4 flex justify-between items-center text-zinc-100 border-b border-zinc-800 sticky top-0 z-10">
                                <h3 className="font-bold text-xs uppercase tracking-tight">Detail Teks Laporan</h3>
                                <button onClick={() => setPreviewData(null)} className="text-zinc-400 hover:text-red-400 p-1 rounded-lg transition-colors"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="bg-zinc-900 text-zinc-300 p-4 rounded-xl font-mono text-xs border border-zinc-800 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                                    {previewData.isi_laporan}
                                </div>

                                {previewData.bukti_foto && (
                                    <div className="pt-2">
                                        <a
                                            href={previewData.bukti_foto}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-6 py-3.5 rounded-xl font-semibold uppercase tracking-wider text-xs transition-all flex justify-center items-center gap-2 text-zinc-200"
                                        >
                                            <ExternalLink size={16} /> Lihat Bukti Foto Asli (Discord)
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
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
            `}</style>
        </div>
    );
}