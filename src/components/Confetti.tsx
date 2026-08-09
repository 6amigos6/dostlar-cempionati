"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = ["#F4C430", "#F5F1E6", "#C9971E"];

interface Piece {
  id: number;
  left: number;
  color: string;
  duration: number;
  delay: number;
}

/** Bursts once whenever `triggerKey` changes to a new, truthy value. */
export default function Confetti({ triggerKey }: { triggerKey: string | null }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!triggerKey || lastKey.current === triggerKey) return;
    lastKey.current = triggerKey;

    const next: Piece[] = Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: 2.2 + Math.random() * 1.6,
      delay: Math.random() * 0.6
    }));
    setPieces(next);

    const timeout = setTimeout(() => setPieces([]), 4500);
    return () => clearTimeout(timeout);
  }, [triggerKey]);

  if (!pieces.length) return null;

  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece animate-confettiFall"
          style={{
            left: `${p.left}vw`,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
    </>
  );
}
