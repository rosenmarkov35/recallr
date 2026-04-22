"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, Loader2, UserPlus, Sparkles, Zap, BrainCircuit, CheckCircle2 } from "lucide-react";

const FEATURE_CARDS = [
  {
    title: "Core Features",
    icon: <BrainCircuit className="text-blue-500" size={24} />,
    features: [
      "Infinite study decks",
      "Smart Spaced Repetition",
      "Import from Quizlet/CSV",
      "Tag-based organization",
    ],
    color: "blue"
  },
  {
    title: "Pro Benefits",
    icon: <Sparkles className="text-amber-500" size={24} />,
    features: [
      "Shared team decks",
      "Advanced analytics",
      "Cloud sync across devices",
      "Priority AI assistance",
    ],
    color: "amber"
  },
];

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      await axios.post("http://localhost:8000/api/register/", {
        username,
        email,
        password,
      });
      router.push("/login");
    } catch (err: any) {
      const errorMessage = err.response?.data?.username?.[0] || 
                            err.response?.data?.detail || 
                            "Registration failed. Try a different username.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  return (
    <main className="min-h-[90vh] bg-background flex items-center justify-center p-6 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full max-w-6xl relative z-10"
      >
        
        {/* LEFT FEATURE CARD */}
        <motion.div variants={cardVariants} className="w-full max-w-sm lg:w-72 bg-bg-elevated/50 backdrop-blur-sm p-6 rounded-[2rem] border border-card-border hidden lg:block shadow-[0_0_20px_1px_rgba(0,0,0,0.1)] shadow-foreground/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">{FEATURE_CARDS[0].icon}</div>
            <h2 className="font-bold text-foreground">{FEATURE_CARDS[0].title}</h2>
          </div>
          <ul className="space-y-4">
            {FEATURE_CARDS[0].features.map((f, i) => (
              <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="text-blue-500 mt-0.5 shrink-0" size={16} />
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CENTER REGISTRATION CARD */}
        <motion.div
          variants={cardVariants}
          className="w-full max-w-md bg-background p-8 lg:p-10 rounded-[2.5rem] border border-card-border relative shadow-[0_0_15px_1px_rgba(0,0,0,0.1)] shadow-foreground/10"
        >
          <div className="text-center mb-8">
            <div className="bg-blue-600/10 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4 border border-blue-600/20">
              <UserPlus size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Account</h1>
            <p className="text-gray-500 mt-2 text-sm">Build your personalized study library today.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">Username</label>
                <div className="relative group">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="text" required
                    className="w-full pl-12 pr-4 py-3 bg-secondary/20 border border-card-border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="student_123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="email" required
                    className="w-full pl-12 pr-4 py-3 bg-secondary/20 border border-card-border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="password" required
                      className="w-full pl-12 pr-4 py-3 bg-secondary/20 border border-card-border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">Confirm</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="password" required
                      className="w-full pl-12 pr-4 py-3 bg-secondary/20 border border-card-border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                <p className="text-red-500 text-xs font-medium text-center">{error}</p>
              </motion.div>
            )}

            <button
              type="submit" disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 mt-4"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Sign Up"}
            </button>
          </form>

          <p className="text-center mt-8 text-muted-foreground text-sm">
            Already have an account?{" "}
            <button onClick={() => router.push("/login")} className="text-blue-600 font-bold hover:underline">Log in</button>
          </p>
        </motion.div>

        {/* RIGHT PRO CARD */}
        <motion.div variants={cardVariants} className="w-full max-w-sm lg:w-72 bg-bg-elevated/50 backdrop-blur-sm p-6 rounded-[2rem] border border-card-border hidden lg:block shadow-[0_0_8px_1px_rgba(0,0,0,0.1)] shadow-foreground/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-lg">{FEATURE_CARDS[1].icon}</div>
            <h2 className="font-bold text-foreground">{FEATURE_CARDS[1].title}</h2>
          </div>
          <ul className="space-y-4 mb-8">
            {FEATURE_CARDS[1].features.map((f, i) => (
              <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Zap className="text-amber-500 mt-0.5 shrink-0" size={16} />
                {f}
              </li>
            ))}
          </ul>
          <div className="pt-6 border-t border-card-border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest text-center">Coming Soon</p>
          </div>
        </motion.div>

      </motion.div>
    </main>
  );
}