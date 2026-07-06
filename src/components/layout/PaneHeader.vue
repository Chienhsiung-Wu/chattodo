<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <div class="border-b border-border px-4 pb-3 pt-4">
    <div class="flex items-center gap-2">
      <div class="flex-1">
        <div class="text-[16px] font-semibold leading-tight tracking-tight text-foreground">{{ title }}</div>
        <div v-if="subtitle || $slots.subtitle" class="mt-1 text-xs text-tertiary"><slot name="subtitle">{{ subtitle }}</slot></div>
      </div>
      <slot name="actions" />
    </div>
  </div>
</template>
