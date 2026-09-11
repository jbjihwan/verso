// 바보(The Fool) 카드 — 정체성: 뒤집기 엔진("뒤집힐 때", 추가 뒤집기, 방어도·힘)
// 텍스트의 [[...]] 는 키워드 강조 표기다.
export const CARDS = [
  // ── 시작 카드 ──
  {
    id: 'somersault', pool: 'fool', rarity: 'basic', art: 'wheel',
    faces: [
      {
        name: { ko: '공중제비', en: 'Somersault' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 6 }, upg: { blk: 9 }, tips: ['flip'],
        text: {
          ko: (v) => `방어도를 ${v.blk} 얻습니다. 손패의 카드 1장을 [[뒤집습니다]].`,
          en: (v) => `Gain ${v.blk} Block. [[Flip]] a card in your hand.`,
        },
        play: (c, v) => { c.block(v.blk); c.choose({ from: 'hand', count: 1, filter: 'flippable', prompt: 'flip' }, 'flip'); },
        resume: { flip: (c, v, picked) => { for (const i of picked) c.flip(i); } },
      },
      {
        name: { ko: '구르기', en: 'Tumble' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 8 }, upg: { dmg: 11 },
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage.` },
        play: (c, v) => c.attack(c.target, v.dmg),
      },
    ],
  },
  {
    id: 'wager', pool: 'fool', rarity: 'basic', art: 'coin',
    faces: [
      {
        name: { ko: '내기', en: 'Wager' }, type: 'skill', cost: 0, target: 'self',
        vals: { n: 1 }, upg: { n: 2 }, tips: ['flip'],
        text: {
          ko: (v) => `[[뒤집기]]를 1회 얻습니다. 카드를 ${v.n}장 뽑습니다.`,
          en: (v) => `Gain 1 [[Flip]]. Draw ${v.n} card${v.n > 1 ? 's' : ''}.`,
        },
        play: (c, v) => { c.flips(1); c.draw(v.n); },
      },
      {
        name: { ko: '배당', en: 'Payout' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 3 }, upg: { dmg: 4 },
        calc: (cs, v) => { v.hits = cs.cnt.flips; },
        text: {
          ko: (v) => `이번 턴에 뒤집힌 카드 1장마다 피해를 ${v.dmg} 줍니다.${v.hits != null ? ` (${v.hits}회)` : ''}`,
          en: (v) => `Deal ${v.dmg} damage for each card flipped this turn.${v.hits != null ? ` (${v.hits}×)` : ''}`,
        },
        play: (c, v) => c.attack(c.target, v.dmg, v.hits ?? c.cs.cnt.flips),
      },
    ],
  },
];
