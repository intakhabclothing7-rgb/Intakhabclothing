import {
  supabase,
  isSupabaseConfigured,
  supabaseConfigError,
  uploadMediaToSupabase,
} from '../lib/supabase';
import {
  Product,
  Category,
  HeroSlide,
  BestSellerEntry,
  Review,
  ReviewAuditLog,
  HomepageContentSection,
  WebsiteSettings,
  OrderRecord,
  OrderStatusHistoryEntry,
  AdminRoleRecord,
  CartItem,
  CheckoutDetails,
  ReviewMedia,
} from '../types';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';
import { INITIAL_REVIEWS } from '../data/reviews';
import {
  DEFAULT_WEBSITE_SETTINGS,
  DEFAULT_HERO_SLIDES,
  DEFAULT_CATEGORIES,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_BEST_SELLERS,
} from '../data/defaults';

function formatSupabaseError(
  context: string,
  err: { message?: string; code?: string; details?: string; hint?: string } | null | undefined
): string {
  if (!err) return `${context}: Unknown Supabase error.`;
  const codePart = err.code ? ` [${err.code}]` : '';
  const detailPart = err.details ? ` (${err.details})` : '';
  return `${context}${codePart}: ${err.message || 'Request failed'}${detailPart}`;
}

function requireClient() {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error(
      supabaseConfigError ||
        'Supabase credentials are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) in your environment.'
    );
  }
  return supabase;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(iso?: string): string {
  if (!iso) {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function mapProductRow(
  row: Record<string, any>,
  imagesMap: Map<string, string[]>,
  categoryMap: Map<string, string[]>
): Product {
  const images = imagesMap.get(row.id) || [];
  const salePrice = row.sale_price !== null && row.sale_price !== undefined ? Number(row.sale_price) : null;
  const regularPrice = Number(row.price || 0);
  const effectivePrice = salePrice !== null && salePrice > 0 && salePrice < regularPrice ? salePrice : regularPrice;

  return {
    id: row.id,
    name: row.name,
    urduName: row.urdu_name || '',
    slug: row.slug,
    sku: row.sku,
    price: effectivePrice,
    originalPrice: salePrice !== null && salePrice > 0 && salePrice < regularPrice ? regularPrice : undefined,
    salePrice,
    inStock: Boolean(row.in_stock) && Number(row.stock_quantity ?? 1) > 0,
    stockQuantity: Number(row.stock_quantity ?? 10),
    category: row.category || 'New Arrivals',
    categoryIds: categoryMap.get(row.id) || [],
    material: row.material || '',
    colour: row.colour || '',
    availableSizes: Array.isArray(row.available_sizes) ? row.available_sizes : ['XS', 'S', 'M', 'L', 'XL'],
    availableColors: Array.isArray(row.available_colors) ? row.available_colors : [],
    modelSpecs: row.model_specs || '',
    description: row.description || '',
    features: Array.isArray(row.features) ? row.features : [],
    careInstructions: Array.isArray(row.care_instructions) ? row.care_instructions : [],
    images: images.length > 0 ? images : [],
    isBestSeller: Boolean(row.is_best_seller),
    isNewArrival: Boolean(row.is_new_arrival),
    isFeatured: Boolean(row.is_featured),
    isActive: row.is_active !== false,
    displayOrder: Number(row.display_order ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// ADMIN AUTHENTICATION (Supabase Auth + admin_roles authorization)
// ============================================================================

export async function getAuthorizedAdmin(): Promise<AdminRoleRecord | null> {
  if (!supabase) return null;
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) {
    throw new Error(formatSupabaseError('Supabase Auth session check failed', sessionErr));
  }
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('admin_roles')
    .select('id, user_id, email, role, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError('Unable to verify administrator role in admin_roles', error));
  }
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    email: data.email,
    role: data.role,
    isActive: data.is_active,
  };
}

export async function signInAdmin(email: string, password: string): Promise<AdminRoleRecord> {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) {
    throw new Error(error?.message || 'Invalid email or password.');
  }

  const { data: roleRow, error: roleError } = await client
    .from('admin_roles')
    .select('id, user_id, email, role, is_active')
    .eq('user_id', data.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (roleError) {
    await client.auth.signOut();
    throw new Error(
      formatSupabaseError('Signed in to Supabase Auth, but admin_roles lookup failed', roleError)
    );
  }

  if (!roleRow) {
    await client.auth.signOut();
    throw new Error(
      'Access denied: This authenticated account does not have an active administrator record in public.admin_roles.'
    );
  }

  return {
    id: roleRow.id,
    userId: roleRow.user_id,
    email: roleRow.email,
    role: roleRow.role,
    isActive: roleRow.is_active,
  };
}

export async function signOutAdmin(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

// ============================================================================
// PUBLIC STOREFRONT DATA LOADING (with safe fallback when not configured)
// ============================================================================

export interface StorefrontSnapshot {
  products: Product[];
  categories: Category[];
  heroSlides: HeroSlide[];
  bestSellers: BestSellerEntry[];
  reviews: Review[];
  homepageContent: Record<string, HomepageContentSection>;
  settings: WebsiteSettings;
  fromSupabase: boolean;
  connectionError?: string | null;
}

export async function verifyCategoriesConnection(): Promise<{
  ok: boolean;
  count: number;
  categories: { id: string; name: string; slug: string }[];
  error?: string;
}> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: false,
      count: 0,
      categories: [],
      error: supabaseConfigError || 'Supabase environment variables are not configured.',
    };
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    return {
      ok: false,
      count: 0,
      categories: [],
      error: formatSupabaseError('categories query failed', error),
    };
  }

  return {
    ok: true,
    count: (data || []).length,
    categories: (data || []) as { id: string; name: string; slug: string }[],
  };
}

export async function fetchStorefrontSnapshot(): Promise<StorefrontSnapshot> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      products: DEFAULT_PRODUCTS,
      categories: DEFAULT_CATEGORIES,
      heroSlides: DEFAULT_HERO_SLIDES,
      bestSellers: DEFAULT_BEST_SELLERS,
      reviews: INITIAL_REVIEWS,
      homepageContent: DEFAULT_HOMEPAGE_CONTENT,
      settings: DEFAULT_WEBSITE_SETTINGS,
      fromSupabase: false,
      connectionError:
        supabaseConfigError ||
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
    };
  }

  try {
    const [
      productsRes,
      imagesRes,
      prodCatsRes,
      categoriesRes,
      heroRes,
      bestSellersRes,
      reviewsRes,
      contentRes,
      settingsRes,
    ] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('product_images')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true }),
      supabase.from('product_categories').select('*'),
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('best_sellers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('reviews')
        .select(
          'id, product_id, product_name, customer_name, city, rating, comment, media, status, is_edited_by_admin, admin_response, created_at, updated_at'
        )
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
      supabase.from('homepage_content').select('*'),
      supabase
        .from('public_store_settings')
        .select(
          'store_name, delivery_fee, delivery_time_text, whatsapp_number, instagram_url, announcement_text, hero_transition_ms, best_sellers_limit'
        )
        .limit(1)
        .maybeSingle(),
    ]);

    let finalSettingsRes = settingsRes;
    if (settingsRes.error?.code === '42P01') {
      finalSettingsRes = await supabase
        .from('website_settings')
        .select(
          'store_name, delivery_fee, delivery_time_text, whatsapp_number, instagram_url, announcement_text, hero_transition_ms, best_sellers_limit'
        )
        .eq('id', 1)
        .maybeSingle();
    }

    const queryErrors: string[] = [];
    if (categoriesRes.error) queryErrors.push(formatSupabaseError('categories', categoriesRes.error));
    if (productsRes.error) queryErrors.push(formatSupabaseError('products', productsRes.error));
    if (imagesRes.error) queryErrors.push(formatSupabaseError('product_images', imagesRes.error));
    if (prodCatsRes.error) queryErrors.push(formatSupabaseError('product_categories', prodCatsRes.error));
    if (heroRes.error) queryErrors.push(formatSupabaseError('hero_slides', heroRes.error));
    if (bestSellersRes.error) queryErrors.push(formatSupabaseError('best_sellers', bestSellersRes.error));
    if (reviewsRes.error) queryErrors.push(formatSupabaseError('reviews', reviewsRes.error));
    if (contentRes.error) queryErrors.push(formatSupabaseError('homepage_content', contentRes.error));
    if (finalSettingsRes.error)
      queryErrors.push(formatSupabaseError('public_store_settings', finalSettingsRes.error));

    if (queryErrors.length > 0) {
      console.error('[INTAKHAB Supabase Error]', queryErrors.join(' | '));
    }

    const hasProducts = !productsRes.error && productsRes.data && productsRes.data.length > 0;

    // Build image & category lookup maps
    const imagesMap = new Map<string, string[]>();
    if (!imagesRes.error && imagesRes.data) {
      imagesRes.data.forEach((img: any) => {
        const list = imagesMap.get(img.product_id) || [];
        list.push(img.image_url);
        imagesMap.set(img.product_id, list);
      });
    }

    const catMap = new Map<string, string[]>();
    if (!prodCatsRes.error && prodCatsRes.data) {
      prodCatsRes.data.forEach((row: any) => {
        const list = catMap.get(row.product_id) || [];
        list.push(row.category_id);
        catMap.set(row.product_id, list);
      });
    }

    const products: Product[] = hasProducts
      ? productsRes.data!.map((row: any) => {
          const mapped = mapProductRow(row, imagesMap, catMap);
          // Match fallback images if seeded SQL has no product_images yet
          if (mapped.images.length === 0) {
            const matchingDefault = DEFAULT_PRODUCTS.find(
              (dp) => dp.sku === mapped.sku || dp.slug === mapped.slug
            );
            if (matchingDefault) {
              mapped.images = matchingDefault.images;
            }
          }
          return mapped;
        })
      : DEFAULT_PRODUCTS;

    const categories: Category[] =
      !categoriesRes.error && categoriesRes.data && categoriesRes.data.length > 0
        ? categoriesRes.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            imageUrl: c.image_url || '',
            displayOrder: Number(c.display_order ?? 0),
            isActive: Boolean(c.is_active),
          }))
        : DEFAULT_CATEGORIES;

    const heroSlides: HeroSlide[] =
      !heroRes.error && heroRes.data && heroRes.data.length > 0
        ? heroRes.data.map((h: any) => ({
            id: h.id,
            badgeText: h.badge_text || 'THE SIGNATURE COLLECTION',
            title: h.title || 'Elegance in Every Stitch',
            urduSubtitle: h.urdu_subtitle || '',
            description: h.description || '',
            ctaPrimaryText: h.cta_primary_text || 'SHOP THE COLLECTION',
            ctaPrimaryLink: h.cta_primary_link || 'collection:All',
            ctaSecondaryText: h.cta_secondary_text || '',
            ctaSecondaryLink: h.cta_secondary_link || '#best-sellers',
            desktopImageUrl: h.desktop_image_url,
            mobileImageUrl: h.mobile_image_url || h.desktop_image_url,
            transitionMs: Number(h.transition_ms ?? 2500),
            displayOrder: Number(h.display_order ?? 0),
            isActive: Boolean(h.is_active),
          }))
        : DEFAULT_HERO_SLIDES;

    const rawSettings =
      !finalSettingsRes.error && finalSettingsRes.data
        ? (finalSettingsRes.data as Record<string, any>)
        : null;

    const settings: WebsiteSettings = rawSettings
      ? {
          storeName: rawSettings.store_name || DEFAULT_WEBSITE_SETTINGS.storeName,
          deliveryFee: Number(rawSettings.delivery_fee ?? DEFAULT_WEBSITE_SETTINGS.deliveryFee),
          deliveryTimeText:
            rawSettings.delivery_time_text || DEFAULT_WEBSITE_SETTINGS.deliveryTimeText,
          whatsappNumber:
            rawSettings.whatsapp_number || DEFAULT_WEBSITE_SETTINGS.whatsappNumber,
          instagramUrl: rawSettings.instagram_url || DEFAULT_WEBSITE_SETTINGS.instagramUrl,
          bankTitle: rawSettings.bank_title || DEFAULT_WEBSITE_SETTINGS.bankTitle,
          bankName: rawSettings.bank_name || DEFAULT_WEBSITE_SETTINGS.bankName,
          bankAccountNumber:
            rawSettings.bank_account_number || DEFAULT_WEBSITE_SETTINGS.bankAccountNumber,
          jazzcashNumber:
            rawSettings.jazzcash_number || DEFAULT_WEBSITE_SETTINGS.jazzcashNumber,
          jazzcashName: rawSettings.jazzcash_name || DEFAULT_WEBSITE_SETTINGS.jazzcashName,
          announcementText:
            rawSettings.announcement_text || DEFAULT_WEBSITE_SETTINGS.announcementText,
          heroTransitionMs: Number(
            rawSettings.hero_transition_ms ?? DEFAULT_WEBSITE_SETTINGS.heroTransitionMs
          ),
          bestSellersLimit: Number(
            rawSettings.best_sellers_limit ?? DEFAULT_WEBSITE_SETTINGS.bestSellersLimit
          ),
        }
      : DEFAULT_WEBSITE_SETTINGS;

    const homepageContent: Record<string, HomepageContentSection> = { ...DEFAULT_HOMEPAGE_CONTENT };
    if (!contentRes.error && contentRes.data) {
      contentRes.data.forEach((row: any) => {
        const existing = homepageContent[row.section_key];
        homepageContent[row.section_key] = {
          id: row.id,
          sectionKey: row.section_key,
          badgeText: row.badge_text ?? existing?.badgeText ?? '',
          heading: row.heading ?? existing?.heading ?? '',
          subheading: row.subheading ?? existing?.subheading ?? '',
          description: row.description ?? existing?.description ?? '',
          primaryCtaText: row.primary_cta_text ?? existing?.primaryCtaText ?? '',
          primaryCtaLink: row.primary_cta_link ?? existing?.primaryCtaLink ?? '',
          secondaryCtaText: row.secondary_cta_text ?? existing?.secondaryCtaText ?? '',
          secondaryCtaLink: row.secondary_cta_link ?? existing?.secondaryCtaLink ?? '',
          imageUrl: row.image_url || existing?.imageUrl || '',
        };
      });
    }

    let bestSellers: BestSellerEntry[] = DEFAULT_BEST_SELLERS;
    const bestSellersCatId = categories.find(
      (c) => c.slug === 'best-sellers' || c.name.toLowerCase() === 'best sellers'
    )?.id;

    if (hasProducts) {
      const mappedBs: BestSellerEntry[] =
        !bestSellersRes.error && bestSellersRes.data
          ? (bestSellersRes.data
              .map((bs: any) => {
                const matchedProd = products.find((p) => p.id === bs.product_id);
                if (!matchedProd) return null;
                if (bs.is_active !== false) {
                  matchedProd.isBestSeller = true;
                }
                return {
                  id: bs.id,
                  productId: bs.product_id,
                  customTitle: bs.custom_title || matchedProd.name,
                  customSubtitle:
                    bs.custom_subtitle ||
                    `${matchedProd.material} — Rs.${matchedProd.price.toLocaleString('en-PK')}`,
                  customImageUrl: bs.custom_image_url || matchedProd.images[0] || '',
                  displayOrder: Number(bs.display_order ?? 0),
                  isActive: Boolean(bs.is_active),
                  product: matchedProd,
                };
              })
              .filter(Boolean) as BestSellerEntry[])
          : [];

      const seenBestSellerProductIds = new Set(mappedBs.map((entry) => entry.productId));

      products.forEach((prod) => {
        const isInBestSellerCat =
          prod.category.toLowerCase() === 'best sellers' ||
          (bestSellersCatId ? prod.categoryIds?.includes(bestSellersCatId) : false);
        if (isInBestSellerCat) {
          prod.isBestSeller = true;
        }
        if (prod.isBestSeller && !seenBestSellerProductIds.has(prod.id)) {
          seenBestSellerProductIds.add(prod.id);
          mappedBs.push({
            id: `bs-prod-${prod.id}`,
            productId: prod.id,
            customTitle: prod.name.toUpperCase(),
            customSubtitle: `${prod.material} — Rs.${prod.price.toLocaleString('en-PK')}`,
            customImageUrl: prod.images[0] || '',
            displayOrder: mappedBs.length + 1,
            isActive: true,
            product: prod,
          });
        }
      });

      bestSellers = mappedBs.slice(0, settings.bestSellersLimit);
    }

    const reviews: Review[] =
      !reviewsRes.error && Array.isArray(reviewsRes.data)
        ? reviewsRes.data.map((r: any) => ({
            id: r.id,
            productId: r.product_id,
            customerName: r.customer_name,
            city: r.city,
            rating: Number(r.rating),
            productName: r.product_name || undefined,
            comment: r.comment,
            date: formatDate(r.created_at),
            updatedAt: r.updated_at,
            media: Array.isArray(r.media) ? r.media : [],
            verified: true,
            status: r.status,
            isEditedByAdmin: Boolean(r.is_edited_by_admin),
            adminResponse: r.admin_response || undefined,
          }))
        : [];

    const allFailed =
      Boolean(categoriesRes.error) &&
      Boolean(productsRes.error) &&
      Boolean(finalSettingsRes.error);

    return {
      products,
      categories,
      heroSlides,
      bestSellers,
      reviews,
      homepageContent,
      settings,
      fromSupabase: !allFailed,
      connectionError:
        queryErrors.length > 0
          ? `Supabase connection/permission error: ${queryErrors.join('; ')}`
          : null,
    };
  } catch (err: any) {
    const message =
      err?.message || 'Unable to connect to Supabase. Check VITE_SUPABASE_URL, key, and network.';
    console.error('[INTAKHAB Supabase Connection Error]', err);
    return {
      products: DEFAULT_PRODUCTS,
      categories: DEFAULT_CATEGORIES,
      heroSlides: DEFAULT_HERO_SLIDES,
      bestSellers: DEFAULT_BEST_SELLERS,
      reviews: INITIAL_REVIEWS,
      homepageContent: DEFAULT_HOMEPAGE_CONTENT,
      settings: DEFAULT_WEBSITE_SETTINGS,
      fromSupabase: false,
      connectionError: message,
    };
  }
}

