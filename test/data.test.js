import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/core/content.js';
import { allCards } from '../src/core/cards.js';
import { allRelics, allPotions } from '../src/core/content.js';
import { hasGlyph } from '../src/ui/art/glyphs.js';

const TYPES = new Set(['attack', 'skill', 'power', 'curse', 'status']);
const TARGETS = new Set(['enemy', 'all', 'self', 'none']);
const game = () => allCards().filter((d) => !d.id.startsWith('t_'));

test('모든 카드: 두 면, 두 언어 이름·텍스트, 올바른 비용·대상·유형', () => {
  for (const d of game()) {
    assert.equal(d.faces.length, 2, d.id);
    d.faces.forEach((f, fi) => {
      const where = `${d.id}[${fi}]`;
      assert.ok(f.name?.ko && f.name?.en, `${where} 이름`);
      assert.ok(TYPES.has(f.type), `${where} 유형`);
      assert.ok(f.cost === null || f.cost === 'X' || (Number.isInteger(f.cost) && f.cost >= 0), `${where} 비용`);
      assert.ok(TARGETS.has(f.target ?? 'none'), `${where} 대상`);
      for (const vals of [f.vals ?? {}, { ...(f.vals ?? {}), ...(f.upg ?? {}) }]) {
        for (const lang of ['ko', 'en']) {
          const s = f.text[lang](vals);
          assert.equal(typeof s, 'string', `${where} ${lang}`);
          assert.ok(!s.includes('undefined') && !s.includes('NaN'), `${where} ${lang}: ${s}`);
        }
      }
      if (f.cost !== null) assert.equal(typeof f.play, 'function', `${where} play`);
    });
    if (d.onFlip) {
      assert.equal(typeof d.onFlip.run, 'function', `${d.id} onFlip.run`);
      for (const lang of ['ko', 'en']) assert.equal(typeof d.onFlip.text[lang](d.onFlip.vals ?? {}), 'string');
    }
  }
});

test('카드 삽화 이름은 모두 문장 목록에 있다', () => {
  for (const d of game()) assert.ok(hasGlyph(d.art), `${d.id}: ${d.art}`);
});

test('캐릭터 보상 풀: 일반 12 · 고급 10 · 희귀 4, 잠김 A3 · B3', () => {
  for (const pool of ['fool', 'magician']) {
    const list = allCards().filter((d) => d.pool === pool && d.rarity !== 'basic');
    const by = (r) => list.filter((d) => d.rarity === r).length;
    assert.equal(by('common'), 12, `${pool} common`);
    assert.equal(by('uncommon'), 10, `${pool} uncommon`);
    assert.equal(by('rare'), 4, `${pool} rare`);
    assert.equal(list.filter((d) => d.lock === 'A').length, 3, `${pool} A`);
    assert.equal(list.filter((d) => d.lock === 'B').length, 3, `${pool} B`);
  }
});

test('무색 6 · 저주 4 · 상태이상 4', () => {
  assert.equal(allCards().filter((d) => d.pool === 'neutral' && !d.id.startsWith('t_')).length, 6);
  assert.equal(allCards().filter((d) => d.pool === 'curse').length, 4);
  assert.equal(allCards().filter((d) => d.pool === 'status').length, 4);
});

test('유물: 시작 2 · 일반 8 · 고급 6 · 희귀 4 · 보스 5 · 상점 3, 잠김 A3 · B3, 두 언어 설명', () => {
  const rs = allRelics();
  const by = (r) => rs.filter((x) => x.rarity === r).length;
  assert.deepEqual(
    [by('starter'), by('common'), by('uncommon'), by('rare'), by('boss'), by('shop')],
    [2, 8, 6, 4, 5, 3],
  );
  assert.equal(rs.filter((x) => x.lock === 'A').length, 3);
  assert.equal(rs.filter((x) => x.lock === 'B').length, 3);
  for (const r of rs) {
    assert.ok(r.name.ko && r.name.en && r.desc.ko && r.desc.en, r.id);
    assert.ok(hasGlyph(r.art), `${r.id}: ${r.art}`);
  }
});

test('물약 10종: 두 언어 설명과 use 함수', () => {
  const ps = allPotions();
  assert.equal(ps.length, 10);
  for (const p of ps) {
    assert.equal(typeof p.use, 'function', p.id);
    for (const lang of ['ko', 'en']) assert.equal(typeof p.desc[lang](p.vals), 'string');
    assert.ok(hasGlyph(p.art), `${p.id}: ${p.art}`);
  }
});
