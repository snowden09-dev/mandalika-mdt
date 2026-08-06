"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays, CheckCircle2, XCircle, Clock,
    User, ShieldCheck, Briefcase, Crown, Loader2
} from 'lucide-react';
import { format } from "date-fns";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CutiLog {
    id: string;
    nama_panggilan: string;
    pangkat: string;
    jenis_izin: string;
    alasan: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: string;
    created_at: string;
}

export default function SectionAdminCuti() {
    const router = useRouter();
    const [cutiLogs, setCutiLogs] = useState<CutiLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [viewMode, setViewMode] = useState<'ANGGOTA' | 'PETINGGI'>('ANGGOTA');
    const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

    useEffect(() => {
        const verifyAndFetch = async () => {
            setLoading(true);
            const sessionData = localStorage.getItem('police_session');

            if (!sessionData) {
                router.push('/');
                return;
            }

            const parsed = JSON.parse(sessionData);

            const { data: user, error: userError } = await supabase
                .from('users')
                .select('is_admin, is_highadmin')
                .eq('discord_id', parsed.discord_id)
                .single();

            if (userError || (!user?.is_admin && !user?.is_highadmin)) {
                toast.error("UNAUTHORIZED ACCESS DETECTED!");
                router.push('/dashboard');
                return;
            }

            setIsAuthorized(true);
            const { data } = await supabase
                .from('pengajuan_cuti')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setCutiLogs(data);
            setLoading(false);
        };

        void verifyAndFetch();
    }, [router]);

    // FILTER LOGIC (DISEMPURNAKAN AGAR CASE-INSENSITIVE)
    const filteredCuti = useMemo(() => {
        return cutiLogs.filter(log => {
            const isPetinggi = ['JENDRAL', 'KOMJEN', 'IRJEN', 'BRIGJEN', 'KOMBESPOL'].includes(log.pangkat?.toUpperCase());
            
            // Konversi status dari DB ke uppercase agar cocok dengan statusFilter
            const logStatusUpper = log.status?.toUpperCase() || '';
            const matchStatus = logStatusUpper === statusFilter;

            if (viewMode === 'PETINGGI') return isPetinggi && matchStatus;
            return !isPetinggi && matchStatus;
        });
    }, [cutiLogs, viewMode, statusFilter]);

    // OPTIMISTIC UPDATE
    const handleAction = async (id: string, targetStatus: 'APPROVED' | 'REJECTED') => {
        const tId = toast.loading(`Memproses status ${targetStatus}...`);
        
        // Simpan dalam format lowercase jika DB menggunakan lowercase (contoh: "pending", "approved", "rejected")
        const dbStatusValue = targetStatus.toLowerCase();

        const { error } = await supabase
            .from('pengajuan_cuti')
            .update({ status: dbStatusValue })
            .eq('id', id);

        if (error) {
            toast.error("Gagal memproses!", { id: tId });
        } else {
            toast.success(`Cuti ${targetStatus}!`, { id: tId });

            setCutiLogs(prevLogs =>
                prevLogs.map(log =>
                    log.id === id ? { ...log, status: dbStatusValue } : log
                )
            );
        }
    };

    if (!isAuthorized && loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Loader2 className="animate-spin mb-3 text-red-600" size={32} />
                <p className="font-bold uppercase tracking-widest text-xs text-zinc-400">Authenticating Clearance...</p>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 font-mono pb-24 text-zinc-100 px-4">
            
            {/* HEADER & VIEW TOGGLER */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-black/40">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-xl text-red-500 shrink-0">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                            Leave Management
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 border border-red-800/50 text-red-400 font-mono">ADMIN</span>
                        </h2>
                        <p className="text-xs text-zinc-500 font-medium">Verifikasi dan kelola pengajuan cuti personil</p>
                    </div>
                </div>

                <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 gap-1.5 w-full md:w-auto">
                    <button
                        onClick={() => setViewMode('ANGGOTA')}
                        className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === 'ANGGOTA'
                                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <User size={14} /> <span>Anggota</span>
                    </button>
                    <button
                        onClick={() => setViewMode('PETINGGI')}
                        className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === 'PETINGGI'
                                ? 'bg-red-950/80 text-red-300 border border-red-800/60 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <Crown size={14} className={viewMode === 'PETINGGI' ? 'text-red-400' : ''} /> <span>Petinggi</span>
                    </button>
                </div>
            </div>

            {/* STATUS FILTER TABS */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => {
                    const isActive = statusFilter === s;
                    let activeColorClass = "";
                    if (s === 'PENDING') activeColorClass = "bg-amber-500/10 border-amber-500/40 text-amber-400";
                    if (s === 'APPROVED') activeColorClass = "bg-emerald-500/10 border-emerald-500/40 text-emerald-400";
                    if (s === 'REJECTED') activeColorClass = "bg-red-500/10 border-red-500/40 text-red-400";

                    return (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                isActive
                                    ? `${activeColorClass} shadow-lg shadow-black/20`
                                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                            }`}
                        >
                            {s}
                        </button>
                    );
                })}
            </div>

            {/* LIST CONTENT AREA */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <Loader2 className="animate-spin mb-3 text-red-600" size={32} />
                    <p className="font-bold uppercase tracking-widest text-xs text-zinc-400">Scanning Dossiers...</p>
                </div>
            ) : filteredCuti.length === 0 ? (
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-16 text-center shadow-xl shadow-black/30">
                    <ShieldCheck size={40} className="mx-auto text-zinc-600 mb-3" />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-300">Tidak Ada Antrian Cuti</h3>
                    <p className="text-xs text-zinc-500 mt-1">Belum ada data cuti tercatat di kategori status ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3.5 text-zinc-100">
                    <AnimatePresence mode="popLayout">
                        {filteredCuti.map((log) => {
                            // PARSING LOGIC
                            let rawName = log.nama_panggilan || 'UNKNOWN';
                            if (rawName.includes('|')) {
                                rawName = rawName.split('|').pop()?.trim() || rawName;
                            }

                            let badgeNumber = "-";
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

                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-lg shadow-black/40 hover:border-zinc-700/80 transition-all group"
                                >
                                    {/* Left Accent Bar */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${viewMode === 'PETINGGI' ? 'bg-red-600' : 'bg-zinc-700'}`} />

                                    {/* Left Section: User Info */}
                                    <div className="flex items-center gap-4 w-full md:w-auto pl-1">
                                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                                            viewMode === 'PETINGGI'
                                                ? 'bg-red-950/40 border-red-900/40 text-red-500'
                                                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                                        }`}>
                                            {viewMode === 'PETINGGI' ? <Crown size={22} /> : <Briefcase size={22} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-sm uppercase tracking-tight text-zinc-100">
                                                    {cleanName}
                                                </h4>
                                                <span className="bg-zinc-950 border border-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                                    {log.pangkat} • #{badgeNumber}
                                                </span>
                                                {log.jenis_izin && (
                                                    <span className="bg-red-950/50 border border-red-900/40 text-red-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                                        {log.jenis_izin}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                                                <span className="text-zinc-500 font-medium">Alasan: </span>
                                                <span className="text-zinc-300 italic">&quot;{log.alasan || 'Tidak ada alasan'}&quot;</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Section: Duration & Actions */}
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full md:w-auto pt-3 md:pt-0 border-t border-zinc-800/60 md:border-t-0 justify-between">
                                        
                                        {/* Date Range */}
                                        <div className="flex flex-col md:items-end">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Durasi Cuti</span>
                                            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300">
                                                <Clock size={12} className="text-red-500" />
                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                    {format(new Date(log.tanggal_mulai), 'dd MMM')} — {format(new Date(log.tanggal_selesai), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Pending Action Buttons */}
                                        {statusFilter === 'PENDING' && (
                                            <div className="flex items-center gap-2 self-end md:self-auto">
                                                <button
                                                    onClick={() => handleAction(log.id, 'REJECTED')}
                                                    title="Reject Leave"
                                                    className="p-2.5 bg-red-950/30 border border-red-900/40 text-red-400 hover:bg-red-900/50 hover:text-red-200 rounded-xl transition-all cursor-pointer"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(log.id, 'APPROVED')}
                                                    title="Approve Leave"
                                                    className="p-2.5 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-200 rounded-xl transition-all cursor-pointer"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Processed Status Indicator */}
                                        {statusFilter !== 'PENDING' && (
                                            <div className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${
                                                statusFilter === 'APPROVED'
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                                            }`}>
                                                {statusFilter}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}