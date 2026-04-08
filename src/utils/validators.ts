export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function isPositiveAmount(v: unknown): v is number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
}
