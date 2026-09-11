// 런 상태와 진행(스펙 8·9): 노드 진입 · 보상 · 성소 · 상점 · 보물 · 이벤트 · 보스 유물 · 막 전환 · 런 종료.
// 모든 난수는 run.rng 스트림에서 뽑는다. 이 모듈은 UI 를 모른다.
import './content.js';
import { relicDef, potionDef, allRelics, allPotions, allEvents, eventDef, encountersFor } from './content.js';
import { CHARACTERS } from './data/characters.js';
import { makeInst, allCards, cardDef, canUpgrade, hasCard } from './cards.js';
import { streams, int, pick, sample, chance, weighted, shuffle } from './rng.js';
import { generateMap } from './map.js';
import { startCombat } from './combat.js';
import { relicSum, mods } from './effects.js';

export const RUN_VERSION = 1;
export const ACTS = 3;

// ── 생성 ────────────────────────────────────────────────────────────────
// locks: 아직 해금되지 않은 카드·유물 id(메타에서 계산해 넘긴다) — 런은 시작 시점의 해금 상태로 고정된다
export function newRun({ char = 'fool', seed = 'seed', omen = 0, locks = { cards: [], relics: [] } } = {}) {
  const c = CHARACTERS[char];
  const run = {
    v: RUN_VERSION, seed: String(seed), char, omen, act: 1, floor: 0,
    hp: c.hp, maxHp: c.hp, gold: 99,
    deck: [], relics: [], rs: {}, potions: [null, null, null], potionChance: 0.4,
    rng: streams(String(seed)), uid: 0,
    locks: { cards: [...(locks.cards ?? [])], relics: [...(locks.relics ?? [])] },
    bosses: {}, map: null, pos: null, visited: [],
    screen: 'map', combat: null, fight: null, reward: null, shop: null, event: null, rest: null, treasure: null,
    bossRelic: null, pendingSelect: null, removeCost: 75, lastEnc: {}, encCount: 0, seenEvents: [],
    stats: { floors: 0, elites: 0, bosses: 0, kills: 0, cardsPlayed: 0, dmg: 0, act1Boss: false },
    result: null,
  };
  run.deck = c.deck.map((id) => makeInst(run, id));
  gainRelic(run, c.relic);
  for (let a = 1; a <= ACTS; a++) {
    const list = encountersFor(a, 'boss');
    run.bosses[a] = list.length ? pick(run.rng.map, list).id : null;
  }
  run.map = generateMap(run.rng.map, 1);
  if (omen >= 4 && hasCard('doubt')) run.deck.push(makeInst(run, 'doubt'));
  return run;
}

export function validateRun(r) {
  return !!r && r.v === RUN_VERSION && typeof r.hp === 'number' && Array.isArray(r.deck)
    && typeof r.screen === 'string' && !!r.rng && typeof r.char === 'string' && !!r.map;
}

// ── 획득 ────────────────────────────────────────────────────────────────
export function gainRelic(run, id) {
  if (!id || run.relics.includes(id)) return false;
  run.relics.push(id);
  relicDef(id).onPickup?.(run);
  return true;
}

export function gainPotion(run, id) {
  if (!id) return false;
  const i = run.potions.indexOf(null);
  if (i < 0) return false;
  run.potions[i] = id;
  return true;
}

export function discardPotion(run, slot) { run.potions[slot] = null; }

export function gainCard(run, id, { up = 0 } = {}) {
  const inst = makeInst(run, id, { up });
  run.deck.push(inst);
  for (const rid of run.relics) relicDef(rid).onCardAdded?.(run, inst);
  return inst;
}

// ── 풀과 뽑기 ───────────────────────────────────────────────────────────
const RARITY_W = {
  combat: [60, 35, 5], elite: [45, 42, 13], boss: [0, 0, 100], shop: [55, 37, 8], event: [60, 35, 5],
};

export function cardPool(run, pool = run.char) {
  return allCards().filter((d) => d.pool === pool && ['common', 'uncommon', 'rare'].includes(d.rarity)
    && !run.locks.cards.includes(d.id));
}

