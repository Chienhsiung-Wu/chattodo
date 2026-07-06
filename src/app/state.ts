import { reactive, nextTick } from 'vue';

/**
 * Single shared reactive app state — the module-composable replacement for the
 * legacy class Component's `this.state`. During migration the legacy class is
 * bridged onto THIS object (setup(): inst.state = state), so old methods and
 * new components always read/write the same store.
 */

export interface AppState {
  authed: boolean;
  authMode: 'login' | 'register';
  authName: string;
  authEmail: string;
  authPassword: string;
  authError: string;
  authBusy: boolean;
  view: string;
  theme: 'light' | 'dark';
  workspace: 'work' | 'personal';
  privacy: boolean;
  dbView: string;
  dbLayout: 'table' | 'board';
  dbSearch: string;
  dbProject: string;
  dbPriority: string;
  dbSortKey: string;
  dbSortDir: 'asc' | 'desc';
  dbSelected: string[];
  role: string;
  detailTab: 'detail' | 'comments' | 'activity';
  notifOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  paletteIndex: number;
  shortcutsOpen: boolean;
  selProjectId: string | null;
  recent: Array<{ type: string; id: string; label: string }>;
  taskSubs: Record<string, Array<{ id: string; text: string; done: boolean }>>;
  taskComments: Record<string, Array<{ author: string; text: string; time: string }>>;
  taskActivity: Record<string, Array<{ text: string; time: string }>>;
  notifications: any[];
  projects: Array<{ id: string; name: string; desc: string; status: string; color: string }>;
  aiErrors: any[];
  adminUsers: any[];
  adminSelId: string | null;
  adminRecords: any[];
  adminUserErrors: any[];
  adminLoading: boolean;
  feedQuery: string;
  pwdOpen: boolean;
  pwdOld: string;
  pwdNew: string;
  pwdBusy: boolean;
  team: Array<{ id: string; name: string }>;
  friends: { accepted: any[]; incoming: any[]; outgoing: any[] };
  addFriendEmail: string;
  conversations: any[];
  activeConversationId: string | null;
  taskOrder: string[];
  dragOverCol: string | null;
  midW: number | null;
  paneSwap: boolean;
  paneDragActive: boolean;
  todayOpen: boolean;
  todayLoading: boolean;
  todayError: string;
  todayItems: any[];
  newProjOpen: boolean;
  newProjName: string;
  aiSource: 'team' | 'own';
  ownAiOpen: boolean;
  taskCollabs: Record<string, any[]>;
  taskAccess: Record<string, string>;
  invitePickerOpen: boolean;
  autoRules: any[];
  detailId: string | null;
  thinking: boolean;
  thinkText: string;
  toast: string | null;
  isMobile: boolean;
  mobilePane: 'list' | 'main';
  mentionOpen: boolean;
  mentionQuery: string;
  mentionAt: number;
  mentionIndex: number;
  pendingRefs: Array<{ type: string; id: string; label: string }>;
  mentions: any[];
  selIdeaId: string | null;
  selNonId: string | null;
  agentSection: string;
  setSection: string;
  agent: { soul: string; memory: string; preferences: string; workingStyle: string; privacyRules: string; followup: string };
  settings: {
    name: string; accountName: string; email: string; apiKey: string; aiTested: boolean;
    defaultWs: string; defaultView: string; aiVisibility: string; privacyDefault: boolean;
    friendPolicy: string; notifPrefs: { assign: boolean; due: boolean; fail: boolean; done: boolean };
    aiPreset: string; aiProvider: string; aiBaseUrl: string; aiModel: string; aiHasKey: boolean; aiFallback: boolean;
  };
  tasks: any[];
  ideas: any[];
  nonTodos: any[];
  messages: any[];
  feed: any[];
  _loaded?: boolean;
  [key: string]: any;
}

