// 1막 — 잿불 황야(완드). 일반 5 · 정예 2 · 보스 2
import { choose, cycle } from '../../ai.js';
import { int } from '../../rng.js';

const hit = (c, e, m) => c.attack(c.player, m.dmg, m.times ?? 1);
const say = (c, e, ko, en) => c.ev({ t: 'announce', uid: e.uid, text: { ko, en } });

export const ENEMIES = [
  // ── 일반 ───────────────────────────────────────────────────────────────
  {
    id: 'cinderImp', act: 1, tier: 'normal', art: 'imp', size: 'sm', hp: [12, 16],
    name: { ko: '불씨 도깨비', en: 'Cinder Imp' },
    moves: {
      scratch: { intent: 'attack', dmg: 5, run: hit },
      kindle: { intent: 'buff', run: (c, e) => c.apply(e, 'might', 2) },
    },
    ai: (e, rng) => choose(e, rng, [['scratch', 60], ['kindle', 40]], { max: { scratch: 2, kindle: 1 } }),
  },
  {
    id: 'torchbearer', act: 1, tier: 'normal', art: 'torchbearer', size: 'md', hp: [40, 44],
    name: { ko: '횃불지기', en: 'Torchbearer' },
    moves: {
      smoke: { intent: 'debuff', run: (c) => c.apply(c.player, 'weak', 2) },
      brand: { intent: 'attack', dmg: 11, run: hit },
      stoke: { intent: 'attackBlock', dmg: 6, run: (c, e, m) => { c.attack(c.player, m.dmg); c.block(6); } },
    },
    ai: (e) => cycle(e, ['smoke', 'brand', 'stoke', 'brand']),
  },
  {
    id: 'kindleBeetle', act: 1, tier: 'normal', art: 'beetle', size: 'sm', hp: [22, 26],
    name: { ko: '불쏘시개 풍뎅이', en: 'Kindle Beetle' },
    moves: {
      roll: { intent: 'attack', dmg: 4, times: 2, run: hit },
      harden: { intent: 'block', run: (c) => c.block(9) },
      ignite: {
        intent: 'attackDebuff', dmg: 8,
        desc: { ko: '버린 더미에 재를 1장 섞습니다.', en: 'Shuffles an Ash into your discard pile.' },
        run: (c, e, m) => { c.attack(c.player, m.dmg); c.addCard('ash', 'discard'); },
      },
    },
    ai: (e, rng) => choose(e, rng, [['roll', 40], ['harden', 25], ['ignite', 35]], { max: { harden: 1, ignite: 1, roll: 2 } }),
  },
  {
    id: 'ashWisp', act: 1, tier: 'normal', art: 'wisp', size: 'sm', hp: [16, 20],
    name: { ko: '재 도깨비불', en: 'Ash Wisp' },
    passive: { name: { ko: '잉걸불', en: 'Embers' }, desc: { ko: '가시 2를 가지고 시작합니다.', en: 'Starts with 2 Thorns.' } },
    start: (c, e) => c.apply(e, 'thorns', 2),
    moves: {
      flicker: { intent: 'attack', dmg: 6, run: hit },
      smother: {
        intent: 'debuff',
        desc: { ko: '뽑을 더미에 재를 섞고 허약을 1 부여합니다.', en: 'Shuffles an Ash into your draw pile and applies 1 Brittle.' },
        run: (c) => { c.addCard('ash', 'draw'); c.apply(c.player, 'brittle', 1); },
      },
    },
    ai: (e, rng) => choose(e, rng, [['flicker', 60], ['smother', 40]], { max: 2 }),
  },
  {
    id: 'thornling', act: 1, tier: 'normal', art: 'thornling', size: 'md', hp: [30, 34],
    name: { ko: '가시덤불이', en: 'Thornling' },
    passive: { name: { ko: '가시덤불', en: 'Bramble' }, desc: { ko: '가시 3을 가지고 시작합니다.', en: 'Starts with 3 Thorns.' } },
    start: (c, e) => c.apply(e, 'thorns', 3),
    moves: {
      lash: { intent: 'attack', dmg: 7, run: hit },
      grow: { intent: 'buff', run: (c, e) => { c.apply(e, 'thorns', 1); c.block(5); } },
      entangle: {
        intent: 'debuff',
        desc: { ko: '다음 턴에 손패 2장이 걸림 상태가 되어 뒤집을 수 없습니다.', en: 'Next turn, 2 cards in your hand become Stuck and cannot be flipped.' },
        run: (c, e) => { e.mem.tangle = 2; },
      },
    },
    hooks: {
      playerTurnStart(c, e) {
        if (!e.mem.tangle) return;
        const free = c.cs.piles.hand.filter((i) => !i.stuck);
        for (let k = 0; k < e.mem.tangle && free.length; k++) {
          const inst = free.splice(int(c.rng, 0, free.length - 1), 1)[0];
          inst.stuck = true;
          c.ev({ t: 'stuck', uid: inst.uid });
        }
        e.mem.tangle = 0;
      },
    },
    ai: (e, rng) => choose(e, rng, [['lash', 50], ['grow', 25], ['entangle', 25]], { max: { entangle: 1, grow: 1, lash: 2 } }),
  },

  // ── 정예 ───────────────────────────────────────────────────────────────
  {
    id: 'knightWands', act: 1, tier: 'elite', art: 'knightWands', size: 'lg', hp: [78, 84],
    name: { ko: '완드의 기사', en: 'Knight of Wands' },
    passive: {
      name: { ko: '뒤집히는 기세', en: 'Turning Charge' },
      desc: { ko: '두 번 행동할 때마다 자세가 뒤집힙니다. 정방향은 돌격, 역방향은 방비.', en: 'Every two actions its stance flips: upright it charges, reversed it braces.' },
    },
    moves: {
      lance: { intent: 'attack', dmg: 14, run: hit },
      trample: { intent: 'attackDebuff', dmg: 7, times: 2, run: (c, e, m) => { c.attack(c.player, m.dmg, 2); c.apply(c.player, 'weak', 1); } },
      rear: { intent: 'block', run: (c, e) => { c.block(16); c.apply(e, 'thorns', 3); } },
      kick: { intent: 'attack', dmg: 10, run: hit },
    },
    hooks: {},
    after(c, e) {
      e.mem.acts = (e.mem.acts ?? 0) + 1;
      if (e.mem.acts % 2 === 0) {
        c.stance(e, 1 - e.stance);
        if (e.stance === 0 && e.st.thorns) c.apply(e, 'thorns', -e.st.thorns);
      }
    },
    ai: (e) => (e.stance === 0 ? cycle(e, ['lance', 'trample'], 'u') : cycle(e, ['rear', 'kick'], 'r')),
  },
  {
    id: 'queenWands', act: 1, tier: 'elite', art: 'queenWands', size: 'lg', hp: [64, 70],
    name: { ko: '완드의 여왕', en: 'Queen of Wands' },
    passive: { name: { ko: '불씨의 궁정', en: 'Court of Cinders' }, desc: { ko: '불씨 도깨비를 불러냅니다. 여왕이 쓰러지면 모두 달아납니다.', en: 'Summons Cinder Imps. They flee when she falls.' } },
    start: (c) => c.summon('cinderImp'),
    moves: {
      summon: { intent: 'summon', run: (c) => c.summon('cinderImp') },
      scepter: { intent: 'attack', dmg: 10, run: hit },
      blaze: { intent: 'buff', desc: { ko: '모든 적이 힘을 2 얻습니다.', en: 'All enemies gain 2 Might.' }, run: (c) => { for (const x of c.enemiesAlive()) c.apply(x, 'might', 2); } },
    },
    ai: (e, rng, cs) => {
      const minions = cs.enemies.filter((x) => x.minion && !x.dead).length;
      if (minions < 2 && e.hist[e.hist.length - 1] !== 'summon') return 'summon';
      return choose(e, rng, [['scepter', 65], ['blaze', 35]], { max: { blaze: 1, scepter: 2 } });
    },
  },

  // ── 보스 ───────────────────────────────────────────────────────────────
  {
    id: 'chariot', act: 1, tier: 'boss', art: 'chariot', size: 'xl', hp: [180, 180], numeral: 'VII',
    name: { ko: '전차', en: 'The Chariot' },
    passive: {
      name: { ko: '폭주', en: 'Runaway' },
      desc: { ko: '체력이 절반 아래로 떨어지면 역방향으로 뒤집혀 방어를 버리고 몰아칩니다.', en: 'Below half HP it flips Reversed: it drops its guard and runs wild.' },
    },
    moves: {
      revUp: { intent: 'buff', desc: { ko: '힘을 2, 방어도를 12 얻습니다.', en: 'Gains 2 Might and 12 Block.' }, run: (c, e) => { c.apply(e, 'might', 2); c.block(12); } },
      charge: { intent: 'attack', dmg: 8, times: 2, run: hit },
      trample: { intent: 'attackDebuff', dmg: 20, run: (c, e, m) => { c.attack(c.player, m.dmg); c.apply(c.player, 'exposed', 1); } },
      wheelspin: { intent: 'attack', dmg: 6, times: 3, run: hit },
      crash: {
        intent: 'attack', dmg: 30,
        desc: { ko: '스스로도 체력을 10 잃습니다.', en: 'Also loses 10 HP itself.' },
        run: (c, e, m) => { c.attack(c.player, m.dmg); c.loseHp(e, 10); },
      },
    },
    hooks: {
      hpLost(c, e) {
        if (e.mem.runaway || e.hp > e.maxHp / 2) return;
        e.mem.runaway = true;
        c.stance(e, 1);
        say(c, e, '폭주!', 'Runaway!');
        if (e.block) { e.block = 0; c.ev({ t: 'block', target: e.uid, amount: 0, block: 0, reset: true }); }
        e.move = 'wheelspin';
        c.ev({ t: 'intent', uid: e.uid, move: e.move });
      },
    },
    ai: (e) => (e.stance === 0 ? cycle(e, ['revUp', 'charge', 'trample'], 'u') : cycle(e, ['crash', 'wheelspin'], 'r')),
  },
  {
    id: 'hermit', act: 1, tier: 'boss', art: 'hermit', size: 'xl', hp: [160, 160], numeral: 'IX',
    name: { ko: '은둔자', en: 'The Hermit' },
    passive: {
      name: { ko: '은거', en: 'Seclusion' },
      desc: { ko: '방어도가 사라지지 않고 쌓입니다. 시간이 갈수록 강해집니다.', en: 'Its Block never fades, and it grows stronger over time.' },
    },
    start: (c, e) => c.apply(e, 'bulwark', 1),
    moves: {
      wait: { intent: 'buff', desc: { ko: '방어도를 12, 힘을 1 얻습니다.', en: 'Gains 12 Block and 1 Might.' }, run: (c, e) => { c.block(12); c.apply(e, 'might', 1); } },
      staff: { intent: 'attack', dmg: 11, run: hit },
      lantern: {
        intent: 'attackDebuff', dmg: 6,
        desc: { ko: '뽑을 더미에 현기증을 2장 섞습니다.', en: 'Shuffles 2 Vertigo into your draw pile.' },
        run: (c, e, m) => { c.attack(c.player, m.dmg); c.addCard('vertigo', 'draw'); c.addCard('vertigo', 'draw'); },
      },
    },
    ai: (e) => cycle(e, ['wait', 'staff', 'lantern', 'staff']),
  },
];
