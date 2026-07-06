import { state } from './state';
import { lxPad, lxFmtDue, lxIsToday } from './format';

/** Server rows → UI rows (verbatim logic from the legacy class). */

export function projName(pid?: string | null) {
  if (!pid) return '收件箱';
  const p = (state.projects || []).find((x) => x.id === pid);
  return p ? p.name : pid;
}

export function mapTask(t: any) {
  return {
    id: t.id, title: t.title, status: t.status,
    project: t.collabFrom ? '协作' : projName(t.projectId),
    due: lxFmtDue(t.dueAt), today: lxIsToday(t.dueAt) || lxIsToday(t.plannedAt),
    priority: t.priority || 3, scope: t.privacyScope || 'work',
    notes: t.notes || '', raw: t.notes || '', reason: '',
    conf: t.confidence != null ? String(t.confidence) : '',
    gen: t.createdAt || '', edited: false,
    assignee: t.assignee || null, collabFrom: t.collabFrom || null,
    _projectId: t.projectId || null, _dueAt: t.dueAt || null,
  };
}

export function mapIdea(i: any) {
  return { id: i.id, title: i.title, raw: i.rawText, status: i.status, suggest: i.suggestedNextAction, reason: i.aiReason, scope: i.privacyScope || 'work', gen: i.createdAt || '' };
}

export function mapNon(n: any) {
  return { id: n.id, title: n.title, text: n.summary || n.rawText, raw: n.rawText, reason: n.reason, dest: n.suggestedDestination || 'archive', scope: n.privacyScope || 'work', gen: n.createdAt || '', corrected: !!n.corrected };
}

/** 会话消息 → 气泡（日期分隔线 + 时间悬浮 + 用户消息回链实体） */
export function buildMessages(chatRows: any[]) {
  const messages: any[] = [];
  let lastDay = '';
  for (const m of (chatRows || []).slice(-60)) {
    const d = m.createdAt ? new Date(m.createdAt) : null;
    if (d) {
      const day = `${d.getMonth() + 1}月${d.getDate()}日`;
      if (day !== lastDay) {
        lastDay = day;
        const t0 = new Date();
        const isToday = d.getFullYear() === t0.getFullYear() && d.getMonth() === t0.getMonth() && d.getDate() === t0.getDate();
        messages.push({ id: 'day_' + m.id, role: 'sys', text: isToday ? '今天' : day });
      }
    }
    const time = d ? `${d.getMonth() + 1}/${d.getDate()} ${lxPad(d.getHours())}:${lxPad(d.getMinutes())}` : '';
    if (m.role === 'user') messages.push({ id: m.id, role: 'user', text: m.text, time, refType: m.refType || null, refId: m.refId || null });
    else messages.push({ id: m.id, role: 'ai', kind: 'text', text: m.text, isErr: !!m.isError, time });
  }
  return messages;
}
