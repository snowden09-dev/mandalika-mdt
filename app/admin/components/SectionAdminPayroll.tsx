"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import QRCode from "react-qr-code";
import {
    Trash2, Eye, X, AlertOctagon, Database, Loader2, Send, FileSpreadsheet, PlusCircle, ChevronLeft, ChevronRight, Filter, Gift, Info, ChevronDown, ChevronUp, Shield, Check, Clock, Award, MinusCircle
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval, eachDayOfInterval } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast, Toaster } from 'sonner';

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' ');

// 🚀 DAFTAR PANGKAT PETINGGI YANG KEBAL POTONGAN
const PETINGGI_RANKS = ['JENDRAL', 'WAKAPOLRI', 'KAPOLRI', 'KOMJEN', 'IRJEN', 'BRIGJEN', 'KOMBES', 'AKBP'];

// 📋 DATA ATURAN BONUS GAJI & ROLE ID
const BONUS_RULES = {
    divisiMingguan: [
        { label: "ALL ANGGOTA DIVISI (ABSEN BOLONG)", shortLabel: "Bonus Absen Bolong", value: "$35.000", amount: 35000 },
        { label: "ALL ANGGOTA DIVISI (ABSEN RAJIN)", shortLabel: "Bonus Absen Rajin", value: "$50.000", amount: 50000 },
        { label: "ALL KADIV", shortLabel: "Bonus Kadiv", value: "$70.000", amount: 70000 },
        { label: "ALL WAKADIV", shortLabel: "Bonus Wakadiv", value: "$60.000", amount: 60000 },
    ],
    administrasi: [
        { label: "1 JAM ADMINISTRASI", value: "$30.000", amount: 30000 },
        { label: "SYARAT ADMINISTRASI", value: "WAJIB ABSEN & DIBERIKAN OLEH SETUM", highlight: true },
        { label: "100 JAM DUTY", value: "2x LIPAT GAJI POKOK", highlight: true },
    ],
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

// Type Definitions
interface PayrollRequest {
    id: string;
    user_id_discord: string;
    nama_panggilan: string;
    pangkat: string;
    divisi: string;
    status: 'PENDING' | 'PAID' | 'REJECTED' | 'NOT_SENT';
    tanggal_mulai: string;
    tanggal_selesai: string;
    jumlah_gaji: number;
    bukti_transfer?: string;
    keterangan_admin?: string;
    created_at: string;
    updated_at: string;
}

interface Duty {
    user_id_discord: string;
    start_time: string;
    end_time?: string;
    durasi_menit?: number;
    status?: string;
}

interface UserRecord {
    discord_id: string;
    name?: string;
    roles?: string[] | string;
    jabatan?: string;
    pangkat?: string;
    divisi?: string;
    total_jam_duty?: string | number;
    is_kadiv?: boolean;
    is_wakadiv?: boolean;
}

interface Cuti {
    user_id_discord: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: string;
}

interface Laporan {
    user_id_discord: string;
    created_at: string;
}

interface AdminSession {
    name: string;
    pangkat: string;
    divisi: string;
}

interface Adjustment {
    amount: number;
    reason: string;
}

type SlipData = PayrollRequest & {
    cleanName: string;
    badgeNumber: string;
    hadir: number;
    cuti: number;
    alpha: number;
    total_hari: number;
    totalDutyHours: number;
    is100HoursDuty: boolean;
    isKadiv: boolean;
    isWakadiv: boolean;
    bonusJabatan: number;
    bonusJabatanLabel: string;
    bonusAbsensi: number;
    bonusAbsensiLabel: string;
    tilangCount: number;
    isTargetMet: boolean;
    isPetinggi: boolean;
    baseGaji: number;
    potonganAlpha: number;
    potonganCuti: number;
    totalPotongan: number;
    adjustment: Adjustment;
    finalGaji: number;
};

// 🛠️ HELPER PARSING TANGGAL WIB (UTC+7) AGAR TEPAT TANPA SHIFT DAY / OFF-BY-ONE
const getWIBDateStr = (dateInput: string | Date) => {
    if (!dateInput) return '';
    try {
        const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(d.getTime())) return '';
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
    } catch {
        return '';
    }
};

const parseDateOnly = (str: string) => {
    if (!str) return new Date();
    const datePart = str.split('T')[0];
    const [y, m, d] = datePart.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
};

