<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import type { LiquidGlassMaterialOptions } from '../../src/core';
import { LiquidGlass } from '../../src/vue';

import GlassButtonPreview from '../components/GlassButtonPreview.vue';
import CleanNavPreview from '../components/CleanNavPreview.vue';
import MusicPlayerCard from '../components/MusicPlayerCard.vue';
import UsageCodePanel from '../components/UsageCodePanel.vue';
import { withPureRefraction } from '../utils/material';

type LibraryComponentId = 'glass-button' | 'glass-tab-bar' | 'liquid-glass' | 'music-card';

interface LibraryComponent {
  id: LibraryComponentId;
  number: string;
  name: string;
  description: string;
  props: string[];
  usageCode: string;
}

const scriptClose = '</' + 'script>';
const joinCode = (...lines: string[]): string => lines.join('\n');

const libraryComponents: LibraryComponent[] = [
  {
    id: 'glass-button',
    number: '01',
    name: 'GlassButton',
    description: '带有液态按压回弹的玻璃按钮。',
    props: ['size', 'variant', 'surface-profile', 'refraction-coverage', 'border-mode'],
    usageCode: joinCode(
      '<script setup lang="ts">',
      "import { GlassButton } from 'liquid-glass/vue';",
      "import 'liquid-glass/style.css';",
      '',
      'function handleClick(): void {}',
      scriptClose,
      '',
      '<template>',
      '  <GlassButton',
      '    size="md"',
      '    variant="primary"',
      '    refraction-coverage="full"',
      '    surface-profile="fluid_dome"',
      '    :options="{',
      '      blur: 0,',
      '      opacity: 0,',
      '      refraction: 1,',
      '      dispersion: 1.5,',
      '      specular: 0.75,',
      '    }"',
      '    @click="handleClick"',
      '  >',
      '    立即体验',
      '  </GlassButton>',
      '</template>'
    ),
  },
  {
    id: 'glass-tab-bar',
    number: '02',
    name: 'GlassTabBar',
    description: '支持选中 lens、hover lens 和咚咚按压反馈的导航栏。',
    props: ['items', 'item-width', 'lens-inset', 'radius', 'responsive'],
    usageCode: joinCode(
      '<script setup lang="ts">',
      "import { shallowRef } from 'vue';",
      "import { GlassTabBar } from 'liquid-glass/vue';",
      "import 'liquid-glass/style.css';",
      '',
      "const activeTab = shallowRef('home');",
      'const items = [',
      "  { value: 'home', label: 'Home' },",
      "  { value: 'discover', label: 'Discover' },",
      "  { value: 'profile', label: 'Profile' },",
      '];',
      '',
      'const glassOptions = {',
      '  blur: 0,',
      '  opacity: 0,',
      '  refraction: 1,',
      "  refractionCoverage: 'full',",
      '};',
      scriptClose,
      '',
      '<template>',
      '  <GlassTabBar',
      '    v-model="activeTab"',
      '    :items="items"',
      '    :base-options="glassOptions"',
      '    :lens-options="glassOptions"',
      '    :item-width="88"',
      '    :lens-inset="7"',
      '    :radius="999"',
      '    responsive',
      '  />',
      '</template>'
    ),
  },
  {
    id: 'liquid-glass',
    number: '03',
    name: 'LiquidGlass',
    description: '底层液态玻璃容器，承载折射、色散与高光效果。',
    props: ['options', 'interactive', 'refraction', 'dispersion', 'saturation'],
    usageCode: joinCode(
      '<script setup lang="ts">',
      "import { LiquidGlass } from 'liquid-glass/vue';",
      "import 'liquid-glass/style.css';",
      '',
      'const glassOptions = {',
      '  blur: 0,',
      '  opacity: 0,',
      '  refraction: 1,',
      '  dispersion: 1.5,',
      '  saturation: 1.3,',
      '  specular: 0.75,',
      '  shadow: 0.25,',
      "  refractionCoverage: 'full',",
      '};',
      scriptClose,
      '',
      '<template>',
      '  <LiquidGlass :options="glassOptions" :interactive="true">',
      '    <div class="content">Liquid Glass Content</div>',
      '  </LiquidGlass>',
      '</template>'
    ),
  },
  {
    id: 'music-card',
    number: '04',
    name: 'MusicPlayerCard',
    description: '用于验证不同尺寸下内容布局和液态玻璃容器的组合示例。',
    props: ['slot content', 'responsive layout', 'playback state'],
    usageCode: joinCode(
      '<script setup lang="ts">',
      "import { LiquidGlass } from 'liquid-glass/vue';",
      "import MusicPlayerCard from './MusicPlayerCard.vue';",
      "import 'liquid-glass/style.css';",
      '',
      'const glassOptions = {',
      '  blur: 0,',
      '  opacity: 0,',
      '  refraction: 1,',
      "  refractionCoverage: 'full',",
      '};',
      scriptClose,
      '',
      '<template>',
      '  <LiquidGlass :options="glassOptions" :interactive="true">',
      '    <MusicPlayerCard />',
      '  </LiquidGlass>',
      '</template>'
    ),
  },
];

