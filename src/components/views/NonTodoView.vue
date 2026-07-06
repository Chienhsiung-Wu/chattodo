<script setup lang="ts">
import { Inbox, Quote, Sparkles, ArrowUpRight } from 'lucide-vue-next';
import { selNon, DEST_LABEL } from '@/app/derived';
import { nonConvert, removeNon, copyNonText, exportNonMd } from '@/app/ideas';
import ViewHeader from '@/components/layout/ViewHeader.vue';
import ModeChip from '@/components/layout/ModeChip.vue';
import Button from '@/components/ui/Button.vue';
import MotionReveal from '@/components/motion/MotionReveal.vue';
</script>

<template>
  <ViewHeader title="非 todo 隔离区" caption="不参与任务与计划">
    <template #icon><Inbox :size="19" class="text-tertiary" /></template>
    <ModeChip />
  </ViewHeader>
  <div class="flex-1 overflow-auto px-6 py-[30px]">
    <MotionReveal v-if="selNon" :key="selNon.id" class="mx-auto flex max-w-[640px] flex-col gap-[18px]">
      <div class="text-xl font-semibold leading-normal tracking-tight text-muted-foreground">{{ selNon.title }}</div>
      <div class="rounded-lg bg-active px-4 py-3.5 shadow-hairline">
        <div class="text-base leading-relaxed text-muted-foreground">{{ selNon.text }}</div>
        <div class="mt-2 flex items-center gap-1.5 text-[11.5px] text-tertiary"><Inbox :size="12" />未进入 todo 主系统 · 已隔离保存</div>
      </div>
      <div class="rounded-lg bg-hover px-4 py-3">
        <div class="flex items-center gap-1.5 text-[11px] font-semibold text-tertiary"><Quote :size="12" />原始输入</div>
        <div class="mt-1.5 text-sm leading-relaxed text-foreground">{{ selNon.raw }}</div>
      </div>
      <div class="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Sparkles :size="14" class="mt-0.5 text-accent-brand-ink" />
        <span>AI 判断为 <b class="text-tertiary">非 todo</b> · {{ selNon.reason }} · {{ DEST_LABEL[selNon.dest] || '建议归档' }}</span>
      </div>
      <div class="mt-0.5 flex flex-wrap items-center gap-2">
        <Button variant="primary" @click="nonConvert(selNon.id)"><ArrowUpRight :size="14" />转为 todo</Button>
        <Button variant="outline" @click="copyNonText()">复制</Button>
        <Button variant="outline" @click="exportNonMd()">导出 Markdown</Button>
        <Button variant="outline" @click="removeNon(selNon.id, '已归档')">归档</Button>
        <Button class="bg-destructive-soft text-destructive shadow-none hover:bg-destructive-soft hover:opacity-80" @click="removeNon(selNon.id, '已删除')">删除</Button>
      </div>
    </MotionReveal>
    <div v-else class="flex flex-col items-center justify-center gap-2.5 pt-[90px] text-tertiary">
      <Inbox :size="30" />
      <div class="text-sm">隔离区为空</div>
    </div>
  </div>
</template>
