<script setup lang="ts">
import { Lock, Briefcase } from 'lucide-vue-next';
import { state } from '@/app/state';
import { modeLabel } from '@/app/derived';
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded-pill bg-hover px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
    <Lock v-if="state.privacy" :size="13" />
    <Briefcase v-else :size="13" />
    {{ modeLabel }}
  </span>
</template>
