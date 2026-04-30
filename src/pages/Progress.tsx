import { Trophy, Target, Flame, Volume2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { HAREKES, LETTERS, TOPICS } from "@/data/letters";
import {
  getNamespaceStats,
  getTopicSrs,
  resetNamespace,
  useSrsTick,
  type Level,
} from "@/data/srs";
import { playLetter, playLetterShape, playRawArabic } from "@/lib/audio";
import { cn } from "@/lib/utils";

// Her topic için harfin nasıl gösterileceği + tıklanınca çalacak ses
function renderForTopic(topicId: string, letterIdx: number) {
  const l = LETTERS[letterIdx];
  switch (topicId) {
    case "pozisyon":
      return {
        display: l.initial + HAREKES.fetha.mark,
        play: () => playLetterShape(l, "initial"),
      };
    case "hareke-temel":
      return {
        display: l.letter + HAREKES.fetha.mark,
        play: () => playRawArabic(l.letter + HAREKES.fetha.mark),
      };
    case "tenvinler":
      return {
        display: l.letter + HAREKES.tenvinFetha.mark,
        play: () => playRawArabic(l.letter + HAREKES.tenvinFetha.mark),
      };
    case "medler":
      return {
        display: l.letter + HAREKES.fetha.mark + "ا",
        play: () => playRawArabic(l.letter + HAREKES.fetha.mark + "ا"),
      };
    case "cezim":
      return {
        display: l.letter + HAREKES.cezim.mark,
        play: () => playLetter(l, "cezim"),
      };
    default:
      return { display: l.letter, play: () => playLetter(l, null) };
  }
}

const LEVEL_INFO: Record<Level, { color: string; label: string; ring: string; bg: string }> = {
  1: { color: "text-destructive", label: "L1 • Yeni",     ring: "ring-destructive/40", bg: "bg-destructive/10" },
  2: { color: "text-warning",     label: "L2 • Çalışılıyor", ring: "ring-warning/40",   bg: "bg-warning/10" },
  3: { color: "text-info",        label: "L3 • İyi",      ring: "ring-info/40",        bg: "bg-info/10" },
  4: { color: "text-success",     label: "L4 • Ezbere",   ring: "ring-success/40",     bg: "bg-success/10" },
};

const Progress = () => {
  const [tab, setTab] = useState<"quiz" | "games">("quiz");
  useSrsTick(tab);
  const stats = getNamespaceStats(tab);
  const list = tab === "quiz" ? TOPICS.map((t) => ({ id: t.id, name: t.title, icon: t.icon })) : [
    { id: "memory", name: "Hafıza", icon: "🃏" },
    { id: "race", name: "Yarış", icon: "🏎️" },
    { id: "balloon", name: "Balon", icon: "🎈" },
    { id: "treasure", name: "Hazine", icon: "📦" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-xl px-4 pb-16">
        <PageHeader onReset={() => { if (confirm(`${tab === "quiz" ? "Quiz" : "Oyun"} ilerlemen sıfırlansın mı?`)) resetNamespace(tab); }} />

        <h1 className="mb-4 text-4xl font-extrabold text-foreground animate-fade-in">İlerleme</h1>

        {/* Tab seçici */}
        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-secondary p-1">
          {(["quiz", "games"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-xl py-2 text-sm font-bold transition-all",
                tab === t ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
              )}
            >
              {t === "quiz" ? "📚 Quizler" : "🎮 Oyunlar"}
            </button>
          ))}
        </div>

        <section className="mb-6 grid grid-cols-3 gap-3 animate-scale-in">
          <StatCard icon={<Trophy className="h-5 w-5 text-warning" />} value={stats.correct} label="Doğru" />
          <StatCard icon={<Target className="h-5 w-5 text-primary" />} value={stats.total} label="Toplam" />
          <StatCard icon={<Flame className="h-5 w-5 text-warning" />} value={`${stats.percent}%`} label="Başarı" />
        </section>

        {/* Seviye dağılımı */}
        <section className="mb-8 rounded-2xl bg-card p-4 shadow-card border border-border/60">
          <div className="mb-2 text-sm font-bold text-foreground">Seviye Dağılımı</div>
          <div className="grid grid-cols-4 gap-2">
            {([1, 2, 3, 4] as Level[]).map((l) => (
              <div key={l} className={cn("rounded-xl p-2 text-center", LEVEL_INFO[l].bg)}>
                <div className={cn("text-lg font-extrabold", LEVEL_INFO[l].color)}>{stats.levelCount[l]}</div>
                <div className="text-[10px] text-muted-foreground">{LEVEL_INFO[l].label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          {list.map((sec) => {
            const topic = getTopicSrs(tab, sec.id);
            return (
              <section key={sec.id}>
                <h2 className="mb-3 text-lg font-bold text-foreground">
                  <span className="mr-2">{sec.icon}</span>
                  {sec.name}
                </h2>
                <div className="grid grid-cols-6 gap-2">
                  {LETTERS.slice(0, 28).map((l, idx) => {
                    const e = topic[l.id];
                    const level: Level = (e?.level ?? 0) as Level;
                    const seen = !!e;
                    const info = seen ? LEVEL_INFO[level] : { color: "text-muted-foreground", bg: "bg-muted", ring: "ring-border", label: "—" };
                    const isQuiz = tab === "quiz";
                    const r = isQuiz ? renderForTopic(sec.id, idx) : { display: l.letter, play: () => playLetter(l, null) };
                    return (
                      <button
                        key={l.id}
                        onClick={r.play}
                        className={cn(
                          "flex flex-col items-center justify-center gap-0.5 rounded-xl p-2 ring-1 transition hover:scale-105",
                          info.bg, info.ring
                        )}
                      >
                        <span className="arabic font-arabic text-2xl text-foreground" dir="rtl">{r.display}</span>
                        <span className="text-[9px] text-muted-foreground leading-tight">{l.name}</span>
                        <span className={cn("text-[10px] font-bold", info.color)}>{seen ? `L${level}` : "—"}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground inline-flex items-center justify-center gap-1 w-full">
          <Volume2 className="h-3 w-3" /> Harfe dokunarak sesini dinle
        </p>
      </main>
    </div>
  );
};

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 text-center shadow-card border border-border/60">
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="text-xl font-extrabold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default Progress;
