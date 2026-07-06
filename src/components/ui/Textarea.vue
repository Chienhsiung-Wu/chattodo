<script setup lang="ts">
import { cn } from '@/lib/utils';

const props = defineProps<{
  modelValue?: string;
  class?: string;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
}
</script>

<template>
  <textarea
    :value="modelValue"
    :class="cn(
      'flex w-full rounded-sm bg-background px-2.5 py-2 text-base text-foreground shadow-hairline transition-shadow duration-medium ease-in-out',
      'placeholder:text-tertiary focus-visible:outline-none focus-visible:shadow-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none',
      props.class,
    )"
    @input="onInput"
  />
</template>
