<script setup lang="ts">
import { computed } from 'vue';
import { Users } from 'lucide-vue-next';
import { state } from '@/app/state';
import { lxFmtDue } from '@/app/format';
import { respondFriendUi, removeFriendUi, withdrawFriendUi } from '@/app/friends';
import ViewHeader from '@/components/layout/ViewHeader.vue';
import Button from '@/components/ui/Button.vue';
import MotionStagger from '@/components/motion/MotionStagger.vue';

const incoming = computed(() => state.friends.incoming.map((f: any) => ({ ...f, initial: (f.name || '?').slice(-1), time: lxFmtDue(f.at) })));
const outgoing = computed(() => state.friends.outgoing.map((f: any) => ({ ...f, initial: (f.name || '?').slice(-1), time: lxFmtDue(f.at) })));
const accepted = computed(() => state.friends.accepted.map((f: any) => ({ ...f, initial: (f.name || '?').slice(-1), since: lxFmtDue(f.since) })));
</script>

<template>
  <ViewHeader title="好友" caption="协作从好友开始">
    <template #icon><Users :size="20" class="text-accent-brand-ink" /></template>
  </ViewHeader>
  <div class="min-h-0 flex-1 overflow-auto p-6">
    <MotionStagger class="mx-auto flex max-w-[680px] flex-col gap-5">
      <div v-if="incoming.length > 0">
        <div class="mb-2 text-[11px] font-bold uppercase tracking-[.08em] text-tertiary">待处理请求 · <span class="font-nums">{{ incoming.length }}</span></div>
        <div v-for="(f, i) in incoming" :key="i" class="mb-2 flex items-center gap-3 rounded-lg bg-card px-3.5 py-3 shadow-xs">
          <span class="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-pill bg-active text-sm font-semibold text-muted-foreground">{{ f.initial }}</span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold text-foreground">{{ f.name }}</span>
            <span class="block truncate text-[11.5px] text-tertiary">{{ f.email }} · <span class="font-nums">{{ f.time }}</span></span>
          </span>
          <Button variant="primary" size="sm" @click="respondFriendUi(f.friendshipId, true)">接受</Button>
          <Button variant="outline" size="sm" @click="respondFriendUi(f.friendshipId, false)">拒绝</Button>
        </div>
      </div>
      <div v-if="outgoing.length > 0">
        <div class="mb-2 text-[11px] font-bold uppercase tracking-[.08em] text-tertiary">已发出 · 等待对方接受</div>
        <div v-for="(f, i) in outgoing" :key="i" class="mb-2 flex items-center gap-3 rounded-lg bg-card px-3.5 py-3 shadow-hairline">
          <span class="flex h-8 w-8 flex-none items-center justify-center rounded-pill bg-hover text-xs font-semibold text-muted-foreground">{{ f.initial }}</span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold text-foreground">{{ f.name }}</span>
            <span class="block truncate text-[11.5px] text-tertiary">{{ f.email }} · <span class="font-nums">{{ f.time }}</span></span>
          </span>
          <Button variant="outline" size="sm" @click="withdrawFriendUi(f)">撤回</Button>
        </div>
      </div>
      <div>
        <div class="mb-2 text-[11px] font-bold uppercase tracking-[.08em] text-tertiary">我的好友 · <span class="font-nums">{{ accepted.length }}</span></div>
        <div v-for="(f, i) in accepted" :key="i" class="mb-2 flex items-center gap-3 rounded-lg bg-card px-3.5 py-3 shadow-xs">
          <span class="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-pill bg-active text-sm font-semibold text-muted-foreground">{{ f.initial }}</span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold text-foreground">{{ f.name }}</span>
            <span class="block truncate text-[11.5px] text-tertiary">{{ f.email }} · <span class="font-nums">{{ f.since }}</span>起</span>
          </span>
          <Button variant="outline" size="sm" title="解除好友（不影响已有协作任务）" class="text-tertiary" @click="removeFriendUi(f)">解除</Button>
        </div>
        <div v-if="accepted.length === 0" class="flex flex-col items-center gap-2.5 rounded-lg bg-card px-3 py-10 text-center text-tertiary shadow-hairline">
          <Users :size="30" />
          <div class="text-sm leading-relaxed">还没有好友<br />在左侧输入对方的注册邮箱发送请求；也可以在聊天里说「加好友 对方邮箱」</div>
        </div>
      </div>
      <div class="rounded-lg bg-hover px-4 py-3 text-xs leading-relaxed text-tertiary">添加好友需要对方的注册邮箱（不提供按名字搜索，保护隐私）。成为好友后，双方可以互相 @提及、指派与邀请协作；解除好友不影响已有协作任务。不想被陌生人打扰？在 设置 · 隐私与安全 里可谢绝陌生请求。你的邮箱：{{ state.settings.email }}</div>
    </MotionStagger>
  </div>
</template>
