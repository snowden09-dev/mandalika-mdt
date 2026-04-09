'use client';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';

interface Props { time: string; status: string; isLoading: boolean; handleLogin: () => void; }

const dropIn: Variants = { hidden: { opacity: 0, y: -100 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 12 } } };
const float: Variants = { animate: { y: [0, -10, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } } };

export default function LandingNeo({ time, status, isLoading, handleLogin }: Props) {
    return (
        <main className="min-h-screen bg-[#E0E7FF] text-black flex items-center justify-center p-6 relative overflow-hidden font-mono">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
                <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-[#FFD100] border-4 border-black rounded-full shadow-[8px_8px_0_0_#000] rotate-12 hidden lg:block" />
                <div className="absolute bottom-[15%] right-[10%] w-48 h-48 bg-[#00E676] border-4 border-black shadow-[12px_12px_0_0_#000] -rotate-6 hidden lg:block" />
                <div className="absolute top-[20%] right-[5%] w-24 h-24 bg-[#FF4D4D] border-b-[20px] border-black hidden lg:block" />
            </div>

            <motion.div variants={float} animate="animate" className="hidden lg:flex absolute left-12 top-24 w-64 bg-white border-4 border-black p-4 flex-col gap-2 shadow-[10px_10px_0px_0px_#3B82F6] rotate-[-2deg]">
                <div className="bg-[#3B82F6] p-2 font-black text-center border-b-4 border-black uppercase italic">Mandalika Time</div>
                <p className="text-4xl font-black text-center py-4 tracking-tighter">{time || '00:00:00'}</p>
                <p className="text-[10px] font-black bg-[#FFD100] p-1 text-center border-2 border-black uppercase">RADAR_STATUS: ACTIVE</p>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={dropIn} className="w-full max-w-sm bg-white border-[6px] border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] z-10 relative overflow-hidden">
                <div className="bg-[#FFD100] border-b-4 border-black p-2 flex justify-between items-center px-4">
                    <span className="font-black text-[12px] italic uppercase tracking-widest">Official MDT v2.0</span>
                    <div className={`w-4 h-4 bg-[#FF4D4D] border-2 border-black rounded-full ${isLoading ? 'animate-ping' : 'animate-pulse'}`} />
                </div>
                <div className="p-8 flex flex-col items-center text-black">
                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="bg-[#A78BFA] border-4 border-black p-4 shadow-[8px_8px_0px_0px_#000] mb-8">
                        <Image src="/logo-polisi.png" alt="Logo" width={96} height={96} className="w-20 h-20 md:w-24 md:h-24 object-contain" />
                    </motion.div>
                    <h1 className="text-5xl font-[1000] text-center uppercase leading-none tracking-tighter mb-2 italic">
                        MANDALIKA<br /><span className="text-[#3B82F6] underline decoration-black decoration-8 underline-offset-4 italic">POLICE</span>
                    </h1>
                    <p className="bg-black text-[#00E676] px-4 py-1 font-black text-sm uppercase mb-8 italic">Mobile Data Terminal</p>
                    <div className="w-full space-y-4">
                        <motion.button onClick={handleLogin} disabled={isLoading} whileHover={{ x: 8, y: -8, boxShadow: "0px 0px 0px 0px #000" }} whileTap={{ scale: 0.95 }} className={`w-full ${isLoading ? 'bg-gray-400' : 'bg-[#5865F2]'} text-black font-[1000] text-2xl py-5 border-4 border-black shadow-[10px_10px_0px_0px_#000] flex items-center justify-center gap-4 transition-all`}>
                            <Image src="/discord-login.png" alt="Discord" width={40} height={40} className="w-10 h-10" />
                            <span>{status}</span>
                        </motion.button>
                        <div className="bg-[#FF4D4D] border-4 border-black p-3 shadow-[6px_6px_0px_0px_#000]">
                            <p className="text-[10px] font-black text-center uppercase leading-tight italic">PERINGATAN: AKSES TANPA IZIN AKAN DILACAK {'&'} DITINDAK.</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}