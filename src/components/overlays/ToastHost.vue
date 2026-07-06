<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next';
import { state } from '@/app/state';
</script>

<template>
  <Transition
    enter-active-class="transition duration-medium ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-fast ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="state.toast" class="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--surface-base)] shadow-lg">
      <CheckCircle2 :size="15" />{{ state.toast }}
    </div>
  </Transition>
</template>
