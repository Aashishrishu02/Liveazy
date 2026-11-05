import React, { useEffect, useState } from "react";
import { Layers, ShieldCheck, Home, CheckCircle2, Sparkles } from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

interface PillarItem {
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
  items: PillarItem[];
}

const DEFAULT_PILLARS: PillarItem[] = [
  {
    icon: "Layers",
    title: "Crafted from quality materials",
    description:
      "Solid Sheesham wood frames, high-density resilient foam, and breathable luxury fabrics engineered for supreme daily comfort.",
  },
  {
    icon: "ShieldCheck",
    title: "Inspected & restored to like-new",
    description:
      "Every piece undergoes a stringent 50+ point quality inspection and clinical deep steam sanitisation before reaching your doorstep.",
  },
  {
    icon: "Home",
    title: "Built to live with",
    description:
      "Hassle-free complimentary annual maintenance, zero-cost relocation, and damage waiver protection let you live freely.",
  },
];

export const PremiumPillars: React.FC<{ sectionData?: SectionData }> = ({
  sectionData,
}) => {
  const [data, setData] = useState<SectionData>(
    sectionData || {
      sectionKey: "PREMIUM_PILLARS",
      title: "Looks premium. Feels premium.",
      subtitle:
        "We build, restore, and maintain our own furniture and appliances to guarantee unmatched craftsmanship, hygiene, and durability for your dream home.",
      items: DEFAULT_PILLARS,
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
            (s) => s.sectionKey === "PREMIUM_PILLARS"
          );
          if (match && !cancelled) {
            setData({
              sectionKey: "PREMIUM_PILLARS",
              title: match.title || "Looks premium. Feels premium.",
              subtitle:
                match.subtitle ||
                "We build, restore, and maintain our own furniture and appliances to guarantee unmatched craftsmanship, hygiene, and durability for your dream home.",
              items:
                match.items && match.items.length > 0
                  ? match.items
                  : DEFAULT_PILLARS,
            });
          }
        }
      } catch (e) {
        console.warn("Could not load PremiumPillars config:", e);
      }
    }

    void loadSection();
    return () => {
      cancelled = true;
    };
  }, [sectionData]);

  const getPillarIcon = (iconName?: string | null) => {
    switch (iconName?.toLowerCase()) {
      case "layers":
        return Layers;
      case "shield":
      case "shieldcheck":
        return ShieldCheck;
      case "home":
        return Home;
      case "sparkles":
        return Sparkles;
      default:
        return CheckCircle2;
    }
  };

  const activePillars = data.items.filter((it) => it.isActive !== false);

  return (
    <section aria-label="Quality Standards" className="py-6 sm:py-10">
      <div className="ref-container">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#001F47] via-[#002B62] to-[#007C8A] p-6 sm:p-10 md:p-12 text-white shadow-xl">
          <div className="mx-auto max-w-2xl text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
              {data.title.includes(".") ? (
                <>
                  {data.title.split(".")[0]}.<br />
                  <span className="text-[#00A8B5]">{data.title.split(".")[1]?.trim()}</span>
                </>
              ) : (
                data.title
              )}
            </h2>
            {data.subtitle && (
              <p className="mt-3 text-xs sm:text-sm text-[#E6F5F7] leading-relaxed">
                {data.subtitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {activePillars.map((p, idx) => {
              const Icon = getPillarIcon(p.icon);
              return (
                <div
                  key={p.id || idx}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 backdrop-blur-sm transition duration-300 hover:bg-white/10 hover:-translate-y-1 hover:border-white/20 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00A8B5]/15 text-[#00A8B5] mb-4">
                      <Icon size={24} className="stroke-[2.2]" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="text-xs sm:text-sm text-[#E6F5F7]/90 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumPillars;
