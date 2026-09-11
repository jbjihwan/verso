// 전투 엔진. 모든 행동은 run.combat 을 동기적으로 바꾸고 이벤트 배열을 돌려준다(스펙 13.1).
import { Ctx, runHooks, spawnEnemy, chooseIntent, relicSum, attackValue, blockValue, HAND_MAX } from './effects.js';
import { cardDef, faceOf, faceIdx, valsOf, costOf, hasKw } from './cards.js';
import { statusDef } from './statuses.js';
import { enemyDef, encounterDef, potionDef } from './content.js';
import { shuffle } from './rng.js';
import { moveDmg, moveTimes } from './ai.js';

export const DRAW_PER_TURN = 5;
export const BASE_ENERGY = 3;
export { HAND_MAX };

const freshCnt = () => ({ played: 0, attacks: 0, skills: 0, powers: 0, flips: 0, dmgDealt: 0, dmgTaken: 0, blkGained: 0 });

export function isBusy(run) {
  const cs = run.combat;
  return !cs || cs.phase !== 'player' || !!cs.pending || !!cs.limbo;
}

// ── 시작 ────────────────────────────────────────────────────────────────
export function startCombat(run, encounterId) {
  const enc = encounterDef(encounterId);
  const events = [];
  run.stats ??= {};
  run.combat = {
    turn: 0,
    phase: 'player',
    encounter: encounterId,
    tier: enc.pool,
    player: {
      hp: run.hp, maxHp: run.maxHp, block: 0, energy: 0,
      maxEnergy: BASE_ENERGY + relicSum(run, 'energy'),
      flips: 0, st: {}, nextEnergy: 0, nextDraw: 0, nextFlips: 0,
    },
    enemies: [],
    piles: { draw: [], hand: [], discard: [], vanish: [] },
    limbo: null,
    pending: null,
    cnt: freshCnt(),
    total: { played: 0, flips: 0, attacks: 0 },
    flags: {},
  };
  const cs = run.combat;

  // 전투 시작 시 모든 카드는 정방향(면을 영구 교환한 카드는 역방향)
  cs.piles.draw = run.deck.map((c) => ({ uid: c.uid, id: c.id, up: c.up, rev: !!c.swapped, swapped: !!c.swapped }));
  shuffle(run.rng.combat, cs.piles.draw);
  const innate = cs.piles.draw.filter((i) => hasKw(i, 'innate'));
  if (innate.length) cs.piles.draw = cs.piles.draw.filter((i) => !innate.includes(i)).concat(innate);

  for (const id of enc.enemies) spawnEnemy(run, id);
  const ctx = new Ctx(run, { events });
  if ((run.omen ?? 0) >= 2) {
    for (const e of cs.enemies) {
      const tier = enemyDef(e.id).tier;
      if (tier === 'elite' || tier === 'boss') ctx.as(e).apply(e, 'might', 1);
    }
  }
  for (const e of [...cs.enemies]) enemyDef(e.id).start?.(ctx.as(e), e);
  runHooks(ctx, 'combatStart');
  for (const e of cs.enemies) if (!e.dead) chooseIntent(ctx, e);
  startPlayerTurn(run, ctx);
  checkEnd(run, ctx);
  return events;
}

function startPlayerTurn(run, ctx) {
  const cs = run.combat;
  const p = cs.player;
  cs.phase = 'player';
  cs.turn++;
  cs.cnt = freshCnt();
  for (const pile of Object.values(cs.piles)) for (const i of pile) delete i.stuck;
  if (p.block && !p.st.bulwark) {
    p.block = 0;
    ctx.ev({ t: 'block', target: 'player', amount: 0, block: 0, reset: true });
  }
  ctx.ev({ t: 'turn', n: cs.turn, side: 'player' });
  p.energy = p.maxEnergy + p.nextEnergy;
  p.nextEnergy = 0;
  ctx.ev({ t: 'energy', value: p.energy });
  p.flips = 1 + relicSum(run, 'flips') + p.nextFlips;
  p.nextFlips = 0;
  ctx.ev({ t: 'flips', value: p.flips });
  statusPhase(ctx, p, 'turnStart');
  if (ctx.over()) return;
  runHooks(ctx, 'turnStart');
  if (ctx.over()) return;
  ctx.draw(DRAW_PER_TURN + p.nextDraw + relicSum(run, 'draw'));
  p.nextDraw = 0;
  runHooks(ctx, 'afterDraw');
  for (const e of ctx.enemiesAlive()) enemyDef(e.id).hooks?.playerTurnStart?.(ctx.as(e), e);
}

