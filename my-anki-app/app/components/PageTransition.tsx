"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
  key={pathname}
  initial={{ opacity: 0, filter: "blur(10px)" }}
  animate={{ opacity: 1, filter: "blur(0px)" }}
  exit={{ opacity: 0, filter: "blur(10px)" }}
  transition={{ duration: 0.5, ease: "easeInOut" }}
>
  {children}
</motion.div>
    </AnimatePresence>
  );
}
