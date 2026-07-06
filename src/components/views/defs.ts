/** View-level shared config (section defs for list panes + main views). */

export interface AgentDef { key: string; name: string; icon: string; desc: string }
export const AGENT_DEFS: AgentDef[] = [
  { key: 'soul', name: '人格 Soul', icon: 'ph-fingerprint', desc: '人格、原则、语气、决策倾向' },
  { key: 'memory', name: '记忆 Memory', icon: 'ph-brain', desc: '长期背景、固定项目、用户习惯' },
  { key: 'preferences', name: '偏好', icon: 'ph-sliders-horizontal', desc: '输出偏好、排序偏好、沟通偏好' },
  { key: 'workingStyle', name: '工作方式', icon: 'ph-strategy', desc: 'GTD、时间块等方法论偏好' },
  { key: 'privacyRules', name: '隐私规则', icon: 'ph-lock-simple', desc: '哪些内容默认 work / personal，AI 何时不可读取' },
  { key: 'followup', name: '追问策略', icon: 'ph-chats-circle', desc: '任务不清楚时如何追问' },
];

export const SET_DEFS: Array<{ key: string; name: string; icon: string }> = [
  { key: 'account', name: '账号', icon: 'ph-user-circle' },
  { key: 'general', name: '通用', icon: 'ph-sliders-horizontal' },
  { key: 'ai', name: 'AI 接入', icon: 'ph-plugs-connected' },
  { key: 'notifications', name: '通知', icon: 'ph-bell' },
  { key: 'privacy', name: '隐私与安全', icon: 'ph-shield-check' },
  { key: 'data', name: '数据', icon: 'ph-database' },
];
