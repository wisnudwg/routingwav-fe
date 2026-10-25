import {
  ChartColumn,
  FolderKanban,
  LayoutDashboard,
  List,
  MessageSquare,
  Percent,
  ReceiptText,
  Search,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import type { Permission } from "./permissions"
import type { ProfileKind } from "./roles"

export type NavChild = { href: string; label: string; alert?: number }
type Base = { label: string; icon: LucideIcon; permission?: Permission }
export type NavLinkItem = Base & { href: string }
export type NavGroupItem = Base & { children: NavChild[] }
export type NavItem = NavLinkItem | NavGroupItem

export const NAV_BY_MODE: Record<ProfileKind, NavItem[]> = {
  talent: [
    { label: "Dashboard", href: "/talent/dashboard", icon: LayoutDashboard },
    { label: "All Products", href: "/talent/products", icon: List },
    { label: "Store Builder", href: "/talent/store-builder", icon: Store },
    {
      label: "Studio Manager",
      icon: Percent,
      children: [
        { label: "Action Needed (1)", href: "/talent/studio/action-needed", alert: 1 },
        { label: "Responded", href: "/talent/studio/responded" },
        { label: "Upcoming (4)", href: "/talent/studio/upcoming" },
        { label: "Completed (7)", href: "/talent/studio/completed" },
      ],
    },
    { label: "Sales & Orders", href: "/talent/sales-orders", icon: ChartColumn },
  ],
  client: [
    { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
    { label: "Find Talent", href: "/client/find-talent", icon: Search },
    {
      label: "My Projects",
      icon: FolderKanban,
      children: [
        { label: "Draft", href: "/client/projects/draft" },
        { label: "Open for Proposals", href: "/client/projects/open" },
        { label: "In Progress", href: "/client/projects/in-progress" },
        { label: "Completed", href: "/client/projects/completed" },
      ],
    },
    { label: "Orders & Payments", href: "/client/orders", icon: ReceiptText },
  ],
}

/** Shown under both modes; each item is hidden unless the user holds its permission */
export const SHARED_NAV: NavItem[] = [
  { label: "Messages", href: "/messages", icon: MessageSquare, permission: "messages:use" },
  { label: "Wallet", href: "/wallet", icon: Wallet, permission: "wallet:view" },
  { label: "Team", href: "/team", icon: Users, permission: "team:manage" },
]