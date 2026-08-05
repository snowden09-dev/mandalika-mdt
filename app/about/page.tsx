"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import {
    ArrowLeft, Info, ShieldCheck, Database,
    Terminal, AlertTriangle, Fingerprint, Code
} from 'lucide-react';

const fadeIn: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" }
    }
};

export default function AboutPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-[#09090b] text-zinc-100 font-sans pb-32 selection:bg-red-500 selection:text-white">
            
            {/* HEADER NAV */}
            <header className="bg-[#121214]/80 backdrop-blur-md border-b border-zinc-800/80 p-4 sticky top-0 z-50 flex justify-between items-center px-6 lg:px-12">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/dashboard')} 
                        className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-zinc-300 hover:text-white flex items-center justify-center"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Info size={18} className="text-red-500" /> About System
                        </h1>
                        <p className="text-xs text-zinc-400 font-mono">Mandalika Mobile Data Terminal</p>
                    </div>
                </div>
            </header>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="p-4 md:p-8 max-w-4xl mx-auto space-y-6"
            >
                {/* HERO SECTION - SYSTEM IDENTIFICATION */}
                <section className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-8 md:p-12 relative overflow-hidden flex flex-col items-center text-center shadow-xl">
                    <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
                        <Fingerprint size={250} className="text-white" />
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6 relative z-10 text-red-400">
                        <Terminal size={32} />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 relative z-10">
                        MANDALIKA <span className="text-red-500">MDT</span>
                    </h2>
                    
                    <div className="mb-6 relative z-10">
                        <span className="text-emerald-400 font-mono text-xs font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                            VERSION 2.0.4 - LOCKED
                        </span>
                    </div>

                    <p className="text-zinc-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed relative z-10 font-sans">
                        Sistem Informasi Kepolisian Terpadu. Dirancang khusus untuk birokrasi, pencatatan log, kalkulasi hukum, dan manajemen operasional Mandalika Police Department.
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CORE MODULES */}
                    <section className="bg-[#121214] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                        <div className="bg-zinc-900/60 border-b border-zinc-800/80 p-4 px-6 flex items-center gap-3">
                            <Database className="text-red-400" size={18} />
                            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">Core Modules</h3>
                        </div>
                        <div className="p-6 space-y-2.5 flex-1 text-xs text-zinc-300 font-medium">
                            <div className="flex items-center gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                                <ShieldCheck size={16} className="text-red-400 shrink-0" /> <span>Sistem Autentikasi Personil</span>
                            </div>
                            <div className="flex items-center gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                                <ShieldCheck size={16} className="text-red-400 shrink-0" /> <span>Manajemen Jam Duty (Desimal)</span>
                            </div>
                            <div className="flex items-center gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                                <ShieldCheck size={16} className="text-red-400 shrink-0" /> <span>Kalkulator KUHP Otomatis</span>
                            </div>
                            <div className="flex items-center gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                                <ShieldCheck size={16} className="text-red-400 shrink-0" /> <span>Buku Saku SOP Digital</span>
                            </div>
                            <div className="flex items-center gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                                <ShieldCheck size={16} className="text-red-400 shrink-0" /> <span>Database & Log Keuangan</span>
                            </div>
                        </div>
                    </section>

                    {/* SECURITY PROTOCOL */}
                    <section className="bg-[#121214] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                        <div className="bg-zinc-900/60 border-b border-zinc-800/80 p-4 px-6 flex items-center gap-3">
                            <AlertTriangle className="text-amber-400" size={18} />
                            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">Security Notice</h3>
                        </div>
                        <div className="p-6 flex-1 text-xs text-zinc-300 leading-relaxed space-y-4 flex flex-col justify-between">
                            <p>
                                Sistem ini diklasifikasikan sebagai <span className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-mono text-[11px] uppercase">Top Secret / Classified</span>. Akses hanya diberikan kepada anggota kepolisian Mandalika yang telah dilantik secara resmi.
                            </p>
                            <div className="bg-red-500/5 p-3.5 rounded-xl border border-red-500/20 text-red-300/90 text-[11px]">
                                Segala bentuk pencurian data, modifikasi ilegal, atau distribusi informasi internal akan dilacak melalui IP Address, Hardware ID, dan ditindak tegas oleh Divisi Propam serta Tim Cyber.
                            </div>
                        </div>
                    </section>

                    {/* CREDITS & DEVELOPER */}
                    <section className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 md:p-8 md:col-span-2 relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center gap-6">
                        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                            <Code size={150} className="text-white" />
                        </div>
                        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                            <Image src="/logo-polisi.png" alt="Dev" width={48} height={48} className="w-12 h-12 object-contain" />
                        </div>
                        <div className="text-center md:text-left relative z-10">
                            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Chief Architect & Developer</p>
                            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                                SNOWDEN <span className="text-base text-zinc-500 font-normal">a.k.a</span> OWEN DININGRAT
                            </h3>
                            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
                                MDT Mandalika dibangun dan dikembangkan sepenuhnya dari nol oleh Snowden (Owen Diningrat) untuk mendigitalisasi seluruh administrasi kepolisian, meminimalisir human error, dan membawa Mandalika Police Department ke era teknologi modern.
                            </p>
                        </div>
                    </section>
                </div>
            </motion.div>
        </main>
    );
}