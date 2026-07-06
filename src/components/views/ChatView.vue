<script setup lang="ts">
import { computed } from 'vue';
import {
  MessageCircle, GripVertical, Sunrise, ChevronUp, ChevronDown, ChevronRight, RefreshCw, Loader2,
  AlertCircle, PartyPopper, AtSign, Send, CornerDownRight, Calendar, Folder, Flag, Undo2,
  CheckCircle2, RotateCw, ShieldCheck, Play, Quote,
} from 'lucide-vue-next';
import { state, patch } from '@/app/state';
import { todayCount } from '@/app/derived';
import {
  send, retry, undoEntity, commitPlan, openEntity, onComposerInput, mentionCandidates,
  pickMention, removeRef, atButton, mentionEnterOrSend,
} from '@/app/chat';
import { openTask } from '@/app/tasks';
import { toggleTodayPanel, closeTodayPanel, refreshToday, todayProgress } from '@/app/today';
import { paneDragStart, paneDragEnd } from '@/app/panes';
import { go } from '@/app/nav';
import { shouldSendOnEnter, isComposingEvent } from '@/lib/keyboard.js';
import PhIcon from '@/components/ui/PhIcon.vue';
import ViewHeader from '@/components/layout/ViewHeader.vue';
import ModeChip from '@/components/layout/ModeChip.vue';
import Button from '@/components/ui/Button.vue';
import MotionReveal from '@/components/motion/MotionReveal.vue';
import { cn } from '@/lib/utils';

let composing = false;
function onCompStart() { composing = true; }
function onCompEnd() { composing = false; }
function sendKey(e: KeyboardEvent) {
  if (isComposingEvent(e, composing)) return;
  if (state.mentionOpen) {
    const n = mentionCandidates().length;
    if (e.key === 'ArrowDown') { e.preventDefault(); patch((s) => ({ mentionIndex: Math.min((s.mentionIndex || 0) + 1, Math.max(0, n - 1)) })); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); patch((s) => ({ mentionIndex: Math.max((s.mentionIndex || 0) - 1, 0) })); return; }
    if (e.key === 'Escape') { e.preventDefault(); patch({ mentionOpen: false }); return; }
  }
  if (shouldSendOnEnter(e, composing)) { e.preventDefault(); mentionEnterOrSend(); }
}

const QUICK_PROMPTS = [
  { icon: 'ph-calendar-plus', label: '明天上午十点和客户开会' },
  { icon: 'ph-compass', label: '接下来两小时做什么？' },
  { icon: 'ph-list-checks', label: '有哪些任务' },
  { icon: 'ph-brain', label: '记住：我习惯上午做深度工作' },
];
function runQuickPrompt(label: string) {
  const c = document.getElementById('lx-composer') as HTMLTextAreaElement | null;
  if (c) c.value = label;
  send();
}

const showQuickPrompts = computed(() => state.messages.length <= 2 && !state.thinking);
const todaySubtitle = computed(() => state.todayLoading ? '加载中…' : state.todayError ? '加载失败' : `${(state.todayItems || []).filter((t: any) => t.status !== 'done').length} 条未完成`);

const mentionItems = computed(() => {
  void state.mentionQuery; void state.mentionIndex; void state.team; void state.tasks; void state.nonTodos;
  const mkIcon = (x: any) => x.kind === 'person' ? 'ph-user-plus' : x.kind === 'time' ? 'ph-clock' : x.entityType === 'project' ? 'ph-folder' : x.entityType === 'note' ? 'ph-note-blank' : 'ph-check-square';
  const mkType = (x: any) => x.kind === 'person' ? '人 · 邀请协作' : x.kind === 'time' ? '时间' : x.entityType === 'project' ? '项目' : x.entityType === 'note' ? '笔记' : '任务';
  const grpName: Record<string, string> = { person: '人', time: '时间', doc: '文档' };
  let lastGrp: string | null = null;
  return mentionCandidates().map((x: any, idx: number) => {
    const g = x.kind === 'doc' ? 'doc' : x.kind;
    const head = g !== lastGrp ? grpName[g] : null;
    lastGrp = g;
    return { raw: x, label: x.label, icon: mkIcon(x), typeLabel: mkType(x), groupHead: head, active: idx === (state.mentionIndex || 0) };
  });
});

function openTodayItem(t: any) {
  patch({ todayOpen: false });
  go('chat');
  openTask(t.id);
}

function msgOpen(m: any) {
  if (m.kind === 'task') openTask(m.refId);
  else if (m.kind === 'idea') patch({ view: 'clarify' });
}
</script>