function statusPhase(ctx, owner, hook) {
  const c = owner === ctx.cs.player ? ctx.child({ src: 'player', card: null, target: null }) : ctx.as(owner);
  for (const id of Object.keys({ ...owner.st })) {
    if (owner.dead || ctx.over()) return;
    const fn = statusDef(id).hooks?.[hook];
    if (fn && owner.st[id] != null) fn(c, owner, owner.st[id]);
  }
}

function decay(ctx, owner) {
  if (owner.dead) return;
  const c = owner === ctx.cs.player ? ctx.child({ src: 'player', card: null, target: null }) : ctx.as(owner);
  for (const id of Object.keys({ ...owner.st })) if (statusDef(id).decay === 'turn') c.apply(owner, id, -1);
}

// ── 카드 사용 ─────────────────────────────────────────────────────────────
export function canPlay(run, uid) {
  const cs = run.combat;
  if (isBusy(run)) return { ok: false, reason: 'busy' };
  const inst = cs.piles.hand.find((i) => i.uid === uid);
  if (!inst) return { ok: false, reason: 'missing' };
  const f = faceOf(inst);
  if (hasKw(inst, 'unplayable')) return { ok: false, reason: 'unplayable' };
  const c = costOf(inst);
  if (c !== 'X' && c > cs.player.energy) return { ok: false, reason: 'energy' };
  if (f.canPlay && !f.canPlay(cs, inst)) return { ok: false, reason: 'condition' };
  return { ok: true };
}

export function playCard(run, uid, targetUid) {
  if (!canPlay(run, uid).ok) return [];
  const cs = run.combat;
  const inst = cs.piles.hand.find((i) => i.uid === uid);
  const fi = faceIdx(inst);
  const f = faceOf(inst, fi);
  const alive = cs.enemies.filter((e) => !e.dead);
  let target = null;
  if (f.target === 'enemy') {
    target = alive.find((e) => e.uid === targetUid) ?? (alive.length === 1 ? alive[0] : null);
    if (!target) return [];
  }

  const events = [];
  const cost = costOf(inst, fi);
  const x = cost === 'X' ? cs.player.energy : 0;
  const spend = cost === 'X' ? cs.player.energy : cost;
  if (spend > 0) {
    cs.player.energy -= spend;
    events.push({ t: 'energy', value: cs.player.energy });
  }
  cs.piles.hand.splice(cs.piles.hand.indexOf(inst), 1);
  cs.limbo = inst;
  delete inst.free;
  events.push({ t: 'play', uid, fi, target: target?.uid ?? null, type: f.type });
  cs.cnt.played++;
  cs.total.played++;
  if (f.type === 'attack') { cs.cnt.attacks++; cs.total.attacks++; }
  else if (f.type === 'skill') cs.cnt.skills++;
  else if (f.type === 'power') cs.cnt.powers++;
  run.stats.cardsPlayed = (run.stats.cardsPlayed ?? 0) + 1;

  const v = valsOf(inst, fi);
  if (cost === 'X') v.x = x + relicSum(run, 'xBonus');
  f.calc?.(cs, v, inst);
  const ctx = new Ctx(run, { events, card: inst, target, fi, v, x: v.x ?? 0 });
  f.play(ctx, v, inst);
  if (!cs.pending) finishPlay(run, ctx, inst, fi);
  return events;
}

