<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, Moon, Sun, ArrowLeftToLine, ArrowRightToLine, Lock } from 'lucide-vue-next';
import { state, patch } from '@/app/state';
import { isViewer } from '@/app/derived';
import { go } from '@/app/nav';
import { toggleTheme } from '@/app/theme';
import { startMidResize, onPaneDrop, onPaneOver } from '@/app/panes';
import PhIcon from '@/components/ui/PhIcon.vue';
import NavRail from '@/components/layout/NavRail.vue';
import NotificationsPanel from '@/components/overlays/NotificationsPanel.vue';
import CommandPalette from '@/components/overlays/CommandPalette.vue';
import ShortcutsDialog from '@/components/overlays/ShortcutsDialog.vue';
import ToastHost from '@/components/overlays/ToastHost.vue';
import ChatListPane from '@/components/views/ChatListPane.vue';
import DatabaseListPane from '@/components/views/DatabaseListPane.vue';
import ClarifyListPane from '@/components/views/ClarifyListPane.vue';
import NonTodoListPane from '@/components/views/NonTodoListPane.vue';
import AgentListPane from '@/components/views/AgentListPane.vue';
import SettingsListPane from '@/components/views/SettingsListPane.vue';
import AdminListPane from '@/components/views/AdminListPane.vue';
import ProjectsListPane from '@/components/views/ProjectsListPane.vue';
import FriendsListPane from '@/components/views/FriendsListPane.vue';
import ChatView from '@/components/views/ChatView.vue';
import DatabaseView from '@/components/views/DatabaseView.vue';
import ClarifyView from '@/components/views/ClarifyView.vue';
import NonTodoView from '@/components/views/NonTodoView.vue';
import FriendsView from '@/components/views/FriendsView.vue';
import AgentView from '@/components/views/AgentView.vue';
import SettingsView from '@/components/views/SettingsView.vue';
import AdminView from '@/components/views/AdminView.vue';
import ProjectsView from '@/components/views/ProjectsView.vue';
import TaskDetail from '@/components/views/TaskDetail.vue';

const v = computed(() => state.view);
const mob = computed(() => state.isMobile);
const showList = computed(() => state.mobilePane === 'list');
const showBack = computed(() => mob.value && !showList.value);

// 桌面：三栏 flex + 可拖宽 + 可互换（order 由 paneSwap 决定,FLIP 由 panes.ts 处理）
const midStyle = computed(() => {
  if (!mob.value) {
    const mw = state.midW || 304;
    return {
      order: state.paneSwap ? 3 : 1,
      width: mw + 'px',
      flex: `0 0 ${mw}px`,
      [state.paneSwap ? 'borderLeft' : 'borderRight']: '1px solid var(--border-default)',
    } as Record<string, string | number>;
  }
  return showList.value ? {} : { display: 'none' };
});
const mainStyle = computed(() => {
  if (!mob.value) return { order: state.paneSwap ? 1 : 3 } as Record<string, string | number>;
  return showList.value ? { display: 'none' } : {};
});

const MOBILE_NAV: Array<[string, string]> = [
  ['chat', 'ph-chat-circle'], ['database', 'ph-table'], ['projects', 'ph-folders'],
  ['friends', 'ph-users'], ['nontodo', 'ph-tray'], ['settings', 'ph-gear'],
];
</script>

