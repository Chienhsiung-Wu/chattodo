import { api } from '@/lib/api.js';
import { expandTimeTokens } from '@/lib/timeTokens.js';
import { state, patch } from './state';
import { mapNon, mapTask } from './mappers';
import { flashToast } from './toast';
import { pushRecent } from './palette';

export function openTask(id: string) {
  patch({ detailId: id, invitePickerOpen: false });
  const t = state.tasks.find((x: any) => x.id === id);
  if (t) pushRecent({ type: 'task', id, label: t.title });
  api.getTaskDetail(id).then((d: any) => {
    if (!d || !d.task) return;
    const gr = d.generationRecord;
    patch((s) => ({
      taskSubs: { ...s.taskSubs, [id]: (d.subtasks || []).map((x: any) => ({ id: x.id, text: x.text, done: x.done })) },
      taskComments: { ...s.taskComments, [id]: (d.comments || []).map((c: any) => ({ author: c.author, text: c.text, time: c.createdAt || '' })) },
      taskActivity: { ...s.taskActivity, [id]: (d.activity || []).map((a: any) => ({ text: a.text, time: a.createdAt || '' })) },
      taskCollabs: { ...s.taskCollabs, [id]: d.collaborators || [] },
      taskAccess: { ...s.taskAccess, [id]: d.access || 'owner' },
      tasks: gr ? s.tasks.map((x: any) => (x.id === id ? { ...x, raw: gr.rawInput || x.raw, reason: gr.aiReason || x.reason, conf: gr.confidence != null ? String(gr.confidence) : x.conf, gen: gr.createdAt || x.gen } : x)) : s.tasks,
    }));
  }).catch(() => {});
}

export function patchTask(id: string, p: any) {
  const ep = { ...p };
  if (typeof ep.title === 'string') ep.title = expandTimeTokens(ep.title);
  if (typeof ep.notes === 'string') ep.notes = expandTimeTokens(ep.notes);
  patch((s) => ({ tasks: s.tasks.map((t: any) => (t.id === id ? { ...t, ...ep, edited: true } : t)) }));
  const body: any = {};
  ['title', 'notes', 'status', 'priority', 'assignee'].forEach((k) => { if (k in ep) body[k] = ep[k]; });
  if ('scope' in ep) body.privacyScope = ep.scope;
  if (Object.keys(body).length) api.updateTask(id, body).catch(() => {});
}

export function moveOut(id: string) {
  const t = state.tasks.find((x: any) => x.id === id);
  patch((s) => ({ tasks: s.tasks.filter((x: any) => x.id !== id), detailId: null }));
  api.taskMoveOut(id).then((r: any) => {
    if (r && r.nonTodo) patch((s) => ({ nonTodos: [mapNon(r.nonTodo), ...s.nonTodos] }));
    flashToast('已移出 todo · 保留来源与生成记录');
  }).catch((e: any) => {
    if (t) patch((s) => ({ tasks: [t, ...s.tasks] }));
    flashToast('移出失败：' + e.message);
  });
}

export function leaveCollabTask(id: string) {
  if (!window.confirm('退出协作后，这个任务将从你的列表中移除。确定退出吗？')) return;
  api.leaveTask(id).then(() => {
    patch((s) => ({ tasks: s.tasks.filter((t: any) => t.id !== id), detailId: null, feed: s.feed.filter((f: any) => f.refId !== id) }));
    flashToast('已退出协作');
  }).catch((e: any) => flashToast('操作失败：' + e.message));
}

export function inviteMember(taskId: string, u: any, force?: boolean) {
  api.inviteCollab(taskId, u.id, force).then((r: any) => {
    flashToast(r.reused ? u.name + ' 已在协作名单里' : '已邀请 ' + u.name + '（待接受）');
    openTask(taskId);
  }).catch((e: any) => {
    if (e && e.status === 409 && window.confirm(e.message || '个人任务，确认邀请？')) { inviteMember(taskId, u, true); return; }
    flashToast('邀请失败：' + e.message);
  });
}

