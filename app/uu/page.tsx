"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Scale, Calculator, Trash2, Copy, CheckSquare } from 'lucide-react';

// --- DATABASE PASAL MANDALIKA ---
const UU_DATABASE = [
    {
        category: "PELANGGARAN RINGAN",
        color: "bg-[#00E676]", // Hijau
        items: [
            { id: "A1", name: "GANGGUAN KETERTIBAN UMUM", desc: "KERIBUTAN / ONAR", fine: 3200, jail: "10 BULAN" },
            { id: "A2", name: "MENGHINA PETUGAS APARAT", desc: "VERBAL / GESTUR", fine: 2000, jail: "10 BULAN" },
            { id: "A3", name: "TIDAK PATUH PERINTAH", desc: "ABAIKAN INSTRUKSI PETUGAS", fine: 4400, jail: "7 BULAN" },
            { id: "A4", name: "MEMASUKI AREA TERLARANG", desc: "TANPA IZIN", fine: 2000, jail: "10 BULAN" },
            { id: "A5", name: "MENGHALANGI POLISI", desc: "HAMBAT TUGAS", fine: 2100, jail: "7 BULAN" },
            { id: "A6", name: "TIDAK MEMBAWA IDENTITAS", desc: "TIDAK MEMBAWA KTP / ID", fine: 800, jail: "5 BULAN" },
            { id: "A7", name: "IDENTITAS PALSU", desc: "NAMA / ID PALSU", fine: 2500, jail: "15 BULAN" },
            { id: "A8", name: "KABUR SAAT DI PERIKSA", desc: "BELUM DI TAHAN", fine: 1200, jail: "10 BULAN" },
            { id: "A9", name: "PROVOKASI PUBLIK", desc: "MEMANCING CHAOS", fine: 3200, jail: "12 BULAN" },
            { id: "A10", name: "PERUSAKAN RINGAN", desc: "PROPERTI KECIL", fine: 3500, jail: "10 BULAN" },
            { id: "A11", name: "MEMBAWA ALAT ILEGAL RINGAN", desc: "LOCKPICK, DLL", fine: 4000, jail: "15 BULAN" },
            { id: "A12", name: "MENGGANGU TKP", desc: "RUSAK BUKTI", fine: 3100, jail: "10 BULAN" },
            { id: "A13", name: "PENYALAHGUNAAN KLAKSON", desc: "SPAM SUARA", fine: 550, jail: "5 BULAN" },
            { id: "A14", name: "MENGHALANGI EVAKUASI", desc: "EMS / PD", fine: 5000, jail: "20 BULAN" },
            { id: "A15", name: "MENGABAIKAN PANGGILAN POLISI", desc: "KABUR CALL", fine: 550, jail: "7 BULAN" },
            { id: "A16", name: "PERKELAHIAN RINGAN", desc: "TANPA SENJATA", fine: 890, jail: "5 BULAN" },
            { id: "A17", name: "MEROKOK DI AREA TERLARANG", desc: "GEDUNG PUBLIK / NEGARA", fine: 800, jail: "5 BULAN" },
            { id: "A18", name: "MENGGANGU PELAYANAN PUBLIK", desc: "MENGHAMBAT EMS/PD/GOV", fine: 2000, jail: "10 BULAN" },
            { id: "A19", name: "MEMBUAT LAPORAN PALSU", desc: "KEJADIAN FIKTIF", fine: 1200, jail: "10 BULAN" },
            { id: "A20", name: "PENYALAHGUNAAN CALL EMERGENCY", desc: "SPAM HOTLINE", fine: 1200, jail: "10 BULAN" },
            { id: "A21", name: "MENGGANGU PROSES PENANGKAPAN", desc: "MENGHALANGI ORANG LAIN", fine: 2500, jail: "15 BULAN" },
            { id: "A22", name: "MENGGUNAKAN ATRIBUT TANPA IZIN", desc: "SERAGAM/ID PALSU", fine: 5000, jail: "15 BULAN" },
            { id: "A23", name: "MEMBAWA HEWAN KE AREA TERLARANG", desc: "RS, KANTOR NEGARA", fine: 4000, jail: "10 BULAN" },
            { id: "A24", name: "PENCEMARAN NAMA BAIK PERORANGAN", desc: "FITNAH TANPA BUKTI", fine: 2500, jail: "8 BULAN" },
            { id: "A25", name: "PENCEMARAN NAMA BAIK INSTANSI", desc: "HOAX KE INSTANSI RESMI", fine: 4800, jail: "18 BULAN" },
            { id: "A26", name: "ATRIBUT TIDAK SENONOH", desc: "MELANGGAR NORMA", fine: 5000, jail: "10 BULAN" },
            { id: "A27", name: "TINDAKAN TIDAK SENONOH", desc: "ASUSILA DI PUBLIK", fine: 4800, jail: "15 BULAN" },
        ]
    },
    {
        category: "MENENGAH UMUM",
        color: "bg-[#FFD100]", // Kuning
        items: [
            { id: "B1", name: "PERLAWANAN APARAT", desc: "FISIK", fine: 5000, jail: "20 BULAN" },
            { id: "B2", name: "ANCAMAN KEKERASAN", desc: "SERIUS", fine: 8000, jail: "15 BULAN" },
            { id: "B3", name: "PENYALAHGUNAAN SENJATA TAJAM", desc: "PISAU / BATON", fine: 5200, jail: "15 BULAN" },
            { id: "B4", name: "PENYERANGAN WARGA", desc: "LUKA RINGAN/SEDANG", fine: 6700, jail: "10 BULAN" },
            { id: "B5", name: "PERCOBAAN KABUR", desc: "SAAT DITAHAN", fine: 8000, jail: "23 BULAN" },
            { id: "B6", name: "PERUSAKAN PROPERTI", desc: "SKALA SEDANG", fine: 5200, jail: "10 BULAN" },
            { id: "B7", name: "PENIPUAN", desc: "SCAM, FRAUD", fine: 5800, jail: "10 BULAN" },
            { id: "B8", name: "PENCURIAN", desc: "KEKERASAN/TANPA KEKERASAN", fine: 6800, jail: "15 BULAN" },
            { id: "B9", name: "CARSTEALING", desc: "PENCURIAN KENDARAAN", fine: 8000, jail: "20 BULAN" },
            { id: "B10", name: "MEMBAWA BARANG CARSTEALING", desc: "KUNCI T, LINGGIS", fine: 6700, jail: "10 BULAN" },
            { id: "B11", name: "KEPEMILIKAN BARANG CURIAN", desc: "HASIL KEJAHATAN", fine: 5000, jail: "12 BULAN" },
            { id: "B12", name: "PENYUAPAN APARAT", desc: "UANG / BARANG", fine: 8500, jail: "20 BULAN" },
            { id: "B13", name: "MENGHALANGI PENYIDIKAN", desc: "HILANG BUKTI", fine: 5500, jail: "7 BULAN" },
            { id: "B14", name: "MEMBANTU PELAKU KEJAHATAN", desc: "MENYEMBUNYIKAN", fine: 6400, jail: "10 BULAN" },
            { id: "B15", name: "PEMBEGALAN", desc: "PERAMPASAN DI JALAN", fine: 7900, jail: "20 BULAN" },
            { id: "B16", name: "MEMBAWA KEVLAR", desc: "TANPA IZIN", fine: 8000, jail: "18 BULAN" },
            { id: "B17", name: "MEMBAWA UANG MERAH", desc: "UANG ILEGAL", fine: 12000, jail: "15 BULAN" },
            { id: "B18", name: "PERBURUAN ILEGAL", desc: "TANPA IZIN", fine: 5700, jail: "7 BULAN" },
            { id: "B19", name: "MEMBAWA HASIL BURUAN", desc: "DAGING LINDUNG", fine: 4500, jail: "8 BULAN" },
            { id: "B20", name: "MEMBAWA HEWAN DILINDUNGI", desc: "PENYU, HIU, DLL", fine: 8000, jail: "20 BULAN" },
            { id: "B21", name: "PENJUALAN HEWAN DILINDUNGI", desc: "PERDAGANGAN SATWA", fine: 7600, jail: "15 BULAN" },
            { id: "B22", name: "PENODONGAN WARGA", desc: "ANCAM TANPA LUKA", fine: 6700, jail: "15 BULAN" },
            { id: "B23", name: "PENODONGAN INSTANSI", desc: "ANCAM PD/EMS/GOV", fine: 8500, jail: "30 BULAN" },
            { id: "B24", name: "BERADA DI ZONA ILEGAL", desc: "RED ZONE", fine: 5500, jail: "10 BULAN" },
            { id: "B25", name: "BERADA DI TKP PENEMBAKAN", desc: "TKP AKTIF", fine: 5000, jail: "10 BULAN" },
        ]
    },
    {
        category: "MENENGAH (MINUMAN & NARKOTIKA)",
        color: "bg-[#A78BFA]", // Ungu
        items: [
            { id: "B26", name: "KONSUMSI ALKOHOL DI UMUM", desc: "FASILITAS PUBLIK", fine: 5000, jail: "10 BULAN" },
            { id: "B27", name: "MABUK DI TEMPAT UMUM", desc: "GANGGU KEAMANAN", fine: 5000, jail: "5 BULAN" },
            { id: "B31", name: "MENGEMUDI DALAM PENGARUH", desc: "DUI ALKOHOL", fine: 5000, jail: "8 BULAN" },
            { id: "B32", name: "MENJUAL ALKOHOL TANPA IZIN", desc: "DISTRIBUSI ILEGAL", fine: 7000, jail: "10 BULAN" },
            { id: "B37", name: "MEMAKAI MARIJUANA", desc: "KONSUMSI PRIBADI", fine: 4600, jail: "15 BULAN" },
            { id: "B38", name: "MEMAKAI NARKOTIKA KERAS", desc: "SABU/KOKAIN", fine: 5500, jail: "15 BULAN" },
            { id: "B43", name: "MEMBAWA MARIJUANA", desc: "SIAP EDAR", fine: 10000, jail: "18 BULAN" },
            { id: "B45", name: "MEMBAWA SABU", desc: "SIAP EDAR", fine: 12000, jail: "20 BULAN" },
            { id: "B55", name: "MENJUAL SABU", desc: "BANDAR UTAMA", fine: 10000, jail: "12 BULAN" },
            { id: "B58", name: "JARINGAN NARKOTIKA", desc: "TERORGANISIR", fine: 12000, jail: "15 BULAN" },
        ]
    },
    {
        category: "PELANGGARAN BERAT",
        color: "bg-[#FF4D4D]", // Merah
        items: [
            { id: "C1", name: "SENJATA API ILEGAL", desc: "TANPA IZIN", fine: 9000, jail: "20 BULAN" },
            { id: "C2", name: "SENJATA LARAS PENDEK ILEGAL", desc: "PISTOL, DEAGLE", fine: 10000, jail: "20 BULAN" },
            { id: "C3", name: "SENJATA LARAS MENENGAH ILEGAL", desc: "UZI, MP5, SHOTGUN", fine: 11000, jail: "25 BULAN" },
            { id: "C4", name: "SENJATA LARAS PANJANG ILEGAL", desc: "AK47, M4, SNIPER", fine: 12000, jail: "25 BULAN" },
            { id: "C5", name: "PRODUKSI SENJATA ILEGAL", desc: "LAB SENJATA", fine: 1, jail: "PENGADILAN" },
            { id: "C8", name: "MONEY LAUNDERING", desc: "CUCI UANG MERAH", fine: 7000, jail: "15 BULAN" },
            { id: "C11", name: "PENEMBAKAN ANGGOTA POLISI", desc: "SERANGAN KE PD", fine: 12000, jail: "20 BULAN" },
            { id: "C13", name: "PEMBUNUHAN", desc: "MENGHILANGKAN NYAWA", fine: 7000, jail: "12 BULAN" },
            { id: "C16", name: "PERAMPOKAN BANK BESAR", desc: "PACIFIC / CENTRAL", fine: 10000, jail: "20 BULAN" },
            { id: "C19", name: "PENYANDERAAN", desc: "ANCAMAN SENJATA", fine: 8000, jail: "15 BULAN" },
            { id: "C20", name: "KORUPSI INSTANSI", desc: "PENYALAHGUNAAN", fine: 0, jail: "HUKUM MATI" },
            { id: "C21", name: "TERORISME", desc: "TEROR MASSAL", fine: 1, jail: "PENGADILAN" },
        ]
    }
];

