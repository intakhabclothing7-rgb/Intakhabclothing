import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Clock,
  Instagram,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { WebsiteSettings } from '../types';
import { DEFAULT_WEBSITE_SETTINGS } from '../data/defaults';

interface FooterProps {
  settings?: WebsiteSettings;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings = DEFAULT_WEBSITE_SETTINGS,
  onOpenAdmin,
}) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);

  const cleanWaDigits = (settings.whatsappNumber || '+92 325 6253921').replace(/[^0-9]/g, '') || '923256253921';
  const announcementItems = (settings.announcementText || DEFAULT_WEBSITE_SETTINGS.announcementText)
    .split('✦')
    .map((item) => item.trim())
    .filter(Boolean);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer id="contact" className="bg-white border-t border-stone-200 text-stone-800">
      {/* Editorial Announcement Bar */}
      <div className="bg-[#EDE1C8] text-black py-3 overflow-hidden text-xs uppercase tracking-widest font-semibold border-b border-[#D8C7A5]">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-10">
          {[...announcementItems, ...announcementItems].map((text, index) => (
            <React.Fragment key={index}>
              <span>{text}</span>
              <span className="text-stone-700">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        {/* Top Logo & Statement */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-8 border-b border-stone-200">
          <div className="text-center sm:text-left">
            <img
              src="/assets/intakhab_calligraphy_logo.png"
              alt="Intakhab - انتخاب"
              className="h-14 sm:h-16 w-auto object-contain mx-auto sm:mx-0"
            />
            <p className="font-serif text-xs text-stone-500 mt-2 tracking-widest uppercase">
              Luxury Prêt & Bespoke Stitched Suits
            </p>
          </div>

          <div className="max-w-md text-center sm:text-right text-xs text-stone-500 leading-relaxed">
            Intakhab celebrates luxury Pakistani sartorial heritage. Each stitched piece is individually crafted in pure silks and velvets, complete with bespoke length customizations for contemporary women.
          </div>
        </div>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Column 1: CONTACT US */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-widest text-stone-900 border-b border-stone-100 pb-2">
              CONTACT US
            </h3>

            <div className="space-y-3 text-xs text-stone-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <p>
                  <strong className="text-stone-900">Address:</strong> D.H.A Lahore, Pakistan
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-black shrink-0" />
                <p>
                  <strong className="text-stone-900">Phone :</strong>{' '}
                  <a href={`tel:+${cleanWaDigits}`} className="hover:text-black transition-colors font-medium">
                    {settings.whatsappNumber}
                  </a>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-black shrink-0" />
                <p>
                  <strong className="text-stone-900">Email :</strong>{' '}
                  <a href="mailto:intakhabclothing7@gmail.com" className="hover:text-black transition-colors font-medium">
                    intakhabclothing7@gmail.com
                  </a>
                </p>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Clock className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block">Customer Service Hours:</strong>
                  <span>Monday - Saturday</span>
                  <br />
                  <span>9:00 am to 5:30 GMT+5.</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-4 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-900">
                INTAKHAB
              </h4>
              <div className="space-y-2 text-xs text-stone-600">
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-black transition-colors"
                >
                  <Instagram className="w-4 h-4 text-black" />
                  <span>Instagram</span>
                </a>
                <a
                  href={`https://wa.me/${cleanWaDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-black transition-colors"
                >
                  <WhatsAppIcon variant="badge" className="w-4.5 h-4.5" />
                  <span>Whatsapp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: OUR POLICIES */}
          <div className="md:col-span-3 space-y-4">
            <div>
              <button
                onClick={() => setIsPoliciesOpen(!isPoliciesOpen)}
                className="w-full flex items-center justify-between font-bold text-xs uppercase tracking-widest text-stone-900 border-b border-stone-100 pb-2"
              >
                <span>OUR POLICIES</span>
                {isPoliciesOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              <div className={`mt-3 space-y-2 text-xs text-stone-600 ${isPoliciesOpen ? 'block' : 'hidden md:block'}`}>
                <div className="p-3 bg-[#FAF6F2] border border-stone-200/80 space-y-2 text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-stone-900 block">Shipping & Delivery:</strong>
                    Nationwide standard delivery takes {settings.deliveryTimeText} across Pakistan. Delivery charges are Rs. {settings.deliveryFee} PKR.
                  </p>
                  <p>
                    <strong className="text-stone-900 block">Exchanges:</strong>
                    Unworn garments with tags intact can be exchanged within 7 days of delivery.
                  </p>
                  <p>
                    <strong className="text-stone-900 block">Custom Lengths:</strong>
                    Each piece is tailored to your chosen shirt and pant length specifications at our Lahore facility.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: FOLLOW THE LATEST TRENDS AND STYLES */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-widest text-stone-900 border-b border-stone-100 pb-2">
              FOLLOW THE LATEST TRENDS AND STYLES
            </h3>

            <p className="text-xs text-stone-600">
              Be the first to access new drops, velvet capsules, and VIP previews.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full py-3 px-3.5 text-xs bg-white border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5] text-stone-900 placeholder:text-stone-400"
              />

              <button
                type="submit"
                className="w-full sm:w-36 py-3 px-6 bg-black hover:bg-[#EDE1C8] hover:text-black text-white text-xs font-semibold tracking-widest uppercase transition-colors rounded-none shadow-sm"
              >
                SUBSCRIBE
              </button>
            </form>

            {isSubscribed && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thank you for joining Intakhab VIP updates!</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <p>© 2026 Intakhab. All rights reserved. Premium Stitched Suits.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span>D.H.A Lahore Boutique</span>
            <span>·</span>
            <span>Silk Karandi & French Velvet</span>
            <span>·</span>
            <span>WhatsApp Concierge Available</span>
            {onOpenAdmin && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1 text-stone-600 hover:text-black font-medium transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
