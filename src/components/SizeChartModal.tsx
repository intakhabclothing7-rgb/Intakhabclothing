import React, { useState } from 'react';
import { X, Ruler, HelpCircle } from 'lucide-react';
import {
  COORD_SIZE_CHART_COLUMNS,
  SIZE_CHART_ROWS,
  formatMeasurement,
} from '../data/sizeChart';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({ isOpen, onClose }) => {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAF6F2] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Ruler className="w-5 h-5 text-black" />
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-black tracking-wide uppercase">
                Size Chart — Co-ord Set
              </h3>
              <p className="text-xs text-stone-500">
                Intakhab Ready-to-Wear Garment Measurements ({unit === 'inches' ? 'Inches' : 'Centimeters'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size chart"
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Unit Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-stone-600 uppercase tracking-wider">
              All measurements are in {unit === 'inches' ? 'inches' : 'centimeters'}.
            </span>
            <div className="flex items-center gap-1 bg-[#FAF6F2] p-1 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => setUnit('inches')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  unit === 'inches'
                    ? 'bg-[#EDE1C8] text-black font-semibold border border-[#D8C7A5] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Inches (&quot;)
              </button>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  unit === 'cm'
                    ? 'bg-[#EDE1C8] text-black font-semibold border border-[#D8C7A5] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          {/* Exact Co-ord Set Size Chart Table (matches reference chart) */}
          <div className="overflow-x-auto border border-[#D8C7A5] rounded-lg">
            <table className="w-full text-xs sm:text-sm text-center border-collapse">
              <thead className="bg-[#B8A394] text-white font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 sm:px-4 text-left border-r border-white/25 min-w-[140px]">
                    Measurements ({unit === 'inches' ? 'inches' : 'cm'})
                  </th>
                  {COORD_SIZE_CHART_COLUMNS.map((col) => (
                    <th
                      key={col.size}
                      className="py-3 px-3 sm:px-4 border-r last:border-r-0 border-white/25 min-w-[54px]"
                    >
                      {col.size}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-[#FAF6F2]/70">
                {SIZE_CHART_ROWS.map((row) => (
                  <tr key={row.key} className="hover:bg-[#EDE1C8]/30 transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-left font-semibold text-stone-900 border-r border-stone-200 bg-white/70">
                      {row.label}
                    </td>
                    {COORD_SIZE_CHART_COLUMNS.map((col) => (
                      <td
                        key={`${row.key}-${col.size}`}
                        className="py-3 px-3 sm:px-4 tabular-nums font-medium text-stone-800 border-r last:border-r-0 border-stone-200"
                      >
                        {formatMeasurement(col[row.key], unit)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reference Guide Note */}
          <div className="p-4 bg-[#FAF6F2] rounded-lg border border-stone-200/80 space-y-2 text-xs text-stone-700">
            <div className="flex items-center gap-2 font-semibold text-black uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>How to Choose Your Size</span>
            </div>
            <p className="leading-relaxed">
              For the perfect fit, please compare your garment measurements with our{' '}
              <strong>Co-ord Set Size Chart</strong> above before placing your order.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-stone-600">
              <span>• <strong>Shirt:</strong> Shoulder, Chest, Hip &amp; Shirt Length</span>
              <span>• <strong>Trouser:</strong> Trouser Thigh &amp; Trouser Waist</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-stone-900 text-white text-xs font-semibold tracking-wider uppercase hover:bg-[#EDE1C8] hover:text-black transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
