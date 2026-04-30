import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { flattenItems, SUBJECTS } from "@/data/subjects";
import type { ContentItem } from "@/data/types";
import { playItem, playFeedback } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";

function shuffle<T>(a: T[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// Görsel-only itemları al (label kısa, emoji var)
function gamePool(): ContentItem[] {
  return flattenItems().filter((it) =>
    it.emoji && it.label.length <= 12 && !it.id.startsWith("top-") && !it.id.startsWith("cik-") && !it.id.startsWith("karsi-")
  );
}

interface QuizQ {
  target: ContentItem;
  options: ContentItem[];
}

function makeQ(): QuizQ {
  const pool = gamePool();
  const target = pool[Math.floor(Math.random() * pool.length)];
  const wrongs = shuffle(pool.filter((p) => p.id !== target.id)).slice(0, 3);
  return { target, options: shuffle([target, ...wrongs]) };
}

const Game = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [q, setQ] = useState<QuizQ>(() => makeQ());
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);

  // Quiz oyunu için zaman
  useEffect(() => {
    if (gameId !== "quiz") return;
    const t = setInterval(() => setTime((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [gameId]);

  useEffect(() => { playItem(q.target); }, [q.target.id]);

  const choose = async (item: ContentItem) => {
    if (picked) return;
    setPicked(item.id);
    const correct = item.id === q.target.id;
    if (correct) setScore((s) => s + 1);
    await playFeedback(correct);
    setTimeout(() => { setQ(makeQ()); setPicked(null); }, 800);
  };

  if (!["memory","balloon","race","fish","quiz"].includes(gameId || "")) return <Navigate to="/oyunlar" replace />;

  const titles: Record<string,{t:string;e:string;hint:string}> = {
    memory: { t: "Hafıza Kartları", e: "🃏", hint: "Sesi dinle ve doğru kartı bul" },
    balloon: { t: "Balon Patlatma", e: "🎈", hint: "Doğru balonu patlat" },
    race: { t: "Koşu Yarışı", e: "🏃", hint: "Doğru kapıdan geç" },
    fish: { t: "Balık Tutma", e: "🎣", hint: "Doğru balığı yakala" },
    quiz: { t: "Hızlı Quiz", e: "⚡", hint: `Süre: ${time}s` },
  };
  const meta = titles[gameId!];
  const ended = gameId === "quiz" && time <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/40 to-background">
      <main className="container mx-auto max-w-xl px-4 pb-16">
        <PageHeader title={`${meta.e} ${meta.t}`} backTo="/oyunlar" centered onReset={() => { setQ(makeQ()); setScore(0); setTime(60); setPicked(null); }} />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-3 text-center shadow-card border-2 border-warning/30">
            <div className="text-xs text-muted-foreground font-bold">Puan</div>
            <div className="text-2xl font-extrabold text-success">⭐ {score}</div>
          </div>
          <div className="rounded-2xl bg-card p-3 text-center shadow-card border-2 border-info/30">
            <div className="text-xs text-muted-foreground font-bold">Bilgi</div>
            <div className="text-sm font-bold text-foreground">{meta.hint}</div>
          </div>
        </div>

        {ended ? (
          <div className="rounded-3xl bg-card p-8 text-center shadow-card border-4 border-success/40 animate-bounce-in">
            <div className="text-7xl mb-3">🏆</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Tebrikler!</h2>
            <p className="text-lg text-muted-foreground mb-4">Skorun: <span className="text-success font-extrabold">{score}</span></p>
            <button onClick={() => { setScore(0); setTime(60); setQ(makeQ()); }} className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-card transition-bouncy hover:scale-105">Tekrar Oyna</button>
          </div>
        ) : (
          <>
            <div className="bg-card rounded-3xl p-6 shadow-card border-4 border-primary/20 mb-4 text-center animate-bounce-in" key={q.target.id}>
              <p className="text-sm font-bold text-muted-foreground mb-2">Hangisi?</p>
              <button onClick={() => playItem(q.target)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground font-extrabold shadow-soft transition-bouncy hover:scale-105">
                <Volume2 className="h-5 w-5" />
                Tekrar Dinle
              </button>
              <p className="text-xs text-muted-foreground mt-2">({q.target.lang === "en" ? "İngilizce" : "Türkçe"})</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt) => {
                const isCorrect = picked && opt.id === q.target.id;
                const isWrong = picked === opt.id && opt.id !== q.target.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => choose(opt)}
                    className={cn(
                      "aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 shadow-card border-4 transition-bouncy",
                      "bg-card border-primary/20 hover:-translate-y-1",
                      isCorrect && "bg-success border-success animate-pop",
                      isWrong && "bg-destructive border-destructive animate-shake",
                    )}
                  >
                    {opt.emoji && <span className="text-5xl">{opt.emoji}</span>}
                    <span className={cn("text-lg font-extrabold", isCorrect || isWrong ? "text-white" : "text-foreground")}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Game;
