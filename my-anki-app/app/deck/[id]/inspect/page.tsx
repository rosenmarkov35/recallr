"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Activity,
  AlertCircle,
  Settings,
  Trash2,
  Save,
  X,
  Book,
  Code,
  FlaskConical,
  Globe,
  Music,
  Atom,
  BrainCircuit,
  Calculator,
  Languages,
  Pill,
  Briefcase,
  Palette,
  Cpu,
  Scale,
  Dna,
  Compass,
} from "lucide-react";
import StudyHeatmap from "@/app/components/StudyHeatmap";

const AVAILABLE_ICONS = [
  { name: "Book", icon: Book },
  { name: "Code", icon: Code },
  { name: "Flask", icon: FlaskConical },
  { name: "Globe", icon: Globe },
  { name: "Music", icon: Music },
  { name: "Atom", icon: Atom },
  { name: "Brain", icon: BrainCircuit },
  { name: "Calculator", icon: Calculator },
  { name: "Languages", icon: Languages },
  { name: "Pill", icon: Pill },
  { name: "Briefcase", icon: Briefcase },
  { name: "Palette", icon: Palette },
  { name: "Cpu", icon: Cpu },
  { name: "Scale", icon: Scale },
  { name: "Dna", icon: Dna },
  { name: "Compass", icon: Compass },
];

