<script setup lang="ts">
import { computed } from 'vue';
import { BarChart3, Eye, AlertCircle, KeyRound } from 'lucide-vue-next';
import { state } from '@/app/state';
import { canAdmin, roleLabel } from '@/app/derived';
import { lxFmtDue } from '@/app/format';
import ViewHeader from '@/components/layout/ViewHeader.vue';
import Badge from '@/components/ui/Badge.vue';

const selUser = computed(() => state.adminUsers.find((u: any) => u.id === state.adminSelId) || state.adminUsers[0] || null);
const KIND_META: Record<string, [string, string]> = { task: ['任务', 'var(--accent)'], todo_idea: ['待澄清', 'var(--idea)'], non_todo: ['非 todo', 'var(--nono)'] };
const adminLog = computed(() => state.adminRecords.map((r: any) => ({
  raw: r.rawInput,
  kind: (KIND_META[r.aiKind] || ['其他', 'var(--text3)'])[0],
  kc: (KIND_META[r.aiKind] || ['其他', 'var(--text3)'])[1],
  result: r.resultTitle || '（已删除）',
  gen: lxFmtDue(r.createdAt),
})));
const adminErrors = computed(() => state.adminUserErrors.map((e: any) => ({
  raw: e.rawInput,
  errType: (e.message || '').slice(0, 40) || '未知错误',
  time: lxFmtDue(e.createdAt),
  user: selUser.value ? selUser.value.name : '',
})));
const errorCount = computed(() => (selUser.value ? selUser.value.errorCount || 0 : 0));
</script>

