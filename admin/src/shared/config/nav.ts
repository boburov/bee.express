import {
  LayoutDashboard,
  Store,
  Bike,
  Users,
  ShoppingBag,
  FolderTree,
  Tags,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  ScrollText,
  Settings,
  Bell,
  Star,
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
 * SuperAdmin paneli navigatsiyasi. Bo'limlar TZ 18-bo'limi asosida (README).
 * Yangi sahifa qo'shilganda — birinchi shu ro'yxatga qo'shing.
 */
export const adminNav: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Boshqaruv", icon: LayoutDashboard },
    ],
  },
  {
    title: "Foydalanuvchilar",
    items: [
      { href: "/dashboard/sellers", label: "Sotuvchilar", icon: Store },
      { href: "/dashboard/couriers", label: "Kuryerlar", icon: Bike },
      { href: "/dashboard/customers", label: "Xaridorlar", icon: Users },
    ],
  },
  {
    title: "Operatsiya",
    items: [
      { href: "/dashboard/orders", label: "Buyurtmalar", icon: ShoppingBag },
      { href: "/dashboard/moderation", label: "Moderatsiya", icon: ShieldAlert },
      { href: "/dashboard/featured", label: "Top restoranlar", icon: Star },
      { href: "/dashboard/notifications", label: "Bildirishnomalar", icon: Bell },
    ],
  },
  {
    title: "Katalog",
    items: [
      { href: "/dashboard/categories", label: "Kategoriyalar", icon: FolderTree },
      { href: "/dashboard/attributes", label: "Atributlar", icon: Sparkles },
      { href: "/dashboard/brands", label: "Brendlar", icon: Tags },
    ],
  },
  {
    title: "Tizim",
    items: [
      { href: "/dashboard/roles", label: "Rollar", icon: ShieldCheck },
      { href: "/dashboard/finance", label: "Moliya", icon: Wallet },
      { href: "/dashboard/audit", label: "Audit log", icon: ScrollText },
      { href: "/dashboard/settings", label: "Sozlamalar", icon: Settings },
    ],
  },
];
