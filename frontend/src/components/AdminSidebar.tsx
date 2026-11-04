
import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Tags,
  Armchair,
  Package,
  Images,
  Megaphone,
  Star,
  Flame,
  MessageSquareQuote,
  LayoutGrid,
  MessageSquareText,
  Contact,
  MessageCircle,
  Share2,
  FileText,
  Store,
  LogOut,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavSection {
  title: string;
  items: Array<{
    label: string;
    path: string;
    icon: React.ComponentType<{
      size?: number;
      className?: string;
      strokeWidth?: number;
    }>;
  }>;
}

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      {
        label: "Dashboard",
        path: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Product Management",
    items: [
      {
        label: "Categories",
        path: "/admin/categories",
        icon: Tags,
      },
      {
        label: "Products",
        path: "/admin/products",
        icon: Armchair,
      },
      {
        label: "Combo Offers",
        path: "/admin/combos",
        icon: Package,
      },
    ],
  },
  {
    title: "Homepage Management",
    items: [
      {
        label: "Banner Management",
        path: "/admin/banner",
        icon: Images,
      },
      {
        label: "Promo Banners",
        path: "/admin/promo-banners",
        icon: Megaphone,
      },
      {
        label: "Trending Rentals",
        path: "/admin/trending-rentals",
        icon: Star,
      },
      {
        label: "This Week Deals",
        path: "/admin/deals",
        icon: Flame,
      },
      {
        label: "Customer Stories",
        path: "/admin/customer-stories",
        icon: MessageSquareQuote,
      },
      {
        label: "Homepage Sections",
        path: "/admin/sections",
        icon: LayoutGrid,
      },
    ],
  },
  {
    title: "Other Management",
    items: [
      {
        label: "Reviews / Feedback",
        path: "/admin/feedback",
        icon: MessageSquareText,
      },
      {
        label: "Contact Management",
        path: "/admin/contact-management",
        icon: Contact,
      },
      {
        label: "WhatsApp Settings",
        path: "/admin/settings",
        icon: MessageCircle,
      },
      {
        label: "Social Settings",
        path: "/admin/social-media",
        icon: Share2,
      },
      {
        label: "Blog Management",
        path: "/admin/blogs",
        icon: FileText,
      },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin");
  };

  const isItemActive = (path: string) => {
    if (path === "/admin/sections") {
      return location.pathname === "/admin/sections";
    }

    return location.pathname === path && !location.search;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#0F2942]/40 lg:hidden"
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="border-b border-slate-100 bg-[#F8FAFC] px-5 py-4">
          <div className="flex items-center justify-between">
            <NavLink
              to="/admin/dashboard"
              className="block focus:outline-none"
              title="LIVEAZY Admin Dashboard"
            >
              <img
                src="/liveazy-logo-cropped.png"
                alt="LIVEAZY Furniture Rental"
                className="h-10 w-auto max-w-[195px] object-contain transition hover:opacity-95"
              />
            </NavLink>

            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center rounded-md bg-[#D9F4F2] px-2.5 py-0.5 text-[10px] font-bold tracking-[0.14em] text-[#00696E]">
              ADMIN CONSOLE
            </span>

            <span className="text-[10px] font-semibold text-slate-400">
              Workspace
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {ADMIN_NAV_SECTIONS.map((sec) => (
            <div key={sec.title}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {sec.title}
              </p>

              <nav className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                        active
                          ? "bg-[#0F2942] text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-[#0F2942]"
                      }`}
                    >
                      <Icon size={17} strokeWidth={1.8} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}

          <div className="my-3 border-t border-slate-100" />

          {/* View Website */}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <Store size={17} />
            <span>View Website</span>
          </a>
        </div>

        {/* Footer Logout */}
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
