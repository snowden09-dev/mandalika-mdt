"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { Save, Server, Link as LinkIcon, Hash, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

export default function SectionAdminConfig() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchConfig = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('admin_config').select('*').order('key', { ascending: true });
        if (data) setConfigs(data);
        if (error) console.error("Fetch error:", error);
        setLoading(false);
    };

    useEffect(() => { fetchConfig(); }, []);

    const handleUpdate = (key: string, value: string) => {
        setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
    };

    const handleSave = async () => {
        setSaving(true);
        const tId = toast.loading("Menyimpan konfigurasi server...");

        try {
            for (const conf of configs) {
                // 🚀 BUGFIX: Target menggunakan 'key' dan menangkap error eksplisit
                const { error } = await supabase
                    .from('admin_config')
                    .update({ value: conf.value })
                    .eq('key', conf.key);

                if (error) throw error; // Memaksa masuk ke blok catch jika database menolak
            }
            toast.success("Konfigurasi Sistem Berhasil Diperbarui!", { id: tId });
        } catch (error: any) {
            console.error("Save config error:", error);
            // 🚀 Menampilkan error aslinya agar ketahuan jika ada blokir RLS
            toast.error(`Gagal menyimpan: ${error.message || "Error tidak diketahui"}`, { id: tId });
        } finally {
            setSaving(false);
        }
    };

    // Mengelompokkan config berdasarkan divisinya (misal: kasus_besar, patroli)
    const groupedConfigs = configs.reduce((acc: any, curr: any) => {
        const type = curr.key.includes('webhook') ? 'webhook' : 'thread';
        const name = curr.key.replace('webhook_', '').replace('thread_', '');
        if (!acc[name]) acc[name] = {};
        acc[name][type] = curr;
        return acc;
    }, {});

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" size={40} /></div>;

    return (
        <div className="w-full space-y-6 font-mono text-slate-950 pb-20">
            <Toaster position="top-center" />

            <div className={`bg-slate-950 text-white p-6 rounded-2xl ${boxBorder} shadow-[6px_6px_0px_#00E676] flex justify-between items-center`}>
                <div>
                    <h2 className="text-2xl font-[1000] italic uppercase flex items-center gap-3"><Server /> System Console</h2>
                    <p className="text-xs opacity-60 font-black uppercase mt-1">Webhook & Database Configurations</p>
                </div>
                <button
                    onClick={handleSave} disabled={saving}
                    className="bg-[#00E676] text-black px-6 py-3 rounded-xl font-black italic uppercase flex items-center gap-2 border-2 border-transparent hover:border-white transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Simpan Config
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.keys(groupedConfigs).map((categoryName) => (
                    <div key={categoryName} className={`bg-white p-6 rounded-2xl ${boxBorder} ${hardShadow} space-y-4`}>
                        <h3 className="text-xl font-[1000] uppercase italic border-b-4 border-black/10 pb-2 mb-4 text-blue-600">
                            {categoryName.replace('_', ' ')}
                        </h3>

                        {groupedConfigs[categoryName].webhook && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1"><LinkIcon size={12} /> Webhook URL</label>
                                <input
                                    type="text"
                                    value={groupedConfigs[categoryName].webhook.value || ''}
                                    onChange={(e) => handleUpdate(groupedConfigs[categoryName].webhook.key, e.target.value)}
                                    className="w-full bg-slate-100 border-2 border-black p-3 rounded-xl text-xs font-bold focus:bg-white outline-none focus:border-blue-600"
                                />
                            </div>
                        )}

                        {groupedConfigs[categoryName].thread && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1"><Hash size={12} /> Thread ID</label>
                                <input
                                    type="text"
                                    value={groupedConfigs[categoryName].thread.value || ''}
                                    onChange={(e) => handleUpdate(groupedConfigs[categoryName].thread.key, e.target.value)}
                                    className="w-full bg-slate-100 border-2 border-black p-3 rounded-xl text-xs font-bold focus:bg-white outline-none focus:border-blue-600"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}