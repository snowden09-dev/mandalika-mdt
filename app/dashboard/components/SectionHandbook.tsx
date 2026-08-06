"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, ShieldAlert, AlertOctagon, Car, Crosshair,
    FileText, Radio, CheckCircle2, AlertTriangle, Users, Target, Siren, Construction, ChevronRight
} from 'lucide-react';

interface SectionHandbookProps {
    divisi: string;
    isPetinggi?: boolean;
}

export default function SectionHandbook({ divisi, isPetinggi = false }: SectionHandbookProps) {
    const [viewDivisi, setViewDivisi] = useState(divisi?.toUpperCase() || "UNIT");

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
            className="w-full max-w-6xl mx-auto space-y-6 text-zinc-300 font-sans"
        >
            {/* FITUR KHUSUS PETINGGI: SELECTOR DIVISI */}
            {isPetinggi && (
                <div className="bg-zinc-900/50 backdrop-blur-md border border-red-900/30 rounded-2xl p-6 shadow-lg shadow-black/50 mb-6">
                    <p className="text-xs font-semibold uppercase text-red-500 mb-4 tracking-[0.2em] flex items-center gap-2">
                        <ShieldAlert size={14} />
                        Otoritas Tinggi Terdeteksi: Akses Seluruh Divisi
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {['SABHARA', 'SATLANTAS', 'BRIMOB', 'PROPAM'].map((divName) => (
                            <button
                                key={divName}
                                onClick={() => setViewDivisi(divName)}
                                className={`px-5 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all duration-300 border ${viewDivisi === divName
                                        ? 'bg-red-900/20 text-red-400 border-red-700/50 shadow-[0_0_15px_rgba(185,28,28,0.15)]'
                                        : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-200 hover:border-red-900/30'
                                    }`}
                            >
                                {divName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* HEADER HANDBOOK */}
            <div className="bg-[#121212] border border-red-900/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-light tracking-wide text-zinc-100 flex items-center gap-4">
                        <BookOpen size={32} className="text-red-600" />
                        BUKU SAKU <span className="font-semibold text-white">DIVISI</span>
                    </h1>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mt-2">
                        Dokumen Internal Resmi Kepolisian Mandalika
                    </p>
                </div>
                
                <div className="bg-zinc-900 border border-red-900/30 rounded-xl px-6 py-4 relative z-10 shadow-inner">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-red-500/70 mb-1">Akses Terkunci Untuk:</p>
                    <p className="text-xl font-bold uppercase tracking-widest text-white">{viewDivisi}</p>
                </div>
            </div>

            {/* RENDER KONTEN BERDASARKAN DIVISI */}
            {viewDivisi === "SABHARA" && <HandbookSabhara />}
            {viewDivisi === "BRIMOB" && <HandbookBrimob />}
            {viewDivisi === "SATLANTAS" && <HandbookSatlantas />}
            {viewDivisi === "PROPAM" && <HandbookPropam />}

            {/* FALLBACK JIKA DIVISI BELUM ADA HANDBOOK-NYA */}
            {viewDivisi !== "SABHARA" && viewDivisi !== "BRIMOB" && viewDivisi !== "SATLANTAS" && viewDivisi !== "PROPAM" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center shadow-lg">
                    <AlertTriangle size={48} className="mx-auto text-zinc-600 mb-6" />
                    <h2 className="text-xl font-light tracking-widest text-zinc-300">DATA BELUM TERSEDIA</h2>
                    <p className="text-zinc-500 mt-3 text-sm">Buku saku untuk divisi {viewDivisi} sedang dalam tahap penyusunan.</p>
                </div>
            )}
        </motion.div>
    );
}

function indexToRoman(num: number) {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[num - 1] || num;
}

// ============================================================================
// 🚓 KOMPONEN HANDBOOK SABHARA
// ============================================================================
function HandbookSabhara() {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, title: "Zona Merah / Ilegal", icon: <AlertOctagon size={18} /> },
        { id: 1, title: "Kendaraan Dinas", icon: <Car size={18} /> },
        { id: 2, title: "Perlengkapan Tugas", icon: <ShieldAlert size={18} /> },
        { id: 3, title: "Atribut On Duty", icon: <Users size={18} /> },
        { id: 4, title: "Penanganan Kriminal", icon: <Crosshair size={18} /> },
        { id: 5, title: "Pembuatan SKCK", icon: <FileText size={18} /> },
        { id: 6, title: "Radio & Callsign", icon: <Radio size={18} /> },
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
// 🚁 KOMPONEN HANDBOOK BRIMOB
// ============================================================================
function HandbookBrimob() {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, title: "SOP BRIMOB", icon: <Target size={18} /> },
        { id: 1, title: "Sumber Daya", icon: <ShieldAlert size={18} /> },
        { id: 2, title: "Tugas Pokok", icon: <CheckCircle2 size={18} /> },
        { id: 3, title: "Patroli Khusus", icon: <Car size={18} /> },
        { id: 4, title: "Kesimpulan", icon: <BookOpen size={18} /> },
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
// 🚦 KOMPONEN HANDBOOK SATLANTAS
// ============================================================================
function HandbookSatlantas() {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, title: "Tugas Utama", icon: <Siren size={18} /> },
        { id: 1, title: "Pelayanan Publik", icon: <FileText size={18} /> },
        { id: 2, title: "Unit Dinas", icon: <Car size={18} /> },
        { id: 3, title: "Kode Etik", icon: <ShieldAlert size={18} /> },
        { id: 4, title: "Radio & Callsign", icon: <Radio size={18} /> },
        { id: 5, title: "SOP Impound", icon: <Target size={18} /> },
        { id: 6, title: "Pola Patroli", icon: <Crosshair size={18} /> },
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
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#121212] border border-red-900/50 rounded-3xl p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-[#121212] to-[#121212] pointer-events-none"></div>
                <div className="relative z-10">
                    <Construction size={56} className="mx-auto text-red-600 mb-6 opacity-80" />
                    <h2 className="text-2xl md:text-3xl font-light tracking-[0.3em] text-white mb-4">RESTRICTED AREA</h2>
                    <h3 className="text-sm font-semibold tracking-widest text-red-400 bg-red-950/30 inline-block px-4 py-2 rounded-full border border-red-900/50 mb-6">DIVISI PROPAM</h3>
                    <p className="text-zinc-400 font-light text-sm md:text-base leading-relaxed mb-8">
                        SOP dan Regulasi internal Divisi Profesi dan Pengamanan (PROPAM) sedang dalam tahap finalisasi oleh Komando Tertinggi dan Tim Perumus Kebijakan Mandalika.
                    </p>
                    <div className="bg-red-900/20 text-red-500 font-semibold tracking-widest text-xs py-3 px-6 rounded-lg border border-red-900/30 inline-block">
                        STATUS: DALAM PENYUSUNAN
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ============================================================================
// REUSABLE UI COMPONENTS
// ============================================================================

function SidebarTabs({ tabs, activeTab, setActiveTab }: { tabs: any[], activeTab: number, setActiveTab: (i: number) => void }) {
    return (
        <div className="w-full md:w-1/3 shrink-0 flex flex-col gap-2">
            {tabs.map((tab, index) => {
                const isActive = activeTab === index;
                return (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 text-left font-medium tracking-wide text-sm ${
                            isActive
                                ? 'bg-gradient-to-r from-red-950/50 to-transparent border-l-2 border-red-600 text-white shadow-lg shadow-black/20'
                                : 'bg-zinc-900/40 border border-transparent text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <span className={`${isActive ? 'text-red-500' : 'text-zinc-600'}`}>
                                {tab.icon}
                            </span>
                            <span>{tab.title}</span>
                        </div>
                        {isActive && <ChevronRight size={16} className="text-red-600" />}
                    </button>
                );
            })}
        </div>
    );
}

function ContentArea({ tabs, activeTab, children }: { tabs: any[], activeTab: number, children: React.ReactNode }) {
    return (
        <div className="w-full md:w-2/3 bg-[#121212] border border-zinc-800 rounded-2xl shadow-xl min-h-[500px] flex flex-col overflow-hidden relative">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-red-900/50 to-transparent"></div>
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col"
                >
                    <div className="border-b border-zinc-800/80 p-6 flex items-center gap-4 bg-zinc-900/20">
                        <span className="p-2 bg-red-950/40 text-red-500 rounded-lg border border-red-900/20">
                            {tabs[activeTab].icon}
                        </span>
                        <h2 className="text-lg font-semibold tracking-wide text-zinc-100">
                            <span className="text-red-600 mr-2">{indexToRoman(activeTab + 1)}.</span>
                            {tabs[activeTab].title}
                        </h2>
                    </div>
                    <div className="p-6 md:p-8 font-light text-sm text-zinc-400 h-full leading-relaxed">
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
        <div className="space-y-6">
            <div>
                <h3 className="text-white font-medium mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> PENGERTIAN UMUM</h3>
                <p>Zona Merah / Zona Ilegal adalah wilayah atau area yang diidentifikasi sebagai lokasi dengan tingkat kejahatan tinggi, aktivitas kriminal aktif, atau tempat berkumpulnya organisasi ilegal.</p>
                <p className="mt-2 text-zinc-500">Patroli Zona Merah adalah kegiatan penjagaan, pengawasan, dan penegakan hukum oleh personel kepolisian di wilayah tersebut.</p>
            </div>
            
            <div className="h-px w-full bg-zinc-800"></div>
            
            <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> PERSYARATAN & PERSIAPAN</h3>
                <p className="text-red-400 text-xs mb-3">Setiap patroli ke zona merah WAJIB melaporkannya di radio Dispatch Pusat / HT kepolisian.</p>
                <ul className="space-y-2 text-zinc-400 text-sm bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                    <li className="flex gap-3"><span className="text-red-600">▪</span> Seragam sesuai Divisi dan (vest).</li>
                    <li className="flex gap-3"><span className="text-red-600">▪</span> Kendaraan dinas resmi.</li>
                    <li className="flex gap-3"><span className="text-red-600">▪</span> Senjata dinas sesuai ketentuan standar.</li>
                    <li className="flex gap-3"><span className="text-red-600">▪</span> Radio komunikasi aktif untuk koordinasi.</li>
                </ul>
            </div>

            <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> AREA IZIN PATROLI SABHARA</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {['Ladang Kanabis', 'Pengolahan Kanabis', 'Penjualan Marijuana', 'Pembuatan Sabu', 'Tempat Carstealing', 'Black Market', 'Pencucian Uang', 'Hewan Ilegal'].map(item => (
                        <div key={item} className="bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800/80 text-zinc-400">
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-red-950/10 border border-red-900/30 p-4 rounded-xl mt-4 text-xs">
                <span className="text-red-500 font-medium">Catatan Radio:</span> "Izin, unit TANGGUH-03 melakukan pengecekan di tempat ladang kanabis." Berikan jeda waktu 15 menit jika unit lain sudah berpatroli (Respect terhadap Badside).
            </div>
        </div>
    );
}

function SabharaTab2() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50 hover:border-red-900/30 transition-colors">
                    <h3 className="text-white font-medium mb-2 border-b border-zinc-800 pb-2">Sultan Dinas</h3>
                    <p className="text-xs text-zinc-500">Digunakan untuk patroli rutin, respon laporan, pengawalan ringan. Maksimal 4 personel.</p>
                </div>
                <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50 hover:border-red-900/30 transition-colors">
                    <h3 className="text-white font-medium mb-2 border-b border-zinc-800 pb-2">LSPD / LVPD</h3>
                    <p className="text-xs text-zinc-500">Patroli rutin di daerah Los Santos / Las Venturas sekitarnya. Respon & pengawalan ringan.</p>
                </div>
                <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50 hover:border-red-900/30 transition-colors md:col-span-2">
                    <h3 className="text-white font-medium mb-2 border-b border-zinc-800 pb-2">Sanchez Dinas</h3>
                    <p className="text-xs text-zinc-500">Patroli area sempit, pengaturan lalin, dan pengejaran jarak pendek.</p>
                </div>
            </div>

            <div className="bg-red-950/20 border-l-2 border-red-700 p-5 rounded-r-xl">
                <h3 className="text-white font-medium mb-2">Tata Cara & Larangan</h3>
                <ul className="space-y-2 text-zinc-400 text-xs">
                    <li className="flex gap-3"><span className="text-red-600">▪</span> Lampu rotator & sirine HANYA untuk respon darurat dan pengejaran.</li>
                    <li className="flex gap-3"><span className="text-red-600">▪</span> Dilarang menggunakan kendaraan dinas untuk kepentingan pribadi.</li>
                    <li className="flex gap-3"><span className="text-red-600">▪</span> Dilarang mengemudi ugal-ugalan (No fear driving) & Cop Baiting.</li>
                </ul>
            </div>
        </div>
    );
}

function SabharaTab3() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/30 p-5 border border-zinc-800 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-800"></div>
                <h3 className="text-white font-medium mb-3">Wajib</h3>
                <ul className="text-xs space-y-2 text-zinc-400">
                    <li>▪ Seragam & ID Card</li>
                    <li>▪ Radio komunikasi</li>
                    <li>▪ Borgol & Taser</li>
                    <li>▪ Sidearm (Pistol)</li>
                </ul>
            </div>
            <div className="bg-zinc-900/30 p-5 border border-zinc-800 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-600"></div>
                <h3 className="text-white font-medium mb-3">Pendukung</h3>
                <ul className="text-xs space-y-2 text-zinc-400">
                    <li>▪ Rompi (Vest)</li>
                    <li>▪ Senter taktis</li>
                    <li>▪ Bodycam</li>
                    <li>▪ Bandage & Pill Stress</li>
                </ul>
            </div>
            <div className="bg-red-950/20 p-5 border border-red-900/30 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                <h3 className="text-red-400 font-medium mb-3">Khusus</h3>
                <ul className="text-xs space-y-2 text-zinc-400">
                    <li>▪ Long Weapon (Izin Command)</li>
                    <li>▪ Tameng & Helm Dalmas</li>
                    <li>▪ Spike strip</li>
                </ul>
            </div>
        </div>
    );
}

function SabharaTab4() {
    const [imgError, setImgError] = useState(false);
    return (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden mb-6" style={{ aspectRatio: '3/4' }}>
                {imgError ? (
                    <div className="text-center p-6">
                        <Users size={32} className="mx-auto text-zinc-700 mb-2" />
                        <p className="text-xs text-zinc-500">Visualisasi Seragam tidak tersedia</p>
                    </div>
                ) : (
                    <img
                        src="/images/sabhara-seragam.png"
                        alt="Seragam Sabhara"
                        className="object-cover w-full h-full opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all"
                        onError={() => setImgError(true)}
                    />
                )}
            </div>
            <div className="w-full bg-red-950/30 border border-red-900/30 p-4 rounded-xl text-xs text-zinc-300">
                <span className="text-red-500 font-medium tracking-widest uppercase mr-2">Catatan:</span>
                Dilarang menggunakan atribut sipil atau kelompok lain saat bertugas. Aksesoris sewajarnya (kacamata diperbolehkan).
            </div>
        </div>
    );
}

function SabharaTab5() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-red-400 font-medium mb-3 border-b border-zinc-800 pb-2">GANJA / CANABIS</h3>
                <ul className="space-y-1.5 text-zinc-400">
                    <li>▪ Polisi maks 6 + (2 Backup Call)</li>
                    <li>▪ Suspect maks 4 + (2 Backup)</li>
                    <li>▪ Dilarang Heli & Refill Kevlar saat baku tembak.</li>
                </ul>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-red-400 font-medium mb-3 border-b border-zinc-800 pb-2">CARSTEALING</h3>
                <ul className="space-y-1.5 text-zinc-400">
                    <li>▪ Polisi maks 8 aktif</li>
                    <li>▪ Dilarang Speed Hunter & Heli.</li>
                    <li>▪ Maks refill vest 1x. No Bandage.</li>
                </ul>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 md:col-span-2">
                <h3 className="text-red-500 font-medium mb-3 border-b border-zinc-800 pb-2">PERAMPOKAN BANK</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <span className="text-white block mb-1">Bank Fleeca:</span>
                        <p className="text-zinc-500">Polisi maks 10. Suspect maks 10. (SLC, DE, Shotgun). No Heli. Refill maks 1.</p>
                    </div>
                    <div>
                        <span className="text-white block mb-1">Bank Besar (Utama):</span>
                        <p className="text-zinc-500">Polisi maks 15. Suspect maks 15. ALL weapon. Heli Polisi maks 1. Refill maks 1.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SabharaTab6() {
    return (
        <div className="space-y-6">
            <p className="text-zinc-300">SKCK adalah dokumen administratif resmi kepolisian, bukan surat penangkapan. Layani masyarakat dengan profesionalisme.</p>
            
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-white font-medium mb-4">Alur Pelayanan:</h3>
                <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-400">
                    <li>Sambut pemohon & verifikasi KTP (Tolak secara IC jika DPO).</li>
                    <li>Cek MDT (Riwayat 14 hari terakhir).</li>
                    <li>Berikan Invoice manual untuk administrasi.</li>
                    <li>Cetak SKCK dengan format sistem berikut:</li>
                </ol>
                <div className="bg-[#121212] border border-zinc-700/50 p-4 mt-4 rounded-lg font-mono text-xs text-red-400/80">
                    /MakeSkck [ID] 14 TIDAK MEMILIKI CATATAN KRIMINAL
                </div>
            </div>
        </div>
    );
}

function SabharaTab7() {
    return (
        <div className="space-y-6">
            <div className="bg-red-950/20 border border-red-900/30 p-6 rounded-2xl flex items-center justify-between">
                <div>
                    <p className="text-xs text-red-400/80 uppercase tracking-widest mb-1">Callsign Divisi Sabhara</p>
                    <p className="text-2xl font-light text-white tracking-[0.2em]">TANGGUH</p>
                </div>
                <Radio className="text-red-900/50" size={48} />
            </div>
            
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Hierarki Callsign</h3>
                <ul className="space-y-3 text-sm text-zinc-400">
                    <li className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>Kakorps / Komandan</span>
                        <span className="text-white">TURJAWALI - I</span>
                    </li>
                    <li className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>Dankorps / Wadan</span>
                        <span className="text-white">TURJAWALI - II</span>
                    </li>
                    <li className="flex justify-between">
                        <span>Anggota Operasional</span>
                        <span className="text-white">TANGGUH - 01, 02...</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}

// ============================================================================
// ISI MATERI BRIMOB
// ============================================================================
function BrimobTab1() {
    return (
        <div className="space-y-6">
            <p className="text-zinc-300 leading-relaxed text-sm">
                BRIMOB (Brigade Mobil) adalah satuan elit khusus Kepolisian Mandalika yang bertugas menangani situasi keamanan berintensitas tinggi. Bertindak berdasarkan perintah komando dengan kedisiplinan dan kepatuhan absolut.
            </p>
            <div className="bg-zinc-900/40 border-l-2 border-red-700 p-6 rounded-r-xl">
                <h3 className="text-white font-medium mb-3">Tujuan Operasional:</h3>
                <ul className="space-y-2 text-zinc-400 text-sm">
                    <li>▪ Penanggulangan kejahatan kriminalitas bersenjata.</li>
                    <li>▪ Penanganan ancaman terorisme dan kerusuhan kota.</li>
                    <li>▪ Mendukung kepolisian melalui tindakan cepat, tegas, dan taktis.</li>
                </ul>
            </div>
        </div>
    );
}

function BrimobTab2() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/30 p-5 border border-zinc-800 rounded-xl hover:border-red-900/30 transition-all">
                <h3 className="text-red-400 font-medium mb-2">1. SDM Terlatih</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Personel dengan kemampuan taktis, fisik, mental, dan kedisiplinan khusus untuk tekanan ekstrem.</p>
            </div>
            <div className="bg-zinc-900/30 p-5 border border-zinc-800 rounded-xl hover:border-red-900/30 transition-all">
                <h3 className="text-red-400 font-medium mb-2">2. Sarpras</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Kendaraan lapis baja, alat Dalmas, perlengkapan persenjataan khusus kelas berat.</p>
            </div>
            <div className="bg-zinc-900/30 p-5 border border-zinc-800 rounded-xl hover:border-red-900/30 transition-all">
                <h3 className="text-red-400 font-medium mb-2">3. Sistem Komando</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Struktur hierarki komando absolut serta komunikasi operasional terenkripsi.</p>
            </div>
            <div className="bg-zinc-900/30 p-5 border border-zinc-800 rounded-xl hover:border-red-900/30 transition-all">
                <h3 className="text-red-400 font-medium mb-2">4. Logistik</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Dukungan penuh untuk kesiapan amunisi dan keberlangsungan operasi jangka panjang.</p>
            </div>
        </div>
    );
}

function BrimobTab3() {
    return (
        <div className="space-y-4">
            <p className="text-zinc-300">Fungsi penanganan intensitas tinggi meliputi:</p>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-400">
                    <li>Menanggulangi kejahatan bersenjata api berat (Perampokan Utama).</li>
                    <li>Pengendalian kerusuhan massa dan pembubaran konsentrasi ilegal.</li>
                    <li>Pengamanan objek vital (Bank Pusat/Fasilitas Negara).</li>
                    <li>Operasi taktis khusus sesuai instruksi Pimpinan Tertinggi.</li>
                    <li>Bantuan Gempur kepada divisi Sabhara & Satlantas jika skala membesar.</li>
                </ol>
            </div>
        </div>
    );
}

function BrimobTab4() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Car size={16} className="text-red-500"/> Roda 4 (Ransus)</h3>
                <div className="space-y-3 text-xs text-zinc-400">
                    <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>Sultan (Taktis)</span>
                        <span className="text-white">Min. 2 Personel</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>Baracuda / Enforcer</span>
                        <span className="text-white">Min. 4 Personel</span>
                    </div>
                </div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Crosshair size={16} className="text-red-500"/> Roda 2</h3>
                <div className="space-y-3 text-xs text-zinc-400">
                    <p className="leading-relaxed">Motor Trail / Unit Patroli Cepat digunakan spesifik untuk mobilitas dan memutus jalur pengejaran. 1 personel per kendaraan diizinkan dalam kondisi formasi utuh.</p>
                </div>
            </div>
        </div>
    );
}

