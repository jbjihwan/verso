// 막 맵 생성(스펙 8). 6열 × 8행 격자에 아래→위 경로 4개, 기존 간선과 교차 금지.
// 0행 전투 · 3행 보물 · 7행 성소 고정, 나머지는 가중치. 정예·성소·상점은 같은 경로에서 연달아 나오지 않는다.
import { int, weighted } from './rng.js';

export const COLS = 6;
export const ROWS = 8;
const PATHS = 4;
const WEIGHTS = { combat: 45, event: 22, elite: 12, rest: 12, shop: 9 };
const SPECIAL = new Set(['elite', 'rest', 'shop']);

function allowed(type, r) {
  if (type === 'elite' || type === 'shop') return r >= 2;
  if (type === 'rest') return r === 4 || r === 5;
  return true;
}

export function generateMap(rng, act) {
  const edges = [];           // [row, fromCol, toCol]
  const cells = new Set();    // "r:c"

  const crosses = (r, a, b) => edges.some(([er, c, d]) => er === r && ((c < a && d > b) || (c > a && d < b)));

  let firstStart = -1;
  for (let p = 0; p < PATHS; p++) {
    let col = int(rng, 0, COLS - 1);
    if (p === 1) while (col === firstStart) col = int(rng, 0, COLS - 1);
    if (p === 0) firstStart = col;
    cells.add(`0:${col}`);
    for (let r = 0; r < ROWS - 1; r++) {
      const opts = [col - 1, col, col + 1].filter((x) => x >= 0 && x < COLS && !crosses(r, col, x));
      const next = opts.length ? opts[int(rng, 0, opts.length - 1)] : col;
      if (!edges.some(([er, c, d]) => er === r && c === col && d === next)) edges.push([r, col, next]);
      cells.add(`${r + 1}:${next}`);
      col = next;
    }
  }

  const nodes = {};
  const id = (r, c) => `${r}-${c}`;
  for (const key of cells) {
    const [r, c] = key.split(':').map(Number);
    nodes[id(r, c)] = { id: id(r, c), r, c, type: null, next: [], prev: [] };
  }
  for (const [r, a, b] of edges) {
    const from = nodes[id(r, a)];
    const to = nodes[id(r + 1, b)];
    if (!from.next.includes(to.id)) from.next.push(to.id);
    if (!to.prev.includes(from.id)) to.prev.push(from.id);
  }

  const ordered = Object.values(nodes).sort((x, y) => x.r - y.r || x.c - y.c);
  for (const n of ordered) {
    if (n.r === 0) { n.type = 'combat'; continue; }
    if (n.r === 3) { n.type = 'treasure'; continue; }
    if (n.r === ROWS - 1) { n.type = 'rest'; continue; }
    const parents = n.prev.map((pid) => nodes[pid].type);
    const pairs = Object.entries(WEIGHTS)
      .filter(([type]) => allowed(type, n.r) && !(SPECIAL.has(type) && parents.includes(type)));
    n.type = weighted(rng, pairs);
  }
  // 3행 보물 바로 앞(2행)이나 7행 성소 바로 앞(6행)에 같은 종류가 붙는 것은 규칙상 이미 막혀 있다.

  const boss = { id: 'boss', r: ROWS, c: (COLS - 1) / 2, type: 'boss', next: [], prev: [] };
  for (const n of ordered) {
    if (n.r === ROWS - 1) { n.next.push('boss'); boss.prev.push(n.id); }
  }
  nodes.boss = boss;

  return {
    act,
    nodes,
    start: ordered.filter((n) => n.r === 0).map((n) => n.id),
  };
}
