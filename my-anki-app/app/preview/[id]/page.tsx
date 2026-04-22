"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- UI UTILITIES ---
const ICON_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#f43f5e",
  "#f97316",
  "#ec4899",
  "#06b6d4",
  "#10b981",
  "#84cc16",
  "#eab308",
];

const getTheme = (id: number, iconName: string) => {
  const color = ICON_COLORS[id % ICON_COLORS.length];
  // @ts-ignore
  const Icon = Icons[iconName] || Icons.BookOpen;
  return { color, Icon, bg: `${color}1a`, border: `${color}33` };
};

const getBorrowMessage = (reason: string | null) => {
  switch (reason) {
    case "own_deck":
      return "You cannot borrow your own deck";
    case "already_borrowed":
      return "You already borrowed this deck";
    case "not_authenticated":
      return "Login required to borrow";
    default:
      return null;
  }
};

// --- SUB-COMPONENT: FLIPPABLE CARD ---
function PreviewCard({ card, color }: { card: any; color: string }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="group h-40 md:h-56 w-full [perspective:1000px] cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative w-full h-full [transform-style:preserve-3d]"
      >
        {/* FRONT SIDE (Question) */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-card-bg border-2 border-card-border rounded-xl md:rounded-[2rem] p-4 md:p-8 flex flex-col justify-center items-center text-center shadow-sm">
          <span className="absolute top-2 md:top-6 text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-40">
            Question
          </span>
          <p className="text-sm md:text-xl font-bold leading-tight px-2">
            {card.question}
          </p>
        </div>

        {/* BACK SIDE (Answer) */}
        <div
          style={{ borderColor: `${color}44` }}
          className="absolute inset-0 [backface-visibility:hidden] bg-background border-2 rounded-xl md:rounded-[2rem] p-4 md:p-8 flex flex-col justify-center items-center text-center [transform:rotateY(180deg)] shadow-inner"
        >
          <span
            style={{ color: color }}
            className="absolute top-2 md:top-6 text-[8px] md:text-[10px] font-black uppercase tracking-widest"
          >
            Answer
          </span>
          <p className="text-sm md:text-xl font-medium leading-tight px-2">
            {card.answer}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function DeckPreview() {
  const { id } = useParams();
  const router = useRouter();
  const [deck, setDeck] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [newDeckId, setNewDeckId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const token = localStorage.getItem("access");

        const res = await axios.get(`http://localhost:8000/api/preview/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        setDeck(res.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setNotFound(true);
        }
        console.error("Preview error", err);
      }
    };

    fetchDeck();
  }, [id]);
  const borrowDisabled = isImporting || (deck && deck.can_borrow === false);

  const borrowMessage = getBorrowMessage(deck?.borrow_reason);

  useEffect(() => {
    if (!id) return;

    const recordView = async () => {
      try {
        // Note: We don't strictly NEED the token for views,
        // but providing it allows the backend to know WHO viewed it.
        const token = localStorage.getItem("access");
        await axios.post(
          `http://localhost:8000/api/decks/${id}/view/`,
          {}, // Empty body
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
      } catch (err) {
        // We fail silently here so the user can still see the deck even if
        // the view wasn't recorded (e.g., they've already viewed it today)
        console.log("View already recorded or failed.");
      }
    };

    recordView();
  }, [id]);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const token = localStorage.getItem("access");

      const res = await axios.post(
        `http://localhost:8000/api/decks/${id}/import/`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      if (res.data && res.data.deck_id) {
        setNewDeckId(res.data.deck_id);
      }

      // Trigger the toast instead of routing away immediately
      setShowSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.error;
      if (message) {
        alert(message);
      } else {
        alert("Something went wrong.");
      }
    } finally {
      setIsImporting(false);
    }
  };

  if (notFound) {
    return (
      <div className="relative min-h-[90vh] bg-background flex flex-col items-center justify-center p-8">
        {/* Same Blurry Background for UI consistency */}
        <div className="absolute inset-0 overflow-hidden opacity-20 blur-3xl pointer-events-none select-none">
          <div className="flex flex-col items-center gap-20 p-20">
            <div className="w-64 h-20 bg-muted rounded-full" />
            <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-muted rounded-3xl" />
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-card-bg/40 backdrop-blur-xl border border-card-border p-10 rounded-[3rem] shadow-2xl max-w-md text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center shadow-inner">
            <Icons.SearchX size={32} />
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">
              Deck Lost?
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              We couldn't find a deck with ID{" "}
              <span className="text-foreground font-mono">#{id}</span>. It might
              have been deleted or the link is broken.
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="w-full py-4 bg-foreground text-background rounded-2xl font-black hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  if (!deck)
    return (
      <div className="min-h-[90vh] flex items-center justify-center italic text-muted-foreground">
        Loading deck architecture...
      </div>
    );

  const { color, Icon, bg, border } = getTheme(deck.id, deck.icon);

  // Logic for remaining cards count
  const displayedCount = deck.sample_cards?.slice(0, 4).length || 0;
  const remainingCount = deck.card_count - displayedCount;

  if (deck.is_private) {
    return (
      <div className="relative min-h-[90vh] bg-background flex flex-col items-center justify-center p-8">
        {/* Blurry Background Mockup */}
        <div className="absolute inset-0 overflow-hidden opacity-30 blur-3xl pointer-events-none select-none">
          <div className="flex flex-col items-center gap-20 p-20">
            <div className="w-64 h-20 bg-muted rounded-full" />
            <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-muted rounded-3xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Glassmorphism Message Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-card-bg/40 backdrop-blur-xl border border-card-border p-10 rounded-[3rem] shadow-2xl max-w-md text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center shadow-inner">
            <Icons.Lock size={32} />
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">
              Restricted Deck
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              This deck is private. You need an invite or permission to view
              these cards.
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="w-full py-4 bg-foreground text-background rounded-2xl font-black hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] bg-background p-6 md:p-12 lg:p-20 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full space-y-10"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div
              style={{ backgroundColor: bg, color: color }}
              className="p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-white/5"
            >
              <Icon size={32} className="md:w-12 md:h-12" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl md:text-5xl font-black tracking-tight mb-1 md:mb-2 leading-tight">
                {deck.title}
              </h1>
              <div className="flex items-center gap-2 md:gap-3 text-xs md:text-lg text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <Icons.User size={14} /> @{deck.creator_name}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Icons.Layers size={14} /> {deck.card_count} Cards
                </span>
              </div>
            </div>
          </div>

          {borrowMessage !== "You cannot borrow your own deck" && (
            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
              <button
                onClick={handleImport}
                disabled={borrowDisabled}
                style={{
                  backgroundColor: borrowDisabled ? "#888" : color,
                  cursor: borrowDisabled ? "not-allowed" : "pointer",
                }}
                className="w-full md:w-auto px-8 py-4 rounded-xl md:rounded-2xl text-white font-black text-base md:text-lg shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isImporting ? (
                  <Icons.Loader2 className="animate-spin" />
                ) : (
                  <Icons.PlusCircle size={20} />
                )}

                {isImporting
                  ? "Borrowing..."
                  : borrowDisabled
                    ? "Unavailable"
                    : "Borrow Deck"}
              </button>

              {borrowDisabled && borrowMessage && (
                <p className="text-xs tracking-tighter font-bold opacity-60 text-muted-foreground text-right max-w-[220px]">
                  {borrowMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {deck.tags.map((tag: string) => (
            <span
              key={tag}
              style={{ borderColor: border }}
              className="px-3 md:px-5 py-1 md:py-2 border-2 rounded-full text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest bg-card-bg/50"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Sample Cards Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-card-border pb-4">
            <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
              Preview Sample
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground italic">
              Tap to flip
            </p>
          </div>

          {/* Mobile: grid-cols-2 | Tablet+: grid-cols-2 (larger gap) */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-8">
            {deck.sample_cards.slice(0, 4).map((card: any, idx: number) => (
              <PreviewCard key={idx} card={card} color={color} />
            ))}
          </div>

          {/* Remaining Cards Footer */}
          {remainingCount > 0 && (
            <div className="pt-3 text-center">
              <div className="inline-flex flex-col items-center gap-2">
                <div className="h-px w-12 bg-card-border" />
                <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  And {remainingCount} more card
                  {remainingCount !== 1 ? "s" : ""} in this deck
                </p>
                <div className="h-px w-12 bg-card-border" />
              </div>
            </div>
          )}
        </div>
      </motion.div>
      {/* SUCCESS TOAST POPUP */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg bg-card-bg/95 backdrop-blur-xl border-2 border-emerald-500/20 shadow-2xl rounded-3xl p-4 md:p-6 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                <Icons.CheckCircle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-base md:text-lg font-black tracking-tight text-foreground">
                  Import Successful
                </h4>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  Deck has been added to your library.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <button
                onClick={() =>
                  router.push(newDeckId ? `/deck/${newDeckId}` : "/")
                }
                className="px-4 md:px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold tracking-wide hover:opacity-90 active:scale-95 transition-all text-xs md:text-sm shadow-lg shadow-emerald-500/20 uppercase"
              >
                Start Studying
              </button>
              <button
                onClick={() => setShowSuccess(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
              >
                <Icons.X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
