<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { Table as TableIcon, Search, Plus, Rows3, Columns3, Check, CheckCircle2, X, ChevronUp, ChevronDown, ArrowUpDown, Folder } from 'lucide-vue-next';
import gsap from 'gsap';
import Flip from 'gsap/Flip';
import { state, patch } from '@/app/state';
import { dbViewName, dbTableTasks, boardCols, projectOptions, PRIORITY_OPTIONS, taskMeta, PRIO_COLORS, canEdit } from '@/app/derived';
import { go } from '@/app/nav';
import { openTask, toggleSelect, selectAll, clearSel, batchStatus, batchPriority, batchMoveOut, batchDelete, setDbLayout, toggleSort, dragStart, dropOnCard, dropOnCol } from '@/app/tasks';
import { prefersReducedMotion, durations, eases } from '@/components/motion/motion';
import ViewHeader from '@/components/layout/ViewHeader.vue';
import ModeChip from '@/components/layout/ModeChip.vue';
import Select from '@/components/ui/Select.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import Button from '@/components/ui/Button.vue';
import MotionStagger from '@/components/motion/MotionStagger.vue';
import { cn } from '@/lib/utils';

gsap.registerPlugin(Flip);

const layout = computed({ get: () => state.dbLayout, set: (v: string) => setDbLayout(v as 'table' | 'board') });
const dbProject = computed({ get: () => state.dbProject, set: (v: string) => patch({ dbProject: v }) });
const dbPriority = computed({ get: () => state.dbPriority, set: (v: string) => patch({ dbPriority: v }) });

const rows = computed(() => dbTableTasks.value.map((t: any) => ({ t, m: taskMeta(t) })));
const selIds = computed(() => dbTableTasks.value.map((t: any) => t.id));
const allSelected = computed(() => selIds.value.length > 0 && selIds.value.every((id: string) => state.dbSelected.includes(id)));

function newCapture() {
  go('chat');
  setTimeout(() => { const c = document.getElementById('lx-composer'); if (c) c.focus(); }, 80);
}

const SORT_COLS: Array<{ key: string; label: string }> = [
  { key: 'title', label: '标题' },
  { key: 'project', label: '项目' },
  { key: 'due', label: '截止' },
  { key: 'priority', label: '优先级' },
];

// GSAP Flip：拖拽重排/换列时做丝滑布局过渡（≤ base 时长，无回弹）
const boardEl = ref<HTMLElement | null>(null);
let flipState: ReturnType<typeof Flip.getState> | null = null;
watch(() => [state.taskOrder, state.tasks.map((t: any) => t.status).join(',')], () => {
  if (state.dbLayout !== 'board' || prefersReducedMotion() || !boardEl.value) return;
  flipState = Flip.getState(boardEl.value.querySelectorAll('[data-flip-card]'));
  nextTick(() => {
    if (flipState) Flip.from(flipState, { duration: durations().base, ease: eases.out, absolute: false });
    flipState = null;
  });
}, { flush: 'pre' });

function prioStyle(p: number) {
  const c = PRIO_COLORS[p] || PRIO_COLORS[3];
  return { color: c[0], background: c[1] };
}
</script>

