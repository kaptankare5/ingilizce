import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { LETTERS, type ArabicLetter } from "@/data/letters";
import { pickNextLetter, recordSrsAnswer } from "@/data/srs";
import { playLetter } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface Balloon {
  id: number;
  letterId: string;
  letter: string;
  isCorrect: boolean;
  left: number;
  duration: number;
  color: string;
  delay: number;
}

const COLORS = ["bg-topic-pink", "bg-topic-blue", "bg-topic-yellow", "bg-topic-orange", "bg-topic-purple", "bg-topic-green"];
const POOL = LETTERS.slice(0, 28);

let _id = 0;

const BalloonGame = () => {
  const [target, setTarget] = useState<ArabicLetter>(POOL[0]);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [running, setRunning] = useState(true);

  function nextRound() {
    const id = pickNextLetter("games", "balloon", POOL.map((l) => l.id));
    const t = POOL.find((l) => l.id === id) ?? POOL[0];
    setTarget(t);
    const distractors = POOL.filter((l) => l.id !== t.id).sort(() => Math.random() - 0.5).slice(0, 4);
    const list: Balloon[] = [t, ...distractors].sort(() => Math.random() - 0.5).map((l, i) => ({
      id: _id++,
      letterId: l.id,
      letter: l.letter,
      isCorrect: l.id === t.id,
      left: 8 + i * 18 + Math.random() * 6,
      duration: 7 + Math.random() * 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: i * 0.4,
    }));
    setBalloons(list);
    // Hedef harfi sesli oku
    setTimeout(() => playLetter(t, null), 200);
  }

  useEffect(() => {
    nextRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pop(b: Balloon) {
    if (!running) return;
    if (b.isCorrect) {
      recordSrsAnswer("games", "balloon", target.id, true);
      setScore((s) => s + 1);
      nextRound();
    } else {
      recordSrsAnswer("games", "balloon", target.id, false);
      setLives((l) => {
        const nl = l - 1;
        if (nl <= 0) setRunning(false);
        return nl;
      });
      setBalloons((bs) => bs.filter((x) => x.id !== b.id));
    }
  }

  function reset() {
    setScore(0);
    setLives(5);
    setRunning(true);
    nextRound();
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-xl px-4 pb-16">
        <PageHeader title="🎈 Harf Balonları" backTo="/games" centered onReset={reset} />

        <div className="mb-4 flex items-center justify-between rounded-2xl bg-card p-4 shadow-card border border-border/60">
          <div>
            <div className="text-xs text-muted-foreground">Puan</div>
            <div className="text-2xl font-extrabold text-success">{score}</div>
          </div>
          <button className="text-center" onClick={() => playLetter(target, null)}>
            <div className="text-xs text-muted-foreground">Hedef 🔊</div>
            <div className="text-xl font-extrabold text-primary">{target.name}</div>
          </button>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Can</div>
            <div className="text-2xl">{"❤️".repeat(Math.max(0, lives))}</div>
          </div>
        </div>

        {running ? (
          <div className="relative h-[60vh] overflow-hidden rounded-2xl bg-gradient-to-b from-info/10 to-primary-soft border border-border/60">
            {balloons.map((b) => (
              <button
                key={b.id}
                onClick={() => pop(b)}
                className={cn(
                  "absolute flex h-16 w-16 items-center justify-center rounded-full text-3xl text-primary-foreground shadow-elegant",
                  b.color
                )}
                style={{
                  left: `${b.left}%`,
                  bottom: "-80px",
                  animation: `float-up ${b.duration}s linear ${b.delay}s forwards`,
                }}
              >
                <span className="arabic font-arabic font-bold">{b.letter}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-8 text-center shadow-card border border-border/60 animate-scale-in">
            <p className="text-5xl">🎈</p>
            <p className="mt-4 text-2xl font-extrabold text-foreground">Oyun Bitti!</p>
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

export default BalloonGame;
