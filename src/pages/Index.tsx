import { Star, BookOpen, BarChart3, Gamepad2 } from "lucide-react";
import { NavCard } from "@/components/NavCard";
import { FloatingLetters } from "@/components/FloatingLetters";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <FloatingLetters />

      <main className="container relative mx-auto max-w-xl px-4 pb-16 pt-8">
        {/* Diyanet rozeti */}
        <div className="mb-6 flex justify-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-primary shadow-soft">
            <Star className="h-4 w-4 fill-warning text-warning" />
            Diyanet Elifbası
          </div>
        </div>

        {/* Başlık */}
        <div className="mb-6 text-center animate-fade-in">
          <h1 className="mb-2 text-5xl font-extrabold tracking-tight text-foreground">
            Kur'an Elifba
          </h1>
          <p className="text-base text-muted-foreground">Arapça harfleri eğlenerek öğren</p>
        </div>

        {/* Bismillah */}
        <div className="mb-10 flex justify-center animate-scale-in">
          <p className="arabic font-arabic text-6xl font-bold text-primary" dir="rtl">
            بِسْمِ ٱللَّهِ
          </p>
        </div>

        {/* Ana eylem kartları */}
        <nav className="space-y-3">
          <NavCard
            to="/topics"
            title="Konular"
            description="Harfleri öğrenmeye başla"
            iconBg="bg-topic-green"
            icon={<BookOpen className="h-7 w-7" />}
          />
          <NavCard
            to="/progress"
            title="İlerleme"
            description="Gelişimini takip et"
            iconBg="bg-topic-yellow"
            icon={<BarChart3 className="h-7 w-7" />}
          />
          <NavCard
            to="/games"
            title="Oyunlar"
            description="Eğlenerek öğren"
            iconBg="bg-topic-blue"
            icon={<Gamepad2 className="h-7 w-7" />}
          />
        </nav>

        {/* Alt bilgi */}
        <p className="mt-10 text-center text-xs font-medium text-muted-foreground">
          29 Harf • 6 Konu • 5 Oyun • Sınırsız Pratik
        </p>
      </main>
    </div>
  );
};

export default Index;
