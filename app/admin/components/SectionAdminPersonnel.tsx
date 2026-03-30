"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Zap, Clock, Search, Edit, UserMinus, AlertTriangle,
    ShieldAlert, CheckCircle2, X, Crown, UserPlus, Users, PieChart, Lock
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

// 🚀 TWEAK: Input style diperkecil paddingnya agar muat berdampingan di HP
const inputStyle = `w-full bg-[#f1f5f9] border-[2.5px] md:border-[3px] border-slate-950 rounded-lg md:rounded-xl px-2.5 py-2 md:px-4 md:py-3 text-[10px] md:text-xs font-mono font-bold focus:border-blue-600 focus:bg-white outline-none text-slate-900 transition-all shadow-[2px_2px_0px_#000] md:shadow-[3px_3px_0px_#000] appearance-none`;

export default function SectionAdminPersonnel() {
    const router = useRouter();
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    // MODAL STATE
    const [isAddMode, setIsAddMode] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
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

    const verifyAndFetch = async () => {
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
    };

    useEffect(() => { verifyAndFetch(); }, []);

    const stats = useMemo(() => {
        const total = personnel.length;
        const distribution = personnel.reduce((acc: any, p: any) => {
            const div = p.divisi || "TANPA DIVISI";
            acc[div] = (acc[div] || 0) + 1;
            return acc;
        }, {});
        return { total, distribution };
    }, [personnel]);

    const filteredPersonnel = personnel.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pangkat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.divisi?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const tId = toast.loading(isAddMode ? "Menginjeksi anggota baru..." : "Mengupdate data...");
        try {
            const payload: any = {
                name: editForm.name.toUpperCase(),
                pangkat: editForm.pangkat,
                divisi: editForm.divisi,
            };

            if (isSuperAdmin) {
                payload.discord_id = editForm.discord_id;
                payload.point_prp = Number(editForm.point_prp);
                payload.total_jam_duty = Number(editForm.total_jam_duty);
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
        } catch (error: any) { toast.error(`ERROR: ${error.message}`, { id: tId }); }
    };

    const handleTerminate = async (discordId: string, nama: string) => {
        if (!isSuperAdmin) return toast.error("Akses Ditolak! Hanya High Admin yang bisa memecat.");
        const confirmStr = prompt(`Ketik "PECANDAT" untuk MENGHAPUS ${nama} dari database:`);
        if (confirmStr !== "PECANDAT") return toast.error("Terminasi dibatalkan.");

        const tId = toast.loading("Membuang data personel...");
        try {
            const { error } = await supabase.from('users').delete().eq('discord_id', discordId);
            if (error) throw error;
            toast.success(`${nama} TELAH DI-TERMINATE!`, { id: tId });
            verifyAndFetch();
        } catch (error: any) { toast.error(`ERROR: ${error.message}`, { id: tId }); }
    };

    const openEditModal = (user: any) => {
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
        setIsAddMode(true); setOriginalDiscordId(""); setEditingUser({});
        setEditForm({
            name: '', discord_id: '', pangkat: 'CASIS', divisi: 'SABHARA', // 🚀 TWEAK: Default pangkat CASIS
            point_prp: 0, total_jam_duty: 0, is_highadmin: false, is_admin: false
        });
    };

    if (!isAuthorized && loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-950 animate-pulse">
                <Lock size={48} className="mb-4" />
                <p className="font-black italic uppercase text-xs">Accessing Personnel Files...</p>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 font-mono text-slate-950">
            <Toaster position="top-center" richColors />

            {/* DASHBOARD STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-3xl flex items-center gap-5`}>
                    <div className="bg-[#3B82F6] p-4 rounded-2xl border-2 border-black"><Users className="text-white" size={32} /></div>
                    <div><p className="text-[10px] font-black uppercase opacity-40 leading-none mb-1">Total Personnel</p><h3 className="text-4xl font-[1000] italic leading-none">{stats.total}</h3></div>
                </div>

                <div className={`md:col-span-3 bg-slate-950 p-6 ${boxBorder} ${hardShadow} rounded-3xl flex flex-wrap gap-4 items-center`}>
                    <div className="flex items-center gap-3 mr-4 text-white"><PieChart className="text-[#00E676]" size={24} /><span className="font-black italic text-xs uppercase">Unit Distribution:</span></div>
                    {Object.entries(stats.distribution).map(([name, count]: any) => (
                        <div key={name} className="bg-white border-2 border-black px-4 py-2 rounded-xl flex items-center gap-3 shadow-[3px_3px_0px_#00E676]">
                            <span className="text-[10px] font-black uppercase italic leading-none">{name}</span>
                            <span className="bg-[#00E676] px-2 py-0.5 rounded-md font-black text-xs border-2 border-black">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* HEADER & SEARCH BAR */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-[25px] flex flex-col md:flex-row gap-4 justify-between items-center`}>
                <div className="text-center md:text-left">
                    <h2 className="font-black italic uppercase text-xl md:text-2xl flex items-center justify-center md:justify-start gap-2 tracking-tighter"><Shield className="text-[#3B82F6]" /> Personnel Records</h2>
                    <p className="text-[10px] font-black uppercase opacity-60 italic leading-none mt-1">{isSuperAdmin ? "Otoritas High Admin Aktif" : "Standard Management Mode"}</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Cari Nama/Pangkat/Divisi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={cn(inputStyle, "pl-10 w-full md:w-64")} />
                    </div>
                    {isSuperAdmin && (
                        <button onClick={openAddModal} className="bg-[#A3E635] text-slate-950 border-[3px] border-slate-950 px-5 py-3 rounded-xl font-[1000] text-xs uppercase italic shadow-[4px_4px_0px_#000] active:translate-y-1 transition-all flex items-center justify-center gap-2">
                            <UserPlus size={16} strokeWidth={3} /> Tambah Personel
                        </button>
                    )}
                </div>
            </div>

            {/* DAFTAR PERSONEL */}
            {loading ? (
                <div className="text-center py-20 font-black italic uppercase animate-pulse">Scanning Intelligence Database...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPersonnel.map((p) => (
                        <div key={p.id} className={`bg-white ${boxBorder} ${hardShadow} rounded-[25px] flex flex-col overflow-hidden relative group`}>
                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                                {p.is_highadmin && <div className="bg-[#A78BFA] text-slate-950 border-2 border-slate-950 px-2 py-1 rounded-md text-[8px] font-black uppercase italic shadow-[2px_2px_0px_#000] flex items-center gap-1"><Crown size={10} /> HIGH ADMIN</div>}
                                {p.is_admin && !p.is_highadmin && <div className="bg-[#3B82F6] text-white border-2 border-slate-950 px-2 py-1 rounded-md text-[8px] font-black uppercase italic shadow-[2px_2px_0px_#000] flex items-center gap-1"><Shield size={10} /> STAFF ADMIN</div>}
                            </div>
                            <div className="bg-[#f8fafc] p-4 flex gap-4 items-center border-b-[3.5px] border-slate-950">
                                <div className="w-14 h-14 shrink-0 border-[3px] border-slate-950 bg-[#FFD100] shadow-[3px_3px_0px_#000] overflow-hidden rounded-xl flex items-center justify-center">
                                    {p.image ? <Image src={p.image} alt="User" width={56} height={56} className="object-cover w-full h-full" /> : <ShieldAlert size={24} />}
                                </div>
                                <div className="flex-1 min-w-0 pr-16">
                                    <h3 className="font-black text-sm uppercase truncate italic">{p.name?.split('|').pop()?.trim() || 'UNKNOWN'}</h3>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-tighter", p.pangkat === 'CASIS' ? "text-orange-500" : "text-[#3B82F6]")}>{p.pangkat} • {p.divisi}</p>
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3 flex-1">
                                <div className="bg-[#A3E635] border-[3px] border-slate-950 rounded-xl p-3 flex flex-col items-center justify-center shadow-[3px_3px_0px_#000]">
                                    <Clock size={16} className="mb-1" />
                                    <span className="font-black text-lg leading-none">{p.total_jam_duty ? Number(p.total_jam_duty).toFixed(1) : '0'}</span>
                                    <span className="text-[8px] font-bold uppercase mt-1 opacity-70">Jam Duty</span>
                                </div>
                                <div className="bg-[#FFD100] border-[3px] border-slate-950 rounded-xl p-3 flex flex-col items-center justify-center shadow-[3px_3px_0px_#000]">
                                    <Zap size={16} className="mb-1" />
                                    <span className="font-black text-lg leading-none">{p.point_prp || 0}</span>
                                    <span className="text-[8px] font-bold uppercase mt-1 opacity-70">Point PRP</span>
                                </div>
                            </div>
                            <div className="bg-slate-950 p-3 grid grid-cols-3 gap-2">
                                <button onClick={() => openEditModal(p)} className="bg-white col-span-2 border-2 border-transparent hover:border-white text-slate-950 py-2 rounded-lg font-black text-[10px] uppercase flex justify-center items-center gap-2 transition-all italic tracking-tighter"><Edit size={14} /> KELOLA</button>
                                <button onClick={() => handleTerminate(p.discord_id, p.name)} className="bg-[#FF4D4D] border-2 border-transparent hover:border-white text-white py-2 rounded-lg font-black text-[10px] uppercase flex justify-center items-center transition-all"><UserMinus size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 🚀 MODAL ADD / EDIT (ULTRA-COMPACT GRID FOR MOBILE) */}
            <AnimatePresence>
                {editingUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={`w-full max-w-lg bg-white ${boxBorder} rounded-[25px] md:rounded-[30px] flex flex-col text-slate-950 shadow-[10px_10px_0px_#000]`}
                        >
                            {/* HEADER */}
                            <div className={`${isAddMode ? 'bg-[#A3E635]' : 'bg-[#FFD100]'} p-4 border-b-[3.5px] border-slate-950 flex justify-between items-center rounded-t-[21px] md:rounded-t-[26px] shrink-0`}>
                                <h3 className="font-black italic uppercase text-sm md:text-lg leading-none">{isAddMode ? 'REKRUTMEN BARU' : 'DOSSIER MODIFICATION'}</h3>
                                <button onClick={() => setEditingUser(null)} className="p-1.5 bg-white border-2 border-slate-950 rounded-lg shadow-[2px_2px_0px_#000] active:translate-y-px active:shadow-none"><X size={16} /></button>
                            </div>

                            {/* BODY FORM (Grid 2 Kolom Aktif di HP) */}
                            <div className="p-4 md:p-6 flex-1">
                                <form id="personnelForm" onSubmit={handleSubmit} className="space-y-3 md:space-y-5">

                                    {/* BARIS 1: NAMA & DISCORD ID */}
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div>
                                            <label className="text-[8px] md:text-[10px] font-black uppercase italic ml-1 mb-1 block">NAMA PERSONEL</label>
                                            <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputStyle} required />
                                        </div>
                                        <div>
                                            <label className="text-[8px] md:text-[10px] font-black uppercase italic ml-1 mb-1 block">DISCORD ID</label>
                                            <input type="text" value={editForm.discord_id} onChange={e => setEditForm({ ...editForm, discord_id: e.target.value })} className={cn(inputStyle, !isSuperAdmin && "opacity-50 bg-slate-200 cursor-not-allowed")} required disabled={!isSuperAdmin} />
                                        </div>
                                    </div>

                                    {/* BARIS 2: PANGKAT & DIVISI */}
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div>
                                            <label className="text-[8px] md:text-[10px] font-black uppercase italic ml-1 mb-1 block">PANGKAT</label>
                                            <select value={editForm.pangkat} onChange={e => setEditForm({ ...editForm, pangkat: e.target.value })} className={inputStyle} required>
                                                <option value="CASIS">CASIS (CALON SISWA)</option>
                                                <option value="BHARADA">BHARADA</option>
                                                <option value="BRIPDA">BRIPDA</option>
                                                <option value="BRIPTU">BRIPTU</option>
                                                <option value="BRIGPOL">BRIGPOL</option>
                                                <option value="BRIPKA">BRIPKA</option>
                                                <option value="AIPDA">AIPDA</option>
                                                <option value="AIPTU">AIPTU</option>
                                                <option value="IPDA">IPDA</option>
                                                <option value="IPTU">IPTU</option>
                                                <option value="AKP">AKP</option>
                                                <option value="KOMPOL">KOMPOL</option>
                                                <option value="AKBP">AKBP</option>
                                                <option value="KOMBESPOL">KOMBESPOL</option>
                                                <option value="BRIGJEN">BRIGJEN</option>
                                                <option value="IRJEN">IRJEN</option>
                                                <option value="KOMJEN">KOMJEN</option>
                                                <option value="JENDRAL">JENDRAL</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[8px] md:text-[10px] font-black uppercase italic ml-1 mb-1 block">DIVISI UNIT</label>
                                            <select value={editForm.divisi} onChange={e => setEditForm({ ...editForm, divisi: e.target.value })} className={inputStyle} required>
                                                <option value="SABHARA">SABHARA</option><option value="SATLANTAS">SATLANTAS</option>
                                                <option value="BRIMOB">BRIMOB</option><option value="PROPAM">PROPAM</option>
                                                <option value="PETINGGI">PETINGGI (HC)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* KONTROL OVERRIDE (Khusus Admin) */}
                                    {isSuperAdmin && (
                                        <div className="p-3 md:p-5 bg-slate-50 border-[2px] md:border-[3px] border-slate-950 rounded-xl md:rounded-[20px] space-y-3 shadow-inner">
                                            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1.5 md:pb-2">
                                                <h4 className="font-black italic uppercase text-[9px] md:text-xs text-red-600">High Authority Override</h4>
                                                <ShieldAlert size={14} className="text-red-500" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                                <div>
                                                    <label className="text-[8px] md:text-[9px] font-black uppercase mb-1 block">JAM DUTY</label>
                                                    <input type="number" step="0.1" value={editForm.total_jam_duty} onChange={e => setEditForm({ ...editForm, total_jam_duty: Number(e.target.value) })} className={cn(inputStyle, "py-1.5 md:py-2 text-center")} />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] md:text-[9px] font-black uppercase mb-1 block">POINT PRP</label>
                                                    <input type="number" value={editForm.point_prp} onChange={e => setEditForm({ ...editForm, point_prp: Number(e.target.value) })} className={cn(inputStyle, "py-1.5 md:py-2 text-center")} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 md:gap-3">
                                                <label className="flex items-center justify-center md:justify-start gap-1.5 md:gap-2 p-2 bg-white border-2 border-black rounded-lg cursor-pointer hover:bg-slate-100 transition-all">
                                                    <input type="checkbox" checked={editForm.is_admin} onChange={e => setEditForm({ ...editForm, is_admin: e.target.checked })} className="w-3.5 h-3.5 md:w-4 md:h-4 accent-slate-950 shrink-0" />
                                                    <span className="text-[8px] md:text-[9px] font-black uppercase italic whitespace-nowrap">Akses Staff</span>
                                                </label>
                                                <label className="flex items-center justify-center md:justify-start gap-1.5 md:gap-2 p-2 bg-white border-2 border-black rounded-lg cursor-pointer hover:bg-slate-100 transition-all">
                                                    <input type="checkbox" checked={editForm.is_highadmin} onChange={e => setEditForm({ ...editForm, is_highadmin: e.target.checked })} className="w-3.5 h-3.5 md:w-4 md:h-4 accent-slate-950 shrink-0" />
                                                    <span className="text-[8px] md:text-[9px] font-black uppercase italic whitespace-nowrap">High Admin</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <button type="submit" form="personnelForm" className={`w-full py-3.5 md:py-4 ${isAddMode ? 'bg-[#3B82F6] text-white' : 'bg-[#A3E635] text-slate-950'} border-[3px] border-slate-950 rounded-xl font-[1000] uppercase italic tracking-widest shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 text-[10px] md:text-sm`}>
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
        </div>
    );
}