<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import type {
  FallbackPolicy,
  LiquidGlassMaterialOptions,
  LiquidGlassStatus,
} from '@dinqorai/liquid-glass';
import type { CapabilityReport } from './types';
import CapabilityReportCard from './CapabilityReportCard.vue';
import ParameterSupportCard from './ParameterSupportCard.vue';
import RuntimeStatusCard from './RuntimeStatusCard.vue';
import { getParameterSupportRows } from './runtime-observability';

const props = defineProps<{
  status: Readonly<LiquidGlassStatus>;
  capabilityReport: CapabilityReport;
  fallbackPolicy: FallbackPolicy;
  params: LiquidGlassMaterialOptions;
  isSolidBackground: boolean;
}>();

const copyState = ref<'idle' | 'copied' | 'failed'>('idle');
let copyResetTimer: ReturnType<typeof setTimeout> | null = null;

const parameterRows = computed(() =>
  getParameterSupportRows(
    props.status,
    props.capabilityReport,
    props.params,
    props.isSolidBackground
  )
);

const runtimeInfo = computed(() => {
  const status = props.status;
  return {
    targetMode: status.targetMode,
    activeMode: status.activeMode,
    phase: status.phase,
    fallbackPolicy: props.fallbackPolicy,
    degraded: status.degraded,
    degradationReason: status.degradationReason,
    runtimeReason: status.runtimeReason,
    recoveryMode: status.recoveryMode,
    lastOperation: status.lastOperation,
  };
});

function scheduleCopyReset(): void {
  if (copyResetTimer !== null) clearTimeout(copyResetTimer);
  copyResetTimer = setTimeout(() => {
    copyState.value = 'idle';
    copyResetTimer = null;
  }, 1800);
}

async function writeClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Clipboard is unavailable.');
}

async function copyRuntimeInfo(): Promise<void> {
  const text = JSON.stringify(runtimeInfo.value, null, 2);
  try {
    await writeClipboard(text);
    copyState.value = 'copied';
  } catch {
    copyState.value = 'failed';
  }
  scheduleCopyReset();
}

onUnmounted(() => {
  if (copyResetTimer !== null) clearTimeout(copyResetTimer);
});
</script>

<template>
  <div class="runtime-observability-panel">
    <RuntimeStatusCard :status="status" :fallback-policy="fallbackPolicy" />
    <CapabilityReportCard :report="capabilityReport" />
    <ParameterSupportCard :rows="parameterRows" />
    <button class="copy-runtime-info" type="button" @click="copyRuntimeInfo">
      <span>{{
        copyState === 'copied'
          ? 'Copied'
          : copyState === 'failed'
            ? 'Copy failed'
            : 'Copy runtime info'
      }}</span>
      <span aria-hidden="true">&gt;</span>
    </button>
  </div>
</template>

<style scoped>
.runtime-observability-panel {
  display: grid;
  gap: 12px;
}

.copy-runtime-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(125, 211, 252, 0.26);
  border-radius: 13px;
  background: rgba(56, 189, 248, 0.1);
  color: #bae6fd;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  transition:
    background 160ms ease,
    border-color 160ms ease;
}

.copy-runtime-info:hover {
  border-color: rgba(125, 211, 252, 0.52);
  background: rgba(56, 189, 248, 0.18);
}

.copy-runtime-info:active {
  transform: translateY(1px);
}
</style>