export function rollCards(run, kind = 'combat', n = 3, rng = run.rng.reward, pool = run.char) {
  const all = cardPool(run, pool);
  const out = [];
  const used = new Set();
  const upChance = run.act === 2 ? 0.1 : run.act >= 3 ? 0.2 : 0;
  const [c, u, r] = RARITY_W[kind] ?? RARITY_W.combat;
  for (let i = 0; i < n; i++) {
    const rar = weighted(rng, [['common', c], ['uncommon', u], ['rare', r]]);
    let cands = all.filter((d) => d.rarity === rar && !used.has(d.id));
    if (!cands.length) cands = all.filter((d) => !used.has(d.id));
    if (!cands.length) break;
    const d = pick(rng, cands);
    used.add(d.id);
    out.push({ id: d.id, up: kind !== 'shop' && chance(rng, upChance) ? 1 : 0 });
  }
  return out;
}

export function relicPool(run, rarities) {
  return allRelics().filter((r) => rarities.includes(r.rarity) && !run.relics.includes(r.id)
    && !run.locks.relics.includes(r.id) && (!r.char || r.char === run.char));
}

export function rollRelic(run, rng = run.rng.reward) {
  const rar = weighted(rng, [['common', 50], ['uncommon', 33], ['rare', 17]]);
  let pool = relicPool(run, [rar]);
  if (!pool.length) pool = relicPool(run, ['common', 'uncommon', 'rare']);
  return pool.length ? pick(rng, pool).id : null;
}

export function rollPotion(run, rng = run.rng.reward) {
  const all = allPotions();
  if (!all.length) return null;
  const rar = weighted(rng, [['common', 65], ['uncommon', 25], ['rare', 10]]);
  const pool = all.filter((p) => p.rarity === rar);
  return pick(rng, pool.length ? pool : all).id;
}

function pickEncounter(run, pool) {
  const order = { easy: ['easy', 'normal'], normal: ['normal', 'easy'], elite: ['elite', 'normal', 'easy'] }[pool] ?? [pool];
  for (const p of order) {
    const list = encountersFor(run.act, p);
    if (!list.length) continue;
    const fresh = list.filter((e) => e.id !== run.lastEnc[p]);
    const enc = pick(run.rng.map, fresh.length ? fresh : list);
    run.lastEnc[p] = enc.id;
    return enc.id;
  }
  return null;
}

// ── 맵 진행 ─────────────────────────────────────────────────────────────
export function selectableNodes(run) {
  if (run.screen !== 'map' || !run.map) return [];
  if (run.pos == null) return run.map.start.slice();
  return run.map.nodes[run.pos]?.next.slice() ?? [];
}

// → 전투를 시작했으면 그 이벤트 배열, 아니면 [] (잘못된 노드면 null)
export function enterNode(run, id) {
  if (!selectableNodes(run).includes(id)) return null;
  const node = run.map.nodes[id];
  run.pos = id;
  run.visited.push(id);
  run.floor++;
  run.stats.floors++;
  switch (node.type) {
    case 'combat': {
      const easy = run.encCount < 3;
      run.encCount++;
      return startFight(run, pickEncounter(run, easy ? 'easy' : 'normal'), 'combat');
    }
    case 'elite':
      return startFight(run, pickEncounter(run, 'elite'), 'elite');
    case 'boss':
      return startFight(run, run.bosses[run.act] ?? pickEncounter(run, 'elite'), 'boss');
    case 'event': {
      const ev = makeEvent(run);
      if (!ev) { run.encCount++; return startFight(run, pickEncounter(run, 'normal'), 'combat'); }
      run.event = ev;
      run.screen = 'event';
      return [];
    }
    case 'shop':
      run.shop = makeShop(run);
      run.screen = 'shop';
      return [];
    case 'rest':
      run.rest = { done: null };
      run.screen = 'rest';
      return [];
    case 'treasure':
      run.treasure = { opened: false, relic: rollRelic(run), gold: int(run.rng.reward, 20, 40) };
      run.screen = 'treasure';
      return [];
    default:
      run.screen = 'map';
      return [];
  }
}

function startFight(run, encId, kind, reward = null) {
  run.fight = { kind, enc: encId, reward };
  run.screen = 'combat';
  return startCombat(run, encId);
}

// 전투 승리 뒤: 보상 생성(3막 보스면 곧바로 승리)
export function afterCombat(run) {
  const cs = run.combat;
  const kind = run.fight?.kind ?? 'combat';
  if (cs) { run.hp = cs.player.hp; run.maxHp = cs.player.maxHp; }
  run.combat = null;
  if (kind === 'elite') run.stats.elites++;
  if (kind === 'boss') {
    run.stats.bosses++;
    if (run.act === 1) run.stats.act1Boss = true;
    if (run.act >= ACTS) { endRun(run, true); return; }
  }
  run.reward = makeReward(run, kind, run.fight?.reward);
  run.screen = 'reward';
}

