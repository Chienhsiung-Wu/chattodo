<script setup lang="ts">
import { Inbox } from 'lucide-vue-next';
import { patch } from '@/app/state';
import { visNon, selNon, DEST_LABEL } from '@/app/derived';
import PaneHeader from '@/components/layout/PaneHeader.vue';
import { cn } from '@/lib/utils';
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <PaneHeader title="非 todo 隔离区">
      <template #subtitle><span class="font-nums">{{ visNon.length }}</span> 条 · 不参与任务与计划</template>
    </PaneHeader>
    <div class="flex flex-1 flex-col gap-0.5 overflow-auto px-2 py-2">
      <a
        v-for="n in visNon"
        :key="n.id"
        :class="cn('flex cursor-pointer flex-col gap-1 rounded-md px-3 py-2.5 transition-colors duration-fast', selNon && n.id === selNon.id ? 'bg-accent-brand-soft' : 'hover:bg-hover')"
        @click="patch({ selNonId: n.id, mobilePane: 'main' })"
      >
        <span class="truncate text-sm font-semibold text-muted-foreground">{{ n.title }}</span>
        <span class="inline-flex items-center gap-1 text-[11px] text-tertiary"><Inbox :size="12" />{{ DEST_LABEL[n.dest] || '建议归档' }}</span>
      </a>
    </div>
  </div>
</template>
