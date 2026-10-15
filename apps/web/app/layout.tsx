import type { Metadata } from "next"
import { Inter, Raleway } from "next/font/google"
import "@workspace/ui/globals.css"
import { Navbar } from "@/components/layout/navbar"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" })

export const metadata: Metadata = {
  title: "Routing.com | Where Music Gets Produced",
  description:
    "Platform & marketplace produksi musik end-to-end di Indonesia.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${inter.variable} ${raleway.variable}`}>
      <body className="font-sans antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
