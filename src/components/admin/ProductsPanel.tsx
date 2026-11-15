import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  Star,
  Sparkles,
  CheckCircle2,
  EyeOff,
  X,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { Category, Product } from '../../types';
import {
  saveAdminProduct,
  deleteAdminProduct,
  reorderAdminProducts,
} from '../../services/supabaseStore';
import { ConfirmDialog, StorageImageUploader, ToastNotice } from './AdminShared';

interface ProductsPanelProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => Promise<void>;
  onNotify: (notice: ToastNotice) => void;
}

interface ProductFormState {
  id?: string;
  name: string;
  urduName: string;
  slug: string;
  sku: string;
  description: string;
  price: string;
  salePrice: string;
  category: string;
  categoryIds: string[];
  material: string;
  colour: string;
  availableSizes: string;
  availableColors: string;
  modelSpecs: string;
  features: string;
  careInstructions: string;
  stockQuantity: string;
  inStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  displayOrder: string;
  images: string[];
}

const emptyForm = (nextOrder: number): ProductFormState => ({
  name: '',
  urduName: '',
  slug: '',
  sku: `INT-${Math.floor(1000 + Math.random() * 9000)}`,
  description: '',
  price: '13800',
  salePrice: '',
  category: 'New Arrivals',
  categoryIds: [],
  material: 'Cotton-Silk',
  colour: '',
  availableSizes: 'XS, S, M, L, XL',
  availableColors: '',
  modelSpecs: 'Model height: 5 ft 6 in, wearing size S',
  features: 'Pure stitched ready-to-wear ensemble\nTailored placket & breathable lining\nCustom shirt & pant length options',
  careInstructions: 'Dry clean recommended\nSteam iron on reverse',
  stockQuantity: '12',
  inStock: true,
  isActive: true,
  isFeatured: false,
  isNewArrival: true,
  isBestSeller: false,
  displayOrder: String(nextOrder),
  images: [],
});

