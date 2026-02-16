"use client";

import React from "react";
import { motion } from "framer-motion";
import { Coffee, Eye, Activity, Heart, Frown } from "lucide-react";

type Props = {
    blinkRate?: number;
    confidence?: number;
    nervousness?: number;
    happy?: number;
    sad?: number;
};

export default function MetricsPanelCompact({
    blinkRate = 0,
    confidence = 0,
    nervousness = 0,
    happy = 0,
    sad = 0,
}: Props) {
    const clamp = (v: number) => Math.max(0, Math.min(1, v || 0));

    const metrics = [
        { label: "Stability", value: Math.round(confidence * 100), icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "Blink Rate", value: blinkRate, icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Nervousness", value: Math.round(clamp(nervousness) * 100), icon: Coffee, color: "text-orange-400", bg: "bg-orange-500/10" },
    ];

    const emotions = [
        { label: "Positivity", value: happy, icon: Heart, color: "bg-emerald-500" },
        { label: "Vulnerability", value: sad, icon: Frown, color: "bg-blue-500" },
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                {metrics.map((m, i) => (
                    <motion.div
                        key={m.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md"
                    >
                        <div className={`p-2 rounded-xl ${m.bg} ${m.color} mb-2`}>
                            <m.icon size={16} />
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">{m.label}</span>
                        <span className="text-sm font-bold text-white mt-0.5">
                            {m.label === "Blink Rate" ? `${m.value}` : `${m.value}%`}
                        </span>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {emotions.map((e, i) => (
                    <motion.div
                        key={e.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-tight">{e.label}</span>
                            <e.icon size={12} className={e.color.replace('bg-', 'text-')} />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${clamp(e.value) * 100}%` }}
                                    className={`h-full ${e.color}`}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-white w-8 text-right">
                                {Math.round(clamp(e.value) * 100)}%
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
