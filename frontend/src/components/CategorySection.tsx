
import React, { useEffect, useMemo, useState } from "react";
import {
  Armchair,
  BedDouble,
  Refrigerator,
  BriefcaseBusiness,
  Monitor,
  Sparkles,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

interface CategorySectionProps {
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  displayOrder?: number | null;
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
  price?: number | string | null;
  rent12M?: number | string | null;
  rent6M?: number | string | null;
  rent3M?: number | string | null;
}

const categoryStyles: Record<
  string,
  {
    description: string;
    icon: React.ElementType;
    rent: number;
  }
> = {
  "living room": {
    description: "Sofas, Tables & TV Units",
    icon: Armchair,
    rent: 499,
  },
  bedroom: {
    description: "Queen Beds & Mattresses",
    icon: BedDouble,
    rent: 649,
  },
  appliances: {
    description: "Fridges, Washers & Ovens",
    icon: Refrigerator,
    rent: 599,
  },
  "wfh office": {
    description: "Ergo Chairs & Smart Desks",
    icon: BriefcaseBusiness,
    rent: 399,
  },
  electronics: {
    description: "4K TVs, ACs & Coolers",
    icon: Monitor,
    rent: 749,
  },
  dining: {
    description: "Dining Tables & Chairs",
    icon: Armchair,
    rent: 399,
  },
  study: {
    description: "Study Tables & Chairs",
    icon: BriefcaseBusiness,
    rent: 299,
  },
  "combo offers": {
    description: "Complete home essentials",
    icon: Package,
    rent: 0,
  },
};

const defaultStyle = {
  description: "Furniture & Home Essentials",
  icon: Package,
  rent: 499,
};

const CategorySection: React.FC<CategorySectionProps> = ({
  selectedCategory,
}) => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [categoriesResponse, productsResponse] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/products`),
        ]);

        if (!categoriesResponse.ok || !productsResponse.ok) {
          throw new Error("Failed to fetch category data");
        }

        const [categoriesData, productsData] = await Promise.all([
          categoriesResponse.json(),
          productsResponse.json(),
        ]);

        if (!cancelled) {
          setCategories(
            Array.isArray(categoriesData) ? categoriesData : []
          );
          setProducts(
            Array.isArray(productsData) ? productsData : []
          );
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCategories = useMemo(
    () =>
      categories
        .filter(
          (category) =>
            category.isActive &&
            !["full combos", "combo offers"].includes(
              category.name.trim().toLowerCase()
            )
        )
        .sort((a, b) => {
          const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

          return orderA - orderB || a.name.localeCompare(b.name);
        }),
    [categories]
  );

  const getProductCount = (categoryId: string) =>
    products.filter(
      (product) =>
        product.categoryId === categoryId && product.isActive
    ).length;

  const getCategoryStyle = (category: Category) =>
    categoryStyles[category.name.trim().toLowerCase()] || defaultStyle;

  const getStartingRent = (category: Category) => {
    const categoryProducts = products.filter(
      (product) =>
        product.categoryId === category.id && product.isActive
    );

    const rents = categoryProducts
      .flatMap((product) => [
        product.rent12M,
        product.rent6M,
        product.rent3M,
        product.price,
      ])
      .map(Number)
      .filter((value) => Number.isFinite(value) && value > 0);

    return rents.length > 0
      ? Math.min(...rents)
      : getCategoryStyle(category).rent;
  };

  const handleCategoryClick = (category: Category) => {
    navigate(`/category/${encodeURIComponent(category.id)}`);
  };

  return (
    <section
      id="categories"
      className="scroll-mt-24 border-b border-slate-100 bg-[#F7F8FD] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="mb-9 grid gap-4 md:mb-10 md:grid-cols-[1fr_1.2fr] md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#006B73] sm:text-sm">
              <Sparkles size={16} />
              Explore our catalog
            </div>

            <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-[-0.045em] text-[#101B2D] sm:text-5xl">
              Browse by
              <br />
              Category
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base md:justify-self-end md:text-lg md:leading-8">
            Sanitized, quality-inspected furniture and branded smart
            appliances tailored for modern Indian city homes.
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-[22px] bg-white p-5 shadow-sm"
              >
                <div className="mx-auto h-[84px] w-[84px] rounded-[22px] bg-slate-100" />
                <div className="mx-auto mt-4 h-5 w-28 rounded bg-slate-100" />
                <div className="mx-auto mt-3 h-3 w-36 rounded bg-slate-100" />
                <div className="mx-auto mt-3 h-6 w-24 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && activeCategories.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {activeCategories.map((category) => {
              const style = getCategoryStyle(category);
              const Icon = style.icon;
              const isSelected = selectedCategory === category.name;
              const rent = getStartingRent(category);
              const imageUrl = category.image?.trim();

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryClick(category)}
                  aria-label={`Explore ${category.name}, ${getProductCount(category.id)} products`}
                  className={`group flex min-h-[210px] flex-col items-center justify-center rounded-[22px] border px-3 py-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:min-h-[225px] sm:px-5 ${
                    isSelected
                      ? "border-[#008A90] bg-[#EAF8F8] shadow-md"
                      : "border-white bg-white shadow-sm hover:border-[#008A90]/30"
                  }`}
                >
                  <span className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-[#EDF3FF] text-[#006B73] transition-all duration-300 group-hover:bg-[#DDF8FA] sm:h-[92px] sm:w-[92px]">
                    <Icon
                      size={34}
                      strokeWidth={2.2}
                      aria-hidden="true"
                      className="absolute inset-0 m-auto"
                    />

                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={category.name}
                        loading="lazy"
                        className="absolute inset-0 z-10 h-full w-full rounded-[22px] object-cover object-center"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </span>

                  <h3 className="mt-3 text-base font-semibold tracking-tight text-[#101B2D] sm:text-xl">
                    {category.name}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                    {style.description}
                  </p>

                  <span className="mt-2 inline-flex rounded-full bg-[#E6EEFF] px-3 py-1 text-xs font-medium text-slate-700 sm:text-sm">
                    Starts ₹{rent}/mo
                  </span>

                  <span className="mt-2 text-xs font-semibold text-[#008A90]">
                    {getProductCount(category.id)} products →
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!loading && activeCategories.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <Package size={34} className="mx-auto mb-3 text-slate-400" />

            <h3 className="font-semibold text-[#0F2942]">
              No categories available
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Active categories will appear here once they are available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySection;
