# VERSO

**Every card has two faces. Every play turns it over.**
모든 카드에는 두 얼굴이 있고, 쓸 때마다 뒤집힌다.

A tarot roguelite deckbuilder that runs in your browser, on PC and mobile.

▶ **Play:** https://jbjihwan.github.io/verso/

## How it plays

- Every card has an **Upright** face (the top half) and a **Reversed** face, printed upside down beneath it.
- Playing a card resolves its current face, then the card **turns 180°** on its way to the discard pile — so your deck keeps changing which faces come up next.
- You get **one free Flip** each turn to turn over a card in your hand.
- Two arcana to play: **The Fool** builds an engine out of flipping; **The Magician** gathers Charge upright and unleashes it reversed.
- Three acts, six bosses (one per act each run), 64 character cards, 14 shared cards, 28 relics, 10 potions, 12 events, 5 omens of difficulty.
- Korean and English, chosen from your browser language and switchable in Settings.

## Controls

| | |
|---|---|
| Mouse / touch | Tap a card, then tap an enemy — or drag the card onto it. Tap **↻** on a selected card to flip it. Hold or right-click a card to see both faces. |
| Keyboard | `1`–`0` select a card · `F` flip · `←` `→` choose a target · `Enter` play · `E` end turn · `Esc` cancel |

## Under the hood

Vanilla JavaScript (ES modules) with DOM, inline SVG and WebAudio. No build step, no dependencies, no asset files and no external requests. Every picture is drawn in code and every sound is synthesized.

- `src/core/` holds the game rules. It never touches the DOM, uses seeded RNG streams, and keeps all state as plain JSON, so the run autosaves after every action, including mid-combat.
- `src/ui/` holds the screens. The combat engine returns a list of events and the UI animates them.
- `src/audio/` holds synthesized sound effects and generative music.
- `test/` holds unit tests for the core, run with `node --test`.

Run locally with `python dev-server.py`, then open http://127.0.0.1:8090/. Add `?debug=1` for console helpers (`verso.fight(...)`, `verso.room(...)`) or `?layout=portrait` to preview the phone layout on a desktop window.

---

## 한국어

**VERSO**는 브라우저에서 바로 하는 타로 로그라이트 덱빌딩입니다(PC·모바일).

- 모든 카드는 **정방향**(위 절반)과 **역방향**(아래에 거꾸로 인쇄된 면)을 가집니다.
- 카드를 쓰면 지금 면의 효과가 나간 뒤 카드가 **180° 돌아** 버린 더미로 갑니다. 그래서 다음에 어느 면이 올라올지 설계하는 것이 핵심입니다.
- 턴마다 **무료 뒤집기 1회**로 손패의 카드 한 장을 뒤집을 수 있습니다.
- 캐릭터 2명(바보: 뒤집기 엔진 / 마법사: 충전과 방출), 3막, 보스 6명, 유물 28, 물약 10, 이벤트 12, 난이도(징조) 5단계.

조작: 카드를 누르고 적을 누르거나 끌어다 놓습니다. 선택한 카드의 ↻ 로 뒤집고, 길게 누르면 두 면을 모두 볼 수 있습니다.
키보드는 `1`–`0` 선택, `F` 뒤집기, `←/→` 대상, `Enter` 사용, `E` 턴 종료입니다.
