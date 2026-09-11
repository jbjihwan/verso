// 효과 컨텍스트(Ctx) — 카드·유물·물약·적이 전투 상태를 바꾸는 유일한 통로.
// 모든 변경은 이벤트({ t: ... })로 기록되고, UI 는 그 이벤트를 순서대로 연출한다.
import { cardDef, faceOf, onFlipVals, makeInst, allCards } from './cards.js';
import { statusDef } from './statuses.js';
import { relicDef, enemyDef } from './content.js';
import { int, sample } from './rng.js';

export const HAND_MAX = 10;
export const MAX_ENEMIES = 5;

// 선택(pending)에서 쓰는 카드 필터 — 직렬화 가능하도록 이름으로 참조한다
export const FILTERS = {
  any: () => true,
  attack: (i) => faceOf(i).type === 'attack',
  skill: (i) => faceOf(i).type === 'skill',
  upright: (i) => !i.rev,
  reversed: (i) => i.rev,
  flippable: (i) => !i.stuck,
  upgradable: (i) => !i.up && cardDef(i.id).pool !== 'curse' && cardDef(i.id).pool !== 'status',
  curseOrStatus: (i) => cardDef(i.id).pool === 'curse' || cardDef(i.id).pool === 'status',
};

export function relicState(run, id) {
  run.rs ??= {};
  return (run.rs[id] ??= {});
}

// 유물(mod.kind 함수)과 플레이어 파워(statusDef.mod.kind)의 수치 보정을 차례로 적용
export function mods(run, kind, value, info = {}) {
  let v = value;
  for (const id of run.relics ?? []) {
    const fn = relicDef(id).mod?.[kind];
    if (typeof fn === 'function') v = fn(run, v, info, relicState(run, id));
  }
  const p = run.combat?.player;
  if (p) {
    for (const [sid, n] of Object.entries(p.st)) {
      const fn = statusDef(sid).mod?.[kind];
      if (typeof fn === 'function') v = fn(v, n, info);
    }
  }
  return v;
}

// 유물의 고정 수치 보정 합(mod.energy, mod.flips, mod.draw …)
export function relicSum(run, key) {
  let s = 0;
  for (const id of run.relics ?? []) {
    const v = relicDef(id).mod?.[key];
    if (typeof v === 'number') s += v;
  }
  return s;
}

// 스펙 4.5: floor((기본 + 힘 [+보정]) × 약화 0.75 × 취약 1.5)
export function attackValue(run, attacker, target, base) {
  let d = base + (attacker.st.might ?? 0);
  if (attacker === run.combat?.player) d = mods(run, 'dmgOut', d, { target });
  if ((attacker.st.weak ?? 0) > 0) d *= 0.75;
  if ((target.st?.exposed ?? 0) > 0) d *= 1.5;
  return Math.max(0, Math.floor(d));
}

// 스펙 4.5: floor((기본 + 민첩) × 허약 0.75)
export function blockValue(run, base) {
  const p = run.combat.player;
  let b = base + (p.st.poise ?? 0);
  if ((p.st.brittle ?? 0) > 0) b *= 0.75;
  return Math.max(0, Math.floor(b));
}

function bump(ent, id, n) {
  const def = statusDef(id);
  const v = (ent.st[id] ?? 0) + n;
  if (v === 0 || (v < 0 && !def.signed)) delete ent.st[id];
  else ent.st[id] = v;
}

// 유물 훅 → 플레이어 파워(상태) 훅. 유물이 무언가를 했으면 그 앞에 relic 이벤트를 끼워 UI 가 반짝이게 한다.
// turnStart/turnEnd 상태 훅은 전투 엔진이 따로 처리하므로 여기서는 부르지 않는다.
export function runHooks(ctx, name, ...args) {
  const run = ctx.run;
  for (const id of [...(run.relics ?? [])]) {
    const fn = relicDef(id).hooks?.[name];
    if (!fn) continue;
    const mark = ctx.events.length;
    fn(ctx.child({ src: 'player', card: null, target: null }), relicState(run, id), ...args);
    if (ctx.events.length > mark) ctx.events.splice(mark, 0, { t: 'relic', id });
  }
  const p = ctx.cs?.player;
  if (!p || name === 'turnStart' || name === 'turnEnd') return;
  for (const [sid, n] of Object.entries({ ...p.st })) {
    const fn = statusDef(sid).hooks?.[name];
    if (fn && p.st[sid] != null) fn(ctx.child({ src: 'player', card: null, target: null }), p, n, ...args);
  }
}

