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
  Home,
  Star,
  MapPin,
  Truck,
  ShieldCheck,
  Award,
  Heart,
  Sparkles,
  Users,
  CheckCircle2,
  Save,
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

export interface TrustStatItem {
  id?: string;
  badge: string; // "HOMES_FURNISHED" | "CUSTOMER_RATING" | "SERVICEABLE_CITIES" | "PRODUCTS_DELIVERED"
  title: string;
  subtitle?: string | null;
  icon?: string | null;
  description?: string | null; // "auto" | "manual"
  sortOrder: number;
  isActive: boolean;
}

const DEFAULT_TRUST_STATS: TrustStatItem[] = [
  {
    badge: "HOMES_FURNISHED",
    title: "Homes Furnished",
    subtitle: "Homes Furnished",
    icon: "Home",
    description: "auto",
    sortOrder: 0,
    isActive: true,
  },
  {
    badge: "CUSTOMER_RATING",
    title: "Customer Rating",
    subtitle: "Customer Rating",
    icon: "Star",
    description: "auto",
    sortOrder: 1,
    isActive: true,
  },
  {
    badge: "SERVICEABLE_CITIES",
    title: "Serviceable Cities",
    subtitle: "Across India",
    icon: "MapPin",
    description: "auto",
    sortOrder: 2,
    isActive: true,
  },
  {
    badge: "PRODUCTS_DELIVERED",
    title: "Products Delivered",
    subtitle: "Products Delivered",
    icon: "Truck",
    description: "auto",
    sortOrder: 3,
    isActive: true,
  },
];

const AVAILABLE_STAT_ICONS = [
  { name: "Home", label: "Home", icon: Home },
  { name: "Star", label: "Star", icon: Star },
  { name: "MapPin", label: "Location", icon: MapPin },
  { name: "Truck", label: "Truck", icon: Truck },
  { name: "ShieldCheck", label: "Shield / Trust", icon: ShieldCheck },
  { name: "Award", label: "Award", icon: Award },
  { name: "Heart", label: "Heart", icon: Heart },
  { name: "Sparkles", label: "Sparkles", icon: Sparkles },
  { name: "Users", label: "Users", icon: Users },
  { name: "CheckCircle2", label: "Verified", icon: CheckCircle2 },
];

