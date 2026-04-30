// Tüm sesler önceden ElevenLabs ile üretildi → public/audio/<sha1>.mp3
// Hiçbir kullanıcı kredi harcamaz. Static MP3'leri direkt çalar.
import { HAREKES, type ArabicLetter } from "@/data/letters";

// Letters.ts'deki harf id → uzun Arapça ismi (temel harfler topiği için)
const LONG_NAMES: Record<string, string> = {
  elif:"أَلِف", be:"بَاء", te:"تَاء", se:"ثَاء", cim:"جِيم", ha:"حَاء", hi:"خَاء",
  dal:"دَال", zel:"ذَال", ra:"رَاء", ze:"زَاي", sin:"سِين", sin2:"شِين",
  sad:"صَاد", dad:"ضَاد", ti:"طَاء", zi:"ظَاء", ayin:"عَيْن", gayin:"غَيْن",
  fe:"فَاء", kaf:"قَاف", kef:"كَاف", lam:"لاَم", mim:"مِيم", nun:"نُون",
  vav:"وَاو", he:"هَاء", ye:"يَاء", lamelif:"لاَم أَلِف",
};

// SHA-1 ilk 16 karakteri — gen_audio.mjs ile birebir aynı algoritma
async function hashKey(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

let currentAudio: HTMLAudioElement | null = null;

function stopCurrent() {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
      currentAudio = null;
    }
  } catch {
    /* ignore */
  }
}

async function playArabicText(text: string) {
  stopCurrent();
  const key = await hashKey(text);
  const url = `/audio/${key}.mp3`;
  try {
    const audio = new Audio(url);
    audio.preload = "auto";
    currentAudio = audio;
    await audio.play();
  } catch (e) {
    console.warn("audio play failed for", text, e);
  }
}

// Temel harf okunuşu — uzun Arapça ismi (elif, bâ, cîm…)
export async function playLetter(letter: ArabicLetter, harekeId: keyof typeof HAREKES | null = null) {
  if (harekeId === null) {
    // Sade harf → uzun ismini oku (temel harfler için)
    const longName = LONG_NAMES[letter.id] ?? letter.letter;
    await playArabicText(longName);
    return;
  }
  // Cezim/sukun: tek başına okunamaz → "أَ" + harf + sukun = "en", "eb", "ec" gibi tecvitli
  if (harekeId === "cezim" && letter.id !== "elif") {
    await playArabicText("أَ" + letter.letter + HAREKES.cezim.mark);
    return;
  }
  const arabic = letter.letter + HAREKES[harekeId].mark;
  await playArabicText(arabic);
}

// Bağlanma şekli (başta/orta/sonda) — fethalı okunur
export async function playLetterShape(
  letter: ArabicLetter,
  shape: "isolated" | "initial" | "medial" | "final",
) {
  const arabic = letter[shape] + HAREKES.fetha.mark;
  await playArabicText(arabic);
}

// Med okunuşu
export async function playLetterWithMed(letter: ArabicLetter, med: "elif" | "vav" | "ye") {
  const medChar = med === "elif" ? "ا" : med === "vav" ? "و" : "ي";
  const harekeMark =
    med === "vav" ? HAREKES.otre.mark : med === "ye" ? HAREKES.esre.mark : HAREKES.fetha.mark;
  await playArabicText(letter.letter + harekeMark + medChar);
}

// Doğrudan Arapça metin
export async function playRawArabic(arabicText: string, _fallbackTr?: string) {
  await playArabicText(arabicText);
}

// Eski IndexedDB cache'ini temizle (geriye dönük uyumluluk)
export async function clearAudioCache() {
  try {
    indexedDB.deleteDatabase("elifba-audio");
  } catch {
    /* ignore */
  }
}