export const state = reactive<AppState>({
  authed: false,
  authMode: 'login', authName: '', authEmail: '', authPassword: '', authError: '', authBusy: false,
  view: 'chat',
  theme: 'light',
  workspace: 'work',
  privacy: false,
  dbView: 'all', dbLayout: 'table', dbSearch: '', dbProject: 'all', dbPriority: 'all', dbSortKey: '', dbSortDir: 'asc', dbSelected: [],
  role: 'admin',
  detailTab: 'detail', notifOpen: false, searchOpen: false, searchQuery: '', paletteIndex: 0, shortcutsOpen: false, selProjectId: null,
  recent: [],
  taskSubs: {},
  taskComments: {},
  taskActivity: {},
  notifications: [],
  projects: [],
  aiErrors: [],
  adminUsers: [], adminSelId: null, adminRecords: [], adminUserErrors: [], adminLoading: false,
  feedQuery: '',
  pwdOpen: false, pwdOld: '', pwdNew: '', pwdBusy: false,
  team: [],
  friends: { accepted: [], incoming: [], outgoing: [] }, addFriendEmail: '',
  conversations: [], activeConversationId: null,
  taskOrder: [], dragOverCol: null, midW: null, paneSwap: false, paneDragActive: false,
  todayOpen: false, todayLoading: false, todayError: '', todayItems: [],
  newProjOpen: false, newProjName: '',
  aiSource: 'team', ownAiOpen: false,
  taskCollabs: {}, taskAccess: {}, invitePickerOpen: false,
  autoRules: [],
  detailId: null,
  thinking: false, thinkText: '',
  toast: null,
  isMobile: false, mobilePane: 'main',
  mentionOpen: false, mentionQuery: '', mentionAt: -1, mentionIndex: 0, pendingRefs: [], mentions: [],
  selIdeaId: null, selNonId: null, agentSection: 'soul', setSection: 'account',
  agent: { soul: '', memory: '', preferences: '', workingStyle: '', privacyRules: '', followup: '' },
  settings: { name: '', accountName: '', email: '', apiKey: '', aiTested: false, defaultWs: 'work', defaultView: 'chat', aiVisibility: 'visible_scope_only', privacyDefault: false, friendPolicy: 'open', notifPrefs: { assign: true, due: true, fail: true, done: true }, aiPreset: '规则版（离线）', aiProvider: 'rule', aiBaseUrl: '', aiModel: '', aiHasKey: false, aiFallback: true },
  tasks: [],
  ideas: [],
  nonTodos: [],
  messages: [],
  feed: [],
});

/**
 * setState-equivalent: accepts an object patch or an updater fn over the
 * current state, applies via Object.assign, and runs the callback after the
 * next DOM flush — byte-compatible with the legacy shim's semantics.
 */
export function patch(p: Partial<AppState> | ((s: AppState) => Partial<AppState> | null | undefined) | null | undefined, cb?: () => void) {
  const obj = typeof p === 'function' ? p(state) : p;
  if (obj) Object.assign(state, obj);
  if (cb) nextTick(cb);
}

/** Privacy filter: an item is visible unless privacy mode hides other scopes. */
export function visible(scope: string) {
  return !state.privacy || scope === state.workspace || scope === 'mixed';
}

/** Categorical identity colors (avatars/projects) — theme-aware tokens. */
export const COLOR_POOL = ['var(--cat-1)', 'var(--cat-2)', 'var(--cat-3)', 'var(--cat-4)', 'var(--cat-5)'];

export function memberColor(name?: string | null) {
  if (!name) return 'var(--cat-fallback)';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return COLOR_POOL[Math.abs(h) % COLOR_POOL.length];
}

/** AI 接入预设：选中即预填，全部字段仍可自由编辑；「自定义」适配任何 OpenAI 兼容服务。 */
export const AI_PRESETS = [
  { name: '规则版（离线）', provider: 'rule', baseUrl: '', models: [] as string[], hint: '无需 Key，离线规则分类' },
  { name: 'OpenAI', provider: 'openai', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'o3'], hint: '' },
  { name: 'Claude', provider: 'anthropic', baseUrl: '', models: ['claude-sonnet-5', 'claude-opus-4-8', 'claude-haiku-4-5-20251001'], hint: 'Base URL 留空使用官方接口' },
  { name: 'DeepSeek', provider: 'openai', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'], hint: '' },
  { name: '通义千问', provider: 'openai', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen-max', 'qwen-plus', 'qwen-turbo'], hint: '' },
  { name: 'Kimi', provider: 'openai', baseUrl: 'https://api.moonshot.cn/v1', models: ['moonshot-v1-8k', 'moonshot-v1-32k'], hint: '' },
  { name: '豆包', provider: 'openai', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', models: [], hint: '模型填接入点 ID' },
  { name: 'Gemini', provider: 'openai', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', models: ['gemini-2.5-pro', 'gemini-2.5-flash'], hint: '走 OpenAI 兼容层' },
  { name: '自定义', provider: 'openai', baseUrl: '', models: [], hint: '任何 OpenAI 兼容服务：自填 Base URL 与模型' },
];

/** Monotonic id for locally-created chat message rows ('m123'). */
let seq = 100;
export function nextId() {
  return 'm' + ++seq;
}
