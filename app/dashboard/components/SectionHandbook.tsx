"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen, ShieldAlert, AlertOctagon, Car, Crosshair,
    FileText, Radio, CheckCircle2, AlertTriangle, Users, Target, Siren, Construction
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
            className="w-full max-w-5xl mx-auto space-y-6"
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
// 🚓 KOMPONEN HANDBOOK SABHARA
// ============================================================================
function HandbookSabhara() {
    const [imgError, setImgError] = useState(false); // 🚀 State aman untuk handle gambar error

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
                        {/* 🚀 Menggunakan &rarr; pengganti -> agar JSX tidak error */}
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
                        {/* 🚀 Menggunakan sistem fallback state yang AMAN agar tidak error JSX */}
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
// 🚦 KOMPONEN HANDBOOK SATLANTAS
// ============================================================================
function HandbookSatlantas() {
    return (
        <div className="space-y-8 pb-10">
            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#FF9000] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <Siren className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">1. Pengertian & Tugas Pokok</h2>
                </div>
                <div className="p-6 space-y-4 font-sans text-sm text-slate-800">
                    <p className="font-bold">Satuan Lalu Lintas (SATLANTAS) adalah garda terdepan kepolisian dalam menjaga keamanan, keselamatan, ketertiban, dan kelancaran lalu lintas (Kamseltibcarlantas) di jalan raya Mandalika.</p>

                    <div className="bg-slate-100 p-4 border-2 border-black">
                        <h3 className="font-black bg-[#FF9000] text-black inline-block px-2 border-2 border-black mb-2 uppercase">Tugas Pokok</h3>
                        <ul className="list-disc list-inside font-bold space-y-1">
                            <li>Melaksanakan Pengaturan, Penjagaan, Pengawalan, dan Patroli (Turjawali) lalu lintas.</li>
                            <li>Melakukan penindakan pelanggaran lalu lintas (Traffic Stop / Tilang).</li>
                            <li>Penanganan dan olah Tempat Kejadian Perkara (TKP) kecelakaan lalu lintas.</li>
                            <li>Memberikan pengawalan khusus (VVIP/VIP) atau membuka jalur darurat untuk Tim Medis (EMS).</li>
                            <li>Mencegah terjadinya tindak kriminalitas pencurian kendaraan (Carstealing) di jalanan.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="bg-slate-900 text-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="border-b-[5px] border-black p-4 flex items-center gap-3">
                    <AlertOctagon className="text-[#FF9000]" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-[#FF9000]">2. SOP Penindakan (Traffic Stop / 10-38)</h2>
                </div>
                <div className="p-6 space-y-4 font-sans text-sm">
                    <p className="font-bold">Tindakan pemberhentian kendaraan bermotor yang terindikasi melakukan pelanggaran lalu lintas, kelengkapan berkendara, atau pengecekan identitas.</p>

                    <ol className="list-decimal list-inside space-y-3 font-bold bg-slate-800 p-4 border-2 border-slate-700">
                        <li><span className="text-[#CCFF00]">Pemberitahuan:</span> Nyalakan sirine dan berikan peringatan lisan melalui Megaphone untuk menepi di area yang aman.</li>
                        <li><span className="text-[#CCFF00]">Posisi Kendaraan:</span> Parkir kendaraan dinas sedikit menyerong ke arah jalan di belakang kendaraan target untuk perlindungan.</li>
                        <li><span className="text-[#CCFF00]">Pendekatan:</span> Petugas turun perlahan, perhatikan kaca spion dan pergerakan di dalam kendaraan target. Tangan siap di dekat sidearm (antisipasi).</li>
                        <li><span className="text-[#CCFF00]">Pemeriksaan:</span> Minta pengendara mematikan mesin, menurunkan kaca, dan menunjukkan Surat Izin Mengemudi (SIM).</li>
                        <li><span className="text-[#CCFF00]">Penindakan:</span> Jika melanggar, berikan surat tilang (Invoice Manual). Jika bersih, persilakan melanjutkan perjalanan.</li>
                    </ol>
                    <div className="bg-red-900 border-l-4 border-red-500 p-3 mt-3 font-bold text-xs">
                        *Jika target melarikan diri, segera lapor ke radio (Code 10-57 Pursuit) dan sebutkan ciri-ciri kendaraan, pelat nomor, serta arah pelarian.
                    </div>
                </div>
            </section>

            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#3B82F6] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <Target className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">3. SOP Pengawalan (Escort)</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-sm font-bold text-slate-800">
                    <div className="bg-blue-50 p-4 border-2 border-black">
                        <h3 className="font-black uppercase text-blue-800 border-b-2 border-black pb-1 mb-2">A. Pengawalan VVIP/VIP</h3>
                        <p className="text-xs mb-2">Mengawal pejabat negara, konvoi penting, atau tamu khusus.</p>
                        <ul className="list-disc list-inside text-xs space-y-1">
                            <li>Formasi minimal: 1 Unit Lantas (Depan) sebagai Sweeper/Pembuka Jalan.</li>
                            <li>Gunakan sirine dan isyarat lampu konvoi.</li>
                            <li>Jaga jarak aman antara mobil polisi dan mobil VVIP.</li>
                        </ul>
                    </div>
                    <div className="bg-red-50 p-4 border-2 border-black">
                        <h3 className="font-black uppercase text-red-800 border-b-2 border-black pb-1 mb-2">B. Pengawalan Medis (EMS)</h3>
                        <p className="text-xs mb-2">Membuka jalur untuk ambulans dalam kondisi darurat medis.</p>
                        <ul className="list-disc list-inside text-xs space-y-1">
                            <li>Lantas berada di depan ambulans untuk *clearance* persimpangan.</li>
                            <li>Gunakan megaphone untuk meminta warga menepi.</li>
                            <li>Tidak diperkenankan zig-zag berlebihan yang membahayakan ambulans.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="bg-white border-[5px] border-black shadow-[8px_8px_0_0_#000]">
                <div className="bg-[#CCFF00] border-b-[5px] border-black p-4 flex items-center gap-3">
                    <Car className="text-black" size={24} />
                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">4. Kendaraan Dinas Satlantas</h2>
                </div>
                <div className="p-6 space-y-4 font-sans text-sm text-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-100 p-3 border-2 border-black">
                            <h3 className="font-black uppercase text-[#FF9000] border-b-2 border-black pb-1 mb-2">Roda Dua (Motor)</h3>
                            <p className="font-bold text-xs mb-1">Unit: <span className="text-black">HPV-1000</span></p>
                            <p className="font-bold text-[10px] text-slate-600">Digunakan untuk patroli lalin, respon cepat kemacetan, dan pengawalan VIP.</p>
                        </div>
                        <div className="bg-slate-100 p-3 border-2 border-black">
                            <h3 className="font-black uppercase text-[#FF9000] border-b-2 border-black pb-1 mb-2">Roda Empat (Mobil)</h3>
                            <p className="font-bold text-xs mb-1">Unit: <span className="text-black">LSPD, SFPD Patroli, Sultan</span></p>
                            <p className="font-bold text-[10px] text-slate-600">Patroli jalan raya, Traffic Stop, dan Pengejaran (Pursuit). Max penggunaan Sultan: 4 Unit.</p>
                        </div>
                    </div>
                </div>
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