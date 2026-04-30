import { LETTERS } from "@/data/letters";
import { useEffect, useState } from "react";

const FLOATING = ["ب", "ت", "ث", "ج", "ح", "س", "ع", "ف", "ق", "ن", "م", "ل"];

interface Pos {
  letter: string;
  top: string;
  left: string;
  size: string;
  opacity: number;
}

export function FloatingLetters() {
  const [items, setItems] = useState<Pos[]>([]);

  useEffect(() => {
    const next: Pos[] = FLOATING.map((l, i) => ({
      letter: l,
      top: `${5 + ((i * 73) % 90)}%`,
      left: `${(i % 2 === 0 ? 3 : 78) + ((i * 11) % 10)}%`,
      size: i % 3 === 0 ? "text-7xl" : i % 3 === 1 ? "text-6xl" : "text-5xl",
      opacity: 0.06 + ((i * 7) % 5) / 100,
    }));
    setItems(next);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it, idx) => (
        <span
          key={idx}
          className={`arabic absolute font-arabic ${it.size} text-primary`}
          style={{ top: it.top, left: it.left, opacity: it.opacity }}
        >
          {it.letter}
        </span>
      ))}
    </div>
  );
}
