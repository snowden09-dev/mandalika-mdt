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
    divisi?: string;
    jenis_izin: string;
    alasan: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: string;
    created_at: string;
    discord_id?: string;
    badge_number?: string;
}

// Helper: Format tanggal untuk discord (Dari YYYY-MM-DD ke DD MMMM)
const formatTanggalDiscord = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
};

// Helper: Ubah format string jadi Title Case & Bersihkan format badge jika ada
const toTitleCase = (str: string) => {
    if (!str) return '-';
    let cleaned = str.trim();
    if (cleaned.startsWith('#')) {
        const spaceIdx = cleaned.indexOf(' ');
        if (spaceIdx !== -1) {
            cleaned = cleaned.substring(spaceIdx + 1).trim();
        }
    }
    return cleaned
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Helper: Ekstrak nomor badge dari string seperti "#03105 Owen Diningrat"
const extractBadgeFromString = (str: string) => {
    if (!str) return '-';
    const trimmed = str.trim();
    if (trimmed.startsWith('#')) {
        const spaceIdx = trimmed.indexOf(' ');
        if (spaceIdx !== -1) {
            return trimmed.substring(1, spaceIdx);
        } else {
            return trimmed.substring(1);
        }
    }
    return '-';
};

export default function SectionAdminCuti() {
    const router = useRouter();
    const [cutiLogs, setCutiLogs] = useState<CutiLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    
    const [adminName, setAdminName] = useState<string>("Unknown Admin");
    
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

            // Ambil data admin dari tabel users berdasarkan discord_id
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('discord_id', parsed.discord_id)
                .single();

            if (userError) {
                console.error("SUPABASE ERROR (Verify User):", userError);
                toast.error("Gagal memverifikasi data pengguna!");
                router.push('/dashboard');
                return;
            }

            if (!user?.is_admin && !user?.is_highadmin) {
                toast.error("UNAUTHORIZED ACCESS DETECTED!");
                router.push('/dashboard');
                return;
            }

            const rawAdmin = user.name || user.nama_panggilan || user.nama || user.username || "Admin Divisi";
            setAdminName(toTitleCase(rawAdmin));

            setIsAuthorized(true);
            
            // Ambil data pengajuan cuti
            const { data: cutiData } = await supabase
                .from('pengajuan_cuti')
                .select('*')
                .order('created_at', { ascending: false });

            if (cutiData) {
                // Ambil seluruh data user dari tabel users untuk mapping
                const { data: usersData } = await supabase.from('users').select('name, discord_id, nama_panggilan');

                const enrichedLogs = cutiData.map(log => {
                    let matchedUser = null;

                    // 1. Coba cocokkan via discord_id jika ada di log cuti
                    if (log.discord_id && usersData) {
                        matchedUser = usersData.find(u => u.discord_id === log.discord_id);
                    }

                    // 2. Jika tidak ketemu, cocokkan berdasarkan kesamaan nama (ignoring case & whitespace)
                    if (!matchedUser && usersData) {
                        matchedUser = usersData.find(u => {
                            const uNameClean = (u.name || '').toLowerCase().trim();
                            const logNameClean = (log.nama_panggilan || '').toLowerCase().trim();
                            // Cek apakah nama di users mengandung nama cuti atau sebaliknya
                            return uNameClean.includes(logNameClean) || logNameClean.includes(uNameClean);
                        });
                    }

                    let badge = '-';
                    if (matchedUser?.name) {
                        badge = extractBadgeFromString(matchedUser.name);
                    } else {
                        badge = extractBadgeFromString(log.nama_panggilan);
                    }

                    return {
                        ...log,
                        badge_number: badge !== '-' ? badge : '03105' // Fallback aman jika struktur tabel belum sinkron
                    };
                });

                setCutiLogs(enrichedLogs);
            }
            setLoading(false);
        };

        void verifyAndFetch();
    }, [router]);

    const filteredCuti = useMemo(() => {
        return cutiLogs.filter(log => {
            const isPetinggi = ['JENDRAL', 'KOMJEN', 'IRJEN', 'BRIGJEN', 'KOMBESPOL'].includes(log.pangkat?.toUpperCase());
            const logStatusUpper = log.status?.toUpperCase() || '';
            const matchStatus = logStatusUpper === statusFilter;

            if (viewMode === 'PETINGGI') return isPetinggi && matchStatus;
            return !isPetinggi && matchStatus;
        });
    }, [cutiLogs, viewMode, statusFilter]);

    const handleAction = async (id: string, targetStatus: 'APPROVED' | 'REJECTED') => {
        const tId = toast.loading(`Memproses status ${targetStatus}...`);
        const dbStatusValue = targetStatus.toLowerCase();

        const currentLog = cutiLogs.find(log => log.id === id);

        const { error } = await supabase
            .from('pengajuan_cuti')
            .update({ status: dbStatusValue })
            .eq('id', id);

        if (error) {
            toast.error("Gagal memproses pengajuan!", { id: tId });
            return; 
        } 
        
        if (targetStatus === 'APPROVED' && currentLog) {
            try {
                await supabase
                    .from('rekap_absen')
                    .insert([{
                        nama_panggilan: currentLog.nama_panggilan,
                        pangkat: currentLog.pangkat,
                        status_kehadiran: 'CUTI', 
                        tanggal_mulai: currentLog.tanggal_mulai,
                        tanggal_selesai: currentLog.tanggal_selesai,
                        keterangan: currentLog.alasan
                    }]);

                const formattedName = toTitleCase(currentLog.nama_panggilan);
                const badgeNumber = currentLog.badge_number || '-';
                const formattedMulai = formatTanggalDiscord(currentLog.tanggal_mulai);
                const formattedSelesai = formatTanggalDiscord(currentLog.tanggal_selesai);

                const webhookUrl = "https://discord.com/api/webhooks/1534541668899098666/opXx4dxIWV_a2HIe2RVMeh_VN5iv1mdUejIvt0QlP8VEAG05fIgJ5UMjeP4nN8O35KIA"; 
                
                const discordPayload = {
                    content: `**SURAT IZIN**\n\n\`\`\`Nama: ${formattedName}\nBadge : ${badgeNumber}\nRank : ${currentLog.pangkat || '-'}\nDivision : ${currentLog.divisi || 'UNIT'}\nIzin tidak duty : ${formattedMulai}\nDuty aktif kembali : ${formattedSelesai}\nAlasan tidak duty : ${currentLog.alasan || '-'}\nApproved by : ${adminName}\`\`\`\n\n<@&1449382385090166844>\n<@&1518414822318800987>`
                };

                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(discordPayload)
                });

            } catch (err) {
                console.error("Error saat memproses rekap/webhook:", err);
            }
        }

        toast.success(`Cuti berhasil di-${targetStatus}!`, { id: tId });
        setCutiLogs(prevLogs =>
            prevLogs.map(log =>
                log.id === id ? { ...log, status: dbStatusValue } : log
            )
        );
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
        <div className="w-full max-w-6xl mx-auto space-y-6 font-mono pb-24 text-zinc-100 px-3 md:px-4 overflow-x-hidden">
            
            {/* HEADER PANEL */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl shadow-black/40">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-xl text-red-500 shrink-0">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-base md:text-xl uppercase tracking-wider text-zinc-100 flex items-center gap-2 flex-wrap">
                            Leave Management
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 border border-red-800/50 text-red-400 font-mono">ADMIN</span>
                        </h2>
                        <p className="text-[11px] md:text-xs text-zinc-500 font-medium">Verifikasi dan kelola pengajuan cuti personil</p>
                    </div>
                </div>

                <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 gap-1.5 w-full md:w-auto">
                    <button
                        onClick={() => setViewMode('ANGGOTA')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === 'ANGGOTA'
                                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <User size={14} /> <span>Anggota</span>
                    </button>
                    <button
                        onClick={() => setViewMode('PETINGGI')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === 'PETINGGI'
                                ? 'bg-red-950/80 text-red-300 border border-red-800/60 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <Crown size={14} className={viewMode === 'PETINGGI' ? 'text-red-400' : 'text-zinc-400'} /> <span>Petinggi</span>
                    </button>
                </div>
            </div>

            {/* STATUS FILTER TABS */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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
                            className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
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

            {/* LIST CONTENT */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <Loader2 className="animate-spin mb-3 text-red-600" size={32} />
                    <p className="font-bold uppercase tracking-widest text-xs text-zinc-400">Scanning Dossiers...</p>
                </div>
            ) : filteredCuti.length === 0 ? (
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-12 text-center shadow-xl shadow-black/30">
                    <ShieldCheck className="mx-auto text-zinc-600 mb-3" size={40} />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-300">Tidak Ada Antrian Cuti</h3>
                    <p className="text-xs text-zinc-500 mt-1">Belum ada data cuti tercatat di kategori status ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3.5 text-zinc-100">
                    <AnimatePresence mode="popLayout">
                        {filteredCuti.map((log) => {
                            const displayName = toTitleCase(log.nama_panggilan);
                            const badgeNum = log.badge_number || '-';

                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 md:p-5 flex flex-col gap-4 relative overflow-hidden shadow-lg shadow-black/40 hover:border-zinc-700/80 transition-all group"
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${viewMode === 'PETINGGI' ? 'bg-red-600' : 'bg-zinc-700'}`} />

                                    {/* Top Section Card */}
                                    <div className="flex items-start justify-between gap-3 pl-2">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                                                viewMode === 'PETINGGI'
                                                    ? 'bg-red-950/40 border-red-900/40 text-red-500'
                                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                                            }`}>
                                                {viewMode === 'PETINGGI' ? <Crown size={20} /> : <Briefcase size={20} />}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-xs md:text-sm tracking-tight text-zinc-100 truncate">
                                                    {displayName}
                                                </h4>
                                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                    <span className="bg-zinc-950 border border-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                                        {log.pangkat} • #{badgeNum}
                                                    </span>
                                                    {log.jenis_izin && (
                                                        <span className="bg-red-950/50 border border-red-900/40 text-red-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                                            {log.jenis_izin}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {statusFilter !== 'PENDING' && (
                                            <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                                statusFilter === 'APPROVED'
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                                            }`}>
                                                {statusFilter}
                                            </div>
                                        )}
                                    </div>

                                    {/* Alasan */}
                                    <div className="pl-2 pr-1">
                                        <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                                            <span className="text-zinc-500 font-medium block text-[10px] uppercase mb-0.5">Alasan:</span>
                                            <span className="text-zinc-300 italic">&quot;{log.alasan || 'Tidak ada alasan'}&quot;</span>
                                        </p>
                                    </div>

                                    {/* Footer Card */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/60 pl-2">
                                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-zinc-300 self-start sm:self-auto">
                                            <Clock className="text-red-500 shrink-0" size={14} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">
                                                {format(new Date(log.tanggal_mulai), 'dd MMM')} — {format(new Date(log.tanggal_selesai), 'dd MMM yyyy')}
                                            </span>
                                        </div>

                                        {statusFilter === 'PENDING' && (
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => handleAction(log.id, 'REJECTED')}
                                                    className="flex-1 sm:flex-none py-2.5 px-4 bg-red-950/30 border border-red-900/40 text-red-400 hover:bg-red-900/50 hover:text-red-200 rounded-xl transition-all font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <XCircle size={16} /> Tolak
                                                </button>
                                                <button
                                                    onClick={() => handleAction(log.id, 'APPROVED')}
                                                    className="flex-1 sm:flex-none py-2.5 px-4 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-200 rounded-xl transition-all font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <CheckCircle2 size={16} /> Approve
                                                </button>
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