function BrimobTab5() {
    return (
        <div className="h-full flex flex-col justify-center items-center text-center p-6 relative overflow-hidden rounded-xl bg-zinc-900/20 border border-zinc-800/50">
            <ShieldAlert size={48} className="text-red-900/40 mb-6" />
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-lg z-10">
                Sebagai satuan elit, personel BRIMOB dituntut memiliki <span className="text-red-400 font-medium">kesiapsiagaan, integritas, dan tanggung jawab mutlak</span>. Eksekusi harus cepat, terukur, dan mengedepankan kehormatan institusi Kepolisian Mandalika.
            </p>
        </div>
    );
}

// ============================================================================
// ISI MATERI SATLANTAS
// ============================================================================
function SatlantasTab1() {
    return (
        <div className="space-y-6 text-sm text-zinc-400">
            <p className="bg-red-950/10 p-4 rounded-xl border border-red-900/20 text-red-100/70">
                Menjaga Kamseltibcarlantas (Keamanan, Keselamatan, Ketertiban, Kelancaran Lalu Lintas) di wilayah kota Mandalika.
            </p>

            <div>
                <h3 className="text-white font-medium mb-3">Tugas Utama</h3>
                <ul className="space-y-2 ml-2 border-l border-zinc-800 pl-4">
                    <li><span className="text-red-400">Patroli:</span> Area dalam dan luar kota.</li>
                    <li><span className="text-red-400">Gatur & Wal:</span> Pengaturan arus, penjagaan, dan pengawalan VIP/Konvoi.</li>
                    <li><span className="text-red-400">Laka Lantas:</span> Penanganan kecelakaan lalu lintas.</li>
                </ul>
            </div>

            <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50">
                <h3 className="text-white font-medium mb-3">Penanganan Kriminalitas</h3>
                <p className="text-xs leading-relaxed">
                    Hanya diperkenankan sebagai lapis kedua. Wajib mengutamakan pengamanan area perimeter arus lalu lintas. 
                    <span className="text-red-500 ml-1">Dilarang masuk ke zona kontak senjata utama kecuali mendesak dan personel Sabhara/Brimob kekurangan formasi.</span>
                </p>
            </div>
        </div>
    );
}

