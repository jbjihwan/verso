// 무색(상점·이벤트) · 저주 · 상태이상 카드.
// 저주와 상태이상에도 역방향 면이 있다 — 뒤집고 대가를 치르면 스스로를 소멸시키는 "탈출구"가 된다.
const none = { ko: () => '', en: () => '' };
const removeSelf = { ko: () => '이 카드를 전투에서 없앱니다.', en: () => 'Remove this card from combat.' };

function exitFace(ko, en, cost, type, extra = {}) {
  return {
    name: { ko, en }, type, cost, target: 'self', vals: {}, kw: ['vanish'],
    text: extra.text ?? removeSelf,
    play: extra.play ?? (() => {}),
  };
}

export const CARDS = [
  // ── 무색 6 ─────────────────────────────────────────────────────────────
  {
    id: 'bandage', pool: 'neutral', rarity: 'uncommon', art: 'heart',
    faces: [
      {
        name: { ko: '붕대', en: 'Bandage' }, type: 'skill', cost: 0, target: 'self',
        vals: { n: 4 }, upg: { n: 6 }, kw: ['vanish'],
        text: { ko: (v) => `체력을 ${v.n} 회복합니다.`, en: (v) => `Heal ${v.n} HP.` },
        play: (c, v) => c.heal('player', v.n),
      },
      {
        name: { ko: '싸매기', en: 'Wrap' }, type: 'skill', cost: 0, target: 'self',
        vals: { blk: 4 }, upg: { blk: 6 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다.`, en: (v) => `Gain ${v.blk} Block.` },
        play: (c, v) => c.block(v.blk),
      },
    ],
  },
  {
    id: 'smokeBomb', pool: 'neutral', rarity: 'uncommon', art: 'web',
    faces: [
      {
        name: { ko: '연막탄', en: 'Smoke Bomb' }, type: 'skill', cost: 1, target: 'all',
        vals: { n: 2 }, upg: { n: 3 }, tips: ['weak'],
        text: { ko: (v) => `모든 적에게 [[약화]]를 ${v.n} 부여합니다.`, en: (v) => `Apply ${v.n} [[Weak]] to ALL enemies.` },
        play: (c, v) => c.applyAll('weak', v.n),
      },
      {
        name: { ko: '사라지기', en: 'Vanishing Act' }, type: 'skill', cost: 1, target: 'self',
        vals: { blk: 7 }, upg: { blk: 10 },
        text: { ko: (v) => `방어도를 ${v.blk} 얻습니다. 카드를 1장 뽑습니다.`, en: (v) => `Gain ${v.blk} Block. Draw 1 card.` },
        play: (c, v) => { c.block(v.blk); c.draw(1); },
      },
    ],
  },
  {
    id: 'goldenTicket', pool: 'neutral', rarity: 'rare', art: 'key',
    faces: [
      {
        name: { ko: '황금 티켓', en: 'Golden Ticket' }, type: 'skill', cost: 0, target: 'self',
        vals: { n: 2 }, upg: { n: 3 }, kw: ['vanish'],
        text: { ko: (v) => `에너지를 ${v.n} 얻습니다.`, en: (v) => `Gain ${v.n} Energy.` },
        play: (c, v) => c.energy(v.n),
      },
      {
        name: { ko: '초대장', en: 'Invitation' }, type: 'skill', cost: 0, target: 'self',
        vals: { n: 3 }, upg: { n: 4 }, kw: ['vanish'],
        text: { ko: (v) => `카드를 ${v.n}장 뽑습니다.`, en: (v) => `Draw ${v.n} cards.` },
        play: (c, v) => c.draw(v.n),
      },
    ],
  },
  {
    id: 'chainsOfFate', pool: 'neutral', rarity: 'uncommon', art: 'chain',
    faces: [
      {
        name: { ko: '운명의 사슬', en: 'Chains of Fate' }, type: 'attack', cost: 1, target: 'all',
        vals: { dmg: 6 }, upg: { dmg: 9 },
        text: { ko: (v) => `모든 적에게 피해를 ${v.dmg} 줍니다.`, en: (v) => `Deal ${v.dmg} damage to ALL enemies.` },
        play: (c, v) => c.attackAll(v.dmg),
      },
      {
        name: { ko: '속박', en: 'Bind' }, type: 'skill', cost: 1, target: 'all',
        vals: { n: 1 }, upg: { n: 2 }, tips: ['exposed'],
        text: {
          ko: (v) => `모든 적에게 [[취약]]을 ${v.n} 부여합니다. 카드를 1장 뽑습니다.`,
          en: (v) => `Apply ${v.n} [[Exposed]] to ALL enemies. Draw 1 card.`,
        },
        play: (c, v) => { c.applyAll('exposed', v.n); c.draw(1); },
      },
    ],
  },
  {
    id: 'starMap', pool: 'neutral', rarity: 'rare', art: 'star',
    faces: [
      {
        name: { ko: '별자리표', en: 'Star Map' }, type: 'skill', cost: 1, upgCost: 0, target: 'self',
        vals: {}, kw: ['vanish'],
        text: {
          ko: () => '내 캐릭터의 무작위 카드 3장 중 1장을 손에 넣습니다. 그 카드는 이번 턴에 비용이 0입니다.',
          en: () => 'Choose 1 of 3 random cards of your class to add to your hand. It costs 0 this turn.',
        },
        play: (c) => c.choose({ from: 'discover', count: 1, options: c.discoverOptions(c.run.char, 3), prompt: 'discover' }, 'take'),
        resume: { take: (c, v, ids) => { for (const id of ids) { const inst = c.addCard(id, 'hand'); inst.free = true; } } },
      },
      {
        name: { ko: '별 보기', en: 'Stargaze' }, type: 'skill', cost: 1, target: 'self',
        vals: { n: 2 }, upg: { n: 3 }, tips: ['flip'],
        text: {
          ko: (v) => `카드를 ${v.n}장 뽑습니다. [[뒤집기]]를 1회 얻습니다.`,
          en: (v) => `Draw ${v.n} cards. Gain 1 [[Flip]].`,
        },
        play: (c, v) => { c.draw(v.n); c.flips(1); },
      },
    ],
  },
  {
    id: 'patience', pool: 'neutral', rarity: 'uncommon', art: 'hourglass',
    faces: [
      {
        name: { ko: '인내', en: 'Patience' }, type: 'skill', cost: 1, target: 'self',
        vals: { en: 1 }, upg: { en: 2 },
        text: {
          ko: (v) => `다음 턴에 에너지를 ${v.en} 더 얻고 카드를 2장 더 뽑습니다.`,
          en: (v) => `Next turn, gain ${v.en} extra Energy and draw 2 extra cards.`,
        },
        play: (c, v) => { c.player.nextEnergy += v.en; c.player.nextDraw += 2; },
      },
      {
        name: { ko: '서두름', en: 'Haste' }, type: 'skill', cost: 1, target: 'self',
        vals: { n: 3 }, upg: { n: 4 },
        text: { ko: (v) => `카드를 ${v.n}장 뽑습니다.`, en: (v) => `Draw ${v.n} cards.` },
        play: (c, v) => c.draw(v.n),
      },
    ],
  },

  // ── 저주 4 ─────────────────────────────────────────────────────────────
  {
    id: 'doubt', pool: 'curse', rarity: 'special', art: 'skull',
    inHandEnd: (c, inst) => { if (!inst.rev) c.apply('player', 'weak', 1); },
    faces: [
      {
        name: { ko: '의심', en: 'Doubt' }, type: 'curse', cost: null, target: 'none', vals: {}, tips: ['weak'],
        text: { ko: () => '턴이 끝날 때 손에 있으면 [[약화]]를 1 얻습니다.', en: () => 'If this is in your hand at the end of your turn, gain 1 [[Weak]].' },
      },
      exitFace('결심', 'Resolve', 1, 'curse'),
    ],
  },
  {
    id: 'regret', pool: 'curse', rarity: 'special', art: 'drop',
    inHandEnd: (c, inst) => { if (!inst.rev) c.loseHp('player', 2); },
    faces: [
      {
        name: { ko: '후회', en: 'Regret' }, type: 'curse', cost: null, target: 'none', vals: {},
        text: { ko: () => '턴이 끝날 때 손에 있으면 체력을 2 잃습니다.', en: () => 'If this is in your hand at the end of your turn, lose 2 HP.' },
      },
      exitFace('받아들임', 'Acceptance', 1, 'curse', {
        text: { ko: () => '카드를 1장 뽑습니다. 이 카드를 전투에서 없앱니다.', en: () => 'Draw 1 card. Remove this card from combat.' },
        play: (c) => c.draw(1),
      }),
    ],
  },
  {
    id: 'burden', pool: 'curse', rarity: 'special', art: 'anchor',
    faces: [
      {
        name: { ko: '짐', en: 'Burden' }, type: 'curse', cost: null, target: 'none', vals: {}, kw: ['retain'],
        text: { ko: () => '손에서 떠나지 않는다.', en: () => 'It never leaves your hand.' },
      },
      exitFace('내려놓기', 'Set Down', 2, 'curse'),
    ],
  },
  {
    id: 'illStar', pool: 'curse', rarity: 'special', art: 'moon',
    onDraw: (c, inst) => { if (!inst.rev) c.energy(-1); },
    faces: [
      {
        name: { ko: '불길한 별', en: 'Ill Star' }, type: 'curse', cost: null, target: 'none', vals: {},
        text: { ko: () => '뽑을 때 에너지를 1 잃습니다.', en: () => 'When drawn, lose 1 Energy.' },
      },
      exitFace('별 읽기', 'Read the Stars', 0, 'curse', {
        text: { ko: () => '카드를 1장 뽑습니다. 이 카드를 전투에서 없앱니다.', en: () => 'Draw 1 card. Remove this card from combat.' },
        play: (c) => c.draw(1),
      }),
    ],
  },

  // ── 상태이상 4 (적이 섞어 넣는다) ──────────────────────────────────────
  {
    id: 'vertigo', pool: 'status', rarity: 'special', art: 'spiral',
    faces: [
      { name: { ko: '현기증', en: 'Vertigo' }, type: 'status', cost: null, target: 'none', vals: {}, kw: ['ethereal'], text: none },
      { name: { ko: '어지럼', en: 'Dizzy' }, type: 'status', cost: null, target: 'none', vals: {}, kw: ['ethereal'], text: none },
    ],
  },
  {
    id: 'ash', pool: 'status', rarity: 'special', art: 'flame',
    faces: [
      { name: { ko: '재', en: 'Ash' }, type: 'status', cost: null, target: 'none', vals: {}, text: none },
      exitFace('털어내기', 'Brush Off', 1, 'status'),
    ],
  },
  {
    id: 'rubble', pool: 'status', rarity: 'special', art: 'tower',
    inHandEnd: (c, inst) => { if (!inst.rev) c.hit('player', 2); },
    faces: [
      {
        name: { ko: '잔해', en: 'Rubble' }, type: 'status', cost: null, target: 'none', vals: {},
        text: { ko: () => '턴이 끝날 때 손에 있으면 피해를 2 받습니다.', en: () => 'If this is in your hand at the end of your turn, take 2 damage.' },
      },
      exitFace('치우기', 'Clear Away', 1, 'status'),
    ],
  },
  {
    id: 'wound', pool: 'status', rarity: 'special', art: 'thorn',
    faces: [
      { name: { ko: '상처', en: 'Wound' }, type: 'status', cost: null, target: 'none', vals: {}, text: none },
      { name: { ko: '흉터', en: 'Scar' }, type: 'status', cost: null, target: 'none', vals: {}, text: none },
    ],
  },
];
