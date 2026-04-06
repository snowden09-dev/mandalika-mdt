"use client";
import { motion } from 'framer-motion';
import { ShieldAlert, Construction, Clock } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#FFD100] flex items-center justify-center p-6 font-mono text-black">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white border-[6px] border-black p-8 md:p-12 max-w-2xl w-full shadow-[16px_16px_0_0_#000] relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 -rotate-12">
                    <Construction size={200} />
                </div>
                <div className="relative z-10 text-center">
                    <div className="bg-red-500 text-white border-4 border-black inline-flex p-4 mb-6 shadow-[4px_4px_0_0_#000]">
                        <ShieldAlert size={48} strokeWidth={3} />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-[1000] italic uppercase tracking-tighter leading-none mb-4">SYSTEM LOCKDOWN</h1>
                    <div className="h-2 bg-black w-full my-6" />
                    <p className="text-sm md:text-lg font-black uppercase italic mb-8">Developer sedang melakukan update sistem.</p>
                    <div className="flex items-center justify-center gap-3 bg-black text-[#CCFF00] py-3 px-6 border-4 border-black font-black uppercase italic animate-pulse">
                        <Clock size={20} /> STATUS: MAINTENANCE
                    </div>
                </div>
            </motion.div>
        </div>
    );
}