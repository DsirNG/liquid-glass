<script setup lang="ts">
import { computed } from 'vue';
import type {
  FallbackPolicy,
  LiquidGlassCapabilityDegradeReason,
  LiquidGlassRecoveryMode,
  LiquidGlassRenderMode,
  LiquidGlassRuntimePhase,
  LiquidGlassRuntimeReason,
  LiquidGlassStatus,
} from '@dinqorai/liquid-glass';

const props = defineProps<{
  status: Readonly<LiquidGlassStatus>;
  fallbackPolicy: FallbackPolicy;
}>();

const modeLabels: Record<LiquidGlassRenderMode, string> = {
  'full-optical': 'Full Optical',
  material: 'Material',
  static: 'Static',
};

const phaseLabels: Record<LiquidGlassRuntimePhase, string> = {
  initializing: 'Initializing',
  transitioning: 'Transitioning',
  ready: 'Ready',
  failed: 'Failed',
};

const capabilityReasonLabels: Record<LiquidGlassCapabilityDegradeReason, string> = {
  'optical-unsupported': 'Optical capability unavailable',
  'backdrop-filter-unsupported': 'Backdrop filter unavailable',
  'forced-material': 'Material mode requested',
  'forced-static': 'Static mode requested',
};

const runtimeReasonLabels: Record<LiquidGlassRuntimeReason, string> = {
  'initializing-optical-field': 'Initializing optical field',
  resizing: 'Resizing optical field',
  'backend-switch': 'Switching backend',
  'optical-field-failed': 'Optical field generation failed',
  'backend-prepare-failed': 'Backend preparation failed',
  'recovery-failed': 'Runtime recovery failed',
};

const statusTone = computed(() => {
  if (props.status.phase === 'failed') return 'failed';
  if (props.status.degraded) return 'degraded';
  if (props.status.phase === 'ready') return 'ready';
  return 'transitioning';
});

const statusLabel = computed(() => {
  if (props.status.phase === 'failed') return 'Failed';
  if (props.status.degraded) return 'Degraded';
  return phaseLabels[props.status.phase];
});

const capabilityReason = computed(() =>
  props.status.degradationReason
    ? capabilityReasonLabels[props.status.degradationReason]
    : undefined
);

const runtimeReason = computed(() =>
  props.status.runtimeReason ? runtimeReasonLabels[props.status.runtimeReason] : undefined
);

const lastOperation = computed(() => {
  const operation = props.status.lastOperation;
  if (!operation || operation.status === 'committed' || operation.status === 'stale')
    return undefined;
  if ('reason' in operation) return runtimeReasonLabels[operation.reason];
  return undefined;
});

function formatMode(mode: LiquidGlassRenderMode | null): string {
  return mode ? modeLabels[mode] : '-';
}

function formatRecoveryMode(mode: LiquidGlassRecoveryMode | undefined): string {
  return mode ? modeLabels[mode] : 'Disabled';
}
</script>

<template>
  <section class="observability-card runtime-status-card" :class="`is-${statusTone}`">
    <header class="observability-card__header">
      <div>
        <span class="observability-card__eyebrow">RUNTIME</span>
        <h4>Renderer status</h4>
      </div>
      <span class="observability-status-badge" :class="`is-${statusTone}`">{{ statusLabel }}</span>
    </header>

    <dl class="runtime-status-grid">
      <div>
        <dt>Target</dt>
        <dd>{{ formatMode(status.targetMode) }}</dd>
      </div>
      <div>
        <dt>Active</dt>
        <dd>{{ formatMode(status.activeMode) }}</dd>
      </div>
      <div>
        <dt>Phase</dt>
        <dd>{{ phaseLabels[status.phase] }}</dd>
      </div>
      <div>
        <dt>Fallback</dt>
        <dd>{{ fallbackPolicy }}</dd>
      </div>
      <div>
        <dt>Degraded</dt>
        <dd>{{ status.degraded ? 'Yes' : 'No' }}</dd>
      </div>
      <div>
        <dt>Recovery</dt>
        <dd>{{ formatRecoveryMode(status.recoveryMode) }}</dd>
      </div>
    </dl>

    <div v-if="capabilityReason" class="runtime-status-note is-capability">
      <span>Capability</span>
      <strong>{{ capabilityReason }}</strong>
    </div>
    <div v-if="runtimeReason" class="runtime-status-note is-runtime">
      <span>Runtime</span>
      <strong>{{ runtimeReason }}</strong>
    </div>
    <div v-if="lastOperation" class="runtime-status-note is-operation">
      <span>Last operation</span>
      <strong>{{ lastOperation }}</strong>
    </div>
    <div
      v-if="fallbackPolicy === 'strict' && status.phase === 'failed'"
      class="runtime-status-note"
    >
      <span>Recovery</span>
      <strong>Disabled by strict policy</strong>
    </div>
  </section>
</template>

<style scoped>
.observability-card {
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.045);
  color: rgba(255, 255, 255, 0.86);
}

.observability-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.observability-card__eyebrow {
  color: rgba(255, 255, 255, 0.42);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.observability-card h4 {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  font-weight: 700;
}

.observability-status-badge,
.runtime-status-note span {
  border-radius: 999px;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.observability-status-badge {
  padding: 4px 7px;
  background: rgba(148, 163, 184, 0.16);
  color: #cbd5e1;
}

.observability-status-badge.is-ready {
  background: rgba(16, 185, 129, 0.16);
  color: #6ee7b7;
}

.observability-status-badge.is-degraded {
  background: rgba(251, 191, 36, 0.16);
  color: #fcd34d;
}

.observability-status-badge.is-failed {
  background: rgba(248, 113, 113, 0.16);
  color: #fca5a5;
}

.runtime-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px 12px;
  margin: 0;
}

.runtime-status-grid div {
  min-width: 0;
}

.runtime-status-grid dt {
  margin-bottom: 3px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 9px;
  text-transform: uppercase;
}

.runtime-status-grid dd {
  overflow: hidden;
  margin: 0;
  color: rgba(255, 255, 255, 0.88);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.runtime-status-note {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.runtime-status-note span {
  flex: 0 0 auto;
  color: rgba(255, 255, 255, 0.42);
}

.runtime-status-note strong {
  color: rgba(255, 255, 255, 0.76);
  font-size: 10px;
  font-weight: 550;
  text-align: right;
}

.runtime-status-note.is-capability strong {
  color: #fcd34d;
}

.runtime-status-note.is-runtime strong {
  color: #fda4af;
}
</style>
