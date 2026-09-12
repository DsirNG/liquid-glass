import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createLiquidGlass } from '../core';
import type {
  FallbackPolicy,
  LiquidGlassCreateOptions,
  LiquidGlassInstance,
  LiquidGlassMaterialOptions,
  LiquidGlassStatus,
  LiquidGlassUpdateOptions,
} from '../types';

const MATERIAL_OPTION_KEYS: ReadonlyArray<keyof LiquidGlassMaterialOptions> = [
  'blur',
  'opacity',
  'thickness',
  'ior',
  'refraction',
  'dispersion',
  'saturation',
  'tint',
  'radius',
  'bezel',
  'specular',
  'shadow',
  'shadowColor',
  'surfaceShape',
  'surfaceProfile',
  'materialPreset',
  'quality',
  'ambientLuma',
  'shape',
  'capability',
  'debug',
  'borderMode',
  'colorBleed',
  'refractionCoverage',
];

const CONSUMED_PROP_KEYS = new Set<string>([
  'children',
  'options',
  'interactive',
  'fallbackPolicy',
  'className',
  'style',
  ...MATERIAL_OPTION_KEYS,
]);

type CreationOnlySnapshot = Pick<LiquidGlassCreateOptions, 'fallbackPolicy' | 'interactive'>;

const CREATION_ONLY_KEYS = new Set<keyof CreationOnlySnapshot>(['fallbackPolicy', 'interactive']);

/** Public React props: Core material options plus ordinary div attributes. */
export interface LiquidGlassProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>, LiquidGlassMaterialOptions {
  children?: ReactNode;
  /** Enables pointer-driven optical interaction. */
  interactive?: boolean;
  /** Controls capability degradation and runtime recovery behavior. */
  fallbackPolicy?: FallbackPolicy;
  /** Compatibility entry point for base material options. */
  options?: LiquidGlassMaterialOptions;
}

/** Imperative React ref exposed by the adapter. */
export interface LiquidGlassHandle {
  readonly instance: LiquidGlassInstance | null;
  getStatus(): Readonly<LiquidGlassStatus> | undefined;
  update(options: LiquidGlassUpdateOptions): void;
  resize(): void;
  destroy(): void;
}

function resolveCreateOptions(props: LiquidGlassProps): LiquidGlassCreateOptions {
  const resolved: LiquidGlassCreateOptions = {
    ...props.options,
    interactive: props.interactive ?? true,
  };
  const mutableResolved = resolved as Record<string, unknown>;
  const sourceProps = props as unknown as Record<string, unknown>;

  for (const key of MATERIAL_OPTION_KEYS) {
    const value = sourceProps[key];
    if (value !== undefined) mutableResolved[key] = value;
  }

  if (props.fallbackPolicy !== undefined) resolved.fallbackPolicy = props.fallbackPolicy;
  return resolved;
}

function extractUpdateOptions(
  options: LiquidGlassCreateOptions | undefined
): LiquidGlassUpdateOptions {
  if (!options) return {};

  const updateOptions: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (!CREATION_ONLY_KEYS.has(key as keyof CreationOnlySnapshot)) {
      updateOptions[key] = value;
    }
  }
  return updateOptions as LiquidGlassUpdateOptions;
}

function diffUpdateOptions(
  previous: LiquidGlassUpdateOptions,
  next: LiquidGlassUpdateOptions
): LiquidGlassUpdateOptions {
  const patch: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);

  for (const key of keys) {
    const previousValue = (previous as Record<string, unknown>)[key];
    const nextValue = (next as Record<string, unknown>)[key];
    if (!Object.is(previousValue, nextValue)) patch[key] = nextValue;
  }

  return patch as LiquidGlassUpdateOptions;
}

function extractCreationOnlyOptions(
  options: LiquidGlassCreateOptions | undefined
): CreationOnlySnapshot {
  return {
    fallbackPolicy: options?.fallbackPolicy,
    interactive: options?.interactive,
  };
}