export default function SectionAdminPayroll() {
    const slipRef = useRef<HTMLDivElement>(null);
    const [requests, setRequests] = useState<PayrollRequest[]>([]);
    const [duties, setDuties] = useState<Duty[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [cutis, setCutis] = useState<Cuti[]>([]);
    const [laporans, setLaporans] = useState<Laporan[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'PAID' | 'REJECTED' | 'NOT_SENT' | 'REKAP'>('PENDING');
    const [adminSession, setAdminSession] = useState<AdminSession | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');

    const [manualAdjustments, setManualAdjustments] = useState<Record<string, Adjustment>>({});
    const [selectedPresetBonuses, setSelectedPresetBonuses] = useState<Record<string, string[]>>({});
    const [adjInputs, setAdjInputs] = useState<Record<string, { amount: string, reason: string }>>({});

    const [currentSlipData, setCurrentSlipData] = useState<SlipData | null>(null);
    const [capturedImg, setCapturedImg] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isTransmitting, setIsTransmitting] = useState(false);

    const [deleteModal, setDeleteModal] = useState<{ show: boolean, type: 'SINGLE' | 'ALL', id?: string }>({ show: false, type: 'ALL' });
    const [confirmInput, setConfirmInput] = useState("");

    const [showRules, setShowRules] = useState(false);

    // ✅ FUNGSI HANDLE MULTIPLE BONUS / ADJUSTMENT
    const handleAddAdjustment = (reqId: string, amount: number, reason: string) => {
        setManualAdjustments(prev => {
            const existing = prev[reqId] || { amount: 0, reason: '' };
            const newAmount = existing.amount + amount;
            
            let newReason = reason;
            if (existing.reason && existing.reason.trim() !== '') {
                newReason = `${existing.reason} + ${reason}`;
            }

            return {
                ...prev,
                [reqId]: { amount: newAmount, reason: newReason }
            };
        });
    };

    // ✅ FUNGSI TAMBAH PRESET BONUS (DENGAN PENCEGAHAN DUPLIKASI 1x)
    const handleAddPresetBonus = (reqId: string, bLabel: string, amount: number) => {
        const currentSelected = selectedPresetBonuses[reqId] || [];
        if (currentSelected.includes(bLabel)) {
            toast.error("Bonus ini sudah ditambahkan sebelumnya!");
            return;
        }

        handleAddAdjustment(reqId, amount, bLabel);
        setSelectedPresetBonuses(prev => ({
            ...prev,
            [reqId]: [...(prev[reqId] || []), bLabel]
        }));
        toast.success(`${bLabel} berhasil ditambahkan!`);
    };

    // ✅ FUNGSI TAMBAH ADJUSTMENT CUSTOM (BONUS ATAU DENDA/POTONGAN)
    const handleAddCustomAdj = (reqId: string, isDenda: boolean) => {
        const rawAmt = Number(adjInputs[reqId]?.amount || 0);
        if (!rawAmt || rawAmt === 0) {
            toast.error("Masukkan nominal angka terlebih dahulu!");
            return;
        }

        const finalAmt = isDenda ? -Math.abs(rawAmt) : Math.abs(rawAmt);
        const defaultReason = isDenda ? 'Denda/Potongan' : 'Bonus Manual';
        const rsn = adjInputs[reqId]?.reason?.trim() || defaultReason;

        handleAddAdjustment(reqId, finalAmt, rsn);
        setAdjInputs(prev => ({ ...prev, [reqId]: { amount: '', reason: '' } }));
        toast.success(`${isDenda ? 'Denda' : 'Bonus'} sebesar $${Math.abs(finalAmt).toLocaleString()} berhasil diterapkan!`);
    };

    // ✅ RESET ADJUSTMENT & STATUS TOMBOL BONUS
    const handleResetAdjustment = (reqId: string) => {
        setManualAdjustments(prev => ({ ...prev, [reqId]: { amount: 0, reason: '' } }));
        setSelectedPresetBonuses(prev => ({ ...prev, [reqId]: [] }));
        toast.info("Penyesuaian bonus & denda telah direset.");
    };

    const fetchData = async () => {
        setLoading(true);
        const { data: reqData } = await supabase.from('pengajuan_gaji').select('*').order('created_at', { ascending: false });
        if (reqData) setRequests(reqData);

        const { data: dutyData } = await supabase.from('presensi_duty').select('user_id_discord, start_time, end_time, durasi_menit, status');
        if (dutyData) setDuties(dutyData);

        // ✅ Diperbarui: Mengambil is_kadiv dan is_wakav dari tabel users
        const { data: userData } = await supabase.from('users').select('discord_id, name, roles, jabatan, pangkat, divisi, total_jam_duty, is_kadiv, is_wakadiv');
        if (userData) setUsers(userData);

        const { data: cutiData } = await supabase.from('pengajuan_cuti').select('user_id_discord, tanggal_mulai, tanggal_selesai, status');
        if (cutiData) setCutis(cutiData);

        const { data: lapData } = await supabase.from('laporan_aktivitas').select('user_id_discord, created_at').eq('jenis_laporan', 'Penilangan').eq('status', 'APPROVED');
        if (lapData) setLaporans(lapData);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const sessionData = localStorage.getItem('police_session');
        if (sessionData) {
            const parsed = JSON.parse(sessionData);
            supabase.from('users').select('name, pangkat, divisi').eq('discord_id', parsed.discord_id).single()
                .then(({ data }) => { if (data) setAdminSession(data); });
        }
    }, []);

    useEffect(() => { setCurrentPage(1); }, [activeTab, selectedPeriod]);

    const getGajiByRank = (pangkat: string) => {
        const p = pangkat?.toUpperCase().trim() || "";
        switch (p) {
            case "JENDRAL": return 190000;
            case "WAKAPOLRI": return 185000;
            case "KAPOLRI": return 190000;
            case "KOMJEN": return 180000;
            case "IRJEN": return 278000;
            case "BRIGJEN": return 261000;
            case "KOMBESPOL":
            case "KOMBES": return 244000;
            case "AKBP": return 227000;
            case "KOMPOL": return 217000;
            case "AKP": return 207000;
            case "IPTU": return 197000;
            case "IPDA": return 187000;
            case "AIPTU": return 177000;
            case "AIPDA": return 167000;
            case "BRIPKA": return 141000;
            case "BRIGPOL": return 134000;
            case "BRIPTU": return 127000;
            case "BRIPDA": return 120000;
            case "BHARATU": return 105000;
            case "BHARADA": return 120000;
            default: return 110000;
        }
    };

    const availablePeriods = useMemo(() => {
        const periods = new Set<string>();
        requests.filter(r => r.status === 'PAID' && r.tanggal_mulai && r.tanggal_selesai).forEach(r => {
            const s = getWIBDateStr(r.tanggal_mulai);
            const e = getWIBDateStr(r.tanggal_selesai);
            if (s && e) periods.add(`${s}|${e}`);
        });
        return Array.from(periods).sort().reverse();
    }, [requests]);

    const augmentedRequests = useMemo(() => {
        const kadivIds = BONUS_RULES.kadivRoles.map(r => r.id);
        const wakadivIds = BONUS_RULES.wakadivRoles.map(r => r.id);

        return requests.map(req => {
            const start = parseDateOnly(req.tanggal_mulai);
            const end = parseDateOnly(req.tanggal_selesai);
            const daysInPeriod = eachDayOfInterval({ start, end });
            const discordId = req.user_id_discord;

            // 1. MATCH DATA USER
            const userObj = users.find(u => u.discord_id === discordId);
            let userRolesArr: string[] = [];
            if (userObj?.roles) {
                if (Array.isArray(userObj.roles)) userRolesArr = userObj.roles;
                else if (typeof userObj.roles === 'string') {
                    try { userRolesArr = JSON.parse(userObj.roles); } catch { userRolesArr = [userObj.roles]; }
                }
            }

            // 2. AUTO DETECT KADIV / WAKADIV DARI TABEL USERS & ROLE ID
            const isKadivRole = kadivIds.some(id => userRolesArr.includes(id));
            const isWakadivRole = wakadivIds.some(id => userRolesArr.includes(id));

            const isKadivText = (req.pangkat || "").toUpperCase().includes('KADIV') || (userObj?.jabatan || "").toUpperCase().includes('KADIV');
            const isWakadivText = (req.pangkat || "").toUpperCase().includes('WAKADIV') || (userObj?.jabatan || "").toUpperCase().includes('WAKADIV');

            // ✅ Menggabungkan pengecekan is_kadiv / is_wakadiv langsung dari database users
            const isKadiv = Boolean(userObj?.is_kadiv) || isKadivRole || isKadivText;
            const isWakadiv = !isKadiv && (Boolean(userObj?.is_wakadiv) || isWakadivRole || isWakadivText);

            let bonusJabatan = 0;
            let bonusJabatanLabel = '';
            if (isKadiv) {
                bonusJabatan = 70000;
                bonusJabatanLabel = 'Bonus Kadiv';
            } else if (isWakadiv) {
                bonusJabatan = 60000;
                bonusJabatanLabel = 'Bonus Wakadiv';
            }

            // 3. KALKULASI JAM DUTY PRESISI DARI presensi_duty
            const startStr = getWIBDateStr(start);
            const endStr = getWIBDateStr(end);

            const userDutiesInPeriod = duties.filter(d => {
                if (d.user_id_discord !== discordId) return false;
                const dDateStr = getWIBDateStr(d.start_time);
                return dDateStr >= startStr && dDateStr <= endStr;
            });

            const totalMenitInPeriod = userDutiesInPeriod.reduce((sum, d) => sum + (Number(d.durasi_menit) || 0), 0);
            const calculatedDutyHours = Math.round((totalMenitInPeriod / 60) * 10) / 10;
            const userObjDuty = parseFloat(String(userObj?.total_jam_duty || "0")) || 0;

            const totalDutyHours = calculatedDutyHours > 0 ? calculatedDutyHours : userObjDuty;
            const is100HoursDuty = totalDutyHours >= 100;

            // 4. PARSING NAMA DAN BADGE
            let rawName = req.nama_panggilan || "OFFICER";
            let badgeNumber = "-";

            if (rawName.includes('|')) {
                rawName = rawName.split('|').pop()?.trim() || rawName;
            }

            if (rawName.startsWith('#')) {
                const spaceIndex = rawName.indexOf(' ');
                if (spaceIndex !== -1) {
                    badgeNumber = rawName.substring(1, spaceIndex);
                    rawName = rawName.substring(spaceIndex + 1).trim();
                } else {
                    badgeNumber = rawName.substring(1);
                    rawName = "OFFICER";
                }
            }

            const cleanName = rawName.toUpperCase();

            // 5. KALKULASI HADIR, CUTI, ALFA
            let hadirCount = 0;
            let cutiCount = 0;

            daysInPeriod.forEach(day => {
                const targetStr = getWIBDateStr(day);
                const isHadir = duties.some(d =>
                    d.user_id_discord === discordId &&
                    getWIBDateStr(d.start_time) === targetStr
                );

                if (isHadir) {
                    hadirCount++;
                } else {
                    const isCuti = cutis.some(c => {
                        if (c.status !== 'APPROVED' || c.user_id_discord !== discordId) return false;
                        const cStartStr = getWIBDateStr(c.tanggal_mulai);
                        const cEndStr = getWIBDateStr(c.tanggal_selesai);
                        return targetStr >= cStartStr && targetStr <= cEndStr;
                    });
                    if (isCuti) cutiCount++;
                }
            });

            const alphaCount = Math.max(0, daysInPeriod.length - hadirCount - cutiCount);
            const tilangData = laporans.filter(l => l.user_id_discord === discordId && new Date(l.created_at) >= start && new Date(l.created_at) <= end);
            const isTargetMet = tilangData.length >= 15;
            const pangkatUser = (req.pangkat || "").toUpperCase();
            const isPetinggi = PETINGGI_RANKS.some(rank => pangkatUser.includes(rank));

            const isPAID = req.status === 'PAID' || req.status === 'REJECTED';

            const extractLegacy = (key: string) => {
                const match = (req.keterangan_admin || "").match(new RegExp(`${key}:\\s*(-?\\d+)`));
                return match ? parseInt(match[1], 10) : 0;
            };
            const extractReason = () => {
                const match = (req.keterangan_admin || "").match(/RSN:(.*?)( - BASE:|$)/);
                return match ? match[1].trim() : 'Penyesuaian Manual';
            };

            if (isPAID) {
                const legacyAdj = extractLegacy('ADJ') !== 0 ? extractLegacy('ADJ') : extractLegacy('BONS');
                return {
                    ...req, hadir: hadirCount, cuti: cutiCount, alpha: alphaCount,
                    total_hari: daysInPeriod.length, tilangCount: tilangData.length,
                    totalDutyHours, is100HoursDuty, isKadiv, isWakadiv, bonusJabatan, bonusJabatanLabel,
                    isTargetMet, isPetinggi, cleanName, badgeNumber,
                    baseGaji: extractLegacy('BASE') || req.jumlah_gaji,
                    potonganAlpha: extractLegacy('ALPH'),
                    potonganCuti: extractLegacy('CUTI'),
                    totalPotongan: extractLegacy('ALPH') + extractLegacy('CUTI'),
                    adjustment: { amount: legacyAdj, reason: extractReason() },
                    finalGaji: Number(req.jumlah_gaji),
                    bonusAbsensi: 0, 
                    bonusAbsensiLabel: ''
                };
            }

            const weeksCount = daysInPeriod.length >= 13 ? 2 : 1;
            let baseGajiPokok = getGajiByRank(req.pangkat) * weeksCount;

            if (is100HoursDuty) {
                baseGajiPokok *= 2;
            }

            const divisiUser = (req.divisi || "").toUpperCase();
            let earnedBonus = bonusJabatan;

            if (isTargetMet) {
                if (divisiUser.includes('SATLANTAS') || divisiUser.includes('SABHARA')) earnedBonus += 35000;
                else if (divisiUser.includes('BRIMOB') || divisiUser.includes('PROPAM')) earnedBonus += 50000;
            }

            // AUTO BONUS ABSENSI
            let bonusAbsensi = 0;
            let bonusAbsensiLabel = '';

            if (hadirCount === daysInPeriod.length && daysInPeriod.length > 0) {
                bonusAbsensi = 50000;
                bonusAbsensiLabel = 'Bonus Absen Rajin';
            } else if (hadirCount > 0) {
                bonusAbsensi = 35000;
                bonusAbsensiLabel = 'Bonus Absen Bolong';
            }

            const baseGajiSubmit = baseGajiPokok + earnedBonus + bonusAbsensi;

            const potonganAlpha = isPetinggi ? 0 : Math.round(alphaCount * (baseGajiPokok * 0.10));
            const potonganCuti = isPetinggi ? 0 : Math.round(cutiCount * (baseGajiPokok * 0.05));
            const totalPotongan = potonganAlpha + potonganCuti;

            const adjustment = manualAdjustments[req.id] || { amount: 0, reason: 'Penyesuaian Manual' };
            const finalGaji = baseGajiSubmit - totalPotongan + adjustment.amount;

            return {
                ...req, hadir: hadirCount, cuti: cutiCount, alpha: alphaCount,
                total_hari: daysInPeriod.length, tilangCount: tilangData.length,
                totalDutyHours, is100HoursDuty, isKadiv, isWakadiv, bonusJabatan, bonusJabatanLabel,
                bonusAbsensi, bonusAbsensiLabel,
                isTargetMet, isPetinggi, cleanName, badgeNumber,
                baseGaji: baseGajiSubmit,
                potonganAlpha, potonganCuti, totalPotongan, adjustment, finalGaji
            };
        });
    }, [requests, duties, users, cutis, laporans, manualAdjustments]);

    const filteredData = useMemo(() => {
        if (activeTab === 'NOT_SENT') return augmentedRequests.filter(r => r.status === 'PAID' && !r.bukti_transfer);
        if (activeTab === 'REKAP') {
            let data = augmentedRequests.filter(r => r.status === 'PAID');
            if (selectedPeriod !== 'ALL') {
                const [startTarget, endTarget] = selectedPeriod.split('|');
                data = data.filter(r =>
                    getWIBDateStr(r.tanggal_mulai) === startTarget &&
                    getWIBDateStr(r.tanggal_selesai) === endTarget
                );
            }
            return data;
        }
        if (activeTab === 'REJECTED') return augmentedRequests.filter(r => r.status === 'REJECTED');
        return augmentedRequests.filter(r => r.status === 'PENDING');
    }, [augmentedRequests, activeTab, selectedPeriod]);

    const paginatedData = useMemo(() => {
        return filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const financialStats = useMemo(() => {
        if (!requests || requests.length === 0) return { weeklyPaid: 0, totalPending: 0, forecast: 0 };
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });

        const weeklyPaid = requests.filter(r => r.status === 'PAID' && isWithinInterval(new Date(r.created_at), { start, end })).reduce((sum, r) => sum + Number(r.jumlah_gaji), 0);
        const totalPending = augmentedRequests.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.finalGaji, 0);

        const latestSalaries = new Map<string, number>();
        requests.forEach(req => { if (req.user_id_discord && req.status === 'PAID' && !latestSalaries.has(req.user_id_discord)) latestSalaries.set(req.user_id_discord, Number(req.jumlah_gaji)); });
        let forecast = 0; latestSalaries.forEach((gaji) => { forecast += gaji; });

        return { weeklyPaid, totalPending, forecast };
    }, [requests, augmentedRequests]);

    const handleOpenAndCapture = async (req: SlipData) => {
        setCurrentSlipData(req);
        setIsGenerating(true);
        setCapturedImg(null);

        const tId = toast.loading("Mencetak Dokumen Payslip...");
        setTimeout(async () => {
            if (!slipRef.current) {
                toast.error("Gagal inisialisasi mesin cetak.", { id: tId });
                setIsGenerating(false); return;
            }
            try {
                const dataUrl = await toPng(slipRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: '#09090b' });
                setCapturedImg(dataUrl);
                toast.success("Payslip Berhasil Dicetak!", { id: tId });
            } catch {
                toast.error("Sistem gagal mengambil foto slip.", { id: tId });
                setCurrentSlipData(null);
            }
            setIsGenerating(false);
        }, 800);
    };

    const handleTransmit = async () => {
        if (!capturedImg || !currentSlipData) return;
        setIsTransmitting(true);
        const tId = toast.loading("Menghubungkan ke HQ Discord...");

        try {
            const { data: configData } = await supabase.from('admin_config').select('key, value').in('key', ['webhook_payroll', 'thread_payroll']);
            const WEBHOOK_URL = configData?.find(c => c.key === 'webhook_payroll')?.value || "https://discord.com/api/webhooks/1486137739022700634/m9jKqS2O9DV8L8DcaHgIVGSI1yriyKwYAECgul6Te3W2S-t5isC9r_5x13Zcu-VaT20O";
            const THREAD_ID = configData?.find(c => c.key === 'thread_payroll')?.value || "1467455553214353440";

            const blob = await (await fetch(capturedImg)).blob();
            const file = new File([blob], `Payslip_${currentSlipData.cleanName}.png`, { type: 'image/png' });

            const formData = new FormData();
            formData.append("file", file);
            formData.append("payload_json", JSON.stringify({
                content: `<@${currentSlipData.user_id_discord || ''}> **PENGIRIMAN PAYSLIP BERHASIL**`,
                embeds: [{
                    title: "🏛️ MANDALIKA POLICE - OFFICIAL PAYSLIP",
                    description: `Payslip resmi telah diterbitkan dan divalidasi oleh HQ Finance.`,
                    color: 0xef4444,
                    footer: { text: "Mandalika Automated Payroll System" },
                    timestamp: new Date().toISOString()
                }]
            }));

            const res = await fetch(`${WEBHOOK_URL}?thread_id=${THREAD_ID}`, { method: 'POST', body: formData });

            if (res.ok) {
                await supabase.from('pengajuan_gaji').update({ bukti_transfer: 'SENT_AS_IMAGE_QR' }).eq('id', currentSlipData.id);
                toast.success("PAYSLIP TERKIRIM KE DISCORD!", { id: tId });
                setCapturedImg(null); setCurrentSlipData(null); fetchData();
            } else { throw new Error("Discord Webhook Menolak Permintaan"); }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Gagal mengirim payslip.";
            toast.error(errorMessage, { id: tId });
        } finally { setIsTransmitting(false); }
    };

    const handleAction = async (id: string, status: string) => {
        const tId = toast.loading(`Updating status...`);
        const reqToApprove = augmentedRequests.find(r => r.id === id);

        if (!reqToApprove) {
            toast.error("Data pengajuan tidak ditemukan!", { id: tId });
            return;
        }

        const rawName = adminSession?.name || 'ADMIN';
        const rawRank = adminSession?.pangkat || '';

        let cleanName = rawName;
        if (rawRank && cleanName.toUpperCase().includes(rawRank.toUpperCase())) {
            cleanName = cleanName.replace(new RegExp(rawRank, 'ig'), '').replace(/^[\s\|-]+/, '').trim();
        }
        const adminIdentity = rawRank ? `${rawRank.toUpperCase()} | ${cleanName.toUpperCase()}` : cleanName.toUpperCase();

        const adminNotes = status === 'PAID'
            ? `AUTH BY ${adminIdentity} - ALPH:${reqToApprove.potonganAlpha} - CUTI:${reqToApprove.potonganCuti} - ADJ:${reqToApprove.adjustment.amount} - RSN:${reqToApprove.adjustment.reason} - BASE:${reqToApprove.baseGaji}`
            : `REJECTED BY ${adminIdentity}`;

        const { error } = await supabase.from('pengajuan_gaji').update({
            status,
            jumlah_gaji: status === 'PAID' ? reqToApprove.finalGaji : 0,
            keterangan_admin: adminNotes
        }).eq('id', id);

        if (error) toast.error("Error Database!");
        else { toast.success("Success!", { id: tId }); fetchData(); }
    };

    const executeDelete = async () => {
        if (deleteModal.type === 'ALL' && confirmInput !== "BERSIHKAN") return toast.error("Kode Keamanan Salah!");
        const tId = toast.loading(deleteModal.type === 'ALL' ? "Processing Purge..." : "Menghapus Data Log...");
        try {
            if (deleteModal.type === 'ALL') {
                await supabase.from('pengajuan_gaji').delete().neq('status', 'PENDING');
            } else {
                await supabase.from('pengajuan_gaji').delete().eq('id', deleteModal.id);
            }
            toast.success(deleteModal.type === 'ALL' ? "SELURUH DATA ARSIP DIBERSIHKAN!" : "LOG BERHASIL DIHAPUS!", { id: tId });
            fetchData();
            setDeleteModal({ show: false, type: 'ALL' });
            setConfirmInput("");
        } catch { toast.error("Gagal menghapus data!"); }
    };

    const getAdminName = (notes?: string) => {
        if (!notes) return 'HIGH COMMAND';
        let str = notes.replace('AUTH BY ', '').replace('REJECTED BY ', '');
        const alphIndex = str.indexOf('- ALPH:');
        if (alphIndex !== -1) str = str.substring(0, alphIndex);
        str = str.trim();

        if (str.includes('|')) {
            str = str.split('|').pop()?.trim() || str;
        }
        if (str.startsWith('#')) {
            const spaceIndex = str.indexOf(' ');
            if (spaceIndex !== -1) {
                str = str.substring(spaceIndex + 1).trim();
            } else {
                str = "ADMIN";
            }
        }
        return str.toUpperCase();
    };

    const PaginationControls = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl mt-6">
                <span className="text-xs font-medium text-zinc-400">
                    Halaman <span className="text-zinc-100 font-bold">{currentPage}</span> dari <span className="text-zinc-100 font-bold">{totalPages}</span>
                </span>
                <div className="flex gap-1.5">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 disabled:opacity-30 disabled:hover:bg-zinc-800/80 transition-all border border-zinc-700/50"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 disabled:opacity-30 disabled:hover:bg-zinc-800/80 transition-all border border-zinc-700/50"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 font-sans text-zinc-100 pb-20">
            <Toaster position="top-center" theme="dark" />

            {/* --- TOP STATS METRICS (DARK MINIMALIST) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900/90 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">System Forecast</p>
                    <h3 className="text-2xl md:text-3xl font-bold mt-2 text-zinc-100 tracking-tight">
                        ${financialStats.forecast.toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">Estimasi berdasarkan data periode sebelumnya</p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pending Needs</p>
                    <h3 className="text-2xl md:text-3xl font-bold mt-2 text-zinc-100 tracking-tight">
                        ${financialStats.totalPending.toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">Total pencairan dalam antrian persetujuan</p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800/80 p-5 rounded-2xl relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Weekly Paid</p>
                    <h3 className="text-2xl md:text-3xl font-bold mt-2 text-emerald-400 tracking-tight">
                        ${financialStats.weeklyPaid.toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">Total gaji terbayar minggu ini</p>
                </div>
            </div>

            {/* --- PANEL ATURAN & LIST BONUS GAJI --- */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md transition-all">
                <button
                    onClick={() => setShowRules(!showRules)}
                    className="w-full p-4 flex justify-between items-center bg-zinc-900/90 hover:bg-zinc-800/65 transition-colors text-left"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                            <Gift size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-zinc-100 tracking-tight">Aturan & List Bonus Gaji HQ</h3>
                            <p className="text-[11px] text-zinc-400">Ketentuan bonus mingguan dan administrasi</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-red-400">
                        <span>{showRules ? "Sembunyikan" : "Lihat Detail"}</span>
                        {showRules ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </button>

                <AnimatePresence>
                    {showRules && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="border-t border-zinc-800/80 p-5 space-y-6 bg-zinc-950/40"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                                        <Shield size={14} /> Bonus Divisi Mingguan
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl divide-y divide-zinc-800/60">
                                        {BONUS_RULES.divisiMingguan.map((rule, idx) => (
                                            <div key={idx} className="p-3 flex justify-between items-center text-xs">
                                                <span className="text-zinc-300 font-medium">{rule.shortLabel} ({rule.label})</span>
                                                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">{rule.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                                        <Info size={14} /> Bonus Administrasi & Duty
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl divide-y divide-zinc-800/60">
                                        {BONUS_RULES.administrasi.map((rule, idx) => (
                                            <div key={idx} className="p-3 flex justify-between items-center text-xs">
                                                <span className="text-zinc-300 font-medium">{rule.label}</span>
                                                <span className={cn(
                                                    "font-bold px-2.5 py-1 rounded-lg text-[11px]",
                                                    rule.highlight
                                                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                )}>
                                                    {rule.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- BARIS CONTROL & NAVIGASI TAB --- */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 p-4 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 backdrop-blur-md">
                <div className="flex items-center justify-between w-full lg:w-auto">
                    <h2 className="text-base font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Payroll Command Center
                    </h2>
                </div>

                <div className="flex w-full lg:w-auto flex-col lg:flex-row items-center gap-3">
                    {activeTab === 'REKAP' && (
                        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2 border border-zinc-800 rounded-xl w-full lg:w-auto text-xs">
                            <Filter size={14} className="text-zinc-500" />
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="bg-transparent font-medium text-zinc-300 outline-none w-full cursor-pointer"
                            >
                                <option value="ALL" className="bg-zinc-900">Semua Periode</option>
                                {availablePeriods.map(p => {
                                    const [s, e] = p.split('|');
                                    return <option key={p} value={p} className="bg-zinc-900">{format(parseDateOnly(s), 'dd MMM')} - {format(parseDateOnly(e), 'dd MMM yyyy')}</option>
                                })}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-1 w-full lg:w-auto bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 gap-1 overflow-x-auto hide-scrollbar">
                        {['PENDING', 'NOT_SENT', 'PAID', 'REJECTED', 'REKAP'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t as 'PENDING' | 'NOT_SENT' | 'PAID' | 'REJECTED' | 'REKAP')}
                                className={cn(
                                    "px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2",
                                    activeTab === t
                                        ? "bg-red-600 text-white shadow-md shadow-red-900/30"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                                )}
                            >
                                {t === 'REKAP' && <FileSpreadsheet size={14} />}
                                {t.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {activeTab !== 'PENDING' && (
                        <button
                            onClick={() => setDeleteModal({ show: true, type: 'ALL' })}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white p-2.5 rounded-xl border border-red-500/20 transition-all flex items-center justify-center shrink-0"
                            title="Purge Data"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* TABEL REKAP */}
            {!loading && activeTab === 'REKAP' && (
                <>
                    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-zinc-950 border-b border-zinc-800/80 text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                                        <th className="p-4">Nama Personel</th>
                                        <th className="p-4">Periode Gaji</th>
                                        <th className="p-4 text-center">Rekap (H/C/A)</th>
                                        <th className="p-4 text-center">Duty (Jam)</th>
                                        <th className="p-4 text-right">Total Gaji</th>
                                        <th className="p-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60 text-xs">
                                    {paginatedData.length === 0 ? (
                                        <tr><td colSpan={6} className="p-10 text-center text-zinc-500">Belum ada data gaji yang telah dibayarkan di halaman ini.</td></tr>
                                    ) : (
                                        paginatedData.map((req) => (
                                            <tr key={req.id} className="hover:bg-zinc-800/30 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-zinc-100">{req.cleanName}</p>
                                                        {req.isKadiv && <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded">KADIV</span>}
                                                        {req.isWakadiv && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded">WAKADIV</span>}
                                                    </div>
                                                    <p className="text-[10px] text-red-400 font-mono mt-0.5">{req.pangkat} • #{req.badgeNumber}</p>
                                                </td>
                                                <td className="p-4 text-zinc-400 font-medium">
                                                    {format(parseDateOnly(req.tanggal_mulai), 'dd/MM/yy')} - {format(parseDateOnly(req.tanggal_selesai), 'dd/MM/yy')}
                                                </td>
                                                <td className="p-4 text-center font-mono">
                                                    <span className="text-emerald-400">{req.hadir}</span> / <span className="text-amber-400">{req.cuti}</span> / <span className="text-red-400">{req.alpha}</span>
                                                </td>
                                                <td className="p-4 text-center font-mono">
                                                    <span className={cn("px-2 py-0.5 rounded border text-[11px]", req.is100HoursDuty ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold" : "text-zinc-300 border-zinc-800 bg-zinc-950")}>
                                                        {req.totalDutyHours}h {req.is100HoursDuty && '🔥'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-bold text-emerald-400">
                                                    ${Number(req.jumlah_gaji).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-1.5">
                                                        <button onClick={() => handleOpenAndCapture(req)} className="text-zinc-300 bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg transition-colors"><Eye size={14} /></button>
                                                        <button onClick={() => setDeleteModal({ show: true, type: 'SINGLE', id: req.id })} className="text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <PaginationControls />
                </>
            )}

            {/* KARTU PENGAJUAN (GRID VIEW) */}
            {!loading && activeTab !== 'REKAP' && (
                paginatedData.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl mb-3 text-zinc-500">
                            <Database size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-200">Tidak Ada Data</h3>
                        <p className="text-xs text-zinc-500 mt-1">Saat ini tidak ada laporan di antrian <span className="text-red-400">{activeTab.replace('_', ' ')}</span>.</p>
                    </motion.div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {paginatedData.map((req) => (
                                <div key={req.id} className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between backdrop-blur-md hover:border-zinc-700 transition-all">
                                    <div className="bg-zinc-950/80 border-b border-zinc-800/80 p-4 flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-zinc-100 text-sm">{req.cleanName}</h4>
                                                {req.isKadiv && <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded">KADIV</span>}
                                                {req.isWakadiv && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded">WAKADIV</span>}
                                            </div>
                                            <p className="text-[11px] text-red-400 font-mono mt-0.5">{req.pangkat} • #{req.badgeNumber} • {req.divisi || 'UNIT'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-zinc-400 font-mono">
                                                {format(parseDateOnly(req.tanggal_mulai), 'dd/MM')} - {format(parseDateOnly(req.tanggal_selesai), 'dd/MM')}
                                            </span>
                                            <button onClick={() => setDeleteModal({ show: true, type: 'SINGLE', id: req.id })} className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-4 flex-1">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3">
                                                <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Kehadiran ({req.total_hari} Hari)</p>
                                                <div className="flex gap-1.5 text-xs font-mono font-bold">
                                                    <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">H:{req.hadir}</span>
                                                    <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">C:{req.cuti}</span>
                                                    <span className={cn("px-1.5 py-0.5 rounded border", req.alpha > 0 ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-zinc-400 bg-zinc-800/50 border-zinc-700/50")}>A:{req.alpha}</span>
                                                </div>
                                            </div>

                                            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3">
                                                <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-1 flex items-center gap-1">
                                                    <Clock size={11} className="text-red-400" /> Jam Duty DB
                                                </p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn("text-xs font-bold font-mono px-2 py-0.5 rounded border", req.is100HoursDuty ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-900 text-zinc-300 border-zinc-800")}>
                                                        {req.totalDutyHours} Jam
                                                    </span>
                                                    {req.is100HoursDuty && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">2x GAJI</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-zinc-800/60 pt-3 space-y-1 text-xs">
                                            <div className="flex justify-between text-zinc-400">
                                                <span>Gaji Pokok {req.is100HoursDuty ? '(Bonus 100 Jam Duty 2x)' : ''}</span>
                                                <span className="font-mono text-zinc-200">${req.baseGaji.toLocaleString()}</span>
                                            </div>

                                            {req.bonusJabatan > 0 && (
                                                <div className="flex justify-between text-emerald-400 font-medium">
                                                    <span className="flex items-center gap-1"><Award size={12} /> {req.bonusJabatanLabel} (Auto)</span>
                                                    <span className="font-mono">+ ${req.bonusJabatan.toLocaleString()}</span>
                                                </div>
                                            )}

                                            {req.bonusAbsensi > 0 && (
                                                <div className="flex justify-between text-emerald-400 font-medium">
                                                    <span className="flex items-center gap-1"><Check size={12} /> {req.bonusAbsensiLabel} (Auto)</span>
                                                    <span className="font-mono">+ ${req.bonusAbsensi.toLocaleString()}</span>
                                                </div>
                                            )}

                                            {req.potonganAlpha > 0 && <div className="flex justify-between text-red-400"><span>Potongan Alpha (10% x {req.alpha})</span><span className="font-mono">- ${req.potonganAlpha.toLocaleString()}</span></div>}
                                            {req.potonganCuti > 0 && <div className="flex justify-between text-amber-400"><span>Potongan Cuti (5% x {req.cuti})</span><span className="font-mono">- ${req.potonganCuti.toLocaleString()}</span></div>}
                                            {req.isPetinggi && (req.alpha > 0 || req.cuti > 0) && <div className="flex justify-between text-emerald-400"><span>Privilese Petinggi</span><span>Bebas Potongan</span></div>}

                                            {req.adjustment?.amount !== 0 && (
                                                <div className={cn("flex justify-between font-mono pt-1 border-t border-zinc-800/40 mt-1", req.adjustment?.amount > 0 ? "text-emerald-400" : "text-red-400")}>
                                                    <span className="truncate max-w-[200px]">Adj: {req.adjustment?.reason}</span>
                                                    <span>{req.adjustment?.amount > 0 ? '+' : ''} ${req.adjustment?.amount.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {activeTab === 'PENDING' && (
                                            <div className="border-t border-zinc-800/60 pt-3 space-y-3">
                                                <div>
                                                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                                                        Pilih Preset Bonus Gaji HQ (1x Klik)
                                                    </span>
                                                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                                                        {BONUS_RULES.divisiMingguan.map((b, i) => {
                                                            const userSelected = (selectedPresetBonuses[req.id] || []).includes(b.shortLabel);
                                                            const isAutoGiven = req.bonusAbsensiLabel === b.shortLabel || req.bonusJabatanLabel === b.shortLabel;
                                                            const isSelected = userSelected || isAutoGiven;
                                                            return (
                                                                <button
                                                                    key={i}
                                                                    disabled={isSelected}
                                                                    onClick={() => handleAddPresetBonus(req.id, b.shortLabel, b.amount)}
                                                                    className={cn(
                                                                        "py-2 px-2.5 rounded-xl text-xs font-medium transition-all text-left flex items-center justify-between border shadow-sm",
                                                                        isSelected
                                                                            ? "bg-zinc-900/60 border-emerald-500/30 text-emerald-500/50 cursor-not-allowed opacity-60"
                                                                            : "bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300 hover:text-white"
                                                                    )}
                                                                    title={b.label}
                                                                >
                                                                    <div className="truncate pr-1">
                                                                        <p className="font-semibold text-[11px] leading-tight truncate">{b.shortLabel}</p>
                                                                        <p className="text-[9px] text-zinc-500 truncate">{b.label}</p>
                                                                    </div>
                                                                    <span className={cn(
                                                                        "font-bold text-[10px] shrink-0 px-1.5 py-0.5 rounded border",
                                                                        isSelected 
                                                                            ? "bg-emerald-500/10 text-emerald-400/60 border-emerald-500/20" 
                                                                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                                    )}>
                                                                        {isSelected ? (isAutoGiven ? "✓ Auto" : "✓ Added") : `+${b.value}`}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                                                        Custom Adj / Denda (Masukkan Nominal Positif)
                                                    </span>
                                                    <div className="flex gap-1.5 items-center">
                                                        <div className="flex flex-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-zinc-600 transition-colors shadow-inner">
                                                            <div className="px-2.5 py-2 bg-zinc-900 border-r border-zinc-800 flex items-center justify-center">
                                                                <span className="text-xs text-zinc-400 font-bold">$</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="Nominal (Angka Positif)"
                                                                value={adjInputs[req.id]?.amount || ''}
                                                                onChange={(e) => setAdjInputs({ ...adjInputs, [req.id]: { ...adjInputs[req.id], amount: e.target.value } })}
                                                                className="bg-transparent px-2 py-2 text-xs w-28 outline-none text-zinc-200"
                                                            />
                                                            <div className="w-px bg-zinc-800"></div>
                                                            <input
                                                                type="text"
                                                                placeholder="Keterangan..."
                                                                value={adjInputs[req.id]?.reason || ''}
                                                                onChange={(e) => setAdjInputs({ ...adjInputs, [req.id]: { ...adjInputs[req.id], reason: e.target.value } })}
                                                                className="bg-transparent px-2 py-2 text-xs flex-1 outline-none text-zinc-200"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleAddCustomAdj(req.id, false)}
                                                            className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-sm"
                                                            title="Tambah sebagai Bonus (+)"
                                                        >
                                                            <PlusCircle size={14} /> Bonus
                                                        </button>
                                                        <button
                                                            onClick={() => handleAddCustomAdj(req.id, true)}
                                                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-sm"
                                                            title="Tambah sebagai Denda / Potongan (-)"
                                                        >
                                                            <MinusCircle size={14} /> Denda
                                                        </button>
                                                    </div>

                                                    {req.adjustment?.amount !== 0 && (
                                                        <div className="flex justify-between items-center bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl shadow-sm mt-1">
                                                            <span className="text-[11px] text-amber-400 font-medium break-words pr-2">
                                                                Total Adj: {req.adjustment?.reason} ({req.adjustment?.amount > 0 ? '+' : ''}${req.adjustment?.amount.toLocaleString()})
                                                            </span>
                                                            <button 
                                                                onClick={() => handleResetAdjustment(req.id)} 
                                                                className="text-zinc-500 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 p-1.5 rounded-lg transition-colors border border-zinc-800 shrink-0"
                                                                title="Reset Seluruh Penyesuaian"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-zinc-950/80 border-t border-zinc-800/80 p-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase font-semibold">Total Net Payout</p>
                                            <p className="text-xl font-bold text-emerald-400 font-mono tracking-tight">${req.finalGaji.toLocaleString()}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            {activeTab === 'PENDING' ? (
                                                <>
                                                    <button onClick={() => handleAction(req.id, 'REJECTED')} className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl font-medium text-xs transition-colors">Tolak</button>
                                                    <button onClick={() => handleAction(req.id, 'PAID')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-xs transition-colors shadow-lg shadow-emerald-900/20">Setujui</button>
                                                </>
                                            ) : activeTab === 'NOT_SENT' ? (
                                                <button disabled={isGenerating} onClick={() => handleOpenAndCapture(req)} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50">
                                                    {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Eye size={14} />} Preview Slip
                                                </button>
                                            ) : (
                                                <button onClick={() => handleOpenAndCapture(req)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors border border-zinc-700/50"><Eye size={14} /> Arsip Slip</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <PaginationControls />
                    </>
                )
            )}

            {/* MODAL HAPUS DATA */}
            <AnimatePresence>
                {deleteModal.show && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 border border-zinc-800 p-6 max-w-sm w-full rounded-2xl shadow-2xl">
                            <div className="flex items-center gap-3 text-red-500 mb-4">
                                <AlertOctagon size={28} />
                                <h3 className="text-base font-bold text-zinc-100">Konfirmasi Penghapusan</h3>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                                {deleteModal.type === 'ALL'
                                    ? "Anda akan menghapus SEMUA data gaji yang sudah diproses dari server. Ketik 'BERSIHKAN' untuk melanjutkan."
                                    : "Anda yakin ingin menghapus log slip gaji ini secara permanen dari server?"}
                            </p>

                            {deleteModal.type === 'ALL' && (
                                <input
                                    type="text"
                                    value={confirmInput}
                                    onChange={(e) => setConfirmInput(e.target.value)}
                                    placeholder="Ketik BERSIHKAN"
                                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 mb-4 rounded-xl font-bold uppercase outline-none text-zinc-100 placeholder-zinc-600 focus:border-red-500 text-xs"
                                />
                            )}

                            <div className="flex gap-2">
                                <button onClick={() => setDeleteModal({ show: false, type: 'ALL' })} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2.5 rounded-xl text-xs font-medium transition-colors">Batal</button>
                                <button onClick={executeDelete} className="flex-1 bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-xl text-xs font-medium transition-colors">Hapus</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL PREVIEW & KIRIM PAYSLIP */}
            <AnimatePresence>
                {currentSlipData && (
                    <div className="fixed inset-0 z-50 bg-black/90 p-4 flex items-center justify-center overflow-y-auto backdrop-blur-md">
                        <div className="max-w-xl w-full flex flex-col items-center gap-5 my-8">
                            <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-2xl shadow-2xl overflow-hidden w-full">
                                {capturedImg ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={capturedImg} alt="Official Slip" className="w-full h-auto rounded-xl border border-zinc-800" />
                                ) : (
                                    <div className="w-full h-96 flex flex-col items-center justify-center gap-3 bg-zinc-950 rounded-xl">
                                        <Loader2 className="animate-spin text-red-500" size={32} />
                                        <p className="font-medium text-xs text-zinc-400">Menyusun Slip Gaji Resmi...</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 w-full max-w-xs">
                                {activeTab === 'NOT_SENT' && (
                                    <button disabled={!capturedImg || isTransmitting} onClick={handleTransmit} className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-medium text-xs shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                                        <Send size={16} /> {isTransmitting ? "MENGIRIM..." : "KIRIM KE DISCORD"}
                                    </button>
                                )}
                                <button onClick={() => { setCurrentSlipData(null); setCapturedImg(null); }} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 rounded-xl font-medium text-xs border border-zinc-700/50 transition-colors">Tutup Modal</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- ELEMEN TERSEMBUNYI UNTUK GENERATOR GAMBAR SLIP GAJI --- */}
            {currentSlipData && (
                <div className="fixed -top-[9999px] -left-[9999px] opacity-0 pointer-events-none z-[-1000]">
                    <div ref={slipRef} className="bg-zinc-950 w-[600px] border-2 border-zinc-800 p-10 space-y-8 text-zinc-100 font-sans relative">
                        <div className="flex justify-between items-start border-b border-zinc-800 pb-6 relative z-10">
                            <div className="flex gap-4 items-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo-polisi-blackwhite.png" alt="Logo MPD" className="w-14 h-14 object-contain" />
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 text-red-500 font-bold text-xs tracking-widest uppercase">MANDALIKA POLICE HQ</div>
                                    <h2 className="text-2xl font-black italic tracking-tight text-zinc-100">OFFICIAL PAYSLIP</h2>
                                </div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 text-red-400 px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold">
                                #MPD-{currentSlipData.id.substring(0, 6).toUpperCase()}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 relative z-10 text-xs">
                            <div className="space-y-3">
                                <div><p className="text-[10px] uppercase text-zinc-500 font-semibold">Nama Personel</p><p className="font-bold text-sm text-zinc-100">{currentSlipData.cleanName}</p></div>
                                <div><p className="text-[10px] uppercase text-zinc-500 font-semibold">Pangkat / Badge</p><p className="font-bold text-sm text-red-400 font-mono">{currentSlipData.pangkat} / #{currentSlipData.badgeNumber}</p></div>
                                <div><p className="text-[10px] uppercase text-zinc-500 font-semibold">Divisi & Jabatan</p><p className="font-bold text-zinc-200">{currentSlipData.divisi || 'UNIT'} {currentSlipData.bonusJabatanLabel ? `(${currentSlipData.bonusJabatanLabel.replace('Bonus ', '')})` : ''}</p></div>
                                <div><p className="text-[10px] uppercase text-zinc-500 font-semibold">Periode Gaji</p><p className="font-medium text-zinc-300">{format(parseDateOnly(currentSlipData.tanggal_mulai), 'dd MMM')} - {format(parseDateOnly(currentSlipData.tanggal_selesai), 'dd MMM yyyy')}</p></div>
                            </div>
                            <div className="space-y-4">
                                <div><p className="text-[10px] uppercase text-zinc-500 font-semibold">Total Jam Duty DB</p><p className="font-bold text-emerald-400 font-mono">{currentSlipData.totalDutyHours} Jam {currentSlipData.is100HoursDuty && '(2x Bonus)'}</p></div>
                                <div><p className="text-[10px] uppercase text-zinc-500 font-semibold">Tanggal Pencairan</p><p className="font-medium text-zinc-300">{format(new Date(currentSlipData.updated_at || currentSlipData.created_at), 'dd MMMM yyyy', { locale: localeId })}</p></div>
                                <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                                    <p className="text-[9px] uppercase text-zinc-500 font-semibold mb-0.5">Approved By</p>
                                    <p className="text-xs font-bold text-red-400">
                                        {getAdminName(currentSlipData.keterangan_admin)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border border-zinc-800 p-5 rounded-xl bg-zinc-900/40 relative z-10 text-xs space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2 mb-3">Rincian Kompensasi & Bonus</h4>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Gaji Pokok {currentSlipData.is100HoursDuty ? '(2x Lipat 100 Jam Duty)' : ''}</span>
                                <span className="font-mono text-zinc-200">${currentSlipData.baseGaji.toLocaleString()}</span>
                            </div>

                            {currentSlipData.bonusJabatan > 0 && (
                                <div className="flex justify-between items-center text-emerald-400">
                                    <span>{currentSlipData.bonusJabatanLabel} (Auto Role)</span>
                                    <span className="font-mono">+ ${currentSlipData.bonusJabatan.toLocaleString()}</span>
                                </div>
                            )}

                            {currentSlipData.bonusAbsensi > 0 && (
                                <div className="flex justify-between items-center text-emerald-400">
                                    <span>{currentSlipData.bonusAbsensiLabel} (Auto)</span>
                                    <span className="font-mono">+ ${currentSlipData.bonusAbsensi.toLocaleString()}</span>
                                </div>
                            )}

                            {currentSlipData.potonganAlpha > 0 && (
                                <div className="flex justify-between items-center text-red-400">
                                    <span>Potongan Alpha (10%)</span>
                                    <span className="font-mono">- ${currentSlipData.potonganAlpha.toLocaleString()}</span>
                                </div>
                            )}
                            {currentSlipData.potonganCuti > 0 && (
                                <div className="flex justify-between items-center text-amber-400">
                                    <span>Potongan Cuti (5%)</span>
                                    <span className="font-mono">- ${currentSlipData.potonganCuti.toLocaleString()}</span>
                                </div>
                            )}

                            {currentSlipData.adjustment?.amount !== 0 && (
                                <div className={cn("flex justify-between items-center font-mono", currentSlipData.adjustment?.amount > 0 ? "text-emerald-400" : "text-red-400")}>
                                    <span>{currentSlipData.adjustment?.amount > 0 ? 'Bonus' : 'Denda'}: {currentSlipData.adjustment?.reason}</span>
                                    <span>{currentSlipData.adjustment?.amount > 0 ? '+' : ''} ${currentSlipData.adjustment?.amount.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex justify-between items-center relative z-10">
                            <div>
                                <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-1">Total Net Payout</p>
                                <h3 className="text-4xl font-black text-emerald-400 font-mono tracking-tight">${Number(currentSlipData.jumlah_gaji).toLocaleString()}</h3>
                            </div>
                            <div className="bg-white p-1.5 rounded-lg">
                                <QRCode size={70} value={`AUTH:${currentSlipData.id}|${currentSlipData.cleanName}`} viewBox={`0 0 256 256`} />
                            </div>
                        </div>

                        <div className="text-center pt-2 relative z-10">
                            <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">Mandalika Police Department • Internal Affairs Console</p>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}