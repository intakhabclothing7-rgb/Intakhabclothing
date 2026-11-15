import {
  Category,
  HeroSlide,
  HomepageContentSection,
  WebsiteSettings,
  BestSellerEntry,
} from '../types';
import { PRODUCTS } from './products';
import heroPortraitImg1 from '../assets/images/hero_portrait_model.png';
import heroPortraitImg2 from '../assets/images/hero_portrait_model_2.png';
import heroPortraitImg3 from '../assets/images/hero_portrait_model_3.png';
import heroPortraitImg4 from '../assets/images/hero_portrait_model_4.png';
import heroPortraitImg5 from '../assets/images/hero_portrait_model_5.png';
import gulzarFestiveImg from '../assets/images/gulzar_festive_boutique.png';
import wa0049 from '../assets/images/IMG-20261112-WA0049.jpg';
import wa0053 from '../assets/images/IMG-20261112-WA0053.jpg';
import wa0058 from '../assets/images/IMG-20261112-WA0058.jpg';

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  storeName: 'INTAKHAB',
  deliveryFee: 350,
  deliveryTimeText: '5–7 working days',
  whatsappNumber: '+92 325 6253921',
  instagramUrl: 'https://www.instagram.com/intakhab__womens_clothing?utm_source=qr',
  bankTitle: 'THE FRAGRANCES POINT',
  bankName: 'UNITED BANK LTD UBL',
  bankAccountNumber: '2211367921909',
  jazzcashNumber: '03086293355',
  jazzcashName: 'mazz al rehman',
  announcementText:
    'Resort Collection is LIVE ✦ Nationwide Delivery Rs. 350 PKR · 5–7 Working Days ✦ Bespoke Stitched Tailoring · D.H.A Lahore',
  heroTransitionMs: 2500,
  bestSellersLimit: 6,
};

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  heroPortraitImg1,
  heroPortraitImg2,
  heroPortraitImg3,
  heroPortraitImg4,
  heroPortraitImg5,
].map((img, idx) => ({
  id: `default-hero-${idx + 1}`,
  badgeText: 'THE SIGNATURE COLLECTION',
  title: 'Elegance in Every Stitch',
  urduSubtitle: 'انتخاب — ہر انداز میں نفاست',
  description:
    'Discover beautifully designed stitched suits that bring together timeless style, graceful details, and everyday comfort. Find your perfect look for every occasion.',
  ctaPrimaryText: 'SHOP THE COLLECTION',
  ctaPrimaryLink: 'collection:All',
  ctaSecondaryText: 'EXPLORE NEW ARRIVALS',
  ctaSecondaryLink: '#best-sellers',
  desktopImageUrl: img,
  mobileImageUrl: img,
  transitionMs: 2500,
  displayOrder: idx + 1,
  isActive: true,
}));

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-new-arrivals',
    name: 'New Arrivals',
    slug: 'new-arrivals',
    description: 'Latest ready-to-wear luxury stitched arrivals.',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-best-sellers',
    name: 'Best Sellers',
    slug: 'best-sellers',
    description: 'Most requested Intakhab co-ord silhouettes.',
    displayOrder: 2,
    isActive: true,
  },
];

export const DEFAULT_HOMEPAGE_CONTENT: Record<string, HomepageContentSection> = {
  new_arrivals_header: {
    sectionKey: 'new_arrivals_header',
    badgeText: '',
    heading: 'NEW ARRIVAL',
    subheading: 'Stitched Festive & Luxury Pret Edit',
    description: '',
    primaryCtaText: 'VIEW ALL',
    primaryCtaLink: 'collection:All',
    secondaryCtaText: '',
    secondaryCtaLink: '',
    imageUrl: '',
  },
  editorial_showcase: {
    sectionKey: 'editorial_showcase',
    badgeText: 'NEW SEASON COLLECTION',
    heading: 'Elegance in Every Thread',
    subheading: '',
    description:
      'Discover timeless styles, beautiful details, and outfits designed to make every moment special.',
    primaryCtaText: 'EXPLORE COLLECTION',
    primaryCtaLink: 'collection:All',
    secondaryCtaText: 'Follow @intakhab__womens_clothing',
    secondaryCtaLink: 'https://www.instagram.com/intakhab__womens_clothing?utm_source=qr',
    imageUrl: gulzarFestiveImg,
  },
  best_sellers_header: {
    sectionKey: 'best_sellers_header',
    badgeText: '',
    heading: 'BEST SELLERS',
    subheading: '',
    description: '',
    primaryCtaText: 'View all',
    primaryCtaLink: 'collection:Best Sellers',
    secondaryCtaText: '',
    secondaryCtaLink: '',
    imageUrl: '',
  },
};

export const DEFAULT_BEST_SELLERS: BestSellerEntry[] = [
  {
    id: 'bs-gulnar',
    productId: PRODUCTS[0].id,
    customTitle: 'GULNAR CRIMSON SET',
    customSubtitle: 'Crimson Rose Cotton-Silk Kurta & Wide-Leg Palazzo — Rs.14,500',
    customImageUrl: wa0049,
    displayOrder: 1,
    isActive: true,
    product: PRODUCTS[0],
  },
  {
    id: 'bs-noor',
    productId: PRODUCTS[1].id,
    customTitle: 'NOOR SAND CO-ORD SET',
    customSubtitle: 'Warm Sand Crepe-Silk with Handcrafted Loop Buttons — Rs.13,800',
    customImageUrl: wa0053,
    displayOrder: 2,
    isActive: true,
    product: PRODUCTS[1],
  },
  {
    id: 'bs-safa',
    productId: PRODUCTS[2].id,
    customTitle: 'SAFA ESPRESSO CO-ORD SET',
    customSubtitle: 'Deep Espresso Tailored Tunic & Culottes — Rs.13,800',
    customImageUrl: wa0058,
    displayOrder: 3,
    isActive: true,
    product: PRODUCTS[2],
  },
];
