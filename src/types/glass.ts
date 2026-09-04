import type { RendererType, ResolvedRendererType } from './renderer';

export type GlassPreset = 'ios-like' | 'clear' | 'vivid' | 'heavy';
export type SurfaceShape = 'convex_squircle' | 'convex_circle' | 'concave' | 'lip';

/**
 * 纯光学材质参数配置 (不含 renderer / interactive / backgroundUrl 等控制平面与环境输入)
 */
export interface LiquidGlassMaterialOptions {
  blur?: number;
  opacity?: number;
  thickness?: number;
  ior?: number;
  refraction?: number;
  dispersion?: number;
  saturation?: number;
  tint?: string;
  radius?: number;
  bezel?: number;
  specular?: number;
  shadow?: number;
  shadowColor?: string;
  surfaceShape?: SurfaceShape;
}

/**
 * Public Core 创建参数 (Vanilla JS API)
 */
export interface LiquidGlassCreateOptions extends LiquidGlassMaterialOptions {
  /** 期望的物理渲染引擎类型 ('auto' | 'webgl' | 'svg') */
  renderer?: RendererType;

  /** 是否启用鼠标光照跟踪交互 */
  interactive?: boolean;

  /**
   * @deprecated Planned for removal after DOM-backdrop engine migration.
   * Legacy WebGL backdrop texture only.
   */
  backgroundUrl?: string;
}

/**
 * 保持向前兼容的公共类型别名
 */
export type LiquidGlassOptions = LiquidGlassCreateOptions;

/**
 * 动态材质更新参数 (严格仅允许变更光学材质参数，禁止运行时篡改引擎控制平面)
 */
export type LiquidGlassUpdateOptions = Partial<LiquidGlassMaterialOptions>;

/**
 * 归一化内部参数模型 (补齐所有材质默认值)
 */
export interface NormalizedLiquidGlassOptions extends Required<LiquidGlassMaterialOptions> {
  renderer: RendererType;
  interactive: boolean;
  backgroundUrl?: string;
}

/**
 * 引擎内部最终执行的物理配置模型 (renderer 为经裁决的物理事实)
 */
export interface ResolvedLiquidGlassOptions extends Omit<NormalizedLiquidGlassOptions, 'renderer'> {
  renderer: ResolvedRendererType;
}
