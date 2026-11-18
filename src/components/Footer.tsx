import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Clock,
  Instagram,
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
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);

  const cleanWaDigits = (settings.whatsappNumber || '+92 325 6253921').replace(/[^0-9]/g, '') || '923256253921';
  const announcementItems = (settings.announcementText || DEFAULT_WEBSITE_SETTINGS.announcementText)
    .split('✦')
    .map((item) => item.trim())
    .filter(Boolean);

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
              loading="lazy"
              decoding="async"
              className="h-14 sm:h-16 w-auto object-contain mx-auto sm:mx-0"
            />
            <p className="font-serif text-xs sm:text-sm text-stone-800 mt-2 tracking-widest uppercase font-bold">
              Luxury Prêt &amp; Bespoke Stitched Suits
            </p>
          </div>

          <div className="max-w-md text-center sm:text-right text-xs sm:text-sm text-stone-800 font-medium leading-relaxed">
            Intakhab celebrates luxury Pakistani sartorial heritage. Each stitched piece is individually crafted in pure silks and velvets, complete with bespoke tailoring for contemporary women.
          </div>
        </div>

        {/* 2 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Column 1: CONTACT US */}
          <div className="md:col-span-6 space-y-4">
            <h3 className="font-bold text-xs sm:text-sm uppercase tracking-widest text-black border-b border-stone-200 pb-2">
              CONTACT US
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-stone-800 font-medium">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-black shrink-0" />
                <p>
                  <strong className="font-bold text-black">Phone :</strong>{' '}
                  <a href={`tel:+${cleanWaDigits}`} className="hover:text-black transition-colors font-semibold text-stone-900">
                    {settings.whatsappNumber}
                  </a>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-black shrink-0" />
                <p>
                  <strong className="font-bold text-black">Email :</strong>{' '}
                  <a href="mailto:intakhabclothing7@gmail.com" className="hover:text-black transition-colors font-semibold text-stone-900">
                    intakhabclothing7@gmail.com
                  </a>
                </p>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Clock className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-black block">Customer Service Hours:</strong>
                  <span className="font-semibold text-stone-900 block">Monday - Saturday</span>
                  <span className="font-semibold text-stone-900 block">9:00 am to 5:30 GMT+5.</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-4 space-y-2.5">
              <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-black">
                INTAKHAB
              </h4>
              <div className="space-y-2 text-xs sm:text-sm text-stone-900 font-semibold">
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
          <div className="md:col-span-6 space-y-4">
            <div>
              <button
                onClick={() => setIsPoliciesOpen(!isPoliciesOpen)}
                className="w-full flex items-center justify-between font-bold text-xs sm:text-sm uppercase tracking-widest text-black border-b border-stone-200 pb-2 cursor-pointer"
              >
                <span>OUR POLICIES</span>
                {isPoliciesOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              <div className={`mt-3 space-y-2 text-xs text-stone-800 font-medium ${isPoliciesOpen ? 'block' : 'hidden md:block'}`}>
                <div className="p-3 bg-[#FAF6F2] border border-stone-200/80 space-y-2 text-xs leading-relaxed">
                  <p>
                    <strong className="font-bold text-black block">Shipping &amp; Delivery:</strong>
                    Nationwide standard delivery takes {settings.deliveryTimeText} across Pakistan. Delivery charges are Rs. {settings.deliveryFee} PKR.
                  </p>
                  <p>
                    <strong className="font-bold text-black block">Exchanges:</strong>
                    Unworn garments with tags intact can be exchanged within 7 days of delivery.
                  </p>
                  <p>
                    <strong className="font-bold text-black block">Co-ord Tailoring:</strong>
                    Each piece is stitched to our signature ready-to-wear Intakhab boutique fit.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-800 font-semibold">
          <p>© 2026 Intakhab. All rights reserved. Premium Stitched Suits.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span>Bespoke Stitched Boutique</span>
            <span>·</span>
            <span>Silk Karandi &amp; French Velvet</span>
            <span>·</span>
            <span>WhatsApp Concierge Available</span>
            {onOpenAdmin && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1 text-stone-900 hover:text-black font-bold transition-colors cursor-pointer"
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
