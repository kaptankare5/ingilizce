## Düzeltmeler

Üç ana sorun var, hepsini onarıyorum:

### 1. Türkçe ses → İstanbul aksanlı erkek ses

`scripts/gen_audio.mjs` içindeki `VOICE_TR` şu an Sarah (kadın). Onu **Liam (`TX3LPaxmHKxFdv7VOQHJ`)** ile değiştireceğim — multilingual v2 modeli ile İstanbul Türkçesi telaffuzu net çıkıyor, doğal erkek ses. Voice settings'i de Türkçe için optimize edeceğim (stability 0.6, style 0.25 — daha doğal/oturaklı).

Ardından mevcut tüm `public/audio/tr/*.mp3` dosyalarını silip script'i yeniden çalıştıracağım. EN sesleri (George - British male) zaten doğru, dokunmuyorum.

### 2. SRS / Seviye sistemi geri geliyor

`src/data/srs.ts` aslında dosyada duruyor ama yeni `Topic.tsx` onu kullanmıyor — sadece linear ileri/geri kart. Eski sistemi geri getireceğim:

- **Quiz modu** Topic sayfasına geri eklenecek: kart göster + alt kısımda 4 şıklı çoktan seçmeli soru (eski Quiz.tsx mantığı)
- `pickNextLetter("quiz", topicId, itemIds)` ile bir sonraki item seçilecek
- Doğru cevapta `recordSrsAnswer(..., true)` → seviye yukarı; yanlışta seviye aşağı
- Üstte küçük seviye barı: L1/L2/L3/L4 dağılımı görünecek (eski Progress.tsx özetinin küçük hali)
- "Serbest gez" modu (mevcut linear kart) opsiyonel kalacak ama varsayılan **Pratik (SRS)** modu olacak

Görseller (büyük emoji, label, dinle butonu) korunacak — sadece üstüne quiz mantığı bindirilecek.

### 3. Eski oyunları geri getir + Subway Surfers benzeri Runner

Şu an `Game.tsx` 5 modu (memory/balloon/race/fish/quiz) tek dosyada güdük şekilde sunuyor. Eski ayrı oyun dosyaları silinmiş. Geri getireceklerim:

- **MemoryGame** — kart eşleştirme (item ↔ emoji veya item ↔ ses)
- **BalloonGame** — doğru sesi söyleyen balonu patlat
- **TreasureGame** — doğru kategoriye sürükle-bırak (sayı sandığı, harf sandığı, renk sandığı)
- **QuizGame** — 60 saniye hızlı çoktan seçmeli, skor

Yeni eklenecek:

- **RunnerGame (Subway Surfers tarzı)** — 3 şeritli sonsuz koşu. Üstte soru ("5 + 2 = ?" veya "Hangisi A?"). Her şeritte bir cevap kapısı geliyor; oyuncu sol/sağ ok (veya dokunmatik swipe) ile doğru kapıdan geçer. Yanlış kapıda can kaybı, doğruda +10 puan + maskot zıplar. Canvas yerine CSS transform + requestAnimationFrame ile (hafif). Mobil için sol/sağ tap zone'lar.

Yeni `Games.tsx` listesi: Memory, Balloon, Treasure, Runner, Quiz (5 oyun, runner yeni).

### Teknik notlar

- `gen_audio.mjs` çalıştırılacak (ELEVENLABS_API_KEY mevcut). Yaklaşık 130 TR ses yeniden üretilecek (~3 dakika).
- Eski `src/pages/games/` klasörü yeniden oluşturulacak, ayrı dosyalar; `Game.tsx` router olarak alt component'leri seçecek.
- SRS namespace'leri: `quiz` (Topic pratiği için), `games` (oyunlar için) — eski yapı.
- `MathPractice` matematik konuları için kalmaya devam edecek (toplama/çıkarma görsel).
- Tüm itemlar `ContentItem` tipinde, oyunlar konu seçici ile çalışacak (üstte konu dropdown veya başlangıç ekranı).

### Kapsam dışı

- UI tasarım sistemi / pastel renkler / maskot — bunlar dokunulmayacak, kullanıcı şikayet etmedi.
- Doğa/İngilizce/Matematik içerik — duruyor, dokunulmayacak.
