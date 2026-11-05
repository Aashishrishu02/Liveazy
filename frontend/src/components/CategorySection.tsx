import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Layers,
  Bed,
  Armchair,
  Utensils,
  BookOpen,
  Package,
  Tv,
  Flame,
  Percent,
  Tag,
  Gift,
  Zap,
  Award,
  Heart,
} from "lucide-react";
import { getApiBaseUrl, fetchCategoriesDeduplicated } from "../utils/api";

interface CategorySectionProps {
  onSelectCategory?: (categoryId: string, categoryName?: string) => void;
  selectedCategory?: string;
}

interface Category {
  id: string;
  name: string;
  image?: string | null;
  isActive?: boolean;
  displayOrder?: number | null;
}

// Map category name keywords to iconic Lucide visual representations
function getCategoryFallbackIcon(name: string) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("bed") || lower.includes("mattress")) {
    return <Bed size={26} className="stroke-[2]" />;
  }
  if (lower.includes("living") || lower.includes("sofa") || lower.includes("seating")) {
    return <Armchair size={26} className="stroke-[2]" />;
  }
  if (lower.includes("dining") || lower.includes("kitchen") || lower.includes("table")) {
    return <Utensils size={26} className="stroke-[2]" />;
  }
  if (lower.includes("study") || lower.includes("office") || lower.includes("desk")) {
    return <BookOpen size={26} className="stroke-[2]" />;
  }
  if (lower.includes("combo") || lower.includes("package") || lower.includes("plan")) {
    return <Package size={26} className="stroke-[2]" />;
  }
  if (lower.includes("appliance") || lower.includes("electronic") || lower.includes("tv")) {
    return <Tv size={26} className="stroke-[2]" />;
  }
  return <Layers size={26} className="stroke-[2]" />;
}

