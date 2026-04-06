"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import MaintenancePage from './MaintenancePage';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<{ loading: boolean, maintenance: boolean, isAdmin: boolean }>({
        loading: true,
        maintenance: false,
        isAdmin: false
    });

    useEffect(() => {
        // 1. FUNGSI CEK STATUS (Manual Check)
        const checkStatus = async () => {
            const sessionData = localStorage.getItem('police_session');
            let userIsAdmin = false;

            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                const { data: user } = await supabase
                    .from('users')
                    .select('is_admin, is_highadmin')
                    .eq('discord_id', parsed.discord_id)
                    .single();

                if (user?.is_admin || user?.is_highadmin) userIsAdmin = true;
            }

            const { data: settings } = await supabase
                .from('global_settings')
                .select('value_bool')
                .eq('key', 'maintenance_mode')
                .single();

            setStatus({
                loading: false,
                maintenance: settings?.value_bool || false,
                isAdmin: userIsAdmin
            });
        };

        checkStatus();

        // 🚀 2. PASANG RADAR REALTIME (Listen for Changes)
        const channel = supabase
            .channel('public:global_settings') // Nama channel bebas
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'global_settings' },
                (payload) => {
                    // Jika ada baris maintenance_mode yang diubah
                    if (payload.new.key === 'maintenance_mode') {
                        setStatus(prev => ({
                            ...prev,
                            maintenance: payload.new.value_bool
                        }));
                    }
                }
            )
            .subscribe();

        // Bersihkan radar pas komponen gak kepakai
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (status.loading) return <div className="bg-[#E0E7FF] h-screen w-full" />;

    // LOCKDOWN REALTIME: Jika Aktif & Bukan Admin -> Tendang ke layar Maintenance
    if (status.maintenance && !status.isAdmin) {
        return <MaintenancePage />;
    }

    return <>{children}</>;
}
