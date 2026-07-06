import { api } from '@/lib/api.js';
import { state, patch } from './state';
import { mapTask } from './mappers';
import { flashToast } from './toast';

export function convertIdea(id: string) {
  const it = state.ideas.find((x: any) => x.id === id);
  const ideas = state.ideas.filter((x: any) => x.id !== id);
  patch({ ideas, selIdeaId: ideas[0] ? ideas[0].id : null });
  api.ideaConvert(id).then((r: any) => {
    if (r && r.task) patch((s) => ({ tasks: [mapTask(r.task), ...s.tasks] }));
    flashToast('已转为正式任务 · 进入 Todo 数据库');
  }).catch((e: any) => {
    if (it) patch((s) => ({ ideas: [it, ...s.ideas] }));
    flashToast('转换失败：' + e.message);
  });
}

export function discardIdea(id: string) {
  const it = state.ideas.find((x: any) => x.id === id);
  const ideas = state.ideas.filter((x: any) => x.id !== id);
  patch({ ideas, selIdeaId: ideas[0] ? ideas[0].id : null });
  api.ideaDiscard(id).then(() => flashToast('已放弃该待澄清项')).catch((e: any) => {
    if (it) patch((s) => ({ ideas: [it, ...s.ideas] }));
    flashToast('操作失败：' + e.message);
  });
}

export function nonConvert(id: string) {
  const n = state.nonTodos.find((x: any) => x.id === id);
  const nonTodos = state.nonTodos.filter((x: any) => x.id !== id);
  patch({ nonTodos, selNonId: nonTodos[0] ? nonTodos[0].id : null });
  api.nonToTodo(id).then((r: any) => {
    if (r && r.task) patch((s) => ({ tasks: [mapTask(r.task), ...s.tasks] }));
    flashToast('已转为 todo · 进入 Todo 数据库');
  }).catch((e: any) => {
    if (n) patch((s) => ({ nonTodos: [n, ...s.nonTodos] }));
    flashToast('转换失败：' + e.message);
  });
}

export function removeNon(id: string, msg: string) {
  const n = state.nonTodos.find((x: any) => x.id === id);
  const nonTodos = state.nonTodos.filter((x: any) => x.id !== id);
  patch({ nonTodos, selNonId: nonTodos[0] ? nonTodos[0].id : null });
  api.nonDiscard(id).then(() => flashToast(msg)).catch((e: any) => {
    if (n) patch((s) => ({ nonTodos: [n, ...s.nonTodos] }));
    flashToast('操作失败：' + e.message);
  });
}

export function copyNonText() {
  const st = state;
  const n = st.nonTodos.find((x: any) => x.id === st.selNonId) || st.nonTodos[0];
  if (!n) return;
  const txt = n.raw || n.text || n.title;
  const done = () => flashToast('已复制到剪贴板');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(done).catch(() => flashToast('复制失败'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { flashToast('复制失败'); }
    ta.remove();
  }
}

export function exportNonMd() {
  const st = state;
  const n = st.nonTodos.find((x: any) => x.id === st.selNonId) || st.nonTodos[0];
  if (!n) return;
  const md = '# ' + n.title + '\n\n' + (n.text || '') + '\n\n---\n原始输入：' + (n.raw || '') + '\n\nAI 判断：' + (n.reason || '') + '\n导出于 ' + new Date().toLocaleString();
  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (n.title || 'non-todo').slice(0, 24) + '.md';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  flashToast('已导出 Markdown');
}
