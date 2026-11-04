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
  Package,
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
  category?: { name?: string } | string | null;
}

interface ComboProductItem {
  id: string;
  productId: string;
  sortOrder: number;
  product: Product;
}

interface ComboOffer {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  originalPrice: number;
  specialPrice: number;
  discountPercent?: number | null;
  isActive: boolean;
  sortOrder: number;
  validUntil?: string | null;
  products: ComboProductItem[];
}

export default function ComboOffersAdmin() {
  const navigate = useNavigate();
  const apiBase = getApiBaseUrl();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [specialPrice, setSpecialPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [validUntil, setValidUntil] = useState("");
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

      const [combosRes, productsRes] = await Promise.all([
        fetch(`${apiBase}/combos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBase}/products`),
      ]);

      if (!combosRes.ok) {
        if (combosRes.status === 401 || combosRes.status === 403) {
          navigate("/admin");
          return;
        }
        throw new Error("Failed to load combos");
      }

      const combosData = await combosRes.json();
      setCombos(Array.isArray(combosData) ? combosData : []);

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
    setDescription("");
    setImage("");
    setOriginalPrice(0);
    setSpecialPrice(0);
    setDiscountPercent(0);
    setIsActive(true);
    setSortOrder(combos.length);
    setValidUntil("");
    setSelectedProductIds([]);
    setProductSearch("");
    setModalOpen(true);
  };

  const openEditModal = (combo: ComboOffer) => {
    setEditingId(combo.id);
    setTitle(combo.title);
    setDescription(combo.description || "");
    setImage(combo.image || "");
    setOriginalPrice(combo.originalPrice);
    setSpecialPrice(combo.specialPrice);
    setDiscountPercent(combo.discountPercent || 0);
    setIsActive(combo.isActive);
    setSortOrder(combo.sortOrder);
    setValidUntil(combo.validUntil ? combo.validUntil.split("T")[0] : "");
    setSelectedProductIds(combo.products.map((p) => p.productId));
    setProductSearch("");
    setModalOpen(true);
  };

  // Auto calculate discount when prices change
  useEffect(() => {
    if (originalPrice > 0 && specialPrice > 0 && originalPrice > specialPrice) {
      const calc = Math.round(((originalPrice - specialPrice) / originalPrice) * 100);
      setDiscountPercent(calc);
    }
  }, [originalPrice, specialPrice]);

  // Auto update original price when selecting products if originalPrice was 0
  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];

      // Re-sum prices of chosen products
      const sum = allProducts
        .filter((p) => next.includes(p.id))
        .reduce((acc, p) => acc + (Number(p.price) || 0), 0);

      if (sum > 0) {
        setOriginalPrice(sum);
      }
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || specialPrice <= 0) {
      setError("Please provide a combo title and special rental price.");
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      setSaving(true);
      setError(null);

      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        image: image.trim() || undefined,
        originalPrice: Number(originalPrice) || Number(specialPrice),
        specialPrice: Number(specialPrice),
        discountPercent: Number(discountPercent) || 0,
        isActive,
        sortOrder: Number(sortOrder) || 0,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        productIds: selectedProductIds,
      };

      const url = editingId ? `${apiBase}/combos/${editingId}` : `${apiBase}/combos`;
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
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save combo offer");
      }

      setSuccess(`Combo offer "${title}" saved successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      setModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving combo offer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, comboTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete combo offer "${comboTitle}"?`)) {
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/combos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete combo");

      setSuccess(`Combo offer "${comboTitle}" deleted successfully`);
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deleting combo");
    }
  };

  const handleToggleActive = async (combo: ComboOffer) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/combos/${combo.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !combo.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating status");
    }
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
          title="Combo Offers Master"
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
                <span>New Combo Offer</span>
              </button>
            </div>
          }
        />

        {/* Feedback banners */}
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

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {loading && combos.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-[#0F2942]" />
            </div>
          ) : combos.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Package size={40} className="mx-auto text-gray-400 mb-3" />
              <h3 className="text-base font-bold text-gray-900">No Combo Offers Configured</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Create dedicated room combos or multi-item packages with bundle discounts for customers.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0F2942] px-4 py-2 text-xs font-bold text-white hover:bg-[#193D5C] transition"
              >
                <Plus size={15} />
                <span>Create First Combo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combos.map((combo) => (
                <div
                  key={combo.id}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
                >
                  {/* Image / Header */}
                  <div className="relative h-44 bg-gray-100 overflow-hidden">
                    {combo.image ? (
                      <img
                        src={combo.image}
                        alt={combo.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <Package size={36} />
                      </div>
                    )}
                    {combo.discountPercent && combo.discountPercent > 0 ? (
                      <span className="absolute top-3 left-3 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm">
                        {combo.discountPercent}% OFF
                      </span>
                    ) : null}
                    <button
                      onClick={() => handleToggleActive(combo)}
                      className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-xs ${
                        combo.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {combo.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
                        <span>Order: #{combo.sortOrder}</span>
                        {combo.validUntil && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Calendar size={12} />
                            Valid till {new Date(combo.validUntil).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-gray-900 leading-snug">
                        {combo.title}
                      </h3>
                      {combo.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {combo.description}
                        </p>
                      )}

                      {/* Included products */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-[11px] font-bold text-gray-500 block mb-1.5">
                          Included Products ({combo.products.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {combo.products.map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-center gap-1 rounded-md bg-[#D9F4F2] px-2 py-0.5 text-[11px] font-semibold text-[#0F2942]"
                            >
                              <Layers size={11} />
                              {item.product?.name || "Product"}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Price and actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-extrabold text-[#0F2942]">
                          ₹{combo.specialPrice.toLocaleString()}
                          <span className="text-xs font-normal text-gray-500">/mo</span>
                        </div>
                        {combo.originalPrice > combo.specialPrice && (
                          <div className="text-xs text-gray-400 line-through">
                            ₹{combo.originalPrice.toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(combo)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(combo.id, combo.title)}
                          className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">
                {editingId ? "Edit Combo Offer" : "New Combo Offer"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Combo Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 1BHK Essential Furniture Package"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Includes Queen Bed, Mattress, 3-Seater Sofa, and Study Table"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div>
                <ImageUpload
                  label="Combo Artwork Image"
                  value={image}
                  onChange={setImage}
                  folder="combos"
                  helperText="Upload the main bundle artwork from your device (JPG, PNG, WEBP, max 5 MB)"
                />
              </div>

              {/* Price Grid */}
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
                    placeholder="3499"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Special Rental Price (₹/mo) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={specialPrice || ""}
                    onChange={(e) => setSpecialPrice(Number(e.target.value))}
                    placeholder="2499"
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
                    placeholder="28"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Order & Validity & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Valid Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-[#0F2942] focus:ring-[#0F2942]"
                    />
                    <span>Active on Website</span>
                  </label>
                </div>
              </div>

              {/* Select Existing Products */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700">
                    Select Products in this Combo ({selectedProductIds.length} selected)
                  </label>
                  <div className="relative w-48">
                    <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter products..."
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
                          selected ? "bg-[#D9F4F2]/60" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {}}
                            className="rounded text-[#0F2942]"
                          />
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                              <Package size={14} />
                            </div>
                          )}
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
                  {saving ? "Saving..." : editingId ? "Update Combo" : "Create Combo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