function makeReward(run, kind, extra) {
  const rng = run.rng.reward;
  const base = kind === 'boss' ? int(rng, 90, 110) : int(rng, 10, 20) + (run.act - 1) * 5;
  const gold = kind === 'elite' ? base * 2 : base;
  let potion = null;
  if (kind !== 'boss') {
    if (chance(rng, run.potionChance)) {
      potion = rollPotion(run, rng);
      run.potionChance = Math.max(0, run.potionChance - 0.1);
    } else {
      run.potionChance = Math.min(1, run.potionChance + 0.1);
    }
  }
  const relic = kind === 'elite' || extra?.relic ? rollRelic(run, rng) : null;
  const cardKind = kind === 'event' ? 'combat' : kind;
  return {
    kind, gold, goldTaken: false,
    cards: rollCards(run, cardKind, 3 + relicSum(run, 'cardChoices')), cardsDone: false,
    potion, potionTaken: !potion, relic, relicTaken: !relic,
  };
}

export function takeGold(run) {
  const r = run.reward;
  if (!r || r.goldTaken) return false;
  run.gold += r.gold;
  r.goldTaken = true;
  return true;
}

export function takeCard(run, idx) {
  const r = run.reward;
  const c = r?.cards[idx];
  if (!r || r.cardsDone || !c) return false;
  gainCard(run, c.id, { up: c.up });
  r.cardsDone = true;
  return true;
}

export function skipCards(run) {
  if (!run.reward) return;
  run.reward.cardsDone = true;
  for (const rid of run.relics) relicDef(rid).onSkipCards?.(run);
}

export function takePotion(run) {
  const r = run.reward;
  if (!r || r.potionTaken) return false;
  if (!gainPotion(run, r.potion)) return false;
  r.potionTaken = true;
  return true;
}

export function takeRelic(run) {
  const r = run.reward;
  if (!r || r.relicTaken) return false;
  gainRelic(run, r.relic);
  r.relicTaken = true;
  return true;
}

// 방을 떠나 맵으로. 보스 보상 뒤에는 보스 유물 → 다음 막
export function leaveRoom(run) {
  const wasBoss = run.screen === 'reward' && run.reward?.kind === 'boss';
  run.reward = null;
  run.shop = null;
  run.event = null;
  run.rest = null;
  run.treasure = null;
  run.fight = null;
  run.pendingSelect = null;
  if (wasBoss) {
    const options = sample(run.rng.reward, relicPool(run, ['boss']), 3).map((r) => r.id);
    if (options.length) { run.bossRelic = { options }; run.screen = 'bossRelic'; }
    else nextAct(run);
    return;
  }
  run.screen = 'map';
}

export function pickBossRelic(run, idx) {
  if (!run.bossRelic) return;
  const id = idx == null ? null : run.bossRelic.options[idx];
  if (id) gainRelic(run, id);
  run.bossRelic = null;
  nextAct(run);
}

export function nextAct(run) {
  run.act++;
  run.hp = Math.min(run.maxHp, run.hp + Math.floor((run.maxHp - run.hp) * 0.75));
  run.map = generateMap(run.rng.map, run.act);
  run.pos = null;
  run.visited = [];
  run.encCount = 0;
  run.screen = 'map';
}

// ── 성소 ────────────────────────────────────────────────────────────────
export function restHealAmount(run) {
  const pct = (run.omen ?? 0) >= 3 ? 0.2 : 0.3;
  return Math.max(0, Math.floor(run.maxHp * pct) + relicSum(run, 'restHeal'));
}

export function rest(run) {
  if (!run.rest || run.rest.done || relicSum(run, 'noRest') > 0) return false;
  run.hp = Math.min(run.maxHp, run.hp + restHealAmount(run));
  run.rest.done = 'rest';
  for (const rid of run.relics) relicDef(rid).onRest?.(run);
  return true;
}

export function refine(run, uid) {
  if (!run.rest || run.rest.done) return false;
  const inst = run.deck.find((i) => i.uid === uid);
  if (!inst || !canUpgrade(inst)) return false;
  inst.up = 1;
  run.rest.done = 'refine';
  return true;
}

