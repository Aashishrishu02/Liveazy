import { useCallback, useEffect, useMemo, useState } from "react";
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
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Menu,
  RefreshCw,
  ExternalLink,
  Contact,
  MessageSquareText,
  Star,
  CalendarDays,
  Archive,
  Send,
  Save,
} from "lucide-react";
import BlogEditor from "../components/BlogEditor";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type StatusFilter = "ALL" | BlogStatus;

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  imageAlt?: string | null;
  category: string;
  tags: string[];
  authorName: string;
  status: BlogStatus;
  featured: boolean;
  publishedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BlogForm {
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  imageAlt: string;
  category: string;
  tags: string;
  authorName: string;
  status: BlogStatus;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
}

const EMPTY_FORM: BlogForm = {
  title: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  imageAlt: "",
  category: "",
  tags: "",
  authorName: "LIVEAZY Team",
  status: "DRAFT",
  featured: false,
  metaTitle: "",
  metaDescription: "",
};

const navigation = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
  { label: "Contact Management", path: "/admin/contact-management", icon: Contact },
  { label: "Feedback Master", path: "/admin/feedback", icon: MessageSquareText },
  { label: "Trending Rentals", path: "/admin/trending-rentals", icon: Star },
  { label: "Blog Management", path: "/admin/blogs", icon: FileText },
];

const statusStyle: Record<BlogStatus, string> = {
  DRAFT: "bg-orange-100 text-orange-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-600",
};

