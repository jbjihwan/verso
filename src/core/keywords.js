// 카드 키워드 설명(툴팁용)
export const KEYWORDS = {
  steady: {
    name: { ko: '고정', en: 'Steady' },
    desc: { ko: '사용해도 뒤집히지 않습니다.', en: 'Doesn’t flip when played.' },
  },
  vanish: {
    name: { ko: '소멸', en: 'Vanish' },
    desc: { ko: '사용하면 이번 전투에서 제거됩니다.', en: 'Removed from this combat when played.' },
  },
  retain: {
    name: { ko: '보존', en: 'Retain' },
    desc: { ko: '턴이 끝나도 버려지지 않습니다.', en: 'Isn’t discarded at the end of your turn.' },
  },
  innate: {
    name: { ko: '선천', en: 'Innate' },
    desc: { ko: '전투를 시작할 때 반드시 손에 들어옵니다.', en: 'Always part of your opening hand.' },
  },
  ethereal: {
    name: { ko: '덧없음', en: 'Ethereal' },
    desc: { ko: '턴이 끝날 때 손에 있으면 소멸합니다.', en: 'If it’s in your hand at the end of your turn, it vanishes.' },
  },
  unplayable: {
    name: { ko: '사용 불가', en: 'Unplayable' },
    desc: { ko: '사용할 수 없습니다.', en: 'Can’t be played.' },
  },
  stuck: {
    name: { ko: '걸림', en: 'Stuck' },
    desc: { ko: '이번 턴에는 뒤집을 수 없습니다.', en: 'Can’t be flipped this turn.' },
  },
  discharge: {
    name: { ko: '방출', en: 'Discharge' },
    desc: { ko: '충전을 모두 소모하고, 소모한 만큼 효과가 커집니다.', en: 'Spend all Charge. The effect grows with the Charge spent.' },
  },
  onFlip: {
    name: { ko: '뒤집힐 때', en: 'On flip' },
    desc: { ko: '어떤 이유로든 이 카드가 뒤집히면 발동합니다.', en: 'Triggers whenever this card is turned over, for any reason.' },
  },
  flip: {
    name: { ko: '뒤집기', en: 'Flip' },
    desc: {
      ko: '카드를 180° 돌려 반대 면으로 바꿉니다. 턴마다 무료 뒤집기 1회가 주어집니다.',
      en: 'Turn a card 180° to its other face. You get one free Flip each turn.',
    },
  },
};
