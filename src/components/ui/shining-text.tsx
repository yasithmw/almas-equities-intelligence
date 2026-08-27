"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShiningTextProps {
  text: string;
  className?: string;
}

export function ShiningText({ text, className }: ShiningTextProps) {
  // Theme-aware shimmer: muted base → strong foreground peak → muted base.
  // Using HSL tokens means the highlight is always visible against either a
  // light or dark surface, unlike a hardcoded white peak that vanishes on
  // light backgrounds.
  return (
    <motion.span
      className={cn(
        "bg-clip-text text-transparent",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(110deg, hsl(var(--muted-foreground) / 0.55) 0%, hsl(var(--muted-foreground) / 0.55) 35%, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground) / 0.55) 65%, hsl(var(--muted-foreground) / 0.55) 100%)",
        backgroundSize: "200% 100%",
      }}
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      }}
    >
      {text}
    </motion.span>
  );
}
