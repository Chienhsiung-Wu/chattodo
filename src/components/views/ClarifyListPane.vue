<script setup lang="ts">
import { state, patch } from '@/app/state';
import { visIdeas, selIdea } from '@/app/derived';
import PaneHeader from '@/components/layout/PaneHeader.vue';
import { cn } from '@/lib/utils';
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <PaneHeader title="待澄清区">
      <template #subtitle><span class="font-nums">{{ visIdeas.length }}</span> 条 · 有行动倾向但还不够具体</template>
    </PaneHeader>
    <div class="flex flex-1 flex-col gap-0.5 overflow-auto px-2 py-2">
      <a
        v-for="i in visIdeas"
        :key="i.id"
        :class="cn('flex cursor-pointer flex-col gap-1 rounded-md px-3 py-2.5 transition-colors duration-fast', selIdea && i.id === selIdea.id ? 'bg-accent-brand-soft' : 'hover:bg-hover')"
        @click="patch({ selIdeaId: i.id, mobilePane: 'main' })"
      >
        <span class="text-sm font-semibold leading-snug text-foreground">{{ i.title }}</span>
        <span class="truncate text-[11.5px] text-tertiary">{{ i.raw }}</span>
      </a>
    </div>
  </div>
</template>