function renderCustomIcon(iconName?: string | null) {
  switch (iconName?.toLowerCase()) {
    case "flame":
      return <Flame size={26} className="stroke-[2.2]" />;
    case "sparkles":
      return <Sparkles size={26} className="stroke-[2.2]" />;
    case "percent":
      return <Percent size={26} className="stroke-[2.2]" />;
    case "tag":
      return <Tag size={26} className="stroke-[2.2]" />;
    case "gift":
      return <Gift size={26} className="stroke-[2.2]" />;
    case "zap":
      return <Zap size={26} className="stroke-[2.2]" />;
    case "layers":
      return <Layers size={26} className="stroke-[2.2]" />;
    case "armchair":
      return <Armchair size={26} className="stroke-[2.2]" />;
    case "bed":
      return <Bed size={26} className="stroke-[2.2]" />;
    case "utensils":
      return <Utensils size={26} className="stroke-[2.2]" />;
    case "bookopen":
      return <BookOpen size={26} className="stroke-[2.2]" />;
    case "tv":
      return <Tv size={26} className="stroke-[2.2]" />;
    case "award":
      return <Award size={26} className="stroke-[2.2]" />;
    case "heart":
      return <Heart size={26} className="stroke-[2.2]" />;
    case "package":
    default:
      return <Package size={26} className="stroke-[2.2]" />;
  }
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  onSelectCategory,
  selectedCategory = "all",
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [combosSettings, setCombosSettings] = useState<{ icon: string; image?: string | null }>({
    icon: "Package",
    image: null,
  });
  const [dealsSettings, setDealsSettings] = useState<{ icon: string; image?: string | null }>({
    icon: "Flame",
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const apiBase = getApiBaseUrl();
        const [catRes, combosRes, dealsRes] = await Promise.all([
          fetchCategoriesDeduplicated(apiBase),
          fetch(`${apiBase}/combos/category-settings`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${apiBase}/deals/category-settings`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        let list: Category[] = [];
        if (Array.isArray(catRes)) {
          list = catRes as Category[];
        } else if (
          catRes &&
          typeof catRes === "object" &&
          "data" in catRes &&
          Array.isArray((catRes as { data: unknown }).data)
        ) {
          list = (catRes as { data: Category[] }).data;
        }

        if (!cancelled) {
          const activeList = list
            .filter((c) => c.isActive !== false)
            .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
          setCategories(activeList);

          if (combosRes && typeof combosRes === "object") {
            setCombosSettings({
              icon: combosRes.icon || "Package",
              image: combosRes.image || null,
            });
          }
          if (dealsRes && typeof dealsRes === "object") {
            setDealsSettings({
              icon: dealsRes.icon || "Flame",
              image: dealsRes.image || null,
            });
          }
        }
      } catch (e) {
        console.warn("Could not load categories for quick scroller:", e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = (id: string, name: string) => {
    onSelectCategory?.(id, name);
    const target =
      document.getElementById("catalog") ||
      document.getElementById("trending") ||
      document.getElementById("products");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCombosClick = () => {
    if (location.pathname !== "/") {
      navigate("/#combos");
    } else {
      const el = document.getElementById("combos") || document.getElementById("combo-plans");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.location.hash = "#combos";
      }
    }
  };

  const handleDealsClick = () => {
    if (location.pathname !== "/") {
      navigate("/#deals");
    } else {
      const el = document.getElementById("deals") || document.getElementById("deals-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.location.hash = "#deals";
      }
    }
  };

  const handleImageError = (categoryId: string) => {
    setBrokenImages((prev) => ({ ...prev, [categoryId]: true }));
  };

  const isSpecialCategory = (name: string) => {
    const l = (name || "").toLowerCase().trim();
    return l === "combos" || l === "combo" || l === "deals" || l === "deals & offers" || l === "this week deals";
  };

  if (!loading && categories.length === 0) {
    return null;
  }

  const isCombosActive = location.hash === "#combos";
  const isDealsActive = location.hash === "#deals";

  return (
    <section
      aria-label="Category Navigation"
      className="border-b border-[#E1ECF2] bg-[#F4F8FA] py-4 sm:py-5"
    >
      <div className="ref-container">
        <div className="flex items-center justify-start gap-5 sm:gap-7 md:gap-8 overflow-x-auto pb-2 px-1 no-scrollbar whitespace-nowrap">
          {/* "All Items" Circle Thumbnail */}
          <button
            type="button"
            onClick={() => handleClick("all", "All Items")}
            className="group flex flex-col items-center gap-2 text-center shrink-0 min-w-[72px] sm:min-w-[86px] transition cursor-pointer"
          >
            <div
              className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full p-3 transition duration-200 border-2 ${
                selectedCategory.toLowerCase() === "all"
                  ? "border-[#007C8A] bg-[#E6F5F7] shadow-md shadow-[#007C8A]/20 scale-105 text-[#007C8A]"
                  : "border-[#E1ECF2] bg-white text-[#007C8A] group-hover:-translate-y-1 group-hover:scale-105 group-hover:border-[#007C8A] group-hover:shadow-md"
              }`}
            >
              <Sparkles size={28} className="stroke-[2.2]" />
            </div>
            <span
              className={`text-xs sm:text-[13px] font-medium whitespace-nowrap transition ${
                selectedCategory.toLowerCase() === "all"
                  ? "text-[#007C8A] font-bold"
                  : "text-gray-700 group-hover:text-[#007C8A] group-hover:font-semibold"
              }`}
            >
              All Items
            </span>
          </button>

          {/* Database Categories Circular Thumbnails */}
          {categories
            .filter((c) => !isSpecialCategory(c.name))
            .map((item) => {
              const isSelected =
                selectedCategory.toLowerCase() === item.id.toLowerCase() ||
                selectedCategory.toLowerCase() === item.name.toLowerCase();
              const hasValidImage = Boolean(item.image) && !brokenImages[item.id];

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleClick(item.id, item.name)}
                  className="group flex flex-col items-center gap-2 text-center shrink-0 min-w-[72px] sm:min-w-[86px] transition cursor-pointer"
                >
                  <div
                    className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full overflow-hidden transition duration-200 border-2 bg-white ${
                      isSelected
                        ? "border-[#007C8A] ring-2 ring-[#007C8A]/25 shadow-md shadow-[#007C8A]/20 scale-105"
                        : "border-[#E1ECF2] group-hover:-translate-y-1 group-hover:scale-105 group-hover:border-[#007C8A] group-hover:shadow-md"
                    }`}
                  >
                    {hasValidImage ? (
                      <img
                        src={item.image!}
                        alt={item.name}
                        onError={() => handleImageError(item.id)}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#007C8A] bg-[#F4F8FA] p-3">
                        {getCategoryFallbackIcon(item.name)}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs sm:text-[13px] font-medium whitespace-nowrap transition max-w-[85px] sm:max-w-[105px] truncate ${
                      isSelected
                        ? "text-[#007C8A] font-bold"
                        : "text-gray-700 group-hover:text-[#007C8A] group-hover:font-semibold"
                    }`}
                    title={item.name}
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}

          {/* Combos Circular Category Thumbnail */}
          <button
            type="button"
            onClick={handleCombosClick}
            className="group flex flex-col items-center gap-2 text-center shrink-0 min-w-[72px] sm:min-w-[86px] transition cursor-pointer"
          >
            <div
              className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full overflow-hidden transition duration-200 border-2 bg-white ${
                isCombosActive
                  ? "border-[#007C8A] ring-2 ring-[#007C8A]/25 shadow-md shadow-[#007C8A]/20 scale-105"
                  : "border-[#E1ECF2] group-hover:-translate-y-1 group-hover:scale-105 group-hover:border-[#007C8A] group-hover:shadow-md"
              }`}
            >
              {combosSettings.image ? (
                <img
                  src={combosSettings.image}
                  alt="Combos"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#007C8A] bg-[#F4F8FA] p-3">
                  {renderCustomIcon(combosSettings.icon || "Package")}
                </div>
              )}
            </div>
            <span
              className={`text-xs sm:text-[13px] font-medium whitespace-nowrap transition max-w-[85px] sm:max-w-[105px] truncate ${
                isCombosActive
                  ? "text-[#007C8A] font-bold"
                  : "text-gray-700 group-hover:text-[#007C8A] group-hover:font-semibold"
              }`}
              title="Combos"
            >
              Combos
            </span>
          </button>

          {/* Deals & Offers Circular Category Thumbnail */}
          <button
            type="button"
            onClick={handleDealsClick}
            className="group flex flex-col items-center gap-2 text-center shrink-0 min-w-[72px] sm:min-w-[86px] transition cursor-pointer"
          >
            <div
              className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full overflow-hidden transition duration-200 border-2 bg-white ${
                isDealsActive
                  ? "border-[#007C8A] ring-2 ring-[#007C8A]/25 shadow-md shadow-[#007C8A]/20 scale-105"
                  : "border-[#E1ECF2] group-hover:-translate-y-1 group-hover:scale-105 group-hover:border-[#007C8A] group-hover:shadow-md"
              }`}
            >
              {dealsSettings.image ? (
                <img
                  src={dealsSettings.image}
                  alt="Deals & Offers"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#007C8A] bg-[#F4F8FA] p-3">
                  {renderCustomIcon(dealsSettings.icon || "Flame")}
                </div>
              )}
            </div>
            <span
              className={`text-xs sm:text-[13px] font-medium whitespace-nowrap transition max-w-[85px] sm:max-w-[105px] truncate ${
                isDealsActive
                  ? "text-[#007C8A] font-bold"
                  : "text-gray-700 group-hover:text-[#007C8A] group-hover:font-semibold"
              }`}
              title="Deals & Offers"
            >
              Deals &amp; Offers
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
