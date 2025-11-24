"use client";

import { motion } from 'framer-motion';
import { X, Star, MapPin, Utensils, Camera, ShoppingBag } from 'lucide-react';

interface Waypoint {
    name: string;
    type: string;
    description: string;
    reason: string;
}

interface WaypointDetailProps {
    waypoint: Waypoint | null;
    onClose: () => void;
}

const TypeIcon = ({ type }: { type: string }) => {
    switch (type.toLowerCase()) {
        case 'food': return <Utensils className="w-4 h-4 text-orange-400" />;
        case 'sight': return <Camera className="w-4 h-4 text-purple-400" />;
        case 'shop': return <ShoppingBag className="w-4 h-4 text-pink-400" />;
        default: return <MapPin className="w-4 h-4 text-cyan-400" />;
    }
};

export default function WaypointDetail({ waypoint, onClose }: WaypointDetailProps) {
    if (!waypoint) return null;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-sm z-20 px-4"
        >
            <div className="relative bg-[#0F1115]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 p-5">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 shrink-0">
                        <TypeIcon type={waypoint.type} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-tight mb-1">{waypoint.name}</h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                            <span>{waypoint.type}</span>
                            <span>•</span>
                            <span className="text-cyan-400">Hidden Gem</span>
                        </div>
                    </div>
                </div>

                <p className="text-white/80 text-sm leading-relaxed mb-4 font-light">
                    {waypoint.description}
                </p>

                <div className="bg-gradient-to-r from-pink-500/10 to-cyan-500/10 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Star className="w-3 h-3 text-pink-400" />
                        <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Vibe Check</span>
                    </div>
                    <p className="text-xs text-white/60 italic">
                        "{waypoint.reason}"
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
