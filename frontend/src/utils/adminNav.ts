import {
  LayoutDashboard,
  Tags,
  Armchair,
  Images,
  Megaphone,
  Package,
  Flame,
  MessageSquareQuote,
  LayoutGrid,
  MessageCircle,
  Share2,
  Contact,
  MessageSquareText,
  Star,
  FileText,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
}

export const ADMIN_NAVIGATION: NavItem[] = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Armchair },
  { label: "Banners", path: "/admin/banner", icon: Images },
  { label: "Promo Banners", path: "/admin/promo-banners", icon: Megaphone },
  { label: "Combo Offers", path: "/admin/combos", icon: Package },
  { label: "This Week Deals", path: "/admin/deals", icon: Flame },
  { label: "Customer Stories", path: "/admin/customer-stories", icon: MessageSquareQuote },
  { label: "Homepage Sections", path: "/admin/sections", icon: LayoutGrid },
  { label: "Trending Rentals", path: "/admin/trending-rentals", icon: Star },
  { label: "Feedback Master", path: "/admin/feedback", icon: MessageSquareText },
  { label: "WhatsApp Settings", path: "/admin/settings", icon: MessageCircle },
  { label: "Social Media Settings", path: "/admin/social-media", icon: Share2 },
  { label: "Contact Management", path: "/admin/contact-management", icon: Contact },
  { label: "Blog Management", path: "/admin/blogs", icon: FileText },
];
