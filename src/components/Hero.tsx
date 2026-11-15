import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { HeroSlide } from '../types';
import { DEFAULT_HERO_SLIDES } from '../data/defaults';

interface HeroProps {
  slides?: HeroSlide[];
  transitionMs?: number;
  onExploreClick: (link?: string) => void;
  onBestSellersClick: (link?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  slides,
  transitionMs = 2500,
  onExploreClick,
  onBestSellersClick,
}) => {
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_HERO_SLIDES;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mountedIndices, setMountedIndices] = useState<number[]>(() =>
    activeSlides.length > 1 ? [0, 1] : [0]
  );

  useEffect(() => {
    setCurrentImageIndex(0);
    setMountedIndices(activeSlides.length > 1 ? [0, 1] : [0]);
  }, [activeSlides]);

  const currentSlide = activeSlides[currentImageIndex] || activeSlides[0];
  const slideDuration = Math.max(800, currentSlide?.transitionMs || transitionMs || 2500);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const nextIndex = (currentImageIndex + 1) % activeSlides.length;
    setMountedIndices((prev) =>
      prev.includes(currentImageIndex) && prev.includes(nextIndex)
        ? prev
        : Array.from(new Set([...prev, currentImageIndex, nextIndex]))
    );
    const timer = setTimeout(() => {
      setCurrentImageIndex(nextIndex);
    }, slideDuration);
    return () => clearTimeout(timer);
  }, [currentImageIndex, activeSlides.length, slideDuration]);

  return (
    <section className="relative w-full overflow-hidden bg-[#16040A] border-b border-stone-200">
      {/* Full length portrait hero container */}
      <div className="relative w-full min-h-[740px] sm:min-h-[840px] md:min-h-[920px] lg:min-h-[980px] flex flex-col justify-end items-center">
        {/* Background full-length rotating images (incrementally mounted for fast LCP) */}
        {activeSlides.map((slide, index) => {
          if (!mountedIndices.includes(index)) return null;
          const isVisible = index === currentImageIndex;
          const hasSeparateMobile = Boolean(
            slide.mobileImageUrl && slide.mobileImageUrl !== slide.desktopImageUrl
          );
          const priority = index === 0 ? 'high' : 'low';
          return (
            <React.Fragment key={slide.id || index}>
              <img
                src={slide.desktopImageUrl}
                alt={slide.title || `Intakhab Luxury Prêt Signature Collection ${index + 1}`}
                loading="eager"
                decoding={index === 0 ? 'sync' : 'async'}
                fetchPriority={priority}
                className={`${hasSeparateMobile ? 'hidden sm:block' : 'block'} absolute inset-0 w-full h-full object-cover object-top sm:object-[center_12%] select-none transition-opacity duration-700 ease-in-out ${
                  isVisible ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {hasSeparateMobile && (
                <img
                  src={slide.mobileImageUrl}
                  alt={slide.title || `Intakhab Mobile Collection ${index + 1}`}
                  loading="eager"
                  decoding={index === 0 ? 'sync' : 'async'}
                  fetchPriority={priority}
                  className={`sm:hidden absolute inset-0 w-full h-full object-cover object-top select-none transition-opacity duration-700 ease-in-out ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Top subtle vignette for clean header transition */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-stone-950/40 via-stone-950/15 to-transparent pointer-events-none" />

        {/* Luxury gradient overlay so text is clearly readable in the lower section */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#140207] via-[#140207]/70 via-40% to-transparent pointer-events-none" />

        {/* Content positioned towards the lower part */}
        <div className="relative z-10 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14 pt-48 sm:pt-64 text-center">
          <div className="space-y-4 sm:space-y-5">
            {/* Tag / Badge */}
            {currentSlide?.badgeText && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#EDE1C8] border border-[#D8C7A5] rounded-full text-xs font-semibold text-black tracking-widest uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-stone-800" />
                <span>{currentSlide.badgeText}</span>
              </div>
            )}

            {/* Headings */}
            <div className="space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-medium leading-[1.15] tracking-tight drop-shadow-md">
                {currentSlide?.title || 'Elegance in Every Stitch'}
              </h1>
              {currentSlide?.urduSubtitle && (
                <p className="font-serif text-lg sm:text-xl md:text-2xl text-[#EDE1C8] tracking-wide drop-shadow">
                  {currentSlide.urduSubtitle}
                </p>
              )}
            </div>

            {/* Description */}
            {currentSlide?.description && (
              <p className="text-sm sm:text-base text-stone-200 leading-relaxed max-w-xl mx-auto drop-shadow">
                {currentSlide.description}
              </p>
            )}

            {/* Call To Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-3 max-w-md mx-auto sm:max-w-none">
              <button
                onClick={() => onExploreClick(currentSlide?.ctaPrimaryLink)}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black text-xs uppercase tracking-widest font-semibold transition-all duration-200 shadow-xl flex items-center justify-center gap-2 group border border-[#D8C7A5] cursor-pointer"
              >
                <span>{currentSlide?.ctaPrimaryText || 'SHOP THE COLLECTION'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-black" />
              </button>
              {currentSlide?.ctaSecondaryText && (
                <button
                  onClick={() => onBestSellersClick(currentSlide?.ctaSecondaryLink)}
                  className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md text-xs uppercase tracking-widest font-semibold transition-all duration-200 border border-white/40 hover:border-white shadow-lg cursor-pointer"
                >
                  {currentSlide.ctaSecondaryText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
