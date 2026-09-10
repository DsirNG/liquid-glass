<script setup lang="ts">
import { onUnmounted, shallowRef } from 'vue';

const props = defineProps<{
  componentName: string;
  code: string;
}>();

const copied = shallowRef(false);
let feedbackTimer: number | undefined;

async function copyCode(): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.code);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = props.code;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }

    copied.value = true;
    if (feedbackTimer !== undefined) window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(() => {
      copied.value = false;
      feedbackTimer = undefined;
    }, 1600);
  } catch {
    copied.value = false;
  }
}

onUnmounted(() => {
  if (feedbackTimer !== undefined) window.clearTimeout(feedbackTimer);
});
</script>

<template>
  <section class="usage-code-panel" :aria-label="`${componentName} usage code`">
    <header class="usage-code-panel__header">
      <div>
        <span class="usage-code-panel__eyebrow">USAGE</span>
        <strong>{{ componentName }}.vue</strong>
      </div>
      <button class="usage-code-panel__copy" type="button" @click="copyCode">
        {{ copied ? '已复制' : '复制代码' }}
      </button>
    </header>

    <pre class="usage-code-panel__code"><code>{{ code }}</code></pre>
  </section>
</template>

<style scoped>
.usage-code-panel {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 330px;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  background: rgba(8, 13, 24, 0.28);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.12);
}

.usage-code-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.usage-code-panel__header > div {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.usage-code-panel__eyebrow {
  color: rgba(125, 211, 252, 0.86);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.usage-code-panel__header strong {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.82);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usage-code-panel__copy {
  flex: 0 0 auto;
  padding: 7px 11px;
  border: 1px solid rgba(125, 211, 252, 0.34);
  border-radius: 999px;
  background: rgba(125, 211, 252, 0.1);
  color: rgba(224, 242, 254, 0.92);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.usage-code-panel__copy:hover {
  border-color: rgba(125, 211, 252, 0.62);
  background: rgba(125, 211, 252, 0.18);
}

.usage-code-panel__copy:active {
  transform: scale(0.97);
}

.usage-code-panel__code {
  min-height: 0;
  margin: 0;
  padding: 18px;
  overflow: auto;
  user-select: text;
  cursor: text;
  color: rgba(224, 242, 254, 0.82);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.7;
  tab-size: 2;
  white-space: pre;
}

@media (max-width: 600px) {
  .usage-code-panel {
    min-height: 290px;
  }

  .usage-code-panel__header {
    padding: 12px;
  }

  .usage-code-panel__code {
    padding: 14px;
    font-size: 10px;
  }
}
</style>
