"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface UserMenuProps {
    user: any;
    onAuthClick: () => void;
    onLogout: () => void;
}

export default function UserMenu({ user, onAuthClick, onLogout }: UserMenuProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="fixed top-6 right-20 z-50"
        >
            {user ? (
                <div className="relative group">
                    <button
                        className="flex items-center gap-3 pl-1 pr-4 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all hover:border-white/30 group-hover:rounded-b-none group-hover:rounded-t-2xl"
                        title={user.email}
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 p-[1px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-bold text-white">{user.email?.[0].toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-xs font-medium text-white/90 max-w-[100px] truncate">
                                {user.displayName || user.email?.split('@')[0]}
                            </span>
                            <span className="text-[10px] text-white/50">Traveler</span>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute top-full right-0 w-full bg-black/90 border-x border-b border-white/10 rounded-b-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top shadow-xl">
                        <button
                            onClick={onLogout}
                            className="w-full px-4 py-3 text-left text-xs text-red-400 hover:bg-white/10 transition-colors font-medium flex items-center gap-2"
                        >
                            <LogOut className="w-3 h-3" />
                            Sign Out
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={onAuthClick}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 hover:from-cyan-500/20 hover:to-pink-500/20 border border-white/10 hover:border-white/30 rounded-full transition-all group shadow-lg shadow-black/20 backdrop-blur-md"
                >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg>
                    </div>
                    <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 group-hover:from-cyan-300 group-hover:to-pink-300 tracking-wide">
                        Sign In
                    </span>
                </button>
            )}
        </motion.div>
    );
}
