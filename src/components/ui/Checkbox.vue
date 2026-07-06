<script setup lang="ts">
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui';
import { Check } from 'lucide-vue-next';
import { cn } from '@/lib/utils';

const props = defineProps<{ modelValue?: boolean; disabled?: boolean; class?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();
</script>

<template>
  <CheckboxRoot
    :model-value="!!modelValue"
    :disabled="disabled"
    :class="cn(
      'peer h-4 w-4 shrink-0 rounded-xs bg-background shadow-hairline transition-colors duration-medium ease-in-out cursor-pointer',
      'focus-visible:outline-none focus-visible:shadow-ring disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:shadow-none',
      props.class,
    )"
    @update:model-value="emit('update:modelValue', !!$event)"
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Check class="h-3 w-3" :stroke-width="3" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
