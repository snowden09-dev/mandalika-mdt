"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Banknote, CheckCircle2, XCircle, Clock,
    Send, Eye, Search, Filter, Trash2,
    AlertTriangle, Download, ChevronRight, Lock, ShieldCheck
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';

// Import Component Slip (Pastikan path benar)
import SlipGajiTemplate from "./SlipGajiTemplate";

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT_IMAGE_QR';

export default function SectionAdminPayroll() {
    const router = useRouter();
    const [payrollData, setPayrollData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false); // SECURITY LOCK
    const [activeTab, setActiveTab] = useState<StatusFilter>('PENDING');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSlip, setSelectedSlip] = useState<any>(null);

    const verifyAndFetch = async () => {
        setLoading(true);
        const sessionData = localStorage.getItem('police_session');

        if (!sessionData) {
            router.push('/');
            return;
        }

        try {
            const parsed = JSON.parse(sessionData);

            // --- CRITICAL SECURITY CHECK ---
            const { data: auth, error: authError } = await supabase
                .from('users')
                .select('is_admin, is_highadmin')
                .eq('discord_id', parsed.discord_id)
                .single();

            if (authError || (!auth.is_admin && !auth.is_highadmin)) {
                toast.error("AKSES FINANSIAL DITOLAK!");
                router.push('/dashboard');
                return;
            }

            // --- DATA FETCH AFTER AUTH ---
            setIsAuthorized(true);
            const { data, error } = await supabase
                .from('pengajuan_gaji')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setPayrollData(data);
        } catch (err) {
            router.push('/');
        }
        setLoading(false);
    };

    useEffect(() => { verifyAndFetch(); }, []);

    // --- LOGIC FILTER ---
    const filteredPayroll = useMemo(() => {
        return payrollData.filter(item => {
            const matchStatus = item.status === activeTab;
            const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.pangkat.toLowerCase().includes(searchQuery.toLowerCase());
            return matchStatus && matchSearch;
        });
    }, [payrollData, activeTab, searchQuery]);

    // --- ACTION: UPDATE STATUS ---
    const handleStatusUpdate = async (id: string, newStatus: StatusFilter) => {
        const tId = toast.loading(`Updating status to ${newStatus}...`);
        const { error } = await supabase
            .from('pengajuan_gaji')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            toast.error("Gagal update status!", { id: tId });
        } else {
            toast.success(`Payroll ${newStatus}!`, { id: tId });
            verifyAndFetch();
        }
    };

    // --- ACTION: BULK DELETE (Hanya untuk yang sudah terproses) ---
    const clearHistory = async () => {
        if (!confirm("Bersihkan semua data yang sudah terproses? (APPROVED/REJECTED/SENT)")) return;
        const { error } = await supabase
            .from('pengajuan_gaji')
            .delete()
            .neq('status', 'PENDING');

        if (!error) {
            toast.success("History Cleared!");
            verifyAndFetch();
        }
    };

    // --- PROTECTED RENDER ---
    if (!isAuthorized && loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-950 animate-pulse">
                <Lock size={48} className="mb-4" />
                <p className="font-black italic uppercase text-xs">Accessing Financial Vault...</p>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 font-mono pb-20 text-slate-950">
            <Toaster position="top-center" richColors />

            {/* HEADER & CONTROLS */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-[35px] flex flex-col lg:flex-row justify-between items-center gap-6`}>
                <div className="flex items-center gap-4">
                    <div className="bg-[#00E676] p-3 border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000]">
                        <Banknote size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-[1000] italic uppercase tracking-tighter leading-none">Payroll Center</h2>
                        <p className="text-[10px] font-bold opacity-50 uppercase mt-1 italic">Mandalika Financial Protocol</p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center bg-slate-100 p-2 rounded-2xl border-2 border-black gap-1">
                    {(['PENDING', 'APPROVED', 'SENT_IMAGE_QR', 'REJECTED'] as StatusFilter[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[9px] font-black uppercase italic transition-all",
                                activeTab === t ? "bg-slate-950 text-white shadow-[3px_3px_0px_#00E676]" : "opacity-40 hover:opacity-100"
                            )}
                        >
                            {t.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* SEARCH & UTILITY */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
                    <input
                        type="text"
                        placeholder="Cari Nama / Pangkat Anggota..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full bg-white ${boxBorder} py-4 pl-12 pr-4 rounded-2xl font-bold italic outline-none focus:shadow-[6px_6px_0px_#3B82F6] transition-all`}
                    />
                </div>
                <button
                    onClick={clearHistory}
                    className="bg-red-500 text-white border-2 border-black px-6 py-4 rounded-2xl font-black uppercase italic text-xs flex items-center gap-2 shadow-[4px_4px_0px_#000] active:translate-y-1 transition-all"
                >
                    <Trash2 size={18} /> Clear History
                </button>
            </div>

            {/* PAYROLL LIST */}
            {loading ? (
                <div className="py-20 text-center font-black uppercase italic animate-pulse">Calculating Treasury Data...</div>
            ) : filteredPayroll.length === 0 ? (
                <div className={`bg-white ${boxBorder} ${hardShadow} p-20 text-center rounded-[40px] opacity-40 italic`}>
                    <ShieldCheck size={64} className="mx-auto mb-4 opacity-20" />
                    <h3 className="font-black uppercase text-xl">No Records Found</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredPayroll.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`bg-white ${boxBorder} ${hardShadow} rounded-[35px] overflow-hidden flex flex-col group`}
                            >
                                {/* Header Card */}
                                <div className="bg-slate-950 p-5 text-white flex justify-between items-start">
                                    <div>
                                        <h4 className="font-black uppercase italic text-lg leading-none truncate w-40">{item.name.split('|').pop()}</h4>
                                        <p className="text-[9px] font-bold text-[#00E676] mt-1 uppercase italic">{item.pangkat}</p>
                                    </div>
                                    <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                                        <p className="text-[8px] font-black opacity-50 uppercase leading-none mb-1">Total Gaji</p>
                                        <p className="text-xs font-[1000] text-[#00E676]">Rp {item.total_gaji.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Body Card */}
                                <div className="p-6 space-y-4 flex-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-3 border-2 border-black rounded-xl">
                                            <p className="text-[8px] font-black opacity-40 uppercase italic">Duty Time</p>
                                            <p className="text-xs font-black">{item.total_jam_duty} JAM</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 border-2 border-black rounded-xl">
                                            <p className="text-[8px] font-black opacity-40 uppercase italic">PRP Points</p>
                                            <p className="text-xs font-black">{item.point_prp} PTS</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-2">
                                        {activeTab === 'PENDING' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => handleStatusUpdate(item.id, 'REJECTED')}
                                                    className="bg-[#FF4D4D] border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(item.id, 'APPROVED')}
                                                    className="bg-[#00E676] border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] active:translate-y-1 transition-all"
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        )}

                                        {(activeTab === 'APPROVED' || activeTab === 'SENT_IMAGE_QR') && (
                                            <button
                                                onClick={() => setSelectedSlip(item)}
                                                className="w-full bg-blue-500 text-white border-2 border-black py-4 rounded-2xl font-[1000] text-xs uppercase italic shadow-[4px_4px_0px_#000] active:translate-y-1 flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Eye size={18} /> Open Financial Slip
                                            </button>
                                        )}

                                        {activeTab === 'REJECTED' && (
                                            <button
                                                onClick={() => handleStatusUpdate(item.id, 'PENDING')}
                                                className="w-full bg-slate-200 border-2 border-black py-3 rounded-xl font-black text-[10px] uppercase italic opacity-60 hover:opacity-100"
                                            >
                                                Restore to Pending
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* MODAL SLIP GAJI */}
            <AnimatePresence>
                {selectedSlip && (
                    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white max-w-4xl w-full rounded-[50px] border-[6px] border-slate-950 shadow-[15px_15px_0px_#00E676] overflow-hidden"
                        >
                            {/* Header Modal */}
                            <div className="bg-slate-950 p-6 flex justify-between items-center text-white">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#00E676] p-2 rounded-lg text-black"><Banknote size={20} /></div>
                                    <h3 className="font-[1000] italic uppercase tracking-tighter">Vault Slip Preview</h3>
                                </div>
                                <button onClick={() => setSelectedSlip(null)} className="hover:rotate-90 transition-all">
                                    <XCircle size={32} />
                                </button>
                            </div>

                            {/* Content Modal */}
                            <div className="p-6 md:p-10">
                                <SlipGajiTemplate
                                    data={selectedSlip}
                                    onClose={() => setSelectedSlip(null)}
                                    onSuccess={() => {
                                        setSelectedSlip(null);
                                        verifyAndFetch();
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}