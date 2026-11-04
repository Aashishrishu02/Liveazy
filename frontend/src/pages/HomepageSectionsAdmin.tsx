import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Info,
} from "lucide-react";
import { getApiBaseUrl } from "../utils/api";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import ImageUpload from "../components/ImageUpload";

interface SectionItem {
  id: string;
  sectionId: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  badge?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface HomepageSection {
  id: string;
  sectionKey: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  description?: string | null;
  sortOrder: number;
  isVisible: boolean;
  items: SectionItem[];
}

export default function HomepageSectionsAdmin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const apiBase = getApiBaseUrl();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active tab: 'overview' or specific sectionKey ('HOW_IT_WORKS', 'VALUE_PROP', 'PREMIUM_PILLARS', 'WHY_RENT', 'RENTAL_GUIDE')
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(() => urlTab || "overview");

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === "overview" ? {} : { tab });
  };

  // Edit Section Modal
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [secTitle, setSecTitle] = useState("");
  const [secSubtitle, setSecSubtitle] = useState("");
  const [secBadge, setSecBadge] = useState("");
  const [secDescription, setSecDescription] = useState("");
  const [savingSec, setSavingSec] = useState(false);

  // Edit/Add Item Modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState<string>("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState("");
  const [itemSubtitle, setItemSubtitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemIcon, setItemIcon] = useState("");
  const [itemBadge, setItemBadge] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [itemSortOrder, setItemSortOrder] = useState<number>(0);
  const [itemIsActive, setItemIsActive] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const loadSections = async () => {
    const token = getToken();
    if (!token) {
      navigate("/admin");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${apiBase}/homepage-sections`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          navigate("/admin");
          return;
        }
        throw new Error("Failed to load sections");
      }

      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
  }, []);

  // Section Ordering handlers
  const moveSection = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    // Reassign sortOrder sequentially
    const updated = newSections.map((sec, idx) => ({
      ...sec,
      sortOrder: idx,
    }));
    setSections(updated);

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/homepage-sections/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sections: updated.map((s) => ({
            id: s.id,
            sortOrder: s.sortOrder,
            isVisible: s.isVisible,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to save reorder");
      setSuccess("Section order saved successfully!");
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving order");
      await loadSections();
    }
  };

  const toggleSectionVisibility = async (sec: HomepageSection) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/homepage-sections/${sec.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVisible: !sec.isVisible }),
      });

      if (!res.ok) throw new Error("Failed to update section visibility");

      setSections((prev) =>
        prev.map((s) => (s.id === sec.id ? { ...s, isVisible: !s.isVisible } : s))
      );
      setSuccess(`Section "${sec.title}" visibility updated`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating visibility");
    }
  };

  // Section details editing
  const openEditSectionModal = (sec: HomepageSection) => {
    setEditingSection(sec);
    setSecTitle(sec.title);
    setSecSubtitle(sec.subtitle || "");
    setSecBadge(sec.badge || "");
    setSecDescription(sec.description || "");
    setSectionModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    const token = getToken();
    if (!token) return;

    try {
      setSavingSec(true);
      const res = await fetch(`${apiBase}/homepage-sections/${editingSection.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: secTitle.trim(),
          subtitle: secSubtitle.trim() || undefined,
          badge: secBadge.trim() || undefined,
          description: secDescription.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save section");

      setSuccess("Section heading updated!");
      setTimeout(() => setSuccess(null), 2500);
      setSectionModalOpen(false);
      await loadSections();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving section");
    } finally {
      setSavingSec(false);
    }
  };

  // Section item handlers
  const openAddItemModal = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    setTargetSectionId(sectionId);
    setEditingItemId(null);
    setItemTitle("");
    setItemSubtitle("");
    setItemDescription("");
    setItemIcon("");
    setItemBadge("");
    setItemImage("");
    setItemSortOrder(sec?.items.length || 0);
    setItemIsActive(true);
    setItemModalOpen(true);
  };

  const openEditItemModal = (sectionId: string, item: SectionItem) => {
    setTargetSectionId(sectionId);
    setEditingItemId(item.id);
    setItemTitle(item.title);
    setItemSubtitle(item.subtitle || "");
    setItemDescription(item.description || "");
    setItemIcon(item.icon || "");
    setItemBadge(item.badge || "");
    setItemImage(item.image || "");
    setItemSortOrder(item.sortOrder);
    setItemIsActive(item.isActive);
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !targetSectionId) return;

    const token = getToken();
    if (!token) return;

    try {
      setSavingItem(true);
      const body = {
        title: itemTitle.trim(),
        subtitle: itemSubtitle.trim() || undefined,
        description: itemDescription.trim() || undefined,
        icon: itemIcon.trim() || undefined,
        badge: itemBadge.trim() || undefined,
        image: itemImage.trim() || undefined,
        sortOrder: Number(itemSortOrder) || 0,
        isActive: itemIsActive,
      };

      const url = editingItemId
        ? `${apiBase}/homepage-sections/${targetSectionId}/items/${editingItemId}`
        : `${apiBase}/homepage-sections/${targetSectionId}/items`;
      const method = editingItemId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save item");

      setSuccess("Section item saved successfully!");
      setTimeout(() => setSuccess(null), 2500);
      setItemModalOpen(false);
      await loadSections();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving item");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (sectionId: string, itemId: string, itemTitleText: string) => {
    if (!window.confirm(`Delete item "${itemTitleText}"?`)) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/homepage-sections/${sectionId}/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete item");

      setSuccess(`Item deleted successfully`);
      setTimeout(() => setSuccess(null), 2500);
      await loadSections();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deleting item");
    }
  };

  const currentTabSection = sections.find((s) => s.sectionKey === activeTab);

  return (
    <div className="min-h-screen bg-[#F6F8FD] text-[#142B43]">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-[260px]">
        <AdminHeader
          title="Homepage Section & Content Management"
          onOpenSidebar={() => setSidebarOpen(true)}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={loadSections}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
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

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
            <button
              type="button"
              onClick={() => handleSelectTab("overview")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shadow-2xs ${
                activeTab === "overview"
                  ? "bg-[#0F2942] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Section Order &amp; Visibility
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab("HOW_IT_WORKS")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shadow-2xs ${
                activeTab === "HOW_IT_WORKS"
                  ? "bg-[#0F2942] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              How It Works (Steps)
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab("VALUE_PROP")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shadow-2xs ${
                activeTab === "VALUE_PROP"
                  ? "bg-[#0F2942] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Value Proposition Strip
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab("PREMIUM_PILLARS")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shadow-2xs ${
                activeTab === "PREMIUM_PILLARS"
                  ? "bg-[#0F2942] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Premium Pillars
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab("WHY_RENT")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shadow-2xs ${
                activeTab === "WHY_RENT"
                  ? "bg-[#0F2942] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Why Rent (Perks)
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab("RENTAL_GUIDE")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shadow-2xs ${
                activeTab === "RENTAL_GUIDE"
                  ? "bg-[#0F2942] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Rental Guide &amp; Media
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
          {loading && sections.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-[#0F2942]" />
            </div>
          ) : activeTab === "overview" ? (
            /* TAB 1: Section Order & Visibility */
            <div className="space-y-4">
              <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-4 sm:p-5 text-xs text-blue-900 leading-relaxed shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0F2942] text-white text-xs font-bold">
                    <Info size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0F2942] mb-1">
                      Homepage Reordering &amp; Visibility Controls
                    </h4>
                    <p className="text-blue-950/80 leading-normal">
                      Use the <strong>Up / Down</strong> buttons to change section positions on the customer
                      homepage. Toggle the <strong>Eye Icon</strong> to instantly show or hide any section
                      without touching React code. Changes persist immediately to the Neon database.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                      sec.isVisible
                        ? "border-gray-200 bg-white shadow-xs"
                        : "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Reorder Up / Down */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, "up")}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Move Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sections.length - 1}
                          onClick={() => moveSection(idx, "down")}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Move Down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D9F4F2] text-xs font-extrabold text-[#0F2942]">
                        #{idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900 truncate">
                            {sec.title}
                          </h3>
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-gray-600">
                            {sec.sectionKey}
                          </span>
                        </div>
                        {sec.subtitle && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {sec.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => openEditSectionModal(sec)}
                        className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                        title="Edit Heading & Subtitle"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility(sec)}
                        className={`rounded-xl p-2 transition ${
                          sec.isVisible
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                        title={sec.isVisible ? "Visible on Homepage" : "Hidden on Homepage"}
                      >
                        {sec.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentTabSection ? (
            /* TAB 2: Configurable Content Section Manager */
            <div className="space-y-6">
              {/* Instruction banner for Section */}
              <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-4 sm:p-5 text-xs text-blue-900 leading-relaxed shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0F2942] text-white text-xs font-bold">
                    <Info size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0F2942] mb-1">
                      {currentTabSection.title} Management
                    </h4>
                    <p className="text-blue-950/80 leading-normal">
                      Manage the headings, step cards, icons, and badges for this section.
                      Click <strong>Edit Header</strong> to update the main section title or subtitle. Click <strong>Add Item</strong> to introduce a new card.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section Header Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-[#D9F4F2] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0F2942]">
                    {currentTabSection.badge || currentTabSection.sectionKey}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-2">
                    {currentTabSection.title}
                  </h2>
                  {currentTabSection.subtitle && (
                    <p className="text-xs text-gray-500 mt-1 max-w-xl">
                      {currentTabSection.subtitle}
                    </p>
                  )}
                  {currentTabSection.description && (
                    <p className="text-xs text-gray-600 mt-2 italic max-w-xl line-clamp-2">
                      {currentTabSection.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => openEditSectionModal(currentTabSection)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Pencil size={14} />
                    <span>Edit Header</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddItemModal(currentTabSection.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2942] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#193D5C] transition shadow-xs"
                  >
                    <Plus size={15} />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">
                  Configured Items ({currentTabSection.items.length})
                </h3>

                {currentTabSection.items.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-xs text-gray-500">
                    No items configured for this section yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentTabSection.items.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-5 transition flex flex-col justify-between ${
                          item.isActive
                            ? "border-gray-200 bg-white shadow-xs"
                            : "border-gray-200 bg-gray-50 opacity-60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-gray-600">
                              Order #{item.sortOrder}
                            </span>
                            {item.badge && (
                              <span className="rounded-full bg-[#D9F4F2] px-2 py-0.5 text-[10px] font-bold text-[#0F2942]">
                                {item.badge}
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ml-auto ${
                                item.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {item.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            {item.icon && (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D9F4F2] text-[#0F2942] font-bold text-xs">
                                {item.icon}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 leading-snug">
                                {item.title}
                              </h4>
                              {item.subtitle && (
                                <p className="text-xs text-[#0F2942] font-semibold mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                              {item.description && (
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditItemModal(currentTabSection.id, item)}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteItem(currentTabSection.id, item.id, item.title)
                            }
                            className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Edit Section Heading Modal */}
      {sectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">
                Edit Section Configuration
              </h2>
              <button
                onClick={() => setSectionModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Section Heading *
                </label>
                <input
                  type="text"
                  required
                  value={secTitle}
                  onChange={(e) => setSecTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Badge / Top Label
                </label>
                <input
                  type="text"
                  value={secBadge}
                  onChange={(e) => setSecBadge(e.target.value)}
                  placeholder="e.g. Simple Process"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={secSubtitle}
                  onChange={(e) => setSecSubtitle(e.target.value)}
                  placeholder="e.g. Renting furniture and appliances is smooth, paperless..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description / Body Text
                </label>
                <textarea
                  rows={3}
                  value={secDescription}
                  onChange={(e) => setSecDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSectionModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSec}
                  className="rounded-xl bg-[#0F2942] px-5 py-2 text-xs font-bold text-white hover:bg-[#193D5C] transition disabled:opacity-50"
                >
                  {savingSec ? "Saving..." : "Save Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">
                {editingItemId ? "Edit Content Item" : "Add Content Item"}
              </h2>
              <button
                onClick={() => setItemModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Title / Step Heading *
                </label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="e.g. Browse & order"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Step # or Badge
                  </label>
                  <input
                    type="text"
                    value={itemBadge}
                    onChange={(e) => setItemBadge(e.target.value)}
                    placeholder="e.g. 01"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Icon Name
                  </label>
                  <input
                    type="text"
                    value={itemIcon}
                    onChange={(e) => setItemIcon(e.target.value)}
                    placeholder="e.g. ShoppingBag, Truck"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={itemSubtitle}
                  onChange={(e) => setItemSubtitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Detail explaining this step, perk or pillar..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                />
              </div>

              <div>
                <ImageUpload
                  label="Item Graphic / Photo (Optional)"
                  value={itemImage}
                  onChange={setItemImage}
                  folder="sections"
                  aspectRatio="auto"
                  helperText="Upload an illustrative photo or icon graphic for this item"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={itemSortOrder}
                    onChange={(e) => setItemSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={itemIsActive}
                      onChange={(e) => setItemIsActive(e.target.checked)}
                      className="rounded text-[#0F2942]"
                    />
                    <span>Active Status</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="rounded-xl bg-[#0F2942] px-5 py-2 text-xs font-bold text-white hover:bg-[#193D5C] transition disabled:opacity-50"
                >
                  {savingItem ? "Saving..." : editingItemId ? "Update Item" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
