import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { LETTERS } from "@/data/letters";
import { pickNextLetter, recordSrsAnswer } from "@/data/srs";
import { playLetter } from "@/lib/audio";
import { cn } from "@/lib/utils";

const POOL = LETTERS.slice(0, 28);

interface Q {
  prompt: string;
  correctIdx: number;
  correctLetterId: string;
  options: { letterId: string; letter: string }[];
}

function shuffle<T>(a: T[]) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeQ(): Q {
  const id = pickNextLetter("games", "race", POOL.map((l) => l.id));
  const correct = POOL.find((l) => l.id === id) ?? POOL[0];
  const distractors = shuffle(POOL.filter((l) => l.id !== correct.id)).slice(0, 3);
  const items = shuffle([correct, ...distractors]);
  return {
    prompt: correct.name,
    correctIdx: items.findIndex((l) => l.id === correct.id),
    correctLetterId: correct.id,
    options: items.map((l) => ({ letterId: l.id, letter: l.letter })),
  };
}

const RaceGame = () => {
  const [q, setQ] = useState<Q>(() => makeQ());
  const [time, setTime] = useState(60);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = window.setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  function reset() {
    setQ(makeQ());
    setTime(60);
    setScore(0);
    setRunning(true);
  }

  function pick(idx: number) {
    if (!running) return;
    const correct = idx === q.correctIdx;
    recordSrsAnswer("games", "race", q.correctLetterId, correct);
    if (correct) setScore((s) => s + 1);
    else setTime((t) => Math.max(0, t - 3));
    setQ(makeQ());
  }

  function listen() {
    const correct = POOL.find((l) => l.id === q.correctLetterId);
    if (correct) playLetter(correct, null);
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-xl px-4 pb-16">
        <PageHeader title="🏎️ Bilgi Yarışı" backTo="/games" centered onReset={reset} />

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 text-center shadow-card border border-border/60">
            <div className="text-xs text-muted-foreground">Süre</div>
            <div className={cn("text-3xl font-extrabold", time <= 10 ? "text-destructive" : "text-info")}>{time}s</div>
          </div>
          <div className="rounded-2xl bg-card p-4 text-center shadow-card border border-border/60">
            <div className="text-xs text-muted-foreground">Puan</div>
            <div className="text-3xl font-extrabold text-success">{score}</div>
          </div>
        </div>

        {running ? (
          <>
            <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
              "{q.prompt}" hangisi?
            </h2>
            <div className="mb-6 text-center">
              <button onClick={listen} className="text-sm text-primary underline">🔊 Dinle</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => pick(idx)}
                  className="aspect-[5/4] rounded-2xl border-2 border-border/60 bg-card text-6xl shadow-card transition-bouncy hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
                >
                  <span className="arabic font-arabic font-bold text-foreground">{opt.letter}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-card p-8 text-center shadow-card border border-border/60 animate-scale-in">
            <p className="text-5xl">🏁</p>
            <p className="mt-4 text-2xl font-extrabold text-foreground">Süre bitti!</p>
            <p className="mt-1 text-lg text-muted-foreground">Skorun: <span className="font-bold text-success">{score}</span></p>
            <button onClick={reset} className="mt-6 rounded-full bg-primary px-6 py-2 font-semibold text-primary-foreground">
              Tekrar Oyna
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default RaceGame;