const selectedId = shallowRef<LibraryComponentId>('glass-button');
const selectedComponent = computed<LibraryComponent>(
  () => libraryComponents.find((item) => item.id === selectedId.value) ?? libraryComponents[0]
);

const viewMode = shallowRef<'preview' | 'code'>('preview');

// The library is a reference surface, so its previews stay on a stable
// default material instead of following the HomeShowcase control panel.
const previewOptions: LiquidGlassMaterialOptions = withPureRefraction({
  shape: 'roundedRect',
});

function selectComponent(id: LibraryComponentId): void {
  selectedId.value = id;
}
</script>

<template>
  <main class="component-library-view">
    <header class="library-heading">
      <div>
        <span class="library-heading__eyebrow">VUE COMPONENT LIBRARY</span>
        <h1>组件库</h1>
        <p>从这里查看 Vue 组件的独立使用方式与当前液态玻璃材质。</p>
      </div>
      <div class="library-heading__meta">
        <span class="library-heading__dot" />
        <span>4 COMPONENTS</span>
      </div>
    </header>

    <div class="library-layout">
      <aside class="library-sidebar" aria-label="组件列表">
        <div class="library-sidebar__label">COMPONENTS</div>
        <nav class="library-sidebar__nav">
          <button
            v-for="component in libraryComponents"
            :key="component.id"
            class="library-item"
            :class="{ active: selectedId === component.id }"
            type="button"
            @click="selectComponent(component.id)"
          >
            <span class="library-item__number">{{ component.number }}</span>
            <span class="library-item__copy">
              <strong>{{ component.name }}</strong>
              <small>{{ component.description }}</small>
            </span>
            <span class="library-item__arrow">↗</span>
          </button>
        </nav>

        <div class="library-sidebar__hint">
          <span class="library-sidebar__hint-icon">⌘</span>
          <p>首页用于调参，组件库用于查看单个组件的组合方式。</p>
        </div>
      </aside>

      <section class="library-detail">
        <header class="library-detail__header">
          <div>
            <span class="library-detail__kicker">COMPONENT {{ selectedComponent.number }}</span>
            <h2>{{ selectedComponent.name }}</h2>
            <p>{{ selectedComponent.description }}</p>
          </div>
          <div class="library-detail__actions">
            <span class="library-detail__badge">
              {{ viewMode === 'preview' ? 'LIVE PREVIEW' : 'VUE USAGE' }}
            </span>
            <div class="library-view-switch" role="tablist" aria-label="查看预览或使用代码">
              <button
                class="library-view-switch__button"
                :class="{ active: viewMode === 'preview' }"
                type="button"
                role="tab"
                :aria-selected="viewMode === 'preview'"
                @click="viewMode = 'preview'"
              >
                预览
              </button>
              <button
                class="library-view-switch__button"
                :class="{ active: viewMode === 'code' }"
                type="button"
                role="tab"
                :aria-selected="viewMode === 'code'"
                @click="viewMode = 'code'"
              >
                使用代码
              </button>
            </div>
          </div>
        </header>

        <div v-if="viewMode === 'preview'" class="library-preview-surface">
          <GlassButtonPreview
            v-if="selectedId === 'glass-button'"
            :glass-options="previewOptions"
          />
          <CleanNavPreview
            v-else-if="selectedId === 'glass-tab-bar'"
            :glass-options="previewOptions"
          />

          <div v-else-if="selectedId === 'liquid-glass'" class="single-glass-preview">
            <div class="single-glass-preview__frame">
              <LiquidGlass
                :options="previewOptions"
                :interactive="true"
                style="width: 100%; height: 100%"
              >
                <div class="single-glass-preview__content">
                  <span class="single-glass-preview__icon">◌</span>
                  <strong>LiquidGlass</strong>
                  <span>hover to inspect refraction</span>
                </div>
              </LiquidGlass>
            </div>
            <p class="preview-caption">
              容器本身不限制内容类型，所有视觉参数通过 options 进入同一个底层引擎。
            </p>
          </div>

          <div v-else class="music-card-preview">
            <div class="music-card-preview__frame">
              <LiquidGlass
                :options="previewOptions"
                :interactive="true"
                style="width: 100%; height: 100%"
              >
                <MusicPlayerCard />
              </LiquidGlass>
            </div>
            <p class="preview-caption">内容组件保持独立，玻璃容器只负责提供材质和光学效果。</p>
          </div>
        </div>

        <UsageCodePanel
          v-else
          :component-name="selectedComponent.name"
          :code="selectedComponent.usageCode"
        />

        <footer class="library-detail__footer">
          <span class="library-detail__footer-label">SUPPORTED PARAMETERS</span>
          <div class="library-props">
            <code v-for="prop in selectedComponent.props" :key="prop">{{ prop }}</code>
          </div>
        </footer>
      </section>
    </div>
  </main>
