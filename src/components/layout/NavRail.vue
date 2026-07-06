<script setup lang="ts">
import { computed } from 'vue';
import { Search, MessageCircle, Table, Folders, Users, Lightbulb, Inbox, Sparkles, TrendingUp, Settings, Bell, Moon, Sun } from 'lucide-vue-next';
import { state, patch } from '@/app/state';
import { go } from '@/app/nav';
import { toggleTheme } from '@/app/theme';
import { unreadCount, canAdmin } from '@/app/derived';
import { cn } from '@/lib/utils';

const NAV = [
  { view: 'chat', icon: MessageCircle, title: '聊天' },
  { view: 'database', icon: Table, title: 'Todo 数据库' },
  { view: 'projects', icon: Folders, title: '项目' },
  { view: 'friends', icon: Users, title: '好友' },
  { view: 'clarify', icon: Lightbulb, title: '待澄清区' },
  { view: 'nontodo', icon: Inbox, title: '非 todo 隔离区' },
  { view: 'agent', icon: Sparkles, title: 'Agent 配置' },
];

const friendPendingCount = computed(() => (state.friends?.incoming || []).length);
const adminUrl = (import.meta.env.BASE_URL || '/') + 'admin/';
const meBig = computed(() => (state.settings.name || '我').slice(-1));

function openSearch() { patch({ searchOpen: true, searchQuery: '', paletteIndex: 0 }); }

const itemCls = (active: boolean) =>
  cn(
    'relative flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-lg transition-colors duration-medium ease-in-out',
    active ? 'bg-accent-brand-soft text-accent-brand-ink' : 'text-muted-foreground hover:bg-hover',
  );
</script>

<template>
  <nav class="z-[5] flex w-[66px] flex-none flex-col items-center gap-1.5 border-r border-border bg-sunken py-3.5">
    <div class="mb-2 flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground shadow-sm">灵</div>
    <button title="搜索 (⌘K)" class="mb-2 flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-lg bg-hover text-muted-foreground transition-colors duration-medium hover:bg-active" @click="openSearch">
      <Search :size="18" />
    </button>
    <a v-for="n in NAV" :key="n.view" :title="n.title" :class="itemCls(state.view === n.view)" @click="go(n.view)">
      <component :is="n.icon" :size="21" />
      <span v-if="n.view === 'friends' && friendPendingCount > 0" class="absolute right-1.5 top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-pill bg-destructive px-[3px] text-center font-nums text-[9px] font-bold leading-[15px] text-destructive-foreground">{{ friendPendingCount }}</span>
    </a>
    <div class="flex-1" />
    <a v-if="canAdmin" :href="adminUrl" title="监控后台（独立应用）" :class="itemCls(false)" class="no-underline">
      <TrendingUp :size="21" />
    </a>
    <a title="设置" :class="itemCls(state.view === 'settings')" @click="go('settings')">
      <Settings :size="21" />
    </a>
    <button title="通知" class="relative mt-1 flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors duration-medium hover:bg-hover" @click="patch((s) => ({ notifOpen: !s.notifOpen }))">
      <Bell :size="19" />
      <span v-if="unreadCount > 0" class="absolute right-[5px] top-[5px] flex h-[15px] min-w-[15px] items-center justify-center rounded-pill bg-destructive px-[3px] text-center font-nums text-[9px] font-bold leading-[15px] text-destructive-foreground">{{ unreadCount }}</span>
    </button>
    <button title="切换明/暗" class="mt-1 flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors duration-medium hover:bg-hover" @click="toggleTheme()">
      <Sun v-if="state.theme === 'dark'" :size="18" />
      <Moon v-else :size="18" />
    </button>
    <div :title="state.settings.name" class="mt-1.5 flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-pill bg-active text-sm font-semibold text-muted-foreground" @click="go('settings')">{{ meBig }}</div>
  </nav>
</template>