export function spawnEnemy(run, id, { minion = false } = {}) {
  const def = enemyDef(id);
  const cs = run.combat;
  run.uid = (run.uid ?? 0) + 1;
  let hp = int(run.rng.combat, def.hp[0], def.hp[1]);
  if ((run.omen ?? 0) >= 1 && def.tier === 'normal') hp = Math.round(hp * 1.1);
  if ((run.omen ?? 0) >= 5 && def.tier === 'boss') hp = Math.round(hp * 1.2);
  const e = {
    uid: `e${run.uid}`, id, hp, maxHp: hp, block: 0, st: {}, stance: 0,
    move: null, hist: [], mem: {}, dead: false, minion,
  };
  cs.enemies.push(e);
  return e;
}

export function chooseIntent(ctx, e) {
  if (e.dead) return;
  e.move = enemyDef(e.id).ai(e, ctx.rng, ctx.cs, ctx.run);
  ctx.ev({ t: 'intent', uid: e.uid, move: e.move });
}

export class Ctx {
  constructor(run, o = {}) {
    this.run = run;
    this.cs = run.combat;
    this.events = o.events ?? [];
    this.src = o.src ?? 'player';   // 'player' 또는 적 uid
    this.card = o.card ?? null;     // 해결 중인 카드 인스턴스
    this.target = o.target ?? null; // 대상 엔티티(객체)
    this.fi = o.fi ?? 0;
    this.v = o.v ?? null;
    this.x = o.x ?? 0;
    this.depth = o.depth ?? 0;      // 뒤집힐 때 효과의 중첩 깊이(루프 가드)
  }

  get rng() { return this.run.rng.combat; }
  get player() { return this.cs.player; }

  child(o = {}) {
    return new Ctx(this.run, {
      events: this.events, src: this.src, card: this.card, target: this.target,
      fi: this.fi, v: this.v, x: this.x, depth: this.depth, ...o,
    });
  }

  // 적의 입장에서 행동하는 컨텍스트
  as(enemy) { return this.child({ src: enemy.uid, card: null, target: this.cs.player, v: null }); }

  ev(e) { this.events.push(e); }

  ent(ref) {
    if (!ref) return null;
    if (typeof ref === 'object') return ref;
    if (ref === 'player') return this.cs.player;
    return this.cs.enemies.find((e) => e.uid === ref) ?? null;
  }

  ref(ent) { return ent === this.cs.player ? 'player' : (ent?.uid ?? null); }
  self() { return this.ent(this.src); }
  enemiesAlive() { return this.cs.enemies.filter((e) => !e.dead); }
  over() { return this.cs.phase === 'won' || this.cs.phase === 'lost'; }

  randomEnemy() {
    const a = this.enemiesAlive();
    return a.length ? a[int(this.rng, 0, a.length - 1)] : null;
  }

  // ── 피해 ────────────────────────────────────────────────────────────
  attack(targetRef, base, times = 1) {
    const attacker = this.self();
    let total = 0;
    for (let i = 0; i < times; i++) {
      const target = this.ent(targetRef);
      if (!target || target.dead || !attacker || attacker.dead || this.over()) break;
      total += this.damage(target, attackValue(this.run, attacker, target, base), { attack: true, from: attacker });
      if (!target.dead && (target.st.thorns ?? 0) > 0 && !attacker.dead && !this.over()) {
        this.damage(attacker, target.st.thorns, { thorns: true, from: target });
      }
    }
    return total;
  }

  attackAll(base, times = 1) {
    let total = 0;
    for (let i = 0; i < times; i++) {
      for (const e of this.enemiesAlive()) {
        total += this.attack(e, base, 1);
        if (this.over()) return total;
      }
    }
    return total;
  }

  attackRandom(base, times = 1) {
    let total = 0;
    for (let i = 0; i < times; i++) {
      const e = this.randomEnemy();
      if (!e || this.over()) break;
      total += this.attack(e, base, 1);
    }
    return total;
  }

