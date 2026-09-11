// 마법사(The Magician) 카드 — 정체성: 정방향으로 충전, 역방향으로 방출. 독.
export const CARDS = [
  // ── 시작 카드 ──
  {
    id: 'spark', pool: 'magician', rarity: 'basic', art: 'bolt',
    faces: [
      {
        name: { ko: '불꽃', en: 'Spark' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 5, ch: 2 }, upg: { dmg: 7 }, tips: ['charge'],
        text: {
          ko: (v) => `피해를 ${v.dmg} 줍니다. [[충전]]을 ${v.ch} 얻습니다.`,
          en: (v) => `Deal ${v.dmg} damage. Gain ${v.ch} [[Charge]].`,
        },
        play: (c, v) => { c.attack(c.target, v.dmg); c.charge(v.ch); },
      },
      {
        name: { ko: '섬광', en: 'Flare' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 4 }, upg: { dmg: 5 }, kw: ['discharge'], tips: ['charge'],
        calc: (cs, v) => { v.n = cs.player.st.charge ?? 0; },
        text: {
          ko: (v) => `[[방출]]: 충전 1마다 피해를 ${v.dmg} 줍니다.${v.n != null ? ` (${v.n}회)` : ''}`,
          en: (v) => `[[Discharge]]: deal ${v.dmg} damage for each Charge.${v.n != null ? ` (${v.n}×)` : ''}`,
        },
        play: (c, v) => { const n = c.discharge(); if (n > 0) c.attack(c.target, v.dmg, n); },
      },
    ],
  },
  {
    id: 'nightshade', pool: 'magician', rarity: 'basic', art: 'leaf',
    faces: [
      {
        name: { ko: '독초', en: 'Nightshade' }, type: 'skill', cost: 1, target: 'enemy',
        vals: { ven: 4 }, upg: { ven: 6 }, tips: ['venom'],
        text: { ko: (v) => `[[독]]을 ${v.ven} 부여합니다.`, en: (v) => `Apply ${v.ven} [[Venom]].` },
        play: (c, v) => c.apply(c.target, 'venom', v.ven),
      },
      {
        name: { ko: '시듦', en: 'Wither' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 5, ch: 2 }, upg: { dmg: 7 }, tips: ['venom', 'charge'],
        text: {
          ko: (v) => `피해를 ${v.dmg} 줍니다. 대상에게 [[독]]이 있으면 [[충전]]을 ${v.ch} 얻습니다.`,
          en: (v) => `Deal ${v.dmg} damage. If the target has [[Venom]], gain ${v.ch} [[Charge]].`,
        },
        play: (c, v) => {
          const had = (c.target.st.venom ?? 0) > 0;
          c.attack(c.target, v.dmg);
          if (had) c.charge(v.ch);
        },
      },
    ],
  },
];