<template>
  <ViewHeader title="聊天" caption="收集与判断">
    <template #icon>
      <span v-if="!state.isMobile" draggable="true" title="拖动整块对话框到另一侧" class="-ml-1.5 flex h-6 w-6 flex-none cursor-grab items-center justify-center rounded-sm text-tertiary transition-colors duration-fast hover:bg-hover" @dragstart="paneDragStart($event)" @dragend="paneDragEnd()">
        <GripVertical :size="16" />
      </span>
      <MessageCircle :size="20" class="text-accent-brand-ink" />
    </template>
    <button
      :class="cn('inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-pill px-3 text-xs font-semibold transition-colors duration-medium', state.todayOpen ? 'bg-accent-brand-soft text-accent-brand-ink shadow-[0_0_0_1px_var(--accent)]' : 'bg-background text-muted-foreground shadow-hairline hover:bg-hover')"
      title="今日待办"
      @click="toggleTodayPanel()"
    >
      <Sunrise :size="14" />今日待办
      <span v-if="todayCount > 0" class="inline-flex h-4 min-w-4 items-center justify-center rounded-pill bg-primary px-1 font-nums text-[10px] font-bold text-primary-foreground">{{ todayCount }}</span>
      <ChevronUp v-if="state.todayOpen" :size="11" class="opacity-60" />
      <ChevronDown v-else :size="11" class="opacity-60" />
    </button>
    <ModeChip />
  </ViewHeader>

  <!-- 今日待办浮层 -->
  <template v-if="state.todayOpen">
    <div class="absolute inset-x-0 bottom-0 top-[57px] z-[13]" @click="closeTodayPanel()" />
    <MotionReveal :y="6" class="absolute right-4 top-[62px] z-[14] flex max-h-[62%] w-[340px] max-w-[calc(100%-32px)] flex-col overflow-hidden rounded-lg bg-popover shadow-lg">
      <div class="flex flex-none items-center gap-2 border-b border-border px-3.5 py-3">
        <Sunrise :size="17" class="text-accent-brand-ink" />
        <span class="text-sm font-semibold text-foreground">今日待办</span>
        <span class="text-[11.5px] font-semibold text-tertiary">{{ todaySubtitle }}</span>
        <div class="flex-1" />
        <Button variant="ghost-muted" size="icon-sm" :disabled="state.todayLoading" title="刷新" @click="refreshToday()">
          <RefreshCw :size="14" :class="state.todayLoading && 'animate-spin'" />
        </Button>
      </div>
      <div class="min-h-0 flex-1 overflow-auto p-1.5">
        <div v-if="state.todayLoading && !state.todayItems.length" class="flex flex-col items-center gap-2 px-3 py-8 text-tertiary">
          <Loader2 :size="22" class="animate-spin" />
          <div class="text-xs">正在加载今日待办…</div>
        </div>
        <div v-else-if="state.todayError" class="flex flex-col items-center gap-2.5 px-3.5 py-7 text-center text-tertiary">
          <AlertCircle :size="24" class="text-destructive" />
          <div class="text-xs text-destructive">{{ state.todayError }}</div>
          <Button variant="outline" size="sm" @click="refreshToday()">重试</Button>
        </div>
        <div v-else-if="state.todayItems.length === 0" class="flex flex-col items-center gap-2 px-3.5 py-8 text-center text-tertiary">
          <PartyPopper :size="26" class="text-accent-brand-ink" />
          <div class="text-sm leading-relaxed">今天没有到期或计划的待办<br />享受专注的一天 🎉</div>
        </div>
        <template v-else>
          <a v-for="(t, i) in state.todayItems" :key="i" class="flex cursor-pointer gap-2.5 rounded-md px-3 py-2.5 transition-colors duration-fast hover:bg-hover" @click="openTodayItem(t)">
            <span class="mt-[5px] h-[9px] w-[9px] flex-none rounded-pill" :style="{ background: t.status === 'done' ? 'var(--text3)' : t.status === 'in_progress' ? 'var(--idea)' : 'var(--accent)' }" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold" :class="t.status === 'done' ? 'text-tertiary line-through' : 'text-foreground'">{{ t.title }}</span>
              <span class="mt-0.5 block text-[11.5px] text-tertiary">{{ todayProgress(t) }}</span>
            </span>
            <ChevronRight :size="13" class="flex-none self-center text-tertiary" />
          </a>
        </template>
      </div>
    </MotionReveal>
  </template>

  <!-- 消息流 -->
  <div id="lx-msgs" class="flex min-h-0 flex-1 flex-col gap-[17px] overflow-auto p-6">
    <template v-for="(m, i) in state.messages" :key="m.id || i">
      <!-- 系统分隔 -->
      <div v-if="m.role === 'sys'" class="self-center rounded-pill bg-hover px-3 py-1.5 text-xs text-tertiary">{{ m.text }}</div>

      <!-- 用户消息 -->
      <div v-else-if="m.role === 'user'" class="flex max-w-[78%] flex-col items-end gap-1 self-end">
        <div v-if="m.refs && m.refs.length" class="flex flex-wrap justify-end gap-1">
          <span v-for="(r, ri) in m.refs" :key="ri" class="inline-flex items-center gap-1 rounded-pill bg-accent-brand-soft px-2 py-[3px] text-[11px] font-semibold text-accent-brand-ink"><AtSign :size="11" />{{ r }}</span>
        </div>
        <div :title="m.time || ''" class="whitespace-pre-wrap rounded-[15px] rounded-br-[5px] bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">{{ m.text }}</div>
        <span v-if="m.refId" class="inline-flex cursor-pointer items-center gap-1 px-1 py-0.5 text-[11px] font-semibold text-accent-brand-ink" @click="openEntity(m.refType, m.refId)"><CornerDownRight :size="11" />已生成 · 查看</span>
      </div>

      <!-- AI 文本 -->
      <div v-else-if="m.kind === 'text'" class="flex max-w-[82%] gap-2 self-start">
        <span class="mt-0.5 flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">灵</span>
        <div :title="m.time || ''" class="whitespace-pre-wrap rounded-[15px] rounded-tl-[5px] bg-card px-3.5 py-2.5 text-sm leading-relaxed shadow-xs" :class="m.isErr ? 'text-destructive' : 'text-foreground'">
          {{ m.text }}<span v-if="m.streaming" class="ml-px inline-block animate-pulse text-accent-brand-ink">▍</span>
        </div>
      </div>

      <!-- 任务卡 -->
      <div v-else-if="m.kind === 'task'" class="flex max-w-[82%] flex-col gap-2 self-start">
        <details class="self-start">
          <summary class="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-pill bg-accent-brand-soft px-2.5 py-1 text-[11.5px] font-semibold text-accent-brand-ink"><span class="h-1.5 w-1.5 rounded-pill bg-accent-brand" />任务<ChevronDown :size="11" class="opacity-60" /></summary>
          <div class="mt-1.5 max-w-[430px] rounded-md bg-hover px-3 py-2 text-xs leading-relaxed text-muted-foreground">{{ m.reason }}</div>
        </details>
        <div class="cursor-pointer rounded-lg bg-card p-3.5 shadow-xs transition-shadow duration-medium hover:shadow-sm" @click="msgOpen(m)">
          <div class="flex items-start gap-2.5">
            <span class="mt-0.5 h-[18px] w-[18px] flex-none rounded-sm border-2 border-[var(--accent)]" />
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold leading-normal text-foreground">{{ m.title }}</div>
              <div class="mt-2.5 flex flex-wrap gap-1.5">
                <span v-for="(c, ci) in m.chips" :key="ci" class="inline-flex items-center gap-1 rounded-md bg-hover px-2 py-1 text-[11.5px] font-semibold text-muted-foreground"><PhIcon :name="c.i" :size="12" />{{ c.t }}</span>
              </div>
            </div>
          </div>
          <div class="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2.5 text-[11.5px] text-tertiary">
            <CheckCircle2 :size="14" class="text-accent-brand" />已进入 Todo 数据库 · 点击查看详情与来源
            <span class="flex-1" />
            <button class="inline-flex cursor-pointer items-center gap-1 px-1 py-0.5 text-[11.5px] font-semibold text-tertiary hover:text-foreground" title="撤销这次判断" @click.stop="undoEntity(m)"><Undo2 :size="12" />撤销</button>
          </div>
        </div>
      </div>

      <!-- 待澄清卡 -->
      <div v-else-if="m.kind === 'idea'" class="flex max-w-[82%] flex-col gap-2 self-start">
        <details class="self-start">
          <summary class="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-pill bg-warning-soft px-2.5 py-1 text-[11.5px] font-semibold text-warning"><span class="h-1.5 w-1.5 rounded-pill bg-warning" />待澄清<ChevronDown :size="11" class="opacity-60" /></summary>
          <div class="mt-1.5 max-w-[430px] rounded-md bg-hover px-3 py-2 text-xs leading-relaxed text-muted-foreground">{{ m.reason }}</div>
        </details>
        <div class="rounded-lg border-l-[3px] border-warning bg-card p-3.5 shadow-xs">
          <div class="text-sm font-semibold leading-normal text-foreground">{{ m.title }}</div>
          <div class="mt-2 rounded-md bg-warning-soft px-3 py-2 text-xs leading-normal text-muted-foreground"><b class="text-warning">建议下一步：</b>{{ m.suggest }}</div>
          <div class="mt-3 flex items-center gap-2">
            <Button variant="outline" size="sm" class="text-accent-brand-ink shadow-[0_0_0_1px_var(--accent)]" @click="msgOpen(m)">去澄清</Button>
            <span class="flex-1" />
            <button class="inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-semibold text-tertiary hover:text-foreground" title="撤销这次判断" @click.stop="undoEntity(m)"><Undo2 :size="12" />撤销</button>
          </div>
        </div>
      </div>

      <!-- 非 todo 卡 -->
      <div v-else-if="m.kind === 'nono'" class="flex max-w-[82%] flex-col gap-2 self-start">
        <details class="self-start">
          <summary class="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-pill bg-active px-2.5 py-1 text-[11.5px] font-semibold text-tertiary"><span class="h-1.5 w-1.5 rounded-pill bg-[var(--text3)]" />非 todo<ChevronDown :size="11" class="opacity-60" /></summary>
          <div class="mt-1.5 max-w-[430px] rounded-md bg-hover px-3 py-2 text-xs leading-relaxed text-muted-foreground">{{ m.reason }}</div>
        </details>
        <div class="rounded-lg bg-active p-3 shadow-hairline">
          <div class="text-sm leading-normal text-muted-foreground">{{ m.text }}</div>
          <div class="mt-2 flex items-center gap-1.5 text-[11.5px] text-tertiary">
            <PhIcon name="ph-tray" :size="13" />未进入 todo 主系统 · 已隔离保存
            <span class="flex-1" />
            <button class="inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-semibold text-tertiary hover:text-foreground" title="撤销这次判断" @click.stop="undoEntity(m)"><Undo2 :size="12" />撤销</button>
          </div>
        </div>
      </div>

      <!-- 计划卡 -->
      <div v-else-if="m.kind === 'plan'" class="max-w-[82%] self-start rounded-lg bg-card p-4 shadow-xs">
        <div class="text-sm font-semibold tracking-tight text-foreground">{{ m.planTitle }}</div>
        <div class="mt-1 text-[11.5px] text-tertiary">{{ m.planSub }}</div>
        <div class="mt-3 flex flex-col gap-2">
          <div v-for="(p, pi) in m.plan" :key="pi" class="flex items-center gap-2.5">
            <span class="flex h-5 w-5 flex-none items-center justify-center rounded-sm bg-accent-brand-soft font-nums text-[11px] font-bold text-accent-brand-ink">{{ p.n }}</span>
            <span class="flex-1 text-sm leading-snug text-foreground">{{ p.t }}</span>
            <span class="rounded-md bg-hover px-2 py-[3px] font-nums text-[11px] font-semibold text-muted-foreground">{{ p.d }}</span>
          </div>
        </div>
        <div class="mt-3 flex items-center gap-1.5 border-t border-border pt-2.5 text-[11px] text-tertiary">
          <ShieldCheck :size="13" class="text-accent-brand" />{{ m.planNote }}
          <span class="flex-1" />
          <Button v-if="!m.committed" variant="primary" size="sm" @click="commitPlan(m)"><Play :size="12" />开始执行</Button>
          <span v-else class="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-brand-ink"><CheckCircle2 :size="12" />已加入今日计划</span>
        </div>
      </div>

      <!-- 错误卡 -->
      <div v-else-if="m.kind === 'error'" class="flex max-w-[82%] flex-col gap-2 self-start rounded-lg border-l-[3px] border-destructive bg-destructive-soft px-3.5 py-3">
        <div class="flex items-center gap-2 text-sm font-semibold text-destructive"><AlertCircle :size="16" />AI 生成失败 · {{ m.errType }}</div>
        <div class="text-xs leading-normal text-muted-foreground">未静默失败 — 原始输入已保存，可重试，异常已记录到内部后台。</div>
        <div class="flex items-center gap-2">
          <Button variant="destructive" size="sm" @click="retry(m.id, m.retryText)"><RotateCw :size="12" />重试</Button>
          <span v-if="m.retrying" class="text-[11.5px] text-tertiary">重试中…</span>
        </div>
      </div>
    </template>

    <!-- 思考中 -->
    <div v-if="state.thinking" class="flex gap-2 self-start">
      <span class="mt-0.5 flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground opacity-85">灵</span>
      <div class="inline-flex max-w-full items-center gap-2 rounded-[14px] rounded-tl-[5px] bg-hover px-3.5 py-2.5">
        <span class="inline-flex flex-none gap-1">
          <span class="h-[5px] w-[5px] animate-pulse rounded-pill bg-accent-brand-ink" />
          <span class="h-[5px] w-[5px] animate-pulse rounded-pill bg-accent-brand-ink [animation-delay:.2s]" />
          <span class="h-[5px] w-[5px] animate-pulse rounded-pill bg-accent-brand-ink [animation-delay:.4s]" />
        </span>
        <span class="lx-think">{{ state.thinkText || '正在分析意图…' }}</span>
      </div>
    </div>
  </div>

  <!-- Composer -->
  <div class="relative border-t border-border bg-card px-4 pb-4 pt-3.5">
    <!-- 提及菜单 -->
    <div v-if="state.mentionOpen" class="absolute inset-x-4 bottom-[calc(100%-8px)] z-[6] max-h-[236px] overflow-y-auto rounded-lg bg-popover shadow-lg">
      <div class="px-3 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-[.08em] text-tertiary">提及 · 人 / 时间 / 文档</div>
      <template v-for="(mi, ii) in mentionItems" :key="ii">
        <div v-if="mi.groupHead" class="px-3 pb-1 pt-2 text-[10px] font-semibold tracking-[.06em] text-tertiary">{{ mi.groupHead }}</div>
        <a :class="cn('flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors duration-fast', mi.active ? 'bg-hover' : 'hover:bg-hover')" @click="pickMention(mi.raw)">
          <PhIcon :name="mi.icon" :size="16" class="text-accent-brand-ink" />
          <span class="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{{ mi.label }}</span>
          <span class="rounded-sm bg-hover px-1.5 py-[3px] text-[10.5px] font-semibold text-tertiary">{{ mi.typeLabel }}</span>
        </a>
      </template>
      <div v-if="mentionItems.length === 0" class="px-3 py-3 text-xs text-tertiary">没有匹配的人 / 时间 / 文档</div>
    </div>

    <!-- 快捷提示 -->
    <div v-if="showQuickPrompts" class="mb-2.5 flex flex-wrap gap-2">
      <button
        v-for="q in QUICK_PROMPTS" :key="q.label"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-background px-3 py-[7px] text-xs text-muted-foreground shadow-hairline transition-colors duration-medium hover:bg-hover"
        @click="runQuickPrompt(q.label)"
      >
        <PhIcon :name="q.icon" :size="13" class="text-accent-brand-ink" />{{ q.label }}
      </button>
    </div>

    <div class="flex flex-col gap-2 rounded-lg bg-[var(--surface-sunken)] p-3 shadow-hairline transition-shadow duration-medium focus-within:shadow-ring">
      <div v-if="state.pendingRefs.length > 0" class="flex flex-wrap gap-1.5">
        <span v-for="r in state.pendingRefs" :key="r.id" class="inline-flex items-center gap-1 rounded-pill bg-accent-brand-soft py-1 pl-2.5 pr-1 text-xs font-semibold text-accent-brand-ink">
          <AtSign :size="12" />{{ r.label }}
          <button class="flex cursor-pointer items-center justify-center rounded-pill p-0.5 text-xs text-accent-brand-ink hover:opacity-70" @click="removeRef(r.id)">&times;</button>
        </span>
      </div>
      <textarea
        id="lx-composer"
        rows="1"
        placeholder="输入想法、任务，或用 @ 提及人 / 时间 / 文档…（Shift+Enter 换行）"
        class="max-h-[120px] resize-none overflow-y-auto border-0 bg-transparent text-base leading-normal text-foreground outline-none placeholder:text-tertiary"
        @input="onComposerInput($event)"
        @keydown="sendKey"
        @compositionstart="onCompStart"
        @compositionend="onCompEnd"
      />
      <div class="flex items-center gap-2">
        <Button variant="ghost-muted" size="icon-sm" class="bg-hover" title="引用任务 / 项目" @click="atButton()"><AtSign :size="15" /></Button>
        <span class="text-[11.5px] text-tertiary">@ 引用 · Enter 发送</span>
        <div class="flex-1" />
        <Button variant="primary" @click="send()">发送<Send :size="14" /></Button>
      </div>
    </div>
  </div>
</template>
