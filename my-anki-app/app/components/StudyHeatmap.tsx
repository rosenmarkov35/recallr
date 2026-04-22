"use client";
import { motion } from "framer-motion";

interface HeatmapProps {
  data: Record<string, number>;
}

export default function StudyHeatmap({ data = {} }: HeatmapProps) {
  const today = new Date();

  // Generate the last 91 days (13 full weeks)
  const days = Array.from({ length: 91 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (90 - i));
    return d.toISOString().split("T")[0];
  });

  const getIntensity = (count: number) => {
    if (!count || count === 0) return "bg-foreground/5 border-card-border";
    if (count < 10) return "bg-blue-500/20 border-blue-500/30";
    if (count < 30) return "bg-blue-500/45 border-blue-500/40";
    if (count < 60) return "bg-blue-500/75 border-blue-400";
    return "bg-blue-500 border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.4)]";
  };

  return (
    <div className="w-full relative pt-8 flex flex-col items-center">
      {/* --- MOBILE VIEW: Horizontal Scrollable Strip (Visible < 768px) --- */}
      <div className="flex md:hidden w-full overflow-x-auto pb-4 no-scrollbar gap-2 px-2 snap-x">
        {/* We group by weeks for mobile readability */}
        {Array.from({ length: 13 }).map((_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1 snap-center">
            <span className="text-[8px] text-foreground/30 font-bold mb-1">
              W{13 - weekIdx}
            </span>
            <div className="grid grid-rows-7 gap-1">
              {days.slice(weekIdx * 7, (weekIdx + 1) * 7).map((day) => {
                const count = data[day] || 0;
                return (
                  <div
                    key={day}
                    className={`w-5 h-5 rounded-[4px] border ${getIntensity(count)} flex-shrink-0`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP VIEW: Full Grid (Visible >= 768px) --- */}
      <div className="hidden md:grid grid-flow-col grid-rows-7 gap-1.5 w-fit">
        {days.map((day, index) => {
          const count = data[day] || 0;
          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.002 }}
              className={`w-3 h-3 lg:w-4 lg:h-4 rounded-[3px] border transition-all duration-500 group relative ${getIntensity(count)}`}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all">
                {count} REVIEWS •{" "}
                {new Date(day).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-between md:justify-center mt-4 text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/40 w-full max-w-[400px]">
        <span className="md:hidden opacity-50">SCROLL TO VIEW HISTORY</span>
        <div className="flex items-center gap-2">
          <span>MIN</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-sm bg-foreground/5 border border-card-border" />
            <div className="w-2 h-2 rounded-sm bg-blue-500/30" />
            <div className="w-2 h-2 rounded-sm bg-blue-500" />
          </div>
          <span>MAX</span>
        </div>
      </div>
    </div>
  );
}
