"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, FileText, Shield, Search, ChevronRight, 
    Lock, Bookmark, Info 
} from 'lucide-react';

interface HandbookProps {
    divisi: string;
    isPetinggi: boolean;
}

interface HandbookChapter {
    id: string;
    title: string;
    category: string;
    summary: string;
    content: string;
    restricted?: boolean;
}

const chapters: HandbookChapter[] = [
    {
        id: '1',
        title: 'Prosedur Standar Operasional (SOP) Penindakan',
        category: 'Umum',
        summary: 'Panduan lengkap mengenai protokol penindakan di lapangan dan penanganan tersangka.',
        content: 'Setiap anggota wajib mematuhi eskalasi penggunaan kekuatan (use of force). Penindakan harus dilakukan dengan humanis namun tetap tegas sesuai dengan undang-undang yang berlaku di yurisdiksi.',
    },
    {
        id: '2',
        title: 'Kode Etik & Disiplin Anggota',
        category: 'Umum',
        summary: 'Aturan kedisiplinan, hierarki kepangkatan, dan sanksi pelanggaran internal.',
        content: 'Menjaga marwah institusi adalah kewajiban mutlak. Segala bentuk pelanggaran kode etik, penyalahgunaan wewenang, atau tindakan indisipliner akan diproses melalui Sidang Divisi Propam.',
    },
    {
        id: '3',
        title: 'Manajemen Divisi & Spesialisasi',
        category: 'Divisional',
        summary: 'Tugas pokok dan fungsi khusus berdasarkan penempatan divisi masing-masing.',
        content: 'Setiap divisi memiliki fokus operasional tersendiri mulai dari patroli rutin, investigasi kriminal, hingga taktik khusus. Koordinasi antar-divisi wajib dijaga dalam setiap operasi skala besar.',
    },
    {
        id: '4',
        title: 'Dokumentasi & Pelaporan Kasus (MDT)',
        category: 'Administrasi',
        summary: 'Cara pengisian laporan penangkapan, tilang, dan database investigasi.',
        content: 'Seluruh tindakan kepolisian wajib diinput ke dalam sistem MDT selambat-lambatnya 1x24 jam setelah penugasan selesai untuk keperluan audit dan rekapitulasi kinerja.',
    },
    {
        id: '5',
        title: 'Protokol Darurat & Komunikasi Radio',
        category: 'Taktis',
        summary: 'Penggunaan frekuensi radio dan kode sandi darurat (10-Codes / Signals).',
        content: 'Channel radio utama harus selalu dipantau. Gunakan kode sandi yang tepat saat menyampaikan situasi darurat (Code 0, Code 3, dll.) untuk respon cepat satuan.',
    },
    {
        id: '6',
        title: 'Kebijakan Khusus Pimpinan (High Command)',
        category: 'Internal',
        summary: 'Pedoman eksklusif untuk manajemen internal dan arahan komando tinggi.',
        content: 'Dokumen ini berisi arahan strategis, kebijakan anggaran, dan manajemen promosi personel yang bersifat rahasia.',
        restricted: true,
    },
];

export default function SectionHandbook({ divisi, isPetinggi }: HandbookProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [activeChapter, setActiveChapter] = useState<HandbookChapter | null>(null);

    const categories = ['Semua', 'Umum', 'Divisional', 'Administrasi', 'Taktis', 'Internal'];

    const filteredChapters = chapters.filter(chap => {
        const matchesCategory = selectedCategory === 'Semua' || chap.category === selectedCategory;
        const matchesSearch = chap.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              chap.summary.toLowerCase().includes(searchQuery.toLowerCase());
        const canView = !chap.restricted || isPetinggi;
        return matchesCategory && matchesSearch && canView;
    });

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20 text-white font-sans"
        >
            {/* --- HERO BANNER: HANDBOOK INTRO --- */}
            <div className="bg-[#18181B] border border-white/5 rounded-[28px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl shadow-black/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center shrink-0">
                        <BookOpen size={32} className="text-red-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
                                Divisi: {divisi}
                            </span>
                            {isPetinggi && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1">
                                    <Shield size={10} /> High Command Access
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">
                            Buku Pedoman & SOP
                        </h2>
                        <p className="text-xs md:text-sm text-zinc-400 mt-1">
                            Pusat informasi regulasi, standar operasional, dan panduan tugas resmi institusi.
                        </p>
                    </div>
                </div>

                {/* Quick Search */}
                <div className="w-full md:w-72 relative z-10">
                    <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                            type="text"
                            placeholder="Cari pedoman atau SOP..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* --- CATEGORY TABS --- */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            selectedCategory === cat 
                                ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' 
                                : 'bg-[#18181B] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* --- CHAPTERS GRID / LIST --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredChapters.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-[#18181B] border border-white/5 rounded-[28px] text-zinc-500">
                        <Info size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium uppercase tracking-wider">Tidak ada dokumen ditemukan</p>
                    </div>
                ) : (
                    filteredChapters.map((chap) => (
                        <motion.div 
                            key={chap.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setActiveChapter(chap)}
                            className="bg-[#18181B] border border-white/5 hover:border-red-500/30 rounded-2xl p-6 cursor-pointer flex flex-col justify-between transition-all shadow-lg shadow-black/20 group relative overflow-hidden"
                        >
                            {chap.restricted && (
                                <div className="absolute top-4 right-4 text-amber-400 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                                    <Lock size={14} />
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-md border border-red-500/20">
                                        {chap.category}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-zinc-100 group-hover:text-red-400 transition-colors mb-2">
                                    {chap.title}
                                </h3>
                                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                                    {chap.summary}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors">
                                <span className="flex items-center gap-1.5">
                                    <FileText size={14} className="text-red-500" /> Baca Dokumen
                                </span>
                                <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform text-red-500" />
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* --- MODAL / READER POPUP --- */}
            <AnimatePresence>
                {activeChapter && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#18181B] border border-white/10 rounded-[28px] max-w-2xl w-full p-6 md:p-8 shadow-2xl relative max-h-[85vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
                                        <Bookmark size={20} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-red-400 uppercase tracking-widest">{activeChapter.category}</span>
                                        <h3 className="text-lg font-bold text-zinc-100">{activeChapter.title}</h3>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActiveChapter(null)}
                                    className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto space-y-4 pr-2 text-zinc-300 text-sm leading-relaxed">
                                <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl font-medium text-zinc-200">
                                    {activeChapter.summary}
                                </div>
                                <p className="whitespace-pre-line text-zinc-300">
                                    {activeChapter.content}
                                </p>
                            </div>

                            <div className="mt-8 pt-4 border-t border-white/5 flex justify-end">
                                <button 
                                    onClick={() => setActiveChapter(null)}
                                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-red-900/20"
                                >
                                    Tutup Dokumen
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}