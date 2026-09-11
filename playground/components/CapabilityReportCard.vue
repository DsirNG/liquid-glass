<script setup lang="ts">
import type { CapabilityReport } from '../../src/engine';

defineProps<{
  report: CapabilityReport;
}>();

const capabilityRows: readonly {
  key: keyof Omit<CapabilityReport, 'knownRestrictions'>;
  label: string;
}[] = [
  { key: 'backdropFilter', label: 'Backdrop filter' },
  { key: 'svgFilter', label: 'SVG filter' },
  { key: 'svgDisplacementMap', label: 'SVG displacement map' },
  { key: 'svgBackdropDisplacement', label: 'SVG optical combination' },
  { key: 'cssFilter', label: 'CSS filter' },
];
</script>

<template>
  <details class="observability-card capability-report-card" open>
    <summary class="observability-card__summary">
      <span>
        <span class="observability-card__eyebrow">CAPABILITIES</span>
        <strong>Runtime facts</strong>
      </span>
      <span class="summary-chevron" aria-hidden="true">v</span>
    </summary>

    <div class="capability-list">
      <div v-for="row in capabilityRows" :key="row.key" class="capability-row">
        <span>{{ row.label }}</span>
        <strong :class="report[row.key] ? 'is-supported' : 'is-unsupported'">
          {{ report[row.key] ? 'Yes' : 'No' }}
        </strong>
      </div>
    </div>

    <div class="restriction-block">
      <span class="restriction-label">Known restrictions</span>
      <span v-if="report.knownRestrictions.length === 0" class="restriction-value is-clear">
        None detected
      </span>
      <ul v-else class="restriction-list">
        <li v-for="restriction in report.knownRestrictions" :key="restriction">
          {{ restriction }}
        </li>
      </ul>
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

.capability-report-card:not([open]) .summary-chevron {
  transform: rotate(-90deg);
}

.capability-list {
  display: grid;
  gap: 9px;
  margin-top: 13px;
}

.capability-row,
.restriction-block {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 10px;
}

.capability-row strong {
  font-size: 10px;
  font-weight: 700;
}

.is-supported,
.restriction-value.is-clear {
  color: #6ee7b7;
}

.is-unsupported {
  color: #fca5a5;
}

.restriction-block {
  align-items: flex-start;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.restriction-label {
  flex: 0 0 auto;
  color: rgba(255, 255, 255, 0.42);
  font-size: 9px;
  font-weight: 750;
  text-transform: uppercase;
}

.restriction-value {
  color: rgba(255, 255, 255, 0.72);
  font-size: 10px;
  text-align: right;
}

.restriction-list {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0 0 0 16px;
  color: #fcd34d;
  font-size: 10px;
  text-align: right;
}
</style>