<template>
  <!-- 无权限 -->
  <template v-if="!canAdmin">
    <div class="flex flex-1 flex-col items-center justify-center gap-3.5 p-10 text-center">
      <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-destructive-soft text-destructive"><KeyRound :size="26" /></div>
      <div class="text-lg font-semibold tracking-tight text-foreground">需要管理员权限</div>
      <div class="max-w-[360px] text-sm leading-relaxed text-tertiary">内部后台仅对「管理员」角色开放。你当前是「{{ roleLabel }}」。首个注册的账号自动成为管理员。</div>
    </div>
  </template>
  <template v-else>
    <ViewHeader title="内部后台">
      <template #icon><BarChart3 :size="19" class="text-accent-brand-ink" /></template>
      <template #title>
        <span class="text-[16px] font-semibold tracking-tight text-foreground">内部后台</span>
        <Badge><Eye :size="12" />只读</Badge>
      </template>
    </ViewHeader>
    <div class="flex-1 overflow-auto px-6 py-[26px]">
      <div v-if="!selUser" class="flex flex-col items-center justify-center gap-2.5 pt-[90px] text-tertiary">
        <BarChart3 :size="30" />
        <div class="text-sm">{{ state.adminLoading ? '加载中…' : '暂无用户数据' }}</div>
      </div>
      <div v-else class="mx-auto flex max-w-[760px] flex-col gap-[18px]">
        <div class="flex items-center gap-3.5">
          <span class="flex h-[46px] w-[46px] items-center justify-center rounded-lg bg-active text-lg font-semibold text-muted-foreground">{{ (selUser.name || '?').slice(-1) }}</span>
          <div class="flex-1">
            <div class="text-md font-semibold tracking-tight text-foreground">{{ selUser.name }} <Badge variant="accent" class="ml-1.5">{{ ({ admin: '管理员', member: '成员' } as Record<string,string>)[selUser.role] || selUser.role }}</Badge></div>
            <div class="mt-0.5 text-xs text-tertiary">{{ selUser.email }}</div>
          </div>
          <Badge variant="accent">{{ selUser.errorCount > 0 ? selUser.errorCount + ' 失败' : '正常' }}</Badge>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-lg bg-card p-3.5 shadow-xs"><div class="font-nums text-[26px] font-semibold text-accent-brand-ink">{{ selUser.taskCount }}</div><div class="mt-1.5 text-xs text-tertiary">正式任务</div></div>
          <div class="rounded-lg bg-card p-3.5 shadow-xs"><div class="font-nums text-[26px] font-semibold text-warning">{{ selUser.ideaCount }}</div><div class="mt-1.5 text-xs text-tertiary">待澄清</div></div>
          <div class="rounded-lg bg-card p-3.5 shadow-xs"><div class="font-nums text-[26px] font-semibold text-tertiary">{{ selUser.nonCount }}</div><div class="mt-1.5 text-xs text-tertiary">非 todo</div></div>
        </div>
        <div v-if="errorCount > 0" class="flex items-center gap-2 rounded-lg bg-destructive-soft px-3.5 py-3 text-xs font-semibold text-destructive">
          <AlertCircle :size="16" />当前有 <span class="font-nums">{{ errorCount }}</span> 条 AI 生成失败待排查
        </div>
        <div class="mt-0.5 text-[11px] font-bold uppercase tracking-[.08em] text-tertiary">原始输入 → AI 判断 → 生成结果</div>
        <div class="overflow-hidden rounded-lg bg-card shadow-xs">
          <div class="grid grid-cols-[1fr_84px_1fr_74px] border-b border-border bg-hover">
            <div class="px-3.5 py-2.5 text-[10.5px] font-bold uppercase tracking-[.05em] text-tertiary">原始输入</div>
            <div class="px-2 py-2.5 text-[10.5px] font-bold uppercase tracking-[.05em] text-tertiary">判断</div>
            <div class="px-2 py-2.5 text-[10.5px] font-bold uppercase tracking-[.05em] text-tertiary">生成结果</div>
            <div class="px-2 py-2.5 text-[10.5px] font-bold uppercase tracking-[.05em] text-tertiary">时间</div>
          </div>
          <div v-for="(r, i) in adminLog" :key="i" class="grid grid-cols-[1fr_84px_1fr_74px] items-center border-b border-border">
            <div class="px-3.5 py-2.5 text-xs leading-normal text-muted-foreground">{{ r.raw }}</div>
            <div class="px-2 py-2.5"><span class="inline-flex items-center gap-1 text-[11px] font-semibold" :style="{ color: r.kc }"><span class="h-1.5 w-1.5 rounded-pill" :style="{ background: r.kc }" />{{ r.kind }}</span></div>
            <div class="px-2 py-2.5 text-xs leading-normal text-foreground">{{ r.result }}</div>
            <div class="px-2 py-2.5 font-nums text-[11px] text-tertiary">{{ r.gen }}</div>
          </div>
          <div v-if="adminLog.length === 0" class="px-3.5 py-4 text-xs text-tertiary">该用户还没有生成记录</div>
        </div>
        <div class="mt-0.5 text-[11px] font-bold uppercase tracking-[.08em] text-tertiary">AI 失败与异常</div>
        <div class="overflow-hidden rounded-lg bg-card shadow-xs">
          <div class="grid grid-cols-[64px_1fr_118px_96px] border-b border-border bg-hover">
            <div class="px-3.5 py-2.5 text-[10.5px] font-bold uppercase tracking-[.05em] text-tertiary">用户</div>
            <div class="px-2 py-2.5 text-[10.5px] font-bold uppercase tracking-[.05em] text-tertiary">原始输入</div>
            <div class="px-2 py-2.5 text-[10.5px] font-bold uppercase tracking-[.05em] text-tertiary">错误类型</div>
            <div class="px-2 py-2.5 text-[10.5px] font-bold uppercase tracking-[.05em] text-tertiary">状态</div>
          </div>
          <div v-for="(e, i) in adminErrors" :key="i" class="grid grid-cols-[64px_1fr_118px_96px] items-center border-b border-border">
            <div class="px-3.5 py-2.5 text-xs font-semibold text-foreground">{{ e.user }}</div>
            <div class="truncate px-2 py-2.5 text-xs text-muted-foreground">{{ e.raw }}</div>
            <div class="px-2 py-2.5 text-[11.5px] text-muted-foreground">{{ e.errType }}</div>
            <div class="px-2 py-2.5"><span class="inline-flex rounded-pill bg-destructive-soft px-2 py-[3px] text-[10.5px] font-semibold text-destructive">failed</span></div>
          </div>
          <div v-if="adminErrors.length === 0" class="px-3.5 py-4 text-xs text-tertiary">没有 AI 失败记录，运行正常</div>
        </div>
        <div class="text-xs leading-relaxed text-tertiary">后台只读，用于团队观察测试数据、排查 AI 判断问题，不可编辑用户数据。</div>
      </div>
    </div>
  </template>
</template>
