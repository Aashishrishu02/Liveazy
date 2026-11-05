import React, { useCallback, useEffect, useState } from "react";
import {
  Home,
  Star,
  MapPin,
  Truck,
  MessageSquarePlus,
  Video,
  X,
  Check,
  ShieldCheck,
  Users,
  AlertCircle,
  Award,
  Heart,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

interface CustomerStoryItem {
  id: string;
  customerName: string;
  photo?: string | null;
  story: string;
  location?: string | null;
  videoUrl?: string | null;
  rating: number;
  sortOrder: number;
  isActive: boolean;
}

interface DynamicStat {
  num: string;
  label: string;
  icon: string;
}

interface SectionItemData {
  id?: string;
  title: string;
  subtitle?: string | null;
  icon?: string | null;
  badge?: string | null;
  description?: string | null; // "auto" | "manual"
  sortOrder?: number;
  isActive?: boolean;
}

interface SectionData {
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  items?: SectionItemData[];
}

export const CustomerStories: React.FC = () => {
  const [stories, setStories] = useState<CustomerStoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Dynamic statistics state (Zero hardcoded, zero fabricated numbers)
  const [dynamicStats, setDynamicStats] = useState<DynamicStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // Section config from HomepageSections
  const [sectionConfig, setSectionConfig] = useState<{
    badge: string;
    title: string;
    subtitle: string;
  }>({
    badge: "Verified Reviews",
    title: "Customer stories",
    subtitle: "Real experiences from customers who furnished their spaces with LIVEAZY",
  });

  const loadData = useCallback(async () => {
    const apiBase = getApiBaseUrl();
    try {
      setLoading(true);
      setLoadingStats(true);
      setStatsError(false);

      // Fetch real data from all reliable backend sources
      const [storiesRes, feedbackRes, contactRes, sectionsRes] = await Promise.all([
        fetchJsonDeduplicated<unknown>(`${apiBase}/customer-stories/public`),
        fetchJsonDeduplicated<unknown>(`${apiBase}/feedback/approved`).catch(() => []),
        fetchJsonDeduplicated<{ serviceLocations?: string }>(`${apiBase}/contact-settings`).catch(() => ({})),
        fetchJsonDeduplicated<unknown>(`${apiBase}/homepage-sections/public`).catch(() => null),
      ]);

      // 1. Stories
      let list: CustomerStoryItem[] = [];
      if (Array.isArray(storiesRes)) {
        list = storiesRes as CustomerStoryItem[];
      } else if (
        storiesRes &&
        typeof storiesRes === "object" &&
        "data" in storiesRes &&
        Array.isArray((storiesRes as { data: unknown }).data)
      ) {
        list = (storiesRes as { data: CustomerStoryItem[] }).data;
      }
      setStories(list);

      // 2. Real Dynamic Statistics calculation:
      // Metric 1: Homes Furnished (Check actual completed rental/order records)
      // Data source fact: LIVEAZY rental checkouts happen through WhatsApp; no completed orders table exists in DB.
      // Rule: Show only actual completed rental records. Do not use product or user counts as substitute.
      const homesFurnishedStat: DynamicStat = {
        num: "—",
        label: "Homes Furnished (No order records)",
        icon: "Home",
      };

      // Metric 2: Customer Rating (Calculated from actual approved reviews)
      const approvedFeedbackList = Array.isArray(feedbackRes)
        ? (feedbackRes as Array<{ rating?: number }>)
        : [];
      const feedbackRatings = approvedFeedbackList
        .map((f) => f.rating)
        .filter((r): r is number => typeof r === "number" && r > 0);
      const storyRatings = list
        .map((s) => s.rating)
        .filter((r): r is number => typeof r === "number" && r > 0);
      const allRatings = [...feedbackRatings, ...storyRatings];

      const customerRatingStat: DynamicStat =
        allRatings.length > 0
          ? {
              num: `${(allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1)} ★`,
              label: `Customer Rating (${allRatings.length} verified reviews)`,
              icon: "Star",
            }
          : {
              num: "—",
              label: "Customer Rating (No approved reviews yet)",
              icon: "Star",
            };

      // Metric 3: Active Serviceable Cities (Count from actual location data in ContactPageSetting)
      const contactObj = contactRes as { serviceLocations?: string } | null | undefined;
      const rawServiceLocations = contactObj?.serviceLocations || "";
      const activeCities: string[] = rawServiceLocations
        ? rawServiceLocations
            .split(/[,;&]|\sand\s/i)
            .map((c: string) => c.trim())
            .filter(Boolean)
        : [];

      const citiesStat: DynamicStat =
        activeCities.length > 0
          ? {
              num: `${activeCities.length} ${activeCities.length === 1 ? "City" : "Cities"}`,
              label: `Serviceable: ${activeCities.slice(0, 3).join(", ")}${activeCities.length > 3 ? "..." : ""}`,
              icon: "MapPin",
            }
          : {
              num: "—",
              label: "Serviceable Cities (Location data unavailable)",
              icon: "MapPin",
            };

      // Metric 4: Products Delivered (Count actual completed delivery records)
      // Data source fact: There is no delivery tracking or shipment database model in the system.
      // Rule: Count actual completed delivery records. Do not use total product catalog count as substitute.
      const productsDeliveredStat: DynamicStat = {
        num: "—",
        label: "Products Delivered (Delivery records unavailable)",
        icon: "Truck",
      };

      // Default automatic stats fallback
      const defaultStats: DynamicStat[] = [
        homesFurnishedStat,
        customerRatingStat,
        citiesStat,
        productsDeliveredStat,
      ];

      // 3. Section config & Dynamic Trust Statistics from HomepageSections
      if (Array.isArray(sectionsRes)) {
        const sec = (sectionsRes as Array<{ sectionKey: string } & SectionData>).find(
          (s) => s.sectionKey === "CUSTOMER_STORIES"
        );
        if (sec) {
          setSectionConfig({
            badge: sec.badge || "Verified Reviews",
            title: sec.title || "Customer stories",
            subtitle:
              sec.subtitle ||
              "Real experiences from customers who furnished their spaces with LIVEAZY",
          });

          // Consume configured Trust Statistics if available
          if (Array.isArray(sec.items) && sec.items.length > 0) {
            const mappedStats: DynamicStat[] = sec.items
              .filter((item) => item.isActive !== false)
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((item) => {
                const isManual = item.description?.toLowerCase() === "manual";
                if (isManual) {
                  return {
                    num: item.title,
                    label: item.subtitle || item.title,
                    icon: item.icon || "Star",
                  };
                }

                // Automatic live system data calculation
                const badgeKey = (item.badge || "").toUpperCase();
                if (badgeKey === "HOMES_FURNISHED") {
                  return {
                    num: "—",
                    label: item.subtitle || "Homes Furnished (No order records)",
                    icon: item.icon || "Home",
                  };
                } else if (badgeKey === "CUSTOMER_RATING") {
                  return {
                    num:
                      allRatings.length > 0
                        ? `${(allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1)} ★`
                        : "—",
                    label:
                      item.subtitle ||
                      (allRatings.length > 0
                        ? `Customer Rating (${allRatings.length} verified reviews)`
                        : "Customer Rating (No approved reviews yet)"),
                    icon: item.icon || "Star",
                  };
                } else if (badgeKey === "SERVICEABLE_CITIES") {
                  return {
                    num:
                      activeCities.length > 0
                        ? `${activeCities.length} ${activeCities.length === 1 ? "City" : "Cities"}`
                        : "—",
                    label:
                      item.subtitle ||
                      (activeCities.length > 0
                        ? `Serviceable: ${activeCities.slice(0, 3).join(", ")}${activeCities.length > 3 ? "..." : ""}`
                        : "Serviceable Cities (Location data unavailable)"),
                    icon: item.icon || "MapPin",
                  };
                } else if (badgeKey === "PRODUCTS_DELIVERED") {
                  return {
                    num: "—",
                    label: item.subtitle || "Products Delivered (Delivery records unavailable)",
                    icon: item.icon || "Truck",
                  };
                } else {
                  return {
                    num: item.title,
                    label: item.subtitle || item.title,
                    icon: item.icon || "Users",
                  };
                }
              });

            setDynamicStats(mappedStats.length > 0 ? mappedStats : defaultStats);
          } else {
            setDynamicStats(defaultStats);
          }
        } else {
          setDynamicStats(defaultStats);
        }
      } else {
        setDynamicStats(defaultStats);
      }
    } catch (e) {
      console.warn("Could not load customer stories statistics:", e);
      setStatsError(true);
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    try {
      setSubmitting(true);
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          rating,
          message: message.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setModalOpen(false);
          setSubmitted(false);
          setName("");
          setMessage("");
          setRating(5);
        }, 1800);
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatIcon = (iconName?: string | null) => {
    switch (iconName?.toLowerCase()) {
      case "home":
        return Home;
      case "star":
        return Star;
      case "mappin":
      case "map-pin":
        return MapPin;
      case "truck":
        return Truck;
      case "shield":
      case "shieldcheck":
        return ShieldCheck;
      case "award":
        return Award;
      case "heart":
        return Heart;
      case "sparkles":
        return Sparkles;
      case "checkcircle":
      case "checkcircle2":
      case "check":
        return CheckCircle2;
      default:
        return Users;
    }
  };

  return (
    <section aria-label="Customer Trust & Stories" className="py-10 sm:py-14 bg-[#fafbfc]">
      <div className="ref-container">
        {/* Dynamic Trust Stats Bar */}
        {loadingStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 shadow-xs mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-4 animate-pulse">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : statsError && dynamicStats.length === 0 ? (
          <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-xs sm:text-sm text-amber-800 mb-10">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600 shrink-0" />
              <span>Live statistics are temporarily unavailable.</span>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              className="font-bold underline hover:text-amber-950 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 shadow-xs mb-10">
            {dynamicStats.map((st, i) => {
              const Icon = getStatIcon(st.icon);
              return (
                <div key={i} className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-[#E6F5F7] text-[#007C8A]">
                    <Icon size={22} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-extrabold text-gray-900 leading-tight">
                      {st.num}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      {st.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <span className="rounded-full bg-[#E6F5F7] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#007C8A]">
              {sectionConfig.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002B62] mt-2">
              {sectionConfig.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {sectionConfig.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#007C8A] bg-white px-4 py-2.5 text-xs font-bold text-[#007C8A] transition hover:bg-[#E6F5F7] shadow-xs shrink-0 self-start sm:self-auto"
          >
            <MessageSquarePlus size={16} />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border border-gray-200 bg-white p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Stories List */}
        {!loading && stories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stories.map((st) => (
              <div
                key={st.id}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-[#007C8A] hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Customer Avatar & Name & City */}
                  <div className="flex items-center gap-3 mb-3">
                    {st.photo ? (
                      <img
                        src={st.photo}
                        alt={st.customerName}
                        className="h-10 w-10 rounded-full object-cover border border-[#E1ECF2]"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6F5F7] text-xs font-bold text-[#007C8A]">
                        {st.customerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">
                        {st.customerName}
                      </div>
                      {st.location && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                          <MapPin size={11} />
                          <span className="truncate">{st.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-2.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={
                          i < st.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-200"
                        }
                      />
                    ))}
                  </div>

                  {/* Story Text */}
                  <p className="text-xs text-gray-600 leading-relaxed italic line-clamp-4">
                    &ldquo;{st.story}&rdquo;
                  </p>
                </div>

                {st.videoUrl && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <a
                      href={st.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#007C8A] hover:underline"
                    >
                      <Video size={13} />
                      <span>Watch Story</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Share Your LIVEAZY Experience
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Your honest feedback helps us serve you and fellow renters better!
            </p>

            {submitted ? (
              <div className="rounded-xl bg-green-50 p-6 text-center text-green-800">
                <Check size={32} className="mx-auto mb-2 text-green-600" />
                <h4 className="font-bold text-sm">Thank you for your review!</h4>
                <p className="text-xs text-green-600 mt-1">
                  Your feedback has been submitted successfully and will be published shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#007C8A] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition"
                      >
                        <Star
                          size={22}
                          className={
                            star <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-gray-600 ml-2">
                      {rating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Review *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you rented and how your experience was..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#007C8A] focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#002B62] py-2.5 text-xs font-bold text-white transition hover:bg-[#001F47] shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CustomerStories;
