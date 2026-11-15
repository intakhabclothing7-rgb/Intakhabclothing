import React from 'react';
import { X, Heart, Trash2, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistIds: string[];
  products: Product[];
  onRemoveWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistIds,
  products,
  onRemoveWishlist,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-black fill-black" />
            <h2 className="font-semibold text-sm sm:text-base tracking-wider uppercase text-stone-900">
              YOUR WISHLIST ({wishlistedProducts.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {wishlistedProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center text-stone-400">
                <Heart className="w-8 h-8 stroke-[1.2]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-stone-700 font-medium">Your wishlist is empty</p>
                <p className="text-xs text-stone-400">
                  Save your favorite stitched suits by tapping the heart icon.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full max-w-xs py-3 px-6 bg-stone-900 hover:bg-[#EDE1C8] hover:text-black text-white text-xs font-semibold tracking-widest uppercase transition-colors"
              >
                EXPLORE SUITS
              </button>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-stone-100">
              {wishlistedProducts.map((product) => (
                <div key={product.id} className="pt-4 first:pt-0 flex gap-4 items-start">
                  <div
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="w-20 h-26 bg-stone-100 shrink-0 border border-stone-200 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex items-start justify-between">
                      <h4
                        onClick={() => {
                          onSelectProduct(product);
                          onClose();
                        }}
                        className="font-serif text-sm font-semibold text-stone-900 leading-snug cursor-pointer hover:text-black transition-colors"
                      >
                        {product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveWishlist(product.id)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-stone-500 text-[11px]">{product.material}</p>
                    <p className="font-semibold text-sm text-stone-900 tabular-nums pt-1">
                      Rs.{product.price.toLocaleString('en-PK')}
                    </p>

                    <button
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className="mt-2 w-full py-2 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black text-[11px] font-semibold tracking-wider uppercase border border-[#D8C7A5] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Choose Size & Add</span>
                      <ArrowRight className="w-3.5 h-3.5 text-black" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
