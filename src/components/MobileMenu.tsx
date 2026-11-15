import React from 'react';
import { X, ChevronRight, Phone, Mail } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
  onOpenSizeChart: () => void;
  categoriesList?: { label: string; value: string }[];
  whatsappNumber?: string;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  selectedCategory,
  onOpenSizeChart,
  categoriesList,
  whatsappNumber = '+92 325 6253921',
}) => {
  if (!isOpen) return null;

  const cleanWaDigits = whatsappNumber.replace(/[^0-9]/g, '') || '923256253921';

  const navItems =
    categoriesList && categoriesList.length > 0
      ? categoriesList
      : [
          { label: 'ALL COLLECTIONS', value: 'All' },
          { label: 'NEW ARRIVALS', value: 'New Arrivals' },
          { label: 'BEST SELLERS', value: 'Best Sellers' },
        ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-[#FAF6F2]">
            <img
              src="/assets/intakhab_calligraphy_logo.png"
              alt="Intakhab - انتخاب"
              className="h-10 w-auto object-contain"
            />
            <button
              onClick={onClose}
              className="p-2 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="py-4">
            <div className="px-5 py-2 text-[10px] uppercase font-bold tracking-widest text-black">
              Collections
            </div>
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  onSelectCategory(item.value);
                  onClose();
                }}
                className={`w-full px-5 py-3.5 flex items-center justify-between text-xs tracking-wider uppercase text-left transition-colors ${
                  selectedCategory === item.value
                    ? 'bg-[#EDE1C8]/40 text-black font-bold border-l-4 border-[#EDE1C8]'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>
            ))}

            <div className="border-t border-stone-100 my-3" />

            <div className="px-5 py-2 text-[10px] uppercase font-bold tracking-widest text-stone-400">
              Customer Services
            </div>
            <button
              onClick={() => {
                onOpenSizeChart();
                onClose();
              }}
              className="w-full px-5 py-3 flex items-center justify-between text-xs text-stone-700 hover:bg-stone-50"
            >
              <span>Size Guide & Chart</span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
            <a
              href="#contact"
              onClick={onClose}
              className="w-full px-5 py-3 flex items-center justify-between text-xs text-stone-700 hover:bg-stone-50"
            >
              <span>Contact & Boutique Info</span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </a>
          </div>
        </div>

        {/* Footer Contact Info */}
        <div className="p-5 bg-[#FAF6F2] border-t border-stone-200 text-xs text-stone-600 space-y-3">
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-black shrink-0" />
            <a href={`tel:+${cleanWaDigits}`} className="hover:underline">
              {whatsappNumber}
            </a>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-black shrink-0" />
            <a href="mailto:intakhabclothing7@gmail.com" className="hover:underline text-[11px]">
              intakhabclothing7@gmail.com
            </a>
          </div>

          <a
            href={`https://wa.me/${cleanWaDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 w-full py-2.5 px-3 bg-[#25D366] text-white rounded-lg flex items-center justify-center gap-2 font-medium text-xs hover:bg-[#20ba59] transition-colors"
          >
            <WhatsAppIcon variant="glyph" className="w-4.5 h-4.5" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
