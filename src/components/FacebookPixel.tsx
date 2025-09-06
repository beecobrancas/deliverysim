"use client";

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect, Suspense } from 'react';
import * as fpixel from '@/lib/fpixel';
import { useSettings } from '@/contexts/SettingsContext';

function PixelContent() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const pixelId = settings.facebook_pixel_id;

  useEffect(() => {
    if (!pixelId) return;
    fpixel.pageview();
  }, [pathname, pixelId]);

  if (!pixelId) {
    return null;
  }

  return (
    <Script
      id="fb-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}

export function FacebookPixel() {
  return (
    <Suspense fallback={null}>
      <PixelContent />
    </Suspense>
  );
}