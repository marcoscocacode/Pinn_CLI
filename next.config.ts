import type { NextConfig } from "next";

// Extract hostname from Supabase URL env var
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'placehold.co',
  },
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  },
];

// Only add Supabase pattern if env var exists
if (supabaseHostname) {
  remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHostname,
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: remotePatterns as any, // Cast to avoid strict type issues with pushed items
  },
};

export default nextConfig;
