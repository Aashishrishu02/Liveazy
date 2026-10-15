
import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
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
  FolderOpen,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
];

export default function Categories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/categories`);

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setImage("");
    setIsActive(true);
    setEditingCategory(null);
    setUploading(false);

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

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error("Image URL was not returned");
      }

      setImage(data.url);
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5 MB");
      event.target.value = "";
      return;
    }

    await handleImageUpload(file);
  };

  const handleAddCategory = async () => {
    if (!name.trim()) {
      alert("Please enter category name");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          image: image.trim(),
          isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      setShowModal(false);
      resetForm();
      await fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setImage(category.image || "");
    setIsActive(category.isActive);
    setShowModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    if (!name.trim()) {
      alert("Please enter category name");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/categories/${editingCategory.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            image: image.trim(),
            isActive,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      setShowModal(false);
      resetForm();
      await fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(
        "Failed to delete category. Products may be linked to this category.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      const response = await fetch(
        `${API_URL}/categories/${category.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !category.isActive }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await fetchCategories();
    } catch (error) {
      console.error("Error updating category status:", error);
      alert("Failed to update category status");
    }
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = [
      category.name,
      category.description || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && category.isActive) ||
      (statusFilter === "inactive" && !category.isActive);

    return matchesSearch && matchesStatus;
  });

  const activeCount = categories.filter((item) => item.isActive).length;
  const inactiveCount = categories.length - activeCount;

  function logout() {
    localStorage.removeItem("token");
    navigate("/admin");
  }

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

      {/* Sidebar */}
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

      {/* Main content */}
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
                Store Management / Categories
              </p>
              <h2 className="mt-1 text-base font-bold text-[#0F2942]">
                Categories
              </h2>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Admin workspace
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Page heading */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-md bg-[#D9F4F2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#00696E]">
                <Tags size={13} />
                Catalogue Management
              </span>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F2942] sm:text-3xl">
                Categories Master
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Organise and manage the categories available in your store.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#193D5C]"
            >
              <Plus size={18} />
              Add Category
            </button>
          </section>

          {/* Statistics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Total Categories
                </p>
                <div className="rounded-lg bg-blue-50 p-2.5 text-[#0F2942]">
                  <FolderOpen size={20} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-[#0F2942]">
                {loading ? "—" : categories.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                All store categories
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Active Categories
                </p>
                <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-[#0F2942]">
                {loading ? "—" : activeCount}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Currently active
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Inactive Categories
                </p>
                <div className="rounded-lg bg-orange-50 p-2.5 text-[#E96B43]">
                  <Tags size={20} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-[#0F2942]">
                {loading ? "—" : inactiveCount}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Hidden or disabled
              </p>
            </div>
          </section>

          {/* Category table */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h3 className="font-bold text-[#0F2942]">
                  All Categories
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  View, edit and control category visibility.
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
                    placeholder="Search categories..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#008A90] sm:w-56"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-[#008A90]"
                  aria-label="Filter categories by status"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-[#F8FAFC]">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Category
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Description
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-16 text-center text-sm text-slate-500"
                      >
                        Loading categories...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <FolderOpen size={23} />
                        </div>
                        <p className="mt-3 font-semibold text-[#0F2942]">
                          {categories.length === 0
                            ? "No categories yet"
                            : "No matching categories"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {categories.length === 0
                            ? "Add your first category to get started."
                            : "Try another search or status filter."}
                        </p>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredCategories.map((category) => (
                      <tr
                        key={category.id}
                        className="transition hover:bg-[#F8FAFC]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                              {category.image ? (
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon
                                  size={20}
                                  className="text-slate-300"
                                />
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-[#0F2942]">
                                {category.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                ID: {category.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-xs px-6 py-4">
                          <p className="line-clamp-2 text-sm leading-5 text-slate-500">
                            {category.description || "No description added"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => void handleToggleStatus(category)}
                            title="Click to change status"
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                              category.isActive
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                category.isActive
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {category.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditCategory(category)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#0F2942] transition hover:border-[#008A90] hover:bg-teal-50"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={deletingId === category.id}
                              onClick={() =>
                                void handleDeleteCategory(category.id)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              {deletingId === category.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {filteredCategories.length} of {categories.length}{" "}
                categories
              </p>
              <p>LIVEAZY Catalogue Management</p>
            </div>
          </section>
        </main>
      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#0F2942]/50 p-4 backdrop-blur-sm">
          <div className="my-auto flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#008A90]">
                  Category Management
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-[#0F2942]">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingCategory
                    ? "Update the category details below."
                    : "Enter the details for your new category."}
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
                  htmlFor="category-name"
                  className="mb-2 block text-sm font-semibold text-[#0F2942]"
                >
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Living Room Furniture"
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-2 block text-sm font-semibold text-[#0F2942]"
                >
                  Description
                </label>
                <textarea
                  id="category-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the category..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#008A90] focus:ring-2 focus:ring-[#008A90]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0F2942]">
                  Category Image
                </label>

                <input
                  ref={fileInputRef}
                  id="category-image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleFileChange(event)}
                  className="hidden"
                />

                <label
                  htmlFor="category-image"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-[#F8FAFC] px-5 py-6 text-center transition hover:border-[#008A90] hover:bg-teal-50/30"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#008A90] shadow-sm">
                    <Upload size={21} />
                  </div>

                  <span className="mt-3 text-sm font-semibold text-[#0F2942]">
                    {uploading ? "Uploading image..." : "Click to upload image"}
                  </span>
                  <span className="mt-1 text-xs text-slate-400">
                    JPG, PNG or WebP · Maximum 5 MB
                  </span>
                </label>

                {image && (
                  <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-200 p-3">
                    <img
                      src={image}
                      alt="Category preview"
                      className="h-20 w-20 rounded-lg border border-slate-100 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0F2942]">
                        Image preview
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-400">
                        Image uploaded successfully
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
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <div>
                  <p className="text-sm font-semibold text-[#0F2942]">
                    Active Category
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Enable this category for your store.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-5 w-5 accent-[#008A90]"
                />
              </label>
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
                onClick={() =>
                  void (editingCategory
                    ? handleUpdateCategory()
                    : handleAddCategory())
                }
                disabled={saving || uploading || !name.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#193D5C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <Plus size={16} />
                    {editingCategory ? "Save Changes" : "Create Category"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
