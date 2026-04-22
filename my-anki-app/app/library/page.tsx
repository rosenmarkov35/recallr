"use client";
import { useState, useEffect } from "react";
import { Search, Clock, Sparkles, SearchX } from "lucide-react";
import * as Icons from "lucide-react"; // Import all icons for the dynamic lookup
import { motion } from "framer-motion";
import axios from "axios";
import DeckCard, { Deck } from "../components/DeckCard";
import { useRouter } from "next/dist/client/components/navigation";

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

const getDeckTheme = (deckId: number, iconName: string = "BookOpen") => {
  const color = ICON_COLORS[deckId % ICON_COLORS.length];
  // @ts-ignore - Dynamic lookup of Lucide icons
  const IconComponent = Icons[iconName] || Icons.BookOpen;

  return {
    color,
    IconComponent,
    rgbaBackground: `${color}1a`, // 10% opacity
    rgbaBorder: `${color}33`, // 20% opacity
  };
};

export default function LibraryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  const isCollapsed = isFocused || searchQuery.length > 0;

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return router.push("/login");

    const fetchDecks = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:8000/api/decks/public/?q=${encodeURIComponent(searchQuery)}`,
          { headers: {} },
        );
        setDecks(response.data);
      } catch (err) {
        console.error("Failed to fetch public decks:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchDecks();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const newestDecks = [...decks]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 4);

  const popularDecks = [...decks]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-radial from-blue-900/5 from-2% to-background px-[8vw] py-12 space-y-16">
      <header className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={false}
          animate={{
            height: isCollapsed ? 0 : "auto",
            opacity: isCollapsed ? 0 : 1,
            y: isCollapsed ? -20 : 0,
            marginBottom: isCollapsed ? 0 : 32,
          }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
            EXPLORE THE <span className="text-blue-500">LIBRARY</span>
          </h1>
        </motion.div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search
              className={`transition-colors duration-300 ${isFocused ? "text-blue-500" : "text-muted-foreground"}`}
              size={20}
            />
          </div>
          <input
            type="text"
            placeholder="Search decks, #tags, or @users..."
            value={searchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-elevated border border-card-border rounded-[2rem] py-5 pl-14 pr-6 md:text-lg text-md focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-xl"
          />
          {loading && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </header>

      <main className="space-y-20">
        {searchQuery.length > 0 ? (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Results for "{searchQuery}"
            </h2>
            {decks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {decks.map((deck) => {
                  const theme = getDeckTheme(
                    Number(deck.id),
                    deck.icon || "BookOpen",
                  );
                  return (
                    <DeckCard
                      key={deck.id}
                      deck={{ ...deck, color: theme.color }}
                    />
                  );
                })}
              </div>
            ) : (
              !loading && (
                <div className="flex flex-col items-center py-20 text-muted-foreground">
                  <SearchX size={48} className="mb-4 opacity-20" />
                  <p className="italic">No architectures found.</p>
                </div>
              )
            )}
          </section>
        ) : (
          <>
            {/* NEW DECKS SECTION */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                  <Clock size={20} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  New Decks
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {newestDecks.map((deck) => {
                  const theme = getDeckTheme(
                    Number(deck.id),
                    deck.icon || "BookOpen",
                  );
                  return (
                    <DeckCard
                      key={deck.id}
                      deck={{ ...deck, color: theme.color }}
                    />
                  );
                })}
              </div>
            </section>

            {/* TRENDING DECKS SECTION */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Trending Decks
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {popularDecks.map((deck) => {
                  const theme = getDeckTheme(
                    Number(deck.id),
                    deck.icon || "BookOpen",
                  );
                  return (
                    <DeckCard
                      key={deck.id}
                      deck={{ ...deck, color: theme.color }}
                    />
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
