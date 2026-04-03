"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, ShieldAlert, AlertOctagon, Car, Crosshair,
    FileText, Radio, CheckCircle2, AlertTriangle, Users, Target, Siren, Construction, ChevronRight
} from 'lucide-react';

interface SectionHandbookProps {
    divisi: string;
    isPetinggi?: boolean; // Prop tambahan untuk akses High Command
}

export default function SectionHandbook({ divisi, isPetinggi = false }: SectionHandbookProps) {
    // State untuk mengontrol divisi mana yang sedang dilihat.
    // Default-nya menggunakan divisi prop dari user.
    const [viewDivisi, setViewDivisi] = useState(divisi?.toUpperCase() || "UNIT");

    // Efek ini memastikan jika prop divisi berubah, viewDivisi juga ikut update 
    // (berguna jika user biasa login dan divisinya ter-load terlambat)
    useEffect(() => {
        if (!isPetinggi) {
            setViewDivisi(divisi?.toUpperCase() || "UNIT");
        }
    }, [divisi, isPetinggi]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-6xl mx-auto space-y-6"
        >
            {/* FITUR KHUSUS PETINGGI: SELECTOR DIVISI */}
            {isPetinggi && (
                <div className="bg-slate-100 border-[6px] border-black p-4 shadow-[8px_8px_0_0_#000] mb-6">
                    <p className="text-xs font-black uppercase text-red-600 mb-3 tracking-widest border-b-2 border-black pb-2 inline-block">
                        ⚡ Otoritas Tinggi Terdeteksi: Akses Semua Divisi
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {['SABHARA', 'SATLANTAS', 'BRIMOB', 'PROPAM'].map((divName) => (
                            <button
                                key={divName}
                                onClick={() => setViewDivisi(divName)}
                                className={`px-4 py-2 font-black uppercase italic text-sm border-[3px] border-black transition-all ${viewDivisi === divName
                                        ? 'bg-black text-[#CCFF00] shadow-[4px_4px_0_0_#CCFF00] translate-x-[-2px] translate-y-[-2px]'
                                        : 'bg-white text-black hover:bg-slate-200'
                                    }`}
                            >
                                {divName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* HEADER HANDBOOK */}
            <div className="bg-white border-[6px] border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-[1000] italic uppercase tracking-tighter flex items-center gap-3">
                        <BookOpen size={32} className="text-blue-600" />
                        BUKU SAKU DIVISI
                    </h1>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mt-1">
                        Dokumen Internal Resmi Kepolisian Mandalika
                    </p>
                </div>
                <div className="bg-slate-950 text-[#CCFF00] border-[4px] border-black px-6 py-3 shadow-[4px_4px_0_0_#CCFF00]">
                    <p className="text-[10px] font-black italic uppercase tracking-widest opacity-70">Akses Terkunci Untuk:</p>
                    <p className="text-xl font-[1000] uppercase tracking-widest">{viewDivisi}</p>
                </div>
            </div>

            {/* RENDER KONTEN BERDASARKAN DIVISI */}
            {viewDivisi === "SABHARA" && <HandbookSabhara />}
            {viewDivisi === "BRIMOB" && <HandbookBrimob />}
            {viewDivisi === "SATLANTAS" && <HandbookSatlantas />}
            {viewDivisi === "PROPAM" && <HandbookPropam />}

            {/* FALLBACK JIKA DIVISI BELUM ADA HANDBOOK-NYA */}
            {viewDivisi !== "SABHARA" && viewDivisi !== "BRIMOB" && viewDivisi !== "SATLANTAS" && viewDivisi !== "PROPAM" && (
                <div className="bg-yellow-100 border-[6px] border-black p-10 text-center shadow-[8px_8px_0_0_#000]">
                    <AlertTriangle size={64} className="mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-2xl font-[1000] uppercase italic">DATA BELUM TERSEDIA</h2>
                    <p className="font-bold text-slate-700 mt-2">Buku saku untuk divisi {viewDivisi} sedang dalam tahap penyusunan oleh Petinggi.</p>
                </div>
            )}
        </motion.div>
    );
}

// Helper untuk penomoran Romawi di header konten
function indexToRoman(num: number) {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[num - 1] || num;
}

// ============================================================================
// 🚓 KOMPONEN HANDBOOK SABHARA (Neo-Brutalism Tabs)
// ============================================================================
function HandbookSabhara() {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, title: "Zona Merah / Ilegal", icon: <AlertOctagon size={20} />, color: "#FF4D4D" },
        { id: 1, title: "Kendaraan Dinas", icon: <Car size={20} />, color: "#3B82F6" },
        { id: 2, title: "Perlengkapan Bertugas", icon: <ShieldAlert size={20} />, color: "#00E676" },
        { id: 3, title: "Baju On Duty", icon: <Users size={20} />, color: "#FFD100" },
        { id: 4, title: "Penanganan Kriminal", icon: <Crosshair size={20} />, color: "#A78BFA" },
        { id: 5, title: "Pembuatan SKCK", icon: <FileText size={20} />, color: "#FF90E8" },
        { id: 6, title: "Radio & Callsign", icon: <Radio size={20} />, color: "#CCFF00" },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-6 pb-10">
            <SidebarTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            <ContentArea tabs={tabs} activeTab={activeTab}>
                {activeTab === 0 && <SabharaTab1 />}
                {activeTab === 1 && <SabharaTab2 />}
                {activeTab === 2 && <SabharaTab3 />}
                {activeTab === 3 && <SabharaTab4 />}
                {activeTab === 4 && <SabharaTab5 />}
                {activeTab === 5 && <SabharaTab6 />}
                {activeTab === 6 && <SabharaTab7 />}
            </ContentArea>
        </div>
    );
}

// ============================================================================
// 🚁 KOMPONEN HANDBOOK BRIMOB (Neo-Brutalism Tabs)
// ============================================================================
function HandbookBrimob() {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, title: "SOP BRIMOB", icon: <Target size={20} />, color: "#FF4D4D" },
        { id: 1, title: "Sumber Daya", icon: <ShieldAlert size={20} />, color: "#3B82F6" },
        { id: 2, title: "Tugas Pokok", icon: <CheckCircle2 size={20} />, color: "#CCFF00" },
        { id: 3, title: "Pembagian Patroli", icon: <Car size={20} />, color: "#FF9000" },
        { id: 4, title: "Kesimpulan", icon: <BookOpen size={20} />, color: "#A78BFA" },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-6 pb-10">
            <SidebarTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            <ContentArea tabs={tabs} activeTab={activeTab}>
                {activeTab === 0 && <BrimobTab1 />}
                {activeTab === 1 && <BrimobTab2 />}
                {activeTab === 2 && <BrimobTab3 />}
                {activeTab === 3 && <BrimobTab4 />}
                {activeTab === 4 && <BrimobTab5 />}
            </ContentArea>
        </div>
    );
}

// ============================================================================
// 🚦 KOMPONEN HANDBOOK SATLANTAS (Neo-Brutalism Tabs)
// ============================================================================
function HandbookSatlantas() {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, title: "Tugas Utama", icon: <Siren size={20} />, color: "#FF9000" },
        { id: 1, title: "Pelayanan Administrasi", icon: <FileText size={20} />, color: "#3B82F6" },
        { id: 2, title: "Penggunaan Unit Dinas", icon: <Car size={20} />, color: "#00E676" },
        { id: 3, title: "Kode Etik & Disiplin", icon: <ShieldAlert size={20} />, color: "#A78BFA" },
        { id: 4, title: "Radio & Callsign", icon: <Radio size={20} />, color: "#FF90E8" },
        { id: 5, title: "SOP Impound", icon: <Target size={20} />, color: "#FF4D4D" },
        { id: 6, title: "Pola Patroli", icon: <Crosshair size={20} />, color: "#CCFF00" },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-6 pb-10">
            <SidebarTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            <ContentArea tabs={tabs} activeTab={activeTab}>
                {activeTab === 0 && <SatlantasTab1 />}
                {activeTab === 1 && <SatlantasTab2 />}
                {activeTab === 2 && <SatlantasTab3 />}
                {activeTab === 3 && <SatlantasTab4 />}
                {activeTab === 4 && <SatlantasTab5 />}
                {activeTab === 5 && <SatlantasTab6 />}
                {activeTab === 6 && <SatlantasTab7 />}
            </ContentArea>
        </div>
    );
}

