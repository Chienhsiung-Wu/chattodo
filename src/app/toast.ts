import { state, patch } from './state';

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function flashToast(msg: string) {
  patch({ toast: msg });
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => patch({ toast: null }), 2600);
  void state; // keep import shape stable
}