// ============================================================================
// PUBLIC CHECKOUT & REVIEW SUBMISSION
// ============================================================================

export async function submitPublicOrder(params: {
  orderNumber: string;
  idempotencyKey?: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  customer: CheckoutDetails;
}): Promise<{
  id?: string;
  orderNumber?: string;
  subtotal?: number;
  shippingFee?: number;
  total?: number;
  syncedToSupabase: boolean;
}> {
  if (!supabase || !isSupabaseConfigured) {
    return { syncedToSupabase: false };
  }

  const isUuid = (val: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const itemsPayload = params.items.map((item) => ({
    product_id: isUuid(item.productId) ? item.productId : null,
    product_name: item.name,
    product_sku: '',
    product_image: item.image || '',
    shirt_size: item.shirtSize,
    pant_size: item.pantSize,
    shirt_length: item.shirtLength,
    pant_length: item.pantLength,
    quantity: item.quantity,
  }));

  const { data, error } = await supabase.rpc('create_public_order', {
    p_order_number: params.orderNumber,
    p_idempotency_key: params.idempotencyKey || null,
    p_customer_name: params.customer.fullName,
    p_customer_phone: params.customer.phone,
    p_customer_email: params.customer.email || '',
    p_shipping_address: params.customer.address,
    p_city: params.customer.city,
    p_postal_code: params.customer.postalCode || '',
    p_notes: params.customer.notes || '',
    p_payment_method: params.customer.paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'cod',
    p_items: itemsPayload,
  });

  if (error || !data) {
    throw new Error(error?.message || 'Unable to save order.');
  }

  const resObj = typeof data === 'object' ? data : { id: String(data) };

  return {
    id: resObj.id ? String(resObj.id) : undefined,
    orderNumber: resObj.order_number ? String(resObj.order_number) : params.orderNumber,
    subtotal: resObj.subtotal !== undefined ? Number(resObj.subtotal) : params.subtotal,
    shippingFee: resObj.shipping_fee !== undefined ? Number(resObj.shipping_fee) : params.shippingFee,
    total: resObj.total !== undefined ? Number(resObj.total) : params.total,
    syncedToSupabase: true,
  };
}

export async function submitPublicReview(params: {
  customerName: string;
  customerEmail?: string;
  city: string;
  rating: number;
  productId?: string | null;
  productName?: string;
  comment: string;
  mediaFiles?: File[];
}): Promise<{ review: Review; pendingApproval: boolean }> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured yet.');
  }

  const uploadedMedia: ReviewMedia[] =
    params.mediaFiles && params.mediaFiles.length > 0
      ? await Promise.all(
          params.mediaFiles.map(async (file) => {
            const res = await uploadMediaToSupabase(file, 'review-uploads');
            return {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
              url: res.publicUrl,
              name: file.name,
            };
          })
        )
      : [];

  const isUuid = (val?: string | null) =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

  const { data: reviewId, error } = await supabase.rpc('create_public_review', {
    p_product_id: isUuid(params.productId) ? params.productId : null,
    p_product_name: params.productName || '',
    p_customer_name: params.customerName.trim(),
    p_customer_email: params.customerEmail?.trim() || '',
    p_city: params.city.trim(),
    p_rating: params.rating,
    p_comment: params.comment.trim(),
    p_media: uploadedMedia,
  });

  if (error || !reviewId) {
    throw new Error(error?.message || 'Failed to submit review.');
  }

  // Check if the database published the review immediately ('approved')
  const { data: liveRow } = await supabase
    .from('reviews')
    .select('id, status')
    .eq('id', String(reviewId))
    .maybeSingle();

  const isLiveImmediately = liveRow?.status === 'approved';

  return {
    pendingApproval: !isLiveImmediately,
    review: {
      id: String(reviewId),
      customerName: params.customerName.trim(),
      city: params.city.trim(),
      rating: params.rating,
      productName: params.productName || undefined,
      comment: params.comment.trim(),
      media: uploadedMedia,
      status: isLiveImmediately ? 'approved' : 'pending',
      date: formatDate(),
      verified: true,
    },
  };
}

