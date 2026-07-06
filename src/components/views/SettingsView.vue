<script setup lang="ts">
import { computed } from 'vue';
import { Settings as SettingsIcon, LogOut, Download, UserCog, Lock } from 'lucide-vue-next';
import { api } from '@/lib/api.js';
import { state, patch, AI_PRESETS } from '@/app/state';
import { canAdmin, roleLabel } from '@/app/derived';
import { applyUser, doLogout } from '@/app/session';
import { toggleTheme } from '@/app/theme';
import { pickAiPreset, setAiField, aiCfg, testConn, saveOwnAi, clearOwnAi, updateSetting, toggleNotifPref, submitPwd } from '@/app/settings';
import { doExport, doClearData } from '@/app/settings';
import { flashToast } from '@/app/toast';
import { SET_DEFS } from './defs';
import ViewHeader from '@/components/layout/ViewHeader.vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Select from '@/components/ui/Select.vue';
import Switch from '@/components/ui/Switch.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import Badge from '@/components/ui/Badge.vue';
import MotionReveal from '@/components/motion/MotionReveal.vue';

const setName = computed(() => SET_DEFS.find((d) => d.key === state.setSection)?.name || '');
const meBig = computed(() => (state.settings.name || '我').slice(-1));

// —— account handlers（保持与原逻辑一致的即时保存/回滚）——
function onName(e: Event) {
  const v = (e.target as HTMLInputElement).value.trim();
  if (!v) { flashToast('称呼不能为空'); return; }
  patch((s) => ({ settings: { ...s.settings, name: v } }));
  api.updateMe({ name: v }).then((u: any) => applyUser(u)).catch((err: any) => flashToast('保存失败：' + err.message));
}
function onAccountName(e: Event) {
  const v = (e.target as HTMLInputElement).value.trim();
  const old = state.settings.accountName;
  if (!v) { flashToast('账户名不能为空'); return; }
  patch((s) => ({ settings: { ...s.settings, accountName: v } }));
  api.updateMe({ accountName: v }).then((u: any) => { applyUser(u); flashToast('账户名已更新'); }).catch((err: any) => {
    patch((s) => ({ settings: { ...s.settings, accountName: old } }));
    flashToast('保存失败：' + err.message);
  });
}

// —— general ——
const theme = computed({ get: () => state.theme, set: (v: string) => { if (state.theme !== v) toggleTheme(); } });
const defaultWs = computed({ get: () => state.settings.defaultWs, set: (v: string) => updateSetting('defaultWs', v) });
const defaultView = computed({ get: () => state.settings.defaultView, set: (v: string) => updateSetting('defaultView', v) });
const VIEW_OPTS = [{ value: 'chat', label: '聊天' }, { value: 'database', label: 'Todo 数据库' }, { value: 'projects', label: '项目' }];

// —— ai ——
const aiPreset = computed({
  get: () => state.settings.aiPreset,
  set: (name: string) => { const p = AI_PRESETS.find((x) => x.name === name); if (p) pickAiPreset(p); },
});
const AI_PRESET_OPTS = AI_PRESETS.map((p) => ({ value: p.name, label: p.name }));
const aiPresetHint = computed(() => (AI_PRESETS.find((p) => p.name === state.settings.aiPreset) || { hint: '' }).hint || '');
const aiIsRule = computed(() => state.settings.aiProvider === 'rule');
const aiOwnActive = computed(() => state.aiSource === 'own');
const aiFallback = computed({ get: () => state.settings.aiFallback !== false, set: (v: boolean) => setAiField('aiFallback', v) });

function saveTeamAi() {
  api.updateAiConfig(aiCfg()).then(() => {
    patch((s) => ({ settings: { ...s.settings, apiKey: '' } }));
    flashToast('AI 接入配置已保存');
  }).catch((e: any) => flashToast('保存失败：' + e.message));
}

