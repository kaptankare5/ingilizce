import { Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  HAREKES,
  LETTERS,
  TOPICS,
  readLetterWithHareke,
  type ArabicLetter,
} from "@/data/letters";
import { pickNextLetter, recordSrsAnswer, resetTopicSrs } from "@/data/srs";
import { playLetter, playLetterShape, playLetterWithMed, playRawArabic } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface Question {
  prompt: string;          // ekrandaki Türkçe soru
  spokenArabic: string;    // Arapça okuma metni (ElevenLabs)
  spokenTr: string;        // yedek TR
  correctIdx: number;
  correctLetterId: string;
  options: { display: string; letterId: string; isArabic: boolean }[];
}

const POOL = LETTERS.slice(0, 28); // lamelif quiz'lerden ayrı tutuluyor

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(correct: ArabicLetter, n = 3) {
  return shuffle(POOL.filter((l) => l.id !== correct.id)).slice(0, n);
}

function buildQuestion(topicId: string): Question {
  // SRS ile doğru harfi seç
  const correctId = pickNextLetter("quiz", topicId, POOL.map((l) => l.id));
  const correct = POOL.find((l) => l.id === correctId) ?? POOL[0];
  const distractors = pickDistractors(correct);
  const items = shuffle([correct, ...distractors]);

  switch (topicId) {
    case "pozisyon": {
      const positions = ["initial", "medial", "final"] as const;
      const pos = positions[Math.floor(Math.random() * positions.length)];
      const posName = pos === "initial" ? "başta" : pos === "medial" ? "ortada" : "sonda";
      // Şıklar fethalı bağlantı şekli
      return {
        prompt: `"${correct.name}" harfinin ${posName} şekli hangisi?`,
        spokenArabic: correct[pos] + HAREKES.fetha.mark,
        spokenTr: readLetterWithHareke(correct, "fetha"),
        correctIdx: items.findIndex((l) => l.id === correct.id),
        correctLetterId: correct.id,
        options: items.map((l) => ({
          display: l[pos] + HAREKES.fetha.mark,
          letterId: l.id,
          isArabic: true,
        })),
      };
    }
    case "hareke-temel": {
      const harekeKeys = ["fetha", "esre", "otre"] as const;
      const hk = harekeKeys[Math.floor(Math.random() * harekeKeys.length)];
      const tr = readLetterWithHareke(correct, hk);
      return {
        prompt: `"${tr}" nasıl yazılır?`,
        spokenArabic: correct.letter + HAREKES[hk].mark,
        spokenTr: tr,
        correctIdx: items.findIndex((l) => l.id === correct.id),
        correctLetterId: correct.id,
        options: items.map((l) => ({
          display: l.letter + HAREKES[hk].mark,
          letterId: l.id,
          isArabic: true,
        })),
      };
    }
    case "tenvinler": {
      const harekeKeys = ["tenvinFetha", "tenvinEsre", "tenvinOtre"] as const;
      const hk = harekeKeys[Math.floor(Math.random() * harekeKeys.length)];
      const tr = readLetterWithHareke(correct, hk);
      return {
        prompt: `"${tr}" tenvini hangisi?`,
        spokenArabic: correct.letter + HAREKES[hk].mark,
        spokenTr: tr,
        correctIdx: items.findIndex((l) => l.id === correct.id),
        correctLetterId: correct.id,
        options: items.map((l) => ({
          display: l.letter + HAREKES[hk].mark,
          letterId: l.id,
          isArabic: true,
        })),
      };
    }
    case "medler": {
      const meds = [
        { ar: "ا", key: "elif" as const, hKey: "fetha" as const, name: "elif medi" },
        { ar: "و", key: "vav" as const, hKey: "otre" as const, name: "vav medi" },
        { ar: "ي", key: "ye" as const, hKey: "esre" as const, name: "ye medi" },
      ];
      const m = meds[Math.floor(Math.random() * meds.length)];
      const tr = readLetterWithHareke(correct, m.hKey);
      const trLong = tr + tr.slice(-1);
      return {
        prompt: `"${trLong}" (${m.name}) hangisi?`,
        spokenArabic: correct.letter + HAREKES[m.hKey].mark + m.ar,
        spokenTr: trLong,
        correctIdx: items.findIndex((l) => l.id === correct.id),
        correctLetterId: correct.id,
        options: items.map((l) => ({
          display: l.letter + HAREKES[m.hKey].mark + m.ar,
          letterId: l.id,
          isArabic: true,
        })),
      };
    }
    case "cezim": {
      // Cezim okunuşu: "elif fethalı + harf sukun" → "en", "eb", "ec"
      const cezimReading = "e" + (correct.consonant || correct.name);
      return {
        prompt: `Sükûnlu "${cezimReading}" hangisi?`,
        spokenArabic: "أَ" + correct.letter + HAREKES.cezim.mark,
        spokenTr: cezimReading,
        correctIdx: items.findIndex((l) => l.id === correct.id),
        correctLetterId: correct.id,
        options: items.map((l) => ({
          display: l.letter + HAREKES.cezim.mark,
          letterId: l.id,
          isArabic: true,
        })),
      };
    }
    default: {
      // temel — sade harf adı
      return {
        prompt: `Hangisi "${correct.name}" harfidir?`,
        spokenArabic: correct.letter,
        spokenTr: correct.name,
        correctIdx: items.findIndex((l) => l.id === correct.id),
        correctLetterId: correct.id,
        options: items.map((l) => ({ display: l.letter, letterId: l.id, isArabic: true })),
      };
    }
  }
}

