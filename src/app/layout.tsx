import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import { BagProvider } from "@/components/bag/BagProvider";
import { Snowfall } from "@/components/effects/Snowfall";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { Loader } from "@/components/brand/Loader";
import { seasonal, site } from "@/lib/site";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: "#06120d",
};

/**
 * Runs before first paint. Visitors who already saw the logo intro in this
 * browser session skip it, as do visitors who prefer reduced motion.
 */
const skipLoader = `try{if(sessionStorage.getItem("kalo-intro")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="seen"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${manrope.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: skipLoader }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Loader />
        <BagProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </BagProvider>
        {seasonal.snowfall && <Snowfall />}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
