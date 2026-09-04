import type { LiquidGlassUpdateOptions } from './glass';

export type RendererType = 'auto' | 'webgl' | 'svg';
export type ResolvedRendererType = Exclude<RendererType, 'auto'>;

/**
 * Public API: 外部调用者拿到的实例句柄
 */
export interface LiquidGlassInstance {
  /** 实际运行的物理渲染器 */
  readonly renderer: ResolvedRendererType;

  /** 实例是否已销毁 */
  readonly isDestroyed: boolean;

  /** 动态更新视觉与物理参数 (禁止篡改已选定的 renderer) */
  update(options: LiquidGlassUpdateOptions): void;

  /** 尺寸感知与同步重绘 */
  resize(): void;

  /** 释放所有 GPU 显存与 DOM 资源 (幂等) */
  destroy(): void;
}

/**
 * Internal Protocol: 底层引擎委托协议
 * 底层渲染包装器仅需实现该协议，无需对外暴露公共属性
 */
export interface RendererDelegate {
  update(options: LiquidGlassUpdateOptions): void;
  resize(): void;
  destroy(): void;
}
