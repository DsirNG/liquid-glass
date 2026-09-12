<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, useTemplateRef } from 'vue';
import { GlassCard, LiquidGlass } from '../../../src/vue';
import type { LiquidGlassStatus } from '../../../src/types';
import { resolveVisualFixtureScene } from './scenarios';

const scene = resolveVisualFixtureScene(window.location.search);
const glassRef = useTemplateRef<InstanceType<typeof LiquidGlass>>('glassRef');
const status = shallowRef<Readonly<LiquidGlassStatus> | null>(null);

let statusTimer: ReturnType<typeof setInterval> | null = null;

function syncStatus(): void {
  status.value = glassRef.value?.instance?.status ?? null;
}

function formatMode(mode: LiquidGlassStatus['activeMode']): string {
  if (mode === null || mode === undefined) return '—';
  return mode;
}

onMounted(() => {
  syncStatus();
  statusTimer = setInterval(syncStatus, 100);
});

onUnmounted(() => {
  if (statusTimer !== null) clearInterval(statusTimer);
});
</script>

<template>
  <main
    class="visual-fixture"
    :class="[`visual-fixture--${scene.background}`]"
    :data-visual-fixture="scene.fixtureKey"
    :data-fixture-scene="scene.id"
    :data-fixture-component="scene.component"
    :data-fixture-mode="scene.mode"
    :data-fixture-phase="status?.phase ?? 'initializing'"
    :data-fixture-ready="String(status?.phase === 'ready')"
  >
    <div v-if="scene.background === 'image'" class="fixture-image-art" aria-hidden="true">
      <span class="fixture-image-art__sun" />
      <span class="fixture-image-art__mountain fixture-image-art__mountain--back" />
      <span class="fixture-image-art__mountain fixture-image-art__mountain--front" />
      <span class="fixture-image-art__glow" />
    </div>

    <section class="fixture-stage" aria-label="Liquid Glass visual fixture">
      <div class="fixture-header">
        <span class="fixture-kicker">LIQUID GLASS VISUAL FIXTURE</span>
        <span class="fixture-scene">{{ scene.label }}</span>
      </div>

      <LiquidGlass
        v-if="scene.component === 'liquid-glass'"
        ref="glassRef"
        class="fixture-glass"
        :options="scene.options"
        :interactive="false"
        :style="{ width: `${scene.width}px`, height: `${scene.height}px` }"
      >
        <div class="fixture-glass__content">
          <span class="fixture-glass__eyebrow">DETERMINISTIC BASELINE</span>
          <strong>{{ scene.preset.toUpperCase() }} GLASS</strong>
          <span class="fixture-glass__mode">{{ scene.mode }}</span>
        </div>
      </LiquidGlass>

      <LiquidGlass
        v-else
        ref="glassRef"
        class="fixture-status-probe"
        :options="scene.options"
        :interactive="scene.card?.interactive === true && scene.card.disabled !== true"
        aria-hidden="true"
      />

      <GlassCard
        v-if="scene.component === 'glass-card'"
        class="fixture-glass fixture-glass-card"
        :size="scene.card?.size ?? 'md'"
        :options="scene.options"
        :interactive="scene.card?.interactive ?? false"
        :disabled="scene.card?.disabled ?? false"
        :style="{ width: `${scene.width}px`, height: `${scene.height}px` }"
        :aria-label="scene.label"
      >
        <template
          v-if="scene.card?.variant === 'rich-content' || scene.card?.variant === 'disabled'"
          #header
        >
          <div class="fixture-card__header">
            <span class="fixture-glass__eyebrow">
              {{ scene.card.variant === 'disabled' ? 'DISABLED CARD' : 'RICH CONTENT' }}
            </span>
            <span v-if="scene.card.variant === 'rich-content'" class="fixture-card__badge"
              >iOS</span
            >
            <span v-else class="fixture-card__badge">INTERACTION OFF</span>
          </div>
        </template>

        <div class="fixture-card__content">
          <span v-if="scene.card?.variant === 'default'" class="fixture-glass__eyebrow">
            DEFAULT CARD
          </span>
          <span v-else-if="scene.card?.variant === 'interactive'" class="fixture-glass__eyebrow">
            INTERACTIVE CARD
          </span>
          <strong>
            {{
              scene.card?.variant === 'disabled'
                ? 'A quiet disabled state'
                : scene.card?.variant === 'interactive'
                  ? 'Pointer-ready by contract'
                  : scene.card?.variant === 'rich-content'
                    ? 'Header, body and footer'
                    : 'A calm glass container'
            }}
          </strong>
          <span class="fixture-card__copy">
            {{
              scene.card?.variant === 'disabled'
                ? 'Slot content remains part of the normal document flow.'
                : scene.card?.variant === 'interactive'
                  ? 'Interactive is enabled without relying on hover timing.'
                  : scene.card?.variant === 'rich-content'
                    ? 'Structured content stays inside the public component slots.'
                    : 'Layout semantics are separate from optical material options.'
            }}
          </span>
        </div>

        <template
          v-if="scene.card?.variant === 'rich-content' || scene.card?.variant === 'disabled'"
          #footer
        >
          <div class="fixture-card__footer">
            <span>{{
              scene.card.variant === 'disabled' ? 'disabled=true' : 'header / body / footer'
            }}</span>
            <span aria-hidden="true">↗</span>
          </div>
        </template>
      </GlassCard>

      <dl class="fixture-status" data-fixture-status>
        <div>
          <dt>Target</dt>
          <dd>{{ formatMode(status?.targetMode ?? null) }}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{{ formatMode(status?.activeMode ?? null) }}</dd>
        </div>
        <div>
          <dt>Phase</dt>
          <dd>{{ status?.phase ?? 'initializing' }}</dd>
        </div>
      </dl>
    </section>
  </main>
