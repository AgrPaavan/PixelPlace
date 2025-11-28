import React from 'react';
import { Check, X } from 'lucide-react';
import { COLORS } from '../constants';
import { Coordinates } from '../types';

interface ColorPickerProps {
  isOpen: boolean;
  selectedColorId: number;
  onSelectColor: (id: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  selectedPixel: Coordinates | null;
  cooldownRemaining: number;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  isOpen,
  selectedColorId,
  onSelectColor,
  onConfirm,
  onCancel,
  selectedPixel,
  cooldownRemaining
}) => {
  const isCoolingDown = cooldownRemaining > 0;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-end pointer-events-none transition-all duration-500 ease-spring ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
    >
      {/* Container with Glassmorphism */}
      <div className="pointer-events-auto mb-6 mx-4 p-4 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50 w-full max-w-md transform transition-all hover:scale-[1.02]">
        
        {/* Header: Coordinates & Context */}
        <div className="flex justify-between items-center mb-4 text-slate-300 text-sm font-medium px-2">
          <div className="flex items-center space-x-2">
            <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">
              {selectedPixel ? `X: ${selectedPixel.x}, Y: ${selectedPixel.y}` : 'No selection'}
            </span>
          </div>
          
          <button 
            onClick={onCancel}
            className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Color Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => onSelectColor(color.id)}
              className={`
                group relative h-10 w-full rounded-xl transition-all duration-300 transform
                ${selectedColorId === color.id ? 'scale-110 ring-2 ring-offset-2 ring-offset-slate-900 ring-white z-10' : 'hover:scale-105 hover:z-10'}
              `}
            >
              <div 
                className={`absolute inset-0 rounded-xl ${color.tailwindClass} shadow-inner opacity-90 group-hover:opacity-100`} 
              />
              {/* Active Indicator Dot */}
              {selectedColorId === color.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={onConfirm}
          disabled={isCoolingDown}
          className={`
            w-full py-3 rounded-xl font-bold text-white flex items-center justify-center space-x-2 transition-all duration-300
            ${isCoolingDown 
              ? 'bg-slate-700 cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0.5'
            }
          `}
        >
          {isCoolingDown ? (
            <span>Cooldown: {Math.ceil(cooldownRemaining / 1000)}s</span>
          ) : (
            <>
              <Check size={20} strokeWidth={3} />
              <span>Place Pixel</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ColorPicker;
