<script setup lang="ts">
import type { ParameterSupportRow, SupportLevel } from '../utils/runtime-observability';

defineProps<{
  rows: readonly ParameterSupportRow[];
}>();

const levelLabels: Record<SupportLevel, string> = {
  full: 'Full',
  approximate: 'Approx.',
  unsupported: 'Unsupported',
};
</script>

<template>
  <details class="observability-card parameter-support-card" open>
    <summary class="observability-card__summary">
      <span>
        <span class="observability-card__eyebrow">PARAMETERS</span>
        <strong>Support level</strong>
      </span>
      <span class="summary-chevron" aria-hidden="true">v</span>
    </summary>

    <p class="parameter-support-description">
      Based on the active backend and the probed runtime facts.
    </p>

    <div class="parameter-support-list">
      <div v-for="row in rows" :key="row.key" class="parameter-support-row" :title="row.detail">
        <span class="parameter-support-name">{{ row.label }}</span>
        <span class="parameter-support-impact">{{ row.meta.impact }}</span>
        <strong class="parameter-support-level" :class="`is-${row.level}`">
          {{ levelLabels[row.level] }}
        </strong>
      </div>
    </div>

    <div class="parameter-support-legend" aria-label="Support level legend">
      <span class="is-full">Full</span>
      <span class="is-approximate">Approx.</span>
      <span class="is-unsupported">Unsupported</span>
    </div>
  </details>
</template>

<style scoped>
.observability-card {
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.045);
  color: rgba(255, 255, 255, 0.86);
}

.observability-card__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  list-style: none;
}

.observability-card__summary::-webkit-details-marker {
  display: none;
}

.observability-card__eyebrow {
  display: block;
  margin-bottom: 4px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.observability-card__summary strong {
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
}

.summary-chevron {
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
  transition: transform 160ms ease;
}

.parameter-support-card:not([open]) .summary-chevron {
  transform: rotate(-90deg);
}

.parameter-support-description {
  margin: 12px 0;
  color: rgba(255, 255, 255, 0.48);
  font-size: 10px;
  line-height: 1.45;
}

.parameter-support-list {
  display: grid;
  gap: 8px;
}

.parameter-support-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.parameter-support-name {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.76);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.parameter-support-impact {
  color: rgba(255, 255, 255, 0.34);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 8px;
  text-transform: uppercase;
}

.parameter-support-level {
  min-width: 64px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 9px;
  font-weight: 700;
  text-align: right;
}

.parameter-support-level.is-full,
.parameter-support-legend .is-full {
  color: #6ee7b7;
}

.parameter-support-level.is-approximate,
.parameter-support-legend .is-approximate {
  color: #fcd34d;
}

.parameter-support-level.is-unsupported,
.parameter-support-legend .is-unsupported {
  color: #fca5a5;
}

.parameter-support-legend {
  display: flex;
  gap: 12px;
  margin-top: 13px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 9px;
  font-weight: 700;
}
</style>
