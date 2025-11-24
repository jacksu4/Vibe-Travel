"use client";

import { motion } from 'framer-motion';
import { X, Star, MapPin } from 'lucide-react';

interface GemCardProps {
    gem: {
        name: string;
        description: string;
        image: string;
        reason: string;
    } | null;
    onClose: () => void;
}

export default function GemCard({ gem, onClose }: GemCardProps) {
    if (!gem) return null;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-20 px-4"
        >
            <div className="relative bg-[#0F1115] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-black/60 transition-all border border-white/5"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Image */}
                <div className="relative h-64 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-transparent to-transparent z-10" />
                    {/* Using standard img for simplicity, in production use next/image */}
                    <img
                        src={gem.image}
                        alt={gem.name}
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute bottom-4 left-6 z-20">
                        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-1">
                            <MapPin className="w-3 h-3" />
                            <span>Hidden Gem Discovered</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">{gem.name}</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 pt-2 space-y-4">
                    <p className="text-white/80 leading-relaxed font-light text-lg">
                        {gem.description}
                    </p>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-pink-500" />
                            <span className="text-xs font-bold text-pink-500 uppercase tracking-wider">Why this spot?</span>
                        </div>
                        <p className="text-sm text-white/60 italic">
                            "{gem.reason}"
                        </p>
                    </div>

                    <button className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-cyan-400 font-medium transition-all uppercase tracking-wide text-sm">
                        Add to Itinerary
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
