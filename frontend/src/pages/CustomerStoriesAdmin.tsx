import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Check,
  X,
  MessageSquareQuote,
  Star,
  MapPin,
  Video,
  AlertCircle,
  CheckCircle2,
  CircleSlash,
  ChevronDown,
} from "lucide-react";
import { getApiBaseUrl } from "../utils/api";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import ImageUpload from "../components/ImageUpload";

interface CustomerStory {
  id: string;
  customerName: string;
  photo?: string | null;
  story: string;
  location?: string | null;
  videoUrl?: string | null;
  rating: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

type StatusFilter = "all" | "active" | "inactive";
type RatingFilter = "all" | "5" | "4" | "3_below";
type SortOption = "order" | "rating_desc" | "newest";

export default function CustomerStoriesAdmin() {
  const navigate = useNavigate();
  const apiBase = getApiBaseUrl();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stories, setStories] = useState<CustomerStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("order");

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [photo, setPhoto] = useState("");
  const [story, setStory] = useState("");
  const [location, setLocation] = useState("Pune");
  const [videoUrl, setVideoUrl] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      navigate("/admin");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${apiBase}/customer-stories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          navigate("/admin");
          return;
        }
        throw new Error("Failed to load customer stories");
      }

      const data = await res.json();
      setStories(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading stories");
    } finally {
      setLoading(false);
    }
  }, [apiBase, navigate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingId(null);
    setCustomerName("");
    setPhoto("");
    setStory("");
    setLocation("Pune");
    setVideoUrl("");
    setRating(5);
    setSortOrder(stories.length);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (st: CustomerStory) => {
    setEditingId(st.id);
    setCustomerName(st.customerName);
    setPhoto(st.photo || "");
    setStory(st.story);
    setLocation(st.location || "Pune");
    setVideoUrl(st.videoUrl || "");
    setRating(st.rating);
    setSortOrder(st.sortOrder);
    setIsActive(st.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !story.trim()) {
      setError("Please provide both a customer name and their review testimonial.");
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      setSaving(true);
      setError(null);

      const body = {
        customerName: customerName.trim(),
        photo: photo.trim() || null,
        story: story.trim(),
        location: location.trim() || "Pune",
        videoUrl: videoUrl.trim() || null,
        rating: Number(rating) || 5,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      };

      const url = editingId
        ? `${apiBase}/customer-stories/${editingId}`
        : `${apiBase}/customer-stories`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to save customer story");
      }

      setSuccess(`Story from "${customerName}" saved successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      setModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving story");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the story from "${name}"?`)) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/customer-stories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete story");

      setSuccess("Story deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deleting story");
    }
  };

  const handleToggleActive = async (st: CustomerStory) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/customer-stories/${st.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !st.isActive }),
      });

      if (!res.ok) throw new Error("Failed to toggle status");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating story status");
    }
  };

  // Statistics (Matching Categories.tsx design)
  const activeCount = useMemo(() => stories.filter((s) => s.isActive).length, [stories]);
  const inactiveCount = useMemo(() => stories.length - activeCount, [stories]);
  const fiveStarCount = useMemo(() => stories.filter((s) => s.rating === 5).length, [stories]);

  // Filtering & Sorting
  const filteredStories = useMemo(() => {
    const q = search.trim().toLowerCase();

    return stories
      .filter((st) => {
        const matchesSearch =
          !q ||
          st.customerName.toLowerCase().includes(q) ||
          (st.location && st.location.toLowerCase().includes(q)) ||
          st.story.toLowerCase().includes(q);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && st.isActive) ||
          (statusFilter === "inactive" && !st.isActive);

        let matchesRating = true;
        if (ratingFilter === "5") matchesRating = st.rating === 5;
        else if (ratingFilter === "4") matchesRating = st.rating === 4;
        else if (ratingFilter === "3_below") matchesRating = st.rating <= 3;

        return matchesSearch && matchesStatus && matchesRating;
      })
      .sort((a, b) => {
        if (sortOption === "rating_desc") return b.rating - a.rating;
        if (sortOption === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return a.sortOrder - b.sortOrder;
      });
  }, [stories, search, statusFilter, ratingFilter, sortOption]);

  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main page */}
      <div className="min-h-screen lg:pl-[260px]">
        {/* Global Admin Header */}
        <AdminHeader
          title="Customer Stories Master"
          onOpenSidebar={() => setSidebarOpen(true)}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search customer stories by name, location, or quotes..."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#082C45] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#164662]"
              >
                <Plus size={16} />
                <span>New Customer Story</span>
              </button>
            </div>
          }
        />

        <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Breadcrumb & Heading Section matching Categories.tsx */}
          <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <span>Admin</span>
                <span>/</span>
                <span className="text-teal-700">Customer Operations</span>
                <span>/</span>
                <span className="text-[#0F2942]">Customer Stories</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2942] sm:text-4xl">
                Customer Stories
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage customer experiences and testimonials.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-2 text-xs font-semibold text-teal-800">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                System operational · Stories synced
              </span>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#082C45] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#164662]"
              >
                <Plus size={18} />
                Add Customer Story
              </button>
            </div>
          </section>

          {/* Feedback Banners */}
          {error && (
            <div role="status" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span className="flex-1 break-words">{error}</span>
              <button type="button" aria-label="Dismiss error" onClick={() => setError(null)}>
                <X size={16} />
              </button>
            </div>
          )}

          {success && (
            <div role="status" className="flex items-start gap-2 rounded-xl border border-teal-100 bg-white p-3 text-sm text-teal-800 shadow-xs">
              <CheckCircle2 size={18} className="mt-0.5 text-teal-600 shrink-0" />
              <span className="flex-1 break-words font-medium">{success}</span>
              <button type="button" aria-label="Dismiss message" onClick={() => setSuccess(null)}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Statistics Section (4 Cards matching Categories.tsx design) */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {[
              {
                label: "Total Stories",
                value: stories.length,
                detail: "All customer testimonials",
                icon: MessageSquareQuote,
                theme: "bg-indigo-50 text-[#0F2942]",
                bar: "bg-[#087477]",
                percentage: 100,
              },
              {
                label: "Published Stories",
                value: activeCount,
                detail: "Live on storefront reviews",
                icon: CheckCircle2,
                theme: "bg-cyan-100 text-teal-700",
                bar: "bg-teal-700",
                percentage: stories.length ? (activeCount / stories.length) * 100 : 0,
              },
              {
                label: "Draft / Inactive",
                value: inactiveCount,
                detail: "Hidden from customer view",
                icon: CircleSlash,
                theme: "bg-orange-100 text-orange-600",
                bar: "bg-[#FF6A3D]",
                percentage: stories.length ? (inactiveCount / stories.length) * 100 : 0,
              },
              {
                label: "Top Rated (5-Star)",
                value: fiveStarCount,
                detail: "5.0-star verified experiences",
                icon: Star,
                theme: "bg-amber-100 text-amber-700",
                bar: "bg-amber-500",
                percentage: stories.length ? (fiveStarCount / stories.length) * 100 : 0,
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <article key={stat.label} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      {stat.label}
                    </p>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.theme}`}>
                      <Icon size={18} />
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <p className="text-3xl font-extrabold tracking-tight text-[#101F32]">
                      {loading ? "—" : stat.value}
                    </p>
                    <p className="pb-1 text-[11px] text-slate-500">{stat.detail}</p>
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${stat.bar} transition-all duration-300`}
                      style={{ width: `${loading ? 0 : stat.percentage}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </section>

          {/* Directory Toolbar & Cards Grid */}
          <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            {/* Toolbar Header */}
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F2942]">Customer Stories Directory</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Manage real customer quotes, locations, ratings, and video stories shown on the homepage.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      aria-label="Filter by story status"
                      className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-teal-500"
                    >
                      <option value="all">All Statuses ({stories.length})</option>
                      <option value="active">Active Only ({activeCount})</option>
                      <option value="inactive">Inactive Only ({inactiveCount})</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Rating Filter */}
                  <div className="relative">
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}
                      aria-label="Filter by rating"
                      className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-teal-500"
                    >
                      <option value="all">All Ratings</option>
                      <option value="5">5 Stars ({fiveStarCount})</option>
                      <option value="4">4 Stars</option>
                      <option value="3_below">3 Stars & Below</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Sort Order */}
                  <div className="relative">
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      aria-label="Sort customer stories"
                      className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-teal-500"
                    >
                      <option value="order">Display Order</option>
                      <option value="rating_desc">Highest Rating</option>
                      <option value="newest">Newest First</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Search bar inside container */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter stories by customer name, location, or quotes..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Content: Loading, Empty, or Cards Grid */}
            <div className="p-4 sm:p-6">
              {loading && stories.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw size={24} className="animate-spin text-[#0F2942]" />
                </div>
              ) : filteredStories.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <MessageSquareQuote size={40} className="mx-auto text-slate-400 mb-3" />
                  <h3 className="text-base font-bold text-slate-900">
                    {search || statusFilter !== "all" || ratingFilter !== "all"
                      ? "No matching customer stories"
                      : "No Customer Stories Added"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {search || statusFilter !== "all" || ratingFilter !== "all"
                      ? "Try adjusting your search criteria or resetting the filters."
                      : "Add verified customer testimonials with photos, locations, ratings, and video links to display on the homepage."}
                  </p>
                  {search || statusFilter !== "all" || ratingFilter !== "all" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                        setRatingFilter("all");
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Reset Filters
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#082C45] px-4 py-2 text-xs font-bold text-white hover:bg-[#164662] transition"
                    >
                      <Plus size={15} />
                      <span>Add First Story</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredStories.map((st) => (
                    <div
                      key={st.id}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Photo, Name, Location & Status */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            {st.photo ? (
                              <img
                                src={st.photo}
                                alt={st.customerName}
                                className="h-12 w-12 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-[#D9F4F2] text-[#00696E] font-bold text-base flex items-center justify-center">
                                {st.customerName.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div>
                              <h3 className="text-sm font-bold text-[#0F2942] leading-tight">
                                {st.customerName}
                              </h3>
                              {st.location && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                  <MapPin size={11} className="text-teal-600 shrink-0" />
                                  <span>{st.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Active / Inactive Status Pill */}
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(st)}
                            title="Click to toggle publication status"
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-xs transition hover:scale-105 ${
                              st.isActive ? "bg-cyan-100 text-teal-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${st.isActive ? "bg-teal-600" : "bg-slate-400"}`} />
                            {st.isActive ? "Active" : "Inactive"}
                          </button>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i < st.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
                              }
                            />
                          ))}
                          <span className="text-xs font-bold text-slate-700 ml-1">
                            {st.rating}.0
                          </span>
                        </div>

                        {/* Story Quote */}
                        <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-4 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          &ldquo;{st.story}&rdquo;
                        </p>

                        {/* Video URL Link if provided */}
                        {st.videoUrl && (
                          <div className="mt-3">
                            <a
                              href={st.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 hover:underline"
                            >
                              <Video size={13} className="text-teal-600" />
                              <span>Watch video review</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">Order: #{st.sortOrder}</span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(st)}
                            title="Edit Story"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-[#D9F4F2] hover:text-[#008A90] hover:border-[#008A90]/40 transition shadow-xs"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(st.id, st.customerName)}
                            title="Delete Story"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shadow-xs"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl my-8 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-base font-extrabold text-[#0F2942]">
                  {editingId ? "Edit Customer Story" : "Add Customer Story"}
                </h3>
                <p className="text-xs text-slate-500">Provide verified customer review details and optional media.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={(e) => void handleSave(e)} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Customer Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Sneha Patel"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Location / City
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Pune, Bangalore, Mumbai"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => setRating(starNum)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          size={22}
                          className={
                            starNum <= rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200 fill-slate-200"
                          }
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {rating} Star{rating > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Review Testimonial Story */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Review / Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="What did the customer say about LIVEAZY furniture quality, delivery, or pricing?..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Customer Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Photo / Avatar
                </label>
                <ImageUpload
                  value={photo}
                  onChange={setPhoto}
                  folder="customer-stories"
                  label="Upload Customer Avatar Photo"
                  helperText="Recommended square photo (e.g. 400x400). Max 5MB."
                />
              </div>

              {/* Video URL & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Video URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="storyActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="storyActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Display on customer website
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#082C45] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#164662] transition disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingId ? "Update Story" : "Save Story"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
