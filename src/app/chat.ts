import { api } from '@/lib/api.js';
import { expandTimeTokens } from '@/lib/timeTokens.js';
import { state, patch, visible, nextId } from './state';
import { mapTask, mapIdea, mapNon, buildMessages } from './mappers';
import { flashToast } from './toast';
import { openTask } from './tasks';
import { loadFriends } from './friends';
import { loadState } from './session';

/** 智能吸底：只有当用户本就在底部附近（或 force）才滚动，避免翻看历史时被拽回 */
export function scrollMsgs(force?: boolean) {
  const b = document.getElementById('lx-msgs');
  if (!b) return;
  if (force || b.scrollHeight - b.scrollTop - b.clientHeight < 180) b.scrollTop = b.scrollHeight;
}

/** 轻量意图预判（与后端 detectIntent 同源的规则）：给「思考中」状态一行真实的分析文案。 */
export function guessIntent(t: string) {
  const m = (t || '').trim();
  if (/(记一下|记个|提醒我|帮我记|加个任务|新建任务|加一条|建个任务)/.test(m)) return 'capture';
  if (/^(你好|您好|hi|hello|嗨|哈喽|hey|早上好|下午好|晚上好|早安|晚安|在吗|在不在|谢谢|谢啦|辛苦了)[呀啊哦呢!！。?？~～\s]*$/i.test(m)) return 'greeting';
  if (m.length <= 24 && /(你是谁|你能做什么|你会什么|你能干什么|能干嘛|会干嘛|怎么用|使用说明|有什么功能|帮助|help)/i.test(m)) return 'help';
  if (['做什么', '接下来', '安排什么', '该干嘛', '下一步做', '两小时', '怎么安排', '规划一下', '帮我规划', '帮我安排'].some((k) => m.includes(k))) return 'plan';
  if (/^(有什么|有哪些|哪些|列出|列一下|看看我?|查看|查一下|查询|显示|盘点|汇总|统计)/.test(m) && /(任务|待办|todo|事情|安排|到期|没做|完成)/i.test(m)) return 'query';
  if (/(到期|逾期|过期)/.test(m) && /(哪些|什么|有没有|多少)/.test(m) && m.length <= 30) return 'query';
  if (/^(?:帮我)?(?:把)?(.{1,50}?)(?:标记为?完成|置为完成|标记完成|完成掉|搞定了|做完了|已完成|完成了)[。!！~～]*$/.test(m) || /^完成(?:任务)?[:：]/.test(m)) return 'complete';
  if (/^(?:帮我)?(?:把)?(.{1,50}?)(?:删了|删掉|删除|删除掉)[。!！~～]*$/.test(m) || /^(?:帮我)?删除/.test(m) || /^删掉/.test(m)) return 'delete';
  if (/[?？]$/.test(m) || /^(为什么|什么是|如何|怎么样|怎么办|是不是|能不能|可不可以|有没有)/.test(m)) return 'question';
  return 'capture';
}

export function thinkLabel(intent: string) {
  const map: Record<string, string> = {
    greeting: '识别为问候 · 正在组织回复…',
    help: '识别为功能咨询 · 正在整理能力清单…',
    plan: '识别为规划请求 · 正在按截止与优先级编排…',
    query: '识别为查询请求 · 正在检索任务清单…',
    complete: '识别为完成命令 · 正在匹配目标任务…',
    delete: '识别为删除命令 · 正在匹配目标任务…',
    question: '识别为提问 · 正在组织回答…',
    capture: '初步判断为待归档内容 · 正在分类并提取时间 / 优先级…',
  };
  return map[intent] || '正在处理…';
}

let thinkTimer: ReturnType<typeof setTimeout> | undefined;
export function startThinking(text: string) {
  clearTimeout(thinkTimer);
  patch({ thinking: true, thinkText: '正在分析意图…' });
  const label = thinkLabel(guessIntent(text));
  thinkTimer = setTimeout(() => {
    if (state.thinking) patch({ thinkText: label }, () => scrollMsgs());
  }, 420);
}

