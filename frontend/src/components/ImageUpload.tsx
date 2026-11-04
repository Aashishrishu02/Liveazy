import React, { useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { getApiBaseUrl } from "../utils/api";

export interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  folder?: string;
  required?: boolean;
  aspectRatio?: "video" | "square" | "wide" | "auto";
  disabled?: boolean;
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = "Upload Image",
  helperText,
  folder = "uploads",
  required = false,
  aspectRatio = "video",
  disabled = false,
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const currentUrl = (value || "").trim();

  const validateFile = (file: File): string | null => {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const type = file.type.toLowerCase();

    if (!ALLOWED_TYPES.includes(type) && !ALLOWED_EXTS.includes(ext)) {
      return `Invalid file format "${file.name}". Please upload a JPG, JPEG, PNG, or WEBP image.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return `File size (${sizeMb} MB) exceeds the 5 MB limit. Please select a smaller image.`;
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setSuccessNotice(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setUploading(true);
      const apiBase = getApiBaseUrl();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBase}/upload/image`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || (!data.url && !data.secure_url)) {
        const errorMsg =
          data.message ||
          (Array.isArray(data.message) ? data.message.join(", ") : null) ||
          "Failed to upload image. Please try again.";
        throw new Error(errorMsg);
      }

      const uploadedUrl = data.url || data.secure_url;
      onChange(uploadedUrl);
      setSuccessNotice("Image uploaded successfully!");
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: unknown) {
      console.error("ImageUpload error:", err);
      const msg = err instanceof Error ? err.message : "Failed to upload image from device.";
      setError(msg);
      // NOTE: Existing image is intentionally preserved when an upload fails!
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    setSuccessNotice(null);
    onChange("");
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square max-w-[220px]";
      case "wide":
        return "aspect-[21/9] w-full";
      case "auto":
        return "min-h-[140px] w-full";
      case "video":
      default:
        return "aspect-[16/9] w-full";
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label & Requirement indicator */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {currentUrl && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Ready to save
            </span>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* Preview OR Dropzone */}
      {currentUrl ? (
        /* Image Preview with Replace and Remove actions */
        <div className="relative rounded-2xl border border-gray-200 bg-white p-3 shadow-xs">
          <div
            className={`relative overflow-hidden rounded-xl border border-gray-100 bg-slate-50 ${getAspectClass()}`}
          >
            <img
              src={currentUrl}
              alt="Asset Preview"
              className="h-full w-full object-contain"
              onError={(e) => {
                // If invalid URL, fallback to error state
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Crect width='98' height='98' x='1' y='1' rx='10'/%3E%3Cpath d='m20 70 25-25 15 15 20-20 15 15'/%3E%3Ccircle cx='35' cy='35' r='6'/%3E%3C/svg%3E";
              }}
            />

            {/* Uploading overlay */}
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F2942]/70 text-white backdrop-blur-xs">
                <RefreshCw size={26} className="animate-spin mb-2 text-teal-400" />
                <span className="text-xs font-bold">Uploading new image...</span>
              </div>
            )}
          </div>

          {/* Action toolbar below/over preview */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs transition hover:border-[#0F2942] hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={uploading ? "animate-spin" : ""} />
                <span>Replace Image</span>
              </button>

              <button
                type="button"
                disabled={disabled || uploading}
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50/60 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>

            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-[#0F2942] truncate max-w-[150px]"
              title={currentUrl}
            >
              <span>View full</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      ) : (
        /* Empty Dropzone / Upload button */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (!disabled && !uploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            isDragOver
              ? "border-[#008A90] bg-[#008A90]/5 scale-[0.99]"
              : "border-gray-200 bg-[#FBFBFE] hover:border-[#008A90] hover:bg-white"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center py-4">
              <RefreshCw size={32} className="animate-spin text-[#008A90] mb-2" />
              <p className="text-xs font-bold text-[#0F2942]">Uploading image...</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Please wait while the asset is stored</p>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-gray-100 text-[#008A90] group-hover:scale-105 transition">
                <Upload size={22} className="stroke-[2.2]" />
              </div>

              <div className="mt-3">
                <p className="text-xs font-bold text-[#0F2942]">
                  <span className="text-[#008A90] underline underline-offset-2">Choose Image</span> or drag & drop from device
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  JPG, JPEG, PNG, or WEBP (up to 5 MB)
                </p>
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-[#0F2942] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1a446c]"
              >
                <ImageIcon size={14} />
                <span>Upload from Device</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700 animate-in fade-in duration-200">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-700 font-bold ml-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Success notice */}
      {successNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-700 animate-in fade-in duration-200">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          <span className="flex-1">{successNotice}</span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !error && !successNotice && (
        <p className="text-[11px] text-gray-400 pl-0.5">{helperText}</p>
      )}
    </div>
  );
};

export default ImageUpload;
