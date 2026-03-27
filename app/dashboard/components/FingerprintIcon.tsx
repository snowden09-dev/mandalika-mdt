"use client";

import React from 'react';

export default function FingerprintIcon() {
    return (
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-black shadow-[6px_6px_0_0_#000] bg-black shrink-0 relative flex items-center justify-center">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover mix-blend-screen"
            >
                <source src="/animations/fingerprint.mp4" type="video/mp4" />
                <p>Browser Anda tidak mendukung video HTML5.</p>
            </video>
        </div>
    );
}
