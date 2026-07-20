"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Users, FileText, Server, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// IMPORT KOMPONEN
import SectionAdminPersonnel from './components/SectionAdminPersonnel';
import SectionAdminSystem from './components/SectionAdminSystem';
import SectionAdminLaporan from './components/SectionAdminLaporan';
import SectionAdminConfig from './components/SectionAdminConfig';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export default function AdminHQPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PERSONEL' | 'LAPORAN' | 'SYSTEM'>('PERSONEL');
    const [personelSubTab, setPersonelSubTab] = useState<'DATA_ANGGOTA' | 'REKAP_ABSEN'>('DATA_ANGGOTA');

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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 font-sans text-zinc-300 font-semibold text-xs tracking-wider animate-pulse">
            <Loader2 className="animate-spin mr-2.5 text-red-500" size={16} /> VERIFYING CLEARANCE...
        </div>
    );

    type MainTabId = 'PERSONEL' | 'LAPORAN' | 'SYSTEM';
    const mainTabs: { id: MainTabId; icon: React.ReactNode; label: string }[] = [
        { id: 'PERSONEL', icon: <Users size={16} />, label: 'Personel' },
        { id: 'LAPORAN', icon: <FileText size={16} />, label: 'Laporan' },
        { id: 'SYSTEM', icon: <Server size={16} />, label: 'System' }
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24 relative overflow-x-hidden">
            {/* --- HEADER NAVIGASI MASTER --- */}
            <div className="bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 gap-4">

                        {/* KIRI: Logo & Judul */}
                        <div className="flex justify-between items-center w-full md:w-auto">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-red-500 shadow-xs">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-zinc-100">Internal Affairs</h1>
                                    <p className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">High Command Console</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => router.push('/dashboard')} 
                                className="md:hidden p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-800 active:scale-95 transition-all shadow-xs"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        </div>

                        {/* KANAN: MENU UTAMA DINAMIS */}
                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                            <button 
                                onClick={() => router.push('/dashboard')} 
                                className="hidden md:flex items-center gap-2 px-3.5 py-2.5 bg-zinc-900 text-zinc-400 hover:text-zinc-100 rounded-xl font-medium text-xs transition-all border border-zinc-800 shadow-xs"
                            >
                                <ArrowLeft size={16} /> Base
                            </button>
                            <div className="hidden md:block w-[1px] h-6 bg-zinc-800 mx-1"></div>

                            {mainTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all border whitespace-nowrap shadow-xs",
                                        activeTab === tab.id
                                            ? "bg-red-600 text-white border-red-500 shadow-red-900/30"
                                            : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border-zinc-800/80"
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

                        {/* 1. PERSONEL */}
                        {activeTab === 'PERSONEL' && (
                            <div className="space-y-6">
                                <div className="flex bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800/80 w-fit max-w-full overflow-x-auto shadow-xs hide-scrollbar">
                                    {([
                                        { id: 'DATA_ANGGOTA', label: 'Data Anggota' },
                                        { id: 'REKAP_ABSEN', label: 'Rekap Absensi' }
                                    ] as { id: 'DATA_ANGGOTA' | 'REKAP_ABSEN'; label: string }[]).map(sub => (
                                        <button 
                                            key={sub.id} 
                                            onClick={() => setPersonelSubTab(sub.id)} 
                                            className={cn(
                                                "px-3.5 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap", 
                                                personelSubTab === sub.id 
                                                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs" 
                                                    : "text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                                {personelSubTab === 'DATA_ANGGOTA' && <SectionAdminPersonnel />}
                                {personelSubTab === 'REKAP_ABSEN' && <SectionAdminSystem />}
                            </div>
                        )}

                        {/* 2. LAPORAN */}
                        {activeTab === 'LAPORAN' && <SectionAdminLaporan />}

                        {/* 3. SYSTEM */}
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