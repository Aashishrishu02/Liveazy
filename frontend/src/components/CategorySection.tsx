
import React, { useEffect, useState } from "react";
import { ArrowUpRight, Package, Sparkles } from "lucide-react";

import bedImg from "../assets/products/bed.jpeg";
import sofaImg from "../assets/products/sofa.jpeg";
import dinnerTableImg from "../assets/products/dinner-table.jpeg";
import studyTableImg from "../assets/products/study-table.jpeg";
import fridgeImg from "../assets/products/fridge.jpeg";
import almirahImg from "../assets/products/almirah.jpeg";

const API_URL = import.meta.env.VITE_API_URL;

interface CategorySectionProps {
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
}

const fallbackImages: Record<string, string> = {
  bedroom: bedImg,
  "living room": sofaImg,
  dining: dinnerTableImg,
  study: studyTableImg,
  appliances: fridgeImg,
  "combo offers": almirahImg,
};

const CategorySection: React.FC<CategorySectionProps> = ({
  onSelectCategory,
  selectedCategory,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [categoriesResponse, productsResponse] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/products`),
        ]);

        if (!categoriesResponse.ok) {
          throw new Error("Failed to fetch categories");
        }

        if (!productsResponse.ok) {
          throw new Error("Failed to fetch products");
        }

        const [categoriesData, productsData] = await Promise.all([
          categoriesResponse.json(),
          productsResponse.json(),
        ]);

        setCategories(categoriesData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const getProductCount = (categoryId: string) =>
    products.filter(
      (product) =>
        product.categoryId === categoryId && product.isActive
    ).length;

  const getCategoryImage = (category: Category) => {
    if (category.image) return category.image;

    const key = category.name.trim().toLowerCase();
    return fallbackImages[key] || sofaImg;
  };

  const activeCategories = categories.filter(
    (category) => category.isActive
  );

  return (
    <section
      id="categories"
      className="scroll-mt-24 border-b border-slate-100 bg-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        {/* Section heading */}
        <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#008A90]">
              <Sparkles size={16} />
              Explore our collection
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-[#0F2942] sm:text-4xl">
              Find your perfect fit.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              From everyday essentials to complete home setups, discover
              furniture that fits your lifestyle.
            </p>
          </div>

          {!loading && activeCategories.length > 0 && (
            <div className="flex w-fit items-center gap-2 rounded-full bg-[#F0F8F8] px-4 py-2 text-sm font-semibold text-[#0F2942]">
              <Package size={17} className="text-[#008A90]" />
              {activeCategories.length} categories
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-slate-100 p-3"
              >
                <div className="h-36 rounded-xl bg-slate-100 sm:h-40" />
                <div className="mx-auto mt-4 h-4 w-3/4 rounded bg-slate-100" />
                <div className="mx-auto mt-2 h-3 w-1/2 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* Category cards */}
        {!loading && activeCategories.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6">
            {activeCategories.map((category) => {
              const productCount = getProductCount(category.id);
              const isSelected = selectedCategory === category.name;

              return (
                <a
                  key={category.id}
                  href="#products"
                  onClick={() => onSelectCategory?.(category.name)}
                  aria-label={`Explore ${category.name}, ${productCount} products`}
                  className={`group relative overflow-hidden rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0F2942]/10 sm:p-4 ${
                    isSelected
                      ? "border-[#008A90] bg-[#F0F8F8] shadow-md shadow-[#008A90]/10"
                      : "border-slate-100 bg-white hover:border-[#008A90]/40"
                  }`}
                >
                  {/* Image */}
                  <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl bg-[#F5F7FA] sm:h-40">
                    <img
                      src={getCategoryImage(category)}
                      alt={category.name}
                      loading="lazy"
                      className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                    />

                    <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#0F2942] shadow-sm transition-colors duration-300 group-hover:bg-[#008A90] group-hover:text-white">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>

                  {/* Text */}
                  <div className="px-1 pb-1 pt-4">
                    <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#0F2942] transition-colors group-hover:text-[#008A90] sm:text-base">
                      {category.name}
                    </h3>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {productCount}{" "}
                      {productCount === 1 ? "product" : "products"}
                    </p>

                    <div className="mt-3 h-1 w-9 rounded-full bg-[#008A90]/25 transition-all duration-300 group-hover:w-full group-hover:bg-[#008A90]" />
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && activeCategories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-14 text-center">
            <Package
              size={32}
              className="mx-auto mb-3 text-slate-400"
            />
            <h3 className="font-bold text-[#0F2942]">
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
