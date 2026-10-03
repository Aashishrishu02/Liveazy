import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../types/rental';

// Local assets matching the products
import bedImg from '../assets/products/bed.jpeg';
import bed1Img from '../assets/products/bed1.jpeg';
import almirahImg from '../assets/products/almirah.jpeg';
import fridgeImg from '../assets/products/fridge.jpeg';
import washingMachineImg from '../assets/products/washing-machine.jpeg';
import electronicsImg from '../assets/products/electronics.jpeg';
import dinnerTableImg from '../assets/products/dinner-table.jpeg';
import sofaImg from '../assets/products/sofa.jpeg';
import mirrorImg from '../assets/products/mirror.jpeg';
import studyTableImg from '../assets/products/study-table.jpeg';

interface PopularRentalsProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchFilter?: string;
  onClearSearch?: () => void;
  wishlistIds: Set<string>;
  onToggleWishlist: (product: Product) => void;
  onRentNow: (product: Product) => void;
}

export const PopularRentals: React.FC<PopularRentalsProps> = ({
  onRentNow,
}) => {
  const [specialTab, setSpecialTab] = useState<'NEW' | 'FEATURED' | 'TOP SELLERS'>('NEW');
  const [catalogTab, setCatalogTab] = useState<'NEW' | 'FEATURED' | 'TOP SELLERS'>('NEW');

  // Spotlight product
  const spotlightProduct: Product = {
    id: 'spotlight-bed-combo',
    name: 'Bedroom Combo (Bed + Wardrobe)',
    category: 'Furniture',
    monthlyPrice: 1500,
    deposit: 0,
    availableTenures: [3, 6, 12],
    rating: 4.9,
    reviewsCount: 42,
    image: bed1Img,
    specs: ['Solid Wood Double Bed', '2-Door Engineered Wood Almirah', 'Free Installation'],
  };

  // Special Offer 6 products
  const specialOffers = [
    {
      id: 'sp-1',
      name: 'Sideboard Cabinet (4 Door + 2 Drawer)',
      category: 'Bedroom, Living Room',
      price: '₹900.00',
      image: almirahImg,
    },
    {
      id: 'sp-2',
      name: 'Bedroom Combo (Bed + Wardrobe)',
      category: 'Bedroom, Combo Offers',
      price: '₹1,500.00',
      image: bedImg,
    },
    {
      id: 'sp-3',
      name: 'Fridge + Washing Machine Combo',
      category: 'Combo Offers, Appliances',
      price: '₹1,000.00',
      image: fridgeImg,
    },
    {
      id: 'sp-4',
      name: 'TV (Smart, 32")',
      category: 'Appliances, Living Room',
      price: '₹1,000.00',
      image: electronicsImg,
    },
    {
      id: 'sp-5',
      name: 'Washing Machine (Auto)',
      category: 'Appliances',
      price: '₹600.00',
      image: washingMachineImg,
    },
    {
      id: 'sp-6',
      name: 'Fridge (160–185 Ltr, Single Door)',
      category: 'Appliances, Dining',
      price: '₹600.00',
      image: fridgeImg,
    },
  ];

  // Travelers & IT Professionals 6 products
  const travelersProducts = [
    {
      id: 'tr-1',
      name: 'Double Bed with Storage',
      category: 'Bedroom',
      price: '₹1,200.00',
      image: bed1Img,
    },
    {
      id: 'tr-2',
      name: 'Dining Table – 4 Seater',
      category: 'Dining Room',
      price: '₹1,200.00',
      image: dinnerTableImg,
    },
    {
      id: 'tr-3',
      name: 'Sofa Premium (3+1+1)',
      category: 'Living Room',
      price: '₹1,500.00',
      image: sofaImg,
    },
    {
      id: 'tr-4',
      name: 'Sofa Regular (3+1+1)',
      category: 'Living Room',
      price: '₹1,000.00',
      image: sofaImg,
    },
    {
      id: 'tr-5',
      name: 'Dressing Table with Mirror',
      category: 'Bedroom',
      price: '₹500.00',
      image: mirrorImg,
    },
    {
      id: 'tr-6',
      name: 'Study Table + Office Chair',
      category: 'Study / WFH',
      price: '₹600.00',
      image: studyTableImg,
    },
  ];

  const handleCardClick = (name: string, priceStr: string, image: string, cat: string) => {
    const numericPrice = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 999;
    const validCategory: Product['category'] =
      cat.toLowerCase().includes('appliances')
        ? 'Appliances'
        : 'Furniture';
    onRentNow({
      id: `prod-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name,
      category: validCategory,
      monthlyPrice: numericPrice,
      deposit: 0,
      availableTenures: [3, 6, 12],
      rating: 4.8,
      reviewsCount: 28,
      image,
      specs: ['Verified condition', 'Doorstep delivery in Pune', 'Professional installation'],
    });
  };

  return (
    <div id="products" className="space-y-12">
      {/* ========================================================= */}
      {/* 1. DUAL SALE SPECIAL OFFER (Stitch: DualSaleSpecialOffer) */}
      {/* ========================================================= */}
      <section className="pt-10 pb-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side: Sale Products Spotlight (4 Columns) */}
            <div className="lg:col-span-4 border-2 border-[#f28e2b] rounded-lg p-5 flex flex-col justify-between bg-white shadow-xs">
              <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                    SALE PRODUCTS
                  </h3>
                  <div className="flex items-center space-x-1 text-gray-400 text-xs">
                    <button className="hover:text-gray-800 px-1 transition" aria-label="Previous sale product">
                      <ChevronLeft size={14} />
                    </button>
                    <button className="hover:text-gray-800 px-1 transition" aria-label="Next sale product">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Spotlight Card */}
                <div className="relative group cursor-pointer" onClick={() => onRentNow(spotlightProduct)}>
                  <div className="relative overflow-hidden rounded-md mb-4 bg-gray-50 flex items-center justify-center">
                    <img
                      src={bed1Img}
                      alt={spotlightProduct.name}
                      className="w-full h-72 object-cover object-center group-hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-[#f28e2b] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow">
                      HOT DEAL
                    </span>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs text-gray-400 font-medium">Bedroom, Combo Offers</p>
                    <h4 className="font-bold text-gray-900 text-base group-hover:text-[#f28e2b] transition">
                      {spotlightProduct.name}
                    </h4>
                    <div className="pt-1">
                      <span className="text-[#f28e2b] font-extrabold text-lg">₹1,500.00</span>
                      <span className="text-xs text-gray-500">/month</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 border-t border-gray-100 flex items-center justify-center space-x-3">
                <a
                  href="https://wa.me/919423838109?text=Hi%20RentNest,%20I%20am%20interested%20in%20renting%20Bedroom%20Combo"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center bg-[#222222] hover:bg-[#f28e2b] text-white text-xs font-bold uppercase py-2.5 rounded transition duration-200"
                >
                  Rent Now via WhatsApp
                </a>
              </div>
            </div>

            {/* Right Side: Special Offer Subgrid (8 Columns) */}
            <div className="lg:col-span-8">
              {/* Tabbed Header */}
              <div className="border-b border-gray-200 pb-3 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-6">
                  <h3 className="text-base font-bold uppercase tracking-wider text-gray-900 border-b-2 border-[#f28e2b] -mb-[15px] pb-3">
                    SPECIAL OFFER
                  </h3>
                  <div className="flex space-x-4 text-xs font-bold uppercase tracking-wide">
                    {(['NEW', 'FEATURED', 'TOP SELLERS'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSpecialTab(tab)}
                        className={`transition ${
                          specialTab === tab
                            ? 'text-[#f28e2b]'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-xs self-end sm:self-auto">
                  <button className="p-1 hover:text-gray-800 transition" aria-label="Previous">
                    <ChevronLeft size={14} />
                  </button>
                  <button className="p-1 hover:text-gray-800 transition" aria-label="Next">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Product Grid: 6 Items */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {specialOffers.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item.name, item.price, item.image, item.category)}
                    className="border border-gray-100 hover:border-gray-200 hover:shadow rounded p-3 transition flex flex-col justify-between bg-white cursor-pointer group"
                  >
                    <div className="h-36 overflow-hidden rounded mb-3 bg-gray-50 flex items-center justify-center p-2">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-[#f28e2b] transition">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-gray-400">{item.category}</p>
                      <p className="text-[#f28e2b] font-bold text-xs mt-1">
                        {item.price} <span className="text-gray-500 font-normal">/month</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. CATALOG SECTION (Stitch: ForTravelersAndCatalog)      */}
      {/* ========================================================= */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <div className="border-b border-gray-200 pb-3 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-6">
              <h3 className="text-base font-bold uppercase tracking-wider text-gray-900 border-b-2 border-[#f28e2b] -mb-[15px] pb-3">
                FOR TRAVELERS &amp; IT PROFESSIONALS
              </h3>
              <div className="flex space-x-4 text-xs font-bold uppercase tracking-wide">
                {(['NEW', 'FEATURED', 'TOP SELLERS'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCatalogTab(tab)}
                    className={`transition ${
                      catalogTab === tab
                        ? 'text-[#f28e2b]'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-xs">
              <button className="p-1 hover:text-gray-800 transition" aria-label="Previous">
                <ChevronLeft size={14} />
              </button>
              <button className="p-1 hover:text-gray-800 transition" aria-label="Next">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 6-Product Responsive Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {travelersProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item.name, item.price, item.image, item.category)}
                className="border border-gray-100 hover:border-amber-300 rounded p-3 transition flex flex-col justify-between bg-white cursor-pointer group"
              >
                <div className="h-32 overflow-hidden rounded mb-2 bg-gray-50 flex items-center justify-center p-1">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-[#f28e2b] transition">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-gray-400">{item.category}</p>
                  <p className="text-[#f28e2b] font-bold text-xs mt-1">
                    {item.price} <span className="text-[10px] text-gray-500 font-normal">/mo</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PopularRentals;