function warnForCreationOnlyChanges(
  previous: CreationOnlySnapshot,
  next: CreationOnlySnapshot
): void {
  if (!import.meta.env?.DEV) return;

  for (const key of CREATION_ONLY_KEYS) {
    if (!Object.is(previous[key], next[key])) {
      console.warn(
        `[LiquidGlass/React] "${key}" is a creation-only option; remount LiquidGlass to apply the new value.`
      );
    }
  }
}

function getDomProps(props: LiquidGlassProps): HTMLAttributes<HTMLDivElement> {
  const domProps = { ...props } as Record<string, unknown>;
  for (const key of CONSUMED_PROP_KEYS) delete domProps[key];
  return domProps as HTMLAttributes<HTMLDivElement>;
}

/** React adapter for the DOM-native Liquid Glass Core API. */
export const LiquidGlass = forwardRef<LiquidGlassHandle, LiquidGlassProps>(
  function LiquidGlass(props, forwardedRef) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const instanceRef = useRef<LiquidGlassInstance | null>(null);
    const previousUpdateOptionsRef = useRef<LiquidGlassUpdateOptions>({});
    const previousCreationOnlyOptionsRef = useRef<CreationOnlySnapshot>({});
    const resolvedOptions = useMemo(
      () => resolveCreateOptions(props),
      [
        props.options,
        props.interactive,
        props.fallbackPolicy,
        props.blur,
        props.opacity,
        props.thickness,
        props.ior,
        props.refraction,
        props.dispersion,
        props.saturation,
        props.tint,
        props.radius,
        props.bezel,
        props.specular,
        props.shadow,
        props.shadowColor,
        props.surfaceShape,
        props.surfaceProfile,
        props.materialPreset,
        props.quality,
        props.ambientLuma,
        props.shape,
        props.capability,
        props.debug,
        props.borderMode,
        props.colorBleed,
        props.refractionCoverage,
      ]
    );

    const destroyInstance = useCallback(() => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
      previousUpdateOptionsRef.current = {};
      previousCreationOnlyOptionsRef.current = {};
    }, []);

    useImperativeHandle(
      forwardedRef,
      () => ({
        get instance() {
          return instanceRef.current;
        },
        getStatus: () => instanceRef.current?.status,
        update: (options) => instanceRef.current?.update(options),
        resize: () => instanceRef.current?.resize(),
        destroy: destroyInstance,
      }),
      [destroyInstance]
    );

    useEffect(() => {
      const element = containerRef.current;
      if (!element || instanceRef.current) return;

      try {
        const instance = createLiquidGlass(element, resolvedOptions);
        instanceRef.current = instance;
        previousUpdateOptionsRef.current = extractUpdateOptions(resolvedOptions);
        previousCreationOnlyOptionsRef.current = extractCreationOnlyOptions(resolvedOptions);
      } catch (error) {
        console.error('[LiquidGlass/React] Failed to initialize instance:', error);
      }

      return destroyInstance;
      // Creation is intentionally mount-only. Material prop changes use the patch effect below.
    }, [destroyInstance]);

    useEffect(() => {
      const instance = instanceRef.current;
      if (!instance) return;

      const nextUpdateOptions = extractUpdateOptions(resolvedOptions);
      const nextCreationOnlyOptions = extractCreationOnlyOptions(resolvedOptions);
      warnForCreationOnlyChanges(previousCreationOnlyOptionsRef.current, nextCreationOnlyOptions);

      const patch = diffUpdateOptions(previousUpdateOptionsRef.current, nextUpdateOptions);
      if (Object.keys(patch).length > 0) instance.update(patch);

      previousUpdateOptionsRef.current = nextUpdateOptions;
      previousCreationOnlyOptionsRef.current = nextCreationOnlyOptions;
    }, [resolvedOptions]);

    const { children, className, style } = props;
    const domProps = getDomProps(props);

    return createElement(
      'div',
      {
        ...domProps,
        ref: containerRef,
        className: ['lg-root', className].filter(Boolean).join(' '),
        style,
      },
      createElement('div', { className: 'lg-content' }, children)
    );
  }
);

LiquidGlass.displayName = 'LiquidGlass';
