import React, { useEffect, useState } from "react";

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

// Old images will be used as fallback
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
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // ================= FETCH DATA =================

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

        const categoriesData = await categoriesResponse.json();
        const productsData = await productsResponse.json();

        setCategories(categoriesData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // PRODUCT COUNT 
  const getProductCount = (categoryId: string) => {
    const count = products.filter(
      (product) =>
        product.categoryId === categoryId && product.isActive
    ).length;

    return count;
  };

  // IMAGE 

  const getCategoryImage = (category: Category) => {
    if (category.image) {
      return category.image;
    }

    const key = category.name.trim().toLowerCase();

    return fallbackImages[key] || sofaImg;
  };

  return (
    <section
      className="py-12 bg-white border-b border-gray-100"
      id="categories"
    >
      <div className="max-w-7xl mx-auto px-4">

        {/* SECTION HEADER */}

        <div className="border-b-2 border-gray-100 pb-3 mb-8 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider border-b-2 border-[#f28e2b] -mb-[14px] pb-3">
            TOP CATEGORIES
          </h2>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="py-10 text-center text-gray-500">
            Loading categories...
          </div>
        )}

        {/* CATEGORIES */}

        {!loading && categories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories
              .filter((category) => category.isActive)
              .map((category) => {
                const productCount = getProductCount(category.id);

                return (
                  <a
                    key={category.id}
                    href="#products"
                    onClick={() =>
                      onSelectCategory &&
                      onSelectCategory(category.name)
                    }
                    className="group text-center p-3 rounded-lg border border-gray-100 hover:border-amber-300 hover:shadow-md transition bg-white block"
                  >
                    {/* IMAGE */}

                    <div className="h-28 flex items-center justify-center overflow-hidden bg-gray-50 rounded mb-3">
                      <img
                        src={getCategoryImage(category)}
                        alt={category.name}
                        className="max-h-24 object-contain group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    {/* CATEGORY NAME */}

                    <h3 className="font-bold text-xs uppercase text-gray-900 group-hover:text-[#f28e2b] transition">
                      {category.name}
                    </h3>

                    {/* PRODUCT COUNT */}

                    <p className="text-[11px] text-gray-500">
                      {productCount}{" "}
                      {productCount === 1 ? "product" : "products"}
                    </p>
                  </a>
                );
              })}
          </div>
        )}

        {/* NO CATEGORY */}

        {!loading && categories.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            No categories available.
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySection;