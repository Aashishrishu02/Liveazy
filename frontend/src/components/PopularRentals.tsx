import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Heart,
  Filter,
  MessageCircle,
  PackageOpen,
  Search,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { Product } from "../types/rental";
import { useNavigate } from "react-router-dom";
import { fetchJsonDeduplicated } from "../utils/api";
const API_URL = import.meta.env.VITE_API_URL;
type RentalDuration = "12M" | "6M" | "3M";
interface BackendProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
  };
  rent12M?: number | null;
  deposit12M?: number | null;
  rent6M?: number | null;
  deposit6M?: number | null;
  rent3M?: number | null;
  deposit3M?: number | null;
}
interface RentalPlan {
  duration: RentalDuration;
  label: string;
  rent: number | null;
  deposit: number | null;
}
interface PopularRentalsProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchFilter?: string;
  onClearSearch?: () => void;
  wishlistIds: Set<string>;
  onToggleWishlist: (product: Product) => void;
  onRentNow: (product: Product) => void;
}
const formatPrice = (amount: number) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

/**
 * Detects the old hardcoded message that appended product details automatically.
 * It must not be sent after switching to the admin-managed message template.
 */
const isLegacyGeneratedWhatsAppMessage = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("i want to rent this product:") &&
    normalized.includes("product name:") &&
    normalized.includes("product id:") &&
    normalized.includes("rental duration:") &&
    normalized.includes("monthly rent:") &&
    normalized.includes("refundable deposit:")
  );
};

/** Escape a string so it can safely be used inside a regular expression. */
const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Clean a product name when a CUID was accidentally saved at the end of it.
 * First remove the exact current product ID; then handle a trailing Prisma CUID
 * even if the data has a mismatched/stale ID in one of the API fields.
 */
const getCleanProductName = (name: unknown, productId: unknown): string => {
  const originalName = String(name ?? "").trim();
  const id = String(productId ?? "").trim();
  let cleanedName = originalName;

  if (id && cleanedName.toLowerCase().endsWith(id.toLowerCase())) {
    cleanedName = cleanedName.slice(0, -id.length).trim();
  }

  // Prisma CUIDs in this project are 25 characters (c + 24 alphanumeric chars).
  cleanedName = cleanedName.replace(/c[a-z0-9]{24}$/i, "").trim();

  return cleanedName || originalName;
};
const getRentalPlans = (product: BackendProduct): RentalPlan[] => [
  {
    duration: "12M",
    label: "12 Months",
    rent: product.rent12M ?? null,
    deposit: product.deposit12M ?? null,
  },
  {
    duration: "6M",
    label: "6 Months",
    rent: product.rent6M ?? null,
    deposit: product.deposit6M ?? null,
  },
  {
    duration: "3M",
    label: "3 Months",
    rent: product.rent3M ?? null,
    deposit: product.deposit3M ?? null,
  },
];
const getDefaultPlan = (product: BackendProduct): RentalDuration => {
  const plans = getRentalPlans(product);
  const availablePlan = plans.find(
    (plan) => plan.rent !== null && Number.isFinite(Number(plan.rent))
      && Number(plan.rent) >= 0
  );
  return availablePlan?.duration ?? "12M";
};

// Keep this helper at module scope because filteredProducts uses it in useMemo.
const isPlanAvailable = (plan: RentalPlan) =>
  plan.rent !== null &&
  Number.isFinite(Number(plan.rent)) &&
  Number(plan.rent) >= 0;
