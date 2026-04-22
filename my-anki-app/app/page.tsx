"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Brain,
  Flame,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Clock,
  Rocket,
} from "lucide-react";

const FLASHCARDS = [
  {
    subject: "Biology",
    question: "What is the powerhouse of the cell?",
    answer: "Mitochondria",
    tag: "Easy ✓",
    tagClass: "bg-green-500/10 text-green-500",
    style: { top: "10%", left: "10%" },
    rotate: -8,
    delay: 0,
    duration: 5.5,
  },
  {
    subject: "Spanish",
    question: '¿Cómo se dice "cat"?',
    answer: "gato",
    tag: "Review",
    tagClass: "bg-yellow-500/10 text-yellow-500",
    style: { top: "12%", right: "12%" },
    rotate: 6,
    delay: 0.8,
    duration: 6.2,
  },
  {
    subject: "History",
    question: "Year of the French Revolution?",
    answer: "1789",
    tag: "Hard",
    tagClass: "bg-red-500/10 text-red-500",
    style: { bottom: "15%", left: "12%" },
    rotate: -3,
    delay: 1.5,
    duration: 7,
  },
  {
    subject: "Math",
    question: "Derivative of sin(x)?",
    answer: "cos(x)",
    tag: "Easy ✓",
    tagClass: "bg-green-500/10 text-green-500",
    style: { bottom: "12%", right: "10%" },
    rotate: 12,
    delay: 0.3,
    duration: 5.8,
  },
];

const ROADMAP = [
  {
    status: "shipped",
    label: "Shipped",
    icon: CheckCircle2,
    color: "text-green-500",
    border: "border-l-green-500",
    bg: "bg-green-500/10",
    title: "Core flashcard engine",
    desc: "Create, edit, and study decks with flip animations and shortcuts.",
    date: "v1.0 — April 2025",
  },
  {
    status: "shipped",
    label: "Shipped",
    icon: CheckCircle2,
    color: "text-green-500",
    border: "border-l-green-500",
    bg: "bg-green-500/10",
    title: "Smart folders & tags",
    desc: "Organize decks by subject, difficulty, or custom tags.",
    date: "v1.0 — April 2025",
  },
  {
    status: "wip",
    label: "In progress",
    icon: Clock,
    color: "text-blue-500",
    border: "border-l-blue-500",
    bg: "bg-blue-500/10",
    title: "Spaced repetition",
    desc: "Scientifically-timed sessions that surface cards right before you forget.",
    date: "ETA — June 2025",
  },
  {
    status: "next",
    label: "Up next",
    icon: Circle,
    color: "text-amber-500",
    border: "border-l-amber-500",
    bg: "bg-blue-500/10",
    title: "AI card generation",
    desc: "Paste any text and let the AI split it into a polished deck.",
    date: "ETA — July 2025",
  },
  {
    status: "next",
    label: "Up next",
    icon: Circle,
    color: "text-amber-500",
    border: "border-l-amber-500",
    bg: "bg-amber-500/10",
    title: "Collaborative decks",
    desc: "Share decks with friends and study together in real time.",
    date: "Q3 2025",
  },
  {
    status: "planned",
    label: "Planned",
    icon: Rocket,
    color: "text-purple-500",
    border: "border-l-purple-500",
    bg: "bg-purple-500/10",
    title: "Mobile apps",
    desc: "Native iOS & Android apps with offline support and push reminders.",
    date: "Q4 2025",
  },
];

