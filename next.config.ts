import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Uploaded photos (avatars, check-ins, challenge covers) live in
    // Supabase Storage -- next/image refuses external hosts unless listed
    // here, restricted to the public storage path.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
