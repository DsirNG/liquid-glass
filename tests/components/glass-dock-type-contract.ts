import type {
  GlassDockItem,
  GlassDockItemSlotProps,
  GlassDockOrientation,
  GlassDockProps,
  GlassDockSize,
  GlassDockSlots,
} from '../../src/vue';

const items: readonly GlassDockItem[] = [
  { value: 'home', label: 'Home' },
  { value: 2, label: 'Settings', disabled: true },
];

const props: GlassDockProps = {
  items,
  modelValue: 'home',
  size: 'md',
  orientation: 'horizontal',
  disabled: false,
  interactive: true,
  fallbackPolicy: 'auto',
  options: { blur: 4, radius: 20 },
  refraction: 0.8,
  tint: '#ffffff',
};

const size: GlassDockSize = 'lg';
const orientation: GlassDockOrientation = 'vertical';

const slotProps: GlassDockItemSlotProps = {
  item: items[0],
  index: 0,
  active: true,
  hovered: false,
  focused: false,
  disabled: false,
};

const slots: GlassDockSlots = {
  item: ({ item, active, hovered, focused, disabled }) =>
    `${item.label}:${active}:${hovered}:${focused}:${disabled}`,
};

void props;
void size;
void orientation;
void slotProps;
void slots;

// @ts-expect-error GlassDock item values are strings or numbers only.
const invalidItem: GlassDockItem = { value: true, label: 'Invalid' };
void invalidItem;

// @ts-expect-error GlassDock must not introduce parallel glass terminology.
const invalidProps: GlassDockProps = { items, glassStrength: 0.5 };
void invalidProps;

const invalidCreationOptions: GlassDockProps = {
  items,
  // @ts-expect-error `options` is intentionally material-only.
  options: { fallbackPolicy: 'auto' },
};
void invalidCreationOptions;
