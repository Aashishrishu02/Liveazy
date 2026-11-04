
export interface Product {
  id: string;
  name: string;
  category:
    | "Furniture"
    | "Appliances"
    | "Electronics"
    | "Bikes"
    | "Cameras"
    | "Gaming"
    | "Home & Living";
  monthlyPrice: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  images?: Array<{ id?: string; imageUrl?: string; url?: string; sortOrder?: number } | string>;
  tag?: string;
  deposit: number;
  availableTenures: number[];
  specs: string[];
  description?: string | null;
  rent3M?: number | null;
  rent6M?: number | null;
  rent12M?: number | null;
  deposit3M?: number | null;
  deposit6M?: number | null;
  deposit12M?: number | null;
}

export interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  itemCount: string;
  href: string;
}

export interface CartItem {
  product: Product;
  selectedTenure: number;
  quantity: number;
}
