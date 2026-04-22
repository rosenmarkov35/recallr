"use client";
import React, { useRef, useState } from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";

export default function TiltCard({ children }: { children: React.ReactNode }) {
  const targetRef = useRef<HTMLDivElement>(null);

  // Mouse positions relative to the element
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Add a spring to smooth out the values
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 30 });

  // Map mouse position to rotation degrees (-15 to 15 degrees)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!targetRef.current) return;

    const rect = targetRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate position from -0.5 to 0.5
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={targetRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.05 }}
      className="relative rounded-2xl transition-transform duration-200 ease-out"
    >
      {/* The Lighting Effect (Glare) */}
      <motion.div
        style={{
          transform: "translateZ(40px)", // Lifts children slightly off the card
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </motion.div>
      
      {/* Shiny Glare Overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: useTransform(
            mouseXSpring,
            [-0.5, 0.5],
            ["radial-gradient(circle at 0% 0%, rgba(255,255,255,0.15) 0%, transparent 60%)", 
             "radial-gradient(circle at 100% 100%, rgba(255,255,255,0.15) 0%, transparent 60%)"]
          ),
        }}
      />
    </motion.div>
  );
}