// ============================================================================
// ADMIN DASHBOARD DATA & FULL CRUD MUTATIONS
// ============================================================================

export interface AdminDashboardBundle {
  products: Product[];
  categories: Category[];
  heroSlides: HeroSlide[];
  bestSellers: BestSellerEntry[];
  reviews: Review[];
  auditLogs: ReviewAuditLog[];
  homepageContent: Record<string, HomepageContentSection>;
  orders: OrderRecord[];
  settings: WebsiteSettings;
}

export async function fetchAdminDashboardBundle(): Promise<AdminDashboardBundle> {
  const client = requireClient();

  const [
    productsRes,
    imagesRes,
    prodCatsRes,
    categoriesRes,
    heroRes,
    bestSellersRes,
    reviewsRes,
    auditRes,
    contentRes,
    ordersRes,
    orderItemsRes,
    orderHistoryRes,
    settingsRes,
  ] = await Promise.all([
    client.from('products').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false }),
    client.from('product_images').select('*').order('is_primary', { ascending: false }).order('display_order', { ascending: true }),
    client.from('product_categories').select('*'),
    client.from('categories').select('*').order('display_order', { ascending: true }),
    client.from('hero_slides').select('*').order('display_order', { ascending: true }),
    client.from('best_sellers').select('*').order('display_order', { ascending: true }),
    client.rpc('get_admin_reviews'),
    client.from('review_audit_logs').select('*').order('created_at', { ascending: false }),
    client.from('homepage_content').select('*'),
    client.from('orders').select('*').order('created_at', { ascending: false }),
    client.from('order_items').select('*'),
    client.from('order_status_history').select('*').order('created_at', { ascending: false }),
    client.from('website_settings').select('*').eq('id', 1).maybeSingle(),
  ]);

  const adminErrors: string[] = [];
  if (productsRes.error) adminErrors.push(formatSupabaseError('products', productsRes.error));
  if (imagesRes.error) adminErrors.push(formatSupabaseError('product_images', imagesRes.error));
  if (prodCatsRes.error) adminErrors.push(formatSupabaseError('product_categories', prodCatsRes.error));
  if (categoriesRes.error) adminErrors.push(formatSupabaseError('categories', categoriesRes.error));
  if (heroRes.error) adminErrors.push(formatSupabaseError('hero_slides', heroRes.error));
  if (bestSellersRes.error) adminErrors.push(formatSupabaseError('best_sellers', bestSellersRes.error));
  if (reviewsRes.error) adminErrors.push(formatSupabaseError('get_admin_reviews', reviewsRes.error));
  if (auditRes.error) adminErrors.push(formatSupabaseError('review_audit_logs', auditRes.error));
  if (contentRes.error) adminErrors.push(formatSupabaseError('homepage_content', contentRes.error));
  if (ordersRes.error) adminErrors.push(formatSupabaseError('orders', ordersRes.error));
  if (orderItemsRes.error) adminErrors.push(formatSupabaseError('order_items', orderItemsRes.error));
  if (orderHistoryRes.error) adminErrors.push(formatSupabaseError('order_status_history', orderHistoryRes.error));
  if (settingsRes.error) adminErrors.push(formatSupabaseError('website_settings', settingsRes.error));

  if (adminErrors.length > 0) {
    throw new Error(`Supabase permission/connection error — ${adminErrors.join(' | ')}`);
  }

  const imagesMap = new Map<string, string[]>();
  (imagesRes.data || []).forEach((img: any) => {
    const arr = imagesMap.get(img.product_id) || [];
    arr.push(img.image_url);
    imagesMap.set(img.product_id, arr);
  });

  const catMap = new Map<string, string[]>();
  (prodCatsRes.data || []).forEach((pc: any) => {
    const arr = catMap.get(pc.product_id) || [];
    arr.push(pc.category_id);
    catMap.set(pc.product_id, arr);
  });

  const products: Product[] = (productsRes.data || []).map((row: any) =>
    mapProductRow(row, imagesMap, catMap)
  );

  const categories: Category[] = (categoriesRes.data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    imageUrl: c.image_url || '',
    displayOrder: Number(c.display_order ?? 0),
    isActive: Boolean(c.is_active),
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

  const heroSlides: HeroSlide[] = (heroRes.data || []).map((h: any) => ({
    id: h.id,
    badgeText: h.badge_text || 'THE SIGNATURE COLLECTION',
    title: h.title || 'Elegance in Every Stitch',
    urduSubtitle: h.urdu_subtitle || '',
    description: h.description || '',
    ctaPrimaryText: h.cta_primary_text || 'SHOP THE COLLECTION',
    ctaPrimaryLink: h.cta_primary_link || 'collection:All',
    ctaSecondaryText: h.cta_secondary_text || '',
    ctaSecondaryLink: h.cta_secondary_link || '#best-sellers',
    desktopImageUrl: h.desktop_image_url,
    mobileImageUrl: h.mobile_image_url || '',
    transitionMs: Number(h.transition_ms ?? 2500),
    displayOrder: Number(h.display_order ?? 0),
    isActive: Boolean(h.is_active),
    createdAt: h.created_at,
    updatedAt: h.updated_at,
  }));

  const bestSellers: BestSellerEntry[] = (bestSellersRes.data || []).map((b: any) => {
    const matchedProd = products.find((p) => p.id === b.product_id);
    if (matchedProd && b.is_active !== false) {
      matchedProd.isBestSeller = true;
    }
    return {
      id: b.id,
      productId: b.product_id,
      customTitle: b.custom_title || '',
      customSubtitle: b.custom_subtitle || '',
      customImageUrl: b.custom_image_url || '',
      displayOrder: Number(b.display_order ?? 0),
      isActive: Boolean(b.is_active),
      product: matchedProd,
    };
  });

  const reviews: Review[] = (reviewsRes.data || []).map((r: any) => ({
    id: r.id,
    productId: r.product_id,
    customerName: r.customer_name,
    customerEmail: r.customer_email || '',
    city: r.city,
    rating: Number(r.rating),
    productName: r.product_name || '',
    comment: r.comment,
    date: formatDate(r.created_at),
    updatedAt: r.updated_at,
    media: Array.isArray(r.media) ? r.media : [],
    status: r.status,
    isEditedByAdmin: Boolean(r.is_edited_by_admin),
    adminResponse: r.admin_response || '',
    verified: true,
  }));

  const auditLogs: ReviewAuditLog[] = (auditRes.data || []).map((a: any) => ({
    id: a.id,
    reviewId: a.review_id || null,
    reviewRefId: a.review_ref_id || a.review_id || undefined,
    editedBy: a.edited_by,
    actionType: a.action_type || 'edit',
    customerName: a.customer_name || '',
    previousComment: a.previous_comment,
    newComment: a.new_comment,
    previousRating: a.previous_rating,
    newRating: a.new_rating,
    previousStatus: a.previous_status || null,
    newStatus: a.new_status || null,
    actionNote: a.action_note || 'Edited by administrator',
    createdAt: a.created_at,
  }));

  const homepageContent: Record<string, HomepageContentSection> = { ...DEFAULT_HOMEPAGE_CONTENT };
  (contentRes.data || []).forEach((row: any) => {
    homepageContent[row.section_key] = {
      id: row.id,
      sectionKey: row.section_key,
      badgeText: row.badge_text || '',
      heading: row.heading || '',
      subheading: row.subheading || '',
      description: row.description || '',
      primaryCtaText: row.primary_cta_text || '',
      primaryCtaLink: row.primary_cta_link || '',
      secondaryCtaText: row.secondary_cta_text || '',
      secondaryCtaLink: row.secondary_cta_link || '',
      imageUrl: row.image_url || '',
    };
  });

  const itemsByOrder = new Map<string, OrderRecord['items']>();
  (orderItemsRes.data || []).forEach((item: any) => {
    const arr = itemsByOrder.get(item.order_id) || [];
    arr.push({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      productSku: item.product_sku || '',
      productImage: item.product_image || '',
      shirtSize: item.shirt_size,
      pantSize: item.pant_size,
      shirtLength: item.shirt_length,
      pantLength: item.pant_length,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
    });
    itemsByOrder.set(item.order_id, arr);
  });

  const historyByOrder = new Map<string, OrderStatusHistoryEntry[]>();
  (orderHistoryRes.data || []).forEach((h: any) => {
    const arr = historyByOrder.get(h.order_id) || [];
    arr.push({
      id: h.id,
      orderId: h.order_id,
      previousStatus: h.previous_status,
      newStatus: h.new_status,
      note: h.note || '',
      createdAt: h.created_at,
    });
    historyByOrder.set(h.order_id, arr);
  });

  const orders: OrderRecord[] = (ordersRes.data || []).map((o: any) => ({
    id: o.id,
    orderNumber: o.order_number,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email || '',
    shippingAddress: o.shipping_address,
    city: o.city,
    postalCode: o.postal_code || '',
    notes: o.notes || '',
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status || 'pending',
    subtotal: Number(o.subtotal),
    shippingFee: Number(o.shipping_fee),
    total: Number(o.total),
    status: o.status,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    statusHistory: historyByOrder.get(o.id) || [],
    items: itemsByOrder.get(o.id) || [],
  }));

  const s = settingsRes.data;
  const settings: WebsiteSettings = s
    ? {
        storeName: s.store_name,
        deliveryFee: Number(s.delivery_fee),
        deliveryTimeText: s.delivery_time_text,
        whatsappNumber: s.whatsapp_number,
        instagramUrl: s.instagram_url,
        bankTitle: s.bank_title,
        bankName: s.bank_name,
        bankAccountNumber: s.bank_account_number,
        jazzcashNumber: s.jazzcash_number,
        jazzcashName: s.jazzcash_name,
        announcementText: s.announcement_text,
        heroTransitionMs: Number(s.hero_transition_ms),
        bestSellersLimit: Number(s.best_sellers_limit),
      }
    : DEFAULT_WEBSITE_SETTINGS;

  return {
    products,
    categories,
    heroSlides,
    bestSellers,
    reviews,
    auditLogs,
    homepageContent,
    orders,
    settings,
  };
}

