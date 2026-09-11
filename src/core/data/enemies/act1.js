// 1막 — 잿불 황야(완드). 일반 5 · 정예 2 · 보스 2 (Task 7 에서 채운다)
import { choose, cycle } from '../../ai.js';

const hitPlayer = (c, e, m) => c.attack(c.player, m.dmg, m.times ?? 1);

export const ENEMIES = [
  {
    id: 'cinderImp', act: 1, tier: 'normal', art: 'imp', size: 'sm', hp: [12, 16],
    name: { ko: '불씨 도깨비', en: 'Cinder Imp' },
    moves: {
      scratch: { intent: 'attack', dmg: 5, run: hitPlayer },
      kindle: { intent: 'buff', run: (c, e) => c.apply(e, 'might', 2) },
    },
    ai: (e, rng) => choose(e, rng, [['scratch', 60], ['kindle', 40]], { max: { scratch: 2, kindle: 1 } }),
  },
  {
    id: 'torchbearer', act: 1, tier: 'normal', art: 'torchbearer', size: 'md', hp: [40, 44],
    name: { ko: '횃불지기', en: 'Torchbearer' },
    moves: {
      smoke: { intent: 'debuff', run: (c) => c.apply(c.player, 'weak', 2) },
      brand: { intent: 'attack', dmg: 11, run: hitPlayer },
      stoke: { intent: 'attackBlock', dmg: 6, run: (c, e, m) => { c.attack(c.player, m.dmg); c.block(6); } },
    },
    ai: (e) => cycle(e, ['smoke', 'brand', 'stoke', 'brand']),
  },
];
