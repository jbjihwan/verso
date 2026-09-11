// 막 배경: 전장 뒤에서 천천히 흐르는 문양(1막 잿불 · 2막 물방울 · 3막 유리 파편).
// 위치는 막 번호로 정해지는 의사난수라 같은 막은 늘 같은 모양이다.
import { svgEl } from '../dom.js';

export function backdrop(act, w, h) {
  const svg = svgEl('svg', {
    class: `backdrop bd-${act}`, width: String(w), height: String(h), viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true',
  });
  let seed = act * 9973 + 17;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 36; i++) {
    const x = rnd() * w;
    const y = h * 0.15 + rnd() * h * 0.8;
    const r = 1 + rnd() * 2.6;
    const style = `--dur:${(7 + rnd() * 7).toFixed(1)}s;--dl:${(-rnd() * 12).toFixed(1)}s`;
    if (act === 2) {
      svg.append(svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (r * 2.2).toFixed(1), class: 'bd-bubble', style }));
    } else if (act === 3) {
      const s = 5 + r * 3;
      svg.append(svgEl('path', {
        d: `M${x.toFixed(1)} ${y.toFixed(1)}l${s.toFixed(1)} ${(-s * 0.7).toFixed(1)}l${(-s * 0.3).toFixed(1)} ${(s * 1.6).toFixed(1)}z`,
        class: 'bd-shard', style,
      }));
    } else {
      svg.append(svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1), class: 'bd-ember', style }));
    }
  }
  return svg;
}
