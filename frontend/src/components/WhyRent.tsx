import React, { useEffect, useState } from "react";
import {
  Truck,
  RefreshCw,
  ShieldCheck,
  ArrowUpCircle,
  IndianRupee,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

interface PerkItem {
  id?: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
}

interface SectionData {
  sectionKey: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  items: PerkItem[];
}

const DEFAULT_PERKS: PerkItem[] = [
  {
    icon: "Truck",
    title: "Free Delivery",
    description: "Doorstep delivery and assembly at zero extra charge across all cities.",
  },
  {
    icon: "RefreshCw",
    title: "Free Relocation",
    description: "Moving home or city? We move your rented furniture 100% free.",
  },
  {
    icon: "ShieldCheck",
    title: "Damage Waiver",
    description: "Protection against routine wear & minor accidental tear.",
  },
  {
    icon: "ArrowUpCircle",
    title: "Annual Upgrades",
    description: "Upgrade to fresh, new models and styles every year effortlessly.",
  },
  {
    icon: "IndianRupee",
    title: "Save Capital",
    description: "No bulky upfront investment or EMIs locking your hard-earned savings.",
  },
];

export const WhyRent: React.FC<{ sectionData?: SectionData }> = ({
  sectionData,
}) => {
  const [data, setData] = useState<SectionData>(
    sectionData || {
      sectionKey: "WHY_RENT",
      badge: "Smart Living",
      title: "Why rent with LIVEAZY?",
      subtitle: "Designed for flexibility, convenience, and financial freedom",
      items: DEFAULT_PERKS,
    }
  );

  useEffect(() => {
    if (sectionData) {
      setData(sectionData);
      return;
    }

    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function loadSection() {
      try {
        const res = await fetchJsonDeduplicated<unknown>(
          `${apiBase}/homepage-sections/public`
        );
        if (Array.isArray(res)) {
          const match = (res as SectionData[]).find(
            (s) => s.sectionKey === "WHY_RENT"
          );
          if (match && !cancelled) {
            setData({
              sectionKey: "WHY_RENT",
              badge: match.badge || "Smart Living",
              title: match.title || "Why rent with LIVEAZY?",
              subtitle:
                match.subtitle ||
                "Designed for flexibility, convenience, and financial freedom",
              items:
                match.items && match.items.length > 0
                  ? match.items
                  : DEFAULT_PERKS,
            });
          }
        }
      } catch (e) {
        console.warn("Could not load WhyRent config:", e);
      }
    }

    void loadSection();
    return () => {
      cancelled = true;
    };
  }, [sectionData]);

  const getPerkIcon = (iconName?: string | null) => {
    switch (iconName?.toLowerCase()) {
      case "truck":
        return Truck;
      case "refresh":
      case "refreshcw":
        return RefreshCw;
      case "shield":
      case "shieldcheck":
        return ShieldCheck;
      case "arrowupcircle":
      case "upgrade":
        return ArrowUpCircle;
      case "rupee":
      case "indianrupee":
        return IndianRupee;
      case "sparkles":
        return Sparkles;
      default:
        return CheckCircle2;
    }
  };

  const activePerks = data.items.filter((it) => it.isActive !== false);

  return (
    <section
      id="about"
      aria-label="Why rent with LIVEAZY"
      className="py-10 sm:py-14 bg-[#F4F8FA] border-t border-gray-100 scroll-mt-24"
    >
      <div className="ref-container">
        <div className="mx-auto max-w-xl text-center mb-8 sm:mb-10">
          <span className="rounded-full bg-[#E6F5F7] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#007C8A]">
            {data.badge || "Smart Living"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002B62] mt-2">
            {data.title}
          </h2>
          {data.subtitle && (
            <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
              {data.subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
          {activePerks.map((p, idx) => {
            const Icon = getPerkIcon(p.icon);
            return (
              <div
                key={p.id || idx}
                className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#007C8A] hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="mx-auto flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#E6F5F7] text-[#007C8A] mb-3">
                    <Icon size={22} className="stroke-[2.2]" />
                  </div>
                  <h4 className="text-xs sm:text-[13.5px] font-bold text-gray-900 mb-1">
                    {p.title}
                  </h4>
                  {p.description && (
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-snug">
                      {p.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyRent;
