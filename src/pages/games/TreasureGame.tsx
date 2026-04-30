import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { HAREKES, LETTERS, readLetterWithHareke, type ArabicLetter } from "@/data/letters";
import { pickNextLetter, recordSrsAnswer } from "@/data/srs";
import { playLetter } from "@/lib/audio";
import { cn } from "@/lib/utils";

const HAREKE_LIST = [
  { id: "fetha" as const, ...HAREKES.fetha, color: "bg-topic-yellow" },
  { id: "esre" as const, ...HAREKES.esre, color: "bg-topic-blue" },
  { id: "otre" as const, ...HAREKES.otre, color: "bg-topic-pink" },
];

const POOL = LETTERS.slice(0, 28);

function pickLetter(): ArabicLetter {
  const id = pickNextLetter("games", "treasure", POOL.map((l) => l.id));
  return POOL.find((l) => l.id === id) ?? POOL[0];
}

const TreasureGame = () => {
  const [letter, setLetter] = useState<ArabicLetter>(pickLetter);
  const [hareke, setHareke] = useState(HAREKE_LIST[Math.floor(Math.random() * 3)]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [dragging, setDragging] = useState(false);

  function next() {
    const newLetter = pickLetter();
    const newH = HAREKE_LIST[Math.floor(Math.random() * 3)];
    setLetter(newLetter);
    setHareke(newH);
    setFeedback(null);
    setTimeout(() => playLetter(newLetter, newH.id), 200);
  }

  function drop(targetId: string) {
    if (feedback) return;
    const correct = targetId === hareke.id;
    recordSrsAnswer("games", "treasure", letter.id, correct);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
    }
    setTimeout(next, 800);
  }

  const reading = readLetterWithHareke(letter, hareke.id);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-xl px-4 pb-16">
        <PageHeader title="📦 Hazine Sandığı" backTo="/games" centered onReset={() => { setScore(0); setStreak(0); next(); }} />

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 text-center shadow-card border border-border/60">
            <div className="text-xs text-muted-foreground">Puan</div>
            <div className="text-2xl font-extrabold text-success">{score}</div>
          </div>
          <div className="rounded-2xl bg-card p-4 text-center shadow-card border border-border/60">
            <div className="text-xs text-muted-foreground">Seri</div>
            <div className="text-2xl font-extrabold text-warning">🔥 {streak}</div>
          </div>
        </div>

        <p className="mb-4 text-center text-sm text-muted-foreground">
          Harfi <button onClick={() => playLetter(letter, hareke.id)} className="font-bold text-foreground underline">"{reading}"</button> doğru hareke sandığına bırak
        </p>

        <div className="mb-8 flex justify-center">
          <div
            draggable
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}
            onClick={() => playLetter(letter, hareke.id)}
            className={cn(
              "flex h-32 w-32 cursor-grab items-center justify-center rounded-3xl bg-gradient-primary text-7xl shadow-elegant transition-transform active:cursor-grabbing",
              dragging && "scale-110 rotate-3",
              feedback === "correct" && "animate-pop",
              feedback === "wrong" && "animate-shake"
            )}
          >
            <span className="arabic font-arabic font-bold text-primary-foreground">{letter.letter + hareke.mark}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {HAREKE_LIST.map((h) => (
            <button
              key={h.id}
              onClick={() => drop(h.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); drop(h.id); }}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl text-primary-foreground shadow-card transition-bouncy hover:-translate-y-0.5 hover:shadow-elegant",
                h.color,
                feedback === "correct" && hareke.id === h.id && "ring-4 ring-success",
                feedback === "wrong" && hareke.id === h.id && "ring-4 ring-success",
              )}
            >
              <div className="text-4xl">📦</div>
              <div className="text-sm font-bold">{h.name}</div>
              <div className="text-xs opacity-80">"{h.vowel}"</div>
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          İpucu: Harfe dokunarak sesini dinle
        </p>
      </main>
    </div>
  );
};

export default TreasureGame;
