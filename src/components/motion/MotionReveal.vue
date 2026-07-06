<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { reveal } from './motion';

// Fade+rise entrance on mount — restrained (≤160ms, ease-out, no bounce).
const props = withDefaults(
  defineProps<{ as?: string; y?: number; delay?: number; class?: string }>(),
  { as: 'div', y: 6, delay: 0 },
);

const el = ref<HTMLElement | null>(null);
onMounted(() => {
  if (el.value) reveal(el.value, { y: props.y, delay: props.delay });
});
</script>

<template>
  <component :is="as" ref="el" :class="props.class">
    <slot />
  </component>
</template>
