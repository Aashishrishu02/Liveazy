import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  FolderOpen,
  Menu,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package,
  AlertCircle,
  Download,
  ChevronDown,
  ArrowUpDown,
  CircleSlash,
  Layers3,
  Check,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;

interface Category {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  slug?: string | null;
  displayOrder?: number | null;
  parentId?: string | null;
  _count?: {
    products?: number;
  };
}

type StatusFilter = "all" | "active" | "inactive";
type BulkAction = "" | "activate" | "deactivate" | "delete";

const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

function CategoryStatus({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
        active
          ? "bg-cyan-100 text-teal-800"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-teal-600" : "bg-slate-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function AdminAvatar() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-teal-700">
      <span className="text-[10px] font-extrabold">SA</span>
    </div>
  );
}

export default function Categories() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("");
  const [orderValues, setOrderValues] = useState<Record<string, string>>({});
  const [orderSavingId, setOrderSavingId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(
    null
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(
    null
  );

  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const showNotice = (message: string, error = false) => {
    setNotice(message);
    setNoticeError(error);
  };

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await fetch(`${API_URL}/categories`);

      if (!response.ok) {
        throw new Error(`Failed to fetch categories (${response.status})`);
      }

      const data: unknown = await response.json();
      const parsed = Array.isArray(data) ? (data as Category[]) : [];

      setCategories(parsed);
      setOrderValues(
        Object.fromEntries(
          parsed.map((category, index) => [
            category.id,
            String(category.displayOrder ?? index + 1),
          ]),
        ),
      );

      setSelectedIds((current) =>
        current.filter((id) => parsed.some((category) => category.id === id))
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoadError(
        "Unable to load categories. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  // Form helpers
  const resetForm = () => {
    setName("");
    setDescription("");
    setImage("");
    setIsActive(true);
    setEditingCategory(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openAddModal = () => {
    resetForm();
    showNotice("");
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    resetForm();

    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setImage(category.image || "");
    setIsActive(category.isActive);
    showNotice("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving || uploading) return;

    setShowModal(false);
    resetForm();
    showNotice("");
  };

  // Upload category image
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showNotice("Please select a valid image file.", true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotice("Image size must be less than 5 MB.", true);
      return;
    }

    try {
      setUploading(true);
      showNotice("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed.");
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error("Image URL was not returned.");
      }

      setImage(data.url);
      showNotice("Image uploaded successfully.");
    } catch (error) {
      console.error("Image upload error:", error);
      showNotice(
        getErrorMessage(error, "Failed to upload image. Please try again."),
        true
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Create or update category
  const saveCategory = async () => {
    if (!name.trim()) {
      showNotice("Please enter a category name.", true);
      return;
    }

    const wasEditing = Boolean(editingCategory);

    try {
      setSaving(true);
      showNotice("");

      const payload = {
        name: name.trim(),
        description: description.trim(),
        image: image.trim(),
        isActive,
      };

      const url = editingCategory
        ? `${API_URL}/categories/${editingCategory.id}`
        : `${API_URL}/categories`;

      const response = await fetch(url, {
        method: editingCategory ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to save category.");
      }

      setShowModal(false);
      resetForm();

      showNotice(
        wasEditing
          ? "Category updated successfully."
          : "Category created successfully."
      );

      await fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);

      showNotice(getErrorMessage(error, "Failed to save category."), true);
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (category: Category) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(category.id);
      showNotice("");

      const response = await fetch(`${API_URL}/categories/${category.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          response.status === 409
            ? "This category has linked products. Move or remove those products first."
            : "Failed to delete category."
        );
      }

      setSelectedIds((current) =>
        current.filter((id) => id !== category.id)
      );

      showNotice("Category deleted successfully.");
      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);

      showNotice(
        getErrorMessage(error, "Unable to delete this category."),
        true
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Activate or deactivate one category
  const handleToggleStatus = async (category: Category) => {
    try {
      setStatusUpdatingId(category.id);
      showNotice("");

      const response = await fetch(`${API_URL}/categories/${category.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !category.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update category status.");
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? { ...item, isActive: !item.isActive }
            : item
        )
      );

      showNotice("Category status updated.");
    } catch (error) {
      console.error("Error updating status:", error);
      showNotice("Failed to update category status.", true);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Save the category's display order
  const handleSaveOrder = async (category: Category) => {
    const rawValue = orderValues[category.id] ?? String(category.displayOrder ?? 1);
    const value = Number(rawValue);

    if (!rawValue.trim() || !Number.isSafeInteger(value) || value < 1) {
      showNotice("Display order must be a whole number greater than 0.", true);
      return;
    }

    try {
      setOrderSavingId(category.id);
      showNotice("");

      const response = await fetch(`${API_URL}/categories/${category.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayOrder: value }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to save category order.");
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? { ...item, displayOrder: value } : item,
        ),
      );
      setOrderValues((current) => ({
        ...current,
        [category.id]: String(value),
      }));
      showNotice(`Display order saved for ${category.name}.`);
    } catch (error) {
      console.error("Error saving category order:", error);
      showNotice(getErrorMessage(error, "Failed to save category order."), true);
    } finally {
      setOrderSavingId(null);
    }
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    const selected = categories.filter((category) =>
      selectedIds.includes(category.id)
    );

    if (
      bulkAction === "delete" &&
      !window.confirm(
        `Delete ${selected.length} selected categories? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      showNotice("");

      let completed = 0;
      const failures: string[] = [];

      for (const category of selected) {
        try {
          if (bulkAction === "delete") {
            const response = await fetch(
              `${API_URL}/categories/${category.id}`,
              { method: "DELETE" }
            );

            if (!response.ok) {
              throw new Error(
                response.status === 409
                  ? "has linked products"
                  : "could not be deleted"
              );
            }
          } else {
            const nextIsActive = bulkAction === "activate";

            if (category.isActive !== nextIsActive) {
              const response = await fetch(
                `${API_URL}/categories/${category.id}`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ isActive: nextIsActive }),
                }
              );

              if (!response.ok) {
                throw new Error("status update failed");
              }
            }
          }

          completed += 1;
        } catch (error) {
          failures.push(
            `${category.name}: ${getErrorMessage(error, "failed")}`
          );
        }
      }

      setSelectedIds([]);
      setBulkAction("");

      await fetchCategories();

      if (failures.length) {
        showNotice(
          `${completed} item(s) updated. ${failures.length} failed: ${failures
            .slice(0, 2)
            .join("; ")}`,
          true
        );
      } else {
        showNotice(
          `${completed} categor${
            completed === 1 ? "y" : "ies"
          } ${
            bulkAction === "delete" ? "deleted" : "updated"
          } successfully.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Search, status filtering and sorting
  const activeCount = categories.filter(
    (category) => category.isActive
  ).length;

  const inactiveCount = categories.length - activeCount;

  const productAssignments = categories.reduce(
    (sum, category) => sum + (category._count?.products ?? 0),
    0
  );

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories
      .filter((category) => {
        const searchableValues = [
          category.name,
          category.slug || slugify(category.name),
          category.description || "",
          category.id,
        ];

        const matchesSearch =
          !query ||
          searchableValues.some((value) =>
            value.toLowerCase().includes(query)
          );

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && category.isActive) ||
          (statusFilter === "inactive" && !category.isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const order =
          (a.displayOrder ?? 0) - (b.displayOrder ?? 0);

        const byName = a.name.localeCompare(b.name);
        const result = order !== 0 ? order : byName;

        return sortOrder === "asc" ? result : -result;
      });
  }, [categories, search, statusFilter, sortOrder]);

  // Export CSV
  const exportCategories = () => {
    const rows = [
      [
        "Name",
        "Slug",
        "Description",
        "Products",
        "Status",
        "Display Order",
        "ID",
      ],
      ...filteredCategories.map((category, index) => [
        category.name,
        category.slug || slugify(category.name),
        category.description || "",
        String(category._count?.products ?? 0),
        category.isActive ? "Active" : "Inactive",
        String(category.displayOrder ?? index + 1),
        category.id,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "liveazy-categories.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedCategories = filteredCategories.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const currentPageIds = paginatedCategories.map(
    (category) => category.id
  );

  const allCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.includes(id));

  const toggleCurrentPage = () => {
    setSelectedIds((current) =>
      allCurrentPageSelected
        ? current.filter((id) => !currentPageIds.includes(id))
        : Array.from(new Set([...current, ...currentPageIds]))
    );
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden"
        />
      )}

      {/* Admin sidebar - same as other pages */}
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
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#0F2942]">
                LIVEAZY
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Rental Commerce Hub
              </p>
            </div>

            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
              className="ml-auto rounded-lg p-2 hover:bg-slate-200 lg:hidden"
            >
              <X size={18} />
            </button>
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
            onClick={() => setSidebarOpen(false)}
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

      {/* Main page */}
      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="relative max-w-[540px] flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products, categories, SKU, customer inquiries"
                className="h-10 w-full rounded-lg border border-transparent bg-[#F0F4FF] pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:border-teal-300 focus:bg-white"
              />
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
              <AdminAvatar />
              <div>
                <p className="text-xs font-bold text-[#0F2942]">
                  Super Admin
                </p>
                <p className="text-[10px] text-slate-500">
                  admin@liveazy.in
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Heading */}
          <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <span>Admin</span>
                <span>/</span>
                <span className="text-teal-700">Catalog Operations</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2942] sm:text-4xl">
                Manage Categories
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Organise, search and manage your store categories.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-2 text-xs font-semibold text-teal-800">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                System operational · Catalog synced
              </span>

              <button
                type="button"
                onClick={exportCategories}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-slate-50"
              >
                <Download size={16} />
                Export Categories
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#082C45] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#164662]"
              >
                <Plus size={18} />
                Add Category
              </button>
            </div>
          </section>

          {/* Notifications */}
          {notice && !showModal && (
            <div
              role="status"
              className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                noticeError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-teal-100 bg-white text-[#0F2942]"
              }`}
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span className="flex-1 break-words">{notice}</span>
              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => showNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Statistics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {[
              {
                label: "Total Categories",
                value: categories.length,
                detail: "All store categories",
                icon: FolderOpen,
                theme: "bg-indigo-50 text-[#0F2942]",
                bar: "bg-[#087477]",
                percentage: 100,
              },
              {
                label: "Active Categories",
                value: activeCount,
                detail: "Visible on storefront",
                icon: CheckCircle2,
                theme: "bg-cyan-100 text-teal-700",
                bar: "bg-teal-700",
                percentage: categories.length
                  ? (activeCount / categories.length) * 100
                  : 0,
              },
              {
                label: "Inactive / Draft",
                value: inactiveCount,
                detail: "Hidden from navigation",
                icon: CircleSlash,
                theme: "bg-orange-100 text-orange-600",
                bar: "bg-[#FF6A3D]",
                percentage: categories.length
                  ? (inactiveCount / categories.length) * 100
                  : 0,
              },
              {
                label: "Product Assignments",
                value: productAssignments,
                detail: "Products linked to categories",
                icon: Layers3,
                theme: "bg-blue-100 text-blue-700",
                bar: "bg-[#0F2942]",
                percentage: Math.min(100, productAssignments),
              },
            ].map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      {stat.label}
                    </p>

                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.theme}`}
                    >
                      <Icon size={18} />
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <p className="text-3xl font-extrabold tracking-tight text-[#101F32]">
                      {loading ? "—" : stat.value}
                    </p>
                    <p className="pb-1 text-[11px] text-slate-500">
                      {stat.detail}
                    </p>
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${stat.bar} transition-all`}
                      style={{
                        width: `${loading ? 0 : stat.percentage}%`,
                      }}
                    />
                  </div>
                </article>
              );
            })}
          </section>

          {/* Categories table */}
          <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F2942]">
                    Category Directory
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Select categories for bulk actions or manage them individually.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <select
                      value={bulkAction}
                      onChange={(event) =>
                        setBulkAction(event.target.value as BulkAction)
                      }
                      disabled={selectedIds.length === 0}
                      className="h-10 min-w-40 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-xs font-semibold text-slate-600 outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      <option value="">
                        Bulk Actions
                        {selectedIds.length ? ` (${selectedIds.length})` : ""}
                      </option>
                      <option value="activate">Mark as Active</option>
                      <option value="deactivate">Mark as Inactive</option>
                      <option value="delete">Delete Selected</option>
                    </select>

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={
                      !bulkAction || selectedIds.length === 0 || loading
                    }
                    onClick={() => void handleBulkAction()}
                    className="h-10 rounded-lg bg-[#082C45] px-4 text-xs font-bold text-white transition hover:bg-[#164662] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Apply
                  </button>

                  <button
                    type="button"
                    onClick={() => void fetchCategories()}
                    disabled={loading}
                    title="Refresh categories"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#0F2942] hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={15}
                      className={loading ? "animate-spin" : ""}
                    />
                    <span className="hidden md:inline">Refresh</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="inline-flex w-fit flex-wrap items-center gap-1 rounded-lg bg-[#F0F4FF] p-1">
                  {(["all", "active", "inactive"] as StatusFilter[]).map(
                    (status) => {
                      const count =
                        status === "all"
                          ? categories.length
                          : status === "active"
                            ? activeCount
                            : inactiveCount;

                      const label =
                        status === "all"
                          ? "All"
                          : status === "active"
                            ? "Active"
                            : "Inactive";

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStatusFilter(status)}
                          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
                            statusFilter === status
                              ? "bg-white text-[#0F2942] shadow-sm"
                              : "text-slate-500 hover:text-[#0F2942]"
                          }`}
                        >
                          {label}
                          <span
                            className={
                              status === "inactive"
                                ? "text-orange-600"
                                : status === "active"
                                  ? "text-teal-700"
                                  : "text-slate-500"
                            }
                          >
                            {count}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <p className="text-xs text-slate-500">
                    {selectedIds.length
                      ? `${selectedIds.length} selected`
                      : "Filter, search or sort categories"}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder((current) =>
                        current === "asc" ? "desc" : "asc"
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowUpDown size={14} />
                    Order: {sortOrder === "asc" ? "Ascending" : "Descending"}
                  </button>
                </div>
              </div>
            </div>

            {loadError && (
              <div className="m-5 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                <p>{loadError}</p>
                <button
                  type="button"
                  onClick={() => void fetchCategories()}
                  className="mt-2 font-bold underline"
                >
                  Try again
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-[#F3F6FE]">
                  <tr className="border-b border-slate-100">
                    <th className="w-12 px-4 py-4">
                      <input
                        aria-label="Select current page categories"
                        type="checkbox"
                        checked={allCurrentPageSelected}
                        onChange={toggleCurrentPage}
                        disabled={paginatedCategories.length === 0}
                        className="h-4 w-4 rounded border-slate-300 accent-teal-700"
                      />
                    </th>

                    <th className="px-3 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Media
                    </th>
                    <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Category &amp; Slug
                    </th>
                    <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Description
                    </th>
                    <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Products
                    </th>
                    <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Display Order
                    </th>
                    <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-4 text-right text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-16 text-center text-sm text-slate-500"
                      >
                        <RefreshCw
                          size={18}
                          className="mx-auto mb-2 animate-spin"
                        />
                        Loading categories...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !loadError &&
                    paginatedCategories.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
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

                          {categories.length === 0 && (
                            <button
                              type="button"
                              onClick={openAddModal}
                              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#082C45] px-4 py-2 text-sm font-semibold text-white"
                            >
                              <Plus size={16} />
                              Add Category
                            </button>
                          )}
                        </td>
                      </tr>
                    )}

                  {!loading &&
                    !loadError &&
                    paginatedCategories.map((category, index) => {
                      const displayOrder =
                        category.displayOrder ?? startIndex + index + 1;

                      return (
                        <tr
                          key={category.id}
                          className={`transition hover:bg-[#F8FAFC] ${
                            !category.isActive ? "bg-slate-50/60" : ""
                          }`}
                        >
                          <td className="px-4 py-4">
                            <input
                              aria-label={`Select ${category.name}`}
                              type="checkbox"
                              checked={selectedIds.includes(category.id)}
                              onChange={() => toggleSelected(category.id)}
                              className="h-4 w-4 rounded border-slate-300 accent-teal-700"
                            />
                          </td>

                          <td className="px-3 py-4">
                            <div
                              className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-[#F3F6FE] ${
                                !category.isActive ? "grayscale" : ""
                              }`}
                            >
                              {category.image ? (
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="h-full w-full object-cover"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <ImageIcon
                                  size={19}
                                  className="text-slate-300"
                                />
                              )}
                            </div>
                          </td>

                          <td className="max-w-[210px] px-4 py-4">
                            <p
                              className={`font-bold ${
                                category.isActive
                                  ? "text-[#0F2942]"
                                  : "text-slate-500"
                              }`}
                            >
                              {category.name}
                            </p>

                            <p className="mt-1 truncate text-[11px] text-teal-700">
                              /{category.slug || slugify(category.name)}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              ID: {category.id.slice(0, 8)}
                            </p>
                          </td>

                          <td className="max-w-[250px] px-4 py-4">
                            <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                              {category.description || "No description added"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-[#0F2942]">
                              <Package size={13} />
                              {category._count?.products ?? 0}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                step={1}
                                aria-label={`Display order for ${category.name}`}
                                value={orderValues[category.id] ?? String(displayOrder)}
                                onChange={(event) =>
                                  setOrderValues((current) => ({
                                    ...current,
                                    [category.id]: event.target.value,
                                  }))
                                }
                                className="h-9 w-16 rounded-md border border-slate-200 px-2 text-sm font-semibold text-[#0F2942] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                              />
                              <button
                                type="button"
                                onClick={() => void handleSaveOrder(category)}
                                disabled={orderSavingId === category.id}
                                title="Save display order"
                                className="inline-flex h-9 items-center gap-1 rounded-md bg-[#0F2942] px-2.5 text-xs font-semibold text-white transition hover:bg-[#193D5C] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {orderSavingId === category.id ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Check size={14} />
                                )}
                                Save
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <button
                              type="button"
                              disabled={statusUpdatingId === category.id}
                              onClick={() => void handleToggleStatus(category)}
                              title="Click to change status"
                              className="disabled:opacity-50"
                            >
                              <CategoryStatus active={category.isActive} />
                            </button>

                            {statusUpdatingId === category.id && (
                              <p className="mt-1 text-[10px] text-slate-400">
                                Updating...
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditCategory(category)}
                                title="Edit category"
                                aria-label={`Edit ${category.name}`}
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-cyan-50 hover:text-teal-700"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                disabled={deletingId === category.id}
                                onClick={() =>
                                  void handleDeleteCategory(category)
                                }
                                title="Delete category"
                                aria-label={`Delete ${category.name}`}
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                              >
                                {deletingId === category.id ? (
                                  <RefreshCw
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#F3F6FE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {filteredCategories.length === 0
                  ? "Showing 0 categories"
                  : `Showing ${startIndex + 1}–${Math.min(
                      startIndex + PAGE_SIZE,
                      filteredCategories.length
                    )} of ${filteredCategories.length} categories`}
                <span className="mx-2 text-slate-300">|</span>
                {PAGE_SIZE} per page
              </p>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setPage((value) => Math.max(1, value - 1))
                  }
                  aria-label="Previous page"
                  className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={17} />
                </button>

                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, index) => {
                    const pageNumber =
                      totalPages <= 5
                        ? index + 1
                        : Math.max(
                            1,
                            Math.min(currentPage - 2, totalPages - 4)
                          ) + index;

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`h-8 min-w-8 rounded-md px-2 text-xs font-bold ${
                          currentPage === pageNumber
                            ? "bg-[#082C45] text-white"
                            : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                )}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  aria-label="Next page"
                  className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </section>

          <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} LIVEAZY. Rental Commerce Hub.</p>
            <p>Admin Workspace</p>
          </footer>
        </main>
      </div>

      {/* Add/Edit Category Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#0F2942]/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="my-auto flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700">
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
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto p-6">
              {notice && (
                <p
                  role="status"
                  className={`rounded-lg p-3 text-sm ${
                    noticeError
                      ? "bg-red-50 text-red-700"
                      : "bg-teal-50 text-teal-800"
                  }`}
                >
                  {notice}
                </p>
              )}

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
                  maxLength={100}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
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
                  placeholder="Describe this category..."
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>

              <div>
                <label
                  htmlFor="category-image"
                  className="mb-2 block text-sm font-semibold text-[#0F2942]"
                >
                  Category Image
                </label>

                <input
                  ref={fileInputRef}
                  id="category-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleImageUpload(file);
                  }}
                  className="hidden"
                />

                <label
                  htmlFor="category-image"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-[#F8FAFC] px-5 py-6 text-center transition hover:border-teal-600 hover:bg-teal-50/30"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                    {uploading ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <Upload size={21} />
                    )}
                  </div>

                  <span className="mt-3 text-sm font-semibold text-[#0F2942]">
                    {uploading
                      ? "Uploading image..."
                      : "Click to upload image"}
                  </span>

                  <span className="mt-1 text-xs text-slate-400">
                    JPG, PNG, GIF or WebP · Maximum 5 MB
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

                      <p className="mt-1 text-xs text-emerald-700">
                        Image URL ready to save
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
                  className="h-5 w-5 accent-teal-700"
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
                onClick={() => void saveCategory()}
                disabled={saving || uploading || !name.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#082C45] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#164662] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} />
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