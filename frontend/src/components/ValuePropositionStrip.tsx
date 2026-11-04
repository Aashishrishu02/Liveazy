import React, { useEffect, useState } from "react";
import { Truck, ShieldCheck, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

interface UspItem {
  id?: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
}

interface SectionData {
  sectionKey: string;
  items: UspItem[];
}

const DEFAULT_USPS: UspItem[] = [
  {
    icon: "Truck",
    title: "Free Delivery & Assembly",
    description: "Within 72 hrs at your convenience",
  },
  {
    icon: "ShieldCheck",
    title: "50+ Point Quality Check",
    description: "Deep sanitized & like-new mint condition",
  },
  {
    icon: "RefreshCw",
    title: "Free Relocation",
    description: "Moving city or apartment? We move it free",
  },
  {
    icon: "Sparkles",
    title: "Hassle-Free Maintenance",
    description: "Free annual cleaning & wear-tear cover",
  },
];

export const ValuePropositionStrip: React.FC<{ sectionData?: SectionData }> = ({
  sectionData,
}) => {
  const [items, setItems] = useState<UspItem[]>(
    sectionData?.items || DEFAULT_USPS
  );

  useEffect(() => {
    if (sectionData?.items) {
      setItems(sectionData.items);
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
            (s) => s.sectionKey === "VALUE_PROP"
          );
          if (match && match.items && match.items.length > 0 && !cancelled) {
            setItems(match.items);
          }
        }
      } catch (e) {
        console.warn("Could not load ValueProp config:", e);
      }
    }

    void loadSection();
    return () => {
      cancelled = true;
    };
  }, [sectionData]);

  const getUspIcon = (iconName?: string | null) => {
    switch (iconName?.toLowerCase()) {
      case "truck":
        return Truck;
      case "shield":
      case "shieldcheck":
        return ShieldCheck;
      case "refresh":
      case "refreshcw":
        return RefreshCw;
      case "sparkles":
        return Sparkles;
      default:
        return CheckCircle2;
    }
  };

  const activeItems = items.filter((it) => it.isActive !== false);

  return (
    <div className="border-b border-gray-100 bg-white py-3 sm:py-3.5">
      <div className="ref-container">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          {activeItems.map((item, idx) => {
            const Icon = getUspIcon(item.icon);
            return (
              <div
                key={item.id || idx}
                className="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-[#f0ecfa] bg-[#fcfbfe] p-2.5 sm:p-3 transition hover:border-[#4a36b3]/30 hover:bg-[#f0eaff]/40"
              >
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0eaff] text-[#4a36b3]">
                  <Icon size={19} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-xs sm:text-[13px] font-bold text-gray-900 leading-tight">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="truncate text-[10.5px] sm:text-[11.5px] text-gray-500">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ValuePropositionStrip;
