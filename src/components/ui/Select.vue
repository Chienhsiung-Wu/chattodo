<script setup lang="ts">
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from 'reka-ui';
import { Check, ChevronDown } from 'lucide-vue-next';
import { cn } from '@/lib/utils';

// High-level replacement for the app's native <select>s: options + v-model.
// Themed popup panel (no OS-native dropdown), keyboard accessible.
export interface SelectItemDef {
  value: string;
  label: string;
}

const props = defineProps<{
  modelValue?: string;
  items: SelectItemDef[];
  placeholder?: string;
  disabled?: boolean;
  class?: string;
  contentClass?: string;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();
</script>

<template>
  <SelectRoot
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', String($event))"
  >
    <SelectTrigger
      :class="cn(
        'inline-flex h-8 items-center justify-between gap-2 rounded-sm bg-background px-2.5 text-sm text-foreground shadow-hairline cursor-pointer',
        'transition-colors duration-medium ease-in-out hover:bg-hover focus-visible:outline-none focus-visible:shadow-ring',
        'disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-tertiary [&>span]:truncate',
        props.class,
      )"
    >
      <SelectValue :placeholder="placeholder" />
      <ChevronDown class="h-3.5 w-3.5 shrink-0 text-tertiary" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        :class="cn(
          'z-[90] min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-md bg-popover text-popover-foreground shadow-lg',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-1',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          contentClass,
        )"
      >
        <SelectViewport class="p-1">
          <SelectItem
            v-for="it in items"
            :key="it.value"
            :value="it.value"
            class="relative flex w-full cursor-pointer select-none items-center rounded-xs py-1.5 pl-2 pr-7 text-sm text-foreground outline-none transition-colors duration-fast data-[highlighted]:bg-hover data-[state=checked]:text-accent-brand-ink"
          >
            <SelectItemText>{{ it.label }}</SelectItemText>
            <SelectItemIndicator class="absolute right-2 inline-flex items-center">
              <Check class="h-3.5 w-3.5" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
