import { api } from '@/lib/api.js';
import { state, patch } from './state';
import { lxFmtDue } from './format';

/** 今日待办浮层：点击胶囊呼出，拉取 view=today，四态（加载/错误/空/列表）+ 刷新 */
export function toggleTodayPanel() {
  const open = !state.todayOpen;
  patch({ todayOpen: open });
  if (open) loadToday();
}

export function closeTodayPanel() { patch({ todayOpen: false }); }
export function refreshToday() { loadToday(); }

export function loadToday() {
  patch({ todayLoading: true, todayError: '' });
  const rank = (t: any) => (({ in_progress: 0, todo: 1, done: 2 } as Record<string, number>)[t.status] != null ? ({ in_progress: 0, todo: 1, done: 2 } as Record<string, number>)[t.status] : 1);
  api.listTasks({ view: 'today' }).then((list: any) => {
    const arr = Array.isArray(list) ? list : list.tasks || [];
    const items = arr.filter((t: any) => t.status !== 'archived').sort((a: any, b: any) => (rank(a) - rank(b) || String(a.dueAt || a.plannedAt || '9999') < String(b.dueAt || b.plannedAt || '9999') ? -1 : 1));
    patch({ todayItems: items, todayLoading: false });
  }).catch((e: any) => patch({ todayLoading: false, todayError: (e && e.message) || '加载失败，请重试' }));
}

export function todayProgress(t: any) {
  const sl = ({ todo: '待办', in_progress: '进行中', done: '已完成' } as Record<string, string>)[t.status] || '待办';
  const when = t.dueAt ? '截止 ' + lxFmtDue(t.dueAt) : t.plannedAt ? '计划 ' + lxFmtDue(t.plannedAt) : '未排期';
  const parts = [sl, when, 'P' + (t.priority || 3)];
  if (t.collabFrom) parts.unshift('协作·来自' + t.collabFrom);
  return parts.join(' · ');
}
