import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { PRODUCTS as DEFAULT_PRODUCTS } from './data/products';
import { INITIAL_REVIEWS } from './data/reviews';
import {
  DEFAULT_BEST_SELLERS,
  DEFAULT_CATEGORIES,
  DEFAULT_HERO_SLIDES,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_WEBSITE_SETTINGS,
} from './data/defaults';
import {
  Product,
  CartItem,
  PlacedOrder,
  Category,
  HeroSlide,
  BestSellerEntry,
  Review,
  HomepageContentSection,
  WebsiteSettings,
} from './types';
import { fetchStorefrontSnapshot, getCachedStorefrontSnapshot } from './services/supabaseStore';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { Footer } from './components/Footer';
import { BestSellersCarousel } from './components/BestSellersCarousel';
import { ReviewsSection } from './components/ReviewsSection';
import { WebsiteQrSection } from './components/WebsiteQrSection';
import { WhatsAppIcon } from './components/WhatsAppIcon';
import { AlertCircle, ArrowLeft, ArrowRight, ChevronRight, Sparkles, X } from 'lucide-react';
import gulzarFestiveImg from './assets/images/gulzar_festive_boutique.webp';

const MobileMenu = lazy(() =>
  import('./components/MobileMenu').then((m) => ({ default: m.MobileMenu }))
);
const ProductDetailModal = lazy(() =>
  import('./components/ProductDetailModal').then((m) => ({ default: m.ProductDetailModal }))
);
const CartDrawer = lazy(() =>
  import('./components/CartDrawer').then((m) => ({ default: m.CartDrawer }))
);
const CheckoutModal = lazy(() =>
  import('./components/CheckoutModal').then((m) => ({ default: m.CheckoutModal }))
);
const SizeChartModal = lazy(() =>
  import('./components/SizeChartModal').then((m) => ({ default: m.SizeChartModal }))
);
const SearchModal = lazy(() =>
  import('./components/SearchModal').then((m) => ({ default: m.SearchModal }))
);
const WishlistDrawer = lazy(() =>
  import('./components/WishlistDrawer').then((m) => ({ default: m.WishlistDrawer }))
);
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

