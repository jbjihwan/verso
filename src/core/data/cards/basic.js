// 공용 기본 카드 — 두 캐릭터의 시작 덱에 공통으로 들어간다.
// 역방향 기본기는 "조금 가볍지만 카드를 한 장 뽑는다" — 뒤집힘이 손해가 아니라 선택지가 되게.
export const CARDS = [
  {
    id: 'strike', pool: 'basic', rarity: 'basic', art: 'sword',
    faces: [
      {
        name: { ko: '타격', en: 'Strike' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 6 }, upg: { dmg: 9 },
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage.` },
        play: (c, v) => c.attack(c.target, v.dmg),
      },
      {
        name: { ko: '견제', en: 'Feint' }, type: 'attack', cost: 1, target: 'enemy',
        vals: { dmg: 4 }, upg: { dmg: 6 },
        text: { ko: (v) => `피해를 ${v.dmg} 줍니다. 카드를 1장 뽑습니다.`, en: (v) => `Deal ${v.dmg} damage. Draw 1 card.` },
        play: (c, v) => { c.attack(c.target, v.dmg); c.draw(1); },
      },
    ],
  },
  {
    id: 'guard', pool: 'basic', rarity: 'basic', art: 'shield',
    faces: [
      {
        name: { ko: '방어', en: 'Guard' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 5 }, upg: { blk: 8 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다.`, en: (v) => `Gain ${v.blk} Block.` },
        play: (c, v) => c.block(v.blk),
      },
      {
        name: { ko: '버티기', en: 'Brace' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 3 }, upg: { blk: 5 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다. 카드를 1장 뽑습니다.`, en: (v) => `Gain ${v.blk} Block. Draw 1 card.` },
        play: (c, v) => { c.block(v.blk); c.draw(1); },
      },
    ],
  },
];
