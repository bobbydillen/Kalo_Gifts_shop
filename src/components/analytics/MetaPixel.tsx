"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { useSettings } from "@/components/settings/SettingsProvider";
import { track, validPixelId } from "@/lib/meta-pixel";

/**
 * Adds the Meta Pixel to every shop page when a Pixel ID is saved in Settings, and reports each
 * page change. Without an ID it renders nothing at all.
 */
export function MetaPixel() {
  const { metaPixelId } = useSettings();
  const path = usePathname();
  const first = useRef(true);

  // The Pixel's own snippet reports the first page view; later page changes are reported here.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    track("PageView");
  }, [path]);

  if (!validPixelId(metaPixelId)) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
    </Script>
  );
}
