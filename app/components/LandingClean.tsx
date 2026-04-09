'use client';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import Image from 'next/image';
import "@fontsource/quicksand/500.css";
import "@fontsource/quicksand/700.css";
import "@fontsource/quicksand/800.css";

// Terima operan data dari Otak (page.tsx)
interface Props { time: string; status: string; isLoading: boolean; handleLogin: () => void; }

const float: Variants = { animate: { y: [-10, 10, -10], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } } };
const popIn: Variants = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } } };

export default function LandingClean({ time, status, isLoading, handleLogin }: Props) {
    return (
        <main className="min-h-screen bg-[#001D4C] text-white font-[Quicksand] flex flex-col relative overflow-hidden">
            <header className="absolute top-0 left-0 w-full p-4 md:p-6 z-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-full">
                            <Image src="/logo-polisi.png" alt="Logo" width={32} height={32} className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                        </div>
                        <span className="font-bold text-lg md:text-xl tracking-tight">mandalika</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden md:inline text-sm font-medium text-white/70">Waktu: {time || '00:00'} WIB</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto px-6 pt-24 lg:pt-0 w-full z-10 gap-12">
                <div className="flex-1 space-y-6 text-center lg:text-left mt-10 lg:mt-0">
                    <motion.h1 initial="hidden" animate="visible" variants={popIn} className="text-5xl sm:text-6xl lg:text-7xl font-[800] tracking-tight leading-[1.1]">
                        Pusat Terminal <br /><span className="text-[#FFD100]">Operasi Personel.</span>
                    </motion.h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                        Akses Mobile Data Terminal Mandalika secara modern, efisien, dan aman. Semuanya di satu tempat. Gak ribet!
                    </p>
                    <div className="flex flex-col items-center lg:items-start gap-4 pt-4">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogin} disabled={isLoading} className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all ${isLoading ? 'bg-slate-400 text-slate-800' : 'bg-[#00E676] hover:bg-[#00c853] text-[#001D4C]'}`}>
                            <Image src="/discord-login.png" alt="Discord" width={24} height={24} className="w-6 h-6 object-contain" />
                            {isLoading ? status : 'Login via Discord'} <ArrowRight size={20} />
                        </motion.button>
                        <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-white/10 text-sm font-medium">
                            <Zap size={16} className={isLoading ? 'animate-pulse text-[#FFD100]' : 'text-white/50'} />
                            Status Radar: <span className={isLoading ? 'text-[#FFD100]' : 'text-white'}>{status}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full relative flex justify-center lg:justify-end pb-20 lg:pb-0">
                    <motion.div variants={float} animate="animate" className="relative z-10 w-full max-w-md lg:max-w-lg">
                        <Image src="/logo-husky-polisi.png" alt="Husky Police" width={500} height={500} priority className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
                        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="absolute bottom-10 -left-6 md:-left-12 bg-white text-slate-900 p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 w-64">
                            <div className="bg-red-100 p-2 rounded-xl text-red-600"><ShieldCheck size={24} /></div>
                            <div>
                                <p className="font-bold text-sm leading-tight">Keamanan Propam</p>
                                <p className="text-[11px] text-slate-500 leading-tight">Akses tanpa izin akan dilacak {'&'} ditindak.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}