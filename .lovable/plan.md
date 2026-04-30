## Hedef

Mevcut Arapça elifba uygulamasını **4-5 yaş Türkiye anaokulu çocukları** için kapsamlı, MEB Okul Öncesi Eğitim Programı (36-72 ay) ile uyumlu çoklu konulu bir öğrenme uygulamasına dönüştürmek.

## Kapsanacak konular (MEB temelli)

MEB okul öncesi programı 5 gelişim alanını kapsar (Bilişsel, Dil, Motor, Sosyal-Duygusal, Öz Bakım). 4-5 yaş için somut konulara çeviriyoruz:

**1. Türkçe (Dil + Erken Okuryazarlık)**
- 29 harf tanıma (sesli/sessiz)
- Harfin sesi: A → "a", B → "be"
- Basit heceler (ba, be, bi…)
- Kelime → ilk ses eşleştirme (Armut → A)
- TR sesi (ElevenLabs Türkçe ses)

**2. İngilizce**
- Alphabet (A–Z) – İngiliz aksanı (EN-GB ses)
- Renkler (red, blue, green…)
- Sayılar (one–ten)
- Hayvanlar (cat, dog, cow…)
- Aile (mother, father…)

**3. Matematik (MEB Bilişsel alan)**
- Sayılar 1–20 (tanıma + sayma)
- Şekiller (daire, kare, üçgen, dikdörtgen, yıldız, kalp)
- Miktar karşılaştırma (az/çok, büyük/küçük)
- Basit toplama (nesne ekleme: 🍎🍎 + 🍎 = 3) – MEB 4-5 yaşta soyut aritmetik yok, somut nesnelerle
- Basit çıkarma (nesne çıkarma)
- Örüntü (pattern: kırmızı-mavi-kırmızı-?)

**4. Hayat Bilgisi / Doğa**
- Hayvanlar (görsel + ses)
- Renkler (görsel)
- Meslekler (doktor, itfaiyeci…)
- Mevsimler ve hava
- Beden (organ tanıma)
- Yiyecekler (meyve/sebze)

## Sayfa yapısı

```
/                    → Ana sayfa (4 büyük renkli kart + maskot)
/turkce              → Türkçe konu listesi
/turkce/harfler      → Harf öğrenme (mevcut elifba mantığı, latin harflerle)
/turkce/heceler      → Hece kartları
/turkce/ilk-ses      → İlk ses eşleştirme oyunu
/ingilizce           → İngilizce konu listesi
/ingilizce/alphabet  → A-Z kartları
/ingilizce/colors    → Renk kartları
/ingilizce/numbers   → 1-10
/ingilizce/animals   → Hayvanlar
/matematik           → Matematik konu listesi
/matematik/sayilar   → 1-20 sayı kartları
/matematik/sekiller  → Şekiller
/matematik/toplama   → Görsel toplama (nesnelerle)
/matematik/cikarma   → Görsel çıkarma
/matematik/oruntu    → Örüntü oyunu
/dogada              → Hayvan/meslek/mevsim/beden kategorileri
/oyunlar             → Tüm oyunlar
/ilerleme            → Yıldız tabanlı ilerleme
```

## Yeni & yenilenmiş oyunlar (7 oyun)

Mevcut 5 oyun, yeni içeriğe uyarlanır + 2 yeni oyun eklenir:

1. **Hafıza Kartları** – konu seçimi (harf/sayı/hayvan/renk eşleştirme)
2. **Balon Patlatma** – "Doğru harfi/sayıyı/rengi patlat"
3. **Hazine Sandığı** – nesneyi doğru kategoriye yerleştir (sayı sandıkları, renk sandıkları)
4. **Bilgi Yarışı** – süre yarışı, çoktan seçmeli (tüm konular)
5. **Harf Patlatma → Renk/Şekil Patlatma** – match-3 mantığı
6. **🆕 Koşu Oyunu (Runner)** – Maskot karakter koşar, doğru cevap kapısından geçer (örn. "5+2=?" → 7 kapısı). Subway Surfers benzeri ama eğitici. Canvas/CSS animasyonlu.
7. **🆕 Balık Tutma** – Olta atılır, doğru cevabı taşıyan balık tutulur (sayı, harf, renk konuları)

## Ses sistemi

- **Mevcut** `public/audio/<sha1>.mp3` cache yöntemi korunur
- ElevenLabs ile **build-time** ses üretimi:
  - Türkçe içerik → Türk sesi (örn. ElevenLabs "Sarah" Türkçe veya yerel TR ses)
  - İngilizce içerik → İngiliz sesi (örn. "George"/"Charlie" – British)
  - Matematik & Doğa Türkçe açıklamalar → Türk sesi
