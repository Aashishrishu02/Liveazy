import React from "react";
import { Menu, Search } from "lucide-react";

interface AdminHeaderProps {
  title?: string;
  onOpenSidebar: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  onOpenSidebar,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  actions,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
          className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {onSearchChange ? (
          <div className="relative w-full max-w-[380px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchValue || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-transparent bg-[#F5F7FA] pl-9 pr-4 text-xs outline-hidden transition focus:border-[#008A90] focus:bg-white text-slate-800"
            />
          </div>
        ) : title ? (
          <h1 className="text-base sm:text-lg font-bold text-[#0F2942] truncate">
            {title}
          </h1>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        {actions}

        <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Admin workspace</span>
        </div>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9F4F2] text-xs font-bold text-[#00696E]">
            A
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-[#0F2942]">Admin</p>
            <p className="text-[10px] text-slate-400">LIVEAZY Console</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
