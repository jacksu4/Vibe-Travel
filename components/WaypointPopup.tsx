"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MapPin, Utensils, Camera, ShoppingBag, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Waypoint {
    name: string;
    type: string;
    description: string;
    reason: string;
    rating?: number;
    image_keyword?: string;
    coordinates?: [number, number];
}

interface WaypointPopupProps {
    waypoint: Waypoint | null;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
    nearbyPlaces?: any[];
    isLoadingNearby?: boolean;
    onNearbyClick?: (place: any) => void;
    isNearbyPlace?: boolean;
}

const TypeIcon = ({ type }: { type: string }) => {
    const typeStr = type?.toLowerCase() || 'other';
    switch (typeStr) {
        case 'food': return <Utensils className="w-4 h-4 text-orange-400" />;
        case 'sight': return <Camera className="w-4 h-4 text-purple-400" />;
        case 'shop': return <ShoppingBag className="w-4 h-4 text-pink-400" />;
        case 'activity': return <Star className="w-4 h-4 text-cyan-400" />;
        default: return <MapPin className="w-4 h-4 text-cyan-400" />;
    }
};

export default function WaypointPopup({ waypoint, onClose, onNext, onPrev, hasNext, hasPrev, nearbyPlaces, isLoadingNearby, onNearbyClick, isNearbyPlace }: WaypointPopupProps) {
    const { t } = useLanguage();
    const [photos, setPhotos] = useState<string[]>([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
    const [photoError, setPhotoError] = useState(false);

    // Fetch real photos from Google Places API
    useEffect(() => {
        if (!waypoint) return;

        async function fetchPhotos() {
            if (!waypoint?.coordinates) {
                setIsLoadingPhotos(false);
                setPhotoError(true);
                return;
            }

            setIsLoadingPhotos(true);
            setPhotoError(false);
            setCurrentPhotoIndex(0);

            try {
                const response = await fetch('/api/place-photos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: waypoint.name,
                        coordinates: waypoint.coordinates
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.photos && data.photos.length > 0) {
                        setPhotos(data.photos.map((p: any) => p.url));
                    } else {
                        setPhotoError(true);
                    }
                } else {
                    setPhotoError(true);
                }
            } catch (error) {
                console.error('Failed to fetch photos:', error);
                setPhotoError(true);
            } finally {
                setIsLoadingPhotos(false);
            }
        }

        fetchPhotos();
    }, [waypoint?.name, waypoint?.coordinates]);

    if (!waypoint) return null;

    const handleNextPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    };

    const handlePrevPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    const getTypeLabel = (type: string) => {
        const typeKey = type.toLowerCase();
        return t(`popup.types.${typeKey}`) || t('popup.types.other');
    };

    const getTypeIcon = (type: string) => {
        const typeStr = type?.toLowerCase() || 'other';
        switch (typeStr) {
            case 'food': return '🍴';
            case 'sight': return '📸';
            case 'shop': return '🛍️';
            case 'activity': return '🎯';
            default: return '📍';
        }
    };

    const hasNearby = nearbyPlaces && nearbyPlaces.length > 0;
    const hasMultiplePhotos = photos.length > 1;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-lg z-20 px-4 max-h-[70vh] overflow-y-auto"
        >
            <div className="relative bg-[#0F1115]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/80">

                {/* Photo Gallery Header */}
                <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                    {isLoadingPhotos ? (
                        // Loading state
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-12 h-12 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-xs text-white/50">Loading photos...</p>
                            </div>
                        </div>
                    ) : photoError || photos.length === 0 ? (
                        // No photos state
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                            <div className="text-center px-6">
                                <ImageIcon className="w-16 h-16 text-white/20 mx-auto mb-3" />
                                <p className="text-sm text-white/60 font-medium">No Photos Available</p>
                                <p className="text-xs text-white/40 mt-1">Photos from Google Places coming soon</p>
                            </div>
                        </div>
                    ) : (
                        // Photos carousel
                        <div className="relative w-full h-full">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentPhotoIndex}
                                    src={photos[currentPhotoIndex]}
                                    alt={`${waypoint.name} photo ${currentPhotoIndex + 1}`}
                                    className="w-full h-full object-cover"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                />
                            </AnimatePresence>

                            {/* Photo navigation arrows */}
                            {hasMultiplePhotos && (
                                <>
                                    <button
                                        onClick={handlePrevPhoto}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white/80 hover:text-white transition-all backdrop-blur-sm"
                                        aria-label="Previous photo"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleNextPhoto}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white/80 hover:text-white transition-all backdrop-blur-sm"
                                        aria-label="Next photo"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    {/* Photo counter */}
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full">
                                        <p className="text-xs text-white font-medium">
                                            {currentPhotoIndex + 1} / {photos.length}
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115]/90 to-transparent pointer-events-none" />
                        </div>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-sm z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Photo indicator dots */}
                    {photos.length > 1 && photos.length <= 5 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {photos.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentPhotoIndex(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${index === currentPhotoIndex
                                            ? 'bg-white w-6'
                                            : 'bg-white/40 hover:bg-white/60'
                                        }`}
                                    aria-label={`Go to photo ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 pt-3">
                    <div className="flex items-start gap-4 mb-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 shrink-0">
                            <TypeIcon type={waypoint.type} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-tight mb-1">{waypoint.name}</h3>
                            <div className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider">
                                <span>{getTypeLabel(waypoint.type)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-yellow-400">
                                    <Star className="w-3 h-3 fill-yellow-400" />
                                    {waypoint.rating || '4.5'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="text-white/80 text-sm leading-relaxed mb-4 font-light">
                        {waypoint.description}
                    </p>

                    <div className="bg-gradient-to-r from-pink-500/10 to-cyan-500/10 rounded-lg p-3 border border-white/5 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Star className="w-3 h-3 text-pink-400" />
                            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">{t('popup.vibeCheck')}</span>
                        </div>
                        <p className="text-xs text-white/60 italic">
                            "{waypoint.reason}"
                        </p>
                    </div>

                    {/* Nearby Places Section */}
                    {!isNearbyPlace && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span>🔍</span>
                                <span>{t('popup.nearbyPlaces') || 'Nearby Places'}</span>
                                <span className="text-white/40 text-[10px] font-normal">({t('popup.within3km') || 'within 3km'})</span>
                            </h4>

                            {isLoadingNearby ? (
                                <div className="text-center py-4">
                                    <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                                    <p className="text-xs text-white/40 mt-2">{t('popup.loadingNearby') || 'Finding nearby places...'}</p>
                                </div>
                            ) : hasNearby ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {nearbyPlaces?.map((place, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onNearbyClick && onNearbyClick(place)}
                                            className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 hover:border-amber-500/30 transition-all group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                                                    {getTypeIcon(place.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h5 className="text-sm font-semibold text-white leading-tight truncate">
                                                            {place.name}
                                                        </h5>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                            <span className="text-xs font-bold text-yellow-400">{place.rating}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-white/60 mt-1 line-clamp-2">
                                                        {place.description}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40">
                                                        <span>{place.review_count} reviews</span>
                                                        <span>•</span>
                                                        <span>{place.distance}km away</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 px-4 bg-white/5 rounded-lg border border-white/5">
                                    <p className="text-sm text-white/50">{t('popup.noNearbyPlaces') || 'No nearby places found within 3km'}</p>
                                    <p className="text-xs text-white/30 mt-1">{t('popup.tryDifferentLocation') || 'Try selecting a different waypoint'}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Controls - only show if onNext/onPrev are provided */}
                    {(onNext || onPrev) && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-4">
                            <button
                                onClick={onPrev}
                                disabled={!hasPrev}
                                className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white disabled:opacity-30 disabled:hover:text-white/50 transition-colors uppercase tracking-wider"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                {t('popup.prevStop')}
                            </button>
                            <button
                                onClick={onNext}
                                disabled={!hasNext}
                                className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white disabled:opacity-30 disabled:hover:text-white/50 transition-colors uppercase tracking-wider"
                            >
                                {t('popup.nextStop')}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
