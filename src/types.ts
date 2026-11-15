export interface Product {
  id: string;
  name: string;
  urduName?: string;
  slug?: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  originalPrice?: number;
  inStock: boolean;
  stockQuantity?: number;
  category: string;
  categoryIds?: string[];
  material: string;
  colour: string;
  availableSizes?: string[];
  availableColors?: string[];
  modelSpecs: string;
  description: string;
  features: string[];
  careInstructions: string[];
  images: string[];
  videoUrl?: string;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeroSlide {
  id: string;
  badgeText: string;
  title: string;
  urduSubtitle?: string;
  description: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  desktopImageUrl: string;
  mobileImageUrl?: string;
  transitionMs: number;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BestSellerEntry {
  id: string;
  productId: string;
  customTitle?: string;
  customSubtitle?: string;
  customImageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  product?: Product;
}

export interface HomepageContentSection {
  id?: string;
  sectionKey: string;
  badgeText: string;
  heading: string;
  subheading: string;
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  imageUrl: string;
}

export interface WebsiteSettings {
  storeName: string;
  deliveryFee: number;
  deliveryTimeText: string;
  whatsappNumber: string;
  instagramUrl: string;
  bankTitle: string;
  bankName: string;
  bankAccountNumber: string;
  jazzcashNumber: string;
  jazzcashName: string;
  announcementText: string;
  heroTransitionMs: number;
  bestSellersLimit: number;
}

export interface CartItem {
  cartId: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  shirtSize: string;
  pantSize: string;
  shirtLength: string;
  pantLength: string;
  quantity: number;
  material: string;
  colour: string;
}

export interface CheckoutDetails {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
  paymentMethod: 'cod' | 'bank_transfer' | 'card';
}

export interface PlacedOrder {
  id?: string;
  orderId: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: CheckoutDetails;
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  previousStatus?: string | null;
  newStatus: string;
  note: string;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city: string;
  postalCode?: string;
  notes?: string;
  paymentMethod: 'cod' | 'bank_transfer';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal: number;
  shippingFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  items: {
    id: string;
    productId: string | null;
    productName: string;
    productSku: string;
    productImage: string;
    shirtSize: string;
    pantSize: string;
    shirtLength: string;
    pantLength: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export interface ReviewMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  name?: string;
}

export interface Review {
  id: string;
  productId?: string | null;
  customerName: string;
  customerEmail?: string;
  city: string;
  rating: number;
  productName?: string;
  comment: string;
  date: string;
  updatedAt?: string;
  media?: ReviewMedia[];
  verified?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'hidden';
  isEditedByAdmin?: boolean;
  adminResponse?: string;
}

export interface ReviewAuditLog {
  id: string;
  reviewId: string | null;
  reviewRefId?: string;
  editedBy?: string | null;
  actionType?: 'edit' | 'status_change' | 'delete';
  customerName?: string;
  previousComment: string;
  newComment: string;
  previousRating?: number | null;
  newRating?: number | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  actionNote: string;
  createdAt: string;
}

export interface AdminRoleRecord {
  id: string;
  userId: string;
  email: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
}
