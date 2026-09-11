import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeStore, loadAll, KEYS, saveRun, saveMeta } from '../src/core/save.js';

function memStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    dump: () => Object.fromEntries(m),
  };
}

const defaults = {
  defaultSettings: { lang: 'en', sfx: 0.8 },
  defaultMeta: { insight: 0, stats: { fool: { runs: 0 } }, flags: { tutorial: false } },
  validateRun: (r) => r && r.v === 1 && typeof r.hp === 'number',
};

test('저장한 런을 그대로 다시 읽는다', () => {
  const st = memStorage();
  const store = makeStore(st);
  saveRun(store, { v: 1, hp: 50, deck: [{ uid: 'c1', id: 'strike' }] });
  const { run, notices } = loadAll(store, defaults);
  assert.deepEqual(run, { v: 1, hp: 50, deck: [{ uid: 'c1', id: 'strike' }] });
  assert.deepEqual(notices, []);
});

test('저장된 것이 없으면 기본값과 null 런', () => {
  const { settings, meta, run, notices } = loadAll(makeStore(memStorage()), defaults);
  assert.deepEqual(settings, defaults.defaultSettings);
  assert.deepEqual(meta, defaults.defaultMeta);
  assert.equal(run, null);
  assert.deepEqual(notices, []);
});

test('깨진 런 JSON 은 지우지 않고 격리 키로 옮긴다', () => {
  const st = memStorage({ [KEYS.run]: '{not json' });
  const { run, notices } = loadAll(makeStore(st), defaults);
  assert.equal(run, null);
  assert.deepEqual(notices, ['run']);
  assert.equal(st.getItem(KEYS.corrupt), '{not json');
  assert.equal(st.getItem(KEYS.run), null);
});

test('버전이 다른 봉투도 격리한다', () => {
  const st = memStorage({ [KEYS.run]: JSON.stringify({ v: 99, data: { v: 1, hp: 3 } }) });
  const { run, notices } = loadAll(makeStore(st), defaults);
  assert.equal(run, null);
  assert.deepEqual(notices, ['run']);
  assert.ok(st.getItem(KEYS.corrupt));
});

test('형식 검사를 통과하지 못한 런은 격리한다', () => {
  const st = memStorage();
  const store = makeStore(st);
  saveRun(store, { v: 1, hp: 'x' });
  const { run, notices } = loadAll(store, defaults);
  assert.equal(run, null);
  assert.deepEqual(notices, ['run']);
  assert.match(st.getItem(KEYS.corrupt), /"hp":"x"/);
});

test('깨진 메타는 격리하고 기본값으로 시작한다(원본 보존)', () => {
  const st = memStorage({ [KEYS.meta]: 'garbage' });
  const { meta, notices } = loadAll(makeStore(st), defaults);
  assert.deepEqual(meta, defaults.defaultMeta);
  assert.deepEqual(notices, ['meta']);
  assert.equal(st.getItem(`${KEYS.meta}:corrupt`), 'garbage');
});

test('옛 메타에 없는 새 기본 필드가 병합된다', () => {
  const st = memStorage();
  const store = makeStore(st);
  saveMeta(store, { insight: 120, stats: { fool: { runs: 4 } } });
  const { meta } = loadAll(store, defaults);
  assert.equal(meta.insight, 120);
  assert.equal(meta.stats.fool.runs, 4);
  assert.deepEqual(meta.flags, { tutorial: false });
});

test('storage 접근이 예외를 던져도 기본값으로 동작한다', () => {
  const hostile = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
    removeItem() { throw new Error('denied'); },
  };
  const store = makeStore(hostile);
  const { run, notices } = loadAll(store, defaults);
  assert.equal(run, null);
  assert.deepEqual(notices, []);
  assert.equal(store.write(KEYS.run, { v: 1 }), false);
});

test('saveRun(null) 은 런을 지운다', () => {
  const st = memStorage();
  const store = makeStore(st);
  saveRun(store, { v: 1, hp: 1 });
  saveRun(store, null);
  assert.equal(st.getItem(KEYS.run), null);
});
