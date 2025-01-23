// src/utils/vectorUtils.ts

// ベクトルの和
export function sumVectors(a: number[], b: number[]): number[] {
  return a.map((val, idx) => val + b[idx]);
}

// コサイン類似度
export function calculateCosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (normA === 0 || normB === 0) {
    // ゼロベクトルが絡む場合
    return 0;
  }
  return dot / (normA * normB);
}
