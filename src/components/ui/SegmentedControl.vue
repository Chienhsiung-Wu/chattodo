<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger } from 'reka-ui';
import { cn } from '@/lib/utils';

// Header-only tabs (content switching stays in the parent) — covers the app's
// segmented toggles, detail tabs and settings subnav in one primitive.
export interface SegmentItem {
  value: string;
  label: string;
}

const props = defineProps<{
  modelValue?: string;
  items: SegmentItem[];
  class?: string;
  size?: 'sm' | 'default';
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();
</script>

<template>
  <TabsRoot
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', String($event))"
  >
    <TabsList
      :class="cn('inline-flex items-center gap-0.5 rounded-md bg-sunken p-0.5 shadow-hairline', props.class)"
    >
      <TabsTrigger
        v-for="it in items"
        :key="it.value"
        :value="it.value"
        :class="cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-[calc(var(--radius-md)-2px)] font-medium text-muted-foreground cursor-pointer',
          'transition-colors duration-medium ease-in-out focus-visible:outline-none focus-visible:shadow-ring',
          'hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
          size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-2.5 text-sm',
        )"
      >
        {{ it.label }}
      </TabsTrigger>
    </TabsList>
  </TabsRoot>
</template>
