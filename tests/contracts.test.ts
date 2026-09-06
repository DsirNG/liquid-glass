import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createLiquidGlass } from '../src/core';
import { SvgFilterBuilder } from '../src/engine/svg/SvgFilterBuilder';

describe('LiquidGlass Contract Tests', () => {
  describe('Contract 1: Package & Module Boundary', () => {
    it('ensures package.json contains zero three/webgl dependencies or exports', () => {
      const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
      expect(pkg.peerDependencies?.three).toBeUndefined();
      expect(pkg.devDependencies?.three).toBeUndefined();
      expect(pkg.dependencies?.three).toBeUndefined();
      expect(pkg.exports['./webgl']).toBeUndefined();
      expect(pkg.exports['./vue-webgl']).toBeUndefined();
      expect(pkg.exports['.']).toBeDefined();
      expect(pkg.exports['./vue']).toBeDefined();
      expect(pkg.exports['./style.css']).toBeDefined();
    });

    it('ensures core, engine, and vue source files contain no WebGL or Three.js imports', () => {
      const coreCode = readFileSync(resolve('src/core/index.ts'), 'utf8');
      const engineIndex = readFileSync(resolve('src/engine/index.ts'), 'utf8');
      const domEngine = readFileSync(resolve('src/engine/LiquidGlassEngine.ts'), 'utf8');
      const vueIndex = readFileSync(resolve('src/vue/index.ts'), 'utf8');

      const combined = `${coreCode}\n${engineIndex}\n${domEngine}\n${vueIndex}`;
      expect(combined).not.toMatch(/from\s+['"]three['"]/i);
      expect(combined).not.toMatch(/from\s+['"].*webgl.*['"]/i);
      expect(combined).not.toMatch(/WebGLRenderer/i);
    });
  });

  describe('Contract 2: 5-Layer DOM Architecture & Stacking Context', () => {
    it('creates standard 5-layer DOM structure and handles clean destruction', () => {
      const el = document.createElement('div');
      const contentSpan = document.createElement('span');
      contentSpan.className = 'lg-content';
      contentSpan.textContent = 'Glass Button';
      el.appendChild(contentSpan);
      document.body.appendChild(el);

      const instance = createLiquidGlass(el, {
        refraction: 1.2,
        dispersion: 2.0,
        specular: 0.7,
        radius: 20,
        tint: '#ffffff',
        opacity: 0.35,
      });

      // 1. Host element classes
      expect(el.classList.contains('lg-root')).toBe(true);
      expect(el.classList.contains('lg-svg-container')).toBe(true);

      // 2. Optical backdrop layer (z-index: 1)
      const backdrop = el.querySelector('.lg-backdrop.lg-svg-refraction') as HTMLElement | null;
      expect(backdrop).not.toBeNull();
      expect(backdrop?.style.zIndex).toBe('1');
      expect(backdrop?.style.position).toBe('absolute');

      // 3. Physical material tint layer (z-index: 1)
      const material = el.querySelector('.lg-material.lg-svg-tint') as HTMLElement | null;
      expect(material).not.toBeNull();
      expect(material?.style.zIndex).toBe('1');

      // 4. Specular highlight border 1 (screen mode, z-index: 2)
      const borderScreen = el.querySelector('.lg-border.lg-border-screen') as HTMLElement | null;
      expect(borderScreen).not.toBeNull();
      expect(borderScreen?.style.zIndex).toBe('2');

      // 5. Specular highlight border 2 (overlay mode, z-index: 2)
      const borderOverlay = el.querySelector('.lg-border.lg-border-overlay') as HTMLElement | null;
      expect(borderOverlay).not.toBeNull();
      expect(borderOverlay?.style.zIndex).toBe('2');

      // 6. User content preserves placement
      const content = el.querySelector('.lg-content') as HTMLElement | null;
      expect(content).not.toBeNull();
      expect(content?.textContent).toBe('Glass Button');

      // 7. Test teardown / cleanup
      instance.destroy();
      expect(el.querySelector('.lg-backdrop')).toBeNull();
      expect(el.querySelector('.lg-material')).toBeNull();
      expect(el.querySelector('.lg-border-screen')).toBeNull();
      expect(el.querySelector('.lg-border-overlay')).toBeNull();
      expect(el.classList.contains('lg-root')).toBe(false);
      expect(el.classList.contains('lg-svg-container')).toBe(false);

      el.remove();
    });
  });

  describe('Contract 3: SVG Optical Filter Graph', () => {
    it('constructs complete optical graph with dispersion scales, alpha clamping, and center body preservation', async () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const instance = createLiquidGlass(el, {
        refraction: 1.5,
        dispersion: 2.0,
        dispersionProfile: 'ios',
        bodyMaskRatio: 0.6,
      });

      const filter = document.querySelector('svg filter') as SVGFilterElement | null;
      expect(filter).not.toBeNull();
      const filterHtml = filter?.innerHTML ?? '';

      // ① Displacement source texture
      expect(filterHtml).toContain('<feImage');
      expect(filterHtml).toContain('result="DISPLACEMENT_TEXTURE"');

      // ② Exactly 3 feDisplacementMap elements with R/G selectors (R=X, G=Y)
      const displacementMaps = filter?.querySelectorAll('feDisplacementMap') ?? [];
      expect(displacementMaps.length).toBe(3);
      displacementMaps.forEach((dm) => {
        expect(dm.getAttribute('xChannelSelector')).toBe('R');
        expect(dm.getAttribute('yChannelSelector')).toBe('G');
        expect(dm.getAttribute('in2')).toBe('DISPLACEMENT_TEXTURE');
      });

      // ③ Channel isolation color matrices
      expect(filterHtml).toContain('result="RED_CHANNEL"');
      expect(filterHtml).toContain('result="GREEN_CHANNEL"');
      expect(filterHtml).toContain('result="BLUE_CHANNEL"');

      // ④ Alpha preservation (clamped to SourceGraphic to prevent white halo)
      expect(filterHtml).toContain('result="RGB_COMBINED"');
      expect(filterHtml).toContain('result="RGB_ALPHA_PRESERVED"');
      expect(filterHtml).toContain('operator="in"');

      // ⑤ Body mask hierarchy and center preservation
      expect(filterHtml).toContain('result="EDGE_MASK"');
      expect(filterHtml).toContain('result="BODY_MASK"');
      expect(filterHtml).toContain('result="EDGE_REFRACTED"');
      expect(filterHtml).toContain('result="BODY_CLEAN"');
      expect(filterHtml).toContain('result="FINAL_GLASS"');

      // ⑥ Backdrop filter ordering on layer:
      // Initial mount before async assets commit has fallback blur + saturate;
      // once assets commit in Full Optical mode, it sets pure url(#${filterId}) without duplicate saturation.
      const backdrop = el.querySelector('.lg-backdrop') as HTMLElement | null;
      expect(backdrop?.style.backdropFilter).toMatch(/blur\(.*saturate\(/);

      // Await transactional swap once assets are generated
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(backdrop?.style.backdropFilter).toMatch(/^url\(["']?#.*lg-svg-filter/);

      instance.destroy();
      el.remove();
    });

    it('resolves dispersion profiles correctly', () => {
      const subtle = SvgFilterBuilder.resolveDispersionScales(10, 1.0, 'subtle');
      const ios = SvgFilterBuilder.resolveDispersionScales(10, 1.0, 'ios');
      const strong = SvgFilterBuilder.resolveDispersionScales(10, 1.0, 'strong');

      expect(subtle.r).toBe(-10);
      expect(ios.r).toBe(-10);
      expect(strong.r).toBe(-10);
      // As dispersion profile gets stronger, blue is shifted further away from red
      expect(Math.abs(subtle.r - subtle.b)).toBeLessThan(Math.abs(ios.r - ios.b));
      expect(Math.abs(ios.r - ios.b)).toBeLessThan(Math.abs(strong.r - strong.b));
    });

    it('injects directional physical specular gradients on host element', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const instance = createLiquidGlass(el, {
        specular: 0.8,
      });

      const screenBg = el.style.getPropertyValue('--lg-border-screen-bg');
      const overlayBg = el.style.getPropertyValue('--lg-border-overlay-bg');
      expect(screenBg).toContain('linear-gradient(135deg');
      expect(overlayBg).toContain('linear-gradient(135deg');

      instance.destroy();
      el.remove();
    });
  });

  describe('Contract 4: 9-Slice & Physical Snell Refraction', () => {
    it('seamlessly resizes from 100x40 -> 300x80 -> 120x120 without errors or NaN attributes', () => {
      const el = document.createElement('div');
      el.style.width = '100px';
      el.style.height = '40px';
      document.body.appendChild(el);

      const instance = createLiquidGlass(el, {
        refraction: 1.0,
        dispersion: 1.5,
        radius: 16,
      });

      // Step 1: 100x40
      expect(() => instance.resize()).not.toThrow();

      // Step 2: Resize to 300x80
      el.style.width = '300px';
      el.style.height = '80px';
      expect(() => instance.resize()).not.toThrow();

      // Step 3: Resize to 120x120 with update()
      el.style.width = '120px';
      el.style.height = '120px';
      expect(() =>
        instance.update({
          refraction: 1.8,
          radius: 30,
          thickness: 60,
          ior: 2.4,
          bezel: 28,
        })
      ).not.toThrow();

      const filter = document.querySelector('svg filter');
      expect(filter).not.toBeNull();
      const filterW = filter?.getAttribute('width');
      const filterH = filter?.getAttribute('height');
      expect(filterW).toBeTruthy();
      expect(filterH).toBeTruthy();
      expect(filterW).not.toContain('NaN');
      expect(filterH).not.toContain('NaN');


      instance.destroy();
      el.remove();
    });
  });
});
