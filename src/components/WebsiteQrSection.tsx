import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Copy, Check, Smartphone } from 'lucide-react';

const OFFICIAL_WEBSITE_URL = 'https://intakhab.site';

export const WebsiteQrSection: React.FC = () => {
  const websiteUrl = OFFICIAL_WEBSITE_URL;
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(websiteUrl, {
      width: 512,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        // Ignore QR generation edge errors silently
      });
    return () => {
      active = false;
    };
  }, [websiteUrl]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(websiteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'intakhab-website-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section
      id="website-qr"
      className="py-12 sm:py-16 bg-white border-b border-stone-200"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF6F2] border border-[#D8C7A5] p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Copy */}
          <div className="md:col-span-7 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-stone-950">
              <Smartphone className="w-4 h-4 text-stone-900" />
              <span>Instant Mobile Access</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl text-stone-950 font-bold tracking-tight">
              Scan to Visit Intakhab
            </h2>

            <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
              Point your phone camera at this QR code to open the official Intakhab website directly on your mobile device, explore our stitched collections, or share with family and friends.
            </p>

            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2.5">
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={!qrDataUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download QR</span>
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-stone-100 text-stone-950 border border-stone-400 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Website Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right QR Card */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="bg-white border border-stone-200 p-4 sm:p-5 shadow-sm flex flex-col items-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scan QR code to open Intakhab website"
                  width={192}
                  height={192}
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                />
              ) : (
                <div className="w-44 h-44 sm:w-48 sm:h-48 bg-stone-50 flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-stone-400" />
                </div>
              )}
              <span className="mt-3 text-[11px] font-mono font-semibold text-stone-800 text-center break-all max-w-[220px]">
                {websiteUrl}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
