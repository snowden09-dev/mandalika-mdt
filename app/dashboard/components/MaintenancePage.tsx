"use client";
import { motion } from 'framer-motion';
import { PowerOff, Globe, MessageSquare } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#FFD100] flex items-center justify-center p-6 font-mono text-black">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white border-[6px] border-black p-8 md:p-12 max-w-2xl w-full shadow-[16px_16px_0_0_#000] relative overflow-hidden"
            >
                {/* Background Icon - Dunia Nyata */}
                <div className="absolute top-0 right-0 p-4 opacity-10 -rotate-12">
                    <Globe size={200} />
                </div>
                
                <div className="relative z-10 text-center">
                    {/* Main Alert Icon - Sistem Mati */}
                    <div className="bg-red-500 text-white border-4 border-black inline-flex p-4 mb-6 shadow-[4px_4px_0_0_#000]">
                        <PowerOff size={48} strokeWidth={3} />
                    </div>
                    
                    {/* Heading */}
                    <h1 className="text-4xl md:text-5xl font-[1000] italic uppercase tracking-tighter leading-none mb-4">
                        SISTEM DINONAKTIFKAN
                    </h1>
                    
                    <div className="h-2 bg-black w-full my-6" />
                    
                    {/* Message */}
                    <p className="text-sm md:text-lg font-black uppercase italic mb-8">
                        Terima kasih semuanya! Sistem telah dinonaktifkan karena developer lagi sibuk dengan dunia nyatanya. 
                        <br /><br />
                        <span className="text-red-600">Segala administrasi anggota akan dialihkan secara manual di Discord Kepolisian.</span>
                    </p>
                    
                    {/* Status Badge */}
                    <div className="flex items-center justify-center gap-3 bg-black text-[#CCFF00] py-3 px-6 border-4 border-black font-black uppercase italic animate-pulse">
                        <MessageSquare size={20} /> STATUS: SYSTEM OFF
                    </div>
                </div>
            </motion.div>
        </div>
    );
}