import React from 'react';
import { MousePointerClick, FileCheck2, Truck, RefreshCw, Sparkles } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: MousePointerClick,
    title: 'Select Your Rentals',
    description:
      'Choose from hundreds of curated sofas, double beds, refrigerators, washing machines, or electronics. Pick your preferred rental tenure from 3 to 24+ months.',
    highlight: 'Zero Security Deposit',
  },
  {
    step: '02',
    icon: FileCheck2,
    title: 'Quick Paperless KYC',
    description:
      'Complete our 2-minute instant digital KYC verification. No tedious paperwork or guarantor visits required—everything is verified online safely.',
    highlight: 'Instant 10-Minute Approval',
  },
  {
    step: '03',
    icon: Truck,
    title: 'Free Delivery & Installation',
    description:
      'Our professional team brings your sanitized products to your doorstep in Pune within 48 hours, fully unboxes them, and handles complete assembly for free.',
    highlight: 'Free Doorstep Setup',
  },
  {
    step: '04',
    icon: RefreshCw,
    title: 'Enjoy, Swap or Relocate',
    description:
      'Live comfortably without long-term baggage. If you move within Pune, we relocate your rentals for free. When you want a change, easily swap to new models.',
    highlight: 'Free Relocation & Upgrades',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 bg-[#faf9f7]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200/80 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-orange-600 mb-3">
            <Sparkles size={13} className="text-orange-500" />
            <span>SIMPLE & TRANSPARENT</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 tracking-tight">
            How Renting Works
          </h2>

          <p className="mt-3 text-sm sm:text-base text-gray-500 leading-relaxed">
            Get your entire apartment furnished or grab the latest tech gear in four easy steps.
          </p>
        </div>

        {/* 4 STEPS GRID */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="group relative flex flex-col justify-between rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100/70 text-orange-600 transition-transform group-hover:scale-110">
                      <Icon size={24} />
                    </div>
                    <span className="font-mono text-2xl font-black text-orange-200 group-hover:text-orange-400 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-gray-950 group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <span className="inline-block rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                    {item.highlight}
                  </span>
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
