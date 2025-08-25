
import React from 'react';
import { BookCategory } from '@/types/library';
import { TabsTrigger } from '@/components/ui/tabs';

interface LibraryCategoriesProps {
  onSelectCategory: (category: BookCategory | 'all' | 'popular') => void;
  activeCategory: string;
}

const LibraryCategories: React.FC<LibraryCategoriesProps> = ({ 
  onSelectCategory, 
  activeCategory 
}) => {
  const categories: BookCategory[] = [
    "पाठ्यपुस्तकें",
    "रेफरेंस",
    "प्रैक्टिस सेट",
    "नोट्स",
    "अन्य"
  ];

  return (
    <>
      {categories.map((category) => (
        <TabsTrigger
          key={category}
          value={category}
          onClick={() => onSelectCategory(category)}
          className="px-4 py-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 dark:data-[state=active]:bg-purple-950 dark:data-[state=active]:text-purple-200 rounded-md whitespace-nowrap"
        >
          {category}
        </TabsTrigger>
      ))}
    </>
  );
};

export default LibraryCategories;
