"use client";

import { useState, useRef } from 'react'; // Added useRef
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Sparkles, Calendar, X, ChevronUp, Plus, Trash2, MessageSquare } from 'lucide-react';
import PlaceAutocomplete from './PlaceAutocomplete';
import { useLanguage } from '@/contexts/LanguageContext';

interface Waypoint {
    id: string;
    value: string;
}

interface FloatingIslandProps {
    onSearch: (waypoints: string[], vibe: number, days: number, customPreferences: string) => void;
    isSearching: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function FloatingIsland({
    onSearch,
    isSearching,
    isCollapsed = false,
    onToggleCollapse
}: FloatingIslandProps) {
    const { t, language } = useLanguage();
    const [waypoints, setWaypoints] = useState<Waypoint[]>([
        { id: 'waypoint-0', value: '' },
        { id: 'waypoint-1', value: '' }
    ]);
    const [vibe, setVibe] = useState(50);
    const [days, setDays] = useState(1);
    const [customPreferences, setCustomPreferences] = useState('');
    const nextIdRef = useRef(2); // Added useRef for stable IDs

    const addWaypoint = () => {
        if (waypoints.length < 10) {
            setWaypoints([...waypoints, { id: `waypoint-${nextIdRef.current}`, value: '' }]);
            nextIdRef.current++;
        }
    };

    const removeWaypoint = (id: string) => {
        if (waypoints.length > 2) {
            setWaypoints(waypoints.filter((wp) => wp.id !== id));
        }
    };

    const updateWaypoint = (id: string, value: string) => {
        setWaypoints(waypoints.map((wp) =>
            wp.id === id ? { ...wp, value } : wp
        ));
    };

    const handleSearch = () => {
        const filledWaypoints = waypoints.map(wp => wp.value).filter(v => v.trim());
        if (filledWaypoints.length >= 2 && days > 0) {
            onSearch(filledWaypoints, vibe, days, customPreferences);
        }
    };

    // Collapsed state
    if (isCollapsed) {
        return (
            <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={onToggleCollapse}
                className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-110 transition-all z-20 group"
                title={t('island.expand') || "Plan Trip"}
            >
                <ChevronUp className="w-7 h-7 text-white" />
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
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl z-10 px-4"
        >
            <div className="p-8 rounded-3xl bg-black/50 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 relative group">
                {/* Enhanced Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

                {/* Close button */}
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="absolute top-4 right-4 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group/close"
                        title={t('island.collapse') || "Minimize"}
                    >
                        <X className="w-5 h-5 text-white/50 group-hover/close:text-white transition-colors" />
                    </button>
                )}

                <div className="relative space-y-6">
                    {/* Waypoints Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pr-12">
                            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Your Journey</h3>
                            <span className="text-xs text-white/40">{waypoints.filter(w => w.value).length}/10 locations</span>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {waypoints.map((waypoint, index) => (
                                <motion.div
                                    key={waypoint.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="relative flex items-center gap-3"
                                >
                                    {/* Waypoint number indicator */}
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                        {index + 1}
                                    </div>

                                    <PlaceAutocomplete
                                        value={waypoint.value}
                                        onChange={(val) => updateWaypoint(waypoint.id, val)}
                                        onSelect={(place) => {
                                            updateWaypoint(waypoint.id, place.name);
                                        }}
                                        placeholder={index === 0 ? (t('island.startPlaceholder') || "Start location") : (t('island.endPlaceholder') || "End location")}
                                        icon={index === 0 ? <MapPin className="w-5 h-5 text-cyan-400" /> : <MapPin className="w-5 h-5 text-purple-400" />}
                                        language={language}
                                    />
                                    {/* Remove button (only if more than 2 waypoints) */}
                                    {waypoints.length > 2 && (
                                        <button
                                            onClick={() => removeWaypoint(waypoint.id)}
                                            className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 flex items-center justify-center transition-all group/del"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400 group-hover/del:scale-110 transition-transform" />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Add Waypoint Button */}
                        {waypoints.length < 10 && (
                            <button
                                onClick={addWaypoint}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 rounded-xl text-white/70 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2 group/add"
                            >
                                <Plus className="w-4 h-4 group-hover/add:rotate-90 transition-transform" />
                                <span>Add Stop</span>
                            </button>
                        )}
                    </div>

                    {/* Custom Preferences */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Custom Preferences</h3>
                        </div>
                        <textarea
                            value={customPreferences}
                            onChange={(e) => setCustomPreferences(e.target.value)}
                            placeholder="e.g., Focus on historical sites, prefer nature spots, looking for family-friendly activities..."
                            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all resize-none"
                        />
                    </div>

                    {/* Days Input */}
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-4 hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-white/50" />
                            <span className="text-white/70 text-sm font-medium">Duration</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setDays(Math.max(1, days - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                            >
                                -
                            </button>
                            <div className="flex items-baseline gap-1 min-w-[4rem] justify-center">
                                <span className="text-white font-bold text-xl">{days}</span>
                                <span className="text-white/50 text-sm">Day{days > 1 ? 's' : ''}</span>
                            </div>
                            <button
                                onClick={() => setDays(Math.min(14, days + 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Vibe Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-medium tracking-wider text-white/50 uppercase">
                            <span className="text-cyan-400">Efficiency</span>
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 shadow-lg">
                                <span className="text-white font-bold text-lg">{Math.round(vibe / 10)}</span>
                                <span className="text-white/50 text-xs">/10</span>
                            </div>
                            <span className="text-pink-400">Serendipity</span>
                        </div>
                        <div className="relative h-6 flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={vibe}
                                onChange={(e) => setVibe(Number(e.target.value))}
                                className="w-full h-2 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(255,255,255,0.6)] hover:[&::-webkit-slider-thumb]:scale-125 transition-all outline-none"
                            />
                        </div>
                        <p className="text-center text-xs text-white/40 italic">
                            {vibe < 30 ? "Direct route. Minimal stops." : vibe > 70 ? "Scenic journey. Maximum discovery." : "Balanced exploration."}
                        </p>
                    </div>

                    {/* Launch Button */}
                    <button
                        onClick={handleSearch}
                        disabled={waypoints.filter(w => w).length < 2 || isSearching}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 border border-white/20 hover:border-white/30 rounded-xl text-white font-bold text-lg tracking-wide uppercase transition-all flex items-center justify-center gap-3 group/btn disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg"
                    >
                        {isSearching ? (
                            <span className="animate-pulse">Planning Your Journey...</span>
                        ) : (
                            <>
                                <span>Launch</span>
                                <Sparkles className="w-5 h-5 text-pink-400 group-hover/btn:rotate-12 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
