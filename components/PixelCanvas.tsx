import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GRID_SIZE, PIXEL_RENDER_SIZE, COLORS } from '../constants';
import { Coordinates } from '../types';

interface PixelCanvasProps {
  gridData: number[];
  selectedPixel: Coordinates | null;
  onPixelClick: (coords: Coordinates) => void;
  scale: number;
  offset: Coordinates;
  setOffset: (offset: Coordinates | ((prev: Coordinates) => Coordinates)) => void;
}

const PixelCanvas: React.FC<PixelCanvasProps> = ({
  gridData,
  selectedPixel,
  onPixelClick,
  scale,
  offset,
  setOffset
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Coordinates>({ x: 0, y: 0 });

  // Draw the grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1e293b'; // Slate-800 background for empty/grid
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pixels
    // We iterate through the flat array
    // x = index % GRID_SIZE
    // y = Math.floor(index / GRID_SIZE)
    for (let i = 0; i < gridData.length; i++) {
      const colorIndex = gridData[i];
      // Only draw if not default/background (assuming 0 is default white or we just draw everything)
      // Actually let's draw everything to be safe
      const x = (i % GRID_SIZE) * PIXEL_RENDER_SIZE;
      const y = Math.floor(i / GRID_SIZE) * PIXEL_RENDER_SIZE;
      
      ctx.fillStyle = COLORS[colorIndex]?.hex || '#ffffff';
      ctx.fillRect(x, y, PIXEL_RENDER_SIZE, PIXEL_RENDER_SIZE);
    }

    // Draw grid lines (optional, maybe just subtle overlay? Let's skip for performance or do it once)
    // For a cleaner look, no grid lines, just pixels.
    
    // Draw selection border if exists
    if (selectedPixel) {
      const x = selectedPixel.x * PIXEL_RENDER_SIZE;
      const y = selectedPixel.y * PIXEL_RENDER_SIZE;
      
      // We need to draw this "on top". Since we just repainted everything, we can draw directly.
      ctx.lineWidth = 2; // Thickness relative to canvas coordinate space
      ctx.strokeStyle = '#00ffff'; // Cyan highlight
      ctx.strokeRect(x + 1, y + 1, PIXEL_RENDER_SIZE - 2, PIXEL_RENDER_SIZE - 2);
      
      // Add a secondary inner stroke for contrast
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.strokeRect(x + 3, y + 3, PIXEL_RENDER_SIZE - 6, PIXEL_RENDER_SIZE - 6);
    }

  }, [gridData, selectedPixel]);

  // Handle Clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return; // Don't select if we were dragging

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate grid coordinates based on the *rendered* size (which is scaled by CSS)
    // The canvas internal resolution is GRID_SIZE * PIXEL_RENDER_SIZE
    // The CSS size is that * scale.
    // However, getBoundingClientRect returns the actual on-screen size.
    
    // An easier way: Map screen coordinates back to canvas internal coordinates.
    // The canvas is transformed by CSS `transform: scale(...) translate(...)` in the parent? 
    // No, we are implementing a custom pan/zoom container.
    
    // Let's assume the click event is on the canvas element itself. 
    // The pixel on the canvas internal bitmap is:
    // internalX = clickX / (currentDisplayedWidth / internalWidth)
    // But since we are handling pan/zoom via parent div + CSS transform on the canvas, 
    // `e.nativeEvent.offsetX` gives coordinate relative to the element node, unscaled by transform usually?
    // Actually, simple hit testing:
    
    const x = Math.floor(e.nativeEvent.offsetX / PIXEL_RENDER_SIZE);
    const y = Math.floor(e.nativeEvent.offsetY / PIXEL_RENDER_SIZE);

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      onPixelClick({ x, y });
    }
  };

  // Panning Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // If button 0 (left click) is pressed
    if (e.buttons !== 1) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      setIsDragging(true);
    }

    if (isDragging || Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-slate-900 cursor-move relative flex items-center justify-center touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          width: GRID_SIZE * PIXEL_RENDER_SIZE,
          height: GRID_SIZE * PIXEL_RENDER_SIZE,
        }}
        className="shadow-2xl shadow-black bg-slate-800"
      >
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * PIXEL_RENDER_SIZE}
          height={GRID_SIZE * PIXEL_RENDER_SIZE}
          onClick={handleCanvasClick}
          className="rendering-pixelated cursor-pointer" // CSS class for image-rendering: pixelated
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
};

export default PixelCanvas;
