import { Link } from "react-router-dom";
import { SUBJECTS } from "@/data/subjects";
import { Sparkles, Gamepad2 } from "lucide-react";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-secondary/40 via-background to-primary-soft/40">
      {/* Floating clouds */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
        <div className="absolute top-10 left-6 text-5xl animate-float">☁️</div>
        <div className="absolute top-32 right-10 text-4xl animate-float" style={{ animationDelay: "1s" }}>⭐</div>
        <div className="absolute bottom-40 left-12 text-4xl animate-float" style={{ animationDelay: "2s" }}>🌈</div>
        <div className="absolute bottom-60 right-8 text-5xl animate-float" style={{ animationDelay: "0.5s" }}>🎈</div>
      </div>

      <main className="container relative mx-auto max-w-2xl px-4 pb-16 pt-8">
        <div className="mb-4 flex justify-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-2 text-sm font-bold text-primary shadow-card">
            <Sparkles className="h-4 w-4 text-warning" />
            MEB Anaokulu Programı
          </div>
        </div>

        <div className="mb-6 text-center animate-bounce-in">
          <h1 className="mb-2 text-5xl font-extrabold tracking-tight text-primary text-shadow-soft">
            Mini Akıl
          </h1>
          <p className="text-base font-semibold text-muted-foreground">
            Türkçe • İngilizce • Matematik • Doğa
          </p>
        </div>

        {/* Maskot */}
        <div className="mb-8 flex justify-center">
          <div className="text-8xl animate-float" aria-hidden>🦉</div>
        </div>

        {/* 4 büyük konu kartı */}
        <nav className="grid grid-cols-2 gap-4 mb-6">
          {SUBJECTS.map((s, i) => (
            <Link
              key={s.id}
              to={`/konu/${s.id}`}
              className={`${s.bgVar} group flex flex-col items-center justify-center gap-2 rounded-3xl p-6 text-center text-white shadow-card transition-bouncy hover:-translate-y-1 hover:shadow-elegant min-h-[140px] animate-bounce-in`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="text-5xl mb-1 transition-transform group-hover:scale-110">{s.emoji}</div>
              <h2 className="text-lg font-extrabold text-shadow-soft">{s.title}</h2>
              <p className="text-xs font-medium opacity-90 px-1">{s.description}</p>
            </Link>
          ))}
        </nav>

        <Link
          to="/oyunlar"
          className="flex items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-topic-purple to-pink p-5 text-white shadow-card transition-bouncy hover:-translate-y-1 hover:shadow-elegant"
        >
          <Gamepad2 className="h-7 w-7" />
          <span className="text-xl font-extrabold text-shadow-soft">Oyunlar</span>
          <span className="text-2xl">🎮</span>
        </Link>

        <p className="mt-8 text-center text-xs font-semibold text-muted-foreground">
          4-5 yaş • {SUBJECTS.reduce((acc, s) => acc + s.topics.length, 0)} Konu • Eğlenceli Oyunlar
        </p>
      </main>
    </div>
  );
};

export default Index;
