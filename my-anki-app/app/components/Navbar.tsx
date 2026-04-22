"use client";
import { useEffect, useState } from "react";
import {
  LogIn,
  LogOut,
  Sun,
  Moon,
  FolderOpen,
  Library,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import StreakCounter from "./StreakCounter";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Workspace", path: "/workspace", icon: FolderOpen },
    { id: "library", label: "Library", path: "/library", icon: Library },
  ];

  useEffect(() => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    setIsDark(isCurrentlyDark);

    const checkAuth = () => {
      const token = localStorage.getItem("access");
      setIsLoggedIn(!!token);
      if (token) fetchGlobalStreak(token);
    };

    const fetchGlobalStreak = async (token: string) => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/user/activity/",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setStreak(res.data.streak);
      } catch (err: any) {
        // If the backend says the token is bad (401)
        if (err.response?.status === 401) {
          console.warn("Token expired or invalid. Logging out.");
          handleLogout(); // Clear local storage and set isLoggedIn to false
        } else {
          console.error("Failed to fetch streak", err);
        }
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("focus", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("focus", checkAuth);
    };
  }, []);

  // Close menu when navigating
  useEffect(() => setIsMenuOpen(false), [pathname]);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove("dark");
      html.classList.add("light"); // Crucial to override system dark
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      html.classList.remove("light");
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <nav className="min-h-[10vh] px-[6vw] md:px-[8vw] flex justify-between items-center border-b border-card-border bg-background/30 backdrop-blur-2xl relative z-[100]">
      <div className="flex items-center gap-4 md:gap-6">
        <motion.div
          whileHover={{ scale: 1.2 }}
          className="cursor-pointer relative"
        >
          <Link href={`${isLoggedIn ? "/workspace" : "/"}`}>
            <Image
              src="/images/zz.png"
              alt="Logo"
              width={50}
              height={50}
              className={`drop-shadow-[0_0  _10px_rgba(0,0,255,0.4)] transition-all`}
            />
          </Link>
        </motion.div>
        <div className="hidden md:block">
          <NavigationPill navItems={navItems} pathname={pathname} />
        </div>
        <StreakCounter streak={streak} isLoggedIn={isLoggedIn} />
      </div>
      <div className="md:hidden">
        <NavigationPill navItems={navItems} pathname={pathname} />
      </div>

      {/* Desktop Actions */}
      <div className="hidden md:flex items-center gap-6">
        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
        <AuthButton isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      </div>

      {/* Mobile Hamburger Toggle */}
      <div className="md:hidden flex items-center">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-foreground bg-elevated border border-card-border rounded-xl"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 backdrop-blur-sm z-[-1] md:hidden"
            />
            {/* Menu Card */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-[11vh] right-[6vw] bg-background border border-card-border p-4 rounded-2xl shadow-2xl flex flex-col gap-4 min-w-[150px] z-[101] md:hidden"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Theme
                </span>
                <ThemeToggle
                  isDark={isDark}
                  toggleTheme={toggleTheme}
                  hideTooltip
                />
              </div>
              <div className="h-px bg-card-border w-full" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Account
                </span>
                <AuthButton
                  isLoggedIn={isLoggedIn}
                  handleLogout={handleLogout}
                  hideTooltip
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* --- SUB-COMPONENTS TO CLEAN UP THE MAIN RENDER --- */

function ThemeToggle({ isDark, toggleTheme, hideTooltip = false }: any) {
  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="p-2 rounded-xl bg-background border border-card-border text-foreground transition-colors relative group"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isDark ? "moon" : "sun"}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
        >
          {isDark ? <Moon size={20} /> : <Sun size={20} />}
        </motion.div>
      </AnimatePresence>
      {!hideTooltip && (
        <span className="absolute w-max text-center bg-background border-card-border border px-4 py-1 rounded-3xl drop-shadow-xl -bottom-12 left-1/2 transform -translate-x-1/2 text-sm text-foreground opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </motion.button>
  );
}

function NavigationPill({
  navItems,
  pathname,
}: {
  navItems: any[];
  pathname: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center bg-elevated border border-card-border rounded-full p-1 shadow-inner relative w-fit mx-auto"
    >
      {navItems.map((item) => {
        const active = pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.path}
            className="relative px-0.5 md:px-1"
          >
            <motion.div
              animate={{ scale: active ? 1.05 : 1 }}
              className={`relative z-10 flex items-center gap-2 px-4 md:px-5 py-2 rounded-full transition-all duration-300 group ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground opacity-60 hover:opacity-100"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {active && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  className="text-[10px] md:text-xs font-black uppercase tracking-tighter overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </motion.div>

            {active && (
              <motion.div
                layoutId="navbar-pill-bg"
                className="absolute inset-0 bg-card-bg border border-white/5 shadow-md rounded-full z-0"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
          </Link>
        );
      })}
    </motion.div>
  );
}

function AuthButton({ isLoggedIn, handleLogout, hideTooltip = false }: any) {
  if (isLoggedIn) {
    return (
      <motion.button
        onClick={handleLogout}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 3 }}
        className="relative group p-2 text-red-600"
      >
        <LogOut className="h-7 w-7 md:h-8 md:w-8 hover:scale-110 transition-all cursor-pointer" />
        {!hideTooltip && (
          <span className="absolute w-max text-center bg-background border-card-border border px-4 py-1 rounded-3xl drop-shadow-xl -bottom-10 left-1/2 transform -translate-x-1/2 text-sm text-foreground opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Log Out
          </span>
        )}
      </motion.button>
    );
  }
  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 3 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="relative group"
    >
      <Link href="/login">
        <LogIn className="h-7 w-7 md:h-8 md:w-8 text-foreground hover:scale-110 transition-all cursor-pointer" />
        {!hideTooltip && (
          <span className="absolute w-max text-center bg-background border-card-border border px-4 py-1 rounded-3xl drop-shadow-xl -bottom-10 left-1/2 transform -translate-x-1/2 text-sm text-foreground opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Log In
          </span>
        )}
      </Link>
    </motion.div>
  );
}
