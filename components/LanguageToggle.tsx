"use client";

import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white hover:bg-black/60 transition-all group"
        >
            <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-medium">{language === 'en' ? '中文' : 'EN'}</span>
        </motion.button>
    );
}
