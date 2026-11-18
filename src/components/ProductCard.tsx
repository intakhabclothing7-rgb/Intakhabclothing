import React from 'react';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
  onQuickAddToCart?: (product: Product, e: React.MouseEvent) => void;
  onQuickBuyNow?: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  isWishlisted,
  onToggleWishlist,
  onQuickAddToCart,
  onQuickBuyNow,
}) => {
  return (
    <div
      onClick={() => onSelect(product)}
      className="group cursor-pointer flex flex-col bg-white border border-stone-200/80 hover:border-[#EDE1C8] hover:shadow-xl transition-all duration-300"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full bg-stone-100 overflow-hidden">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-stone-400 uppercase tracking-widest">
            Intakhab
          </div>
        )}

        {/* Sold Out Badge */}
        {!product.inStock && (
          <div className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-xs text-white text-[10px] tracking-widest uppercase font-semibold px-2.5 py-1 z-10 shadow-sm">
            SOLD OUT
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => onToggleWishlist(product.id, e)}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 ${
            isWishlisted
              ? 'bg-[#EDE1C8] text-black border border-[#D8C7A5] shadow-md'
              : 'bg-white/80 hover:bg-white text-stone-700 hover:text-black shadow-sm'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`w-4 h-4 ${isWishlisted ? 'fill-current stroke-current' : 'stroke-[1.5]'}`}
          />
        </button>

        {/* Quick View Hover Bar */}
        <div className="hidden sm:flex absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-stone-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center">
          <span className="w-full py-2 bg-white/95 text-stone-900 text-[11px] font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#EDE1C8] hover:text-black transition-colors border border-transparent hover:border-[#D8C7A5]">
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          <h3 className="font-serif text-sm sm:text-lg text-stone-950 font-bold group-hover:text-black transition-colors leading-snug">
            {product.name}
          </h3>
          {product.urduName && (
            <p className="font-serif text-xs font-semibold text-[#B68637] mt-0.5">
              {product.urduName}
            </p>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-stone-100 space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <p className="font-bold text-sm sm:text-base text-stone-950 tabular-nums">
                Rs.{product.price.toLocaleString('en-PK')}
              </p>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-stone-600 font-medium line-through tabular-nums">
                  Rs.{product.originalPrice.toLocaleString('en-PK')}
                </span>
              )}
            </div>
            {!product.inStock && (
              <span className="text-[10px] sm:text-[11px] text-rose-700 font-bold whitespace-nowrap">
                Sold Out
              </span>
            )}
          </div>

          {(onQuickAddToCart || onQuickBuyNow) && (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {onQuickAddToCart && (
                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (product.inStock) onQuickAddToCart(product, e);
                  }}
                  className="min-h-[38px] px-2 py-2 border border-stone-900 bg-white hover:bg-stone-900 hover:text-white text-stone-950 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-3 h-3 shrink-0 hidden sm:inline" />
                  <span>Add to Cart</span>
                </button>
              )}

              {onQuickBuyNow && (
                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (product.inStock) onQuickBuyNow(product, e);
                  }}
                  className="min-h-[38px] px-2 py-2 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {product.inStock ? 'Buy Now' : 'Sold Out'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