export const ProductsPanel: React.FC<ProductsPanelProps> = ({
  products,
  categories,
  onRefresh,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'bestsellers'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(() => emptyForm(products.length + 1));
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return p.isActive !== false;
    if (statusFilter === 'inactive') return p.isActive === false;
    if (statusFilter === 'bestsellers') return Boolean(p.isBestSeller);
    return true;
  });

  const openCreateModal = () => {
    setForm(emptyForm(products.length + 1));
    setManualImageUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    const regularPrice = product.originalPrice || product.price;
    setForm({
      id: product.id,
      name: product.name,
      urduName: product.urduName || '',
      slug: product.slug || '',
      sku: product.sku,
      description: product.description || '',
      price: String(regularPrice),
      salePrice: product.salePrice ? String(product.salePrice) : '',
      category: product.category || 'New Arrivals',
      categoryIds: product.categoryIds || [],
      material: product.material || '',
      colour: product.colour || '',
      availableSizes: (product.availableSizes || ['XS', 'S', 'M', 'L', 'XL']).join(', '),
      availableColors: (product.availableColors || []).join(', '),
      modelSpecs: product.modelSpecs || '',
      features: (product.features || []).join('\n'),
      careInstructions: (product.careInstructions || []).join('\n'),
      stockQuantity: String(product.stockQuantity ?? 10),
      inStock: product.inStock,
      isActive: product.isActive !== false,
      isFeatured: Boolean(product.isFeatured),
      isNewArrival: Boolean(product.isNewArrival),
      isBestSeller: Boolean(product.isBestSeller),
      displayOrder: String(product.displayOrder ?? 1),
      images: [...(product.images || [])],
    });
    setManualImageUrl('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) {
      onNotify({ type: 'error', message: 'Product name and SKU are required.' });
      return;
    }

    setIsSaving(true);
    try {
      await saveAdminProduct({
        id: form.id,
        name: form.name,
        urduName: form.urduName,
        slug: form.slug,
        sku: form.sku,
        description: form.description,
        price: Number(form.price) || 0,
        salePrice: form.salePrice.trim() ? Number(form.salePrice) : null,
        category: form.category,
        categoryIds: form.categoryIds,
        material: form.material,
        colour: form.colour,
        availableSizes: form.availableSizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        availableColors: form.availableColors
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        modelSpecs: form.modelSpecs,
        features: form.features
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        careInstructions: form.careInstructions
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        stockQuantity: Number(form.stockQuantity) || 0,
        inStock: form.inStock,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival,
        isBestSeller: form.isBestSeller,
        displayOrder: Number(form.displayOrder) || 0,
        images: form.images,
      });

      await onRefresh();
      setIsModalOpen(false);
      onNotify({
        type: 'success',
        message: form.id ? 'Product updated successfully.' : 'New product published to storefront.',
      });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to save product.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminProduct(deleteTarget.id);
      await onRefresh();
      setDeleteTarget(null);
      onNotify({
        type: 'success',
        message: 'Product permanently deleted (existing historical orders remain intact).',
      });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to delete product.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= products.length) return;
    const reordered = [...products];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    try {
      await reorderAdminProducts(reordered.map((p) => p.id));
      await onRefresh();
      onNotify({ type: 'success', message: 'Product display order updated.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Unable to reorder products.' });
    }
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= form.images.length) return;
    const next = [...form.images];
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);
    setForm((prev) => ({ ...prev, images: next }));
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, SKU, category..."
              className="w-full text-xs py-2 pl-9 pr-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs py-2 px-3 border border-stone-300 bg-white focus:outline-none focus:border-[#D8C7A5]"
          >
            <option value="all">All Products ({products.length})</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Hidden</option>
            <option value="bestsellers">Best Sellers</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] text-xs font-semibold uppercase tracking-widest cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-stone-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FAF6F2] border-b border-stone-200 text-[11px] uppercase tracking-wider text-stone-600">
              <th className="py-3 px-4 font-semibold">Order</th>
              <th className="py-3 px-4 font-semibold">Product</th>
              <th className="py-3 px-4 font-semibold">Pricing</th>
              <th className="py-3 px-4 font-semibold">Stock</th>
              <th className="py-3 px-4 font-semibold">Flags</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-stone-500">
                  No products match your search criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-stone-50/70">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={statusFilter !== 'all' || Boolean(searchQuery) || idx === 0}
                        onClick={() => handleMove(idx, -1)}
                        className="p-1 text-stone-500 hover:text-black disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={
                          statusFilter !== 'all' ||
                          Boolean(searchQuery) ||
                          idx === filteredProducts.length - 1
                        }
                        onClick={() => handleMove(idx, 1)}
                        className="p-1 text-stone-500 hover:text-black disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">{p.name}</p>
                        <p className="text-[11px] text-stone-500">
                          SKU: {p.sku} · {p.category}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-semibold text-stone-900 tabular-nums">
                      Rs.{p.price.toLocaleString('en-PK')}
                    </p>
                    {p.originalPrice && p.originalPrice > p.price && (
                      <p className="text-[11px] text-stone-400 line-through tabular-nums">
                        Rs.{p.originalPrice.toLocaleString('en-PK')}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium ${
                        p.inStock
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {p.inStock ? `In Stock (${p.stockQuantity ?? 0})` : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-700 text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-200 text-stone-600 text-[10px] font-medium">
                          <EyeOff className="w-3 h-3" /> Hidden
                        </span>
                      )}
                      {p.isNewArrival && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EDE1C8] text-black text-[10px] font-semibold">
                          New Arrival
                        </span>
                      )}
                      {p.isBestSeller && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Best Seller
                        </span>
                      )}
                      {p.isFeatured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-900 text-white text-[10px] font-medium">
                          <Sparkles className="w-2.5 h-2.5" /> Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="px-2.5 py-1.5 border border-stone-300 hover:bg-stone-100 text-stone-800 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(p)}
                        className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 bg-[#FAF6F2] border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                {form.id ? `Edit Product — ${form.name}` : 'Add New Stitched Suit'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Urdu Subtitle</label>
                  <input
                    type="text"
                    value={form.urduName}
                    onChange={(e) => setForm({ ...form, urduName: e.target.value })}
                    placeholder="e.g. گلنار کریمسن سیٹ"
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 font-mono focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">URL Slug (auto if blank)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="gulnar-crimson-co-ord-set"
                    className="w-full py-2 px-3 border border-stone-300 font-mono focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Regular Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Sale Price (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    placeholder="None"
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Primary Category Label</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Fabric / Material</label>
                  <input
                    type="text"
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    placeholder="Cotton-Silk, Crepe-Silk"
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Colour</label>
                  <input
                    type="text"
                    value={form.colour}
                    onChange={(e) => setForm({ ...form, colour: e.target.value })}
                    placeholder="Deep Crimson Rose"
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block font-semibold text-stone-800 mb-1.5">
                    Assign to Collections / Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const selected = form.categoryIds.includes(cat.id);
                      const isBestSellersCat =
                        cat.slug === 'best-sellers' || cat.name.toLowerCase() === 'best sellers';
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            setForm((prev) => {
                              const nextIds = selected
                                ? prev.categoryIds.filter((id) => id !== cat.id)
                                : [...prev.categoryIds, cat.id];
                              return {
                                ...prev,
                                categoryIds: nextIds,
                                ...(isBestSellersCat ? { isBestSeller: !selected } : {}),
                              };
                            })
                          }
                          className={`px-3 py-1.5 border text-xs cursor-pointer transition-colors ${
                            selected
                              ? 'bg-[#EDE1C8] border-[#D8C7A5] text-black font-semibold'
                              : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Available Sizes (comma separated)
                  </label>
                  <input
                    type="text"
                    value={form.availableSizes}
                    onChange={(e) => setForm({ ...form, availableSizes: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Available Colors (comma separated)
                  </label>
                  <input
                    type="text"
                    value={form.availableColors}
                    onChange={(e) => setForm({ ...form, availableColors: e.target.value })}
                    placeholder="Crimson Rose, Emerald"
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Key Features (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={form.features}
                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Care Instructions (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={form.careInstructions}
                    onChange={(e) => setForm({ ...form, careInstructions: e.target.value })}
                    className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                  />
                </div>
              </div>

              {/* Visibility & Merchandising Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-[#FAF6F2] border border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span className="font-medium">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                  />
                  <span className="font-medium">In Stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isNewArrival}
                    onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                  />
                  <span className="font-medium">New Arrival</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isBestSeller}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const bestCat = categories.find(
                        (c) => c.slug === 'best-sellers' || c.name.toLowerCase() === 'best sellers'
                      );
                      setForm((prev) => ({
                        ...prev,
                        isBestSeller: checked,
                        categoryIds: bestCat
                          ? checked
                            ? Array.from(new Set([...prev.categoryIds, bestCat.id]))
                            : prev.categoryIds.filter((id) => id !== bestCat.id)
                          : prev.categoryIds,
                      }));
                    }}
                  />
                  <span className="font-medium">Best Seller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                  <span className="font-medium">Featured</span>
                </label>
              </div>

              {/* Multi-image Uploader to Supabase Storage */}
              <div className="space-y-3 p-4 border border-stone-200 bg-stone-50/60">
                <StorageImageUploader
                  folder="products"
                  label="Product Images (Multiple Supported)"
                  multiple
                  onUploadedMultiple={(urls) =>
                    setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }))
                  }
                />

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    placeholder="Or paste an image URL..."
                    className="flex-1 py-1.5 px-3 border border-stone-300 bg-white focus:outline-none focus:border-[#D8C7A5]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!manualImageUrl.trim()) return;
                      setForm((prev) => ({
                        ...prev,
                        images: [...prev.images, manualImageUrl.trim()],
                      }));
                      setManualImageUrl('');
                    }}
                    className="px-3 py-1.5 bg-stone-900 text-white text-[11px] font-semibold uppercase tracking-wider cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>

                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                    {form.images.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="relative border border-stone-200 bg-white p-1 space-y-1"
                      >
                        <div className="aspect-[3/4] overflow-hidden bg-stone-100">
                          <img src={url} alt="" className="w-full h-full object-cover object-top" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-stone-500">
                          <span>{idx === 0 ? 'Primary' : `#${idx + 1}`}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveImage(idx, -1)}
                              disabled={idx === 0}
                              className="p-0.5 hover:text-black disabled:opacity-30 cursor-pointer"
                            >
                              ◀
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(idx, 1)}
                              disabled={idx === form.images.length - 1}
                              className="p-0.5 hover:text-black disabled:opacity-30 cursor-pointer"
                            >
                              ▶
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== idx),
                                }))
                              }
                              className="p-0.5 text-rose-600 hover:text-rose-800 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-stone-300 text-stone-700 font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] font-semibold uppercase tracking-widest cursor-pointer inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSaving ? 'Saving...' : form.id ? 'Save Changes' : 'Publish Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Product Permanently?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Customer order history referencing this product will remain intact safely.`}
        isBusy={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
