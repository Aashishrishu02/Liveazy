import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Check,
  X,
  Flame,
  Clock,
  Layers,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { getApiBaseUrl } from "../utils/api";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import ImageUpload from "../components/ImageUpload";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string | null;
}

interface DealProductItem {
  id: string;
  productId: string;
  sortOrder: number;
  product: Product;
}

interface Deal {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  originalPrice: number;
  offerPrice: number;
  discountPercent?: number | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  sortOrder: number;
  products: DealProductItem[];
}

export default function DealsAdmin() {
  const navigate = useNavigate();
  const apiBase = getApiBaseUrl();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
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

      const [dealsRes, productsRes] = await Promise.all([
        fetch(`${apiBase}/deals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBase}/products`),
      ]);

      if (!dealsRes.ok) {
        if (dealsRes.status === 401 || dealsRes.status === 403) {
          navigate("/admin");
          return;
        }
        throw new Error("Failed to load deals");
      }

      const dealsData = await dealsRes.json();
      setDeals(Array.isArray(dealsData) ? dealsData : []);

      if (productsRes.ok) {
        const prodData = await productsRes.json();
        const list = Array.isArray(prodData)
          ? prodData
          : prodData && typeof prodData === "object" && "data" in prodData
          ? (prodData as { data: Product[] }).data
          : [];
        setAllProducts(list);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setDescription("");
    setImage("");
    setOriginalPrice(0);
    setOfferPrice(0);
    setDiscountPercent(0);

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setStartsAt(now.toISOString().slice(0, 16));
    setEndsAt(nextWeek.toISOString().slice(0, 16));

    setIsActive(true);
    setSortOrder(deals.length);
    setSelectedProductIds([]);
    setProductSearch("");
    setModalOpen(true);
  };

  const openEditModal = (deal: Deal) => {
    setEditingId(deal.id);
    setTitle(deal.title);
    setSubtitle(deal.subtitle || "");
    setDescription(deal.description || "");
    setImage(deal.image || "");
    setOriginalPrice(deal.originalPrice);
    setOfferPrice(deal.offerPrice);
    setDiscountPercent(deal.discountPercent || 0);
    setStartsAt(deal.startsAt ? new Date(deal.startsAt).toISOString().slice(0, 16) : "");
    setEndsAt(deal.endsAt ? new Date(deal.endsAt).toISOString().slice(0, 16) : "");
    setIsActive(deal.isActive);
    setSortOrder(deal.sortOrder);
    setSelectedProductIds(deal.products.map((p) => p.productId));
    setProductSearch("");
    setModalOpen(true);
  };

  useEffect(() => {
    if (originalPrice > 0 && offerPrice > 0 && originalPrice > offerPrice) {
      setDiscountPercent(Math.round(((originalPrice - offerPrice) / originalPrice) * 100));
    }
  }, [originalPrice, offerPrice]);

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];

      const sum = allProducts
        .filter((p) => next.includes(p.id))
        .reduce((acc, p) => acc + (Number(p.price) || 0), 0);

      if (sum > 0 && originalPrice === 0) {
        setOriginalPrice(sum);
      }
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || offerPrice <= 0 || !startsAt || !endsAt) {
      setError("Please fill in title, offer price, start time and end time.");
      return;
    }

    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("Deal end date/time must be after start date/time.");
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      setSaving(true);
      setError(null);

      const body = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        image: image.trim() || undefined,
        originalPrice: Number(originalPrice) || Number(offerPrice),
        offerPrice: Number(offerPrice),
        discountPercent: Number(discountPercent) || 0,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive,
        sortOrder: Number(sortOrder) || 0,
        productIds: selectedProductIds,
      };

      const url = editingId ? `${apiBase}/deals/${editingId}` : `${apiBase}/deals`;
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
        throw new Error(errJson.message || "Failed to save deal");
      }

      setSuccess(`Deal "${title}" saved successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      setModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving deal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, dealTitle: string) => {
    if (!window.confirm(`Delete deal "${dealTitle}"?`)) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/deals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete deal");

      setSuccess(`Deal "${dealTitle}" deleted`);
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deleting deal");
    }
  };

  const getDealStatus = (deal: Deal) => {
    const now = new Date().getTime();
    const start = new Date(deal.startsAt).getTime();
    const end = new Date(deal.endsAt).getTime();

    if (!deal.isActive) return { label: "INACTIVE", color: "bg-gray-100 text-gray-700" };
    if (now < start) return { label: "UPCOMING", color: "bg-blue-100 text-blue-800" };
    if (now > end) return { label: "EXPIRED", color: "bg-red-100 text-red-800" };
    return { label: "ACTIVE NOW", color: "bg-emerald-100 text-emerald-800 font-bold" };
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [allProducts, productSearch]);

  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-[260px]">
        <AdminHeader
          title="This Week Deals Master"
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
                <span>Schedule New Deal</span>
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
          {loading && deals.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-[#0F2942]" />
            </div>
          ) : deals.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Flame size={40} className="mx-auto text-orange-400 mb-3" />
              <h3 className="text-base font-bold text-gray-900">No Scheduled Deals</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Schedule deals with start and end times. Deals automatically activate and expire on schedule.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0F2942] px-4 py-2 text-xs font-bold text-white hover:bg-[#193D5C] transition"
              >
                <Plus size={15} />
                <span>Create First Deal</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => {
                const status = getDealStatus(deal);
                return (
                  <div
                    key={deal.id}
                    className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
                  >
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      {deal.image ? (
                        <img src={deal.image} alt={deal.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <Flame size={36} />
                        </div>
                      )}
                      {deal.discountPercent && deal.discountPercent > 0 ? (
                        <span className="absolute top-3 left-3 rounded-full bg-orange-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm">
                          {deal.discountPercent}% OFF
                        </span>
                      ) : null}
                      <span className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-xs ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
                          <span>Order: #{deal.sortOrder}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 leading-snug">
                          {deal.title}
                        </h3>
                        {deal.subtitle && (
                          <p className="text-xs text-orange-600 font-semibold mt-0.5">
                            {deal.subtitle}
                          </p>
                        )}
                        {deal.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {deal.description}
                          </p>
                        )}

                        {/* Scheduling info */}
                        <div className="mt-3 rounded-xl bg-gray-50 p-2.5 text-[11px] text-gray-600 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-gray-400" />
                            <span>
                              <strong>Starts:</strong> {new Date(deal.startsAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-gray-400" />
                            <span>
                              <strong>Ends:</strong> {new Date(deal.endsAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Products */}
                        {deal.products.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-[11px] font-bold text-gray-500 block mb-1">
                              Featured Products ({deal.products.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {deal.products.map((item) => (
                                <span
                                  key={item.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700"
                                >
                                  <Layers size={11} />
                                  {item.product?.name || "Product"}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <div className="text-lg font-extrabold text-orange-600">
                            ₹{deal.offerPrice.toLocaleString()}
                            <span className="text-xs font-normal text-gray-500">/mo</span>
                          </div>
                          {deal.originalPrice > deal.offerPrice && (
                            <div className="text-xs text-gray-400 line-through">
                              ₹{deal.originalPrice.toLocaleString()}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(deal)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(deal.id, deal.title)}
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">
                {editingId ? "Edit Scheduled Deal" : "Schedule New Deal"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Deal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Flash Weekend Special"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Subtitle / Badge
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Save 35% on Study Room & Workstations"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Limited-period flash offer with free delivery and zero security deposit."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div>
                <ImageUpload
                  label="Deal Promotional Artwork"
                  value={image}
                  onChange={setImage}
                  folder="deals"
                  helperText="Upload the deal artwork from your device (JPG, PNG, WEBP, max 5 MB)"
                />
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Start Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    End Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={originalPrice || ""}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Offer Price (₹/mo) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={offerPrice || ""}
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Discount (% Off)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent || ""}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <span>Active Status</span>
                  </label>
                </div>
              </div>

              {/* Products selector */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700">
                    Select Products in this Deal ({selectedProductIds.length})
                  </label>
                  <div className="relative w-48">
                    <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 pl-8 pr-2 py-1 text-[11px] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {filteredProducts.map((p) => {
                    const selected = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        className={`flex items-center justify-between p-2.5 cursor-pointer text-xs transition ${
                          selected ? "bg-orange-50/80" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {}}
                            className="rounded text-orange-600"
                          />
                          <span className="font-semibold text-gray-900">{p.name}</span>
                        </div>
                        <span className="text-gray-500 font-medium">₹{p.price}</span>
                      </div>
                    );
                  })}
                </div>
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
                  {saving ? "Saving..." : editingId ? "Update Deal" : "Save & Schedule Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
