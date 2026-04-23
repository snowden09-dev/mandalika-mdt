"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { Save, Server, Link as LinkIcon, Hash, Loader2, AlertCircle } from 'lucide-react';
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

        let fetchedData = data || [];

        // 🚀 AUTO-INJECT: Memaksa munculnya 'webhook_laporan' jika belum ada di database
        const hasLaporan = fetchedData.some(c => c.key === 'webhook_laporan');
        if (!hasLaporan) {
            fetchedData.push({ id: 'temp-laporan', key: 'webhook_laporan', value: '' });
        }

        setConfigs(fetchedData);
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
                if (conf.id === 'temp-laporan') {
                    // Jika ini adalah config baru yang kita inject, lakukan INSERT ke Supabase
                    if (conf.value.trim() !== '') {
                        await supabase.from('admin_config').insert([{ key: conf.key, value: conf.value }]);
                    }
                } else {
                    // Jika config lama yang sudah ada di DB, lakukan UPDATE
                    await supabase.from('admin_config').update({ value: conf.value }).eq('id', conf.id);
                }
            }
            toast.success("Konfigurasi Sistem Berhasil Diperbarui!", { id: tId });
            fetchConfig(); // Refresh untuk mendapatkan ID asli dari database
        } catch (error) {
            toast.error("Gagal menyimpan data!", { id: tId });
        } finally {
            setSaving(false);
        }
    };

    // Mengelompokkan config berdasarkan nama (misal: laporan, kasus_besar, patroli)
    const groupedConfigs = configs.reduce((acc, curr) => {
        const type = curr.key.includes('webhook') ? 'webhook' : 'thread';
        const name = curr.key.replace('webhook_', '').replace('thread_', '');
        if (!acc[name]) acc[name] = {};
        acc[name][type] = curr;
        return acc;
    }, {} as Record<string, any>);

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

    return (
        <div className="w-full space-y-6 font-mono text-slate-950 pb-20">
            <Toaster position="top-center" richColors />

            <div className={`bg-slate-950 text-white p-6 rounded-2xl ${boxBorder} shadow-[6px_6px_0px_#00E676] flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                <div>
                    <h2 className="text-2xl font-[1000] italic uppercase flex items-center gap-3"><Server /> System Console</h2>
                    <p className="text-xs opacity-60 font-black uppercase mt-1">Webhook & Database Configurations</p>
                </div>
                <button
                    onClick={handleSave} disabled={saving}
                    className="w-full md:w-auto bg-[#00E676] text-black px-6 py-3 rounded-xl font-black italic uppercase flex items-center justify-center gap-2 border-2 border-transparent hover:border-white shadow-[3px_3px_0_0_#fff] hover:translate-y-px transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Simpan Config
                </button>
            </div>

            {/* INFO PENTING UNTUK ADMIN */}
            <div className="bg-blue-50 border-[3px] border-blue-600 p-4 rounded-xl flex items-start gap-3 shadow-[4px_4px_0_0_#2563EB]">
                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                <p className="text-[10px] font-bold uppercase leading-relaxed text-blue-900">
                    Sistem pelaporan sekarang terpusat! Jendral hanya perlu mengisi URL pada bagian <span className="font-[1000] bg-blue-200 px-1">LAPORAN</span>. Konfigurasi webhook lama (seperti Patroli, Kasus Besar, dll) bisa diabaikan atau dihapus langsung dari database Supabase.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.keys(groupedConfigs).map((categoryName) => (
                    <div key={categoryName} className={`bg-white p-6 rounded-2xl ${boxBorder} ${hardShadow} space-y-4 ${categoryName === 'laporan' ? 'ring-4 ring-[#00E676] ring-offset-2' : 'opacity-80'}`}>
                        <div className="flex justify-between items-center border-b-4 border-black/10 pb-2 mb-4">
                            <h3 className={`text-xl font-[1000] uppercase italic ${categoryName === 'laporan' ? 'text-[#00E676] drop-shadow-[1px_1px_0_#000]' : 'text-blue-600'}`}>
                                {categoryName.replace('_', ' ')}
                            </h3>
                            {categoryName === 'laporan' && (
                                <span className="bg-slate-950 text-[#00E676] text-[8px] font-black uppercase px-2 py-1 rounded shadow-[2px_2px_0_0_#000]">Active Route</span>
                            )}
                        </div>

                        {groupedConfigs[categoryName].webhook && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1"><LinkIcon size={12} /> Webhook URL</label>
                                <input
                                    type="text"
                                    placeholder="https://discord.com/api/webhooks/..."
                                    value={groupedConfigs[categoryName].webhook.value}
                                    onChange={(e) => handleUpdate(groupedConfigs[categoryName].webhook.key, e.target.value)}
                                    className="w-full bg-slate-100 border-2 border-black p-3 rounded-xl text-xs font-bold focus:bg-white shadow-inner"
                                />
                            </div>
                        )}

                        {groupedConfigs[categoryName].thread && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1"><Hash size={12} /> Thread ID (Opsional)</label>
                                <input
                                    type="text"
                                    placeholder="Biarkan kosong jika tidak pakai thread..."
                                    value={groupedConfigs[categoryName].thread.value}
                                    onChange={(e) => handleUpdate(groupedConfigs[categoryName].thread.key, e.target.value)}
                                    className="w-full bg-slate-100 border-2 border-black p-3 rounded-xl text-xs font-bold focus:bg-white shadow-inner"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}