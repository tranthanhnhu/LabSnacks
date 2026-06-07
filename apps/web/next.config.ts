import type { NextConfig } from "next";

function apiImagePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
  ];

  try {
    const url = new URL(base);
    patterns.push({
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/uploads/**",
    });
  } catch {
    patterns.push(
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/uploads/**" },
    );
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: apiImagePatterns(),
  },
};

export default nextConfig;
