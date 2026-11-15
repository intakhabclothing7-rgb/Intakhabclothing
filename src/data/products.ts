import { Product } from '../types';

import wa0047 from '../assets/images/IMG-20261112-WA0047.jpg';
import wa0048 from '../assets/images/IMG-20261112-WA0048.jpg';
import wa0049 from '../assets/images/IMG-20261112-WA0049.jpg';
import wa0050 from '../assets/images/IMG-20261112-WA0050.jpg';
import wa0051 from '../assets/images/IMG-20261112-WA0051.jpg';
import wa0052 from '../assets/images/IMG-20261112-WA0052.jpg';

import wa0053 from '../assets/images/IMG-20261112-WA0053.jpg';
import wa0054 from '../assets/images/IMG-20261112-WA0054.jpg';
import wa0055 from '../assets/images/IMG-20261112-WA0055.jpg';
import wa0056 from '../assets/images/IMG-20261112-WA0056.jpg';
import wa0057 from '../assets/images/IMG-20261112-WA0057.jpg';

import wa0058 from '../assets/images/IMG-20261112-WA0058.jpg';
import wa0059 from '../assets/images/IMG-20261112-WA0059.jpg';
import wa0060 from '../assets/images/IMG-20261112-WA0060.jpg';
import wa0061 from '../assets/images/IMG-20261112-WA0061.jpg';

export const PRODUCTS: Product[] = [
  {
    id: 'gulnar-crimson-coord-set',
    name: 'Gulnar Crimson Co-ord Set',
    urduName: 'گلنار کریمسن سیٹ',
    sku: 'INT-GLN-0101',
    price: 14500,
    inStock: true,
    category: 'New Arrivals',
    isNewArrival: true,
    isBestSeller: true,
    material: 'Premium Cotton-Silk Slub Blend',
    colour: 'Crimson Rose',
    modelSpecs: "5'8\" wearing size Small (Shirt Length: 48, Pant Length: 38)",
    description:
      'Tailored in a refined crimson rose hue, the Gulnar Co-ord Set pairs a long A-line stitched kurta featuring a structured mandarin collar, concealed centre placket with graceful front slit, and gathered buttoned cuffs with matching wide-leg palazzo trousers.',
    features: [
      'Breathable luxury cotton-silk slub fabric with smooth drape',
      'Clean mandarin collar with concealed centre-front placket',
      'Voluminous gathered bishop sleeves finished with tailored button cuffs',
      'Centre front slit and deep side slits for effortless movement',
      'Matching full-length wide-leg palazzo trousers',
      'Double-stitched couture seams for lasting shape and comfort',
    ],
    careInstructions: [
      'Dry clean or gentle cold hand wash recommended',
      'Steam iron on medium heat from the reverse side',
      'Dry in shade to preserve rich crimson tone',
      'Do not bleach or wring',
    ],
    images: [wa0047, wa0048, wa0050, wa0051, wa0052, wa0049],
  },
  {
    id: 'noor-sand-coord-set',
    name: 'Noor Sand Co-ord Set',
    urduName: 'نور سینڈ سیٹ',
    sku: 'INT-NOR-0102',
    price: 13800,
    inStock: true,
    category: 'New Arrivals',
    isNewArrival: true,
    isBestSeller: true,
    material: 'Matte Luxury Crepe-Silk',
    colour: 'Warm Sand Taupe',
    modelSpecs: "5'8\" wearing size Small (Shirt Length: 40, Pant Length: 36)",
    description:
      'Effortless minimalism crafted in warm sand matte crepe-silk. The Noor Co-ord Set showcases a sculpted straight-cut tunic adorned with delicate handcrafted fabric-loop frog buttons down the front placket, paired with cropped wide-leg culottes for timeless day-to-evening poise.',
    features: [
      'Smooth matte luxury crepe-silk with wrinkle-resistant finish',
      'Handcrafted tonal fabric-covered loop frog button closures along placket',
      'Refined jewel neckline and relaxed straight silhouette with side slits',
      'Three-quarter sleeves finished with crisp turn-back cuffs',
      'Matching tailored cropped wide-leg culottes with clean centre crease',
    ],
    careInstructions: [
      'Dry clean recommended for best finish',
      'Light steam iron on low heat',
      'Hang on padded hanger to maintain drape',
    ],
    images: [wa0053, wa0054, wa0055, wa0057, wa0056],
  },
  {
    id: 'safa-espresso-coord-set',
    name: 'Safa Espresso Co-ord Set',
    urduName: 'صفا ایسپریسو سیٹ',
    sku: 'INT-SAF-0103',
    price: 13800,
    inStock: true,
    category: 'Best Sellers',
    isNewArrival: true,
    isBestSeller: true,
    material: 'Matte Luxury Crepe-Silk',
    colour: 'Deep Espresso Brown',
    modelSpecs: "5'8\" wearing size Small (Shirt Length: 40, Pant Length: 36)",
    description:
      'Sophisticated monochrome tailoring in rich espresso brown. Designed in fluid matte crepe-silk, the Safa Co-ord Set features our signature artisanal fabric-loop button placket, three-quarter cuffed sleeves, and matching wide-leg trousers for understated everyday elegance.',
    features: [
      'Fluid matte crepe-silk fabric with soft, breathable all-day comfort',
      'Vertical centre placket detailed with tonal handcrafted loop buttons',
      'Clean round neckline with subtle front hem vent and side slits',
      'Tailored three-quarter sleeves with structured cuffs',
      'Relaxed wide-leg culotte trousers with tailored waistline',
    ],
    careInstructions: [
      'Dry clean or gentle cool wash',
      'Steam press on reverse side at low setting',
      'Store away from direct sunlight',
    ],
    images: [wa0058, wa0059, wa0060, wa0061],
  },
];
