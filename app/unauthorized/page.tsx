'use client';

import { motion, Variants } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const fadeIn: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" }
    }
};

export default function UnauthorizedPage() {

    const handleLogoutAndRetry = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <main className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 font-sans selection:bg-red-500 selection:text-white">
            
            {/* CONTAINER UTAMA */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="w-full max-w-md bg-[#121214] border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            >
                {/* Aksen Garis Merah Minimalis di Atas */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

                {/* HEADER / STATUS */}
                <div className="flex justify-between items-center mb-8">
                    <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
                        MDT // Security Protocol
                    </span>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-medium text-red-400 tracking-wider uppercase">Access Denied</span>
                    </div>
                </div>

                {/* KONTEN UTAMA */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                            Akses Ditolak
                        </h1>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Akun Discord Anda tidak terdeteksi memiliki role kepolisian yang valid untuk mengakses sistem Mandalika MDT.
                        </p>
                    </div>

                    {/* DETAIL ERROR BOX */}
                    <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
                        <div className="flex gap-3">
                            <div className="text-red-500 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25a.75.75 0 001.5 0V9zm-.75 6.75a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-red-400 tracking-wide uppercase">Verifikasi Gagal</h3>
                                <p className="text-xs text-red-300/80 mt-0.5">Pastikan Anda masuk menggunakan akun Discord instansi yang benar.</p>
                            </div>
                        </div>
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="pt-2">
                        <button
                            onClick={handleLogoutAndRetry}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-medium text-sm py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-red-900/20 active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            <span>Kembali ke Halaman Login</span>
                        </button>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="mt-8 pt-4 border-t border-zinc-800/60 text-center">
                    <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                        Mandalika Police Department &bull; Secure Portal
                    </p>
                </div>
            </motion.div>

        </main>
    );
}