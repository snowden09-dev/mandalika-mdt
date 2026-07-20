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

// 🚀 PROFILE DROPDOWN: ULTRA-CLEAN MINIMALIST
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
        <div className="relative z-999" ref={dropdownRef}>
            {/* BUTTON PROFIL */}
            <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 outline-none hover:opacity-80 transition-opacity text-right group font-sans"
            >
                <div className="hidden md:flex flex-col items-end leading-tight">
                    <span className="text-xs font-semibold text-neutral-200 tracking-wide uppercase">{nickname}</span>
                    <span className="text-[11px] font-medium text-neutral-400 group-hover:text-red-500 transition-colors">{pangkat}</span>
                </div>

                <div className="w-10 h-10 rounded-full border border-neutral-800 bg-[#161616] overflow-hidden relative shrink-0 transition-all">
                    {image ? (
                        <NextImage src={image} alt="Profile" width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                        <User size={18} className="m-auto mt-2.5 text-neutral-400" />
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#121212] rounded-full"></span>
                </div>
            </button>

            {/* DROPDOWN MENU */}
            <AnimatePresence>
                {isProfileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-56 bg-[#161616] border border-neutral-800 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 font-sans"
                    >
                        {/* Header info khusus Mobile */}
                        <div className="p-2.5 border-b border-neutral-800/60 mb-1 bg-[#121212]/50 rounded-lg md:hidden">
                            <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider mb-0.5">Logged In As</p>
                            <p className="text-sm font-semibold text-neutral-200 truncate">{nickname}</p>
                            <p className="text-[11px] text-red-500 font-medium mt-0.5">{pangkat}</p>
                        </div>

                        <button onClick={() => router.push('/panduan')} className="flex items-center gap-3 p-2 hover:bg-neutral-800/40 rounded-lg transition-colors group w-full text-left">
                            <BookOpen size={15} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
                            <span className="font-medium text-xs text-neutral-300 group-hover:text-white">Panduan Sistem</span>
                        </button>

                        <button onClick={() => router.push('/sop')} className="flex items-center gap-3 p-2 hover:bg-neutral-800/40 rounded-lg transition-colors group w-full text-left">
                            <FileText size={15} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
                            <span className="font-medium text-xs text-neutral-300 group-hover:text-white">SOP Anggota</span>
                        </button>

                        <button onClick={() => router.push('/uu')} className="flex items-center gap-3 p-2 hover:bg-neutral-800/40 rounded-lg transition-colors group w-full text-left">
                            <Scale size={15} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
                            <span className="font-medium text-xs text-neutral-300 group-hover:text-white">UU Kepolisian</span>
                        </button>

                        <button onClick={() => router.push('/about')} className="flex items-center gap-3 p-2 hover:bg-neutral-800/40 rounded-lg transition-colors group w-full text-left">
                            <Info size={15} className="text-neutral-400 group-hover:text-red-500 transition-colors" />
                            <span className="font-medium text-xs text-neutral-300 group-hover:text-white">About MDT</span>
                        </button>

                        <div className="h-px bg-neutral-800/60 my-1 w-full" />

                        <button onClick={handleLogout} className="flex items-center gap-3 p-2 hover:bg-red-500/10 rounded-lg transition-colors group w-full text-left">
                            <LogOut size={15} className="text-red-500" />
                            <span className="font-semibold text-xs text-red-500">Logout</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ----------------------------------------------------

interface UserData {
    name: string;
    image?: string;
    is_admin?: boolean;
    is_highadmin?: boolean;
    point_prp?: number;
    total_jam_duty?: number;
    pangkat?: string;
    divisi?: string;
}

interface PayrollLog {
    id: string | number;
    jumlah_gaji: number | string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: string;
}

type PayrollSectionProps = {
    currentLogs: PayrollLog[];
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
};

const SectionLogComponent = SectionLog as React.ComponentType<PayrollSectionProps>;
const SectionSalaryComponent = SectionSalary as React.ComponentType<PayrollSectionProps>;

export default function PortalPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [nickname, setNickname] = useState("LOADING...");
    
    const [userData, setUserData] = useState<UserData | null>(null);
    const [dbStatus, setDbStatus] = useState({ is_admin: false, is_highadmin: false });
    const [realtimeData, setRealtimeData] = useState({ point_prp: 0, total_jam_duty: 0, pangkat: "RECRUIT", divisi: "SABHARA" });

    // State untuk data gaji / payroll
    const [payrollLogs, setPayrollLogs] = useState<PayrollLog[]>([]);
    const [payrollPage, setPayrollPage] = useState(1);
    const itemsPerPage = 5;

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

    // Fetch riwayat gaji dari database Supabase
    useEffect(() => {
        const fetchPayroll = async () => {
            const sessionData = localStorage.getItem('police_session');
            if (!sessionData) return;
            const parsed = JSON.parse(sessionData);

            const { data, error } = await supabase
                .from('gaji')
                .select('*')
                .eq('discord_id', parsed.discord_id)
                .order('tanggal_mulai', { ascending: false });

            if (data) {
                setPayrollLogs(data);
            } else if (error) {
                setPayrollLogs([]);
            }
        };
        fetchPayroll();
    }, []);

    const totalPages = Math.ceil(payrollLogs.length / itemsPerPage) || 1;
    const currentLogs = payrollLogs.slice((payrollPage - 1) * itemsPerPage, payrollPage * itemsPerPage);

    return (
        <div className="flex min-h-screen bg-[#121212] font-sans overflow-hidden text-neutral-200 selection:bg-red-600/20">
            {/* SIDEBAR CONTAINER */}
            <Sidebar isOpen={isSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} dbStatus={dbStatus} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#121212]">
                {/* HEADER */}
                <header className="flex justify-between items-center px-6 py-4 bg-[#161616] border-b border-neutral-800/80 z-40 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                            className="hidden md:flex w-9 h-9 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-lg items-center justify-center transition-all border border-transparent hover:border-neutral-800"
                        >
                            {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
                        </button>
                        <h2 className="font-semibold text-sm md:text-base text-neutral-100 tracking-wide font-sans">
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
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 bg-[#121212]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'home' && <SectionHome key="home" nickname={nickname} realtimeData={realtimeData} />}
                        {activeTab === 'log' && (
                            <SectionLogComponent 
                                key="log" 
                                currentLogs={currentLogs}
                                currentPage={payrollPage}
                                setCurrentPage={setPayrollPage}
                                totalPages={totalPages}
                            />
                        )}
                        {activeTab === 'payroll' && (
                            <SectionSalaryComponent 
                                key="salary" 
                                currentLogs={currentLogs}
                                currentPage={payrollPage}
                                setCurrentPage={setPayrollPage}
                                totalPages={totalPages}
                            />
                        )}
                        {activeTab === 'handbook' && <SectionHandbook key="handbook" divisi={realtimeData.divisi} isPetinggi={dbStatus.is_admin} />}
                    </AnimatePresence>
                </main>

                {/* BOTTOM NAVIGATION (MOBILE - CAPSULE PILL VERSION) */}
                <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#161616]/95 backdrop-blur-md border-t border-neutral-800/60 flex justify-around items-center py-2 pb-6 z-60">
                    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${activeTab === 'home' ? 'text-red-500 bg-neutral-800/40' : 'text-neutral-500 hover:text-neutral-300'}`}>
                        <Home size={20} />
                        <span className="text-[10px] font-medium tracking-wide">Home</span>
                    </button>

                    <button onClick={() => setActiveTab('log')} className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${activeTab === 'log' ? 'text-red-500 bg-neutral-800/40' : 'text-neutral-500 hover:text-neutral-300'}`}>
                        <History size={20} />
                        <span className="text-[10px] font-medium tracking-wide">Log</span>
                    </button>

                    <button onClick={() => setActiveTab('payroll')} className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${activeTab === 'payroll' ? 'text-red-500 bg-neutral-800/40' : 'text-neutral-500 hover:text-neutral-300'}`}>
                        <Banknote size={20} />
                        <span className="text-[10px] font-medium tracking-wide">Gaji</span>
                    </button>

                    <button onClick={() => setActiveTab('handbook')} className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${activeTab === 'handbook' ? 'text-red-500 bg-neutral-800/40' : 'text-neutral-500 hover:text-neutral-300'}`}>
                        <Book size={20} />
                        <span className="text-[10px] font-medium tracking-wide">Buku</span>
                    </button>

                    {dbStatus.is_admin && (
                        <button onClick={() => router.push('/admin')} className="flex flex-col items-center gap-1 py-1.5 px-4 text-red-600/80 hover:text-red-500 transition-all">
                            <ShieldAlert size={20} />
                            <span className="text-[10px] font-medium tracking-wide">Admin</span>
                        </button>
                    )}
                </nav>
            </div>
        </div>
    );
}