// Mini Akıl - Ortak içerik tipleri ve veri katmanı
// Tüm konular aynı şemayı paylaşır: konu listesi -> item listesi
// Sesler ElevenLabs ile build-time üretilir, public/audio/{tr,en}/<sha1>.mp3 olarak saklanır

export type Lang = "tr" | "en";

// Tek bir öğrenme öğesi (harf, sayı, kelime, hayvan, şekil...)
export interface ContentItem {
  id: string;
  // Görsel etiket (ekranda gösterilen)
  label: string;
  // İkincil etiket (örn. ingilizcede türkçesi: "cat" -> "kedi")
  subLabel?: string;
  // Telaffuz edilecek metin (label'dan farklı olabilir; örn. "B" -> "be")
  speech: string;
  // Hangi dilde konuşulacak (TTS sesi)
  lang: Lang;
  // Gösterimde kullanılacak emoji veya görsel
  emoji?: string;
  image?: string;
  // Soru üretimi için sayısal değer (matematik için)
  value?: number;
  // Renk anahtarı (rengler için: "red" | "blue" | "yellow" | ...)
  colorKey?: string;
}

// Konu / kategori (örn. "Türkçe > Harfler")
export interface ContentTopic {
  id: string;
  parent: SubjectId;
  title: string;
  description: string;
  emoji: string;
  items: ContentItem[];
  // SRS alıştırma türü: 'visual-to-speech' (kart -> ses), 'speech-to-visual' (ses -> seç)
  practiceMode?: "visual" | "audio" | "math";
}

export type SubjectId = "turkce" | "ingilizce" | "matematik" | "doga";

export interface Subject {
  id: SubjectId;
  title: string;
  emoji: string;
  description: string;
  bgVar: string; // tailwind class for background
  topics: ContentTopic[];
}
