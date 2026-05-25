import { Home, Search, ShoppingBag, User, type LucideIcon } from "lucide-react";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Customer Mini App bottom tab bar. Order: Home → Catalog → Orders → Profile.
 */
export const customerNav: BottomNavItem[] = [
  { href: "/home", label: "Asosiy", icon: Home },
  { href: "/catalog", label: "Katalog", icon: Search },
  { href: "/orders", label: "Buyurtmalar", icon: ShoppingBag },
  { href: "/profile", label: "Profil", icon: User },
];