<template>
  <ViewHeader :caption="undefined">
    <template #icon><TableIcon :size="19" class="text-accent-brand-ink" /></template>
    <template #title>
      <span class="text-[16px] font-semibold tracking-tight text-foreground">{{ dbViewName }}</span>
      <span class="text-xs text-tertiary"><span class="font-nums">{{ rows.length }}</span> 条</span>
    </template>
    <SegmentedControl v-model="layout" :items="[{ value: 'table', label: '表格' }, { value: 'board', label: '看板' }]" />
    <Button v-if="canEdit" variant="primary" @click="newCapture"><Plus />新建</Button>
  </ViewHeader>

  <div class="flex h-[52px] flex-none items-center gap-2.5 border-b border-border bg-card px-4">
    <div class="flex w-[230px] items-center gap-2 rounded-md bg-hover px-3 py-[7px]">
      <Search :size="15" class="text-tertiary" />
      <input :value="state.dbSearch" placeholder="搜索任务标题" class="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-tertiary" @input="patch({ dbSearch: ($event.target as HTMLInputElement).value })" />
    </div>
    <Select v-model="dbProject" :items="projectOptions" class="min-w-[110px]" />
    <Select v-model="dbPriority" :items="PRIORITY_OPTIONS" class="min-w-[110px]" />
    <div class="flex-1" />
    <ModeChip />
  </div>

  <Transition
    enter-active-class="transition duration-medium ease-out" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-fast ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0"
  >
    <div v-if="state.dbSelected.length > 0" class="flex h-12 flex-none items-center gap-2 border-b border-border bg-accent-brand-soft px-4">
      <span class="text-sm font-semibold text-accent-brand-ink">已选 {{ state.dbSelected.length }} 项</span>
      <div class="flex-1" />
      <Button size="sm" @click="batchStatus('done')"><CheckCircle2 class="text-accent-brand" />标记完成</Button>
      <Button size="sm" @click="batchStatus('in_progress')">进行中</Button>
      <Button size="sm" @click="batchPriority(1)">设为 P1</Button>
      <Button size="sm" @click="batchMoveOut()">移出 todo</Button>
      <Button size="sm" class="bg-destructive-soft text-destructive shadow-none hover:bg-destructive-soft hover:opacity-80" @click="batchDelete()">删除</Button>
      <Button variant="ghost-muted" size="icon-sm" title="取消选择" @click="clearSel()"><X /></Button>
    </div>
  </Transition>

  <!-- 表格视图 -->
  <div v-if="state.dbLayout === 'table'" class="flex-1 overflow-auto">
    <div class="sticky top-0 z-[1] grid grid-cols-[36px_1fr_112px_100px_76px_88px_60px] border-b border-border bg-[var(--surface-sunken)] px-5">
      <div class="flex items-center py-3">
        <span
          :class="cn('flex h-[17px] w-[17px] cursor-pointer items-center justify-center rounded-xs transition-colors duration-fast', allSelected ? 'bg-primary' : 'bg-background shadow-hairline')"
          @click="selectAll(selIds)"
        ><Check v-if="allSelected" :size="11" class="text-primary-foreground" :stroke-width="3" /></span>
      </div>
      <div
        v-for="c in SORT_COLS" :key="c.key"
        class="flex cursor-pointer items-center gap-1 px-2 py-3 text-[11px] font-bold uppercase tracking-[.05em]"
        :class="state.dbSortKey === c.key ? 'text-foreground' : 'text-tertiary'"
        @click="toggleSort(c.key)"
      >
        {{ c.label }}
        <ChevronUp v-if="state.dbSortKey === c.key && state.dbSortDir === 'asc'" :size="12" class="text-accent-brand-ink" />
        <ChevronDown v-else-if="state.dbSortKey === c.key" :size="12" class="text-accent-brand-ink" />
        <ArrowUpDown v-else :size="12" class="text-tertiary" />
      </div>
      <div class="px-2 py-3 text-[11px] font-bold uppercase tracking-[.05em] text-tertiary">负责人</div>
      <div class="px-2 py-3 text-[11px] font-bold uppercase tracking-[.05em] text-tertiary">隐私</div>
    </div>
    <MotionStagger as="div" :y="4" :stagger="0.015">
      <div
        v-for="{ t, m } in rows" :key="t.id"
        class="grid grid-cols-[36px_1fr_112px_100px_76px_88px_60px] items-center border-b border-border px-5 transition-colors duration-fast hover:bg-hover"
        :class="m.selected && 'bg-accent-brand-soft hover:bg-accent-brand-soft'"
      >
        <div class="flex items-center py-[13px]">
          <span
            :class="cn('flex h-[17px] w-[17px] cursor-pointer items-center justify-center rounded-xs transition-colors duration-fast', m.selected ? 'bg-primary' : 'bg-background shadow-hairline')"
            @click.stop="toggleSelect(t.id)"
          ><Check v-if="m.selected" :size="11" class="text-primary-foreground" :stroke-width="3" /></span>
        </div>
        <div class="min-w-0 cursor-pointer px-2 py-[13px]" @click="openTask(t.id)">
          <div class="truncate text-sm font-semibold" :class="[m.done ? 'text-tertiary line-through' : 'text-foreground']">{{ t.title }}</div>
          <div class="mt-1 text-[11px] text-tertiary">{{ m.statusLabel }}</div>
        </div>
        <div class="cursor-pointer px-2 py-[13px]" @click="openTask(t.id)">
          <span class="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span class="h-1.5 w-1.5 rounded-pill bg-accent-brand opacity-55" />{{ t.project }}</span>
        </div>
        <div class="cursor-pointer px-2 py-[13px] font-nums text-xs" :class="m.dueSoon ? 'text-accent-brand-ink' : 'text-muted-foreground'" @click="openTask(t.id)">{{ t.due }}</div>
        <div class="cursor-pointer px-2 py-[13px]" @click="openTask(t.id)">
          <span class="inline-flex rounded-sm px-2 py-[3px] font-nums text-[11px] font-bold" :style="prioStyle(t.priority)">P{{ t.priority }}</span>
        </div>
        <div class="min-w-0 cursor-pointer px-2 py-[13px]" @click="openTask(t.id)">
          <span class="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span class="flex h-5 w-5 flex-none items-center justify-center rounded-pill text-[10px] font-semibold text-[var(--accent-contrast)]" :style="{ background: m.assigneeColor }">{{ m.assigneeInitial }}</span>
            <span class="truncate">{{ m.assignee }}</span>
          </span>
        </div>
        <div class="cursor-pointer px-2 py-[13px]" @click="openTask(t.id)">
          <span class="inline-flex items-center gap-1.5 text-[11.5px] text-tertiary">
            <span class="h-[7px] w-[7px] rounded-xs" :style="{ background: t.scope === 'work' ? 'var(--accent)' : 'var(--idea)' }" />
            {{ t.scope === 'work' ? '工作' : '个人' }}
          </span>
        </div>
      </div>
    </MotionStagger>
    <div v-if="rows.length === 0" class="flex flex-col items-center gap-2.5 px-5 py-[70px] text-tertiary">
      <TableIcon :size="30" />
      <div class="text-sm">{{ state.tasks.length === 0 ? '还没有任务 — 去聊天框丢一句「明天下午前完成XX」' : '没有匹配当前筛选的任务' }}</div>
    </div>
    <div class="h-10" />
  </div>

  <!-- 看板视图 -->
  <div v-if="state.dbLayout === 'board'" ref="boardEl" class="flex flex-1 items-stretch gap-4 overflow-auto p-[18px]">
    <div
      v-for="col in boardCols" :key="col.key"
      class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-card transition-shadow duration-fast"
      :class="state.dragOverCol === col.key ? 'shadow-[0_0_0_2px_var(--accent-soft),var(--shadow-hairline)]' : 'shadow-hairline'"
      @drop.prevent="dropOnCol(col.key)"
      @dragover.prevent="state.dragOverCol !== col.key && patch({ dragOverCol: col.key })"
      @dragleave="state.dragOverCol === col.key && patch({ dragOverCol: null })"
    >
      <div class="flex items-center gap-2 border-b border-border px-3.5 py-[13px]">
        <span class="h-2 w-2 rounded-pill" :style="{ background: col.color }" />
        <span class="text-sm font-semibold text-foreground">{{ col.name }}</span>
        <span class="font-nums text-[11px] font-semibold text-tertiary">{{ col.count }}</span>
      </div>
      <div class="flex min-h-[120px] flex-1 flex-col gap-2 overflow-auto p-2.5">
        <div
          v-for="c in col.cards" :key="c.id"
          data-flip-card
          draggable="true"
          class="cursor-grab rounded-md bg-[var(--surface-sunken)] p-3 shadow-hairline transition-shadow duration-medium hover:shadow-sm active:cursor-grabbing"
          @dragstart="dragStart(c.id, $event)"
          @drop="dropOnCard(c.id, $event)"
          @dragover.prevent
          @click="openTask(c.id)"
        >
          <div class="text-sm font-semibold leading-snug" :class="[taskMeta(c).done ? 'text-tertiary line-through' : 'text-foreground']">{{ c.title }}</div>
          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <span class="inline-flex rounded-sm px-2 py-[3px] font-nums text-[11px] font-bold" :style="prioStyle(c.priority)">P{{ c.priority }}</span>
            <span class="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Folder :size="11" />{{ c.project }}</span>
            <span class="font-nums text-[11px]" :class="taskMeta(c).dueSoon ? 'text-accent-brand-ink' : 'text-muted-foreground'">{{ c.due }}</span>
            <span :title="taskMeta(c).assignee" class="ml-auto flex h-5 w-5 flex-none items-center justify-center rounded-pill text-[10px] font-semibold text-[var(--accent-contrast)]" :style="{ background: taskMeta(c).assigneeColor }">{{ taskMeta(c).assigneeInitial }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
