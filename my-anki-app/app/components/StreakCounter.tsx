"use client";
import { Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function StreakCounter({ streak, isLoggedIn }: { streak: number; isLoggedIn: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  if (!isLoggedIn || streak <= 0) return null;

  // Dynamic messaging based on streak length
  const getStreakMotive = (count: number) => {
    if (count >= 30) return "Legendary status!";
    if (count >= 7) return "You're on fire!";
    return "Keep the flame alive!";
  };

  return (
    <div className="relative flex items-center">
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full cursor-help transition-colors hover:bg-orange-500/20"
      >
        <div className="relative">
          {/* Outer Glow Effect */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-orange-500 blur-md rounded-full opacity-20"
          />
          
          <Flame
            size={18}
            className={`relative z-10 transition-all duration-500 ${
              isHovered ? "text-orange-400 fill-orange-400" : "text-orange-500 fill-orange-500"
            }`}
          />
        </div>

        <motion.span 
          key={streak}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-sm font-black text-orange-500 tabular-nums"
        >
          {streak}
        </motion.span>
      </motion.div>

      {/* Tooltip with Umph */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-[110] pointer-events-none"
          >
            <div className="bg-background border border-card-border px-4 py-2 rounded-2xl shadow-2xl flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Current Streak
              </span>
              <span className="text-lg font-black text-foreground">
                {streak} {streak === 1 ? 'Day' : 'Days'}
              </span>
              <p className="text-[11px] text-orange-500 font-medium whitespace-nowrap">
                {getStreakMotive(streak)}
              </p>
              
              {/* Arrow */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-background border-t border-l border-card-border rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}