export default function DeckInspectPage() {
  const [error, setError] = useState<number | null>(null);

  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [deck, setDeck] = useState<any>(null);

  // Management States
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Book");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState("");
  const [dailyBudget, setDailyBudget] = useState(15);
  const [deadline, setDeadline] = useState("");
  const [difficulty, setDifficulty] = useState(1.0);

  // Optional card addition during update
  const [rawData, setRawData] = useState("");
  const [qSep, setQSep] = useState(";");
  const [cSep, setCSep] = useState("\\n");

  const [cards, setCards] = useState<any[]>([]);

  const loadEditData = () => {
    // 1. Basic Metadata
    setTitle(deck.title || "");
    setDescription(deck.description || "");
    setSelectedIcon(deck.icon || "Book");
    setIsPublic(deck.is_public || false);
    setTags(
      deck.tags
        ?.map((t: any) => (typeof t === "string" ? t : t.name))
        .join(", ") || "",
    );
    setDailyBudget(deck.daily_budget_minutes || 15);
    setDeadline(deck.target_deadline || "");
    setDifficulty(deck.difficulty_multiplier || 1.0);

    // 2. Prepare Separators
    // Ensure we have a fallback if the state hasn't been set yet
    const currentQSep = qSep || ";";
    const rowSeparator = cSep === "\\n" ? "\n" : cSep || "\n";

    // 3. Normalize and Format Cards
    // We .trim() each field to ensure the "Content-Key" matches the Backend
    if (deck.cards && Array.isArray(deck.cards)) {
      const prefilledCards = deck.cards
        .map((c: any) => {
          const q = (c.question || "").trim();
          const a = (c.answer || "").trim();
          return `${q}${currentQSep}${a}`;
        })
        .join(rowSeparator);

      setRawData(prefilledCards);
    } else {
      setRawData("");
    }

    setIsEditing(true);
  };

  useEffect(() => {
    const token = localStorage.getItem("access");
    const fetchData = async () => {
      try {
        const [statsRes, deckRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/decks/${id}/stats/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:8000/api/decks/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setData(statsRes.data);
        setDeck(deckRes.data);
      } catch (err: any) {
        console.error("System Access Denied", err);
        // Capture the status code (404 or 403)
        setError(err.response?.status || 500);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this deck? This action cannot be undone.",
      )
    )
      return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("access");
      await axios.delete(`http://localhost:8000/api/decks/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/");
    } catch (error) {
      console.error("Failed to delete", error);
      alert("Failed to delete deck.");
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("Title is required");

    setIsUpdating(true);
    const token = localStorage.getItem("access");

    const payload: any = {
      title,
      description,
      icon: selectedIcon,
      is_public: isPublic,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== ""),
      daily_budget_minutes: dailyBudget,
      target_deadline: deadline || null,
      difficulty_multiplier: difficulty,
    };

    // Only append card processing details if they are adding new cards
    if (rawData.trim()) {
      payload.raw_data = rawData;
      payload.qa_separator = qSep.trim() || ";";
      payload.card_separator = cSep === "\\n" || !cSep.trim() ? "\n" : cSep;
    }

    try {
      await axios.patch(`http://localhost:8000/api/decks/${id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsEditing(false); // Close edit mode and trigger re-fetch
    } catch (error: any) {
      console.error("Update Error:", error.response?.data);
      alert("Error: " + JSON.stringify(error.response?.data));
    } finally {
      setIsUpdating(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md space-y-6"
        >
          <div className="inline-block p-6 bg-red-500/10 rounded-full mb-4">
            <AlertCircle size={48} className="text-error" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            {error === 404 ? "Deck Not Found" : "Access Restricted"}
          </h1>
          <p className="text-foreground/50 font-medium leading-relaxed">
            {error === 404
              ? "The deck you are looking for could not be found."
              : "You don't have permission to view this deck."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-2xl font-black text-sm hover:opacity-90 transition-all active:scale-95"
          >
            <ArrowLeft size={16} /> RETURN TO DASHBOARD
          </button>
        </motion.div>
      </div>
    );
  }

  if (!data || !deck)
    return (
      <div className="p-10 text-foreground/50 animate-pulse font-mono">
        Initializing System Scan...
      </div>
    );

  // --- EDIT MODE VIEW ---
  if (isEditing) {
    return (
      <div className="min-h-[90vh] bg-background text-foreground p-4 md:p-8 font-sans transition-colors duration-300 flex justify-center pb-20">
        <div className="w-full max-w-3xl space-y-8">
          <button
            onClick={() => setIsEditing(false)}
            className="group flex items-center gap-2 text-foreground/50 hover:text-foreground mb-4 transition-all"
          >
            <X
              size={18}
              className="group-hover:-rotate-90 transition-transform"
            />
            <span className="text-sm font-bold uppercase tracking-widest">
              Cancel Edit
            </span>
          </button>

          <form
            onSubmit={handleUpdate}
            className="w-full space-y-8 bg-background p-10 rounded-[2.5rem] border border-card-border shadow-xl backdrop-blur-sm"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                Update Deck
              </h1>

              <div className="flex items-center gap-4 bg-background p-2 px-4 rounded-full border border-card-border shadow-sm">
                <label className="text-xs font-black text-foreground/50 uppercase tracking-widest">
                  {isPublic ? "Public" : "Private"}
                </label>
                <div
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    isPublic ? "bg-blue-500" : "bg-gray-300 dark:bg-zinc-700"
                  }`}
                >
                  <motion.div
                    animate={{ x: isPublic ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-4 h-4 bg-white rounded-full shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest">
                  Deck Title
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl bg-background border border-card-border p-3 mt-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest">
                  Tags
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl bg-background border border-card-border p-3 mt-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Tags separated by ','"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest">
                Description
              </label>
              <textarea
                className="w-full rounded-xl bg-background border border-card-border p-3 mt-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Time Engine */}
            <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                  Daily Minutes
                </label>
                <div className="mt-2 flex items-center rounded-xl border border-card-border bg-background overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDailyBudget(Math.max(0, dailyBudget - 1))}
                    disabled={dailyBudget <= 0}
                    className="px-4 py-3 text-foreground hover:bg-card-border transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={dailyBudget}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setDailyBudget(isNaN(val) ? 0 : val);
                    }}
                    className="w-full text-center bg-background text-foreground outline-none text-lg font-bold appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setDailyBudget(dailyBudget + 1)}
                    className="px-4 py-3 text-foreground hover:bg-card-border transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                  Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-3 rounded-xl bg-background border border-card-border mt-2"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                  className="w-full p-3 mt-2 rounded-xl bg-background border border-card-border text-foreground outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value={2}>Easy</option>
                  <option value={1.0}>Normal</option>
                  <option value={0.5}>Hard</option>
                </select>
              </div>
            </div>

            {/* Icons */}
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-widest">
                Deck Icon
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {AVAILABLE_ICONS.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSelectedIcon(item.name)}
                      className={`p-4 rounded-xl flex items-center justify-center transition-all ${
                        selectedIcon === item.name
                          ? "bg-blue-500 text-white shadow-lg scale-110"
                          : "bg-background text-foreground hover:bg-card-border border border-card-border"
                      }`}
                    >
                      <IconComponent size={24} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data Edit / Import Section */}
            <div className="space-y-4 pt-8 border-t border-card-border">
              <div className="flex justify-between items-center">
                <label className="text-sm font-black uppercase tracking-widest text-foreground">
                  Deck Cards
                </label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase">
                      Q/A Sep:
                    </span>
                    <input
                      value={qSep}
                      onChange={(e) => setQSep(e.target.value)}
                      className="w-8 bg-transparent border-b border-card-border text-center text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase">
                      Row Sep:
                    </span>
                    <input
                      value={cSep}
                      onChange={(e) => setCSep(e.target.value)}
                      className="w-12 bg-transparent border-b border-card-border text-center text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <textarea
                className="w-full h-80 rounded-[2rem] border border-card-border bg-background p-6 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none custom-scrollbar leading-relaxed"
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder={`Question${qSep}Answer`}
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full flex justify-center items-center gap-2 bg-foreground text-background py-5 rounded-2xl font-black text-lg hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest"
            >
              <Save size={20} />
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- INSPECT MODE VIEW ---
  return (
    <div className="min-h-[90vh] bg-background text-foreground p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-foreground/50 hover:text-foreground mb-8 transition-all"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-bold uppercase tracking-widest">
            Back to Dashboard
          </span>
        </button>

        <header className="mb-10">
          <h1 className="text-5xl font-black tracking-tighter mb-2 flex items-center gap-4">
            {deck.title}
            {deck.is_public ? (
              <span className="text-xs bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full uppercase tracking-widest font-bold align-middle">
                Public
              </span>
            ) : (
              <span className="text-xs bg-red-500/10 text-red-500 px-3 py-1 rounded-full uppercase tracking-widest font-bold align-middle">
                Private
              </span>
            )}
          </h1>
          <div className="flex items-center gap-4 text-foreground/50">
            <span className="text-xs font-bold uppercase tracking-widest">
              {deck.cards.length} Cards
            </span>
            {deck.daily_budget_minutes && (
              <>
                <span>•</span>
                <span className="text-xs font-bold uppercase tracking-widest">
                  {deck.daily_budget_minutes}m / Day
                </span>
              </>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visualizations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Heatmap Section */}
            <section className="bg-bg-elevated border border-card-border p-8 rounded-[2.5rem] backdrop-blur-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/40 flex justify-center items-center gap-2 mb-4">
                <Activity size={14} className="text-blue-500" /> Neural
                Consistency (90D)
              </h3>
              <StudyHeatmap data={data.heatmap} />
            </section>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-bg-elevated border border-card-border p-6 rounded-[2rem]">
                <p className="text-[10px] font-bold uppercase text-foreground/40 mb-2">
                  Retention Stability
                </p>
                <p className="text-4xl font-black text-emerald-500">
                  {data.retention_rate}%
                </p>
              </div>
              <div className="bg-bg-elevated border border-card-border p-6 rounded-[2rem]">
                <p className="text-[10px] font-bold uppercase text-foreground/40 mb-2">
                  Average Easiness
                </p>
                <p className="text-4xl font-black text-blue-500">
                  {data.avg_easiness.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Operations */}
          <aside className="space-y-6">
            {/* Study Operations */}
            <div className="bg-bg-elevated border border-card-border p-6 rounded-[2.5rem]">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40 mb-6">
                Operations
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/deck/${id}`)}
                  className="w-full cursor-pointer hover:scale-105 py-4 bg-foreground text-background rounded-2xl font-black hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Play size={16} fill="currentColor" /> STANDARD STUDY
                </button>
                <button
                  onClick={() => router.push(`/deck/${id}?mode=hard_first`)}
                  className="w-full cursor-pointer hover:scale-105 py-4 bg-background border border-card-border rounded-2xl font-bold hover:border-error transition-all flex items-center justify-center gap-2 group"
                >
                  <AlertCircle
                    size={16}
                    className="text-error group-hover:scale-110 transition-transform"
                  />
                  <span>HARD GRIND</span>
                </button>
              </div>
            </div>

            {/* Deck Management */}
            <div className="bg-bg-elevated border border-card-border p-6 rounded-[2.5rem]">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40 mb-6">
                Management
              </h3>
              <div className="space-y-3">
                <button
                  onClick={loadEditData}
                  className="w-full cursor-pointer hover:scale-105 py-4 bg-background border border-card-border rounded-2xl font-bold hover:border-blue-500 transition-all flex items-center justify-center gap-2 text-foreground/80 hover:text-blue-500"
                >
                  <Settings size={16} />
                  <span>EDIT DECK</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full cursor-pointer hover:scale-105 py-4 bg-background border border-card-border rounded-2xl font-bold hover:bg-error/10 hover:border-error hover:text-error transition-all flex items-center justify-center gap-2 text-foreground/50 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  <span>{isDeleting ? "DELETING..." : "DELETE DECK"}</span>
                </button>
              </div>
            </div>
          </aside>
          {/* NEW: Full Width Composition Section at the Bottom */}
          <section className="bg-bg-elevated border border-card-border col-span-3 p-8 rounded-[2.5rem] backdrop-blur-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/40 mb-1">
                  Deck Composition
                </h3>
                <p className="text-sm text-foreground/60 tracking-wider font-medium">
                  Breakdown of {deck.cards.length} cards by learning stage
                </p>
              </div>

              <div className="flex flex-wrap gap-8">
                <StatItem
                  label="Mature"
                  count={data.composition.mature}
                  color="text-emerald-500"
                />
                <StatItem
                  label="Learning"
                  count={data.composition.learning}
                  color="text-blue-500"
                />
                <StatItem
                  label="Leeches"
                  count={data.composition.leech}
                  color="text-error"
                />
                <StatItem
                  label="New"
                  count={data.composition.new}
                  color="text-foreground/40"
                />
              </div>
            </div>

            {/* Multi-segment Progress Bar */}
            <div className="h-4 w-full bg-foreground/5 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${(data.composition.mature / deck.cards.length) * 100}%`,
                }}
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
              />
              <div
                style={{
                  width: `${(data.composition.learning / deck.cards.length) * 100}%`,
                }}
                className="h-full bg-blue-500 transition-all duration-1000 ease-out delay-100"
              />
              <div
                style={{
                  width: `${(data.composition.leech / deck.cards.length) * 100}%`,
                }}
                className="h-full bg-error transition-all duration-1000 ease-out delay-200"
              />
              <div
                style={{
                  width: `${(data.composition.new / deck.cards.length) * 100}%`,
                }}
                className="h-full bg-foreground/20 transition-all duration-1000 ease-out delay-300"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CompLine({ label, count, total, color }: any) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold uppercase">
        <span className="text-foreground/40">{label}</span>
        <span>{count}</span>
      </div>
      <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatItem({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">
        {label}
      </span>
      <span className={`text-2xl font-black ${color}`}>{count}</span>
    </div>
  );
}