</template>

<style scoped>
.component-library-view {
  width: min(1240px, calc(100% - 48px));
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  padding: 126px 0 30px;
  overflow: auto;
  color: #fff;
}

.library-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.library-heading__eyebrow,
.library-sidebar__label,
.library-detail__kicker,
.library-detail__footer-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.library-heading h1 {
  margin: 7px 0 5px;
  font-size: clamp(28px, 4vw, 42px);
  letter-spacing: -0.055em;
}

.library-heading p {
  margin: 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
}

.library-heading__meta,
.library-detail__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 11px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.62);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.library-heading__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.9);
}

.library-layout {
  display: grid;
  grid-template-columns: minmax(220px, 0.3fr) minmax(0, 1fr);
  min-width: 0;
  min-height: 540px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 28px;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(22px) saturate(1.15);
  -webkit-backdrop-filter: blur(22px) saturate(1.15);
}

.library-sidebar {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
  padding: 22px 14px 18px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.library-sidebar__label {
  padding: 0 10px;
}

.library-sidebar__nav {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.library-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 13px 10px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: transparent;
  color: rgba(255, 255, 255, 0.66);
  text-align: left;
  cursor: pointer;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.library-item:hover {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.9);
}

.library-item.active {
  border-color: rgba(125, 211, 252, 0.42);
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.24), rgba(139, 124, 247, 0.18));
  color: #fff;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.18);
}

.library-item:active {
  transform: scale(0.985);
}

.library-item__number {
  color: rgba(255, 255, 255, 0.38);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
}

.library-item.active .library-item__number {
  color: #7dd3fc;
}