- `scripts/gen_audio.mjs` benzeri tek script, tüm metin listesini iki dilde MP3'e dönüştürür
- Çalma fonksiyonu dile göre doğru klasörden çalar (`/audio/tr/...`, `/audio/en/...`)

## Görsel & UX (4-5 yaş, sevimli maskot)

**Tasarım sistemi**
- Pastel canlı paleti: pembe, sarı, turkuaz, mor, çimen yeşili (tümü `index.css`'te HSL token)
- Yuvarlak, kabarık (rounded-3xl, soft shadow) butonlar – minimum 64px dokunma alanı
- Büyük, okunabilir font (Nunito veya Quicksand – chubby sans)
- Animasyonlu geri bildirim: doğru → maskot zıplar + yıldız efekti, yanlış → nazik sallanma

**Maskot karakter**
- AI üretilmiş sevimli rehber karakter (örn. baykuş "Bilgili" veya kedi yavrusu)
- Ana sayfada karşılar, oyunlarda yardım eder, doğru/yanlışta tepki verir
- 4-5 farklı poz (selam, alkış, üzgün, düşünüyor, kutlama)

**Görsel varlıklar**
- Hayvan/meslek/yiyecek vb. için AI üretilmiş çizgi film stili görseller (Nano Banana)
- Şekiller, sayılar için renkli özel ikonlar
- Konu kartlarında büyük emoji + arka plan illüstrasyonu

## Veri yapısı

`src/data/letters.ts` yerine modüler:
```
src/data/
  topics/
    turkce.ts     → harfler, heceler
    ingilizce.ts  → alphabet, colors, numbers, animals
    matematik.ts  → sayilar, sekiller, toplama soruları
    doga.ts       → hayvanlar, meslekler, mevsimler
  audio-manifest.ts
  srs.ts          → korunur (ilerleme takibi)
```

Her item şeması:
```ts
{ id, label, labelLang: 'tr'|'en', emoji?, image?, audioKey, category }
```

## Teknik detaylar

- React + Vite + TS + Tailwind (mevcut stack korunur)
- Yeni paketler: yok (Canvas için native, animasyon için mevcut Tailwind)
- Maskot ve içerik görselleri: `imagegen` (Nano Banana) ile üretilir, `src/assets/`'a kaydedilir
- ElevenLabs API zaten bağlı (`ELEVENLABS_API_KEY`) – ses üretim scripti güncellenir
- Mevcut shadcn/ui, react-router, react-query stack kullanılır
- Mevcut ilerleme/SRS sistemi (`src/data/srs.ts`, `progress.ts`) tüm konulara genelleştirilir

## Uygulama adımları

1. **Tasarım sistemi yenile**: `index.css` + `tailwind.config.ts` – çocuk dostu pastel renkler, Nunito font, animasyonlar
2. **Maskot üret**: AI ile 5 pozlu rehber karakter (baykuş)
3. **Veri katmanı kur**: `src/data/topics/` altında 4 konu modülü
4. **Görseller üret**: hayvanlar, meslekler, şekiller, sayılar (AI batch)
5. **Ses üretimi**: TR + EN için tüm içerik metinlerini ElevenLabs ile MP3'e çevir, `public/audio/{tr,en}/` altına yaz
6. **Ana sayfa**: 4 büyük konu kartı (Türkçe/İngilizce/Matematik/Doğa) + Oyunlar + İlerleme + maskot
7. **Konu sayfaları**: her konu için liste + detay sayfaları (mevcut Topics/Quiz pattern'i genişletilir)
8. **Oyunları uyarla**: 5 mevcut oyun çoklu konu desteği alır
9. **Yeni 2 oyun**: Koşu oyunu (Runner) + Balık tutma
10. **İlerleme sayfası**: konu bazında yıldız/rozet sistemi
11. **NotFound + 404 + responsive QA**

## Kapsam dışı (şimdilik yapılmayacak)

- Kullanıcı hesabı/giriş (lokal storage'da kalır, mevcut yapı)
- Çevrimdışı PWA
- Çoklu kullanıcı / ebeveyn paneli
- Eski Arapça içerik (tamamen kaldırılır – kullanıcı onayladı)
- 1. sınıf düzeyi soyut aritmetik (4-5 yaş kapsamı dışı)

## Sonuç

Bu plan onaylanırsa, mevcut güçlü elifba mimarisini (cache'li ses, SRS, oyun yapısı) korur ama içeriği MEB okul öncesi programıyla uyumlu **Türkçe + İngilizce + Matematik + Doğa** kapsamına genişletir, yepyeni çocuk dostu UI ve maskot ile sarar, 2 yeni oyun ekler. Build sırasında üretilen TR/EN sesler kullanıcı kredisi harcamaz.