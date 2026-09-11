// 유물 정의. hooks(ctx, rs, ...): rs 는 이 유물의 런 단위 상태(카운터 등).
// mod: 숫자(energy/flips/draw/potency/xBonus) 또는 보정 함수(dmgOut/debuffOut/…).
export const RELICS = [
  // ── 시작 유물 ──
  {
    id: 'wornCoin', rarity: 'starter', char: 'fool', art: 'coin',
    name: { ko: '닳은 동전', en: 'Worn Coin' },
    desc: { ko: '무료 뒤집기를 쓸 때마다 방어도를 3 얻습니다.', en: 'Whenever you use a free Flip, gain 3 Block.' },
    hooks: { manualFlip(ctx) { ctx.gainBlock('player', 3); } },
  },
  {
    id: 'silverWand', rarity: 'starter', char: 'magician', art: 'wand',
    name: { ko: '은빛 지팡이', en: 'Silver Wand' },
    desc: { ko: '전투를 시작할 때 충전을 2 얻습니다.', en: 'Start each combat with 2 Charge.' },
    hooks: { combatStart(ctx) { ctx.charge(2); } },
  },
];
