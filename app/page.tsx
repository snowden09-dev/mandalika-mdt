'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Import kedua wajah yang sudah kita buat
import LandingClean from '@/app/components/LandingClean';
import LandingNeo from '@/app/components/LandingNeo';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function LandingPageBrain() {
  const router = useRouter();
  const [time, setTime] = useState('');
  const [status, setStatus] = useState('Standby');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'CLEAN' | 'NEO'>('NEO'); // Default Neo sebelum di load

  // ==========================================
  // 1. CEK TEMA KE DATABASE SUPABASE
  // ==========================================
  useEffect(() => {
    const fetchTheme = async () => {
      const { data } = await supabase
        .from('global_settings')
        .select('value_bool')
        .eq('key', 'theme_clean_active')
        .single();

      if (data && data.value_bool) {
        setActiveTheme('CLEAN');
      } else {
        setActiveTheme('NEO');
      }
    };

    fetchTheme();

    // Pasang Radar Realtime untuk ganti tema secara Live!
    const channel = supabase.channel('theme_listener').on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'global_settings', filter: "key=eq.theme_clean_active" },
      (payload) => {
        setActiveTheme(payload.new.value_bool ? 'CLEAN' : 'NEO');
      }
    ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ==========================================
  // 2. LOGIKA JAM & LOGIN (SAMA SEPERTI SEBELUMNYA)
  // ==========================================
  useEffect(() => {
    const timer = setInterval(() => { setTime(new Date().toLocaleTimeString()); }, 1000);

    if (typeof window !== 'undefined' && localStorage.getItem('police_session')) {
      router.replace('/dashboard');
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        if (localStorage.getItem('police_session')) {
          router.replace('/dashboard');
          return;
        }

        setIsLoading(true);
        setStatus('Mengecek Akses...');

        try {
          const identities = session.user.identities || [];
          const discordIdentity = identities.find((id) => id.provider === 'discord');
          const discordId = discordIdentity?.id || session.user.user_metadata?.sub;
          const discordName = session.user.user_metadata?.full_name || session.user.user_metadata?.custom_claims?.global_name || session.user.user_metadata?.name || "UNKNOWN PERSONEL";

          if (!discordId) throw new Error("INVALID_ID");

          const response = await fetch('/api/check-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: discordId }),
          });

          if (!response.ok) throw new Error("API_ERROR");
          const result = await response.json();

          if (result.isPolice === true) {
            setStatus('Sinkronisasi Data...');
            await supabase.from('users').upsert({
              discord_id: discordId,
              name: discordName.toUpperCase(),
              pangkat: result.pangkat || 'BHARADA',
              divisi: result.divisi || 'SABHARA'
            }, { onConflict: 'discord_id' });

            setStatus('Akses Diberikan!');
            localStorage.setItem('police_session', JSON.stringify({ ...result, discord_id: discordId }));
            window.location.href = '/dashboard';
          } else {
            setStatus('Akses Ditolak!');
            await supabase.auth.signOut();
            localStorage.removeItem('police_session');
            router.push('/unauthorized');
          }
        } catch (err: unknown) { // 🚀 PATCH TERTINGGI: Pakai unknown agar linter diam
          if (err instanceof Error && err.message === "INVALID_ID") {
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
    await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: window.location.origin } });
  };

  // ==========================================
  // 3. RENDER WAJAH YANG DIPILIH
  // ==========================================
  if (activeTheme === 'CLEAN') {
    return <LandingClean time={time} status={status} isLoading={isLoading} handleLogin={handleLogin} />;
  }

  return <LandingNeo time={time} status={status} isLoading={isLoading} handleLogin={handleLogin} />;
}