/** 撤销 AI 的一次判断：删除生成的实体，卡片原地变为灰色回执 */
export function undoEntity(msg: any) {
  const kind = msg.kind, refId = msg.refId, title = msg.title || msg.text || '';
  if (!refId) return;
  const p = kind === 'task' ? api.deleteTask(refId) : kind === 'idea' ? api.ideaDiscard(refId) : api.nonDiscard(refId);
  p.then(() => {
    patch((s) => ({
      tasks: kind === 'task' ? s.tasks.filter((x: any) => x.id !== refId) : s.tasks,
      ideas: kind === 'idea' ? s.ideas.filter((x: any) => x.id !== refId) : s.ideas,
      nonTodos: kind === 'nono' ? s.nonTodos.filter((x: any) => x.id !== refId) : s.nonTodos,
      feed: s.feed.filter((f: any) => f.refId !== refId),
      messages: s.messages.map((x: any) => (x.id === msg.id ? { id: x.id, role: 'sys', text: '已撤销：' + String(title).slice(0, 30) } : x)),
      detailId: s.detailId === refId ? null : s.detailId,
    }));
    flashToast('已撤销');
  }).catch((e: any) => flashToast('撤销失败：' + e.message));
}

/** 计划卡「开始执行」：按顺序把 plannedAt 写进任务，进入「今日」视图 */
export function commitPlan(msg: any) {
  if (msg.committed) return;
  const items = (msg.plan || []).filter((p: any) => p.id).map((p: any) => ({ id: p.id, minutes: p.m || 30 }));
  if (!items.length) { flashToast('该计划没有可执行的任务'); return; }
  api.commitPlan(items).then((r: any) => {
    const map = new Map((r.updated || []).map((t: any) => [t.id, mapTask(t)]));
    patch((s) => ({
      tasks: s.tasks.map((x: any) => (map.has(x.id) ? { ...x, ...(map.get(x.id) as any) } : x)),
      messages: s.messages.map((x: any) => (x.id === msg.id ? { ...x, committed: true } : x)),
    }));
    flashToast('已写入执行计划 · 在「今日」视图查看');
  }).catch((e: any) => flashToast('操作失败：' + e.message));
}

/** 历史回链：用户消息 → 它生成的实体 */
export function openEntity(type: string, id: string) {
  if (type === 'task') {
    if (state.tasks.some((t: any) => t.id === id)) openTask(id);
    else flashToast('该任务已被删除或移出');
    return;
  }
  if (type === 'todo_idea') {
    if (state.ideas.some((i: any) => i.id === id)) patch({ view: 'clarify', selIdeaId: id, mobilePane: 'main' });
    else flashToast('该想法已被处理');
    return;
  }
  if (state.nonTodos.some((n: any) => n.id === id)) patch({ view: 'nontodo', selNonId: id, mobilePane: 'main' });
  else flashToast('该记录已被处理');
}

// ---- 多对话 ----
export function loadConversations() {
  api.conversations().then((r: any) => patch({ conversations: r.conversations || [] })).catch(() => {});
}

export function newConversation() {
  api.createConversation().then((c: any) => {
    patch((s) => ({
      conversations: [c, ...s.conversations],
      activeConversationId: c.id,
      messages: [{ id: 'welcome_' + c.id, role: 'ai', kind: 'text', text: '新的对话已开启。把想法、任务丢给我，或问我「接下来做什么」。' }],
      view: 'chat', mobilePane: 'main' as const,
    }), () => {
      scrollMsgs(true);
      const el = document.getElementById('lx-composer');
      if (el) el.focus();
    });
  }).catch((e: any) => flashToast('新建失败：' + e.message));
}

export function switchConversation(id: string) {
  if (id === state.activeConversationId) { patch({ mobilePane: 'main' }); return; }
  patch({ activeConversationId: id, mobilePane: 'main' });
  api.conversationMessages(id).then((r: any) => {
    patch({ messages: buildMessages(r.chat) }, () => scrollMsgs(true));
  }).catch((e: any) => flashToast('加载对话失败：' + e.message));
}

export function deleteConversationUi(id: string) {
  if (!window.confirm('删除这个对话及其消息？此操作不可恢复。')) return;
  api.deleteConversation(id).then(() => {
    const rest = state.conversations.filter((c: any) => c.id !== id);
    const wasActive = state.activeConversationId === id;
    patch({ conversations: rest });
    if (wasActive) {
      if (rest.length) switchConversation(rest[0].id);
      else loadState();
    }
    flashToast('已删除对话');
  }).catch((e: any) => flashToast('删除失败：' + e.message));
}

