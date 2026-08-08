"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Send, DollarSign, Activity, Award, PlusCircle, MinusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from "@/lib/supabase";
import { toast } from 'sonner';

const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

const BONUS_RULES = {
    kadivRoles: [
        { divisi: "Sabhara", id: "1423067332389109801" },
        { divisi: "Satlantas", id: "1428104594252238998" },
        { divisi: "Setum", id: "1518415347558907992" },
        { divisi: "Propam", id: "1458651434500358194" },
        { divisi: "Brimob", id: "1445077121318785075" },
    ],
    wakadivRoles: [
        { divisi: "Sabhara", id: "1423068619860082888" },
        { divisi: "Satlantas", id: "1428104859717996665" },
        { divisi: "Setum", id: "1518415643022725201" },
        { divisi: "Propam", id: "1466377320909635666" },
        { divisi: "Brimob", id: "1456339100457238598" },
    ]
};

export default function SlipGajiTemplate({ data, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const slipRef = useRef<HTMLDivElement>(null);
    const [adminSession, setAdminSession] = useState<{ name: string, pangkat: string, divisi: string } | null>(null);
    const [userData, setUserData] = useState<any>(null);

    // Ambil data user dari database berdasarkan berbagai kemungkinan key ID
    useEffect(() => {
        const fetchUserDetails = async () => {
            const targetId = data.user_id_discord || data.discord_id || data.user_id || data.id_discord;
            const targetName = data.name;

            if (targetId) {
                let query = supabase.from('users').select('*');
                if (typeof targetId === 'string' && targetId.length > 10) {
                    query = query.eq('discord_id', targetId);
                } else {
                    query = query.or(`discord_id.eq.${targetId},id.eq.${targetId}`);
                }
                const { data: uData } = await query.maybeSingle();
                if (uData) {
                    setUserData(uData);
                    return;
                }
            }

            // Fallback cari berdasarkan nama jika ID tidak ketemu
            if (targetName) {
                const cleanTarget = targetName.includes('|') ? targetName.split('|').pop()?.trim() : targetName;
                const { data: uDataName } = await supabase
                    .from('users')
                    .select('*')
                    .ilike('name', `%${cleanTarget}%`)
                    .maybeSingle();
                if (uDataName) setUserData(uDataName);
            }
        };

        fetchUserDetails();

        const sessionData = localStorage.getItem('police_session');
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                supabase.from('users').select('name, pangkat, divisi').eq('discord_id', parsed.discord_id).single()
                    .then(({ data: user }) => {
                        if (user) {
                            setAdminSession({
                                name: user.name?.split('|').pop()?.trim() || "ADMIN",
                                pangkat: user.pangkat,
                                divisi: user.divisi
                            });
                        }
                    });
            } catch (e) {
                console.error(e);
            }
        }
    }, [data]);

    // Evaluasi Status Kadiv / Wakadiv secara akurat
    const evaluateKadivStatus = () => {
        const kadivIds = BONUS_RULES.kadivRoles.map(r => String(r.id).trim());
        const wakadivIds = BONUS_RULES.wakadivRoles.map(r => String(r.id).trim());

        let userRolesArr: string[] = [];
        const rawRoles = userData?.roles || data?.roles;
        if (rawRoles) {
            if (Array.isArray(rawRoles)) {
                userRolesArr = rawRoles.map((r: any) => String(r).trim());
            } else if (typeof rawRoles === 'string') {
                let cleaned = rawRoles.trim();
                if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
                    cleaned = cleaned.slice(1, -1);
                    userRolesArr = cleaned.split(',').map(r => r.replace(/"/g, '').trim());
                } else {
                    try { 
                        const parsed = JSON.parse(cleaned);
                        if (Array.isArray(parsed)) userRolesArr = parsed.map((r: any) => String(r).trim());
                        else userRolesArr = [String(cleaned).trim()];
                    } catch { 
                        userRolesArr = cleaned.split(',').map(r => r.replace(/"/g, '').trim()); 
                    }
                }
            }
        }

        const isKadivFromDb = userData?.is_kadiv === true || userData?.is_kadiv === 'true' || userData?.is_kadiv === 1 || data?.is_kadiv === true;
        const isWakadivFromDb = userData?.is_wakadiv === true || userData?.is_wakadiv === 'true' || userData?.is_wakadiv === 1 || data?.is_wakadiv === true;

        const isKadivRole = kadivIds.some(id => userRolesArr.includes(id));
        const isWakadivRole = wakadivIds.some(id => userRolesArr.includes(id));

        const combinedText = `${data.pangkat || ""} ${data.divisi || ""} ${userData?.pangkat || ""} ${userData?.jabatan || ""}`.toUpperCase();
        const isKadivText = combinedText.includes('KADIV');
        const isWakadivText = combinedText.includes('WAKADIV');

        const isKadiv = isKadivFromDb || isKadivRole || isKadivText;
        const isWakadiv = !isKadiv && (isWakadivFromDb || isWakadivRole || isWakadivText);

        return { isKadiv, isWakadiv };
    };

    const { isKadiv, isWakadiv } = evaluateKadivStatus();

    const handleSendSlip = async () => {
        setLoading(true);
        const tId = toast.loading("Processing Transaction...");
        try {
            const { error } = await supabase
                .from('pengajuan_gaji')
                .update({ status: 'SENT_IMAGE_QR', keterangan_admin: `PROCESSED BY ${adminSession?.pangkat || 'HIGH COMMAND'}` })
                .eq('id', data.id);

            if (error) throw error;
            
            toast.success("Transaction Complete & Status Updated!", { id: tId });
            onSuccess();
        } catch (error: any) {
            toast.error(error.message, { id: tId });
        } finally {
            setLoading(false);
        }
    };

    const cleanName = data.name?.includes('|') ? data.name.split('|').pop()?.trim() : (data.nama_panggilan || data.name || userData?.name);

    // Parse list rincian bonus / potongan dari data jika ada
    const parseRincian = () => {
        let items: { label: string; amount: number; type: 'bonus' | 'potongan' }[] = [];
        const rawRincian = data.rincian || data.details || data.breakdown;
        
        if (Array.isArray(rawRincian)) {
            items = rawRincian;
        } else if (typeof rawRincian === 'string') {
            try {
                items = JSON.parse(rawRincian);
            } catch (e) {
                // fallback jika berupa string biasa
            }
        }

        // Jika tidak ada array rincian, kita generate otomatis dari field data yang ada
        if (items.length === 0) {
            if (data.bonus_absen_bolong || data.bonus_absen) {
                items.push({ label: "Bonus Absen Bolong", amount: Number(data.bonus_absen_bolong || data.bonus_absen), type: 'bonus' });
            }
            if (data.bonus_rajin) {
                items.push({ label: "Bonus Absen Rajin", amount: Number(data.bonus_rajin), type: 'bonus' });
            }
            if (isKadiv || data.bonus_kadiv) {
                items.push({ label: "Bonus Kadiv", amount: Number(data.bonus_kadiv || 70000), type: 'bonus' });
            }
            if (isWakadiv || data.bonus_wakadiv) {
                items.push({ label: "Bonus Wakadiv", amount: Number(data.bonus_wakadiv || 60000), type: 'bonus' });
            }
            if (data.potongan_alpha || data.denda) {
                items.push({ label: "Potongan Alpha / Denda", amount: Number(data.potongan_alpha || data.denda), type: 'potongan' });
            }
        }
        return items;
    };

    const rincianList = parseRincian();
    const gajiPokok = Number(data.gaji_pokok || data.base_salary || 232000);

    return (
        <div className="space-y-6 text-slate-950 font-mono relative">
            <div ref={slipRef} className="bg-[#f8fafc] border-[5px] border-slate-950 rounded-[35px] p-8 md:p-12 relative overflow-hidden">
                {/* Background watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -rotate-12">
                    <ShieldCheck size={400} />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start border-b-[5px] border-slate-950 pb-8 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-950 p-3 rounded-2xl">
                                <ShieldCheck className="text-[#00E676]" size={40} />
                            </div>
                            <div>
                                <h2 className="font-[1000] text-3xl italic leading-none tracking-tighter uppercase">MANDALIKA POLICE</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Finance Unit Official Document</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-[#00E676] text-black border-2 border-black px-4 py-1.5 rounded-xl text-[10px] font-black italic uppercase mb-2 tracking-widest inline-block shadow-[2px_2px_0px_#000]">
                                Verified Slip
                            </div>
                            <p className="text-[10px] font-black opacity-40 italic uppercase">ID: {data.id?.slice(0, 13)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[9px] font-black uppercase opacity-40 block mb-1 tracking-[0.2em]">Personnel Name</label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-black text-xl italic border-l-4 border-slate-950 pl-3 uppercase">{cleanName}</p>
                                    {isKadiv && (
                                        <span className="bg-purple-600 text-white border-2 border-black text-[10px] font-black px-2 py-0.5 rounded-lg italic shadow-[2px_2px_0px_#000] flex items-center gap-1">
                                            <Award size={10} /> KADIV
                                        </span>
                                    )}
                                    {isWakadiv && (
                                        <span className="bg-amber-500 text-black border-2 border-black text-[10px] font-black px-2 py-0.5 rounded-lg italic shadow-[2px_2px_0px_#000] flex items-center gap-1">
                                            <Award size={10} /> WAKADIV
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase opacity-40 block mb-1 tracking-[0.2em]">Rank & Position</label>
                                <p className="font-black text-sm italic uppercase pl-4">{data.pangkat || userData?.pangkat || 'UNKNOWN'} • {data.divisi || userData?.divisi || 'UNIT'}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[9px] font-black uppercase opacity-40 block mb-1 tracking-[0.2em]">Performance Stats</label>
                                <div className="font-black text-sm italic border-l-4 border-blue-500 pl-3 uppercase flex flex-col gap-1">
                                    <span>Duty Time: {data.total_jam_duty || data.jam_duty || 0} Hours</span>
                                    <span>PRP Gained: {data.point_prp || data.prp || 0} Points</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase opacity-40 block mb-1 tracking-[0.2em]">Processing Date</label>
                                <p className="font-black text-sm italic pl-4 opacity-70 uppercase">{format(new Date(), 'dd MMM yyyy')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Gaji, Bonus, & Potongan */}
                    <div className="bg-white border-4 border-slate-950 rounded-2xl p-6 mb-8 space-y-3">
                        <div className="flex justify-between items-center text-sm font-black border-b-2 border-slate-200 pb-2">
                            <span className="uppercase opacity-70">Gaji Pokok (Base Salary)</span>
                            <span>${gajiPokok.toLocaleString()}</span>
                        </div>
                        {rincianList.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm font-black">
                                <span className={`flex items-center gap-1.5 uppercase ${item.type === 'bonus' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {item.type === 'bonus' ? <PlusCircle size={14} /> : <MinusCircle size={14} />}
                                    {item.label}
                                </span>
                                <span className={item.type === 'bonus' ? 'text-emerald-600' : 'text-rose-600'}>
                                    {item.type === 'bonus' ? '+' : '-'}${Math.abs(item.amount).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-950 rounded-3xl p-8 mb-10 shadow-[6px_6px_0px_#CBD5E1]">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-[#00E676] font-black italic text-lg uppercase tracking-widest leading-none">Total Net Payout</p>
                            <DollarSign className="text-[#00E676]" size={24} />
                        </div>
                        <div className="flex items-baseline gap-2 leading-none">
                            <span className="text-[#00E676] text-2xl font-black italic">$</span>
                            <h1 className="text-[#00E676] text-5xl md:text-6xl font-[1000] italic tracking-tighter">
                                {Number(data.total_gaji || data.jumlah_gaji || 0).toLocaleString()}
                            </h1>
                        </div>
                    </div>

                    <div className="flex justify-between items-end italic border-t-4 border-slate-950 pt-6">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Authorized By High Command:</p>
                            <div className="flex flex-col">
                                <p className="font-[1000] text-sm md:text-base uppercase tracking-tighter border-b-2 border-slate-950 pb-1">
                                    {adminSession?.pangkat || 'HIGH COMMAND'} {adminSession?.name}
                                </p>
                                <p className="text-[9px] font-bold uppercase opacity-60 mt-1 italic leading-none">
                                    Head of {adminSession?.divisi || 'FINANCE'} Division
                                </p>
                            </div>
                        </div>
                        {/* Fake Stamp */}
                        <div className="w-24 h-24 border-4 border-[#00E676] text-[#00E676] rounded-full flex flex-col items-center justify-center rotate-12 opacity-80">
                            <span className="font-black text-[10px] uppercase">APPROVED</span>
                            <span className="font-black text-lg">PAID</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <button
                    onClick={onClose}
                    className={`flex-1 bg-white ${boxBorder} py-4 rounded-2xl font-black uppercase italic ${hardShadow} active:translate-y-1 transition-all`}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSendSlip}
                    disabled={loading}
                    className={`flex-[2] bg-[#00E676] text-slate-950 border-[3.5px] border-slate-950 py-4 rounded-2xl font-[1000] uppercase italic ${hardShadow} active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                    {loading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Activity size={20} /></motion.div>
                    ) : (
                        <Send size={20} />
                    )}
                    {loading ? 'Processing...' : 'Verify & Send Slip'}
                </button>
            </div>
        </div>
    );
}