#!/usr/bin/env node
/**
 * Mini Akıl - Ses üretim scripti
 * Tüm Türkçe ve İngilizce metinler için ElevenLabs ile MP3 üretir.
 * Çıktı: public/audio/{tr,en}/<sha1>.mp3 + public/audio/manifest.json
 *
 * Tekrar çalıştırılabilir: zaten var olan dosyalar atlanır.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AUDIO_DIR = join(ROOT, "public", "audio");
const TR_DIR = join(AUDIO_DIR, "tr");
const EN_DIR = join(AUDIO_DIR, "en");
const MANIFEST = join(AUDIO_DIR, "manifest.json");

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY env eksik");
  process.exit(1);
}

// Sesler:
// TR: Türkçeye uyumlu doğal ses (Sarah - cgSgspJ2msm6clMCkdW9 - Türkçe söyleyebiliyor)
// EN: İngiliz aksanı (Charlie - IKne3meq5aSn9XLyUdCD veya George - JBFqnCBsd6RMkjVDRZzb)
const VOICE_TR = "EXAVITQu4vr4xnSDxMaL"; // Sarah - multilingual
const VOICE_EN = "JBFqnCBsd6RMkjVDRZzb"; // George - British male, clear

const MODEL = "eleven_multilingual_v2";

function hash(text) {
  return createHash("sha1").update(text).digest("hex").slice(0, 16);
}

async function tts(text, voiceId, outPath) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.78,
        style: 0.4,
        use_speaker_boost: true,
        speed: 0.92,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS failed for "${text}" [${res.status}]: ${err}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
}

// === İçerikten metin listesi üret ===
// Veri dosyalarını dinamik import yerine elle parse edip TR + EN listesini çıkarıyoruz.
// Tüm topiclerden item.speech + item.lang topla, ek olarak feedback/UI sesleri ekle.

async function loadAllTexts() {
  // Dinamik import: TS dosyalarını okuyamayacağımız için JSON'a dökelim.
  // Burada manuel olarak metinleri listeliyoruz (data dosyalarıyla aynı).
  const TR = new Set();
  const EN = new Set();

  // === TÜRKÇE HARFLER ===
  const harfler = [
    { letter: "A", name: "a" },{ letter: "B", name: "be" },{ letter: "C", name: "ce" },
    { letter: "Ç", name: "çe" },{ letter: "D", name: "de" },{ letter: "E", name: "e" },
    { letter: "F", name: "fe" },{ letter: "G", name: "ge" },{ letter: "Ğ", name: "yumuşak ge" },
    { letter: "H", name: "he" },{ letter: "I", name: "ı" },{ letter: "İ", name: "i" },
    { letter: "J", name: "je" },{ letter: "K", name: "ke" },{ letter: "L", name: "le" },
    { letter: "M", name: "me" },{ letter: "N", name: "ne" },{ letter: "O", name: "o" },
    { letter: "Ö", name: "ö" },{ letter: "P", name: "pe" },{ letter: "R", name: "re" },
    { letter: "S", name: "se" },{ letter: "Ş", name: "şe" },{ letter: "T", name: "te" },
    { letter: "U", name: "u" },{ letter: "Ü", name: "ü" },{ letter: "V", name: "ve" },
    { letter: "Y", name: "ye" },{ letter: "Z", name: "ze" },
  ];
  const examples = ["Ayı","Balık","Civciv","Çiçek","Davul","Elma","Fil","Gemi","Dağ","Horoz","Işık","İnek","Jeton","Kedi","Limon","Maymun","Nar","Ok","Ördek","Patates","Roket","Salyangoz","Şemsiye","Tavşan","Uçak","Üzüm","Vazo","Yıldız","Zebra"];
  harfler.forEach((h) => TR.add(h.name));
  examples.forEach((e) => TR.add(e));

  // Heceler
  ["ba","be","bi","bo","bu","ka","ke","ki","ko","ku","ma","me","mi","mo","mu",
   "la","le","li","lo","lu","sa","se","si","so","su","ta","te","ti","to","tu"].forEach((h) => TR.add(h));

  // === İNGİLİZCE ===
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((l) => EN.add(l));
  ["one","two","three","four","five","six","seven","eight","nine","ten"].forEach((n) => EN.add(n));
  ["red","blue","yellow","green","orange","purple","pink","black","white","brown"].forEach((c) => EN.add(c));
  ["cat","dog","cow","horse","sheep","rabbit","bird","fish","elephant","lion","monkey","bear"].forEach((a) => EN.add(a));
  ["mother","father","sister","brother","baby","grandma","grandpa"].forEach((f) => EN.add(f));

  // === MATEMATİK (TR) ===
  ["bir","iki","üç","dört","beş","altı","yedi","sekiz","dokuz","on",
   "on bir","on iki","on üç","on dört","on beş","on altı","on yedi","on sekiz","on dokuz","yirmi"]
    .forEach((n) => TR.add(n));
  ["sıfır"].forEach((n) => TR.add(n));
  ["daire","kare","üçgen","dikdörtgen","yıldız","kalp","elmas","altıgen"].forEach((s) => TR.add(s));

  // === DOĞA (TR) ===
  ["kedi","köpek","inek","at","koyun","tavşan","kuş","balık","fil","aslan","maymun","ayı","zürafa","penguen"].forEach((a) => TR.add(a));
  ["doktor","öğretmen","itfaiyeci","aşçı","polis","pilot","çiftçi","astronot"].forEach((m) => TR.add(m));
  ["ilkbahar","yaz","sonbahar","kış","güneş","yağmur","kar","bulut","rüzgar","gökkuşağı"].forEach((m) => TR.add(m));
  ["elma","muz","üzüm","çilek","portakal","karpuz","domates","havuç","ekmek","süt"].forEach((y) => TR.add(y));
  ["göz","burun","kulak","ağız","el","ayak","diş","saç"].forEach((b) => TR.add(b));

  // === GERİ BİLDİRİM SESLERİ (TR) ===
  ["Aferin!","Harika!","Süpersin!","Doğru!","Bir daha dene","Çok güzel!","Bravo!"].forEach((f) => TR.add(f));

  return { TR: [...TR], EN: [...EN] };
}

async function main() {
  // Klasörleri hazırla
  if (existsSync(AUDIO_DIR)) {
    // Eski Arapça mp3'leri temizle (kök dizindeki .mp3'ler)
    for (const f of readdirSync(AUDIO_DIR)) {
      const full = join(AUDIO_DIR, f);
      if (f.endsWith(".mp3")) unlinkSync(full);
    }
  }
  mkdirSync(TR_DIR, { recursive: true });
  mkdirSync(EN_DIR, { recursive: true });

  const { TR, EN } = await loadAllTexts();
  console.log(`TR: ${TR.length} ses, EN: ${EN.length} ses`);

  const manifest = { tr: {}, en: {} };

  let made = 0, skipped = 0;
  async function processList(list, lang, voice, dir) {
    for (const text of list) {
      const key = hash(`${lang}::${text}`);
      manifest[lang][text] = key;
      const out = join(dir, `${key}.mp3`);
      if (existsSync(out)) {
        skipped++;
        continue;
      }
      try {
        process.stdout.write(`[${lang}] ${text}... `);
        await tts(text, voice, out);
        made++;
        console.log("ok");
      } catch (e) {
        console.error("FAIL", e.message);
      }
      // küçük gecikme (rate limit)
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  await processList(TR, "tr", VOICE_TR, TR_DIR);
  await processList(EN, "en", VOICE_EN, EN_DIR);

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\nDone. Made: ${made}, Skipped: ${skipped}, Manifest: ${MANIFEST}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
