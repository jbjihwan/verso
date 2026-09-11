// 적 SVG. viewBox 0 0 200 200, 발은 y≈186. 색은 CSS 변수(막별 팔레트)로만 칠한다.
// 클래스: .s 그림자 · .b 몸 · .d 어두운 면 · .l 선 · .a 강조(불빛) · .e 눈 · .m 금속/뼈
import { svgMarkup } from '../dom.js';

const shadow = (rx = 48) => `<ellipse class="s" cx="100" cy="188" rx="${rx}" ry="8"/>`;

const A = {
  imp: `${shadow(40)}
    <path class="a" d="M100 40c-8 18-22 22-20 44 2-14 12-14 14-24 2 12 10 12 12 0 2 10 12 10 14 24 2-22-12-26-20-44z"/>
    <path class="b" d="M62 150c-4-40 10-68 38-68s42 28 38 68c-2 22-20 34-38 34s-36-12-38-34z"/>
    <path class="d" d="M76 176c6 6 14 8 24 8s18-2 24-8c-8 2-16 3-24 3s-16-1-24-3z"/>
    <path class="l" d="M64 136l-18-12M136 136l18-12M46 124l-4-8M154 124l4-8"/>
    <ellipse class="e" cx="88" cy="118" rx="7" ry="9"/><ellipse class="e" cx="112" cy="118" rx="7" ry="9"/>
    <path class="l" d="M86 142q14 10 28 0"/>`,
  torchbearer: `${shadow(52)}
    <path class="b" d="M58 188c2-58 8-96 42-118 34 22 40 60 42 118z"/>
    <path class="d" d="M74 98c4-34 48-34 52 0-6 14-46 14-52 0z"/>
    <path class="d" d="M100 110v78" style="opacity:.35"/>
    <ellipse class="e" cx="91" cy="92" rx="4" ry="5"/><ellipse class="e" cx="109" cy="92" rx="4" ry="5"/>
    <path class="l" d="M128 132l16-16M144 118l14-58"/>
    <path class="a" d="M158 58c-2-10 4-16 8-24 2 8 8 12 6 22-2 8-12 10-14 2z"/>
    <path class="l" d="M70 150h60" style="opacity:.5"/>`,
  _generic: `${shadow(46)}
    <path class="b" d="M62 188c0-56 12-92 38-104 26 12 38 48 38 104z"/>
    <path class="d" d="M78 96c2-26 42-26 44 0-8 12-36 12-44 0z"/>
    <ellipse class="e" cx="92" cy="90" rx="4" ry="5"/><ellipse class="e" cx="108" cy="90" rx="4" ry="5"/>
    <path class="l" d="M82 150h36" style="opacity:.5"/>`,
};

export function registerEnemyArt(map) { Object.assign(A, map); }

export function enemyArt(key) {
  return svgMarkup(A[key] ?? A._generic, { viewBox: '0 0 200 200', cls: 'foe-svg' });
}
