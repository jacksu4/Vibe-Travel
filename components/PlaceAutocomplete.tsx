"use client";

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Suggestion {
    id: string;
    place_name: string;
    center: [number, number];
}

interface PlaceAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (place: { name: string; coordinates: [number, number] }) => void;
    placeholder?: string;
    icon?: React.ReactNode;
}

export default function PlaceAutocomplete({ value, onChange, onSelect, placeholder, icon }: PlaceAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const justSelectedRef = useRef(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchSuggestions = async () => {
            // If user just selected a value, skip fetching
            if (justSelectedRef.current) {
                justSelectedRef.current = false;
                return;
            }

            if (!value || value.length < 3) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            setIsLoading(true);
            try {
                const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
                if (!token) return;

                const res = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&types=place,locality,poi&limit=5`
                );
                const data = await res.json();
                setSuggestions(data.features || []);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Autocomplete error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [value]);

    const handleSelect = (suggestion: Suggestion) => {
        justSelectedRef.current = true;
        onChange(suggestion.place_name);
        onSelect({ name: suggestion.place_name, coordinates: suggestion.center });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative flex items-center gap-3">
                {icon || <MapPin className="w-5 h-5 text-cyan-400 shrink-0 z-10 bg-black/50 rounded-full p-0.5 box-content" />}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setShowSuggestions(true);
                    }}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#0F1115]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 max-h-60 overflow-y-auto"
                    >
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion.id}
                                onClick={() => handleSelect(suggestion)}
                                className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-white/80 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-center gap-2"
                            >
                                <MapPin className="w-3 h-3 text-white/30" />
                                <span className="truncate">{suggestion.place_name}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
