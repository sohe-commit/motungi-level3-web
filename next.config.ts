import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    // 예전 /reservations/new, /reservations/mine 두 페이지를 /reservations 하나로 합치면서
    // 남아있을 수 있는 북마크/캐시된 링크가 404로 끊기지 않도록 안내
    return [
      { source: "/reservations/new", destination: "/reservations", permanent: false },
      { source: "/reservations/mine", destination: "/reservations", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
