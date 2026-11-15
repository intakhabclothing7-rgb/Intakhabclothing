import React, { useState } from 'react';
import { X, Ruler, HelpCircle } from 'lucide-react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({ isOpen, onClose }) => {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  if (!isOpen) return null;

  const measurements = [
    { size: 'XS', bust: [36, 91], waist: [34, 86], hips: [38, 96], shoulder: [14, 35.5], sleeve: [21.5, 54.6], pantWaist: ['26-28', '66-71'] },
    { size: 'S', bust: [38, 96.5], waist: [36, 91.4], hips: [41, 104], shoulder: [14.5, 36.8], sleeve: [22, 55.8], pantWaist: ['28-30', '71-76'] },
    { size: 'M', bust: [41, 104], waist: [39, 99], hips: [44, 111.7], shoulder: [15, 38.1], sleeve: [22.5, 57.1], pantWaist: ['31-33', '78-84'] },
    { size: 'L', bust: [44, 111.7], waist: [42, 106.6], hips: [48, 122], shoulder: [15.5, 39.3], sleeve: [23, 58.4], pantWaist: ['34-36', '86-91'] },
    { size: 'XL', bust: [47, 119.3], waist: [45, 114.3], hips: [52, 132], shoulder: [16.5, 41.9], sleeve: [23.5, 59.6], pantWaist: ['37-40', '94-101'] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-[#FAF6F2] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Ruler className="w-5 h-5 text-black" />
            <div>
              <h3 className="font-serif text-lg font-semibold text-black">
                Intakhab Sizing Guide
              </h3>
              <p className="text-xs text-stone-500">Standard Prêt & Custom Length Chart</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Unit Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500">
              All garment measurements are ready-to-wear stitched sizes.
            </span>
            <div className="flex items-center gap-1 bg-[#FAF6F2] p-1 rounded-lg border border-stone-200">
              <button
                onClick={() => setUnit('inches')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  unit === 'inches' ? 'bg-[#EDE1C8] text-black font-semibold border border-[#D8C7A5] shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Inches (")
              </button>
              <button
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  unit === 'cm' ? 'bg-[#EDE1C8] text-black font-semibold border border-[#D8C7A5] shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EDE1C8]/40 text-black font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Bust</th>
                  <th className="py-3 px-3">Waist</th>
                  <th className="py-3 px-3">Hips</th>
                  <th className="py-3 px-3">Shoulder</th>
                  <th className="py-3 px-3">Sleeve</th>
                  <th className="py-3 px-3">Pant Waist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {measurements.map((row) => (
                  <tr key={row.size} className="hover:bg-stone-50/80">
                    <td className="py-3 px-3 font-bold text-stone-900">{row.size}</td>
                    <td className="py-3 px-3 tabular-nums">{unit === 'inches' ? `${row.bust[0]}"` : `${row.bust[1]}`}</td>
                    <td className="py-3 px-3 tabular-nums">{unit === 'inches' ? `${row.waist[0]}"` : `${row.waist[1]}`}</td>
                    <td className="py-3 px-3 tabular-nums">{unit === 'inches' ? `${row.hips[0]}"` : `${row.hips[1]}`}</td>
                    <td className="py-3 px-3 tabular-nums">{unit === 'inches' ? `${row.shoulder[0]}"` : `${row.shoulder[1]}`}</td>
                    <td className="py-3 px-3 tabular-nums">{unit === 'inches' ? `${row.sleeve[0]}"` : `${row.sleeve[1]}`}</td>
                    <td className="py-3 px-3 tabular-nums">{unit === 'inches' ? `${row.pantWaist[0]}"` : `${row.pantWaist[1]}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lengths Explanation */}
          <div className="p-4 bg-[#FAF6F2] rounded-lg border border-stone-200/80 space-y-2 text-xs text-stone-700">
            <div className="flex items-center gap-2 font-medium text-black">
              <HelpCircle className="w-4 h-4" />
              <span>Custom Length Customization Options</span>
            </div>
            <p className="leading-relaxed">
              <strong>Shirt Length:</strong> Choose from 42", 44", 46", or 48" (Standard). The standard length provides an elegant knee-to-calf drape depending on your height.
            </p>
            <p className="leading-relaxed">
              <strong>Pant Length:</strong> Choose from 32", 34", 36" (Standard), or 38" for tailored cigarette or wide-leg culottes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-stone-900 text-white text-xs font-semibold tracking-wider uppercase hover:bg-[#EDE1C8] hover:text-black transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
