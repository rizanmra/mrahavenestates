import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { Footer } from "@/components/Footer";
import { MainNav } from "@/components/MainNav";
import { Providers } from "@/components/Providers";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MRA Haven Estates",
    template: "%s | MRA Haven Estates",
  },
  description:
    "Sales, lettings, removals and free valuations across Bradford and West Yorkshire. Instant property value calculator. Call 0330 133 3786.",
  metadataBase: new URL("https://www.mrahavenestates.co.uk"),
  openGraph: {
    title: "MRA Haven Estates",
    description:
      "Sales, lettings, removals and free valuations across Bradford and West Yorkshire.",
    siteName: "MRA Haven Estates",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[color:var(--navy)] text-white">
        <Providers>
          <MainNav />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
