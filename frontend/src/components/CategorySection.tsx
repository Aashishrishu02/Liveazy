import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Layers,
  Bed,
  Armchair,
  Utensils,
  BookOpen,
  Package,
  Tv,
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

export const CategorySection: React.FC<CategorySectionProps> = ({
  onSelectCategory,
  selectedCategory = "all",
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetchCategoriesDeduplicated(apiBase);
        let list: Category[] = [];
        if (Array.isArray(res)) {
          list = res as Category[];
        } else if (
          res &&
          typeof res === "object" &&
          "data" in res &&
          Array.isArray((res as { data: unknown }).data)
        ) {
          list = (res as { data: Category[] }).data;
        }

        if (!cancelled) {
          const activeList = list
            .filter((c) => c.isActive !== false)
            .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
          setCategories(activeList);
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

  const handleImageError = (categoryId: string) => {
    setBrokenImages((prev) => ({ ...prev, [categoryId]: true }));
  };

  if (!loading && categories.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Category Navigation"
      className="border-b border-gray-100 bg-[#FAF9FD] py-4 sm:py-5"
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
                  ? "border-[#4a36b3] bg-[#f0eaff] shadow-md shadow-[#4a36b3]/20 scale-105 text-[#4a36b3]"
                  : "border-[#ede9fe] bg-white text-[#4a36b3] group-hover:-translate-y-1 group-hover:scale-105 group-hover:border-[#4a36b3] group-hover:shadow-md"
              }`}
            >
              <Sparkles size={28} className="stroke-[2.2]" />
            </div>
            <span
              className={`text-xs sm:text-[13px] font-medium whitespace-nowrap transition ${
                selectedCategory.toLowerCase() === "all"
                  ? "text-[#4a36b3] font-bold"
                  : "text-gray-700 group-hover:text-[#4a36b3] group-hover:font-semibold"
              }`}
            >
              All Items
            </span>
          </button>

          {/* Database Categories Circular Thumbnails */}
          {categories.map((item) => {
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
                      ? "border-[#4a36b3] ring-2 ring-[#4a36b3]/25 shadow-md shadow-[#4a36b3]/20 scale-105"
                      : "border-[#ede9fe] group-hover:-translate-y-1 group-hover:scale-105 group-hover:border-[#4a36b3] group-hover:shadow-md"
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
                    <div className="flex h-full w-full items-center justify-center text-[#4a36b3] bg-[#f8f7fc] p-3">
                      {getCategoryFallbackIcon(item.name)}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-[13px] font-medium whitespace-nowrap transition max-w-[85px] sm:max-w-[105px] truncate ${
                    isSelected
                      ? "text-[#4a36b3] font-bold"
                      : "text-gray-700 group-hover:text-[#4a36b3] group-hover:font-semibold"
                  }`}
                  title={item.name}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
