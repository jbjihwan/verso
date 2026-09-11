// 이벤트 정의. choices(run, data) → [{ label, hint?, disabled?, apply(api, data) → { text } }]
// api: gold · hp · maxHp · relic · card · randomCard · curse · potion · upgradeRandom · select · fight (core/run.js)
import { int } from '../rng.js';

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
      {
        label: { ko: '지나간다', en: 'Walk on' },
        apply: () => ({ text: { ko: '수레바퀴는 당신 없이도 돈다.', en: 'The wheel keeps turning without you.' } }),
      },
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
      {
        label: { ko: '떠난다', en: 'Leave' },
        apply: () => ({ text: { ko: '두 얼굴이 동시에 손을 흔든다.', en: 'Both faces wave goodbye.' } }),
      },
    ],
  },
];
