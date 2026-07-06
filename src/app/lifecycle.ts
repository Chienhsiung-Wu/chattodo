import { api, getToken, setToken } from '@/lib/api.js';
import { state, patch } from './state';
import { applyTheme } from './theme';
import { go } from './nav';
import { scrollMsgs } from './chat';
import { loadState, applyUser, enterApp, stopEvents } from './session';

/**
 * App-level side effects (was componentDidMount/componentWillUnmount):
 * localStorage restore, responsive watcher, global keyboard shortcuts
 * (⌘K, /, ?, n, g-chords), visualViewport handling, token auto-login.
 */

let onResize: (() => void) | null = null;
let onKey: ((e: KeyboardEvent) => void) | null = null;
let onVV: (() => void) | null = null;
let ro: ResizeObserver | null = null;
let gPending = false;
let gTimer: ReturnType<typeof setTimeout> | undefined;

export function initApp() {
  applyTheme();
  try {
    const o = JSON.parse(localStorage.getItem('lx_task_order') || '[]');
    if (Array.isArray(o)) state.taskOrder = o;
    const mw = parseInt(localStorage.getItem('lx_mid_w') || '', 10);
    if (mw >= 220 && mw <= 560) state.midW = mw;
    if (localStorage.getItem('lx_pane_swap') === '1') state.paneSwap = true;
  } catch (e) { /* ignore */ }

  onResize = () => {
    const w = window.innerWidth || document.documentElement.clientWidth || 1200;
    const m = w < 820;
    if (m !== state.isMobile) patch({ isMobile: m });
  };
  onResize();
  window.addEventListener('resize', onResize);
  requestAnimationFrame(() => onResize && onResize());
  setTimeout(() => onResize && onResize(), 0);
  setTimeout(() => onResize && onResize(), 250);
  try {
    ro = new ResizeObserver(() => onResize && onResize());
    ro.observe(document.documentElement);
  } catch (e) { /* ignore */ }

  onKey = (e: KeyboardEvent) => {
    if (!state.authed) return;
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      patch((s) => ({ searchOpen: !s.searchOpen, searchQuery: '', paletteIndex: 0 }));
      return;
    }
    if (e.key === 'Escape') { patch({ searchOpen: false, notifOpen: false, shortcutsOpen: false }); return; }
    if (state.searchOpen) return;
    const tag = (e.target && (e.target as HTMLElement).tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === '/') { e.preventDefault(); patch({ searchOpen: true, searchQuery: '', paletteIndex: 0 }); return; }
    if (e.key === '?') { e.preventDefault(); patch((s) => ({ shortcutsOpen: !s.shortcutsOpen })); return; }
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      go('chat');
      setTimeout(() => { const c = document.getElementById('lx-composer'); if (c) c.focus(); }, 60);
      return;
    }
    const k = (e.key || '').toLowerCase();
    if (gPending) {
      gPending = false;
      const map: Record<string, string> = { c: 'chat', d: 'database', p: 'projects', f: 'friends', s: 'settings', l: 'clarify', a: 'agent', t: 'nontodo' };
      if (map[k]) { e.preventDefault(); go(map[k]); }
      return;
    }
    if (k === 'g') {
      gPending = true;
      clearTimeout(gTimer);
      gTimer = setTimeout(() => { gPending = false; }, 900);
    }
  };
  window.addEventListener('keydown', onKey);

  if (window.visualViewport) {
    onVV = () => {
      const root = document.getElementById('lx-root');
      if (!root) return;
      if (state.isMobile) {
        root.style.height = window.visualViewport!.height + 'px';
        scrollMsgs(true);
      } else {
        root.style.height = '';
      }
    };
    window.visualViewport.addEventListener('resize', onVV);
  }

  if (getToken()) {
    api.me().then((u: any) => { applyUser(u); return loadState(); }).then(() => enterApp()).catch(() => { setToken(''); });
  }
}

export function disposeApp() {
  if (onResize) window.removeEventListener('resize', onResize);
  if (onKey) window.removeEventListener('keydown', onKey);
  if (onVV && window.visualViewport) window.visualViewport.removeEventListener('resize', onVV);
  if (ro) { try { ro.disconnect(); } catch (e) { /* ignore */ } }
  stopEvents();
}