function SatlantasTab2() {
    return (
        <div className="space-y-6 text-sm text-zinc-400">
            <div>
                <h3 className="text-white font-medium mb-3">Penerbitan SIM & Plat Nomor</h3>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 mb-3">
                    <p className="text-xs mb-2">Gunakan command di bawah ini setelah melakukan verifikasi KTP/Administrasi & Pembayaran (Invoice Manual).</p>
                    <code className="block bg-[#121212] p-3 rounded-lg text-red-400/80 border border-zinc-800/80 font-mono text-xs">
                        /givelic [ID_PLAYER] (SIM)<br/>
                        /makeplate [ID_KENDARAAN] (Plat)
                    </code>
                </div>
            </div>

            <div>
                <h3 className="text-white font-medium mb-3">Pengambilan Impound</h3>
                <ol className="list-decimal list-inside space-y-2 text-xs bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
                    <li>Dekati titik impound di area garasi lalu lintas.</li>
                    <li>Verifikasi data KTP pemilik dan STNK.</li>
                    <li>Pastikan denda dibayar sebelum unit dilepas.</li>
                </ol>
            </div>
        </div>
    );
}

function SatlantasTab3() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                    <h3 className="text-white font-medium mb-2">Akuntabilitas</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">Kendaraan dinas sepenuhnya menjadi tanggung jawab personel yang mengeluarkan. Kerusakan wajib diperbaiki.</p>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                    <h3 className="text-white font-medium mb-2">Sterilisasi</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">Sangat dilarang meminjamkan unit dinas kepada warga sipil dengan alasan apapun.</p>
                </div>
            </div>
            <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-xl text-xs text-red-400">
                Pelanggaran penggunaan unit di luar jam dinas (Off-Duty) akan dikenakan sanksi Grounding hingga Demosi.
            </div>
        </div>
    );
}

