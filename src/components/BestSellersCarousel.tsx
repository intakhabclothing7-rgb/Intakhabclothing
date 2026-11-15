import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { BestSellerEntry, Product } from '../types';

interface BestSellersCarouselProps {
  entries?: BestSellerEntry[];
  heading?: string;
  viewAllLabel?: string;
  onViewAll: () => void;
  onSelectCategory: (category: string) => void;
  onSelectProduct?: (product: Product) => void;
  onQuickAddToCart?: (product: Product, e: React.MouseEvent) => void;
  onQuickBuyNow?: (product: Product, e: React.MouseEvent) => void;
}

export const BestSellersCarousel: React.FC<BestSellersCarouselProps> = ({
  entries = [],
  heading = 'BEST SELLERS',
  viewAllLabel = 'View all',
  onViewAll,
  onSelectCategory,
  onSelectProduct,
  onQuickAddToCart,
  onQuickBuyNow,
}) => {
  const slides = entries.filter((e) => e.isActive !== false && (e.customImageUrl || e.product?.images?.[0]));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mountedIndices, setMountedIndices] = useState<number[]>(() =>
    slides.length > 1 ? [0, 1] : [0]
  );
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  useEffect(() => {
    if (slides.length === 0) return;
    const nextIdx = (currentIndex + 1) % slides.length;
    setMountedIndices((prev) =>
      prev.includes(currentIndex) && prev.includes(nextIdx)
        ? prev
        : Array.from(new Set([...prev, currentIndex, nextIdx]))
    );
  }, [currentIndex, slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentSlide = slides[currentIndex];

  const handleSlideClick = (entry: BestSellerEntry) => {
    if (entry.product && onSelectProduct) {
      onSelectProduct(entry.product);
    } else {
      onSelectCategory('Best Sellers');
    }
  };

  return (
    <section
      id="best-sellers"
      className="py-10 sm:py-14 bg-white border-b border-stone-200"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-medium tracking-tight">
            {heading}
          </h2>

          <button
            onClick={onViewAll}
            className="py-1.5 px-4 sm:px-5 border border-stone-900 text-stone-900 hover:bg-[#EDE1C8] hover:border-[#EDE1C8] hover:text-black text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>{viewAllLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {slides.length === 0 || !currentSlide ? (
          <div className="py-12 px-6 text-center bg-[#FAF6F2] border border-stone-200">
            <p className="font-serif text-lg sm:text-xl text-stone-800">
              Best Sellers Coming Soon
            </p>
            <p className="text-xs sm:text-sm text-stone-500 mt-1.5">
              Our signature best-selling ensembles will be listed here soon.
            </p>
          </div>
        ) : (
          <>
            <div
              className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-stone-100 overflow-hidden cursor-pointer select-none group shadow-md"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => handleSlideClick(currentSlide)}
            >
              <div className="w-full h-full relative overflow-hidden">
                {slides.map((slide, idx) => {
                  if (!mountedIndices.includes(idx)) return null;
                  const imgSrc = slide.customImageUrl || slide.product?.images?.[0] || '';
                  const title = slide.customTitle || slide.product?.name || 'Best Seller';
                  return (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out overflow-hidden ${
                        currentIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    >
                      <img
                        src={imgSrc}
                        alt={title}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  );
                })}
              </div>

              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-stone-900 shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20 focus:outline-none"
                    aria-label="Previous Best Seller"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2]" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-stone-900 shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20 focus:outline-none"
                    aria-label="Next Best Seller"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2]" />
                  </button>
                </>
              )}
            </div>

            <div className="text-center mt-4 sm:mt-5 space-y-1">
              <h3
                onClick={() => handleSlideClick(currentSlide)}
                className="font-serif text-lg sm:text-xl font-bold tracking-widest uppercase text-stone-900 hover:text-black transition-colors cursor-pointer inline-block"
              >
                {currentSlide.customTitle || currentSlide.product?.name}
              </h3>
              {(currentSlide.customSubtitle || currentSlide.product?.material) && (
                <p className="text-xs text-stone-500 font-normal">
                  {currentSlide.customSubtitle ||
                    `${currentSlide.product?.material} — Rs.${currentSlide.product?.price.toLocaleString('en-PK')}`}
                </p>
              )}

              {currentSlide.product && (onQuickAddToCart || onQuickBuyNow) && (
                <div className="flex items-center justify-center gap-2.5 pt-2.5">
                  {onQuickAddToCart && (
                    <button
                      type="button"
                      disabled={!currentSlide.product.inStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentSlide.product?.inStock) {
                          onQuickAddToCart(currentSlide.product, e);
                        }
                      }}
                      className="min-h-[38px] px-4 py-2 border border-stone-900 bg-white hover:bg-stone-900 hover:text-white text-stone-900 text-[11px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Add to Cart
                    </button>
                  )}
                  {onQuickBuyNow && (
                    <button
                      type="button"
                      disabled={!currentSlide.product.inStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentSlide.product?.inStock) {
                          onQuickBuyNow(currentSlide.product, e);
                        }
                      }}
                      className="min-h-[38px] px-5 py-2 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] text-[11px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {currentSlide.product.inStock ? 'Buy Now' : 'Sold Out'}
                    </button>
                  )}
                </div>
              )}

              {slides.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(idx);
                      }}
                      className={`h-1.5 transition-all rounded-full ${
                        currentIndex === idx ? 'w-6 bg-black' : 'w-1.5 bg-[#D8C7A5] hover:bg-stone-400'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
