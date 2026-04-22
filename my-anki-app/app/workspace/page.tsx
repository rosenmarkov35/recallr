"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TiltCard from "../components/TiltCard";
import BackgroundIcons from "../components/BackgroundIcons";

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

const AVAILABLE_ICONS = [
  { name: "Book", icon: Icons.Book },
  { name: "Code", icon: Icons.Code },
  { name: "Flask", icon: Icons.FlaskConical },
  { name: "Globe", icon: Icons.Globe },
  { name: "Music", icon: Icons.Music },
  { name: "Atom", icon: Icons.Atom },
  { name: "Brain", icon: Icons.BrainCircuit },
  { name: "Calculator", icon: Icons.Calculator },
  // 8 NEW ICONS
  { name: "Languages", icon: Icons.Languages },
  { name: "Pill", icon: Icons.Pill },
  { name: "Briefcase", icon: Icons.Briefcase },
  { name: "Palette", icon: Icons.Palette },
  { name: "Cpu", icon: Icons.Cpu },
  { name: "Scale", icon: Icons.Scale },
  { name: "Dna", icon: Icons.Dna },
  { name: "Compass", icon: Icons.Compass },
];

export default function Home() {
  const router = useRouter();
  const [decks, setDecks] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [activeFolder, setActiveFolder] = useState<any | null>(null);

  const [folderToDelete, setFolderToDelete] = useState<any | null>(null);

  const [selectedDeckForBudget, setSelectedDeckForBudget] = useState<
    any | null
  >(null);

  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [tempTitle, setTempTitle] = useState("");
  const [movingDeckId, setMovingDeckId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isFoldersEmptyMinimized, setIsFoldersEmptyMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);

  const toggleFoldersEmpty = () => {
    const newState = !isFoldersEmptyMinimized;
    setIsFoldersEmptyMinimized(newState);
    localStorage.setItem("foldersEmptyMinimized", String(newState));
  };

  const displayedDecks = decks.filter((deck) => {
    const folderId = deck.folder;
    return activeFolder
      ? String(folderId) === String(activeFolder.id)
      : folderId === null || folderId === undefined;
  });

  const fetchData = async () => {
    const token = localStorage.getItem("access");
    if (!token) return router.push("/login");
    try {
      const [decksRes, foldersRes] = await Promise.all([
        axios.get("http://localhost:8000/api/decks/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:8000/api/folders/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setDecks(decksRes.data);
      setFolders(foldersRes.data);
      if (activeFolder) {
        const updated = foldersRes.data.find(
          (f: any) => String(f.id) === String(activeFolder.id),
        );
        updated ? setActiveFolder(updated) : setActiveFolder(null);
      }
    } catch (err) {
      console.error(err);
      router.push("/login");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("foldersEmptyMinimized") === "true";
    setIsFoldersEmptyMinimized(saved);
  }, []);

  const handleUpdateTimeBudget = async (minutes: number) => {
    if (!selectedDeckForBudget) return;
    const token = localStorage.getItem("access");

    try {
      await axios.patch(
        `http://localhost:8000/api/decks/${selectedDeckForBudget.id}/`,
        { daily_budget_minutes: minutes },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSelectedDeckForBudget(null);
      fetchData(); // Refresh the list to see new estimations
    } catch (err) {
      console.error("Failed to update budget", err);
    }
  };

  const handleCreateFolder = async () => {
    const token = localStorage.getItem("access");
    setIsDropdownOpen(false);
    try {
      await axios.post(
        "http://localhost:8000/api/folders/",
        { title: "New Folder" },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameFolder = async (id: number) => {
    const token = localStorage.getItem("access");
    if (!tempTitle.trim()) {
      setEditingFolderId(null);
      return;
    }
    try {
      await axios.patch(
        `http://localhost:8000/api/folders/${id}/`,
        { title: tempTitle },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEditingFolderId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // This just opens the modal
  const handleDeleteFolderClick = (e: React.MouseEvent, folder: any) => {
    e.stopPropagation();
    setFolderToDelete(folder);
  };

  // This performs the actual deletion
  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    const token = localStorage.getItem("access");
    try {
      await axios.delete(
        `http://localhost:8000/api/folders/${folderToDelete.id}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (activeFolder?.id === folderToDelete.id) setActiveFolder(null);
      setFolderToDelete(null); // Close modal
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Delete this folder? Decks inside will become 'Loose Decks'."))
      return;
    const token = localStorage.getItem("access");
    try {
      await axios.delete(`http://localhost:8000/api/folders/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activeFolder?.id === id) setActiveFolder(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToFolder = async (
    deckId: number,
    folderId: number | null,
  ) => {
    const token = localStorage.getItem("access");
    try {
      await axios.patch(
        `http://localhost:8000/api/decks/${deckId}/`,
        { folder: folderId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchData();
      setMovingDeckId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="min-h-[90vh] bg-radial from-blue-900/5 from-2% to-background p-8 text-foreground">
      <BackgroundIcons />
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between z-10 items-center mb-6">
          <div>
            <nav className="flex items-center gap-2 text-sm mb-2 text-muted-foreground">
              <button
                onClick={() => setActiveFolder(null)}
                className={
                  !activeFolder
                    ? "text-blue-500 font-bold"
                    : "hover:text-foreground"
                }
              >
                Library
              </button>
              {activeFolder && (
                <>
                  <Icons.ChevronRight size={14} />
                  <span className="text-foreground font-bold">
                    {activeFolder.title}
                  </span>
                </>
              )}
            </nav>
            <h1 className="text-3xl font-bold">
              {activeFolder ? activeFolder.title : "Your Decks"}
            </h1>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-blue-600 p-3 rounded-full text-white shadow-lg hover:bg-blue-700 transition-all"
            >
              <Icons.Plus
                className={
                  isDropdownOpen
                    ? "rotate-45 transition-transform"
                    : "transition-transform"
                }
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-48 bg-bg-elevated border border-card-border rounded-xl shadow-xl z-50 p-2"
                >
                  <Link
                    href="/create"
                    className="flex items-center gap-3 p-2 hover:bg-background rounded-lg"
                  >
                    <Icons.PlusSquare size={18} className="text-blue-500" /> New
                    Deck
                  </Link>
                  <button
                    onClick={handleCreateFolder}
                    className="w-full flex items-center gap-3 p-2 hover:bg-background rounded-lg text-left"
                  >
                    <Icons.FolderPlus size={18} className="text-emerald-500" />{" "}
                    New Folder
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* FOLDERS - Only show if the user actually has folders */}
        {!activeFolder && folders.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Folders
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {folders.map((f) => (
                <div key={f.id} className="group relative">
                  {editingFolderId === f.id ? (
                    <div className="p-4 bg-bg-elevated border border-blue-500 rounded-xl flex items-center gap-3 pr-10">
                      <Icons.Folder className="text-blue-500 shrink-0" />
                      <input
                        autoFocus
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={() => handleRenameFolder(f.id)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleRenameFolder(f.id)
                        }
                        className="bg-transparent outline-none font-semibold w-full"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setActiveFolder(f)}
                      className="p-4 bg-bg-elevated border border-card-border rounded-xl cursor-pointer hover:border-blue-500 flex items-center gap-3 pr-10 transition-colors"
                    >
                      <Icons.Folder
                        className="text-blue-500 shrink-0"
                        fill="currentColor"
                        fillOpacity={0.1}
                      />
                      <span className="font-semibold truncate">{f.title}</span>

                      <div className="absolute right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolderId(f.id);
                            setTempTitle(f.title);
                          }}
                          className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-blue-500 transition-colors"
                        >
                          <Icons.Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteFolderClick(e, f)}
                          className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Icons.Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DECKS HEADER - Only show if we need to distinguish sections */}
        {(activeFolder || folders.length > 0) && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {activeFolder ? "Contents" : "Loose Decks"}
            </h2>

            {activeFolder && (
              <button
                onClick={() => setActiveFolder(null)}
                className="text-xs font-bold text-blue-500 hover:underline"
              >
                Back to Library
              </button>
            )}
          </div>
        )}

        {displayedDecks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-card-border rounded-3xl opacity-40">
            <Icons.Layers
              className="mx-auto mb-4 text-muted-foreground"
              size={40}
            />
            <p>Empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedDecks.map((deck) => {
              const iconColor = ICON_COLORS[deck.id % ICON_COLORS.length];
              const IconComponent =
                AVAILABLE_ICONS.find((i) => i.name === deck.icon)?.icon ||
                Icons.Book;

              return (
                <TiltCard key={deck.id}>
                  <div
                    style={{ boxShadow: `0px 0px 30px 10px ${iconColor}15` }}
                    className="relative p-6 bg-background border border-card-border rounded-2xl h-full group flex flex-col justify-between shadow-sm transition-all hover:border-muted-foreground/30"
                  >
                    {/* Top-Right Move/Folder Button */}
                    <button
                      onClick={() =>
                        activeFolder
                          ? handleMoveToFolder(deck.id, null)
                          : setMovingDeckId(deck.id)
                      }
                      className="absolute top-4 right-4 p-2 bg-bg-elevated rounded-full opacity-0 group-hover:opacity-100 border border-card-border hover:text-white transition-all z-10"
                      style={{ backgroundColor: "transparent" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = iconColor)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      {activeFolder ? (
                        <Icons.FolderMinus size={16} />
                      ) : (
                        <Icons.FolderPlus size={16} />
                      )}
                    </button>

                    {/* Deck Info Section */}
                    <div>
                      <div
                        className="p-3 rounded-xl mb-4 w-fit"
                        style={{
                          backgroundColor: `${iconColor}20`,
                          color: iconColor,
                        }}
                      >
                        <IconComponent size={24} />
                      </div>

                      <h3 className="text-xl font-bold mb-1">{deck.title}</h3>

                      <div className="flex flex-col gap-1 mb-6">
                        <p className="text-muted-foreground text-sm">
                          {deck.cards?.length || 0} cards
                        </p>

                        <div className="flex items-center text-center gap-2">
                          <button
                            onClick={() => setSelectedDeckForBudget(deck)}
                            className="w-fit text-xs font-bold transition-all flex items-center gap-1.5 py-1 px-2 rounded-lg -ml-2 hover:bg-bg-elevated"
                            style={{ color: iconColor }}
                          >
                            <Icons.Clock size={13} />
                            <span>{deck.daily_budget_minutes || 15}m goal</span>
                          </button>
                          {deck.original_creator_name !== deck.user &&
                            deck.original_creator_name && (
                              <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
                                <Icons.Share2
                                  size={10}
                                  className="text-muted-foreground"
                                />
                                <Link
                                  href={`/profile/${deck.original_creator_name}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                                >
                                  BORROWED FROM @{deck.original_creator_name}
                                </Link>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Study & Inspect */}
                    <div className="flex gap-2">
                      <Link
                        href={`/deck/${deck.id}`}
                        className="flex-1 text-center py-2.5 bg-bg-elevated font-semibold rounded-xl transition-all hover:text-white flex items-center justify-center gap-2"
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = iconColor)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "")
                        }
                      >
                        <Icons.Play size={14} fill="currentColor" />
                        Study
                      </Link>

                      <Link
                        href={`/deck/${deck.id}/inspect`}
                        className="p-2.5 bg-bg-elevated rounded-xl transition-all flex items-center justify-center group/inspect"
                        title="Inspect Deck System"
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = `${iconColor}85`)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "")
                        }
                      >
                        <Icons.TableOfContents
                          size={18}
                          className="text-muted-foreground group-hover/inspect:text-white transition-colors"
                        />
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        )}
      </div>

      {/* MOVE MODAL */}
      <AnimatePresence>
        {movingDeckId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-elevated border border-card-border p-6 rounded-3xl w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Move to Folder</h3>
                <button onClick={() => setMovingDeckId(null)}>
                  <Icons.X size={20} />
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMoveToFolder(movingDeckId, f.id)}
                    className="w-full text-left p-3 rounded-xl hover:text-white flex items-center gap-3"
                    style={{ backgroundColor: "transparent" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#3b82f6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <Icons.Folder size={18} /> {f.title}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TIME BUDGET MODAL */}
      <AnimatePresence>
        {selectedDeckForBudget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-elevated border border-card-border p-6 rounded-3xl w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Set Daily Time Budget</h3>
                <button
                  onClick={() => setSelectedDeckForBudget(null)}
                  className="cursor-pointer"
                >
                  <Icons.X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {[5, 10, 15, 30, 60].map((min) => (
                  <button
                    key={min}
                    onClick={() => handleUpdateTimeBudget(min)}
                    className="w-full text-left p-3 rounded-xl hover:text-white flex items-center gap-3 cursor-pointer"
                    style={{ backgroundColor: "transparent" }}
                    onMouseEnter={(e) => (
                      (e.currentTarget.style.backgroundColor = `${ICON_COLORS[selectedDeckForBudget.id % ICON_COLORS.length]}60`),
                      (e.currentTarget.style.border = `1px solid ${ICON_COLORS[selectedDeckForBudget.id % ICON_COLORS.length]}`)
                    )}
                    onMouseLeave={(e) => (
                      (e.currentTarget.style.backgroundColor = "transparent"),
                      (e.currentTarget.style.border = "1px solid transparent")
                    )}
                  >
                    <Icons.Clock size={18} /> {min} minutes/day
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE FOLDER CONFIRMATION MODAL */}
      <AnimatePresence>
        {folderToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-elevated border border-card-border p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Delete Folder?</h3>
              <p className="text-muted-foreground mb-8 text-sm">
                Are you sure you want to delete{" "}
                <span className="text-foreground font-semibold">
                  "{folderToDelete.title}"
                </span>
                ? Decks inside will safely become "Loose Decks".
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteFolder}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
                >
                  Yes, Delete Folder
                </button>
                <button
                  onClick={() => setFolderToDelete(null)}
                  className="w-full py-3 bg-transparent hover:bg-white/5 text-muted-foreground font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
