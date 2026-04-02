"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, ShieldAlert, AlertOctagon, Car, Crosshair,
    FileText, Radio, CheckCircle2, AlertTriangle, Users, Target, Siren, Construction, ChevronRight
} from 'lucide-react';

interface SectionHandbookProps {
    divisi: string;
}

export default function SectionHandbook({ divisi }: SectionHandbookProps) {
    const userDivisi = divisi?.toUpperCase() || "UNIT";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-6xl mx-auto space-y-6"
        >
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
                    <p className="text-xl font-[1000] uppercase tracking-widest">{userDivisi}</p>
                </div>
            </div>

            {/* RENDER KONTEN BERDASARKAN DIVISI */}
            {userDivisi === "SABHARA" && <HandbookSabhara />}
            {userDivisi === "BRIMOB" && <HandbookBrimob />}
            {userDivisi === "SATLANTAS" && <HandbookSatlantas />}
            {userDivisi === "PROPAM" && <HandbookPropam />}

            {/* FALLBACK JIKA DIVISI BELUM ADA HANDBOOK-NYA */}
            {userDivisi !== "SABHARA" && userDivisi !== "BRIMOB" && userDivisi !== "SATLANTAS" && userDivisi !== "PROPAM" && (
                <div className="bg-yellow-100 border-[6px] border-black p-10 text-center shadow-[8px_8px_0_0_#000]">
                    <AlertTriangle size={64} className="mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-2xl font-[1000] uppercase italic">DATA BELUM TERSEDIA</h2>
                    <p className="font-bold text-slate-700 mt-2">Buku saku untuk divisi {userDivisi} sedang dalam tahap penyusunan oleh Petinggi.</p>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// 🚦 KOMPONEN HANDBOOK SATLANTAS (DENGAN TABS NEO-BRUTALISM)
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
            {/* SIDEBAR TABS MENU */}
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

            {/* CONTENT AREA */}
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
                        {/* HEADER KONTEN */}
                        <div
                            className="border-b-[5px] border-black p-4 flex items-center gap-3"
                            style={{ backgroundColor: tabs[activeTab].color }}
                        >
                            <span className="text-black">{tabs[activeTab].icon}</span>
                            <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">
                                {indexToRoman(activeTab + 1)}. {tabs[activeTab].title}
                            </h2>
                        </div>

                        {/* ISI KONTEN */}
                        <div className="p-6 font-sans text-sm text-slate-800 h-full">
                            {activeTab === 0 && <SatlantasTab1 />}
                            {activeTab === 1 && <SatlantasTab2 />}
                            {activeTab === 2 && <SatlantasTab3 />}
                            {activeTab === 3 && <SatlantasTab4 />}
                            {activeTab === 4 && <SatlantasTab5 />}
                            {activeTab === 5 && <SatlantasTab6 />}
                            {activeTab === 6 && <SatlantasTab7 />}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// Helper untuk penomoran Romawi di header konten
function indexToRoman(num: number) {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[num - 1] || num;
}

// --- ISI MATERI SATLANTAS ---

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

            <h3 className="font-black bg-[#CCFF00] inline-block px-2 border-2 border-black mt-2">III. PENANGANAN KASUS KRIMINAL (BANTUAN)</h3>
            <p>Satlantas dapat membantu penanganan suspect apabila jumlah suspect ≥ Personel Sabhara/Brimob di lapangan, atau personel di TKP dinilai tidak mencukupi.</p>
            <div className="bg-yellow-50 p-3 border-l-4 border-yellow-500 text-xs mt-2">
                <span className="font-black text-black">KETENTUAN:</span> Wajib koordinasi radio, fokus pengamanan area/arus lalin, dan <span className="text-red-600">DILARANG</span> menangani kasus kriminal jika TIDAK ADA Sabhara/Brimob di TKP.
            </div>

            <h3 className="font-black bg-[#FF4D4D] text-white inline-block px-2 border-2 border-black mt-2">IV. CASE PERAMPOKAN (WARUNG/BANK)</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Prioritas Utama penanganan wajib dipegang oleh Brimob/Sabhara.</li>
                <li>Satlantas DILARANG mengambil alih/intervensi jika jumlah Brimob/Sabhara mencukupi.</li>
                <li>Peran Satlantas: Menutup akses jalan (blokade) dan sterilisasi area luar.</li>
            </ul>
        </div>
    );
}

function SatlantasTab2() {
    return (
        <div className="space-y-4 font-bold">
            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black">I. PROSEDUR PENERBITAN SIM</h3>
            <p className="text-xs italic">Wajib dilakukan secara humanis dan sesuai prosedur administratif.</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><span className="text-black">Identitas:</span> Wajib KTP sah.</li>
                <li><span className="text-black">Klasifikasi:</span> SIM A (Mobil), SIM B (Truk/Bus), SIM C (Motor).</li>
                <li><span className="text-black">Pembayaran:</span> Gunakan invoice (Cek harga terbaru di channel Discord).</li>
            </ul>
            <div className="bg-slate-900 text-white p-2 border-2 border-black font-mono text-xs inline-block mt-1">/givelic [ID_PLAYER]</div>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">II. PROSEDUR PEMASANGAN PLATE</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><span className="text-black">Verifikasi:</span> Unit Mobil wajib SIM A, Unit Motor wajib SIM C.</li>
                <li><span className="text-black">Kepemilikan:</span> Kendaraan wajib legal/pribadi.</li>
            </ul>
            <div className="bg-slate-900 text-white p-2 border-2 border-black font-mono text-xs inline-block mt-1">/makeplate [ID_KENDARAAN]</div>
            <p className="text-xs text-red-500 italic mt-1">*Tanyakan kembali ke pemohon apakah plate sudah terpasang.</p>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">III. PENGAMBILAN KENDARAAN IMPOUND</h3>
            <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li>Dekati titik penyimpanan impound (sebelah garasi Faction).</li>
                <li>Tekan tombol [Y] dan masukkan ID Player pemilik.</li>
                <li>Verifikasi: Jika belum waktunya, jelaskan humanis. Jika sudah, berikan Invoice.</li>
                <li>Keluarkan kendaraan setelah pembayaran berhasil.</li>
            </ol>

            <div className="bg-red-50 p-3 border-2 border-red-500 mt-4 text-xs">
                <span className="font-black text-red-700">⚠️ CATATAN PENTING:</span> Jangan proses jika tidak kooperatif/dokumen tidak lengkap. Pastikan uang diterima sebelum eksekusi CMD. Selalu awali dengan salam.
            </div>
        </div>
    );
}

function SatlantasTab3() {
    return (
        <div className="space-y-4 font-bold">
            <p className="bg-slate-100 p-3 border-2 border-black italic">OBJEKTIF: Menjamin keamanan, ketertiban, dan tanggung jawab penuh terhadap aset dinas kepolisian.</p>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-2">I. KETENTUAN UMUM</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><span className="text-blue-600">DINAS ONLY:</span> Hanya untuk operasional resmi.</li>
                <li><span className="text-blue-600">IDENTITAS:</span> Wajib gunakan Callsign aktif.</li>
                <li><span className="text-blue-600">AKUNTABILITAS:</span> Tanggung jawab penuh pada pengambil unit.</li>
            </ul>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">II. PROTOKOL PENGELUARAN</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><span className="text-green-600">BUDDY SYSTEM:</span> Minimal 2 personel per unit.</li>
                <li><span className="text-green-600">IZIN OPERASI:</span> Untuk patroli/penugasan atas izin atasan.</li>
                <li><span className="text-green-600">STERILISASI:</span> Dilarang meminjamkan unit ke warga sipil.</li>
            </ul>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">III. PROSEDUR PENYIMPANAN</h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>Kembalikan ke lokasi parkir/garasi yang ditentukan.</li>
                <li>Pastikan pintu terkunci & mesin mati.</li>
                <li>Lapor jika ada kerusakan/kendala teknis.</li>
            </ol>

            <div className="bg-red-100 p-3 border-l-4 border-red-600 mt-4 text-xs">
                <span className="font-black text-red-800">LARANGAN & SANKSI:</span> Mengalihkan kendali tanpa izin atau pemakaian di luar jam dinas akan disanksi (Teguran, Grounding, Demosi, PTDH).
            </div>
        </div>
    );
}

function SatlantasTab4() {
    return (
        <div className="space-y-4 font-bold">
            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black">I. SIKAP DAN PERILAKU</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><span className="text-blue-600">Reputasi:</span> Menjaga nama baik institusi.</li>
                <li><span className="text-blue-600">Etika:</span> Sopan, tegas, profesional ke masyarakat.</li>
                <li><span className="text-blue-600">Respek:</span> Menghormati warga sipil & rekan.</li>
                <li><span className="text-blue-600">Dual-Life:</span> Jaga etika In-Character (IC) maupun Out-of-Character (OOC).</li>
            </ul>

            <h3 className="font-black bg-red-200 inline-block px-2 border-2 border-black mt-4">II. INTEGRITAS (DILARANG KERAS!)</h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-red-700">
                <li>Menerima suap atau gratifikasi.</li>
                <li>Menyalahgunakan wewenang jabatan.</li>
                <li>Memanipulasi laporan/data kepolisian.</li>
                <li>Melindungi pelanggar hukum atau pelaku kriminal.</li>
            </ol>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">III. DISIPLIN TUGAS</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Wajib mematuhi SOP operasional.</li>
                <li>Aktif patroli wilayah.</li>
                <li>Menjaga inventaris unit kendaraan.</li>
                <li>Menggunakan Callsign resmi.</li>
            </ul>
        </div>
    );
}

function SatlantasTab5() {
    return (
        <div className="space-y-4 font-bold">
            <div className="bg-slate-900 text-white p-3 border-2 border-black font-mono text-xs">
                Callsign digunakan untuk UNIT KENDARAAN, bukan untuk nama pribadi. Wajib digunakan saat komunikasi radio.
            </div>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-2">I. CONTOH KOMUNIKASI</h3>
            <ul className="list-none space-y-2 text-xs font-mono bg-slate-100 p-3 border-2 border-black">
                <li>> "Mabes 00, unit PJR-01 izin lingkar-lingkar di area Los Santos."</li>
                <li>> "Mabes 00, unit PJR-12 izin melakukan pengecekan di area ladang."</li>
            </ul>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">II. KETENTUAN UNIT</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Patroli wajib unit Cruiser LSPD, LVPD, SFPD.</li>
                <li>Anggota <span className="text-red-600">DILARANG</span> berpindah unit tanpa izin/darurat, wajib LAPORAN jika pindah.</li>
            </ul>

            <h3 className="font-black bg-[#CCFF00] inline-block px-2 border-2 border-black mt-4">III. SISTEM PENGOSONGAN CALLSIGN</h3>
            <p className="text-xs">Jika anggota resign/diberhentikan, callsign DIKOSONGKAN. Penyesuaian dilakukan berurutan saat ada penambahan anggota baru.</p>
            <div className="bg-slate-100 p-3 border-2 border-black text-xs mt-2">
                <span className="font-black">Contoh Kasus:</span> PJR 06 resign.<br />
                Anggota baru masuk &rarr; PJR 07 naik jadi PJR 06. PJR 08 naik jadi PJR 07. Seterusnya.
            </div>
        </div>
    );
}

function SatlantasTab6() {
    return (
        <div className="space-y-4 font-bold">
            <div className="bg-slate-100 p-3 border-2 border-black italic text-xs">
                SOP Impound dilakukan secara On-Site (Di Tempat). Tidak ada kendaraan yang dibawa ke kantor polisi (No Towing).
            </div>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-2">I. KRITERIA IMPOUND</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Menghalangi arus lalu lintas (Tengah jalan).</li>
                <li>Parkir sembarangan (Trotoar, jalur hijau).</li>
                <li>Ditinggal pemilik di area terlarang.</li>
            </ul>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">II. PEMERIKSAAN WAJIB</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><span className="text-blue-600">Cek Fisik:</span> Plat nomor & kondisi.</li>
                <li><span className="text-blue-600">Penggeledahan:</span> Bagasi & Holster. Barang ilegal wajib disita. <span className="text-red-600">DILARANG</span> mengambil barang legal warga!</li>
            </ul>

            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">III. KLASIFIKASI & PELAKSANAAN</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><span className="text-black">Wajib Asuransi:</span> Kendaraan Totalled, mogok, habis bensin.</li>
                <li><span className="text-black">Impound Tempat:</span> Kendaraan layak jalan tapi melanggar.</li>
            </ul>

            <div className="bg-red-50 p-3 border-2 border-red-500 mt-4 text-xs">
                <span className="font-black text-red-700">⚠️ DENDA & DURASI:</span> Mengacu pada regulasi resmi Discord. Anggota dilarang keras menentukan denda/durasi secara sepihak!
            </div>
        </div>
    );
}

function SatlantasTab7() {
    return (
        <div className="space-y-4 font-bold">
            <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black">I. BUDDY SYSTEM</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><span className="text-red-600">LARANGAN SOLO:</span> Tidak diperkenankan patroli mandiri (1 orang).</li>
                <li>Minimal 2 personel per unit (1 Driver & 1 Co-Driver).</li>
            </ul>

            <h3 className="font-black bg-[#CCFF00] inline-block px-2 border-2 border-black mt-4">II. DISTRIBUSI WILAYAH</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-xs">
                <div className="bg-slate-100 p-3 border-2 border-black">
                    <span className="font-black uppercase text-blue-600 border-b border-black pb-1 mb-1 block">A. Urban (Perkotaan)</span>
                    <p>Unit: Cruiser LSPD / Sultan</p>
                    <p>Fokus: Pengaturan arus lalin & penindakan administrasi.</p>
                </div>
                <div className="bg-slate-100 p-3 border-2 border-black">
                    <span className="font-black uppercase text-blue-600 border-b border-black pb-1 mb-1 block">B. Rural (Luar Kota)</span>
                    <p>Unit: Cruiser LVPD / SFPD / Sultan</p>
                    <p>Fokus: Pengawasan jalur vital & pencegahan kriminal.</p>
                </div>
            </div>

            <h3 className="font-black bg-[#FF9000] inline-block px-2 border-2 border-black mt-4 text-black">III. UNIT KHUSUS: SPEED HUNTER (CHEETAH)</h3>
            <p className="text-xs italic">Aset prioritas tinggi, bukan untuk patroli rutin!</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Digunakan saat Darurat (Perampokan).</li>
                <li>Pengejaran Prioritas (Suspect High-Speed).</li>
                <li>Operasi Khusus.</li>
            </ul>
            <p className="text-xs text-red-600 mt-1">*Wajib mendapat izin atasan & tetap minimal 2 personel.</p>
        </div>
    );
}

// ============================================================================
// 🚓 KOMPONEN HANDBOOK SABHARA
// ============================================================================
function HandbookSabhara() {
    const [imgError, setImgError] = useState(false);

    return (
        <div className="space-y-8 pb-10">
            {/* 1. PATROLI ZONA MERAH */}
            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#FF4D4D] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <AlertOctagon className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">1. Patroli Zona Merah / Ilegal</h2>
                </div>
                <div className="p-6 space-y-4 font-sans text-sm text-slate-800">
                    <div>
                        <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mb-2">- PENGERTIAN UMUM</h3>
                        <p className="font-bold">Zona Merah / Zona Ilegal adalah wilayah atau area yang diidentifikasi sebagai lokasi dengan tingkat kejahatan tinggi, aktivitas kriminal aktif, atau tempat berkumpulnya organisasi ilegal.</p>
                        <p className="font-bold mt-1">Patroli Zona Merah adalah kegiatan penjagaan, pengawasan, dan penegakan hukum oleh personel kepolisian di wilayah tersebut.</p>
                    </div>

                    <div>
                        <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mb-2">- TUJUAN PATROLI</h3>
                        <ul className="list-disc list-inside font-bold space-y-1">
                            <li>Menjaga keamanan dan ketertiban warga sipil di sekitar area rawan.</li>
                            <li>Mengawasi dan membatasi aktivitas kriminal atau transaksi ilegal.</li>
                            <li>Mengumpulkan informasi intelijen terkait pergerakan organisasi ilegal.</li>
                            <li>Melindungi warga sipil dari potensi bahaya di sekitar area tersebut.</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mb-2">- PERSYARATAN & PERSIAPAN</h3>
                        <p className="font-bold text-red-600 italic">Setiap patroli ke zona merah WAJIB melaporkan nya di radio Dispatch Pusat / HT kepolisian.</p>
                        <p className="font-bold mt-1">Minimal personel yang berangkat adalah 2 (dua) orang. Personel wajib menggunakan:</p>
                        <ul className="list-disc list-inside font-bold space-y-1 ml-4 mt-1">
                            <li>Seragam sesuai Divisi dan (vest).</li>
                            <li>Kendaraan dinas resmi.</li>
                            <li>Senjata dinas sesuai ketentuan standar.</li>
                            <li>Wajib membawa radio komunikasi aktif untuk koordinasi.</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-black bg-[#CCFF00] inline-block px-2 border-2 border-black mb-2">- AREA IZIN PATROLI SABHARA</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-bold bg-slate-100 p-4 border-2 border-black">
                            <p>✔️ Ladang Kanabis</p>
                            <p>✔️ Tempat pengolahan Kanabis</p>
                            <p>✔️ Tempat Penjualan Marijuana</p>
                            <p>✔️ Pembuatan Efedrin & Sabu Cristal</p>
                            <p>✔️ Tempat Carstealing</p>
                            <p>✔️ Black Market</p>
                            <p>✔️ Pencucian Uang Merah</p>
                            <p>✔️ Penjualan Hewan Ilegal (Hiu, Penyu, dll)</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mb-2">- TATA CARA & SKEMA RADIO</h3>
                        <p className="font-bold">Apabila ditemukan aktivitas ilegal: Pengintaian singkat &rarr; Lapor Dispatch tunggu backup &rarr; Tangkap jika aman.</p>
                        <div className="bg-slate-900 text-white p-4 mt-2 border-2 border-black font-mono text-xs space-y-2">
                            <p><span className="text-[#CCFF00]">Berangkat:</span> "Izin, unit TANGGUH - 03 melakukan pengecekan di tempat ladang kanabis."</p>
                            <p><span className="text-[#FF4D4D]">Ada Suspect:</span> "Izin melaporkan, unit TANGGUH - 03 terdapat warga yang sedang melakukan pencabutan kanabis, meminta bantuan segera!"</p>
                            <p><span className="text-blue-400">Clear:</span> "Izin melaporkan, unit TANGGUH - 03 untuk ladang kanabis CLEAR, melanjutkan patroli kembali."</p>
                        </div>
                        <div className="bg-amber-100 border-l-4 border-amber-500 p-3 mt-3 font-bold italic text-xs">
                            *Note: Ketika unit lain sudah melakukan patroli di zona merah tersebut, kasih jeda waktu 15 menit baru bisa melakukan patroli kembali (Respect terhadap Badside).*
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. KENDARAAN ANGGOTA SABHARA */}
            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#3B82F6] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <Car className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">2. Kendaraan Anggota Sabhara</h2>
                </div>
                <div className="p-6 space-y-4 font-sans text-sm text-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-100 p-3 border-2 border-black shadow-[4px_4px_0_0_#000]">
                            <h3 className="font-black uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Sultan Dinas</h3>
                            <p className="font-bold text-xs">Digunakan untuk patroli rutin, respon laporan, pengawalan ringan. Max 4 orang.</p>
                        </div>
                        <div className="bg-slate-100 p-3 border-2 border-black shadow-[4px_4px_0_0_#000]">
                            <h3 className="font-black uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">LSPD / LVPD</h3>
                            <p className="font-bold text-xs">Patroli rutin di daerah Los Santos / Las Venturas sekitarnya. Respon & pengawalan ringan.</p>
                        </div>
                        <div className="bg-slate-100 p-3 border-2 border-black shadow-[4px_4px_0_0_#000]">
                            <h3 className="font-black uppercase text-blue-600 border-b-2 border-black pb-1 mb-2">Sanchez Dinas</h3>
                            <p className="font-bold text-xs">Patroli area sempit, pengaturan lalin, dan pengejaran jarak pendek.</p>
                        </div>
                    </div>

                    <h3 className="font-black bg-slate-200 inline-block px-2 border-2 border-black mt-4">- TATA CARA & LARANGAN</h3>
                    <ul className="list-disc list-inside font-bold space-y-1">
                        <li>Lampu rotator & sirine HANYA untuk respon darurat, pengejaran, pengamanan.</li>
                        <li>Dilarang menggunakan kendaraan dinas untuk kepentingan pribadi/non-RP kepolisian.</li>
                        <li>Dilarang mengemudi ugal-ugalan (No fear driving) & Cop Baiting.</li>
                        <li>Dilarang membawa warga sipil tanpa kepentingan tugas.</li>
                        <li>Operasi Zona Merah wajib minimal 1 kendaraan & radio aktif.</li>
                    </ul>
                </div>
            </section>

            {/* 3. PERLENGKAPAN BERTUGAS */}
            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#00E676] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <ShieldAlert className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">3. Perlengkapan Bertugas</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-sm">
                    <div className="bg-green-50 p-3 border-2 border-black">
                        <h3 className="font-black uppercase mb-2">A. Wajib</h3>
                        <ul className="font-bold text-xs space-y-1 list-disc pl-4">
                            <li>Seragam & ID Card</li>
                            <li>Radio komunikasi</li>
                            <li>Borgol</li>
                            <li>Paper Can / Spray</li>
                            <li>Baton & Taser</li>
                            <li>Sidearm (Sesuai SOP)</li>
                        </ul>
                    </div>
                    <div className="bg-blue-50 p-3 border-2 border-black">
                        <h3 className="font-black uppercase mb-2">B. Pendukung</h3>
                        <ul className="font-bold text-xs space-y-1 list-disc pl-4">
                            <li>Rompi (Vest)</li>
                            <li>Senter taktis</li>
                            <li>Bodycam (RP)</li>
                            <li>Utility belt</li>
                            <li>Bandage & Pill Stress</li>
                        </ul>
                    </div>
                    <div className="bg-red-50 p-3 border-2 border-black">
                        <h3 className="font-black uppercase mb-2">C. Khusus</h3>
                        <ul className="font-bold text-xs space-y-1 list-disc pl-4">
                            <li>Long Weapon (Wajib izin Command)</li>
                            <li>Tameng & Helm Dalmas</li>
                            <li>Spike strip</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 4. PENGGUNAAN BAJU ON DUTY (GAMBAR) */}
            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#FFD100] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <Users className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">4. Baju On Duty Sabhara</h2>
                </div>
                <div className="p-6 text-center">
                    <div className="w-full max-w-lg mx-auto bg-slate-200 border-4 border-black aspect-video flex flex-col items-center justify-center relative overflow-hidden shadow-[4px_4px_0_0_#000] mb-4">
                        {imgError ? (
                            <div className="text-center p-4">
                                <p className="font-black italic text-slate-500">GAMBAR SERAGAM BELUM TERSEDIA</p>
                                <p className="text-xs font-bold text-slate-400 mt-2">Pastikan gambar disimpan di:<br />public/images/sabhara-seragam.png</p>
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
                        <span className="font-black uppercase">NOTE:</span> DILARANG MENGGUNAKAN ATRIBUTE YANG BUKAN MILIK KEPOLISIAN. BOLEH MEMAKAI KACAMATA SERTA WIG TAPI TETAP JANGAN BERLEBIHAN. PELANGGAR AKAN DISANKSI.
                    </div>
                </div>
            </section>

            {/* 5. RULES PENANGANAN KRIMINAL */}
            <section className="bg-slate-900 text-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="border-b-[5px] border-black p-4 flex items-center gap-3">
                    <Crosshair className="text-[#FFD100]" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-[#FFD100]">5. Rules Penanganan Kriminal</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="bg-slate-800 border-2 border-slate-700 p-3">
                        <h3 className="font-black text-[#00E676] mb-1">PENCABUTAN GANJA / CANABIS</h3>
                        <p>• Polisi max 6 orang + (2 Backup jika suspect panggil backup)</p>
                        <p>• Suspect min 2 max 4 orang + (2 Backup)</p>
                        <p>• Senjata Suspect: SLC, DE, Shotgun</p>
                        <p>• Dilarang Heli & Refill Kevlar saat perang.</p>
                    </div>
                    <div className="bg-slate-800 border-2 border-slate-700 p-3">
                        <h3 className="font-black text-[#FF90E8] mb-1">CARSTEALING</h3>
                        <p>• Polisi max 8 orang aktif</p>
                        <p>• Suspect min 2 max 4 orang</p>
                        <p>• Dilarang Speed Hunter & Heli.</p>
                        <p>• Max refill vest 1. DILARANG Bandage.</p>
                    </div>
                    <div className="bg-slate-800 border-2 border-slate-700 p-3">
                        <h3 className="font-black text-[#FF4D4D] mb-1">PERAMPASAN / BEGAL</h3>
                        <p>• Polisi max 6 orang (Boleh backup jika suspect backup)</p>
                        <p>• Suspect max 4 orang.</p>
                        <p>• Dilarang Heli. Max refill vest 1. No Bandage.</p>
                    </div>
                    <div className="bg-slate-800 border-2 border-slate-700 p-3">
                        <h3 className="font-black text-amber-400 mb-1">PERAMPOKAN MARKET</h3>
                        <p>• Polisi max 7 orang aktif</p>
                        <p>• Suspect min 3 max 6 orang</p>
                        <p>• Dilarang Heli. Max refill vest 1. No Bandage.</p>
                    </div>
                    <div className="bg-slate-800 border-2 border-slate-700 p-3 md:col-span-2">
                        <h3 className="font-black text-blue-400 mb-1">PERAMPOKAN BANK</h3>
                        <p className="mb-2"><span className="text-[#FFD100]">KECIL (Fleeca):</span> Polisi max 10. Suspect min 6 max 10. (SLC, DE, Shotgun). No Heli. Max refill 1.</p>
                        <p><span className="text-red-400">BESAR:</span> Polisi max 15. Suspect min 6 max 15. Polisi ALL TYPE weapon. Suspect (AK 3, Uzi 3, Sniper 1). Heli Polisi max 1. Kendaraan All-in. Max refill 1.</p>
                    </div>
                </div>
            </section>

            {/* 6. PEMBUATAN SKCK */}
            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#FF90E8] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <FileText className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">6. Pembuatan SKCK</h2>
                </div>
                <div className="p-6 space-y-4 font-sans text-sm text-slate-800 font-bold">
                    <p>SKCK adalah dokumen resmi Kepolisian yang menerangkan ada atau tidaknya catatan kriminal seorang warga. Bersifat administratif, bukan alat penangkapan.</p>
                    <div className="bg-slate-100 p-3 border-2 border-black">
                        <h3 className="font-black uppercase mb-1 border-b-2 border-black inline-block">Alur Pelayanan:</h3>
                        <ol className="list-decimal list-inside space-y-1 mt-2">
                            <li>Sambut pemohon & cek KTP. (Tolak jika DPO/Buronan)</li>
                            <li>Cek MDT (Riwayat 14 hari terakhir).</li>
                            <li>Berikan Invoice manual (Otot H).</li>
                            <li>Buat SKCK dengan format:</li>
                        </ol>
                        <div className="bg-white border-2 border-black p-2 mt-2 font-mono text-xs text-blue-600 inline-block">
                            /MakeSkck [ID] 14 TIDAK MEMILIKI CATATAN KRIMINAL KEPOLISIAN MANDALIKA
                        </div>
                    </div>
                    <p className="text-red-600 italic text-xs">Dilarang mempersulit pemohon, meminta imbalan (korupsi), atau membocorkan data MDT secara detail!</p>
                </div>
            </section>

            {/* 7. CALLSIGN */}
            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#A78BFA] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <Radio className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">7. Callsign Divisi</h2>
                </div>
                <div className="p-6 font-sans text-sm text-slate-800 font-bold space-y-4">
                    <p>Kode panggilan unik di radio untuk menjaga kerahasiaan identitas dan efisiensi.</p>
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-slate-900 text-white p-3 border-2 border-black rounded-lg">SABHARA: <span className="text-[#CCFF00] font-black">TANGGUH</span></div>
                        <div className="bg-slate-900 text-white p-3 border-2 border-black rounded-lg">SATLANTAS: <span className="text-[#FF90E8] font-black">PJR</span></div>
                        <div className="bg-slate-900 text-white p-3 border-2 border-black rounded-lg">BRIMOB: <span className="text-[#FF4D4D] font-black">WALLET</span></div>
                    </div>
                    <div>
                        <h3 className="font-black uppercase bg-slate-200 inline-block px-2 border-2 border-black mt-2 mb-1">Hierarki Callsign</h3>
                        <ul className="list-disc list-inside">
                            <li>Kakorps / Komandan: <span className="text-blue-600">TURJAWALI - I</span></li>
                            <li>Dankorps / Wadan: <span className="text-blue-600">TURJAWALI - II</span></li>
                            <li>Anggota: <span className="text-blue-600">TANGGUH - 01, 02, 03...</span></li>
                        </ul>
                    </div>
                    <div className="bg-amber-100 p-3 border-2 border-amber-500 text-xs italic">
                        Wajib sebutkan "IZIN UNIT [CALLSIGN]" sebelum bicara. Dilarang sebut nama asli di radio!
                    </div>
                </div>
            </section>
        </div>
    );
}

// ============================================================================
// 🚁 KOMPONEN HANDBOOK BRIMOB
// ============================================================================
function HandbookBrimob() {
    return (
        <div className="space-y-8 pb-10">
            <section className="bg-slate-950 text-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#FF4D4D] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <Target className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">1. Ketentuan SOP BRIMOB</h2>
                </div>
                <div className="p-6 space-y-4 font-sans text-sm">
                    <p className="font-bold">BRIMOB (Brigade Mobil) adalah satuan khusus Kepolisian Mandalika yang bertugas menangani situasi keamanan berintensitas tinggi. Bertindak berdasarkan perintah komando dengan profesionalisme, disiplin, dan kepatuhan hukum yang absolut.</p>
                    <div className="bg-slate-800 p-4 border-2 border-slate-700">
                        <h3 className="font-black text-[#CCFF00] mb-2 uppercase tracking-widest">Tujuan Operasional:</h3>
                        <ul className="list-disc list-inside font-bold space-y-1 text-slate-300">
                            <li>Pemulihan dan menjaga keamanan masyarakat.</li>
                            <li>Menanggulangi kejahatan kriminalitas bersenjata, ancaman terorisme, dan kerusuhan kota.</li>
                            <li>Mendukung tugas kepolisian melalui tindakan cepat, tegas, dan terukur.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-slate-300 border-b-[5px] border-black p-4 flex items-center gap-3">
                    <ShieldAlert className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">2. Sumber Daya BRIMOB</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-sm font-bold text-slate-800">
                    <div className="bg-slate-50 p-4 border-2 border-black">
                        <h3 className="font-black uppercase text-red-600 mb-1">1. SDM Terlatih</h3>
                        <p className="text-xs">Personel khusus dengan kemampuan taktis, fisik, mental, dan disiplin tinggi untuk situasi ekstrem.</p>
                    </div>
                    <div className="bg-slate-50 p-4 border-2 border-black">
                        <h3 className="font-black uppercase text-red-600 mb-1">2. Sarana & Prasarana</h3>
                        <p className="text-xs">Kendaraan taktis, alat Dalmas, perlengkapan taktis khusus untuk penanganan ancaman bersenjata.</p>
                    </div>
                    <div className="bg-slate-50 p-4 border-2 border-black">
                        <h3 className="font-black uppercase text-red-600 mb-1">3. Sistem Komando</h3>
                        <p className="text-xs">Struktur komando hierarki yang jelas serta komunikasi operasional terenkripsi/cepat.</p>
                    </div>
                    <div className="bg-slate-50 p-4 border-2 border-black">
                        <h3 className="font-black uppercase text-red-600 mb-1">4. Logistik</h3>
                        <p className="text-xs">Dukungan penuh untuk kesiapan operasional, amunisi, dan keberlangsungan tugas satuan.</p>
                    </div>
                </div>
            </section>

            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#CCFF00] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <CheckCircle2 className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">3. Tugas Pokok</h2>
                </div>
                <div className="p-6 font-sans text-sm font-bold text-slate-800">
                    <p className="mb-4">Melaksanakan fungsi kepolisian berintensitas tinggi untuk memulihkan keamanan:</p>
                    <ol className="list-decimal list-inside space-y-2 bg-slate-100 p-4 border-2 border-black">
                        <li>Menanggulangi kejahatan berisiko tinggi dan bersenjata api berat.</li>
                        <li>Penanganan kerusuhan massa dan gangguan keamanan skala besar.</li>
                        <li>Penanggulangan aksi teror dan ancaman khusus kota.</li>
                        <li>Pengamanan objek vital (Bank Pusat/Fasilitas Negara).</li>
                        <li>Operasi taktis khusus sesuai instruksi Pimpinan Tertinggi.</li>
                        <li>Bantuan gempur/operasional kepada Sabhara & Satlantas.</li>
                    </ol>
                </div>
            </section>

            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#3B82F6] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <Car className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">4. Pembagian Patroli</h2>
                </div>
                <div className="p-6 font-sans text-sm font-bold text-slate-800">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1 bg-blue-50 border-2 border-blue-800 p-4">
                            <h3 className="font-black uppercase text-blue-800 text-lg">Roda 4 (Ransus)</h3>
                            <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                                <li><span className="text-black">Sultan:</span> Minimal 2 Orang</li>
                                <li><span className="text-black">Baracuda / Enforcer:</span> Minimal 4 Orang</li>
                            </ul>
                        </div>
                        <div className="flex-1 bg-green-50 border-2 border-green-800 p-4">
                            <h3 className="font-black uppercase text-green-800 text-lg">Roda 2</h3>
                            <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                                <li><span className="text-black">Motor Trail / Patroli:</span> Diharapkan 1 orang per kendaraan untuk mobilitas.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-slate-900 text-white border-[5px] border-black shadow-[8px_8px_0_0_#000] p-6 text-center">
                <ShieldAlert size={48} className="mx-auto text-[#FF4D4D] mb-4" />
                <h2 className="text-2xl font-[1000] italic uppercase tracking-tight text-[#FFD100] mb-2">KESIMPULAN OPERASIONAL</h2>
                <p className="font-sans text-sm font-bold max-w-2xl mx-auto leading-relaxed text-slate-300">
                    Korps BRIMOB merupakan satuan elit yang memiliki peran strategis. Melalui SOP ini, personel dituntut memiliki kesiapsiagaan, integritas, dan tanggung jawab tinggi. Eksekusi cepat, terukur, dan mematikan (jika diperlukan) dengan tetap mengedepankan hierarki komando dan kehormatan institusi Kepolisian Mandalika.
                </p>
            </section>
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