// Products CRUD
export async function saveAdminProduct(input: {
  id?: string;
  name: string;
  urduName?: string;
  slug?: string;
  sku: string;
  description: string;
  price: number;
  salePrice?: number | null;
  category: string;
  categoryIds?: string[];
  material: string;
  colour: string;
  availableSizes: string[];
  availableColors: string[];
  modelSpecs: string;
  features: string[];
  careInstructions: string[];
  stockQuantity: number;
  inStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  displayOrder: number;
  images: string[];
}): Promise<string> {
  const client = requireClient();
  const cleanSlug = slugify(input.slug || input.name) || `product-${Date.now()}`;
  const effectiveIsBestSeller = Boolean(
    input.isBestSeller || input.category.trim().toLowerCase() === 'best sellers'
  );

  const payload = {
    name: input.name.trim(),
    urdu_name: input.urduName?.trim() || '',
    slug: cleanSlug,
    sku: input.sku.trim(),
    description: input.description.trim(),
    price: Number(input.price),
    sale_price: input.salePrice ? Number(input.salePrice) : null,
    category: input.category.trim() || 'New Arrivals',
    material: input.material.trim(),
    colour: input.colour.trim(),
    available_sizes: input.availableSizes,
    available_colors: input.availableColors,
    model_specs: input.modelSpecs.trim(),
    features: input.features,
    care_instructions: input.careInstructions,
    stock_quantity: Number(input.stockQuantity),
    in_stock: input.inStock && Number(input.stockQuantity) > 0,
    is_active: input.isActive,
    is_featured: input.isFeatured,
    is_new_arrival: input.isNewArrival,
    is_best_seller: effectiveIsBestSeller,
    display_order: Number(input.displayOrder),
  };

  let productId = input.id;

  if (productId) {
    const { error } = await client.from('products').update(payload).eq('id', productId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await client.from('products').insert(payload).select('id').single();
    if (error || !data) throw new Error(error?.message || 'Failed to create product.');
    productId = data.id;
  }

  // Sync product_images
  const { error: delImgErr } = await client.from('product_images').delete().eq('product_id', productId);
  if (delImgErr) throw new Error(delImgErr.message);
  if (input.images.length > 0) {
    const imageRows = input.images.map((url, idx) => ({
      product_id: productId,
      image_url: url,
      alt_text: input.name,
      display_order: idx,
      is_primary: idx === 0,
    }));
    const { error: imgErr } = await client.from('product_images').insert(imageRows);
    if (imgErr) throw new Error(imgErr.message);
  }

  // Sync product_categories
  if (input.categoryIds) {
    const { error: delCatErr } = await client.from('product_categories').delete().eq('product_id', productId);
    if (delCatErr) throw new Error(delCatErr.message);
    if (input.categoryIds.length > 0) {
      const catRows = input.categoryIds.map((cid) => ({
        product_id: productId,
        category_id: cid,
      }));
      const { error: catErr } = await client.from('product_categories').insert(catRows);
      if (catErr) throw new Error(catErr.message);
    }
  }

  // Sync best_sellers toggle cleanly
  if (effectiveIsBestSeller) {
    const { error: bsUpsertErr } = await client.from('best_sellers').upsert(
      {
        product_id: productId,
        custom_title: input.name.toUpperCase(),
        custom_subtitle: `${input.material} — Rs.${input.price.toLocaleString('en-PK')}`,
        custom_image_url: input.images[0] || '',
        display_order: input.displayOrder,
        is_active: true,
      },
      { onConflict: 'product_id' }
    );
    if (bsUpsertErr) throw new Error(bsUpsertErr.message);
  } else {
    const { error: bsDelErr } = await client.from('best_sellers').delete().eq('product_id', productId);
    if (bsDelErr) throw new Error(bsDelErr.message);
  }

  return productId!;
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  const client = requireClient();
  // Safely nullifies order_items.product_id & reviews.product_id via FK ON DELETE SET NULL
  const { error } = await client.from('products').delete().eq('id', productId);
  if (error) throw new Error(error.message);
}

export async function reorderAdminProducts(orderedIds: string[]): Promise<void> {
  const client = requireClient();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      client.from('products').update({ display_order: index + 1 }).eq('id', id)
    )
  );
  const firstErr = results.find((r) => r.error)?.error;
  if (firstErr) throw new Error(firstErr.message);
}

