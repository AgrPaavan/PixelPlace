import { ColorDefinition } from './types';

export const GRID_SIZE = 100; // 100x100
export const PIXEL_RENDER_SIZE = 20; // Size of one pixel in the DOM (before zoom)
export const COOLDOWN_SECONDS = 10;

export const COLORS: ColorDefinition[] = [
  { id: 0, hex: '#ffffff', name: 'White', tailwindClass: 'bg-white' },
  { id: 1, hex: '#ef4444', name: 'Red', tailwindClass: 'bg-red-500' },
  { id: 2, hex: '#f97316', name: 'Orange', tailwindClass: 'bg-orange-500' },
  { id: 3, hex: '#eab308', name: 'Yellow', tailwindClass: 'bg-yellow-500' },
  { id: 4, hex: '#22c55e', name: 'Green', tailwindClass: 'bg-green-500' },
  { id: 5, hex: '#3b82f6', name: 'Blue', tailwindClass: 'bg-blue-500' },
  { id: 6, hex: '#a855f7', name: 'Purple', tailwindClass: 'bg-purple-500' },
  { id: 7, hex: '#1f2937', name: 'Black', tailwindClass: 'bg-gray-800' },
];

export const INITIAL_ZOOM = 1;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 5;
