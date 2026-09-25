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

export interface SolidColorItem {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_SOLID_COLORS: SolidColorItem[] = [
  { id: 'black', name: 'Pure Black', color: '#000000' },
  { id: 'obsidian', name: 'Obsidian Noir', color: '#0b0d14' },
  { id: 'navy', name: 'Midnight Navy', color: '#0f172a' },
  { id: 'slate', name: 'Deep Slate', color: '#1e293b' },
  { id: 'indigo', name: 'Royal Indigo', color: '#2e1065' },
  { id: 'blue', name: 'Electric Azure', color: '#1d4ed8' },
  { id: 'emerald', name: 'Emerald Forest', color: '#064e3b' },
  { id: 'crimson', name: 'Dark Crimson', color: '#450a0a' },
  { id: 'studio', name: 'Studio Gray', color: '#e2e8f0' },
  { id: 'white', name: 'Pure White', color: '#ffffff' },
];
