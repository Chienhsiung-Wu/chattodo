import { state, patch } from './state';
import { visible } from './state';
import { flashToast } from './toast';
import { toggleTheme } from './theme';
import { go } from './nav';
import { openTask } from './tasks';
import { send } from './chat';

export function pushRecent(item: { type: string; id: string; label: string }) {
  patch((s) => ({ recent: [item, ...(s.recent || []).filter((r) => !(r.type === item.type && r.id === item.id))].slice(0, 6) }));
}

export function closePalette() { patch({ searchOpen: false, searchQuery: '', paletteIndex: 0 }); }

export function openRecent(r: any) {
  if (r.type === 'task') openTask(r.id);
  else if (r.type === 'project') patch({ view: 'projects', selProjectId: r.id });
}

export function paletteCapture(text: string) {
  if (state.role === 'viewer') { flashToast('只读模式 · 无法创建内容'); closePalette(); return; }
  patch({ view: 'chat', searchOpen: false, searchQuery: '', paletteIndex: 0 }, () => {
    const c = document.getElementById('lx-composer') as HTMLTextAreaElement | null;
    if (c) c.value = text;
    send();
  });
}

export function openFeed(f: any) {
  if (f.kind === 'task') patch({ view: 'chat', detailId: f.refId });
  else if (f.kind === 'idea') patch({ view: 'clarify', mobilePane: 'main' });
  else patch({ view: 'nontodo', mobilePane: 'main' });
}

export function buildPalette() {
  const st = state;
  const q = (st.searchQuery || '').trim();
  const ql = q.toLowerCase();
  const groups: Array<{ name: string; items: any[] }> = [];
  const nav = (v: string, label: string, icon: string) => ({ icon, label, run: () => { go(v); closePalette(); } });
  const cmds: any[] = [
    { icon: 'ph-plus-circle', label: '新建捕获（聊天输入）', run: () => { go('chat'); closePalette(); setTimeout(() => { const c = document.getElementById('lx-composer'); if (c) c.focus(); }, 60); } },
    nav('chat', '前往 · 聊天', 'ph-chat-circle'), nav('database', '前往 · Todo 数据库', 'ph-table'), nav('projects', '前往 · 项目', 'ph-folders'), nav('clarify', '前往 · 待澄清区', 'ph-lightbulb'), nav('nontodo', '前往 · 非 todo 隔离区', 'ph-tray'), nav('agent', '前往 · Agent 配置', 'ph-sparkle'), nav('settings', '前往 · 设置', 'ph-gear'),
    { icon: 'ph-moon', label: '切换 明 / 暗 主题', run: () => { toggleTheme(); closePalette(); } },
    { icon: 'ph-briefcase', label: '切换工作区（工作 / 个人）', run: () => { patch((s) => ({ workspace: s.workspace === 'work' ? ('personal' as const) : ('work' as const) })); closePalette(); } },
    { icon: 'ph-lock-simple', label: '切换隐私模式', run: () => { patch((s) => ({ privacy: !s.privacy })); closePalette(); } },
  ];
  if (st.role === 'admin') cmds.push(nav('admin', '前往 · 内部后台', 'ph-chart-bar'));
  if (!q) {
    const rec = (st.recent || []).map((r) => ({ icon: r.type === 'task' ? 'ph-check-square' : r.type === 'project' ? 'ph-folder' : 'ph-note', label: r.label, run: () => { openRecent(r); closePalette(); } }));
    if (rec.length) groups.push({ name: '最近', items: rec });
    groups.push({ name: '快捷命令', items: cmds });
  } else {
    groups.push({ name: '捕获', items: [{ icon: 'ph-lightning', label: '捕获：“' + q + '”', run: () => paletteCapture(q) }] });
    const fc = cmds.filter((c) => c.label.toLowerCase().includes(ql));
    if (fc.length) groups.push({ name: '命令', items: fc });
    const ft = st.tasks.filter((t: any) => visible(t.scope) && t.title.toLowerCase().includes(ql)).slice(0, 5).map((t: any) => ({ icon: 'ph-check-square', label: t.title, run: () => { openTask(t.id); closePalette(); } }));
    if (ft.length) groups.push({ name: '任务', items: ft });
    const fp = st.projects.filter((p) => p.name.toLowerCase().includes(ql)).map((p) => ({ icon: 'ph-folder', label: p.name, run: () => { patch({ view: 'projects', selProjectId: p.id }); closePalette(); } }));
    if (fp.length) groups.push({ name: '项目', items: fp });
    const fi = st.ideas.filter((i: any) => visible(i.scope) && i.title.toLowerCase().includes(ql)).slice(0, 3).map((i: any) => ({ icon: 'ph-lightbulb', label: i.title, run: () => { patch({ view: 'clarify', selIdeaId: i.id }); closePalette(); } }));
    if (fi.length) groups.push({ name: '待澄清', items: fi });
    const fn = st.nonTodos.filter((n: any) => visible(n.scope) && n.title.toLowerCase().includes(ql)).slice(0, 3).map((n: any) => ({ icon: 'ph-tray', label: n.title, run: () => { patch({ view: 'nontodo', selNonId: n.id }); closePalette(); } }));
    if (fn.length) groups.push({ name: '非 todo', items: fn });
  }
  const flat: any[] = [];
  groups.forEach((g) => g.items.forEach((it) => { it.flatIdx = flat.length; flat.push(it); }));
  return { groups, flat };
}

export function paletteKey(e: KeyboardEvent) {
  const flat = buildPalette().flat;
  const n = flat.length;
  if (e.key === 'ArrowDown') { e.preventDefault(); patch((s) => ({ paletteIndex: Math.min((s.paletteIndex || 0) + 1, Math.max(0, n - 1)) })); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); patch((s) => ({ paletteIndex: Math.max((s.paletteIndex || 0) - 1, 0) })); }
  else if (e.key === 'Enter') { e.preventDefault(); const it = flat[state.paletteIndex || 0] || flat[0]; if (it) it.run(); }
  else if (e.key === 'Escape') { patch({ searchOpen: false }); }
}
