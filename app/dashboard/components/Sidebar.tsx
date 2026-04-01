"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Home, Banknote, ShieldAlert, Radar, History, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ isOpen, activeTab, setActiveTab, dbStatus }: { isOpen: boolean, activeTab: string, setActiveTab: (tab: string) => void, dbStatus: any }) {
    const router = useRouter();

    const fontBlack = "font-mono font-[1000] italic uppercase tracking-tighter text-black";
    const boxBorder = "border-[4px] border-black";

    const menu = [
        { id: 'home', label: 'DASHBOARD', icon: <Home size={20} />, color: '#FFD100' },
        { id: 'log', label: 'ACTIVITY LOG', icon: <History size={20} />, color: '#FF90E8' },
        { id: 'payroll', label: 'SALARY SYSTEM', icon: <Banknote size={20} />, color: '#00E676' },
        // --- 🚀 NEW MENU: HALL OF FAME ---
        { id: 'halloffame', label: 'HALL OF FAME', icon: <Trophy size={20} />, color: '#FF9800' },
    ];

    return (
        <motion.aside
            initial={false}
            animate={{
                width: isOpen ? 280 : 0,
                opacity: isOpen ? 1 : 0,
                x: isOpen ? 0 : -20
            }}
            className="hidden md:flex flex-col bg-white border-r-[6px] border-black z-50 shrink-0 overflow-hidden h-screen shadow-[10px_0px_0px_0px_rgba(0,0,0,0.1)]"
        >
            <div className="p-6 h-full flex flex-col w-[280px]">

                <div className={`bg-[#3B82F6] ${boxBorder} px-4 py-3 shadow-[6px_6px_0px_#000] ${fontBlack} text-center text-xs mb-10 flex items-center justify-center gap-2`}>
                    <Radar size={16} className="animate-pulse" />
                    UNIT 405-PD MDT
                </div>

                <nav className="flex-1 space-y-5">
                    {menu.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 p-4 ${fontBlack} text-sm transition-all border-[4px] ${activeTab === item.id
                                ? `border-black shadow-[6px_6px_0px_#000] translate-x-[-2px] translate-y-[-2px]`
                                : 'border-transparent opacity-40 hover:opacity-100'
                                }`}
                            style={{ backgroundColor: activeTab === item.id ? item.color : 'transparent' }}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span className="truncate">{item.label}</span>
                        </button>
                    ))}

                    {/* --- FIX: TOMBOL ADMIN SEKARANG BISA BACA is_highadmin --- */}
                    {(dbStatus?.is_admin || dbStatus?.is_highadmin) && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            onClick={() => router.push('/admin')}
                            className={`w-full flex items-center gap-4 p-4 ${fontBlack} text-sm transition-all border-[4px] bg-[#A78BFA] border-black shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] active:shadow-none mt-8`}
                        >
                            <ShieldAlert size={20} strokeWidth={3} />
                            <span>ADMIN PANEL</span>
                        </motion.button>
                    )}
                </nav>

                {/* mt-auto ditambahkan di sini agar teks footer tetap berada di paling bawah */}
                <div className="mt-auto pt-6 text-center text-[8px] font-black uppercase opacity-30 italic">
                    Mandalika Security Protocol v3.5
                </div>

            </div>
        </motion.aside>
    );
}