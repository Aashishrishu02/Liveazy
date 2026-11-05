import React, { useState, useEffect, useMemo } from "react";
import { Star, Heart, Plus, Check, Share2, Images } from "lucide-react";
import type { Product } from "../types/rental";
import { isInWishlist, toggleWishlist, subscribeWishlist } from "../utils/wishlist";
import { shareProduct } from "../utils/share";

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onQuickView?: (product: Product, defaultTenure?: number) => void;
  onRentNow?: (product: Product, tenure?: number) => void;
  onAddToCart?: (product: Product, tenure: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onQuickView,
  onAddToCart,
}) => {
  const [selectedTenure, setSelectedTenure] = useState<number>(12);
  const [justAdded, setJustAdded] = useState(false);
  const [localWishlisted, setLocalWishlisted] = useState<boolean>(() =>
    Boolean(isWishlisted || (product?.id && isInWishlist(product.id)))
  );
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Extract all unique images available for this product
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (product.image) list.push(product.image);
    const extra = (product as unknown as { images?: Array<{ imageUrl?: string; url?: string } | string> }).images;
    if (Array.isArray(extra)) {
      for (const item of extra) {
        const url = typeof item === "string" ? item : item?.imageUrl || item?.url;
        if (url && !list.includes(url)) {
          list.push(url);
        }
      }
    }
    return list;
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Keep local wishlist in sync and subscribe to live changes across all components
  useEffect(() => {
    if (product?.id) {
      setLocalWishlisted(isInWishlist(product.id));
    }
    const unsub = subscribeWishlist((ids) => {
      if (product?.id) {
        setLocalWishlisted(ids.includes(String(product.id).trim()));
      }
    });
    return unsub;
  }, [product?.id, isWishlisted]);

  // Clean product name of cuid artifact if present
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

  // Use actual database tenure rent if available
  const pRecord = product as unknown as {
    rent3M?: number | null;
    rent6M?: number | null;
    rent12M?: number | null;
    price?: number | null;
  };

  const baseMonthly = Number(pRecord.rent12M || product.monthlyPrice || 499);
  const currentRent = (() => {
    if (selectedTenure === 3 && pRecord.rent3M && pRecord.rent3M > 0) return pRecord.rent3M;
    if (selectedTenure === 6 && pRecord.rent6M && pRecord.rent6M > 0) return pRecord.rent6M;
    if (selectedTenure === 12 && pRecord.rent12M && pRecord.rent12M > 0) return pRecord.rent12M;
    // Fallback formula based on 12M rent
    if (selectedTenure === 3) return Math.round(baseMonthly * 1.25);
    if (selectedTenure === 6) return Math.round(baseMonthly * 1.12);
    return baseMonthly;
  })();

  const mrpPrice = Number(product.originalPrice || Math.round(currentRent * 1.5));
  const discPercent =
    mrpPrice > currentRent
      ? Math.round(((mrpPrice - currentRent) / mrpPrice) * 100)
      : 15;

  const handleCardClick = () => {
    onQuickView?.(product, selectedTenure);
  };

  const handleTenureClick = (e: React.MouseEvent, tenure: number) => {
    e.stopPropagation();
    setSelectedTenure(tenure);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product, selectedTenure);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product?.id) {
      const newState = toggleWishlist(product.id);
      setLocalWishlisted(newState);
      setShareToast(newState ? "Added to wishlist!" : "Removed from wishlist");
      setTimeout(() => setShareToast(null), 2000);
      onToggleWishlist?.(product);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product) return;
    const res = await shareProduct({
      id: product.id,
      name: productName,
      price: currentRent,
      image: currentImage,
    });
    setShareToast(res.message);
    setTimeout(() => setShareToast(null), 2000);
  };

  const currentImage = allImages[activeImageIndex] || product.image;

  return (
    <article
      onClick={handleCardClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-[#007C8A]/30 hover:shadow-xl hover:shadow-[#007C8A]/10 cursor-pointer"
    >
      {/* Media / Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F8FA]">
        {currentImage ? (
          <img
            src={currentImage}
            alt={productName}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Image unavailable
          </div>
        )}

        {/* Badge (Discount / Trending) */}
        {discPercent > 0 && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-[#e8f8f0] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-[#166634] shadow-xs">
            {discPercent}% OFF
          </span>
        )}

        {/* Floating Toast Notification */}
        {shareToast && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 rounded-full bg-[#002B62]/90 px-3 py-1 text-[10px] font-semibold text-white shadow-md backdrop-blur-xs">
            {shareToast}
          </div>
        )}

        {/* Multi-image Count Indicator */}
        {allImages.length > 1 && (
          <span className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
            <Images size={11} />
            <span>
              {activeImageIndex + 1}/{allImages.length}
            </span>
          </span>
        )}

        {/* Top Right Actions: Wishlist Heart & Share */}
        <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            aria-label={localWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={localWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={handleWishlistClick}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-xs backdrop-blur-xs transition hover:scale-110 hover:bg-white ${
              localWishlisted ? "text-rose-500" : "text-gray-400 hover:text-rose-500"
            }`}
          >
            <Heart
              size={15}
              className={localWishlisted ? "fill-rose-500 text-rose-500" : ""}
            />
          </button>

          <button
            type="button"
            aria-label="Share product"
            title="Share product"
            onClick={handleShareClick}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-xs backdrop-blur-xs transition hover:scale-110 hover:bg-white hover:text-[#007C8A]"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {/* Multiple Images Thumbnail Strip directly below card image */}
      {allImages.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F8FA] border-b border-gray-100 overflow-x-auto no-scrollbar"
        >
          {allImages.slice(0, 5).map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Switch to photo ${idx + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex(idx);
              }}
              className={`relative h-7 w-7 sm:h-8 sm:w-8 shrink-0 overflow-hidden rounded-md border transition ${
                activeImageIndex === idx
                  ? "border-[#007C8A] ring-2 ring-[#007C8A]/30 scale-105"
                  : "border-gray-200 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={imgUrl}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
          {allImages.length > 5 && (
            <span className="text-[10px] font-bold text-gray-400 pl-0.5">
              +{allImages.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {/* Title */}
        <h3 className="line-clamp-2 h-10 text-[13px] sm:text-[14.5px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-[#007C8A]">
          {productName}
        </h3>

        {/* Rating & Category */}
        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-gray-900">4.8</span>
          </div>
          <span className="text-[11px] text-[#007C8A] font-medium truncate max-w-[120px]">
            {product.category}
          </span>
        </div>

        {/* Tenure Switcher Pills */}
        <div className="my-2.5 flex items-center gap-1 rounded-md bg-[#f4f4f5] p-1">
          {[3, 6, 12].map((t) => (
            <button
              key={t}
              type="button"
              onClick={(e) => handleTenureClick(e, t)}
              className={`flex-1 rounded py-1 text-center text-[10.5px] font-bold transition ${
                selectedTenure === t
                  ? "bg-white text-[#002B62] shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t} {t === 12 ? "M+" : "M"}
            </button>
          ))}
        </div>

        {/* Price Row */}
        <div className="mt-auto flex items-center justify-between border-t border-dashed border-gray-100 pt-2.5">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold text-gray-900">
                ₹{currentRent.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] font-medium text-gray-400">/mo</span>
            </div>
            {mrpPrice > currentRent && (
              <div className="flex items-center gap-1.5 text-[10.5px]">
                <span className="text-gray-400 line-through">
                  ₹{mrpPrice.toLocaleString("en-IN")}
                </span>
                <span className="font-semibold text-[#166634]">
                  {discPercent}% off
                </span>
              </div>
            )}
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={handleAddClick}
            aria-label="Add to cart"
            className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border transition ${
              justAdded
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-[#CBDCE6] bg-[#E6F5F7] text-[#002B62] hover:border-[#007C8A] hover:bg-[#007C8A] hover:text-white hover:scale-105"
            }`}
          >
            {justAdded ? (
              <Check size={16} />
            ) : (
              <Plus size={16} className="stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