const PopularRentals: React.FC<PopularRentalsProps> = ({
  selectedCategory,
  onSelectCategory,
  searchFilter = "",
  onClearSearch,
  wishlistIds,
  onToggleWishlist,
}) => {
  const navigate = useNavigate();
  const [backendProducts, setBackendProducts] = useState<BackendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [selectedPlans, setSelectedPlans] = useState<
    Record<string, RentalDuration>
  >({});
  const [budgetFilter, setBudgetFilter] = useState<
    "all" | "under500" | "500to1000" | "1000to2000" | "over2000"
  >("all");
  const [tenureFilter, setTenureFilter] = useState<RentalDuration | "all">("all");
  const [sortOrder, setSortOrder] = useState<
    "recommended" | "price-low" | "price-high" | "name"
  >("recommended");

  const categoryOptions = useMemo<string[]>(() => {
    const names = backendProducts
      .map((product) => product.category?.name?.trim())
      .filter((name): name is string => typeof name === "string" && name.length > 0);

    return Array.from(new Set<string>(names)).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [backendProducts]);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchJsonDeduplicated<BackendProduct[]>(
          `${API_URL}/products`,
          { signal: controller.signal }
        );
        if (cancelled) return;
        const activeProducts = Array.isArray(data)
          ? data.filter((product) => product.isActive)
          : [];
        setBackendProducts(activeProducts);
        setSelectedPlans((previous) => {
          const updated = { ...previous };
          activeProducts.forEach((product) => {
            if (!updated[product.id]) {
              updated[product.id] = getDefaultPlan(product);
            }
          });
          return updated;
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Error fetching products:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void fetchProducts();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchWhatsAppSettings = async () => {
      try {
        const data = await fetchJsonDeduplicated<{
          whatsappNumber?: string;
          whatsappMessage?: string;
        }>(`${API_URL}/settings/whatsapp`, { signal: controller.signal });
        if (cancelled) return;
        if (data?.whatsappNumber) {
          setWhatsappNumber(
            String(data.whatsappNumber).replace(/\D/g, "")
          );
        }
        // No default message: use exactly what the admin saved.
        setWhatsappMessage(
          typeof data?.whatsappMessage === "string"
            ? data.whatsappMessage
            : ""
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Error fetching WhatsApp settings:", error);
      }
    };
    void fetchWhatsAppSettings();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);
  const filteredProducts = useMemo(() => {
    const isWithinBudget = (rent: number) => {
      if (!Number.isFinite(rent)) return false;
      switch (budgetFilter) {
        case "under500":
          return rent < 500;
        case "500to1000":
          return rent >= 500 && rent < 1000;
        case "1000to2000":
          return rent >= 1000 && rent <= 2000;
        case "over2000":
          return rent > 2000;
        default:
          return true;
      }
    };

    const filtered = backendProducts.filter((product) => {
      const categoryMatch =
        selectedCategory === "All" ||
        product.category?.name === selectedCategory;
      const searchText = searchFilter.toLowerCase().trim();
      const cleanName = getCleanProductName(product.name, product.id).toLowerCase();
      const searchMatch =
        !searchText ||
        cleanName.includes(searchText) ||
        product.description?.toLowerCase().includes(searchText) ||
        product.category?.name?.toLowerCase().includes(searchText);

      const productPlans = getRentalPlans(product);
      const availablePlans = productPlans.filter(isPlanAvailable);
      const planForTenure =
        tenureFilter === "all"
          ? undefined
          : productPlans.find((plan) => plan.duration === tenureFilter);

      // Tenure and budget filters are independent of the card's selected plan.
      // Clicking 3M/6M/12M on a card must never make that card disappear.
      const tenureMatch =
        tenureFilter === "all" ||
        Boolean(planForTenure && isPlanAvailable(planForTenure));

      const budgetMatch =
        budgetFilter === "all" ||
        (tenureFilter !== "all"
          ? Boolean(
              planForTenure &&
                isPlanAvailable(planForTenure) &&
                isWithinBudget(Number(planForTenure.rent)),
            )
          : availablePlans.some((plan) => isWithinBudget(Number(plan.rent))));

      return categoryMatch && searchMatch && tenureMatch && budgetMatch;
    });

    if (sortOrder === "name") {
      filtered.sort((a, b) =>
        getCleanProductName(a.name, a.id).localeCompare(
          getCleanProductName(b.name, b.id),
        ),
      );
    } else if (sortOrder === "price-low" || sortOrder === "price-high") {
      filtered.sort((a, b) => {
        const rentFor = (product: BackendProduct) => {
          const productPlans = getRentalPlans(product);
          const duration = tenureFilter !== "all" ? tenureFilter : getDefaultPlan(product);
          const plan = productPlans.find((item) => item.duration === duration);
          return plan?.rent == null ? Number.POSITIVE_INFINITY : Number(plan.rent);
        };
        const difference = rentFor(a) - rentFor(b);
        return sortOrder === "price-low" ? difference : -difference;
      });
    }

    return filtered;
  }, [
    backendProducts,
    selectedCategory,
    searchFilter,
    budgetFilter,
    tenureFilter,
    sortOrder,
  ]);

  const clearAllFilters = () => {
    onSelectCategory("All");
    onClearSearch?.();
    setBudgetFilter("all");
    setTenureFilter("all");
    setSortOrder("recommended");
  };

  const updateSelectedPlan = (
    productId: string,
    duration: RentalDuration
  ) => {
    setSelectedPlans((previous) => ({
      ...previous,
      [productId]: duration,
    }));

    // If a customer manually chooses a different duration on a card,
    // clear the global tenure filter so the card choice can take effect.
    // The budget/category/search filters remain active.
    if (tenureFilter !== "all" && tenureFilter !== duration) {
      setTenureFilter("all");
    }
  };

  const getSelectedPlan = (product: BackendProduct): RentalPlan => {
    const plans = getRentalPlans(product);

    // When a sidebar tenure filter is active, synchronise all visible cards
    // to the same tenure so the filter, displayed price, deposit and WhatsApp
    // template all refer to the same plan.
    const selectedDuration =
      tenureFilter !== "all"
        ? tenureFilter
        : selectedPlans[product.id] ?? getDefaultPlan(product);

    const selected = plans.find(
      (plan) => plan.duration === selectedDuration
    );

    return selected ?? plans[0];
  };
  const handleWhatsApp = (
    product: BackendProduct,
    plan: RentalPlan
  ) => {
    if (!whatsappNumber) {
      alert("WhatsApp number is not available. Please try again.");
      return;
    }
    if (!whatsappMessage.trim()) {
      alert("Please add and save a WhatsApp message template in Admin Settings first.");
      return;
    }
    if (isLegacyGeneratedWhatsAppMessage(whatsappMessage)) {
      alert(
        "The saved WhatsApp message is the old fixed format. Open Admin Settings > WhatsApp Settings, write your new template using {productName}, and save it before trying again."
      );
      return;
    }
    if (!isPlanAvailable(plan)) {
      alert("This rental plan is not available. Please select another plan.");
      return;
    }
    const finalNumber =
      whatsappNumber.length === 10
        ? `91${whatsappNumber}`
        : whatsappNumber;
    // The admin's template is the whole message. Replace only placeholders
    // that the admin includes; do not append a second fixed product-details block.
    const amount = (value: number | null | undefined) =>
      value !== null && value !== undefined && Number.isFinite(Number(value))
        ? formatPrice(Number(value))
        : "Not specified";

    // The API can contain a name like "FRIDGEcmv..." if an ID was accidentally
    // added to the product name. Clean it before replacing {productName}.
    const cleanProductName = getCleanProductName(product.name, product.id);

    const replacements: Record<string, string> = {
      productname: cleanProductName,
      productid: product.id,
      categoryname: product.category?.name ?? "Not specified",
      rentalduration: plan.label,
      monthlyrent: amount(plan.rent),
      refundabledeposit: amount(plan.deposit),
    };
    const template = whatsappMessage.trim();

    // Render only placeholders that the admin added to the template.
    let renderedTemplate = template.replace(
      /\{(productName|productId|categoryName|rentalDuration|monthlyRent|refundableDeposit)\}/gi,
      (placeholder, key: string) =>
        replacements[key.toLowerCase()] ?? placeholder,
    );

    // If the admin accidentally put {productId} immediately after {productName},
    // remove that inline duplicate from the name. We add/keep the ID separately.
    // This also protects templates such as "hii {productName}{productId}".
    if (cleanProductName && product.id) {
      const joinedNameAndId = new RegExp(
        `${escapeRegExp(cleanProductName)}\\s*${escapeRegExp(product.id)}`,
        "gi",
      );
      renderedTemplate = renderedTemplate.replace(joinedNameAndId, cleanProductName);
    }

    // Always include one separate Product ID line, without putting the ID
    // directly next to the product name.
    const message = /product\s*id\s*:/i.test(renderedTemplate)
      ? renderedTemplate
      : `${renderedTemplate.trim()}\n\nProduct ID: ${product.id}`;

    const whatsappUrl = `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };
  const getWishlistProduct = (product: BackendProduct): Product =>
    ({
      ...product,
      category: product.category,
    }) as unknown as Product;
  return (
    <section
      id="products"
      className="scroll-mt-24 bg-[#F7F9FC] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="mb-9 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#008A90] sm:text-sm">
              <Sparkles size={16} />
              Your next favourite
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0F2942] sm:text-4xl">
              {selectedCategory === "All"
                ? "Popular Rentals"
                : selectedCategory}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Quality furniture, flexible rental plans, and a home that feels
              like yours.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F2942]">
            <PackageOpen size={17} className="text-[#008A90]" />
            {loading ? "Loading..." : `${filteredProducts.length} products`}
          </div>
        </div>
        {searchFilter && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#008A90]/15 bg-white px-4 py-4 sm:px-5">
            <div className="flex items-center gap-3">
              <Search size={18} className="text-[#008A90]" />
              <p className="text-sm text-slate-600">
                Results for{" "}
                <span className="font-bold text-[#0F2942]">
                  "{searchFilter}"
                </span>
              </p>
            </div>
            {onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="text-sm font-bold text-[#008A90] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white p-3"
              >
                <div className="h-40 rounded-xl bg-slate-100 sm:h-52" />
                <div className="mt-4 h-4 w-3/4 rounded bg-slate-100" />
                <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
                <div className="mt-5 h-10 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        )}
        {!loading && (
          <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
            <aside className="h-fit rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm lg:sticky lg:top-28">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0F2942]">
                  <Filter size={16} className="text-[#008A90]" /> Filters
                </h3>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-[#008A90] hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Category
                </h4>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectCategory("All")}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${selectedCategory === "All" ? "bg-[#E8F7F6] font-bold text-[#007B80]" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    All products <span>{backendProducts.length}</span>
                  </button>
                  {categoryOptions.map((category) => (
                    <button
                      type="button"
                      key={category}
                      onClick={() => onSelectCategory(category)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${selectedCategory === category ? "bg-[#E8F7F6] font-bold text-[#007B80]" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      <span>{category}</span>
                      <span>{backendProducts.filter((item) => item.category?.name === category).length}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Monthly rental budget
                </h4>
                <div className="space-y-2 text-xs text-slate-600">
                  {([
                    ["all", "Any budget"],
                    ["under500", "Under ₹500 / month"],
                    ["500to1000", "₹500–₹1,000 / month"],
                    ["1000to2000", "₹1,000–₹2,000 / month"],
                    ["over2000", "₹2,000+ / month"],
                  ] as const).map(([value, label]) => (
                    <label key={value} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="rental-budget"
                        checked={budgetFilter === value}
                        onChange={() => setBudgetFilter(value)}
                        className="accent-[#008A90]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Rental duration
                </h4>
                <div className="space-y-2 text-xs text-slate-600">
                  {([
                    ["all", "All available tenures"],
                    ["3M", "3 months"],
                    ["6M", "6 months"],
                    ["12M", "12 months"],
                  ] as const).map(([value, label]) => (
                    <label key={value} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="rental-tenure"
                        checked={tenureFilter === value}
                        onChange={() => setTenureFilter(value)}
                        className="accent-[#008A90]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500 sm:text-sm">
                  Showing <strong className="text-[#0F2942]">{filteredProducts.length}</strong> of {backendProducts.length} rental products
                </p>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  Sort by
                  <select
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0F2942] outline-none focus:border-[#008A90]"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </label>
              </div>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                  {filteredProducts.map((product) => {
              const wishlistProduct = getWishlistProduct(product);
              const isWishlisted = wishlistIds.has(product.id);
              const plans = getRentalPlans(product);
              const selectedPlan = getSelectedPlan(product);
              const selectedPlanAvailable = isPlanAvailable(selectedPlan);
              const displayProductName = getCleanProductName(product.name, product.id);
              return (
                <article
                  key={product.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#008A90]/35 hover:shadow-xl hover:shadow-[#0F2942]/[0.07]"
                >
                  <div className="relative flex h-36 items-center justify-center overflow-hidden bg-[#F2F5F8] sm:h-48 lg:h-52">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={displayProductName}
                        loading="lazy"
                        className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105 sm:p-4"
                        onError={(event) => {
                          event.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    ) : (
                      <PackageOpen size={40} className="text-slate-300" />
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#008A90] shadow-sm sm:left-3 sm:top-3 sm:text-[10px]">
                      Available
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleWishlist(wishlistProduct)}
                      aria-label={
                        isWishlisted
                          ? `Remove ${product.name} from wishlist`
                          : `Add ${product.name} to wishlist`
                      }
                      aria-pressed={isWishlisted}
                      className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition sm:right-3 sm:top-3 ${
                        isWishlisted
                          ? "bg-[#FF6A3D] text-white"
                          : "bg-white/95 text-[#0F2942] hover:bg-[#FF6A3D] hover:text-white"
                      }`}
                    >
                      <Heart
                        size={17}
                        fill={isWishlisted ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <p className="mb-1.5 truncate text-[10px] font-bold uppercase tracking-wider text-[#008A90] sm:text-xs">
                      {product.category?.name || "Furniture"}
                    </p>
                    <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#0F2942] transition-colors group-hover:text-[#008A90] sm:text-base">
                      {displayProductName}
                    </h3>
                    {product.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-semibold text-slate-500 sm:text-xs">
                        Choose rental duration
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {plans.map((plan) => {
                          const available = isPlanAvailable(plan);
                          const selected =
                            selectedPlan.duration === plan.duration;
                          return (
                            <button
                              key={plan.duration}
                              type="button"
                              disabled={!available}
                              onClick={() =>
                                updateSelectedPlan(
                                  product.id,
                                  plan.duration
                                )
                              }
                              title={
                                available
                                  ? plan.label
                                  : `${plan.label} pricing not added`
                              }
                              className={`rounded-lg border px-1 py-2 text-[10px] font-bold transition sm:text-xs ${
                                selected
                                  ? "border-[#008A90] bg-[#008A90] text-white"
                                  : available
                                  ? "border-slate-200 bg-white text-[#0F2942] hover:border-[#008A90] hover:text-[#008A90]"
                                  : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                              }`}
                            >
                              {plan.duration}
                            </button>
                          );
                        })}
                      </div>
                      {selectedPlanAvailable ? (
                        <>
                          <div className="mt-3">
                            <p className="text-[10px] font-medium text-slate-500 sm:text-xs">
                              Monthly rent · {selectedPlan.label}
                            </p>
                            <div className="mt-1 flex flex-wrap items-baseline gap-x-1">
                              <span className="text-lg font-extrabold text-[#0F2942] sm:text-xl">
                                {formatPrice(Number(selectedPlan.rent))}
                              </span>
                              <span className="text-[10px] text-slate-500 sm:text-xs">
                                /month
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[#F0F8F8] px-2.5 py-2">
                            <ShieldCheck
                              size={14}
                              className="mt-0.5 shrink-0 text-[#008A90]"
                            />
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-slate-500">
                                Refundable deposit
                              </p>
                              <p className="text-xs font-bold text-[#0F2942]">
                                {selectedPlan.deposit !== null &&
                                Number.isFinite(Number(selectedPlan.deposit))
                                  ? formatPrice(Number(selectedPlan.deposit))
                                  : "Not specified"}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-3">
                          <p className="text-xs font-semibold text-slate-500">
                            Rental pricing not added
                          </p>
                          <p className="mt-1 text-[10px] leading-4 text-slate-400">
                            Please select another duration.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/product/${encodeURIComponent(product.id)}`)}
                        className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#0F2942]/15 bg-white px-2 py-2.5 text-[11px] font-bold text-[#0F2942] transition hover:border-[#008A90] hover:bg-[#F0F8F8] hover:text-[#008A90] sm:text-xs"
                      >
                        Details
                        <ArrowRight size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWhatsApp(product, selectedPlan)}
                        disabled={
                          !whatsappNumber ||
                          !whatsappMessage.trim() ||
                          !selectedPlanAvailable
                        }
                        className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#FF6A3D] px-2 py-2.5 text-[11px] font-bold text-white transition duration-200 hover:bg-[#e9572e] disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
                      >
                        <MessageCircle size={14} />
                        Rent Now
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center sm:px-8 sm:py-16">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0F8F8]">
                    <Search size={28} className="text-[#008A90]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F2942]">
                    No products found
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    No products match these filters. Change the rental duration or budget, or clear the filters to see all available products.
                  </p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#0F2942] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#008A90]"
                  >
                    Show all products
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {!loading && filteredProducts.length > 0 && (
          <p className="mt-8 text-center text-xs text-slate-400">
            Showing {filteredProducts.length} active{" "}
            {filteredProducts.length === 1 ? "product" : "products"}
          </p>
        )}
      </div>
    </section>
  );
};
export default PopularRentals;
