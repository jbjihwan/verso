// 2막 — 가라앉은 궁정(컵). 일반 5 · 정예 2 · 보스 2
import { choose, cycle } from '../../ai.js';

const hit = (c, e, m) => c.attack(c.player, m.dmg, m.times ?? 1);
const say = (c, e, ko, en) => c.ev({ t: 'announce', uid: e.uid, text: { ko, en } });
const flipYourHand = { ko: '다음 턴 시작에 손패 전체가 뒤집힙니다.', en: 'At the start of your next turn, your whole hand flips.' };
const flipper = {
  playerTurnStart(c, e) {
    if (!e.mem.flip) return;
    e.mem.flip = false;
    say(c, e, '뒤집혀라!', 'Turn over!');
    c.flipHand();
  },
};

export const ENEMIES = [
  // ── 일반 ───────────────────────────────────────────────────────────────
  {
    id: 'brineEel', act: 2, tier: 'normal', art: 'eel', size: 'md', hp: [38, 44],
    name: { ko: '소금물 장어', en: 'Brine Eel' },
    moves: {
      bite: { intent: 'attack', dmg: 11, run: hit },
      coil: { intent: 'buff', run: (c, e) => { c.block(8); c.apply(e, 'might', 1); } },
      lunge: { intent: 'attack', dmg: 6, times: 2, run: hit },
    },
    ai: (e, rng) => choose(e, rng, [['bite', 40], ['coil', 25], ['lunge', 35]], { max: { coil: 1, bite: 2, lunge: 2 } }),
  },
  {
    id: 'chaliceMimic', act: 2, tier: 'normal', art: 'mimic', size: 'md', hp: [46, 52],
    name: { ko: '성배 미믹', en: 'Chalice Mimic' },
    moves: {
      gulp: { intent: 'attack', dmg: 14, run: hit },
      spill: { intent: 'debuff', run: (c) => { c.apply(c.player, 'weak', 2); c.apply(c.player, 'brittle', 2); } },
      lid: { intent: 'block', run: (c) => c.block(14) },
    },
    ai: (e) => cycle(e, ['lid', 'gulp', 'spill', 'gulp']),
  },
  {
    id: 'tideWraith', act: 2, tier: 'normal', art: 'wraith', size: 'md', hp: [34, 38],
    name: { ko: '조수 망령', en: 'Tide Wraith' },
    moves: {
      undertow: { intent: 'attackDebuff', dmg: 7, desc: flipYourHand, run: (c, e, m) => { c.attack(c.player, m.dmg); e.mem.flip = true; } },
      wail: { intent: 'debuff', run: (c) => c.apply(c.player, 'exposed', 2) },
      drain: { intent: 'attack', dmg: 9, desc: { ko: '체력을 4 회복합니다.', en: 'Heals 4 HP.' }, run: (c, e, m) => { c.attack(c.player, m.dmg); c.heal(e, 4); } },
    },
    hooks: flipper,
    ai: (e, rng) => choose(e, rng, [['undertow', 35], ['wail', 25], ['drain', 40]], { max: { undertow: 1, wail: 1, drain: 2 } }),
  },
  {
    id: 'coralSoldier', act: 2, tier: 'normal', art: 'coral', size: 'md', hp: [42, 48],
    name: { ko: '산호 병졸', en: 'Coral Soldier' },
    moves: {
      spear: { intent: 'attack', dmg: 12, run: hit },
      brace: { intent: 'block', run: (c, e) => { c.block(10); c.apply(e, 'thorns', 2); } },
      thrust: { intent: 'attack', dmg: 7, times: 2, run: hit },
    },
    ai: (e) => cycle(e, ['spear', 'brace', 'thrust']),
  },
  {
    id: 'lamprey', act: 2, tier: 'normal', art: 'lamprey', size: 'sm', hp: [20, 24],
    name: { ko: '칠성장어', en: 'Lamprey' },
    moves: {
      latch: { intent: 'attackDebuff', dmg: 4, run: (c, e, m) => { c.attack(c.player, m.dmg); c.apply(c.player, 'venom', 2); } },
      swarm: { intent: 'attack', dmg: 3, times: 3, run: hit },
    },
    ai: (e, rng) => choose(e, rng, [['latch', 50], ['swarm', 50]], { max: 2 }),
  },

  // ── 정예 ───────────────────────────────────────────────────────────────
  {
    id: 'knightCups', act: 2, tier: 'elite', art: 'knightCups', size: 'lg', hp: [100, 110],
    name: { ko: '컵의 기사', en: 'Knight of Cups' },
    moves: {
      toast: { intent: 'buff', desc: { ko: '재생 4와 방어도 10을 얻습니다.', en: 'Gains 4 Regen and 10 Block.' }, run: (c, e) => { c.apply(e, 'regen', 4); c.block(10); } },
      pour: { intent: 'attack', dmg: 17, run: hit },
      splash: { intent: 'attackDebuff', dmg: 6, times: 3, run: (c, e, m) => { c.attack(c.player, m.dmg, 3); c.apply(c.player, 'weak', 1); } },
    },
    ai: (e) => cycle(e, ['toast', 'pour', 'splash', 'pour']),
  },
  {
    id: 'queenCups', act: 2, tier: 'elite', art: 'queenCups', size: 'lg', hp: [92, 98],
    name: { ko: '컵의 여왕', en: 'Queen of Cups' },
    passive: { name: { ko: '물비늘', en: 'Reflection' }, desc: { ko: '가시 4를 가지고 시작합니다.', en: 'Starts with 4 Thorns.' } },
    start: (c, e) => c.apply(e, 'thorns', 4),
    moves: {
      mirror: { intent: 'debuff', desc: flipYourHand, run: (c, e) => { e.mem.flip = true; c.apply(c.player, 'brittle', 2); } },
      tide: { intent: 'attack', dmg: 15, run: hit },
      drink: { intent: 'buff', desc: { ko: '체력을 12 회복하고 힘을 2 얻습니다.', en: 'Heals 12 HP and gains 2 Might.' }, run: (c, e) => { c.heal(e, 12); c.apply(e, 'might', 2); } },
    },
    hooks: flipper,
    ai: (e) => cycle(e, ['tide', 'mirror', 'tide', 'drink']),
  },

  // ── 보스 ───────────────────────────────────────────────────────────────
  {
    id: 'hangedMan', act: 2, tier: 'boss', art: 'hangedMan', size: 'xl', hp: [240, 240], numeral: 'XII',
    name: { ko: '매달린 사람', en: 'The Hanged Man' },
    passive: {
      name: { ko: '도치', en: 'Inversion' },
      desc: { ko: '당신의 턴이 시작될 때마다 손패 전체가 뒤집힙니다.', en: 'At the start of each of your turns, your whole hand flips.' },
    },
    moves: {
      lash: { intent: 'attack', dmg: 8, times: 2, run: hit },
      suspend: { intent: 'block', desc: { ko: '방어도를 18 얻고 약화를 2 부여합니다.', en: 'Gains 18 Block and applies 2 Weak.' }, run: (c) => { c.block(18); c.apply(c.player, 'weak', 2); } },
      epiphany: { intent: 'buff', desc: { ko: '체력을 15 회복하고 힘을 3 얻습니다.', en: 'Heals 15 HP and gains 3 Might.' }, run: (c, e) => { c.heal(e, 15); c.apply(e, 'might', 3); } },
      noose: { intent: 'attack', dmg: 16, run: hit },
    },
    hooks: {
      playerTurnStart(c) { c.flipHand(); },
    },
    ai: (e) => cycle(e, ['lash', 'suspend', 'noose', 'epiphany']),
  },
  {
    id: 'priestess', act: 2, tier: 'boss', art: 'priestess', size: 'xl', hp: [220, 220], numeral: 'II',
    name: { ko: '여사제', en: 'The High Priestess' },
    passive: {
      name: { ko: '두 기둥', en: 'Two Pillars' },
      desc: { ko: '매 턴 자세를 바꿉니다. 정방향일 때는 가시 5로 몸을 감싸고, 역방향일 때는 매섭게 공격합니다.', en: 'She changes stance every turn: upright she is wrapped in 5 Thorns, reversed she strikes hard.' },
    },
    start: (c, e) => c.apply(e, 'thorns', 5),
    moves: {
      veil: {
        intent: 'block', desc: { ko: '방어도를 20 얻고 역방향으로 뒤집힙니다.', en: 'Gains 20 Block, then turns Reversed.' },
        run: (c, e) => {
          c.block(20);
          c.stance(e, 1);
          if (e.st.thorns) c.apply(e, 'thorns', -e.st.thorns);
        },
      },
      moonbeam: { intent: 'attack', dmg: 24, run: (c, e, m) => { c.attack(c.player, m.dmg); c.stance(e, 0); c.apply(e, 'thorns', 5); } },
      tides: {
        intent: 'attackDebuff', dmg: 10,
        run: (c, e, m) => {
          c.attack(c.player, m.dmg);
          c.apply(c.player, 'exposed', 2);
          c.apply(c.player, 'brittle', 2);
          c.stance(e, 0);
          c.apply(e, 'thorns', 5);
        },
      },
    },
    ai: (e) => (e.stance === 0 ? 'veil' : cycle(e, ['moonbeam', 'tides'], 'r')),
  },
];
