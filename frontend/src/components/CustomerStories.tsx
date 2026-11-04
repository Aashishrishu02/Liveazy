import React, { useEffect, useState } from "react";
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

interface StatItem {
  icon?: string | null;
  num?: string;
  title: string;
  subtitle?: string | null;
  label?: string;
}

interface SectionData {
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  items: Array<{
    title: string;
    subtitle?: string | null;
    icon?: string | null;
  }>;
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

  // Section config from HomepageSections
  const [sectionConfig, setSectionConfig] = useState<{
    badge: string;
    title: string;
    subtitle: string;
    stats: StatItem[];
  }>({
    badge: "Verified Reviews",
    title: "Customer stories",
    subtitle: "Real experiences from customers who furnished their spaces with LIVEAZY",
    stats: [
      { num: "2,50,000+", label: "Homes Furnished", icon: "Home", title: "2,50,000+" },
      { num: "4.8 Rating", label: "Google & Customer Reviews", icon: "Star", title: "4.8 Rating" },
      { num: "12+ Cities", label: "Across India", icon: "MapPin", title: "12+ Cities" },
      { num: "8,00,000+", label: "Products Delivered", icon: "Truck", title: "8,00,000+" },
    ],
  });

  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function loadData() {
      try {
        setLoading(true);

        const [storiesRes, sectionsRes] = await Promise.all([
          fetchJsonDeduplicated<unknown>(`${apiBase}/customer-stories/public`),
          fetchJsonDeduplicated<unknown>(`${apiBase}/homepage-sections/public`).catch(() => null),
        ]);

        if (!cancelled) {
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

          // 2. Section stats & titles from HomepageSections
          if (Array.isArray(sectionsRes)) {
            const sec = (sectionsRes as Array<{ sectionKey: string } & SectionData>).find(
              (s) => s.sectionKey === "CUSTOMER_STORIES"
            );
            if (sec) {
              const mappedStats: StatItem[] =
                sec.items && sec.items.length > 0
                  ? sec.items.map((it) => ({
                      num: it.title,
                      label: it.subtitle || "",
                      icon: it.icon,
                      title: it.title,
                      subtitle: it.subtitle,
                    }))
                  : sectionConfig.stats;

              setSectionConfig({
                badge: sec.badge || "Verified Reviews",
                title: sec.title || "Customer stories",
                subtitle:
                  sec.subtitle ||
                  "Real experiences from customers who furnished their spaces with LIVEAZY",
                stats: mappedStats,
              });
            }
          }
        }
      } catch (e) {
        console.warn("Could not load customer stories:", e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

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
      default:
        return Users;
    }
  };

  return (
    <section aria-label="Customer Trust & Stories" className="py-10 sm:py-14 bg-[#fafbfc]">
      <div className="ref-container">
        {/* Dynamic Trust Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 shadow-xs mb-10">
          {sectionConfig.stats.map((st, i) => {
            const Icon = getStatIcon(st.icon);
            return (
              <div key={i} className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-[#f0eaff] text-[#4a36b3]">
                  <Icon size={22} className="stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-extrabold text-gray-900 leading-tight">
                    {st.num || st.title}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {st.label || st.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <span className="rounded-full bg-[#f0eaff] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#4a36b3]">
              {sectionConfig.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
              {sectionConfig.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {sectionConfig.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#4a36b3] bg-white px-4 py-2.5 text-xs font-bold text-[#4a36b3] transition hover:bg-[#f0eaff] shadow-xs shrink-0 self-start sm:self-auto"
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
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-[#4a36b3] hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Customer Avatar & Name & City */}
                  <div className="flex items-center gap-3 mb-3">
                    {st.photo ? (
                      <img
                        src={st.photo}
                        alt={st.customerName}
                        className="h-10 w-10 rounded-full object-cover border border-[#eee9fa]"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0eaff] text-xs font-bold text-[#4a36b3]">
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
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4a36b3] hover:underline"
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
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#4a36b3] focus:outline-hidden"
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
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-[#4a36b3] focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#4a36b3] py-2.5 text-xs font-bold text-white transition hover:bg-[#3d2c96] shadow-sm disabled:opacity-50"
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