// 효과 해결 뒤: 뒤집기(고정 제외) → 사용 훅 → 목적지(파워 제거 / 소멸 / 버린 더미)
function finishPlay(run, ctx, inst, fi) {
  const cs = run.combat;
  const f = faceOf(inst, fi);
  const c0 = ctx.child({ depth: 0, target: null });
  if (!hasKw(inst, 'steady', fi) && !ctx.over()) c0.flip(inst);
  if (!ctx.over()) {
    runHooks(c0, 'cardPlayed', inst, f, fi);
    for (const e of cs.enemies) if (!e.dead) enemyDef(e.id).hooks?.cardPlayed?.(c0.as(e), e, inst, f);
  }
  if (cs.limbo === inst) {
    cs.limbo = null;
    if (f.type === 'power') {
      ctx.ev({ t: 'powerUsed', uid: inst.uid });
    } else if (hasKw(inst, 'vanish', fi) || inst.vanishOnce) {
      delete inst.vanishOnce;
      cs.piles.vanish.push(inst);
      ctx.ev({ t: 'vanish', uid: inst.uid, played: true });
      runHooks(c0, 'vanished', inst);
    } else {
      cs.piles.discard.push(inst);
      ctx.ev({ t: 'discard', uid: inst.uid, played: true });
    }
  }
  checkEnd(run, ctx);
}

// 선택 대기(pending) 재개. picks: 카드 uid 배열(발견이면 카드 id 배열)
export function choose(run, picks) {
  const cs = run.combat;
  const p = cs?.pending;
  if (!p || !cs.limbo) return [];
  const list = Array.isArray(picks) ? picks : [];
  if (list.length < p.min || list.length > p.count) return [];
  if (new Set(list).size !== list.length || !list.every((x) => p.options.includes(x))) return [];
  const picked = p.kind === 'discover'
    ? list
    : list.map((uid) => cs.piles[p.kind].find((i) => i.uid === uid)).filter(Boolean);
  cs.pending = null;
  const inst = cs.limbo;
  const events = [];
  const target = p.target ? (cs.enemies.find((e) => e.uid === p.target && !e.dead) ?? null) : null;
  const v = p.v ?? valsOf(inst, p.fi);
  const ctx = new Ctx(run, { events, card: inst, target, fi: p.fi, v, x: p.x ?? 0 });
  faceOf(inst, p.fi).resume[p.key](ctx, v, picked);
  if (!cs.pending) finishPlay(run, ctx, inst, p.fi);
  return events;
}

// ── 무료 뒤집기 ──────────────────────────────────────────────────────────
export function canFlip(run, uid) {
  const cs = run.combat;
  if (isBusy(run)) return { ok: false, reason: 'busy' };
  const inst = cs.piles.hand.find((i) => i.uid === uid);
  if (!inst) return { ok: false, reason: 'missing' };
  if (inst.stuck) return { ok: false, reason: 'stuck' };
  if (cs.player.flips <= 0) return { ok: false, reason: 'noFlips' };
  return { ok: true };
}

export function flipCard(run, uid) {
  if (!canFlip(run, uid).ok) return [];
  const cs = run.combat;
  const inst = cs.piles.hand.find((i) => i.uid === uid);
  const events = [];
  const ctx = new Ctx(run, { events });
  cs.player.flips--;
  events.push({ t: 'flips', value: cs.player.flips });
  ctx.flip(inst, { manual: true });
  checkEnd(run, ctx);
  return events;
}

// ── 물약 ────────────────────────────────────────────────────────────────
export function usePotion(run, slot, targetUid) {
  const id = run.potions?.[slot];
  if (!id || isBusy(run)) return [];
  const cs = run.combat;
  const def = potionDef(id);
  const alive = cs.enemies.filter((e) => !e.dead);
  let target = null;
  if (def.target === 'enemy') {
    target = alive.find((e) => e.uid === targetUid) ?? (alive.length === 1 ? alive[0] : null);
    if (!target) return [];
  }
  const events = [];
  const ctx = new Ctx(run, { events, target });
  run.potions[slot] = null;
  events.push({ t: 'potion', id, slot, target: target?.uid ?? null });
  const mult = 1 + relicSum(run, 'potency');
  const v = {};
  for (const [k, n] of Object.entries(def.vals ?? {})) v[k] = typeof n === 'number' ? Math.round(n * mult) : n;
  def.use(ctx, v);
  runHooks(ctx, 'potionUsed', id);
  checkEnd(run, ctx);
  return events;
}

