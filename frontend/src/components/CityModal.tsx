import React, { useState } from "react";
import { X, MapPin, Check, Search } from "lucide-react";

interface CityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
}

const POPULAR_CITIES = [
  { name: "Pune", state: "Maharashtra", badge: "Primary Hub" },
  { name: "Bangalore", state: "Karnataka", badge: "Popular" },
  { name: "Mumbai", state: "Maharashtra", badge: "Popular" },
  { name: "Delhi", state: "NCR", badge: null },
  { name: "Gurgaon", state: "NCR", badge: "Popular" },
  { name: "Noida", state: "NCR", badge: null },
  { name: "Hyderabad", state: "Telangana", badge: "Popular" },
  { name: "Ghaziabad", state: "NCR", badge: null },
  { name: "Faridabad", state: "NCR", badge: null },
];

export const CityModal: React.FC<CityModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity,
}) => {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="city-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close city selection"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={18} />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-[#4a36b3]">
            <MapPin size={22} className="stroke-[2.2]" />
            <h3 id="city-modal-title" className="text-xl font-bold text-gray-900">Select Your City</h3>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            LIVEAZY delivers premium furniture &amp; appliances with free delivery &amp; setup
          </p>
        </div>

        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city (e.g. Pune, Bangalore, Mumbai)..."
            className="w-full rounded-xl border border-gray-200 bg-[#f4f4f5] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-gray-900 outline-none transition focus:border-[#4a36b3] focus:bg-white focus:ring-2 focus:ring-[#4a36b3]/15"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 max-h-72 overflow-y-auto no-scrollbar pr-1">
          {filteredCities.map((c) => {
            const isSelected = selectedCity.toLowerCase().includes(c.name.toLowerCase());
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  onSelectCity(c.name);
                  onClose();
                }}
                className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-[#4a36b3] bg-[#f0eaff] text-[#4a36b3] shadow-xs"
                    : "border-gray-200 bg-white hover:border-[#4a36b3]/50 hover:bg-[#fafbfc]"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-xs sm:text-sm text-gray-900">
                    {c.name}
                  </span>
                  {isSelected && <Check size={14} className="text-[#4a36b3]" />}
                </div>
                <div className="mt-1 flex w-full items-center justify-between">
                  <span className="text-[10px] text-gray-500">{c.state}</span>
                  {c.badge && (
                    <span className="rounded-full bg-[#ff6b35]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#ff6b35]">
                      {c.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl bg-[#fafafa] p-3 text-center text-[11px] text-gray-500 border border-gray-100">
          Moving city or apartment? We offer <strong className="text-gray-800">100% Free Relocation</strong> across all our active cities!
        </div>
      </div>
    </div>
  );
};

export default CityModal;