export default function App() {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  // Instant hydration from cached live snapshot when available (background refresh still runs)
  const [initialCache] = useState(() => getCachedStorefrontSnapshot());
  const [products, setProducts] = useState<Product[]>(
    () => initialCache?.products || DEFAULT_PRODUCTS
  );
  const [categories, setCategories] = useState<Category[]>(
    () => initialCache?.categories || DEFAULT_CATEGORIES
  );
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(
    () => initialCache?.heroSlides || DEFAULT_HERO_SLIDES
  );
  const [bestSellersList, setBestSellersList] = useState<BestSellerEntry[]>(
    () => initialCache?.bestSellers || DEFAULT_BEST_SELLERS
  );
  const [reviews, setReviews] = useState<Review[]>(
    () => initialCache?.reviews || INITIAL_REVIEWS
  );
  const [homepageContent, setHomepageContent] = useState<Record<string, HomepageContentSection>>(
    () => initialCache?.homepageContent || DEFAULT_HOMEPAGE_CONTENT
  );
  const [settings, setSettings] = useState<WebsiteSettings>(
    () => initialCache?.settings || DEFAULT_WEBSITE_SETTINGS
  );
  const [fromSupabase, setFromSupabase] = useState<boolean>(
    () => Boolean(initialCache?.fromSupabase)
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [dismissedConnectionError, setDismissedConnectionError] = useState<boolean>(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeView, setActiveView] = useState<'home' | 'collection'>('home');
  const [, setRecentOrder] = useState<PlacedOrder | null>(null);

  const loadStorefront = useCallback(async () => {
    try {
      const snap = await fetchStorefrontSnapshot();
      setProducts(snap.products);
      setCategories(snap.categories);
      setHeroSlides(snap.heroSlides);
      setBestSellersList(snap.bestSellers);
      setReviews(snap.reviews);
      setHomepageContent(snap.homepageContent);
      setSettings(snap.settings);
      setFromSupabase(snap.fromSupabase);
      setConnectionError(snap.connectionError || null);
      if (snap.connectionError) {
        setDismissedConnectionError(false);
      }
    } catch (err: any) {
      setFromSupabase(false);
      setConnectionError(
        err?.message || 'Unable to connect to Supabase. Check environment variables and RLS policies.'
      );
      setDismissedConnectionError(false);
    }
  }, []);

  useEffect(() => {
    loadStorefront();
  }, [loadStorefront]);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (targetPath: string) => {
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
      setPathname(targetPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (pathname.startsWith('/admin')) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FAF6F2] flex items-center justify-center text-xs uppercase tracking-widest text-stone-600">
            Loading Admin Portal...
          </div>
        }
      >
        <AdminDashboard
          onBackToStore={() => {
            loadStorefront();
            navigateTo('/');
          }}
          onStorefrontDataChanged={loadStorefront}
        />
      </Suspense>
    );
  }

  const openCollectionView = (category: string) => {
    setSelectedCategory(category);
    setActiveView('collection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHomeView = () => {
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLinkNavigation = (link?: string) => {
    if (!link) return;
    if (link.startsWith('collection:')) {
      openCollectionView(link.replace('collection:', '') || 'All');
      return;
    }
    if (link.startsWith('#')) {
      const el = document.getElementById(link.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (link.startsWith('http')) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const upsertCartItem = (itemConfig: {
    product: Product;
    shirtSize: string;
    pantSize: string;
    shirtLength: string;
    pantLength: string;
    quantity: number;
  }) => {
    const { product, shirtSize, pantSize, shirtLength, pantLength, quantity } = itemConfig;
    const cartId = `${product.id}-${shirtSize}-${pantSize}-${shirtLength}-${pantLength}`;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.cartId === cartId);
      if (existing) {
        return prev.map((i) =>
          i.cartId === cartId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          cartId,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0] || '',
          shirtSize,
          pantSize,
          shirtLength,
          pantLength,
          quantity,
          material: product.material,
          colour: product.colour,
        },
      ];
    });
  };

  // Cart operations
  const handleAddToCart = (itemConfig: {
    product: Product;
    shirtSize: string;
    pantSize: string;
    shirtLength: string;
    pantLength: string;
    quantity: number;
  }) => {
    upsertCartItem(itemConfig);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleBuyNow = (itemConfig: {
    product: Product;
    shirtSize: string;
    pantSize: string;
    shirtLength: string;
    pantLength: string;
    quantity: number;
  }) => {
    upsertCartItem(itemConfig);
    setSelectedProduct(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const getDefaultSizeForCard = (product: Product) => {
    const sizes = product.availableSizes && product.availableSizes.length > 0
      ? product.availableSizes
      : ['XS', 'S', 'M', 'L', 'XL'];
    return sizes.includes('M') ? 'M' : sizes[0];
  };

  const handleQuickAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultSize = getDefaultSizeForCard(product);
    handleAddToCart({
      product,
      shirtSize: defaultSize,
      pantSize: defaultSize,
      shirtLength: '48(Standard)',
      pantLength: '36(Standard)',
      quantity: 1,
    });
  };

  const handleQuickBuyNow = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultSize = getDefaultSizeForCard(product);
    handleBuyNow({
      product,
      shirtSize: defaultSize,
      pantSize: defaultSize,
      shirtLength: '48(Standard)',
      pantLength: '36(Standard)',
      quantity: 1,
    });
  };

  const handleUpdateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((i) => i.cartId !== cartId));
    } else {
      setCartItems((prev) =>
        prev.map((i) => (i.cartId === cartId ? { ...i, quantity } : i))
      );
    }
  };

  const handleRemoveItem = (cartId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const handleToggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Dynamic navigation categories from database/defaults (always ensure Best Sellers and Sale are accessible)
  const hasBestSellersNav = categories.some(
    (cat) => cat.slug === 'best-sellers' || cat.name.toLowerCase() === 'best sellers'
  );
  const hasSaleNav = categories.some(
    (cat) => cat.slug === 'sale' || cat.name.toLowerCase() === 'sale'
  );
  const navCategoriesList = [
    { label: 'ALL COLLECTIONS', value: 'All' },
    ...categories.map((cat) => ({
      label: cat.name.toUpperCase(),
      value: cat.name,
    })),
    ...(hasBestSellersNav ? [] : [{ label: 'BEST SELLERS', value: 'Best Sellers' }]),
    ...(hasSaleNav ? [] : [{ label: 'SALE', value: 'Sale' }]),
  ];

  const newArrivalsCat = categories.find(
    (c) => c.slug === 'new-arrivals' || c.name.toLowerCase() === 'new arrivals'
  );
  const bestSellersCat = categories.find(
    (c) => c.slug === 'best-sellers' || c.name.toLowerCase() === 'best sellers'
  );
  const saleCat = categories.find(
    (c) => c.slug === 'sale' || c.name.toLowerCase() === 'sale'
  );
  const activeBestSellerIds = new Set(
    bestSellersList
      .filter((entry) => entry.isActive !== false && entry.productId)
      .map((entry) => entry.productId)
  );

  // Filtered products
  const newArrivals = products.filter(
    (p) =>
      p.isNewArrival ||
      p.category.toLowerCase() === 'new arrivals' ||
      (newArrivalsCat ? p.categoryIds?.includes(newArrivalsCat.id) : false)
  );
  const bestSellerProducts = products.filter(
    (p) =>
      p.isBestSeller ||
      activeBestSellerIds.has(p.id) ||
      p.category.toLowerCase() === 'best sellers' ||
      (bestSellersCat ? p.categoryIds?.includes(bestSellersCat.id) : false)
  );
  const saleProducts = products.filter(
    (p) =>
      (p.originalPrice !== undefined && p.originalPrice > p.price) ||
      (p.salePrice !== null && p.salePrice !== undefined && p.salePrice > 0) ||
      p.category.toLowerCase() === 'sale' ||
      (saleCat ? p.categoryIds?.includes(saleCat.id) : false)
  );

  const displayedProducts =
    selectedCategory === 'All'
      ? products
      : selectedCategory.toLowerCase() === 'new arrivals'
      ? newArrivals
      : selectedCategory.toLowerCase() === 'best sellers'
      ? bestSellerProducts
      : selectedCategory.toLowerCase() === 'sale'
      ? saleProducts
      : products.filter((p) => {
          const catObj = categories.find(
            (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
          );
          return (
            p.category.toLowerCase() === selectedCategory.toLowerCase() ||
            (catObj && p.categoryIds?.includes(catObj.id))
          );
        });

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const newArrivalsSection = homepageContent.new_arrivals_header || DEFAULT_HOMEPAGE_CONTENT.new_arrivals_header;
  const editorialSection = homepageContent.editorial_showcase || DEFAULT_HOMEPAGE_CONTENT.editorial_showcase;
  const bestSellersHeader = homepageContent.best_sellers_header || DEFAULT_HOMEPAGE_CONTENT.best_sellers_header;

  const cleanWaDigits = (settings.whatsappNumber || '+92 325 6253921').replace(/[^0-9]/g, '') || '923256253921';

  return (
    <div className="min-h-screen bg-[#FAF6F2] flex flex-col font-sans selection:bg-[#EDE1C8] selection:text-black">
      {/* Header */}
      <Header
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        onSelectCategory={(cat) => openCollectionView(cat)}
        onGoHome={goHomeView}
        selectedCategory={selectedCategory}
        categoriesList={navCategoriesList}
      />

      {/* Storefront Supabase Connection / Permission Error Banner */}
      {connectionError && !dismissedConnectionError && (
        <div
          role="alert"
          className="bg-rose-50 border-b border-rose-200 text-rose-900 px-4 sm:px-6 py-2.5 text-xs"
        >
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
              <span>{connectionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setDismissedConnectionError(true)}
              aria-label="Dismiss Supabase error"
              className="text-rose-700 hover:text-rose-950 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeView === 'home' ? (
          <>
            {/* Hero Section */}
            <Hero
              slides={heroSlides}
              transitionMs={settings.heroTransitionMs}
              onExploreClick={(link) => {
                if (link && link !== '#new-arrivals') {
                  handleLinkNavigation(link);
                } else {
                  openCollectionView('All');
                }
              }}
              onBestSellersClick={(link) => {
                if (link && link !== '#best-sellers') {
                  handleLinkNavigation(link);
                } else {
                  const el = document.getElementById('best-sellers');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />

            {/* Section: NEW ARRIVALS */}
            <section id="new-arrivals" className="py-12 sm:py-16 bg-white border-b border-stone-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8 sm:mb-12 border-b border-stone-100 pb-4">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 font-medium tracking-tight">
                      {newArrivalsSection.heading || 'NEW ARRIVAL'}
                    </h2>
                    <p className="text-xs text-stone-600 tracking-wider uppercase mt-1 font-medium">
                      {newArrivalsSection.subheading || 'Stitched Festive & Luxury Pret Edit'}
                    </p>
                  </div>

                  <button
                    onClick={() => openCollectionView('All')}
                    className="py-2 px-5 sm:px-6 border border-stone-900 text-stone-900 hover:bg-[#EDE1C8] hover:border-[#EDE1C8] hover:text-black text-xs font-semibold tracking-widest uppercase transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{newArrivalsSection.primaryCtaText || 'VIEW ALL'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {newArrivals.length === 0 ? (
                  <div className="py-12 px-6 text-center bg-[#FAF6F2] border border-stone-200">
                    <p className="font-serif text-lg sm:text-xl text-stone-800">
                      New Arrivals Coming Soon
                    </p>
                    <p className="text-xs sm:text-sm text-stone-500 mt-1.5">
                      New stitched ensembles will be listed here shortly.
                    </p>
                  </div>
                ) : (
                  <div
                    className={`grid grid-cols-2 ${
                      newArrivals.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'
                    } gap-4 sm:gap-6 lg:gap-8`}
                  >
                    {newArrivals.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={(p) => setSelectedProduct(p)}
                        isWishlisted={wishlistIds.includes(product.id)}
                        onToggleWishlist={handleToggleWishlist}
                        onQuickAddToCart={handleQuickAddToCart}
                        onQuickBuyNow={handleQuickBuyNow}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Editorial Interlude */}
            <section className="bg-[#FAF6F2] py-14 sm:py-20 border-b border-stone-200 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 relative">
                    <div className="w-full overflow-hidden shadow-xl border-4 border-white bg-white">
                      <img
                        src={editorialSection.imageUrl || gulzarFestiveImg}
                        alt="Intakhab Silk Festive Ensemble"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-auto block hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-5 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-black bg-[#EDE1C8] px-3 py-1 border border-[#D8C7A5]">
                      <Sparkles className="w-3.5 h-3.5 text-stone-800" />
                      <span>{editorialSection.badgeText || 'NEW SEASON COLLECTION'}</span>
                    </div>

                    <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-medium">
                      {editorialSection.heading || 'Elegance in Every Thread'}
                    </h2>

                    <p className="text-sm text-stone-600 leading-relaxed">
                      {editorialSection.description ||
                        'Discover timeless styles, beautiful details, and outfits designed to make every moment special.'}
                    </p>

                    <div className="pt-2 flex flex-col items-center lg:items-start gap-3">
                      <button
                        onClick={() => openCollectionView('All')}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer"
                      >
                        <span>{editorialSection.primaryCtaText || 'EXPLORE COLLECTION'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-black" />
                      </button>

                      <a
                        href={editorialSection.secondaryCtaLink || settings.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-2.5 border border-stone-900 text-stone-900 hover:bg-[#EDE1C8] hover:border-[#EDE1C8] hover:text-black text-xs font-semibold tracking-wider uppercase transition-all duration-200"
                      >
                        <span>
                          {editorialSection.secondaryCtaText || 'Follow @intakhab__womens_clothing'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-black" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: BEST SELLERS Carousel Slider */}
            <BestSellersCarousel
              entries={bestSellersList}
              heading={bestSellersHeader.heading || 'BEST SELLERS'}
              viewAllLabel={bestSellersHeader.primaryCtaText || 'View all'}
              onViewAll={() => {
                const target = bestSellersHeader.primaryCtaLink;
                if (target && target.startsWith('collection:')) {
                  openCollectionView(target.replace('collection:', '') || 'Best Sellers');
                } else {
                  openCollectionView('Best Sellers');
                }
              }}
              onSelectCategory={(cat) => openCollectionView(cat)}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onQuickAddToCart={handleQuickAddToCart}
              onQuickBuyNow={handleQuickBuyNow}
            />

            {/* Section: CLIENT REVIEWS */}
            <ReviewsSection
              reviews={reviews}
              fromSupabase={fromSupabase}
              onReviewSubmitted={loadStorefront}
            />

            {/* Section: WEBSITE QR CODE */}
            <WebsiteQrSection />
          </>
        ) : (
          /* Dedicated Collection Page View */
          <section id="catalog" className="py-8 sm:py-12 bg-[#FAF6F2] min-h-[70vh]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4 pb-6 mb-6 border-b border-stone-200">
                <button
                  onClick={goHomeView}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-900 text-stone-900 hover:bg-[#EDE1C8] hover:border-[#EDE1C8] hover:text-black text-xs font-semibold tracking-widest uppercase transition-all duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Home</span>
                </button>

                <div className="text-xs text-stone-500 uppercase tracking-wider font-medium">
                  <button
                    onClick={goHomeView}
                    className="hover:text-black transition-colors cursor-pointer"
                  >
                    Home
                  </button>
                  <span className="mx-2">/</span>
                  <span className="text-stone-900 font-semibold">
                    {selectedCategory === 'All' ? 'All Collection' : selectedCategory}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-xs uppercase tracking-widest text-black font-bold">
                    The Ready-To-Wear Suite
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 font-medium mt-1">
                    {selectedCategory === 'All' ? 'All Stitched Suits' : selectedCategory}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-stone-200">
                  {[
                    'All',
                    ...categories.map((c) => c.name),
                    ...(hasBestSellersNav ? [] : ['Best Sellers']),
                    ...(hasSaleNav ? [] : ['Sale']),
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                        selectedCategory.toLowerCase() === cat.toLowerCase()
                          ? 'bg-[#EDE1C8] text-black font-semibold border border-[#D8C7A5]'
                          : 'text-stone-700 hover:text-black hover:bg-[#EDE1C8]/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {displayedProducts.length === 0 ? (
                <div className="py-16 px-6 text-center bg-white border border-stone-200">
                  <p className="font-serif text-xl sm:text-2xl text-stone-900">
                    {selectedCategory.toLowerCase() === 'sale'
                      ? 'No Sale Items Active Right Now'
                      : 'No Products Listed Yet'}
                  </p>
                  <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-md mx-auto">
                    {selectedCategory.toLowerCase() === 'sale'
                      ? 'Any stitched suits with a discounted sale price will appear here automatically.'
                      : 'Our upcoming collection is being curated. New stitched suits will appear here soon.'}
                  </p>
                </div>
              ) : (
                <div
                  className={`grid grid-cols-2 ${
                    displayedProducts.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'
                  } gap-4 sm:gap-6`}
                >
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={(p) => setSelectedProduct(p)}
                      isWishlisted={wishlistIds.includes(product.id)}
                      onToggleWishlist={handleToggleWishlist}
                      onQuickAddToCart={handleQuickAddToCart}
                      onQuickBuyNow={handleQuickBuyNow}
                    />
                  ))}
                </div>
              )}

              <div className="mt-12 pt-8 border-t border-stone-200 flex justify-center">
                <button
                  onClick={goHomeView}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] text-xs font-semibold tracking-widest uppercase transition-all duration-200 shadow-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer settings={settings} onOpenAdmin={() => navigateTo('/admin')} />

      {/* Modals & Slide-overs (Code-split so storefront loads fast) */}
      <Suspense fallback={null}>
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isWishlisted={wishlistIds.includes(selectedProduct.id)}
            onToggleWishlist={handleToggleWishlist}
            onOpenSizeChart={() => setIsSizeChartOpen(true)}
            deliveryFee={settings.deliveryFee}
            deliveryTimeText={settings.deliveryTimeText}
          />
        )}

        {isCartOpen && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onProceedToCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
            deliveryFee={settings.deliveryFee}
            deliveryTimeText={settings.deliveryTimeText}
          />
        )}

        {isCheckoutOpen && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            items={cartItems}
            settings={settings}
            onOrderSuccess={(order) => {
              setRecentOrder(order);
              setCartItems([]);
            }}
          />
        )}

        {isSizeChartOpen && (
          <SizeChartModal
            isOpen={isSizeChartOpen}
            onClose={() => setIsSizeChartOpen(false)}
          />
        )}

        {isSearchOpen && (
          <SearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            products={products}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}

        {isWishlistOpen && (
          <WishlistDrawer
            isOpen={isWishlistOpen}
            onClose={() => setIsWishlistOpen(false)}
            wishlistIds={wishlistIds}
            products={products}
            onRemoveWishlist={(id) =>
              setWishlistIds((prev) => prev.filter((item) => item !== id))
            }
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}

        {isMobileMenuOpen && (
          <MobileMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            onSelectCategory={(cat) => openCollectionView(cat)}
            selectedCategory={selectedCategory}
            onOpenSizeChart={() => setIsSizeChartOpen(true)}
            categoriesList={navCategoriesList}
            whatsappNumber={settings.whatsappNumber}
          />
        )}
      </Suspense>

      {/* Floating WhatsApp Direct Chat Button */}
      <a
        href={`https://wa.me/${cleanWaDigits}?text=${encodeURIComponent(
          'Assalam o Alaikum! I would like to inquire about Intakhab stitched suits.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat on WhatsApp (${settings.whatsappNumber})`}
        title={`Chat on WhatsApp (${settings.whatsappNumber})`}
        className="fixed bottom-5 right-5 z-40 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-transform duration-200 focus:outline-none"
      >
        <WhatsAppIcon variant="badge" className="w-13 h-13 sm:w-14 sm:h-14" />
      </a>
    </div>
  );
}

