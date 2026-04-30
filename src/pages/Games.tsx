import { PageHeader } from "@/components/PageHeader";
import { NavCard } from "@/components/NavCard";
import { GAMES } from "@/data/letters";

const colorBg: Record<string, string> = {
  green: "bg-topic-green",
  blue: "bg-topic-blue",
  yellow: "bg-topic-yellow",
  orange: "bg-topic-orange",
  pink: "bg-topic-pink",
  purple: "bg-topic-purple",
};

const Games = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-xl px-4 pb-16">
        <PageHeader />

        <header className="mb-6 animate-fade-in">
          <h1 className="text-4xl font-extrabold text-foreground">Oyunlar</h1>
          <p className="mt-1 text-muted-foreground">Eğlenerek Arapça öğren!</p>
        </header>

        <nav className="space-y-3">
          {GAMES.map((g) => (
            <NavCard
              key={g.id}
              to={`/games/${g.id}`}
              title={g.title}
              description={g.description}
              iconBg={colorBg[g.color]}
              icon={<span className="text-2xl">{g.icon}</span>}
            />
          ))}
        </nav>
      </main>
    </div>
  );
};

export default Games;
