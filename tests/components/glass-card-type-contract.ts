import type { GlassCardProps, GlassCardSlots } from '../../src/vue';

const options: GlassCardProps = {
  size: 'md',
  disabled: false,
  interactive: true,
  fallbackPolicy: 'auto',
  options: { blur: 4 },
  radius: 24,
  refraction: 0.8,
  tint: '#ffffff',
};

const slots: GlassCardSlots = {
  header: () => 'Header',
  default: () => 'Body',
  footer: () => 'Footer',
};

void options;
void slots;

// @ts-expect-error GlassCard must not introduce parallel glass terminology.
const invalidOptions: GlassCardProps = { glassStrength: 0.5 };
void invalidOptions;