export function retry(msgId: string, text: string) {
  patch((s) => ({ messages: s.messages.map((m: any) => (m.id === msgId ? { ...m, retrying: true } : m)) }));
  api.capture(text, 'chat').then(({ result, entityType, entity }: any) => {
    let aiMsg: any;
    const add: any = {};
    if (entityType === 'task') {
      const nt = mapTask(entity);
      add.tasks = [nt, ...state.tasks];
      aiMsg = { id: msgId, role: 'ai', kind: 'task', title: nt.title, reason: result.reason || '', chips: [{ i: 'ph-calendar-blank', t: '截止 ' + nt.due }, { i: 'ph-folder', t: nt.project }, { i: 'ph-flag', t: 'P' + nt.priority }], refId: nt.id };
    } else if (entityType === 'todo_idea') {
      const ni = mapIdea(entity);
      add.ideas = [ni, ...state.ideas];
      aiMsg = { id: msgId, role: 'ai', kind: 'idea', title: ni.title, reason: result.reason || '', suggest: ni.suggest, refId: ni.id };
    } else {
      const nn = mapNon(entity);
      add.nonTodos = [nn, ...state.nonTodos];
      aiMsg = { id: msgId, role: 'ai', kind: 'nono', text: nn.title, reason: result.reason || '', refId: nn.id };
    }
    patch((s) => ({
      ...add,
      messages: s.messages.map((m: any) => (m.id === msgId ? aiMsg : m)),
      aiErrors: s.aiErrors.map((e: any) => (e.raw === text && e.status === 'failed' ? { ...e, status: '已重试成功' } : e)),
    }), () => scrollMsgs());
    flashToast('已重试 · 生成成功');
  }).catch((e: any) => {
    patch((s) => ({ messages: s.messages.map((m: any) => (m.id === msgId ? { ...m, retrying: false } : m)) }));
    flashToast('重试失败：' + e.message);
  });
}

