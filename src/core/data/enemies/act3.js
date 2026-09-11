// 3막 — 유리 성채(소드). 일반 5 · 정예 2 · 보스 2
import { choose, cycle } from '../../ai.js';

const hit = (c, e, m) => c.attack(c.player, m.dmg, m.times ?? 1);
const say = (c, e, ko, en) => c.ev({ t: 'announce', uid: e.uid, text: { ko, en } });

export const ENEMIES = [
  // ── 일반 ───────────────────────────────────────────────────────────────
  {
    id: 'bladeDancer', act: 3, tier: 'normal', art: 'dancer', size: 'md', hp: [48, 54],
    name: { ko: '칼춤꾼', en: 'Blade Dancer' },
    moves: {
      flurry: { intent: 'attack', dmg: 4, times: 4, run: hit },
      feint: { intent: 'attackBlock', dmg: 6, run: (c, e, m) => { c.attack(c.player, m.dmg); c.block(12); } },
      riposte: { intent: 'attack', dmg: 16, run: hit },
    },
    ai: (e) => cycle(e, ['flurry', 'feint', 'riposte']),
  },
  {
    id: 'galeHawk', act: 3, tier: 'normal', art: 'hawk', size: 'sm', hp: [30, 36],
    name: { ko: '돌풍 매', en: 'Gale Hawk' },
    moves: {
      dive: { intent: 'attack', dmg: 13, run: hit },
      gust: {
        intent: 'debuff', desc: { ko: '약화 1을 부여하고, 다음 턴 시작에 손패 전체를 뒤집습니다.', en: 'Applies 1 Weak. At the start of your next turn, your whole hand flips.' },
        run: (c, e) => { c.apply(c.player, 'weak', 1); e.mem.flip = true; },
      },
      talon: { intent: 'attack', dmg: 6, times: 2, run: hit },
    },
    hooks: {
      playerTurnStart(c, e) {
        if (!e.mem.flip) return;
        e.mem.flip = false;
        say(c, e, '돌풍!', 'Gust!');
        c.flipHand();
      },
    },
    ai: (e, rng) => choose(e, rng, [['dive', 40], ['gust', 25], ['talon', 35]], { max: { gust: 1, dive: 2, talon: 2 } }),
  },
  {
    id: 'mirrorSentry', act: 3, tier: 'normal', art: 'sentry', size: 'lg', hp: [60, 66],
    name: { ko: '거울 파수꾼', en: 'Mirror Sentry' },
    passive: { name: { ko: '거울 갑주', en: 'Mirror Mail' }, desc: { ko: '수호 2를 가지고 시작합니다.', en: 'Starts with 2 Ward.' } },
    start: (c, e) => c.apply(e, 'ward', 2),
    moves: {
      reflect: { intent: 'block', run: (c, e) => { c.block(16); c.apply(e, 'thorns', 3); } },
      beam: { intent: 'attack', dmg: 18, run: hit },
      shatter: { intent: 'attack', dmg: 9, times: 2, run: hit },
    },
    ai: (e) => cycle(e, ['beam', 'reflect', 'shatter']),
  },
  {
    id: 'shardGolem', act: 3, tier: 'normal', art: 'golem', size: 'lg', hp: [70, 78],
    name: { ko: '파편 골렘', en: 'Shard Golem' },
    moves: {
      slam: { intent: 'attack', dmg: 20, run: hit },
      splinter: {
        intent: 'debuff', desc: { ko: '버린 더미에 상처를 2장 섞습니다.', en: 'Shuffles 2 Wounds into your discard pile.' },
        run: (c) => { c.addCard('wound', 'discard'); c.addCard('wound', 'discard'); },
      },
      harden: { intent: 'block', run: (c) => c.block(20) },
    },
    ai: (e) => cycle(e, ['harden', 'slam', 'splinter', 'slam']),
  },
  {
    id: 'oathbreaker', act: 3, tier: 'normal', art: 'oathbreaker', size: 'md', hp: [50, 56],
    name: { ko: '맹세파기자', en: 'Oathbreaker' },
    moves: {
      betray: { intent: 'attackBlock', dmg: 10, desc: { ko: '힘을 2 얻습니다.', en: 'Gains 2 Might.' }, run: (c, e, m) => { c.attack(c.player, m.dmg); c.apply(e, 'might', 2); } },
      forsake: {
        intent: 'debuff', desc: { ko: '손에 상처를 1장 넣고 약화를 1 부여합니다.', en: 'Adds a Wound to your hand and applies 1 Weak.' },
        run: (c) => { c.addCard('wound', 'hand'); c.apply(c.player, 'weak', 1); },
      },
      execute: { intent: 'attack', dmg: 16, run: hit },
    },
    ai: (e, rng) => choose(e, rng, [['betray', 35], ['forsake', 25], ['execute', 40]], { max: { forsake: 1, betray: 1, execute: 2 } }),
  },

  // ── 정예 ───────────────────────────────────────────────────────────────
  {
    id: 'knightSwords', act: 3, tier: 'elite', art: 'knightSwords', size: 'lg', hp: [130, 140],
    name: { ko: '소드의 기사', en: 'Knight of Swords' },
    moves: {
      cut: { intent: 'attack', dmg: 21, run: hit },
      charge: { intent: 'attack', dmg: 6, times: 4, run: hit },
      rush: { intent: 'buff', desc: { ko: '힘을 3, 방어도를 14 얻습니다.', en: 'Gains 3 Might and 14 Block.' }, run: (c, e) => { c.apply(e, 'might', 3); c.block(14); } },
    },
    ai: (e) => cycle(e, ['cut', 'charge', 'rush']),
  },
  {
    id: 'kingSwords', act: 3, tier: 'elite', art: 'kingSwords', size: 'xl', hp: [150, 160],
    name: { ko: '소드의 왕', en: 'King of Swords' },
    passive: { name: { ko: '왕의 위엄', en: 'Sovereign' }, desc: { ko: '턴이 끝날 때마다 힘을 1 얻습니다.', en: 'Gains 1 Might at the end of each turn.' } },
    start: (c, e) => c.apply(e, 'ascend', 1),
    moves: {
      judgement: { intent: 'attack', dmg: 22, run: hit },
      guard: { intent: 'block', run: (c) => c.block(25) },
      decree: { intent: 'debuff', run: (c) => { c.apply(c.player, 'weak', 2); c.apply(c.player, 'exposed', 2); } },
    },
    ai: (e) => cycle(e, ['decree', 'judgement', 'guard', 'judgement']),
  },

  // ── 보스 ───────────────────────────────────────────────────────────────
  {
    id: 'tower', act: 3, tier: 'boss', art: 'tower', size: 'xl', hp: [300, 300], numeral: 'XVI',
    name: { ko: '탑', en: 'The Tower' },
    passive: {
      name: { ko: '붕괴', en: 'Collapse' },
      desc: { ko: '체력이 2/3와 1/3 아래로 떨어질 때마다 무너집니다: 뽑을 더미에 잔해를 3장 섞고 힘을 2 얻습니다.', en: 'Each time its HP drops below 2/3 and 1/3 it collapses: 3 Rubble into your draw pile, and it gains 2 Might.' },
    },
    moves: {
      fortify: { intent: 'block', run: (c) => c.block(30) },
      lightning: { intent: 'attack', dmg: 26, run: hit },
      crumble: {
        intent: 'attackDebuff', dmg: 6, times: 3,
        desc: { ko: '뽑을 더미에 잔해를 1장 섞습니다.', en: 'Shuffles a Rubble into your draw pile.' },
        run: (c, e, m) => { c.attack(c.player, m.dmg, 3); c.addCard('rubble', 'draw'); },
      },
    },
    hooks: {
      hpLost(c, e) {
        for (const [key, frac] of [['c1', 2 / 3], ['c2', 1 / 3]]) {
          if (e.mem[key] || e.hp > e.maxHp * frac) continue;
          e.mem[key] = true;
          say(c, e, '붕괴!', 'Collapse!');
          for (let i = 0; i < 3; i++) c.addCard('rubble', 'draw');
          c.apply(e, 'might', 2);
        }
      },
    },
    ai: (e) => cycle(e, ['fortify', 'lightning', 'crumble']),
  },
  {
    id: 'justice', act: 3, tier: 'boss', art: 'justice', size: 'xl', hp: [280, 280], numeral: 'XI',
    name: { ko: '정의', en: 'Justice' },
    passive: {
      name: { ko: '저울', en: 'The Scales' },
      desc: {
        ko: '당신의 턴이 끝날 때 이번 턴에 준 피해와 얻은 방어도를 잽니다. 피해가 더 많으면 힘 2를, 방어도가 더 많으면 방어도 14를 얻습니다.',
        en: 'At the end of your turn she weighs the damage you dealt against the Block you gained. More damage: she gains 2 Might. More Block: she gains 14 Block.',
      },
    },
    moves: {
      verdict: { intent: 'attack', dmg: 22, run: hit },
      sentence: { intent: 'attackDebuff', dmg: 9, times: 2, run: (c, e, m) => { c.attack(c.player, m.dmg, 2); c.apply(c.player, 'weak', 1); } },
      balance: { intent: 'buff', desc: { ko: '체력을 12 회복하고 방어도를 12 얻습니다.', en: 'Heals 12 HP and gains 12 Block.' }, run: (c, e) => { c.heal(e, 12); c.block(12); } },
    },
    hooks: {
      playerTurnEnd(c, e) {
        const dealt = c.cs.cnt.dmgDealt;
        const blocked = c.cs.cnt.blkGained;
        if (dealt > blocked) { say(c, e, '응보', 'Retribution'); c.apply(e, 'might', 2); }
        else if (blocked > dealt) { say(c, e, '면죄', 'Absolution'); c.gainBlock(e, 14); }
      },
    },
    ai: (e) => cycle(e, ['verdict', 'sentence', 'balance']),
  },
];
