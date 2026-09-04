export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

export interface BackgroundItem {
  id: string;
  name: string;
  url: string;
}

export const DEFAULT_BACKGROUNDS: BackgroundItem[] = [
  { id: 'bg1', name: 'Interior Minimal', url: '/backgrounds/image1.png' },
  { id: 'bg2', name: 'Color Gradient', url: '/backgrounds/image2.png' },
  { id: 'bg3', name: 'Vibrant Mesh', url: '/backgrounds/image3.png' },
  { id: 'bg4', name: 'Neon Bloom', url: '/backgrounds/image4.png' },
];
