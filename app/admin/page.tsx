"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Users, FileText, Banknote, Server, Loader2, ArrowLeft, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// IMPORT SEMUA KOMPONEN
import SectionAdminPersonnel from './components/SectionAdminPersonnel';
import SectionAdminCuti from './components/SectionAdminCuti';
import SectionAdminSystem from './components/SectionAdminSystem';
import SectionAdminLaporan from './components/SectionAdminLaporan';
import SectionAdminPayroll from './components/SectionAdminPayroll';
import SectionAdminConfig from './components/SectionAdminConfig';
import SectionAdminDivisi from './components/SectionAdminDivisi'; // KOMPONEN BARU

export default function AdminHQPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PERSONEL' | 'DIVISI' | 'LAPORAN' | 'FINANCE' | 'SYSTEM'>('PERSONEL');

    // Sub-tab khusus untuk Personel
    const [personelSubTab, setPersonelSubTab] = useState<'DATA_ANGGOTA' | 'CUTI' | 'REKAP_ABSEN'>('DATA_ANGGOTA');

    useEffect(() => {
        const checkAuth = async () => {
            const sessionData = localStorage.getItem('police_session');
            if (!sessionData) { router.push('/'); return; }

            const parsed = JSON.parse(sessionData);
            const { data } = await supabase.from('users').select('is_admin, is_highadmin').eq('discord_id', parsed.discord_id).single();

            if (!data?.is_admin && !data?.is_highadmin) {
                router.push('/dashboard');
            } else {
                setLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-100 font-mono text-black font-black italic text-xl animate-pulse"><Loader2 className="animate-spin mr-3" /> VERIFYING CLEARANCE...</div>;

    const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

    return (
        <div className="min-h-screen bg-slate-50 font-mono text-slate-950 pb-24">
            {/* --- HEADER NAVIGASI MASTER --- */}
            <div className="bg-slate-950 text-white sticky top-0 z-50 border-b-[6px] border-[#3B82F6] shadow-[0px_10px_0px_#000]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 gap-4">

                        {/* KIRI: Logo & Judul */}
                        <div className="flex justify-between items-center w-full md:w-auto">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={36} className="text-[#3B82F6]" />
                                <div>
                                    <h1 className="text-2xl font-[1000] uppercase italic leading-none">Internal Affairs</h1>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">High Command Console</p>
                                </div>
                            </div>
                            <button onClick={() => router.push('/dashboard')} className="md:hidden bg-slate-800 text-white p-2.5 rounded-xl border-2 border-slate-700 active:scale-95 transition-all shadow-[2px_2px_0_0_#3B82F6]">
                                <ArrowLeft size={20} />
                            </button>
                        </div>

                        {/* KANAN: MENU UTAMA (5 TAB BESAR) */}
                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                            <button onClick={() => router.push('/dashboard')} className="hidden md:flex items-center gap-2 px-4 py-3 bg-slate-800 text-slate-400 hover:text-white rounded-xl font-black text-xs uppercase italic transition-all border-2 border-transparent hover:border-slate-600">
                                <ArrowLeft size={16} /> Base
                            </button>
                            <div className="hidden md:block w-[2px] h-8 bg-slate-800 mx-1"></div>

                            {[
                                { id: 'PERSONEL', icon: <Users size={16} />, label: 'Personel' },
                                { id: 'DIVISI', icon: <Crosshair size={16} />, label: 'Divisi Area' }, // TAB BARU
                                { id: 'LAPORAN', icon: <FileText size={16} />, label: 'Laporan' },
                                { id: 'FINANCE', icon: <Banknote size={16} />, label: 'Finance' },
                                { id: 'SYSTEM', icon: <Server size={16} />, label: 'System' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-3 rounded-xl font-black text-xs uppercase italic transition-all border-2 border-transparent whitespace-nowrap",
                                        activeTab === tab.id ? "bg-[#3B82F6] text-white border-white shadow-[3px_3px_0px_#fff]" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                    )}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- KONTEN DINAMIS --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

                        {/* 1. PERSONEL */}
                        {activeTab === 'PERSONEL' && (
                            <div className="space-y-6">
                                <div className="flex bg-slate-200 p-1.5 rounded-2xl border-[3.5px] border-black w-fit max-w-full overflow-x-auto shadow-[4px_4px_0px_#000] hide-scrollbar">
                                    {[
                                        { id: 'DATA_ANGGOTA', label: 'Data Anggota' },
                                        { id: 'CUTI', label: 'Pengajuan Cuti' },
                                        { id: 'REKAP_ABSEN', label: 'Rekap Absensi' }
                                    ].map(sub => (
                                        <button key={sub.id} onClick={() => setPersonelSubTab(sub.id as any)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all whitespace-nowrap", personelSubTab === sub.id ? "bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000]" : "text-slate-500 hover:text-black")}>
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                                {personelSubTab === 'DATA_ANGGOTA' && <SectionAdminPersonnel />}
                                {personelSubTab === 'CUTI' && <SectionAdminCuti />}
                                {personelSubTab === 'REKAP_ABSEN' && <SectionAdminSystem />}
                            </div>
                        )}

                        {/* 2. DIVISI AREA */}
                        {activeTab === 'DIVISI' && <SectionAdminDivisi />}

                        {/* 3. LAPORAN */}
                        {activeTab === 'LAPORAN' && <SectionAdminLaporan />}

                        {/* 4. FINANCE */}
                        {activeTab === 'FINANCE' && <SectionAdminPayroll />}

                        {/* 5. SYSTEM */}
                        {activeTab === 'SYSTEM' && <SectionAdminConfig />}

                    </motion.div>
                </AnimatePresence>
            </div>
            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}