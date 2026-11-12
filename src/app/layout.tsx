import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import { site } from "@/lib/site";
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

/**
 * Root shell shared by the shop and the admin. The shop's own chrome (header,
 * footer, bag, snow, loading screen) lives in app/(site)/layout.tsx.
 */
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
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
