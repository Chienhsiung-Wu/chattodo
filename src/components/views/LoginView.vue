<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import { state } from '@/app/state';
import { submitAuth } from '@/app/session';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import MotionReveal from '@/components/motion/MotionReveal.vue';

function authKey(e: KeyboardEvent) {
  if (e.key === 'Enter') { e.preventDefault(); submitAuth(); }
}
function switchMode() {
  state.authMode = state.authMode === 'login' ? 'register' : 'login';
  state.authError = '';
}
</script>

<template>
  <div class="flex h-screen items-center justify-center p-6" style="background:radial-gradient(120% 90% at 50% 0%, var(--surface-base) 0%, var(--surface-sunken) 60%);">
    <MotionReveal :y="8" class="flex w-[400px] max-w-full flex-col gap-6">
      <div class="flex flex-col items-center gap-3.5">
        <div class="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-primary text-[26px] font-semibold text-primary-foreground shadow-md">灵</div>
        <div class="text-center">
          <div class="text-2xl font-semibold tracking-tight text-foreground" style="font-size:24px;">登录 LinX 灵信</div>
          <div class="mt-1.5 text-sm text-tertiary">AI 原生 todo · 内部测试版</div>
        </div>
      </div>
      <div class="flex flex-col gap-3.5 rounded-xl bg-card p-6 shadow-md">
        <label v-if="state.authMode === 'register'" class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold text-muted-foreground">显示名称</span>
          <Input v-model="state.authName" placeholder="你的名字" class="h-10" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold text-muted-foreground">邮箱</span>
          <Input v-model="state.authEmail" type="email" placeholder="you@team.com" class="h-10" @keydown="authKey" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-semibold text-muted-foreground">密码</span>
          <Input v-model="state.authPassword" type="password" :placeholder="state.authMode === 'register' ? '至少 8 位' : '输入密码'" class="h-10" @keydown="authKey" />
        </label>
        <div v-if="state.authError" class="rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">{{ state.authError }}</div>
        <Button variant="primary" size="lg" class="mt-1 h-11 w-full" :disabled="state.authBusy" @click="submitAuth()">
          {{ state.authBusy ? '请稍候…' : (state.authMode === 'register' ? '注册并进入' : '登录') }}
          <ArrowRight />
        </Button>
        <div class="text-center text-sm text-tertiary">
          {{ state.authMode === 'register' ? '已有账号？' : '还没有账号？' }}
          <span class="ml-1 cursor-pointer font-semibold text-accent-brand-ink" @click="switchMode">{{ state.authMode === 'register' ? '去登录' : '注册新账号' }}</span>
        </div>
      </div>
      <div class="text-center text-xs leading-relaxed text-tertiary">你的数据仅自己可见 · 首个注册账号为管理员</div>
    </MotionReveal>
  </div>
</template>
