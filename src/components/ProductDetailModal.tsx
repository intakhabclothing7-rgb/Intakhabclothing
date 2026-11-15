import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Ruler,
  Send,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Truck,
  ShieldAlert,
} from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: {
    product: Product;
    shirtSize: string;
    pantSize: string;
    shirtLength: string;
    pantLength: string;
    quantity: number;
  }) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
  onOpenSizeChart: () => void;
  deliveryFee?: number;
  deliveryTimeText?: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  onOpenSizeChart,
  deliveryFee = 350,
  deliveryTimeText = '5–7 working days',
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [shirtSize, setShirtSize] = useState<string>('');
  const [pantSize, setPantSize] = useState<string>('');
  const [shirtLength, setShirtLength] = useState<string>('48(Standard)');
  const [pantLength, setPantLength] = useState<string>('36(Standard)');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);

  // Accordion open states
  const [openAccordion, setOpenAccordion] = useState<{ [key: string]: boolean }>({
    details: true,
    delivery: false,
    care: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Reset state on product change
    setActiveImageIndex(0);
    setShirtSize('');
    setPantSize('');
    setShirtLength('48(Standard)');
    setPantLength('36(Standard)');
    setQuantity(1);
    setSelectionError(null);
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = 0;
    }
  }, [product?.id]);

  if (!product) return null;

  const handleNextImage = () => {
    if (product.images.length > 1) {
      setActiveImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const handlePrevImage = () => {
    if (product.images.length > 1) {
      setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const handleAddToCart = () => {
    if (!product.inStock) return;
    if (!shirtSize || !pantSize) {
      setSelectionError('Please choose both Shirt Size and Pant Size before adding to cart.');
      return;
    }
    setSelectionError(null);
    onAddToCart({
      product,
      shirtSize,
      pantSize,
      shirtLength,
      pantLength,
      quantity,
    });
  };

  const sizes =
    product.availableSizes && product.availableSizes.length > 0
      ? product.availableSizes
      : ['XS', 'S', 'M', 'L', 'XL'];
  const shirtLengths = ['42', '44', '46', '48(Standard)'];
  const pantLengths = ['32', '34', '36(Standard)', '38'];

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-white shadow-2xl h-full sm:h-auto sm:max-h-[92vh] sm:rounded-none flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header / Breadcrumb Bar */}
        <div className="shrink-0 px-5 py-3 border-b border-stone-200 flex items-center justify-between bg-[#FAF6F2]">
          <div className="text-xs text-stone-600 font-medium tracking-wider flex items-center gap-2">
            <span className="hover:text-black cursor-pointer" onClick={onClose}>
              Home
            </span>
            <span>|</span>
            <span className="text-stone-900 font-semibold">{product.name}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-200/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div ref={scrollBodyRef} className="overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Image Gallery (Screenshot 12) */}
            <div className="md:col-span-6 space-y-4">
              <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden border border-stone-200">
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-top"
                />

                {/* Left / Right Nav Arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-colors"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-colors"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Sold out flag if applicable */}
                {!product.inStock && (
                  <div className="absolute top-4 left-4 bg-stone-900/90 text-white text-[11px] font-bold tracking-widest uppercase px-3 py-1">
                    SOLD OUT
                  </div>
                )}
              </div>

              {/* Thumbnails Row (Screenshot 12) */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-18 h-24 shrink-0 border-2 overflow-hidden transition-all ${
                        activeImageIndex === idx
                          ? 'border-[#EDE1C8] shadow-sm'
                          : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover object-top" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Purchasing Configuration (Screenshot 9) */}
            <div className="md:col-span-6 space-y-5">
              {/* Product Title & Availability Header */}
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-medium">
                  {product.name}
                </h1>
                {product.urduName && (
                  <p className="font-serif text-sm text-[#D4A456] mt-0.5">
                    {product.urduName}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="text-stone-500">Availability:</span>
                    {product.inStock ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                        In Stock
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold">Sold Out</span>
                    )}
                  </span>
                  <span className="text-stone-300">|</span>
                  <span className="text-stone-500">
                    SKU: <span className="text-stone-700 font-mono">{product.sku}</span>
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="text-xl sm:text-2xl font-semibold text-stone-950 tabular-nums">
                    Rs.{product.price.toLocaleString('en-PK')}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-stone-400 line-through tabular-nums">
                      Rs.{product.originalPrice.toLocaleString('en-PK')}
                    </span>
                  )}
                </div>
              </div>

              {/* Error Callout if user tries to submit without options */}
              {selectionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 rounded-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{selectionError}</span>
                </div>
              )}

              {/* Variant Selectors: Shirt Size & Pant Size (Screenshot 9) */}
              <div className="space-y-4 pt-2">
                {/* Shirt Size Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-800">
                    Shirt Size:
                  </label>
                  <select
                    value={shirtSize}
                    onChange={(e) => {
                      setShirtSize(e.target.value);
                      if (selectionError) setSelectionError(null);
                    }}
                    className="w-full text-xs py-2.5 px-3 bg-white border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5] focus:ring-1 focus:ring-[#EDE1C8] text-stone-800 cursor-pointer"
                  >
                    <option value="">Choose one</option>
                    {sizes.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz} (Ready to wear)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pant Size Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-800">
                    Pant Size:
                  </label>
                  <select
                    value={pantSize}
                    onChange={(e) => {
                      setPantSize(e.target.value);
                      if (selectionError) setSelectionError(null);
                    }}
                    className="w-full text-xs py-2.5 px-3 bg-white border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5] focus:ring-1 focus:ring-[#EDE1C8] text-stone-800 cursor-pointer"
                  >
                    <option value="">Choose one</option>
                    {sizes.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz} (Tailored waist & hips)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shirt Length Radio Group (Screenshot 9) */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-medium text-stone-800">
                    Shirt Length:
                  </label>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-700">
                    {shirtLengths.map((len) => (
                      <label key={len} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="shirtLength"
                          value={len}
                          checked={shirtLength === len}
                          onChange={(e) => setShirtLength(e.target.value)}
                          className="w-3.5 h-3.5 text-black focus:ring-black accent-[#D8C7A5]"
                        />
                        <span>{len}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pant Length Radio Group (Screenshot 9) */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-medium text-stone-800">
                    Pant Length:
                  </label>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-700">
                    {pantLengths.map((len) => (
                      <label key={len} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="pantLength"
                          value={len}
                          checked={pantLength === len}
                          onChange={(e) => setPantLength(e.target.value)}
                          className="w-3.5 h-3.5 text-black focus:ring-black accent-[#D8C7A5]"
                        />
                        <span>{len}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Utility Row: Size Chart, Wishlist, Delivery & Returns (Screenshot 9) */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs text-stone-600">
                <button
                  type="button"
                  onClick={onOpenSizeChart}
                  className="flex items-center gap-1.5 hover:text-black font-medium transition-colors"
                >
                  <Ruler className="w-4 h-4 text-stone-500" />
                  <span>Size Chart</span>
                </button>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={(e) => onToggleWishlist(product.id, e)}
                    className="flex items-center gap-1 hover:text-black transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isWishlisted ? 'fill-black text-black' : 'text-stone-500'
                      }`}
                    />
                    <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeliveryInfo(!showDeliveryInfo)}
                    className="flex items-center gap-1 hover:text-black transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-stone-500" />
                    <span>Delivery & Returns</span>
                  </button>
                </div>
              </div>

              {/* Delivery info popup drawer if opened */}
              {showDeliveryInfo && (
                <div className="p-3 bg-[#FAF6F2] border border-stone-200 text-xs text-stone-700 space-y-1.5 animate-in fade-in duration-150">
                  <p className="font-semibold text-black flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" /> Nationwide Delivery (Pakistan)
                  </p>
                  <p>• <strong>Delivery Charges:</strong> Rs. {deliveryFee} PKR flat nationwide.</p>
                  <p>• <strong>Delivery Time:</strong> {deliveryTimeText} via Courier with Cash on Delivery.</p>
                  <p>• <strong>Payment:</strong> Cash on Delivery (COD) or Secure Bank Transfer.</p>
                </div>
              )}

              {/* Quantity Selector & ADD TO CART CTA (Screenshot 9) */}
              <div className="space-y-3 pt-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-stone-300">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-stone-600 hover:bg-stone-100 transition-colors"
                      disabled={!product.inStock}
                    >
                      -
                    </button>
                    <span className="px-3 py-2 text-xs font-semibold tabular-nums min-w-[2rem] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-2 text-stone-600 hover:bg-stone-100 transition-colors"
                      disabled={!product.inStock}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className={`flex-1 py-3.5 px-6 uppercase tracking-widest text-xs font-semibold text-center transition-all duration-200 ${
                      product.inStock
                        ? 'bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black shadow-md hover:shadow-lg active:scale-[0.99] border border-[#D8C7A5]'
                        : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {product.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
                  </button>
                </div>
              </div>

              {/* Collapsible Accordions (Screenshot 9 & 11) */}
              <div className="pt-4 divide-y divide-stone-200 border-t border-stone-200">
                {/* 1. PRODUCT DETAILS Accordion */}
                <div>
                  <button
                    onClick={() => toggleAccordion('details')}
                    className="w-full py-3.5 flex items-center justify-between text-left font-semibold text-xs tracking-wider uppercase text-stone-900 bg-stone-100 px-3 hover:bg-stone-200/60 transition-colors"
                  >
                    <span>PRODUCT DETAILS</span>
                    {openAccordion.details ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {openAccordion.details && (
                    <div className="p-4 bg-white text-xs text-stone-700 space-y-3 border-x border-b border-stone-200">
                      <div className="grid grid-cols-2 gap-2 pb-2 border-b border-stone-100">
                        <div>
                          <span className="font-semibold text-stone-900">Material: </span>
                          <span>{product.material}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-stone-900">Colour: </span>
                          <span>{product.colour}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-semibold text-stone-900">Model: </span>
                          <span>{product.modelSpecs}</span>
                        </div>
                      </div>

                      <p className="leading-relaxed">{product.description}</p>

                      <div className="space-y-1.5 pt-1">
                        <span className="font-semibold text-stone-900 block">Garment Features:</span>
                        <ul className="list-disc pl-4 space-y-1 text-stone-600">
                          {product.features.map((feat, i) => (
                            <li key={i}>{feat}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. DELIVERY TIMELINE Accordion (Screenshot 11) */}
                <div className="mt-2">
                  <button
                    onClick={() => toggleAccordion('delivery')}
                    className="w-full py-3.5 flex items-center justify-between text-left font-semibold text-xs tracking-wider uppercase text-stone-800 px-3 hover:bg-stone-50 transition-colors"
                  >
                    <span>DELIVERY TIMELINE</span>
                    {openAccordion.delivery ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {openAccordion.delivery && (
                    <div className="p-4 bg-[#FAF6F2] text-xs text-stone-700 space-y-2 border-t border-stone-200">
                      <p>
                        <strong>Delivery Time:</strong> {deliveryTimeText} across Pakistan.
                      </p>
                      <p>
                        <strong>Delivery Charges:</strong> Rs. {deliveryFee} PKR nationwide flat rate.
                      </p>
                      <p>
                        <strong>Payment Methods:</strong> Cash on Delivery (COD) across Pakistan or Secure Bank Transfer.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. CARE & STORAGE */}
                <div className="mt-2">
                  <button
                    onClick={() => toggleAccordion('care')}
                    className="w-full py-3.5 flex items-center justify-between text-left font-semibold text-xs tracking-wider uppercase text-stone-800 px-3 hover:bg-stone-50 transition-colors"
                  >
                    <span>FABRIC CARE & PRESERVATION</span>
                    {openAccordion.care ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {openAccordion.care && (
                    <div className="p-4 bg-[#FAF6F2] text-xs text-stone-700 space-y-1.5 border-t border-stone-200">
                      <ul className="list-disc pl-4 space-y-1 text-stone-600">
                        {product.careInstructions.map((care, i) => (
                          <li key={i}>{care}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
