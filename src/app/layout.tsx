import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { ReviewsProvider } from "@/contexts/ReviewsContext";
import { UserProvider } from "@/contexts/UserContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { CategoryProvider } from "@/contexts/CategoryContext";
import { Toaster } from "@/components/ui/sonner";
import { CustomStyles } from "@/components/CustomStyles";
import { CartDrawer } from "@/components/CartDrawer";
import { FacebookPixel } from "@/components/FacebookPixel";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rei das Coxinhas - Delivery",
  description: "As melhores coxinhas da cidade com entrega rápida!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <CustomStyles />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          <UserProvider>
            <AdminProvider>
              <ReviewsProvider>
                <SettingsProvider>
                  <CategoryProvider>
                    <CartProvider>
                      {children}
                      <CartDrawer />
                      <Toaster position="top-right" />
                      <FacebookPixel />
                    </CartProvider>
                  </CategoryProvider>
                </SettingsProvider>
              </ReviewsProvider>
            </AdminProvider>
          </UserProvider>
        </AuthProvider>

        {/* Scripts UTMify */}
        <Script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-xcod-sck
          data-utmify-prevent-subids
          strategy="afterInteractive"
        />
        <Script id="utmify-pixel-script" strategy="afterInteractive">
          {`
            window.pixelId = "689388d9e3cc2fbdd6838396";
            var a = document.createElement("script");
            a.setAttribute("async", "");
            a.setAttribute("defer", "");
            a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
            document.head.appendChild(a);
          `}
        </Script>
      </body>
    </html>
  );
}