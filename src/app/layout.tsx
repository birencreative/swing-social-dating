import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PushNotificationsProvider from "@/components/PushNotificationsProvider";
import { SocketProvider } from "@/context/SocketProvider";
import { QueryProvider } from "@/context/QueryProvider";



const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
  display: "optional",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "optional",
});

export const metadata: Metadata = {
  title: {
    default: "Swing Social",
    template: "%s | Swing Social",
  },
  description:
    "Swing Social – Connect, explore, and experience a new way of social interaction with verified profiles, secure chats, and modern UI.",
  keywords: [
    "Swing Social",
    "Social Networking",
    "Swinger App",
    "Meet People",
    "Couples",
    "Lifestyle",
    "Dating",
  ],
  authors: [{ name: "Swing Social Team" }],
  metadataBase: new URL("https://app.swingsocial.co"),
  openGraph: {
    title: "Swing Social",
    description:
      "Join Swing Social and discover a safe, fun, and modern space to meet like-minded people.",
    url: "https://app.swingsocial.co",
    siteName: "Swing Social",
    images: [
      {
        url: "/favicon.png",
        width: 1200,
        height: 630,
        alt: "Swing Social Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Swing Social",
    description: "Join Swing Social - the modern lifestyle social platform.",
    creator: "@swingsocial",
    images: ["/favicon.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`
        ${playfair.variable}
        ${inter.variable}
      `}
    >
      <body suppressHydrationWarning>
        <ToastContainer theme="dark" position="top-center" autoClose={3000} />
        <ClientLayout>
          <QueryProvider>
            <SocketProvider>
              <PushNotificationsProvider>{children}</PushNotificationsProvider>
            </SocketProvider>
          </QueryProvider>
        </ClientLayout>
      </body>
    </html>
  );
}