<template>
  <div class="flex h-full" :class="mob ? 'flex-col' : 'h-screen'">
    <NavRail v-if="!mob" />

    <!-- 移动端顶栏 -->
    <div v-if="mob" class="flex h-[52px] flex-none items-center gap-2.5 border-b border-border bg-card px-3">
      <button v-if="showBack" class="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-md bg-hover text-muted-foreground" @click="patch({ mobilePane: 'list' })"><ChevronLeft :size="18" /></button>
      <div class="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">灵</div>
      <span class="text-sm font-bold text-foreground">LinX 灵信</span>
      <div class="flex-1" />
      <button class="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-md bg-hover text-muted-foreground" @click="toggleTheme()">
        <Sun v-if="state.theme === 'dark'" :size="16" />
        <Moon v-else :size="16" />
      </button>
    </div>

    <div class="relative flex min-w-0 flex-1" :class="mob && 'overflow-hidden'" @drop="onPaneDrop($event)" @dragover="onPaneOver($event)">
      <!-- 面板互换的落点提示 -->
      <div v-if="state.paneDragActive" class="pointer-events-none absolute inset-0 z-40 flex">
        <div class="m-2.5 flex flex-1 items-center justify-center rounded-lg bg-accent-brand-soft opacity-60 shadow-[0_0_0_2px_var(--accent)]">
          <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-brand-ink"><ArrowLeftToLine :size="15" />放到左侧</span>
        </div>
        <div class="m-2.5 flex flex-1 items-center justify-center rounded-lg bg-accent-brand-soft opacity-60 shadow-[0_0_0_2px_var(--accent)]">
          <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-brand-ink">放到右侧<ArrowRightToLine :size="15" /></span>
        </div>
      </div>

      <!-- 中栏 -->
      <aside id="lx-mid" class="flex min-w-0 flex-col bg-card will-change-transform" :class="mob && showList && 'w-full flex-1'" :style="midStyle">
        <ChatListPane v-if="v === 'chat'" />
        <DatabaseListPane v-if="v === 'database'" />
        <ClarifyListPane v-if="v === 'clarify'" />
        <NonTodoListPane v-if="v === 'nontodo'" />
        <AgentListPane v-if="v === 'agent'" />
        <SettingsListPane v-if="v === 'settings'" />
        <AdminListPane v-if="v === 'admin' && state.role === 'admin'" />
        <div v-if="v === 'admin' && state.role !== 'admin'" class="flex items-center gap-2 p-4 text-sm text-tertiary"><Lock :size="14" />无权限访问</div>
        <ProjectsListPane v-if="v === 'projects'" />
        <FriendsListPane v-if="v === 'friends'" />
      </aside>

      <!-- 桌面：宽度拖拽手柄 -->
      <div v-if="!mob" title="拖动调整宽度" class="group relative z-[6] flex-none cursor-col-resize" style="order:2;flex-basis:5px" @mousedown="startMidResize($event)">
        <div class="absolute inset-y-0 left-[2px] right-[2px] bg-border transition-colors duration-fast group-hover:bg-[var(--accent)]" />
      </div>

      <!-- 主区 -->
      <main id="lx-main" class="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--surface-sunken)] will-change-transform" :style="mainStyle">
        <div v-if="isViewer" class="flex flex-none items-center gap-2 border-b border-border bg-warning-soft px-4 py-2 text-xs font-semibold text-warning">
          <Lock :size="13" />只读模式 · 你当前是「只读」角色，无法创建或编辑内容
        </div>
        <ChatView v-if="v === 'chat'" />
        <DatabaseView v-if="v === 'database'" />
        <ClarifyView v-if="v === 'clarify'" />
        <NonTodoView v-if="v === 'nontodo'" />
        <FriendsView v-if="v === 'friends'" />
        <AgentView v-if="v === 'agent'" />
        <SettingsView v-if="v === 'settings'" />
        <AdminView v-if="v === 'admin'" />
        <ProjectsView v-if="v === 'projects'" />
        <TaskDetail />
        <ToastHost />
      </main>
    </div>

    <!-- 移动端底部导航 -->
    <div v-if="mob" class="flex flex-none border-t border-border bg-card px-0.5 py-1.5">
      <button v-for="[view, icon] in MOBILE_NAV" :key="view" class="flex flex-1 cursor-pointer items-center justify-center py-[7px]" @click="go(view)">
        <span class="flex h-8 w-11 items-center justify-center rounded-md transition-colors duration-medium" :class="state.view === view ? 'bg-accent-brand-soft text-accent-brand-ink' : 'text-tertiary'">
          <PhIcon :name="icon" :size="21" />
        </span>
      </button>
    </div>

    <NotificationsPanel />
    <CommandPalette />
    <ShortcutsDialog />
  </div>
</template>