// ── 턴 종료 · 적 턴 ──────────────────────────────────────────────────────
export function endTurn(run) {
  const cs = run.combat;
  if (isBusy(run)) return [];
  const events = [];
  const ctx = new Ctx(run, { events });
  ctx.ev({ t: 'endTurn' });
  runHooks(ctx, 'turnEnd');
  statusPhase(ctx, cs.player, 'turnEnd');
  if (!ctx.over()) {
    for (const inst of [...cs.piles.hand]) {
      cardDef(inst.id).inHandEnd?.(ctx.child({ card: inst, target: null }), inst);
      if (ctx.over()) break;
      if (hasKw(inst, 'ethereal')) ctx.vanishCard(inst);
      else if (hasKw(inst, 'retain') || inst.retainOnce) delete inst.retainOnce;
      else ctx.discardCard(inst, { endTurn: true });
    }
  }
  for (const pile of Object.values(cs.piles)) for (const i of pile) delete i.free;
  decay(ctx, cs.player);
  if (!ctx.over()) enemyTurn(run, ctx);
  if (!ctx.over()) {
    for (const e of ctx.enemiesAlive()) chooseIntent(ctx, e);
    startPlayerTurn(run, ctx);
  }
  checkEnd(run, ctx);
  return events;
}

function enemyTurn(run, ctx) {
  const cs = run.combat;
  cs.phase = 'enemy';
  ctx.ev({ t: 'turn', n: cs.turn, side: 'enemy' });
  for (const e of cs.enemies.slice()) {
    if (e.dead || ctx.over()) continue;
    if (e.block && !e.st.bulwark) {
      e.block = 0;
      ctx.ev({ t: 'block', target: e.uid, amount: 0, block: 0, reset: true });
    }
    statusPhase(ctx, e, 'turnStart');
    if (e.dead || ctx.over()) continue;
    const def = enemyDef(e.id);
    const m = def.moves[e.move];
    if (m) {
      ctx.ev({ t: 'enemyMove', uid: e.uid, move: e.move, intent: m.intent });
      m.run(ctx.as(e), e, m);
      e.hist.push(e.move);
      if (e.hist.length > 8) e.hist.shift();
    }
    if (ctx.over()) break;
    statusPhase(ctx, e, 'turnEnd');
    decay(ctx, e);
  }
  if (cs.phase === 'enemy') cs.phase = 'player';
}

function checkEnd(run, ctx) {
  const cs = run.combat;
  if (cs.flags.ended) return;
  if (cs.phase === 'won') {
    cs.flags.ended = true;
    runHooks(ctx, 'victory');
    run.hp = Math.max(0, cs.player.hp);
    run.maxHp = cs.player.maxHp;
    ctx.ev({ t: 'victory' });
  } else if (cs.phase === 'lost') {
    cs.flags.ended = true;
    run.hp = 0;
    ctx.ev({ t: 'defeat' });
  }
}

// ── 표시용 계산 ──────────────────────────────────────────────────────────
// 카드 텍스트에 넣을 값: dmg* 는 공격 보정, blk* 는 방어 보정을 반영. mods[k] = 'up'|'down'
export function displayVals(run, inst, targetUid) {
  const fi = faceIdx(inst);
  const f = faceOf(inst, fi);
  const v = valsOf(inst, fi);
  const mods = {};
  const cs = run?.combat;
  if (!cs || cs.phase === 'won' || cs.phase === 'lost') return { v, mods };
  if (costOf(inst, fi) === 'X') v.x = cs.player.energy;
  f.calc?.(cs, v, inst);
  const p = cs.player;
  const tgt = targetUid ? cs.enemies.find((e) => e.uid === targetUid && !e.dead) : null;
  for (const k of Object.keys(v)) {
    if (typeof v[k] !== 'number') continue;
    let nv;
    if (k.startsWith('dmg')) nv = attackValue(run, p, tgt ?? { st: {} }, v[k]);
    else if (k.startsWith('blk')) nv = blockValue(run, v[k]);
    else continue;
    if (nv !== v[k]) mods[k] = nv > v[k] ? 'up' : 'down';
    v[k] = nv;
  }
  return { v, mods };
}

export function intentView(run, e) {
  const cs = run.combat;
  if (!e || e.dead) return null;
  const m = enemyDef(e.id).moves[e.move];
  if (!m) return null;
  const view = { kind: m.intent, move: e.move, name: m.name ?? null };
  if (m.dmg != null) {
    view.dmg = attackValue(run, e, cs.player, moveDmg(m, e, cs));
    view.times = moveTimes(m, e, cs);
  }
  return view;
}
