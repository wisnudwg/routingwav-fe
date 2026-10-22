import type { Metadata, Viewport } from "next"
import { Inter, Raleway } from "next/font/google"
import "@workspace/ui/globals.css"
import "flag-icons/css/flag-icons.min.css"
import { ServiceWorkerRegister } from "@/components/pwa/sw-register"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" })

export const metadata: Metadata = {
  title: "Routing.com | Studio Dashboard",
  applicationName: "Routing.com",
  appleWebApp: { capable: true, title: "Routing", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon-iphone-60x60.png" },
}

export const viewport: Viewport = { themeColor: "#6b1a2e" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${raleway.variable}`}>
      <body className="font-inter antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}