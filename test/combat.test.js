import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerEnemies, registerEncounters } from '../src/core/content.js';
import { registerCards, makeInst } from '../src/core/cards.js';
import { startCombat, playCard, flipCard, endTurn, choose, canPlay } from '../src/core/combat.js';
import { Ctx, attackValue, blockValue } from '../src/core/effects.js';
import { streams } from '../src/core/rng.js';

// ── 테스트 전용 콘텐츠 ────────────────────────────────────────────────────
const noop = () => {};
const txt = { ko: () => '', en: () => '' };
const nm = (s) => ({ ko: s, en: s });
const face = (o = {}) => ({ name: nm('t'), type: 'skill', cost: 0, target: 'self', vals: {}, text: txt, play: noop, ...o });

registerEnemies([{
  id: 't_dummy', act: 1, tier: 'normal', art: 'imp', size: 'md', hp: [50, 50], name: nm('Dummy'),
  moves: {
    wait: { intent: 'buff', run: noop },
    hit: { intent: 'attack', dmg: 5, run: (c, e, m) => c.attack(c.player, m.dmg) },
    guard: { intent: 'block', run: (c) => c.block(10) },
  },
  ai: (e) => e.mem.next ?? 'wait',
}]);
registerEncounters([
  { id: 't_one', act: 1, pool: 'normal', enemies: ['t_dummy'] },
  { id: 't_two', act: 1, pool: 'normal', enemies: ['t_dummy', 't_dummy'] },
]);
registerCards([
  { id: 't_steady', pool: 'neutral', rarity: 'special', art: 'sun', faces: [face({ kw: ['steady'] }), face({ kw: ['steady'] })] },
  {
    id: 't_flipper', pool: 'neutral', rarity: 'special', art: 'sun', faces: [face(), face()],
    onFlip: { text: txt, run: (c) => c.flipHand((i) => i !== c.card) },
  },
  { id: 't_ether', pool: 'neutral', rarity: 'special', art: 'sun', faces: [face({ cost: 1, kw: ['ethereal'] }), face({ cost: 1, kw: ['ethereal'] })] },
  { id: 't_retain', pool: 'neutral', rarity: 'special', art: 'sun', faces: [face({ cost: 1, kw: ['retain'] }), face({ cost: 1, kw: ['retain'] })] },
  {
    id: 't_x', pool: 'neutral', rarity: 'special', art: 'sun',
    faces: [face({ type: 'attack', cost: 'X', target: 'enemy', play: (c, v) => c.attack(c.target, 1, v.x) }), face()],
  },
]);

function mkRun(deckIds, { hp = 60 } = {}) {
  const run = {
    v: 1, seed: 't', char: 'fool', omen: 0, act: 1, floor: 0, hp, maxHp: hp, gold: 0,
    deck: [], relics: [], rs: {}, potions: [null, null, null], rng: streams('t'), uid: 0, stats: {},
  };
  run.deck = deckIds.map((id) => makeInst(run, id));
  return run;
}
const cs = (run) => run.combat;
const hand = (run) => run.combat.piles.hand;
const foe = (run, i = 0) => run.combat.enemies[i];
const find = (run, id) => hand(run).find((i) => i.id === id);

// ── 공식 ──────────────────────────────────────────────────────────────────
test('공격 피해 = floor((기본 + 힘) × 약화 0.75 × 취약 1.5), 음수는 0', () => {
  const run = mkRun(['strike']);
  startCombat(run, 't_one');
  const p = cs(run).player;
  const e = foe(run);
  assert.equal(attackValue(run, p, e, 6), 6);
  p.st.might = 2;
  assert.equal(attackValue(run, p, e, 6), 8);
  p.st.weak = 1;
  assert.equal(attackValue(run, p, e, 6), 6);
  e.st.exposed = 1;
  assert.equal(attackValue(run, p, e, 6), 9);
  p.st.might = -10;
  assert.equal(attackValue(run, p, e, 6), 0);
});

test('카드 방어도 = floor((기본 + 민첩) × 허약 0.75)', () => {
  const run = mkRun(['guard']);
  startCombat(run, 't_one');
  const p = cs(run).player;
  p.st.poise = 1;
  assert.equal(blockValue(run, 5), 6);
  p.st.brittle = 1;
  assert.equal(blockValue(run, 5), 4);
});