// Hero Slides CRUD
async function uploadAssetUrlToHeroStorage(imageUrl: string, fallbackPrefix: string): Promise<string> {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith(window.location.origin + '/src/') && !imageUrl.startsWith(window.location.origin + '/assets/')) {
    return imageUrl;
  }
  const response = await fetch(imageUrl);
  if (!response.ok) {
    return imageUrl;
  }
  const blob = await response.blob();
  const mime = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/png';
  const ext = mime.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'png';
  const file = new File([blob], `${fallbackPrefix}.${ext}`, { type: mime });
  const uploaded = await uploadMediaToSupabase(file, 'hero');
  return uploaded.publicUrl;
}

export async function seedHeroSlidesToSupabase(slides: HeroSlide[]): Promise<HeroSlide[]> {
  const client = requireClient();
  const existingRes = await client
    .from('hero_slides')
    .select('*')
    .order('display_order', { ascending: true });

  if (existingRes.error) throw new Error(existingRes.error.message);
  if (existingRes.data && existingRes.data.length > 0) {
    return existingRes.data.map((h: any) => ({
      id: h.id,
      badgeText: h.badge_text || 'THE SIGNATURE COLLECTION',
      title: h.title || 'Elegance in Every Stitch',
      urduSubtitle: h.urdu_subtitle || '',
      description: h.description || '',
      ctaPrimaryText: h.cta_primary_text || 'SHOP THE COLLECTION',
      ctaPrimaryLink: h.cta_primary_link || 'collection:All',
      ctaSecondaryText: h.cta_secondary_text || '',
      ctaSecondaryLink: h.cta_secondary_link || '#best-sellers',
      desktopImageUrl: h.desktop_image_url,
      mobileImageUrl: h.mobile_image_url || '',
      transitionMs: Number(h.transition_ms ?? 2500),
      displayOrder: Number(h.display_order ?? 0),
      isActive: Boolean(h.is_active),
      createdAt: h.created_at,
      updatedAt: h.updated_at,
    }));
  }

  const payloads = await Promise.all(
    slides.map(async (s, idx) => {
      const desktopUrl = await uploadAssetUrlToHeroStorage(s.desktopImageUrl, `hero-slide-${idx + 1}`);
      const mobileUrl =
        s.mobileImageUrl && s.mobileImageUrl !== s.desktopImageUrl
          ? await uploadAssetUrlToHeroStorage(s.mobileImageUrl, `hero-slide-mobile-${idx + 1}`)
          : desktopUrl;
      return {
        badge_text: s.badgeText || 'THE SIGNATURE COLLECTION',
        title: s.title || 'Elegance in Every Stitch',
        urdu_subtitle: s.urduSubtitle || '',
        description: s.description || '',
        cta_primary_text: s.ctaPrimaryText || 'SHOP THE COLLECTION',
        cta_primary_link: s.ctaPrimaryLink || 'collection:All',
        cta_secondary_text: s.ctaSecondaryText || '',
        cta_secondary_link: s.ctaSecondaryLink || '#best-sellers',
        desktop_image_url: desktopUrl,
        mobile_image_url: mobileUrl,
        transition_ms: Number(s.transitionMs ?? 2500),
        display_order: idx + 1,
        is_active: s.isActive !== false,
      };
    })
  );

  const { data: inserted, error: insertErr } = await client
    .from('hero_slides')
    .insert(payloads)
    .select('*')
    .order('display_order', { ascending: true });

  if (insertErr) throw new Error(insertErr.message);

  return (inserted || []).map((h: any) => ({
    id: h.id,
    badgeText: h.badge_text || 'THE SIGNATURE COLLECTION',
    title: h.title || 'Elegance in Every Stitch',
    urduSubtitle: h.urdu_subtitle || '',
    description: h.description || '',
    ctaPrimaryText: h.cta_primary_text || 'SHOP THE COLLECTION',
    ctaPrimaryLink: h.cta_primary_link || 'collection:All',
    ctaSecondaryText: h.cta_secondary_text || '',
    ctaSecondaryLink: h.cta_secondary_link || '#best-sellers',
    desktopImageUrl: h.desktop_image_url,
    mobileImageUrl: h.mobile_image_url || '',
    transitionMs: Number(h.transition_ms ?? 2500),
    displayOrder: Number(h.display_order ?? 0),
    isActive: Boolean(h.is_active),
    createdAt: h.created_at,
    updatedAt: h.updated_at,
  }));
}

