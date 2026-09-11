// 플레이어 캐릭터 SVG. viewBox 0 0 200 240, 발은 y≈228.
import { svgMarkup } from '../dom.js';

const P = {
  // 바보: 어깨에 봇짐 막대, 두 갈래 모자, 발치의 작은 개
  fool: `
    <ellipse class="s" cx="100" cy="230" rx="56" ry="8"/>
    <path class="l" d="M88 176l-8 52M112 176l8 52"/>
    <path class="b" d="M70 176c2-40 10-66 30-74 20 8 28 34 30 74z"/>
    <path class="d" d="M100 102l-12 18 12 18 12-18zM88 138l-10 18 10 18 10-18zM112 138l-10 18 10 18 10-18z"/>
    <circle class="k" cx="100" cy="80" r="17"/>
    <path class="a" d="M83 72c2-16 10-24 17-26 7 2 15 10 17 26-8-6-12-8-17-8s-9 2-17 8z"/>
    <path class="l" d="M84 66L64 52M116 66l20-14"/>
    <circle class="m" cx="62" cy="50" r="4"/><circle class="m" cx="138" cy="50" r="4"/>
    <circle class="e" cx="94" cy="80" r="2.4"/><circle class="e" cx="106" cy="80" r="2.4"/>
    <path class="l" d="M74 118L44 44"/>
    <path class="d" d="M34 30c10-6 22 0 22 12s-12 16-22 10-10-16 0-22z"/>
    <path class="b" d="M140 212c0-10 8-18 18-18 6 0 10 4 12 8l8-4-2 10c2 4 2 8 0 12h-36z"/>
    <path class="l" d="M146 224v4M170 224v4M178 200l6-10"/>`,
  // 마법사: 머리 위 무한 기호, 치켜든 지팡이, 긴 로브
  magician: `
    <ellipse class="s" cx="100" cy="230" rx="56" ry="8"/>
    <path class="b" d="M64 228c4-68 16-110 36-122 20 12 32 54 36 122z"/>
    <path class="d" d="M100 106c-8 30-10 80-8 122h16c2-42 0-92-8-122z"/>
    <path class="l" d="M76 150h48" style="opacity:.6"/>
    <circle class="k" cx="100" cy="86" r="17"/>
    <path class="d" d="M83 84c0-14 8-22 17-22s17 8 17 22c-6-6-11-8-17-8s-11 2-17 8z"/>
    <circle class="e" cx="94" cy="88" r="2.4"/><circle class="e" cx="106" cy="88" r="2.4"/>
    <path class="a" d="M100 44c-5-7-10-11-15-11a10 10 0 0 0 0 20c5 0 10-4 15-9s10-11 15-11a10 10 0 0 1 0 20c-5 0-10-4-15-9z" style="fill:none;stroke-width:4"/>
    <path class="l" d="M124 132l18-30M142 102l10-46"/>
    <path class="a" d="M152 50l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>
    <path class="l" d="M76 136l-14 22"/>`,
};

export function heroArt(char) {
  return svgMarkup(P[char] ?? P.fool, { viewBox: '0 0 200 240', cls: 'hero-svg' });
}
