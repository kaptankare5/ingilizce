import { flattenItems } from "@/data/subjects";
import type { ContentItem } from "@/data/types";

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// Görsel-olarak oyunda kullanılabilecek itemlar (kısa label + emoji)
export function gamePool(): ContentItem[] {
  return flattenItems().filter(
    (it) =>
      it.emoji &&
      it.label.length <= 12 &&
      !it.id.startsWith("top-") &&
      !it.id.startsWith("cik-") &&
      !it.id.startsWith("karsi-")
  );
}

export function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}
