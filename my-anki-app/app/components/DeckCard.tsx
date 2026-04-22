"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Waypoints, Tag as TagIcon } from "lucide-react";
import * as Icons from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export interface Deck {
  id: string | number;
  icon: string;
  title: string;
  description?: string;
  creator_name: string;
  creator_pfp_url?: string;
  view_count: number;
  share_count?: number;
  created_at: string;
  tags?: string[];
  color?: string; // Injected by getDeckTheme on the parent page
}

export default function DeckCard({ deck }: { deck: Deck }) {
  // 1. Setup Identicon and Icons
  const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${deck.creator_name}`;
  // @ts-ignore
  const DynamicIcon = Icons[deck.icon || "Layers"] || Icons.Layers;

  // 2. Hover States
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isTagHovered, setIsTagHovered] = useState(false);

  // 3. Theme Colors
  const themeColor = deck.color || "#3b82f6";
  const rgbaBackground = `${themeColor}1a`;
  const rgbaBorder = `${themeColor}33`;

  return (
    <motion.div
      onHoverStart={() => setIsCardHovered(true)}
      onHoverEnd={() => setIsCardHovered(false)}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative bg-elevated border border-card-border rounded-[2rem] p-6 h-full flex flex-col justify-between shadow-lg hover:shadow-2xl overflow-hidden transition-colors duration-300"
    >
      {/* BACKGROUND LINK (Invisible overlay covering the whole card) */}
      <Link
        href={`/preview/${deck.id}`}
        className="absolute inset-0 z-0"
        aria-label={`View ${deck.title}`}
      />

      {/* BACKGROUND GLOW */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 opacity-15 blur-[80px] rounded-full pointer-events-none"
        style={{ backgroundColor: themeColor }}
      />

      {/* TOP CONTENT (Pointer events none so clicks pass through to the main Link) */}
      <div className="space-y-4 relative z-10 pointer-events-none">
        <div className="flex justify-between items-start">
          <div
            className="p-3 bg-background rounded-2xl border border-card-border shadow-inner"
            style={{ color: themeColor }}
          >
            <DynamicIcon size={24} />
          </div>

          <div className="flex flex-col gap-2">
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

        <div>
          <h3
            className="text-xl font-black leading-tight transition-colors duration-300 line-clamp-2"
            style={{ color: isCardHovered ? themeColor : "inherit" }}
          >
            {deck.title}
          </h3>
          <p className="text-foreground/40 text-sm mt-2 line-clamp-2 leading-relaxed">
            {deck.description || "No description provided for this deck."}
          </p>
        </div>
      </div>

      {/* FOOTER ACTIONS (Pointer events auto to allow clicking specific links) */}
      <div className="mt-8 flex items-center justify-between border-t border-card-border/50 pt-4 relative z-20 pointer-events-auto">
        {/* Creator Link */}
        <Link
          href={`/profile/${deck.creator_name}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 group/author"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden bg-background border border-card-border p-[2px] transition-transform group-hover/author:scale-110">
            <img
              src={avatarUrl}
              alt={deck.creator_name}
              className="w-full h-full p-0.5"
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover/author:opacity-100 group-hover/author:text-foreground transition-all"></span>
          @{deck.creator_name}
        </Link>

        <div
          className="relative"
          onMouseEnter={() => setIsTagHovered(true)}
          onMouseLeave={() => setIsTagHovered(false)}
          // ADDED: Mobile toggle support
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsTagHovered(!isTagHovered);
          }}
        >
          {deck.tags && deck.tags.length > 0 && (
            <>
              <span
                className="text-[11px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1 transition-all border"
                style={{
                  color: isCardHovered ? themeColor : "inherit",
                  backgroundColor: isCardHovered
                    ? rgbaBackground
                    : `${themeColor}08`,
                  borderColor: isTagHovered ? themeColor : "transparent",
                }}
              >
                <TagIcon size={12} />
                {deck.tags.length}
              </span>

              <AnimatePresence>
                {isTagHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute bottom-full right-0 pb-4 pt-10 z-[100] cursor-default"
                    // ADDED: Ensure clicking inside the tooltip doesn't close it or trigger the card
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="border bg-bg-elevated border-card-border text-foreground p-3 rounded-xl shadow-xl min-w-[140px]">
                      <div className="flex flex-col gap-2">
                        <div className="text-[9px] font-black mb-1 tracking-widest border-b border-card-border pb-1">
                          TAGS
                        </div>
                        {deck.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-bold transition-colors whitespace-nowrap"
                            style={{ color: themeColor }}
                          >
                            #{tag.toUpperCase()}
                          </span>
                        ))}
                        {deck.tags.length > 5 && (
                          <div className="pt-2 mt-1 border-t border-card-border text-[9px] font-black">
                            + {deck.tags.length - 5} MORE
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** * Sub-component for clean stat badges
 */
export function StatBadge({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-background/50 backdrop-blur-md rounded-full border border-card-border">
      <span className="text-muted-foreground">{icon}</span>
      <span
        className="text-[10px] font-black uppercase tracking-tighter"
        suppressHydrationWarning
      >
        {value}
      </span>
    </div>
  );
}