function SatlantasTab4() {
    return (
        <div className="space-y-6 text-sm text-zinc-400">
            <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2"><ShieldAlert size={16} className="text-red-500"/> Integritas (Zero Tolerance)</h3>
                <ul className="space-y-2 ml-2 border-l-2 border-red-900/50 pl-4 text-xs">
                    <li>1. Menerima suap (gratifikasi) dari pelanggar lalin.</li>
                    <li>2. Menyalahgunakan wewenang (Powergaming).</li>
                    <li>3. Memanipulasi laporan denda / impound ke atasan.</li>
                </ul>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl mt-4">
                <h3 className="text-white font-medium mb-2">Sikap & Perilaku</h3>
                <p className="text-xs leading-relaxed">Utamakan pendekatan persuasif, edukatif, dan humanis kepada masyarakat. Penindakan tegas dilakukan secara terukur tanpa arogansi.</p>
            </div>
        </div>
    );
}

function SatlantasTab5() {
    return (
        <div className="space-y-6 text-sm text-zinc-400">
            <p className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 text-xs">
                Callsign Lantas umumnya merepresentasikan <span className="text-white font-medium">Unit Kendaraan</span> atau sandi wilayah, bukan identitas nama pribadi.
            </p>
            
            <div>
                <h3 className="text-white font-medium mb-3">Komunikasi Udara (Radio)</h3>
                <div className="space-y-2">
                    <code className="block bg-[#121212] p-3 rounded-lg text-zinc-500 border border-zinc-800/80 font-mono text-xs">
                        &gt; "Mabes, PJR-01 izin lingkar area kota."
                    </code>
                    <code className="block bg-[#121212] p-3 rounded-lg text-zinc-500 border border-zinc-800/80 font-mono text-xs">
                        &gt; "PJR-01 kepada 00, melaporkan Laka Lantas di perempatan PD, minta unit medis."
                    </code>
                </div>
            </div>
        </div>
    );
}

