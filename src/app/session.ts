import { api, setToken } from '@/lib/api.js';
import { state, patch, AI_PRESETS } from './state';
import { mapTask, mapIdea, mapNon, buildMessages } from './mappers';
import { lxFmtDue } from './format';
import { flashToast } from './toast';
import { applyTheme } from './theme';
import { scrollMsgs } from './chat';
import { loadFriends } from './friends';

export async function loadState() {
  try {
    const [st, ai] = await Promise.all([api.getState(), api.getAiConfig().catch(() => null)]);
    // projects first (task mapping resolves project names from them)
    patch({ projects: (st.projects || []).map((p: any, idx: number) => ({ id: p.id, name: p.name, desc: p.description || '', status: p.status || '进行中', color: ['var(--cat-1)', 'var(--cat-2)', 'var(--cat-4)', 'var(--cat-3)'][idx % 4] })) });
    const as = st.appSettings || {}, ap = st.agentProfile || {};
    const feed: any[] = [];
    (st.tasks || []).slice(0, 5).forEach((t: any) => feed.push({ id: t.id, kind: 'task', title: t.title, time: lxFmtDue(t.createdAt), refId: t.id }));
    (st.todoIdeas || []).slice(0, 3).forEach((i: any) => feed.push({ id: i.id, kind: 'idea', title: i.title, time: lxFmtDue(i.createdAt), refId: i.id }));
    (st.nonTodoOutputs || []).slice(0, 3).forEach((n: any) => feed.push({ id: n.id, kind: 'nono', title: n.title, time: lxFmtDue(n.createdAt), refId: n.id }));
    const presetName = ai ? (AI_PRESETS.find((p) => p.provider === ai.provider && (p.baseUrl || '') === (ai.baseUrl || '')) || ({} as any)).name || (ai.provider === 'rule' ? '规则版（离线）' : '自定义') : '规则版（离线）';
    // server chat history → message bubbles（含日期分隔线、时间悬浮、生成实体回链）
    const messages = buildMessages(st.chat);
    api.team().then((t: any) => patch({ team: t.users || [] })).catch(() => {});
    loadFriends();
    api.autoRules().then((r: any) => patch({ autoRules: r.rules || [] })).catch(() => {});
    const np = as.notifPrefs && typeof as.notifPrefs === 'object' ? as.notifPrefs : {};
    patch((s) => ({
      tasks: (st.tasks || []).map((t: any) => mapTask(t)),
      ideas: (st.todoIdeas || []).filter((i: any) => i.status === 'clarifying').map((i: any) => mapIdea(i)),
      nonTodos: (st.nonTodoOutputs || []).map((n: any) => mapNon(n)),
      notifications: (st.notifications || []).map((n: any) => ({ id: n.id, type: n.type, icon: n.icon || 'ph-bell', color: n.color || 'var(--accent-ink)', text: n.text, time: lxFmtDue(n.createdAt), read: !!n.read, actionType: n.actionType || null, actionRef: n.actionRef || null, handled: !!n.handled })),
      feed,
      messages,
      conversations: st.conversations || [],
      activeConversationId: st.activeConversationId || s.activeConversationId,
      theme: as.theme === 'dark' ? ('dark' as const) : ('light' as const),
      agent: { soul: ap.soul || '', memory: ap.memory || '', preferences: ap.preferences || '', workingStyle: ap.workingStyle || '', privacyRules: ap.privacyRules || '', followup: ap.defaultFollowupStrategy || '' },
      workspace: as.workspaceMode || s.workspace,
      privacy: as.privacyMode != null ? !!as.privacyMode : s.privacy,
      settings: { ...s.settings, defaultWs: as.workspaceMode || s.settings.defaultWs, defaultView: as.defaultView || s.settings.defaultView, aiVisibility: as.aiVisibility || s.settings.aiVisibility, privacyDefault: as.privacyMode != null ? !!as.privacyMode : s.settings.privacyDefault, friendPolicy: as.friendPolicy === 'closed' ? 'closed' : 'open', notifPrefs: { assign: np.assign !== false, due: np.due !== false, fail: np.fail !== false, done: np.done !== false }, apiKey: '', aiTested: ai ? !!ai.hasKey : s.settings.aiTested, aiPreset: presetName, aiProvider: ai ? ai.provider : s.settings.aiProvider, aiBaseUrl: ai ? ai.baseUrl || '' : s.settings.aiBaseUrl, aiModel: ai ? ai.model || '' : s.settings.aiModel, aiHasKey: ai ? !!ai.hasKey : s.settings.aiHasKey, aiFallback: ai ? ai.fallbackToRule !== false : s.settings.aiFallback },
      aiSource: ai && ai.source === 'own' ? ('own' as const) : ('team' as const),
      ownAiOpen: !!(ai && ai.source === 'own'),
      _loaded: true,
    }), () => { applyTheme(); scrollMsgs(true); });
  } catch (e: any) {
    if (e && e.status === 401) { setToken(''); patch({ authed: false }); }
    else flashToast('数据加载失败，请刷新重试');
  }
}

