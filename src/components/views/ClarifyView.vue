<script setup lang="ts">
import { Lightbulb, CornerDownRight, Quote, Sparkles, ArrowUpRight } from 'lucide-vue-next';
import { selIdea } from '@/app/derived';
import { convertIdea, discardIdea } from '@/app/ideas';
import ViewHeader from '@/components/layout/ViewHeader.vue';
import ModeChip from '@/components/layout/ModeChip.vue';
import Button from '@/components/ui/Button.vue';
import MotionReveal from '@/components/motion/MotionReveal.vue';
</script>

<template>
  <ViewHeader title="待澄清区" caption="补充后转为正式任务">
    <template #icon><Lightbulb :size="19" class="text-accent-brand-ink" /></template>
    <ModeChip />
  </ViewHeader>
  <div class="flex-1 overflow-auto px-6 py-[30px]">
    <MotionReveal v-if="selIdea" :key="selIdea.id" class="mx-auto flex max-w-[640px] flex-col gap-[18px]">
      <div class="text-xl font-semibold leading-normal tracking-tight text-foreground">{{ selIdea.title }}</div>
      <div class="rounded-lg border-l-[3px] border-warning bg-warning-soft px-4 py-3.5">
        <div class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.05em] text-warning"><CornerDownRight :size="12" />建议下一步</div>
        <div class="mt-2 text-base leading-relaxed text-foreground">{{ selIdea.suggest }}</div>
      </div>
      <div class="rounded-lg bg-hover px-4 py-3">
        <div class="flex items-center gap-1.5 text-[11px] font-semibold text-tertiary"><Quote :size="12" />原始输入</div>
        <div class="mt-1.5 text-sm leading-relaxed text-foreground">{{ selIdea.raw }}</div>
      </div>
      <div class="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Sparkles :size="14" class="mt-0.5 text-accent-brand-ink" />
        <span>AI 判断为 <b class="text-warning">待澄清</b> · {{ selIdea.reason }}</span>
      </div>
      <div class="mt-0.5 flex items-center gap-2.5">
        <Button variant="primary" size="lg" @click="convertIdea(selIdea.id)"><ArrowUpRight />转为正式任务</Button>
        <Button variant="outline" size="lg" @click="discardIdea(selIdea.id)">放弃</Button>
        <div class="flex-1" />
        <span class="text-[11.5px] text-tertiary">生成于 <span class="font-nums">{{ selIdea.gen }}</span></span>
      </div>
    </MotionReveal>
    <div v-else class="flex flex-col items-center justify-center gap-2.5 pt-[90px] text-tertiary">
      <Lightbulb :size="30" />
      <div class="text-sm">待澄清区为空</div>
    </div>
  </div>
</template>