function FloatingCard({
  subject,
  question,
  tag,
  tagClass,
  style,
  rotate,
  delay,
  duration,
}: any) {
  return (
    <motion.div
      className="absolute w-48 rounded-2xl border-2 border-card-border bg-background p-4 hidden lg:block will-change-transform shadow-[0_0_25px_rgba(0,0,0,0.05)]"
      style={style}
      initial={{ opacity: 0, scale: 0.9, rotate }}
      animate={{
        opacity: 0.6,
        y: [-12, 12],
        rotate: [rotate - 2, rotate + 2],
      }}
      transition={{
        opacity: { duration: 1 },
        y: {
          duration,
          delay,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        },
        rotate: {
          duration: duration * 1.2,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        },
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">
        {subject}
      </p>
      <p className="text-sm font-semibold text-foreground leading-tight">
        {question}
      </p>
      <span
        className={`inline-block mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${tagClass}`}
      >
        {tag}
      </span>
    </motion.div>
  );
}

type Panel = "home" | "roadmap";

export default function LandingPage() {
  const [panel, setPanel] = useState<Panel>("home");

  return (
    <div className="relative my-8 md:my-0 w-full h-[90vh] overflow-hidden">
      <motion.div
        className="flex w-[200%] h-full"
        animate={{ x: panel === "roadmap" ? "-50%" : "0%" }}
        transition={{ duration: 0.6, ease: [0.77, 0, 0.18, 1] }}
      >
        {/* ─── Panel 1: Landing ─────────────────────────────────────── */}
        <div className="relative w-1/2 h-full overflow-hidden bg-radial from-blue-900/10 via-background to-background flex justify-center items-center p-6">
          {FLASHCARDS.map((card, i) => (
            <FloatingCard key={i} {...card} />
          ))}

          <div className="relative z-10 max-w-4xl w-full text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs md:text-sm font-medium mb-6"
            >
              <Sparkles size={14} />
              <span>New: Version 1.0 is public</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="select-none text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground tracking-tight mb-4"
            >
              Master any subject, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                one card at a time.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto my-6 leading-relaxed"
            >
              An intelligently organized flashcard ecosystem designed to help
              you retain knowledge longer and study more efficiently.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register" className="w-full sm:w-auto">
                <button className="cursor-pointer w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-base transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group">
                  Start Learning Now
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <button className="cursor-pointer w-full sm:w-auto bg-bg-elevated hover:bg-card-border/50 text-foreground border border-card-border px-6 py-3 rounded-2xl font-bold text-base transition-all">
                  Sign In
                </button>
              </Link>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 drop-shadow-[0_0_10px_rgba(59,130,246,0.7)]">
                  <Layers size={20} />
                </div>
                <h3 className="font-bold text-foreground text-sm">
                  Smart Folders
                </h3>
                <p className="text-xs text-gray-500">
                  Organize your decks by subject, difficulty, or priority.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.7)]">
                  <Flame size={20} />
                </div>
                <h3 className="font-bold text-foreground text-sm">
                  Daily Streaks
                </h3>
                <p className="text-xs text-gray-500">
                  Build consistency with visual progress tracking and goals.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 drop-shadow-[0_0_10px_rgba(139,92,246,0.7)]">
                  <Brain size={20} />
                </div>
                <h3 className="font-bold text-foreground text-sm">
                  Active Recall
                </h3>
                <p className="text-xs text-gray-500">
                  Scientifically proven methods to boost your memory retention.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Arrow → roadmap */}
          <button
            onClick={() => setPanel("roadmap")}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all cursor-pointer"
            title="See our roadmap"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dot nav - Locked to bottom of Panel 1 */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            <div className="w-5 h-2 rounded-full bg-blue-500 transition-all duration-300" />
            <div
              className="w-2 h-2 rounded-full bg-white/20 cursor-pointer hover:bg-white/40 transition-all duration-300"
              onClick={() => setPanel("roadmap")}
            />
          </div>
        </div>

        {/* ─── Panel 2: Roadmap ─────────────────────────────────────── */}
        <div className="relative w-1/2 h-full overflow-y-auto overflow-x-hidden bg-radial from-purple-900/10 via-background to-background p-6 custom-scrollbar">
          {/* Arrow ← back */}
          <button
            onClick={() => setPanel("home")}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-purple-500 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all cursor-pointer"
            title="Back to home"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="relative z-10 max-w-4xl w-full mx-auto min-h-full flex flex-col items-center justify-center py-4 md:py-0">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={panel === "roadmap" ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-xs md:text-sm font-medium mb-4"
            >
              <Rocket size={14} />
              <span>Product Roadmap</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={panel === "roadmap" ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.25 }}
              className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-2 text-center"
            >
              What we&apos;re{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
                building
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={panel === "roadmap" ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="text-sm md:text-base text-gray-500 mb-6 leading-relaxed max-w-xl text-center"
            >
              A transparent look at what shipped, what&apos;s in progress, and
              what&apos;s coming next — updated as we build.
            </motion.p>

            {/* Roadmap grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={panel === "roadmap" ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full"
            >
              {ROADMAP.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className={`relative bg-background border border-card-border border-l-4 ${item.border} rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${item.color}`}
                      >
                        <Icon size={12} />
                        {item.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-sm leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-1">
                      {item.desc}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-auto pt-2 border-t border-card-border">
                      {item.date}
                    </p>
                  </div>
                );
              })}
            </motion.div>

            {/* Footer note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={panel === "roadmap" ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
              className="text-xs md:text-sm text-gray-400 text-center mt-6 mb-12 md:mb-6"
            >
              Have a feature request?{" "}
              <a
                href="mailto:feedback@yourapp.com"
                className="text-purple-500 hover:underline"
              >
                Let us know →
              </a>
            </motion.p>
          </div>
          <div className="sticky bottom-0 left-0 w-full h-1 pb-5 flex justify-center items-center pointer-events-none">
            <div className="flex gap-2 pointer-events-auto">
              <div
                className="w-2 h-2 rounded-full bg-white/20 cursor-pointer hover:bg-white/40 transition-all duration-300"
                onClick={() => setPanel("home")}
              />
              <div className="w-5 h-2 rounded-full bg-purple-500 transition-all duration-300" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