  // 공격이 아닌 피해: 힘·약화·취약 보정 없음, 방어도가 먼저 흡수
  hit(targetRef, n) {
    const t = this.ent(targetRef);
    if (!t || t.dead || n <= 0) return 0;
    return this.damage(t, n, { from: this.self() });
  }

  damage(target, amount, info = {}) {
    const cs = this.cs;
    const blocked = Math.min(target.block, amount);
    target.block -= blocked;
    const loss = Math.min(target.hp, amount - blocked);
    target.hp -= loss;
    this.ev({
      t: 'damage', target: this.ref(target), amount, blocked, loss, hp: target.hp, block: target.block,
      attack: !!info.attack, thorns: !!info.thorns, src: info.from ? this.ref(info.from) : null,
    });
    if (target === cs.player) cs.cnt.dmgTaken += loss;
    else if (info.from === cs.player) {
      cs.cnt.dmgDealt += loss;
      this.run.stats ??= {};
      this.run.stats.dmg = (this.run.stats.dmg ?? 0) + loss;
    }
    if (loss > 0) this.afterHpLoss(target, loss);
    if (info.attack && !target.dead && target.hp > 0) {
      if (target === cs.player) runHooks(this, 'attacked', loss, info.from);
      else enemyDef(target.id).hooks?.attacked?.(this.as(target), target, loss, info.from);
    }
    this.checkDeath(target);
    return loss;
  }

  // 방어도를 무시하는 체력 손실(독, 대가 등)
  loseHp(targetRef, n) {
    const t = this.ent(targetRef);
    if (!t || t.dead || n <= 0) return 0;
    const loss = Math.min(t.hp, n);
    t.hp -= loss;
    this.ev({ t: 'hpLoss', target: this.ref(t), amount: loss, hp: t.hp });
    if (t === this.cs.player) this.cs.cnt.dmgTaken += loss;
    if (loss > 0) this.afterHpLoss(t, loss);
    this.checkDeath(t);
    return loss;
  }

  afterHpLoss(target, loss) {
    if (target.hp <= 0) return;
    if (target === this.cs.player) runHooks(this, 'hpLost', loss);
    else enemyDef(target.id).hooks?.hpLost?.(this.as(target), target, loss);
  }

  checkDeath(target) {
    const cs = this.cs;
    if (target.hp > 0 || target.dead) return;
    if (target === cs.player) {
      if (cs.phase === 'lost') return;
      for (const id of this.run.relics ?? []) {
        const fn = relicDef(id).onLethal;
        if (fn && fn(this.child({ src: 'player' }), relicState(this.run, id))) {
          this.ev({ t: 'relic', id });
          if (target.hp > 0) return;
        }
      }
      cs.phase = 'lost';
      return;
    }
    target.dead = true;
    target.block = 0;
    this.ev({ t: 'death', uid: target.uid });
    this.run.stats ??= {};
    this.run.stats.kills = (this.run.stats.kills ?? 0) + 1;
    enemyDef(target.id).hooks?.death?.(this.as(target), target);
    runHooks(this, 'enemyDied', target);
    if (cs.phase !== 'lost' && !cs.enemies.some((e) => !e.dead && !e.minion)) {
      for (const e of cs.enemies) {
        if (e.dead) continue;
        e.dead = true;
        e.fled = true;
        this.ev({ t: 'death', uid: e.uid, fled: true });
      }
      cs.phase = 'won';
    }
  }

  // ── 방어·상태 ─────────────────────────────────────────────────────────
  // 출처가 플레이어면 민첩·허약 보정, 적이면 그대로
  block(n, targetRef) {
    const src = this.self();
    const t = targetRef ? this.ent(targetRef) : src;
    if (!t || t.dead) return 0;
    const amt = src === this.cs.player && t === this.cs.player ? blockValue(this.run, n) : n;
    return this.gainBlock(t, amt);
  }

  gainBlock(targetRef, amt) {
    const t = this.ent(targetRef);
    if (!t || t.dead || amt <= 0) return 0;
    t.block += amt;
    this.ev({ t: 'block', target: this.ref(t), amount: amt, block: t.block });
    if (t === this.cs.player) this.cs.cnt.blkGained += amt;
    return amt;
  }

