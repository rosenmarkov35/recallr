"use client";
import { useState } from "react";
import { motion } from "framer-motion";

interface CardProps {
  question: string;
  answer: string;
  isFlipped: boolean; // Managed by parent now
  onFlip: () => void; // Managed by parent now
}

export default function Flashcard({
  question,
  answer,
  isFlipped,
  onFlip,
}: CardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFlip = () => {
    if (!isAnimating && !isFlipped) {
      // Only flip forward on click
      onFlip();
      setIsAnimating(true);
    }
  };

  return (
    <div
      className="flex items-center justify-center h-64 w-full cursor-pointer perspective-1000"
      onClick={handleFlip}
    >
      <motion.div
        className="relative w-full h-full max-w-md"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        onAnimationComplete={() => setIsAnimating(false)}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front (Question) */}
        <div
          className="absolute inset-0 bg-background border-2 border-blue-200 rounded-xl shadow-lg p-6 flex items-center justify-center text-center"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <h2 className="text-2xl font-bold text-foreground">{question}</h2>
          <span className="absolute bottom-4 text-xs text-gray-400 uppercase tracking-widest">
            Question
          </span>
        </div>

        {/* Back (Answer) */}
        <div
          className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg p-6 flex items-center justify-center text-center"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <h2 className="text-2xl font-bold text-white">{answer}</h2>
          <span className="absolute bottom-4 text-xs text-blue-200 uppercase tracking-widest">
            Answer
          </span>
        </div>
      </motion.div>
    </div>
  );
}
