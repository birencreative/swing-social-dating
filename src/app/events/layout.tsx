import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events - Swing Social",
  description: "Discover and join lifestyle events in your area on Swing Social. Find parties, meetups, and connect with the community.",
  openGraph: {
    title: "Events - Swing Social",
    description: "Discover and join lifestyle events in your area on Swing Social. Find parties, meetups, and connect with the community.",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Events - Swing Social",
    description: "Discover and join lifestyle events in your area on Swing Social. Find parties, meetups, and connect with the community.",
    images: ["/logo.png"],
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
