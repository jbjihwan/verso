import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMap, ROWS } from '../src/core/map.js';
import { makeRng } from '../src/core/rng.js';

const SEEDS = ['a', 'b', 'c', 'verso', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8'];
const maps = SEEDS.map((s) => generateMap(makeRng(s), 1));
const nodesOf = (m) => Object.values(m.nodes);
const SPECIAL = new Set(['elite', 'rest', 'shop']);

test('고정 행: 0행 전투 · 3행 보물 · 7행 성소', () => {
  for (const m of maps) {
    for (const n of nodesOf(m)) {
      if (n.r === 0) assert.equal(n.type, 'combat');
      if (n.r === 3) assert.equal(n.type, 'treasure');
      if (n.r === ROWS - 1) assert.equal(n.type, 'rest');
    }
  }
});

test('보스는 7행의 모든 노드와 연결된다', () => {
  for (const m of maps) {
    const last = nodesOf(m).filter((n) => n.r === ROWS - 1);
    assert.ok(last.length > 0);
    for (const n of last) assert.deepEqual(n.next, ['boss']);
    assert.equal(m.nodes.boss.prev.length, last.length);
  }
});

test('보스를 뺀 모든 노드는 다음 노드가 있고 시작점에서 도달할 수 있다', () => {
  for (const m of maps) {
    const seen = new Set(m.start);
    const queue = [...m.start];
    while (queue.length) {
      const id = queue.shift();
      for (const nx of m.nodes[id].next) if (!seen.has(nx)) { seen.add(nx); queue.push(nx); }
    }
    for (const n of nodesOf(m)) {
      assert.ok(seen.has(n.id), `${n.id} 도달 불가`);
      if (n.type !== 'boss') assert.ok(n.next.length > 0, `${n.id} 막다른 길`);
    }
  }
});

test('같은 두 행 사이의 간선은 서로 교차하지 않는다', () => {
  for (const m of maps) {
    const edges = [];
    for (const n of nodesOf(m)) {
      if (n.type === 'boss') continue;
      for (const nx of n.next) if (nx !== 'boss') edges.push([n.r, n.c, m.nodes[nx].c]);
    }
    for (const [r1, a, b] of edges) {
      for (const [r2, c, d] of edges) {
        if (r1 !== r2) continue;
        assert.ok(!((a < c && b > d) || (a > c && b < d)), `교차: ${r1}행 ${a}→${b} / ${c}→${d}`);
      }
    }
  }
});

test('정예·성소·상점은 부모와 자식으로 연달아 나오지 않는다', () => {
  for (const m of maps) {
    for (const n of nodesOf(m)) {
      if (!SPECIAL.has(n.type)) continue;
      for (const nx of n.next) assert.notEqual(m.nodes[nx].type, n.type, `${n.id}→${nx}`);
    }
  }
});

test('정예·상점은 2행부터, 무작위 성소는 4~5행에만', () => {
  for (const m of maps) {
    for (const n of nodesOf(m)) {
      if (n.type === 'elite' || n.type === 'shop') assert.ok(n.r >= 2);
      if (n.type === 'rest' && n.r !== ROWS - 1) assert.ok(n.r === 4 || n.r === 5);
    }
  }
});

test('시작점은 최소 두 열에 있다', () => {
  for (const m of maps) assert.ok(new Set(m.start).size >= 2);
});

test('같은 시드면 같은 맵', () => {
  assert.deepEqual(generateMap(makeRng('same'), 2), generateMap(makeRng('same'), 2));
});