  apply(targetRef, id, n) {
    const t = this.ent(targetRef);
    if (!t || t.dead || !n) return 0;
    const def = statusDef(id);
    if (def.kind === 'debuff' && n > 0 && (t.st.ward ?? 0) > 0) {
      bump(t, 'ward', -1);
      this.ev({ t: 'status', target: this.ref(t), id: 'ward', stacks: t.st.ward ?? 0, delta: -1, negated: id });
      return 0;
    }
    let amt = n;
    if (amt > 0 && def.kind === 'debuff' && t !== this.cs.player && this.src === 'player') {
      amt = mods(this.run, 'debuffOut', amt, { id, target: t });
    }
    bump(t, id, amt);
    this.ev({ t: 'status', target: this.ref(t), id, stacks: t.st[id] ?? 0, delta: amt });
    return amt;
  }

  applyAll(id, n) {
    for (const e of this.enemiesAlive()) this.apply(e, id, n);
  }

  heal(targetRef, n) {
    const t = this.ent(targetRef);
    if (!t || t.dead || n <= 0) return 0;
    const amt = Math.min(n, t.maxHp - t.hp);
    if (amt <= 0) return 0;
    t.hp += amt;
    this.ev({ t: 'heal', target: this.ref(t), amount: amt, hp: t.hp });
    return amt;
  }

  gainMaxHp(n) {
    const p = this.cs.player;
    p.maxHp += n;
    p.hp += n;
    this.run.maxHp += n;
    this.ev({ t: 'heal', target: 'player', amount: n, hp: p.hp, maxHp: p.maxHp });
  }

  stance(e, s) {
    if (e.stance === s) return;
    e.stance = s;
    this.ev({ t: 'stance', uid: e.uid, stance: s });
  }

  // ── 자원 ──────────────────────────────────────────────────────────────
  energy(n) {
    const p = this.cs.player;
    p.energy = Math.max(0, p.energy + n);
    this.ev({ t: 'energy', value: p.energy });
  }

  flips(n) {
    const p = this.cs.player;
    p.flips = Math.max(0, p.flips + n);
    this.ev({ t: 'flips', value: p.flips });
  }

  charge(n) { if (n > 0) this.apply('player', 'charge', n); }

  discharge() {
    const p = this.cs.player;
    const n = p.st.charge ?? 0;
    if (n > 0) {
      delete p.st.charge;
      this.ev({ t: 'status', target: 'player', id: 'charge', stacks: 0, delta: -n });
      runHooks(this, 'discharged', n);
    }
    return n;
  }

  // ── 카드 ──────────────────────────────────────────────────────────────
  draw(n) {
    const piles = this.cs.piles;
    let drawn = 0;
    for (let i = 0; i < n; i++) {
      if (piles.hand.length >= HAND_MAX) { this.ev({ t: 'handFull' }); break; }
      if (!piles.draw.length) {
        if (!piles.discard.length) break;
        this.reshuffle();
      }
      const inst = piles.draw.pop();
      piles.hand.push(inst);
      drawn++;
      this.ev({ t: 'draw', uid: inst.uid });
      cardDef(inst.id).onDraw?.(this.child({ card: inst, target: null }), inst);
      if (this.over()) break;
    }
    return drawn;
  }

  // 버린 더미를 섞어 뽑을 더미 아래에 깐다(남아 있던 뽑을 더미가 위에 유지된다)
  reshuffle() {
    const piles = this.cs.piles;
    const d = piles.discard.splice(0);
    for (let i = d.length - 1; i > 0; i--) {
      const j = int(this.rng, 0, i);
      [d[i], d[j]] = [d[j], d[i]];
    }
    piles.draw = d.concat(piles.draw);
    this.ev({ t: 'shuffle', count: d.length });
    runHooks(this, 'shuffle');
  }

  // 방향을 뒤집는다. 깊이 0 에서만 "뒤집힐 때" 효과와 flip 훅이 발동한다(무한 루프 방지, 스펙 4.3).
  flip(inst, { manual = false, force = false } = {}) {
    if (!inst || (inst.stuck && !force)) return false;
    inst.rev = !inst.rev;
    this.cs.cnt.flips++;
    this.cs.total.flips++;
    this.ev({ t: 'flip', uid: inst.uid, rev: inst.rev, manual });
    if (this.depth > 0 || this.over()) return true;
    const sub = this.child({ card: inst, target: null, depth: this.depth + 1 });
    const of = cardDef(inst.id).onFlip;
    if (of) {
      this.ev({ t: 'onFlip', uid: inst.uid });
      of.run(sub, onFlipVals(inst), inst);
    }
    runHooks(sub, 'flip', inst, manual);
    if (manual) runHooks(sub, 'manualFlip', inst);
    for (const e of this.enemiesAlive()) enemyDef(e.id).hooks?.flip?.(sub.as(e), e, inst);
    return true;
  }

