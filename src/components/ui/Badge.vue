<script setup lang="ts">
import { computed } from 'vue';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium leading-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-sunken text-muted-foreground',
        outline: 'shadow-hairline text-muted-foreground',
        accent: 'bg-accent-brand-soft text-accent-brand-ink',
        success: 'bg-success-soft text-foreground',
        warning: 'bg-warning-soft text-foreground',
        destructive: 'bg-destructive-soft text-destructive',
        solid: 'bg-primary text-primary-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type Variants = VariantProps<typeof badgeVariants>;
const props = defineProps<{ variant?: Variants['variant']; class?: string }>();
const classes = computed(() => cn(badgeVariants({ variant: props.variant }), props.class));
</script>

<template>
  <span :class="classes"><slot /></span>
</template>
