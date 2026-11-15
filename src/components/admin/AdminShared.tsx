import React, { useRef, useState } from 'react';
import { Upload, X, AlertTriangle, Loader2, CheckCircle2, AlertCircle, Video } from 'lucide-react';
import { uploadMediaToSupabase } from '../../lib/supabase';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete Permanently',
  isBusy = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">{title}</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
          <button
            type="button"
            disabled={isBusy}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer inline-flex items-center gap-2 disabled:opacity-60"
          >
            {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface StorageUploaderProps {
  folder: 'products' | 'hero' | 'categories' | 'promotional';
  label: string;
  value?: string;
  multiple?: boolean;
  onUploadedSingle?: (url: string) => void;
  onUploadedMultiple?: (urls: string[]) => void;
  onClear?: () => void;
  hint?: string;
}

export const StorageImageUploader: React.FC<StorageUploaderProps> = ({
  folder,
  label,
  value,
  multiple = false,
  onUploadedSingle,
  onUploadedMultiple,
  onClear,
  hint = 'JPG, PNG, WEBP up to 8MB',
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);
    setProgress(10);

    try {
      const uploadedUrls: string[] = [];
      const fileArr = Array.from(files);
      for (let i = 0; i < fileArr.length; i++) {
        const res = await uploadMediaToSupabase(fileArr[i], folder, (pct) => {
          const overall = Math.round(((i + pct / 100) / fileArr.length) * 100);
          setProgress(overall);
        });
        uploadedUrls.push(res.publicUrl);
      }

      if (multiple && onUploadedMultiple) {
        onUploadedMultiple(uploadedUrls);
      } else if (onUploadedSingle && uploadedUrls[0]) {
        onUploadedSingle(uploadedUrls[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-stone-800">{label}</label>
        <span className="text-[11px] text-stone-400">{hint}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFiles}
          className="hidden"
        />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF6F2] hover:bg-[#EDE1C8] text-stone-900 border border-[#D8C7A5] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>{isUploading ? `Uploading ${progress}%...` : multiple ? 'Upload Images' : 'Upload Image'}</span>
        </button>

        {!multiple && value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-rose-600 hover:underline cursor-pointer"
          >
            Remove Image
          </button>
        )}
      </div>

      {isUploading && (
        <div className="w-full h-1.5 bg-stone-200 overflow-hidden">
          <div
            className="h-full bg-stone-900 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!multiple && value && (
        <div className="relative w-32 h-36 border border-stone-200 bg-stone-50 overflow-hidden">
          <img src={value} alt={label} className="w-full h-full object-cover object-top" />
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-black"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface StorageVideoUploaderProps {
  folder: 'products';
  label: string;
  value?: string;
  onUploaded: (url: string) => void;
  onClear?: () => void;
  hint?: string;
}

export const StorageVideoUploader: React.FC<StorageVideoUploaderProps> = ({
  folder,
  label,
  value,
  onUploaded,
  onClear,
  hint = 'MP4, WEBM, MOV up to 30MB',
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);
    setProgress(10);

    try {
      const res = await uploadMediaToSupabase(file, folder, (pct) => {
        setProgress(pct);
      });
      onUploaded(res.publicUrl);
    } catch (err: any) {
      setError(err?.message || 'Video upload failed.');
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-stone-800">{label}</label>
        <span className="text-[11px] text-stone-400">{hint}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF6F2] hover:bg-[#EDE1C8] text-stone-900 border border-[#D8C7A5] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Video className="w-4 h-4" />
          )}
          <span>{isUploading ? `Uploading ${progress}%...` : value ? 'Replace Video' : 'Upload Video'}</span>
        </button>

        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-rose-600 hover:underline cursor-pointer"
          >
            Remove Video
          </button>
        )}
      </div>

      {isUploading && (
        <div className="w-full h-1.5 bg-stone-200 overflow-hidden">
          <div
            className="h-full bg-stone-900 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value && (
        <div className="relative border border-stone-200 bg-black overflow-hidden max-w-md">
          <video
            src={value}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-56 object-contain"
          />
        </div>
      )}
    </div>
  );
};

export interface ToastNotice {
  type: 'success' | 'error';
  message: string;
}

export const AdminToast: React.FC<{ notice: ToastNotice | null; onClose: () => void }> = ({
  notice,
  onClose,
}) => {
  if (!notice) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 shadow-xl border flex items-center gap-2.5 text-xs font-medium ${
        notice.type === 'success'
          ? 'bg-emerald-950 text-emerald-50 border-emerald-800'
          : 'bg-rose-950 text-rose-50 border-rose-800'
      }`}
    >
      {notice.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
      )}
      <span className="flex-1">{notice.message}</span>
      <button type="button" onClick={onClose} className="opacity-75 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
