"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import Flashcard from "../../components/Flashcard";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2,
  CheckCircle,
  EyeOff,
  X,
  Clock,
  Target,
  Trophy,
  Flame,
  Coffee,
  Zap,
} from "lucide-react";

// Example Presets
const PRESETS = [
  { label: "Intense", val: 0.7, color: "text-red-500" },
  { label: "Standard", val: 1.0, color: "text-blue-500" },
  { label: "Relaxed", val: 1.5, color: "text-green-500" },
];

const RATINGS = [
  {
    label: "Again",
    value: 0,
    key: "1",
    color: "bg-red-500",
    shadow: "shadow-red-500/50",
    glow: "rgba(239, 68, 68, 0.4)",
  },
  {
    label: "Hard",
    value: 3,
    key: "2",
    color: "bg-orange-500",
    shadow: "shadow-orange-500/50",
    glow: "rgba(249, 115, 22, 0.4)",
  },
  {
    label: "Good",
    value: 4,
    key: "3",
    color: "bg-green-500",
    shadow: "shadow-green-500/50",
    glow: "rgba(34, 197, 94, 0.4)",
  },
  {
    label: "Easy",
    value: 5,
    key: "4",
    color: "bg-blue-500",
    shadow: "shadow-blue-500/50",
    glow: "rgba(59, 130, 246, 0.4)",
  },
];

