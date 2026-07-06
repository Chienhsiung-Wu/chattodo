<script setup lang="ts">
import { state, patch } from '@/app/state';
import { dbCounts, DB_VIEW_DEFS, visTasks } from '@/app/derived';
import PhIcon from '@/components/ui/PhIcon.vue';
import PaneHeader from '@/components/layout/PaneHeader.vue';
import { cn } from '@/lib/utils';
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <PaneHeader title="Todo 数据库" :subtitle="`${visTasks.length} 个正式任务`" />
    <div class="flex flex-1 flex-col gap-0.5 overflow-auto p-2.5">
      <span class="px-2 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-[.09em] text-tertiary">视图</span>
      <a
        v-for="[k, name, icon] in DB_VIEW_DEFS"
        :key="k"
        :class="cn('flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors duration-fast', state.dbView === k ? 'bg-accent-brand-soft font-semibold text-accent-brand-ink' : 'text-muted-foreground hover:bg-hover')"
        @click="patch({ dbView: k, mobilePane: 'main' })"
      >
        <PhIcon :name="icon" :size="16" />
        <span class="flex-1">{{ name }}</span>
        <span class="font-nums text-[11px] font-semibold text-tertiary">{{ dbCounts[k] }}</span>
      </a>
      <span class="px-2 pb-1.5 pt-3.5 text-[10.5px] font-bold uppercase tracking-[.09em] text-tertiary">按隐私范围</span>
      <div class="flex items-center gap-2 px-2.5 py-2 text-sm text-muted-foreground"><span class="h-2 w-2 rounded-xs bg-accent-brand" />工作</div>
      <div class="flex items-center gap-2 px-2.5 py-2 text-sm text-muted-foreground"><span class="h-2 w-2 rounded-xs bg-warning" />个人</div>
    </div>
  </div>
</template>