function playQuestion(q: Question, topicId: string) {
  const correct = POOL.find((l) => l.id === q.correctLetterId);
  if (!correct) return;
  switch (topicId) {
    case "temel":   return playLetter(correct, null);
    case "pozisyon":return playLetterShape(correct, "isolated");
    case "hareke-temel": {
      // doğru hareke — Arapça spoken metninden çıkar
      // Daha basit: her zaman fetha/esre/ötre tahmin etmek yerine direkt arabik metni okut
      return playRawArabic(q.spokenArabic, q.spokenTr);
    }
    case "tenvinler": return playRawArabic(q.spokenArabic, q.spokenTr);
    case "medler":    return playRawArabic(q.spokenArabic, q.spokenTr);
    case "cezim":     return playLetter(correct, "cezim");
    default:          return playLetter(correct, null);
  }
}

const Quiz = () => {
  const { topicId = "temel" } = useParams();
  const topic = useMemo(() => TOPICS.find((t) => t.id === topicId) ?? TOPICS[0], [topicId]);

  const [q, setQ] = useState<Question>(() => buildQuestion(topicId));
  const [selected, setSelected] = useState<number | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0 });

  useEffect(() => {
    const fresh = buildQuestion(topicId);
    setQ(fresh);
    setSelected(null);
    setStats({ correct: 0, total: 0, streak: 0 });
    // Soruyu otomatik okut
    setTimeout(() => playQuestion(fresh, topicId), 250);
  }, [topicId]);

  function next() {
    setSelected(null);
    const fresh = buildQuestion(topicId);
    setQ(fresh);
    setTimeout(() => playQuestion(fresh, topicId), 200);
  }

  function answer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === q.correctIdx;
    recordSrsAnswer("quiz", topicId, q.correctLetterId, isCorrect);
    setStats((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
      streak: isCorrect ? s.streak + 1 : 0,
    }));
    setTimeout(next, isCorrect ? 700 : 1200);
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-xl px-4 pb-16">
        <PageHeader
          title={topic.title}
          backTo="/topics"
          centered
          onReset={() => {
            resetTopicSrs("quiz", topicId);
            setStats({ correct: 0, total: 0, streak: 0 });
            next();
          }}
        />

        <div className="mb-6 grid grid-cols-3 rounded-2xl bg-card p-4 shadow-card border border-border/60">
          <Stat label="Doğru" value={stats.correct} valueClass="text-success" />
          <Stat label="Toplam" value={stats.total} />
          <Stat label="Seri" value={<span className="inline-flex items-center gap-1">🔥 {stats.streak}</span>} valueClass="text-warning" />
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-foreground">{q.prompt}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => playQuestion(q, topicId)}
            className="mt-3 gap-2 rounded-full border-primary/30 bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary"
          >
            <Volume2 className="h-4 w-4" />
            Dinle
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correctIdx;
            const isPicked = selected === idx;
            const reveal = selected !== null;
            return (
              <button
                key={idx}
                onClick={() => answer(idx)}
                disabled={selected !== null}
                className={cn(
                  "flex aspect-[5/4] items-center justify-center rounded-2xl border-2 bg-card text-5xl shadow-card transition-bouncy",
                  "hover:-translate-y-0.5 hover:shadow-elegant",
                  reveal && isCorrect && "border-success bg-success/10 animate-pop",
                  reveal && isPicked && !isCorrect && "border-destructive bg-destructive/10 animate-shake",
                  !reveal && "border-border/60 hover:border-primary/40"
                )}
              >
                <span className={cn("arabic font-arabic font-bold text-foreground", opt.isArabic && "text-6xl")} dir="rtl">
                  {opt.display}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

function Stat({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="text-center">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-extrabold text-foreground", valueClass)}>{value}</div>
    </div>
  );
}

export default Quiz;
