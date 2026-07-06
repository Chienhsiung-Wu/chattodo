import { api } from '@/lib/api.js';
import { state, patch } from './state';
import { flashToast } from './toast';
import { loadState } from './session';

export function pickAiPreset(p: any) {
  patch((s) => ({ settings: { ...s.settings, aiPreset: p.name, aiProvider: p.provider, aiBaseUrl: p.baseUrl, aiModel: (p.models && p.models[0]) || '', aiTested: false } }));
}

export function setAiField(field: string, val: any) {
  patch((s) => ({
    settings: {
      ...s.settings, [field]: val, aiTested: false,
      ...(field === 'aiBaseUrl' || field === 'aiModel' ? { aiPreset: s.settings.aiPreset === '规则版（离线）' ? s.settings.aiPreset : '自定义' } : {}),
    },
  }));
}

export function aiCfg() {
  const s = state.settings;
  const cfg: any = { provider: s.aiProvider || 'rule', baseUrl: (s.aiBaseUrl || '').trim(), model: (s.aiModel || '').trim(), fallbackToRule: s.aiFallback !== false };
  if ((s.apiKey || '').trim()) cfg.apiKey = s.apiKey.trim();
  return cfg;
}

export function testConn() {
  flashToast('测试中…');
  api.testAiConfig(aiCfg()).then((r: any) => {
    patch((s) => ({ settings: { ...s.settings, aiTested: !!r.ok } }));
    flashToast(r.ok ? '连接正常 · ' + (r.kind || '模型可用') : '连接失败：' + (r.error || ''));
  }).catch((e: any) => {
    patch((s) => ({ settings: { ...s.settings, aiTested: false } }));
    flashToast('测试失败：' + e.message);
  });
}

export function saveOwnAi() {
  api.updateOwnAiConfig(aiCfg()).then(() => {
    patch((s) => ({ aiSource: 'own' as const, settings: { ...s.settings, apiKey: '' } }));
    flashToast('已保存个人 AI 配置（仅对你生效）');
  }).catch((e: any) => flashToast('保存失败：' + e.message));
}

export function clearOwnAi() {
  api.clearOwnAiConfig().then(() => loadState().then(() => flashToast('已恢复使用团队配置'))).catch((e: any) => flashToast('操作失败：' + e.message));
}

export function updateAgent(field: string, val: string) {
  patch((s) => ({ agent: { ...s.agent, [field]: val } }));
  const map: Record<string, string> = { soul: 'soul', memory: 'memory', preferences: 'preferences', workingStyle: 'workingStyle', privacyRules: 'privacyRules', followup: 'defaultFollowupStrategy' };
  const col = map[field];
  if (col) api.updateAgent({ [col]: val }).catch(() => {});
}

export function updateSetting(field: string, val: any) {
  patch((s) => ({ settings: { ...s.settings, [field]: val } }));
  const map: Record<string, string> = { defaultWs: 'workspaceMode', defaultView: 'defaultView', aiVisibility: 'aiVisibility', privacyDefault: 'privacyMode', friendPolicy: 'friendPolicy' };
  const col = map[field];
  if (col) api.updateSettings({ [col]: field === 'privacyDefault' ? !!val : val }).catch(() => {});
}

export function toggleNotifPref(k: string) {
  patch((s) => ({ settings: { ...s.settings, notifPrefs: { ...s.settings.notifPrefs, [k]: !(s.settings.notifPrefs as any)[k] } } }), () => api.updateSettings({ notifPrefs: state.settings.notifPrefs }).catch(() => {}));
}

export function submitPwd() {
  const { pwdOld, pwdNew } = state;
  if (!pwdNew || pwdNew.length < 8) { flashToast('新密码至少 8 位'); return; }
  patch({ pwdBusy: true });
  api.changePassword(pwdOld, pwdNew).then(() => {
    patch({ pwdBusy: false, pwdOpen: false, pwdOld: '', pwdNew: '' });
    flashToast('密码已更新');
  }).catch((e: any) => {
    patch({ pwdBusy: false });
    flashToast('修改失败：' + e.message);
  });
}

export function doExport() {
  api.exportData().then((data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'linx-export-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    flashToast('已导出全部数据 (JSON)');
  }).catch((e: any) => flashToast('导出失败：' + e.message));
}

export function doClearData() {
  if (!window.confirm('确定清空当前账号下的全部任务、想法与聊天记录吗？此操作不可恢复。')) return;
  api.clearData().then(() => loadState().then(() => flashToast('已清空数据'))).catch((e: any) => flashToast('清空失败：' + e.message));
}

export function deleteRule(id: string) {
  api.deleteAutoRule(id).then(() => {
    patch((s) => ({ autoRules: s.autoRules.filter((r: any) => r.id !== id) }));
    flashToast('已删除自动规则');
  }).catch((e: any) => flashToast('删除失败：' + e.message));
}
