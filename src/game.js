export const numbers = Array.from({ length: 75 }, (_, i) => i + 1);
export const letterFor = n => 'BINGO'[Math.floor((n - 1) / 15)];
export function loadDraws(storage) {
  try {
    const value = JSON.parse(storage.getItem('bingo-stage-v1') || '[]');
    return Array.isArray(value) && value.length <= 75 && new Set(value).size === value.length && value.every(n => Number.isInteger(n) && n >= 1 && n <= 75) ? value : [];
  } catch { return []; }
}
export function nextNumber(called, random = Math.random) {
  const remaining = numbers.filter(n => !called.includes(n));
  return remaining.length ? remaining[Math.floor(random() * remaining.length)] : null;
}

export function loadWinners(storage) {
  const fallback = { count: 0, limit: 10 };
  try {
    const value = JSON.parse(storage.getItem('bingo-winners-v1'));
    return value && Number.isInteger(value.limit) && value.limit >= 1 && value.limit <= 9999 && Number.isInteger(value.count) && value.count >= 0 && value.count <= value.limit ? { count: value.count, limit: value.limit } : fallback;
  } catch { return fallback; }
}
