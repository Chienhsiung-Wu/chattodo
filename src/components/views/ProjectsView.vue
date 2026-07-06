<script setup lang="ts">
import { computed } from 'vue';
import { state, visible } from '@/app/state';
import { taskMeta, PRIO_COLORS } from '@/app/derived';
import { openTask } from '@/app/tasks';
import ViewHeader from '@/components/layout/ViewHeader.vue';
import ModeChip from '@/components/layout/ModeChip.vue';
import MotionStagger from '@/components/motion/MotionStagger.vue';

const selProject = computed(() => state.projects.find((p) => p.id === state.selProjectId) || state.projects[0]);
const spTasks = computed(() => (selProject.value ? state.tasks.filter((t: any) => t.project === selProject.value!.name && visible(t.scope)) : []));
const spDone = computed(() => spTasks.value.filter((t: any) => t.status === 'done').length);
const spPct = computed(() => (spTasks.value.length ? Math.round((spDone.value / spTasks.value.length) * 100) : 0));

function prioStyle(p: number) {
  const c = PRIO_COLORS[p] || PRIO_COLORS[3];
  return { color: c[0], background: c[1] };
}
</script>

<template>
  <ViewHeader>
    <template #icon><span class="h-3 w-3 flex-none rounded-xs" :style="{ background: selProject?.color || 'var(--accent)' }" /></template>
    <template #title>
      <span class="text-[16px] font-semibold tracking-tight text-foreground">{{ selProject?.name || '' }}</span>
      <span class="text-xs text-tertiary"><span class="font-nums">{{ spDone }}/{{ spTasks.length }}</span> 完成</span>
    </template>
    <ModeChip />
  </ViewHeader>
  <div class="flex-1 overflow-auto p-[22px]">
    <div class="mx-auto flex max-w-[720px] flex-col gap-[18px]">
      <div class="rounded-lg bg-card p-[18px] shadow-xs">
        <div class="text-sm leading-relaxed text-muted-foreground">{{ selProject?.desc }}</div>
        <div class="mt-3.5 flex items-center gap-3">
          <div class="h-2 flex-1 overflow-hidden rounded-xs bg-hover">
            <div class="h-full rounded-xs transition-all duration-slow ease-out" :style="{ width: spPct + '%', background: selProject?.color }" />
          </div>
          <span class="font-nums text-sm font-semibold text-foreground">{{ spPct }}%</span>
        </div>
      </div>
      <div class="text-[11px] font-bold uppercase tracking-[.08em] text-tertiary">项目任务 · <span class="font-nums">{{ spTasks.length }}</span></div>
      <MotionStagger class="flex flex-col gap-2">
        <div
          v-for="t in spTasks" :key="t.id"
          class="flex cursor-pointer items-center gap-3 rounded-md bg-card px-3.5 py-3 shadow-xs transition-shadow duration-medium hover:shadow-sm"
          @click="openTask(t.id)"
        >
          <span class="h-2 w-2 flex-none rounded-pill" :style="{ background: taskMeta(t).assigneeColor }" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-semibold" :class="taskMeta(t).done ? 'text-tertiary line-through' : 'text-foreground'">{{ t.title }}</div>
            <div class="mt-1 text-[11px] text-tertiary">{{ taskMeta(t).statusLabel }} · <span class="font-nums">{{ t.due }}</span></div>
          </div>
          <span class="inline-flex rounded-sm px-2 py-[3px] font-nums text-[11px] font-bold" :style="prioStyle(t.priority)">P{{ t.priority }}</span>
          <span class="flex h-6 w-6 flex-none items-center justify-center rounded-pill text-[11px] font-semibold text-[var(--accent-contrast)]" :style="{ background: taskMeta(t).assigneeColor }">{{ taskMeta(t).assigneeInitial }}</span>
        </div>
      </MotionStagger>
    </div>
  </div>
</template>
