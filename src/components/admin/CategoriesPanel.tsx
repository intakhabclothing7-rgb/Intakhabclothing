import React, { useState } from 'react';
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
  FolderOpen,
} from 'lucide-react';
import { Category, Product } from '../../types';
import {
  saveAdminCategory,
  deleteAdminCategory,
  reorderAdminCategories,
} from '../../services/supabaseStore';
import { ConfirmDialog, StorageImageUploader, ToastNotice } from './AdminShared';

interface CategoriesPanelProps {
  categories: Category[];
  products: Product[];
  onRefresh: () => Promise<void>;
  onNotify: (notice: ToastNotice) => void;
}

export const CategoriesPanel: React.FC<CategoriesPanelProps> = ({
  categories,
  products,
  onRefresh,
  onNotify,
}) => {
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditing({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      displayOrder: categories.length + 1,
      isActive: true,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return;
    setIsSaving(true);
    try {
      await saveAdminCategory({
        id: editing.id,
        name: editing.name,
        slug: editing.slug,
        description: editing.description,
        imageUrl: editing.imageUrl,
        displayOrder: editing.displayOrder ?? categories.length + 1,
        isActive: editing.isActive !== false,
      });
      await onRefresh();
      setEditing(null);
      onNotify({ type: 'success', message: 'Category saved successfully.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to save category.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    try {
      await reorderAdminCategories(next.map((c) => c.id));
      await onRefresh();
      onNotify({ type: 'success', message: 'Category display order updated.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Unable to reorder categories.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminCategory(deleteTarget.id);
      await onRefresh();
      setDeleteTarget(null);
      onNotify({ type: 'success', message: 'Category deleted.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to delete category.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const countProductsForCategory = (cat: Category) =>
    products.filter(
      (p) =>
        p.categoryIds?.includes(cat.id) ||
        p.category.toLowerCase() === cat.name.toLowerCase()
    ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-stone-200">
        <div>
          <h3 className="font-serif text-lg font-semibold text-stone-900">
            Categories & Collections
          </h3>
          <p className="text-xs text-stone-500">
            Create custom navigation categories and control visibility order on the storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] text-xs font-semibold uppercase tracking-widest cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, idx) => (
          <div key={cat.id} className="bg-white border border-stone-200 p-4 flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-[#FAF6F2] border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <FolderOpen className="w-5 h-5 text-stone-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-serif text-base font-semibold text-stone-900 truncate">
                    {cat.name}
                  </h4>
                  {cat.isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400 font-mono">/{cat.slug}</p>
                <p className="text-xs text-stone-600 mt-1 line-clamp-2">{cat.description}</p>
                <p className="text-[11px] font-medium text-stone-500 mt-1.5">
                  {countProductsForCategory(cat)} linked products
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, -1)}
                  className="p-1.5 border border-stone-200 text-stone-600 hover:text-black disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === categories.length - 1}
                  onClick={() => handleMove(idx, 1)}
                  className="p-1.5 border border-stone-200 text-stone-600 hover:text-black disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(cat)}
                  className="px-2.5 py-1 border border-stone-300 hover:bg-stone-50 text-stone-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(cat)}
                  className="px-2.5 py-1 border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 bg-[#FAF6F2] border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                {editing.id ? 'Edit Category' : 'New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 text-stone-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. Festive Velvet, Cotton Silk Solids"
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={editing.slug || ''}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="Auto-generated if blank"
                  className="w-full py-2 px-3 border border-stone-300 font-mono focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <StorageImageUploader
                folder="categories"
                label="Category Banner Image (Optional)"
                value={editing.imageUrl}
                onUploadedSingle={(url) => setEditing({ ...editing, imageUrl: url })}
                onClear={() => setEditing({ ...editing, imageUrl: '' })}
              />

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isActive !== false}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                />
                <span className="font-semibold text-stone-800">Active & Visible on Website</span>
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
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Category?"
        message={`Delete "${deleteTarget?.name}"? Products themselves will not be deleted.`}
        isBusy={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
