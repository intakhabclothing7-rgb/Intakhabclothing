import React from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartId: string, quantity: number) => void;
  onRemoveItem: (cartId: string) => void;
  onProceedToCheckout: () => void;
  deliveryFee?: number;
  deliveryTimeText?: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  deliveryFee = 350,
  deliveryTimeText = '5–7 working days',
}) => {
  if (!isOpen) return null;

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = deliveryFee;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer (Screenshot 3) */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-white">
          <h2 className="font-semibold text-sm sm:text-base tracking-wider uppercase text-stone-900">
            YOUR CART ({totalCount})
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Standard Delivery Notice */}
        {items.length > 0 && (
          <div className="bg-[#FAF6F2] px-4 py-2.5 border-b border-stone-200 text-xs flex items-center justify-between">
            <span className="text-black font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-stone-800" />
              Nationwide Delivery: Rs. {shippingFee} PKR
            </span>
            <span className="text-[11px] font-medium text-stone-600">{deliveryTimeText}</span>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            /* Exact Empty State from Screenshot 3 */
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-16 space-y-5">
              <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center text-stone-800">
                <ShoppingBag className="w-9 h-9 stroke-[1.2]" />
              </div>

              <div className="space-y-1">
                <p className="text-sm text-stone-700 font-medium">
                  You don't have any items in your cart.
                </p>
                <p className="text-xs text-stone-400">
                  Explore our luxury prêt and stitched collections.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full max-w-xs py-3.5 px-6 bg-stone-900 hover:bg-[#EDE1C8] hover:text-black text-white text-xs font-semibold tracking-widest uppercase transition-colors rounded-none shadow-sm"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            /* Populated Cart Item List */
            <div className="space-y-4 divide-y divide-stone-100">
              {items.map((item) => (
                <div key={item.cartId} className="pt-4 first:pt-0 flex gap-4 items-start">
                  <div className="w-20 h-26 bg-stone-100 shrink-0 border border-stone-200 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-stone-400 uppercase tracking-widest">
                        Intakhab
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex items-start justify-between">
                      <h4 className="font-serif text-sm font-semibold text-stone-900 leading-snug">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.cartId)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-stone-500 text-[11px]">
                      Shirt: <strong className="text-stone-700">{item.shirtSize}</strong> | Pant: <strong className="text-stone-700">{item.pantSize}</strong>
                    </p>
                    <p className="text-stone-500 text-[11px]">
                      Lengths: Shirt {item.shirtLength}" · Pant {item.pantLength}"
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-stone-200">
                        <button
                          onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-100"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 text-stone-900 font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-100"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-semibold text-sm text-stone-900 tabular-nums">
                        Rs.{(item.price * item.quantity).toLocaleString('en-PK')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer with Subtotal & Checkout */}
        {items.length > 0 && (
          <div className="p-5 bg-white border-t border-stone-200 space-y-3 shadow-lg">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Delivery Charges ({deliveryTimeText})</span>
                <span>Rs. {shippingFee}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-stone-900 pt-1 border-t border-stone-100">
                <span>Estimated Total</span>
                <span className="tabular-nums text-black font-bold">
                  Rs.{(subtotal + shippingFee).toLocaleString('en-PK')}
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                Estimated delivery in {deliveryTimeText} across Pakistan.
              </p>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-4 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black text-xs font-semibold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg border border-[#D8C7A5]"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-stone-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4A456]" />
              <span>Cash on Delivery & Secure Bank Transfer Available</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
