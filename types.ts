export interface Coordinates {
  x: number;
  y: number;
}

export interface PixelData {
  colorIndex: number;
  timestamp: number;
}

// 100x100 grid = 10,000 pixels
export type GridState = number[];

export interface ColorDefinition {
  id: number;
  hex: string;
  name: string;
  tailwindClass: string;
}

export interface PixelRecord {
  x: number;
  y: number;
  color_index: number;
  created_at?: string;
}