.library-item__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.library-item__copy strong {
  overflow: hidden;
  color: inherit;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.library-item__copy small {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.43);
  font-size: 10px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.library-item__arrow {
  color: rgba(255, 255, 255, 0.35);
  font-size: 16px;
}

.library-item.active .library-item__arrow {
  color: #7dd3fc;
}

.library-sidebar__hint {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: auto;
  padding: 13px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.42);
}

.library-sidebar__hint-icon {
  color: #7dd3fc;
  font-size: 14px;
}

.library-sidebar__hint p {
  margin: 0;
  font-size: 10px;
  line-height: 1.45;
}

.library-detail {
  display: flex;
  min-width: 0;
  width: 100%;
  flex-direction: column;
  padding: 26px 28px 22px;
}

.library-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.library-detail__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.library-view-switch {
  display: inline-flex;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}

.library-view-switch__button {
  padding: 6px 9px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.52);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
  transition:
    background 160ms ease,
    color 160ms ease;
}

.library-view-switch__button.active {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.library-detail__header h2 {
  margin: 8px 0 5px;
  color: #fff;
  font-size: clamp(22px, 3vw, 30px);
  letter-spacing: -0.045em;
}

.library-detail__header p {
  margin: 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
}

.library-preview-surface {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 330px;
  min-width: 0;
  margin: 24px 0 20px;
  padding: 26px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 22px;
  overflow: auto;
}

.library-preview-surface :deep(.button-preview) {
  width: min(720px, 100%);
}

.library-preview-surface :deep(.clean-nav-preview) {
  width: min(720px, 100%);
}

.single-glass-preview,
.music-card-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(620px, 100%);
  flex-direction: column;
  gap: 18px;
}

.single-glass-preview__frame,
.music-card-preview__frame {
  width: min(540px, 100%);
  height: 250px;
}

.single-glass-preview__content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  flex-direction: column;
  gap: 10px;
  color: rgba(255, 255, 255, 0.8);
}

.single-glass-preview__content strong {
  color: #fff;
  font-size: 24px;
  letter-spacing: -0.04em;
}

.single-glass-preview__content span:last-child {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
}

.single-glass-preview__icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  color: #7dd3fc;
  font-size: 26px;
}

.preview-caption {
  max-width: 520px;
  margin: 0;
  color: rgba(255, 255, 255, 0.48);
  font-size: 11px;
  line-height: 1.5;
  text-align: center;
}

.library-detail__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.library-props {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.library-props code {
  padding: 5px 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.65);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
}

@media (max-width: 900px) {
  .component-library-view {
    width: min(100% - 32px, 720px);
    padding-top: 112px;
  }

  .library-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .library-sidebar {
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .library-sidebar__nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 100%;
  }

  .library-sidebar__hint {
    display: none;
  }
}

@media (max-width: 600px) {
  .component-library-view {
    width: calc(100% - 20px);
    padding-top: 92px;
    padding-bottom: 18px;
  }

  .library-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .library-heading p {
    max-width: 310px;
    line-height: 1.45;
  }

  .library-layout {
    min-height: 0;
    border-radius: 22px;
  }

  .library-sidebar {
    padding: 16px 10px 12px;
  }

  .library-sidebar__nav {
    display: flex;
    flex-direction: row;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .library-sidebar__nav::-webkit-scrollbar {
    display: none;
  }

  .library-item {
    min-width: 142px;
    grid-template-columns: 22px minmax(0, 1fr);
    padding: 10px 9px;
  }

  .library-item__arrow {
    display: none;
  }

  .library-detail {
    padding: 20px 14px 16px;
  }

  .library-detail__header {
    flex-direction: column;
    gap: 12px;
  }

  .library-detail__actions {
    width: 100%;
    justify-content: space-between;
  }

  .library-preview-surface {
    min-height: 290px;
    margin: 18px 0 16px;
    padding: 14px;
  }

  .single-glass-preview__frame,
  .music-card-preview__frame {
    height: 210px;
  }

  .library-detail__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .library-props {
    justify-content: flex-start;
  }
}
</style>
