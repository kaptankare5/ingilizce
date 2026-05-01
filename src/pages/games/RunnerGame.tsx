import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { playSpeech, playFeedback } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { gamePool, shuffle } from "./_shared";
import type { ContentItem } from "@/data/types";

// Subway Surfers benzeri 3 şeritli koşu oyunu
// Üstte soru: "Hangisi: <hedef.label>"
// Şeritlerden cevap kapıları geliyor; doğru olandan geç

interface Gate {
  id: string;
  lane: 0 | 1 | 2;
  y: number; // ekranın altından yukarı (yüzde 0-100)
  item: ContentItem;
  passed: boolean;
}

interface Round {
  target: ContentItem;
  options: ContentItem[]; // 3 seçenek (1 doğru + 2 yanlış)
}

function makeRound(): Round {
  const pool = gamePool();
  const target = pool[Math.floor(Math.random() * pool.length)];
  const wrongs = shuffle(pool.filter((p) => p.id !== target.id)).slice(0, 2);
  return { target, options: shuffle([target, ...wrongs]) };
}

const LANE_COLORS = ["bg-topic-pink", "bg-topic-blue", "bg-topic-orange"];

const RunnerGame = () => {
  const [lane, setLane] = useState<0 | 1 | 2>(1);
  const [round, setRound] = useState<Round>(() => makeRound());
  const [gates, setGates] = useState<Gate[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(true);
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const spawnRef = useRef<number>(0);
  const speedRef = useRef<number>(0.04); // y % per ms

  const ended = lives <= 0;

  // Hedef değiştiğinde sesi çal
  useEffect(() => {
    playSpeech(round.target.speech, round.target.lang);
  }, [round.target.id]);

  // Spawn yeni kapı dizisi (3 lane'de 3 seçenek)
  const spawnGateRow = useCallback(() => {
    const opts = shuffle(round.options);
    const ts = Date.now();
    const newGates: Gate[] = opts.slice(0, 3).map((it, i) => ({
      id: `${ts}-${i}`,
      lane: i as 0 | 1 | 2,
      y: 0,
      item: it,
      passed: false,
    }));
    setGates((g) => [...g, ...newGates]);
  }, [round]);

  // Animasyon
  useEffect(() => {
    if (!running || ended) return;
    const tick = (ts: number) => {
      if (!lastTickRef.current) lastTickRef.current = ts;
      const dt = Math.min(60, ts - lastTickRef.current);
      lastTickRef.current = ts;

      // Kapıları aşağı doğru ilerlet (oyuncuya doğru)
      setGates((gs) => {
        const updated = gs.map((g) => g.passed ? g : { ...g, y: g.y + speedRef.current * dt });
        // çarpışma kontrolü: y ~ 80-90 (oyuncu pozisyonu)
        const collisions: Gate[] = [];
        for (const g of updated) {
          if (!g.passed && g.y >= 78 && g.y <= 92 && g.lane === lane) {
            g.passed = true;
            collisions.push(g);
          }
        }
        if (collisions.length) {
          const hit = collisions[0];
          const correct = hit.item.id === round.target.id;
          if (correct) {
            setScore((s) => s + 10);
            setFeedback("good");
            playFeedback(true);
            // hızlandır
            speedRef.current = Math.min(0.09, speedRef.current + 0.003);
            setTimeout(() => { setFeedback(null); setRound(makeRound()); }, 500);
          } else {
            setLives((l) => l - 1);
            setFeedback("bad");
            playFeedback(false);
            setTimeout(() => setFeedback(null), 500);
          }
        }
        return updated.filter((g) => g.y < 110);
      });

      // spawn
      spawnRef.current += dt;
      if (spawnRef.current > 2200) {
        spawnRef.current = 0;
        spawnGateRow();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); lastTickRef.current = 0; };
  }, [running, ended, lane, round, spawnGateRow]);

  // Klavye
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setLane((l) => (l === 0 ? 0 : ((l - 1) as 0 | 1 | 2)));
      if (e.key === "ArrowRight") setLane((l) => (l === 2 ? 2 : ((l + 1) as 0 | 1 | 2)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Swipe (mobile)
  const touchRef = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchRef.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchRef.current == null) return;
    const dx = e.changedTouches[0].clientX - touchRef.current;
    if (dx < -30) setLane((l) => (l === 0 ? 0 : ((l - 1) as 0 | 1 | 2)));
    else if (dx > 30) setLane((l) => (l === 2 ? 2 : ((l + 1) as 0 | 1 | 2)));
    touchRef.current = null;
  };

  const reset = () => {
    setScore(0); setLives(3); setLane(1); setGates([]); speedRef.current = 0.04;
    setRound(makeRound()); setRunning(true); setFeedback(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-topic-orange/20 to-background">
      <main className="container mx-auto max-w-xl px-4 pb-16">
        <PageHeader title="🏃 Koşu Oyunu" backTo="/oyunlar" centered onReset={reset} />

        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-card p-2 shadow-soft border-2 border-success/30">
            <div className="text-[10px] font-bold text-muted-foreground">Puan</div>
            <div className="text-xl font-extrabold text-success">{score}</div>
          </div>
          <div className="rounded-xl bg-card p-2 shadow-soft border-2 border-destructive/30">
            <div className="text-[10px] font-bold text-muted-foreground">Can</div>
            <div className="text-xl font-extrabold text-destructive">{"❤️".repeat(lives) || "💀"}</div>
          </div>
          <button
            onClick={() => playSpeech(round.target.speech, round.target.lang)}
            className="rounded-xl bg-primary text-primary-foreground p-2 shadow-soft border-2 border-primary font-bold text-sm"
          >🔊 Hedef</button>
        </div>

        <div className="bg-card rounded-2xl p-3 mb-3 shadow-card border-2 border-primary/20 text-center">
          <p className="text-xs font-bold text-muted-foreground">Doğru kapıdan geç:</p>
          <p className="text-3xl font-extrabold text-primary mt-1">
            {round.target.emoji && <span className="mr-2">{round.target.emoji}</span>}
            {round.target.label}
          </p>
        </div>

        <div
          className="relative bg-gradient-to-b from-info/10 via-warning/10 to-success/20 rounded-3xl shadow-card border-4 border-warning/30 overflow-hidden touch-none select-none"
          style={{ height: "60vh" }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Şerit çizgileri */}
          <div className="absolute inset-y-0 left-1/3 w-1 border-l-2 border-dashed border-foreground/20" />
          <div className="absolute inset-y-0 left-2/3 w-1 border-l-2 border-dashed border-foreground/20" />

          {/* Kapılar */}
          {gates.map((g) => (
            <div
              key={g.id}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-card border-4 border-white/60 flex flex-col items-center justify-center transition-opacity",
                LANE_COLORS[g.lane],
                g.passed && "opacity-30",
              )}
              style={{
                left: `${(g.lane * 33.33) + 16.66}%`,
                top: `${g.y}%`,
                width: "26%",
                height: "18%",
              }}
            >
              {g.item.emoji && <span className="text-3xl">{g.item.emoji}</span>}
              <span className="text-base font-extrabold text-white text-shadow-soft">{g.item.label.slice(0, 6)}</span>
            </div>
          ))}

          {/* Maskot oyuncu */}
          <div
            className={cn(
              "absolute bottom-3 -translate-x-1/2 transition-all duration-150 ease-out",
              feedback === "good" && "animate-bounce-in",
              feedback === "bad" && "animate-shake",
            )}
            style={{ left: `${(lane * 33.33) + 16.66}%` }}
          >
            <div className="text-6xl drop-shadow-lg">🦉</div>
          </div>

          {/* Oyun bitti overlay */}
          {ended && (
            <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <div className="text-6xl">🏁</div>
              <p className="text-2xl font-extrabold">Oyun Bitti!</p>
              <p className="text-lg">Skor: <span className="font-extrabold text-success">{score}</span></p>
              <button onClick={reset} className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-card">Tekrar Oyna</button>
            </div>
          )}
        </div>

        {/* Mobil kontrol */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            onTouchStart={(e) => { e.preventDefault(); setLane((l) => (l === 0 ? 0 : ((l - 1) as 0 | 1 | 2))); }}
            onClick={() => setLane((l) => (l === 0 ? 0 : ((l - 1) as 0 | 1 | 2)))}
            className="rounded-2xl bg-card border-4 border-primary/30 p-4 text-2xl font-extrabold shadow-soft active:scale-95"
          >⬅️ Sol</button>
          <button
            onTouchStart={(e) => { e.preventDefault(); setLane((l) => (l === 2 ? 2 : ((l + 1) as 0 | 1 | 2))); }}
            onClick={() => setLane((l) => (l === 2 ? 2 : ((l + 1) as 0 | 1 | 2)))}
            className="rounded-2xl bg-card border-4 border-primary/30 p-4 text-2xl font-extrabold shadow-soft active:scale-95"
          >Sağ ➡️</button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">Sola/sağa kaydır veya butonlara dokun</p>
      </main>
    </div>
  );
};

export default RunnerGame;
