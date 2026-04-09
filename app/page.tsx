'use client';

import { motion, Variants } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

// Impor font Quicksand
import "@fontsource/quicksand/500.css";
import "@fontsource/quicksand/700.css";
import "@fontsource/quicksand/800.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- ANIMASI ---
const float: Variants = {
  animate: {
    y: [-10, 10, -10],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 }
  }
};

export default function LandingPage() {
  const router = useRouter();
  const [time, setTime] = useState('');
  const [status, setStatus] = useState('Standby');
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // 🛡️ LOGIKA SISTEM (TIDAK ADA YANG DIUBAH)
  // ==========================================
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    // --- 🚀 FAST TRACK INTERCEPTOR ---
    if (typeof window !== 'undefined') {
      const localSession = localStorage.getItem('police_session');
      if (localSession) {
        router.replace('/dashboard');
        return;
      }
    }

    // --- LOGIKA CEK ROLE & ANTI-DUPLIKAT (PATCHED) ---
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {

        if (localStorage.getItem('police_session')) {
          router.replace('/dashboard');
          return;
        }

        setIsLoading(true);
        setStatus('Mengecek Akses...');

        try {
          // 1. 🛡️ PATCH KEAMANAN: Ekstraksi ID Discord yang Valid
          const identities = session.user.identities || [];
          const discordIdentity = identities.find((id) => id.provider === 'discord');
          const discordId = discordIdentity?.id || session.user.user_metadata?.sub;

          const discordName =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.custom_claims?.global_name ||
            session.user.user_metadata?.name ||
            "UNKNOWN PERSONEL";

          if (!discordId) {
            console.error("CRITICAL ERROR: Discord ID gagal didapatkan dari Session!");
            throw new Error("INVALID_ID");
          }

          // 2. Verifikasi Role via API
          const response = await fetch('/api/check-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: discordId }),
          });

          if (!response.ok) throw new Error("API_ERROR");
          const result = await response.json();

          // 🚨 HARUS EXACTLY TRUE
          if (result.isPolice === true) {
            setStatus('Sinkronisasi Data...');

            // 3. Upsert Database Aman
            const { error: syncError } = await supabase
              .from('users')
              .upsert({
                discord_id: discordId,
                name: discordName.toUpperCase(),
                pangkat: result.pangkat || 'BHARADA',
                divisi: result.divisi || 'SABHARA'
              }, {
                onConflict: 'discord_id',
                ignoreDuplicates: false
              });

            if (syncError) {
              console.error("Sync Error Details:", syncError);
            }

            setStatus('Akses Diberikan!');
            localStorage.setItem('police_session', JSON.stringify({ ...result, discord_id: discordId }));
            window.location.href = '/dashboard';
          } else {
            setStatus('Akses Ditolak!');
            await supabase.auth.signOut();
            localStorage.removeItem('police_session');
            router.push('/unauthorized');
          }
        } catch (err: any) {
          console.error("Gagal Verifikasi:", err);
          if (err.message === "INVALID_ID") {
            setStatus('Akses Ilegal Diblokir');
            await supabase.auth.signOut();
          } else {
            setStatus('Gagal Sistem');
          }
          setIsLoading(false);
        }
      }
    });

    return () => {
      clearInterval(timer);
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogin = async () => {
    if (isLoading) return;
    setStatus('Menghubungkan...');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      console.error("Gagal Login:", error.message);
      setStatus('Gagal Login');
    }
  };

  // ==========================================
  // 🎨 TAMPILAN BARU (TRAKTEER STYLE)
  // ==========================================
  return (
    <main className="min-h-screen bg-[#001D4C] text-white font-[Quicksand] flex flex-col relative overflow-hidden">

      {/* HEADER ALA TRAKTEER */}
      <header className="absolute top-0 left-0 w-full p-4 md:p-6 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-full">
              <img src="/logo-polisi.png" alt="Logo" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tight">mandalika</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-sm font-medium text-white/70">Waktu: {time || '00:00'} WIB</span>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="bg-white text-[#001D4C] px-5 py-2 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              Login <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto px-6 pt-24 lg:pt-0 w-full z-10 gap-12">

        {/* TEKS KIRI */}
        <div className="flex-1 space-y-6 text-center lg:text-left mt-10 lg:mt-0">
          <motion.h1
            initial="hidden" animate="visible" variants={popIn}
            className="text-5xl sm:text-6xl lg:text-7xl font-[800] tracking-tight leading-[1.1]"
          >
            Pusat Terminal <br />
            <span className="text-[#FFD100]">Operasi Personel.</span>
          </motion.h1>

          <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
            Akses Mobile Data Terminal Mandalika secara modern, efisien, dan aman. Semuanya di satu tempat. Gak ribet!
          </p>

          <div className="flex flex-col items-center lg:items-start gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              disabled={isLoading}
              className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all ${isLoading
                ? 'bg-slate-400 text-slate-800 cursor-not-allowed'
                : 'bg-[#00E676] hover:bg-[#00c853] text-[#001D4C] shadow-green-500/30'
                }`}
            >
              <img src="/discord-login.png" alt="Discord" className="w-6 h-6 object-contain" />
              {isLoading ? status : 'Login via Discord'} <ArrowRight size={20} />
            </motion.button>

            {/* Indikator Status Transparan */}
            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-white/10 text-sm font-medium">
              <Zap size={16} className={isLoading ? 'animate-pulse text-[#FFD100]' : 'text-white/50'} />
              Status Radar: <span className={isLoading ? 'text-[#FFD100]' : 'text-white'}>{status}</span>
            </div>
          </div>
        </div>

        {/* GAMBAR HUSKY KANAN */}
        <div className="flex-1 w-full relative flex justify-center lg:justify-end pb-20 lg:pb-0">
          <motion.div variants={float} animate="animate" className="relative z-10 w-full max-w-md lg:max-w-lg">
            <img
              src="/logo-husky-polisi.png"
              alt="Husky Police"
              className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            />

            {/* Pop-up ala Trakteer */}
            <motion.div
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
              className="absolute bottom-10 -left-6 md:-left-12 bg-white text-slate-900 p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 w-64"
            >
              <div className="bg-red-100 p-2 rounded-xl text-red-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">Keamanan Propam</p>
                <p className="text-[11px] text-slate-500 leading-tight">Akses tanpa izin akan dilacak & ditindak tegas.</p>
              </div>
            </motion.div>

          </motion.div>
        </div>

      </div>

      {/* Background Patterns (Opsional biar ga sepi) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

    </main>
  );
}