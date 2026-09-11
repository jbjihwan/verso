// 적 행동 결정 도우미. 적 정의의 ai(e, rng, cs, run) 가 이것들을 조합한다.
import { weighted } from './rng.js';

// move 를 연속 times 번 이상 썼는가
export function repeated(e, move, times) {
  const h = e.hist;
  if (times <= 0 || h.length < times) return false;
  for (let i = 1; i <= times; i++) if (h[h.length - i] !== move) return false;
  return true;
}

// 가중치 무작위. max: 숫자(모든 행동 공통) 또는 { move: 최대 연속 횟수 }
export function choose(e, rng, pairs, { max = 2 } = {}) {
  const limit = (m) => (typeof max === 'number' ? max : (max[m] ?? 99));
  const ok = pairs.filter(([m, w]) => w > 0 && !repeated(e, m, limit(m)));
  return weighted(rng, ok.length ? ok : pairs);
}

// 정해진 순서를 반복
export function cycle(e, seq, key = 'ci') {
  const i = (e.mem[key] ?? -1) + 1;
  e.mem[key] = i;
  return seq[i % seq.length];
}

// 첫 행동은 고정, 이후 다른 규칙
export function first(e, move, rest) {
  return e.hist.length === 0 && !e.mem.started ? ((e.mem.started = true), move) : rest();
}

export function moveDmg(m, e, cs) {
  return typeof m.dmg === 'function' ? m.dmg(e, cs) : (m.dmg ?? 0);
}

export function moveTimes(m, e, cs) {
  return typeof m.times === 'function' ? m.times(e, cs) : (m.times ?? 1);
}
