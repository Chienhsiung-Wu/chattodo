<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from 'reka-ui';
import { X } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import Button from './Button.vue';

// High-level modal: v-model:open + title/description props, default & footer slots.
// Enter ~200ms ease-out, exit ~150ms — matches the motion tokens' restraint.
const props = defineProps<{
  open?: boolean;
  title?: string;
  description?: string;
  contentClass?: string;
  hideClose?: boolean;
}>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();
</script>

<template>
  <DialogRoot :open="!!open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-[80] bg-scrim data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      />
      <DialogContent
        :class="cn(
          'fixed left-1/2 top-1/2 z-[81] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-popover p-5 text-popover-foreground shadow-lg focus:outline-none',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          contentClass,
        )"
      >
        <div v-if="title || !hideClose" class="mb-3 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <DialogTitle v-if="title" class="text-md font-semibold tracking-tight text-foreground">{{ title }}</DialogTitle>
            <DialogDescription v-if="description" class="mt-0.5 text-sm text-muted-foreground">{{ description }}</DialogDescription>
          </div>
          <Button v-if="!hideClose" variant="ghost-muted" size="icon-sm" aria-label="关闭" @click="emit('update:open', false)">
            <X />
          </Button>
        </div>
        <slot />
        <div v-if="$slots.footer" class="mt-4 flex items-center justify-end gap-2">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
