import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getApiBaseUrl, fetchJsonDeduplicated } from "../utils/api";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  label?: string;
  isActive?: boolean;
  sortOrder?: number;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "How does renting furniture with LIVEAZY work?",
    answer:
      "Select your desired furniture or combo, pick your rental tenure (3, 6, 9, or 12+ months), complete paperless KYC, and receive free delivery & assembly within 72 hours.",
  },
  {
    id: "faq-2",
    question: "Is there a security deposit?",
    answer:
      "Most of our products have zero security deposit for verified profiles. If a refundable deposit applies, it is 100% refunded when your rental tenure concludes.",
  },
  {
    id: "faq-3",
    question: "Can I upgrade or swap items during my rental period?",
    answer:
      "Yes! We offer free annual upgrades and easy tenure extensions whenever you wish to refresh your living space with newer styles.",
  },
  {
    id: "faq-4",
    question: "What happens if an item gets damaged?",
    answer:
      "Our complimentary Damage Waiver policy covers normal wear and tear as well as minor accidental damages so you can rent with complete peace of mind.",
  },
  {
    id: "faq-5",
    question: "What if I need to relocate to another home or city?",
    answer:
      "We offer 100% free doorstep relocation services across all LIVEAZY operational cities. Simply inform our customer care team 7 days prior to your move.",
  },
];

export const FaqSection: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBaseUrl();

    async function loadFaqs() {
      try {
        setLoading(true);
        const res = await fetchJsonDeduplicated<unknown>(`${apiBase}/faqs`);
        let list: FaqItem[] = [];
        if (Array.isArray(res)) {
          list = res as FaqItem[];
        } else if (res && typeof res === "object" && "data" in res && Array.isArray((res as { data: unknown }).data)) {
          list = (res as { data: FaqItem[] }).data;
        }

        if (!cancelled) {
          const activeList = list
            .filter((f) => f.isActive !== false)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          setFaqs(activeList.length > 0 ? activeList : DEFAULT_FAQS);
        }
      } catch (e) {
        console.warn("Could not load database faqs:", e);
        if (!cancelled) {
          setFaqs(DEFAULT_FAQS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadFaqs();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faqs" className="scroll-mt-24 py-12 sm:py-16 bg-white border-t border-gray-100">
      <div className="ref-container">
        <div className="mx-auto max-w-xl text-center mb-8 sm:mb-10">
          <span className="rounded-full bg-[#f0eaff] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#4a36b3]">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
            Frequently Asked Questions
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
            Everything you need to know about tenures, delivery, and services
          </p>
        </div>

        {loading ? (
          <div className="mx-auto max-w-3xl space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-gray-200 bg-white p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={faq.id || idx}
                  className={`rounded-2xl border transition duration-200 overflow-hidden ${
                    isOpen
                      ? "border-[#4a36b3]/40 bg-[#faf9fe] shadow-xs"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-gray-900 transition hover:text-[#4a36b3]"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-gray-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#4a36b3]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-[13.5px] text-gray-600 leading-relaxed border-t border-gray-100 pt-3 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FaqSection;
