import { computed } from 'vue';
import { state, visible, memberColor } from './state';
import { orderTasks } from './tasks';

/**
 * Shared derived data (was scattered through renderVals) — semantic values
 * only; presentation lives in the components.
 */

export const visTasks = computed(() => state.tasks.filter((t: any) => visible(t.scope)));

export const dbCounts = computed(() => {
  const v = visTasks.value;
  return {
    all: v.length,
    today: v.filter((t: any) => t.today).length,
    open: v.filter((t: any) => t.status !== 'done').length,
    done: v.filter((t: any) => t.status === 'done').length,
    collab: v.filter((t: any) => t.collabFrom).length,
  } as Record<string, number>;
});

export const DB_VIEW_DEFS: Array<[string, string, string]> = [
  ['all', '全部任务', 'ph-stack'],
  ['today', '今日', 'ph-sun-horizon'],
  ['open', '未完成', 'ph-circle-dashed'],
  ['done', '已完成', 'ph-check-circle'],
  ['collab', '协作任务', 'ph-users'],
];

export const dbViewName = computed(() => (({ all: '全部任务', today: '今日', open: '未完成', done: '已完成', collab: '协作任务' } as Record<string, string>)[state.dbView]));

/** 项目/优先级筛选 + 搜索后的基础集（看板列也从这里取） */
export const dbFilteredBase = computed(() => {
  let dbase = visTasks.value;
  if (state.dbProject !== 'all') dbase = dbase.filter((t: any) => t.project === state.dbProject);
  if (state.dbPriority !== 'all') dbase = dbase.filter((t: any) => t.priority === Number(state.dbPriority));
  const dq = (state.dbSearch || '').toLowerCase();
  if (dq) dbase = dbase.filter((t: any) => t.title.toLowerCase().includes(dq));
  return dbase;
});

/** 视图过滤 + 排序（显式排序 or 拖拽顺序）后的表格行 */
export const dbTableTasks = computed(() => {
  const dbase = dbFilteredBase.value;
  let tbl = dbase;
  if (state.dbView === 'today') tbl = dbase.filter((t: any) => t.today);
  else if (state.dbView === 'open') tbl = dbase.filter((t: any) => t.status !== 'done');
  else if (state.dbView === 'done') tbl = dbase.filter((t: any) => t.status === 'done');
  else if (state.dbView === 'collab') tbl = dbase.filter((t: any) => t.collabFrom);
  if (state.dbSortKey) {
    const dir = state.dbSortDir === 'asc' ? 1 : -1;
    const dOrd = (d: string) => {
      const m: Record<string, number> = { 昨天: 0, 今天: 1, 明天: 2, 后天: 3, 周一: 4, 周二: 4, 周三: 4, 周四: 5, 周五: 6, 下周: 8, 月底: 9, 待定: 99 };
      for (const k in m) { if (d && d.indexOf(k) >= 0) return m[k]; }
      return 50;
    };
    const sOrd: Record<string, number> = { todo: 0, in_progress: 1, done: 2 };
    tbl = [...tbl].sort((a: any, b: any) => {
      if (state.dbSortKey === 'title') return dir * a.title.localeCompare(b.title, 'zh');
      if (state.dbSortKey === 'project') return dir * a.project.localeCompare(b.project, 'zh');
      if (state.dbSortKey === 'priority') return dir * (a.priority - b.priority);
      if (state.dbSortKey === 'due') return dir * (dOrd(a.due) - dOrd(b.due));
      if (state.dbSortKey === 'status') return dir * (sOrd[a.status] - sOrd[b.status]);
      return 0;
    });
  } else {
    tbl = orderTasks(tbl); // 无显式排序时应用自定义拖拽顺序
  }
  return tbl;
});

export const BOARD_DEFS: Array<{ key: string; name: string; color: string }> = [
  { key: 'todo', name: '待办', color: 'var(--text3)' },
  { key: 'in_progress', name: '进行中', color: 'var(--idea)' },
  { key: 'done', name: '已完成', color: 'var(--accent)' },
];

