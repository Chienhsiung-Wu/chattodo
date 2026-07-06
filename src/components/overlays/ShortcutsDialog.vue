<script setup lang="ts">
import { state, patch } from '@/app/state';
import Dialog from '@/components/ui/Dialog.vue';
import Kbd from '@/components/ui/Kbd.vue';

const ROWS = [
  { label: '命令面板', keys: '⌘K / /' },
  { label: '新建捕获', keys: 'N' },
  { label: '跳转 · 聊天/数据库/项目/设置', keys: 'G 然后 C/D/P/S' },
  { label: '显示 / 关闭本表', keys: '?' },
];
</script>

<template>
  <Dialog :open="state.shortcutsOpen" title="键盘快捷键" content-class="max-w-[430px]" @update:open="patch({ shortcutsOpen: $event })">
    <div class="flex flex-col">
      <div v-for="(r, i) in ROWS" :key="r.label" class="flex items-center gap-3 py-2.5" :class="i < ROWS.length - 1 && 'border-b border-border'">
        <span class="flex-1 text-sm text-foreground">{{ r.label }}</span>
        <Kbd class="h-6 px-2">{{ r.keys }}</Kbd>
      </div>
    </div>
  </Dialog>
</template>
