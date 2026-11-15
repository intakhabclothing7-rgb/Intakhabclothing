import React from 'react';
import { Heart, Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  isWishlisted,
  onToggleWishlist,
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
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-stone-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="w-full py-2 bg-white/95 text-stone-900 text-[11px] font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#EDE1C8] hover:text-black transition-colors border border-transparent hover:border-[#D8C7A5]">
            <Eye className="w-3.5 h-3.5" />
            <span>Select Options</span>
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
            {product.category}
          </span>
          <h3 className="font-serif text-base sm:text-lg text-stone-900 font-medium group-hover:text-black transition-colors leading-snug">
            {product.name}
          </h3>
          {product.urduName && (
            <p className="font-serif text-xs text-[#D4A456] mt-0.5">
              {product.urduName}
            </p>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-stone-100 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="font-medium text-sm sm:text-base text-stone-900 tabular-nums">
              Rs.{product.price.toLocaleString('en-PK')}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-stone-400 line-through tabular-nums">
                Rs.{product.originalPrice.toLocaleString('en-PK')}
              </span>
            )}
          </div>
          <span className="text-[11px] text-stone-500 font-light">
            {product.inStock ? 'Custom Lengths' : 'Sold Out'}
          </span>
        </div>
      </div>
    </div>
  );
};
