
import React from "react";
import {
  Truck,
  MessageCircle,
  CreditCard,
  Clock,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react";

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const features = [
    {
      icon: Truck,
      title: "Convenient Delivery",
      description: "Furniture delivered to your doorstep",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Support",
      description: "Get in touch with our team",
    },
    {
      icon: CreditCard,
      title: "Easy Payments",
      description: "Convenient payment options",
    },
    {
      icon: Clock,
      title: "Flexible Rentals",
      description: "Furniture for your lifestyle",
    },
  ];

  return (
    <>
      {/* Service highlights */}
      <section
        id="contact"
        className="border-t border-white/10 bg-[#0F2942] text-white"
      >
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group flex items-center gap-4 py-6 sm:px-5 lg:px-6 lg:py-8 first:lg:pl-0 last:lg:pr-0"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#008A90]/30 bg-[#008A90]/10 transition-colors duration-300 group-hover:bg-[#008A90]/25">
                  <Icon
                    size={23}
                    strokeWidth={1.8}
                    className="text-[#70E1E4]"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white sm:text-base">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-white/60 sm:text-sm">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom brand strip */}
      <div className="border-t border-white/10 bg-[#0A2034] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <a
            href="#home"
            onClick={scrollToTop}
            className="group inline-flex w-fit items-center gap-2 text-lg font-extrabold tracking-wide"
          >
            LIVE
            <span className="text-[#70E1E4]">AZY</span>
            <ArrowUpRight
              size={15}
              className="text-white/40 transition group-hover:text-[#70E1E4]"
            />
          </a>

          <p className="text-xs leading-5 text-white/50 sm:text-right sm:text-sm">
            Furniture rental for comfortable, flexible living.
          </p>
        </div>
      </div>

      {/* Back to top */}
      <button
        type="button"
        aria-label="Back to top"
        onClick={scrollToTop}
        className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0F2942] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#008A90] hover:bg-[#008A90] hover:text-white"
      >
        <ChevronUp size={20} />
      </button>
    </>
  );
};

export default Footer;
