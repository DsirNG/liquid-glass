<script setup lang="ts">
import { shallowRef } from 'vue';
import { GlassCard } from '@dinqorai/liquid-glass/vue';
import type { LiquidGlassMaterialOptions } from '@dinqorai/liquid-glass';

const props = defineProps<{
  glassOptions?: LiquidGlassMaterialOptions;
}>();

const cardAction = shallowRef('选择一个 Card 查看交互');
const slotAction = shallowRef('Slot button ready');

function handleInteractiveCardClick(): void {
  cardAction.value = 'Interactive Card clicked';
}

function handleSlotAction(): void {
  slotAction.value = 'Slot button clicked';
}
</script>

<template>
  <section class="card-preview" aria-labelledby="glass-card-preview-title">
    <div class="card-preview__heading">
      <div>
        <span class="card-preview__kicker">VUE COMPONENT</span>
        <h2 id="glass-card-preview-title">GlassCard</h2>
      </div>
      <span class="card-preview__status">{{ cardAction }}</span>
    </div>

    <div class="card-preview__grid">
      <GlassCard
        size="sm"
        :options="props.glassOptions"
        material-preset="pure"
        fallback-policy="auto"
        aria-label="Default GlassCard"
      >
        <span class="card-preview__eyebrow">DEFAULT</span>
        <strong class="card-preview__title">A calm glass container</strong>
        <p class="card-preview__copy">
          The default card keeps layout semantics separate from optical options.
        </p>
      </GlassCard>

      <GlassCard
        size="md"
        :options="props.glassOptions"
        material-preset="ios"
        fallback-policy="auto"
        class="card-preview__rich-card"
        aria-label="Rich content GlassCard"
      >
        <template #header>
          <div class="card-preview__header-row">
            <span class="card-preview__eyebrow">RICH CONTENT</span>
            <span class="card-preview__badge">IOS</span>
          </div>
        </template>

        <strong class="card-preview__title">Header, body and footer</strong>
        <p class="card-preview__copy">
          Slots keep the content API open without adding title or action props.
        </p>

        <template #footer>
          <span class="card-preview__footer-note">GlassCard v1</span>
          <span class="card-preview__footer-arrow">↗</span>
        </template>
      </GlassCard>

      <GlassCard
        size="md"
        :options="props.glassOptions"
        material-preset="pure"
        fallback-policy="auto"
        interactive
        class="card-preview__interactive-card"
        role="button"
        tabindex="0"
        aria-label="Interactive GlassCard"
        @click="handleInteractiveCardClick"
      >
        <span class="card-preview__eyebrow">INTERACTIVE</span>
        <strong class="card-preview__title">Pointer feedback stays optional</strong>
        <p class="card-preview__copy">
          The demo adds button semantics explicitly through ordinary attributes.
        </p>
      </GlassCard>

      <GlassCard
        size="md"
        :options="props.glassOptions"
        material-preset="ios"
        fallback-policy="auto"
        interactive
        disabled
        class="card-preview__disabled-card"
        aria-label="Disabled interactive GlassCard"
      >
        <template #header>
          <div class="card-preview__header-row">
            <span class="card-preview__eyebrow">DISABLED INTERACTIVE</span>
            <span class="card-preview__disabled-label">VISUAL STATE OFF</span>
          </div>
        </template>

        <strong class="card-preview__title">Slot controls remain independent</strong>
        <p class="card-preview__copy">
          The Card visual interaction is disabled without applying pointer-events: none.
        </p>

        <template #footer>
          <button class="card-preview__slot-button" type="button" @click="handleSlotAction">
            {{ slotAction }}
          </button>
        </template>
      </GlassCard>
    </div>

    <p class="card-preview__note">
      GlassCard uses the public Vue entry. Core material names remain unchanged; layout and content
      are expressed through component props and slots.
    </p>
  </section>
</template>

<style scoped>
.card-preview {
  width: min(820px, 100%);
}

.card-preview__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.card-preview__kicker,
.card-preview__eyebrow {
  color: rgba(255, 255, 255, 0.48);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.card-preview h2 {
  margin: 4px 0 0;
  color: #fff;
  font-size: 20px;
}

.card-preview__status,
.card-preview__note {
  color: rgba(255, 255, 255, 0.58);
  font-size: 11px;
}

.card-preview__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.card-preview__grid :deep(.glass-card) {
  min-height: 176px;
}

.card-preview__grid :deep(.glass-card > .lg-content) {
  justify-content: space-between;
}

.card-preview__header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-preview__badge,
.card-preview__disabled-label {
  padding: 4px 7px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.card-preview__disabled-label {
  color: rgba(252, 165, 165, 0.78);
}

.card-preview__title {
  display: block;
  color: rgba(255, 255, 255, 0.92);
  font-size: 17px;
  letter-spacing: -0.025em;
}

.card-preview__copy {
  margin: 7px 0 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 11px;
  line-height: 1.5;
}

.card-preview__footer-note {
  color: rgba(255, 255, 255, 0.48);
  font-size: 10px;
}

.card-preview__footer-arrow {
  float: right;
  color: #7dd3fc;
  font-size: 16px;
}

.card-preview__slot-button {
  min-height: 32px;
  padding: 7px 11px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.82);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.card-preview__slot-button:hover {
  background: rgba(255, 255, 255, 0.18);
}

.card-preview__note {
  margin: 16px 0 0;
  line-height: 1.5;
}

@media (max-width: 650px) {
  .card-preview__heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .card-preview__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
