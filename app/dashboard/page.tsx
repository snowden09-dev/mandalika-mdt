"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, ChevronLeft, Home, Banknote, LogOut, ShieldAlert, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';

import Sidebar from "./components/Sidebar";
import SectionHome from "./components/SectionHome";
import SectionSalary from "./components/SectionSalary";
import SectionLog from "./components/SectionLog";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function PortalPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [nickname, setNickname] = useState("LOADING...");
    const [userData, setUserData] = useState<any>(null);

    const [dbStatus, setDbStatus] = useState({ is_admin: false, is_highadmin: false });
    const [realtimeData, setRealtimeData] = useState({ point_prp: 0, total_jam_duty: 0, pangkat: "RECRUIT", divisi: "SABHARA" });

    useEffect(() => {
        const checkUser = async () => {
            const sessionData = localStorage.getItem('police_session');
            if (!sessionData) { router.push('/'); return; }

            const parsed = JSON.parse(sessionData);

            // Ambil data terbaru dari Supabase
            const { data, error } = await supabase.from('users').select('*').eq('discord_id', parsed.discord_id).single();

            if (data) {
                setUserData(data);
                const cleanName = data.name.includes('|') ? data.name.split('|').pop().trim() : data.name;
                setNickname(cleanName.toUpperCase());

                // --- FIX FINAL: HANYA BOLEH TRUE JIKA KOLOM DB TRUE ---
                // Pastikan tidak ada variabel pangkat atau divisi yang nyelip di sini
                const isAdmin = data.is_admin === true;
                const isHighAdmin = data.is_highadmin === true;

                setDbStatus({
                    is_admin: isAdmin || isHighAdmin, // Tombol muncul jika salah satu true
                    is_highadmin: isHighAdmin
                });

                setRealtimeData({
                    point_prp: data.point_prp,
                    total_jam_duty: data.total_jam_duty,
                    pangkat: data.pangkat,
                    divisi: data.divisi
                });
            } else if (error) {
                console.error(error);
            }
        };
        checkUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('police_session');
        router.push('/');
    };

    return (
        <div className="flex min-h-screen bg-[#E0E7FF] font-mono overflow-hidden text-black">
            <Sidebar isOpen={isSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} dbStatus={dbStatus} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="flex justify-between items-center px-6 py-4 bg-white border-b-[6px] border-black z-40 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex w-12 h-12 bg-[#FFD100] border-[4px] border-black items-center justify-center shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all">
                            {isSidebarOpen ? <ChevronLeft size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
                        </button>
                        <h2 className="font-[1000] italic uppercase text-lg md:text-2xl tracking-tighter">
                            {activeTab === 'home' && 'Personnel Terminal'}
                            {activeTab === 'payroll' && 'Financial Gateway'}
                            {activeTab === 'log' && 'Activity Log'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end leading-none font-black italic">
                            <span className="text-xs uppercase">{nickname}</span>
                            <span className="text-[10px] text-[#3B82F6]">{realtimeData.pangkat}</span>
                        </div>
                        <div className="w-12 h-12 border-[4px] border-black overflow-hidden shadow-[6px_6px_0px_#000] bg-[#CCFF00]">
                            {userData?.image ? <NextImage src={userData.image} alt="User" width={48} height={48} className="object-cover" /> : <User size={24} className="m-auto mt-2" />}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32 bg-[#E0E7FF]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'home' && <SectionHome key="home" nickname={nickname} realtimeData={realtimeData} />}
                        {activeTab === 'log' && <SectionLog key="log" />}
                        {activeTab === 'payroll' && <SectionSalary key="salary" realtimeData={realtimeData} nickname={nickname} />}
                    </AnimatePresence>
                </main>

                {/* BOTTOM NAVIGATION (MOBILE) */}
                <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#FFD100] border-t-[6px] border-black flex justify-around items-center py-4 pb-8 z-[60] shadow-[0_-6px_0_0_rgba(0,0,0,1)]">
                    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'scale-110' : 'opacity-40'}`}>
                        <Home size={26} strokeWidth={2.5} />
                        <span className="text-[10px] font-black uppercase italic block text-center">Home</span>
                    </button>

                    <button onClick={() => setActiveTab('log')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'log' ? 'scale-110' : 'opacity-40'}`}>
                        <History size={26} strokeWidth={2.5} />
                        <span className="text-[10px] font-black uppercase italic block text-center">Log</span>
                    </button>

                    <button onClick={() => setActiveTab('payroll')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'payroll' ? 'scale-110' : 'opacity-40'}`}>
                        <Banknote size={26} strokeWidth={2.5} />
                        <span className="text-[10px] font-black uppercase italic block text-center">Gaji</span>
                    </button>

                    {/* TOMBOL ADMIN MOBILE SEKARANG DISARING KETAT */}
                    {dbStatus.is_admin && (
                        <button onClick={() => router.push('/admin')} className="flex flex-col items-center gap-1 text-[#FF4D4D] transition-all scale-110">
                            <ShieldAlert size={26} strokeWidth={2.5} />
                            <span className="text-[10px] font-black uppercase italic block text-center">Admin</span>
                        </button>
                    )}

                    <button onClick={handleLogout} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-all">
                        <LogOut size={26} strokeWidth={2.5} />
                        <span className="text-[10px] font-black uppercase italic block text-center">Exit</span>
                    </button>
                </nav>
            </div>
        </div>
    );
}