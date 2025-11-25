import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    language?: string;
}

export default function PlaceAutocomplete({ value, onChange, onSelect, placeholder, icon, language = 'en' }: PlaceAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const justSelectedRef = useRef(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const updatePosition = () => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [showSuggestions]);

    useEffect(() => {
        const fetchSuggestions = async () => {
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
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&types=place,locality,poi&limit=5&language=${language}`
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
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => {
                        updatePosition();
                        if (value.length >= 3) setShowSuggestions(true);
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

            {showSuggestions && suggestions.length > 0 && typeof document !== 'undefined' && createPortal(
                <div
                    id="autocomplete-portal"
                    style={{
                        position: 'absolute',
                        top: coords.top + 8,
                        left: coords.left,
                        width: coords.width,
                        zIndex: 99999
                    }}
                >
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-[#0F1115]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto custom-scrollbar"
                        >
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion.id}
                                    onClick={() => handleSelect(suggestion)}
                                    className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm text-white/80 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-center gap-2"
                                >
                                    <MapPin className="w-3 h-3 text-white/30" />
                                    <span className="truncate">{suggestion.place_name}</span>
                                </button>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </div>
    );
}
