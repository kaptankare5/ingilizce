import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { playSpeech, playFeedback } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { gamePool, shuffle } from "./_shared";
import type { ContentItem } from "@/data/types";

interface Gate { id: string; lane: 0 | 1 | 2; y: number; item: ContentItem; passed: boolean; }
interface Obstacle { id: string; lane: 0 | 1 | 2; y: number; passed: boolean; }
interface Round { target: ContentItem; options: ContentItem[]; }

function makeRound(): Round {
  const pool = gamePool();
  const target = pool[Math.floor(Math.random() * pool.length)];
  const wrongs = shuffle(pool.filter((p) => p.id !== target.id)).slice(0, 2);
  return { target, options: shuffle([target, ...wrongs]) };
}

const PLAYER_Y = 80;
const HIT_TOL = 10;
const JUMP_MS = 700;
// 5 yaş için yavaş başlangıç
const START_SPEED = 0.022;
const MAX_SPEED = 0.04;

const RunnerGame = () => {
  const [lane, setLane] = useState<0 | 1 | 2>(1);
  const [round, setRound] = useState<Round>(() => makeRound());
  const [gates, setGates] = useState<Gate[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);
  const [jumping, setJumping] = useState(false);
  const jumpEndRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const spawnGateRef = useRef<number>(0);
  const spawnObsRef = useRef<number>(1500);
  const speedRef = useRef<number>(START_SPEED);
  const laneRef = useRef(lane);
  const roundRef = useRef(round);

  useEffect(() => { laneRef.current = lane; }, [lane]);
  useEffect(() => { roundRef.current = round; }, [round]);

  const ended = lives <= 0;

  useEffect(() => {
    playSpeech(round.target.speech, round.target.lang);
  }, [round.target.id]);

  const jump = useCallback(() => {
    if (jumpEndRef.current > performance.now()) return;
    jumpEndRef.current = performance.now() + JUMP_MS;
    setJumping(true);
    setTimeout(() => setJumping(false), JUMP_MS);
  }, []);

  // Mutlak şerit ataması (ortaya gitsin)
  const goLane = useCallback((target: 0 | 1 | 2) => {
    setLane(target);
  }, []);
  const moveLane = useCallback((dir: -1 | 1) => {
    setLane((l) => Math.max(0, Math.min(2, l + dir)) as 0 | 1 | 2);
  }, []);

  const spawnGateRow = useCallback(() => {
    const opts = shuffle(roundRef.current.options).slice(0, 3);
    const ts = Date.now();
    setGates((g) => [
      ...g,
      ...opts.map((it, i) => ({
        id: `g-${ts}-${i}`, lane: i as 0 | 1 | 2, y: -10, item: it, passed: false,
      })),
    ]);
  }, []);

  const spawnObstacle = useCallback(() => {
    const ts = Date.now();
    const lane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
    setObstacles((o) => [...o, { id: `o-${ts}`, lane, y: -10, passed: false }]);
  }, []);

  useEffect(() => {
    if (ended) return;
    const tick = (ts: number) => {
      if (!lastTickRef.current) lastTickRef.current = ts;
      const dt = Math.min(60, ts - lastTickRef.current);
      lastTickRef.current = ts;
      const sp = speedRef.current * dt;
      const isJumping = jumpEndRef.current > performance.now();

      setGates((gs) => {
        const updated = gs.map((g) => g.passed ? g : { ...g, y: g.y + sp });
        let hit: Gate | null = null;
        for (const g of updated) {
          if (!g.passed && Math.abs(g.y - PLAYER_Y) < HIT_TOL && g.lane === laneRef.current && !isJumping) {
            g.passed = true;
            if (!hit) hit = g;
          }
        }
        if (hit) {
          const correct = hit.item.id === roundRef.current.target.id;
          if (correct) {
            setScore((s) => s + 10);
            setFeedback("good");
            playFeedback(true);
            speedRef.current = Math.min(MAX_SPEED, speedRef.current + 0.0015);
            setTimeout(() => { setFeedback(null); setRound(makeRound()); }, 600);
          } else {
            setLives((l) => l - 1);
            setFeedback("bad");
            playFeedback(false);
            setTimeout(() => setFeedback(null), 600);
          }
        }
        return updated.filter((g) => g.y < 115);
      });

      setObstacles((os) => {
        const updated = os.map((o) => o.passed ? o : { ...o, y: o.y + sp });
        for (const o of updated) {
          if (!o.passed && Math.abs(o.y - PLAYER_Y) < HIT_TOL && o.lane === laneRef.current) {
            o.passed = true;
            if (!isJumping) {
              setLives((l) => l - 1);
              setFeedback("bad");
              playFeedback(false);
              setTimeout(() => setFeedback(null), 600);
            } else {
              setScore((s) => s + 2);
            }
          }
        }
        return updated.filter((o) => o.y < 115);
      });

      spawnGateRef.current += dt;
      if (spawnGateRef.current > 3500) {
        spawnGateRef.current = 0;
        spawnGateRow();
      }
      spawnObsRef.current += dt;
      if (spawnObsRef.current > 2400 + Math.random() * 1500) {
        spawnObsRef.current = 0;
        spawnObstacle();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = 0;
    };
  }, [ended, spawnGateRow, spawnObstacle]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLane(-1);
      else if (e.key === "ArrowRight") moveLane(1);
      else if (e.key === "ArrowUp" || e.key === " ") { e.preventDefault(); jump(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moveLane, jump]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < -30) moveLane(-1);
      else if (dx > 30) moveLane(1);
    } else {
      if (dy < -30) jump();
    }
    touchStart.current = null;
  };

  const reset = () => {
    setScore(0); setLives(3); setLane(1); setGates([]); setObstacles([]);
    speedRef.current = START_SPEED; setRound(makeRound()); setFeedback(null);
  };

  const scaleAt = (y: number) => 0.45 + Math.max(0, Math.min(1, y / 100)) * 0.85;
  const lanesX = [16.66, 50, 83.33];

  return (
    <div className="min-h-screen bg-gradient-to-b from-info/20 to-background">
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
          <p className="text-xs font-bold text-muted-foreground">Doğru kapıdan geç • engelden zıpla</p>
          <p className="text-6xl mt-1">{round.target.emoji || "🔊"}</p>
        </div>

        <div
          className="relative rounded-3xl shadow-card border-4 border-warning/30 overflow-hidden touch-none select-none"
          style={{
            height: "62vh",
            background: "linear-gradient(to bottom, hsl(140 60% 70%) 0%, hsl(140 55% 55%) 35%, hsl(140 50% 45%) 100%)",
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, transparent 0%, hsl(30 15% 35%) 5%, hsl(30 18% 40%) 100%)",
              clipPath: "polygon(38% 0%, 62% 0%, 100% 100%, 0% 100%)",
            }}
          />
          {[0.333, 0.666].map((p, i) => (
            <div key={i} className="absolute top-0 bottom-0"
              style={{ left: "50%", width: 0, borderLeft: "3px dashed rgba(255,255,255,0.65)",
                transform: `translateX(${(p - 0.5) * 100}%)`,
                clipPath: "polygon(-50% 0%, 50% 0%, 50% 100%, -50% 100%)",
              }}
            />
          ))}
          <div className="absolute left-2 top-2 text-2xl opacity-80">🌳</div>
          <div className="absolute right-2 top-4 text-2xl opacity-80">🌲</div>

          {gates.map((g) => {
            const sc = scaleAt(g.y);
            const laneOffset = (lanesX[g.lane] - 50) * (0.4 + sc * 0.6);
            return (
              <div key={g.id}
                className={cn("absolute rounded-2xl shadow-card border-4 border-white/70 flex items-center justify-center bg-topic-pink", g.passed && "opacity-30")}
                style={{ left: `${50 + laneOffset}%`, top: `${g.y}%`,
                  transform: `translate(-50%, -50%) scale(${sc})`,
                  width: "26%", height: "16%", transition: "opacity 0.2s",
                }}
              >
                <span className="text-4xl">{g.item.emoji}</span>
              </div>
            );
          })}

          {obstacles.map((o) => {
            const sc = scaleAt(o.y);
            const laneOffset = (lanesX[o.lane] - 50) * (0.4 + sc * 0.6);
            return (
              <div key={o.id} className="absolute flex items-center justify-center"
                style={{ left: `${50 + laneOffset}%`, top: `${o.y}%`,
                  transform: `translate(-50%, -50%) scale(${sc})`, width: "22%", height: "10%" }}
              >
                <div className="w-full h-full rounded-lg bg-gradient-to-b from-amber-700 to-amber-900 border-4 border-amber-950 shadow-card flex items-center justify-center text-2xl">🪵</div>
              </div>
            );
          })}

          <div className="absolute"
            style={{ left: `${lanesX[lane]}%`, top: `${PLAYER_Y}%`,
              transform: "translate(-50%, -50%)", transition: "left 0.22s ease-out" }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/40"
              style={{ top: "85%", width: jumping ? "30px" : "55px", height: jumping ? "8px" : "14px",
                transition: "all 0.3s ease-out", filter: "blur(3px)" }}
            />
            <div
              className={cn("text-6xl drop-shadow-2xl transition-all",
                feedback === "good" && "animate-bounce-in",
                feedback === "bad" && "animate-shake")}
              style={{ transform: jumping ? "translateY(-40px) scale(1.15)" : "translateY(0) scale(1)",
                transition: "transform 0.35s cubic-bezier(.4,2,.6,1)",
                filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}
            >🧒</div>
          </div>

          {ended && (
            <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <div className="text-6xl">🏁</div>
              <p className="text-2xl font-extrabold">Oyun Bitti!</p>
              <p className="text-lg">Skor: <span className="font-extrabold text-success">{score}</span></p>
              <button onClick={reset} className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-card">Tekrar Oyna</button>
            </div>
          )}
        </div>

        {/* Mobil kontrol — mutlak şerit (ortaya da gidebilsin) */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            onPointerDown={(e) => { e.preventDefault(); goLane(0); }}
            className={cn("rounded-2xl border-4 p-4 text-2xl font-extrabold shadow-soft active:scale-95",
              lane === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-primary/30")}
          >⬅️</button>
          <button
            onPointerDown={(e) => { e.preventDefault(); goLane(1); jump(); }}
            className="rounded-2xl bg-warning text-warning-foreground border-4 border-warning p-4 text-xl font-extrabold shadow-soft active:scale-95"
          >⤴️ Orta+Zıpla</button>
          <button
            onPointerDown={(e) => { e.preventDefault(); goLane(2); }}
            className={cn("rounded-2xl border-4 p-4 text-2xl font-extrabold shadow-soft active:scale-95",
              lane === 2 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-primary/30")}
          >➡️</button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onPointerDown={(e) => { e.preventDefault(); goLane(1); }}
            className={cn("rounded-2xl border-4 p-3 text-lg font-extrabold shadow-soft active:scale-95",
              lane === 1 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-primary/30")}
          >⬆️ Orta</button>
          <button
            onPointerDown={(e) => { e.preventDefault(); jump(); }}
            className="rounded-2xl bg-success text-white border-4 border-success p-3 text-lg font-extrabold shadow-soft active:scale-95"
          >🦘 Zıpla</button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Şerit butonuna bas • zıpla ile engelden geç
        </p>
      </main>
    </div>
  );
};

export default RunnerGame;
