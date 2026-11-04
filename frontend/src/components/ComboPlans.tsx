import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Package,
  Heart,
  Camera,
  Plus,
  Check,
} from "lucide-react";
import type { Product } from "../types/rental";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";
import { isInWishlist, toggleWishlist, subscribeWishlist } from "../utils/wishlist";

interface ComboPlansProps {
  onQuickView?: (product: Product, defaultTenure?: number) => void;
  onAddToCart?: (product: Product, tenure: number) => void;
  onSelectCategory?: (category: string) => void;
}

interface ComboProductItem {
  id: string;
  productId: string;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string | null;
    rent12M?: number | null;
    rent6M?: number | null;
    rent3M?: number | null;
    deposit12M?: number | null;
    rating?: number | null;
    reviewsCount?: number | null;
    category?: { name?: string } | string | null;
  };
}

interface ComboOffer {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  originalPrice: number;
  specialPrice: number;
  discountPercent?: number | null;
  isActive: boolean;
  sortOrder: number;
  validUntil?: string | null;
  products: ComboProductItem[];
}

const TENURES = [
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "9M", months: 9 },
  { label: "12M+", months: 12 },
];

export const ComboPlans: React.FC<ComboPlansProps> = ({ onQuickView, onAddToCart }) => {
  const navigate = useNavigate();
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteWhatsApp, setSiteWhatsApp] = useState("917061460429");
  const [tenureState, setTenureState] = useState<Record<string, number>>({});
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("liveazy_wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [addedComboId, setAddedComboId] = useState<string | null>(null);

  // Subscribe to live wishlist changes
  useEffect(() => {
    const unsubscribe = subscribeWishlist((ids) => {
      setWishlistIds(ids);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function loadCombos() {
      try {
        setLoading(true);
        const [combosRes, socialRes] = await Promise.all([
          fetchJsonDeduplicated<unknown>(`${apiBase}/combos/public`),
          fetchJsonDeduplicated<{ whatsappNumber?: string }>(`${apiBase}/settings/social`).catch(() => null),
        ]);

        if (!cancelled && socialRes?.whatsappNumber) {
          setSiteWhatsApp(socialRes.whatsappNumber.replace(/[^0-9]/g, ""));
        }

        let list: ComboOffer[] = [];
        if (Array.isArray(combosRes)) {
          list = combosRes as ComboOffer[];
        } else if (
          combosRes &&
          typeof combosRes === "object" &&
          "data" in combosRes &&
          Array.isArray((combosRes as { data: unknown }).data)
        ) {
          list = (combosRes as { data: ComboOffer[] }).data;
        }

        if (!cancelled) {
          const activeCombos = list
            .filter((c) => c.isActive !== false)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setCombos(activeCombos);
        }
      } catch (e) {
        console.warn("Could not load combos from database:", e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCombos();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleWishlist = (e: React.MouseEvent, comboId: string) => {
    e.stopPropagation();
    toggleWishlist(comboId);
  };

  const handleTenureChange = (comboId: string, months: number) => {
    setTenureState((prev) => ({ ...prev, [comboId]: months }));
  };

  const handleProductClick = (
    e: React.MouseEvent,
    prod: ComboProductItem["product"]
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (!prod || !prod.id) return;

    const categoryName =
      typeof prod.category === "object" && prod.category
        ? prod.category.name || "Furniture"
        : typeof prod.category === "string"
        ? prod.category
        : "Furniture";

    const validCategory = (
      [
        "Furniture",
        "Appliances",
        "Electronics",
        "Bikes",
        "Cameras",
        "Gaming",
        "Home & Living",
      ].includes(categoryName)
        ? categoryName
        : "Furniture"
    ) as Product["category"];

    const monthlyPrice = Number(prod.rent12M || prod.price || 499);
    const originalPrice = Math.round(monthlyPrice * 1.3);

    const fullProduct: Product = {
      id: prod.id,
      name: prod.name,
      category: validCategory,
      monthlyPrice,
      originalPrice,
      rating: prod.rating || 5,
      reviewsCount: prod.reviewsCount || 1,
      image: prod.image || "",
      images: prod.image ? [prod.image] : [],
      deposit: Number(prod.deposit12M || 0),
      availableTenures: [3, 6, 9, 12],
      specs: [prod.name],
      rent3M: prod.rent3M,
      rent6M: prod.rent6M,
      rent12M: prod.rent12M,
      deposit12M: prod.deposit12M,
    };

    if (onQuickView) {
      onQuickView(fullProduct, 12);
    } else {
      navigate(`/product/${prod.id}`);
    }
  };

  /**
   * Calculate rental price for selected tenure strictly from existing product data.
   * If products have tenure pricing (rent3M, rent6M, rent12M), compute exact bundled rent.
   * Otherwise retain combo.specialPrice without inventing numbers.
   */
  const getTenurePricing = (combo: ComboOffer, tenureMonths: number) => {
    const products = combo.products?.map((p) => p.product).filter(Boolean) || [];

    // Check if products have rent for this tenure
    let tenureSum = 0;
    let allHaveTenure = products.length > 0;

    for (const prod of products) {
      let r: number | null | undefined = null;
      if (tenureMonths === 3) r = prod.rent3M;
      else if (tenureMonths === 6) r = prod.rent6M;
      else if (tenureMonths === 12) r = prod.rent12M ?? prod.price;
      else if (tenureMonths === 9) r = prod.rent6M ?? prod.rent12M ?? prod.price;

      if (typeof r === "number" && r > 0) {
        tenureSum += r;
      } else {
        allHaveTenure = false;
        break;
      }
    }

    if (allHaveTenure && tenureSum > 0) {
      const discount = combo.discountPercent && combo.discountPercent > 0 ? combo.discountPercent : 0;
      const special = discount > 0 ? Math.round(tenureSum * (1 - discount / 100)) : tenureSum;
      return {
        specialPrice: special,
        originalPrice: tenureSum,
        discountPercent: discount,
      };
    }

    // Default to stored combo prices
    return {
      specialPrice: combo.specialPrice,
      originalPrice: combo.originalPrice,
      discountPercent: combo.discountPercent ?? (
        combo.originalPrice > combo.specialPrice
          ? Math.round(((combo.originalPrice - combo.specialPrice) / combo.originalPrice) * 100)
          : 0
      ),
    };
  };

  const handleWhatsAppInquiry = (combo: ComboOffer, tenureMonths: number) => {
    const pricing = getTenurePricing(combo, tenureMonths);
    const tenureLabel = tenureMonths === 12 ? "12M+" : `${tenureMonths} Months`;
    const prods = combo.products.map((p) => `• ${p.product?.name || "Premium Item"}`).join("\n");

    const message = `Hello LIVEAZY! I am interested in renting the combo plan:\n*${combo.title}*\n• Duration: ${tenureLabel}\n• Monthly Rent: ₹${pricing.specialPrice.toLocaleString()}/mo${
      pricing.originalPrice > pricing.specialPrice ? ` (Original: ₹${pricing.originalPrice.toLocaleString()})` : ""
    }\n• Included Items:\n${prods}\n\nPlease share booking availability for my city!`;

    const waUrl = `https://wa.me/${siteWhatsApp}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleAddCombo = (combo: ComboOffer, tenureMonths: number) => {
    const pricing = getTenurePricing(combo, tenureMonths);
    // If onAddToCart is available, add the primary product with tenure
    const primary = combo.products?.[0]?.product;
    if (primary && onAddToCart) {
      const rentalProduct: Product = {
        id: combo.id,
        name: combo.title,
        category: "Furniture",
        monthlyPrice: pricing.specialPrice,
        originalPrice: pricing.originalPrice,
        rating: 5,
        reviewsCount: 1,
        image: combo.image || primary.image || "",
        deposit: 0,
        availableTenures: [3, 6, 9, 12],
        specs: combo.products.map((p) => p.product.name),
      };
      onAddToCart(rentalProduct, tenureMonths);
      setAddedComboId(combo.id);
      setTimeout(() => setAddedComboId(null), 2000);
    } else {
      handleWhatsAppInquiry(combo, tenureMonths);
    }
  };

  // Helper to determine the offer badge for each combo card
  const getBadgeStyle = (combo: ComboOffer, index: number) => {
    if (combo.discountPercent && combo.discountPercent > 0) {
      return {
        text: `${combo.discountPercent}% OFF`,
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black",
      };
    }

    const badgeRotation = [
      { text: "NEW", className: "bg-sky-50 text-sky-700 border border-sky-200/80 font-black" },
      { text: "POPULAR", className: "bg-amber-50 text-amber-800 border border-amber-200/80 font-black" },
      { text: "BEST SELLER", className: "bg-orange-50 text-orange-800 border border-orange-200/80 font-black" },
      { text: "VALUE COMBO", className: "bg-purple-50 text-purple-700 border border-purple-200/80 font-black" },
    ];

    return badgeRotation[index % badgeRotation.length];
  };

  if (!loading && combos.length === 0) {
    return null;
  }

  return (
    <section
      id="combos"
      aria-label="Combo Plans"
      className="py-10 sm:py-14 bg-white border-t border-gray-100 scroll-mt-24"
    >
      <div className="ref-container">
        {/* 1. Header Section matching Smart One reference */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Combo plans
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Curated full room and home setups — complete styling with unbeatable bundle discounts
            </p>
          </div>

          <a
            href="#trending"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#4a36b3] hover:underline shrink-0 group"
          >
            <span>See all combos</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* 2. Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-gray-100 bg-white p-3.5 shadow-xs animate-pulse"
              >
                <div className="aspect-[4/3] rounded-2xl bg-gray-100 mb-3.5" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-7 bg-gray-100 rounded-xl mb-4" />
                <div className="h-8 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* 3. Four Combo Cards Per Row Desktop Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {combos.map((combo, index) => {
              const selectedTenure = tenureState[combo.id] || 12;
              const pricing = getTenurePricing(combo, selectedTenure);
              const badge = getBadgeStyle(combo, index);
              const isFav = wishlistIds.includes(combo.id) || isInWishlist(combo.id);

              // Calculate total photo count (bundle image + product images)
              const photoCount = Math.max(
                (combo.image ? 1 : 0) +
                  (combo.products?.filter((p) => Boolean(p.product?.image)).length || 0),
                combo.products?.length || 1
              );

              // Extract real rating data if available on any product
              const ratedProduct = combo.products?.find(
                (p) => typeof p.product?.rating === "number" && p.product.rating > 0
              )?.product;

              // Generate included items text
              const productNames = combo.products
                ?.map((p) => p.product?.name)
                .filter(Boolean)
                .join(" + ");

              return (
                <div
                  key={combo.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-3 sm:p-3.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#4a36b3]/30 hover:shadow-xl hover:shadow-[#4a36b3]/8"
                >
                  <div>
                    {/* Top Image Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-50 border border-gray-100">
                      {combo.image ? (
                        <img
                          src={combo.image}
                          alt={combo.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                          <Package size={44} strokeWidth={1.5} />
                        </div>
                      )}

                      {/* Offer badge top-left */}
                      <span
                        className={`absolute top-2.5 left-2.5 rounded-lg px-2.5 py-1 text-[10px] tracking-wider uppercase shadow-xs backdrop-blur-xs ${badge.className}`}
                      >
                        {badge.text}
                      </span>

                      {/* Wishlist Heart top-right */}
                      <button
                        type="button"
                        aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
                        onClick={(e) => handleToggleWishlist(e, combo.id)}
                        className={`absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 backdrop-blur-xs shadow-xs transition hover:scale-110 ${
                          isFav ? "text-red-500" : "text-gray-400 hover:text-red-500"
                        }`}
                      >
                        <Heart
                          size={15}
                          className={isFav ? "fill-red-500 text-red-500" : "stroke-[2.2]"}
                        />
                      </button>

                      {/* Photo Count badge bottom-left */}
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                        <Camera size={11} className="stroke-[2.5]" />
                        <span>{photoCount} Photos</span>
                      </div>
                    </div>

                    {/* Middle Info */}
                    <div className="mt-3 space-y-1">
                      <h3
                        className="text-sm sm:text-[14.5px] font-bold text-gray-900 group-hover:text-[#4a36b3] transition line-clamp-1 leading-snug"
                        title={combo.title}
                      >
                        {combo.title}
                      </h3>

                      {/* Rating & Review (Strictly real data only) */}
                      {ratedProduct?.rating && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold pt-0.5">
                          <span>★ {ratedProduct.rating.toFixed(1)}</span>
                          {ratedProduct.reviewsCount && (
                            <span className="text-gray-400 font-normal">
                              ({ratedProduct.reviewsCount})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Included Items Text */}
                      {combo.products && combo.products.length > 0 && (
                        <p
                          className="text-xs font-semibold text-[#4a36b3] truncate pt-0.5"
                          title={productNames}
                        >
                          {combo.products.length} items included ({productNames})
                        </p>
                      )}

                      {/* Included Products Thumbnails Row */}
                      {combo.products && combo.products.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                          {combo.products.map((item) => {
                            const p = item.product;
                            if (!p) return null;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                title={`View details for ${p.name}`}
                                aria-label={`View details for ${p.name}`}
                                onClick={(e) => handleProductClick(e, p)}
                                className="group/thumb relative h-9 w-9 rounded-xl border border-gray-200 bg-white p-0.5 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs transition-all duration-200 hover:scale-110 hover:border-[#4a36b3] hover:shadow-md hover:ring-2 hover:ring-[#4a36b3]/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4a36b3]"
                              >
                                {p.image ? (
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="h-full w-full object-cover rounded-lg transition group-hover/thumb:opacity-90"
                                  />
                                ) : (
                                  <Package size={14} className="text-gray-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Tenure selector, Pricing & Add Action */}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                    {/* Duration Selector Segmented Bar */}
                    <div className="grid grid-cols-4 gap-1 rounded-xl bg-gray-100/80 p-1">
                      {TENURES.map((t) => {
                        const isSelected = selectedTenure === t.months;
                        return (
                          <button
                            key={t.months}
                            type="button"
                            onClick={() => handleTenureChange(combo.id, t.months)}
                            className={`rounded-lg py-1 text-center text-[11px] transition cursor-pointer ${
                              isSelected
                                ? "bg-white text-[#4a36b3] font-black shadow-xs"
                                : "text-gray-600 font-semibold hover:text-gray-900"
                            }`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Price & Action Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                            ₹{pricing.specialPrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 font-normal">/mo</span>
                        </div>

                        {/* Strikethrough original price & discount */}
                        <div className="flex items-center gap-1.5 text-[11px] leading-tight">
                          {pricing.originalPrice > pricing.specialPrice && (
                            <span className="text-gray-400 line-through">
                              ₹{pricing.originalPrice.toLocaleString()}
                            </span>
                          )}
                          {pricing.discountPercent > 0 && (
                            <span className="font-bold text-emerald-600">
                              {pricing.discountPercent}% off
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        aria-label="Add Combo Plan"
                        onClick={() => handleAddCombo(combo, selectedTenure)}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition shadow-xs cursor-pointer ${
                          addedComboId === combo.id
                            ? "bg-emerald-600 text-white"
                            : "bg-[#f0eaff] text-[#4a36b3] hover:bg-[#4a36b3] hover:text-white"
                        }`}
                        title="Book / Add Combo"
                      >
                        {addedComboId === combo.id ? (
                          <Check size={16} strokeWidth={2.5} />
                        ) : (
                          <Plus size={18} strokeWidth={2.2} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ComboPlans;
