"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Users, CalendarCheck, LayoutDashboard,
    ArrowLeft, Banknote, FileSpreadsheet, ClipboardList, Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';

// Import Section
import SectionAdminCuti from "./components/SectionAdminCuti";
import SectionAdminPersonnel from "./components/SectionAdminPersonnel";
import SectionAdminSystem from "./components/SectionAdminSystem";
import SectionAdminPayroll from "./components/SectionAdminPayroll";
import SectionAdminLaporan from "./components/SectionAdminLaporan";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminPortal() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('cuti');
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const verifyAdmin = async () => {
            const sessionData = localStorage.getItem('police_session');

            if (!sessionData) {
                router.push('/');
                return;
            }

            try {
                const parsed = JSON.parse(sessionData);

                // --- LOGIKA KEAMANAN TINGKAT TINGGI ---
                // Cek is_admin dan is_highadmin secara eksplisit di database
                const { data, error } = await supabase
                    .from('users')
                    .select('pangkat, divisi, is_highadmin, is_admin')
                    .eq('discord_id', parsed.discord_id)
                    .single();

                if (data) {
                    // Hanya izinkan jika is_admin ATAU is_highadmin bernilai TRUE
                    // Pangkat Jendral/Petinggi tetap dicek sebagai fallback, tapi prioritas tetap pada boolean
                    const hasAccess = data.is_admin === true || data.is_highadmin === true || data.pangkat === 'JENDRAL' || data.divisi === 'PETINGGI';

                    if (!hasAccess) {
                        toast.error("AKSES ILEGAL TERDETEKSI! Kembali ke Portal.");
                        setTimeout(() => router.push('/dashboard'), 1500);
                    } else {
                        setIsChecking(false);
                    }
                } else {
                    router.push('/');
                }
            } catch (err) {
                router.push('/');
            }
        };
        verifyAdmin();
    }, [router]);

    // Layar "Loading" saat verifikasi sedang berlangsung (Gembok Visual)
    if (isChecking) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-mono font-black uppercase italic p-6 text-center">
            <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <Lock size={80} className="mb-6 text-[#A78BFA]" strokeWidth={3} />
            </motion.div>
            <div className="tracking-[0.3em] text-2xl mb-2 text-[#A78BFA]">ENCRYPTING ACCESS...</div>
            <p className="text-[10px] opacity-40">Mandalika High Command Protocol v2.0</p>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#A78BFA] font-mono overflow-hidden text-slate-950">
            <Toaster position="top-center" richColors />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* HEADER ADMIN */}
                <header className="flex justify-between items-center px-4 md:px-8 py-4 bg-white border-b-[6px] border-slate-950 z-40 shadow-[0px_6px_0px_#000]">
                    <div className="flex items-center gap-3">
                        <ShieldAlert size={32} className="text-[#A78BFA]" strokeWidth={2.5} />
                        <div>
                            <h2 className="font-[1000] italic uppercase text-xl md:text-2xl tracking-tighter leading-none">HIGH COMMAND</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 italic leading-none mt-1">Admin Protocol Active</p>
                        </div>
                    </div>
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 bg-[#FFD100] border-[3.5px] border-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all">
                        <ArrowLeft size={16} /> <span className="hidden md:inline italic text-[10px]">Back to Portal</span>
                    </button>
                </header>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 bg-[#A78BFA]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'cuti' && <SectionAdminCuti key="cuti" />}
                            {activeTab === 'personnel' && <SectionAdminPersonnel key="personnel" />}
                            {activeTab === 'payroll' && <SectionAdminPayroll key="payroll" />}
                            {activeTab === 'laporan' && <SectionAdminLaporan key="laporan" />}
                            {activeTab === 'rekap' && <SectionAdminSystem key="rekap" />}
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* BOTTOM NAVIGATION - 5 MENU */}
                <nav className="fixed bottom-0 left-0 w-full bg-white border-t-[6px] border-slate-950 flex justify-around items-center py-4 pb-8 md:pb-4 z-[60] shadow-[0px_-6px_0px_rgba(0,0,0,1)]">

                    <button onClick={() => setActiveTab('cuti')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'cuti' ? 'text-[#A78BFA] scale-110' : 'opacity-40 hover:opacity-100'}`}>
                        <CalendarCheck size={22} strokeWidth={2.5} />
                        <span className="text-[8px] font-[1000] uppercase italic block text-center mt-1">Cuti</span>
                    </button>

                    <button onClick={() => setActiveTab('personnel')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'personnel' ? 'text-[#3B82F6] scale-110' : 'opacity-40 hover:opacity-100'}`}>
                        <Users size={22} strokeWidth={2.5} />
                        <span className="text-[8px] font-[1000] uppercase italic block text-center mt-1">Anggota</span>
                    </button>

                    <button onClick={() => setActiveTab('laporan')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'laporan' ? 'text-[#F59E0B] scale-110' : 'opacity-40 hover:opacity-100'}`}>
                        <ClipboardList size={22} strokeWidth={2.5} />
                        <span className="text-[8px] font-[1000] uppercase italic block text-center mt-1">Laporan</span>
                    </button>

                    <button onClick={() => setActiveTab('payroll')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'payroll' ? 'text-[#00E676] scale-110' : 'opacity-40 hover:opacity-100'}`}>
                        <Banknote size={22} strokeWidth={2.5} />
                        <span className="text-[8px] font-[1000] uppercase italic block text-center mt-1">Payroll</span>
                    </button>

                    <button onClick={() => setActiveTab('rekap')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'rekap' ? 'text-[#FF4D4D] scale-110' : 'opacity-40 hover:opacity-100'}`}>
                        <FileSpreadsheet size={22} strokeWidth={2.5} />
                        <span className="text-[8px] font-[1000] uppercase italic block text-center mt-1">Rekap</span>
                    </button>

                </nav>
            </div>
        </div>
    );
}