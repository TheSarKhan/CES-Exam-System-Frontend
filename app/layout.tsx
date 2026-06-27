import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/lib/toast";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "CES Assessment — Qiymətləndirmə Platforması",
    template: "%s · CES Assessment",
  },
  description:
    "Construction Equipment Services üçün daxili imtahan, qiymətləndirmə və sorğu platforması.",
  openGraph: {
    title: "CES — Korporativ Qiymətləndirmə Platforması",
    description:
      "İmtahan, qiymətləndirmə və analitika bir interfeysdə. Linkə keçərək imtahanınıza başlayın.",
    siteName: "CES Assessment",
    type: "website",
    locale: "az_AZ",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CES Assessment" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CES — Korporativ Qiymətləndirmə Platforması",
    description: "İmtahan, qiymətləndirmə və analitika bir interfeysdə.",
    images: ["/og-image.png"],
  },
};

// Set the theme before paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{if(localStorage.getItem('ces_theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="az"
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
