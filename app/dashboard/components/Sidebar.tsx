"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Home, Banknote, ShieldAlert, Radar, History, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ 
    isOpen, 
    activeTab, 
    setActiveTab, 
    dbStatus 
}: { 
    isOpen: boolean, 
    activeTab: string, 
    setActiveTab: (tab: string) => void, 
    dbStatus: any 
}) {
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
            className="hidden md:flex flex-col bg-[#09090B] border-r border-white/5 z-50 shrink-0 overflow-hidden h-screen"
        >
            <div className="p-6 h-full flex flex-col w-[280px]">

                {/* --- HEADER BADGE --- */}
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-center gap-2 mb-8 backdrop-blur-sm">
                    <Radar size={16} className="text-blue-400 animate-pulse" />
                    <span className="text-xs font-semibold text-zinc-300 tracking-wider">
                        UNIT 405-PD MDT
                    </span>
                </div>

                {/* --- NAVIGATION MENU --- */}
                <nav className="flex-1 space-y-1.5">
                    {menu.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isActive
                                        ? 'bg-zinc-800/80 text-white shadow-sm'
                                        : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                                }`}
                            >
                                <span className={`${isActive ? 'text-blue-400' : 'text-zinc-500 transition-colors group-hover:text-zinc-400'}`}>
                                    {item.icon}
                                </span>
                                <span className="truncate">{item.label}</span>
                            </button>
                        );
                    })}

                    {/* --- ADMIN BUTTON --- */}
                    {(dbStatus?.is_admin || dbStatus?.is_highadmin) && (
                        <div className="pt-4 mt-4 border-t border-white/5">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/admin')}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
                            >
                                <ShieldAlert size={18} className="text-purple-400" />
                                <span>Admin Panel</span>
                            </motion.button>
                        </div>
                    )}
                </nav>

                {/* --- FOOTER --- */}
                <div className="mt-auto pt-6 text-center text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                    Mandalika Security Protocol v3.7
                </div>

            </div>
        </motion.aside>
    );
}