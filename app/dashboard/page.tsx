"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, User, ChevronLeft, Home, Banknote, LogOut, ShieldAlert, History,
    BookOpen, FileText, Scale, Info, Trophy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';

import Sidebar from "./components/Sidebar";
import SectionHome from "./components/SectionHome";
import SectionSalary from "./components/SectionSalary";
import SectionLog from "./components/SectionLog";
import SectionHallOfFame from "./components/SectionHallOfFame"; // 🚀 IMPORT SECTION BARU

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// 🚀 KOMPONEN DROPDOWN PROFIL NEO-BRUTALISM
function ProfileDropdownMenu({ nickname, pangkat, image }: { nickname: string, pangkat: string, image: string }) {
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // FUNGSI TUTUP DROPDOWN JIKA KLIK DI LUAR
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('police_session');
        router.push('/');
    };

    return (
        <div className="relative z-[999]" ref={dropdownRef}>
            {/* INI BAGIAN YANG DITEKAN (FOTO & NAMA) */}
            <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-4 outline-none hover:-translate-y-1 active:translate-y-0 transition-transform text-right group"
            >
                {/* Nama & Pangkat */}
                <div className="hidden md:flex flex-col items-end leading-none font-black italic">
                    <span className="text-xs uppercase text-black">{nickname}</span>
                    <span className="text-[10px] text-[#3B82F6]">{pangkat}</span>
                </div>

                {/* Foto Profil */}
                <div className={`w-14 h-14 border-[3.5px] border-black overflow-hidden shadow-[4px_4px_0px_#000] group-hover:shadow-[6px_6px_0px_#000] bg-[#CCFF00] rounded-[18px] transition-shadow relative`}>
                    {image ? (
                        <NextImage src={image} alt="Profile" width={56} height={56} className="object-cover w-full h-full" />
                    ) : (
                        <User size={28} className="m-auto mt-2 text-black" />
                    )}
                    {/* Indikator Online */}
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#00E676] border-2 border-black rounded-full shadow-[2px_2px_0_0_#000]"></span>
                </div>
            </button>

            {/* DROPDOWN MENU NEO-BRUTALISM */}
            <AnimatePresence>
                {isProfileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-4 w-64 bg-white border-[4px] border-black rounded-2xl shadow-[8px_8px_0_0_#000] p-2 flex flex-col gap-1"
                    >
                        {/* Info Header (Tampil di Mobile) */}
                        <div className="p-3 border-b-4 border-black mb-2 bg-slate-950 text-white rounded-xl md:hidden">
                            <p className="text-[10px] font-black italic uppercase tracking-widest opacity-50">Log In As:</p>
                            <p className="text-sm font-black truncate">{nickname}</p>
                            <p className="text-[10px] text-[#3B82F6] font-black">{pangkat}</p>
                        </div>

                        <button onClick={() => router.push('/panduan')} className="flex items-center gap-3 p-3 hover:bg-[#CCFF00] rounded-xl border-2 border-transparent hover:border-black transition-all group">
                            <div className="bg-blue-100 p-1.5 border-2 border-black rounded-lg group-hover:bg-blue-500 group-hover:text-white"><BookOpen size={16} /></div>
                            <span className="font-black text-xs uppercase italic text-black">Panduan Sistem</span>
                        </button>

                        <button onClick={() => router.push('/sop')} className="flex items-center gap-3 p-3 hover:bg-[#CCFF00] rounded-xl border-2 border-transparent hover:border-black transition-all group">
                            <div className="bg-emerald-100 p-1.5 border-2 border-black rounded-lg group-hover:bg-emerald-500 group-hover:text-white"><FileText size={16} /></div>
                            <span className="font-black text-xs uppercase italic text-black">SOP Anggota</span>
                        </button>

                        <button onClick={() => router.push('/uu')} className="flex items-center gap-3 p-3 hover:bg-[#CCFF00] rounded-xl border-2 border-transparent hover:border-black transition-all group">
                            <div className="bg-amber-100 p-1.5 border-2 border-black rounded-lg group-hover:bg-amber-500 group-hover:text-white"><Scale size={16} /></div>
                            <span className="font-black text-xs uppercase italic text-black">UU Kepolisian</span>
                        </button>

                        <button onClick={() => router.push('/about')} className="flex items-center gap-3 p-3 hover:bg-[#CCFF00] rounded-xl border-2 border-transparent hover:border-black transition-all group">
                            <div className="bg-purple-100 p-1.5 border-2 border-black rounded-lg group-hover:bg-purple-500 group-hover:text-white"><Info size={16} /></div>
                            <span className="font-black text-xs uppercase italic text-black">About MDT</span>
                        </button>

                        <div className="h-1 bg-black my-1 rounded-full" />

                        <button onClick={handleLogout} className="flex items-center gap-3 p-3 hover:bg-red-500 hover:text-white rounded-xl border-2 border-transparent hover:border-black transition-all group">
                            <div className="bg-red-100 p-1.5 border-2 border-black rounded-lg group-hover:bg-white group-hover:text-red-600"><LogOut size={16} /></div>
                            <span className="font-black text-xs uppercase italic text-black group-hover:text-white">Logout</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ---------------------------------------------------------

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

            const { data, error } = await supabase.from('users').select('*').eq('discord_id', parsed.discord_id).single();

            if (data) {
                setUserData(data);
                const cleanName = data.name.includes('|') ? data.name.split('|').pop().trim() : data.name;
                setNickname(cleanName.toUpperCase());

                const isAdmin = data.is_admin === true;
                const isHighAdmin = data.is_highadmin === true;

                setDbStatus({
                    is_admin: isAdmin || isHighAdmin,
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
                            {/* 🚀 TAMBAHKAN JUDUL UNTUK HALL OF FAME */}
                            {activeTab === 'halloffame' && 'Hall Of Fame'}
                        </h2>
                    </div>

                    {/* DROPDOWN PROFIL */}
                    <ProfileDropdownMenu
                        nickname={nickname}
                        pangkat={realtimeData.pangkat}
                        image={userData?.image || ""}
                    />
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32 bg-[#E0E7FF]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'home' && <SectionHome key="home" nickname={nickname} realtimeData={realtimeData} />}
                        {activeTab === 'log' && <SectionLog key="log" />}
                        {activeTab === 'payroll' && <SectionSalary key="salary" realtimeData={realtimeData} nickname={nickname} />}
                        {/* 🚀 RENDER SECTION HALL OF FAME */}
                        {activeTab === 'halloffame' && <SectionHallOfFame key="halloffame" />}
                    </AnimatePresence>
                </main>

                {/* BOTTOM NAVIGATION (MOBILE) */}
                <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#FFD100] border-t-[6px] border-black flex justify-around items-center py-4 pb-8 z-[60] shadow-[0_-6px_0_0_rgba(0,0,0,1)]">
                    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'scale-110' : 'opacity-40'}`}>
                        <Home size={24} strokeWidth={2.5} />
                        <span className="text-[10px] font-black uppercase italic block text-center">Home</span>
                    </button>

                    <button onClick={() => setActiveTab('log')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'log' ? 'scale-110' : 'opacity-40'}`}>
                        <History size={24} strokeWidth={2.5} />
                        <span className="text-[10px] font-black uppercase italic block text-center">Log</span>
                    </button>

                    {/* 🚀 TOMBOL HALL OF FAME DI MOBILE (Bintang/Trophy) */}
                    <button onClick={() => setActiveTab('halloffame')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'halloffame' ? 'scale-110 text-[#FF9800]' : 'opacity-40'}`}>
                        <Trophy size={24} strokeWidth={2.5} />
                        <span className="text-[10px] font-black uppercase italic block text-center">Top</span>
                    </button>

                    <button onClick={() => setActiveTab('payroll')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'payroll' ? 'scale-110' : 'opacity-40'}`}>
                        <Banknote size={24} strokeWidth={2.5} />
                        <span className="text-[10px] font-black uppercase italic block text-center">Gaji</span>
                    </button>

                    {dbStatus.is_admin && (
                        <button onClick={() => router.push('/admin')} className="flex flex-col items-center gap-1 text-[#FF4D4D] transition-all scale-110">
                            <ShieldAlert size={24} strokeWidth={2.5} />
                            <span className="text-[10px] font-black uppercase italic block text-center">Admin</span>
                        </button>
                    )}
                </nav>
            </div>
        </div>
    );
}