export default function UUPage() {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showCopyNotif, setShowCopyNotif] = useState(false);

    // Fungsi Toggle Ceklis Pasal
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // Kalkulator Otomatis
    const calculations = useMemo(() => {
        let tFine = 0;
        let tMonths = 0;
        let specials: string[] = [];
        let selectedLaws: any[] = [];

        UU_DATABASE.forEach(cat => {
            cat.items.forEach(law => {
                if (selectedIds.includes(law.id)) {
                    selectedLaws.push(law);
                    tFine += law.fine;

                    if (law.jail.includes("BULAN")) {
                        tMonths += parseInt(law.jail.replace(/\D/g, ""));
                    } else {
                        if (!specials.includes(law.jail)) specials.push(law.jail);
                    }
                }
            });
        });

        return { totalFine: tFine, totalMonths: tMonths, specials, selectedLaws };
    }, [selectedIds]);

    // Format Text untuk di-Copy ke Laporan Discord
    const handleCopy = () => {
        const { selectedLaws, totalFine, totalMonths, specials } = calculations;
        if (selectedLaws.length === 0) return;

        let text = `**[REKAP PELANGGARAN HUKUM]**\n`;
        text += `Pasal Dikenakan:\n`;
        selectedLaws.forEach(law => {
            text += `- **Pasal ${law.id}**: ${law.name} (${law.jail})\n`;
        });
        text += `\n**TOTAL DENDA**: $${totalFine.toLocaleString()}`;
        text += `\n**TOTAL PENJARA**: ${totalMonths > 0 ? totalMonths + ' BULAN' : ''} ${specials.length > 0 ? '+ ' + specials.join(', ') : ''}`;

        navigator.clipboard.writeText(text);
        setShowCopyNotif(true);
        setTimeout(() => setShowCopyNotif(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#e2e8f0] text-slate-950 font-sans pb-40">
            {/* HEADER NAV */}
            <div className="bg-white border-b-[6px] border-black p-4 sticky top-0 z-50 shadow-[0_4px_0_0_#000] flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 bg-[#FFD100] border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:-translate-y-1 transition-all active:translate-y-0">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-[1000] italic uppercase tracking-tighter flex items-center gap-2">
                            <Scale size={24} className="text-[#3B82F6]" /> KUHP Mandalika
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kalkulator Pidana Otomatis v1.0</p>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-12">
                {UU_DATABASE.map((category, idx) => (
                    <div key={idx} className="bg-white border-[5px] border-black shadow-[10px_10px_0_0_#000] overflow-hidden">
                        <div className={`${category.color} border-b-[5px] border-black p-4 flex items-center justify-between`}>
                            <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black flex items-center gap-2">
                                <CheckSquare size={20} /> {category.category}
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b-[3px] border-black">
                                    <tr>
                                        <th className="p-3 border-r-[3px] border-black text-center w-16">PILIH</th>
                                        <th className="p-3 border-r-[3px] border-black w-16 text-center">PASAL</th>
                                        <th className="p-3 border-r-[3px] border-black">PELANGGARAN</th>
                                        <th className="p-3 border-r-[3px] border-black">DENDA</th>
                                        <th className="p-3">PENJARA</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-bold uppercase">
                                    {category.items.map((law) => {
                                        const isSelected = selectedIds.includes(law.id);
                                        return (
                                            <tr
                                                key={law.id}
                                                onClick={() => toggleSelection(law.id)}
                                                className={`border-b-2 border-slate-200 cursor-pointer transition-colors ${isSelected ? 'bg-blue-100' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="p-3 border-r-[3px] border-black text-center relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        readOnly
                                                        className="w-5 h-5 accent-blue-600 border-2 border-black rounded-sm cursor-pointer pointer-events-none"
                                                    />
                                                </td>
                                                <td className="p-3 border-r-[3px] border-black text-center text-blue-600 font-[1000] italic">{law.id}</td>
                                                <td className="p-3 border-r-[3px] border-black leading-tight">
                                                    <span className="block">{law.name}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium normal-case">{law.desc}</span>
                                                </td>
                                                <td className="p-3 border-r-[3px] border-black font-[1000] text-emerald-600">${law.fine.toLocaleString()}</td>
                                                <td className={`p-3 font-[1000] ${law.jail.includes("BULAN") ? 'text-amber-600' : 'text-red-600 animate-pulse'}`}>{law.jail}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {/* 🚀 KALKULATOR REKAP (STICKY BOTTOM BAR) */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 150 }} animate={{ y: 0 }} exit={{ y: 150 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="fixed bottom-0 left-0 w-full bg-slate-900 border-t-[6px] border-[#CCFF00] p-4 md:p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-[100] flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="bg-[#CCFF00] p-3 border-[3px] border-black rounded-xl hidden md:block">
                                <Calculator size={32} className="text-black" />
                            </div>
                            <div>
                                <p className="text-[#CCFF00] text-[10px] font-black uppercase tracking-widest mb-1">Total {selectedIds.length} Pasal Terpilih</p>
                                <div className="flex gap-4 sm:gap-8 flex-wrap">
                                    <div>
                                        <span className="text-slate-400 text-xs font-bold mr-2">DENDA:</span>
                                        <span className="text-2xl md:text-3xl font-[1000] text-emerald-400 italic">${calculations.totalFine.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-xs font-bold mr-2">PENJARA:</span>
                                        <span className="text-2xl md:text-3xl font-[1000] text-amber-400 italic">
                                            {calculations.totalMonths > 0 ? `${calculations.totalMonths} BLN` : ''}
                                            {calculations.specials.length > 0 && ` + ${calculations.specials.join(' & ')}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex w-full md:w-auto gap-3">
                            <button onClick={() => setSelectedIds([])} className="p-4 bg-red-500 text-white border-[3px] border-black hover:bg-red-600 active:translate-y-1 transition-all rounded-xl shadow-[4px_4px_0_0_#000]">
                                <Trash2 size={24} />
                            </button>
                            <button
                                onClick={handleCopy}
                                className={`flex-1 md:w-48 flex items-center justify-center gap-2 p-4 border-[3px] border-black rounded-xl shadow-[4px_4px_0_0_#000] font-[1000] italic uppercase active:translate-y-1 transition-all ${showCopyNotif ? 'bg-[#00E676] text-black' : 'bg-white text-black hover:bg-slate-200'}`}
                            >
                                {showCopyNotif ? <><CheckSquare size={20} /> TERSALIN!</> : <><Copy size={20} /> COPY LAPORAN</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}