</template>

<style scoped>
.visual-fixture {
  position: relative;
  display: grid;
  min-width: 100vw;
  min-height: 100vh;
  overflow: hidden;
  isolation: isolate;
  background: #0b1024;
  color: #f8fafc;
}

.visual-fixture--light {
  background: linear-gradient(135deg, #f8fbff 0%, #d6e1f2 52%, #bbcce4 100%);
  color: #0f172a;
}

.visual-fixture--image {
  background: linear-gradient(145deg, #101b42 0%, #284a74 42%, #d18867 100%);
}

.visual-fixture::before,
.visual-fixture::after {
  position: absolute;
  z-index: -1;
  display: block;
  border-radius: 50%;
  content: '';
  filter: blur(2px);
}

.visual-fixture::before {
  top: 12%;
  left: 8%;
  width: 28vw;
  height: 28vw;
  min-width: 220px;
  min-height: 220px;
  background: rgba(56, 189, 248, 0.32);
}

.visual-fixture::after {
  right: 5%;
  bottom: 8%;
  width: 24vw;
  height: 24vw;
  min-width: 180px;
  min-height: 180px;
  background: rgba(139, 92, 246, 0.3);
}

.fixture-image-art {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.fixture-image-art__sun {
  position: absolute;
  top: 15%;
  right: 19%;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: #ffd29b;
  box-shadow: 0 0 80px 30px rgba(255, 183, 113, 0.38);
}

.fixture-image-art__mountain {
  position: absolute;
  right: -5%;
  bottom: -24%;
  width: 78%;
  height: 72%;
  transform: rotate(-8deg);
  clip-path: polygon(0 100%, 40% 18%, 62% 52%, 78% 0, 100% 100%);
}

.fixture-image-art__mountain--back {
  right: 20%;
  bottom: -12%;
  background: #31547b;
  opacity: 0.72;
}

.fixture-image-art__mountain--front {
  background: #172d52;
}

.fixture-image-art__glow {
  position: absolute;
  right: 8%;
  bottom: 8%;
  width: 54%;
  height: 16%;
  border-radius: 50%;
  background: rgba(255, 191, 127, 0.34);
  filter: blur(32px);
}

.fixture-stage {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 28px;
  padding: 48px;
}

.fixture-header {
  display: grid;
  gap: 8px;
  text-align: center;
}

.fixture-kicker {
  color: rgba(248, 250, 252, 0.58);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.visual-fixture--light .fixture-kicker {
  color: rgba(15, 23, 42, 0.55);
}

.fixture-scene {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.fixture-glass {
  display: block;
  flex: none;
}

.fixture-status-probe {
  position: fixed;
  top: -10px;
  left: -10px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.fixture-glass-card {
  color: #fff;
}

.fixture-glass-card :deep(.lg-content) {
  justify-content: space-between;
}

.fixture-card__content {
  display: grid;
  align-content: center;
  gap: 9px;
  min-height: 0;
}

.fixture-card__content strong {
  font-size: 24px;
  letter-spacing: -0.045em;
}

.fixture-card__copy {
  max-width: 400px;
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
  line-height: 1.5;
}

.fixture-card__header,
.fixture-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.fixture-card__badge {
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fixture-card__footer {
  color: rgba(255, 255, 255, 0.58);
  font-size: 10px;
  letter-spacing: 0.04em;
}

.fixture-card__footer span:last-child {
  color: #7dd3fc;
  font-size: 16px;
}

.fixture-glass__content {
  display: grid;
  place-items: center;
  align-content: center;
  height: 100%;
  gap: 8px;
  color: #fff;
  text-align: center;
}

.fixture-glass__eyebrow,
.fixture-glass__mode {
  color: rgba(255, 255, 255, 0.64);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.fixture-glass__content strong {
  font-size: 20px;
  letter-spacing: -0.04em;
}

.fixture-status {
  display: grid;
  grid-template-columns: repeat(3, minmax(80px, 1fr));
  gap: 1px;
  min-width: min(100%, 360px);
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(14px);
}

.fixture-status > div {
  display: grid;
  gap: 5px;
  padding: 10px 12px;
  background: rgba(3, 7, 18, 0.26);
}

.fixture-status dt {
  color: rgba(255, 255, 255, 0.52);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fixture-status dd {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  font-weight: 700;
}

@media (max-width: 520px) {
  .fixture-stage {
    padding: 24px;
  }

  .fixture-status {
    grid-template-columns: 1fr;
  }
}
</style>
