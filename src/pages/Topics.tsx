import { PageHeader } from "@/components/PageHeader";
import { NavCard } from "@/components/NavCard";
import { TOPICS } from "@/data/letters";

const colorBg: Record<string, string> = {
  green: "bg-topic-green",
  blue: "bg-topic-blue",
  yellow: "bg-topic-yellow",
  orange: "bg-topic-orange",
  pink: "bg-topic-pink",
  purple: "bg-topic-purple",
};

const Topics = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-xl px-4 pb-16">
        <PageHeader />

        <header className="mb-6 animate-fade-in">
          <h1 className="text-4xl font-extrabold text-foreground">Konular</h1>
          <p className="mt-1 text-muted-foreground">Öğrenmek istediğin konuyu seç</p>
        </header>

        <nav className="space-y-3">
          {TOPICS.map((t) => (
            <NavCard
              key={t.id}
              to={`/quiz/${t.id}`}
              title={t.title}
              description={t.description}
              iconBg={colorBg[t.color]}
              icon={<span className="text-2xl">{t.icon}</span>}
            />
          ))}
        </nav>
      </main>
    </div>
  );
};

export default Topics;
