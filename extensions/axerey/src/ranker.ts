import type { Memory } from "./memory.js";

export function cosine(a: number[], b: number[]) {
  const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return na && nb ? dot / (na * nb) : 0;
}

export function rankResults(items: Memory[], qVec: number[]) {
  const now = Date.now();
  return items
    .map(m => {
      const sim = cosine(m.embedding, qVec);
      const ageDays = (now - m.createdAt) / (1000 * 60 * 60 * 24);
      const recency = Math.exp(-ageDays / 30); // half-life ~20.8 days
      const importance = m.importance; // 0..1
      const usageBoost = Math.min(m.usage / 10, 0.2);
      const pinBoost = m.pinned ? 0.3 : 0;
      const score = 0.6 * sim + 0.2 * recency + 0.15 * importance + 0.05 * usageBoost + pinBoost;
      return { ...m, _score: score } as any;
    })
    .sort((a, b) => b._score - a._score);
}
