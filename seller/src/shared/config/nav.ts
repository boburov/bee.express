import {
  Bike,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * Seller panel navigation. Mirrors TZ §19 (seller panel modules).
 * Add new pages here first — sidebar + breadcrumbs pull from this list.
 */
export const sellerNav: NavSection[] = [
  {
    items: [{ href: "/dashboard", label: "Boshqaruv", icon: LayoutDashboard }],
  },
  {
    title: "Katalog",
    items: [
      { href: "/dashboard/products", label: "Mahsulotlar", icon: Package },
      { href: "/dashboard/store", label: "Do'kon", icon: Store },
    ],
  },
  {
    title: "Operatsiya",
    items: [
      { href: "/dashboard/orders", label: "Buyurtmalar", icon: ShoppingBag },
      { href: "/dashboard/contracts", label: "Kuryerlar", icon: Bike },
    ],
  },
  {
    title: "Moliya",
    items: [{ href: "/dashboard/finance", label: "Moliya", icon: Wallet }],
  },
];