export async function saveAdminHeroSlide(slide: Partial<HeroSlide> & { desktopImageUrl: string }): Promise<void> {
  const client = requireClient();
  const isLocalAsset = slide.desktopImageUrl.startsWith('/') || slide.desktopImageUrl.startsWith('data:');
  const resolvedDesktopUrl = isLocalAsset
    ? await uploadAssetUrlToHeroStorage(slide.desktopImageUrl, `hero-${Date.now()}`)
    : slide.desktopImageUrl;

  const isLocalMobile = Boolean(
    slide.mobileImageUrl &&
      (slide.mobileImageUrl.startsWith('/') || slide.mobileImageUrl.startsWith('data:'))
  );
  const resolvedMobileUrl =
    slide.mobileImageUrl && isLocalMobile
      ? slide.mobileImageUrl === slide.desktopImageUrl
        ? resolvedDesktopUrl
        : await uploadAssetUrlToHeroStorage(slide.mobileImageUrl, `hero-mobile-${Date.now()}`)
      : slide.mobileImageUrl || '';

  const payload = {
    badge_text: slide.badgeText || 'THE SIGNATURE COLLECTION',
    title: slide.title || 'Elegance in Every Stitch',
    urdu_subtitle: slide.urduSubtitle || '',
    description: slide.description || '',
    cta_primary_text: slide.ctaPrimaryText || 'SHOP THE COLLECTION',
    cta_primary_link: slide.ctaPrimaryLink || 'collection:All',
    cta_secondary_text: slide.ctaSecondaryText || '',
    cta_secondary_link: slide.ctaSecondaryLink || '',
    desktop_image_url: resolvedDesktopUrl,
    mobile_image_url: resolvedMobileUrl,
    transition_ms: Number(slide.transitionMs ?? 2500),
    display_order: Number(slide.displayOrder ?? 0),
    is_active: slide.isActive !== false,
  };

  const isVirtualDefault = Boolean(slide.id && slide.id.startsWith('default-hero-'));
  if (slide.id && !isVirtualDefault) {
    const { error } = await client.from('hero_slides').update(payload).eq('id', slide.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await client.from('hero_slides').insert(payload);
    if (error) throw new Error(error.message);
  }
}

export async function deleteAdminHeroSlide(slideId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('hero_slides').delete().eq('id', slideId);
  if (error) throw new Error(error.message);
}

export async function reorderAdminHeroSlides(orderedIds: string[]): Promise<void> {
  const client = requireClient();
  const results = await Promise.all(
    orderedIds.map((id, idx) =>
      client.from('hero_slides').update({ display_order: idx + 1 }).eq('id', id)
    )
  );
  const firstErr = results.find((r) => r.error)?.error;
  if (firstErr) throw new Error(firstErr.message);
}

// Best Sellers CRUD
export async function addAdminBestSeller(product: Product, displayOrder: number): Promise<void> {
  const client = requireClient();
  const { error: bsErr } = await client.from('best_sellers').upsert(
    {
      product_id: product.id,
      custom_title: product.name.toUpperCase(),
      custom_subtitle: `${product.material} — Rs.${product.price.toLocaleString('en-PK')}`,
      custom_image_url: product.images[0] || '',
      display_order: displayOrder,
      is_active: true,
    },
    { onConflict: 'product_id' }
  );
  if (bsErr) throw new Error(bsErr.message);

  const { error: prodErr } = await client
    .from('products')
    .update({ is_best_seller: true })
    .eq('id', product.id);
  if (prodErr) throw new Error(prodErr.message);

  const { data: bsCat } = await client
    .from('categories')
    .select('id')
    .or('slug.eq.best-sellers,name.ilike.Best Sellers')
    .limit(1)
    .maybeSingle();

  if (bsCat?.id) {
    await client
      .from('product_categories')
      .upsert(
        { product_id: product.id, category_id: bsCat.id },
        { onConflict: 'product_id,category_id' }
      );
  }
}

export async function removeAdminBestSeller(bestSellerId: string, productId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('best_sellers').delete().eq('id', bestSellerId);
  if (error) throw new Error(error.message);
  const { error: prodErr } = await client
    .from('products')
    .update({ is_best_seller: false })
    .eq('id', productId);
  if (prodErr) throw new Error(prodErr.message);

  const { data: bsCat } = await client
    .from('categories')
    .select('id')
    .or('slug.eq.best-sellers,name.ilike.Best Sellers')
    .limit(1)
    .maybeSingle();

  if (bsCat?.id) {
    await client
      .from('product_categories')
      .delete()
      .eq('product_id', productId)
      .eq('category_id', bsCat.id);
  }
}

export async function updateAdminBestSeller(entry: {
  id: string;
  customTitle: string;
  customSubtitle: string;
  customImageUrl: string;
  isActive: boolean;
}): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from('best_sellers')
    .update({
      custom_title: entry.customTitle,
      custom_subtitle: entry.customSubtitle,
      custom_image_url: entry.customImageUrl,
      is_active: entry.isActive,
    })
    .eq('id', entry.id);
  if (error) throw new Error(error.message);
}

