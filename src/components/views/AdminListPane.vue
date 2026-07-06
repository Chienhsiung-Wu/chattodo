<script setup lang="ts">
import { state, patch } from '@/app/state';
import { fetchAdminUser } from '@/app/admin';
import PaneHeader from '@/components/layout/PaneHeader.vue';
import { cn } from '@/lib/utils';
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <PaneHeader title="内部后台" subtitle="测试用户 · 只读观察" />
    <div class="flex flex-1 flex-col gap-0.5 overflow-auto p-2.5">
      <a
        v-for="u in state.adminUsers"
        :key="u.id"
        :class="cn('flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors duration-fast', state.adminSelId === u.id ? 'bg-accent-brand-soft' : 'hover:bg-hover')"
        @click="fetchAdminUser(u.id); patch({ mobilePane: 'main' })"
      >
        <span class="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-pill bg-active text-xs font-semibold text-muted-foreground">{{ (u.name || '?').slice(-1) }}</span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-foreground">{{ u.name }}</span>
          <span class="block truncate text-[11px] text-tertiary">{{ u.email }}</span>
        </span>
      </a>
    </div>
  </div>
</template>
