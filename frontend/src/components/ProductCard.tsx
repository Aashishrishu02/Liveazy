import React from 'react';
import { Star, Heart, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Product } from '../types/rental';

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onRentNow: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onRentNow,
}) => {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/8">
      {/* CARD TOP / IMAGE */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-50">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* OVERLAY GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

        {/* TOP BADGES */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 z-10">
          <span className="rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-800 shadow-xs border border-gray-100">
            {product.category}
          </span>
          {product.tag && (
            <span className="rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
              {product.tag}
            </span>
          )}
        </div>

        {/* WISHLIST BUTTON */}
        <button
          type="button"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) onToggleWishlist(product);
          }}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
            isWishlisted
              ? 'bg-rose-50 text-rose-500 shadow-md scale-105'
              : 'bg-white/90 text-gray-500 hover:bg-white hover:text-orange-500 hover:scale-110 shadow-sm'
          }`}
        >
          <Heart
            size={18}
            className={`transition-colors ${
              isWishlisted ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        </button>

        {/* DEPOSIT BADGE */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-2xs">
          <ShieldCheck size={12} className="text-emerald-600" />
          <span>₹0 Security Deposit</span>
        </div>
      </div>

      {/* CARD BODY */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* RATING */}
        <div className="mb-1.5 flex items-center gap-1.5 text-xs">
          <div className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
          <span className="text-[11px] text-gray-400">
            ({product.reviewsCount} reviews)
          </span>
          <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <CheckCircle2 size={11} /> Verified
          </span>
        </div>

        {/* TITLE */}
        <h3 className="line-clamp-2 text-sm sm:text-base font-bold text-gray-900 leading-snug group-hover:text-orange-600 transition-colors">
          {product.name}
        </h3>

        {/* SPECS BULLETS (PREVIEW) */}
        {product.specs && product.specs.length > 0 && (
          <p className="mt-1 text-[11px] text-gray-500 truncate">
            {product.specs.slice(0, 2).join(' • ')}
          </p>
        )}

        {/* DIVIDER & PRICING */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-gray-950">
                ₹{product.monthlyPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-gray-400">
                /mo
              </span>
            </div>
            {product.originalPrice && (
              <span className="text-[11px] text-gray-400 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* RENT NOW CTA */}
          <button
            type="button"
            onClick={() => onRentNow(product)}
            className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/25 active:scale-95"
          >
            <span>Rent Now</span>
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;