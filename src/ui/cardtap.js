// 카드 고르기 입력: 마우스는 바로 선택, 터치는 먼저 크게 보여 주고 버튼으로 확정한다.
// (휴대폰에서는 카드 글씨가 작아 읽지 않고 고르게 되기 쉽다)
import { openOverlay } from './app.js';

export function bindCardChoice(el, inst, { label, onChoose, run = null, disabled = false }) {
  let ptype = 'mouse';
  const action = disabled ? null : { label, onClick: onChoose };
  el.tabIndex = 0;
  el.addEventListener('pointerdown', (e) => { ptype = e.pointerType; });
  el.addEventListener('click', () => {
    if (!disabled && ptype === 'mouse') onChoose();
    else openOverlay('inspect', { inst, run, action });
  });
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openOverlay('inspect', { inst, run, action });
  });
  el.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); onChoose(); }
  });
}