export default function StudyDeck() {
  const { id } = useParams();
  const router = useRouter();
  const [intensity, setIntensity] = useState(1.0); // 0.7 = Hardcore, 1.0 = Normal, 1.3 = Easy

  const [cards, setCards] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [title, setTitle] = useState("Study Deck");
  const [isFlipped, setIsFlipped] = useState(false);
  const [perf, setPerf] = useState<any>(null);
  const [showStats, setShowStats] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const [startTime] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [dailyBudget, setDailyBudget] = useState(15);
  const [showGoalMet, setShowGoalMet] = useState(false);
  const [reviewsThisSession, setReviewsThisSession] = useState(0);
  const [correctReviews, setCorrectReviews] = useState(0);

  // Live timer for the UI display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return router.push("/login");

    axios
      .get(`http://localhost:8000/api/decks/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // Ensure we have an array
        const rawCards = res.data.cards || [];

        // --- SORTING LOGIC ---
        const sortedCards = [...rawCards].sort((a, b) => {
          // If performance exists, get the time.
          // If not, use 0 (1970) so new cards show up first.
          const timeA = a.performance?.next_review
            ? new Date(a.performance.next_review).getTime()
            : 0;

          const timeB = b.performance?.next_review
            ? new Date(b.performance.next_review).getTime()
            : 0;

          return timeA - timeB; // Ascending: Oldest/Newest first
        });

        setCards(sortedCards);
        setTitle(res.data.title || "Study Deck");
        setDailyBudget(res.data.daily_budget_minutes || 15);

        // SET INTENSITY FROM BACKEND
        if (res.data.difficulty_multiplier) {
          setIntensity(res.data.difficulty_multiplier);
        }
      })
      .catch(() => router.push("/"));
  }, [id, router]);

  const accuracy = useMemo(() => {
    if (reviewsThisSession === 0) return 100;
    return (correctReviews / reviewsThisSession) * 100;
  }, [reviewsThisSession, correctReviews]);

  useEffect(() => {
    if (cards.length > 0 && cards[index]) {
      const token = localStorage.getItem("access");
      axios
        .get(
          `http://localhost:8000/api/cards/${cards[index].id}/performance/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        .then((res) => setPerf(res.data))
        .catch(() => setPerf(null));
    }
  }, [index, cards]);

  const saveIntensity = async (val: number) => {
    const token = localStorage.getItem("access");
    try {
      await axios.patch(
        `http://localhost:8000/api/decks/${id}/`,
        { difficulty_multiplier: val },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      console.error("Failed to save intensity preference", err);
    }
  };

  const getIntensityTheme = (val: number) => {
    if (val < 0.9)
      return {
        label: "Intense",
        color: "text-red-400",
        icon: <Flame size={14} />,
      };
    if (val > 1.1)
      return {
        label: "Relaxed",
        color: "text-emerald-400",
        icon: <Coffee size={14} />,
      };
    return {
      label: "Standard",
      color: "text-blue-400",
      icon: <Zap size={14} />,
    };
  };

  const toggleFlip = useCallback(() => setIsFlipped((prev) => !prev), []);

  const handleReview = useCallback(
    async (quality: number) => {
      if (selectedRating !== null) return;
      const token = localStorage.getItem("access");
      const currentCard = cards[index];
      setSelectedRating(quality);

      setReviewsThisSession((prev) => prev + 1);
      if (quality >= 3) setCorrectReviews((prev) => prev + 1);

      try {
        const response = await axios.post(
          `http://localhost:8000/api/cards/${currentCard.id}/review/`,
          {
            quality,
            multiplier: intensity, // Still pass it here so the algorithm knows the current deck setting
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        // LIVE UPDATE PERF FROM POST RESPONSE
        if (response.data) {
          setPerf(response.data);
        }

        const elapsedMinutes = (Date.now() - startTime) / 60000;
        if (elapsedMinutes >= dailyBudget && !showGoalMet) {
          setShowGoalMet(true);
        }

        setTimeout(() => {
          if (index + 1 < cards.length) {
            setIsFlipped(false);
            setIndex((prev) => prev + 1);
            setSelectedRating(null);
          } else {
            setIsFinished(true);
          }
        }, 600);
        console.log("Review submitted", { quality, intensity });
      } catch (err) {
        console.error("Review failed", err);
        setSelectedRating(null);
      }
    },
    [
      index,
      cards,
      dailyBudget,
      startTime,
      showGoalMet,
      selectedRating,
      intensity,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        toggleFlip();
      }
      if (isFlipped && selectedRating === null) {
        const ratingMap: Record<string, number> = {
          "1": 0,
          "2": 3,
          "3": 4,
          "4": 5,
        };
        if (ratingMap[e.key] !== undefined) handleReview(ratingMap[e.key]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, toggleFlip, handleReview, selectedRating]);

  if (isFinished) {
    return (
      <div className="min-h-[90vh] bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-bg-elevated border border-card-border p-10 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>

          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            You studied for{" "}
            <b>
              {Math.max(1, Math.floor((Date.now() - startTime) / 60000))}{" "}
              minutes
            </b>{" "}
            and maintained <b>{accuracy.toFixed(0)}% accuracy</b>.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/")}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all active:scale-95"
            >
              Back to Dashboard
            </button>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Your memory stability has been updated
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!cards.length) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-[90vh] bg-background flex flex-col items-center justify-center p-4 transition-all duration-500 ease-in-out">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">{title}</h1>
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 rounded-lg bg-background cursor-pointer border-card-border border hover:bg-bg-elevated transition-colors text-foreground/60 hover:text-foreground"
            >
              {showStats ? <EyeOff size={16} /> : <BarChart2 size={16} />}
            </button>
          </div>

          <motion.div
            initial={false}
            animate={{
              height: showStats ? "auto" : 0,
              opacity: showStats ? 1 : 0,
              marginBottom: showStats ? 16 : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            {/* INJECTED SESSION STATS TO SHOW ON TOGGLE */}
            <div className="bg-bg-elevated/50 border border-card-border rounded-2xl p-4 mb-4 grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1">
                <div className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
                  <Clock size={10} /> Time
                </div>
                <div className="text-xs font-mono">
                  {Math.floor((currentTime - startTime) / 60000)}m{" "}
                  {Math.floor(((currentTime - startTime) / 1000) % 60)}s
                </div>
              </div>
              <div className="space-y-1 border-x border-white/5">
                <div className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
                  <Target size={10} /> Seen
                </div>
                <div className="text-xs font-mono">{reviewsThisSession}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
                  <Trophy size={10} /> Acc.
                </div>
                <div className="text-xs font-mono">{accuracy.toFixed(0)}%</div>
              </div>
            </div>
            <div className="bg-bg-elevated/40 border border-card-border rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Study Intensity
                </span>
                <div
                  className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${getIntensityTheme(intensity).color}`}
                >
                  {getIntensityTheme(intensity).icon}
                  {getIntensityTheme(intensity).label} ({intensity}x)
                </div>
              </div>

              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={intensity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setIntensity(val);
                  saveIntensity(val); // Save the preference for the whole deck
                }}
                className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              <div className="flex justify-between mt-2 text-[9px] text-muted-foreground/50 font-medium">
                <span>SHORTER INTERVALS</span>
                <span>LONGER INTERVALS</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground border-t border-white/5 pt-4">
              {[
                {
                  label: "Easiness",
                  val: perf?.easiness_factor?.toFixed(1) || "2.5",
                  color: "bg-yellow-500",
                  pct: ((perf?.easiness_factor || 2.5) / 5) * 100,
                },
                {
                  label: "Interval",
                  val: `${perf?.interval || 0}d`,
                  color: "bg-blue-500",
                  pct: Math.min((perf?.interval || 0) * 5, 100),
                },
                {
                  label: "Streak",
                  val: perf?.repetitions || 0,
                  color: "bg-orange-500",
                  pct: Math.min((perf?.repetitions || 0) * 10, 100),
                },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <span>{stat.label}</span>
                    <span>{stat.val}</span>
                  </div>
                  <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${stat.color}`}
                      animate={{ width: `${stat.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="h-72 relative mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Flashcard
                question={cards[index].question}
                answer={cards[index].answer}
                isFlipped={isFlipped}
                onFlip={toggleFlip}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="h-20 flex justify-center items-center">
          {!isFlipped ? (
            <button
              onClick={toggleFlip}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
            >
              Show Answer (Space)
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="grid grid-cols-4 gap-2 w-full"
            >
              {RATINGS.map((r) => {
                const isThisOne = selectedRating === r.value;
                const someoneElseSelected =
                  selectedRating !== null && !isThisOne;

                return (
                  <button
                    key={r.value}
                    disabled={selectedRating !== null}
                    onClick={() => handleReview(r.value)}
                    className={`
                      py-2 ${r.color} text-white rounded-xl text-xs font-bold transition-all duration-300
                      ${isThisOne ? `scale-110 z-10 ${r.shadow} brightness-110 shadow-2xl` : "scale-100 shadow-md"}
                      ${someoneElseSelected ? "opacity-20 grayscale" : "opacity-100"}
                      ${!selectedRating ? "hover:scale-105 hover:brightness-110 active:scale-95" : ""}
                    `}
                  >
                    <div className="flex flex-col items-center">
                      <span>{r.label}</span>
                      <span className="text-[9px] opacity-60">[{r.key}]</span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
        <AnimatePresence>
          {showGoalMet && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-emerald-900/20 z-[100]"
            >
              <CheckCircle size={20} />
              <div className="text-sm font-bold">
                Daily goal met! Mastery increasing.
              </div>
              <button
                onClick={() => setShowGoalMet(false)}
                className="ml-2 opacity-70 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-[10px] text-muted-foreground opacity-50 uppercase tracking-widest">
          {isFlipped
            ? "Use 1, 2, 3, or 4 to rate"
            : "Press Space to reveal answer"}
        </p>
      </div>
    </div>
  );
}
