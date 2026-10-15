import type { Metadata } from "next"
import { Inter, Playfair_Display, Raleway } from "next/font/google"
import "@workspace/ui/globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" })

export const metadata: Metadata = {
  title: "Routing.com | Studio Dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${raleway.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}