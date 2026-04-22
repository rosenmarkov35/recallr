"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";

const ICON_COLORS = [
  "#6366f1", "#8b5cf6", "#d946ef", "#f43f5e", "#f97316", 
  "#ec4899", "#06b6d4", "#10b981", "#84cc16", "#eab308"
];

const AVAILABLE_ICONS = [
  { name: "Book", icon: Icons.Book },
  { name: "Code", icon: Icons.Code },
  { name: "Flask", icon: Icons.FlaskConical },
  { name: "Globe", icon: Icons.Globe },
  { name: "Music", icon: Icons.Music },
  { name: "Atom", icon: Icons.Atom },
  { name: "Brain", icon: Icons.BrainCircuit },
  { name: "Calculator", icon: Icons.Calculator },
  { name: "Languages", icon: Icons.Languages },
  { name: "Pill", icon: Icons.Pill },
  { name: "Briefcase", icon: Icons.Briefcase },
  { name: "Palette", icon: Icons.Palette },
  { name: "Cpu", icon: Icons.Cpu },
  { name: "Scale", icon: Icons.Scale },
  { name: "Dna", icon: Icons.Dna },
  { name: "Compass", icon: Icons.Compass },
];

// Fixed geometric pattern: 10 slots on left, 10 on right (20 total)
const PATTERN_POSITIONS = [
  // Left Gutter (Zig-Zag)
  { top: "5%", left: "4%" }, { top: "15%", left: "10%" },
  { top: "25%", left: "3%" }, { top: "35%", left: "12%" },
  { top: "45%", left: "5%" }, { top: "55%", left: "11%" },
  { top: "65%", left: "4%" }, { top: "75%", left: "12%" },
  { top: "85%", left: "3%" }, { top: "95%", left: "9%" },
  // Right Gutter (Zig-Zag)
  { top: "5%", right: "4%" }, { top: "15%", right: "10%" },
  { top: "25%", right: "3%" }, { top: "35%", right: "12%" },
  { top: "45%", right: "5%" }, { top: "55%", right: "11%" },
  { top: "65%", right: "4%" }, { top: "75%", right: "12%" },
  { top: "85%", right: "3%" }, { top: "95%", right: "9%" },
];

interface MappedIcon {
  id: number;
  iconData: typeof AVAILABLE_ICONS[0];
  color: string;
  position: any;
  floatDuration: number;
  spinDuration: number;
}

export default function BackgroundIcons() {
  const [mounted, setMounted] = useState(false);
  const [icons, setIcons] = useState<MappedIcon[]>([]);

  useEffect(() => {
    setMounted(true);
    // Assign a random icon and color to each fixed position in the pattern
    const generated = PATTERN_POSITIONS.map((pos, index) => ({
      id: index,
      position: pos,
      iconData: AVAILABLE_ICONS[Math.floor(Math.random() * AVAILABLE_ICONS.length)],
      color: ICON_COLORS[Math.floor(Math.random() * ICON_COLORS.length)],
      floatDuration: 3 + Math.random() * 2,
      spinDuration: 8 + Math.random() * 10, // Slow, varied spinning
    }));
    setIcons(generated);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {icons.map((item) => {
        const IconComponent = item.iconData.icon;
        return (
          <motion.div
            key={item.id}
            style={{ ...item.position, position: "absolute" }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.25, // Lowered opacity for higher density
              y: [0, -15, 0],
              rotate: 360 // Continuous slow spin
            }}
            transition={{
              opacity: { duration: 1 },
              y: { duration: item.floatDuration, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: item.spinDuration, repeat: Infinity, ease: "linear" }
            }}
            className="pointer-events-auto"
          >
            <FloatingIcon IconComponent={IconComponent} activeColor={item.color} />
          </motion.div>
        );
      })}
    </div>
  );
}

function FloatingIcon({ IconComponent, activeColor }: { IconComponent: any, activeColor: string }) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        color: isHovered ? activeColor : "#4b5563",
        scale: isHovered ? 1.3 : 1,
        filter: isHovered ? `drop-shadow(0 0 8px ${activeColor})` : "none",
      }}
      className="p-3"
    >
      <IconComponent size={24} strokeWidth={1.2} />
    </motion.div>
  );
}