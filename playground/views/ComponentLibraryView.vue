<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import ButtonExample from '../examples/GlassButtonExample.vue';
import TabBarExample from '../examples/GlassTabBarExample.vue';
import CardExample from '../examples/GlassCardExample.vue';
import DockExample from '../examples/GlassDockExample.vue';
import GlassExample from '../examples/LiquidGlassExample.vue';
import MusicExample from '../examples/MusicCardExample.vue';
import UsageCodePanel from '../components/UsageCodePanel.vue';
import { USAGE_CODE, type UsageCodeId } from '../utils/usage-code';

const components = [
  {
    id: 'liquid-glass',
    name: 'LiquidGlass',
    label: '搜索与音量',
    component: GlassExample,
    description: '以搜索框和音量条观察弧面、透色与细边缘。',
  },
  {
    id: 'glass-button',
    name: 'GlassButton',
    label: '按钮',
    component: ButtonExample,
    description: '四种语义样式、三种尺寸，共用同一套玻璃材质。',
  },
  {
    id: 'glass-tab-bar',
    name: 'GlassTabBar',
    label: '标签导航',
    component: TabBarExample,
    description: '连续胶囊外壳、柔和选中透镜与清晰的图标文字。',
  },
  {
    id: 'glass-card',
    name: 'GlassCard',
    label: '内容卡片',
    component: CardExample,
    description: '为内容保留可读性，让背景色彩透过柔和的玻璃表面。',
  },
  {
    id: 'glass-dock',
    name: 'GlassDock',
    label: '应用 Dock',
    component: DockExample,
    description: '玻璃托盘承载应用图标，支持方向键导航和受控选中。',
  },
  {
    id: 'music-card',
    name: 'MusicPlayerCard',
    label: '音乐播放器',
    component: MusicExample,
    description: '由 GlassCard 与 GlassButton 组合，可直接复制使用。',
  },
] as const;
const selectedId = shallowRef<UsageCodeId>('liquid-glass');
const selected = computed(
  () => components.find((item) => item.id === selectedId.value) ?? components[0]
);
const viewMode = shallowRef<'preview' | 'code'>('preview');
const backgrounds = [
  {
    id: 'amber',
    name: '暖色',
    value:
      'radial-gradient(ellipse at 20% 10%, #c18543, transparent 65%), linear-gradient(115deg, #8a562b, #382418)',
    ink: '#fff',
    swatch: '#9c6635',
  },
  {
    id: 'image',
    name: '图片',
    value: 'url(/backgrounds/image2.png)',
    ink: '#fff',
    swatch: '#44586d',
  },
  { id: 'white', name: '纯白', value: '#ffffff', ink: '#202124', swatch: '#fff' },
  { id: 'black', name: '纯黑', value: '#000000', ink: '#f5f5f7', swatch: '#000' },
] as const;
const backgroundId = shallowRef('amber');
const showArtwork = shallowRef(false);
const background = computed(
  () => backgrounds.find((item) => item.id === backgroundId.value) ?? backgrounds[0]
);
const sceneStyle = computed(() => ({
  '--demo-backdrop': background.value.value,
  '--demo-ink': background.value.ink,
  '--demo-art-display': showArtwork.value ? 'block' : 'none',
}));
const code = computed(() => {
  const declarations = Object.entries(sceneStyle.value)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  return USAGE_CODE[selectedId.value].replace('.demo-scene {', `.demo-scene {\n${declarations}`);
});
</script>

