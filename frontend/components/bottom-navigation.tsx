"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Map, ShoppingBag, User, Ticket } from "lucide-react"

export default function BottomNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/home",
      icon: Home,
      label: "홈",
      isActive: pathname === "/home",
    },
    {
      href: "/map",
      icon: Map,
      label: "지도",
      isActive: pathname === "/map",
    },
    {
      href: "/coupon-box",
      icon: Ticket,
      label: "쿠폰함",
      isActive: pathname === "/coupon-box",
    },
    {
      href: "/profile",
      icon: User,
      label: "마이페이지",
      isActive: pathname === "/profile",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 z-30">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                item.isActive ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              <IconComponent className={`w-6 h-6 mb-1 ${item.isActive ? "stroke-2" : "stroke-1.5"}`} />
              <span className={`text-xs ${item.isActive ? "font-medium" : "font-normal"}`}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
