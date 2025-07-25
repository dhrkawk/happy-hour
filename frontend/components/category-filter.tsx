"use client"

import { Button } from "@/components/ui/button"

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

const categories = [
  { id: "전체", label: "전체", emoji: "🍽️" },
  { id: "한식", label: "한식", emoji: "🍲" },
  { id: "양식", label: "양식", emoji: "🍕" },
  { id: "중식", label: "중식", emoji: "🥟" },
  { id: "일식", label: "일식", emoji: "🍣" },
  { id: "카페", label: "카페", emoji: "☕" },
]

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.id)}
          className={`flex-shrink-0 whitespace-nowrap ${
            selectedCategory === category.id
              ? "bg-teal-500 hover:bg-teal-600 text-white"
              : "bg-white hover:bg-teal-50 text-gray-700 border-gray-300"
          }`}
        >
          <span className="mr-1">{category.emoji}</span>
          {category.label}
        </Button>
      ))}
    </div>
  )
}
