import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";

// =============================================================
// Triple Match — Meslekler (English)
// Kutudan kutulara: bir item'a tıkla, alttaki 7 slotluk tepsiye düşsün.
// 3 aynı item bir araya gelirse patlar, ingilizce sesi söylenir.
// 7 slot dolar 3'lü olmazsa kaybedilir; tüm itemlar temizlenirse kazanılır.
// =============================================================

type Profession = { key: string; emoji: string; word: string };

const PROFESSIONS: Profession[] = [
  { key: "doctor",    emoji: "👨‍⚕️", word: "Doctor" },
  { key: "nurse",     emoji: "👩‍⚕️", word: "Nurse" },
  { key: "police",    emoji: "👮",   word: "Police" },
  { key: "teacher",   emoji: "🧑‍🏫", word: "Teacher" },
  { key: "chef",      emoji: "🧑‍🍳", word: "Chef" },
  { key: "firefighter", emoji: "🧑‍🚒", word: "Firefighter" },
  { key: "farmer",    emoji: "🧑‍🌾", word: "Farmer" },
  { key: "astronaut", emoji: "🧑‍🚀", word: "Astronaut" },
  { key: "pilot",     emoji: "🧑‍✈️", word: "Pilot" },
  { key: "artist",    emoji: "🧑‍🎨", word: "Artist" },
];

const TRAY_SIZE = 7;

type BoxItem = {
  id: number;
  prof: Profession;
  x: number; // 0..100 percent
  y: number; // 0..100 percent
  rot: number;
};

let _uid = 0;
const nid = () => ++_uid;

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find(v => /en-GB/i.test(v.lang)) ||
    voices.find(v => /^en[-_]/i.test(v.lang)) ||
    voices.find(v => /english/i.test(v.name)) ||
    null
  );
}

function doSpeak(word: string) {
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-GB";
  u.rate = 0.92;
  u.pitch = 1;
  const v = pickEnglishVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

function speakEnglish(word: string) {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    // Warm-up: bazı tarayıcılarda ilk speak sessiz başlar; küçük bir gecikme ile garantile.
    if (!pickEnglishVoice()) {
      // Voices henüz hazır değil → yüklenince çal
      const handler = () => {
        synth.removeEventListener("voiceschanged", handler);
        doSpeak(word);
      };
      synth.addEventListener("voiceschanged", handler);
      // Yine de tetikleyelim ki getVoices() doldursun
      synth.getVoices();
      // Emniyet: 400ms sonra hâlâ konuşmadıysa default ile çal
      setTimeout(() => {
        if (!synth.speaking && !synth.pending) doSpeak(word);
      }, 400);
      return;
    }
    doSpeak(word);
  } catch { /* ignore */ }
}

function buildBoard(): BoxItem[] {
  // Pick 4-5 distinct professions, each spawn count multiple of 3.
  const pool = [...PROFESSIONS].sort(() => Math.random() - 0.5).slice(0, 5);
  const items: BoxItem[] = [];
  pool.forEach((p) => {
    const triples = 1 + Math.floor(Math.random() * 3); // 1..3 triples each => 3,6,9
    const count = triples * 3;
    for (let i = 0; i < count; i++) {
      items.push({
        id: nid(),
        prof: p,
        x: 8 + Math.random() * 84,
        y: 8 + Math.random() * 84,
        rot: -15 + Math.random() * 30,
      });
    }
  });
  return items.sort(() => Math.random() - 0.5);
}

