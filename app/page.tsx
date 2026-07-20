'use client';

import { motion, Variants } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, KeySquare, Shield, Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

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

export default function LandingPage() {
  const router = useRouter();
  const [time, setTime] = useState('');
  const [status, setStatus] = useState('MASUK DENGAN DISCORD');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenMode, setIsTokenMode] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    if (typeof window !== 'undefined') {
      const localSession = localStorage.getItem('police_session');
      if (localSession) {
        router.replace('/dashboard');
        return;
      }
    }

    let isProcessing = false;

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

          if (!discordId) throw new Error("INVALID_ID");

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

            setStatus('AKSES DIBERIKAN');
            localStorage.setItem('police_session', JSON.stringify({ ...result, discord_id: discordId }));
            window.location.href = '/dashboard';
          } else {
            setStatus('AKSES DITOLAK');
            await supabase.auth.signOut();
            localStorage.removeItem('police_session');
            router.push('/unauthorized');
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error("Gagal Verifikasi:", errorMessage);
          await supabase.auth.signOut();
          localStorage.removeItem('police_session');
          setStatus(errorMessage === "INVALID_ID" ? 'AKSES ILEGAL' : 'GAGAL SISTEM');
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

  const handleLogin = async () => {
    if (isLoading) return;
    setStatus('MENGHUBUNGKAN...');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      console.error("Gagal Login:", error.message);
      setStatus('MASUK DENGAN DISCORD');
    }
  };

  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || isLoading) return;

    setIsLoading(true);
    setStatus('VERIFIKASI TOKEN...');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('bypass_token', tokenInput.trim())
        .single();

      if (error || !data || !data.discord_id) throw new Error("TOKEN_INVALID");

      setStatus('SINKRONISASI...');

      const response = await fetch('/api/check-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.discord_id }),
      });

      if (!response.ok) throw new Error("API_ERROR");
      const result = await response.json();

      if (result.isPolice === true) {
        setStatus('MEMPERBARUI...');
        await supabase
          .from('users')
          .update({
            pangkat: result.pangkat || data.pangkat,
            divisi: result.divisi || data.divisi
          })
          .eq('discord_id', data.discord_id);

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
        throw new Error("ROLE_REVOKED");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(errorMessage);
      setStatus(errorMessage === "ROLE_REVOKED" ? 'ROLE DICABUT' : errorMessage === "TOKEN_INVALID" ? 'TOKEN TIDAK VALID' : 'GAGAL');
      setTimeout(() => setStatus('MASUK DENGAN DISCORD'), 3000);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden font-mono">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Bar Info */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center max-w-7xl mx-auto text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>MDT SECURE LINK // v2.1</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300">
          <Clock size={13} className="text-red-500" />
          <span>{time || '00:00:00'}</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/80 rounded-2xl relative overflow-hidden flex flex-col p-6 sm:p-8"
      >
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Image src="/logo-polisi.png" alt="Logo" width={40} height={40} className="object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
            Mandalika Police
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Mobile Data Terminal Authentication
          </p>
        </div>

        {/* Form / Actions */}
        <div className="space-y-4">
          {!isTokenMode ? (
            <>
              <motion.button
                onClick={handleLogin}
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg ${
                  isLoading
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    : 'bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-[#5865F2]/20'
                }`}
              >
                <Shield size={16} />
                <span>{status}</span>
              </motion.button>

              <button
                onClick={() => setIsTokenMode(true)}
                className="w-full text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1.5 pt-2 cursor-pointer"
              >
                <KeySquare size={13} className="text-red-500" /> Kendala Login? Gunakan Bypass Token
              </button>
            </>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleTokenLogin}
              className="space-y-3"
            >
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="password"
                  placeholder="MASUKKAN BYPASS TOKEN..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs font-mono uppercase tracking-wider text-zinc-100 placeholder:text-zinc-600 focus:border-red-500 outline-none transition-all"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTokenMode(false)}
                  className="px-4 py-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer"
                  disabled={isLoading}
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{status === 'MASUK DENGAN DISCORD' ? 'VERIFIKASI' : status}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.form>
          )}
        </div>

        {/* Footer Warning */}
        <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-start gap-2.5">
          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-tight leading-relaxed">
            Akses terbatas untuk personel resmi. Segala aktivitas login dicatat dan dipantau oleh Divisi Propam.
          </p>
        </div>
      </motion.div>
    </main>
  );
}