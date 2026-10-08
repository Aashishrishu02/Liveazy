import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  isActive: boolean;
}

export default function AdminDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [categoriesResponse, productsResponse] =
          await Promise.all([
            fetch(`${API_URL}/categories`),
            fetch(`${API_URL}/products`),
          ]);

        const categoriesData = await categoriesResponse.json();
        const productsData = await productsResponse.json();

        setCategories(categoriesData);
        setProducts(productsData);
      } catch (error) {
        console.error(
          "Error fetching dashboard data:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalCategories = categories.length;

  const totalProducts = products.length;

  const activeCategories = categories.filter(
    (category) => category.isActive
  ).length;

  const activeProducts = products.filter(
    (product) => product.isActive
  ).length;

  return (
    <div className="min-h-screen bg-[#F5FAFA] p-6 md:p-8">

      {/* HEADER */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-[#123B63]">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Welcome to LIVEAZY Admin Panel
        </p>

      </div>


      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Total Categories */}

        <div className="bg-white rounded-xl border border-[#D8EEF0] p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Total Categories
          </p>

          <h2 className="text-3xl font-bold text-[#123B63] mt-2">
            {loading ? "..." : totalCategories}
          </h2>

        </div>


        {/* Total Products */}

        <div className="bg-white rounded-xl border border-[#D8EEF0] p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Total Products
          </p>

          <h2 className="text-3xl font-bold text-[#123B63] mt-2">
            {loading ? "..." : totalProducts}
          </h2>

        </div>


        {/* Active Categories */}

        <div className="bg-white rounded-xl border border-[#D8EEF0] p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Active Categories
          </p>

          <h2 className="text-3xl font-bold text-[#0795A3] mt-2">
            {loading ? "..." : activeCategories}
          </h2>

        </div>


        {/* Active Products */}

        <div className="bg-white rounded-xl border border-[#D8EEF0] p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Active Products
          </p>

          <h2 className="text-3xl font-bold text-[#0795A3] mt-2">
            {loading ? "..." : activeProducts}
          </h2>

        </div>

      </div>


      {/* MASTER SECTIONS */}

      <div className="mt-8">

        <h2 className="text-xl font-bold text-[#123B63] mb-4">
          Manage Store
        </h2>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* CATEGORIES */}

          <div className="bg-white rounded-xl border border-[#D8EEF0] p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-lg font-bold text-[#123B63]">
                  Categories Master
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Add, edit and manage furniture categories
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-[#0795A3]/10 flex items-center justify-center">

                <span className="text-xl">
                  📂
                </span>

              </div>

            </div>


            <div className="mt-5 flex items-center justify-between">

              <p className="text-sm text-gray-500">

                Total:
                <span className="font-bold text-[#123B63] ml-1">
                  {totalCategories}
                </span>

              </p>


              <button
                onClick={() =>
                  navigate("/admin/categories")
                }
                className="
                  bg-[#123B63]
                  hover:bg-[#0795A3]
                  text-white
                  px-4
                  py-2
                  rounded-lg
                  text-sm
                  font-semibold
                  transition
                "
              >
                Manage Categories
              </button>

            </div>

          </div>


          {/* PRODUCTS */}

          <div className="bg-white rounded-xl border border-[#D8EEF0] p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-lg font-bold text-[#123B63]">
                  Products Master
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Add, edit and manage furniture products
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-[#0795A3]/10 flex items-center justify-center">

                <span className="text-xl">
                  🛋️
                </span>

              </div>

            </div>


            <div className="mt-5 flex items-center justify-between">

              <p className="text-sm text-gray-500">

                Total:
                <span className="font-bold text-[#123B63] ml-1">
                  {totalProducts}
                </span>

              </p>


              <button
                onClick={() =>
                  navigate("/admin/products")
                }
                className="
                  bg-[#123B63]
                  hover:bg-[#0795A3]
                  text-white
                  px-4
                  py-2
                  rounded-lg
                  text-sm
                  font-semibold
                  transition
                "
              >
                Manage Products
              </button>

            </div>

          </div>


          {/* BANNER MANAGEMENT */}

          <div className="bg-white rounded-xl border border-[#D8EEF0] p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-lg font-bold text-[#123B63]">
                  Banner Management
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Change and manage your homepage banner
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-[#0795A3]/10 flex items-center justify-center">

                <span className="text-xl">
                  🖼️
                </span>

              </div>

            </div>


            <div className="mt-5 flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Homepage
              </p>


              <button
                onClick={() =>
                  navigate("/admin/banner")
                }
                className="
                  bg-[#123B63]
                  hover:bg-[#0795A3]
                  text-white
                  px-4
                  py-2
                  rounded-lg
                  text-sm
                  font-semibold
                  transition
                "
              >
                Manage Banner
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}