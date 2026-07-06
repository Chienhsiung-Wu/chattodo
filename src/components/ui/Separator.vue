<script setup lang="ts">
import { cn } from '@/lib/utils';

const props = defineProps<{ vertical?: boolean; class?: string }>();
</script>

<template>
  <div
    role="separator"
    :aria-orientation="vertical ? 'vertical' : 'horizontal'"
    :class="cn('shrink-0 bg-border', vertical ? 'w-px h-full' : 'h-px w-full', props.class)"
  />
</template>
