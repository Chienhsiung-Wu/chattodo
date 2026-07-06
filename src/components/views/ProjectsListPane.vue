<script setup lang="ts">
import { computed } from 'vue';
import { Plus, Folders } from 'lucide-vue-next';
import { state, patch, visible } from '@/app/state';
import { canEdit } from '@/app/derived';
import { submitNewProject } from '@/app/projects';
import PaneHeader from '@/components/layout/PaneHeader.vue';
import Input from '@/components/ui/Input.vue';
import Button from '@/components/ui/Button.vue';
import MotionReveal from '@/components/motion/MotionReveal.vue';
import { cn } from '@/lib/utils';

const projList = computed(() => state.projects.map((p) => {
  const ts = state.tasks.filter((t: any) => t.project === p.name && visible(t.scope));
  const done = ts.filter((t: any) => t.status === 'done').length;
  return { ...p, count: ts.length, done, pct: ts.length ? Math.round((done / ts.length) * 100) : 0, active: state.selProjectId === p.id };
}));

function newProjKey(e: KeyboardEvent) {
  if (e.key === 'Enter') { e.preventDefault(); submitNewProject(); }
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <PaneHeader title="项目" subtitle="按项目组织任务与进度">
      <template #actions>
        <Button v-if="canEdit" variant="ghost" size="icon-sm" class="bg-accent-brand-soft text-accent-brand-ink" title="新建项目" @click="patch((s) => ({ newProjOpen: !s.newProjOpen, newProjName: '' }))">
          <Plus />
        </Button>
      </template>
    </PaneHeader>
    <MotionReveal v-if="state.newProjOpen" :y="4" class="flex gap-2 border-b border-border px-3 py-2.5">
      <Input v-model="state.newProjName" placeholder="项目名称（回车创建）" class="min-w-0 flex-1" @keydown="newProjKey" />
      <Button variant="primary" @click="submitNewProject()">创建</Button>
    </MotionReveal>
    <div class="flex flex-1 flex-col gap-1 overflow-auto p-2.5">
      <a
        v-for="p in projList"
        :key="p.id"
        :class="cn('flex cursor-pointer flex-col gap-2 rounded-lg p-3 transition-colors duration-fast', p.active ? 'bg-accent-brand-soft' : 'hover:bg-hover')"
        @click="patch({ selProjectId: p.id, mobilePane: 'main' })"
      >
        <div class="flex items-center gap-2">
          <span class="h-[9px] w-[9px] flex-none rounded-xs" :style="{ background: p.color }" />
          <span class="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{{ p.name }}</span>
          <span class="font-nums text-[11px] font-semibold text-tertiary">{{ p.done }}/{{ p.count }}</span>
        </div>
        <div class="h-[5px] overflow-hidden rounded-xs bg-hover">
          <div class="h-full rounded-xs transition-all duration-slow ease-out" :style="{ width: p.pct + '%', background: p.color }" />
        </div>
      </a>
      <div v-if="projList.length === 0" class="flex flex-col items-center gap-2 px-3 py-9 text-center text-tertiary">
        <Folders :size="24" />
        <div class="text-xs leading-relaxed">还没有项目<br />点右上角 + 创建后，聊天里提到项目名会自动归属</div>
      </div>
    </div>
  </div>
</template>
