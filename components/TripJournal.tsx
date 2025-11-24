"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Download, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TripJournalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    title?: string;
}

export default function TripJournal({ isOpen, onClose, content, title = "Your Travel Story" }: TripJournalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 pointer-events-none"
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="bg-[#1a1a1a] w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto border border-white/10 relative"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 rounded-xl border border-white/10">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{title}</h2>
                                <p className="text-xs text-white/40 uppercase tracking-wider">AI Generated Itinerary</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors" title="Download">
                                <Download className="w-5 h-5" />
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#111]">
                        <div className="prose prose-invert prose-cyan max-w-none">
                            <ReactMarkdown
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent mb-6" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-white mt-8 mb-4 flex items-center gap-2 border-b border-white/10 pb-2" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-lg font-medium text-cyan-300 mt-6 mb-2" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-gray-300 leading-relaxed mb-4" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="space-y-2 my-4" {...props} />,
                                    li: ({ node, ...props }) => <li className="flex items-start gap-2 text-gray-300" {...props} ><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" /><span>{props.children}</span></li>,
                                    strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />,
                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-pink-500/50 pl-4 italic text-gray-400 my-6 bg-white/5 p-4 rounded-r-lg" {...props} />,
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
