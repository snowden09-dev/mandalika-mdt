"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, User, ChevronLeft, Home, Banknote, LogOut, ShieldAlert, History,
    BookOpen, FileText, Scale, Info, Book
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';

import Sidebar from "./components/Sidebar";
import SectionHome from "./components/SectionHome";
import SectionSalary from "./components/SectionSalary";
import SectionLog from "./components/SectionLog";
import SectionHandbook from "./components/SectionHandbook"; 

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// 🚀 KOMPONEN DROPDOWN PROFIL MINIMALIST
function ProfileDropdownMenu({ nickname, pangkat, image }: { nickname: string, pangkat: string, image: string }) {
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
                className="flex items-center gap-3 outline-none hover:opacity-80 transition-opacity text-right group"
            >
                {/* Nama & Pangkat */}
                <div className="hidden md:flex flex-col items-end leading-tight">
                    <span className="text-sm font-semibold text-neutral-200 tracking-wide">{nickname}</span>
                    <span className="text-xs font-medium text-red-500">{pangkat}</span>
                </div>

                {/* Foto Profil */}
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full border border-neutral-700 bg-neutral-800 overflow-hidden relative flex-shrink-0">
                    {image ? (
                        <NextImage src={image} alt="Profile" width={44} height={44} className="object-cover w-full h-full" />
                    ) : (
                        <User size={20} className="m-auto mt-2.5 text-neutral-400" />
                    )}
                    {/* Indikator Online */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></span>
                </div>
            </button>

            {/* DROPDOWN MENU MINIMALIST */}
            <AnimatePresence>
                {isProfileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-3 w-56 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl p-1.5 flex flex-col gap-0.5"
                    >
                        {/* Info Header (Tampil di Mobile) */}
                        <div className="p-3 border-b border-neutral-800 mb-1 bg-black/50 rounded-md md:hidden">
                            <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider mb-1">Logged In As</p>
                            <p className="text-sm font-semibold text-neutral-200 truncate">{nickname}</p>
                            <p className="text-[11px] text-red-500 font-medium mt-0.5">{pangkat}</p>
                        </div>

                        <button onClick={() => router.push('/panduan')} className="flex items-center gap-3 p-2.5 hover:bg-neutral-800 rounded-md transition-colors group w-full text-left">
                            <BookOpen size={16} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
                            <span className="font-medium text-sm text-neutral-300 group-hover:text-white transition-colors">Panduan Sistem</span>
                        </button>

                        <button onClick={() => router.push('/sop')} className="flex items-center gap-3 p-2.5 hover:bg-neutral-800 rounded-md transition-colors group w-full text-left">
                            <FileText size={16} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
                            <span className="font-medium text-sm text-neutral-300 group-hover:text-white transition-colors">SOP Anggota</span>
                        </button>

                        <button onClick={() => router.push('/uu')} className="flex items-center gap-3 p-2.5 hover:bg-neutral-800 rounded-md transition-colors group w-full text-left">
                            <Scale size={16} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
                            <span className="font-medium text-sm text-neutral-300 group-hover:text-white transition-colors">UU Kepolisian</span>
                        </button>

                        <button onClick={() => router.push('/about')} className="flex items-center gap-3 p-2.5 hover:bg-neutral-800 rounded-md transition-colors group w-full text-left">
                            <Info size={16} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
                            <span className="font-medium text-sm text-neutral-300 group-hover:text-white transition-colors">About MDT</span>
                        </button>

                        <div className="h-px bg-neutral-800 my-1 w-full" />

                        <button onClick={handleLogout} className="flex items-center gap-3 p-2.5 hover:bg-red-500/10 rounded-md transition-colors group w-full text-left">
                            <LogOut size={16} className="text-red-500" />
                            <span className="font-medium text-sm text-red-500">Logout</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ----------------------------------------------------

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
        <div className="flex min-h-screen bg-black font-sans overflow-hidden text-neutral-200 selection:bg-red-600/30">
            <Sidebar isOpen={isSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} dbStatus={dbStatus} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-neutral-950">
                {/* HEADER */}
                <header className="flex justify-between items-center px-6 py-4 bg-black border-b border-neutral-900 z-40">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                            className="hidden md:flex w-10 h-10 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md items-center justify-center transition-all border border-transparent hover:border-neutral-800"
                        >
                            {isSidebarOpen ? <ChevronLeft size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
                        </button>
                        <h2 className="font-semibold text-lg md:text-xl text-white tracking-wide">
                            {activeTab === 'home' && 'Personnel Terminal'}
                            {activeTab === 'payroll' && 'Financial Gateway'}
                            {activeTab === 'log' && 'Activity Log'}
                            {activeTab === 'handbook' && 'Divisional Handbook'}
                        </h2>
                    </div>

                    <ProfileDropdownMenu
                        nickname={nickname}
                        pangkat={realtimeData.pangkat}
                        image={userData?.image || ""}
                    />
                </header>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
                    <AnimatePresence mode="wait">
                        {activeTab === 'home' && <SectionHome key="home" nickname={nickname} realtimeData={realtimeData} />}
                        {activeTab === 'log' && <SectionLog key="log" />}
                        {activeTab === 'payroll' && <SectionSalary key="salary" realtimeData={realtimeData} nickname={nickname} />}
                        {activeTab === 'handbook' && <SectionHandbook key="handbook" divisi={realtimeData.divisi} isPetinggi={dbStatus.is_admin} />}
                    </AnimatePresence>
                </main>

                {/* BOTTOM NAVIGATION (MOBILE) */}
                <nav className="md:hidden fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-md border-t border-neutral-900 flex justify-around items-center py-3 pb-7 z-[60]">
                    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-red-500' : 'text-neutral-500 hover:text-neutral-300'}`}>
                        <Home size={22} strokeWidth={2} />
                        <span className="text-[10px] font-medium tracking-wide">Home</span>
                    </button>

                    <button onClick={() => setActiveTab('log')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'log' ? 'text-red-500' : 'text-neutral-500 hover:text-neutral-300'}`}>
                        <History size={22} strokeWidth={2} />
                        <span className="text-[10px] font-medium tracking-wide">Log</span>
                    </button>

                    <button onClick={() => setActiveTab('payroll')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'payroll' ? 'text-red-500' : 'text-neutral-500 hover:text-neutral-300'}`}>
                        <Banknote size={22} strokeWidth={2} />
                        <span className="text-[10px] font-medium tracking-wide">Gaji</span>
                    </button>

                    <button onClick={() => setActiveTab('handbook')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'handbook' ? 'text-red-500' : 'text-neutral-500 hover:text-neutral-300'}`}>
                        <Book size={22} strokeWidth={2} />
                        <span className="text-[10px] font-medium tracking-wide">Buku</span>
                    </button>

                    {dbStatus.is_admin && (
                        <button onClick={() => router.push('/admin')} className="flex flex-col items-center gap-1.5 text-red-700 hover:text-red-500 transition-all">
                            <ShieldAlert size={22} strokeWidth={2} />
                            <span className="text-[10px] font-medium tracking-wide">Admin</span>
                        </button>
                    )}
                </nav>
            </div>
        </div>
    );
}