import React from 'react';
import { Star, Heart, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types/rental';

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onRentNow: (product: Product) => void;
  onDetails?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onRentNow,
  onDetails,
}) => {
  const navigate = useNavigate();
  const productName = (() => {
    const original = String(product.name ?? "").trim();
    const id = String(product.id ?? "").trim();
    let cleaned = id && original.toLowerCase().endsWith(id.toLowerCase())
      ? original.slice(0, -id.length).trim()
      : original;
    cleaned = cleaned.replace(/c[a-z0-9]{24}$/i, "").trim();
    return cleaned || original;
  })();

  const openDetails = () => {
    if (onDetails) {
      onDetails(product);
      return;
    }
    navigate(`/product/${encodeURIComponent(product.id)}`);
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
        {product.image ? (
          <img
            src={product.image}
            alt={productName}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Image unavailable
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-gray-100 bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-800 shadow-sm backdrop-blur-sm">
            {product.category}
          </span>
          {product.tag && (
            <span className="rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
              {product.tag}
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          onClick={(event) => {
            event.stopPropagation();
            onToggleWishlist?.(product);
          }}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
            isWishlisted
              ? 'scale-105 bg-rose-50 text-rose-500 shadow-md'
              : 'bg-white/90 text-gray-500 shadow-sm hover:scale-110 hover:bg-white hover:text-orange-500'
          }`}
        >
          <Heart
            size={18}
            className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs">
          <div className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{Number(product.rating ?? 0).toFixed(1)}</span>
          </div>
          <span className="text-[11px] text-gray-400">
            ({product.reviewsCount ?? 0} reviews)
          </span>
          <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <CheckCircle2 size={11} /> Listed
          </span>
        </div>

        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-orange-600 sm:text-base">
          {productName}
        </h3>

        {product.specs && product.specs.length > 0 && (
          <p className="mt-1 truncate text-[11px] text-gray-500">
            {product.specs.slice(0, 2).join(' • ')}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-gray-100 pt-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-gray-950 sm:text-xl">
                ₹{Number(product.monthlyPrice ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-gray-400">/mo</span>
            </div>
            {product.originalPrice != null && product.originalPrice > 0 && (
              <span className="text-[11px] text-gray-400 line-through">
                ₹{Number(product.originalPrice).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={openDetails}
            className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-bold text-slate-800 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
          >
            Details <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={() => onRentNow(product)}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-2 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md active:scale-95"
          >
            Rent Now <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
