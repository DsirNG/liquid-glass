import { createApp, h, shallowRef } from 'vue';
import GlassButton from '../../playground/examples/GlassButtonExample.vue';
import GlassTabBar from '../../playground/examples/GlassTabBarExample.vue';
import GlassCard from '../../playground/examples/GlassCardExample.vue';
import GlassDock from '../../playground/examples/GlassDockExample.vue';
import LiquidGlass from '../../playground/examples/LiquidGlassExample.vue';
import MusicCard from '../../playground/examples/MusicCardExample.vue';

// Deliberately no playground/global.css and no source aliases. These examples
// consume the package exports and dist/style.css exactly like a user's project.
const examples = { LiquidGlass, GlassButton, GlassTabBar, GlassCard, GlassDock, MusicCard };
const active = shallowRef<keyof typeof examples>('GlassTabBar');
createApp({
  setup: () => () =>
    h('main', { style: 'max-width:900px;margin:40px auto;font-family:system-ui;' }, [
      h('h1', '独立依赖验证'),
      h('p', '加载 dist 构建产物，无演示页全局样式。'),
      h(
        'nav',
        { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;' },
        Object.keys(examples).map((name) =>
          h(
            'button',
            {
              onClick: () => {
                active.value = name as keyof typeof examples;
              },
              'aria-pressed': active.value === name,
            },
            name
          )
        )
      ),
      h(examples[active.value]),
    ]),
}).mount('#app');
