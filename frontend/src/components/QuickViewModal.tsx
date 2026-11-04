import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
  Minus,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Heart,
  Share2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../types/rental";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";
import { isInWishlist, toggleWishlist, subscribeWishlist } from "../utils/wishlist";
import { shareProduct } from "../utils/share";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product, tenure: number, quantity: number) => void;
  whatsappNumber?: string;
}

interface WhatsAppSettings {
  whatsappNumber?: string;
  whatsappMessage?: string;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const navigate = useNavigate();
  const [selectedTenure, setSelectedTenure] = useState<number>(12);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setWishlisted(isInWishlist(product.id));
    }
    const unsub = subscribeWishlist((ids) => {
      if (product) {
        setWishlisted(ids.includes(String(product.id).trim()));
      }
    });
    return unsub;
  }, [product]);

  const handleWishlistToggle = () => {
    if (!product) return;
    const newState = toggleWishlist(product.id);
    setWishlisted(newState);
    setToastMsg(newState ? "Added to your wishlist!" : "Removed from wishlist");
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleShare = async () => {
    if (!product) return;
    const res = await shareProduct({
      id: product.id,
      name: productName,
      price: currentRent,
      image: product.image,
    });
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(null), 2500);
  };
  const [waSettings, setWaSettings] = useState<WhatsAppSettings>({
    whatsappNumber: "917061460429",
    whatsappMessage:
      "Hi LIVEAZY! I would like to rent {productName} ({rentalDuration}) at {monthlyRent}/month. Product ID: {productId}",
  });

  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function loadWa() {
      try {
        const res = await fetchJsonDeduplicated<WhatsAppSettings>(`${apiBase}/settings/whatsapp`);
        if (!cancelled && res?.whatsappNumber) {
          setWaSettings(res);
        }
      } catch (e) {
        console.warn("Could not fetch whatsapp settings in QuickViewModal:", e);
      }
    }

    if (isOpen) {
      void loadWa();
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // Clean product name
  const productName = (() => {
    const original = String(product.name ?? "").trim();
    const id = String(product.id ?? "").trim();
    let cleaned =
      id && original.toLowerCase().endsWith(id.toLowerCase())
        ? original.slice(0, -id.length).trim()
        : original;
    cleaned = cleaned.replace(/c[a-z0-9]{24}$/i, "").trim();
    return cleaned || original;
  })();

  const pRecord = product as unknown as {
    rent3M?: number | null;
    rent6M?: number | null;
    rent12M?: number | null;
    deposit3M?: number | null;
    deposit6M?: number | null;
    deposit12M?: number | null;
    images?: Array<{ imageUrl: string }>;
  };

  const baseMonthly = Number(pRecord.rent12M || product.monthlyPrice || 499);
  const currentRent = (() => {
    if (selectedTenure === 3 && pRecord.rent3M && pRecord.rent3M > 0) return pRecord.rent3M;
    if (selectedTenure === 6 && pRecord.rent6M && pRecord.rent6M > 0) return pRecord.rent6M;
    if (selectedTenure === 12 && pRecord.rent12M && pRecord.rent12M > 0) return pRecord.rent12M;
    if (selectedTenure === 3) return Math.round(baseMonthly * 1.25);
    if (selectedTenure === 6) return Math.round(baseMonthly * 1.12);
    return baseMonthly;
  })();

  const currentDeposit = (() => {
    if (selectedTenure === 3 && pRecord.deposit3M !== undefined && pRecord.deposit3M !== null) return pRecord.deposit3M;
    if (selectedTenure === 6 && pRecord.deposit6M !== undefined && pRecord.deposit6M !== null) return pRecord.deposit6M;
    if (selectedTenure === 12 && pRecord.deposit12M !== undefined && pRecord.deposit12M !== null) return pRecord.deposit12M;
    return Number(product.deposit || 0);
  })();

  const mrpPrice = Number(product.originalPrice || Math.round(currentRent * 1.5));
  const discPercent =
    mrpPrice > currentRent
      ? Math.round(((mrpPrice - currentRent) / mrpPrice) * 100)
      : 0;

  // Prepare images array
  const galleryImages: string[] = [];
  if (product.image) galleryImages.push(product.image);
  if (Array.isArray(pRecord.images)) {
    pRecord.images.forEach((img) => {
      if (img.imageUrl && !galleryImages.includes(img.imageUrl)) {
        galleryImages.push(img.imageUrl);
      }
    });
  }
  const images = galleryImages.length > 0 ? galleryImages : [product.image].filter(Boolean);

  // Format WhatsApp message using Admin template
  const rawNumber = waSettings.whatsappNumber || "917061460429";
  const cleanPhone = rawNumber.replace(/\D/g, "");
  const normalizedWa = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  let formattedMessage = (
    waSettings.whatsappMessage ||
    "Hi LIVEAZY! {productName} \n{productId}\n{categoryName}\n{rentalDuration}\n{monthlyRent}\n{refundableDeposit}"
  )
    .replace(/{productName}/g, productName)
    .replace(/{productId}/g, String(product.id).slice(0, 8).toUpperCase())
    .replace(/{categoryName}/g, String(product.category || "Furniture"))
    .replace(/{rentalDuration}/g, `${selectedTenure} Months`)
    .replace(/{monthlyRent}/g, `₹${currentRent.toLocaleString("en-IN")}`)
    .replace(
      /{refundableDeposit}/g,
      currentDeposit > 0 ? `₹${currentDeposit.toLocaleString("en-IN")}` : "₹0 (Zero Deposit)"
    );

  const whatsappUrl = `https://wa.me/${normalizedWa}?text=${encodeURIComponent(formattedMessage)}`;

  const handleNextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAdd = () => {
    onAddToCart?.(product, selectedTenure, quantity);
    onClose();
  };

  const handleFullDetails = () => {
    onClose();
    navigate(`/product/${encodeURIComponent(product.id)}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qv-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl bg-white p-5 sm:p-7 shadow-2xl transition-transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Toast Feedback */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-[#0F2942] px-4 py-1.5 text-xs font-semibold text-white shadow-lg animate-in fade-in slide-in-from-top-2">
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5">
          {/* Wishlist toggle */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200 ${
              wishlisted ? "text-rose-500" : "text-gray-500 hover:text-rose-500"
            }`}
          >
            <Heart size={18} className={wishlisted ? "fill-rose-500" : ""} />
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share product"
            title="Share product"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-[#008A90]"
          >
            <Share2 size={17} />
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Column: Gallery */}
          <div className="flex flex-col">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#f7f6fb] border border-gray-100">
              <img
                src={images[activePhotoIndex] || product.image}
                alt={productName}
                className="h-full w-full object-cover transition duration-300"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    aria-label="Previous photo"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-sm backdrop-blur-xs hover:bg-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    aria-label="Next photo"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-sm backdrop-blur-xs hover:bg-white"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    Photo {activePhotoIndex + 1} of {images.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      idx === activePhotoIndex
                        ? "border-[#4a36b3] shadow-xs"
                        : "border-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Quality checklist */}
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-[11px] text-emerald-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>50+ Point Deep Steam Sanitized &amp; Inspected</span>
              </div>
              <p className="text-emerald-700">
                Free doorstep delivery, assembly &amp; free annual maintenance included.
              </p>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-[#f0eaff] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4a36b3]">
                  {product.category}
                </span>
                {product.tag && (
                  <span className="rounded-full bg-[#e8f8f0] px-2 py-0.5 text-[10px] font-bold uppercase text-[#166634]">
                    {product.tag}
                  </span>
                )}
              </div>

              <h2 id="qv-title" className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                {productName}
              </h2>

              {/* Rating */}
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-0.5 font-bold text-gray-900">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>4.8</span>
                </div>
                <span>(Verified Quality)</span>
                <span className="text-gray-300">·</span>
                <span className="text-emerald-600 font-medium">Mint Condition</span>
              </div>

              {/* Specs & Description */}
              {product.specs && product.specs.length > 0 && (
                <div className="mt-3 text-xs text-gray-600 space-y-1 border-t border-gray-100 pt-3">
                  <p className="text-gray-700 line-clamp-3 leading-relaxed">
                    {product.specs[0]}
                  </p>
                </div>
              )}

              {/* Tenure Selection */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-gray-900 mb-1.5">
                  Select Rental Tenure:
                </label>
                <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-[#f4f4f5] p-1">
                  {[3, 6, 12].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTenure(t)}
                      className={`rounded-md py-1.5 text-xs font-bold transition ${
                        selectedTenure === t
                          ? "bg-white text-[#4a36b3] shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {t} {t === 12 ? "Months+" : "Months"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Display */}
              <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-gray-200 pt-3">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[#4a36b3]">
                      ₹{currentRent.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">/month</span>
                  </div>
                  {mrpPrice > currentRent && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 line-through">
                        ₹{mrpPrice.toLocaleString("en-IN")}
                      </span>
                      {discPercent > 0 && (
                        <span className="font-bold text-[#166634]">
                          {discPercent}% OFF
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="flex items-center rounded-lg border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-50"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-gray-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-2 text-[11px] font-medium text-emerald-700">
                Security Deposit:{" "}
                <strong>
                  {currentDeposit > 0 ? `₹${currentDeposit.toLocaleString("en-IN")}` : "₹0 (Zero Deposit with quick KYC)"}
                </strong>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#166634] py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-[#12532a]"
              >
                <MessageCircle size={17} />
                <span>Rent Instantly on WhatsApp</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-800 transition hover:border-[#4a36b3] hover:bg-[#f0eaff] hover:text-[#4a36b3]"
                >
                  <ShoppingBag size={15} />
                  <span>Add to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={handleFullDetails}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                >
                  <span>Full Details</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