export function inviteAll(taskId: string) {
  const existing = new Set((state.taskCollabs[taskId] || []).filter((c: any) => ['pending', 'accepted', 'following'].includes(c.status)).map((c: any) => c.userId));
  const me = state.settings.name;
  const targets = (state.team || []).filter((u: any) => u.name !== me && !existing.has(u.id));
  if (!targets.length) { flashToast('没有可邀请的成员了'); return; }
  Promise.allSettled(targets.map((u: any) => api.inviteCollab(taskId, u.id))).then((rs) => {
    const ok = rs.filter((r) => r.status === 'fulfilled').length;
    flashToast('已向 ' + ok + ' 位成员发出邀请');
    openTask(taskId);
  });
}

// ---- 拖拽排序：本地顺序（localStorage 记忆），应用到看板与表格 ----
let dragId: string | null = null;

export function orderTasks(list: any[]) {
  const ord = state.taskOrder;
  if (!ord || !ord.length) return list;
  const map = new Map(ord.map((id, i) => [id, i]));
  return [...list].sort((a, b) => (map.has(a.id) ? (map.get(a.id) as number) : 1e9) - (map.has(b.id) ? (map.get(b.id) as number) : 1e9));
}

function saveOrder(order: string[]) {
  try { localStorage.setItem('lx_task_order', JSON.stringify(order)); } catch (e) { /* ignore */ }
}

function moveInOrder(dragged: string, beforeId: string | null) {
  let order = (state.taskOrder || []).slice();
  const allIds = state.tasks.map((t: any) => t.id);
  for (const id of allIds) if (!order.includes(id)) order.push(id); // 新任务补进顺序
  order = order.filter((id) => allIds.includes(id) && id !== dragged); // 清理已删除 + 摘出被拖的
  if (beforeId) { const i = order.indexOf(beforeId); order.splice(i < 0 ? order.length : i, 0, dragged); }
  else order.push(dragged);
  patch({ taskOrder: order, dragOverCol: null });
  saveOrder(order);
}

export function dragStart(id: string, e?: DragEvent) {
  dragId = id;
  try { if (e && e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); } } catch (_) { /* ignore */ }
}

export function dropOnCard(targetId: string, e?: Event) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const drag = dragId;
  dragId = null;
  if (!drag || drag === targetId) return;
  const dragT = state.tasks.find((x: any) => x.id === drag), tgtT = state.tasks.find((x: any) => x.id === targetId);
  if (dragT && tgtT && dragT.status !== tgtT.status) patchTask(drag, { status: tgtT.status });
  moveInOrder(drag, targetId);
}

export function dropOnCol(status: string) {
  const drag = dragId;
  dragId = null;
  patch({ dragOverCol: null });
  if (!drag) return;
  const dragT = state.tasks.find((x: any) => x.id === drag);
  if (dragT && dragT.status !== status) patchTask(drag, { status });
  moveInOrder(drag, null);
}

// ---- 数据库视图操作 ----
export function setDbLayout(l: 'table' | 'board') { patch({ dbLayout: l }); }

export function toggleSort(key: string) {
  patch((s) => ({ dbSortKey: key, dbSortDir: s.dbSortKey === key && s.dbSortDir === 'asc' ? ('desc' as const) : ('asc' as const) }));
}

export function toggleSelect(id: string) {
  patch((s) => ({ dbSelected: s.dbSelected.includes(id) ? s.dbSelected.filter((x) => x !== id) : [...s.dbSelected, id] }));
}

export function selectAll(ids: string[]) {
  patch((s) => ({ dbSelected: ids.length > 0 && ids.every((i) => s.dbSelected.includes(i)) ? [] : ids.slice() }));
}

export function clearSel() { patch({ dbSelected: [] }); }

export function batchStatus(status: string) {
  const ids = state.dbSelected.slice();
  patch((s) => ({ tasks: s.tasks.map((t: any) => (ids.includes(t.id) ? { ...t, status, edited: true } : t)), dbSelected: [] }));
  ids.forEach((id) => api.updateTask(id, { status }).catch(() => {}));
  flashToast('已更新 ' + ids.length + ' 项状态');
}