export function applyUser(u: any) {
  if (!u) return;
  patch((s) => ({ role: u.role || 'member', settings: { ...s.settings, name: u.name || s.settings.name, accountName: u.accountName || u.name || s.settings.accountName, email: u.email || s.settings.email } }));
}

export function enterApp() {
  const ok = ['chat', 'database', 'projects', 'clarify', 'nontodo', 'agent', 'settings'];
  patch((s) => ({
    authed: true,
    view: ok.includes(s.settings.defaultView) ? s.settings.defaultView : 'chat',
    workspace: (s.settings.defaultWs || 'work') as 'work' | 'personal',
    privacy: !!s.settings.privacyDefault,
    authPassword: '', authError: '',
  }), () => { applyTheme(); scrollMsgs(true); });
  startEvents();
}

// 实时事件：收到推送 → 即时提示 + 节流刷新（2.5s 合并窗口）
let stopEventsFn: (() => void) | null = null;
let lastEvtLoad = 0;
let evtTimer: ReturnType<typeof setTimeout> | undefined;

export function startEvents() {
  if (stopEventsFn) stopEventsFn();
  stopEventsFn = api.subscribeEvents((e: any) => {
    if (e.kind === 'notify' && e.text) flashToast('🔔 ' + String(e.text).slice(0, 46));
    const now = Date.now();
    if (now - lastEvtLoad > 2500) { lastEvtLoad = now; loadState(); }
    else { clearTimeout(evtTimer); evtTimer = setTimeout(() => { lastEvtLoad = Date.now(); loadState(); }, 2600); }
  });
}

export function stopEvents() {
  if (stopEventsFn) { stopEventsFn(); stopEventsFn = null; }
}

export async function submitAuth() {
  const s = state;
  const email = (s.authEmail || '').trim(), pw = s.authPassword || '', name = (s.authName || '').trim();
  if (s.authMode === 'register' && !name) { patch({ authError: '请输入显示名称' }); return; }
  if (!email) { patch({ authError: '请输入邮箱' }); return; }
  if (!pw) { patch({ authError: '请输入密码' }); return; }
  patch({ authBusy: true, authError: '' });
  try {
    const r = s.authMode === 'register' ? await api.register(name, email, pw) : await api.login(email, pw);
    setToken(r.token);
    applyUser(r.user);
    await loadState();
    patch({ authBusy: false });
    enterApp();
    flashToast(s.authMode === 'register' ? '注册成功 · 欢迎使用' : '欢迎回来');
  } catch (e: any) {
    patch({ authBusy: false, authError: (e && e.message) || '请求失败，请稍后再试' });
  }
}

export function doLogout() {
  stopEvents();
  api.logout().catch(() => {});
  setToken('');
  patch({
    authed: false, authMode: 'login', authPassword: '', authError: '', view: 'chat',
    dbView: 'all', dbSearch: '', dbProject: 'all', dbPriority: 'all', dbSelected: [],
    detailId: null, selIdeaId: null, selNonId: null, selProjectId: null, adminSelId: null,
    messages: [], tasks: [], ideas: [], nonTodos: [], feed: [], notifications: [], team: [],
    friends: { accepted: [], incoming: [], outgoing: [] }, addFriendEmail: '',
    conversations: [], activeConversationId: null, taskCollabs: {}, taskAccess: {}, autoRules: [], setSection: 'account',
  });
}
