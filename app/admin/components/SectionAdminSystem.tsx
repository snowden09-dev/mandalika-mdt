"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays, Trash2, ChevronLeft, ChevronRight,
    Image as ImageIcon, Clock, AlertTriangle, CheckCircle2, X,
    Skull, Bomb, AlertOctagon, Lock, UserX, Send, ShieldAlert, XCircle
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from 'sonner';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const boxBorder = "border-[3.5px] border-slate-950";
const hardShadow = "shadow-[6px_6px_0px_#000]";

export default function SectionAdminSystem() {
    const [loading, setLoading] = useState(true);
    const [personnel, setPersonnel] = useState<any[]>([]);
    const [duties, setDuties] = useState<any[]>([]);
    const [cutis, setCutis] = useState<any[]>([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date());
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [showWarningModal, setShowWarningModal] = useState<any>(null);
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, type: 'SINGLE' | 'PURGE', data?: any }>({ show: false, type: 'SINGLE' });
    const [purgeInput, setPurgeInput] = useState("");

    const fetchData = async () => {
        setLoading(true);
        const { data: users } = await supabase.from('users').select('discord_id, name, pangkat').order('pangkat', { ascending: false });
        if (users) setPersonnel(users);

        const startStr = weekStart.toISOString();
        const endStr = weekEnd.toISOString();

        const { data: dutyData } = await supabase.from('presensi_duty').select('*').gte('start_time', startStr).lte('start_time', endStr);
        if (dutyData) setDuties(dutyData);

        const { data: cutiData } = await supabase.from('pengajuan_cuti').select('*').eq('status', 'APPROVED');
        if (cutiData) setCutis(cutiData);

        setLoading(false);
    };

    // --- ANALISIS INACTIVITY ---
    const inactivePersonnel = useMemo(() => {
        return personnel.filter(p => {
            const hasDuty = duties.some(d => d.user_id_discord === p.discord_id);
            const hasCuti = cutis.some(c => {
                if (c.user_id_discord !== p.discord_id) return false;
                const start = startOfDay(new Date(c.tanggal_mulai));
                const end = startOfDay(new Date(c.tanggal_selesai));
                return (start <= weekEnd && end >= weekStart);
            });
            return !hasDuty && !hasCuti;
        });
    }, [personnel, duties, cutis, weekStart, weekEnd]);

    useEffect(() => {
        const checkAdmin = async () => {
            const sessionData = localStorage.getItem('police_session');
            if (!sessionData) return;
            const parsed = JSON.parse(sessionData);
            const { data } = await supabase.from('users').select('pangkat, is_highadmin').eq('discord_id', parsed.discord_id).single();
            if (data && (data.pangkat === 'JENDRAL' || data.is_highadmin === true)) setIsSuperAdmin(true);
        };
        checkAdmin();
        fetchData();
    }, [currentDate]);

    const executeDelete = async () => {
        const tId = toast.loading("Menginisiasi penghancuran data...");
        try {
            if (confirmModal.type === 'SINGLE') {
                const { id, table } = confirmModal.data;
                await supabase.from(table).delete().eq('id', id);
                toast.success("DATA DIMUSNAHKAN!", { id: tId, icon: <Skull /> });
            }
            else if (confirmModal.type === 'PURGE') {
                if (purgeInput !== "MUSNAHKAN") throw new Error("Kode verifikasi salah!");

                const pastLimit = subWeeks(new Date(), 2).toISOString();

                // 1. Hapus File di Bucket Dulu
                const { data: oldFiles } = await supabase.from('presensi_duty').select('bukti_foto').lt('created_at', pastLimit);
                if (oldFiles && oldFiles.length > 0) {
                    const paths = oldFiles.flatMap(f => f.bukti_foto || []).map(url => url.split('bukti-absen/').pop()).filter(Boolean);
                    if (paths.length > 0) await supabase.storage.from('bukti-absen').remove(paths);
                }

                // 2. Delay Akurasi
                await new Promise(resolve => setTimeout(resolve, 1500));

                // 3. Hapus Database
                await supabase.from('presensi_duty').delete().lt('created_at', pastLimit);
                await supabase.from('pengajuan_cuti').delete().lt('created_at', pastLimit);

                toast.success("SYSTEM PURGE COMPLETE!", { id: tId, icon: <Bomb /> });
            }
            setConfirmModal({ show: false, type: 'SINGLE' });
            setPurgeInput("");
            fetchData();
        } catch (err: any) {
            toast.error(err.message, { id: tId });
        }
    };

    const handleSendWarning = (user: any) => {
        const tId = toast.loading(`Mengirim SP-1 ke Discord...`);
        setTimeout(() => {
            toast.success(`SURAT PERINGATAN TERKIRIM!`, { id: tId, icon: <Send /> });
        }, 1500);
    };

    const getDayStatus = (discordId: string, date: Date) => {
        const targetDate = format(date, 'yyyy-MM-dd');
        const dutyToday = duties.find(d => d.user_id_discord === discordId && d.start_time.startsWith(targetDate));
        if (dutyToday) return { type: 'DUTY', data: dutyToday };

        const cutiToday = cutis.find(c => {
            if (c.user_id_discord !== discordId) return false;
            const start = startOfDay(new Date(c.tanggal_mulai));
            const end = startOfDay(new Date(c.tanggal_selesai));
            const current = startOfDay(date);
            return current >= start && current <= end;
        });
        if (cutiToday) return { type: 'CUTI', data: cutiToday };

        return { type: 'NONE', data: null };
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 font-mono text-slate-950">

            {/* --- INACTIVITY ANALYSIS BENTO --- */}
            <div className={`bg-white ${boxBorder} ${hardShadow} p-6 rounded-[30px] grid grid-cols-1 lg:grid-cols-3 gap-6`}>
                <div className="lg:col-span-1 bg-[#FF4D4D] text-white p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000]">
                    <div className="flex items-center gap-3 mb-2"><UserX size={32} /><h3 className="font-black italic text-xl uppercase">Inactivity Scan</h3></div>
                    <p className="text-[10px] font-bold opacity-80 uppercase">Anggota Tanpa Log Duty/Cuti Minggu Ini</p>
                    <div className="text-5xl font-[1000] italic mt-2">{inactivePersonnel.length}</div>
                </div>
                <div className="lg:col-span-2 overflow-x-auto flex gap-4 p-2 items-center">
                    {inactivePersonnel.length === 0 ? (
                        <div className="flex items-center gap-3 text-slate-400 font-black italic uppercase text-sm"><CheckCircle2 /> Semua Personel Aktif</div>
                    ) : inactivePersonnel.map(p => (
                        <div key={p.discord_id} className="min-w-[200px] bg-slate-50 border-2 border-black p-3 rounded-xl flex flex-col justify-between h-full">
                            <div>
                                <p className="font-black text-[11px] uppercase truncate">{p.name?.split('|').pop()}</p>
                                <p className="text-[9px] font-bold text-red-500 uppercase">{p.pangkat}</p>
                            </div>
                            <button onClick={() => setShowWarningModal(p)} className="mt-3 bg-black text-white py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-[#FF4D4D] transition-colors"><Send size={12} /> Kirim SP-1</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* HEADER */}
            <div className="bg-white border-[4px] border-slate-950 shadow-[6px_6px_0px_#000] p-6 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-950 text-white rounded-xl"><CalendarDays /></div>
                    <div><h2 className="font-black italic uppercase text-2xl tracking-tighter">Personnel Monitoring</h2><p className="text-[10px] font-black uppercase opacity-40 italic">Mandalika Security Protocol v2.4</p></div>
                </div>
                {isSuperAdmin && (
                    <button onClick={() => setConfirmModal({ show: true, type: 'PURGE' })} className="bg-[#FF4D4D] text-white border-[3px] border-slate-950 px-5 py-3 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0px_#000] active:translate-y-1 transition-all flex items-center gap-2 hover:bg-black"><Bomb size={16} /> PURGE SYSTEM</button>
                )}
            </div>

            {/* NAVIGATION WEEK */}
            <div className="flex justify-center items-center gap-4">
                <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-3 bg-white border-[3px] border-slate-950 shadow-[4px_4px_0px_#000] rounded-xl active:translate-y-1 transition-all"><ChevronLeft /></button>
                <div className="bg-slate-950 text-[#00E676] px-8 py-3 rounded-xl font-black italic uppercase border-2 border-white shadow-[4px_4px_0px_#000] min-w-[300px] text-center tracking-tighter">{format(weekStart, 'dd MMMM', { locale: id })} - {format(weekEnd, 'dd MMMM yyyy', { locale: id })}</div>
                <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-3 bg-white border-[3px] border-slate-950 shadow-[4px_4px_0px_#000] rounded-xl active:translate-y-1 transition-all"><ChevronRight /></button>
            </div>

            {/* MAIN CALENDAR TABLE */}
            {loading ? (
                <div className="text-center py-20 font-[1000] italic uppercase animate-pulse">Synchronizing Radar...</div>
            ) : (
                <div className="bg-white border-[4px] border-black rounded-[30px] shadow-[10px_10px_0px_#000] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-950 text-white">
                                    <th className="p-4 border-r-2 border-white/20 font-black uppercase italic text-xs sticky left-0 bg-slate-950 z-10 w-[200px]">Personel</th>
                                    {daysInWeek.map((day, idx) => (
                                        <th key={idx} className="p-4 text-center border-r-2 border-white/20 font-black uppercase italic text-[10px]">{format(day, 'EEEE', { locale: id })}<br /><span className="text-[#00E676]">{format(day, 'dd/MM')}</span></th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {personnel.map((p) => (
                                    <tr key={p.discord_id} className="border-b-2 border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 border-r-2 border-slate-100 font-black sticky left-0 bg-white z-10"><p className="text-xs uppercase leading-none">{p.name?.split('|').pop()}</p><p className="text-[9px] text-[#3B82F6] font-bold mt-1 uppercase">{p.pangkat}</p></td>
                                        {daysInWeek.map((day, idx) => {
                                            const status = getDayStatus(p.discord_id, day);
                                            return (
                                                <td key={idx} className="p-2 border-r-2 border-slate-100 min-w-[160px]">
                                                    {status.type === 'DUTY' && (
                                                        <div className="bg-[#A3E635] border-2 border-black p-2 rounded-xl shadow-[3px_3px_0px_#000] flex flex-col h-[110px] justify-between relative group">
                                                            <button onClick={() => setConfirmModal({ show: true, type: 'SINGLE', data: { id: status.data.id, table: 'presensi_duty' } })} className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                                                            <div className="font-black text-[9px] uppercase italic border-b border-black/10 pb-1 flex justify-between"><span>{Math.floor(status.data.durasi_menit / 60)}H {status.data.durasi_menit % 60}M</span><Clock size={10} /></div>
                                                            <p className="text-[10px] font-black leading-tight uppercase italic line-clamp-3 my-1 overflow-hidden">{status.data.catatan_duty}</p>
                                                            {status.data.bukti_foto?.[0] && <button onClick={() => setSelectedPhoto(status.data.bukti_foto[0])} className="bg-black text-white rounded-lg py-1 flex justify-center hover:bg-[#3B82F6] transition-colors"><ImageIcon size={10} /></button>}
                                                        </div>
                                                    )}
                                                    {status.type === 'CUTI' && (
                                                        <div className="bg-[#FFD100] border-2 border-black p-2 rounded-xl shadow-[3px_3px_0px_#000] flex flex-col h-[110px] justify-center items-center text-center">
                                                            <ShieldAlert size={16} className="mb-1" />
                                                            <p className="text-[10px] font-black uppercase italic">OFF DUTY</p>
                                                            <p className="text-[8px] font-bold opacity-60 uppercase">{status.data.alasan.slice(0, 15)}...</p>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- MODAL PREVIEW SP-1 --- */}
            <AnimatePresence>
                {showWarningModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8, opacity: 0 }} className={`w-full max-w-lg bg-[#F1F5F9] ${boxBorder} ${hardShadow} rounded-[40px] overflow-hidden`}>
                            <div className="bg-slate-950 p-6 text-white border-b-4 border-black flex items-center gap-4">
                                <div className="bg-[#FF4D4D] p-3 rounded-2xl border-2 border-white"><AlertOctagon size={32} /></div>
                                <div><h2 className="font-[1000] text-2xl italic uppercase leading-none tracking-tighter">OFFICIAL WARNING</h2><p className="text-[10px] font-black uppercase text-[#FF4D4D] tracking-[0.3em] mt-1 italic">Status: Inactivity Detected</p></div>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="border-l-4 border-black pl-4 py-2 bg-white/50">
                                    <p className="text-[10px] font-black uppercase opacity-40 italic">Personnel Target:</p>
                                    <p className="font-[1000] text-xl uppercase italic">{showWarningModal.pangkat} {showWarningModal.name?.split('|').pop()?.trim()}</p>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[11px] font-black uppercase italic leading-relaxed flex gap-2"><XCircle size={14} className="text-red-500 shrink-0" /> Terdeteksi nihil aktivitas (Duty/Cuti) pada database minggu ini.</p>
                                    <p className="text-[11px] font-black uppercase italic leading-relaxed flex gap-2"><XCircle size={14} className="text-red-500 shrink-0" /> Pelanggaran Kode Kedisiplinan Pasal 4 MDT Mandalika.</p>
                                </div>
                                <div className="bg-[#FFD100] border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_#000] font-black text-[10px] text-center uppercase italic leading-tight">"Segera lakukan koordinasi dengan High Command atau lakukan Duty dalam 1x24 jam."</div>
                                <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-end italic">
                                    <div className="opacity-60"><p className="text-[9px] font-black uppercase">Authorized By:</p><p className="text-[11px] font-[1000] uppercase border-b-2 border-black pb-0.5 inline-block">BRIGJEN OWEN DININGRAT</p></div>
                                    <p className="text-[8px] font-black opacity-30 italic">{format(new Date(), 'dd/MM/yyyy HH:mm')} WIB</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white border-t-4 border-black grid grid-cols-2 gap-4">
                                <button onClick={() => setShowWarningModal(null)} className="py-4 bg-slate-200 border-[3px] border-black rounded-2xl font-black uppercase text-xs shadow-[4px_4px_0px_#000] active:translate-y-1 transition-all">Batal</button>
                                <button onClick={() => { handleSendWarning(showWarningModal); setShowWarningModal(null); }} className="py-4 bg-[#FF4D4D] text-white border-[3px] border-black rounded-2xl font-black uppercase text-xs shadow-[4px_4px_0px_#000] active:translate-y-1 transition-all flex items-center justify-center gap-2"><Send size={18} /> TEMBAK DISCORD!</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL PURGE */}
            <AnimatePresence>
                {confirmModal.show && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`w-full max-w-sm bg-white ${boxBorder} ${hardShadow} rounded-[30px] overflow-hidden`}>
                            <div className="bg-[#FF4D4D] p-4 border-b-[3.5px] border-slate-950 text-white flex items-center gap-3"><AlertOctagon size={24} /><h3 className="font-black italic uppercase tracking-widest italic">Sistem Purge</h3></div>
                            <div className="p-6 space-y-4 text-slate-950">
                                <p className="text-xs font-black uppercase italic leading-relaxed">{confirmModal.type === 'PURGE' ? "Seluruh data laporan & FOTO (Storage) yang berusia > 14 hari akan dihancurkan." : "Hapus data rekaman terpilih dari database?"}</p>
                                {confirmModal.type === 'PURGE' && <input type="text" value={purgeInput} onChange={(e) => setPurgeInput(e.target.value.toUpperCase())} placeholder="KETIK 'MUSNAHKAN'" className="w-full bg-slate-100 border-2 border-black p-3 rounded-xl font-black text-center outline-none" />}
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setConfirmModal({ show: false, type: 'SINGLE' })} className="py-3 bg-slate-200 border-2 border-black rounded-xl font-black uppercase text-[10px]">Batal</button>
                                    <button onClick={executeDelete} className="py-3 bg-[#FF4D4D] text-white border-2 border-black rounded-xl font-black uppercase text-[10px] shadow-[3px_3px_0px_#000] active:translate-y-px">Eksekusi</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* IMAGE PREVIEW */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`bg-white p-2 ${boxBorder} rounded-2xl max-w-3xl w-full`} onClick={e => e.stopPropagation()}>
                            <img src={selectedPhoto} className="w-full rounded-xl border-2 border-black" alt="Evidence" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}