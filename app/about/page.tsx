"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import {
    ArrowLeft, Info, ShieldCheck, Database,
    Terminal, AlertTriangle, Fingerprint, Code
} from 'lucide-react';

export default function AboutPage() {
    const router = useRouter();

    const container: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item: Variants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen bg-[#e2e8f0] text-slate-950 font-sans pb-32">
            {/* HEADER NAV */}
            <div className="bg-white border-b-[6px] border-black p-4 sticky top-0 z-50 shadow-[0_4px_0_0_#000] flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 bg-[#FFD100] border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:-translate-y-1 transition-all active:translate-y-0">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-[1000] italic uppercase tracking-tighter flex items-center gap-2">
                            <Info size={24} className="text-[#3B82F6]" /> ABOUT SYSTEM
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mandalika Mobile Data Terminal</p>
                    </div>
                </div>
            </div>

            <motion.div
                variants={container} initial="hidden" animate="show"
                className="p-4 md:p-8 max-w-4xl mx-auto space-y-8"
            >
                {/* HERO SECTION - SYSTEM IDENTIFICATION */}
                <motion.section variants={item} className="bg-slate-900 border-[5px] border-black shadow-[10px_10px_0_0_#000] p-8 md:p-12 relative overflow-hidden flex flex-col items-center text-center">
                    <div className="absolute -right-10 -top-10 opacity-10">
                        <Fingerprint size={250} className="text-white" />
                    </div>

                    <div className="bg-[#CCFF00] p-4 border-[4px] border-black rounded-2xl shadow-[6px_6px_0_0_#000] mb-6 relative z-10">
                        <Terminal size={48} className="text-black" />
                    </div>

                    <h2 className="text-4xl md:text-5xl font-[1000] italic tracking-tighter text-white mb-2 relative z-10">
                        MANDALIKA <span className="text-[#3B82F6] underline decoration-[4px] underline-offset-4">MDT</span>
                    </h2>
                    <p className="text-[#00E676] font-mono text-sm font-bold bg-black px-4 py-1 border-2 border-[#00E676] mb-6 relative z-10">
                        VERSION 2.0.4 - LOCKED
                    </p>
                    <p className="text-slate-400 text-xs font-bold max-w-lg mx-auto leading-relaxed relative z-10">
                        Sistem Informasi Kepolisian Terpadu. Dirancang khusus untuk birokrasi, pencatatan log, kalkulasi hukum, dan manajemen operasional Mandalika Police Department.
                    </p>
                </motion.section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* CORE MODULES */}
                    <motion.section variants={item} className="bg-[#3B82F6] border-[5px] border-black shadow-[10px_10px_0_0_#000] flex flex-col">
                        <div className="border-b-[5px] border-black p-4 flex items-center gap-3 bg-white">
                            <Database className="text-black" size={24} />
                            <h3 className="text-xl font-[1000] italic uppercase tracking-tight text-black">Core Modules</h3>
                        </div>
                        <div className="p-6 space-y-3 flex-1 text-black font-bold text-sm">
                            <div className="flex items-center gap-3 bg-white/20 p-2 border-2 border-black">
                                <ShieldCheck size={18} /> <span>Sistem Autentikasi Personil</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/20 p-2 border-2 border-black">
                                <ShieldCheck size={18} /> <span>Manajemen Jam Duty (Desimal)</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/20 p-2 border-2 border-black">
                                <ShieldCheck size={18} /> <span>Kalkulator KUHP Otomatis</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/20 p-2 border-2 border-black">
                                <ShieldCheck size={18} /> <span>Buku Saku SOP Digital</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/20 p-2 border-2 border-black">
                                <ShieldCheck size={18} /> <span>Database & Log Keuangan</span>
                            </div>
                        </div>
                    </motion.section>

                    {/* SECURITY PROTOCOL */}
                    <motion.section variants={item} className="bg-[#FF4D4D] border-[5px] border-black shadow-[10px_10px_0_0_#000] flex flex-col">
                        <div className="border-b-[5px] border-black p-4 flex items-center gap-3 bg-black text-[#FF4D4D]">
                            <AlertTriangle size={24} />
                            <h3 className="text-xl font-[1000] italic uppercase tracking-tight">Security Notice</h3>
                        </div>
                        <div className="p-6 flex-1 text-black font-bold text-sm bg-white">
                            <p className="leading-relaxed mb-4">
                                Sistem ini diklasifikasikan sebagai <span className="bg-red-200 px-1 border border-black uppercase text-xs">Top Secret / Classified</span>.
                                Akses hanya diberikan kepada anggota kepolisian Mandalika yang telah dilantik secara resmi.
                            </p>
                            <div className="bg-red-100 p-3 border-l-4 border-red-600">
                                Segala bentuk pencurian data, modifikasi ilegal, atau distribusi informasi internal akan dilacak melalui IP Address, Hardware ID, dan ditindak tegas oleh Divisi Propam serta Tim Cyber.
                            </div>
                        </div>
                    </motion.section>

                    {/* 🚀 CREDITS & DEVELOPER (UPDATED) */}
                    <motion.section variants={item} className="bg-[#FFD100] border-[5px] border-black shadow-[10px_10px_0_0_#000] md:col-span-2 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-20">
                            <Code size={150} className="text-black" />
                        </div>
                        <div className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="w-24 h-24 bg-black rounded-full border-[4px] border-white shadow-[6px_6px_0_0_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0">
                                <img src="/logo-polisi.png" alt="Dev" className="w-16 h-16 object-contain" />
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1">Chief Architect & Developer</p>
                                <h3 className="text-3xl md:text-4xl font-[1000] italic uppercase tracking-tighter text-black mb-2">
                                    SNOWDEN <span className="text-xl md:text-2xl opacity-50">a.k.a</span> OWEN DININGRAT
                                </h3>
                                <p className="text-sm font-bold text-slate-800 leading-relaxed max-w-xl">
                                    MDT Mandalika dibangun dan dikembangkan sepenuhnya dari nol oleh Snowden (Owen Diningrat) untuk mendigitalisasi seluruh administrasi kepolisian, meminimalisir human error, dan membawa Mandalika Police Department ke era teknologi modern.
                                </p>
                            </div>
                        </div>
                    </motion.section>
                </div>

            </motion.div>
        </div>
    );
}