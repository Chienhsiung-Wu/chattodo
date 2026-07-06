<script setup lang="ts">
defineProps<{ title?: string; caption?: string }>();
</script>

<template>
  <div class="relative z-[12] flex h-[57px] flex-none items-center gap-3 border-b border-border bg-card px-4">
    <slot name="icon" />
    <span v-if="title" class="text-[16px] font-semibold tracking-tight text-foreground">{{ title }}</span>
    <slot name="title" />
    <span v-if="caption" class="text-xs text-tertiary">{{ caption }}</span>
    <div class="flex-1" />
    <slot />
  </div>
</template>