// ── 카드 사용과 뒤집기 ─────────────────────────────────────────────────────
test('카드를 쓰면 효과 후 역방향으로 뒤집혀 버린 더미로 간다', () => {
  const run = mkRun(['strike']);
  startCombat(run, 't_one');
  const inst = hand(run)[0];
  playCard(run, inst.uid, foe(run).uid);
  assert.equal(foe(run).hp, 44);
  assert.equal(cs(run).player.energy, 2);
  assert.deepEqual(cs(run).piles.discard.map((i) => i.uid), [inst.uid]);
  assert.equal(inst.rev, true);
  assert.equal(cs(run).cnt.flips, 1);
});

test('역방향 면이 쓰이고, 쓰면 다시 정방향으로 돌아온다', () => {
  const run = mkRun(['strike']);
  startCombat(run, 't_one');
  const inst = hand(run)[0];
  flipCard(run, inst.uid);
  assert.equal(inst.rev, true);
  playCard(run, inst.uid, foe(run).uid);   // 견제: 피해 4
  assert.equal(foe(run).hp, 46);
  assert.equal(inst.rev, false);
});

test('고정 카드는 사용해도 뒤집히지 않는다', () => {
  const run = mkRun(['t_steady']);
  startCombat(run, 't_one');
  const inst = hand(run)[0];
  playCard(run, inst.uid);
  assert.equal(inst.rev, false);
  assert.equal(cs(run).cnt.flips, 0);
});

test('무료 뒤집기는 턴마다 1회', () => {
  const run = mkRun(['strike', 'guard']);
  startCombat(run, 't_one');
  const [a, b] = hand(run);
  assert.ok(flipCard(run, a.uid).length > 0);
  assert.equal(a.rev, true);
  assert.equal(cs(run).player.flips, 0);
  assert.deepEqual(flipCard(run, b.uid), []);
  assert.equal(b.rev, false);
  endTurn(run);
  assert.equal(cs(run).player.flips, 1);
});

test('뒤집힐 때 효과가 일으킨 뒤집기는 다시 발동하지 않는다(무한 루프 방지)', () => {
  const run = mkRun(['t_flipper', 't_flipper', 't_flipper']);
  startCombat(run, 't_one');
  flipCard(run, hand(run)[0].uid);
  assert.ok(hand(run).every((i) => i.rev === true));
  assert.equal(cs(run).cnt.flips, 3);
});

test('선택이 필요한 카드는 고를 때까지 멈췄다가 이어서 끝난다', () => {
  const run = mkRun(['somersault', 'strike']);
  startCombat(run, 't_one');
  const som = find(run, 'somersault');
  const str = find(run, 'strike');
  playCard(run, som.uid);
  assert.ok(cs(run).pending);
  assert.equal(cs(run).limbo, som);
  assert.deepEqual(endTurn(run), []);
  assert.deepEqual(choose(run, ['nope']), []);
  choose(run, [str.uid]);
  assert.equal(cs(run).pending, null);
  assert.equal(str.rev, true);
  assert.equal(som.rev, true);
  assert.ok(cs(run).piles.discard.includes(som));
  assert.equal(cs(run).player.block, 6);
});

// ── 더미·손패 ─────────────────────────────────────────────────────────────
test('손패는 10장까지만 — 넘치면 더 뽑지 않는다', () => {
  const run = mkRun(Array(14).fill('strike'));
  startCombat(run, 't_one');
  new Ctx(run).draw(8);
  assert.equal(hand(run).length, 10);
  assert.equal(cs(run).piles.draw.length, 4);
});

test('뽑을 더미가 비면 버린 더미를 섞어 뽑는다', () => {
  const run = mkRun(Array(6).fill('guard'));
  startCombat(run, 't_one');
  assert.equal(hand(run).length, 5);
  endTurn(run);
  assert.equal(hand(run).length, 5);
  const total = hand(run).length + cs(run).piles.draw.length + cs(run).piles.discard.length;
  assert.equal(total, 6);
});

test('덧없음은 턴 끝에 소멸하고, 보존은 손에 남는다', () => {
  const run = mkRun(['t_ether', 't_retain']);
  startCombat(run, 't_one');
  const eth = find(run, 't_ether');
  const ret = find(run, 't_retain');
  endTurn(run);
  assert.ok(cs(run).piles.vanish.includes(eth));
  assert.ok(hand(run).includes(ret));
});

test('같은 시드면 같은 순서로 뽑는다', () => {
  const deck = Array.from({ length: 10 }, (_, i) => (i % 3 ? 'strike' : 'guard'));
  const a = mkRun(deck);
  const b = mkRun(deck);
  startCombat(a, 't_one');
  startCombat(b, 't_one');
  assert.deepEqual(hand(a).map((i) => i.uid), hand(b).map((i) => i.uid));
});

