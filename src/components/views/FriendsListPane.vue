<script setup lang="ts">
import { Users } from 'lucide-vue-next';
import { state, patch } from '@/app/state';
import { submitAddFriend } from '@/app/friends';
import PaneHeader from '@/components/layout/PaneHeader.vue';
import Input from '@/components/ui/Input.vue';
import Button from '@/components/ui/Button.vue';

function addKey(e: KeyboardEvent) {
  if (e.key === 'Enter') { e.preventDefault(); submitAddFriend(); }
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <PaneHeader title="好友">
      <template #subtitle><span class="font-nums">{{ state.friends.accepted.length }}</span> 位好友 · <span class="font-nums">{{ state.friends.incoming.length }}</span> 条待处理</template>
    </PaneHeader>
    <div class="flex gap-2 border-b border-border px-3 py-2.5">
      <Input v-model="state.addFriendEmail" placeholder="对方注册邮箱（回车添加）" class="min-w-0 flex-1" @keydown="addKey" />
      <Button variant="primary" @click="submitAddFriend()">添加</Button>
    </div>
    <div class="flex flex-1 flex-col gap-0.5 overflow-auto p-2.5">
      <span class="px-2 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-[.09em] text-tertiary">我的好友</span>
      <div v-for="(f, i) in state.friends.accepted" :key="i" class="flex items-center gap-2.5 rounded-md px-3 py-2">
        <span class="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-pill bg-active text-xs font-semibold text-muted-foreground">{{ (f.name || '?').slice(-1) }}</span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-foreground">{{ f.name }}</span>
          <span class="block truncate text-[11px] text-tertiary">{{ f.email }}</span>
        </span>
      </div>
      <div v-if="state.friends.accepted.length === 0" class="flex flex-col items-center gap-2 px-3 py-7 text-center text-tertiary">
        <Users :size="24" />
        <div class="text-xs leading-relaxed">还没有好友<br />输入对方邮箱添加，或把你的邮箱发给对方</div>
      </div>
    </div>
  </div>
</template>
