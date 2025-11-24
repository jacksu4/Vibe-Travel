"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Sparkles, Calendar, X, ChevronUp } from 'lucide-react';
import PlaceAutocomplete from './PlaceAutocomplete';
import { useLanguage } from '@/contexts/LanguageContext';

interface FloatingIslandProps {
    onSearch: (start: string, end: string, vibe: number, days: number) => void;
    isSearching: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function FloatingIsland({ onSearch, isSearching, isCollapsed = false, onToggleCollapse }: FloatingIslandProps) {
    const { t } = useLanguage();
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [vibe, setVibe] = useState(50); // 0 = Efficient, 100 = Wanderlust
    const [days, setDays] = useState(1);

    const handleSearch = () => {
        if (start && end && days > 0) {
            onSearch(start, end, vibe, days);
        }
    };

    // Collapsed state - small button in bottom right
    if (isCollapsed) {
        return (
            <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={onToggleCollapse}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-110 transition-all z-20 group"
                title={t('island.expand') || "Plan Trip"}
            >
                <ChevronUp className="w-6 h-6 text-white" />
                <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform" />
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md z-10 px-4"
        >
            <div className="p-6 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

                {/* Close button */}
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group/close"
                        title={t('island.collapse') || "Minimize"}
                    >
                        <X className="w-4 h-4 text-white/50 group-hover/close:text-white transition-colors" />
                    </button>
                )}

                <div className="relative space-y-6">
                    {/* Inputs */}
                    <div className="relative space-y-4">
                        {/* Connector Line */}
                        <div className="absolute left-3.5 top-8 bottom-20 w-0.5 bg-gradient-to-b from-cyan-500/50 to-pink-500/50" />

                        <PlaceAutocomplete
                            value={start}
                            onChange={setStart}
                            onSelect={(place) => setStart(place.name)}
                            placeholder="Where are you?"
                            icon={<MapPin className="w-5 h-5 text-cyan-400 shrink-0 z-10 bg-black/50 rounded-full p-0.5 box-content" />}
                        />

                        <PlaceAutocomplete
                            value={end}
                            onChange={setEnd}
                            onSelect={(place) => setEnd(place.name)}
                            placeholder="Where to?"
                            icon={<Navigation className="w-5 h-5 text-pink-400 shrink-0 z-10 bg-black/50 rounded-full p-0.5 box-content" />}
                        />

                        {/* Days Input */}
                        <div className="relative flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-white/50 shrink-0 z-10 bg-black/50 rounded-full p-0.5 box-content" />
                            <div className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 group/input focus-within:bg-white/10 focus-within:border-cyan-500/30 transition-all">
                                <span className="text-white/50 text-sm font-medium">Duration</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setDays(Math.max(1, days - 1))}
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                    >
                                        -
                                    </button>
                                    <div className="flex items-baseline gap-1 min-w-[3rem] justify-center">
                                        <span className="text-white font-bold text-lg">{days}</span>
                                        <span className="text-white/50 text-xs">Days</span>
                                    </div>
                                    <button
                                        onClick={() => setDays(Math.min(14, days + 1))}
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vibe Slider */}
                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-medium tracking-wider text-white/50 uppercase">
                        <span className="text-cyan-400">Efficiency</span>
                        <span className="text-pink-400">Serendipity</span>
                    </div>
                    <div className="relative h-6 flex items-center group/slider">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={vibe}
                            onChange={(e) => setVibe(Number(e.target.value))}
                            className="w-full h-1.5 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)] hover:[&::-webkit-slider-thumb]:scale-125 transition-all outline-none"
                        />
                    </div>
                    <p className="text-center text-xs text-white/40 italic h-4">
                        {vibe < 30 ? "Direct route. Minimal stops." : vibe > 70 ? "Taking the scenic route. +2h travel time." : "Balanced mix of speed and sights."}
                    </p>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleSearch}
                    disabled={!start || !end || isSearching}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium tracking-wide uppercase transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                    {isSearching ? (
                        <span className="animate-pulse">Calculating Route...</span>
                    ) : (
                        <>
                            <span>Launch</span>
                            <Sparkles className="w-4 h-4 text-pink-400 group-hover/btn:rotate-12 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
