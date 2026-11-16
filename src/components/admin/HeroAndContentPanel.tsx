import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Loader2,
  CheckCircle2,
  EyeOff,
  Save,
  Upload,
  Database,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { HeroSlide, HomepageContentSection } from '../../types';
import { DEFAULT_HERO_SLIDES, DEFAULT_HOMEPAGE_CONTENT } from '../../data/defaults';
import gulzarFestiveImg from '../../assets/images/gulzar_festive_boutique.webp';
import { uploadMediaToSupabase } from '../../lib/supabase';
import {
  saveAdminHeroSlide,
  deleteAdminHeroSlide,
  reorderAdminHeroSlides,
  seedHeroSlidesToSupabase,
  saveAdminHomepageContent,
} from '../../services/supabaseStore';
import { ConfirmDialog, StorageImageUploader, ToastNotice } from './AdminShared';

interface HeroSliderPanelProps {
  slides: HeroSlide[];
  onRefresh: () => Promise<void>;
  onNotify: (notice: ToastNotice) => void;
}

export const HeroSliderPanel: React.FC<HeroSliderPanelProps> = ({
  slides,
  onRefresh,
  onNotify,
}) => {
  const isUsingDefaultSlides = slides.length === 0;
  const displayedSlides = isUsingDefaultSlides ? DEFAULT_HERO_SLIDES : slides;

  const [editing, setEditing] = useState<Partial<HeroSlide> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingDefaults, setIsSyncingDefaults] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);

  const openCreate = () => {
    setEditing({
      badgeText: 'THE SIGNATURE COLLECTION',
      title: 'Elegance in Every Stitch',
      urduSubtitle: 'انتخاب — ہر انداز میں نفاست',
      description:
        'Discover beautifully designed stitched suits that bring together timeless style, graceful details, and everyday comfort. Find your perfect look for every occasion.',
      ctaPrimaryText: 'SHOP THE COLLECTION',
      ctaPrimaryLink: 'collection:All',
      ctaSecondaryText: 'EXPLORE NEW ARRIVALS',
      ctaSecondaryLink: '#best-sellers',
      desktopImageUrl: '',
      mobileImageUrl: '',
      transitionMs: 2500,
      displayOrder: displayedSlides.length + 1,
      isActive: true,
    });
  };

  const handleSyncDefaults = async () => {
    setIsSyncingDefaults(true);
    try {
      await seedHeroSlidesToSupabase(DEFAULT_HERO_SLIDES);
      await onRefresh();
      onNotify({
        type: 'success',
        message: 'All 5 live hero slides synced to Supabase Storage & database.',
      });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Unable to sync default hero slides.' });
    } finally {
      setIsSyncingDefaults(false);
    }
  };

  const handleBulkUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsBulkUploading(true);
    try {
      let baseCount = slides.length;
      if (isUsingDefaultSlides) {
        const seeded = await seedHeroSlidesToSupabase(DEFAULT_HERO_SLIDES);
        baseCount = seeded.length;
      }

      const fileArray = Array.from(files);
      const uploadedUrls = await Promise.all(
        fileArray.map((file) => uploadMediaToSupabase(file, 'hero').then((res) => res.publicUrl))
      );

      for (let i = 0; i < uploadedUrls.length; i++) {
        await saveAdminHeroSlide({
          badgeText: 'THE SIGNATURE COLLECTION',
          title: 'Elegance in Every Stitch',
          urduSubtitle: 'انتخاب — ہر انداز میں نفاست',
          description:
            'Discover beautifully designed stitched suits that bring together timeless style, graceful details, and everyday comfort. Find your perfect look for every occasion.',
          ctaPrimaryText: 'SHOP THE COLLECTION',
          ctaPrimaryLink: 'collection:All',
          ctaSecondaryText: 'EXPLORE NEW ARRIVALS',
          ctaSecondaryLink: '#best-sellers',
          desktopImageUrl: uploadedUrls[i],
          mobileImageUrl: uploadedUrls[i],
          transitionMs: 2500,
          displayOrder: baseCount + i + 1,
          isActive: true,
        });
      }

      await onRefresh();
      onNotify({
        type: 'success',
        message: `Uploaded ${uploadedUrls.length} new hero slide(s) to Supabase.`,
      });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Bulk upload failed.' });
    } finally {
      setIsBulkUploading(false);
      if (bulkInputRef.current) bulkInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.desktopImageUrl) {
      onNotify({ type: 'error', message: 'Desktop hero banner image is required.' });
      return;
    }
    setIsSaving(true);
    try {
      let slideToSave = { ...editing, desktopImageUrl: editing.desktopImageUrl };

      if (isUsingDefaultSlides) {
        const seeded = await seedHeroSlidesToSupabase(DEFAULT_HERO_SLIDES);
        if (editing.id && editing.id.startsWith('default-hero-')) {
          const defaultIdx = DEFAULT_HERO_SLIDES.findIndex((d) => d.id === editing.id);
          if (defaultIdx >= 0 && seeded[defaultIdx]) {
            slideToSave = {
              ...slideToSave,
              id: seeded[defaultIdx].id,
              displayOrder: seeded[defaultIdx].displayOrder,
            };
          }
        } else {
          slideToSave = {
            ...slideToSave,
            displayOrder: seeded.length + 1,
          };
        }
      }

      await saveAdminHeroSlide(slideToSave);
      await onRefresh();
      setEditing(null);
      onNotify({ type: 'success', message: 'Hero banner slide saved to Supabase.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to save hero slide.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= displayedSlides.length) return;
    const next = [...displayedSlides];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    try {
      if (isUsingDefaultSlides) {
        await seedHeroSlidesToSupabase(next);
      } else {
        await reorderAdminHeroSlides(next.map((s) => s.id));
      }
      await onRefresh();
      onNotify({ type: 'success', message: 'Hero slide order updated.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Unable to reorder hero slides.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (isUsingDefaultSlides) {
        const remaining = DEFAULT_HERO_SLIDES.filter((d) => d.id !== deleteTarget.id);
        if (remaining.length > 0) {
          await seedHeroSlidesToSupabase(remaining);
        }
      } else {
        await deleteAdminHeroSlide(deleteTarget.id);
      }
      await onRefresh();
      setDeleteTarget(null);
      onNotify({ type: 'success', message: 'Hero slide removed.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to delete hero slide.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 border border-stone-200">
        <div>
          <h3 className="font-serif text-lg font-semibold text-stone-900">
            Homepage Hero Slider ({displayedSlides.length} Slides)
          </h3>
          <p className="text-xs text-stone-500">
            Manage all rotating hero background photos (2–3s transitions), edit headings/CTAs, replace images, reorder, or bulk upload new slides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={bulkInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleBulkUploadFiles}
            className="hidden"
          />
          <button
            type="button"
            disabled={isBulkUploading}
            onClick={() => bulkInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-60"
          >
            {isBulkUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{isBulkUploading ? 'Uploading...' : 'Bulk Upload Photos'}</span>
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] text-xs font-semibold uppercase tracking-widest cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hero Slide</span>
          </button>
        </div>
      </div>

      {isUsingDefaultSlides && (
        <div className="bg-[#EDE1C8]/45 border border-[#D8C7A5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-800">
          <div className="flex items-start gap-2.5">
            <Database className="w-4 h-4 shrink-0 mt-0.5 text-stone-900" />
            <div>
              <strong className="block font-semibold text-stone-900">
                Showing the 5 Built-in Rotating Hero Slides Live on Your Homepage
              </strong>
              <p className="text-stone-700 mt-0.5">
                You can edit, replace photos, reorder, or delete any of these 5 slides directly — or sync all 5 into Supabase now.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSyncingDefaults}
            onClick={handleSyncDefaults}
            className="px-4 py-2 bg-stone-900 hover:bg-black text-white font-semibold uppercase tracking-wider text-[11px] shrink-0 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {isSyncingDefaults && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSyncingDefaults ? 'Syncing 5 Slides...' : 'Sync All 5 to Database'}</span>
          </button>
        </div>
      )}

      <div className="space-y-4">
        {displayedSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className="bg-white border border-stone-200 p-4 flex flex-col md:flex-row items-start md:items-center gap-4"
          >
            <div className="w-full md:w-36 h-44 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
              <img
                src={slide.desktopImageUrl}
                alt={slide.title}
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-[#EDE1C8] text-black text-[10px] font-bold uppercase tracking-wider">
                  Slide #{idx + 1}
                </span>
                {slide.isActive ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500">
                    <EyeOff className="w-3.5 h-3.5" /> Hidden
                  </span>
                )}
                <span className="text-[11px] text-stone-500">
                  Timing: {(slide.transitionMs / 1000).toFixed(1)}s ({slide.transitionMs}ms)
                </span>
                {slide.id.startsWith('default-hero-') && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-700 px-2 py-0.5 border border-stone-200">
                    Built-in Live Slide
                  </span>
                )}
                {slide.mobileImageUrl && slide.mobileImageUrl !== slide.desktopImageUrl && (
                  <span className="text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5">
                    Custom Mobile Image Set
                  </span>
                )}
              </div>

              <h4 className="font-serif text-lg font-semibold text-stone-900">{slide.title}</h4>
              {slide.urduSubtitle && (
                <p className="font-serif text-sm text-stone-700">{slide.urduSubtitle}</p>
              )}
              <p className="text-stone-600 line-clamp-2">{slide.description}</p>
              <p className="text-[11px] text-stone-500">
                CTAs: <strong>{slide.ctaPrimaryText}</strong> ({slide.ctaPrimaryLink})
                {slide.ctaSecondaryText ? ` · ${slide.ctaSecondaryText} (${slide.ctaSecondaryLink})` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => handleMove(idx, -1)}
                className="p-2 border border-stone-200 text-stone-600 hover:text-black disabled:opacity-30 cursor-pointer"
                title="Move slide up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={idx === displayedSlides.length - 1}
                onClick={() => handleMove(idx, 1)}
                className="p-2 border border-stone-200 text-stone-600 hover:text-black disabled:opacity-30 cursor-pointer"
                title="Move slide down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditing(slide)}
                className="px-3 py-2 border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit / Change Photo
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(slide)}
                className="px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Hero Slide Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 bg-[#FAF6F2] border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                {editing.id ? 'Edit Hero Slide' : 'New Hero Slide'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 text-stone-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-stone-50 border border-stone-200 space-y-2">
                  <StorageImageUploader
                    folder="hero"
                    label="Desktop Hero Image *"
                    value={editing.desktopImageUrl}
                    onUploadedSingle={(url) => setEditing({ ...editing, desktopImageUrl: url })}
                    onClear={() => setEditing({ ...editing, desktopImageUrl: '' })}
                  />
                  <input
                    type="text"
                    value={editing.desktopImageUrl || ''}
                    onChange={(e) => setEditing({ ...editing, desktopImageUrl: e.target.value })}
                    placeholder="Or paste Desktop Image URL..."
                    className="w-full py-1.5 px-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 space-y-2">
                  <StorageImageUploader
                    folder="hero"
                    label="Mobile-Specific Image (Optional)"
                    value={editing.mobileImageUrl}
                    onUploadedSingle={(url) => setEditing({ ...editing, mobileImageUrl: url })}
                    onClear={() => setEditing({ ...editing, mobileImageUrl: '' })}
                  />
                  <input
                    type="text"
                    value={editing.mobileImageUrl || ''}
                    onChange={(e) => setEditing({ ...editing, mobileImageUrl: e.target.value })}
                    placeholder="Optional mobile crop URL..."
                    className="w-full py-1.5 px-2.5 border border-stone-300 bg-white focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={editing.badgeText || ''}
                    onChange={(e) => setEditing({ ...editing, badgeText: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Slide Transition Timing (ms)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="250"
                    value={editing.transitionMs ?? 2500}
                    onChange={(e) =>
                      setEditing({ ...editing, transitionMs: Number(e.target.value) || 2500 })
                    }
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Banner Heading *</label>
                  <input
                    type="text"
                    required
                    value={editing.title || ''}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Urdu Subtitle</label>
                  <input
                    type="text"
                    value={editing.urduSubtitle || ''}
                    onChange={(e) => setEditing({ ...editing, urduSubtitle: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Banner Description</label>
                <textarea
                  rows={2}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Primary CTA Text</label>
                  <input
                    type="text"
                    value={editing.ctaPrimaryText || ''}
                    onChange={(e) => setEditing({ ...editing, ctaPrimaryText: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Primary CTA Link (#section, collection:All, or URL)
                  </label>
                  <input
                    type="text"
                    value={editing.ctaPrimaryLink || ''}
                    onChange={(e) => setEditing({ ...editing, ctaPrimaryLink: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Secondary CTA Text</label>
                  <input
                    type="text"
                    value={editing.ctaSecondaryText || ''}
                    onChange={(e) => setEditing({ ...editing, ctaSecondaryText: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Secondary CTA Link</label>
                  <input
                    type="text"
                    value={editing.ctaSecondaryLink || ''}
                    onChange={(e) => setEditing({ ...editing, ctaSecondaryLink: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isActive !== false}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                />
                <span className="font-semibold text-stone-800">Slide Active on Homepage</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] font-semibold uppercase tracking-wider cursor-pointer inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Hero Slide</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Hero Slide?"
        message={`Delete "${deleteTarget?.title}" from the homepage hero slider?`}
        isBusy={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

interface WebsiteContentPanelProps {
  contentMap: Record<string, HomepageContentSection>;
  onRefresh: () => Promise<void>;
  onNotify: (notice: ToastNotice) => void;
}

export const WebsiteContentPanel: React.FC<WebsiteContentPanelProps> = ({
  contentMap,
  onRefresh,
  onNotify,
}) => {
  const [sections, setSections] = useState<Record<string, HomepageContentSection>>(contentMap);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    setSections(contentMap);
  }, [contentMap]);

  const sectionDefs: { key: string; title: string; hasImage?: boolean }[] = [
    { key: 'new_arrivals_header', title: 'New Arrivals Section Header' },
    { key: 'editorial_showcase', title: 'New Season Collection Showcase Banner', hasImage: true },
    { key: 'best_sellers_header', title: 'Best Sellers Section Header' },
  ];

  const updateField = (key: string, field: keyof HomepageContentSection, val: string) => {
    setSections((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {
          sectionKey: key,
          badgeText: '',
          heading: '',
          subheading: '',
          description: '',
          primaryCtaText: '',
          primaryCtaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: '',
          imageUrl: '',
        }),
        [field]: val,
      },
    }));
  };

  const handleSaveSection = async (key: string) => {
    const sec = sections[key];
    if (!sec) return;
    setSavingKey(key);
    try {
      await saveAdminHomepageContent(sec);
      await onRefresh();
      onNotify({ type: 'success', message: `Saved "${key.replace(/_/g, ' ')}" content.` });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to save section content.' });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 border border-stone-200">
        <h3 className="font-serif text-lg font-semibold text-stone-900">
          Website Content & Promotional Banners
        </h3>
        <p className="text-xs text-stone-500">
          Edit headings, seasonal copy, button text, and promotional showcase imagery live.
        </p>
      </div>

      {sectionDefs.map(({ key, title, hasImage }) => {
        const sec = sections[key] || {
          sectionKey: key,
          badgeText: '',
          heading: '',
          subheading: '',
          description: '',
          primaryCtaText: '',
          primaryCtaLink: '',
          secondaryCtaText: '',
          secondaryCtaLink: '',
          imageUrl: '',
        };

        return (
          <div key={key} className="bg-white border border-stone-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="font-serif text-base font-semibold text-stone-900">{title}</h4>
              <button
                type="button"
                disabled={savingKey === key}
                onClick={() => handleSaveSection(key)}
                className="px-4 py-2 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {savingKey === key ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Section</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={sec.badgeText}
                  onChange={(e) => updateField(key, 'badgeText', e.target.value)}
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Heading</label>
                <input
                  type="text"
                  value={sec.heading}
                  onChange={(e) => updateField(key, 'heading', e.target.value)}
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Subheading</label>
                <input
                  type="text"
                  value={sec.subheading}
                  onChange={(e) => updateField(key, 'subheading', e.target.value)}
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Primary Button Label</label>
                <input
                  type="text"
                  value={sec.primaryCtaText}
                  onChange={(e) => updateField(key, 'primaryCtaText', e.target.value)}
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>
            </div>

            {key === 'editorial_showcase' && (
              <>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={sec.description}
                    onChange={(e) => updateField(key, 'description', e.target.value)}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Secondary CTA Text</label>
                    <input
                      type="text"
                      value={sec.secondaryCtaText}
                      onChange={(e) => updateField(key, 'secondaryCtaText', e.target.value)}
                      className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Secondary CTA URL</label>
                    <input
                      type="text"
                      value={sec.secondaryCtaLink}
                      onChange={(e) => updateField(key, 'secondaryCtaLink', e.target.value)}
                      className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                    />
                  </div>
                </div>
              </>
            )}

            {hasImage && (
              <StorageImageUploader
                folder="promotional"
                label="Showcase Feature Image"
                value={sec.imageUrl}
                onUploadedSingle={(url) => updateField(key, 'imageUrl', url)}
                onClear={() => updateField(key, 'imageUrl', '')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

interface ShowcaseBannerPanelProps {
  contentMap: Record<string, HomepageContentSection>;
  onRefresh: () => Promise<void>;
  onNotify: (notice: ToastNotice) => void;
}

export const ShowcaseBannerPanel: React.FC<ShowcaseBannerPanelProps> = ({
  contentMap,
  onRefresh,
  onNotify,
}) => {
  const defaultEditorial = DEFAULT_HOMEPAGE_CONTENT.editorial_showcase;
  const [form, setForm] = useState<HomepageContentSection>(
    () => contentMap.editorial_showcase || defaultEditorial
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(contentMap.editorial_showcase || defaultEditorial);
  }, [contentMap, defaultEditorial]);

  const activePreviewUrl = form.imageUrl || gulzarFestiveImg;
  const isUsingBuiltInDefault = !form.imageUrl || form.imageUrl === gulzarFestiveImg;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveAdminHomepageContent({
        ...form,
        sectionKey: 'editorial_showcase',
      });
      await onRefresh();
      onNotify({
        type: 'success',
        message: 'Showcase Banner photo & content saved live to your website.',
      });
    } catch (err: any) {
      onNotify({
        type: 'error',
        message: err?.message || 'Failed to save Showcase Banner.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-stone-900">
            Showcase Banner (New Season Collection)
          </h3>
          <p className="text-xs text-stone-500">
            Upload or change the main showcase boutique picture and text shown in the middle of your homepage.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-stone-200 p-5 sm:p-6 space-y-6 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Live Current Photo Preview */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-800 uppercase tracking-wider text-[11px]">
                Current Live Photo Preview
              </span>
              {isUsingBuiltInDefault && (
                <span className="text-[10px] font-semibold bg-[#FAF6F2] border border-stone-200 px-2 py-0.5 text-stone-600">
                  Built-in Default
                </span>
              )}
            </div>
            <div className="border-4 border-[#FAF6F2] shadow-md bg-stone-100 overflow-hidden">
              <img
                src={activePreviewUrl}
                alt="Showcase Banner Preview"
                className="w-full h-auto max-h-80 object-cover block"
              />
            </div>
          </div>

          {/* Photo Upload & Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 bg-[#FAF6F2] border border-stone-200 space-y-3">
              <StorageImageUploader
                folder="promotional"
                label="Upload / Change Showcase Picture"
                value={form.imageUrl}
                onUploadedSingle={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
                onClear={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
              />

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Or paste image URL
                </label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full py-2 px-3 border border-stone-300 bg-white focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              {!isUsingBuiltInDefault && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-700 hover:text-black underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Original Boutique Photo</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Badge Text</label>
                <div className="relative">
                  <Sparkles className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={form.badgeText}
                    onChange={(e) => setForm((prev) => ({ ...prev, badgeText: e.target.value }))}
                    className="w-full py-2 pl-8 pr-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Heading</label>
                <input
                  type="text"
                  value={form.heading}
                  onChange={(e) => setForm((prev) => ({ ...prev, heading: e.target.value }))}
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-800 mb-1">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Primary Button Label</label>
                <input
                  type="text"
                  value={form.primaryCtaText}
                  onChange={(e) => setForm((prev) => ({ ...prev, primaryCtaText: e.target.value }))}
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Secondary Button Label</label>
                <input
                  type="text"
                  value={form.secondaryCtaText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, secondaryCtaText: e.target.value }))
                  }
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-stone-200">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] font-semibold uppercase tracking-widest inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Showcase Banner'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
