import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { getSubject, getTopic } from "@/data/subjects";
import { PageHeader } from "@/components/PageHeader";
import { playItem } from "@/lib/audio";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import type { SubjectId } from "@/data/types";
import { MathPractice } from "@/components/MathPractice";

const Topic = () => {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const subject = getSubject(subjectId as SubjectId);
  const topic = getTopic(subjectId as SubjectId, topicId || "");
  const [idx, setIdx] = useState(0);
  const [stars, setStars] = useState(0);

  useEffect(() => { setIdx(0); }, [topicId]);

  if (!subject || !topic) return <Navigate to="/" replace />;

  // Matematik özel pratiği
  if (topic.practiceMode === "math") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-accent/30 to-background">
        <main className="container mx-auto max-w-xl px-4 pb-16">
          <PageHeader title={topic.title} backTo={`/konu/${subject.id}`} centered />
          <MathPractice topic={topic} />
        </main>
      </div>
    );
  }

  const item = topic.items[idx];
  const total = topic.items.length;

  const next = () => setIdx((i) => (i + 1) % total);
  const prev = () => setIdx((i) => (i - 1 + total) % total);

  const handleTap = async () => {
    setStars((s) => s + 1);
    await playItem(item);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      <main className="container mx-auto max-w-xl px-4 pb-16">
        <PageHeader title={topic.title} backTo={`/konu/${subject.id}`} centered />

        <div className="mb-3 flex items-center justify-between text-sm font-bold text-muted-foreground">
          <span>{idx + 1} / {total}</span>
          <span className="text-warning">⭐ {stars}</span>
        </div>

        <button
          onClick={handleTap}
          className="w-full bg-card rounded-3xl p-8 shadow-card border-4 border-primary/20 transition-bouncy hover:scale-[1.02] active:scale-95 animate-bounce-in min-h-[60vh] flex flex-col items-center justify-center gap-4"
          key={item.id}
        >
          {item.emoji && <div className="text-7xl">{item.emoji}</div>}
          <div className="text-8xl font-extrabold text-primary text-shadow-soft animate-pop" key={`l-${item.id}`}>
            {item.label}
          </div>
          {item.subLabel && (
            <div className="text-xl font-bold text-muted-foreground">{item.subLabel}</div>
          )}
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground font-bold shadow-soft">
            <Volume2 className="h-5 w-5" />
            <span>Dinle</span>
          </div>
        </button>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={prev}
            className="flex items-center justify-center gap-2 rounded-2xl bg-card border-2 border-border/60 p-4 font-bold text-foreground shadow-soft transition-bouncy hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" /> Önceki
          </button>
          <button
            onClick={next}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary p-4 font-bold text-primary-foreground shadow-soft transition-bouncy hover:scale-105 active:scale-95"
          >
            Sonraki <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Topic;
