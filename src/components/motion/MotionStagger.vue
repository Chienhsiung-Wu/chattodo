<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { staggerReveal } from './motion';

// Staggered entrance for direct children (lists/boards). Mount-time only —
// high-frequency updates stay animation-free by design.
const props = withDefaults(
  defineProps<{ as?: string; y?: number; stagger?: number; class?: string }>(),
  { as: 'div', y: 5, stagger: 0.025 },
);

const el = ref<HTMLElement | null>(null);
onMounted(() => {
  if (el.value) staggerReveal(el.value.children as unknown as Element[], { y: props.y, stagger: props.stagger });
});
</script>

<template>
  <component :is="as" ref="el" :class="props.class">
    <slot />
  </component>
</template>