export async function send() {
  if (state.role === 'viewer') { flashToast('只读模式 · 无法创建内容'); return; }
  const el = document.getElementById('lx-composer') as HTMLTextAreaElement | null;
  if (!el) return;
  const rawT = (el.value || '').trim();
  const refs = state.pendingRefs.slice();
  if (!rawT && !refs.length) return;
  el.value = '';
  el.style.height = 'auto';
  const mentions = collectMentions(rawT); // 结构化提及从原文采集（含 @人名）
  const t = expandTimeTokens(rawT); // 时间快捷词就地展开：展示与保存一致
  const uid = nextId();
  const userMsg = { id: uid, role: 'user', text: t || '（就引用内容继续）', refs: refs.map((r) => r.label) };
  patch((s) => ({ messages: [...s.messages, userMsg], pendingRefs: [], mentions: [], mentionOpen: false, mentionQuery: '' }), () => scrollMsgs(true));
  startThinking(refs.length && !t ? '帮我规划' : t);

  // 纯 @文档引用（无正文）→ 本地快速计划 / 拆解（不落库）；有正文时走后端并携带结构化提及
  if (refs.length && !t) {
    const parent = refs[0].label, isProj = refs[0].type === 'project';
    let plan: any[], planTitle: string, planSub: string, planNote: string;
    if (isProj) {
      const pts = state.tasks.filter((x: any) => x.project === parent && x.status !== 'done' && visible(x.scope)).slice(0, 4);
      plan = pts.length ? pts.map((x: any, i: number) => ({ n: i + 1, t: x.title, d: x.due || '待定' })) : [{ n: 1, t: '该项目下暂无未完成任务', d: '' }];
      planTitle = '基于 @' + parent + ' 的下一步计划'; planSub = '只使用该项目下的可见未完成任务'; planNote = '未使用非 todo 内容';
    } else {
      const subsDef: Array<[string, string]> = [['梳理目标与范围', '25 min'], ['完成核心部分', '45 min'], ['自查并同步 / 提交', '20 min']];
      plan = subsDef.map((s, i) => ({ n: i + 1, t: parent + ' · ' + s[0], d: s[1] }));
      planTitle = '基于 @' + parent + ' 拆成 3 个小任务'; planSub = '（引用拆解建议）'; planNote = '来源 @' + parent;
    }
    const aiMsg = { id: nextId(), role: 'ai', kind: 'plan', planTitle, planSub, planNote, plan };
    setTimeout(() => patch((s) => ({ thinking: false, messages: [...s.messages, aiMsg] }), () => scrollMsgs()), 260);
    return;
  }

  // 纯文本 → 后端 /api/chat/stream（SSE 流式：status→意图状态行，delta→逐字渐显，done→实体/动作落地）
  try {
    let streamId: string | null = null;
    let gotAnyEvent = false;
    const onDelta = (d: string) => {
      if (!d) return;
      if (!streamId) {
        streamId = nextId();
        patch((s) => ({ thinking: false, messages: [...s.messages, { id: streamId, role: 'ai', kind: 'text', text: d, streaming: true }] }), () => scrollMsgs());
      } else {
        patch((s) => ({ messages: s.messages.map((m: any) => (m.id === streamId ? { ...m, text: m.text + d } : m)) }), () => scrollMsgs());
      }
    };
    let res: any;
    try {
      res = await api.chatStream(t, {
        onStatus: (st: any) => { gotAnyEvent = true; if (st && st.intent && st.intent !== 'agent') patch({ thinkText: thinkLabel(st.intent) }); },
        onDelta,
      }, mentions, state.activeConversationId as any);
    } catch (streamErr) {
      // 只有「一个事件都没收到」才回退重发——服务端一旦开始处理（status/delta 已到），
      // 重发会导致动作重复执行（重复建任务/重复邀请），此时走错误卡由用户决定重试。
      if (streamId || gotAnyEvent) throw streamErr;
      res = await api.chat(t, mentions, state.activeConversationId as any);
    }
    const newMsgs: any[] = [];
    let tasks = state.tasks.slice(), ideas = state.ideas.slice(), nonTodos = state.nonTodos.slice(), feedArr = state.feed.slice();
    // 1) created entities → cards
    for (const it of res.entities || []) {
      const reason = (it.result && it.result.reason) || res.reply || '';
      if (it.type === 'task') {
        const nt = mapTask(it.entity);
        tasks = [nt, ...tasks];
        feedArr = [{ id: nt.id, kind: 'task', title: nt.title, time: '刚刚', refId: nt.id }, ...feedArr];
        newMsgs.push({ id: nextId(), role: 'ai', kind: 'task', title: nt.title, reason, chips: [{ i: 'ph-calendar-blank', t: '截止 ' + nt.due }, { i: 'ph-folder', t: nt.project }, { i: 'ph-flag', t: 'P' + nt.priority }], refId: nt.id });
      } else if (it.type === 'todo_idea') {
        const ni = mapIdea(it.entity);
        ideas = [ni, ...ideas];
        feedArr = [{ id: ni.id, kind: 'idea', title: ni.title, time: '刚刚', refId: ni.id }, ...feedArr];
        newMsgs.push({ id: nextId(), role: 'ai', kind: 'idea', title: ni.title, reason: ni.reason || reason, suggest: ni.suggest, refId: ni.id });
      } else {
        const nn = mapNon(it.entity);
        nonTodos = [nn, ...nonTodos];
        feedArr = [{ id: nn.id, kind: 'nono', title: nn.title, time: '刚刚', refId: nn.id }, ...feedArr];
        newMsgs.push({ id: nextId(), role: 'ai', kind: 'nono', text: nn.title, reason: nn.reason || reason, refId: nn.id });
      }
    }
    // 2) performed actions → update local rows
    for (const p of res.performed || []) {
      if (p.type === 'complete_task' && p.task) { const mt = mapTask(p.task); tasks = tasks.map((x: any) => (x.id === mt.id ? { ...x, ...mt } : x)); }
      else if (p.type === 'update_task' && p.task) { const mt = mapTask(p.task); tasks = tasks.map((x: any) => (x.id === mt.id ? { ...x, ...mt } : x)); }
      else if (p.type === 'delete_task') { tasks = tasks.filter((x: any) => x.id !== p.id); feedArr = feedArr.filter((f: any) => f.refId !== p.id); }
      else if (p.type === 'remember') { api.getAgent().then((ap: any) => patch((s) => ({ agent: { ...s.agent, memory: ap.memory || s.agent.memory } }))).catch(() => {}); }
      else if (p.type === 'convert_idea') { ideas = ideas.filter((x: any) => x.id !== p.ideaId); feedArr = feedArr.filter((f: any) => f.refId !== p.ideaId); }
      else if (p.type === 'invite') { newMsgs.push({ id: nextId(), role: 'ai', kind: 'text', text: p.auto ? '⚙️ 按你的规则「' + (p.rule || '') + '」，已自动邀请 ' + (p.userName || '成员') + ' 协作（待接受）' : '🤝 已向 ' + (p.userName || '成员') + ' 发出协作邀请，对方接受后你们将同步进度。' }); }
      else if (p.type === 'auto_rule') { api.autoRules().then((r: any) => patch({ autoRules: r.rules || [] })).catch(() => {}); }
      else if (p.type === 'respond_invite' && p.accept) { /* 任务实体已随 entities 渲染 */ }
      else if (p.type === 'friend_request' || p.type === 'add_friend' || p.type === 'respond_friend') { loadFriends(); api.team().then((tt: any) => patch({ team: tt.users || [] })).catch(() => {}); }
    }
    // 3) plan card（携带任务 id/分钟数，支持「开始执行」落地）
    if (res.plan && res.plan.length) {
      newMsgs.push({ id: nextId(), role: 'ai', kind: 'plan', planTitle: '接下来 · 建议计划', planSub: '基于当前可见 todo', planNote: '未使用非 todo 内容制定计划', plan: res.plan.map((p: any, i: number) => ({ n: i + 1, t: p.task.title, d: (p.minutes || 30) + ' min', id: p.task.id, m: p.minutes || 30 })) });
    }
    // 4) natural-language reply bubble（已流式渐显则只做终态校正，不再重复气泡）
    if (!streamId) {
      const showReply = res.reply && ((res.entities || []).length === 0 || res.intent === 'agent');
      if (showReply) newMsgs.push({ id: nextId(), role: 'ai', kind: 'text', text: res.reply });
      if (!newMsgs.length && res.reply) newMsgs.push({ id: nextId(), role: 'ai', kind: 'text', text: res.reply });
    }
    patch((s) => ({
      tasks, ideas, nonTodos, feed: feedArr, thinking: false,
      activeConversationId: res.conversationId || s.activeConversationId,
      messages: [...s.messages.map((m: any) => (m.id === streamId ? { ...m, streaming: false, text: res.reply || m.text } : m)), ...newMsgs],
    }), () => {
      scrollMsgs();
      const c = document.getElementById('lx-composer');
      if (c) c.focus();
      loadConversations();
    });
  } catch (e: any) {
    const aiMsg = { id: nextId(), role: 'ai', kind: 'error', errType: (e && e.message) || '请求失败', retryText: t };
    patch((s) => ({
      thinking: false,
      messages: [...s.messages, aiMsg],
      aiErrors: [{ id: 'e' + nextId(), user: s.settings.name, raw: t, errType: (e && e.message) || '请求失败', time: '刚刚', status: 'failed' }, ...s.aiErrors],
    }), () => scrollMsgs());
  }
}

