import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  MapPin,
  CheckCircle2,
  Camera,
  Video,
  X,
  Plus,
  ChevronDown,
  MessageSquarePlus,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Product, Review, ReviewMedia } from '../types';
import { INITIAL_REVIEWS } from '../data/reviews';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';
import { isSupabaseConfigured } from '../lib/supabase';
import { submitPublicReview } from '../services/supabaseStore';

const STORAGE_KEY = 'intakhab_customer_reviews_v1';

interface ReviewsSectionProps {
  reviews?: Review[];
  products?: Product[];
  fromSupabase?: boolean;
  onReviewSubmitted?: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews: propReviews,
  products: propProducts,
  fromSupabase = false,
  onReviewSubmitted,
}) => {
  const availableProducts = propProducts && propProducts.length > 0 ? propProducts : DEFAULT_PRODUCTS;

  const [reviews, setReviews] = useState<Review[]>(() => {
    if (propReviews && propReviews.length > 0) {
      return propReviews;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Review[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial seeded reviews
    }
    return INITIAL_REVIEWS;
  });

  useEffect(() => {
    if (propReviews && propReviews.length > 0) {
      setReviews(propReviews);
    } else if (fromSupabase) {
      setReviews([]);
    }
  }, [propReviews, fromSupabase]);

  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [selectedProductId, setSelectedProductId] = useState<string>(availableProducts[0]?.id || '');
  const [comment, setComment] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<(ReviewMedia & { file?: File })[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (
      selectedProductId &&
      !availableProducts.some((p) => p.id === selectedProductId)
    ) {
      setSelectedProductId(availableProducts[0]?.id || '');
    }
  }, [availableProducts, selectedProductId]);

  useEffect(() => {
    if (fromSupabase) return;
    try {
      const persistable = reviews.map((rev) => ({
        ...rev,
        media: rev.media?.filter((m) => !m.url.startsWith('blob:')),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [reviews, fromSupabase]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) return;

      const mediaId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      if (isImage && file.size <= 2 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setAttachedMedia((prev) => [
              ...prev,
              { id: mediaId, type: 'image', url: reader.result as string, name: file.name, file },
            ]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const objectUrl = URL.createObjectURL(file);
        setAttachedMedia((prev) => [
          ...prev,
          { id: mediaId, type: isVideo ? 'video' : 'image', url: objectUrl, name: file.name, file },
        ]);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (id: string) => {
    setAttachedMedia((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target?.url.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((m) => m.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !city.trim() || !comment.trim()) {
      setFormError('Please enter your name, city, and review comment.');
      return;
    }

    const chosenProduct = availableProducts.find((p) => p.id === selectedProductId);

    if (isSupabaseConfigured) {
      setIsSubmitting(true);
      setFormError(null);
      try {
        const mediaFiles = attachedMedia
          .map((m) => m.file)
          .filter((f): f is File => Boolean(f));

        const result = await submitPublicReview({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          city: city.trim(),
          rating,
          productId: chosenProduct?.id || null,
          productName: chosenProduct?.name || '',
          comment: comment.trim(),
          mediaFiles,
        });

        if (!result.pendingApproval) {
          setReviews((prev) => [
            result.review,
            ...prev.filter((existing) => existing.id !== result.review.id),
          ]);
        }

        setCustomerName('');
        setCustomerEmail('');
        setCity('');
        setRating(5);
        setSelectedProductId(availableProducts[0]?.id || '');
        setComment('');
        setAttachedMedia([]);
        setIsFormOpen(false);
        setSubmitMessage(
          result.pendingApproval
            ? 'Review uploaded to Supabase, but your database function create_public_review still sets status to "pending". Run the updated create_public_review SQL in Supabase SQL Editor so reviews post live immediately.'
            : 'Shukriya! Your review is now live on the website.'
        );
        if (onReviewSubmitted) onReviewSubmitted();
        setTimeout(() => setSubmitMessage(null), 6500);
      } catch (err: any) {
        setFormError(err?.message || 'Unable to submit review right now.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Fallback local submission when Supabase env vars are not configured yet
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      productId: chosenProduct?.id || null,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      city: city.trim(),
      rating,
      productName: chosenProduct?.name || undefined,
      comment: comment.trim(),
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      media:
        attachedMedia.length > 0
          ? attachedMedia.map(({ id, type, url, name }) => ({ id, type, url, name }))
          : undefined,
      verified: true,
    };

    setReviews((prev) => [newReview, ...prev]);
    setCustomerName('');
    setCustomerEmail('');
    setCity('');
    setRating(5);
    setSelectedProductId(availableProducts[0]?.id || '');
    setComment('');
    setAttachedMedia([]);
    setFormError(null);
    setIsFormOpen(false);
    setSubmitMessage('Shukriya! Your review has been posted and is now visible below.');
    setTimeout(() => setSubmitMessage(null), 5000);
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const displayedReviews = reviews.slice(0, visibleCount);
  const remainingCount = Math.max(0, reviews.length - visibleCount);

  return (
    <section id="reviews" className="py-12 sm:py-16 bg-[#FAF6F2] border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-8 border-b border-stone-200">
          <div>
            <span className="text-xs uppercase tracking-widest text-black font-bold">
              Customer Experiences
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 font-medium mt-1">
              Client Reviews
            </h2>
            <div className="flex items-center gap-2.5 mt-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 fill-[#D4A456] text-[#D4A456]"
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-stone-900">
                {averageRating} / 5.0
              </span>
              <span className="text-xs text-stone-500">
                ({reviews.length} Verified Reviews)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsFormOpen((prev) => !prev);
              setSubmitMessage(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer shrink-0"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{isFormOpen ? 'Close Review Form' : 'Write a Review'}</span>
          </button>
        </div>

        {/* Success Message */}
        {submitMessage && (
          <div className="mb-6 p-4 bg-white border border-emerald-300 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{submitMessage}</span>
          </div>
        )}

        {/* Write a Review Form */}
        {isFormOpen && (
          <form
            onSubmit={handleSubmit}
            className="mb-10 bg-white border border-[#D8C7A5] p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg sm:text-xl text-stone-900 font-medium">
                Share Your Experience
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-800 transition-colors"
                aria-label="Close form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {formError}
              </div>
            )}

            {/* Star Rating Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider">
                Your Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'fill-[#D4A456] text-[#D4A456]'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs text-stone-600 font-medium">
                  {rating} / 5
                </span>
              </div>
            </div>

            {/* Name, Email (Private), City, Suit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ayesha Kamran"
                  className="w-full text-xs py-2.5 px-3 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Email (Private, optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Only visible to store team"
                  className="w-full text-xs py-2.5 px-3 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lahore, Karachi, Islamabad"
                  className="w-full text-xs py-2.5 px-3 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Suit Purchased (Optional)
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5] bg-white cursor-pointer"
                >
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="">Other / General Experience</option>
                </select>
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Your Review *
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your feedback about fabric quality, stitching, fitting, or delivery..."
                className="w-full text-xs py-2.5 px-3 border border-stone-300 rounded-none focus:outline-none focus:border-[#D8C7A5] resize-none"
              />
            </div>

            {/* Picture / Video Upload */}
            <div className="space-y-2.5">
              <label className="block text-xs font-medium text-stone-700">
                Add Pictures or Video (Optional)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaChange}
                  className="hidden"
                  id="review-media-upload"
                />
                <label
                  htmlFor="review-media-upload"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FAF6F2] hover:bg-[#EDE1C8] text-stone-800 hover:text-black border border-stone-300 hover:border-[#D8C7A5] text-xs font-medium cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <Video className="w-4 h-4" />
                  <span>Upload Photos / Video</span>
                  <Plus className="w-3.5 h-3.5" />
                </label>
                <span className="text-[11px] text-stone-400">
                  JPG, PNG, or MP4 supported
                </span>
              </div>

              {attachedMedia.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {attachedMedia.map((item) => (
                    <div
                      key={item.id}
                      className="relative w-20 h-24 border border-stone-200 bg-stone-100 overflow-hidden"
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.name || 'Review upload'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(item.id)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-black"
                        aria-label="Remove media"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-3 bg-[#EDE1C8] hover:bg-[#dfd0b2] disabled:opacity-60 text-black border border-[#D8C7A5] text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Submitting...' : 'Post Review'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Reviews List (5 at a time) */}
        <div className="space-y-4">
          {displayedReviews.length === 0 && (
            <div className="bg-white border border-stone-200/90 p-8 text-center text-xs sm:text-sm text-stone-500">
              No customer reviews published yet. Be the first to share your experience with Intakhab.
            </div>
          )}
          {displayedReviews.map((review) => (
            <article
              key={review.id}
              className="bg-white border border-stone-200/90 p-5 sm:p-6 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-stone-900">
                    {review.customerName}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs text-stone-600 bg-[#FAF6F2] px-2.5 py-0.5 border border-stone-200">
                    <MapPin className="w-3 h-3 text-stone-500" />
                    {review.city}
                  </span>
                  {review.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Buyer
                    </span>
                  )}
                  {review.isEditedByAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5">
                      Edited by Administrator
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-stone-400">{review.date}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= review.rating
                          ? 'fill-[#D4A456] text-[#D4A456]'
                          : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                {review.productName && (
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
                    {review.productName}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {review.comment}
              </p>

              {/* Uploaded Photos & Videos */}
              {review.media && review.media.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {review.media.map((item) =>
                    item.type === 'image' ? (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLightboxImage(item.url)}
                        className="w-24 h-28 sm:w-28 sm:h-32 border border-stone-200 overflow-hidden bg-stone-100 cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={item.url}
                          alt={`Review photo by ${review.customerName}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div
                        key={item.id}
                        className="w-48 sm:w-56 border border-stone-200 overflow-hidden bg-black"
                      >
                        <video
                          src={item.url}
                          controls
                          playsInline
                          className="w-full h-36 object-cover"
                        />
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Administrative Response */}
              {review.adminResponse && (
                <div className="mt-3 p-3.5 bg-[#FAF6F2] border-l-2 border-[#D8C7A5] text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
                    <span>Response from Intakhab Concierge</span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">{review.adminResponse}</p>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Pagination Controls: 5 initially, +5 on View More */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs text-stone-500">
            Showing {displayedReviews.length} of {reviews.length} reviews
          </p>

          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 5)}
              className="inline-flex items-center gap-2 px-7 py-3 bg-white hover:bg-[#EDE1C8] text-stone-900 hover:text-black border border-stone-900 hover:border-[#D8C7A5] text-xs font-semibold tracking-widest uppercase transition-all duration-200 cursor-pointer"
            >
              <span>View More ({Math.min(5, remainingCount)} More)</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox for Review Photo Preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] flex items-center justify-center">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-stone-300 p-1"
              aria-label="Close photo preview"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Customer review attachment"
              className="max-w-full max-h-[82vh] object-contain border-2 border-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </section>
  );
};
