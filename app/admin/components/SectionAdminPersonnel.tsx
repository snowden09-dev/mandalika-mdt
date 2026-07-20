"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Search, Edit, UserMinus,
    ShieldAlert, CheckCircle2, X, Crown, UserPlus, Users, PieChart, Lock, TrendingUp, Zap
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const cn = (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(' ');

const cardBorder = "border border-zinc-800/80";
const cardShadow = "shadow-xl shadow-black/40";

const inputStyle = `w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono font-medium focus:border-red-500 focus:bg-zinc-900/90 outline-none text-zinc-100 transition-all`;

interface UserProfile {
    id?: string | number;
    discord_id: string;
    name: string;
    pangkat: string;
    divisi: string;
    point_prp: number;
    total_jam_duty: number;
    is_highadmin: boolean;
    is_admin: boolean;
    image?: string;
}

// 🚀 DATABASE PANGKAT TERBARU
const RANKS_DB = [
    { name: "CASIS", prp: 0, hrs: 0 },
    { name: "RECRUIT", prp: 0, hrs: 0 },
    { name: "BHARADA", prp: 0, hrs: 0 },
    { name: "ABRIPTU", prp: 180, hrs: 30 },
    { name: "ABRIGPOL", prp: 250, hrs: 40 },
    { name: "BRIPDA", prp: 320, hrs: 50 },
    { name: "BRIPTU", prp: 400, hrs: 60 },
    { name: "BRIGPOL", prp: 550, hrs: 75 },
    { name: "BRIPKA", prp: 700, hrs: 90 },
    { name: "AIPDA", prp: 850, hrs: 110 },
    { name: "AIPTU", prp: 1000, hrs: 130 },
    { name: "IPDA", prp: 1200, hrs: 150 },
    { name: "IPTU", prp: 1500, hrs: 180 },
    { name: "AKP", prp: 1800, hrs: 220 },
    { name: "KOMPOL", prp: 2200, hrs: 260 },
    { name: "AKBP", prp: 2800, hrs: 320 },
    { name: "KOMBESPOL", prp: 3500, hrs: 400 },
    { name: "BRIGJEN", prp: 6000, hrs: 600 },
    { name: "IRJEN", prp: 9000, hrs: 900 },
    { name: "KOMJEN", prp: 12000, hrs: 1200 },
    { name: "JENDRAL", prp: 18000, hrs: 1800 },
];

export default function SectionAdminPersonnel() {
    const router = useRouter();
    const [personnel, setPersonnel] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDivisi, setSelectedDivisi] = useState("ALL");
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    // MODAL STATE
    const [isAddMode, setIsAddMode] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [originalDiscordId, setOriginalDiscordId] = useState("");

    const [editForm, setEditForm] = useState({
        name: '',
        discord_id: '',
        pangkat: '',
        divisi: '',
        point_prp: 0,
        total_jam_duty: 0,
        is_highadmin: false,
        is_admin: false
    });

    const verifyAndFetch = useCallback(async () => {
        setLoading(true);
        const sessionData = localStorage.getItem('police_session');
        if (!sessionData) { router.push('/'); return; }

        const parsed = JSON.parse(sessionData);

        const { data: auth, error: authError } = await supabase.from('users').select('pangkat, is_highadmin, is_admin').eq('discord_id', parsed.discord_id).single();

        if (authError || (!auth.is_admin && !auth.is_highadmin)) {
            toast.error("AKSES DITOLAK! Anda tidak memiliki otoritas personel.");
            router.push('/dashboard');
            return;
        }

        setIsAuthorized(true);
        if (auth.pangkat === 'JENDRAL' || auth.is_highadmin === true) setIsSuperAdmin(true);

        const { data } = await supabase.from('users').select('*').order('point_prp', { ascending: false });
        if (data) setPersonnel(data);
        setLoading(false);
    }, [router]);

    useEffect(() => { 
        verifyAndFetch(); 
    }, [verifyAndFetch]);

    const stats = useMemo(() => {
        const total = personnel.length;
        const distribution = personnel.reduce((acc: Record<string, number>, p: UserProfile) => {
            const div = p.divisi || "TANPA DIVISI";
            acc[div] = (acc[div] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return { total, distribution };
    }, [personnel]);

    // 🚀 ENGINE FILTER PENCARIAN & DIVISI
    const filteredPersonnel = personnel.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.pangkat?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchDivisi = selectedDivisi === "ALL" || p.divisi?.toUpperCase() === selectedDivisi;
        return matchSearch && matchDivisi;
    });

    // 🚀 ENGINE KALKULASI PROGRESS PANGKAT
    const getRankProgress = (pangkat: string, currentPrp: number, currentHrs: number) => {
        const p = pangkat?.toUpperCase().trim() || "CASIS";
        const currentIndex = RANKS_DB.findIndex(r => r.name === p);

        if (currentIndex === -1 || currentIndex === RANKS_DB.length - 1) {
            return { nextRank: "MAX RANK", progress: 100, isReady: false, reqStr: "MAX LEVEL" };
        }

        const currentRank = RANKS_DB[currentIndex];
        const nextRank = RANKS_DB[currentIndex + 1];

        const prpTersimpan = currentPrp || 0;
        const hrsTersimpan = currentHrs || 0;

        const gapTotal = nextRank.prp - currentRank.prp;
        let progressPercent = 0;

        if (gapTotal > 0) {
            const gapDidapat = Math.max(0, prpTersimpan - currentRank.prp);
            progressPercent = (gapDidapat / gapTotal) * 100;
        } else {
            progressPercent = 100;
        }

        if (progressPercent > 100) progressPercent = 100;
        const isReady = prpTersimpan >= nextRank.prp && hrsTersimpan >= nextRank.hrs;

        return {
            nextRank: nextRank.name,
            progress: progressPercent,
            isReady,
            reqStr: `${prpTersimpan}/${nextRank.prp} PRP`
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const tId = toast.loading(isAddMode ? "Menginjeksi anggota baru..." : "Mengupdate data...");
        try {
            const payload: Partial<UserProfile> = {
                name: editForm.name.toUpperCase(),
                pangkat: editForm.pangkat,
                divisi: editForm.divisi,
            };

            if (isSuperAdmin) {
                payload.discord_id = editForm.discord_id;
                payload.point_prp = Number(editForm.point_prp);
                payload.total_jam_duty = Number(editForm.total_jam_duty || 0);
                payload.is_highadmin = editForm.is_highadmin;
                payload.is_admin = editForm.is_admin;
            }

            if (isAddMode) {
                const { error } = await supabase.from('users').insert([payload]);
                if (error) throw error;
                toast.success("ANGGOTA BARU BERHASIL DITAMBAHKAN!", { id: tId });
            } else {
                const { error } = await supabase.from('users').update(payload).eq('discord_id', originalDiscordId);
                if (error) throw error;
                toast.success("DATA PERSONEL DIPERBARUI!", { id: tId });
            }

            setEditingUser(null);
            verifyAndFetch();
        } catch (error: unknown) { 
            const errMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
            toast.error(`ERROR: ${errMessage}`, { id: tId }); 
        }
    };

    const handleTerminate = async (discordId: string, namaClean: string) => {
        if (!isSuperAdmin) return toast.error("Akses Ditolak! Hanya High Admin yang bisa memecat.");
        const confirmStr = prompt(`Ketik "PECANDAT" untuk MENGHAPUS ${namaClean} dari database:`);
        if (confirmStr !== "PECANDAT") return toast.error("Terminasi dibatalkan.");

        const tId = toast.loading("Membuang data personel...");
        try {
            const { error } = await supabase.from('users').delete().eq('discord_id', discordId);
            if (error) throw error;
            toast.success(`${namaClean} TELAH DI-TERMINATE!`, { id: tId });
            verifyAndFetch();
        } catch (error: unknown) { 
            const errMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
            toast.error(`ERROR: ${errMessage}`, { id: tId }); 
        }
    };

    const openEditModal = (user: UserProfile) => {
        setIsAddMode(false);
        setOriginalDiscordId(user.discord_id);
        setEditingUser(user);
        setEditForm({
            name: user.name || '', discord_id: user.discord_id || '',
            pangkat: user.pangkat || '', divisi: user.divisi || '',
            point_prp: user.point_prp || 0, total_jam_duty: user.total_jam_duty || 0,
            is_highadmin: user.is_highadmin || false, is_admin: user.is_admin || false
        });
    };

    const openAddModal = () => {
        setIsAddMode(true); 
        setOriginalDiscordId(""); 
        setEditingUser({
            discord_id: '',
            name: '',
            pangkat: 'CASIS',
            divisi: 'SABHARA',
            point_prp: 0,
            total_jam_duty: 0,
            is_highadmin: false,
            is_admin: false
        });
        setEditForm({
            name: '', discord_id: '', pangkat: 'CASIS', divisi: 'SABHARA',
            point_prp: 0, total_jam_duty: 0, is_highadmin: false, is_admin: false
        });
    };

    if (!isAuthorized && loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 animate-pulse bg-zinc-950 min-h-screen">
                <Lock size={48} className="mb-4 text-red-500" />
                <p className="font-mono font-bold uppercase text-xs tracking-widest">Accessing Personnel Files...</p>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 font-mono text-zinc-100 bg-zinc-950 min-h-screen p-4 md:p-6 relative">
            <Toaster position="top-center" richColors theme="dark" />

            {/* DASHBOARD STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className={`bg-zinc-900 ${cardBorder} ${cardShadow} p-6 rounded-2xl flex items-center gap-5`}>
                    <div className="bg-red-600/10 border border-red-500/20 p-4 rounded-xl text-red-500"><Users size={28} /></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Total Personnel</p><h3 className="text-3xl font-extrabold tracking-tight text-white">{stats.total}</h3></div>
                </div>

                <div className={`md:col-span-3 bg-zinc-900 p-6 ${cardBorder} ${cardShadow} rounded-2xl flex flex-wrap gap-3 items-center`}>
                    <div className="flex items-center gap-2 mr-3 text-zinc-300"><PieChart className="text-red-500" size={20} /><span className="font-bold text-xs uppercase tracking-wider">Unit Distribution:</span></div>
                    {Object.entries(stats.distribution).map(([name, count]) => (
                        <div key={name} className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2.5">
                            <span className="text-[10px] font-bold text-zinc-300 uppercase">{name}</span>
                            <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold text-[10px] border border-red-500/20">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* HEADER & CONTROLS */}
            <div className={`bg-zinc-900 ${cardBorder} ${cardShadow} p-5 md:p-6 rounded-2xl flex flex-col gap-5`}>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
                    <div className="text-center md:text-left w-full md:w-auto">
                        <h2 className="font-extrabold uppercase text-lg md:text-xl flex items-center justify-center md:justify-start gap-2.5 tracking-tight text-white">
                            <Shield className="text-red-500" size={22} /> Personnel Records
                        </h2>
                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-1">{isSuperAdmin ? "High Admin Authority Active" : "Standard Management Mode"}</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input type="text" placeholder="Cari Nama/Pangkat..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={cn(inputStyle, "pl-10 w-full md:w-60")} />
                        </div>
                        {isSuperAdmin && (
                            <button onClick={openAddModal} className="bg-red-600 hover:bg-red-700 text-white border border-red-500/40 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer">
                                <UserPlus size={16} /> Tambah Personel
                            </button>
                        )}
                    </div>
                </div>

                {/* 🚀 FILTER DIVISI */}
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-2 border-t border-zinc-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider mr-2 text-zinc-500 shrink-0">Filter:</span>
                    {['ALL', 'SABHARA', 'SATLANTAS', 'BRIMOB', 'PROPAM', 'PETINGGI'].map((div) => (
                        <button
                            key={div}
                            onClick={() => setSelectedDivisi(div)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer",
                                selectedDivisi === div
                                    ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20"
                                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                            )}
                        >
                            {div}
                        </button>
                    ))}
                </div>
            </div>

            {/* DAFTAR PERSONEL */}
            {loading ? (
                <div className="text-center py-20 font-bold uppercase tracking-widest text-zinc-500 animate-pulse text-xs">Scanning Intelligence Database...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredPersonnel.length === 0 && (
                        <div className="col-span-full py-16 text-center text-zinc-500 font-bold uppercase tracking-wider text-xs">Tidak ada personel yang sesuai filter.</div>
                    )}
                    {filteredPersonnel.map((p) => {
                        const promoProgress = getRankProgress(p.pangkat, p.point_prp, p.total_jam_duty);

                        let rawName = p.name || 'UNKNOWN';
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
                            <div key={p.id || p.discord_id} className={`bg-zinc-900 ${cardBorder} ${cardShadow} rounded-2xl flex flex-col overflow-hidden relative group`}>
                                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
                                    {p.is_highadmin && <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"><Crown size={10} /> HIGH ADMIN</div>}
                                    {p.is_admin && !p.is_highadmin && <div className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"><Shield size={10} /> STAFF</div>}
                                </div>

                                <div className="bg-zinc-950/70 p-4 flex gap-3.5 items-center border-b border-zinc-800/80 relative overflow-hidden">
                                    <div className="w-12 h-12 shrink-0 border border-zinc-800 bg-zinc-900 overflow-hidden rounded-xl flex items-center justify-center relative z-10 shadow-inner">
                                        {p.image ? <Image src={p.image} alt="User" width={48} height={48} className="object-cover w-full h-full" /> : <ShieldAlert size={20} className="text-zinc-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-16 relative z-10">
                                        <h3 className="font-extrabold text-xs uppercase truncate text-zinc-100">{cleanName}</h3>
                                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight truncate mt-0.5">
                                            {p.pangkat} • #{badgeNumber} • {p.divisi || 'UNIT'}
                                        </p>
                                    </div>
                                </div>

                                {/* 🚀 PROGRESS BAR PANGKAT SECTION */}
                                <div className="bg-zinc-900 border-b border-zinc-800/80 p-4">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <TrendingUp size={12} className={promoProgress.isReady ? "text-green-500" : "text-zinc-500"} />
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                                                Next: <span className={promoProgress.isReady ? "text-green-400 font-extrabold" : "text-zinc-200"}>{promoProgress.nextRank}</span>
                                            </span>
                                        </div>
                                        <span className={cn("text-[9px] font-extrabold uppercase tracking-wider", promoProgress.isReady ? "text-green-400 animate-pulse" : "text-zinc-500")}>
                                            {promoProgress.isReady ? "SIAP PROMOSI!" : `${promoProgress.progress.toFixed(0)}%`}
                                        </span>
                                    </div>

                                    <div className="w-full h-2.5 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${promoProgress.progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={cn(
                                                "h-full rounded-full",
                                                promoProgress.isReady ? "bg-green-500" : "bg-red-600"
                                            )}
                                        />
                                    </div>
                                    <p className="text-[8px] font-medium text-right mt-1.5 text-zinc-500 tracking-tight">Target: {promoProgress.reqStr}</p>
                                </div>

                                <div className="p-4 flex-1">
                                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20">
                                                <Zap size={16} />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block leading-none mb-1">Total Points</span>
                                                <span className="font-extrabold text-sm text-zinc-100 leading-none">{p.point_prp || 0} PRP</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block leading-none mb-1">Status</span>
                                            <span className="text-[10px] font-extrabold text-green-500 uppercase tracking-wider">ACTIVE</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-zinc-950 grid grid-cols-3 gap-2 border-t border-zinc-800/80">
                                    <button onClick={() => openEditModal(p)} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 col-span-2 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider flex justify-center items-center gap-2 transition-all cursor-pointer">
                                        <Edit size={13} className="text-red-500" /> KELOLA
                                    </button>
                                    <button onClick={() => handleTerminate(p.discord_id, cleanName)} className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 py-2 rounded-xl font-bold text-[10px] uppercase flex justify-center items-center transition-all cursor-pointer">
                                        <UserMinus size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 🚀 MODAL ADD / EDIT */}
            <AnimatePresence>
                {editingUser && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={`w-full max-w-lg bg-zinc-950 ${cardBorder} rounded-2xl flex flex-col text-zinc-100 shadow-2xl shadow-black overflow-hidden relative`}
                        >
                            <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
                                <h3 className="font-extrabold uppercase text-xs tracking-wider text-white flex items-center gap-2">
                                    <Shield size={16} className="text-red-500" />
                                    {isAddMode ? 'REKRUTMEN BARU' : 'DOSSIER MODIFICATION'}
                                </h3>
                                <button type="button" onClick={() => setEditingUser(null)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-all cursor-pointer"><X size={16} /></button>
                            </div>

                            <div className="p-5 md:p-6 flex-1 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                <form id="personnelForm" onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 ml-1 mb-1 block">NAMA PERSONEL</label>
                                            <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputStyle} required />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 ml-1 mb-1 block">DISCORD ID</label>
                                            <input type="text" value={editForm.discord_id} onChange={e => setEditForm({ ...editForm, discord_id: e.target.value })} className={cn(inputStyle, !isSuperAdmin && "opacity-50 bg-zinc-900/50 cursor-not-allowed")} required disabled={!isSuperAdmin} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 ml-1 mb-1 block">PANGKAT</label>
                                            <select value={editForm.pangkat} onChange={e => setEditForm({ ...editForm, pangkat: e.target.value })} className={cn(inputStyle, "cursor-pointer")} required>
                                                {RANKS_DB.map((r) => (
                                                    <option key={r.name} value={r.name} className="bg-zinc-900 text-zinc-100">{r.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 ml-1 mb-1 block">DIVISI UNIT</label>
                                            <select value={editForm.divisi} onChange={e => setEditForm({ ...editForm, divisi: e.target.value })} className={cn(inputStyle, "cursor-pointer")} required>
                                                <option value="SABHARA" className="bg-zinc-900 text-zinc-100">SABHARA</option>
                                                <option value="SATLANTAS" className="bg-zinc-900 text-zinc-100">SATLANTAS</option>
                                                <option value="BRIMOB" className="bg-zinc-900 text-zinc-100">BRIMOB</option>
                                                <option value="PROPAM" className="bg-zinc-900 text-zinc-100">PROPAM</option>
                                                <option value="PETINGGI" className="bg-zinc-900 text-zinc-100">PETINGGI (HC)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {isSuperAdmin && (
                                        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3.5">
                                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                                <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-red-500">High Authority Override</h4>
                                                <ShieldAlert size={14} className="text-red-500" />
                                            </div>

                                            <div>
                                                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">POINT PRP</label>
                                                <input type="number" value={editForm.point_prp} onChange={e => setEditForm({ ...editForm, point_prp: Number(e.target.value) })} className={cn(inputStyle, "py-2 text-center")} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                                                <label className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-all">
                                                    <input type="checkbox" checked={editForm.is_admin} onChange={e => setEditForm({ ...editForm, is_admin: e.target.checked })} className="w-3.5 h-3.5 accent-red-600 shrink-0 cursor-pointer" />
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-300">Akses Staff</span>
                                                </label>
                                                <label className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-all">
                                                    <input type="checkbox" checked={editForm.is_highadmin} onChange={e => setEditForm({ ...editForm, is_highadmin: e.target.checked })} className="w-3.5 h-3.5 accent-red-600 shrink-0 cursor-pointer" />
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-300">High Admin</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <button type="submit" className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white border border-red-500/40 rounded-xl font-extrabold uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all flex justify-center items-center gap-2 text-xs cursor-pointer">
                                            {isAddMode ? <UserPlus size={16} /> : <CheckCircle2 size={16} />}
                                            {isAddMode ? 'REKRUT PERSONEL' : 'UPDATE DATA'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
            `}</style>
        </div>
    );
}