// ── 에너지 ────────────────────────────────────────────────────────────────
test('에너지가 모자라면 쓸 수 없다', () => {
  const run = mkRun(Array(5).fill('strike'));
  startCombat(run, 't_one');
  const e = foe(run);
  for (let i = 0; i < 3; i++) playCard(run, hand(run)[0].uid, e.uid);
  assert.equal(cs(run).player.energy, 0);
  assert.deepEqual(canPlay(run, hand(run)[0].uid), { ok: false, reason: 'energy' });
  assert.deepEqual(playCard(run, hand(run)[0].uid, e.uid), []);
});

test('X 비용은 남은 에너지를 전부 쓰고 그만큼 효과를 낸다', () => {
  const run = mkRun(['t_x']);
  startCombat(run, 't_one');
  playCard(run, hand(run)[0].uid, foe(run).uid);
  assert.equal(foe(run).hp, 47);
  assert.equal(cs(run).player.energy, 0);
});

// ── 방어도 · 적 턴 ─────────────────────────────────────────────────────────
test('플레이어 방어도는 자기 턴 시작에, 적 방어도는 적 턴 시작에 사라진다', () => {
  const run = mkRun(['guard']);
  startCombat(run, 't_one');
  const e = foe(run);
  e.mem.next = 'guard';
  e.move = 'guard';
  playCard(run, hand(run)[0].uid);
  assert.equal(cs(run).player.block, 5);
  endTurn(run);
  assert.equal(cs(run).player.block, 0);
  assert.equal(e.block, 10);
  endTurn(run);
  assert.equal(e.block, 10);
});

test('적의 공격은 방어도가 먼저 흡수한다', () => {
  const run = mkRun(['guard']);
  startCombat(run, 't_one');
  const e = foe(run);
  e.mem.next = 'hit';
  e.move = 'hit';
  playCard(run, hand(run)[0].uid);
  endTurn(run);
  assert.equal(cs(run).player.hp, 60);
  endTurn(run);
  assert.equal(cs(run).player.hp, 55);
});

test('마지막 적이 쓰러지면 승리하고 체력이 런에 반영된다', () => {
  const run = mkRun(['strike']);
  startCombat(run, 't_one');
  foe(run).hp = 5;
  cs(run).player.hp = 42;
  const ev = playCard(run, hand(run)[0].uid, foe(run).uid);
  assert.equal(cs(run).phase, 'won');
  assert.ok(ev.some((e) => e.t === 'victory'));
  assert.equal(run.hp, 42);
});

// ── 상태이상 ──────────────────────────────────────────────────────────────
test('독은 턴 시작에 체력을 깎고 1 줄어든다', () => {
  const run = mkRun(['guard']);
  startCombat(run, 't_one');
  const e = foe(run);
  e.st.venom = 3;
  endTurn(run);
  assert.equal(e.hp, 47);
  assert.equal(e.st.venom, 2);
});

test('수호는 디버프 하나를 막고 줄어든다', () => {
  const run = mkRun(['guard']);
  startCombat(run, 't_one');
  const e = foe(run);
  e.st.ward = 1;
  const c = new Ctx(run);
  c.apply(e, 'weak', 2);
  assert.equal(e.st.weak, undefined);
  assert.equal(e.st.ward, undefined);
  c.apply(e, 'weak', 2);
  assert.equal(e.st.weak, 2);
});

test('지속형 디버프는 소유자의 턴이 끝날 때 1 줄어든다', () => {
  const run = mkRun(['guard']);
  startCombat(run, 't_one');
  const e = foe(run);
  const c = new Ctx(run);
  c.apply(e, 'exposed', 1);
  c.apply('player', 'weak', 2);
  endTurn(run);
  assert.equal(e.st.exposed, undefined);
  assert.equal(cs(run).player.st.weak, 1);
});

// ── 시작 카드 · 유물 ───────────────────────────────────────────────────────
test('닳은 동전: 무료 뒤집기를 쓰면 방어도 3', () => {
  const run = mkRun(['strike']);
  run.relics = ['wornCoin'];
  startCombat(run, 't_one');
  flipCard(run, hand(run)[0].uid);
  assert.equal(cs(run).player.block, 3);
});

test('배당: 이번 턴에 뒤집힌 카드 수만큼 타격한다', () => {
  const run = mkRun(['wager', 'strike']);
  startCombat(run, 't_one');
  const w = find(run, 'wager');
  const s = find(run, 'strike');
  const e = foe(run);
  flipCard(run, w.uid);
  playCard(run, s.uid, e.uid);
  playCard(run, w.uid, e.uid);
  assert.equal(e.hp, 50 - 6 - 3 * 2);
});
