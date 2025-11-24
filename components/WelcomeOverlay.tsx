"use client";

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function WelcomeOverlay() {
    const { t } = useLanguage();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-5 flex items-center justify-center pointer-events-none"
        >
            <div className="text-center space-y-6 px-4">
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="relative"
                >
                    <h1 className="text-7xl md:text-8xl font-bold tracking-tighter bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                        {t('hero.title') || "VIBE TRAVEL"}
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="relative"
                >
                    <p className="text-xl md:text-2xl font-light tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] bg-black/20 backdrop-blur-sm px-6 py-2 rounded-full inline-block">
                        {t('hero.subtitle') || "Discover the Soul of the City"}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="relative"
                >
                    <p className="text-sm md:text-base font-light tracking-wider text-white/90 italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] bg-black/20 backdrop-blur-sm px-4 py-1 rounded-full inline-block">
                        {t('hero.tagline') || "Not just a map. A journey."}
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
