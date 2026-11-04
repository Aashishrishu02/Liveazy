import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  FileCheck2,
  Truck,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Package,
} from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

interface StepItem {
  id?: string;
  title: string;
  badge?: string | null;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface SectionData {
  sectionKey: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  items: StepItem[];
}

const DEFAULT_STEPS: StepItem[] = [
  {
    badge: "01",
    icon: "ShoppingBag",
    title: "Browse & order",
    description:
      "Explore 500+ premium furniture and appliance picks. Select your preferred tenure (3, 6, 9, or 12+ months) and add items to your cart or WhatsApp.",
  },
  {
    badge: "02",
    icon: "FileCheck2",
    title: "Verify & book",
    description:
      "Complete a rapid, 100% secure paperless KYC online and pick a delivery time slot that fits comfortably into your moving schedule.",
  },
  {
    badge: "03",
    icon: "Truck",
    title: "Delivery & move in",
    description:
      "Our professional crew delivers, carries, assembles, and installs everything within 72 hours so you can instantly settle in and relax.",
  },
];

export const HowItWorks: React.FC<{ sectionData?: SectionData }> = ({
  sectionData,
}) => {
  const [data, setData] = useState<SectionData>(
    sectionData || {
      sectionKey: "HOW_IT_WORKS",
      badge: "Simple Process",
      title: "How it works",
      subtitle: "Renting furniture and appliances is smooth, paperless, and straightforward",
      items: DEFAULT_STEPS,
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
            (s) => s.sectionKey === "HOW_IT_WORKS"
          );
          if (match && !cancelled) {
            setData({
              sectionKey: "HOW_IT_WORKS",
              title: match.title || "How it works",
              subtitle:
                match.subtitle ||
                "Renting furniture and appliances is smooth, paperless, and straightforward",
              badge: match.badge || "Simple Process",
              items: match.items && match.items.length > 0 ? match.items : DEFAULT_STEPS,
            });
          }
        }
      } catch (e) {
        console.warn("Could not load HowItWorks section config:", e);
      }
    }

    void loadSection();
    return () => {
      cancelled = true;
    };
  }, [sectionData]);

  const getStepIcon = (iconName?: string | null) => {
    switch (iconName?.toLowerCase()) {
      case "shoppingbag":
      case "shopping-bag":
        return ShoppingBag;
      case "filecheck2":
      case "filecheck":
      case "verify":
        return FileCheck2;
      case "truck":
      case "delivery":
        return Truck;
      case "sparkles":
        return Sparkles;
      case "shield":
      case "shieldcheck":
        return ShieldCheck;
      case "package":
        return Package;
      default:
        return CheckCircle2;
    }
  };

  const activeSteps = data.items.filter((it) => it.isActive !== false);

  return (
    <section
      id="how-it-works"
      aria-label="How it works"
      className="border-y border-gray-100 bg-white py-12 sm:py-16 scroll-mt-24"
    >
      <div className="ref-container">
        <div className="mx-auto max-w-xl text-center mb-8 sm:mb-12">
          <span className="rounded-full bg-[#f0eaff] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#4a36b3]">
            {data.badge || "Simple Process"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
            {data.title}
          </h2>
          {data.subtitle && (
            <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
              {data.subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {activeSteps.map((s, idx) => {
            const Icon = getStepIcon(s.icon);
            const stepNumber = s.badge || String(idx + 1).padStart(2, "0");

            return (
              <div
                key={s.id || idx}
                className="group relative rounded-2xl border border-[#eee9fa] bg-[#faf9fd] p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#4a36b3] hover:bg-white hover:shadow-xl hover:shadow-[#4a36b3]/10 flex flex-col justify-between"
              >
                {/* Large Background Step Number */}
                <span className="absolute right-5 top-5 text-4xl sm:text-5xl font-black text-[#e4ddfa] group-hover:text-[#4a36b3]/15 transition duration-300 select-none">
                  {stepNumber}
                </span>

                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#f0eaff] text-[#4a36b3] mb-5 transition duration-300 group-hover:scale-110">
                    <Icon size={26} className="stroke-[2.2]" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
