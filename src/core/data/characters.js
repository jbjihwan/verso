// 캐릭터 정의. 시작 덱의 카드 id 는 data/cards/* 에 정의된다.

export const CHARACTERS = {
  fool: {
    id: 'fool',
    numeral: '0',
    name: { ko: '바보', en: 'The Fool' },
    blurb: {
      ko: '빈손으로 떠도는 방랑자. 뒤집기 자체를 무기로 삼는다.',
      en: 'A wanderer with empty hands, who turns the act of flipping into a weapon.',
    },
    hp: 72,
    relic: 'wornCoin',
    deck: ['strike', 'strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'guard', 'somersault', 'wager'],
    hue: 80,
  },
  magician: {
    id: 'magician',
    numeral: 'I',
    name: { ko: '마법사', en: 'The Magician' },
    blurb: {
      ko: '정방향으로 힘을 모으고, 역방향으로 터뜨린다.',
      en: 'Gathers Charge while upright, and unleashes it reversed.',
    },
    hp: 64,
    relic: 'silverWand',
    deck: ['strike', 'strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'guard', 'spark', 'nightshade'],
    hue: 300,
  },
};

export const CHAR_ORDER = ['fool', 'magician'];
