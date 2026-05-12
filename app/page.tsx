'use client';

import { motion, Variants } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, KeySquare } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- ANIMASI ---
const dropIn: Variants = {
  hidden: { opacity: 0, y: -100 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 12 }
  }
};

const float: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
  }
};

export default function LandingPage() {
  const router = useRouter();
  const [time, setTime] = useState('');
  const [status, setStatus] = useState('LOG MASUK');
  const [isLoading, setIsLoading] = useState(false);

  // 🚀 STATE UNTUK MODE DARURAT (TOKEN)
  const [isTokenMode, setIsTokenMode] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

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

    let isProcessing = false;

    // --- LOGIKA CEK ROLE & ANTI-DUPLIKAT (DISCORD OAUTH) ---
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        if (localStorage.getItem('police_session')) {
          router.replace('/dashboard');
          return;
        }

        if (isProcessing) return;
        isProcessing = true;
        setIsLoading(true);
        setStatus('MENGECEK AKSES...');

        try {
          const identities = session.user.identities || [];
          const discordIdentity = identities.find((id) => id.provider === 'discord');
          const discordId = discordIdentity?.id || session.user.user_metadata?.sub;
          const discordName =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.custom_claims?.global_name ||
            session.user.user_metadata?.name ||
            "UNKNOWN PERSONEL";

          if (!discordId) {
            throw new Error("INVALID_ID");
          }

          const response = await fetch('/api/check-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: discordId }),
          });

          if (!response.ok) throw new Error("API_ERROR");
          const result = await response.json();

          if (result.isPolice === true) {
            setStatus('SINKRONISASI DATA...');

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

            if (syncError) console.error("Sync Error Details:", syncError);

            setStatus('AKSES DIBERIKAN!');
            localStorage.setItem('police_session', JSON.stringify({ ...result, discord_id: discordId }));

            window.location.href = '/dashboard';
          } else {
            setStatus('AKSES DITOLAK!');
            await supabase.auth.signOut();
            localStorage.removeItem('police_session');
            router.push('/unauthorized');
          }
        } catch (err: any) {
          console.error("Gagal Verifikasi:", err);
          await supabase.auth.signOut();
          localStorage.removeItem('police_session');

          if (err.message === "INVALID_ID") {
            setStatus('AKSES ILEGAL DIBLOKIR');
          } else {
            setStatus('GAGAL SISTEM. COBA LAGI.');
          }

          setIsLoading(false);
          isProcessing = false;
        }
      }
    });

    return () => {
      clearInterval(timer);
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // --- OAUTH LOGIN ---
  const handleLogin = async () => {
    if (isLoading) return;
    setStatus('MENGHUBUNGKAN...');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      console.error("Gagal Login:", error.message);
      setStatus('LOG MASUK');
    }
  };

  // --- 🚀 BYPASS TOKEN LOGIN DENGAN SINKRONISASI DISCORD ---
  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || isLoading) return;

    setIsLoading(true);
    setStatus('VERIFIKASI TOKEN...');

    try {
      // 1. Cari token di database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('bypass_token', tokenInput.trim())
        .single();

      if (error || !data || !data.discord_id) {
        throw new Error("TOKEN_INVALID");
      }

      setStatus('SINKRONISASI DISCORD...');

      // 2. Tarik data role TERBARU langsung dari Discord Server (Sama seperti login normal!)
      const response = await fetch('/api/check-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.discord_id }), // Tembak API pakai ID dari database
      });

      if (!response.ok) throw new Error("API_ERROR");
      const result = await response.json();

      // 3. Pastikan dia masih berstatus Polisi di server Discord
      if (result.isPolice === true) {
        setStatus('MEMPERBARUI DOSSIER...');

        // 4. Update data di Supabase jika ada kenaikan pangkat/perubahan divisi
        await supabase
          .from('users')
          .update({
            pangkat: result.pangkat || data.pangkat,
            divisi: result.divisi || data.divisi
          })
          .eq('discord_id', data.discord_id);

        setStatus('BYPASS BERHASIL!');

        // 5. Injeksi session dengan role paling baru (bukan sekadar data usang)
        const sessionData = {
          discord_id: data.discord_id,
          name: data.name,
          isPolice: true,
          pangkat: result.pangkat || data.pangkat,
          divisi: result.divisi || data.divisi,
        };

        localStorage.setItem('police_session', JSON.stringify(sessionData));
        window.location.href = '/dashboard';

      } else {
        // Jika ternyata role polisinya dicabut di Discord, tolak aksesnya meski punya token
        throw new Error("ROLE_REVOKED");
      }

    } catch (err: any) {
      console.error(err);

      if (err.message === "ROLE_REVOKED") {
        setStatus('ROLE DICABUT!');
      } else if (err.message === "TOKEN_INVALID") {
        setStatus('TOKEN TIDAK VALID!');
      } else {
        setStatus('GAGAL SINKRONISASI!');
      }

      setTimeout(() => setStatus('LOG MASUK'), 3000);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#E0E7FF] text-black flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* --- DEKORASI BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-[#FFD100] border-4 border-black rounded-full shadow-[8px_8px_0_0_#000] rotate-12 hidden lg:block" />
        <div className="absolute bottom-[15%] right-[10%] w-48 h-48 bg-[#00E676] border-4 border-black shadow-[12px_12px_0_0_#000] -rotate-6 hidden lg:block" />
        <div className="absolute top-[20%] right-[5%] w-24 h-24 bg-[#FF4D4D] border-b-[20px] border-black hidden lg:block" />
      </div>

      {/* --- WIDGET KIRI: TIME --- */}
      <motion.div
        variants={float} animate="animate"
        className="hidden lg:flex absolute left-12 top-24 w-64 bg-white border-4 border-black p-4 flex-col gap-2 shadow-[10px_10px_0px_0px_#3B82F6] rotate-[-2deg]"
      >
        <div className="bg-[#3B82F6] p-2 font-black text-center border-b-4 border-black uppercase italic">
          Mandalika Time
        </div>
        <p className="text-4xl font-black text-center py-4 tracking-tighter">{time || '00:00:00'}</p>
        <p className="text-[10px] font-black bg-[#FFD100] p-1 text-center border-2 border-black uppercase">
          RADAR_STATUS: ACTIVE
        </p>
      </motion.div>

      {/* --- KARTU UTAMA --- */}
      <motion.div
        initial="hidden" animate="visible" variants={dropIn}
        className="w-full max-w-sm bg-white border-[6px] border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] z-10 relative overflow-hidden flex flex-col"
      >
        <div className="bg-[#FFD100] border-b-4 border-black p-2 flex justify-between items-center px-4">
          <span className="font-black text-[12px] italic uppercase tracking-widest">Official MDT v2.1</span>
          <div className={`w-4 h-4 bg-[#FF4D4D] border-2 border-black rounded-full ${isLoading ? 'animate-ping' : 'animate-pulse'}`} />
        </div>

        <div className="p-8 flex flex-col items-center text-black flex-1">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="bg-[#A78BFA] border-4 border-black p-4 shadow-[8px_8px_0px_0px_#000] mb-8"
          >
            <img src="/logo-polisi.png" alt="Logo" className="w-20 h-20 md:w-24 md:h-24 object-contain" />
          </motion.div>

          <h1 className="text-5xl font-[1000] text-center uppercase leading-none tracking-tighter mb-2 italic">
            MANDALIKA<br />
            <span className="text-[#3B82F6] underline decoration-black decoration-8 underline-offset-4 italic">POLICE</span>
          </h1>
          <p className="bg-black text-[#00E676] px-4 py-1 font-black text-sm uppercase mb-8 italic">
            Mobile Data Terminal
          </p>

          <div className="w-full space-y-4">

            {/* 🚀 LOGIC TOGGLE: Tampilkan tombol Discord ATAU form Token */}
            {!isTokenMode ? (
              <>
                <motion.button
                  onClick={handleLogin}
                  disabled={isLoading}
                  whileHover={{ x: 8, y: -8, boxShadow: "0px 0px 0px 0px #000" }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full ${isLoading ? 'bg-gray-400' : 'bg-[#5865F2]'} text-black font-[1000] text-2xl py-5 border-4 border-black shadow-[10px_10px_0px_0px_#000] flex items-center justify-center gap-4 transition-all`}
                >
                  <img src="/discord-login.png" alt="Discord" className="w-10 h-10" />
                  <span>{status}</span>
                </motion.button>

                {/* Tombol beralih ke Mode Darurat */}
                <button
                  onClick={() => setIsTokenMode(true)}
                  className="w-full text-[10px] font-black uppercase text-slate-500 hover:text-black underline decoration-2 underline-offset-4 flex justify-center items-center gap-2 mt-2 transition-colors"
                >
                  <KeySquare size={12} /> Kendala Login Discord? Akses Darurat
                </button>
              </>
            ) : (
              <motion.form
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                onSubmit={handleTokenLogin}
                className="w-full space-y-3"
              >
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    placeholder="MASUKKAN BYPASS TOKEN..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full bg-slate-100 border-4 border-black pl-10 pr-4 py-4 font-black uppercase italic placeholder:opacity-50 outline-none focus:bg-[#FFD100] transition-colors"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTokenMode(false)}
                    className="bg-slate-200 border-4 border-black p-4 font-black hover:bg-slate-300"
                    disabled={isLoading}
                  >
                    X
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 ${isLoading ? 'bg-gray-400' : 'bg-[#00E676] hover:bg-[#A3E635]'} text-black font-[1000] text-xl py-4 border-4 border-black shadow-[6px_6px_0px_0px_#000] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] transition-all uppercase italic`}
                  >
                    {status === 'LOG MASUK' ? 'VERIFIKASI' : status}
                  </button>
                </div>
              </motion.form>
            )}

            <div className="bg-[#FF4D4D] border-4 border-black p-3 shadow-[6px_6px_0px_0px_#000] mt-4">
              <p className="text-[10px] font-black text-center uppercase leading-tight italic">
                PERINGATAN: AKSES TANPA IZIN AKAN DILACAK DAN DITINDAK TEGAS OLEH DIVISI PROPAM.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black py-2 px-4 flex justify-between items-center font-black italic text-[10px] mt-auto">
          <span className="text-[#CCFF00] uppercase">Mandalika_Secure_Link</span>
          <span className="text-white opacity-40">v2.1.0-BYPASS</span>
        </div>
      </motion.div>
    </main>
  );
}