<template>
  <main class="component-library-view">
    <header class="library-heading">
      <div>
        <span class="eyebrow">MATERIALS / COMPONENTS</span>
        <h1>让玻璃，回到界面里。</h1>
        <p>同一组件，切换背景。每个示例都可以独立使用。</p>
      </div>
      <span class="component-count">06 个组件</span>
    </header>
    <div class="library-layout">
      <nav class="component-nav" aria-label="组件列表">
        <button
          v-for="(item, index) in components"
          :key="item.id"
          :aria-pressed="selectedId === item.id"
          @click="selectedId = item.id"
        >
          <span class="component-number">0{{ index + 1 }}</span
          ><span
            ><strong>{{ item.name }}</strong
            ><small>{{ item.label }}</small></span
          >
        </button>
      </nav>
      <section class="library-detail">
        <header class="detail-heading">
          <div>
            <h2>{{ selected.name }}</h2>
            <p>{{ selected.description }}</p>
          </div>
          <div class="view-switch" role="tablist" aria-label="示例视图">
            <button
              role="tab"
              :aria-selected="viewMode === 'preview'"
              @click="viewMode = 'preview'"
            >
              预览</button
            ><button role="tab" :aria-selected="viewMode === 'code'" @click="viewMode = 'code'">
              使用代码
            </button>
          </div>
        </header>
        <div class="scene-toolbar">
          <div class="backgrounds" role="group" aria-label="预览背景">
            <span>背景</span
            ><button
              v-for="item in backgrounds"
              :key="item.id"
              :aria-pressed="backgroundId === item.id"
              @click="backgroundId = item.id"
            >
              <i :style="{ background: item.swatch }" />{{ item.name }}
            </button>
          </div>
          <label class="art-toggle"
            ><input v-model="showArtwork" type="checkbox" />加入底层图案</label
          >
        </div>
        <div v-if="viewMode === 'preview'" class="preview-stage" :style="sceneStyle">
          <component :is="selected.component" />
        </div>
        <UsageCodePanel v-else :component-name="selected.name" :code="code" />
        <footer class="scene-footer">
          <span>组件实景 · {{ background.name }}背景</span><span>文字与图标不参与折射</span>
        </footer>
        <p v-if="backgroundId === 'image' && viewMode === 'code'" class="asset-note">
          图片示例引用 /backgrounds/image2.png；独立使用时请替换为你自己的图片路径。
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.component-library-view {
  width: min(1240px, 100%);
  margin: 0 auto;
  padding: 136px 32px 48px;
  box-sizing: border-box;
  color: #e9edf4;
}
.library-heading {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: end;
  margin-bottom: 32px;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: #8090a5;
}
h1 {
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 550;
  letter-spacing: -0.04em;
  margin: 12px 0;
}
.library-heading p {
  font-size: 13px;
  color: #93a0b2;
  margin: 0;
}
.component-count {
  font-size: 11px;
  white-space: nowrap;
  color: #78879b;
}
.library-layout {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 32px;
}
.component-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.component-nav button {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  border: 1px solid transparent;
  padding: 15px 10px;
  border-radius: 12px;
  color: #8593a5;
  background: transparent;
  cursor: pointer;
}
.component-nav button[aria-pressed='true'] {
  background: #1b2636;
  border-color: #314258;
  color: #fff;
}
.component-number {
  font-size: 10px;
  opacity: 0.5;
}
.component-nav strong {
  display: block;
  font-size: 12px;
  font-weight: 550;
}
.component-nav small {
  display: block;
  font-size: 11px;
  margin-top: 6px;
  opacity: 0.6;
}
.library-detail {
  min-width: 0;
}
.detail-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}
h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 550;
  letter-spacing: -0.02em;
}
.detail-heading p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #8493a7;
}
.view-switch {
  display: flex;
  padding: 3px;
  flex-shrink: 0;
  border: 1px solid #2c3748;
  border-radius: 9px;
}
.view-switch button {
  border: 0;
  padding: 7px 12px;
  background: none;
  border-radius: 6px;
  color: #95a3b6;
  font-size: 11px;
  cursor: pointer;
}
.view-switch button[aria-selected='true'] {
  color: #fff;
  background: #28354a;
}
.scene-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding: 14px 0;
  border-top: 1px solid #253143;
}
.backgrounds {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #8493a7;
}
.backgrounds > span {
  margin-right: 6px;
}
.backgrounds button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 9px;
  border: 1px solid transparent;
  border-radius: 7px;
  color: #9aa8bc;
  background: none;
  cursor: pointer;
  font-size: 11px;
}
.backgrounds button[aria-pressed='true'] {
  border-color: #49576b;
  color: #fff;
}
.backgrounds i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #ffffff30;
}
.art-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #9aa8bc;
  cursor: pointer;
}
.art-toggle input {
  accent-color: #8aaaff;
}
.preview-stage {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #ffffff18;
}
.scene-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: #64748b;
  font-size: 10px;
  margin-top: 15px;
}
.asset-note {
  color: #94a3b8;
  font-size: 12px;
}
button:focus-visible {
  outline: 2px solid #94b4ff;
  outline-offset: 3px;
}
@media (max-width: 1000px) {
  .library-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .component-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .component-nav button {
    padding: 12px;
    flex: 1 1 26%;
  }
  .component-nav small {
    display: none;
  }
}
@media (max-width: 540px) {
  .component-library-view {
    padding: 104px 14px 28px;
  }
  .library-heading {
    margin-bottom: 22px;
  }
  .component-count {
    display: none;
  }
  .component-nav button {
    gap: 6px;
    padding: 10px 7px;
  }
  .component-nav strong {
    font-size: 10px;
  }
  .detail-heading {
    align-items: start;
    flex-direction: column;
    gap: 12px;
  }
  .backgrounds {
    gap: 2px;
  }
  .backgrounds button {
    padding: 6px;
  }
  .scene-footer {
    font-size: 9px;
  }
}
</style>
