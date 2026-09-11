import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng, next, int, shuffle, weighted, streams, sample } from '../src/core/rng.js';

test('같은 시드는 같은 수열을 만든다', () => {
  const a = makeRng('abc');
  const b = makeRng('abc');
  const sa = Array.from({ length: 20 }, () => next(a));
  const sb = Array.from({ length: 20 }, () => next(b));
  assert.deepEqual(sa, sb);
});

test('다른 시드는 다른 수열을 만든다', () => {
  const a = makeRng('abc');
  const b = makeRng('abd');
  assert.notDeepEqual(
    Array.from({ length: 5 }, () => next(a)),
    Array.from({ length: 5 }, () => next(b)),
  );
});

test('next 는 [0, 1) 범위', () => {
  const r = makeRng(42);
  for (let i = 0; i < 2000; i++) {
    const x = next(r);
    assert.ok(x >= 0 && x < 1);
  }
});

test('int 는 양끝을 포함한다', () => {
  const r = makeRng(7);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const x = int(r, 1, 4);
    assert.ok(x >= 1 && x <= 4);
    seen.add(x);
  }
  assert.deepEqual([...seen].sort(), [1, 2, 3, 4]);
});

test('shuffle 은 원소를 보존하는 순열이다', () => {
  const orig = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const arr = orig.slice();
  shuffle(makeRng(1), arr);
  assert.deepEqual(arr.slice().sort((a, b) => a - b), orig);
});

test('weighted 는 가중치 0 인 항목을 뽑지 않는다', () => {
  const r = makeRng(3);
  for (let i = 0; i < 500; i++) assert.notEqual(weighted(r, [['a', 1], ['b', 0], ['c', 2]]), 'b');
});

test('sample 은 중복 없이 n 개를 고른다', () => {
  const got = sample(makeRng(9), ['a', 'b', 'c', 'd', 'e'], 3);
  assert.equal(got.length, 3);
  assert.equal(new Set(got).size, 3);
});

test('스트림은 서로 독립이다 — 상점 난수를 써도 전투 난수는 그대로', () => {
  const s1 = streams('seed');
  const s2 = streams('seed');
  next(s1.shop);
  next(s1.shop);
  assert.equal(next(s1.combat), next(s2.combat));
});

test('상태를 JSON 으로 저장했다 불러와도 같은 수열을 이어간다', () => {
  const r = makeRng('j');
  next(r);
  const copy = JSON.parse(JSON.stringify(r));
  assert.equal(next(r), next(copy));
});
