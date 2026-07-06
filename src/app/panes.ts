import { state, patch } from './state';
import { flashToast } from './toast';

/** 中栏可拖拽调整宽度（桌面端），localStorage 记忆。互换后方向自适应。 */
export function startMidResize(e: MouseEvent) {
  if (state.isMobile) return;
  if (e && e.preventDefault) e.preventDefault();
  const startX = e.clientX;
  const startW = state.midW || 304;
  const sign = state.paneSwap ? -1 : 1;
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';
  const move = (ev: MouseEvent) => {
    let w = startW + sign * (ev.clientX - startX);
    w = Math.max(220, Math.min(560, w));
    patch({ midW: w });
  };
  const up = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    try { localStorage.setItem('lx_mid_w', String(state.midW || 304)); } catch (_) { /* ignore */ }
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

// ---- 面板整体拖动重排：把内容面板（对话框）拖到另一侧，两栏左右互换，滑动补位 ----
let paneDragging = false;

export function paneDragStart(e?: DragEvent) {
  if (state.isMobile) return;
  paneDragging = true;
  patch({ paneDragActive: true });
  try { if (e && e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'pane'); } } catch (_) { /* ignore */ }
}

export function paneDragEnd() {
  paneDragging = false;
  patch({ paneDragActive: false });
}

export function onPaneOver(e?: DragEvent) {
  if (paneDragging && e && e.preventDefault) e.preventDefault();
}

export function onPaneDrop(e: DragEvent) {
  if (!paneDragging) return;
  if (e && e.preventDefault) e.preventDefault();
  paneDragging = false;
  const x = e.clientX || 0;
  const target = x <= window.innerWidth / 2;
  patch({ paneDragActive: false });
  swapPanes(target);
}

/** FLIP 动画：先记录旧位置 → 换 order → 反向位移再过渡到 0，形成"滑到另一侧"的补位效果 */
export function swapPanes(target: boolean) {
  if (state.isMobile) return;
  if (target === state.paneSwap) return;
  const els = [document.getElementById('lx-mid'), document.getElementById('lx-main')].filter(Boolean) as HTMLElement[];
  const first = els.map((e) => e.getBoundingClientRect().left);
  patch({ paneSwap: target }, () => {
    els.forEach((e, i) => {
      const dx = first[i] - e.getBoundingClientRect().left;
      if (!dx) return;
      e.style.transition = 'none';
      e.style.transform = `translateX(${dx}px)`;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      els.forEach((e) => {
        e.style.transition = 'transform .28s cubic-bezier(.4,0,.2,1)';
        e.style.transform = '';
      });
    }));
    try { localStorage.setItem('lx_pane_swap', target ? '1' : '0'); } catch (_) { /* ignore */ }
    flashToast(target ? '对话框已移到左侧' : '对话框已移到右侧');
  });
}
