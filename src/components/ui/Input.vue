<script setup lang="ts">
import { cn } from '@/lib/utils';

// Attio input spec: surface-base + hairline stroke; focus swaps in the ring.
const props = defineProps<{
  modelValue?: string | number;
  class?: string;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
}
</script>

<template>
  <input
    :value="modelValue"
    :class="cn(
      'flex h-8 w-full rounded-sm bg-background px-2.5 text-base text-foreground shadow-hairline transition-shadow duration-medium ease-in-out',
      'placeholder:text-tertiary focus-visible:outline-none focus-visible:shadow-ring disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
    @input="onInput"
  />
</template>
