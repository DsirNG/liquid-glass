import { describe, it, expect, vi } from 'vitest';
import { createLiquidGlass } from '../src/core';
import {
  evaluateFootprintSdf,
  evaluateFootprintNormal,
  calculateCoverage,
  SURFACE_PROFILES,
  calculateRefractionProfile,
  calculateMaxAbsRefraction,
  sampleRefractionProfile,
  OpticalFieldGenerator,
  evaluatePartitionOfUnityBasis,
  CapabilityResolver,

  MaterialResolver,
  InteractionController,
} from '../src/engine/svg';

describe('Liquid Glass Optical Engine v2.1 Architecture Contracts', () => {
  describe('Contract 1: Analytical Multi-Footprint Geometry (SDF & Normals)', () => {
    it('evaluates accurate distances for roundedRect, capsule, and circle', () => {
      // 1. Center of 100x100 circle should be -50 (inside)
      const circleDist = evaluateFootprintSdf(50, 50, {
        shape: 'circle',
        width: 100,
        height: 100,
        radius: 50,
      });
      expect(circleDist).toBeCloseTo(-50, 1);

      // Outside circle at (120, 50) should be +20
      const outsideCircle = evaluateFootprintSdf(120, 50, {
        shape: 'circle',
        width: 100,
        height: 100,
        radius: 50,
      });
      expect(outsideCircle).toBeCloseTo(20, 1);

      // 2. Rounded rectangle center of 200x100 (radius 20)
      const rectCenter = evaluateFootprintSdf(100, 50, {
        shape: 'roundedRect',
        width: 200,
        height: 100,
        radius: 20,
      });
      expect(rectCenter).toBeLessThan(0);

      // 3. Capsule centered distance
      const capsuleCenter = evaluateFootprintSdf(50, 25, {
        shape: 'capsule',
        width: 100,
        height: 50,
        radius: 25,
      });
      expect(capsuleCenter).toBeLessThan(0);
    });

    it('computes outward normal vectors pointing towards the perimeter', () => {
      // Point near right edge of 200x100 box (190, 50) should point horizontally right: nx > 0.9, ny ≈ 0
      const normalRight = evaluateFootprintNormal(190, 50, {
        shape: 'roundedRect',
        width: 200,
        height: 100,
        radius: 20,
      });
      expect(normalRight.x).toBeGreaterThan(0.9);
      expect(Math.abs(normalRight.y)).toBeLessThan(0.1);

      // Point near top edge (100, 10) should point vertically up: ny < -0.9, nx ≈ 0
      const normalTop = evaluateFootprintNormal(100, 10, {
        shape: 'roundedRect',
        width: 200,
        height: 100,
        radius: 20,
      });
      expect(normalTop.y).toBeLessThan(-0.9);
      expect(Math.abs(normalTop.x)).toBeLessThan(0.1);
    });
  });

  describe('Contract 2: Mathematical Continuous Snell Refraction Profile', () => {
    it('preserves complete spatial raytracing curve without collapsing to a scalar', () => {
      const profile = calculateRefractionProfile(
        40,
        30,
        SURFACE_PROFILES.convex_squircle,
        2.0,
        128
      );
      expect(profile.length).toBe(128);

      const maxAbs = calculateMaxAbsRefraction(profile);
      expect(maxAbs).toBeGreaterThan(0);

      // Continuous sampling returns smooth variations across [0..1]
      const r0 = sampleRefractionProfile(profile, 0.0);
      const rMid = sampleRefractionProfile(profile, 0.5);
      const r1 = sampleRefractionProfile(profile, 1.0);

      expect(typeof r0).toBe('number');
      expect(typeof rMid).toBe('number');
      expect(typeof r1).toBe('number');
    });
  });

  describe('Contract 3: Partition-of-Unity Coverage Basis Contract', () => {
    it('guarantees outer + inner + body = coverage across the entire spatial field', async () => {
      // 1. Numerical evaluation across 100 depth samples and varying coverage
      const bezel = 24;
      for (let i = 0; i <= 100; i++) {
        const depth = (i / 100) * bezel * 1.5;
        // Case A: Full interior coverage = 1.0
        const bFull = evaluatePartitionOfUnityBasis(depth, bezel, 1.0);
        expect(bFull.outer + bFull.inner + bFull.body).toBeCloseTo(1.0, 4);

        // Case B: Boundary subpixel AA coverage = 0.65
        const bSub = evaluatePartitionOfUnityBasis(depth, bezel, 0.65);
        expect(bSub.outer + bSub.inner + bSub.body).toBeCloseTo(0.65, 4);

        // Case C: Exterior coverage = 0.0
        const bZero = evaluatePartitionOfUnityBasis(depth, bezel, 0.0);
        expect(bZero.outer + bZero.inner + bZero.body).toBe(0.0);
      }

      // 2. Asset generation returns valid container without timeout
      const assets = await OpticalFieldGenerator.generate({
        geometry: {
          shape: 'roundedRect',
          width: 120,
          height: 60,
          radius: 20,
        },
        bezel: 16,
        thickness: 40,
        ior: 2.2,
      });

      expect(assets.width).toBe(120);
      expect(assets.height).toBe(60);
      expect(assets.physicalAmplitude).toBeGreaterThan(0);

      assets.dispose();
    });
  });


  describe('Contract 4: Strict Fast Path vs Slow Path Decoupling', () => {
    it('ensures pointermove interaction never triggers OpticalFieldGenerator rebuilds', async () => {
      const el = document.createElement('div');
      el.style.width = '200px';
      el.style.height = '60px';
      document.body.appendChild(el);

      const generateSpy = vi.spyOn(OpticalFieldGenerator, 'generate');

      const instance = createLiquidGlass(el, {
        interactive: true,
        refraction: 1.0,
      });

      const initialCalls = generateSpy.mock.calls.length;

      // Simulate rapid 60fps pointer movements (Fast Path)
      for (let i = 0; i < 20; i++) {
        const evt = new PointerEvent('pointermove', {
          clientX: 50 + i * 2,
          clientY: 20 + i,
          bubbles: true,
        });
        el.dispatchEvent(evt);
      }

      // Fast Path must update CSS variables without touching OpticalFieldGenerator
      expect(generateSpy.mock.calls.length).toBe(initialCalls);

      const lightAngle = el.style.getPropertyValue('--lg-light-angle');
      expect(lightAngle).toBeTruthy();
      expect(lightAngle).toContain('deg');

      generateSpy.mockRestore();
      instance.destroy();
      el.remove();
    });
  });

  describe('Contract 5: Platform Capability Tiering', () => {
    it('resolves capability based on matrix and supports explicit overrides', () => {
      // 1. Explicit override
      expect(CapabilityResolver.resolve({ override: 'material' })).toBe('material');
      expect(CapabilityResolver.resolve({ override: 'full' })).toBe('full');

      // 2. Auto resolve in Node/JSDOM defaults to full or material gracefully
      const autoCap = CapabilityResolver.resolve({ override: 'auto' });
      expect(['full', 'material']).toContain(autoCap);
    });

    it('always routes iOS platforms (including CriOS and Safari) to live material fallback', () => {
      const originalUa = navigator.userAgent;
      try {
        // iPhone Chrome (CriOS)
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0.6261.89 Mobile/15E148 Safari/604.1',
          configurable: true,
        });
        expect(CapabilityResolver.resolve()).toBe('material');

        // iPhone Mobile Safari
        Object.defineProperty(navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
          configurable: true,
        });
        expect(CapabilityResolver.resolve()).toBe('material');
      } finally {
        Object.defineProperty(navigator, 'userAgent', {
          value: originalUa,
          configurable: true,
        });
      }
    });
  });

  describe('Contract 6: Material Resolver & Size Adaptation', () => {
    it('adapts perceived thickness, blur, and sampling margins for button vs card', () => {
      // Button: 100x40
      const buttonMat = MaterialResolver.resolve(
        { blur: 4, thickness: 30, refraction: 1.0 },
        100,
        40
      );

      // Card: 500x300
      const cardMat = MaterialResolver.resolve(
        { blur: 4, thickness: 30, refraction: 1.0 },
        500,
        300
      );

      // Card should have larger shadow blur and perceived thickness due to size factor
      expect(cardMat.shadowBlur).toBeGreaterThan(buttonMat.shadowBlur);
      expect(cardMat.perceivedThickness).toBeGreaterThan(buttonMat.perceivedThickness);
      expect(cardMat.samplingMargin).toBeGreaterThan(0);
      expect(buttonMat.samplingMargin).toBeGreaterThan(0);
    });
  });

  describe('Contract 7: Optical Debug Mode Channel Inspection', () => {
    it('switches SVG output graph for vector, basis channels, and pure refraction', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const instance = createLiquidGlass(el, {
        debug: 'vector',
      });

      const filter = document.querySelector('svg filter');
      expect(filter?.innerHTML).toContain('result="FINAL_GLASS"');

      // Update to outer basis inspection
      instance.update({ debug: 'outer' });
      expect(filter?.innerHTML).toContain('BASIS_FIELD');

      // Update to pure refraction inspection
      instance.update({ debug: 'refraction' });
      expect(filter?.innerHTML).toContain('RGB_ALPHA_PRESERVED');

      instance.destroy();
      el.remove();
    });
  });
});

