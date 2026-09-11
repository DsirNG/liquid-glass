<script setup lang="ts">
import { ref } from 'vue';
import { LiquidGlass, useLiquidGlass } from '@dinqorai/liquid-glass/vue';
import '@dinqorai/liquid-glass/style.css';

const boxRef = ref<HTMLDivElement | null>(null);
const { instance } = useLiquidGlass(boxRef, { blur: 18 });
</script>

<template>
  <div>
    <LiquidGlass :blur="20">
      <div>Slot Content</div>
    </LiquidGlass>
    <div ref="boxRef">Composable Target: {{ instance?.renderer }}</div>
  </div>
</template>