export const boardCols = computed(() =>
  BOARD_DEFS.map((d) => ({
    ...d,
    count: dbFilteredBase.value.filter((t: any) => t.status === d.key).length,
    cards: orderTasks(dbFilteredBase.value.filter((t: any) => t.status === d.key)),
  })),
);

export const projectOptions = computed(() => [{ value: 'all', label: '全部项目' }].concat([...new Set(state.tasks.map((t: any) => t.project as string))].map((p) => ({ value: p, label: p }))));

export const PRIORITY_OPTIONS = [
  { value: 'all', label: '全部优先级' },
  { value: '1', label: 'P1 紧急' },
  { value: '2', label: 'P2 高' },
  { value: '3', label: 'P3 中' },
  { value: '4', label: 'P4 低' },
];

/** 任务行/卡的语义元数据（不含样式） */
export function taskMeta(t: any) {
  const statusLabel = ({ todo: '待办', in_progress: '进行中', done: '已完成' } as Record<string, string>)[t.status];
  const done = t.status === 'done';
  const prog = t.status === 'in_progress';
  const asg = t.assignee || state.settings.name || '我';
  return {
    statusLabel: t.collabFrom ? statusLabel + ' · 来自 ' + t.collabFrom : statusLabel,
    done, prog,
    dueSoon: t.due === '今天 17:00' || t.due === '明天' || t.today,
    selected: state.dbSelected.includes(t.id),
    assignee: asg,
    assigneeInitial: asg.slice(-1),
    assigneeColor: memberColor(asg),
  };
}

/** P1–P4 的前景/底色（沿用语义 token） */
export const PRIO_COLORS: Record<number, [string, string]> = {
  1: ['var(--danger)', 'var(--danger-bg)'],
  2: ['var(--idea)', 'var(--idea-bg)'],
  3: ['var(--text2)', 'var(--mid)'],
  4: ['var(--text3)', 'var(--mid)'],
};

export const modeLabel = computed(() => (state.workspace === 'work' ? '工作' : '个人') + (state.privacy ? ' · 隐私' : ''));

export const visNotifs = computed(() => state.notifications.filter((n: any) => (state.settings.notifPrefs as any)[n.type] !== false));
export const unreadCount = computed(() => visNotifs.value.filter((n: any) => !n.read).length);

export const feedView = computed(() => {
  const fq = (state.feedQuery || '').toLowerCase();
  const dotOf: Record<string, string> = { task: 'var(--accent)', idea: 'var(--idea)', nono: 'var(--nono)' };
  const labelOf: Record<string, string> = { task: '任务', idea: '待澄清', nono: '非 todo' };
  return state.feed
    .filter((f: any) => {
      const ref = state.tasks.find((t: any) => t.id === f.refId) || state.ideas.find((i: any) => i.id === f.refId) || state.nonTodos.find((n: any) => n.id === f.refId);
      return ref ? visible(ref.scope) : true;
    })
    .filter((f: any) => !fq || String(f.title || '').toLowerCase().includes(fq))
    .map((f: any) => ({ ...f, label: labelOf[f.kind], dot: dotOf[f.kind], muted: f.kind === 'nono' }));
});

export const visIdeas = computed(() => state.ideas.filter((i: any) => visible(i.scope)));
export const selIdea = computed(() => state.ideas.find((i: any) => i.id === state.selIdeaId && visible(i.scope)) || visIdeas.value[0] || null);

export const visNon = computed(() => state.nonTodos.filter((n: any) => visible(n.scope)));
export const selNon = computed(() => state.nonTodos.find((n: any) => n.id === state.selNonId && visible(n.scope)) || visNon.value[0] || null);

export const DEST_LABEL: Record<string, string> = { copy: '建议复制', export: '建议导出', archive: '建议归档', discard: '建议删除' };

export const canEdit = computed(() => state.role !== 'viewer');
export const isViewer = computed(() => state.role === 'viewer');
export const canAdmin = computed(() => state.role === 'admin');
export const roleLabel = computed(() => (({ admin: '管理员', member: '成员', viewer: '只读' } as Record<string, string>)[state.role]));

export const detailTask = computed(() => state.tasks.find((t: any) => t.id === state.detailId) || null);

export const todayCount = computed(() => (state.tasks || []).filter((t: any) => t.today && t.status !== 'done').length);
