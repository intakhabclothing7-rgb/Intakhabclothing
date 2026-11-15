import React from 'react';

interface WhatsAppIconProps {
  className?: string;
  variant?: 'badge' | 'glyph';
}

export const WhatsAppIcon: React.FC<WhatsAppIconProps> = ({
  className = 'w-6 h-6',
  variant = 'badge',
}) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {variant === 'badge' && (
        <>
          <defs>
            <linearGradient id="waIconGrad" x1="16" y1="1" x2="16" y2="31" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60FC7C" />
              <stop offset="100%" stopColor="#20B838" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="30" height="30" rx="7.5" fill="url(#waIconGrad)" />
        </>
      )}

      {/* White speech-bubble ring with tail */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 5.5A10.5 10.5 0 0 1 26.5 16 10.5 10.5 0 0 1 16 26.5a10.5 10.5 0 0 1-5.25-1.41L5.6 26.4l1.35-5.07A10.5 10.5 0 0 1 5.5 16 10.5 10.5 0 0 1 16 5.5Zm0 1.85a8.65 8.65 0 1 1-4.32 16.14l-3.53.36.36-3.52A8.65 8.65 0 0 1 16 7.35Z"
        fill="#FFFFFF"
      />

      {/* White telephone handset */}
      <path
        d="M20.45 17.85c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.55.12-.17.25-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.04s.88 2.37 1 2.53c.13.17 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.07.15-1.17-.07-.1-.23-.16-.47-.29Z"
        fill="#FFFFFF"
      />
    </svg>
  );
};