export async function reorderAdminBestSellers(orderedIds: string[]): Promise<void> {
  const client = requireClient();
  const results = await Promise.all(
    orderedIds.map((id, idx) =>
      client.from('best_sellers').update({ display_order: idx + 1 }).eq('id', id)
    )
  );
  const firstErr = results.find((r) => r.error)?.error;
  if (firstErr) throw new Error(firstErr.message);
}

// Reviews Moderation + Private Audit Log
export async function updateAdminReviewStatus(
  reviewId: string,
  status: 'pending' | 'approved' | 'rejected' | 'hidden',
  adminResponse?: string
): Promise<void> {
  const client = requireClient();
  const updatePayload: Record<string, any> = { status };
  if (adminResponse !== undefined) {
    updatePayload.admin_response = adminResponse;
  }
  const { error } = await client.from('reviews').update(updatePayload).eq('id', reviewId);
  if (error) throw new Error(error.message);
}

export async function editAdminReviewWithAudit(params: {
  review: Review;
  newComment: string;
  newRating: number;
  adminResponse: string;
}): Promise<void> {
  const client = requireClient();
  const commentChanged = params.newComment.trim() !== params.review.comment.trim();
  const ratingChanged = params.newRating !== params.review.rating;

  // Database triggers automatically record edits, status changes & deletions into review_audit_logs
  const { error } = await client
    .from('reviews')
    .update({
      comment: params.newComment.trim(),
      rating: params.newRating,
      admin_response: params.adminResponse.trim(),
      is_edited_by_admin: params.review.isEditedByAdmin || commentChanged || ratingChanged,
    })
    .eq('id', params.review.id);

  if (error) throw new Error(error.message);
}