const TripleMatchGame = () => {
  const [box, setBox] = useState<BoxItem[]>(() => buildBoard());
  const [tray, setTray] = useState<(BoxItem | null)[]>(() => Array(TRAY_SIZE).fill(null));
  const [floatText, setFloatText] = useState<string | null>(null);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [matches, setMatches] = useState(0);

  // Preload voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const h = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener?.("voiceschanged", h);
      return () => window.speechSynthesis.removeEventListener?.("voiceschanged", h);
    }
  }, []);

  const unlockedRef = useRef(false);
  const unlockSpeech = () => {
    if (unlockedRef.current) return;
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0; u.lang = "en-GB";
      window.speechSynthesis.speak(u);
      unlockedRef.current = true;
    } catch { /* ignore */ }
  };

  const reset = () => {
    setBox(buildBoard());
    setTray(Array(TRAY_SIZE).fill(null));
    setStatus("playing");
    setMatches(0);
    setFloatText(null);
  };

  const tap = (item: BoxItem) => {
    if (status !== "playing") return;
    const slotIdx = tray.findIndex((s) => s === null);
    if (slotIdx === -1) return;

    const newTray = [...tray];
    newTray[slotIdx] = item;
    const newBox = box.filter((b) => b.id !== item.id);

    // Check 3-of-a-kind in tray
    const counts: Record<string, BoxItem[]> = {};
    newTray.forEach((s) => { if (s) (counts[s.prof.key] = counts[s.prof.key] || []).push(s); });
    const matchedKey = Object.keys(counts).find((k) => counts[k].length >= 3);

    if (matchedKey) {
      const prof = counts[matchedKey][0].prof;
      // remove 3 matched (the first three)
      let removed = 0;
      const cleared = newTray.map((s) => {
        if (s && s.prof.key === matchedKey && removed < 3) { removed++; return null; }
        return s;
      });
      // compact tray to the left
      const compact: (BoxItem | null)[] = cleared.filter((s) => s !== null) as BoxItem[];
      while (compact.length < TRAY_SIZE) compact.push(null);

      setTray(compact);
      setBox(newBox);
      setMatches((m) => m + 1);
      setFloatText(prof.word);
      speakEnglish(prof.word);
      setTimeout(() => setFloatText(null), 1200);

      if (newBox.length === 0 && compact.every((s) => s === null)) {
        setTimeout(() => setStatus("won"), 400);
      }
      return;
    }

    setTray(newTray);
    setBox(newBox);

    // Check loss: tray full and no triple possible
    if (newTray.every((s) => s !== null)) {
      setTimeout(() => setStatus("lost"), 300);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-topic-blue/20 to-background">
      <main className="container mx-auto max-w-xl px-4 pb-8">
        <PageHeader title="🧩 Triple Match" backTo="/oyunlar" centered onReset={reset} />

        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-card p-2 shadow-soft border-2 border-primary/30">
            <div className="text-[10px] font-bold text-muted-foreground">Matches</div>
            <div className="text-xl font-extrabold text-primary">{matches}</div>
          </div>
          <div className="rounded-xl bg-card p-2 shadow-soft border-2 border-warning/30">
            <div className="text-[10px] font-bold text-muted-foreground">Left</div>
            <div className="text-xl font-extrabold text-warning">{box.length}</div>
          </div>
          <div className="rounded-xl bg-card p-2 shadow-soft border-2 border-success/30">
            <div className="text-[10px] font-bold text-muted-foreground">Tray</div>
            <div className="text-xl font-extrabold text-success">{tray.filter(Boolean).length}/{TRAY_SIZE}</div>
          </div>
        </div>

        <p className="text-center text-sm font-bold text-muted-foreground mb-2">
          Tap items — collect 3 of a kind to learn the profession!
        </p>

        {/* Play box */}
        <div className="relative w-full aspect-square rounded-3xl bg-gradient-to-br from-topic-blue/30 to-primary/10 border-8 border-topic-blue/60 shadow-card overflow-hidden">
          {box.map((it) => (
            <button
              key={it.id}
              onClick={() => tap(it)}
              className="absolute text-4xl sm:text-5xl active:scale-90 transition-bouncy hover:scale-110 animate-bounce-in"
              style={{
                left: `${it.x}%`,
                top: `${it.y}%`,
                transform: `translate(-50%, -50%) rotate(${it.rot}deg)`,
              }}
            >
              {it.prof.emoji}
            </button>
          ))}

          {floatText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-success text-success-foreground text-3xl font-extrabold px-6 py-3 rounded-2xl shadow-elegant animate-pop">
                {floatText} ✨
              </div>
            </div>
          )}

          {status !== "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur gap-4">
              <div className="text-6xl">{status === "won" ? "🎉" : "💔"}</div>
              <div className="text-3xl font-extrabold text-foreground">
                {status === "won" ? "You Win!" : "Game Over"}
              </div>
              <button
                onClick={reset}
                className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-extrabold shadow-soft active:scale-95"
              >
                Tekrar Oyna
              </button>
            </div>
          )}
        </div>

        {/* Tray */}
        <div className="mt-4 rounded-2xl bg-card border-4 border-primary/40 p-2 shadow-card">
          <div className="grid grid-cols-7 gap-1.5">
            {tray.map((slot, i) => (
              <div
                key={i}
                className={cn(
                  "aspect-square rounded-xl border-2 flex items-center justify-center text-3xl",
                  slot ? "bg-primary-soft border-primary animate-pop" : "bg-muted/40 border-dashed border-muted-foreground/30"
                )}
              >
                {slot?.prof.emoji}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TripleMatchGame;
