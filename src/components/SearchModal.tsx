import React, { useState } from 'react';
import { X, Search, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.material.toLowerCase().includes(query.toLowerCase()) ||
          p.colour.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase()) ||
          (p.urduName && p.urduName.includes(query))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white shadow-2xl rounded-none border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center gap-3 bg-[#FAF6F2]">
          <Search className="w-5 h-5 text-black shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suits by name, velvet, karandi, raw silk, noir..."
            className="w-full text-sm sm:text-base bg-transparent border-none focus:outline-none text-stone-900 placeholder:text-stone-400"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
          {products.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-sm">
              <p>No products are currently listed.</p>
              <p className="text-xs text-stone-400 mt-1">
                New stitched suits will be available for search once added.
              </p>
            </div>
          ) : query.trim() === '' ? (
            <div className="space-y-4">
              <span className="text-[11px] font-bold tracking-widest uppercase text-stone-400 block">
                Browse Collection
              </span>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(products.map((p) => p.name))).slice(0, 6).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1.5 bg-[#FAF6F2] hover:bg-[#EDE1C8] hover:text-black text-stone-700 text-xs transition-colors border border-stone-200 hover:border-[#D8C7A5]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-sm">
              <p>No ensembles found matching "{query}".</p>
              <p className="text-xs text-stone-400 mt-1">
                Try a different suit name, fabric, or colour.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filtered.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    onSelectProduct(prod);
                    onClose();
                  }}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-[#FAF6F2] px-2 -mx-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {prod.images[0] ? (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-12 h-16 object-cover object-top border border-stone-200"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-stone-100 border border-stone-200 flex items-center justify-center text-[8px] text-stone-400 uppercase tracking-widest shrink-0">
                        Intakhab
                      </div>
                    )}
                    <div>
                      <h4 className="font-serif text-sm font-semibold text-stone-900 group-hover:text-black transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-stone-500">{prod.material}</p>
                      <span className="text-xs font-semibold text-black tabular-nums">
                        Rs.{prod.price.toLocaleString('en-PK')}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
