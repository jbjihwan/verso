// 이벤트 정의. choices(run, data) → [{ label, hint?, disabled?, apply(api, data) → { text } }]
// api: gold · hp · maxHp · relic · card · randomCard · curse · potion · upgradeRandom · select · fight · fightElite (core/run.js)
import { int, chance } from '../rng.js';
import { cardDef } from '../cards.js';

const hasCurse = (run) => run.deck.some((c) => cardDef(c.id).pool === 'curse');
const leave = (ko, en) => ({ label: { ko: '떠난다', en: 'Leave' }, apply: () => ({ text: { ko, en } }) });

export const EVENTS = [
  {
    id: 'wheel', acts: [1, 2, 3], art: 'wheel',
    title: { ko: '운명의 수레바퀴', en: 'The Wheel of Fortune' },
    body: {
      ko: '잿더미 속에서 거대한 수레바퀴가 삐걱거린다. 테두리에는 작은 아르카나들이 그려져 있다. 어디선가 목소리가 들린다. “돌려라. 그리고 네가 돌아가게 두어라.”',
      en: 'A great wheel creaks in the ash, its rim painted with tiny arcana. A voice from nowhere: “Spin it, and let it turn you.”',
    },
    choices: () => [
      {
        label: { ko: '돌린다', en: 'Spin' },
        hint: { ko: '무엇이든 나올 수 있다', en: 'Anything could come up' },
        apply: (api) => {
          switch (int(api.rng, 0, 4)) {
            case 0:
              api.gold(60);
              return { text: { ko: '금화가 쏟아진다. 60골드를 얻었다.', en: 'Coins spill out. You gain 60 gold.' } };
            case 1: {
              const id = api.relic('random');
              return {
                text: id
                  ? { ko: '바퀴살 사이에서 유물 하나가 떨어진다.', en: 'A relic drops from between the spokes.' }
                  : { ko: '바퀴가 헛돈다. 아무 일도 없다.', en: 'The wheel spins empty. Nothing happens.' },
              };
            }
            case 2:
              api.hp(999);
              return { text: { ko: '따뜻한 빛이 몸을 감싼다. 체력이 모두 회복되었다.', en: 'Warm light washes over you. You are fully healed.' } };
            case 3: {
              const ups = api.upgradeRandom(2);
              return { text: { ko: `카드 ${ups.length}장이 저절로 정련되었다.`, en: `${ups.length} of your cards refine themselves.` } };
            }
            default:
              api.hp(-8);
              return { text: { ko: '바퀴가 거꾸로 돌며 당신을 긁는다. 체력을 8 잃었다.', en: 'The wheel turns backwards and bites. You lose 8 HP.' } };
          }
        },
      },
      leave('수레바퀴는 당신 없이도 돈다.', 'The wheel keeps turning without you.'),
    ],
  },
  {
    id: 'lovers', acts: [1, 2], art: 'heart',
    title: { ko: '연인', en: 'The Lovers' },
    body: {
      ko: '등을 맞댄 두 사람이 각자 당신에게 손을 내민다. 둘 다 잡을 수는 없다.',
      en: 'Two figures stand back to back, each holding a hand out to you. You cannot take both.',
    },
    choices: () => [
      {
        label: { ko: '왼손을 잡는다', en: 'Take the left hand' },
        hint: { ko: '최대 체력 +6', en: 'Max HP +6' },
        apply: (api) => {
          api.maxHp(6);
          return { text: { ko: '손끝에서 온기가 번진다. 최대 체력이 6 늘었다.', en: 'Warmth spreads from their fingers. Max HP +6.' } };
        },
      },
      {
        label: { ko: '오른손을 잡는다', en: 'Take the right hand' },
        hint: { ko: '카드 1장 제거', en: 'Remove a card' },
        apply: (api) => {
          api.select({ action: 'remove' });
          return { text: { ko: '오른손이 당신의 짐 하나를 거두어 간다.', en: 'The right hand takes one burden from you.' } };
        },
      },
    ],
  },
  {
    id: 'twoFaced', acts: [1, 2, 3], art: 'mask',
    title: { ko: '두 얼굴의 상인', en: 'The Two-Faced Merchant' },
    body: {
      ko: '뒤통수에도 얼굴이 달린 상인이 웃는다. “카드 한 장을 영원히 뒤집어 드리지. 뒷면이 앞이 되고, 앞면이 뒤가 되게.”',
      en: 'A merchant with a second face on the back of his head grins. “I can turn one of your cards over for good. Its back becomes its front.”',
    },
    choices: (run) => [
      {
        label: { ko: '한 장을 뒤집어 달라 (30골드)', en: 'Turn one over (30 gold)' },
        hint: { ko: '고른 카드가 모든 전투를 역방향으로 시작한다', en: 'That card starts every combat reversed' },
        disabled: run.gold < 30,
        apply: (api) => {
          api.gold(-30);
          api.select({ action: 'swap' });
          return { text: { ko: '상인이 카드를 돌려 건넨다. 이제 그 카드는 반대쪽이 앞이다.', en: 'He hands the card back, turned. Its other face is now its front.' } };
        },
      },
      {
        label: { ko: '카드 한 장을 판다 (+40골드)', en: 'Sell him a card (+40 gold)' },
        hint: { ko: '카드 1장 제거', en: 'Remove a card' },
        apply: (api) => {
          api.gold(40);
          api.select({ action: 'remove' });
          return { text: { ko: '두 얼굴이 동시에 카드를 살핀다. “좋은 거래였소.”', en: 'Both faces study the card at once. “A fine trade.”' } };
        },
      },
      leave('두 얼굴이 동시에 손을 흔든다.', 'Both faces wave goodbye.'),
    ],
  },
  {
    id: 'mirrorPool', acts: [1, 2, 3], art: 'mirror',
    title: { ko: '거울 연못', en: 'The Mirror Pool' },
    body: {
      ko: '잔잔한 연못이 당신의 얼굴 대신 당신의 카드를 비춘다. 손을 넣으면 그중 하나가 마주 잡아 올 것 같다.',
      en: 'A still pool reflects not your face but your cards. Reach in, and one of them might reach back.',
    },
    choices: () => [
      {
        label: { ko: '손을 넣는다 (체력 6 잃음)', en: 'Reach in (lose 6 HP)' },
        hint: { ko: '카드 1장 복제', en: 'Copy a card' },
        apply: (api) => {
          api.hp(-6);
          api.select({ action: 'duplicate' });
          return { text: { ko: '차가운 물 속에서 똑같은 카드가 떠오른다.', en: 'An identical card rises out of the cold water.' } };
        },
      },
      {
        label: { ko: '물을 마신다', en: 'Drink' },
        hint: { ko: '체력 10 회복', en: 'Heal 10 HP' },
        apply: (api) => {
          api.hp(10);
          return { text: { ko: '물은 놀랄 만큼 달다.', en: 'The water is startlingly sweet.' } };
        },
      },
      leave('수면이 다시 고요해진다.', 'The surface goes still again.'),
    ],
  },
  {
    id: 'emberShrine', acts: [1], art: 'flame',
    title: { ko: '잿불 사당', en: 'The Ember Shrine' },
    body: {
      ko: '따뜻한 재가 쌓인 작은 사당. 잉걸불이 아직 숨 쉬듯 깜박이며 공물을 기다린다.',
      en: 'A small shrine heaped with warm ash. The embers still breathe, waiting for an offering.',
    },
    choices: (run) => [
      {
        label: { ko: '골드를 바친다 (50골드)', en: 'Offer gold (50 gold)' },
        hint: { ko: '무작위 카드 2장 정련', en: 'Refine 2 random cards' },
        disabled: run.gold < 50,
        apply: (api) => {
          api.gold(-50);
          const ups = api.upgradeRandom(2);
          return { text: { ko: `불꽃이 치솟아 카드 ${ups.length}장을 벼려 낸다.`, en: `The flames leap up and temper ${ups.length} of your cards.` } };
        },
      },
      {
        label: { ko: '기도한다', en: 'Pray' },
        hint: { ko: '최대 체력 +4', en: 'Max HP +4' },
        apply: (api) => {
          api.maxHp(4);
          return { text: { ko: '가슴 속 불씨가 조금 더 커진다.', en: 'The ember in your chest grows a little brighter.' } };
        },
      },
      {
        label: { ko: '재를 걷어찬다', en: 'Kick the ashes' },
        hint: { ko: '25골드 · 저주 "후회"', en: '25 gold · curse: Regret' },
        apply: (api) => {
          api.gold(25);
          api.curse('regret');
          return { text: { ko: '재 속에서 동전이 튀어나온다. 뒤늦게 마음이 무거워진다.', en: 'Coins spill from the ash. A heaviness follows you out.' } };
        },
      },
    ],
  },
  {
    id: 'sunkenBell', acts: [2], art: 'bell',
    title: { ko: '가라앉은 종', en: 'The Sunken Bell' },
    body: {
      ko: '청동 종이 소금물에 반쯤 잠겨 있다. 종의 추는 검은 실로 묶여 있다.',
      en: 'A bronze bell lies half-sunk in brine. Its tongue is tied down with black thread.',
    },
    choices: () => [
      {
        label: { ko: '종을 울린다', en: 'Ring it' },
        hint: { ko: '유물 · 저주 "의심"', en: 'A relic · curse: Doubt' },
        apply: (api) => {
          api.relic('random');
          api.curse('doubt');
          return { text: { ko: '낮은 울림이 물속까지 번진다. 무언가가 대답하듯 떠오른다.', en: 'A low toll spreads through the water. Something rises, as if in answer.' } };
        },
      },
      {
        label: { ko: '청동을 떼어 간다', en: 'Strip the bronze' },
        hint: { ko: '45골드', en: '45 gold' },
        apply: (api) => {
          api.gold(45);
          return { text: { ko: '종은 끝내 울리지 않았다.', en: 'The bell never rings.' } };
        },
      },
      leave('당신은 종을 깨우지 않기로 한다.', 'You let the bell sleep.'),
    ],
  },
  {
    id: 'wanderingHermit', acts: [1, 2], art: 'lantern',
    title: { ko: '방랑 은자', en: 'The Wandering Hermit' },
    body: {
      ko: '늙은 은자가 당신의 불가에 앉는다. “지식이든 약이든 줄 수 있지. 둘 다 공짜는 아니고.”',
      en: 'An old hermit sits down at your fire. “Knowledge or medicine, I can give. Neither is free.”',
    },
    choices: (run) => [
      {
        label: { ko: '지식 (40골드)', en: 'Knowledge (40 gold)' },
        hint: { ko: '카드 1장 정련', en: 'Refine a card' },
        disabled: run.gold < 40,
        apply: (api) => {
          api.gold(-40);
          api.select({ action: 'upgrade' });
          return { text: { ko: '은자가 카드 한 귀퉁이에 무언가를 적어 넣는다.', en: 'The hermit writes something in the corner of a card.' } };
        },
      },
      {
        label: { ko: '약 (30골드)', en: 'Medicine (30 gold)' },
        hint: { ko: '무작위 물약', en: 'A random potion' },
        disabled: run.gold < 30 || !run.potions.includes(null),
        apply: (api) => {
          api.gold(-30);
          api.potion();
          return { text: { ko: '작은 병을 건네받는다. 쓴 냄새가 난다.', en: 'He hands you a small bottle. It smells bitter.' } };
        },
      },
      {
        label: { ko: '함께 불을 쬔다', en: 'Share the fire' },
        hint: { ko: '체력 8 회복', en: 'Heal 8 HP' },
        apply: (api) => {
          api.hp(8);
          return { text: { ko: '말없이 밤이 지나간다.', en: 'The night passes in silence.' } };
        },
      },
    ],
  },
  {
    id: 'gamblersTable', acts: [1, 2, 3], art: 'coin',
    title: { ko: '도박판', en: "The Gambler's Table" },
    body: {
      ko: '가면을 쓴 도박꾼이 모든 카드에 얼굴이 둘씩 그려진 덱을 섞는다. “앞면이면 두 배, 뒷면이면 내 거.”',
      en: 'A masked gambler shuffles a deck where every card has two faces. “Heads, I double it. Tails, it’s mine.”',
    },
    choices: (run) => [
      {
        label: { ko: '30골드를 건다', en: 'Bet 30 gold' },
        hint: { ko: '반반의 확률', en: 'Even odds' },
        disabled: run.gold < 30,
        apply: (api) => {
          if (chance(api.rng, 0.5)) { api.gold(30); return { text: { ko: '앞면! 30골드를 땄다.', en: 'Heads! You win 30 gold.' } }; }
          api.gold(-30);
          return { text: { ko: '뒷면. 30골드를 잃었다.', en: 'Tails. You lose 30 gold.' } };
        },
      },
      {
        label: { ko: '가진 골드의 절반을 건다', en: 'Bet half your gold' },
        hint: { ko: '반반의 확률', en: 'Even odds' },
        disabled: run.gold < 2,
        apply: (api) => {
          const stake = Math.floor(api.run.gold / 2);
          if (chance(api.rng, 0.5)) { api.gold(stake); return { text: { ko: `앞면! ${stake}골드를 땄다.`, en: `Heads! You win ${stake} gold.` } }; }
          api.gold(-stake);
          return { text: { ko: `뒷면. ${stake}골드를 잃었다.`, en: `Tails. You lose ${stake} gold.` } };
        },
      },
      leave('도박꾼이 어깨를 으쓱한다.', 'The gambler shrugs.'),
    ],
  },
  {
    id: 'temperance', acts: [2, 3], art: 'cup',
    title: { ko: '절제의 샘', en: 'The Temperance Spring' },
    body: {
      ko: '두 잔이 서로에게 물을 옮겨 붓는데 한 방울도 흘리지 않는다. 마시면 균형을 되찾을 것이다.',
      en: 'Two cups pour water into each other without spilling a drop. Drink, and be brought back into balance.',
    },
    choices: (run) => [
      {
        label: { ko: '깊이 마신다', en: 'Drink deeply' },
        hint: { ko: '체력 전부 회복 · 최대 체력 −5', en: 'Heal to full · Max HP −5' },
        apply: (api) => {
          api.maxHp(-5);
          api.hp(999);
          return { text: { ko: '몸이 가벼워진다. 무언가를 조금 덜어 낸 느낌이다.', en: 'You feel lighter, as if something small was taken to make room.' } };
        },
      },
      {
        label: { ko: '저주를 씻는다', en: 'Wash away a curse' },
        hint: { ko: '저주 1장 제거', en: 'Remove a curse' },
        disabled: !hasCurse(run),
        apply: (api) => {
          api.select({ action: 'remove', filter: 'curse' });
          return { text: { ko: '물이 검게 흐려졌다가 다시 맑아진다.', en: 'The water clouds black, then clears.' } };
        },
      },
      leave('잔은 계속 서로를 채운다.', 'The cups go on filling each other.'),
    ],
  },
  {
    id: 'brokenStatue', acts: [1, 2, 3], art: 'crown',
    title: { ko: '쓰러진 석상', en: 'The Toppled Statue' },
    body: {
      ko: '쓰러진 기사 석상의 돌눈이 당신을 따라 움직인다. 가슴께의 틈에서 무언가가 반짝인다.',
      en: 'A toppled statue of a knight. Its stone eyes follow you. Something glitters in a crack in its chest.',
    },
    choices: () => [
      {
        label: { ko: '보석을 빼낸다', en: 'Pry out the gem' },
        hint: { ko: '정예와 싸운다 · 이기면 유물', en: 'Fight an elite · a relic if you win' },
        apply: (api) => {
          api.fightElite({ relic: true });
          return { text: { ko: '돌이 갈라지며 석상이 일어선다!', en: 'The stone splits, and the statue rises!' } };
        },
      },
      leave('당신은 돌눈을 등지고 걸음을 옮긴다.', 'You turn your back on the stone eyes.'),
    ],
  },
  {
    id: 'starChart', acts: [2, 3], art: 'star',
    title: { ko: '별자리표', en: 'The Star Chart' },
    body: {
      ko: '천장 가득 별이 그려져 있다. 한 별자리에 별 하나가 비어 있고, 그 자리에 카드 한 장이 꽂혀 있다.',
      en: 'A ceiling painted with stars. One constellation is missing a star — and a card is tucked in its place.',
    },
    choices: () => [
      {
        label: { ko: '카드를 가져간다 (체력 8 잃음)', en: 'Take the card (lose 8 HP)' },
        hint: { ko: '무작위 희귀 카드', en: 'A random rare card' },
        apply: (api) => {
          api.hp(-8);
          api.randomCard('boss');
          return { text: { ko: '카드를 뽑아내자 별 하나가 떨어져 손을 태운다.', en: 'As you pull the card free, a star falls and burns your hand.' } };
        },
      },
      {
        label: { ko: '별을 읽는다', en: 'Read the stars' },
        hint: { ko: '무작위 카드 1장 정련', en: 'Refine 1 random card' },
        apply: (api) => {
          api.upgradeRandom(1);
          return { text: { ko: '별자리가 당신의 한 수를 가르쳐 준다.', en: 'The constellation teaches you a better move.' } };
        },
      },
      leave('별들은 제자리에 머문다.', 'The stars stay where they are.'),
    ],
  },
  {
    id: 'maskedTroupe', acts: [1, 2, 3], art: 'mask',
    title: { ko: '가면 극단', en: 'The Masked Troupe' },
    body: {
      ko: '칠한 가면을 쓴 배우들이 연극 속 당신의 배역을 새로 써 주겠다고 한다.',
      en: 'Actors in painted masks offer to rewrite your part in the play.',
    },
    choices: () => [
      {
        label: { ko: '배역을 바꾼다', en: 'Recast a part' },
        hint: { ko: '카드 1장 변환', en: 'Transform a card' },
        apply: (api) => {
          api.select({ action: 'transform' });
          return { text: { ko: '가면 하나가 당신 카드 위에 덧씌워진다.', en: 'A mask is laid over one of your cards.' } };
        },
      },
      {
        label: { ko: '박수를 친다', en: 'Applaud' },
        hint: { ko: '20골드', en: '20 gold' },
        apply: (api) => {
          api.gold(20);
          return { text: { ko: '배우들이 답례로 동전을 던져 준다.', en: 'The actors toss you coins in thanks.' } };
        },
      },
      leave('막이 내린다.', 'The curtain falls.'),
    ],
  },
];
