<script setup lang="ts">
import { computed } from 'vue';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Attio button spec: fast restrained color/shadow transitions, no bounce
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm font-medium select-none cursor-pointer transition-colors duration-medium ease-in-out focus-visible:outline-none focus-visible:shadow-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground shadow-sm hover:bg-hover active:bg-active',
        primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover active:bg-primary-active',
        outline: 'bg-background text-foreground shadow-hairline hover:bg-hover active:bg-active',
        ghost: 'text-foreground hover:bg-hover active:bg-active',
        'ghost-muted': 'text-muted-foreground hover:bg-hover hover:text-foreground active:bg-active',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:opacity-90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-7 px-2.5 text-sm [&_svg]:size-3.5',
        default: 'h-8 px-3 text-sm [&_svg]:size-4',
        lg: 'h-9 px-4 text-base [&_svg]:size-4',
        icon: 'h-8 w-8 text-base [&_svg]:size-4',
        'icon-sm': 'h-7 w-7 text-sm [&_svg]:size-3.5',
        'icon-lg': 'h-10 w-10 text-lg [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type Variants = VariantProps<typeof buttonVariants>;

const props = withDefaults(
  defineProps<{
    variant?: Variants['variant'];
    size?: Variants['size'];
    type?: 'button' | 'submit' | 'reset';
    class?: string;
  }>(),
  { type: 'button' },
);

const classes = computed(() => cn(buttonVariants({ variant: props.variant, size: props.size }), props.class));
</script>

<template>
  <button :type="type" :class="classes">
    <slot />
  </button>
</template>
