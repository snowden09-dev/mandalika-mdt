"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays, CheckCircle2, XCircle, Clock,
    User, ShieldCheck, Filter, Search, Trash2,
    AlertTriangle, ChevronRight, Briefcase, Crown, Lock
} from 'lucide-react';
import { format } from "date-fns";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

export default function SectionAdminCuti() {
    const router = useRouter();
    const [cutiLogs, setCutiLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [viewMode, setViewMode] = useState<'ANGGOTA' | 'PETINGGI'>('ANGGOTA');
    const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

    const verifyAndFetch = async () => {
        setLoading(true);
        const sessionData = localStorage.getItem('police_session');

        if (!sessionData) {
            router.push('/');
            return;
        }

        const parsed = JSON.parse(sessionData);

        // --- DOUBLE SECURITY CHECK ---
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('is_admin, is_highadmin')
            .eq('discord_id', parsed.discord_id)
            .single();

        if (userError || (!user.is_admin && !user.is_highadmin)) {
            toast.error("UNAUTHORIZED ACCESS DETECTED!");
            router.push('/portal');
            return;
        }

        setIsAuthorized(true);
        const { data, error } = await supabase
            .from('pengajuan_cuti')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setCutiLogs(data);
        setLoading(false);
    };

    useEffect(() => { verifyAndFetch(); }, []);

    const filteredCuti = useMemo(() => {
        return cutiLogs.filter(log => {
            const isPetinggi = ['JENDRAL', 'KOMJEN', 'IRJEN', 'BRIGJEN', 'KOMBESPOL'].includes(log.pangkat?.toUpperCase());
            const matchStatus = log.status === statusFilter;
            if (viewMode === 'PETINGGI') return isPetinggi && matchStatus;
            return !isPetinggi && matchStatus;
        });
    }, [cutiLogs, viewMode, statusFilter]);

    const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        const tId = toast.loading(`Memproses status ${status}...`);
        const { error } = await supabase
            .from('pengajuan_cuti')
            .update({ status })
            .eq('id', id);

        if (error) {
            toast.error("Gagal memproses!", { id: tId });
        } else {
            toast.success(`Cuti ${status}!`, { id: tId });
            verifyAndFetch();
        }
    };

    if (!isAuthorized && loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse text-slate-950">
                <Lock size={48} className="mb-4" />
                <p className="font-black italic uppercase text-xs">Authenticating Clearance...</p>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 font-mono pb-20 text-slate-950">
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6`}>
                <div className="flex items-center gap-3">
                    <CalendarDays size={32} className="text-[#A78BFA]" />
                    <h2 className="font-[1000] text-2xl italic uppercase tracking-tighter">Leave Management</h2>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-xl border-2 border-black gap-1">
                    <button
                        onClick={() => setViewMode('ANGGOTA')}
                        className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all flex items-center gap-2",
                            viewMode === 'ANGGOTA' ? "bg-white border-2 border-black shadow-[3px_3px_0px_#000]" : "opacity-40"
                        )}
                    >
                        <User size={14} /> Anggota Biasa
                    </button>
                    <button
                        onClick={() => setViewMode('PETINGGI')}
                        className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all flex items-center gap-2",
                            viewMode === 'PETINGGI' ? "bg-[#FFD100] border-2 border-black shadow-[3px_3px_0px_#000]" : "opacity-40"
                        )}
                    >
                        <Crown size={14} /> Jajaran Petinggi
                    </button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s as any)}
                        className={cn("px-4 py-2 border-2 border-black font-black text-[10px] uppercase italic rounded-lg transition-all shadow-[3px_3px_0px_#000] active:translate-y-px active:shadow-none",
                            statusFilter === s ? (s === 'PENDING' ? 'bg-[#FFD100]' : s === 'APPROVED' ? 'bg-[#00E676]' : 'bg-[#FF4D4D]') : 'bg-white opacity-50'
                        )}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 font-black italic animate-pulse">Scanning Personal Dossiers...</div>
            ) : filteredCuti.length === 0 ? (
                <div className={`bg-white ${boxBorder} ${hardShadow} p-20 text-center rounded-[30px] opacity-50 italic`}>
                    <ShieldCheck size={48} className="mx-auto mb-4" />
                    <h3 className="font-black uppercase italic">Tidak Ada Antrian Cuti</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 text-slate-950">
                    <AnimatePresence mode="popLayout">
                        {filteredCuti.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className={`bg-white ${boxBorder} ${hardShadow} rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden group`}
                            >
                                <div className={cn("absolute left-0 top-0 bottom-0 w-2", viewMode === 'PETINGGI' ? 'bg-[#FFD100]' : 'bg-[#3B82F6]')} />

                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="w-16 h-16 bg-slate-100 border-2 border-black rounded-xl flex items-center justify-center shrink-0 shadow-[3px_3px_0px_#000]">
                                        {viewMode === 'PETINGGI' ? <Crown size={30} className="text-[#FFD100]" /> : <Briefcase size={30} className="text-slate-400" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {/* --- FIX LOGIKA NAMA DISINI --- */}
                                            <h4 className="font-black text-lg uppercase italic leading-none">
                                                {log.name?.includes('|') ? log.name.split('|').pop()?.trim() : log.name || 'UNKNOWN'}
                                            </h4>
                                            <span className="bg-slate-950 text-white text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest">{log.pangkat}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase italic">
                                            Alasan: <span className="text-slate-950">"{log.alasan || 'Tidak ada alasan'}"</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
                                    <div className="text-center md:text-right">
                                        <p className="text-[9px] font-black uppercase opacity-40 mb-1">Durasi Cuti</p>
                                        <div className="flex items-center gap-2 bg-slate-50 border-2 border-black px-3 py-1 rounded-lg">
                                            <Clock size={12} />
                                            <span className="text-[10px] font-black uppercase">
                                                {format(new Date(log.tanggal_mulai), 'dd MMM')} — {format(new Date(log.tanggal_selesai), 'dd MMM yyyy')}
                                            </span>
                                        </div>
                                    </div>

                                    {statusFilter === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(log.id, 'REJECTED')}
                                                className="bg-[#FF4D4D] border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_#000] hover:bg-black hover:text-white transition-all active:translate-y-px active:shadow-none"
                                            >
                                                <XCircle size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleAction(log.id, 'APPROVED')}
                                                className="bg-[#00E676] border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_#000] hover:bg-black hover:text-white transition-all active:translate-y-px active:shadow-none"
                                            >
                                                <CheckCircle2 size={20} />
                                            </button>
                                        </div>
                                    )}

                                    {statusFilter !== 'PENDING' && (
                                        <div className={cn("px-4 py-2 border-2 border-black rounded-lg font-black text-[10px] uppercase italic",
                                            statusFilter === 'APPROVED' ? 'bg-[#00E676]' : 'bg-[#FF4D4D]'
                                        )}>
                                            {statusFilter}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}