export async function deleteAdminReview(reviewId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('reviews').delete().eq('id', reviewId);
  if (error) throw new Error(error.message);
}

// Categories CRUD
export async function saveAdminCategory(cat: Partial<Category> & { name: string }): Promise<void> {
  const client = requireClient();
  const cleanSlug = slugify(cat.slug || cat.name) || `category-${Date.now()}`;
  const payload = {
    name: cat.name.trim(),
    slug: cleanSlug,
    description: cat.description?.trim() || '',
    image_url: cat.imageUrl || '',
    display_order: Number(cat.displayOrder ?? 0),
    is_active: cat.isActive !== false,
  };

  if (cat.id) {
    const { error } = await client.from('categories').update(payload).eq('id', cat.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await client.from('categories').insert(payload);
    if (error) throw new Error(error.message);
  }
}

export async function deleteAdminCategory(categoryId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('categories').delete().eq('id', categoryId);
  if (error) throw new Error(error.message);
}

export async function reorderAdminCategories(orderedIds: string[]): Promise<void> {
  const client = requireClient();
  const results = await Promise.all(
    orderedIds.map((id, idx) =>
      client.from('categories').update({ display_order: idx + 1 }).eq('id', id)
    )
  );
  const firstErr = results.find((r) => r.error)?.error;
  if (firstErr) throw new Error(firstErr.message);
}

// Homepage Content Management
export async function saveAdminHomepageContent(section: HomepageContentSection): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('homepage_content').upsert(
    {
      section_key: section.sectionKey,
      badge_text: section.badgeText,
      heading: section.heading,
      subheading: section.subheading,
      description: section.description,
      primary_cta_text: section.primaryCtaText,
      primary_cta_link: section.primaryCtaLink,
      secondary_cta_text: section.secondaryCtaText,
      secondary_cta_link: section.secondaryCtaLink,
      image_url: section.imageUrl,
    },
    { onConflict: 'section_key' }
  );
  if (error) throw new Error(error.message);
}

// Orders Management
export async function updateAdminOrderStatus(
  orderId: string,
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled',
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
): Promise<void> {
  const client = requireClient();
  const payload: Record<string, any> = { status };
  if (paymentStatus) {
    payload.payment_status = paymentStatus;
  }
  const { error } = await client.from('orders').update(payload).eq('id', orderId);
  if (error) throw new Error(error.message);
}

// Website Settings
export async function saveAdminSettings(settings: WebsiteSettings): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('website_settings').upsert(
    {
      id: 1,
      store_name: settings.storeName,
      delivery_fee: Number(settings.deliveryFee),
      delivery_time_text: settings.deliveryTimeText,
      whatsapp_number: settings.whatsappNumber,
      instagram_url: settings.instagramUrl,
      bank_title: settings.bankTitle,
      bank_name: settings.bankName,
      bank_account_number: settings.bankAccountNumber,
      jazzcash_number: settings.jazzcashNumber,
      jazzcash_name: settings.jazzcashName,
      announcement_text: settings.announcementText,
      hero_transition_ms: Number(settings.heroTransitionMs),
      best_sellers_limit: Number(settings.bestSellersLimit),
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(error.message);
}
