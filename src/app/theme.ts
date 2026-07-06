import { api } from '@/lib/api.js';
import { state, patch } from './state';

/**
 * Theme is driven purely by <html data-theme> — tokens.css does the rest.
 * (The legacy inline body-var injection is gone; styles.css maps the app's
 * semantic vars onto tokens for both themes.)
 */
export function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : 'light');
}

export function toggleTheme() {
  patch((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' }), () => {
    applyTheme();
    api.updateSettings({ theme: state.theme }).catch(() => {});
  });
}