function AdminAvatar() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-teal-700">
      <span className="text-[10px] font-extrabold">SA</span>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Not published";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Blogs() {
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogForm>(EMPTY_FORM);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  const showNotice = (message: string, isError = false) => {
    setNotice(message);
    setNoticeError(isError);
  };

  const getToken = () => localStorage.getItem("token");

  const loadBlogs = useCallback(async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/admin");
        return;
      }

      const response = await fetch(`${API_URL}/blogs/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/admin");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "Unable to load blogs.",
        );
      }

      setBlogs(Array.isArray(data) ? data : data.blogs || []);
    } catch (error) {
      console.error("Blog loading error:", error);
      showNotice(
        error instanceof Error ? error.message : "Unable to load blogs.",
        true,
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadBlogs();
  }, [loadBlogs]);

  const updateField = <K extends keyof BlogForm>(
    key: K,
    value: BlogForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    showNotice("");
  };

  const openEdit = (blog: Blog) => {
    setEditingId(blog.id);

    setForm({
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      featuredImage: blog.featuredImage || "",
      imageAlt: blog.imageAlt || "",
      category: blog.category || "",
      tags: (blog.tags || []).join(", "),
      authorName: blog.authorName || "LIVEAZY Team",
      status: blog.status,
      featured: blog.featured,
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || "",
    });

    setShowForm(true);
    showNotice("");
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    showNotice("");
  };

  const saveBlog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    showNotice("");

    if (!getToken()) {
      navigate("/admin");
      return;
    }

    if (!form.content.trim() || form.content === "<p></p>") {
      showNotice("Blog content is required.", true);
      return;
    }

    if (!form.featuredImage.trim()) {
      showNotice("Featured image URL is required.", true);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        featuredImage: form.featuredImage.trim(),
        imageAlt: form.imageAlt.trim() || undefined,
        category: form.category.trim(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        authorName: form.authorName.trim() || "LIVEAZY Team",
        status: form.status,
        featured: form.featured,
        metaTitle: form.metaTitle.trim() || undefined,
        metaDescription: form.metaDescription.trim() || undefined,
      };

      const response = await fetch(
        editingId
          ? `${API_URL}/blogs/${editingId}`
          : `${API_URL}/blogs`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Unable to save the blog.",
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);

      showNotice(
        editingId
          ? "Blog updated successfully."
          : "Blog created successfully.",
      );

      await loadBlogs();
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : "Unable to save the blog.",
        true,
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteBlog = async (blog: Blog) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${blog.title}"?`,
    );

    if (!confirmed) return;

    setDeletingId(blog.id);
    showNotice("");

    try {
      const response = await fetch(`${API_URL}/blogs/${blog.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to delete the blog.");
      }

      showNotice("Blog deleted successfully.");
      await loadBlogs();
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : "Unable to delete the blog.",
        true,
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBlogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return blogs.filter((blog) => {
      const matchesStatus = filter === "ALL" || blog.status === filter;

      const matchesSearch =
        !query ||
        blog.title.toLowerCase().includes(query) ||
        blog.category.toLowerCase().includes(query) ||
        blog.slug.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [blogs, filter, search]);

  const countStatus = (status: BlogStatus) =>
    blogs.filter((blog) => blog.status === status).length;

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden"
        />
      )}

      {/* Same sidebar layout as Categories.tsx */}
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
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="mt-3 rounded-lg p-2 hover:bg-slate-200 lg:hidden"
          >
            <X size={18} />
          </button>

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
        {/* Same header as reference pages */}
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
                placeholder="Search blog title, category or slug..."
                className="h-10 w-full rounded-lg border border-transparent bg-[#F0F4FF] pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:border-teal-300 focus:bg-white"
              />
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
              <AdminAvatar />
              <div>
                <p className="text-xs font-bold text-[#0F2942]">Super Admin</p>
                <p className="text-[10px] text-slate-500">LIVEAZY Console</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Page heading */}
          <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <span>Admin</span>
                <span>/</span>
                <span>Content Operations</span>
                <span>/</span>
                <span className="text-teal-700">Blogs</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2942] sm:text-4xl">
                Blog Management
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Create, edit, publish and manage LIVEAZY blog articles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-2 text-xs font-semibold text-teal-800">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                Content Management
              </span>

              <button
                type="button"
                onClick={() => void loadBlogs()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0F2942] transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#082C45] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#164662]"
              >
                <Plus size={18} />
                Create Blog
              </button>
            </div>
          </section>

          {/* Notifications */}
          {notice && (
            <div
              role="status"
              className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                noticeError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-teal-100 bg-white text-[#0F2942]"
              }`}
            >
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
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

          {/* Statistics cards — same style as Categories.tsx */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {[
              {
                label: "Total Blogs",
                value: blogs.length,
                detail: "All articles",
                icon: FileText,
                theme: "bg-indigo-50 text-[#0F2942]",
                bar: "bg-[#087477]",
                percentage: 100,
              },
              {
                label: "Published",
                value: countStatus("PUBLISHED"),
                detail: "Live articles",
                icon: CheckCircle2,
                theme: "bg-cyan-100 text-teal-700",
                bar: "bg-teal-700",
                percentage: blogs.length
                  ? (countStatus("PUBLISHED") / blogs.length) * 100
                  : 0,
              },
              {
                label: "Drafts",
                value: countStatus("DRAFT"),
                detail: "Not published",
                icon: Save,
                theme: "bg-orange-100 text-orange-600",
                bar: "bg-[#FF6A3D]",
                percentage: blogs.length
                  ? (countStatus("DRAFT") / blogs.length) * 100
                  : 0,
              },
              {
                label: "Featured Blogs",
                value: blogs.filter(
                  (blog) => blog.featured && blog.status === "PUBLISHED",
                ).length,
                detail: "Published and featured",
                icon: Star,
                theme: "bg-blue-100 text-blue-700",
                bar: "bg-[#0F2942]",
                percentage: blogs.length
                  ? (blogs.filter(
                      (blog) => blog.featured && blog.status === "PUBLISHED",
                    ).length /
                      blogs.length) *
                    100
                  : 0,
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

          {/* Blog directory */}
          <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F2942]">
                    Blog Directory
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Manage article content, publishing status and SEO details.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filter}
                    onChange={(event) =>
                      setFilter(event.target.value as StatusFilter)
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-teal-500"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => void loadBlogs()}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#0F2942] hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={15}
                      className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["ALL", "All"],
                    ["PUBLISHED", "Published"],
                    ["DRAFT", "Drafts"],
                    ["ARCHIVED", "Archived"],
                  ] as [StatusFilter, string][]
                ).map(([status, label]) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilter(status)}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
                      filter === status
                        ? "bg-[#0F2942] text-white"
                        : "bg-[#F0F4FF] text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {label}
                    <span>{status === "ALL" ? blogs.length : countStatus(status)}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="px-6 py-16 text-center text-sm text-slate-500">
                <RefreshCw size={20} className="mx-auto mb-3 animate-spin" />
                Loading blogs...
              </div>
            )}

            {!loading && filteredBlogs.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <FileText size={23} />
                </div>

                <p className="mt-3 font-semibold text-[#0F2942]">
                  {blogs.length === 0 ? "No blogs yet" : "No matching blogs"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {blogs.length === 0
                    ? "Create your first article to get started."
                    : "Try a different search or status filter."}
                </p>

                {blogs.length === 0 && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#082C45] px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Plus size={16} />
                    Create Blog
                  </button>
                )}
              </div>
            )}

            {!loading && filteredBlogs.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="bg-[#F3F6FE]">
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Media
                      </th>
                      <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Blog &amp; Slug
                      </th>
                      <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Category
                      </th>
                      <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Updated
                      </th>
                      <th className="px-4 py-4 text-right text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredBlogs.map((blog) => (
                      <tr key={blog.id} className="transition hover:bg-[#F8FAFC]">
                        <td className="px-4 py-4">
                          <div className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-[#F3F6FE]">
                            {blog.featuredImage ? (
                              <img
                                src={blog.featuredImage}
                                alt={blog.imageAlt || blog.title}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <ImageIcon size={19} className="text-slate-300" />
                            )}
                          </div>
                        </td>

                        <td className="max-w-[280px] px-4 py-4">
                          <p className="font-bold text-[#0F2942]">
                            {blog.title}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-teal-700">
                            /{blog.slug}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            By {blog.authorName || "LIVEAZY Team"}
                            {blog.featured ? " · Featured" : ""}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex max-w-[150px] truncate rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-[#0F2942]">
                            {blog.category}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${statusStyle[blog.status]}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {blog.status}
                          </span>
                          {blog.status === "PUBLISHED" && blog.publishedAt && (
                            <p className="mt-1.5 text-[10px] text-slate-400">
                              {formatDate(blog.publishedAt)}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                            <CalendarDays size={13} />
                            {formatDate(blog.updatedAt)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {blog.status === "PUBLISHED" && (
                              <button
                                type="button"
                                title="Open public blog"
                                aria-label={`Open ${blog.title}`}
                                onClick={() =>
                                  window.open(
                                    `/blog/${blog.slug}`,
                                    "_blank",
                                    "noopener,noreferrer",
                                  )
                                }
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                              >
                                <ExternalLink size={16} />
                              </button>
                            )}

                            <button
                              type="button"
                              title="Edit blog"
                              aria-label={`Edit ${blog.title}`}
                              onClick={() => openEdit(blog)}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-cyan-50 hover:text-teal-700"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              title="Delete blog"
                              aria-label={`Delete ${blog.title}`}
                              disabled={deletingId === blog.id}
                              onClick={() => void deleteBlog(blog)}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                              {deletingId === blog.id ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-[#F3F6FE] px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
              <p>
                Showing {loading ? 0 : filteredBlogs.length} of {blogs.length} blogs
              </p>
              <p>LIVEAZY Content Management</p>
            </div>
          </section>

          <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} LIVEAZY. Rental Commerce Hub.</p>
            <p>Admin Workspace</p>
          </footer>
        </main>
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#0F2942]/50 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) closeForm();
          }}
        >
          <div className="my-auto flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700">
                  Content Management
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-[#0F2942] sm:text-2xl">
                  {editingId ? "Edit Blog" : "Create New Blog"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Article content, media and SEO settings.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveBlog} className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-5 overflow-y-auto p-5 sm:p-7">
                {notice && (
                  <div
                    role="status"
                    className={`rounded-lg p-3 text-sm ${
                      noticeError
                        ? "bg-red-50 text-red-700"
                        : "bg-teal-50 text-teal-800"
                    }`}
                  >
                    {notice}
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-[#0F2942]">
                      Blog Title <span className="text-red-500">*</span>
                    </span>
                    <input
                      required
                      maxLength={180}
                      value={form.title}
                      onChange={(event) =>
                        updateField("title", event.target.value)
                      }
                      placeholder="Enter blog title"
                      className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-[#0F2942]">
                      Short Excerpt <span className="text-red-500">*</span>
                    </span>
                    <textarea
                      required
                      rows={3}
                      maxLength={500}
                      value={form.excerpt}
                      onChange={(event) =>
                        updateField("excerpt", event.target.value)
                      }
                      placeholder="A short summary for the blog listing..."
                      className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#0F2942]">
                      Category <span className="text-red-500">*</span>
                    </span>
                    <input
                      required
                      value={form.category}
                      onChange={(event) =>
                        updateField("category", event.target.value)
                      }
                      placeholder="Technology, Guides, Cameras..."
                      className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-teal-600"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#0F2942]">
                      Author Name
                    </span>
                    <input
                      value={form.authorName}
                      onChange={(event) =>
                        updateField("authorName", event.target.value)
                      }
                      placeholder="LIVEAZY Team"
                      className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-teal-600"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-[#0F2942]">
                      Tags
                    </span>
                    <input
                      value={form.tags}
                      onChange={(event) =>
                        updateField("tags", event.target.value)
                      }
                      placeholder="renting, cameras, technology (comma-separated)"
                      className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-teal-600"
                    />
                  </label>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[#0F2942]">
                      Featured Image URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="url"
                      value={form.featuredImage}
                      onChange={(event) =>
                        updateField("featuredImage", event.target.value)
                      }
                      placeholder="https://..."
                      className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-teal-600"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Paste the URL of the uploaded featured image here.
                    </p>

                    {form.featuredImage && (
                      <div className="mt-3 flex items-center gap-4 rounded-xl border border-slate-200 p-3">
                        <img
                          src={form.featuredImage}
                          alt={form.imageAlt || "Featured image preview"}
                          className="h-20 w-28 rounded-lg border border-slate-100 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0F2942]">
                            Image Preview
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {form.featuredImage}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-[#0F2942]">
                      Image Alt Text
                    </span>
                    <input
                      value={form.imageAlt}
                      onChange={(event) =>
                        updateField("imageAlt", event.target.value)
                      }
                      placeholder="Describe the featured image"
                      className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-teal-600"
                    />
                  </label>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[#0F2942]">
                      Article Content <span className="text-red-500">*</span>
                    </label>
                    <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
                      <BlogEditor
                        value={form.content}
                        onChange={(content) => updateField("content", content)}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Use the rich text editor to add formatting, images, uploaded videos,
                      and YouTube embeds.
                    </p>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#0F2942]">
                      Publishing Status
                    </span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateField("status", event.target.value as BlogStatus)
                      }
                      className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-teal-600"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(event) =>
                        updateField("featured", event.target.checked)
                      }
                      className="h-4 w-4 accent-teal-700"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#0F2942]">
                        Featured Blog
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Highlight this article.
                      </p>
                    </div>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-[#0F2942]">
                      SEO Meta Title
                    </span>
                    <input
                      maxLength={180}
                      value={form.metaTitle}
                      onChange={(event) =>
                        updateField("metaTitle", event.target.value)
                      }
                      placeholder="Search engine title"
                      className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-teal-600"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-[#0F2942]">
                      SEO Meta Description
                    </span>
                    <textarea
                      rows={3}
                      maxLength={320}
                      value={form.metaDescription}
                      onChange={(event) =>
                        updateField("metaDescription", event.target.value)
                      }
                      placeholder="Description for search engines"
                      className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-[#F8FAFC] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#082C45] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#164662] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : form.status === "PUBLISHED" ? (
                    <>
                      <Send size={16} />
                      {editingId ? "Update & Publish" : "Publish Blog"}
                    </>
                  ) : form.status === "ARCHIVED" ? (
                    <>
                      <Archive size={16} />
                      Save Archived Blog
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingId ? "Save Changes" : "Save Draft"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}