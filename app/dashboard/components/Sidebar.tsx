"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Home, Banknote, ShieldAlert, Radar, History, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Interface untuk menghindari error no-explicit-any
interface DbStatusProps {
    is_admin?: boolean;
    is_highadmin?: boolean;
}

interface SidebarProps {
    isOpen: boolean;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    dbStatus: DbStatusProps;
}

export default function Sidebar({ isOpen, activeTab, setActiveTab, dbStatus }: SidebarProps) {
    const router = useRouter();

    const menu = [
        { id: 'home', label: 'Dashboard', icon: <Home size={18} /> },
        { id: 'log', label: 'Activity Log', icon: <History size={18} /> },
        { id: 'payroll', label: 'Salary System', icon: <Banknote size={18} /> },
        { id: 'handbook', label: 'Handbook Divisi', icon: <BookOpen size={18} /> },
    ];

    return (
        <motion.aside
            initial={false}
            animate={{
                width: isOpen ? 280 : 0,
                opacity: isOpen ? 1 : 0,
                x: isOpen ? 0 : -20
            }}
            className="hidden md:flex flex-col bg-[#121215] border-r border-white/5 z-50 shrink-0 overflow-hidden h-screen text-white shadow-2xl"
        >
            <div className="p-6 h-full flex flex-col w-[280px]">
                
                {/* --- HEADER UNIT BADGE (Clean Red Accent) --- */}
                <div className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-2xl text-xs font-semibold text-red-400 mb-8 flex items-center justify-center gap-2 tracking-wide uppercase">
                    <Radar size={16} className="animate-pulse text-red-500" />
                    Unit 405-PD MDT
                </div>

                {/* --- NAVIGATION MENU --- */}
                <nav className="flex-1 space-y-2">
                    {menu.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-medium transition-all duration-200 group relative ${
                                    isActive
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 font-semibold'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                                }`}
                            >
                                <span className={`transition-colors ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
                                    {item.icon}
                                </span>
                                <span className="tracking-wide">{item.label}</span>
                                {isActive && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                            </button>
                        );
                    })}

                    {/* --- ADMIN PANEL BUTTON --- */}
                    {(dbStatus?.is_admin || dbStatus?.is_highadmin) && (
                        <div className="pt-4 mt-4 border-t border-white/5">
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => router.push('/admin')}
                                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all duration-200 group"
                            >
                                <ShieldAlert size={18} className="text-red-400 group-hover:text-red-300" />
                                <span className="tracking-wide">Admin Panel</span>
                            </motion.button>
                        </div>
                    )}
                </nav>

                {/* --- FOOTER VERSION --- */}
                <div className="mt-auto pt-6 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    Mandalika Security Protocol v3.7
                </div>

            </div>
        </motion.aside>
    );
}