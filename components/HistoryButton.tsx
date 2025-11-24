"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Calendar, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface Trip {
    id: string;
    created_at: string;
    start_location: string;
    end_location: string;
    vibe: number;
    days: number;
    waypoints: any[];
    route_geojson: any;
    itinerary_content: string;
}

interface HistoryButtonProps {
    onRestoreTrip: (trip: Trip) => void;
    user: any;
}

export default function HistoryButton({ onRestoreTrip, user }: HistoryButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchTrips();
        }
    }, [isOpen, user]);

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'trips'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const tripsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                created_at: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
            })) as Trip[];

            setTrips(tripsData);
        } catch (error) {
            console.error('Error fetching trips:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, 'trips', id));
            setTrips(trips.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error deleting trip:', error);
        }
    };

    if (!user) return null;

    return (
        <>
            <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center shadow-lg hover:bg-white/10 transition-all z-20 group"
                title="Trip History"
            >
                <Clock className="w-5 h-5 text-white/70 group-hover:text-cyan-400 transition-colors" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ x: -400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -400, opacity: 0 }}
                            className="fixed top-0 left-0 bottom-0 w-full max-w-sm bg-black/90 border-r border-white/10 z-50 p-6 overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Clock className="w-6 h-6 text-cyan-400" />
                                    Your Journeys
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-white/50 rotate-180" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {loading ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                                    </div>
                                ) : trips.length === 0 ? (
                                    <div className="text-center py-10 text-white/30">
                                        <p>No trips saved yet.</p>
                                        <p className="text-sm mt-2">Plan a trip to see it here!</p>
                                    </div>
                                ) : (
                                    trips.map((trip) => (
                                        <motion.div
                                            key={trip.id}
                                            layoutId={trip.id}
                                            onClick={() => {
                                                onRestoreTrip(trip);
                                                setIsOpen(false);
                                            }}
                                            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer transition-all hover:border-cyan-500/30"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(trip.created_at).toLocaleDateString()}
                                                </div>
                                                <button
                                                    onClick={(e) => handleDelete(e, trip.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                                    title="Delete trip"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                                    <span className="text-white font-medium truncate">{trip.start_location}</span>
                                                </div>
                                                <div className="ml-[2px] w-0.5 h-3 bg-white/10" />
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                                    <span className="text-white font-medium truncate">{trip.end_location}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center gap-4 text-xs text-white/40">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {trip.days} Days
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-3 h-3 rounded-full border border-white/20 flex items-center justify-center text-[8px]">{Math.round(trip.vibe / 10)}</span>
                                                    Vibe
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
