export interface GlassInteractionState {
  pointerX: number;
  pointerY: number;
  lightX: number;
  lightY: number;
  lightAngle: number;
  hover: number;
  pressed: number;
}

export interface InteractionControllerOptions {
  enabled?: boolean;
  springStiffness?: number;
  springDamping?: number;
  onUpdate?: (state: GlassInteractionState) => void;
}

/**
 * Framework-agnostic interaction controller with physical spring dynamics.
 * Operates strictly on the FAST PATH (CSS variables & GPU transforms at 60/120Hz).
 * NEVER triggers optical field regeneration.
 */
export class InteractionController {
  private element: HTMLElement;
  private options: InteractionControllerOptions;
  private isDestroyed = false;

  private stiffness = 0.18;
  private damping = 0.72;

  private state: GlassInteractionState = {
    pointerX: 0,
    pointerY: 0,
    lightX: 0,
    lightY: -1,
    lightAngle: 135,
    hover: 0,
    pressed: 0,
  };

  private targetPressed = 0;
  private targetHover = 0;
  private targetLightAngle = 135;
  private pressVelocity = 0;
  private hoverVelocity = 0;

  private animFrameId: number | null = null;

  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerEnter: (e: PointerEvent) => void;
  private boundPointerLeave: (e: PointerEvent) => void;
  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;
  private boundStepSpring: () => void;

  constructor(element: HTMLElement, options: InteractionControllerOptions = {}) {
    this.element = element;
    this.options = options;
    if (typeof options.springStiffness === 'number') this.stiffness = options.springStiffness;
    if (typeof options.springDamping === 'number') this.damping = options.springDamping;

    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerEnter = this.onPointerEnter.bind(this);
    this.boundPointerLeave = this.onPointerLeave.bind(this);
    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerUp = this.onPointerUp.bind(this);
    this.boundStepSpring = this.stepSpring.bind(this);

    if (this.options.enabled !== false) {
      this.attachListeners();
      this.commitToElement();
    }
  }

  private attachListeners(): void {
    const el = this.element;
    el.addEventListener('pointermove', this.boundPointerMove, { passive: true });
    el.addEventListener('pointerenter', this.boundPointerEnter, { passive: true });
    el.addEventListener('pointerleave', this.boundPointerLeave, { passive: true });
    el.addEventListener('pointerdown', this.boundPointerDown, { passive: true });
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', this.boundPointerUp, { passive: true });
    }
  }

  private detachListeners(): void {
    const el = this.element;
    el.removeEventListener('pointermove', this.boundPointerMove);
    el.removeEventListener('pointerenter', this.boundPointerEnter);
    el.removeEventListener('pointerleave', this.boundPointerLeave);
    el.removeEventListener('pointerdown', this.boundPointerDown);
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerup', this.boundPointerUp);
    }
    if (this.animFrameId != null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private updateLightVector(clientX: number, clientY: number): void {
    const rect = this.element.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;

    // Pointer coordinates relative to center [-1..1]
    const relX = ((clientX - rect.left) / width) * 2 - 1;
    const relY = ((clientY - rect.top) / height) * 2 - 1;

    this.state.pointerX = relX;
    this.state.pointerY = relY;

    // Specular light direction angle
    const angleRad = Math.atan2(relY, relX);
    let deg = (angleRad * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    this.targetLightAngle = deg;
    this.state.lightX = Math.cos(angleRad);
    this.state.lightY = Math.sin(angleRad);

    this.commitToElement();
    this.startSpringLoop();
  }

  private startSpringLoop(): void {
    if (this.isDestroyed || this.animFrameId != null) return;
    this.animFrameId = requestAnimationFrame(this.boundStepSpring);
  }

  private stepSpring(): void {
    this.animFrameId = null;
    if (this.isDestroyed) return;

    // 1. Spring physics for press depth
    const pressForce = -this.stiffness * (this.state.pressed - this.targetPressed) - this.damping * this.pressVelocity;
    this.pressVelocity += pressForce;
    this.state.pressed += this.pressVelocity;

    // 2. Spring physics for hover presence
    const hoverForce = -this.stiffness * (this.state.hover - this.targetHover) - this.damping * this.hoverVelocity;
    this.hoverVelocity += hoverForce;
    this.state.hover += this.hoverVelocity;

    // 3. Shortest arc angular smoothing for specular light angle
    let diff = this.targetLightAngle - this.state.lightAngle;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    this.state.lightAngle += diff * 0.25;

    this.commitToElement();

    // Check if simulation needs another frame
    const needsContinue =
      Math.abs(this.pressVelocity) > 0.001 ||
      Math.abs(this.state.pressed - this.targetPressed) > 0.002 ||
      Math.abs(this.hoverVelocity) > 0.001 ||
      Math.abs(this.state.hover - this.targetHover) > 0.002 ||
      Math.abs(diff) > 0.5;

    if (needsContinue) {
      this.animFrameId = requestAnimationFrame(this.boundStepSpring);
    }
  }

  private commitToElement(): void {
    if (this.isDestroyed) return;
    const s = this.element.style;
    s.setProperty('--lg-light-angle', `${Math.round(this.state.lightAngle)}deg`);
    s.setProperty('--lg-pointer-x', this.state.pointerX.toFixed(3));
    s.setProperty('--lg-pointer-y', this.state.pointerY.toFixed(3));
    s.setProperty('--lg-hover', Math.max(0, Math.min(1, this.state.hover)).toFixed(3));
    s.setProperty('--lg-pressed', Math.max(0, Math.min(1, this.state.pressed)).toFixed(3));

    this.options.onUpdate?.(this.state);
  }

  private onPointerMove(e: PointerEvent): void {
    this.targetHover = 1;
    this.updateLightVector(e.clientX, e.clientY);
  }

  private onPointerEnter(e: PointerEvent): void {
    this.targetHover = 1;
    this.updateLightVector(e.clientX, e.clientY);
  }

  private onPointerLeave(): void {
    this.targetHover = 0;
    this.targetPressed = 0;
    this.targetLightAngle = 135;
    this.startSpringLoop();
  }

  private onPointerDown(): void {
    this.targetPressed = 1;
    this.startSpringLoop();
  }

  private onPointerUp(): void {
    this.targetPressed = 0;
    this.startSpringLoop();
  }

  public getState(): Readonly<GlassInteractionState> {
    return this.state;
  }

  public updateInteraction(partial: Partial<GlassInteractionState>): void {
    if (typeof partial.pressed === 'number') this.targetPressed = partial.pressed;
    if (typeof partial.hover === 'number') this.targetHover = partial.hover;
    if (typeof partial.lightAngle === 'number') this.targetLightAngle = partial.lightAngle;
    Object.assign(this.state, partial);
    this.commitToElement();
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.detachListeners();
  }
}
