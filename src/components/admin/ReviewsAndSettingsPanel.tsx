import React, { useState } from 'react';
import {
  Star,
  Search,
  CheckCircle2,
  XCircle,
  EyeOff,
  Eye,
  Pencil,
  Trash2,
  History,
  Save,
  Loader2,
  X,
  Mail,
  MapPin,
} from 'lucide-react';
import { Product, Review, ReviewAuditLog, WebsiteSettings } from '../../types';
import {
  updateAdminReviewStatus,
  editAdminReviewWithAudit,
  deleteAdminReview,
  saveAdminSettings,
} from '../../services/supabaseStore';
import { ConfirmDialog, ToastNotice } from './AdminShared';

interface ReviewsPanelProps {
  reviews: Review[];
  auditLogs: ReviewAuditLog[];
  products: Product[];
  onRefresh: () => Promise<void>;
  onNotify: (notice: ToastNotice) => void;
}

export const ReviewsPanel: React.FC<ReviewsPanelProps> = ({
  reviews,
  auditLogs,
  products,
  onRefresh,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'hidden' | 'rejected'>('all');
  const [productFilter, setProductFilter] = useState('all');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editResponse, setEditResponse] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = reviews.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (productFilter !== 'all' && r.productId !== productFilter && r.productName !== productFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        (r.customerEmail || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = async (
    reviewId: string,
    status: 'pending' | 'approved' | 'rejected' | 'hidden'
  ) => {
    try {
      await updateAdminReviewStatus(reviewId, status);
      await onRefresh();
      onNotify({ type: 'success', message: `Review marked as ${status}.` });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Unable to update review status.' });
    }
  };

  const openEdit = (rev: Review) => {
    setEditingReview(rev);
    setEditComment(rev.comment);
    setEditRating(rev.rating);
    setEditResponse(rev.adminResponse || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setIsSavingEdit(true);
    try {
      await editAdminReviewWithAudit({
        review: editingReview,
        newComment: editComment,
        newRating: editRating,
        adminResponse: editResponse,
      });
      await onRefresh();
      setEditingReview(null);
      onNotify({
        type: 'success',
        message: 'Review updated. Original text preserved in private audit history.',
      });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to save review edits.' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminReview(deleteTarget.id);
      await onRefresh();
      setDeleteTarget(null);
      onNotify({ type: 'success', message: 'Review permanently deleted.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to delete review.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getAuditForReview = (reviewId: string) =>
    auditLogs.filter((log) => log.reviewId === reviewId || log.reviewRefId === reviewId);

  const deletedAuditLogs = auditLogs.filter((log) => log.actionType === 'delete' || !log.reviewId);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 border border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews by customer, email, city, text..."
            className="w-full py-2 pl-9 pr-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-2 px-3 border border-stone-300 bg-white focus:outline-none focus:border-[#D8C7A5]"
          >
            <option value="all">All Statuses ({reviews.length})</option>
            <option value="approved">
              Live on Website ({reviews.filter((r) => r.status === 'approved').length})
            </option>
            <option value="hidden">
              Hidden ({reviews.filter((r) => r.status === 'hidden').length})
            </option>
            <option value="pending">
              Pending ({reviews.filter((r) => r.status === 'pending').length})
            </option>
            <option value="rejected">
              Rejected ({reviews.filter((r) => r.status === 'rejected').length})
            </option>
          </select>

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="py-2 px-3 border border-stone-300 bg-white focus:outline-none focus:border-[#D8C7A5]"
          >
            <option value="all">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white p-10 border border-stone-200 text-center text-xs text-stone-500">
            No customer reviews match the active filters.
          </div>
        ) : (
          filtered.map((rev) => {
            const history = getAuditForReview(rev.id);
            const isAuditOpen = expandedAuditId === rev.id;

            return (
              <div key={rev.id} className="bg-white border border-stone-200 p-5 space-y-3 text-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-serif text-base font-semibold text-stone-900">
                      {rev.customerName}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-[#FAF6F2] px-2 py-0.5 border border-stone-200 text-stone-600">
                      <MapPin className="w-3 h-3" /> {rev.city}
                    </span>
                    {rev.customerEmail && (
                      <span className="inline-flex items-center gap-1 text-stone-500 bg-stone-50 px-2 py-0.5 border border-stone-200">
                        <Mail className="w-3 h-3" /> {rev.customerEmail} (Private)
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        rev.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rev.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}
                    >
                      {rev.status === 'approved' ? 'Live' : rev.status}
                    </span>
                    {rev.isEditedByAdmin && (
                      <span className="px-2 py-0.5 bg-stone-900 text-white text-[10px] font-medium">
                        Edited by Admin
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-stone-400">Submitted {rev.date}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-[#D4A456] text-[#D4A456]' : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                  {rev.productName && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                      {rev.productName}
                    </span>
                  )}
                </div>

                <p className="text-stone-800 leading-relaxed text-sm">{rev.comment}</p>

                {rev.media && rev.media.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rev.media.map((m) =>
                      m.type === 'image' ? (
                        <img
                          key={m.id}
                          src={m.url}
                          alt="Customer attachment"
                          className="w-16 h-20 object-cover border border-stone-200"
                        />
                      ) : (
                        <video
                          key={m.id}
                          src={m.url}
                          controls
                          className="w-36 h-24 object-cover border border-stone-200 bg-black"
                        />
                      )
                    )}
                  </div>
                )}

                {rev.adminResponse && (
                  <div className="p-3 bg-[#FAF6F2] border-l-2 border-[#D8C7A5]">
                    <strong className="block text-[11px] uppercase tracking-wider text-stone-900 mb-0.5">
                      Admin Response:
                    </strong>
                    <p className="text-stone-700">{rev.adminResponse}</p>
                  </div>
                )}

                {/* Moderation Actions */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {rev.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(rev.id, 'approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                    {rev.status !== 'hidden' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(rev.id, 'hidden')}
                        className="px-3 py-1.5 border border-stone-300 hover:bg-stone-100 text-stone-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5" /> Hide
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(rev.id, 'approved')}
                        className="px-3 py-1.5 border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Unhide
                      </button>
                    )}
                    {rev.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(rev.id, 'rejected')}
                        className="px-3 py-1.5 border border-amber-300 hover:bg-amber-50 text-amber-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(rev)}
                      className="px-3 py-1.5 border border-stone-300 hover:bg-stone-100 text-stone-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit / Respond
                    </button>
                    {history.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedAuditId(isAuditOpen ? null : rev.id)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        Audit History ({history.length})
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(rev)}
                    className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                {/* Private Audit History */}
                {isAuditOpen && history.length > 0 && (
                  <div className="mt-2 p-3 bg-stone-50 border border-stone-200 space-y-2">
                    <p className="font-bold uppercase tracking-wider text-[10px] text-stone-600">
                      Private Admin Audit Log (Original Text Preserved)
                    </p>
                    {history.map((log) => (
                      <div key={log.id} className="p-2.5 bg-white border border-stone-200 space-y-1">
                        <div className="flex justify-between text-[10px] text-stone-400">
                          <span>{log.actionNote}</span>
                          <span>{new Date(log.createdAt).toLocaleString('en-PK')}</span>
                        </div>
                        <p className="text-[11px] text-stone-600">
                          <strong>Original ({log.previousRating}★):</strong> {log.previousComment}
                        </p>
                        <p className="text-[11px] text-stone-900">
                          <strong>Updated ({log.newRating}★):</strong> {log.newComment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Preserved Deleted Reviews Audit Trail */}
      {deletedAuditLogs.length > 0 && (
        <div className="bg-white border border-stone-200 p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <History className="w-4 h-4 text-stone-600" />
            <h4 className="font-bold uppercase tracking-wider text-stone-800">
              Archived Audit Log — Deleted Reviews ({deletedAuditLogs.length})
            </h4>
          </div>
          <div className="space-y-2">
            {deletedAuditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-stone-50 border border-stone-200 space-y-1">
                <div className="flex justify-between text-[10px] text-stone-500">
                  <span>
                    <strong>{log.customerName || 'Customer'}</strong> · {log.actionNote}
                  </span>
                  <span>{new Date(log.createdAt).toLocaleString('en-PK')}</span>
                </div>
                <p className="text-[11px] text-stone-700">
                  <strong>Original ({log.previousRating ?? '-'}★ · {log.previousStatus || 'unknown'}):</strong>{' '}
                  {log.previousComment}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit / Admin Response Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 bg-[#FAF6F2] border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                Moderate & Respond — {editingReview.customerName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="p-1 text-stone-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Star Rating</label>
                <select
                  value={editRating}
                  onChange={(e) => setEditRating(Number(e.target.value))}
                  className="w-full py-2 px-3 border border-stone-300 bg-white focus:outline-none focus:border-[#D8C7A5]"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} Stars
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Review Comment (Edits are logged & badged as Admin-Edited)
                </label>
                <textarea
                  rows={4}
                  required
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Official Intakhab Admin Response (Public)
                </label>
                <textarea
                  rows={3}
                  value={editResponse}
                  onChange={(e) => setEditResponse(e.target.value)}
                  placeholder="Thank you for choosing Intakhab..."
                  className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
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

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Review Permanently?"
        message={`Delete review by "${deleteTarget?.customerName}"? This cannot be undone.`}
        isBusy={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

interface SettingsPanelProps {
  settings: WebsiteSettings;
  onRefresh: () => Promise<void>;
  onNotify: (notice: ToastNotice) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onRefresh,
  onNotify,
}) => {
  const [form, setForm] = useState<WebsiteSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveAdminSettings(form);
      await onRefresh();
      onNotify({ type: 'success', message: 'Store settings updated across live storefront.' });
    } catch (err: any) {
      onNotify({ type: 'error', message: err?.message || 'Failed to save website settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs">
      <div className="bg-white border border-stone-200 p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              Website & Store Configuration
            </h3>
            <p className="text-stone-500">
              Manage delivery pricing, timelines, WhatsApp integration, and bank/JazzCash checkout details.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] font-semibold uppercase tracking-widest inline-flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Settings</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-stone-800 mb-1">Delivery Fee (PKR)</label>
            <input
              type="number"
              required
              value={form.deliveryFee}
              onChange={(e) => setForm({ ...form, deliveryFee: Number(e.target.value) || 0 })}
              className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-800 mb-1">Delivery Timeframe</label>
            <input
              type="text"
              required
              value={form.deliveryTimeText}
              onChange={(e) => setForm({ ...form, deliveryTimeText: e.target.value })}
              className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-800 mb-1">WhatsApp Number</label>
            <input
              type="text"
              required
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-800 mb-1">Instagram Profile URL</label>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-800 mb-1">
              Default Hero Timing (ms)
            </label>
            <input
              type="number"
              min="1000"
              step="250"
              value={form.heroTransitionMs}
              onChange={(e) => setForm({ ...form, heroTransitionMs: Number(e.target.value) || 2500 })}
              className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-800 mb-1">
              Homepage Best Sellers Limit
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={form.bestSellersLimit}
              onChange={(e) => setForm({ ...form, bestSellersLimit: Number(e.target.value) || 6 })}
              className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100">
          <h4 className="font-bold uppercase tracking-wider text-stone-800 mb-3">
            Bank Transfer / JazzCash Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-stone-800 mb-1">Account Title</label>
              <input
                type="text"
                value={form.bankTitle}
                onChange={(e) => setForm({ ...form, bankTitle: e.target.value })}
                className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-800 mb-1">Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-800 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={form.bankAccountNumber}
                onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                className="w-full py-2 px-3 border border-stone-300 font-mono focus:outline-none focus:border-[#D8C7A5]"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-800 mb-1">JazzCash Number</label>
              <input
                type="text"
                value={form.jazzcashNumber}
                onChange={(e) => setForm({ ...form, jazzcashNumber: e.target.value })}
                className="w-full py-2 px-3 border border-stone-300 font-mono focus:outline-none focus:border-[#D8C7A5]"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-800 mb-1">JazzCash Account Name</label>
              <input
                type="text"
                value={form.jazzcashName}
                onChange={(e) => setForm({ ...form, jazzcashName: e.target.value })}
                className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100">
          <label className="block font-semibold text-stone-800 mb-1">
            Footer Announcement Marquee Text (separate items with ✦)
          </label>
          <input
            type="text"
            value={form.announcementText}
            onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
            className="w-full py-2 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
          />
        </div>
      </div>
    </form>
  );
};
