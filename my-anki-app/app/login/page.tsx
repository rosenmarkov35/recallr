"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, Loader2, UnlockIcon, Flame, Brain } from "lucide-react";

const FLASHCARDS = [
  {
    subject: "Biology",
    question: "What is the powerhouse of the cell?",
    answer: "Mitochondria",
    tag: "Easy ✓",
    tagClass: "bg-green-500/10 text-green-500",
    style: { top: "6%", left: "12%" },
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
    style: { top: "8%", right: "9%" },
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
    style: { bottom: "10%", left: "12%" },
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
    style: { bottom: "8%", right: "8%" },
    rotate: 12,
    delay: 0.3,
    duration: 5.8,
  },
  {
    subject: "Chemistry",
    question: "Atomic number of Carbon?",
    answer: "6",
    tag: "Review",
    tagClass: "bg-yellow-500/10 text-yellow-500",
    style: { top: "44%", left: "7%" },
    rotate: -14,
    delay: 2,
    duration: 6.5,
  },
  {
    subject: "Physics",
    question: "E = mc² means…?",
    answer: "Mass–energy equivalence",
    tag: "Hard",
    tagClass: "bg-red-500/10 text-red-500",
    style: { top: "46%", right: "4%" },
    rotate: 4,
    delay: 1.2,
    duration: 5.2,
  },
];

function FloatingCard({
  subject,
  question,
  answer,
  tag,
  tagClass,
  style,
  rotate,
  delay,
  duration,
}: (typeof FLASHCARDS)[0]) {
  return (
    <motion.div
      className="absolute w-44 rounded-2xl border border-card-border bg-background p-3.5 hidden sm:block will-change-transform shadow-[0_0_20px_1px_rgba(0,0,0,0.1)] shadow-foreground/5"
      // FIX: Only pass layout (top/left/etc) to style. No more TS errors.
      style={style}
      // FIX: Move rotate here. Framer Motion loves numbers for rotation.
      initial={{ opacity: 0, y: 20, rotate: rotate }}
      animate={{
        opacity: 0.85,
        y: [-10, 10], // Moves up and down
        rotate: [rotate - 2, rotate + 2], // Subtle organic swaying
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: {
          duration,
          delay,
          repeat: Infinity,
          repeatType: "mirror", // FIX: Makes it seamless (oscillates)
          ease: "easeInOut",
        },
        rotate: {
          duration: duration * 1.2, // Offset rotation timing for a natural feel
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        },
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
        {subject}
      </p>
      <p className="text-[13px] font-medium text-foreground leading-snug">
        {question}
      </p>
      <p className="text-[12px] text-gray-500 mt-1 leading-snug">{answer}</p>
      <span
        className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagClass}`}
      >
        {tag}
      </span>
    </motion.div>
  );
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:8000/api/token/", {
        username: email,
        password: password,
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      window.location.href = "/workspace"; // Redirect to workspace after login
    } catch (err: any) {
      setError("Invalid credentials. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative sm:min-h-full bg-radial from-blue-900/5 from-2% to-background flex sm:items-center justify-center p-6 overflow-hidden">
      {/* Floating flashcards */}
      {FLASHCARDS.map((card) => (
        <FloatingCard key={card.subject} {...card} />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-background p-8 rounded-3xl border border-card-border shadow-[0_0_20px_1px_rgba(0,0,0,0.1)] shadow-foreground/15"
      >
        <div className="text-center mb-8">
          <motion.div
            initial="rest"
            whileHover="hover"
            animate="rest"
            className="bg-bg-elevated w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4 relative cursor-pointer"
          >
            {/* Locked */}
            <motion.div
              variants={{
                rest: { scale: 1, rotate: 0, opacity: 1 },
                hover: { scale: 0.6, rotate: -90, opacity: 0 },
              }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute"
            >
              <Lock size={32} />
            </motion.div>

            {/* Unlocked */}
            <motion.div
              variants={{
                rest: { scale: 0.6, rotate: 90, opacity: 0 },
                hover: { scale: 1, rotate: 0, opacity: 1 },
              }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute"
            >
              <UnlockIcon width={32} height={32} />
            </motion.div>
          </motion.div>

          <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Log in to manage your decks</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5 ml-1">
              Username
            </label>
            <div className="relative group">
              <Mail
                className="absolute left-3 top-3 text-foreground group-focus-within:text-blue-500 transition-colors"
                size={20}
              />
              <input
                type="text"
                required
                className="w-full pl-11 pr-4 py-3 bg-background border border-card-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter your username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5 ml-1">
              Password
            </label>
            <div className="relative group">
              <Lock
                className="absolute left-3 top-3 text-foreground group-focus-within:text-blue-500 transition-colors"
                size={20}
              />
              <input
                type="password"
                required
                className="w-full pl-11 pr-4 py-3 bg-background border border-card-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-red-500 text-sm ml-1"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-gray-100 font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-8 text-foreground text-sm">
          Don&apos;t have an account?{" "}
          <span
            onClick={() => router.push("/register")}
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
          >
            Sign up
          </span>
        </p>
      </motion.div>
    </main>
  );
}