export function batchPriority(p: number) {
  const ids = state.dbSelected.slice();
  patch((s) => ({ tasks: s.tasks.map((t: any) => (ids.includes(t.id) ? { ...t, priority: p, edited: true } : t)), dbSelected: [] }));
  ids.forEach((id) => api.updateTask(id, { priority: p }).catch(() => {}));
  flashToast('已设为 P' + p);
}

export function batchMoveOut() {
  const ids = state.dbSelected.slice();
  patch((s) => ({ tasks: s.tasks.filter((t: any) => !ids.includes(t.id)), dbSelected: [] }));
  Promise.all(ids.map((id) => api.taskMoveOut(id).then((r: any) => r && r.nonTodo).catch(() => null))).then((rs) => {
    const nons = rs.filter(Boolean).map((n: any) => mapNon(n));
    if (nons.length) patch((s) => ({ nonTodos: [...nons, ...s.nonTodos] }));
  });
  flashToast('已移出 ' + ids.length + ' 项 · 保留来源');
}

export function batchDelete() {
  const ids = state.dbSelected.slice();
  patch((s) => ({ tasks: s.tasks.filter((t: any) => !ids.includes(t.id)), dbSelected: [] }));
  ids.forEach((id) => api.deleteTask(id).catch(() => {}));
  flashToast('已删除 ' + ids.length + ' 项');
}

export function assignTask(id: string, name: string) {
  patch((s) => ({
    tasks: s.tasks.map((t: any) => (t.id === id ? { ...t, assignee: name } : t)),
    taskActivity: { ...s.taskActivity, [id]: [{ text: '指派给 ' + name, time: '刚刚' }, ...(s.taskActivity[id] || [])] },
  }));
  api.updateTask(id, { assignee: name }).catch(() => {});
  flashToast('已指派给 ' + name);
}

export function logActivity(id: string, text: string) {
  patch((s) => ({ taskActivity: { ...s.taskActivity, [id]: [{ text, time: '刚刚' }, ...(s.taskActivity[id] || [])] } }));
}

export function dSetStatus(status: string) {
  const id = state.detailId;
  if (!id) return;
  patchTask(id, { status });
  logActivity(id, '状态改为「' + ({ todo: '待办', in_progress: '进行中', done: '已完成' } as Record<string, string>)[status] + '」');
}

export function addSub() {
  const el = document.getElementById('lx-sub') as HTMLInputElement | null;
  if (!el) return;
  const v = (el.value || '').trim();
  if (!v) return;
  el.value = '';
  const id = state.detailId;
  if (!id) return;
  api.addSubtask(id, v).then((sub: any) => {
    patch((s) => ({
      taskSubs: { ...s.taskSubs, [id]: [...(s.taskSubs[id] || []), { id: sub.id, text: sub.text, done: sub.done }] },
      taskActivity: { ...s.taskActivity, [id]: [{ text: '添加子任务：' + v, time: '刚刚' }, ...(s.taskActivity[id] || [])] },
    }));
  }).catch((e: any) => flashToast('添加失败：' + e.message));
}

export function toggleSub(sid: string) {
  const id = state.detailId;
  if (!id) return;
  patch((s) => ({ taskSubs: { ...s.taskSubs, [id]: (s.taskSubs[id] || []).map((x: any) => (x.id === sid ? { ...x, done: !x.done } : x)) } }));
  api.toggleSubtask(sid).catch(() => {});
}

export function addComment() {
  const el = document.getElementById('lx-cmt') as HTMLInputElement | null;
  if (!el) return;
  const v = (el.value || '').trim();
  if (!v) return;
  el.value = '';
  const id = state.detailId;
  if (!id) return;
  const author = state.settings.name;
  api.addComment(id, v, author).then((c: any) => {
    patch((s) => ({
      taskComments: { ...s.taskComments, [id]: [...(s.taskComments[id] || []), { author: c.author, text: c.text, time: c.createdAt || '刚刚' }] },
      taskActivity: { ...s.taskActivity, [id]: [{ text: '发表了评论', time: '刚刚' }, ...(s.taskActivity[id] || [])] },
    }));
  }).catch((e: any) => flashToast('评论失败：' + e.message));
}
