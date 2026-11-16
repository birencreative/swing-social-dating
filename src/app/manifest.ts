import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Swing Social",
    short_name: "SwingSocial",
    description:
      "Swing Social - Connect, explore, and experience a new way of social interaction.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f071a",
    theme_color: "#0f071a",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/favicon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
