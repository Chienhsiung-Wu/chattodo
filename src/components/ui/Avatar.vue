<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';

// Initials avatar on a categorical color (identity colors come from the
// --cat-* tokens, passed in as e.g. 'var(--cat-2)').
const props = withDefaults(
  defineProps<{
    label?: string;
    color?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    class?: string;
  }>(),
  { size: 'md' },
);

const sizeCls = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-6 w-6 text-[11px]',
  md: 'h-8 w-8 text-sm',
  lg: 'h-[34px] w-[34px] text-sm',
} as const;

const initial = computed(() => (props.label || '?').trim().slice(0, 2));
</script>

<template>
  <span
    :class="cn(
      'inline-flex shrink-0 items-center justify-center rounded-pill font-semibold text-[var(--accent-contrast)] select-none',
      sizeCls[size],
      !color && 'bg-[var(--cat-fallback)]',
      props.class,
    )"
    :style="color ? { background: color } : undefined"
  >{{ initial }}</span>
</template>
