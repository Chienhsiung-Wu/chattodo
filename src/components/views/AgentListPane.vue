<script setup lang="ts">
import { state, patch } from '@/app/state';
import PhIcon from '@/components/ui/PhIcon.vue';
import PaneHeader from '@/components/layout/PaneHeader.vue';
import { cn } from '@/lib/utils';
import { AGENT_DEFS } from './defs';
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <PaneHeader title="Agent 配置" subtitle="定义 AI 如何判断与追问" />
    <div class="flex flex-1 flex-col gap-0.5 overflow-auto p-2.5">
      <a
        v-for="d in AGENT_DEFS"
        :key="d.key"
        :class="cn('flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors duration-fast', state.agentSection === d.key ? 'bg-accent-brand-soft text-accent-brand-ink' : 'text-muted-foreground hover:bg-hover')"
        @click="patch({ agentSection: d.key, mobilePane: 'main' })"
      >
        <PhIcon :name="d.icon" :size="17" />
        <span class="text-sm font-semibold">{{ d.name }}</span>
      </a>
    </div>
  </div>
</template>
