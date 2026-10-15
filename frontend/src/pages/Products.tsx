import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Tags,
  Armchair,
  Images,
  Megaphone,
  MessageCircle,
  Store,
  LogOut,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Package,
  Menu,
  IndianRupee,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  isActive: boolean;
  rent12M?: number | null;
  deposit12M?: number | null;
  rent6M?: number | null;
  deposit6M?: number | null;
  rent3M?: number | null;
  deposit3M?: number | null;
}

const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
];

export default function Products() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [rent12M, setRent12M] = useState("");
  const [deposit12M, setDeposit12M] = useState("");
  const [rent6M, setRent6M] = useState("");
  const [deposit6M, setDeposit6M] = useState("");
  const [rent3M, setRent3M] = useState("");
  const [deposit3M, setDeposit3M] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/categories`),
      ]);

      if (!productsResponse.ok || !categoriesResponse.ok) {
        throw new Error("Failed to load products or categories");
      }

      const [productsData, categoriesData] = await Promise.all([
        productsResponse.json(),
        categoriesResponse.json(),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      window.alert("Unable to load products. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setImage("");
    setCategoryId("");

    setRent12M("");
    setDeposit12M("");
    setRent6M("");
    setDeposit6M("");
    setRent3M("");
    setDeposit3M("");

    setEditingProduct(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving || uploading) return;
    setShowModal(false);
    resetForm();
  };

  const handleEditProduct = (product: Product) => {
    resetForm();

    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(String(product.price));
    setImage(product.image || "");
    setCategoryId(product.categoryId);

    setRent12M(product.rent12M == null ? "" : String(product.rent12M));
    setDeposit12M(
      product.deposit12M == null ? "" : String(product.deposit12M)
    );
    setRent6M(product.rent6M == null ? "" : String(product.rent6M));
    setDeposit6M(
      product.deposit6M == null ? "" : String(product.deposit6M)
    );
    setRent3M(product.rent3M == null ? "" : String(product.rent3M));
    setDeposit3M(
      product.deposit3M == null ? "" : String(product.deposit3M)
    );

    setShowModal(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      window.alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert("Image size should be less than 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.message || "Image upload failed");
      }

      setImage(data.url);
    } catch (error) {
      console.error("Image upload error:", error);
      window.alert(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!name.trim()) {
      window.alert("Please enter product name.");
      return;
    }

    if (
      price.trim() === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      window.alert("Please enter a valid product price.");
      return;
    }

    if (!categoryId) {
      window.alert("Please select a category.");
      return;
    }

    const rentalValues = [
      ["12-month rent", rent12M],
      ["12-month deposit", deposit12M],
      ["6-month rent", rent6M],
      ["6-month deposit", deposit6M],
      ["3-month rent", rent3M],
      ["3-month deposit", deposit3M],
    ] as const;

    for (const [label, value] of rentalValues) {
      if (
        value.trim() !== "" &&
        (!Number.isFinite(Number(value)) || Number(value) < 0)
      ) {
        window.alert(`Please enter a valid non-negative value for ${label}.`);
        return;
      }
    }

    if (uploading) {
      window.alert("Please wait for the image upload to finish.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingProduct);
      const url = isEditing
        ? `${API_URL}/products/${editingProduct!.id}`
        : `${API_URL}/products`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          image: image.trim(),
          categoryId,

          rent12M: rent12M.trim() === "" ? null : Number(rent12M),
          deposit12M:
            deposit12M.trim() === "" ? null : Number(deposit12M),
          rent6M: rent6M.trim() === "" ? null : Number(rent6M),
          deposit6M:
            deposit6M.trim() === "" ? null : Number(deposit6M),
          rent3M: rent3M.trim() === "" ? null : Number(rent3M),
          deposit3M:
            deposit3M.trim() === "" ? null : Number(deposit3M),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing ? "Failed to update product" : "Failed to add product")
        );
      }

      setShowModal(false);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      window.alert(
        error instanceof Error ? error.message : "Unable to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      setDeletingId(product.id);

      const response = await fetch(`${API_URL}/products/${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete product");
      }

      await fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      window.alert(
        error instanceof Error ? error.message : "Failed to delete product"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const response = await fetch(`${API_URL}/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      await fetchData();
    } catch (error) {
      console.error("Error updating product status:", error);
      window.alert(
        error instanceof Error ? error.message : "Failed to update status"
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [product.name, product.description || ""]
      .join(" ")
      .toLowerCase()
      .includes(query);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && product.isActive) ||
      (statusFilter === "inactive" && !product.isActive);

    const matchesCategory =
      categoryFilter === "all" || product.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const activeCount = products.filter((product) => product.isActive).length;
  const inactiveCount = products.length - activeCount;

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#142B43]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="border-b border-slate-100 bg-[#F8FAFC] px-6 py-6">
          <div className="flex items-center gap-3">
            <img
              src="/liveazy-logo.png"
              alt="LIVEAZY"
              className="h-11 w-11 rounded-xl bg-white object-contain p-1"
            />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#0F2942]">
                LIVEAZY
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Rental Commerce Hub
              </p>
            </div>
          </div>

          <span className="mt-5 inline-flex rounded-md bg-[#D9F4F2] px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[#00696E]">
            ADMIN CONSOLE
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Operations &amp; Catalog
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#0F2942] text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-[#0F2942]"
                    }`
                  }
                >
                  <Icon size={19} strokeWidth={1.8} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="my-6 border-t border-slate-100" />

          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <Store size={19} />
            View Website
          </NavLink>
        </div>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Store Management / Products
              </p>
              <h2 className="mt-1 text-base font-bold text-[#0F2942]">
                Products
              </h2>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Admin workspace
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-md bg-[#D9F4F2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#00696E]">
                <Package size={13} />
                Catalogue Management
              </span>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F2942] sm:text-3xl">
                Products Master
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage products, rental plans and availability.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#193D5C]"
            >
              <Plus size={18} />
              Add Product
            </button>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Total Products"
              value={loading ? "—" : products.length}
              subtitle="All store products"
              icon={<Package size={20} />}
              iconClass="bg-blue-50 text-[#0F2942]"
            />
            <StatCard
              title="Active Products"
              value={loading ? "—" : activeCount}
              subtitle="Currently active"
              icon={<CheckCircle2 size={20} />}
              iconClass="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              title="Inactive Products"
              value={loading ? "—" : inactiveCount}
              subtitle="Currently unavailable"
              icon={<Armchair size={20} />}
              iconClass="bg-orange-50 text-[#E96B43]"
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h3 className="font-bold text-[#0F2942]">All Products</h3>
                <p className="mt-1 text-xs text-slate-500">
                  View, edit and control product availability.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#008A90] sm:w-52"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-[#008A90]"
                  aria-label="Filter products by category"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-[#008A90]"
                  aria-label="Filter products by status"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="bg-[#F8FAFC]">
                  <tr className="border-b border-slate-200">
                    {["Product", "Category", "Price", "Status", "Actions"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-16 text-center text-sm text-slate-500"
                      >
                        Loading products...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-16 text-center text-sm text-slate-500"
                      >
                        {products.length === 0
                          ? "No products yet. Add your first product."
                          : "No matching products. Try another search or filter."}
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredProducts.map((product) => {
                      const category = categories.find(
                        (item) => item.id === product.categoryId
                      );

                      return (
                        <tr
                          key={product.id}
                          className="transition hover:bg-[#F8FAFC]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon
                                    size={20}
                                    className="text-slate-300"
                                  />
                                )}
                              </div>

                              <div className="max-w-xs">
                                <p className="font-semibold text-[#0F2942]">
                                  {product.name}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                                  {product.description || "No description added"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                              {category?.name || "Unknown category"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center text-sm font-bold text-[#0F2942]">
                              <IndianRupee size={14} />
                              {formatPrice(product.price)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(product)}
                              title="Click to change status"
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                product.isActive
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  product.isActive
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              {product.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditProduct(product)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#0F2942] transition hover:border-[#008A90] hover:bg-teal-50"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={deletingId === product.id}
                                onClick={() => void handleDeleteProduct(product)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                                {deletingId === product.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {filteredProducts.length} of {products.length} products
              </p>
              <p>LIVEAZY Catalogue Management</p>
            </div>
          </section>
        </main>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#0F2942]/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="my-auto flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#008A90]">
                  Product Management
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-[#0F2942]">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure product details and rental pricing.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving || uploading}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto p-6">
              <div>
                <label
                  htmlFor="product-name"
                  className="mb-2 block text-sm font-semibold text-[#0F2942]"
                >
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Modern 3-Seater Sofa"
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="product-category"
                  className="mb-2 block text-sm font-semibold text-[#0F2942]"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="product-category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10"
                >
                  <option value="">Select Category</option>
                  {categories
                    .filter(
                      (category) =>
                        category.isActive ||
                        category.id === editingProduct?.categoryId
                    )
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="product-price"
                  className="mb-2 block text-sm font-semibold text-[#0F2942]"
                >
                  Base Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="Enter base price"
                    required
                    className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Kept for compatibility with existing product data.
                </p>
              </div>

              <section className="space-y-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0F2942]">
                    Rental Plans
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Enter monthly rent and refundable deposit for each duration.
                    All rental fields are optional.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <RentalNumberField
                    id="rent-12m"
                    label="12-month plan · Monthly rent (₹)"
                    value={rent12M}
                    onChange={setRent12M}
                    placeholder="e.g. 999"
                  />
                  <RentalNumberField
                    id="deposit-12m"
                    label="12-month plan · Refundable deposit (₹)"
                    value={deposit12M}
                    onChange={setDeposit12M}
                    placeholder="e.g. 3000"
                  />
                  <RentalNumberField
                    id="rent-6m"
                    label="6-month plan · Monthly rent (₹)"
                    value={rent6M}
                    onChange={setRent6M}
                    placeholder="e.g. 1199"
                  />
                  <RentalNumberField
                    id="deposit-6m"
                    label="6-month plan · Refundable deposit (₹)"
                    value={deposit6M}
                    onChange={setDeposit6M}
                    placeholder="e.g. 3000"
                  />
                  <RentalNumberField
                    id="rent-3m"
                    label="3-month plan · Monthly rent (₹)"
                    value={rent3M}
                    onChange={setRent3M}
                    placeholder="e.g. 1499"
                  />
                  <RentalNumberField
                    id="deposit-3m"
                    label="3-month plan · Refundable deposit (₹)"
                    value={deposit3M}
                    onChange={setDeposit3M}
                    placeholder="e.g. 3000"
                  />
                </div>
              </section>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0F2942]">
                  Product Image
                </label>

                <input
                  ref={fileInputRef}
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleImageUpload(file);
                  }}
                  className="hidden"
                />

                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-[#F8FAFC] p-4">
                  {image && (
                    <div className="mb-4 flex items-center gap-4">
                      <img
                        src={image}
                        alt="Product preview"
                        className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#0F2942]">
                          Image preview
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setImage("");
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="mt-2 text-xs font-semibold text-red-600 hover:underline"
                        >
                          Remove image
                        </button>
                      </div>
                    </div>
                  )}

                  <label
                    htmlFor="product-image"
                    className="flex cursor-pointer flex-col items-center justify-center py-4 text-center transition hover:text-[#008A90]"
                  >
                    <Upload size={22} className="text-[#008A90]" />
                    <span className="mt-2 text-sm font-semibold text-[#0F2942]">
                      {uploading
                        ? "Uploading image..."
                        : image
                          ? "Change product image"
                          : "Click to upload image"}
                    </span>
                    <span className="mt-1 text-xs text-slate-400">
                      JPG, PNG or WebP · Maximum 5 MB
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor="product-description"
                  className="mb-2 block text-sm font-semibold text-[#0F2942]"
                >
                  Description
                </label>
                <textarea
                  id="product-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the product..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-[#F8FAFC] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving || uploading}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleSaveProduct()}
                disabled={saving || uploading || !name.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#193D5C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {saving
                  ? "Saving..."
                  : editingProduct
                    ? "Save Changes"
                    : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RentalNumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold leading-5 text-[#0F2942]"
      >
        {label}
      </label>
      <div className="relative">
        <IndianRupee
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          id={id}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10"
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-lg p-2.5 ${iconClass}`}>{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-extrabold text-[#0F2942]">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}