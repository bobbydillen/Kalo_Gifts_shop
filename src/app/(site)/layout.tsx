import { BagDrawer } from "@/components/bag/BagDrawer";
import { BagProvider } from "@/components/bag/BagProvider";
import { Loader } from "@/components/brand/Loader";
import { CatalogProvider } from "@/components/catalog/CatalogProvider";
import { Snowfall } from "@/components/effects/Snowfall";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getProducts } from "@/lib/catalog-data";
import { seasonal } from "@/lib/site";

/** Everything the public shop shows around its pages. The admin does not use this. */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const products = await getProducts();

  return (
    <>
      <Loader />
      <CatalogProvider products={products}>
        <BagProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <BagDrawer />
        </BagProvider>
      </CatalogProvider>
      {seasonal.snowfall && <Snowfall />}
    </>
  );
}
