<script setup lang="ts">
import { cn } from '@/lib/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <kbd
    :class="cn(
      'inline-flex h-5 min-w-5 items-center justify-center rounded-xs bg-sunken px-1 font-nums text-[11px] text-muted-foreground shadow-hairline',
      props.class,
    )"
  ><slot /></kbd>
</template>
