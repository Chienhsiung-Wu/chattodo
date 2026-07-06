<template>
  <div id="lx-root" class="h-screen w-full overflow-hidden bg-[var(--surface-sunken)] font-sans text-foreground">
    <LoginView v-if="!state.authed" />
    <AppShell v-else />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { state } from './app/state';
import { initApp, disposeApp } from './app/lifecycle';
import LoginView from './components/views/LoginView.vue';
import AppShell from './components/AppShell.vue';

// 应用薄壳：全部状态在 src/app/state.ts,逻辑在 src/app/* 领域模块,
// 视图在 src/components/**。挂载副作用（快捷键/响应式断点/自动登录）见 lifecycle。
onMounted(() => initApp());
onBeforeUnmount(() => disposeApp());
</script>
