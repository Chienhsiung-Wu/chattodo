<script setup lang="ts">
import { computed } from 'vue';
import { Bell, BellOff, Check } from 'lucide-vue-next';
import { api } from '@/lib/api.js';
import { state, patch } from '@/app/state';
import { visNotifs } from '@/app/derived';
import { respondInviteUi, respondFriendUi } from '@/app/friends';
import PhIcon from '@/components/ui/PhIcon.vue';
import Button from '@/components/ui/Button.vue';
import MotionReveal from '@/components/motion/MotionReveal.vue';

const notifs = computed(() => visNotifs.value.map((n: any) => ({
  ...n,
  dot: n.read ? 'transparent' : n.color,
  isInvite: n.actionType === 'invite' && !n.handled,
  wasInvite: n.actionType === 'invite' && n.handled,
  isFriendReq: n.actionType === 'friend_request' && !n.handled,
  wasFriendReq: n.actionType === 'friend_request' && n.handled,
})));

function markAllRead() {
  patch((s) => ({ notifications: s.notifications.map((n: any) => ({ ...n, read: true })) }));
  api.markAllNotificationsRead().catch(() => {});
}
</script>

<template>
  <template v-if="state.notifOpen">
    <div class="fixed inset-0 z-40" @click="patch({ notifOpen: false })" />
    <MotionReveal :y="8" class="fixed bottom-4 left-[74px] z-[41] w-[340px] max-w-[80vw] overflow-hidden rounded-lg bg-popover shadow-lg">
      <div class="flex items-center gap-2 border-b border-border px-4 py-3.5">
        <Bell :size="16" class="text-accent-brand-ink" />
        <span class="text-sm font-semibold text-foreground">通知</span>
        <div class="flex-1" />
        <button class="cursor-pointer text-xs font-semibold text-accent-brand-ink" @click="markAllRead">全部已读</button>
      </div>
      <div class="max-h-[360px] overflow-auto">
        <div v-for="(n, i) in notifs" :key="i" class="flex gap-3 border-b border-border px-4 py-3">
          <PhIcon :name="n.icon" :size="18" class="mt-0.5 flex-none" :style="{ color: n.color }" />
          <div class="min-w-0 flex-1">
            <div class="text-sm leading-normal text-foreground">{{ n.text }}</div>
            <div class="mt-1 font-nums text-[11px] text-tertiary">{{ n.time }}</div>
            <div v-if="n.isInvite" class="mt-2 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" @click="respondInviteUi(n, true)">接受并提醒我</Button>
              <Button variant="outline" size="sm" title="不进我的任务库，只接收进展通知" @click="respondInviteUi(n, 'follow')">仅关注</Button>
              <Button variant="outline" size="sm" @click="respondInviteUi(n, false)">拒绝</Button>
            </div>
            <div v-if="n.wasInvite" class="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-tertiary"><Check :size="12" />已处理</div>
            <div v-if="n.isFriendReq" class="mt-2 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" @click="respondFriendUi(n.actionRef, true)">接受好友</Button>
              <Button variant="outline" size="sm" @click="respondFriendUi(n.actionRef, false)">拒绝</Button>
            </div>
            <div v-if="n.wasFriendReq" class="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-tertiary"><Check :size="12" />已处理</div>
          </div>
          <span class="mt-1.5 h-2 w-2 flex-none rounded-pill" :style="{ background: n.dot }" />
        </div>
        <div v-if="notifs.length === 0" class="flex flex-col items-center gap-2 px-4 py-8 text-tertiary">
          <BellOff :size="22" />
          <div class="text-xs">暂无通知</div>
        </div>
      </div>
    </MotionReveal>
  </template>
</template>
