import React from 'react';
import { Sliders } from 'lucide-react';

interface AdvancedFiltersProps {
  minVolume: number;
  onMinVolumeChange: (v: number) => void;
  maxVolatility: number;
  onMaxVolatilityChange: (v: number) => void;
  disabled?: boolean;
}

export function AdvancedFilters({
  minVolume,
  onMinVolumeChange,
  maxVolatility,
  onMaxVolatilityChange,
  disabled,
}: AdvancedFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Advanced Filters</h2>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Volume
          </label>
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={minVolume}
            onChange={(e) => onMinVolumeChange(parseInt(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-blue-500"
          />
          <div className="text-sm text-gray-600 mt-1">
            {minVolume} trades/24h
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Volatility
          </label>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={maxVolatility}
            onChange={(e) => onMaxVolatilityChange(parseInt(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-blue-500"
          />
          <div className="text-sm text-gray-600 mt-1">{maxVolatility}%</div>
        </div>
      </div>
    </div>
  );
}
