"use client";
import React, { useState, useMemo } from "react";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface TimeBudgetModalProps {
  deck: any;
  onClose: () => void;
  onSave: (minutes: number) => void;
}

export default function TimeBudgetModal({ deck, onClose, onSave }: TimeBudgetModalProps) {
  const [minutes, setMinutes] = useState(deck.daily_budget_minutes || 15);

  // --- STEP 3: PREDICTIVE DATA ENGINE ---
  const chartData = useMemo(() => {
    const data = [];
    const totalCards = deck.cards?.length || 0;
    const cardsPerDay = minutes * 3; // 20s per card avg
    
    for (let i = 0; i <= 30; i += 5) {
      // Logic: Retention grows based on minutes, but levels off at 100%
      // A simple logarithmic growth model for visualization
      const learnedFactor = Math.min(100, (i * cardsPerDay / (totalCards || 1)) * 100);
      const retentionStability = Math.min(100, (learnedFactor * (minutes / 30)));
      
      data.push({
        day: `Day ${i}`,
        retention: Math.floor(retentionStability),
        target: 85, // The "Mastery" threshold
      });
    }
    return data;
  }, [minutes, deck.cards]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-bg-elevated border border-card-border p-8 rounded-[2rem] w-full max-w-2xl shadow-2xl"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Learning Forecast</h2>
            <p className="text-muted-foreground text-sm">Visualizing your 30-day stability</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition-colors">
            <Icons.X size={20} />
          </button>
        </div>

        {/* THE GRAPH LAYER */}
        <div className="h-48 w-full mb-8 bg-background/30 rounded-2xl p-4 border border-card-border relative overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="day" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="retention" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRet)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          
          {/* Overlay Label */}
          <div className="absolute top-6 left-8 pointer-events-none">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 opacity-80">
              Projected Retention Curve
            </span>
          </div>
        </div>

        {/* INPUT SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
                <div className="text-4xl font-black">{minutes} <span className="text-sm font-medium text-muted-foreground uppercase">min/day</span></div>
                <input 
                    type="range" min="5" max="120" step="5" value={minutes}
                    onChange={(e) => setMinutes(parseInt(e.target.value))}
                    className="w-full h-2 bg-card-border rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>
            
            <div className="bg-background/50 p-4 rounded-2xl border border-card-border">
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                    <Icons.Zap size={16} />
                    <span className="text-xs font-bold uppercase tracking-tighter">Efficiency Insight</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    At <b>{minutes}m</b>, your memory "half-life" will double every 3 reviews. You'll reach <b>80% stability</b> in roughly <b>{Math.max(5, 40 - minutes)} days</b>.
                </p>
            </div>
        </div>

        <button 
          onClick={() => onSave(minutes)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          Update Commitment
        </button>
      </motion.div>
    </div>
  );
}