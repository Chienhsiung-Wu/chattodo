<script setup lang="ts">
import { computed } from 'vue';
import { X, CircleDashed, Folder, Calendar, Flag, User, Users, StickyNote, Plus, Check, Quote, Sparkles, Clock, CornerUpLeft, LogOut, Send } from 'lucide-vue-next';
import { state, patch, memberColor } from '@/app/state';
import { detailTask, canEdit } from '@/app/derived';
import { patchTask, dSetStatus, toggleSub, addSub, addComment, moveOut, leaveCollabTask, inviteMember, inviteAll, assignTask } from '@/app/tasks';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import Button from '@/components/ui/Button.vue';
import MotionReveal from '@/components/motion/MotionReveal.vue';
import { cn } from '@/lib/utils';

const dt = detailTask;
const detailTab = computed({ get: () => state.detailTab, set: (v: string) => patch({ detailTab: v as any }) });
const status = computed({ get: () => dt.value?.status || 'todo', set: (v: string) => dSetStatus(v) });
const priority = computed({ get: () => String(dt.value?.priority ?? 3), set: (v: string) => dt.value && patchTask(state.detailId!, { priority: Number(v) }) });

const dAssignee = computed(() => (dt.value ? dt.value.assignee || state.settings.name || '我' : ''));
const memberNames = computed(() => [...new Set([...(state.team || []).map((u: any) => u.name), state.settings.name || '我', ...state.tasks.map((t: any) => t.assignee).filter(Boolean)])].filter(Boolean).slice(0, 8) as string[]);

const COLLAB_META: Record<string, [string, string, string]> = {
  pending: ['待接受', 'var(--idea)', 'var(--idea-bg)'],
  accepted: ['协作中', 'var(--accent-ink)', 'var(--accent-bg)'],
  following: ['关注中', 'var(--text2)', 'var(--mid)'],
};
const dCollabsRaw = computed(() => (dt.value ? (state.taskCollabs[dt.value.id] || []).filter((c: any) => COLLAB_META[c.status]) : []));
const dCollabs = computed(() => dCollabsRaw.value.map((c: any) => ({ name: c.userName, label: COLLAB_META[c.status][0], fg: COLLAB_META[c.status][1], bg: COLLAB_META[c.status][2] })));
const dIsOwner = computed(() => (dt.value ? (state.taskAccess[dt.value.id] || 'owner') === 'owner' && !dt.value.collabFrom : false));
const inviteCandidates = computed(() => (state.team || []).filter((u: any) => u.name !== state.settings.name && !dCollabsRaw.value.some((c: any) => c.userId === u.id)));

const subs = computed(() => (dt.value ? state.taskSubs[dt.value.id] || [] : []));
const subDone = computed(() => subs.value.filter((x: any) => x.done).length);
const comments = computed(() => (dt.value ? (state.taskComments[dt.value.id] || []).map((c: any) => ({ ...c, initial: c.author.slice(-1), color: memberColor(c.author) })) : []));
const activity = computed(() => (dt.value ? ((state.taskActivity[dt.value.id] && state.taskActivity[dt.value.id].length) ? state.taskActivity[dt.value.id] : [{ text: '任务已创建', time: dt.value.gen }]) : []));

function subKey(e: KeyboardEvent) { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }
function cmtKey(e: KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }
</script>