// ── 상점 ────────────────────────────────────────────────────────────────
const CARD_PRICE = { common: [45, 55], uncommon: [70, 80], rare: [140, 160] };
const RELIC_PRICE = { common: 150, uncommon: 200, rare: 260, shop: 170 };
const POTION_PRICE = { common: 50, uncommon: 75, rare: 100 };

export function makeShop(run) {
  const rng = run.rng.shop;
  const vary = (p) => Math.round(p * (0.9 + int(rng, 0, 20) / 100));
  const cards = rollCards(run, 'shop', 5, rng).map((c) => {
    const [lo, hi] = CARD_PRICE[cardDef(c.id).rarity] ?? [60, 60];
    return { id: c.id, up: 0, price: vary(int(rng, lo, hi)), sold: false };
  });
  if (cards.length) {
    const s = cards[int(rng, 0, cards.length - 1)];
    s.price = Math.round(s.price / 2);
    s.sale = true;
  }
  const neutral = sample(rng, allCards().filter((d) => d.pool === 'neutral' && ['uncommon', 'rare'].includes(d.rarity)), 2)
    .map((d) => ({ id: d.id, up: 0, price: vary(d.rarity === 'rare' ? 160 : 85), sold: false }));
  const relics = sample(rng, relicPool(run, ['common', 'uncommon', 'rare', 'shop']), 3)
    .map((r) => ({ id: r.id, price: vary(RELIC_PRICE[r.rarity] ?? 180), sold: false }));
  const potions = [];
  for (let i = 0; i < 3; i++) {
    const id = rollPotion(run, rng);
    if (id) potions.push({ id, price: vary(POTION_PRICE[potionDef(id).rarity] ?? 60), sold: false });
  }
  return { cards, neutral, relics, potions, removeUsed: false };
}

export function priceOf(run, item) {
  return Math.max(0, Math.round(mods(run, 'shopPrice', item.price)));
}

export function removePrice(run) {
  return Math.max(0, Math.round(mods(run, 'shopPrice', run.removeCost)));
}

// kind: 'cards' | 'neutral' | 'relics' | 'potions' → { ok, reason? }
export function buy(run, kind, idx) {
  const it = run.shop?.[kind]?.[idx];
  if (!it || it.sold) return { ok: false, reason: 'sold' };
  const price = priceOf(run, it);
  if (run.gold < price) return { ok: false, reason: 'poor' };
  if (kind === 'potions' && !run.potions.includes(null)) return { ok: false, reason: 'potionsFull' };
  run.gold -= price;
  if (kind === 'relics') gainRelic(run, it.id);
  else if (kind === 'potions') gainPotion(run, it.id);
  else gainCard(run, it.id, { up: it.up });
  it.sold = true;
  return { ok: true };
}

export function removeCard(run, uid) {
  const price = removePrice(run);
  if (!run.shop || run.shop.removeUsed || run.gold < price) return false;
  const i = run.deck.findIndex((c) => c.uid === uid);
  if (i < 0) return false;
  run.deck.splice(i, 1);
  run.gold -= price;
  run.removeCost += 25;
  run.shop.removeUsed = true;
  return true;
}

// ── 보물 ────────────────────────────────────────────────────────────────
export function openTreasure(run) {
  const tr = run.treasure;
  if (!tr || tr.opened) return false;
  tr.opened = true;
  run.gold += tr.gold;
  if (tr.relic) gainRelic(run, tr.relic);
  return true;
}

// ── 이벤트 ──────────────────────────────────────────────────────────────
export function makeEvent(run) {
  const pool = allEvents().filter((e) => e.acts.includes(run.act) && !run.seenEvents.includes(e.id) && (!e.can || e.can(run)));
  if (!pool.length) return null;
  const ev = pick(run.rng.event, pool);
  run.seenEvents.push(ev.id);
  return { id: ev.id, page: 'start', result: null, fight: null, data: ev.setup?.(run, run.rng.event) ?? {} };
}

export function eventChoices(run) {
  const st = run.event;
  if (!st) return [];
  return eventDef(st.id).choices(run, st.data);
}

