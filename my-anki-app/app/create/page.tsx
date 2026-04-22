"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";

export default function CreateDeck() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Book");
  const [rawData, setRawData] = useState("");
  const [qSep, setQSep] = useState(";");
  const [cSep, setCSep] = useState("\\n");
  const [isLoading, setIsLoading] = useState(false);

  const [isPublic, setIsPublic] = useState(false);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [dailyBudget, setDailyBudget] = useState(15);
  const [deadline, setDeadline] = useState("");
  const [difficulty, setDifficulty] = useState(1.0);

  const AVAILABLE_ICONS = [
    { name: "Book", icon: Icons.Book },
    { name: "Code", icon: Icons.Code },
    { name: "Flask", icon: Icons.FlaskConical },
    { name: "Globe", icon: Icons.Globe },
    { name: "Music", icon: Icons.Music },
    { name: "Atom", icon: Icons.Atom },
    { name: "Brain", icon: Icons.BrainCircuit },
    { name: "Calculator", icon: Icons.Calculator },
    { name: "Languages", icon: Icons.Languages },
    { name: "Pill", icon: Icons.Pill },
    { name: "Briefcase", icon: Icons.Briefcase },
    { name: "Palette", icon: Icons.Palette },
    { name: "Cpu", icon: Icons.Cpu },
    { name: "Scale", icon: Icons.Scale },
    { name: "Dna", icon: Icons.Dna },
    { name: "Compass", icon: Icons.Compass },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("access");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    if (!rawData.trim()) {
      alert("You must provide card data.");
      return;
    }

    setIsLoading(true);

    const payload = {
      title,
      description,
      raw_data: rawData,
      icon: selectedIcon,
      qa_separator: qSep.trim() || ";",
      card_separator: cSep === "\\n" || !cSep.trim() ? "\n" : cSep,
      is_public: isPublic,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== ""),
      daily_budget_minutes: dailyBudget,
      target_deadline: deadline || null,
      difficulty_multiplier: difficulty,
    };

    try {
      await axios.post("http://localhost:8000/api/decks/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/");
    } catch (error: any) {
      console.error("Error:", error.response?.data);
      alert("Error: " + JSON.stringify(error.response?.data));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-background p-8 flex justify-center pb-20">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl space-y-8 bg-card-bg p-10 rounded-3xl border border-card-border shadow-xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            New Deck
          </h1>

          <div className="flex items-center gap-4 bg-background p-2 px-4 rounded-full border border-card-border shadow-sm">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
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
              className="w-full rounded-xl bg-background border border-card-border p-2 mt-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="w-full rounded-xl bg-background border border-card-border p-2 mt-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Daily Minutes
            </label>

            <div className="mt-2 flex items-center rounded-xl border border-card-border bg-background overflow-hidden">
              {/* Decrease */}
              <button
                type="button"
                onClick={() => setDailyBudget(Math.max(0, dailyBudget - 1))}
                disabled={dailyBudget <= 0}
                className="px-4 py-3 text-foreground hover:bg-card-border transition-colors"
              >
                −
              </button>

              {/* Input */}
              <input
                type="number"
                value={dailyBudget}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDailyBudget(isNaN(val) ? 0 : val);
                }}
                className="w-full text-center bg-background text-foreground outline-none text-lg font-bold appearance-none"
              />

              {/* Increase */}
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
            <label className="text-xs font-bold uppercase">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-3 rounded-xl bg-background border mt-2"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                      : "bg-background text-muted-foreground hover:bg-card-border border border-card-border"
                  }`}
                >
                  <IconComponent size={24} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Import */}
        <div className="space-y-4 pt-4 border-t border-card-border">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold uppercase">Q/A Sep</label>
              <input
                type="text"
                value={qSep}
                onChange={(e) => setQSep(e.target.value)}
                className="w-full p-2 mt-2 rounded-lg border text-center"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold uppercase">Row Sep</label>
              <input
                type="text"
                value={cSep}
                onChange={(e) => setCSep(e.target.value)}
                className="w-full p-2 mt-2 rounded-lg border text-center"
              />
            </div>
          </div>

          <textarea
            className="w-full h-48 rounded-2xl border p-4 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            placeholder={`Question${qSep}Answer\nQuestion${qSep}Answer`}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-blue-500/20 uppercase tracking-widest"
        >
          {isLoading ? "Creating..." : "Create Deck"}
        </button>
      </form>
    </div>
  );
}