// ============================================================================
// 🛑 KOMPONEN HANDBOOK PROPAM (COMING SOON)
// ============================================================================
function HandbookPropam() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-black border-[8px] border-[#FFD100] p-10 max-w-2xl w-full shadow-[12px_12px_0_0_#A78BFA] relative overflow-hidden"
            >
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #FFD100 10px, #FFD100 20px)' }}></div>
                <div className="relative z-10">
                    <Construction size={80} className="mx-auto text-[#FFD100] mb-6 animate-pulse" />
                    <h2 className="text-3xl md:text-5xl font-[1000] italic uppercase tracking-tighter text-white mb-2">RESTRICTED AREA</h2>
                    <h3 className="text-xl font-black uppercase text-[#A78BFA] bg-slate-900 inline-block px-4 py-1 border-2 border-[#A78BFA] mb-6">DIVISI PROPAM</h3>
                    <p className="font-bold text-slate-300 font-sans text-sm md:text-base leading-relaxed mb-6">
                        SOP dan Regulasi internal Divisi Profesi dan Pengamanan (PROPAM) sedang dalam tahap finalisasi oleh Komando Tertinggi dan Tim Perumus Kebijakan Mandalika.
                    </p>
                    <div className="bg-red-600 text-white font-black uppercase tracking-widest py-3 border-4 border-white shadow-[4px_4px_0_0_#FFF]">
                        STATUS: COMING SOON
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ============================================================================
// REUSABLE UI COMPONENTS (SIDEBAR & CONTENT AREA)
// ============================================================================

function SidebarTabs({ tabs, activeTab, setActiveTab }: { tabs: any[], activeTab: number, setActiveTab: (i: number) => void }) {
    return (
        <div className="w-full md:w-1/3 shrink-0 flex flex-col gap-3">
            {tabs.map((tab, index) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(index)}
                    className={`flex items-center justify-between p-4 border-[4px] border-black transition-all font-black uppercase italic tracking-tight text-left ${activeTab === index
                        ? 'bg-black text-white shadow-[6px_6px_0_0_#000] translate-x-[-2px] translate-y-[-2px]'
                        : 'bg-white hover:bg-slate-100'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <span style={{ color: activeTab === index ? tab.color : '#000' }}>{tab.icon}</span>
                        <span>{tab.title}</span>
                    </div>
                    {activeTab === index && <ChevronRight size={20} style={{ color: tab.color }} />}
                </button>
            ))}
        </div>
    );
}

function ContentArea({ tabs, activeTab, children }: { tabs: any[], activeTab: number, children: React.ReactNode }) {
    return (
        <div className="w-full md:w-2/3 bg-white border-[6px] border-black shadow-[8px_8px_0_0_#000] min-h-[500px] flex flex-col">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1"
                >
                    <div
                        className="border-b-[5px] border-black p-4 flex items-center gap-3"
                        style={{ backgroundColor: tabs[activeTab].color }}
                    >
                        <span className="text-black">{tabs[activeTab].icon}</span>
                        <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">
                            {indexToRoman(activeTab + 1)}. {tabs[activeTab].title}
                        </h2>
                    </div>
                    <div className="p-6 font-sans text-sm text-slate-800 h-full">
                        {children}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// ISI MATERI SABHARA
// ============================================================================
function SabharaTab1() {
    return (
        <div className="space-y-4 font-bold">
            <div>
                <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mb-2">- PENGERTIAN UMUM</h3>
                <p>Zona Merah / Zona Ilegal adalah wilayah atau area yang diidentifikasi sebagai lokasi dengan tingkat kejahatan tinggi, aktivitas kriminal aktif, atau tempat berkumpulnya organisasi ilegal.</p>
                <p className="mt-1">Patroli Zona Merah adalah kegiatan penjagaan, pengawasan, dan penegakan hukum oleh personel kepolisian di wilayah tersebut.</p>
            </div>
            <div>
                <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mb-2">- TUJUAN PATROLI</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>Menjaga keamanan dan ketertiban warga sipil di sekitar area rawan.</li>
                    <li>Mengawasi dan membatasi aktivitas kriminal atau transaksi ilegal.</li>
                    <li>Mengumpulkan informasi intelijen terkait pergerakan organisasi ilegal.</li>
                </ul>
            </div>
            <div>
                <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mb-2">- PERSYARATAN & PERSIAPAN</h3>
                <p className="text-red-600 italic">Setiap patroli ke zona merah WAJIB melaporkan nya di radio Dispatch Pusat / HT kepolisian.</p>
                <p className="mt-1">Minimal personel yang berangkat adalah 2 (dua) orang. Wajib menggunakan:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-1 text-xs">
                    <li>Seragam sesuai Divisi dan (vest).</li>
                    <li>Kendaraan dinas resmi.</li>
                    <li>Senjata dinas sesuai ketentuan standar.</li>
                    <li>Radio komunikasi aktif untuk koordinasi.</li>
                </ul>
            </div>
            <div>
                <h3 className="font-black bg-[#CCFF00] inline-block px-2 border-2 border-black mb-2 text-black">- AREA IZIN PATROLI SABHARA</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-100 p-4 border-2 border-black text-xs">
                    <p>✔️ Ladang Kanabis</p><p>✔️ Pengolahan Kanabis</p>
                    <p>✔️ Penjualan Marijuana</p><p>✔️ Pembuatan Sabu</p>
                    <p>✔️ Tempat Carstealing</p><p>✔️ Black Market</p>
                    <p>✔️ Pencucian Uang Merah</p><p>✔️ Hewan Ilegal</p>
                </div>
            </div>
            <div>
                <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mb-2">- TATA CARA RADIO</h3>
                <div className="bg-slate-900 text-white p-4 border-2 border-black font-mono text-xs space-y-2">
                    <p><span className="text-[#CCFF00]">Berangkat:</span> "Izin, unit TANGGUH-03 melakukan pengecekan di tempat ladang kanabis."</p>
                    <p><span className="text-[#FF4D4D]">Suspect:</span> "Izin melaporkan, unit TANGGUH-03 terdapat warga yang sedang mencabut kanabis, butuh backup!"</p>
                    <p><span className="text-blue-400">Clear:</span> "Izin melaporkan, unit TANGGUH-03 untuk ladang kanabis CLEAR, lanjut patroli."</p>
                </div>
                <div className="bg-amber-100 border-l-4 border-amber-500 p-3 mt-3 italic text-xs">
                    *Note: Ketika unit lain sudah melakukan patroli di zona merah tersebut, kasih jeda waktu 15 menit baru bisa melakukan patroli kembali (Respect terhadap Badside).*
                </div>
            </div>
        </div>
    );
}

function SabharaTab2() {
    return (
        <div className="space-y-4 font-bold">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-100 p-3 border-2 border-black shadow-[4px_4px_0_0_#000]">
                    <h3 className="font-black uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Sultan Dinas</h3>
                    <p className="text-xs">Digunakan untuk patroli rutin, respon laporan, pengawalan ringan. Max 4 orang.</p>
                </div>
                <div className="bg-slate-100 p-3 border-2 border-black shadow-[4px_4px_0_0_#000]">
                    <h3 className="font-black uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">LSPD / LVPD</h3>
                    <p className="text-xs">Patroli rutin di daerah Los Santos / Las Venturas sekitarnya. Respon & pengawalan ringan.</p>
                </div>
                <div className="bg-slate-100 p-3 border-2 border-black shadow-[4px_4px_0_0_#000]">
                    <h3 className="font-black uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Sanchez Dinas</h3>
                    <p className="text-xs">Patroli area sempit, pengaturan lalin, dan pengejaran jarak pendek.</p>
                </div>
            </div>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">- TATA CARA & LARANGAN</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Lampu rotator & sirine HANYA untuk respon darurat, pengejaran, pengamanan.</li>
                <li>Dilarang menggunakan kendaraan dinas untuk kepentingan pribadi.</li>
                <li>Dilarang mengemudi ugal-ugalan (No fear driving) & Cop Baiting.</li>
                <li>Operasi Zona Merah wajib minimal 1 kendaraan & radio aktif.</li>
            </ul>
        </div>
    );
}

function SabharaTab3() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-sm font-bold">
            <div className="bg-green-50 p-3 border-2 border-black">
                <h3 className="font-black uppercase mb-2 border-b border-black pb-1">A. Wajib</h3>
                <ul className="text-xs space-y-1 list-disc pl-4">
                    <li>Seragam & ID Card</li>
                    <li>Radio komunikasi</li>
                    <li>Borgol</li>
                    <li>Paper Can / Spray</li>
                    <li>Baton & Taser</li>
                    <li>Sidearm</li>
                </ul>
            </div>
            <div className="bg-blue-50 p-3 border-2 border-black">
                <h3 className="font-black uppercase mb-2 border-b border-black pb-1">B. Pendukung</h3>
                <ul className="text-xs space-y-1 list-disc pl-4">
                    <li>Rompi (Vest)</li>
                    <li>Senter taktis</li>
                    <li>Bodycam (RP)</li>
                    <li>Utility belt</li>
                    <li>Bandage & Pill Stress</li>
                </ul>
            </div>
            <div className="bg-red-50 p-3 border-2 border-black">
                <h3 className="font-black uppercase mb-2 border-b border-black pb-1">C. Khusus</h3>
                <ul className="text-xs space-y-1 list-disc pl-4">
                    <li>Long Weapon (Wajib izin Command)</li>
                    <li>Tameng & Helm Dalmas</li>
                    <li>Spike strip</li>
                </ul>
            </div>
        </div>
    );
}

function SabharaTab4() {
    const [imgError, setImgError] = useState(false);
    return (
        <div className="text-center">
            <div className="w-full max-w-sm mx-auto bg-slate-200 border-[6px] border-black flex flex-col items-center justify-center relative overflow-hidden shadow-[8px_8px_0_0_#000] mb-4" style={{ aspectRatio: '3/4' }}>
                {imgError ? (
                    <div className="text-center p-4">
                        <p className="font-black italic text-slate-500">IMAGE NOT FOUND</p>
                        <p className="text-xs font-bold text-slate-400 mt-2">public/images/sabhara-seragam.png</p>
                    </div>
                ) : (
                    <img
                        src="/images/sabhara-seragam.png"
                        alt="Seragam Sabhara"
                        className="object-cover w-full h-full"
                        onError={() => setImgError(true)}
                    />
                )}
            </div>
            <div className="bg-red-100 border-2 border-red-600 p-3 font-bold text-xs text-red-800 text-left">
                <span className="font-black uppercase">NOTE:</span> DILARANG MENGGUNAKAN ATRIBUTE YANG BUKAN MILIK KEPOLISIAN. BOLEH MEMAKAI KACAMATA SERTA WIG TAPI TETAP JANGAN BERLEBIHAN.
            </div>
        </div>
    );
}

function SabharaTab5() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-slate-800 border-2 border-black p-3 text-white shadow-[4px_4px_0_0_#000]">
                <h3 className="font-black text-[#00E676] mb-1">GANJA / CANABIS</h3>
                <p>• Polisi max 6 + (2 Backup jika suspect call)</p>
                <p>• Suspect min 2 max 4 + (2 Backup)</p>
                <p>• Senjata: SLC, DE, Shotgun</p>
                <p>• Dilarang Heli & Refill Kevlar saat perang.</p>
            </div>
            <div className="bg-slate-800 border-2 border-black p-3 text-white shadow-[4px_4px_0_0_#000]">
                <h3 className="font-black text-[#FF90E8] mb-1">CARSTEALING</h3>
                <p>• Polisi max 8 aktif</p>
                <p>• Suspect min 2 max 4</p>
                <p>• Dilarang Speed Hunter & Heli.</p>
                <p>• Max refill vest 1. DILARANG Bandage.</p>
            </div>
            <div className="bg-slate-800 border-2 border-black p-3 text-white shadow-[4px_4px_0_0_#000]">
                <h3 className="font-black text-[#FF4D4D] mb-1">BEGAL / PERAMPASAN</h3>
                <p>• Polisi max 6 (Boleh backup jika suspect backup)</p>
                <p>• Suspect max 4.</p>
                <p>• Dilarang Heli. Max refill vest 1. No Bandage.</p>
            </div>
            <div className="bg-slate-800 border-2 border-black p-3 text-white shadow-[4px_4px_0_0_#000]">
                <h3 className="font-black text-amber-400 mb-1">PERAMPOKAN MARKET</h3>
                <p>• Polisi max 7 aktif</p>
                <p>• Suspect min 3 max 6</p>
                <p>• Dilarang Heli. Max refill vest 1. No Bandage.</p>
            </div>
            <div className="bg-slate-800 border-2 border-black p-3 text-white shadow-[4px_4px_0_0_#000] md:col-span-2">
                <h3 className="font-black text-blue-400 mb-1">PERAMPOKAN BANK</h3>
                <p className="mb-2"><span className="text-[#FFD100]">FLEECA:</span> Polisi max 10. Suspect min 6 max 10. (SLC, DE, Shotgun). No Heli. Max refill 1.</p>
                <p><span className="text-red-400">BESAR:</span> Polisi max 15. Suspect min 6 max 15. Polisi ALL weapon. Suspect (AK 3, Uzi 3, Sniper 1). Heli Polisi max 1. Max refill 1.</p>
            </div>
        </div>
    );
}

function SabharaTab6() {
    return (
        <div className="space-y-4 font-bold text-sm text-slate-800">
            <p>SKCK adalah dokumen resmi yang menerangkan ada/tidaknya catatan kriminal warga. Bersifat administratif, bukan alat penangkapan.</p>
            <div className="bg-slate-100 p-4 border-2 border-black shadow-[4px_4px_0_0_#000]">
                <h3 className="font-black uppercase mb-1 border-b-2 border-black inline-block">Alur Pelayanan:</h3>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Sambut pemohon & cek KTP. (Tolak jika DPO).</li>
                    <li>Cek MDT (Riwayat 14 hari terakhir).</li>
                    <li>Berikan Invoice manual (Otot H).</li>
                    <li>Buat SKCK dengan format berikut:</li>
                </ol>
                <div className="bg-white border-2 border-black p-3 mt-3 font-mono text-xs text-blue-600 font-black tracking-tight">
                    /MakeSkck [ID] 14 TIDAK MEMILIKI CATATAN KRIMINAL KEPOLISIAN MANDALIKA
                </div>
            </div>
            <p className="text-red-600 italic text-xs">Dilarang mempersulit pemohon, meminta suap, atau membocorkan data MDT secara mendetail!</p>
        </div>
    );
}

function SabharaTab7() {
    return (
        <div className="space-y-4 font-bold text-sm text-slate-800">
            <p>Kode panggilan unik di radio untuk menjaga kerahasiaan identitas dan efisiensi.</p>
            <div className="bg-slate-900 text-white p-4 border-2 border-black rounded-xl inline-block shadow-[4px_4px_0_0_#000]">
                Callsign Divisi Sabhara: <span className="text-[#CCFF00] font-black tracking-widest text-lg ml-2">TANGGUH</span>
            </div>
            <div className="bg-slate-100 p-4 border-2 border-black mt-4 shadow-[4px_4px_0_0_#000]">
                <h3 className="font-black uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Hierarki Callsign</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>Kakorps / Komandan: <span className="text-black font-black">TURJAWALI - I</span></li>
                    <li>Dankorps / Wadan: <span className="text-black font-black">TURJAWALI - II</span></li>
                    <li>Anggota: <span className="text-black font-black">TANGGUH - 01, 02, 03...</span></li>
                </ul>
            </div>
            <div className="bg-amber-100 p-3 border-2 border-amber-500 text-xs italic mt-4">
                Wajib sebutkan "IZIN UNIT [CALLSIGN]" sebelum bicara. Dilarang sebut nama asli di radio!
            </div>
        </div>
    );
}

// ============================================================================
// ISI MATERI BRIMOB
// ============================================================================
function BrimobTab1() {
    return (
        <div className="space-y-4 font-bold text-sm text-slate-800">
            <p>BRIMOB (Brigade Mobil) adalah satuan khusus Kepolisian Mandalika yang bertugas menangani situasi keamanan berintensitas tinggi. Bertindak berdasarkan perintah komando dengan profesionalisme, disiplin, dan kepatuhan hukum yang absolut.</p>
            <div className="bg-slate-800 p-5 border-2 border-black shadow-[4px_4px_0_0_#000] mt-4">
                <h3 className="font-black text-[#CCFF00] mb-3 uppercase tracking-widest border-b-2 border-[#CCFF00]/30 pb-1">Tujuan Operasional:</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-200 text-xs">
                    <li>Pemulihan dan menjaga keamanan masyarakat.</li>
                    <li>Menanggulangi kejahatan kriminalitas bersenjata, ancaman terorisme, dan kerusuhan kota.</li>
                    <li>Mendukung tugas kepolisian melalui tindakan cepat, tegas, dan terukur.</li>
                </ul>
            </div>
        </div>
    );
}

function BrimobTab2() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-sm font-bold text-slate-800">
            <div className="bg-slate-50 p-4 border-2 border-black shadow-[4px_4px_0_0_#000]">
                <h3 className="font-black uppercase text-red-600 border-b-2 border-black pb-1 mb-2">1. SDM Terlatih</h3>
                <p className="text-xs">Personel khusus dengan kemampuan taktis, fisik, mental, dan disiplin tinggi untuk situasi ekstrem.</p>
            </div>
            <div className="bg-slate-50 p-4 border-2 border-black shadow-[4px_4px_0_0_#000]">
                <h3 className="font-black uppercase text-red-600 border-b-2 border-black pb-1 mb-2">2. Sarana & Prasarana</h3>
                <p className="text-xs">Kendaraan taktis, alat Dalmas, perlengkapan taktis khusus untuk penanganan ancaman bersenjata.</p>
            </div>
            <div className="bg-slate-50 p-4 border-2 border-black shadow-[4px_4px_0_0_#000]">
                <h3 className="font-black uppercase text-red-600 border-b-2 border-black pb-1 mb-2">3. Sistem Komando</h3>
                <p className="text-xs">Struktur komando hierarki yang jelas serta komunikasi operasional terenkripsi/cepat.</p>
            </div>
            <div className="bg-slate-50 p-4 border-2 border-black shadow-[4px_4px_0_0_#000]">
                <h3 className="font-black uppercase text-red-600 border-b-2 border-black pb-1 mb-2">4. Logistik</h3>
                <p className="text-xs">Dukungan penuh untuk kesiapan operasional, amunisi, dan keberlangsungan tugas satuan.</p>
            </div>
        </div>
    );
}

function BrimobTab3() {
    return (
        <div className="space-y-4 font-bold text-sm text-slate-800">
            <p>Melaksanakan fungsi kepolisian berintensitas tinggi untuk memulihkan keamanan:</p>
            <ol className="list-decimal list-inside space-y-3 bg-slate-100 p-5 border-2 border-black shadow-[4px_4px_0_0_#000]">
                <li>Menanggulangi kejahatan berisiko tinggi dan bersenjata api berat.</li>
                <li>Penanganan kerusuhan massa dan gangguan keamanan skala besar.</li>
                <li>Penanggulangan aksi teror dan ancaman khusus kota.</li>
                <li>Pengamanan objek vital (Bank Pusat/Fasilitas Negara).</li>
                <li>Operasi taktis khusus sesuai instruksi Pimpinan Tertinggi.</li>
                <li>Bantuan gempur/operasional kepada divisi Sabhara & Satlantas.</li>
            </ol>
        </div>
    );
}

function BrimobTab4() {
    return (
        <div className="flex flex-col md:flex-row gap-4 font-bold text-sm text-slate-800">
            <div className="flex-1 bg-blue-50 border-2 border-black shadow-[4px_4px_0_0_#000] p-5">
                <h3 className="font-black uppercase text-blue-800 text-lg border-b-2 border-black pb-1 mb-3">Roda 4 (Ransus)</h3>
                <ul className="list-disc list-inside text-xs space-y-2">
                    <li><span className="text-black font-black bg-blue-200 px-1">Sultan:</span> Minimal 2 Orang</li>
                    <li><span className="text-black font-black bg-blue-200 px-1">Baracuda / Enforcer:</span> Minimal 4 Orang</li>
                </ul>
            </div>
            <div className="flex-1 bg-green-50 border-2 border-black shadow-[4px_4px_0_0_#000] p-5">
                <h3 className="font-black uppercase text-green-800 text-lg border-b-2 border-black pb-1 mb-3">Roda 2</h3>
                <ul className="list-disc list-inside text-xs space-y-2">
                    <li><span className="text-black font-black bg-green-200 px-1">Motor Trail / Patroli:</span> Diharapkan 1 orang per kendaraan untuk menjaga mobilitas dan fleksibilitas pengejaran.</li>
                </ul>
            </div>
        </div>
    );
}

function BrimobTab5() {
    return (
        <div className="bg-slate-900 text-white border-[4px] border-black shadow-[8px_8px_0_0_#FFD100] p-8 text-center h-full flex flex-col justify-center">
            <ShieldAlert size={64} className="mx-auto text-[#FF4D4D] mb-4" />
            <p className="font-sans text-sm md:text-base font-bold max-w-lg mx-auto leading-relaxed text-slate-300">
                Korps BRIMOB merupakan satuan elit yang memiliki peran strategis. Melalui SOP ini, personel dituntut memiliki <span className="text-[#CCFF00]">kesiapsiagaan, integritas, dan tanggung jawab tinggi.</span> Eksekusi cepat, terukur, dan mematikan (jika diperlukan) dengan tetap mengedepankan hierarki komando dan kehormatan institusi Kepolisian Mandalika.
            </p>
        </div>
    );
}

// ============================================================================
// ISI MATERI SATLANTAS (Sama persis dengan kode aslinya, dipecah untuk ContentArea)
// ============================================================================
function SatlantasTab1() {
    return (
        <div className="space-y-4 font-bold">
            <p className="bg-slate-100 p-3 border-2 border-black italic">Satlantas bertugas mengatur, mengawasi, dan menegakkan hukum lalu lintas secara profesional untuk mewujudkan Kamseltibcarlantas yang Kondusif di Kota Mandalika.</p>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-2">I. TUGAS UTAMA</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li><span className="text-black">Patroli:</span> Meliputi area dalam dan luar kota.</li>
                <li><span className="text-black">Gatur & Wal:</span> Pengaturan arus, penjagaan, dan pengawalan.</li>
                <li><span className="text-black">Dakgar:</span> Penindakan pelanggaran lalu lintas.</li>
                <li><span className="text-black">Laka Lantas:</span> Penanganan kecelakaan dan edukasi masyarakat.</li>
            </ul>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-2">II. PENINDAKAN & LAKA LANTAS</h3>
            <p>Dalam menangani kecelakaan, anggota <span className="text-red-600">WAJIB</span>:</p>
            <ol className="list-decimal pl-5 space-y-1">
                <li>Mengamankan TKP dan mengatur arus lalu lintas di sekitar.</li>
                <li>Memberikan pertolongan pertama kepada korban.</li>
                <li>Melakukan penilangan sesuai pasal yang dilanggar.</li>
                <li>Menyusun laporan kejadian secara lengkap dan akurat.</li>
            </ol>

            <h3 className="font-black bg-[#CCFF00] inline-block px-2 border-2 border-black mt-2">III. PENANGANAN KASUS KRIMINAL</h3>
            <p className="text-xs">Satlantas dapat membantu penanganan suspect apabila jumlah suspect ≥ Personel Sabhara/Brimob di lapangan.</p>
            <div className="bg-yellow-50 p-3 border-l-4 border-yellow-500 text-xs mt-2">
                <span className="font-black text-black">KETENTUAN:</span> Wajib koordinasi radio, fokus pengamanan area/arus lalin, dan <span className="text-red-600">DILARANG</span> menangani kasus kriminal jika TIDAK ADA Sabhara/Brimob di TKP.
            </div>
        </div>
    );
}

function SatlantasTab2() {
    return (
        <div className="space-y-4 font-bold">
            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black">I. PROSEDUR PENERBITAN SIM</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs mt-1">
                <li><span className="text-black">Identitas:</span> Wajib KTP sah.</li>
                <li><span className="text-black">Klasifikasi:</span> SIM A (Mobil), SIM B (Truk/Bus), SIM C (Motor).</li>
                <li><span className="text-black">Pembayaran:</span> Gunakan invoice manual (Otot H).</li>
            </ul>
            <div className="bg-slate-900 text-white p-2 border-2 border-black font-mono text-xs inline-block mt-1">/givelic [ID_PLAYER]</div>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4 block w-max">II. PEMASANGAN PLATE</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs mt-1">
                <li><span className="text-black">Verifikasi:</span> Unit Mobil wajib SIM A, Unit Motor wajib SIM C. Kepemilikan wajib legal.</li>
            </ul>
            <div className="bg-slate-900 text-white p-2 border-2 border-black font-mono text-xs inline-block mt-1">/makeplate [ID_KENDARAAN]</div>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4 block w-max">III. PENGAMBILAN IMPOUND</h3>
            <ol className="list-decimal pl-5 space-y-1 text-xs mt-1">
                <li>Dekati titik penyimpanan impound (sebelah garasi).</li>
                <li>Tekan tombol [Y] dan masukkan ID Player pemilik.</li>
                <li>Verifikasi durasi, berikan Invoice, lalu keluarkan kendaraan setelah dibayar.</li>
            </ol>
            <div className="bg-red-50 p-3 border-2 border-red-500 mt-2 text-xs">
                <span className="font-black text-red-700">⚠️ CATATAN:</span> Jangan proses jika tidak kooperatif. Pastikan uang diterima sebelum eksekusi CMD.
            </div>
        </div>
    );
}

function SatlantasTab3() {
    return (
        <div className="space-y-4 font-bold text-sm">
            <p className="bg-slate-100 p-3 border-2 border-black italic">OBJEKTIF: Menjamin keamanan, ketertiban, dan tanggung jawab penuh terhadap aset dinas kepolisian.</p>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-2">I. KETENTUAN UMUM</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li><span className="text-blue-600">DINAS ONLY:</span> Hanya untuk operasional resmi.</li>
                <li><span className="text-blue-600">AKUNTABILITAS:</span> Tanggung jawab penuh pada pengambil unit.</li>
            </ul>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">II. PROTOKOL PENGELUARAN</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li><span className="text-green-600">BUDDY SYSTEM:</span> Minimal 2 personel per unit.</li>
                <li><span className="text-green-600">STERILISASI:</span> Dilarang meminjamkan unit ke sipil.</li>
            </ul>

            <div className="bg-red-100 p-3 border-l-4 border-red-600 mt-4 text-xs">
                <span className="font-black text-red-800">LARANGAN & SANKSI:</span> Mengalihkan kendali tanpa izin atau pemakaian di luar jam dinas akan disanksi (Teguran, Grounding, Demosi, PTDH).
            </div>
        </div>
    );
}

function SatlantasTab4() {
    return (
        <div className="space-y-4 font-bold text-sm">
            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black">I. SIKAP DAN PERILAKU</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li><span className="text-blue-600">Etika:</span> Sopan, tegas, profesional ke masyarakat.</li>
                <li><span className="text-blue-600">Dual-Life:</span> Jaga etika In-Character (IC) maupun Out-of-Character (OOC).</li>
            </ul>

            <h3 className="font-black bg-red-200 inline-block px-2 border-2 border-black mt-4">II. INTEGRITAS (DILARANG KERAS!)</h3>
            <ol className="list-decimal pl-5 space-y-1 text-red-700">
                <li>Menerima suap atau gratifikasi.</li>
                <li>Menyalahgunakan wewenang jabatan.</li>
                <li>Memanipulasi laporan/data kepolisian.</li>
            </ol>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">III. DISIPLIN TUGAS</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Wajib mematuhi SOP operasional & Aktif patroli.</li>
                <li>Menjaga inventaris unit kendaraan.</li>
            </ul>
        </div>
    );
}

function SatlantasTab5() {
    return (
        <div className="space-y-4 font-bold text-sm">
            <div className="bg-slate-900 text-white p-3 border-2 border-black font-mono text-xs">
                Callsign digunakan untuk UNIT KENDARAAN, bukan untuk nama pribadi.
            </div>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-2">I. CONTOH KOMUNIKASI</h3>
            <ul className="list-none space-y-2 text-xs font-mono bg-slate-100 p-3 border-2 border-black mt-1">
                <li>&gt; "Mabes 00, unit PJR-01 izin lingkar-lingkar di area Los Santos."</li>
                <li>&gt; "Mabes 00, unit PJR-12 izin melakukan pengecekan di area ladang."</li>
            </ul>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">II. KETENTUAN UNIT</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Patroli wajib unit Cruiser LSPD, LVPD, SFPD.</li>
                <li>Anggota dilarang berpindah unit tanpa izin/darurat.</li>
            </ul>

            <h3 className="font-black bg-[#CCFF00] inline-block px-2 border-2 border-black mt-4">III. PENGOSONGAN CALLSIGN</h3>
            <p className="text-xs mt-1">Jika anggota resign/diberhentikan, callsign DIKOSONGKAN. Penyesuaian dilakukan berurutan saat ada penambahan anggota baru (Shift up).</p>
        </div>
    );
}

function SatlantasTab6() {
    return (
        <div className="space-y-4 font-bold text-sm">
            <div className="bg-slate-100 p-3 border-2 border-black italic text-xs">
                SOP Impound dilakukan secara On-Site (Di Tempat). Tidak ada kendaraan yang dibawa ke kantor polisi (No Towing).
            </div>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-2">I. KRITERIA IMPOUND</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Menghalangi arus lalu lintas (Tengah jalan).</li>
                <li>Parkir sembarangan (Trotoar, jalur hijau).</li>
                <li>Ditinggal pemilik di area terlarang.</li>
            </ul>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">II. PEMERIKSAAN WAJIB</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li><span className="text-blue-600">Cek Fisik:</span> Plat nomor & kondisi.</li>
                <li><span className="text-blue-600">Penggeledahan:</span> Bagasi & Holster. Barang ilegal wajib disita.</li>
            </ul>

            <div className="bg-red-50 p-3 border-2 border-red-500 mt-4 text-xs">
                <span className="font-black text-red-700">⚠️ DENDA & DURASI:</span> Mengacu pada regulasi resmi Discord. Anggota dilarang keras menentukan denda/durasi secara sepihak!
            </div>
        </div>
    );
}

function SatlantasTab7() {
    return (
        <div className="space-y-4 font-bold text-sm">
            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black">I. BUDDY SYSTEM</h3>
            <ul className="list-disc pl-5 space-y-1 mt-1">
                <li><span className="text-red-600">LARANGAN SOLO:</span> Tidak diperkenankan patroli mandiri.</li>
                <li>Minimal 2 personel per unit (1 Driver & 1 Co-Driver).</li>
            </ul>

            <h3 className="font-black bg-[#CCFF00] inline-block px-2 border-2 border-black mt-4">II. DISTRIBUSI WILAYAH</h3>
            <div className="grid grid-cols-1 gap-3 mt-2 text-xs">
                <div className="bg-slate-100 p-3 border-2 border-black shadow-[4px_4px_0_0_#000]">
                    <span className="font-black uppercase text-blue-600 border-b-2 border-black pb-1 mb-1 block">A. Urban (Perkotaan)</span>
                    <p>Unit: Cruiser LSPD / Sultan. Fokus: Pengaturan arus lalin.</p>
                </div>
                <div className="bg-slate-100 p-3 border-2 border-black shadow-[4px_4px_0_0_#000]">
                    <span className="font-black uppercase text-blue-600 border-b-2 border-black pb-1 mb-1 block">B. Rural (Luar Kota)</span>
                    <p>Unit: Cruiser LVPD / SFPD. Fokus: Pengawasan jalur vital.</p>
                </div>
            </div>

            <h3 className="font-black bg-[#FF9000] inline-block px-2 border-2 border-black mt-4">III. UNIT KHUSUS: SPEED HUNTER (CHEETAH)</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs mt-1">
                <li>Digunakan saat Darurat (Perampokan) & Pengejaran Prioritas.</li>
                <li className="text-red-600">Wajib mendapat izin atasan & tetap minimal 2 personel.</li>
            </ul>
        </div>
    );
}