import React from 'react';
import bedImg from '../assets/products/bed.jpeg';
import sofaImg from '../assets/products/sofa.jpeg';
import dinnerTableImg from '../assets/products/dinner-table.jpeg';
import studyTableImg from '../assets/products/study-table.jpeg';
import fridgeImg from '../assets/products/fridge.jpeg';
import almirahImg from '../assets/products/almirah.jpeg';

interface CategorySectionProps {
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
}

const TOP_CATEGORIES = [
  {
    title: 'BEDROOM',
    count: '9 products',
    image: bedImg,
    categoryKey: 'Bedroom',
  },
  {
    title: 'LIVING ROOM',
    count: '8 products',
    image: sofaImg,
    categoryKey: 'Living Room',
  },
  {
    title: 'DINING',
    count: '3 products',
    image: dinnerTableImg,
    categoryKey: 'Dining',
  },
  {
    title: 'STUDY',
    count: '1 product',
    image: studyTableImg,
    categoryKey: 'Study',
  },
  {
    title: 'APPLIANCES',
    count: '3 products',
    image: fridgeImg,
    categoryKey: 'Appliances',
  },
  {
    title: 'COMBO OFFERS',
    count: '2 products',
    image: almirahImg,
    categoryKey: 'Combo Offers',
  },
];

export const CategorySection: React.FC<CategorySectionProps> = ({ onSelectCategory }) => {
  return (
    <section className="py-12 bg-white border-b border-gray-100" id="categories">
      <div className="max-w-7xl mx-auto px-4">
        {/* SECTION HEADER WITH ORANGE UNDERLINE */}
        <div className="border-b-2 border-gray-100 pb-3 mb-8 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider border-b-2 border-[#f28e2b] -mb-[14px] pb-3">
            TOP CATEGORIES
          </h2>
        </div>

        {/* 6-COLUMN GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {TOP_CATEGORIES.map((cat) => (
            <a
              key={cat.title}
              href="#products"
              onClick={() => onSelectCategory && onSelectCategory(cat.categoryKey)}
              className="group text-center p-3 rounded-lg border border-gray-100 hover:border-amber-300 hover:shadow-md transition bg-white block"
            >
              <div className="h-28 flex items-center justify-center overflow-hidden bg-gray-50 rounded mb-3">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="max-h-24 object-contain group-hover:scale-105 transition duration-300"
                />
              </div>
              <h3 className="font-bold text-xs uppercase text-gray-900 group-hover:text-[#f28e2b] transition">
                {cat.title}
              </h3>
              <p className="text-[11px] text-gray-500">{cat.count}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
