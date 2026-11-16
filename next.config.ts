import type { NextConfig } from "next";
// Dynamic import for bundle analyzer to prevent production crashes when devDependencies are missing

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,

    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains; preload",
                    },
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin",
                    },
                ],
            },
        ];
    },

    async redirects() {
        return [
            {
                source: '/:path*',
                has: [
                    {
                        type: 'host',
                        value: 'swing-social-user.vercel.app',
                    },
                ],
                destination: 'https://app.swingsocial.co/:path*',
                permanent: true,
            },
            {
                source: '/sample-events',
                destination: '/partner-events',
                permanent: true,
            },
            {
                source: '/sample-events/:id',
                destination: '/partner-events/:id',
                permanent: true,
            },
        ];
    },

    images: {
        deviceSizes: [360, 414, 640, 750, 828, 1080, 1200],
        imageSizes: [64, 128, 256, 350, 480],
        formats: ['image/avif', 'image/webp'],
        qualities: [50, 75],
        minimumCacheTTL: 60 * 60 * 24 * 30,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
            {
                protocol: "http",
                hostname: "**",
            },
            {
                protocol: "https",
                hostname: "truecontractingsolutions.app",
            },
            {
                protocol: "http",
                hostname: "truecontractingsolutions.app",
            },
            {
                protocol: "https",
                hostname: "app.swingsocial.co",
            },
            {
                protocol: "http",
                hostname: "app.swingsocial.co",
            },
            {
                protocol: "https",
                hostname: "**.amazonaws.com",
            },
            {
                protocol: "http",
                hostname: "**.amazonaws.com",
            },
            {
                protocol: "https",
                hostname: "swing-social-user.vercel.app",
            },
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
            },
            {
                protocol: "http",
                hostname: "res.cloudinary.com",
            },
            {
                protocol: "https",
                hostname: "**.digitaloceanspaces.com",
            },
            {
                protocol: "https",
                hostname: "modernlifestyle-prod.nyc3.cdn.digitaloceanspaces.com",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
            {
                protocol: "https",
                hostname: "firebasestorage.googleapis.com",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
        ],
    },

    allowedDevOrigins: [
        "localhost",
        "127.0.0.1",
        "192.168.1.13",      // 👈 Updated to match your current mobile access IP
    ],

    compiler: {
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
    },

    turbopack: {}, // 👈 fixes Issue #2 (explained below)
};

const config = process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer")({ enabled: true })(nextConfig)
    : nextConfig;

export default config;




// import { withSentryConfig } from "@sentry/nextjs";
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//     reactStrictMode: true,

//     images: {
//         unoptimized: true,
//         remotePatterns: [
//             {
//                 protocol: "https",
//                 hostname: "truecontractingsolutions.app",
//             },
//             {
//                 protocol: "https",
//                 hostname: "**.amazonaws.com",
//             },
//             {
//                 protocol: "https",
//                 hostname: "swing-social-user.vercel.app",
//             },
//             {
//                 protocol: "https",
//                 hostname: "res.cloudinary.com",
//             },
//         ],
//     },

//     allowedDevOrigins: [
//         "localhost",
//         "127.0.0.1",
//         "192.168.1.13",      // 👈 Updated to match your current mobile access IP
//     ],

//     turbopack: {}, // 👈 fixes Issue #2 (explained below)
// };

// export default withSentryConfig(nextConfig, {
//   // For all available options, see:
//   // https://www.npmjs.com/package/@sentry/webpack-plugin#options

//   org: "swing-social-76",

//   project: "javascript-nextjs",

//   // Only print logs for uploading source maps in CI
//   silent: !process.env.CI,

//   // For all available options, see:
//   // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

//   // Upload a larger set of source maps for prettier stack traces (increases build time)
//   widenClientFileUpload: true,

//   // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
//   // This can increase your server load as well as your hosting bill.
//   // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
//   // side errors will fail.
//   tunnelRoute: "/monitoring",

//   webpack: {
//     // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
//     // See the following for more information:
//     // https://docs.sentry.io/product/crons/
//     // https://vercel.com/docs/cron-jobs
//     automaticVercelMonitors: true,

//     // Tree-shaking options for reducing bundle size
//     treeshake: {
//       // Automatically tree-shake Sentry logger statements to reduce bundle size
//       removeDebugLogging: true,
//     },
//   }
// });