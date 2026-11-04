import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

interface MediaLogoItem {
  id?: string;
  title: string;
  subtitle?: string | null;
  isActive?: boolean;
}

interface SectionData {
  sectionKey: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  items: MediaLogoItem[];
}

const DEFAULT_MEDIA: MediaLogoItem[] = [
  { title: "Economic Times", subtitle: "Times" },
  { title: "YourStory", subtitle: "Story" },
  { title: "Inc42", subtitle: "42" },
  { title: "Business Standard", subtitle: "Standard" },
  { title: "Hindustan Times", subtitle: "Times" },
  { title: "LiveMint", subtitle: "Mint" },
  { title: "Entrepreneur", subtitle: "Entrepreneur" },
];

export const RentalGuideSection: React.FC<{ sectionData?: SectionData }> = ({
  sectionData,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<SectionData>(
    sectionData || {
      sectionKey: "RENTAL_GUIDE",
      title: "Rent Furniture & Appliances Online with LIVEAZY",
      subtitle: "SEO & Rental Guide",
      description: `We all want to furnish our homes to the best we can afford. What if affordability doesn't remain an issue anymore? Acquiring good quality furniture digs so deep into our pockets that we hardly dare to buy premium furniture more than once or twice in our lifetime. LIVEAZY offers the freedom to live in supreme style without locking away capital.`,
      items: DEFAULT_MEDIA,
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
            (s) => s.sectionKey === "RENTAL_GUIDE"
          );
          if (match && !cancelled) {
            setData({
              sectionKey: "RENTAL_GUIDE",
              title: match.title || "Rent Furniture & Appliances Online with LIVEAZY",
              subtitle: match.subtitle || "SEO & Rental Guide",
              description: match.description || "",
              items:
                match.items && match.items.length > 0
                  ? match.items
                  : DEFAULT_MEDIA,
            });
          }
        }
      } catch (e) {
        console.warn("Could not load RentalGuide config:", e);
      }
    }

    void loadSection();
    return () => {
      cancelled = true;
    };
  }, [sectionData]);

  const activeMedia = data.items.filter((it) => it.isActive !== false);

  return (
    <section aria-label="Rental Guide & Media" className="py-10 sm:py-14 bg-[#f8f7fb] border-t border-gray-200">
      <div className="ref-container">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
            {data.title}
          </h2>

          <div
            className={`relative overflow-hidden text-xs sm:text-[13.5px] text-gray-600 leading-relaxed space-y-3 transition-all duration-300 ${
              expanded ? "max-h-[2500px]" : "max-h-36"
            }`}
          >
            {data.description ? (
              <p className="whitespace-pre-line">{data.description}</p>
            ) : null}

            <h3 className="text-sm sm:text-base font-bold text-gray-900 pt-2">
              What Is Furniture Rental?
            </h3>
            <p>
              Furniture rental is the modern synonym for living in comfort with flexibility. LIVEAZY gives you instant access to solid Sheesham wood beds, luxury sofas, ergonomic study desks, and 5-star smart home appliances at an affordable monthly rent, with complete flexibility to rent for 3, 6, 9, or 12+ months.
            </p>

            <h3 className="text-sm sm:text-base font-bold text-gray-900 pt-2">
              The Real Benefits of Renting with LIVEAZY
            </h3>
            <p>
              Instead of locking lakhs of rupees into depreciating furniture and worrying about moving heavy wardrobes when relocating, furniture rental offers zero maintenance costs, free annual deep steam cleaning, complimentary doorstep delivery and assembly, and 100% free relocation across Pune, Bangalore, Mumbai, Delhi NCR, and Hyderabad.
            </p>

            <h3 className="text-sm sm:text-base font-bold text-gray-900 pt-2">
              Who Can Rent? Students, IT Professionals &amp; Growing Families
            </h3>
            <p>
              Whether you are a college student shifting to a new university, an IT professional on a temporary project in Hinjewadi or Whitefield, or a growing family relocating to a spacious flat, LIVEAZY offers custom bedroom, living room, study, and appliance packages tailored to every lifestyle.
            </p>

            {/* Gradient shadow when collapsed */}
            {!expanded && (
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
          </div>

          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#4a36b3] hover:underline"
          >
            <span>{expanded ? "Read Less" : "Read More"}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Featured in Media Strip */}
          {activeMedia.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-3">
                Featured In Leading Media:
              </span>
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs sm:text-sm font-semibold text-gray-500">
                {activeMedia.map((item, idx) => (
                  <span key={item.id || idx} className="transition hover:text-gray-900">
                    {item.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RentalGuideSection;