const METRIC_LABELS: Record<string, { name: string; autoHint: string; defaultIcon: string }> = {
  HOMES_FURNISHED: {
    name: "Homes Furnished",
    autoHint: "Live System: Completed customer rental records (Currently unavailable '—' as checkouts are handled on WhatsApp).",
    defaultIcon: "Home",
  },
  CUSTOMER_RATING: {
    name: "Customer Rating",
    autoHint: "Live System: Dynamically calculated average rating from all approved customer feedback & verified customer stories.",
    defaultIcon: "Star",
  },
  SERVICEABLE_CITIES: {
    name: "Serviceable Cities",
    autoHint: "Live System: Count of active serviceable cities dynamically parsed from Contact Page Settings.",
    defaultIcon: "MapPin",
  },
  PRODUCTS_DELIVERED: {
    name: "Products Delivered",
    autoHint: "Live System: Completed delivery fulfillment records (Currently unavailable '—').",
    defaultIcon: "Truck",
  },
};

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

  // Trust Statistics Master State
  const [trustStats, setTrustStats] = useState<TrustStatItem[]>(DEFAULT_TRUST_STATS);
  const [savingTrustStats, setSavingTrustStats] = useState(false);
  const [loadingTrustStats, setLoadingTrustStats] = useState(false);

  const getToken = () => localStorage.getItem("token");

  const loadTrustStats = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingTrustStats(true);
      const res = await fetch(`${apiBase}/homepage-sections/trust-stats/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          const items: TrustStatItem[] = data.items.map((it: SectionItem, idx: number) => ({
            id: it.id,
            badge: it.badge || (
              idx === 0 ? "HOMES_FURNISHED" :
              idx === 1 ? "CUSTOMER_RATING" :
              idx === 2 ? "SERVICEABLE_CITIES" : "PRODUCTS_DELIVERED"
            ),
            title: it.title,
            subtitle: it.subtitle || "",
            icon: it.icon || (
              idx === 0 ? "Home" :
              idx === 1 ? "Star" :
              idx === 2 ? "MapPin" : "Truck"
            ),
            description: it.description || "auto",
            sortOrder: it.sortOrder ?? idx,
            isActive: it.isActive !== false,
          })).sort((a: TrustStatItem, b: TrustStatItem) => a.sortOrder - b.sortOrder);
          setTrustStats(items);
        }
      }
    } catch (err) {
      console.warn("Could not load trust stats directly:", err);
    } finally {
      setLoadingTrustStats(false);
    }
  };

  const handleUpdateTrustStat = <K extends keyof TrustStatItem>(
    index: number,
    field: K,
    value: TrustStatItem[K]
  ) => {
    setTrustStats((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const moveTrustStat = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === trustStats.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const copy = [...trustStats];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    const updated = copy.map((st, i) => ({ ...st, sortOrder: i }));
    setTrustStats(updated);
  };

  const handleSaveTrustStats = async () => {
    const token = getToken();
    if (!token) {
      navigate("/admin");
      return;
    }

    try {
      setSavingTrustStats(true);
      setError(null);

      const res = await fetch(`${apiBase}/homepage-sections/trust-stats`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stats: trustStats }),
      });

      if (!res.ok) {
        throw new Error("Failed to save trust statistics");
      }

      setSuccess("Trust statistics updated and published to homepage!");
      setTimeout(() => setSuccess(null), 3000);
      await loadSections();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving trust statistics");
    } finally {
      setSavingTrustStats(false);
    }
  };

  const renderStatIcon = (iconName?: string | null, size = 18) => {
    switch (iconName?.toLowerCase()) {
      case "home":
        return <Home size={size} />;
      case "star":
        return <Star size={size} />;
      case "mappin":
      case "map-pin":
        return <MapPin size={size} />;
      case "truck":
        return <Truck size={size} />;
      case "shield":
      case "shieldcheck":
        return <ShieldCheck size={size} />;
      case "award":
        return <Award size={size} />;
      case "heart":
        return <Heart size={size} />;
      case "sparkles":
        return <Sparkles size={size} />;
      case "check":
      case "checkcircle":
      case "checkcircle2":
        return <CheckCircle2 size={size} />;
      default:
        return <Users size={size} />;
    }
  };

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
      const list: HomepageSection[] = Array.isArray(data) ? data : [];
      setSections(list);

      const custStories = list.find((s) => s.sectionKey === "CUSTOMER_STORIES");
      if (custStories && Array.isArray(custStories.items) && custStories.items.length > 0) {
        const items: TrustStatItem[] = custStories.items.map((it, idx) => ({
          id: it.id,
          badge: it.badge || (
            idx === 0 ? "HOMES_FURNISHED" :
            idx === 1 ? "CUSTOMER_RATING" :
            idx === 2 ? "SERVICEABLE_CITIES" : "PRODUCTS_DELIVERED"
          ),
          title: it.title,
          subtitle: it.subtitle || "",
          icon: it.icon || (
            idx === 0 ? "Home" :
            idx === 1 ? "Star" :
            idx === 2 ? "MapPin" : "Truck"
          ),
          description: it.description || "auto",
          sortOrder: it.sortOrder ?? idx,
          isActive: it.isActive !== false,
        })).sort((a, b) => a.sortOrder - b.sortOrder);
        setTrustStats(items);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
  }, []);

  useEffect(() => {
    if (activeTab === "TRUST_STATS") {
      void loadTrustStats();
    }
  }, [activeTab]);

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
              onClick={() => handleSelectTab("TRUST_STATS")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shadow-2xs ${
                activeTab === "TRUST_STATS"
                  ? "bg-[#0F2942] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Trust Statistics
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
          ) : activeTab === "TRUST_STATS" ? (
            /* TAB: Trust Statistics Master */
            <div className="space-y-6">
              {/* Header Info Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-[#0F2942] to-slate-900 p-5 sm:p-6 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-[#D9F4F2] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0F2942]">
                      HOMEPAGE TRUST BAR
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold mt-2 text-white">
                      Trust Statistics Master
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-2xl leading-relaxed">
                      Configure the four trust metrics displayed below Customer Stories on the homepage.
                      Choose between <strong>Automatic (Live System Records)</strong> with honest unavailable states or <strong>Manual Custom Override</strong> for values and labels.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={savingTrustStats}
                    onClick={handleSaveTrustStats}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00D1C1] px-5 py-3 text-xs font-bold text-[#0F2942] shadow-sm hover:bg-[#00c0b1] transition disabled:opacity-50 shrink-0 self-start sm:self-center"
                  >
                    {savingTrustStats ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save Trust Statistics</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Live Homepage Preview */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Live Homepage Preview
                    </h4>
                    <p className="text-xs text-gray-500">
                      Real-time customer view of the stats bar below Customer Stories.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    Live Preview
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl border border-gray-200 bg-[#fafbfc] p-4 sm:p-6 shadow-xs">
                  {trustStats.map((st, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 sm:gap-4 p-3 rounded-xl transition ${
                        st.isActive
                          ? "bg-white border border-gray-100 shadow-2xs"
                          : "bg-gray-100/70 opacity-40 border border-dashed border-gray-300"
                      }`}
                    >
                      <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-[#f0eaff] text-[#4a36b3]">
                        {renderStatIcon(st.icon, 22)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-base sm:text-xl font-extrabold text-gray-900 leading-tight truncate">
                          {st.description === "manual" ? (st.title || "—") : (
                            st.badge === "HOMES_FURNISHED" ? "—" :
                            st.badge === "CUSTOMER_RATING" ? "4.9 ★" :
                            st.badge === "SERVICEABLE_CITIES" ? "1 City" : "—"
                          )}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
                          {st.subtitle || st.title}
                        </div>
                        {!st.isActive && (
                          <span className="inline-block mt-0.5 rounded bg-gray-200 px-1.5 py-0.2 text-[9px] font-bold text-gray-600">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metric Cards Management List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900">
                    Configure Metrics ({trustStats.length} Total)
                  </h4>
                  <span className="text-xs text-gray-500">
                    Use Up / Down arrows to change display order
                  </span>
                </div>

                {loadingTrustStats && (
                  <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-gray-200">
                    <RefreshCw size={20} className="animate-spin text-[#0F2942]" />
                  </div>
                )}

                {!loadingTrustStats && trustStats.map((st, idx) => {
                  const metricInfo = METRIC_LABELS[st.badge] || {
                    name: st.title || `Metric #${idx + 1}`,
                    autoHint: "Live system calculation mode.",
                    defaultIcon: "Star",
                  };
                  const isManual = st.description === "manual";

                  return (
                    <div
                      key={st.badge || idx}
                      className={`rounded-2xl border transition p-5 sm:p-6 ${
                        st.isActive
                          ? "border-gray-200 bg-white shadow-xs"
                          : "border-gray-200 bg-gray-50/70 opacity-70"
                      }`}
                    >
                      {/* Card Top Row: Order, Metric Name, Visibility */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          {/* Order buttons */}
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveTrustStat(idx, "up")}
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === trustStats.length - 1}
                              onClick={() => moveTrustStat(idx, "down")}
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0eaff] text-[#4a36b3]">
                            {renderStatIcon(st.icon, 20)}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-extrabold text-sm text-gray-900">
                                {metricInfo.name}
                              </h5>
                              <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-gray-600">
                                Position #{idx + 1}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                              Metric Key: {st.badge}
                            </p>
                          </div>
                        </div>

                        {/* Visibility Toggle */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleUpdateTrustStat(idx, "isActive", !st.isActive)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              st.isActive
                                ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                            }`}
                          >
                            {st.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                            <span>{st.isActive ? "Visible on Homepage" : "Hidden"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Form Controls */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {/* Data Source Selector */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Data Source Mode
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateTrustStat(idx, "description", "auto")}
                              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                                !isManual
                                  ? "border-[#0F2942] bg-[#f0f6ff] text-[#0F2942] font-bold shadow-2xs"
                                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-medium"
                              }`}
                            >
                              <div>
                                <div className="text-xs">⚡ Automatic (Live System Records)</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                  Dynamically computed or honest unavailable state
                                </div>
                              </div>
                              {!isManual && <Check size={16} className="text-[#0F2942]" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateTrustStat(idx, "description", "manual")}
                              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                                isManual
                                  ? "border-[#0F2942] bg-[#f0f6ff] text-[#0F2942] font-bold shadow-2xs"
                                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-medium"
                              }`}
                            >
                              <div>
                                <div className="text-xs">✏️ Manual (Custom Override)</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                  Specify custom display value directly
                                </div>
                              </div>
                              {isManual && <Check size={16} className="text-[#0F2942]" />}
                            </button>
                          </div>

                          {!isManual && (
                            <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-700 flex items-start gap-2">
                              <Info size={14} className="text-slate-500 shrink-0 mt-0.5" />
                              <span>{metricInfo.autoHint}</span>
                            </div>
                          )}
                        </div>

                        {/* Title / Value Field */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {isManual ? "Manual Display Value / Number" : "Metric Title"}
                          </label>
                          <input
                            type="text"
                            value={st.title}
                            onChange={(e) => handleUpdateTrustStat(idx, "title", e.target.value)}
                            placeholder={isManual ? "e.g. 500+ or 4.9 ★" : "Metric Title"}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-none"
                          />
                          <p className="text-[10px] text-gray-500 mt-1">
                            {isManual ? "Displayed as the large bold number." : "Metric reference title."}
                          </p>
                        </div>

                        {/* Label (Subtitle) Field */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Display Label (Subtitle)
                          </label>
                          <input
                            type="text"
                            value={st.subtitle || ""}
                            onChange={(e) => handleUpdateTrustStat(idx, "subtitle", e.target.value)}
                            placeholder="e.g. Homes Furnished or Across India"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#0F2942] focus:outline-none"
                          />
                          <p className="text-[10px] text-gray-500 mt-1">
                            Displayed directly beneath the number on the homepage card.
                          </p>
                        </div>

                        {/* Icon Picker */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Select Icon
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {AVAILABLE_STAT_ICONS.map((ic) => {
                              const IconComp = ic.icon;
                              const isSelected = (st.icon || "").toLowerCase() === ic.name.toLowerCase();
                              return (
                                <button
                                  key={ic.name}
                                  type="button"
                                  onClick={() => handleUpdateTrustStat(idx, "icon", ic.name)}
                                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition ${
                                    isSelected
                                      ? "border-[#4a36b3] bg-[#f0eaff] text-[#4a36b3] font-bold"
                                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  <IconComp size={16} className={isSelected ? "text-[#4a36b3]" : "text-gray-500"} />
                                  <span className="truncate">{ic.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={savingTrustStats}
                    onClick={handleSaveTrustStats}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#1a3f63] transition disabled:opacity-50"
                  >
                    {savingTrustStats ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save All Changes</span>
                      </>
                    )}
                  </button>
                </div>
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
