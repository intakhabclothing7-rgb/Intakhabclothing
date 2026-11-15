import React from 'react';
import { Menu, Search, ShoppingBag, Heart } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenSearch: () => void;
  onOpenMenu: () => void;
  onSelectCategory: (category: string) => void;
  onGoHome?: () => void;
  selectedCategory: string;
  categoriesList?: { label: string; value: string }[];
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onOpenMenu,
  onSelectCategory,
  onGoHome,
  selectedCategory,
  categoriesList,
}) => {
  const categories =
    categoriesList && categoriesList.length > 0
      ? categoriesList
      : [
          { label: 'ALL COLLECTIONS', value: 'All' },
          { label: 'NEW ARRIVALS', value: 'New Arrivals' },
          { label: 'BEST SELLERS', value: 'Best Sellers' },
        ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Left Zone: Hamburger & Search */}
          <div className="flex items-center gap-3 sm:gap-4 w-1/4">
            <button
              onClick={onOpenMenu}
              className="p-2 -ml-2 text-stone-700 hover:text-black transition-colors focus:outline-none"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6 stroke-[1.5]" />
            </button>
            <button
              onClick={onOpenSearch}
              className="p-2 text-stone-700 hover:text-black transition-colors focus:outline-none flex items-center gap-1.5"
              aria-label="Search Collection"
            >
              <Search className="w-5 h-5 stroke-[1.5]" />
              <span className="hidden md:inline text-xs tracking-wider uppercase text-stone-500">Search</span>
            </button>
          </div>

          {/* Center Zone: Exact Intakhab Logo */}
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (onGoHome) {
                  onGoHome();
                } else {
                  onSelectCategory('All');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-block group py-1"
            >
              {/* Exact Intakhab Calligraphy Logo */}
              <img
                src="/assets/intakhab_calligraphy_logo.png"
                alt="Intakhab - انتخاب"
                decoding="async"
                fetchPriority="high"
                className="h-11 sm:h-13 md:h-15 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </a>
          </div>

          {/* Right Zone: Wishlist & Cart */}
          <div className="flex items-center justify-end gap-3 sm:gap-5 w-1/4">
            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-stone-700 hover:text-black transition-colors focus:outline-none"
              aria-label="View Wishlist"
            >
              <Heart className="w-5 h-5 stroke-[1.5]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#EDE1C8] text-black border border-[#D8C7A5] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Bag Button (matching reference Screenshot 6 & 10) */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-stone-800 hover:text-black transition-colors focus:outline-none flex items-center gap-1.5"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                <span className="absolute -top-1.5 -right-1.5 bg-[#EDE1C8] text-black border border-[#D8C7A5] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              </div>
              <span className="hidden sm:inline text-xs font-medium tracking-wider text-stone-600">
                ({cartCount})
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Category Navigation */}
        <nav className="hidden md:flex items-center justify-center gap-8 py-3 border-t border-stone-100 text-xs tracking-widest font-medium uppercase text-stone-600">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onSelectCategory(cat.value)}
              className={`transition-colors py-1 relative ${
                selectedCategory === cat.value
                  ? 'text-black font-semibold'
                  : 'hover:text-black'
              }`}
            >
              {cat.label}
              {selectedCategory === cat.value && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#EDE1C8]" />
              )}
            </button>
          ))}
          <a
            href="#contact"
            className="hover:text-black transition-colors py-1"
          >
            CONTACT US
          </a>
        </nav>
      </div>
    </header>
  );
};
