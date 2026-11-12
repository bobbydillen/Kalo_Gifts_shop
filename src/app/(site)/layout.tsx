import { BagDrawer } from "@/components/bag/BagDrawer";
import { BagProvider } from "@/components/bag/BagProvider";
import { Loader } from "@/components/brand/Loader";
import { CatalogProvider } from "@/components/catalog/CatalogProvider";
import { Snowfall } from "@/components/effects/Snowfall";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getProducts } from "@/lib/catalog-data";
import { getSettings } from "@/lib/settings-data";

/** Everything the public shop shows around its pages. The admin does not use this. */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);

  return (
    <>
      <Loader />
      <SettingsProvider settings={settings}>
        <CatalogProvider products={products}>
          <BagProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <BagDrawer />
          </BagProvider>
        </CatalogProvider>
      </SettingsProvider>
      {settings.snowfall && <Snowfall />}
    </>
  );
}
