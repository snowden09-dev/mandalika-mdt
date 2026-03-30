"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Shield, BookOpen, AlertOctagon, Radio,
    Car, Crosshair, Siren, CheckCircle2, Megaphone, Users, Target
} from 'lucide-react';

export default function SOPPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('HIERARKI');

    const tabs = [
        { id: 'HIERARKI', label: 'Hierarki & Aturan', icon: <Shield size={16} />, color: 'bg-[#3B82F6]' },
        { id: 'GOV', label: 'SOP Berita Langit', icon: <Megaphone size={16} />, color: 'bg-[#FFD100]' },
        { id: 'DIVISI', label: 'Divisi Kepolisian', icon: <Users size={16} />, color: 'bg-[#00E676]' },
        { id: 'SANDI', label: 'Sandi Radio', icon: <Radio size={16} />, color: 'bg-[#A78BFA]' },
        { id: 'LOGISTIK', label: 'Logistik & Kendaraan', icon: <Target size={16} />, color: 'bg-[#FF4D4D]' },
    ];

    return (
        <div className="min-h-screen bg-[#e2e8f0] text-slate-950 font-sans pb-32">
            {/* HEADER NAV */}
            <div className="bg-white border-b-[6px] border-black p-4 sticky top-0 z-50 shadow-[0_4px_0_0_#000] flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="p-2 bg-[#FFD100] border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:-translate-y-1 transition-all active:translate-y-0">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-[1000] italic uppercase tracking-tighter flex items-center gap-2">
                                <BookOpen size={24} className="text-[#3B82F6]" /> BUKU SAKU SOP
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Standar Operasional Prosedur Mandalika</p>
                        </div>
                    </div>
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 font-[1000] text-xs uppercase italic whitespace-nowrap border-[3px] border-black transition-all ${activeTab === tab.id
                                    ? `${tab.color} shadow-[4px_4px_0_0_#000] translate-y-0 text-black`
                                    : 'bg-white shadow-[0px_0px_0_0_#000] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#000] text-slate-600'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 md:p-8 max-w-5xl mx-auto">
                <AnimatePresence mode="wait">

                    {/* TAB: HIERARKI & ATURAN */}
                    {activeTab === 'HIERARKI' && (
                        <motion.div key="hierarki" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            <section className="bg-white border-[5px] border-black shadow-[10px_10px_0_0_#000] relative overflow-hidden">
                                <div className="bg-[#3B82F6] border-b-[5px] border-black p-4 flex items-center gap-3">
                                    <Shield className="text-black" size={28} />
                                    <h2 className="text-2xl font-[1000] italic uppercase tracking-tight text-black">Panduan Pimpinan & Perwira</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="font-[1000] text-lg bg-[#FFD100] inline-block px-3 py-1 border-2 border-black shadow-[3px_3px_0_0_#000] uppercase italic">A. Kepala Kepolisian Pusat (Komjen)</h3>
                                        <ul className="list-disc list-inside font-bold text-sm space-y-1 pl-2 text-slate-700">
                                            <li>Menetapkan SOP kepolisian.</li>
                                            <li>Pengawasan langsung Kepolisian.</li>
                                            <li>Melakukan pelantikan anggota baru.</li>
                                            <li>Melakukan penaikan pangkat berdasarkan rekomendasi kepala satuan.</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-[1000] text-lg bg-[#00E676] inline-block px-3 py-1 border-2 border-black shadow-[3px_3px_0_0_#000] uppercase italic">B. Kepala Kepolisian Mandalika (Jendral)</h3>
                                        <ul className="list-disc list-inside font-bold text-sm space-y-1 pl-2 text-slate-700">
                                            <li>Memimpin Kepolisian Mandalika.</li>
                                            <li>Memberikan arahan kepada anggota dalam kondisi tertentu.</li>
                                            <li>Menegur dan memberikan sanksi terhadap anggota.</li>
                                            <li>Menyediakan dana untuk keperluan kepolisian.</li>
                                            <li>Melakukan pendisiplinan serta review kinerja kepala satuan.</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-[1000] text-lg bg-[#A78BFA] inline-block px-3 py-1 border-2 border-black shadow-[3px_3px_0_0_#000] uppercase italic">C. Perwira Menengah/Tinggi</h3>
                                        <p className="text-xs font-black uppercase text-slate-500 mb-2">(AKBP, KOMBES, BRIGJEN, IRJEN, KOMJEN)</p>
                                        <ul className="list-disc list-inside font-bold text-sm space-y-1 pl-2 text-slate-700">
                                            <li>Memberikan arahan kepada setiap anggota di bawahnya.</li>
                                            <li>Membantu tugas pimpinan & memberikan laporan.</li>
                                            <li>Menegur, memberikan sanksi, dan menilai kinerja anggota.</li>
                                            <li>Melakukan pendisiplinan & review kinerja satuan Divisi.</li>
                                            <li>Memegang komando tertinggi terhadap satuan.</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-[#CCFF00] border-[5px] border-black shadow-[10px_10px_0_0_#000] relative overflow-hidden">
                                <div className="bg-black text-[#CCFF00] border-b-[5px] border-black p-4 flex items-center gap-3">
                                    <CheckCircle2 size={28} />
                                    <h2 className="text-2xl font-[1000] italic uppercase tracking-tight">Kode Etik Utama</h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 font-bold text-sm">
                                    {[
                                        "Mengikuti semua SOP yang berlaku.", "Wajib mengayomi masyarakat di situasi apapun.",
                                        "Wajib menghormati semua atasan.", "Tetap mengikuti rantai komando.",
                                        "Catat absensi dan keluar masuk barang di brankas.", "DILARANG menggunakan baju bebas saat ON DUTY.",
                                        "DILARANG KERAS KORUPSI!!!", "Anggota ON DUTY wajib stay di KANPOL.",
                                        "DILARANG berkeliaran di luar Kanpol tanpa izin.", "DILARANG berjoget menggunakan pakaian dinas.",
                                        "DILARANG bercanda saat penanganan kasus kriminal.", "Resign hanya diperbolehkan saat pangkat BRIPKA dengan alasan jelas.",
                                        "DILARANG berkata kasar dalam situasi apapun.", "DILARANG menyalahgunakan wewenang tanpa SOP.",
                                        "Wajib melepaskan atribut / seragam saat OFF.", "Wajib menaruh persenjataan kembali ke brankas.",
                                        "Wajib melapor ke radio untuk OFF DUTY.", "Selalu perhatikan absensi (MDT).",
                                        "DILARANG ke Zona Merah saat OFF DUTY (Sanksi tegas).", "Selalu membawa nama baik kepolisian.",
                                        "Saat OFF DUTY dilarang keras bekerja di Disnaker.", "Saat OFF DUTY wajib lepas senjata & atribut.",
                                        "Senjata Laras Panjang HANYA untuk Petinggi & Brimob.", "DILARANG mengoper suspect ke petugas lain tanpa alasan."
                                    ].map((rule, idx) => (
                                        <div key={idx} className="flex gap-2 items-start">
                                            <span className="bg-black text-[#CCFF00] px-2 py-0.5 text-xs font-black rounded-sm">{idx + 1}</span>
                                            <span className="leading-tight">{rule}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="bg-white border-[5px] border-black shadow-[10px_10px_0_0_#000] relative overflow-hidden">
                                <div className="bg-[#FF4D4D] border-b-[5px] border-black p-4 flex items-center gap-3">
                                    <AlertOctagon className="text-black" size={28} />
                                    <h2 className="text-2xl font-[1000] italic uppercase tracking-tight text-black">Peraturan & Sanksi (OOC)</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { t: "Tidak memakai alat komunikasi", s: "SP 1 (OOC)" },
                                            { t: "Tidak memakai baju tugas ke TKP", s: "SP 1 (OOC)" },
                                            { t: "Tingkah laku tidak senonoh", s: "SP 1 (OOC)" },
                                            { t: "Bertugas tidak sesuai SOP", s: "SP 2 (OOC)" },
                                        ].map((item, i) => (
                                            <div key={i} className="bg-slate-100 p-4 border-2 border-black flex flex-col gap-1 shadow-[4px_4px_0_0_#000]">
                                                <span className="font-[1000] uppercase">{item.t}</span>
                                                <span className="text-[#FF4D4D] font-black italic">Hukuman: {item.s}</span>
                                            </div>
                                        ))}
                                        <div className="bg-slate-100 p-4 border-2 border-black flex flex-col gap-1 shadow-[4px_4px_0_0_#000] md:col-span-2">
                                            <span className="font-[1000] uppercase">Melakukan program ilegal / Breakrules</span>
                                            <span className="text-[#FF4D4D] font-black italic">Hukuman: SP 3 / PTDH (OOC)</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {/* TAB: SOP GOV & BERITA LANGIT */}
                    {activeTab === 'GOV' && (
                        <motion.div key="gov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">

                            <div className="bg-black text-white p-4 border-[4px] border-[#FFD100] shadow-[6px_6px_0_0_#FFD100]">
                                <p className="font-bold text-sm italic uppercase text-center">
                                    "GOVERNMENT / FA TIDAK DIWAJIBKAN UNTUK MIC (ON/OFF). BISA TURUNKAN LANGSUNG SESUAI SITUASI!"
                                </p>
                            </div>

                            <section className="bg-white border-[5px] border-black shadow-[10px_10px_0_0_#000]">
                                <div className="bg-[#FFD100] border-b-[5px] border-black p-4 flex items-center gap-3">
                                    <Megaphone className="text-black" size={24} />
                                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">Format Berita Langit (/FA)</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <h3 className="font-black text-sm uppercase bg-slate-200 inline-block px-2 border-2 border-black mb-2">Layanan Mabes</h3>
                                        <div className="space-y-2 font-mono text-xs font-bold text-slate-800">
                                            <div className="bg-green-100 p-3 border-l-4 border-green-500">/FA PELAYANAN ADMINISTRASI MABES POLRI MANDALIKA DAN PENANGANAN TELAH DI BUKA KEMBALI, BAGI WARGA YANG INGIN MEMBUAT SKCK, SIM, DAN LIC WEAPON HARAP MENDATANGI KANTOR KEPOLISIAN 001 MANDALIKAA, TERIMAKASIH!!!</div>
                                            <div className="bg-red-100 p-3 border-l-4 border-red-500">/FA LAYANAN DAN ADMINSTRASI MABES POLRI MANDALIKA TELAH DITUTUP, WARGA DIHIMBAU UNTUK MENJAGA KESELAMATAN DIRINYA. TERIMAKASIH!!!</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm uppercase bg-slate-200 inline-block px-2 border-2 border-black mb-2">Situasi Perampokan</h3>
                                        <div className="space-y-2 font-mono text-xs font-bold text-slate-800">
                                            <div className="bg-amber-100 p-3 border-l-4 border-amber-500">/FA TELAH TERJADI PERAMPOKAN WARUNG ... WARGA DIHIMBAU UNTUK MENJAUHI TKP TERSEBUT, ATAU KAMI TINDAK TEGAS!!!</div>
                                            <div className="bg-blue-100 p-3 border-l-4 border-blue-500">/FA PERAMPOKAN ( WARUNG / BANK ) ... DINYATAKAN CLEAR, MEDIC DI PERSILAHKAN MEMASUKI AREA, WARGA BISA MELANJUTKAN AKTIVITASNYA KEMBALI, TERIMAKASIH!!!</div>
                                            <div className="bg-slate-200 p-3 border-l-4 border-slate-500">/FA POLISI AKAN MELAKUKAN PERBAIKAN ALARM BRANKAS ( WARUNG / BANK ) SELAMA 7 MENIT WAKTU INTERNASIONAL,TERIMA KASIH!!!</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm uppercase bg-slate-200 inline-block px-2 border-2 border-black mb-2">Peperangan Kelompok / Gangwar</h3>
                                        <div className="space-y-2 font-mono text-xs font-bold text-slate-800">
                                            <div className="bg-red-100 p-3 border-l-4 border-red-500">/FA TELAH TERJADI PENEMBAKAN DI DAERAH (....) WARGA HARAP MENJAUHI TKP TERSEBUT, ATAU KITA TINDAK SECARA TEGASS!!</div>
                                            <div className="bg-red-100 p-3 border-l-4 border-red-500">/FA PENEMBAKAN BERPINDAH PINDAH LOKASI. WARGA HARAP TETAP MENJAUHI AREA TKP PEPERANGAN!!!</div>
                                            <div className="bg-red-100 p-3 border-l-4 border-red-500">/FA APABILA DALAM 5 MENIT TERSANGKA PENEMBAKAN TIDAK MEMBUBARKAN DIRI, MAKA KEPOLISIAN AKAN MEMBUBARKAN SECARA PAKSA!!!</div>
                                            <div className="bg-blue-100 p-3 border-l-4 border-blue-500">/FA PENEMBAKAN DI (.....) DINYATAKAN CLEAR, PIHAK MEDIS DI PERSILAHKAN UNTUK MEMASUKI TKP...</div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border-[5px] border-black shadow-[10px_10px_0_0_#000]">
                                <div className="bg-[#3B82F6] border-b-[5px] border-black p-4 flex items-center gap-3">
                                    <Target className="text-black" size={24} />
                                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">SOP Penanganan Perampokan</h2>
                                </div>
                                <div className="p-6 space-y-3 font-bold text-sm">
                                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                                        <li>Sebelum menuju TKP, WAJIB Dispatch siapa yang ikut responding.</li>
                                        <li>Cek Positif/Negatif. Jika positif, buat Berita Langit (/FA).</li>
                                        <li>Negosiasi: Cukup 1 orang negosiator, 1 standby di unit.</li>
                                        <li>Anggota wajib menjaga parameter dan ikuti perintah Negosiator.</li>
                                        <li>Jika suspect membawa 1 sandera, berikan 1 permintaan (Maksimal 2).</li>
                                        <li>Negosiator WAJIB lapor ciri suspect/kendaraan/plate ke radio.</li>
                                        <li>Brimob WAJIB respon. Sabhara/Lantas boleh jika Brimob sedikit.</li>
                                        <li>Jumlah Polisi di TKP: Minimal 5 orang, Maksimal 6 orang.</li>
                                        <li>Penggunaan Senjata: Dessert Eagle.</li>
                                        <li>BOLEH raw 1 armor, TAPI TIDAK dengan perban.</li>
                                    </ul>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {/* TAB: DIVISI */}
                    {activeTab === 'DIVISI' && (
                        <motion.div key="divisi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <div className="bg-white border-[5px] border-black shadow-[10px_10px_0_0_#000] overflow-hidden">
                                <div className="bg-[#3B82F6] p-4 border-b-[5px] border-black"><h2 className="text-xl font-[1000] italic uppercase text-black">KORPS SABHARA</h2></div>
                                <div className="p-6 text-sm font-bold text-slate-700 space-y-4">
                                    <p>Korps Sabhara (Samapta Bhayangkara) adalah unsur pelaksana utama Kepolisian yang bertugas sebagai garda terdepan dalam menjaga keamanan, ketertiban, dan stabilitas wilayah negara.</p>
                                    <h3 className="font-black text-black bg-slate-200 inline-block px-2 border-2 border-black">TUGAS POKOK</h3>
                                    <ul className="list-disc list-inside">
                                        <li>Melaksanakan patroli rutin wilayah.</li>
                                        <li>Menjaga Kamtibmas.</li>
                                        <li>Respon awal laporan kejadian.</li>
                                        <li>Pengamanan objek vital & kegiatan warga.</li>
                                        <li>Mengendalikan situasi kerumunan.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-white border-[5px] border-black shadow-[10px_10px_0_0_#000] overflow-hidden">
                                <div className="bg-[#FF4D4D] p-4 border-b-[5px] border-black"><h2 className="text-xl font-[1000] italic uppercase text-black">BRIMOB (Brigade Mobil)</h2></div>
                                <div className="p-6 text-sm font-bold text-slate-700 space-y-4">
                                    <p>Satuan elite Polri yang bertugas menangani ancaman kamtibmas berintensitas tinggi, kerusuhan massa, terorisme, dan kejahatan bersenjata api.</p>
                                    <h3 className="font-black text-black bg-slate-200 inline-block px-2 border-2 border-black">TUGAS POKOK</h3>
                                    <ul className="list-disc list-inside">
                                        <li>Penanggulangan ancaman tinggi (Terorisme/Separatis).</li>
                                        <li>Pengendalian kerusuhan massa berskala besar.</li>
                                        <li>Operasi khusus (Gegana/Anti huru-hara).</li>
                                        <li>Operasi SAR dalam bencana alam.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-white border-[5px] border-black shadow-[10px_10px_0_0_#000] overflow-hidden">
                                <div className="bg-[#A78BFA] p-4 border-b-[5px] border-black"><h2 className="text-xl font-[1000] italic uppercase text-black">PROPAM</h2></div>
                                <div className="p-6 text-sm font-bold text-slate-700 space-y-4">
                                    <p>Divisi Profesi dan Pengamanan (PROPAM) membina tanggung jawab profesi, pengamanan internal, dan menegakkan disiplin serta kode etik anggota kepolisian.</p>
                                    <h3 className="font-black text-black bg-slate-200 inline-block px-2 border-2 border-black">TUGAS POKOK</h3>
                                    <ul className="list-disc list-inside">
                                        <li>Penegakan disiplin dan etika anggota.</li>
                                        <li>Pelayanan pengaduan masyarakat atas tindakan polisi.</li>
                                        <li>Penyelenggaraan sidang disiplin.</li>
                                        <li>Penyelidikan internal kasus anggota.</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB: SANDI RADIO */}
                    {activeTab === 'SANDI' && (
                        <motion.div key="sandi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-900 text-white border-[5px] border-black p-6 shadow-[10px_10px_0_0_#000]">
                                    <h2 className="text-xl font-[1000] italic uppercase text-[#CCFF00] mb-4">Code Status</h2>
                                    <ul className="font-mono text-xs space-y-2 opacity-90">
                                        <li><span className="text-red-400 font-bold">Code 0</span> : PANIC (ALL Unit Segera Kelokasi)</li>
                                        <li><span className="text-blue-400 font-bold">Code 6</span> : Patroli Area Tertentu</li>
                                        <li><span className="text-blue-400 font-bold">Code 6A</span> : Patroli dengan partner</li>
                                        <li><span className="text-amber-400 font-bold">Code 9</span> : Operasi / Penggerebekan Langsung</li>
                                        <li><span className="text-red-500 font-bold">Code 99</span> : Petugas Dalam Bahaya</li>
                                    </ul>

                                    <h2 className="text-xl font-[1000] italic uppercase text-[#CCFF00] mt-6 mb-4">Location Code</h2>
                                    <ul className="font-mono text-xs space-y-2 opacity-90 h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        <li><span className="text-emerald-400 font-bold">8-4</span> : Suspect turun dari kendaraan</li>
                                        <li><span className="text-emerald-400 font-bold">8-5</span> : Berhenti mengudara (kecuali darurat)</li>
                                        <li><span className="text-emerald-400 font-bold">8-6</span> : Dimengerti</li>
                                        <li><span className="text-emerald-400 font-bold">8-1-0</span> : Izin OFF DUTY</li>
                                        <li><span className="text-emerald-400 font-bold">8-1-1</span> : Izin ON DUTY</li>
                                        <li><span className="text-emerald-400 font-bold">8-1-3</span> : Selamat bertugas</li>
                                        <li><span className="text-emerald-400 font-bold">10-4</span> : Diterima / Roger that</li>
                                        <li><span className="text-emerald-400 font-bold">10-8</span> : Menuju kesana</li>
                                        <li><span className="text-emerald-400 font-bold">10-20</span> : Posisi / Lokasi (10-2)</li>
                                        <li><span className="text-emerald-400 font-bold">10-31</span> : Tindak kejahatan berlangsung</li>
                                        <li><span className="text-emerald-400 font-bold">10-32</span> : Warga membawa senjata</li>
                                        <li><span className="text-emerald-400 font-bold">10-35</span> : Terjadi penembakan</li>
                                        <li><span className="text-emerald-400 font-bold">10-52</span> : Butuh EMS / PMU</li>
                                    </ul>
                                </div>

                                <div className="bg-slate-900 text-white border-[5px] border-black p-6 shadow-[10px_10px_0_0_#000]">
                                    <h2 className="text-xl font-[1000] italic uppercase text-[#FF4D4D] mb-4">Tindak Pidana Code</h2>
                                    <ul className="font-mono text-xs space-y-2 opacity-90 mb-6">
                                        <li><span className="text-amber-400 font-bold">3-1</span> : Kasus Pembegalan</li>
                                        <li><span className="text-amber-400 font-bold">3-1P</span> : Kasus Perampokan</li>
                                        <li><span className="text-amber-400 font-bold">3-2</span> : Kasus Peperangan</li>
                                        <li><span className="text-amber-400 font-bold">2-8-5</span> : Pemerkosaan</li>
                                        <li><span className="text-amber-400 font-bold">3-0-3</span> : Perjudian</li>
                                        <li><span className="text-amber-400 font-bold">3-3-8</span> : Pembunuhan</li>
                                        <li><span className="text-amber-400 font-bold">3-6-3</span> : Pencurian</li>
                                        <li><span className="text-amber-400 font-bold">3-6-5</span> : Perampokan</li>
                                    </ul>

                                    <h2 className="text-xl font-[1000] italic uppercase text-[#00E676] mb-4">Add-On Code</h2>
                                    <ul className="font-mono text-xs space-y-2 opacity-90">
                                        <li><span className="text-blue-400 font-bold">10-38</span> : Traffic Stop</li>
                                        <li><span className="text-blue-400 font-bold">10-57</span> : Pursuit (Pengejaran)</li>
                                        <li><span className="text-blue-400 font-bold">10-60</span> : Pencurian Kendaraan</li>
                                        <li><span className="text-blue-400 font-bold">10-77</span> : Minta Backup (Non Emergency)</li>
                                        <li><span className="text-blue-400 font-bold">10-78</span> : Minta Backup (Emergency)</li>
                                        <li><span className="text-blue-400 font-bold">10-80</span> : Felony Stop</li>
                                        <li><span className="text-blue-400 font-bold">10-95</span> : Pelaku Diamankan</li>
                                        <li><span className="text-blue-400 font-bold">10-99</span> : Status Area Investigasi</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="bg-white border-[5px] border-black shadow-[10px_10px_0_0_#000] p-6">
                                <h3 className="font-black text-lg mb-4 bg-slate-200 inline-block px-2 border-2 border-black">Protokol Komunikasi Lisan</h3>
                                <div className="space-y-4">
                                    <div className="bg-slate-100 p-3 border-l-4 border-blue-500">
                                        <p className="font-bold text-xs text-slate-500 mb-1">Izin Patroli:</p>
                                        <p className="font-mono text-sm font-bold text-black">"MABES-00 (CALLSIGN) IZIN MELINGKAR LINGKAR DI DAERAH (LOKASI) DEMIKIAN."</p>
                                    </div>
                                    <div className="bg-slate-100 p-3 border-l-4 border-blue-500">
                                        <p className="font-bold text-xs text-slate-500 mb-1">Memanggil Perwira/Atasan:</p>
                                        <p className="font-mono text-sm font-bold text-black">"IZIN (Pangkat Anda) (Nama Anda) KEPADA/TO PAK (Pangkat Atasan) (Nama Atasan) 10-2 PAK?"</p>
                                    </div>
                                    <div className="bg-slate-100 p-3 border-l-4 border-red-500">
                                        <p className="font-bold text-xs text-slate-500 mb-1">Merespon Laporan (Contoh Perampokan):</p>
                                        <p className="font-mono text-sm font-bold text-black">"MABES-00 MOHON IZIN (CALLSIGN) 10-8 RESPON (LOKASI) 3-1P SITUASI NON KONDUSIF (SIAGA) DEMIKIAN."</p>
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {/* TAB: LOGISTIK & KENDARAAN */}
                    {activeTab === 'LOGISTIK' && (
                        <motion.div key="logistik" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <section className="bg-white border-[5px] border-black shadow-[10px_10px_0_0_#000] flex flex-col">
                                <div className="bg-[#00E676] border-b-[5px] border-black p-4 flex items-center gap-3">
                                    <Car className="text-black" size={24} />
                                    <h2 className="text-xl font-[1000] italic uppercase tracking-tight text-black">Kendaraan Dinas Sesuai Divisi</h2>
                                </div>
                                <div className="p-6 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                                    <div className="text-sm font-bold border-b-2 border-dashed border-slate-300 pb-3">
                                        <span className="text-blue-600 font-black text-base">PETINGGI:</span> FBI Rancher, Mesa, Huntley, Menyesuaikan Kebutuhan (Bebas).
                                    </div>
                                    <div className="text-sm font-bold border-b-2 border-dashed border-slate-300 pb-3">
                                        <span className="text-emerald-600 font-black text-base">SATLANTAS:</span> HPV-1000, LSPD, SFPD Patroli, Sultan (Max Penggunaan 4 Unit).
                                    </div>
                                    <div className="text-sm font-bold border-b-2 border-dashed border-slate-300 pb-3">
                                        <span className="text-amber-600 font-black text-base">SABHARA:</span> Sanchez, LVPD, LSPD Patroli, Sultan (Max Penggunaan 4 Unit).
                                    </div>
                                    <div className="text-sm font-bold border-b-2 border-dashed border-slate-300 pb-3">
                                        <span className="text-purple-600 font-black text-base">PROPAM:</span> LSPD, Sanchez, Sultan (Max Penggunaan 4 Unit).
                                    </div>
                                    <div className="text-sm font-bold border-b-2 border-dashed border-slate-300 pb-3">
                                        <span className="text-red-600 font-black text-base">BRIMOB (RANSUS):</span> SWAT, Baracuda, Enforcer, Huntley.
                                    </div>
                                    <div className="text-xs font-black italic bg-amber-100 p-3 border-2 border-black mt-4">
                                        *TAMBAHAN: CHEETAH (SPEED HUNTER) HANYA dipergunakan atas seizin Petinggi dan investigasi dalam keadaan darurat!
                                    </div>
                                </div>
                            </section>

                            <section className="bg-slate-900 border-[5px] border-black shadow-[10px_10px_0_0_#000] relative overflow-hidden">
                                <div className="border-b-[5px] border-black p-4 flex items-center gap-3">
                                    <Crosshair className="text-[#CCFF00]" size={28} />
                                    <h2 className="text-2xl font-[1000] italic uppercase tracking-tight text-[#CCFF00]">Logistik Persenjataan</h2>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                                        <div className="flex-1 bg-green-100 border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000]">
                                            <h3 className="font-black uppercase mb-1">Tingkat 1</h3>
                                            <p className="text-sm font-bold mb-2">Desert Eagle, Shotgun</p>
                                            <p className="text-[10px] italic font-bold">Kasus ringan (Patroli, Bubar Massa, Begal). <br />*(Siaga 2, Suspect non-laras)*</p>
                                        </div>
                                        <div className="flex-1 bg-yellow-100 border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000]">
                                            <h3 className="font-black uppercase mb-1">Tingkat 2</h3>
                                            <p className="text-sm font-bold mb-2">MP5, Shotgun</p>
                                            <p className="text-[10px] italic font-bold">Perang / Perampokan Warung/Bank. <br />*(Siaga 3)*</p>
                                        </div>
                                        <div className="flex-1 bg-red-100 border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000]">
                                            <h3 className="font-black uppercase mb-1">Tingkat 3</h3>
                                            <p className="text-sm font-bold mb-2">M4, Sniper</p>
                                            <p className="text-[10px] italic font-bold">Gangwar (Kota Siaga 3), Sandera, Bank Besar. <br />*(Harus Izin Petinggi)*</p>
                                        </div>
                                    </div>

                                    <div className="bg-[#FF4D4D] text-white border-[4px] border-black p-4 shadow-[6px_6px_0_0_#000]">
                                        <h3 className="font-black uppercase flex items-center gap-2 mb-2">
                                            <AlertOctagon size={18} /> PERINGATAN KERAS BINTARA KE BAWAH!
                                        </h3>
                                        <p className="text-xs font-bold leading-relaxed italic">
                                            DILARANG menenteng M4 saat tidak ada kasus besar, KECUALI Divisi Khusus kekurangan personil. Divisi Khusus (KORPS BRIMOB) dipersilakan menenteng M4 saat case apapun, TAPI DILARANG mengeluarkan timah panas terhadap suspect pada kasus: Perampokan Warung, Pembegalan, dan Carsteal!
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
            `}</style>
        </div>
    );
}