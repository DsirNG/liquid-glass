import * as THREE from 'three';
import type { NormalizedLiquidGlassOptions } from '../../types';
import { vertexShader, fragmentShader } from './shaders';

export interface WebGLGlassParams {
  x: number;
  y: number;
  width: number;
  height: number;
  options: NormalizedLiquidGlassOptions;
  lightAngle?: number;
  backgroundUrl?: string;
}

export class WebGLGlassRenderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;
  private textureLoader: THREE.TextureLoader;
  private currentBgUrl = '';
  private isDestroyed = false;
  private rafId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(
      Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)
    );

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.textureLoader = new THREE.TextureLoader();

    const initialW = typeof window !== 'undefined' ? window.innerWidth : 800;
    const initialH = typeof window !== 'undefined' ? window.innerHeight : 600;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(initialW, initialH) },
        uGlassCenter: { value: new THREE.Vector2(initialW / 2, initialH / 2) },
        uGlassSize: { value: new THREE.Vector2(300, 200) },
        uRadius: { value: 40 },
        uBezel: { value: 36 },
        uThickness: { value: 50 },
        uIOR: { value: 2.4 },
        uBlur: { value: 1.5 },
        uSpecular: { value: 0.6 },
        uTint: { value: new THREE.Color('#ffffff') },
        uTintAlpha: { value: 0.08 },
        uShadow: { value: 0.45 },
        uDispersion: { value: 0.035 },
        uLightDir: { value: new THREE.Vector2(0.5, -0.7) },
        uBgTex: { value: null },
        uBgAspect: { value: 1.5 },
        uHasBgTex: { value: false },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(this.mesh);

    this.handleResize(initialW, initialH);
    this.startLoop();
  }

  public setBackground(url: string): Promise<void> {
    if (this.currentBgUrl === url || !url || this.isDestroyed) return Promise.resolve();
    this.currentBgUrl = url;

    return new Promise((resolve) => {
      this.textureLoader.load(
        url,
        (tex) => {
          if (this.isDestroyed) {
            tex.dispose();
            return;
          }
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          this.material.uniforms.uBgTex.value = tex;
          this.material.uniforms.uBgAspect.value = (tex.image.width || 1) / (tex.image.height || 1);
          this.material.uniforms.uHasBgTex.value = true;
          resolve();
        },
        undefined,
        () => {
          if (!this.isDestroyed) {
            this.material.uniforms.uHasBgTex.value = false;
          }
          resolve();
        }
      );
    });
  }

  public update(params: WebGLGlassParams): void {
    if (this.isDestroyed) return;
    const u = this.material.uniforms;
    const { x, y, width, height, options, lightAngle, backgroundUrl } = params;

    if (backgroundUrl && backgroundUrl !== this.currentBgUrl) {
      this.setBackground(backgroundUrl);
    }

    u.uGlassCenter.value.set(x, y);
    u.uGlassSize.value.set(width, height);
    u.uRadius.value = options.radius ?? 40;
    u.uBezel.value = options.bezel ?? 36;
    u.uThickness.value = options.thickness ?? 50;
    u.uIOR.value = options.ior ?? 2.4;
    u.uBlur.value = options.blur ?? 1.5;
    u.uSpecular.value = options.specular ?? 0.6;
    u.uShadow.value = options.shadow ?? 0.45;
    u.uDispersion.value = options.dispersion ?? 0.035;

    if (options.tint) {
      try {
        u.uTint.value.set(options.tint);
      } catch {
        u.uTint.value.set('#ffffff');
      }
    }
    u.uTintAlpha.value = options.opacity ?? 0.08;

    if (lightAngle != null) {
      u.uLightDir.value.set(Math.cos(lightAngle), Math.sin(lightAngle));
    }
  }

  public handleResize(viewportWidth?: number, viewportHeight?: number): void {
    if (this.isDestroyed) return;
    const w = viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 800);
    const h = viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 600);
    this.renderer.setSize(w, h);
    this.material.uniforms.uResolution.value.set(w, h);
  }

  private startLoop(): void {
    const render = () => {
      if (this.isDestroyed) return;
      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(render);
    };
    render();
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.material.uniforms.uBgTex.value) {
      (this.material.uniforms.uBgTex.value as THREE.Texture).dispose();
    }

    this.mesh.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
