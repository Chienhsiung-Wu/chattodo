<script setup lang="ts">
import { computed } from 'vue';
import { Sparkles, Check, Zap, Trash2 } from 'lucide-vue-next';
import { state } from '@/app/state';
import { updateAgent, deleteRule } from '@/app/settings';
import { flashToast } from '@/app/toast';
import { AGENT_DEFS } from './defs';
import ViewHeader from '@/components/layout/ViewHeader.vue';
import Button from '@/components/ui/Button.vue';

const cur = computed(() => AGENT_DEFS.find((d) => d.key === state.agentSection) || AGENT_DEFS[0]);
const value = computed(() => (state.agent as any)[state.agentSection]);
</script>

<template>
  <ViewHeader title="Agent 配置" :caption="cur.name">
    <template #icon><Sparkles :size="19" class="text-accent-brand-ink" /></template>
  </ViewHeader>
  <div class="flex-1 overflow-auto px-6 py-[30px]">
    <div class="mx-auto flex max-w-[680px] flex-col gap-4">
      <div class="rounded-lg bg-card p-[18px] shadow-xs">
        <div class="text-md font-semibold tracking-tight text-foreground">{{ cur.name }}</div>
        <div class="mt-1 text-xs leading-normal text-tertiary">{{ cur.desc }}</div>
        <textarea
          :value="value"
          class="mt-3.5 min-h-[150px] w-full resize-y rounded-md bg-[var(--surface-sunken)] px-3.5 py-3 text-base leading-relaxed text-foreground shadow-hairline outline-none transition-shadow duration-medium focus:shadow-ring"
          @change="updateAgent(state.agentSection, ($event.target as HTMLTextAreaElement).value)"
        />
        <div v-if="state.agentSection === 'memory' && state.autoRules.length" class="mt-3.5 border-t border-border pt-3">
          <div class="mb-2 text-[11px] font-bold uppercase tracking-[.08em] text-tertiary">自动化规则（由记忆生成）</div>
          <div v-for="r in state.autoRules" :key="r.id" class="flex items-center gap-2 border-b border-border py-2">
            <Zap :size="15" class="text-warning" />
            <span class="flex-1 text-sm leading-snug text-foreground">新任务包含「{{ r.keyword }}」→ 自动邀请 {{ r.targetName }} 协作</span>
            <Button variant="ghost-muted" size="icon-sm" title="删除规则" @click="deleteRule(r.id)"><Trash2 :size="15" /></Button>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="primary" size="lg" @click="flashToast('Agent 配置已保存')"><Check />保存</Button>
        <span class="text-xs leading-normal text-tertiary">修改后由 AI 在后续判断与追问中使用</span>
      </div>
    </div>
  </div>
</template>
