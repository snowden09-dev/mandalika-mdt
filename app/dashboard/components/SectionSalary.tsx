"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, LucideIcon } from 'lucide-react';

interface ActionBannerProps {
    icon: LucideIcon;
    title: string;
    description: React.ReactNode;
    buttonText: string;
    buttonLink: string;
    buttonIcon?: LucideIcon;
    colorTheme?: 'indigo' | 'emerald' | 'blue' | 'amber';
    children?: React.ReactNode; // Jika ingin menambahkan History Log di bawahnya
}

const themeStyles = {
    indigo: {
        gradient: "from-blue-500 via-indigo-500 to-purple-500",
        ambient: "bg-indigo-500/10",
        iconColor: "text-indigo-400",
        iconBorder: "border-indigo-500/20",
        buttonBg: "bg-indigo-600 hover:bg-indigo-500",
        buttonShadow: "shadow-indigo-900/20"
    },
    emerald: {
        gradient: "from-emerald-400 via-emerald-500 to-teal-500",
        ambient: "bg-emerald-500/10",
        iconColor: "text-emerald-400",
        iconBorder: "border-emerald-500/20",
        buttonBg: "bg-emerald-600 hover:bg-emerald-500",
        buttonShadow: "shadow-emerald-900/20"
    },
    blue: {
        gradient: "from-cyan-500 via-blue-500 to-indigo-500",
        ambient: "bg-blue-500/10",
        iconColor: "text-blue-400",
        iconBorder: "border-blue-500/20",
        buttonBg: "bg-blue-600 hover:bg-blue-500",
        buttonShadow: "shadow-blue-900/20"
    },
    amber: {
        gradient: "from-amber-400 via-orange-500 to-red-500",
        ambient: "bg-amber-500/10",
        iconColor: "text-amber-400",
        iconBorder: "border-amber-500/20",
        buttonBg: "bg-amber-600 hover:bg-amber-500",
        buttonShadow: "shadow-amber-900/20"
    }
};

export default function ActionBanner({
    icon: Icon,
    title,
    description,
    buttonText,
    buttonLink,
    buttonIcon: ButtonIcon = ExternalLink,
    colorTheme = 'indigo',
    children
}: ActionBannerProps) {
    const style = themeStyles[colorTheme];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20 text-white"
        >
            {/* --- HERO BANNER --- */}
            <div className="bg-[#18181B] border border-white/5 rounded-[28px] p-8 md:p-12 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-xl shadow-black/20">
                {/* Efek Gradasi Ambient Berdasarkan Tema */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${style.gradient}`}></div>
                <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none ${style.ambient}`}></div>
                
                {/* Ikon Utama */}
                <div className={`w-20 h-20 border rounded-full flex items-center justify-center mb-6 relative z-10 ${style.ambient} ${style.iconBorder}`}>
                    <Icon size={36} className={style.iconColor} />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight relative z-10">
                    {title}
                </h2>
                
                <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed relative z-10">
                    {description}
                </p>
                
                <a 
                    href={buttonLink}
                    target="_blank" 
                    rel="noreferrer" 
                    className={`relative z-10 flex items-center gap-3 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg ${style.buttonBg} ${style.buttonShadow}`}
                >
                    <span>{buttonText}</span>
                    <ButtonIcon size={18} />
                </a>
            </div>

            {/* --- EXTRA CONTENT (History Log, dsb.) --- */}
            {children}
            
        </motion.div>
    );
}