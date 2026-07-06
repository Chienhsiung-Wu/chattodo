<script setup lang="ts">
import { computed } from 'vue';
import { Search, Lock, Plus, MessageSquareText, Inbox } from 'lucide-vue-next';
import { api } from '@/lib/api.js';
import { state, patch } from '@/app/state';
import { feedView } from '@/app/derived';
import { newConversation, switchConversation, deleteConversationUi } from '@/app/chat';
import { openFeed } from '@/app/palette';
import { lxFmtDue } from '@/app/format';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import { cn } from '@/lib/utils';

const ws = computed({
  get: () => state.workspace,
  set: (v: string) => {
    patch({ workspace: v as 'work' | 'personal' });
    api.updateSettings({ workspaceMode: v }).catch(() => {});
  },
});

function togglePrivacy() {
  patch((s) => ({ privacy: !s.privacy }), () => api.updateSettings({ privacyMode: state.privacy }).catch(() => {}));
}

const conversations = computed(() => (state.conversations || []).map((c: any) => ({
  id: c.id,
  title: c.title || '新对话',
  preview: (c.lastText || '还没有消息').replace(/\s+/g, ' ').slice(0, 30),
  time: lxFmtDue(c.updatedAt),
  active: c.id === state.activeConversationId,
})));
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex flex-col gap-3 border-b border-border px-4 pb-3 pt-[15px]">
      <div class="flex items-center gap-2">
        <SegmentedControl v-model="ws" :items="[{ value: 'work', label: '工作' }, { value: 'personal', label: '个人' }]" />
        <div class="flex-1" />
        <button
          title="隐私模式"
          :class="cn('flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-md transition-colors duration-medium', state.privacy ? 'bg-accent-brand-soft text-accent-brand-ink' : 'bg-hover text-tertiary hover:text-foreground')"
          @click="togglePrivacy"
        >
          <Lock :size="15" />
        </button>
      </div>
      <div class="flex items-center gap-2 rounded-md bg-hover px-3 py-2">
        <Search :size="15" class="text-tertiary" />
        <input :value="state.feedQuery" placeholder="搜索收集内容" class="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-tertiary" @input="patch({ feedQuery: ($event.target as HTMLInputElement).value })" />
      </div>
    </div>
    <div class="flex items-center justify-between px-4 pb-2 pt-3">
      <span class="text-[11px] font-bold uppercase tracking-[.09em] text-tertiary">对话</span>
      <button class="inline-flex h-[26px] cursor-pointer items-center gap-1 rounded-md bg-background px-2.5 text-[11.5px] font-semibold text-accent-brand-ink shadow-hairline transition-colors duration-medium hover:bg-hover" title="新建对话" @click="newConversation()">
        <Plus :size="13" />新建
      </button>
    </div>
    <div class="flex max-h-[38%] flex-initial flex-col gap-0.5 overflow-auto px-2 pb-1.5">
      <a
        v-for="c in conversations"
        :key="c.id"
        :class="cn('flex cursor-pointer gap-2 rounded-md px-2.5 py-2 transition-colors duration-fast', c.active ? 'bg-accent-brand-soft' : 'hover:bg-hover')"
        @click="switchConversation(c.id)"
      >
        <MessageSquareText :size="16" class="mt-0.5 flex-none" :class="c.active ? 'text-accent-brand-ink' : 'text-tertiary'" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-xs font-semibold" :class="c.active ? 'text-accent-brand-ink' : 'text-foreground'">{{ c.title }}</span>
          <span class="block truncate text-[11px] text-tertiary">{{ c.preview }}</span>
        </span>
        <span class="flex flex-none flex-col items-end gap-1">
          <span class="font-nums text-[10px] text-tertiary">{{ c.time }}</span>
          <button class="cursor-pointer p-px text-xs leading-none text-tertiary hover:text-destructive" title="删除对话" @click.stop="deleteConversationUi(c.id)">&times;</button>
        </span>
      </a>
    </div>
    <div class="flex items-center justify-between border-t border-border px-4 pb-2 pt-2.5">
      <span class="text-[11px] font-bold uppercase tracking-[.09em] text-tertiary">收集箱</span>
      <span class="font-nums text-[11px] font-semibold text-tertiary">{{ feedView.length }}</span>
    </div>
    <div class="flex flex-1 flex-col gap-px overflow-auto px-2 pb-3">
      <a v-for="(f, i) in feedView" :key="i" class="flex cursor-pointer gap-2.5 rounded-md p-2.5 transition-colors duration-fast hover:bg-hover" @click="openFeed(f)">
        <span class="mt-1.5 h-[7px] w-[7px] flex-none rounded-pill" :style="{ background: f.dot }" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-semibold" :class="f.muted ? 'text-muted-foreground' : 'text-foreground'">{{ f.title }}</span>
          <span class="mt-0.5 block text-[11.5px] text-tertiary">{{ f.label }} · <span class="font-nums">{{ f.time }}</span></span>
        </span>
      </a>
      <div v-if="feedView.length === 0" class="flex flex-col items-center gap-2 px-3 py-9 text-center text-tertiary">
        <Inbox :size="24" />
        <div class="text-xs leading-relaxed">还没有收集内容<br />在右侧输入框丢一句话试试</div>
      </div>
    </div>
  </div>
</template>
