<script setup lang="ts">
import { shallowRef } from 'vue';
import { GlassButton, type GlassButtonVariant } from '@dinqorai/liquid-glass/vue';
import type { LiquidGlassMaterialOptions } from '@dinqorai/liquid-glass';

defineProps<{
  glassOptions?: LiquidGlassMaterialOptions;
}>();

const lastAction = shallowRef('点击按钮查看按下态');

const variants: Array<{ key: GlassButtonVariant; label: string }> = [
  { key: 'default', label: 'Default' },
  { key: 'primary', label: 'Primary' },
  { key: 'ghost', label: 'Ghost' },
  { key: 'danger', label: 'Danger' },
];

function handleClick(label: string): void {
  lastAction.value = `${label} clicked`;
}
</script>

<template>
  <section class="button-preview">
    <div class="button-preview-heading">
      <div>
        <span class="button-preview-kicker">VUE COMPONENT</span>
        <h2>GlassButton</h2>
      </div>
      <span class="button-preview-status">{{ lastAction }}</span>
    </div>

    <div class="button-preview-grid">
      <GlassButton
        v-for="item in variants"
        :key="item.key"
        size="md"
        :variant="item.key"
        :options="glassOptions"
        refraction-coverage="full"
        surface-profile="fluid_dome"
        border-mode="adaptive"
        @click="handleClick(item.label)"
      >
        {{ item.label }}
      </GlassButton>
    </div>

    <!-- 参数备注：这些值在 src/vue/components/GlassButton/index.vue 中集中调整。 -->
    <p class="button-preview-note">
      参数备注：md = 40px 高、左右 20px 内边距；圆角 20px；bezel 16px；厚度 42；按下缩放
      0.97；当前预览额外使用 Full + fluid_dome；Default / Primary / Ghost / Danger 分别使用不同
      tint、opacity、specular、blur、shadow。
    </p>
  </section>
</template>

<style scoped>
.button-preview {
  width: min(720px, 92vw);
}

.button-preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.button-preview-kicker {
  color: rgba(255, 255, 255, 0.48);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

h2 {
  margin: 4px 0 0;
  color: #fff;
  font-size: 20px;
}

.button-preview-status {
  color: rgba(255, 255, 255, 0.62);
  font-size: 11px;
}

.button-preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button-preview-note {
  margin: 16px 0 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 11px;
  line-height: 1.5;
}

@media (max-width: 767px) {
  .button-preview {
    width: 100%;
    padding: 14px;
    border-radius: 18px;
  }

  .button-preview-heading {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 6px 12px;
    margin-bottom: 12px;
  }

  .button-preview-status {
    flex: 1 1 100%;
  }

  .button-preview-grid {
    gap: 8px;
  }

  .button-preview-note {
    margin-top: 12px;
    font-size: 10px;
  }
}
</style>
