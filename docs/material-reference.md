# Liquid Glass material and examples

The material is a web implementation informed by the supplied iOS screenshots.
It does not use Apple's private rendering code. Public references studied:

- [Apple: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Kube: Liquid Glass in the Browser](https://kube.io/blog/liquid-glass-css-svg/)
- [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react)

No third-party source code or assets were copied into the implementation.

## Material model

Only the backdrop layer is filtered. Content, icons and controls remain sharp.
Scattering happens before displacement so blur works in both `rim` and `full`
coverage. The refracted edge and transmitted body use complementary weights,
avoiding dark seams or a thick opaque frame. A thin geometry mask, directional
reflections and inner shading provide a silhouette on flat white and black.
Dispersion uses nearby full-color displacement samples for subtle edge
softening. It does not split RGB channels; that produced dark rectangular
artifacts in Chromium's backdrop filter.

Component defaults use `full` coverage and the `concave` recessed profile.
`rim` remains available when a flat
center is wanted; `bezel` controls its curved edge width, including
values below 12px. `full` uses a continuous surface across the footprint, with its
width derived from the surface dimensions. Thickness/IOR use smooth limiting
at the sampling budget instead of a hard plateau. Saturation never affects text.
The `concave` surface profile is a smooth recessed bowl whose lateral
displacement reverses the direction of the convex profiles.

The TabBar retains its original oversized hover lens, pointer following and
press/release animation. The base backdrop and tint have a moving capsule
cutout so the inner lens sees the actual scene rather than a second blurred
material. Its center is clear; its curved edge carries the refraction.

## Integration

Import `@dinqorai/liquid-glass/style.css`. Components inherit foreground color;
set the surrounding scene's `color`, or override `--lg-foreground`. Primary/danger buttons use translucent color tints and inherit foreground contrast. The material has its own lighting,
but refraction naturally depends on real content behind it. An empty solid
background has no texture to displace.

All six examples in `playground/examples` are standalone Vue SFCs. The library
renders those files and imports the same files with `?raw` for copying. The
selected background and artwork settings are included in the copied CSS.
The image scene requires replacing `/backgrounds/image2.png` with a local image.

Development preview resolves package imports to source; package verification
uses an alias-free fixture:

```sh
pnpm build
pnpm exec vite build --config vite.config.consumer.ts
pnpm exec vite --config vite.config.consumer.ts
```

SVG backdrop displacement is used on compatible Chromium browsers. Safari,
iOS WebKit and Firefox select the CSS material backend with the same tint,
reflection, shadow and foreground rules. That path cannot reproduce live
background displacement; capability reporting must not call it full optics.
