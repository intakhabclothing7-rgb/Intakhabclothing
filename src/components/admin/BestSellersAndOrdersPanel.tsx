import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  Save,
  Loader2,
  Package,
  MapPin,
  Phone,
  Pencil,
  X,
} from 'lucide-react';
import { BestSellerEntry, OrderRecord, Product, WebsiteSettings } from '../../types';
import {
  addAdminBestSeller,
  removeAdminBestSeller,
  updateAdminBestSeller,
  reorderAdminBestSellers,
  updateAdminOrderStatus,
  saveAdminSettings,
} from '../../services/supabaseStore';
import { StorageImageUploader, ToastNotice } from './AdminShared';

interface BestSellersPanelProps {
  entries: BestSellerEntry[];
  products: Product[];
  settings: WebsiteSettings;
  onRefresh: () => Promise<void>;
  onNotify: (notice: ToastNotice) => void;
}

export const BestSellersPanel: React.FC<BestSellersPanelProps> = ({
  entries,
  products,
  settings,
  onRefresh,
  onNotify,
}) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [limit, setLimit] = useState(String(settings.bestSellersLimit || 6));
  const [isAdding, setIsAdding] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BestSellerEntry | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const availableToAdd = products.filter(
    (p) => !entries.some((e) => e.productId === p.id)
  );

  const handleAdd = async () => {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    setIsAdding(true);
    try {
      await addAdminBestSeller(product, entries.length + 1);
      setSelectedProductId('');
      await onRefresh();
      onNotify({ type: 'success', message: `"${product.name}" added to Best Sellers.` });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Unable to add best seller.' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveLimit = async () => {
    try {
      await saveAdminSettings({
        ...settings,
        bestSellersLimit: Math.max(1, Number(limit) || 6),
      });
      await onRefresh();
      onNotify({ type: 'success', message: 'Homepage Best Sellers display limit updated.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Unable to update display limit.' });
    }
  };

  const handleRemove = async (entry: BestSellerEntry) => {
    try {
      await removeAdminBestSeller(entry.id, entry.productId);
      await onRefresh();
      onNotify({ type: 'success', message: 'Removed from Best Sellers.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Unable to remove best seller.' });
    }
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= entries.length) return;
    const next = [...entries];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    try {
      await reorderAdminBestSellers(next.map((e) => e.id));
      await onRefresh();
      onNotify({ type: 'success', message: 'Best Sellers order updated.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to reorder.' });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    setIsSavingEdit(true);
    try {
      await updateAdminBestSeller({
        id: editingEntry.id,
        customTitle: editingEntry.customTitle || '',
        customSubtitle: editingEntry.customSubtitle || '',
        customImageUrl: editingEntry.customImageUrl || '',
        isActive: editingEntry.isActive,
      });
      await onRefresh();
      setEditingEntry(null);
      onNotify({ type: 'success', message: 'Best seller card updated.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to save best seller.' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 border border-stone-200 space-y-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-stone-900">
            Manual Best Sellers Curation
          </h3>
          <p className="text-xs text-stone-500">
            Select exact products to showcase on the homepage Best Sellers carousel, control display order, and limit how many appear.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 border-t border-stone-100 text-xs">
          <div className="flex flex-wrap items-end gap-2 flex-1">
            <div className="flex-1 min-w-[220px]">
              <label className="block font-semibold text-stone-700 mb-1">
                Add Product to Best Sellers
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full py-2 px-3 border border-stone-300 bg-white focus:outline-none focus:border-[#D8C7A5]"
              >
                <option value="">-- Choose an existing product --</option>
                {availableToAdd.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Rs.{p.price.toLocaleString('en-PK')})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!selectedProductId || isAdding}
              onClick={handleAdd}
              className="px-4 py-2 bg-[#EDE1C8] hover:bg-[#dfd0b2] disabled:opacity-50 text-black border border-[#D8C7A5] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? 'Adding...' : 'Add Selected'}</span>
            </button>
          </div>

          <div className="flex items-end gap-2">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Homepage Max Display Count
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-24 py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveLimit}
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Limit</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="bg-white p-8 border border-stone-200 text-center text-xs text-stone-500">
            No best sellers selected yet. Choose a product above to feature it on the homepage.
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div
              key={entry.id}
              className="bg-white border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                  {(entry.customImageUrl || entry.product?.images?.[0]) && (
                    <img
                      src={entry.customImageUrl || entry.product?.images?.[0]}
                      alt={entry.customTitle || entry.product?.name}
                      className="w-full h-full object-cover object-top"
                    />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Position #{idx + 1} {!entry.isActive ? '· Hidden' : ''}
                  </span>
                  <h4 className="font-serif text-base font-semibold text-stone-900">
                    {entry.customTitle || entry.product?.name}
                  </h4>
                  <p className="text-stone-500">
                    {entry.customSubtitle ||
                      `${entry.product?.material || ''} — Rs.${entry.product?.price?.toLocaleString('en-PK') || 0}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, -1)}
                  className="p-2 border border-stone-200 text-stone-600 hover:text-black disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === entries.length - 1}
                  onClick={() => handleMove(idx, 1)}
                  className="p-2 border border-stone-200 text-stone-600 hover:text-black disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEntry(entry)}
                  className="px-3 py-1.5 border border-stone-300 hover:bg-stone-50 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Pencil className="w-3 h-3" /> Customize
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(entry)}
                  className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 bg-[#FAF6F2] border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                Customize Best Seller Card
              </h3>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 text-stone-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Card Heading</label>
                <input
                  type="text"
                  value={editingEntry.customTitle || ''}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, customTitle: e.target.value })
                  }
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Card Subtitle</label>
                <input
                  type="text"
                  value={editingEntry.customSubtitle || ''}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, customSubtitle: e.target.value })
                  }
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>
              <StorageImageUploader
                folder="promotional"
                label="Custom Carousel Image (Optional)"
                value={editingEntry.customImageUrl}
                onUploadedSingle={(url) =>
                  setEditingEntry({ ...editingEntry, customImageUrl: url })
                }
                onClear={() => setEditingEntry({ ...editingEntry, customImageUrl: '' })}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingEntry.isActive}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, isActive: e.target.checked })
                  }
                />
                <span className="font-semibold text-stone-800">Active on Homepage</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] font-semibold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
                >
                  {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface OrdersPanelProps {
  orders: OrderRecord[];
  onRefresh: () => Promise<void>;
  onNotify: (notice: ToastNotice) => void;
}

export const OrdersPanel: React.FC<OrdersPanelProps> = ({
  orders,
  onRefresh,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search.trim() ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      o.city.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  const handleStatusChange = async (
    orderId: string,
    status: OrderRecord['status'],
    paymentStatus?: OrderRecord['paymentStatus']
  ) => {
    setUpdatingId(orderId);
    try {
      await updateAdminOrderStatus(orderId, status, paymentStatus);
      await onRefresh();
      onNotify({
        type: 'success',
        message: paymentStatus
          ? `Order updated (${status.toUpperCase()} · Payment: ${paymentStatus.toUpperCase()}).`
          : `Order updated to ${status.toUpperCase()}.`,
      });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to update order status.' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-stone-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, customer name, phone, city..."
            className="w-full text-xs py-2 pl-9 pr-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs py-2 px-3 border border-stone-300 bg-white focus:outline-none focus:border-[#D8C7A5]"
        >
          <option value="all">All Orders ({orders.length})</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-10 border border-stone-200 text-center text-xs text-stone-500">
          No customer orders match your current filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white border border-stone-200 p-5 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-stone-900">
                      {order.orderNumber}
                    </span>
                    <span className="px-2 py-0.5 bg-[#FAF6F2] border border-stone-200 text-[10px] font-semibold uppercase tracking-wider">
                      {order.paymentMethod === 'bank_transfer' ? 'Bank Transfer / JazzCash' : 'Cash on Delivery'}
                    </span>
                    <span
                      className={`px-2 py-0.5 border text-[10px] font-semibold uppercase tracking-wider ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : order.paymentStatus === 'failed' || order.paymentStatus === 'refunded'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      Payment: {order.paymentStatus}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {new Date(order.createdAt).toLocaleString('en-PK')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-1.5 text-stone-600">
                    <strong className="text-stone-900">{order.customerName}</strong>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {order.customerPhone}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {order.shippingAddress}, {order.city}
                    </span>
                  </div>
                  {order.notes && (
                    <p className="text-[11px] text-stone-500 mt-1 italic">
                      Note: "{order.notes}"
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="text-right mr-1">
                    <span className="text-[10px] uppercase text-stone-400 block">Order Total</span>
                    <span className="font-bold text-base text-stone-950 tabular-nums">
                      Rs.{order.total.toLocaleString('en-PK')}
                    </span>
                  </div>

                  <select
                    aria-label="Payment status"
                    disabled={updatingId === order.id}
                    value={order.paymentStatus}
                    onChange={(e) =>
                      handleStatusChange(
                        order.id,
                        order.status,
                        e.target.value as OrderRecord['paymentStatus']
                      )
                    }
                    className="py-2 px-2.5 border border-stone-300 bg-white font-semibold uppercase tracking-wider text-[10px] cursor-pointer"
                  >
                    <option value="pending">Pay: Pending</option>
                    <option value="paid">Pay: Paid</option>
                    <option value="failed">Pay: Failed</option>
                    <option value="refunded">Pay: Refunded</option>
                  </select>

                  <select
                    aria-label="Order status"
                    disabled={updatingId === order.id}
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value as OrderRecord['status'])
                    }
                    className="py-2 px-3 border border-[#D8C7A5] bg-[#EDE1C8]/40 font-semibold uppercase tracking-wider text-[11px] cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 bg-[#FAF6F2] p-2.5 border border-stone-200/70"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">
                          {item.productName} × {item.quantity}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Shirt: {item.shirtSize} ({item.shirtLength}) · Pant: {item.pantSize} ({item.pantLength})
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-stone-900 tabular-nums">
                      Rs.{item.totalPrice.toLocaleString('en-PK')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Status History */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    Status Timeline
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.statusHistory.map((h) => (
                      <span
                        key={h.id}
                        className="px-2 py-1 bg-stone-50 border border-stone-200 text-[10px] text-stone-600"
                      >
                        {h.previousStatus ? `${h.previousStatus} → ` : ''}
                        <strong className="text-stone-900">{h.newStatus}</strong> ·{' '}
                        {new Date(h.createdAt).toLocaleDateString('en-PK')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