export function onComposerInput(e: Event) {
  const el = e.target as HTMLTextAreaElement;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  const val = el.value;
  const caret = el.selectionStart != null ? el.selectionStart : val.length;
  const upto = val.slice(0, caret);
  const at = upto.lastIndexOf('@');
  if (at >= 0) {
    const q = upto.slice(at + 1);
    if (!/\s/.test(q)) { patch({ mentionOpen: true, mentionQuery: q, mentionAt: at, mentionIndex: 0 }); return; }
  }
  if (state.mentionOpen) patch({ mentionOpen: false, mentionQuery: '' });
}

/** 时间提及预设：既有可读文案（供 detectDue 解析），又带精确 ISO（供后端权威落库） */
export function timePresets() {
  const base = new Date();
  base.setSeconds(0, 0);
  const at = (offset: number, h: number, label: string) => {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    d.setHours(h, 0, 0, 0);
    return { type: 'time', entityType: 'time', iso: d.toISOString(), label, insert: label.replace(/\s+/, '').replace(':00', '点').replace('：00', '点') };
  };
  const dow = (target: number, h: number, label: string) => {
    const d = new Date(base);
    let diff = (target - d.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    d.setDate(d.getDate() + diff);
    d.setHours(h, 0, 0, 0);
    return { type: 'time', entityType: 'time', iso: d.toISOString(), label, insert: label.replace(/\s+/, '').replace(':00', '点') };
  };
  return [at(0, 18, '今天 18:00'), at(1, 10, '明天 10:00'), at(1, 18, '明天 18:00'), at(2, 10, '后天 10:00'), dow(5, 18, '本周五 18:00'), dow(1, 10, '下周一 10:00')];
}

/** 三类提及候选：人（好友）/ 时间（预设）/ 文档（任务·项目·笔记） */
export function mentionCandidates() {
  const mq = (state.mentionQuery || '').toLowerCase();
  const f = (arr: any[]) => (mq ? arr.filter((x) => String(x.label).toLowerCase().includes(mq)) : arr);
  const me = state.settings.name;
  const persons = f((state.team || []).filter((u: any) => u.name !== me).map((u: any) => ({ kind: 'person', type: 'person', userId: u.id, label: u.name }))).slice(0, 4);
  const times = f(timePresets().map((t) => ({ kind: 'time', type: 'time', iso: t.iso, label: t.label, insert: t.insert }))).slice(0, 5);
  const tasks = f(state.tasks.filter((t: any) => visible(t.scope)).map((t: any) => ({ kind: 'doc', type: 'doc', entityType: 'task', id: t.id, label: t.title }))).slice(0, 4);
  const projs = f([...new Set(state.tasks.map((t: any) => t.project).filter((p: any) => p && p !== '收件箱' && p !== '协作'))].map((p) => ({ kind: 'doc', type: 'doc', entityType: 'project', id: 'p:' + p, label: p }))).slice(0, 3);
  const notes = f((state.nonTodos || []).filter((n: any) => visible(n.scope)).map((n: any) => ({ kind: 'doc', type: 'doc', entityType: 'note', id: n.id, label: n.title }))).slice(0, 2);
  return [...persons, ...times, ...tasks, ...projs, ...notes];
}

function replaceAtToken(insert: string) {
  const el = document.getElementById('lx-composer') as HTMLTextAreaElement | null;
  const at = state.mentionAt;
  if (el && at >= 0) {
    const val = el.value;
    const caret = el.selectionStart != null ? el.selectionStart : val.length;
    el.value = val.slice(0, at) + insert + val.slice(caret);
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }
}

export function pickMention(item: any) {
  const refocus = () => { const e2 = document.getElementById('lx-composer'); if (e2) e2.focus(); };
  if (item.kind === 'person') {
    // 人：@名字 留在输入框（可读）+ 记录结构化 person（含 userId）→ 后端精确匹配、发协作邀请
    replaceAtToken('@' + item.label + ' ');
    patch((s) => ({
      mentions: s.mentions.some((m: any) => m.type === 'person' && m.userId === item.userId) ? s.mentions : [...s.mentions, { type: 'person', userId: item.userId, label: item.label }],
      mentionOpen: false, mentionQuery: '',
    }), refocus);
    return;
  }
  if (item.kind === 'time') {
    // 时间：插入可读文案（供 detectDue）+ 记录结构化 ISO（供后端权威落库）
    replaceAtToken((item.insert || item.label) + ' ');
    patch((s) => ({
      mentions: [...s.mentions.filter((m: any) => m.type !== 'time'), { type: 'time', iso: item.iso, label: item.label }],
      mentionOpen: false, mentionQuery: '',
    }), refocus);
    return;
  }
  // 文档：以标签芯片展示（可读）+ 结构化 doc metadata；不写进正文，避免被当成 @成员
  replaceAtToken('');
  patch((s) => ({
    pendingRefs: s.pendingRefs.some((r: any) => r.id === item.id) ? s.pendingRefs : [...s.pendingRefs, { type: item.entityType, id: item.id, label: item.label }],
    mentionOpen: false, mentionQuery: '',
  }), refocus);
}

export function removeRef(id: string) {
  patch((s) => ({ pendingRefs: s.pendingRefs.filter((r: any) => r.id !== id) }));
}

/** 组装本轮结构化提及：人/时间保留（且其可读文本仍在正文里）+ 文档芯片 → doc */
export function collectMentions(text: string) {
  const inline = (state.mentions || []).filter((m: any) => m.type === 'time' || (m.type === 'person' && text.includes('@' + m.label)));
  const docs = (state.pendingRefs || []).map((r: any) => ({ type: 'doc', entityType: r.type, id: String(r.id).replace(/^p:/, ''), label: r.label }));
  return [...inline, ...docs];
}

export function atButton() {
  const el = document.getElementById('lx-composer') as HTMLTextAreaElement | null;
  if (!el) return;
  el.focus();
  const v = el.value;
  const sep = v === '' || v.endsWith(' ') ? '' : ' ';
  el.value = v + sep + '@';
  patch({ mentionOpen: true, mentionQuery: '', mentionAt: el.value.length - 1, mentionIndex: 0 });
}

export function mentionEnterOrSend() {
  if (state.mentionOpen) {
    const items = mentionCandidates();
    const it = items[state.mentionIndex || 0] || items[0];
    if (it) { pickMention(it); return; }
    patch({ mentionOpen: false });
    return;
  }
  send();
}
