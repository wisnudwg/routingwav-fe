import {
  ChartColumn,
  FolderKanban,
  LayoutDashboard,
  List,
  MessageSquare,
  Percent,
  ReceiptText,
  Search,
  Settings,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import type { Session } from "./auth"
import { can, type Permission } from "./permissions"
import type { ProfileKind } from "./roles"
import { DASHBOARD_HOME } from "./routes"

export type NavChild = { href: string; label: string; alert?: number }
type Base = { label: string; icon: LucideIcon; permission?: Permission }
export type NavLinkItem = Base & { href: string }
export type NavGroupItem = Base & { children: NavChild[] }
export type NavItem = NavLinkItem | NavGroupItem

export const NAV_BY_MODE: Record<ProfileKind, NavItem[]> = {
  talent: [
    { label: "Dashboard", href: "/talent/dashboard", icon: LayoutDashboard, permission: "talent:dashboard.view" },
    { label: "All Products", href: "/talent/products", icon: List, permission: "talent:products.view" },
    { label: "Store Builder", href: "/talent/store-builder", icon: Store, permission: "talent:store.manage" },
    {
      label: "Studio Manager",
      icon: Percent,
      permission: "talent:studio.view",
      children: [
        { label: "Action Needed (1)", href: "/talent/studio/action-needed", alert: 1 },
        { label: "Responded", href: "/talent/studio/responded" },
        { label: "Upcoming (4)", href: "/talent/studio/upcoming" },
        { label: "Completed (7)", href: "/talent/studio/completed" },
      ],
    },
    { label: "Sales & Orders", href: "/talent/sales-orders", icon: ChartColumn, permission: "talent:sales.view" },
  ],
  client: [
    { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard, permission: "client:dashboard.view" },
    { label: "Find Talent", href: "/client/find-talent", icon: Search, permission: "client:talent.browse" },
    {
      label: "My Projects",
      icon: FolderKanban,
      permission: "client:projects.view",
      children: [
        { label: "Draft", href: "/client/projects/draft" },
        { label: "Open for Proposals", href: "/client/projects/open" },
        { label: "In Progress", href: "/client/projects/in-progress" },
        { label: "Completed", href: "/client/projects/completed" },
      ],
    },
    { label: "Orders & Payments", href: "/client/orders", icon: ReceiptText, permission: "client:orders.view" },
  ],
}

/** Shown under both modes; each item is hidden unless the user holds its permission */
export const SHARED_NAV: NavItem[] = [
  { label: "Messages", href: "/messages", icon: MessageSquare, permission: "messages:view" },
  { label: "Wallet", href: "/wallet", icon: Wallet, permission: "wallet:view" },
  { label: "Team", href: "/team", icon: Users, permission: "team:manage" },
  { label: "Account", href: "/account", icon: Settings, permission: "account:manage" },
]

type Flat = { href: string; permission?: Permission }

const flat = (items: NavItem[]): Flat[] =>
  items.flatMap((i): Flat[] =>
    "children" in i
      ? i.children.map((c) => ({ href: c.href, permission: i.permission }))
      : [{ href: i.href, permission: i.permission }]
  )

// Longest href first, so the most specific route wins
const ROUTE_TABLE = [...flat(NAV_BY_MODE.talent), ...flat(NAV_BY_MODE.client), ...flat(SHARED_NAV)]
  .filter((r) => r.permission)
  .sort((a, b) => b.href.length - a.href.length)

/** The permission a URL requires, taken from the same config that builds the menu */
export function routePermission(pathname: string): Permission | undefined {
  return ROUTE_TABLE.find((r) => pathname === r.href || pathname.startsWith(`${r.href}/`))?.permission
}

/** First page this user may open in a mode (null if there is none at all) */
export function homeHref(s: Session, mode: ProfileKind): string | null {
  const ok = (p?: Permission) => !p || can(s, p)
  const mine = flat(NAV_BY_MODE[mode])

  const preferred = mine.find((i) => i.href === DASHBOARD_HOME[mode])
  if (preferred && ok(preferred.permission)) return preferred.href

  return [...mine, ...flat(SHARED_NAV)].find((i) => ok(i.permission))?.href ?? null
}