  flipHand(pred = () => true) {
    let n = 0;
    for (const inst of [...this.cs.piles.hand]) if (pred(inst) && this.flip(inst)) n++;
    return n;
  }

  // 전투 중에만 존재하는 카드를 만든다(덱에는 들어가지 않는다)
  addCard(id, where = 'hand', opts = {}) {
    const inst = makeInst(this.run, id, opts);
    inst.temp = true;
    const piles = this.cs.piles;
    let w = where;
    if (w === 'hand' && piles.hand.length >= HAND_MAX) w = 'discard';
    if (w === 'draw') piles.draw.splice(int(this.rng, 0, piles.draw.length), 0, inst);
    else if (w === 'drawTop') piles.draw.push(inst);
    else piles[w].push(inst);
    this.ev({ t: 'addCard', uid: inst.uid, id, where: w === 'drawTop' ? 'draw' : w });
    return inst;
  }

  take(inst) {
    const cs = this.cs;
    for (const pile of Object.values(cs.piles)) {
      const i = pile.indexOf(inst);
      if (i >= 0) { pile.splice(i, 1); return true; }
    }
    if (cs.limbo === inst) { cs.limbo = null; return true; }
    return false;
  }

  discardCard(inst, info = {}) {
    if (!this.take(inst)) return;
    this.cs.piles.discard.push(inst);
    this.ev({ t: 'discard', uid: inst.uid, ...info });
  }

  vanishCard(inst) {
    if (!this.take(inst)) return;
    this.cs.piles.vanish.push(inst);
    this.ev({ t: 'vanish', uid: inst.uid });
    runHooks(this, 'vanished', inst);
  }

  moveToHand(inst) {
    if (this.cs.piles.hand.length >= HAND_MAX || !this.take(inst)) return false;
    this.cs.piles.hand.push(inst);
    this.ev({ t: 'draw', uid: inst.uid, from: 'other' });
    return true;
  }

  countRev(pileName = 'hand') {
    return this.cs.piles[pileName].filter((i) => i.rev).length;
  }

  // 선택을 요청하고 멈춘다. 카드의 play() 는 choose() 를 마지막에 불러야 한다.
  // spec: { from: 'hand'|'discard'|'draw'|'discover', count, min?, filter?, options?(discover: 카드 id), prompt? }
  choose(spec, key) {
    const cs = this.cs;
    const options = spec.from === 'discover'
      ? spec.options.slice()
      : cs.piles[spec.from].filter(FILTERS[spec.filter ?? 'any']).map((i) => i.uid);
    const count = spec.count ?? 1;
    const min = Math.min(spec.min ?? count, options.length);
    const resume = faceOf(this.card, this.fi).resume[key];
    if (!options.length) { resume(this, this.v, []); return; }
    cs.pending = {
      kind: spec.from, count, min, options, uid: this.card.uid, fi: this.fi, key,
      target: this.target ? this.ref(this.target) : null, x: this.x, v: this.v, prompt: spec.prompt ?? null,
    };
  }

  // 발견용 후보: 해당 풀에서 해금된 카드 n 장(중복 없음)
  discoverOptions(pool, n = 3) {
    const locked = this.run.locks?.cards ?? [];
    const cands = allCards().filter((d) => d.pool === pool && ['common', 'uncommon', 'rare'].includes(d.rarity) && !locked.includes(d.id));
    return sample(this.rng, cands, n).map((d) => d.id);
  }

  // ── 적 전용 ───────────────────────────────────────────────────────────
  summon(id, { minion = true } = {}) {
    if (this.enemiesAlive().length >= MAX_ENEMIES) return null;
    const e = spawnEnemy(this.run, id, { minion });
    this.ev({ t: 'summon', uid: e.uid });
    enemyDef(id).start?.(this.as(e), e);
    chooseIntent(this, e);
    return e;
  }
}
