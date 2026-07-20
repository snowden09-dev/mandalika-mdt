"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { Save, Server, Link as LinkIcon, Hash, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface ConfigItem {
    key: string;
    value: string;
}

interface GroupedConfig {
    [key: string]: {
        webhook?: ConfigItem;
        thread?: ConfigItem;
    };
}

export default function SectionAdminConfig() {
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('admin_config').select('*').order('key', { ascending: true });
        if (data) setConfigs(data as ConfigItem[]);
        if (error) console.error("Fetch error:", error);
        setLoading(false);
    }, []);

    useEffect(() => { 
        fetchConfig(); 
    }, [fetchConfig]);

    const handleUpdate = (key: string, value: string) => {
        setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
    };

    const handleSave = async () => {
        setSaving(true);
        const tId = toast.loading("Menyimpan konfigurasi server...");

        try {
            for (const conf of configs) {
                const { error } = await supabase
                    .from('admin_config')
                    .update({ value: conf.value })
                    .eq('key', conf.key);

                if (error) throw error;
            }
            toast.success("Konfigurasi Sistem Berhasil Diperbarui!", { id: tId });
        } catch (error: unknown) {
            console.error("Save config error:", error);
            const errorMessage = error instanceof Error ? error.message : "Error tidak diketahui";
            toast.error(`Gagal menyimpan: ${errorMessage}`, { id: tId });
        } finally {
            setSaving(false);
        }
    };

    // Mengelompokkan config berdasarkan divisinya (misal: kasus_besar, patroli)
    const groupedConfigs = useMemo(() => {
        return configs.reduce<GroupedConfig>((acc, curr) => {
            const type = curr.key.includes('webhook') ? 'webhook' : 'thread';
            const name = curr.key.replace('webhook_', '').replace('thread_', '');
            if (!acc[name]) acc[name] = {};
            acc[name][type] = curr;
            return acc;
        }, {});
    }, [configs]);

    if (loading) {
        return (
            <div className="py-20 text-center animate-pulse text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                Loading System Console...
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 font-sans pb-20 text-zinc-100">
            <Toaster position="top-center" richColors />

            {/* HEADER UTAMA */}
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 p-4 md:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-tight text-zinc-100 flex items-center gap-2">
                        <Server size={18} className="text-red-500" /> System Console
                    </h2>
                    <p className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider mt-0.5">
                        Webhook & Database Configurations
                    </p>
                </div>
                <button
                    onClick={handleSave} 
                    disabled={saving}
                    className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wider transition-all shadow-sm shadow-red-900/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500"
                >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                    Simpan Config
                </button>
            </div>

            {/* GRID CONFIGURATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.keys(groupedConfigs).map((categoryName) => (
                    <div key={categoryName} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl space-y-4 shadow-xs">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 border-b border-zinc-800 pb-3 mb-4">
                            {categoryName.replace('_', ' ')}
                        </h3>

                        {groupedConfigs[categoryName].webhook && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                                    <LinkIcon size={12} className="text-zinc-500" /> Webhook URL
                                </label>
                                <input
                                    type="text"
                                    value={groupedConfigs[categoryName].webhook?.value || ''}
                                    onChange={(e) => {
                                        const webhook = groupedConfigs[categoryName].webhook;
                                        if (webhook) handleUpdate(webhook.key, e.target.value);
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-medium text-zinc-200 outline-none focus:border-red-500 transition-all"
                                    placeholder="https://discord.com/api/webhooks/..."
                                />
                            </div>
                        )}

                        {groupedConfigs[categoryName].thread && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                                    <Hash size={12} className="text-zinc-500" /> Thread ID
                                </label>
                                <input
                                    type="text"
                                    value={groupedConfigs[categoryName].thread?.value || ''}
                                    onChange={(e) => {
                                        const thread = groupedConfigs[categoryName].thread;
                                        if (thread) handleUpdate(thread.key, e.target.value);
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs font-medium text-zinc-200 outline-none focus:border-red-500 transition-all"
                                    placeholder="123456789012345678"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}