
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
  tag?: string;
  deposit: number;
  availableTenures: number[];
  specs: string[];
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
