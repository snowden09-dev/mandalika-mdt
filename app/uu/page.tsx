"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowLeft, Scale, Calculator, Trash2, Copy, Check } from 'lucide-react';

interface LawItem {
    id: string;
    name: string;
    desc: string;
    fine: number;
    jail: string;
}

interface CategoryItem {
    category: string;
    borderAccent: string;
    items: LawItem[];
}

// --- DATABASE PASAL MANDALIKA ---
const UU_DATABASE: CategoryItem[] = [
    {
        category: "PELANGGARAN RINGAN",
        borderAccent: "border-l-emerald-500",
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
        borderAccent: "border-l-amber-500",
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
        borderAccent: "border-l-purple-500",
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
        borderAccent: "border-l-red-500",
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

const fadeIn: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" }
    }
};

export default function UUPage() {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showCopyNotif, setShowCopyNotif] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Fungsi Toggle Ceklis Pasal
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // Kalkulator Otomatis
    const calculations = useMemo(() => {
        let tFine = 0;
        let tMonths = 0;
        const specials: string[] = [];
        const selectedLaws: LawItem[] = [];

        UU_DATABASE.forEach(cat => {
            cat.items.forEach(law => {
                if (selectedIds.includes(law.id)) {
                    selectedLaws.push(law);
                    tFine += law.fine;

                    if (law.jail.includes("BULAN")) {
                        tMonths += parseInt(law.jail.replace(/\D/g, ""), 10);
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

    // Filter database berdasarkan pencarian
    const filteredDatabase = useMemo(() => {
        if (!searchQuery.trim()) return UU_DATABASE;
        const q = searchQuery.toLowerCase();
        return UU_DATABASE.map(cat => ({
            ...cat,
            items: cat.items.filter(law => 
                law.id.toLowerCase().includes(q) || 
                law.name.toLowerCase().includes(q) || 
                law.desc.toLowerCase().includes(q)
            )
        })).filter(cat => cat.items.length > 0);
    }, [searchQuery]);

    return (
        <main className="min-h-screen bg-[#09090b] text-zinc-100 font-sans pb-48 selection:bg-red-500 selection:text-white">
            
            {/* HEADER NAV */}
            <header className="bg-[#121214]/80 backdrop-blur-md border-b border-zinc-800/80 p-4 sticky top-0 z-50 flex justify-between items-center px-6 lg:px-12">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/dashboard')} 
                        className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-zinc-300 hover:text-white flex items-center justify-center"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Scale size={18} className="text-red-500" /> KUHP Mandalika
                        </h1>
                        <p className="text-xs text-zinc-400 font-mono">Kalkulator Pidana Otomatis</p>
                    </div>
                </div>

                {/* Search Bar Singkat */}
                <div className="hidden md:block w-72">
                    <input
                        type="text"
                        placeholder="Cari pasal atau pelanggaran..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:border-red-500 transition-colors font-sans"
                    />
                </div>
            </header>

            <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
                
                {/* Search Bar Mobile */}
                <div className="md:hidden">
                    <input
                        type="text"
                        placeholder="Cari pasal atau pelanggaran..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:border-red-500 transition-colors"
                    />
                </div>

                {filteredDatabase.map((category, idx) => (
                    <motion.div 
                        key={idx} 
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="bg-[#121214] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl"
                    >
                        {/* Kategori Header dengan Border Aksen Kiri */}
                        <div className={`bg-zinc-900/60 border-b border-zinc-800/80 p-4 px-6 flex items-center justify-between border-l-4 ${category.borderAccent}`}>
                            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                                {category.category}
                            </h2>
                            <span className="text-[11px] font-mono text-zinc-500">
                                {category.items.length} Pasal Tersedia
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-150">
                                <thead className="bg-zinc-900/30 text-[11px] font-mono text-zinc-400 border-b border-zinc-800/60 uppercase">
                                    <tr>
                                        <th className="p-3.5 pl-6 w-16 text-center">Pilihlah</th>
                                        <th className="p-3.5 w-20 text-center font-mono">Pasal</th>
                                        <th className="p-3.5">Pelanggaran</th>
                                        <th className="p-3.5">Denda</th>
                                        <th className="p-3.5 pr-6">Penjara</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs text-zinc-300 divide-y divide-zinc-800/50">
                                    {category.items.map((law) => {
                                        const isSelected = selectedIds.includes(law.id);
                                        return (
                                            <tr
                                                key={law.id}
                                                onClick={() => toggleSelection(law.id)}
                                                className={`cursor-pointer transition-colors ${isSelected ? 'bg-red-500/10 hover:bg-red-500/15' : 'hover:bg-zinc-900/40'}`}
                                            >
                                                <td className="p-3.5 pl-6 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        readOnly
                                                        className="w-4 h-4 accent-red-600 bg-zinc-900 border-zinc-700 rounded cursor-pointer pointer-events-none"
                                                    />
                                                </td>
                                                <td className="p-3.5 text-center font-mono font-semibold text-red-400">{law.id}</td>
                                                <td className="p-3.5 leading-relaxed">
                                                    <span className="block font-medium text-white">{law.name}</span>
                                                    <span className="text-[11px] text-zinc-500 uppercase">{law.desc}</span>
                                                </td>
                                                <td className="p-3.5 font-mono font-semibold text-emerald-400">${law.fine.toLocaleString()}</td>
                                                <td className={`p-3.5 pr-6 font-mono font-semibold ${law.jail.includes("BULAN") ? 'text-amber-400' : 'text-red-400'}`}>{law.jail}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* STICKY BOTTOM BAR (KALKULATOR REKAP) */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 150, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        exit={{ y: 150, opacity: 0 }} 
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed bottom-0 left-0 w-full bg-[#121214] border-t border-zinc-800 p-4 md:p-6 shadow-2xl z-100 flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl hidden md:flex items-center justify-center text-red-400">
                                <Calculator size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <p className="text-red-400 text-[11px] font-mono uppercase tracking-wider">Total {selectedIds.length} Pasal Terpilih</p>
                                </div>
                                <div className="flex gap-6 sm:gap-10 flex-wrap">
                                    <div>
                                        <span className="text-zinc-500 font-mono text-[11px] mr-2 uppercase">Denda:</span>
                                        <span className="text-xl md:text-2xl font-mono font-bold text-emerald-400">${calculations.totalFine.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 font-mono text-[11px] mr-2 uppercase">Penjara:</span>
                                        <span className="text-xl md:text-2xl font-mono font-bold text-amber-400">
                                            {calculations.totalMonths > 0 ? `${calculations.totalMonths} BLN` : ''}
                                            {calculations.specials.length > 0 && ` + ${calculations.specials.join(' & ')}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex w-full md:w-auto gap-3">
                            <button 
                                onClick={() => setSelectedIds([])} 
                                className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-[0.98] transition-all rounded-xl"
                                title="Reset Pilihan"
                            >
                                <Trash2 size={20} />
                            </button>
                            <button
                                onClick={handleCopy}
                                className={`flex-1 md:w-48 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-lg ${showCopyNotif ? 'bg-emerald-600 text-white shadow-emerald-900/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20 active:scale-[0.98]'}`}
                            >
                                {showCopyNotif ? <><Check size={16} /> Tersalin!</> : <><Copy size={16} /> Copy Laporan</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </main>
    );
}