import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { LETTERS } from "@/data/letters";
import { ensureLetters, pickNextLetter, recordSrsAnswer } from "@/data/srs";
import { playLetter } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface Card {
  id: number;
  pairKey: string;
  display: string;
  isArabic: boolean;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): Card[] {
  // SRS'den 8 farklı harf seç (zayıf harfler öncelikli)
  const allIds = LETTERS.slice(0, 28).map((l) => l.id);
  ensureLetters("games", "memory", allIds);
  const picked: string[] = [];
  while (picked.length < 8) {
    const id = pickNextLetter("games", "memory", allIds.filter((x) => !picked.includes(x)));
    picked.push(id);
  }
  const picks = picked.map((id) => LETTERS.find((l) => l.id === id)!);
  const cards: Card[] = [];
  let id = 0;
  picks.forEach((l) => {
    cards.push({ id: id++, pairKey: l.id, display: l.letter, isArabic: true, flipped: false, matched: false });
    cards.push({ id: id++, pairKey: l.id, display: l.name, isArabic: false, flipped: false, matched: false });
  });
  return shuffle(cards);
}

const MemoryGame = () => {
  const [deck, setDeck] = useState<Card[]>(() => buildDeck());
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const matched = deck.filter((c) => c.matched).length / 2;

  function reset() {
    setDeck(buildDeck());
    setOpen([]);
    setMoves(0);
  }

  function flip(id: number) {
    if (open.length >= 2) return;
    const card = deck.find((c) => c.id === id);
    if (!card || card.matched || card.flipped) return;
    // Karta dokunulduğunda harfin sesini çal (ikinci kartta kontrol)
    const letter = LETTERS.find((l) => l.id === card.pairKey);
    if (letter) playLetter(letter, null);
    const nextOpen = [...open, id];
    setDeck((d) => d.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setOpen(nextOpen);

    if (nextOpen.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextOpen.map((i) => deck.find((c) => c.id === i)!);
      const matched = a.pairKey === b.pairKey;
      recordSrsAnswer("games", "memory", a.pairKey, matched);
      if (matched) {
        setTimeout(() => {
          setDeck((d) => d.map((c) => (c.pairKey === a.pairKey ? { ...c, matched: true, flipped: true } : c)));
          setOpen([]);
        }, 450);
      } else {
        setTimeout(() => {
          setDeck((d) => d.map((c) => (nextOpen.includes(c.id) ? { ...c, flipped: false } : c)));
          setOpen([]);
        }, 900);
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-xl px-4 pb-16">
        <PageHeader title="🃏 Hafıza Kartları" backTo="/games" centered onReset={reset} />

        <div className="mb-4 flex items-center justify-between rounded-2xl bg-card p-4 shadow-card border border-border/60">
          <div>
            <div className="text-xs text-muted-foreground">Hamle</div>
            <div className="text-2xl font-extrabold text-foreground">{moves}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Eşleşme</div>
            <div className="text-2xl font-extrabold text-success">{matched}/8</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {deck.map((c) => (
            <button
              key={c.id}
              onClick={() => flip(c.id)}
              className={cn(
                "aspect-square rounded-2xl border-2 transition-bouncy",
                c.matched && "border-success bg-success/10",
                !c.matched && c.flipped && "border-primary/40 bg-card",
                !c.flipped && "border-border/60 bg-card hover:-translate-y-0.5"
              )}
            >
              {c.flipped || c.matched ? (
                <span className={cn("font-bold text-foreground", c.isArabic ? "arabic font-arabic text-3xl" : "text-sm")}>
                  {c.display}
                </span>
              ) : (
                <span className="text-3xl font-extrabold text-destructive">?</span>
              )}
            </button>
          ))}
        </div>

        {matched === 8 && (
          <div className="mt-6 rounded-2xl bg-success/10 p-6 text-center animate-scale-in">
            <p className="text-3xl">🎉</p>
            <p className="mt-2 text-lg font-bold text-success">Harika! {moves} hamlede tamamladın.</p>
            <button onClick={reset} className="mt-4 rounded-full bg-primary px-6 py-2 font-semibold text-primary-foreground">
              Tekrar Oyna
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MemoryGame;
