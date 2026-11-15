import React, { useState } from 'react';
import { X, CheckCircle2, MapPin, Phone, Mail, User, Copy, Check, AlertCircle } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { CartItem, CheckoutDetails, PlacedOrder, WebsiteSettings } from '../types';
import { DEFAULT_WEBSITE_SETTINGS } from '../data/defaults';
import { submitPublicOrder } from '../services/supabaseStore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (order: PlacedOrder) => void;
  settings?: WebsiteSettings;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
  settings = DEFAULT_WEBSITE_SETTINGS,
}) => {
  const [formData, setFormData] = useState<CheckoutDetails>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Lahore',
    postalCode: '54000',
    notes: '',
    paymentMethod: 'cod',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<PlacedOrder | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ik-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );

  if (!isOpen) return null;

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = Number(settings.deliveryFee ?? 350);
  const total = subtotal + shipping;
  const cleanWaDigits = (settings.whatsappNumber || '+92 325 6253921').replace(/[^0-9]/g, '') || '923256253921';
  const deliveryTimeText = settings.deliveryTimeText || '5–7 working days';

  const bankTitle = settings.bankTitle || DEFAULT_WEBSITE_SETTINGS.bankTitle;
  const bankName = settings.bankName || DEFAULT_WEBSITE_SETTINGS.bankName;
  const bankAccountNumber =
    settings.bankAccountNumber || DEFAULT_WEBSITE_SETTINGS.bankAccountNumber;
  const jazzcashName = settings.jazzcashName || DEFAULT_WEBSITE_SETTINGS.jazzcashName;
  const jazzcashNumber = settings.jazzcashNumber || DEFAULT_WEBSITE_SETTINGS.jazzcashNumber;
  const whatsappDisplay = settings.whatsappNumber || DEFAULT_WEBSITE_SETTINGS.whatsappNumber;

  const majorCities = [
    'Lahore',
    'Karachi',
    'Islamabad',
    'Rawalpindi',
    'Faisalabad',
    'Multan',
    'Peshawar',
    'Sialkot',
    'Gujranwala',
    'Quetta',
    'Other City',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || items.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const orderNumber = `IK-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const result = await submitPublicOrder({
        orderNumber,
        idempotencyKey,
        items: [...items],
        subtotal,
        shippingFee: shipping,
        total,
        customer: formData,
      });

      const order: PlacedOrder = {
        id: result.id,
        orderId: result.orderNumber || orderNumber,
        date: new Date().toLocaleDateString('en-PK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        items: [...items],
        subtotal: result.subtotal ?? subtotal,
        shipping: result.shippingFee ?? shipping,
        total: result.total ?? total,
        customer: formData,
        status: 'pending',
      };

      setCompletedOrder(order);
      onOrderSuccess(order);
      setIdempotencyKey(
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `ik-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      );
    } catch (err: any) {
      setSubmitError(err?.message || 'Unable to place your order right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppUrl = (order: PlacedOrder) => {
    const isBankOrJazzCash = order.customer.paymentMethod === 'bank_transfer';
    const paymentLabel = isBankOrJazzCash ? 'Bank Transfer / JazzCash' : 'Cash on Delivery (COD)';
    const text = `*New Order Placed at Intakhab* 🛍️\nOrder ID: ${order.orderId}\nCustomer: ${order.customer.fullName} (${order.customer.phone})\nCity: ${order.customer.city}\nAddress: ${order.customer.address}\n\n*Items:*\n${order.items.map((i) => `• ${i.name} (${i.quantity}x) - Shirt: ${i.shirtSize}, Pant: ${i.pantSize}, Shirt Len: ${i.shirtLength}, Pant Len: ${i.pantLength} - Rs. ${i.price * i.quantity}`).join('\n')}\n\n*Delivery:* Rs. ${order.shipping}\n*Total: Rs. ${order.total.toLocaleString('en-PK')}*\nPayment: ${paymentLabel}${isBankOrJazzCash ? '\n\n(Attaching payment transfer screenshot for immediate dispatch)' : ''}`;
    return `https://wa.me/${cleanWaDigits}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-[#FAF6F2] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/intakhab_calligraphy_logo.png"
              alt="Intakhab - انتخاب"
              className="h-8 w-auto object-contain"
            />
            <div className="border-l border-stone-300 pl-3">
              <h3 className="font-serif text-base font-semibold text-black">
                {completedOrder ? 'Order Confirmed' : 'Checkout & Dispatch'}
              </h3>
              <p className="text-[11px] text-stone-500">Secure Direct Order</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {completedOrder ? (
            /* Order Success Receipt */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="font-serif text-2xl font-semibold text-stone-900">
                  Shukriya! Your Order is Confirmed
                </h4>
                <p className="text-xs text-stone-500">
                  Order reference: <strong className="text-black font-mono">{completedOrder.orderId}</strong>
                </p>
              </div>

              <div className="bg-[#FAF6F2] p-4 rounded-lg text-left text-xs space-y-3 border border-stone-200">
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Recipient:</span>
                  <span className="font-semibold text-stone-900">{completedOrder.customer.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Delivery Address:</span>
                  <span className="font-semibold text-stone-900 text-right">{completedOrder.customer.address}, {completedOrder.customer.city}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Payment:</span>
                  <span className="font-semibold text-black uppercase">
                    {completedOrder.customer.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer / JazzCash'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Delivery Charges:</span>
                  <span className="font-semibold text-stone-900">Rs. {completedOrder.shipping} ({deliveryTimeText})</span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-bold text-stone-950">
                  <span>Total Amount:</span>
                  <span className="text-black font-bold">Rs.{completedOrder.total.toLocaleString('en-PK')}</span>
                </div>
              </div>

              {completedOrder.customer.paymentMethod === 'bank_transfer' ? (
                <div className="bg-[#EDE1C8]/35 border border-[#D8C7A5] p-4 text-left text-xs space-y-2">
                  <p className="font-bold uppercase tracking-wider text-black text-[11px]">
                    Account Details — Send Screenshot After Transfer
                  </p>
                  <div className="space-y-1 text-stone-800">
                    <p><span className="text-stone-500">ACCOUNT TITLE:</span> <strong>{settings.bankTitle}</strong></p>
                    <p><span className="text-stone-500">ACCOUNT NUMBER:</span> <strong className="font-mono">{settings.bankAccountNumber}</strong> ({settings.bankName})</p>
                    <p><span className="text-stone-500">JAZZCASH:</span> <strong className="font-mono">{settings.jazzcashNumber}</strong> — <strong>{settings.jazzcashName}</strong></p>
                  </div>
                  <p className="text-[11px] text-stone-700 font-medium pt-1">
                    After placing order, send screenshot to WhatsApp <strong>{settings.whatsappNumber}</strong> for immediate dispatch.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
                  Our tailoring team will inspect your order and dispatch it within {deliveryTimeText}. Our courier representative will contact you at <strong>{completedOrder.customer.phone}</strong> prior to delivery.
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={getWhatsAppUrl(completedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold rounded-none flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <WhatsAppIcon variant="glyph" className="w-4.5 h-4.5" />
                  <span>
                    {completedOrder.customer.paymentMethod === 'bank_transfer'
                      ? 'Send Screenshot on WhatsApp'
                      : 'Receive Updates on WhatsApp'}
                  </span>
                </a>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-[#EDE1C8] hover:text-black text-white text-xs font-semibold tracking-wider uppercase transition-colors"
                >
                  Back to Store
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Order Summary Strip */}
              <div className="bg-[#FAF6F2] p-4 rounded-lg border border-stone-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-900 block">
                    {items.length} {items.length === 1 ? 'Ensemble' : 'Ensembles'} in Order
                  </span>
                  <span className="text-stone-500">
                    Standard Delivery Rs. {shipping} PKR ({deliveryTimeText})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 text-[10px] uppercase block">Total</span>
                  <span className="text-base font-bold text-black tabular-nums">
                    Rs.{total.toLocaleString('en-PK')}
                  </span>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-black">
                  1. Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Ayesha Malik"
                        className="w-full text-xs py-2 px-3 pl-8 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5]"
                      />
                      <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      Phone Number (for Courier SMS & WhatsApp) *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+92 3XX XXXXXXX"
                        className="w-full text-xs py-2 px-3 pl-8 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5]"
                      />
                      <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ayesha@example.com"
                        className="w-full text-xs py-2 px-3 pl-8 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5]"
                      />
                      <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-black">
                  2. Shipping Address
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      House / Apartment / Street Address *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g. House 42, Street 5, Sector B"
                        className="w-full text-xs py-2 px-3 pl-8 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5]"
                      />
                      <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        City *
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full text-xs py-2 px-3 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5] bg-white cursor-pointer"
                      >
                        {majorCities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="54000"
                        className="w-full text-xs py-2 px-3 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      Tailoring / Delivery Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Special instructions regarding pant waist, door bell, or preferred delivery timing..."
                      rows={2}
                      className="w-full text-xs py-2 px-3 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-black">
                  3. Payment Method
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                      formData.paymentMethod === 'cod'
                        ? 'border-[#D8C7A5] bg-[#EDE1C8]/25'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                      className="mt-0.5 accent-[#D8C7A5]"
                    />
                    <div>
                      <span className="text-xs font-semibold text-stone-900 block">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Pay cash to courier upon inspecting package at your doorstep.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                      formData.paymentMethod === 'bank_transfer'
                        ? 'border-[#D8C7A5] bg-[#EDE1C8]/25'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={formData.paymentMethod === 'bank_transfer'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'bank_transfer' })}
                      className="mt-0.5 accent-[#D8C7A5]"
                    />
                    <div>
                      <span className="text-xs font-semibold text-stone-900 block">
                        Bank Transfer / JazzCash
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Direct online transfer with instant WhatsApp verification.
                      </span>
                    </div>
                  </label>
                </div>

                {formData.paymentMethod === 'bank_transfer' && (
                  <div className="p-4 bg-[#FAF6F2] border border-[#D8C7A5] space-y-3 text-xs animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <span className="font-bold uppercase tracking-wider text-black text-[11px]">
                        Account Details
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-600">
                        UBL / JazzCash
                      </span>
                    </div>

                    <div className="space-y-2 text-stone-800">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-stone-500 block">
                          ACCOUNT TITLE:
                        </span>
                        <span className="font-bold text-stone-950">{bankTitle}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 border border-stone-200">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-500 block">
                            ACCOUNT NUMBER ({bankName}):
                          </span>
                          <span className="font-mono font-bold text-stone-950 select-all">
                            {bankAccountNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('ubl', bankAccountNumber)}
                          className="px-2.5 py-1 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black text-[10px] font-semibold uppercase tracking-wider border border-[#D8C7A5] flex items-center gap-1 shrink-0"
                        >
                          {copiedField === 'ubl' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'ubl' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 border border-stone-200">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-500 block">
                            JAZZCASH ({jazzcashName}):
                          </span>
                          <span className="font-mono font-bold text-stone-950 select-all">
                            {jazzcashNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('jazzcash', jazzcashNumber)}
                          className="px-2.5 py-1 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black text-[10px] font-semibold uppercase tracking-wider border border-[#D8C7A5] flex items-center gap-1 shrink-0"
                        >
                          {copiedField === 'jazzcash' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'jazzcash' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <p className="text-[11px] text-stone-700 leading-relaxed">
                        After placing order, send screenshot to WhatsApp{' '}
                        <strong className="text-black">{whatsappDisplay}</strong> for immediate dispatch.
                      </p>
                      <a
                        href={`https://wa.me/${cleanWaDigits}?text=${encodeURIComponent(`Assalam o Alaikum! I am transferring Rs.${total.toLocaleString('en-PK')} for my Intakhab order and will share the payment screenshot here.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-semibold shrink-0 transition-colors"
                      >
                        <WhatsAppIcon variant="glyph" className="w-4 h-4" />
                        <span>Share on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="w-full py-4 bg-[#EDE1C8] hover:bg-[#dfd0b2] disabled:opacity-60 text-black text-xs font-semibold tracking-widest uppercase transition-all duration-200 shadow-md flex items-center justify-center gap-2 border border-[#D8C7A5]"
                >
                  {isSubmitting ? (
                    <span>CONFIRMING ORDER...</span>
                  ) : (
                    <span>CONFIRM & PLACE ORDER (Rs.{total.toLocaleString('en-PK')})</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
