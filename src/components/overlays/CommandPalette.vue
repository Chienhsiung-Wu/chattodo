<script setup lang="ts">
import { computed } from 'vue';
import { Search } from 'lucide-vue-next';
import { state, patch } from '@/app/state';
import { buildPalette, paletteKey } from '@/app/palette';
import PhIcon from '@/components/ui/PhIcon.vue';
import Kbd from '@/components/ui/Kbd.vue';
import MotionReveal from '@/components/motion/MotionReveal.vue';

const palette = computed(() => {
  // recompute on query/index change; run() closures come from the palette module
  void state.searchQuery; void state.paletteIndex;
  return buildPalette();
});

function onSearch(e: Event) {
  patch({ searchQuery: (e.target as HTMLInputElement).value, paletteIndex: 0 });
}
</script>

<template>
  <div v-if="state.searchOpen" class="fixed inset-0 z-50 flex items-start justify-center bg-scrim pt-[12vh]" @click="patch({ searchOpen: false })">
    <MotionReveal :y="8" class="w-[560px] max-w-[90vw] overflow-hidden rounded-lg bg-popover shadow-lg" @click.stop>
      <div class="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <Search :size="19" class="text-tertiary" />
        <input
          :value="state.searchQuery"
          placeholder="搜索任务、待澄清、非 todo、项目…"
          class="flex-1 border-0 bg-transparent text-md text-foreground outline-none placeholder:text-tertiary"
          autofocus
          @input="onSearch"
          @keydown="paletteKey($event)"
        />
        <Kbd>Esc</Kbd>
      </div>
      <div class="max-h-[52vh] overflow-auto py-1.5">
        <template v-for="(g, gi) in palette.groups" :key="gi">
          <div class="px-4 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-[.08em] text-tertiary">{{ g.name }}</div>
          <a
            v-for="(it, ii) in g.items"
            :key="ii"
            class="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors duration-fast"
            :class="it.flatIdx === (state.paletteIndex || 0) ? 'bg-hover' : 'hover:bg-hover'"
            @click="it.run"
          >
            <PhIcon :name="it.icon" :size="17" class="flex-none text-accent-brand-ink" />
            <span class="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{{ it.label }}</span>
          </a>
        </template>
      </div>
      <div class="flex gap-3.5 border-t border-border px-4 py-2.5 text-[11px] text-tertiary">
        <span>↑↓ 选择</span><span>↵ 执行</span><span>esc 关闭</span><span class="ml-auto">? 快捷键</span>
      </div>
    </MotionReveal>
  </div>
</template>
