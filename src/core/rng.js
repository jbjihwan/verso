// 시드 기반 PRNG. 상태는 { s: uint32 } 순수 데이터라 런 저장에 그대로 들어간다.
// 게임플레이 난수는 전부 여기서 뽑는다 — 새로고침으로 결과를 다시 뽑을 수 없게 하기 위해서다.

// xmur3 계열 문자열 해시 → uint32
export function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function makeRng(seed) {
  return { s: (typeof seed === 'number' ? seed : hashSeed(String(seed))) >>> 0 };
}

// mulberry32
export function next(r) {
  let t = (r.s = (r.s + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function int(r, lo, hi) {
  return lo + Math.floor(next(r) * (hi - lo + 1));
}

export function pick(r, arr) {
  return arr.length ? arr[Math.floor(next(r) * arr.length)] : undefined;
}

export function shuffle(r, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next(r) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 중복 없이 n 개
export function sample(r, arr, n) {
  return shuffle(r, arr.slice()).slice(0, n);
}

export function chance(r, p) {
  return next(r) < p;
}

// pairs: [[item, weight], ...]
export function weighted(r, pairs) {
  const total = pairs.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (total <= 0) return pairs[0]?.[0];
  let x = next(r) * total;
  for (const [item, w] of pairs) {
    if (w <= 0) continue;
    x -= w;
    if (x < 0) return item;
  }
  return pairs[pairs.length - 1][0];
}

export const STREAMS = ['map', 'reward', 'combat', 'event', 'shop', 'misc'];

// 용도별 독립 스트림: 상점을 열어 봤다고 전투 셔플이 달라지면 안 된다.
export function streams(seed) {
  const o = {};
  for (const name of STREAMS) o[name] = makeRng(hashSeed(`${seed}:${name}`));
  return o;
}