<template>
  <template v-if="dt">
    <div class="absolute inset-0 z-[8] bg-scrim" @click="patch({ detailId: null })" />
    <MotionReveal as="div" :y="0" class="absolute bottom-0 right-0 top-0 z-[9] flex w-[440px] max-w-[92%] flex-col bg-card shadow-lg">
      <div class="flex h-[57px] flex-none items-center gap-2.5 border-b border-border px-4">
        <span class="inline-flex items-center gap-1.5 rounded-pill bg-accent-brand-soft px-2.5 py-1 text-[11.5px] font-semibold text-accent-brand-ink"><span class="h-1.5 w-1.5 rounded-pill bg-accent-brand" />任务</span>
        <div class="flex-1" />
        <Button variant="ghost-muted" size="icon-sm" @click="patch({ detailId: null })"><X :size="18" /></Button>
      </div>
      <div class="flex flex-1 flex-col gap-5 overflow-auto p-5">
        <input :value="dt.title" class="w-full border-0 bg-transparent text-xl font-semibold leading-snug tracking-tight text-foreground outline-none" @change="patchTask(state.detailId!, { title: ($event.target as HTMLInputElement).value })" />
        <SegmentedControl v-model="detailTab" class="self-start" :items="[{ value: 'detail', label: '详情' }, { value: 'comments', label: '评论' }, { value: 'activity', label: '活动' }]" />

        <!-- 详情 -->
        <template v-if="state.detailTab === 'detail'">
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-3.5">
              <div class="flex items-center gap-3">
                <span class="flex w-[76px] flex-none items-center gap-1.5 text-xs font-semibold text-tertiary"><CircleDashed :size="13" />状态</span>
                <SegmentedControl v-model="status" size="sm" :items="[{ value: 'todo', label: '待办' }, { value: 'in_progress', label: '进行中' }, { value: 'done', label: '已完成' }]" />
              </div>
              <div class="flex items-center gap-3">
                <span class="flex w-[76px] flex-none items-center gap-1.5 text-xs font-semibold text-tertiary"><Folder :size="13" />项目</span>
                <span class="text-sm text-foreground">{{ dt.project }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="flex w-[76px] flex-none items-center gap-1.5 text-xs font-semibold text-tertiary"><Calendar :size="13" />截止</span>
                <span class="font-nums text-sm text-foreground">{{ dt.due }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="flex w-[76px] flex-none items-center gap-1.5 text-xs font-semibold text-tertiary"><Flag :size="13" />优先级</span>
                <SegmentedControl v-model="priority" size="sm" :items="[{ value: '1', label: 'P1' }, { value: '2', label: 'P2' }, { value: '3', label: 'P3' }, { value: '4', label: 'P4' }]" />
              </div>
              <div class="flex items-center gap-3">
                <span class="flex w-[76px] flex-none items-center gap-1.5 text-xs font-semibold text-tertiary"><User :size="13" />负责人</span>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="nm in memberNames" :key="nm"
                    :class="cn('inline-flex cursor-pointer items-center gap-1.5 rounded-pill py-1 pl-1 pr-2.5 text-xs font-semibold transition-colors duration-medium', dAssignee === nm ? 'bg-accent-brand-soft text-accent-brand-ink shadow-[0_0_0_1px_var(--accent)]' : 'bg-background text-muted-foreground shadow-hairline hover:bg-hover')"
                    @click="assignTask(state.detailId!, nm)"
                  >
                    <span class="flex h-[19px] w-[19px] flex-none items-center justify-center rounded-pill text-[10px] font-semibold text-[var(--accent-contrast)]" :style="{ background: memberColor(nm) }">{{ nm.slice(-1) }}</span>
                    {{ nm }}
                  </button>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="flex w-[76px] flex-none items-center gap-1.5 pt-1.5 text-xs font-semibold text-tertiary"><Users :size="13" />协作</span>
                <div class="flex min-w-0 flex-1 flex-col gap-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span v-for="(c, i) in dCollabs" :key="i" class="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11.5px] font-semibold" :style="{ background: c.bg, color: c.fg }">
                      <span class="h-1.5 w-1.5 rounded-pill" :style="{ background: c.fg }" />{{ c.name }} · {{ c.label }}
                    </span>
                    <span v-if="dCollabs.length === 0" class="text-xs text-tertiary">还没有协作人</span>
                    <button v-if="dIsOwner && canEdit" class="inline-flex h-[26px] cursor-pointer items-center gap-1 rounded-pill px-2.5 text-[11.5px] font-semibold text-accent-brand-ink shadow-hairline transition-colors duration-medium hover:bg-hover" @click="patch((s) => ({ invitePickerOpen: !s.invitePickerOpen }))">
                      <Plus :size="12" />邀请
                    </button>
                  </div>
                  <MotionReveal v-if="state.invitePickerOpen && dIsOwner" :y="4" class="flex flex-wrap gap-1.5 rounded-md bg-hover px-3 py-2">
                    <button v-for="u in inviteCandidates" :key="u.id" class="inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-background px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground shadow-hairline transition-colors duration-medium hover:bg-active" @click="inviteMember(state.detailId!, u)">
                      <User :size="12" class="text-accent-brand-ink" />{{ u.name }}
                    </button>
                    <button v-if="inviteCandidates.length > 1" class="inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-primary-foreground" @click="inviteAll(state.detailId!)">
                      <Users :size="12" />邀请全员
                    </button>
                    <span v-if="inviteCandidates.length === 0" class="text-[11.5px] leading-normal text-tertiary">团队成员都已在协作名单里</span>
                  </MotionReveal>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="flex w-[76px] flex-none items-center gap-1.5 pt-2 text-xs font-semibold text-tertiary"><StickyNote :size="13" />备注</span>
                <textarea :value="dt.notes" placeholder="补充说明…" class="h-16 flex-1 resize-none rounded-md bg-[var(--surface-sunken)] px-3 py-2 text-sm leading-normal text-foreground shadow-hairline outline-none transition-shadow duration-medium focus:shadow-ring placeholder:text-tertiary" @change="patchTask(state.detailId!, { notes: ($event.target as HTMLTextAreaElement).value })" />
              </div>
            </div>

            <!-- 子任务 -->
            <div class="flex flex-col gap-2.5">
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-bold uppercase tracking-[.08em] text-tertiary">子任务</span>
                <span class="font-nums text-[11px] font-semibold text-tertiary">{{ subDone }}/{{ subs.length }}</span>
              </div>
              <div v-for="sb in subs" :key="sb.id" class="flex items-center gap-2">
                <span :class="cn('flex h-4 w-4 flex-none cursor-pointer items-center justify-center rounded-xs transition-colors duration-fast', sb.done ? 'bg-primary' : 'bg-[var(--surface-sunken)] shadow-hairline')" @click="toggleSub(sb.id)">
                  <Check v-if="sb.done" :size="10" class="text-primary-foreground" :stroke-width="3" />
                </span>
                <span class="flex-1 text-sm leading-normal" :class="sb.done ? 'text-tertiary line-through' : 'text-foreground'">{{ sb.text }}</span>
              </div>
              <div v-if="canEdit" class="flex items-center gap-2 rounded-md bg-hover px-3 py-2">
                <Plus :size="14" class="text-tertiary" />
                <input id="lx-sub" placeholder="添加子任务，回车确认" class="min-w-0 flex-1 border-0 bg-transparent text-xs text-foreground outline-none placeholder:text-tertiary" @keydown="subKey" />
              </div>
            </div>

            <div class="h-px bg-border" />

            <!-- 来源与 AI 生成记录 -->
            <div class="flex flex-col gap-3">
              <div class="text-[11px] font-bold uppercase tracking-[.08em] text-tertiary">来源与 AI 生成记录</div>
              <div class="flex flex-col gap-1.5 rounded-lg bg-hover px-3.5 py-3">
                <div class="flex items-center gap-1.5 text-[11px] font-semibold text-tertiary"><Quote :size="12" />原始输入</div>
                <div class="text-sm leading-relaxed text-foreground">{{ dt.raw }}</div>
              </div>
              <div class="flex flex-col gap-2 px-0.5">
                <div class="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles :size="14" class="text-accent-brand-ink" />AI 判断为<b class="text-accent-brand-ink">任务</b><span class="text-tertiary">· 置信度 <span class="font-nums">{{ dt.conf }}</span></span></div>
                <div class="pl-6 text-xs leading-relaxed text-muted-foreground">{{ dt.reason }}</div>
                <div class="flex items-center gap-2 pl-6 text-[11.5px] text-tertiary"><Clock :size="12" />生成于 <span class="font-nums">{{ dt.gen }}</span> · {{ dt.edited ? '用户已修改过' : '未被修改' }}</div>
              </div>
            </div>

            <div class="h-px bg-border" />

            <Button v-if="canEdit && !dt.collabFrom" size="lg" class="w-full bg-destructive-soft text-destructive shadow-hairline hover:bg-destructive-soft hover:opacity-80" @click="moveOut(state.detailId!)">
              <CornerUpLeft :size="15" />移出 todo（这不是一个任务）
            </Button>
            <div v-if="dt.collabFrom" class="flex flex-col gap-2.5">
              <div class="flex items-center gap-2 rounded-md bg-accent-brand-soft px-3 py-2.5 text-xs leading-normal text-accent-brand-ink"><Users :size="14" />协作任务 · 来自 {{ dt.collabFrom }} · 你可以更新状态、评论与勾选子任务</div>
              <Button variant="outline" size="lg" class="w-full" @click="leaveCollabTask(state.detailId!)"><LogOut :size="14" />退出协作</Button>
            </div>
          </div>
        </template>

        <!-- 评论 -->
        <template v-if="state.detailTab === 'comments'">
          <div class="flex flex-col gap-4">
            <div v-for="(c, i) in comments" :key="i" class="flex gap-2.5">
              <span class="flex h-7 w-7 flex-none items-center justify-center rounded-pill text-xs font-semibold text-[var(--accent-contrast)]" :style="{ background: c.color }">{{ c.initial }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-foreground">{{ c.author }}</span>
                  <span class="font-nums text-[11px] text-tertiary">{{ c.time }}</span>
                </div>
                <div class="mt-1 text-sm leading-relaxed text-muted-foreground">{{ c.text }}</div>
              </div>
            </div>
            <div v-if="canEdit" class="flex items-center gap-2 rounded-lg bg-[var(--surface-sunken)] py-2 pl-3 pr-2 shadow-hairline transition-shadow duration-medium focus-within:shadow-ring">
              <input id="lx-cmt" placeholder="写评论，回车发送…" class="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-tertiary" @keydown="cmtKey" />
              <Button variant="primary" size="icon-sm" @click="addComment()"><Send :size="14" /></Button>
            </div>
          </div>
        </template>

        <!-- 活动 -->
        <template v-if="state.detailTab === 'activity'">
          <div class="flex flex-col">
            <div v-for="(a, i) in activity" :key="i" class="flex gap-2.5">
              <div class="flex flex-none flex-col items-center">
                <span class="mt-1 h-[9px] w-[9px] rounded-pill bg-accent-brand" />
                <span class="my-0.5 w-[1.5px] flex-1 bg-border" />
              </div>
              <div class="flex-1 pb-4">
                <div class="text-sm leading-normal text-foreground">{{ a.text }}</div>
                <div class="mt-1 font-nums text-[11px] text-tertiary">{{ a.time }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </MotionReveal>
  </template>
</template>
