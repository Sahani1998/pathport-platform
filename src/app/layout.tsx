import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import CookieBanner from "@/components/marketing/CookieBanner";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"], weight: ["300","400","500","600","700"],
  variable: "--font-display", display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"], weight: ["300","400","500","600","700"],
  variable: "--font-body", display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pathport.sg"),
  title: {
    default:  "PathPort — Study + Earn in Singapore | India's Singapore Diploma Platform",
    template: "%s | PathPort",
  },
  description:
    "PathPort is India's dedicated platform for Singapore private college diploma, advanced diploma, higher diploma, and specialist diploma programmes. 24-hour offer letter support, 6+6 internship pathway, and full arrival services.",
  keywords: [
    "Singapore diploma for Indian students",
    "Singapore private college India",
    "study in Singapore from India",
    "Singapore diploma application India",
    "advanced diploma Singapore",
    "higher diploma Singapore",
    "specialist diploma Singapore",
    "6+6 internship Singapore",
    "Singapore student pass India",
    "PathPort",
  ],
  authors: [{ name: "PathPort", url: "https://pathport.sg" }],
  openGraph: {
    title:       "PathPort — Study + Earn in Singapore",
    description: "India's dedicated Singapore diploma platform. Apply from India, arrive in Singapore, earn with the 6+6 pathway.",
    url:         "https://pathport.sg",
    siteName:    "PathPort",
    type:        "website",
    locale:      "en_IN",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "PathPort — Study + Earn in Singapore",
    description: "India's dedicated Singapore private college diploma platform.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor:   "#060C1A",
  colorScheme:  "dark",
  width:        "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="bg-navy-900 text-white antialiased overflow-x-hidden">
        <AuthProvider>
          {children}
          <CookieBanner />
          <WhatsAppButton />
        </AuthProvider>
      </body>
    </html>
  );
}