function eventApi(run) {
  const rng = run.rng.event;
  return {
    run, rng,
    gold(n) { run.gold = Math.max(0, run.gold + n); },
    hp(n) { run.hp = Math.max(1, Math.min(run.maxHp, run.hp + n)); },
    maxHp(n) {
      run.maxHp = Math.max(1, run.maxHp + n);
      run.hp = Math.max(1, Math.min(run.maxHp, run.hp + Math.max(0, n)));
    },
    relic(id = 'random') {
      const rid = id === 'random' ? rollRelic(run, rng) : id;
      if (rid) gainRelic(run, rid);
      return rid;
    },
    card(id, up = 0) { return gainCard(run, id, { up }); },
    randomCard(kind = 'event', up = 0) {
      const [c] = rollCards(run, kind, 1, rng);
      return c ? gainCard(run, c.id, { up: up || c.up }) : null;
    },
    curse(id) { return hasCard(id) ? gainCard(run, id) : null; },
    potion() {
      const pid = rollPotion(run, rng);
      if (pid) gainPotion(run, pid);
      return pid;
    },
    upgradeRandom(n) {
      const cands = shuffle(rng, run.deck.filter(canUpgrade)).slice(0, n);
      for (const i of cands) i.up = 1;
      return cands;
    },
    // { action: 'remove'|'upgrade'|'duplicate'|'transform'|'swap', count?, text? } — UI 가 카드를 고르게 한다
    select(spec) { run.pendingSelect = { count: 1, ...spec }; },
    fight(encId, reward = {}) { run.event.fight = { enc: encId, reward }; },
    fightElite(reward = { relic: true }) {
      const list = encountersFor(run.act, 'elite');
      if (list.length) run.event.fight = { enc: pick(rng, list).id, reward };
    },
  };
}

// → { select?: true, fight?: true } — UI 가 다음에 무엇을 해야 하는지
export function chooseEvent(run, idx) {
  const st = run.event;
  if (!st || st.page !== 'start') return null;
  const ch = eventChoices(run)[idx];
  if (!ch || ch.disabled) return null;
  const res = ch.apply(eventApi(run), st.data) ?? {};
  st.page = 'result';
  st.result = res.text ?? null;
  return { select: !!run.pendingSelect, fight: !!st.fight };
}

export function selectableFor(run, spec = run.pendingSelect) {
  if (!spec) return [];
  if (spec.filter === 'curse') return run.deck.filter((c) => cardDef(c.id).pool === 'curse');
  if (spec.action === 'upgrade') return run.deck.filter(canUpgrade);
  if (spec.action === 'transform' || spec.action === 'remove') return run.deck.filter((c) => cardDef(c.id).rarity !== 'special' || cardDef(c.id).pool === 'curse');
  return run.deck.slice();
}

export function resolveSelect(run, uids) {
  const spec = run.pendingSelect;
  if (!spec) return false;
  run.pendingSelect = null;
  const rng = run.rng.event;
  for (const uid of uids.slice(0, spec.count ?? 1)) {
    const i = run.deck.findIndex((c) => c.uid === uid);
    if (i < 0) continue;
    const inst = run.deck[i];
    if (spec.action === 'remove') run.deck.splice(i, 1);
    else if (spec.action === 'upgrade') { if (canUpgrade(inst)) inst.up = 1; }
    else if (spec.action === 'duplicate') run.deck.push(makeInst(run, inst.id, { up: inst.up, swapped: inst.swapped }));
    else if (spec.action === 'swap') { inst.swapped = !inst.swapped; inst.rev = inst.swapped; }
    else if (spec.action === 'transform') {
      const d = cardDef(inst.id);
      const pool = cardPool(run, d.pool === 'neutral' || d.pool === 'basic' || d.pool === 'curse' ? run.char : d.pool).filter((x) => x.id !== inst.id);
      if (pool.length) run.deck[i] = makeInst(run, pick(rng, pool).id);
    }
  }
  return true;
}

export function startEventFight(run) {
  const f = run.event?.fight;
  if (!f) return null;
  run.event = null;
  run.encCount++;
  return startFight(run, f.enc, 'event', f.reward);
}

// ── 종료 ────────────────────────────────────────────────────────────────
export function endRun(run, won) {
  run.combat = null;
  run.result = {
    won, char: run.char, omen: run.omen ?? 0, act: run.act, floor: run.floor,
    elites: run.stats.elites, bosses: run.stats.bosses, kills: run.stats.kills ?? 0,
    act1Boss: !!run.stats.act1Boss, applied: false, meta: null,
  };
  run.screen = 'result';
}
