import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Check,
  X,
  MessageSquareQuote,
  Star,
  MapPin,
  Video,
  AlertCircle,
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

export default function CustomerStoriesAdmin() {
  const navigate = useNavigate();
  const apiBase = getApiBaseUrl();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stories, setStories] = useState<CustomerStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const loadData = async () => {
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
  };

  useEffect(() => {
    void loadData();
  }, []);

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
      setError("Please provide customer name and their story/review text.");
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      setSaving(true);
      setError(null);

      const body = {
        customerName: customerName.trim(),
        photo: photo.trim() || undefined,
        story: story.trim(),
        location: location.trim() || "Pune",
        videoUrl: videoUrl.trim() || undefined,
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

      setSuccess(`Story for "${customerName}" saved successfully!`);
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
    if (!window.confirm(`Delete story from "${name}"?`)) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/customer-stories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete story");

      setSuccess(`Story deleted successfully`);
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
      const res = await fetch(`${apiBase}/customer-stories/${st.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !st.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating status");
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-[260px]">
        <AdminHeader
          title="Customer Stories Master"
          onOpenSidebar={() => setSidebarOpen(true)}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2942] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#193D5C] shadow-sm transition"
              >
                <Plus size={15} />
                <span>New Customer Story</span>
              </button>
            </div>
          }
        />

        {error && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <X size={14} />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-b border-green-200 px-6 py-3 text-xs text-green-700 flex items-center gap-2">
            <Check size={16} />
            <span>{success}</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {loading && stories.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-[#0F2942]" />
            </div>
          ) : stories.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <MessageSquareQuote size={40} className="mx-auto text-gray-400 mb-3" />
              <h3 className="text-base font-bold text-gray-900">No Customer Stories Added</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Add curated customer testimonials with photos, locations, ratings, and video links to display on the homepage.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0F2942] px-4 py-2 text-xs font-bold text-white hover:bg-[#193D5C] transition"
              >
                <Plus size={15} />
                <span>Add First Story</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((st) => (
                <div
                  key={st.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Photo, Name, Location & Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {st.photo ? (
                          <img
                            src={st.photo}
                            alt={st.customerName}
                            className="h-12 w-12 rounded-full object-cover border border-[#eee9fa]"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-[#D9F4F2] text-[#0F2942] font-bold text-lg flex items-center justify-center">
                            {st.customerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 leading-tight">
                            {st.customerName}
                          </h3>
                          {st.location && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                              <MapPin size={11} />
                              <span>{st.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleActive(st)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs ${
                          st.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {st.isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < st.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-200"
                          }
                        />
                      ))}
                      <span className="text-xs font-bold text-gray-700 ml-1">
                        {st.rating}.0
                      </span>
                    </div>

                    {/* Story Quote */}
                    <p className="text-xs text-gray-600 leading-relaxed italic line-clamp-4">
                      &ldquo;{st.story}&rdquo;
                    </p>

                    {st.videoUrl && (
                      <a
                        href={st.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0F2942] hover:underline"
                      >
                        <Video size={13} />
                        <span>Watch Customer Video</span>
                      </a>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span>Order: #{st.sortOrder}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(st)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(st.id, st.customerName)}
                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">
                {editingId ? "Edit Customer Story" : "Add Customer Story"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rohini Deshmukh"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Pune (Kharadi)"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <ImageUpload
                  label="Customer Photo / Avatar"
                  value={photo}
                  onChange={setPhoto}
                  folder="customer-stories"
                  aspectRatio="square"
                  helperText="Upload customer portrait or photo from device (JPG, PNG, WEBP, max 5 MB)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Customer Story / Quote *
                </label>
                <textarea
                  rows={4}
                  required
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Share their real experience with LIVEAZY rental delivery, furniture condition, and customer care..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Rating (1 - 5)
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  >
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★☆</option>
                    <option value={3}>3 Stars ★★★☆☆</option>
                    <option value={2}>2 Stars ★★☆☆☆</option>
                    <option value={1}>1 Star ★☆☆☆☆</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-[#0F2942]"
                    />
                    <span>Active Story</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Customer Video URL (Optional)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#0F2942] px-5 py-2 text-xs font-bold text-white hover:bg-[#193D5C] transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Story" : "Save Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
