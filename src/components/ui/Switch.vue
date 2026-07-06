<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps<{ modelValue?: boolean; disabled?: boolean; class?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();
</script>

<template>
  <SwitchRoot
    :model-value="!!modelValue"
    :disabled="disabled"
    :class="cn(
      'inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-pill transition-colors duration-medium ease-in-out',
      'focus-visible:outline-none focus-visible:shadow-ring disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-primary data-[state=unchecked]:bg-[var(--border-strong)]',
      props.class,
    )"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <SwitchThumb
      class="pointer-events-none block h-4 w-4 rounded-pill bg-[var(--gray-0)] shadow-sm transition-transform duration-base ease-out data-[state=checked]:translate-x-[19px] data-[state=unchecked]:translate-x-[3px]"
    />
  </SwitchRoot>
</template>