function SatlantasTab6() {
    return (
        <div className="space-y-6 text-sm text-zinc-400">
            <p className="text-xs italic bg-zinc-900/30 p-3 rounded-lg">
                * Eksekusi Impound dilakukan secara On-Site melalui tablet MDT.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                    <h3 className="text-white font-medium mb-3">Kriteria Sita</h3>
                    <ul className="space-y-2 text-xs">
                        <li>▪ Menghalangi arus jalan raya.</li>
                        <li>▪ Parkir di fasilitas vital/trotoar.</li>
                        <li>▪ Ditinggalkan saat razia/kabur.</li>
                    </ul>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                    <h3 className="text-white font-medium mb-3">Inspeksi</h3>
                    <ul className="space-y-2 text-xs">
                        <li>▪ Pengecekan plat dan STNK.</li>
                        <li>▪ Penggeledahan bagasi (Trunk).</li>
                        <li>▪ Sita barang ilegal yang ditemukan.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function SatlantasTab7() {
    return (
        <div className="space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-white font-medium mb-3">Buddy System</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-2">Sangat direkomendasikan patroli minimal berdua per unit (1 Driver, 1 Co-Driver/Komunikator).</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row justify-between md:items-center gap-2">
                    <div>
                        <span className="text-white font-medium text-sm block">A. Urban (Perkotaan)</span>
                        <span className="text-xs text-zinc-500">Unit LSPD / Sultan</span>
                    </div>
                    <span className="text-xs bg-zinc-800/50 px-3 py-1 rounded text-zinc-400">Fokus: Arus Lalin Kota</span>
                </div>
                <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row justify-between md:items-center gap-2">
                    <div>
                        <span className="text-white font-medium text-sm block">B. Rural (Luar Kota/Tol)</span>
                        <span className="text-xs text-zinc-500">Unit LVPD / SFPD</span>
                    </div>
                    <span className="text-xs bg-zinc-800/50 px-3 py-1 rounded text-zinc-400">Fokus: Pengawasan Jalur Cepat</span>
                </div>
            </div>
            
            <div className="bg-red-950/20 border border-red-900/30 p-5 rounded-xl mt-2">
                <h3 className="text-red-400 font-medium mb-2 text-sm flex items-center gap-2"><Crosshair size={14} /> Unit Speed Hunter</h3>
                <p className="text-xs text-zinc-400">Digunakan spesifik untuk pengejaran prioritas tinggi. Wajib meminta otorisasi dari atasan sebelum mengeluarkan unit (Cheetah/Supercar dinas).</p>
            </div>
        </div>
    );
}