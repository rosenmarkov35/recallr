"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import { Eye, Waypoints } from "lucide-react";
import { StatBadge } from "@/app/components/DeckCard";

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
  "#4f46e5",
  "#7c3aed",
  "#c026d3",
  "#e11d48",
  "#ea580c",
  "#db2777",
  "#0891b2",
  "#059669",
  "#65a30d",
  "#ca8a04",
];

const getDeckTheme = (deckId: number, iconName: string) => {
  const color = ICON_COLORS[deckId % ICON_COLORS.length];
  // @ts-ignore
  const IconComponent = Icons[iconName] || Icons.BookOpen;
  return {
    color,
    IconComponent,
    rgbaBackground: `${color}1a`, // 10% opacity
    rgbaBorder: `${color}33`, // 20% opacity
  };
};

interface Deck {
  id: number;
  title: string;
  icon: string;
  tags: string[];
  description?: string;
  view_count: number;
  share_count: number;
  creator_name: string;
  is_imported: boolean;
}

export default function PublicProfile() {
  const { username } = useParams();
  const [profileData, setProfileData] = useState<{
    username: string;
    decks: Deck[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/profiles/${username}/`,
        );
        setProfileData(res.data);
      } catch (err) {
        console.error("Profile not found", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (loading)
    return (
      <div className="p-10 text-center font-medium">
        Synchronizing Profile...
      </div>
    );
  if (!profileData)
    return (
      <div className="p-10 text-center font-medium">
        User @{username} not found.
      </div>
    );

  return (
    <div className="min-h-[90vh] bg-background text-foreground">
      <main className="px-[8vw] py-16">
        {/* Header Section with Identicon */}
        <header className="flex items-center gap-8 mb-16 pb-10 border-b border-card-border">
          <img
            src={`https://api.dicebear.com/7.x/identicon/svg?seed=${profileData.username}`}
            alt="avatar"
            className="h-24 w-24 rounded-2xl bg-card-bg border-2 border-card-border p-2 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="md:text-5xl text-3xl font-black tracking-tight">
                @{profileData.username}
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 text-lg font-medium">
              Sharing{" "}
              <span className="text-foreground">
                {profileData.decks.length}
              </span>{" "}
              decks
            </p>
          </div>
        </header>

        {/* Decks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {profileData.decks.map((deck) => {
            const { color, IconComponent, rgbaBackground, rgbaBorder } =
              getDeckTheme(deck.id, deck.icon);

            return (
              <motion.div
                key={deck.id}
                layout // Ensures smooth layout transitions
                whileHover={{
                  y: -8,
                  transition: { type: "spring", stiffness: 400, damping: 25 },
                }}
                whileTap={{ scale: 0.98 }}
                style={{ borderColor: rgbaBorder }}
                // REMOVED "transition-all" from className
                className="group relative bg-card-bg border-2 p-7 rounded-[2rem] cursor-pointer shadow-sm hover:shadow-xl"
                onClick={() => (window.location.href = `/preview/${deck.id}`)}
              >
                {/* Subtle Star Badge for Original Decks */}
                {!deck.is_imported ? (
                  <div className="absolute top-4 right-4 md:top-6 md:right-6 group/tip">
                    <Icons.Star
                      size={20}
                      style={{ color: color }}
                      className="opacity-100 md:opacity-60 md:group-hover:opacity-100 transition-opacity"
                    />

                    {/* MOBILE: Constantly showing */}
                    <span className="md:hidden absolute bg-zinc-900/90 text-white text-[9px] font-black py-1 px-2 rounded-md -bottom-8 right-0 whitespace-nowrap shadow-lg z-10 uppercase tracking-tighter">
                      Original
                    </span>

                    {/* DESKTOP: Hover only */}
                    <span className="pointer-events-none absolute hidden md:group-hover/tip:block bg-zinc-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg -top-10 -right-2 whitespace-nowrap shadow-2xl z-10">
                      ORIGINAL CREATOR
                    </span>
                  </div>
                ) : (
                  <div className="absolute top-4 right-4 md:top-6 md:right-6 group/tip">
                    <Icons.ExternalLink
                      size={20}
                      style={{ color: color }}
                      className="opacity-100 md:opacity-60 md:group-hover:opacity-100 transition-opacity"
                    />

                    {/* MOBILE: Constantly showing */}
                    <span className="md:hidden absolute bg-zinc-900/90 text-white text-[9px] font-black py-1 px-2 rounded-md -bottom-8 right-0 whitespace-nowrap shadow-lg z-10 uppercase tracking-tighter">
                      From @{deck.creator_name}
                    </span>

                    {/* DESKTOP: Hover only */}
                    <span className="pointer-events-none absolute hidden md:group-hover/tip:block bg-zinc-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg -top-10 -right-2 whitespace-nowrap shadow-2xl z-10">
                      BORROWED FROM @{deck.creator_name}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-5">
                  {/* Icon Container */}
                  <div
                    style={{ backgroundColor: rgbaBackground, color: color }}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-3"
                  >
                    <IconComponent size={28} />
                  </div>

                  <div>
                    <div className="flex justify-between">
                      <h2 className="text-2xl inline font-black leading-tight group-hover:text-foreground transition-colors">
                        {deck.title}
                      </h2>
                      <div className="inline-flex justify-end gap-2">
                        <StatBadge
                          icon={<Eye size={14} />}
                          value={(deck.view_count ?? 0).toLocaleString()}
                        />
                        <StatBadge
                          icon={<Waypoints size={14} />}
                          value={deck.share_count?.toLocaleString() || "0"}
                        />
                      </div>
                    </div>
                    {deck.description && (
                      <>
                        <div className="mt-8 flex items-center justify-between border-t border-card-border/50 pt-4 relative z-20 pointer-events-auto"></div>
                        <p className="text-sm text-muted-foreground">
                          {deck.description}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Tags Rendering */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {deck.tags?.map((tagName: string) => (
                      <span
                        key={tagName}
                        style={{ borderColor: rgbaBorder }}
                        className="text-[10px] font-bold px-3 py-1 bg-background border rounded-full text-muted-foreground uppercase tracking-tighter"
                      >
                        #{tagName}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