// —— privacy ——
const aiVisibility = computed({ get: () => state.settings.aiVisibility, set: (v: string) => updateSetting('aiVisibility', v) });
const privacyDefault = computed({ get: () => state.settings.privacyDefault, set: (v: boolean) => updateSetting('privacyDefault', v) });
const friendClosed = computed({
  get: () => state.settings.friendPolicy === 'closed',
  set: () => {
    updateSetting('friendPolicy', state.settings.friendPolicy === 'closed' ? 'open' : 'closed');
    flashToast(state.settings.friendPolicy === 'closed' ? '已谢绝陌生人好友请求 · 只能由你主动添加' : '已开放接收好友请求');
  },
});

const np = (k: 'assign' | 'due' | 'fail' | 'done') => computed({ get: () => state.settings.notifPrefs[k], set: () => toggleNotifPref(k) });
const npAssign = np('assign'), npDue = np('due'), npFail = np('fail'), npDone = np('done');
</script>

<template>
  <ViewHeader title="设置" :caption="setName">
    <template #icon><SettingsIcon :size="19" class="text-accent-brand-ink" /></template>
  </ViewHeader>
  <div class="flex-1 overflow-auto px-6 py-[30px]">
    <div class="mx-auto flex max-w-[600px] flex-col gap-4">
      <!-- 账号 -->
      <template v-if="state.setSection === 'account'">
        <div class="flex items-center gap-3.5 rounded-lg bg-card p-[18px] shadow-xs">
          <span class="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-xl bg-primary text-[24px] font-semibold text-primary-foreground">{{ meBig }}</span>
          <div class="min-w-0 flex-1">
            <div class="text-[16px] font-semibold tracking-tight text-foreground">{{ state.settings.name }}</div>
            <div class="mt-1 text-xs text-tertiary">@{{ state.settings.accountName || state.settings.name }} · {{ state.settings.email }}</div>
          </div>
          <Badge variant="accent">{{ roleLabel }}</Badge>
        </div>
        <div class="rounded-lg bg-card px-[18px] py-1 shadow-xs">
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1">
              <div class="text-sm font-semibold text-foreground">账户名</div>
              <div class="mt-1 text-xs leading-normal text-tertiary">你的唯一账号标识，用于系统展示（登录仍用邮箱）</div>
            </div>
            <Input :model-value="state.settings.accountName" maxlength="24" placeholder="账户名" class="w-[150px]" @change="onAccountName" />
          </div>
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1">
              <div class="text-sm font-semibold text-foreground">称呼</div>
              <div class="mt-1 text-xs leading-normal text-tertiary">聊天、问候与协作里对你的称谓，可随时修改</div>
            </div>
            <Input :model-value="state.settings.name" maxlength="24" placeholder="称呼" class="w-[150px]" @change="onName" />
          </div>
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1">
              <div class="text-sm font-semibold text-foreground">邮箱</div>
              <div class="mt-1 text-xs leading-normal text-tertiary">登录账号，不可修改</div>
            </div>
            <span class="text-sm text-muted-foreground">{{ state.settings.email }}</span>
          </div>
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1">
              <div class="text-sm font-semibold text-foreground">角色</div>
              <div class="mt-1 text-xs leading-normal text-tertiary">首个注册账号为管理员，决定后台访问权限</div>
            </div>
            <Badge variant="accent">{{ roleLabel }}</Badge>
          </div>
          <div class="flex flex-col py-[15px]">
            <div class="flex items-center gap-3.5">
              <div class="flex-1">
                <div class="text-sm font-semibold text-foreground">密码</div>
                <div class="mt-1 text-xs leading-normal text-tertiary">验证当前密码后设置新密码</div>
              </div>
              <Button variant="outline" @click="patch((s) => ({ pwdOpen: !s.pwdOpen, pwdOld: '', pwdNew: '' }))">{{ state.pwdOpen ? '收起' : '修改密码' }}</Button>
            </div>
            <MotionReveal v-if="state.pwdOpen" :y="4" class="mt-3.5 flex flex-col gap-2.5 rounded-md bg-hover p-3.5">
              <Input v-model="state.pwdOld" type="password" placeholder="当前密码" class="h-9 bg-background" />
              <Input v-model="state.pwdNew" type="password" placeholder="新密码（至少 8 位，改密后其他设备将退出登录）" class="h-9 bg-background" />
              <Button variant="primary" class="self-start" :disabled="state.pwdBusy" @click="submitPwd()">{{ state.pwdBusy ? '提交中…' : '确认修改' }}</Button>
            </MotionReveal>
          </div>
        </div>
        <Button class="self-start bg-destructive-soft text-destructive shadow-hairline hover:bg-destructive-soft hover:opacity-80" size="lg" @click="doLogout()"><LogOut />退出登录</Button>
      </template>

      <!-- 通用 -->
      <template v-if="state.setSection === 'general'">
        <div class="rounded-lg bg-card px-[18px] py-1 shadow-xs">
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1">
              <div class="text-sm font-semibold text-foreground">外观主题</div>
              <div class="mt-1 text-xs leading-normal text-tertiary">明亮 / 深色，保存到账号，下次登录生效</div>
            </div>
            <SegmentedControl v-model="theme" :items="[{ value: 'light', label: '明亮' }, { value: 'dark', label: '深色' }]" />
          </div>
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1">
              <div class="text-sm font-semibold text-foreground">默认工作区</div>
              <div class="mt-1 text-xs leading-normal text-tertiary">下次登录时进入的空间</div>
            </div>
            <SegmentedControl v-model="defaultWs" :items="[{ value: 'work', label: '工作' }, { value: 'personal', label: '个人' }]" />
          </div>
          <div class="flex items-center gap-3.5 py-[15px]">
            <div class="flex-1">
              <div class="text-sm font-semibold text-foreground">默认视图</div>
              <div class="mt-1 text-xs leading-normal text-tertiary">下次登录首屏进入的页面</div>
            </div>
            <Select v-model="defaultView" :items="VIEW_OPTS" class="min-w-[130px]" />
          </div>
        </div>
        <div class="rounded-lg bg-hover px-4 py-3 text-xs leading-relaxed text-tertiary">以上设置即时保存到你的账号。</div>
      </template>

      <!-- AI 接入（成员） -->
      <template v-if="state.setSection === 'ai' && !canAdmin">
        <div class="flex items-center gap-3 rounded-lg bg-card p-[18px] shadow-xs">
          <span class="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent-brand-soft text-accent-brand-ink">
            <UserCog v-if="aiOwnActive" :size="20" />
            <Lock v-else :size="20" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-foreground">{{ aiOwnActive ? '正在使用你的个人 AI 配置' : 'AI 接入由管理员统一配置' }}</div>
            <div class="mt-1 text-xs leading-normal text-tertiary">当前模型：{{ aiIsRule ? '规则版（离线）' : (state.settings.aiModel || state.settings.aiPreset) }}{{ aiOwnActive ? ' · 仅对你生效' : ' · 全团队共享' }}</div>
          </div>
          <Button variant="outline" size="sm" @click="patch((s) => ({ ownAiOpen: !s.ownAiOpen }))">{{ state.ownAiOpen ? '收起' : '使用自己的 Key' }}</Button>
        </div>
        <MotionReveal v-if="state.ownAiOpen" :y="4" class="flex flex-col gap-3.5 rounded-lg bg-card p-[18px] shadow-xs">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-semibold text-muted-foreground">服务商预设</span>
            <Select v-model="aiPreset" :items="AI_PRESET_OPTS" />
          </label>
          <template v-if="!aiIsRule">
            <label class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold text-muted-foreground">Base URL</span>
              <Input :model-value="state.settings.aiBaseUrl" placeholder="https://api.deepseek.com/v1" @input="setAiField('aiBaseUrl', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold text-muted-foreground">模型</span>
              <Input :model-value="state.settings.aiModel" class="font-nums" placeholder="如 deepseek-chat / claude-sonnet-5" @input="setAiField('aiModel', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold text-muted-foreground">API Key</span>
              <Input :model-value="state.settings.apiKey" type="password" class="font-nums" :placeholder="aiOwnActive ? '••••••（已配置，留空不修改）' : 'sk-...'" @input="setAiField('apiKey', ($event.target as HTMLInputElement).value)" />
            </label>
          </template>
          <div class="flex items-center gap-2.5">
            <Button variant="primary" @click="saveOwnAi()">保存个人配置</Button>
            <Button v-if="aiOwnActive" variant="outline" @click="clearOwnAi()">恢复团队配置</Button>
            <span class="text-[11.5px] leading-normal text-tertiary">只影响你自己的 AI 调用 · Key 不回显</span>
          </div>
        </MotionReveal>
      </template>

      <!-- AI 接入（管理员） -->
      <template v-if="state.setSection === 'ai' && canAdmin">
        <div class="flex flex-col gap-3.5 rounded-lg bg-card p-[18px] shadow-xs">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-semibold text-muted-foreground">服务商预设</span>
            <Select v-model="aiPreset" :items="AI_PRESET_OPTS" />
            <span v-if="aiPresetHint" class="text-[11.5px] leading-normal text-tertiary">{{ aiPresetHint }}</span>
          </label>
          <template v-if="!aiIsRule">
            <label class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold text-muted-foreground">Base URL</span>
              <Input :model-value="state.settings.aiBaseUrl" placeholder="https://api.deepseek.com/v1（Claude 可留空用官方）" @input="setAiField('aiBaseUrl', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold text-muted-foreground">模型</span>
              <Input :model-value="state.settings.aiModel" class="font-nums" placeholder="如 deepseek-chat / qwen-plus / claude-sonnet-5" @input="setAiField('aiModel', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold text-muted-foreground">API Key <span v-if="state.settings.aiHasKey" class="font-normal text-tertiary">· 已配置（留空则不修改）</span></span>
              <Input :model-value="state.settings.apiKey" type="password" class="font-nums" :placeholder="state.settings.aiHasKey ? '••••••（已配置）' : 'sk-...'" @input="setAiField('apiKey', ($event.target as HTMLInputElement).value)" />
            </label>
            <div class="flex items-center gap-3.5 pt-0.5">
              <div class="flex-1">
                <div class="text-sm font-semibold text-foreground">失败兜底</div>
                <div class="mt-1 text-xs leading-normal text-tertiary">模型调用失败时自动回退规则版，不丢输入</div>
              </div>
              <Switch v-model="aiFallback" />
            </div>
          </template>
          <div v-else class="rounded-lg bg-hover px-4 py-3 text-xs leading-relaxed text-tertiary">规则版为离线关键词分类，无需 API Key。切换到其他服务商即可接入真实模型（支持任意 OpenAI 兼容服务）。</div>
        </div>
        <div class="flex items-center gap-3.5 rounded-lg bg-card px-[18px] py-4 shadow-xs">
          <div class="flex-1">
            <div class="text-sm font-semibold text-foreground">连接状态</div>
            <div class="mt-1 text-xs leading-normal text-tertiary">用一条样例验证服务商 / 模型 / Key</div>
          </div>
          <Badge v-if="state.settings.aiTested" variant="accent"><span class="h-1.5 w-1.5 rounded-pill bg-accent-brand" />可用</Badge>
          <Button variant="outline" @click="testConn()">测试连接</Button>
        </div>
        <div class="flex items-center gap-3">
          <Button variant="primary" size="lg" @click="saveTeamAi">保存配置</Button>
          <span class="text-xs leading-normal text-tertiary">仅保存在你的账号下 · Key 不回显</span>
        </div>
      </template>

      <!-- 通知 -->
      <template v-if="state.setSection === 'notifications'">
        <div class="rounded-lg bg-card px-[18px] py-1 shadow-xs">
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1"><div class="text-sm font-semibold text-foreground">任务指派</div><div class="mt-1 text-xs leading-normal text-tertiary">有人把任务指派给你</div></div>
            <Switch v-model="npAssign" />
          </div>
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1"><div class="text-sm font-semibold text-foreground">到期提醒</div><div class="mt-1 text-xs leading-normal text-tertiary">任务临近截止时间</div></div>
            <Switch v-model="npDue" />
          </div>
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1"><div class="text-sm font-semibold text-foreground">AI 失败告警</div><div class="mt-1 text-xs leading-normal text-tertiary">AI 生成失败需要排查</div></div>
            <Switch v-model="npFail" />
          </div>
          <div class="flex items-center gap-3.5 py-[15px]">
            <div class="flex-1"><div class="text-sm font-semibold text-foreground">完成动态</div><div class="mt-1 text-xs leading-normal text-tertiary">团队成员完成任务</div></div>
            <Switch v-model="npDone" />
          </div>
        </div>
        <div class="rounded-lg bg-hover px-4 py-3 text-xs leading-relaxed text-tertiary">关闭后，对应类型的通知不再出现在左侧通知中心。</div>
      </template>

      <!-- 隐私与安全 -->
      <template v-if="state.setSection === 'privacy'">
        <div class="rounded-lg bg-card px-[18px] py-1 shadow-xs">
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1"><div class="text-sm font-semibold text-foreground">AI 可见范围</div><div class="mt-1 text-xs leading-normal text-tertiary">AI 制定计划时可读取的数据</div></div>
            <SegmentedControl v-model="aiVisibility" :items="[{ value: 'visible_scope_only', label: '仅可见范围' }, { value: 'all_todo', label: '全部 todo' }]" />
          </div>
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1"><div class="text-sm font-semibold text-foreground">默认开启隐私模式</div><div class="mt-1 text-xs leading-normal text-tertiary">登录后自动隐藏跨空间数据</div></div>
            <Switch v-model="privacyDefault" />
          </div>
          <div class="flex items-center gap-3.5 py-[15px]">
            <div class="flex-1"><div class="text-sm font-semibold text-foreground">谢绝陌生人好友请求</div><div class="mt-1 text-xs leading-normal text-tertiary">开启后别人无法向你发起好友请求，只能由你主动添加对方</div></div>
            <Switch v-model="friendClosed" />
          </div>
        </div>
        <div class="rounded-lg bg-hover px-4 py-3 text-xs leading-relaxed text-muted-foreground">隐私模式开启时，AI 只读取当前工作区（工作 / 个人）可见内容，非 todo 内容默认不参与计划。</div>
      </template>

      <!-- 数据 -->
      <template v-if="state.setSection === 'data'">
        <div class="rounded-lg bg-card px-[18px] py-1 shadow-xs">
          <div class="flex items-center gap-3.5 border-b border-border py-[15px]">
            <div class="flex-1"><div class="text-sm font-semibold text-foreground">导出全部数据</div><div class="mt-1 text-xs leading-normal text-tertiary">任务、待澄清、非 todo 与生成记录 (JSON)</div></div>
            <Button variant="outline" @click="doExport()"><Download :size="14" />导出</Button>
          </div>
          <div class="flex items-center gap-3.5 py-[15px]">
            <div class="flex-1"><div class="text-sm font-semibold text-destructive">清空测试数据</div><div class="mt-1 text-xs leading-normal text-tertiary">删除当前账号下的全部测试数据，不可恢复</div></div>
            <Button class="bg-destructive-soft text-destructive shadow-hairline hover:bg-destructive-soft hover:opacity-80" @click="doClearData()">清空</Button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
