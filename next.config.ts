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
    // Every image in this app is already a Supabase Storage URL -- there's
    // no local /public asset going through next/image -- so there's nothing
    // to gain from Vercel's paid Image Optimization pipeline. Turning it off
    // makes <Image> load the Supabase URL directly instead of proxying
    // through /_next/image, which avoids Vercel's optimization-transform
    // quota entirely: on the Hobby plan, once that quota is used up every
    // optimized image starts 402ing (`OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`)
    // until the next billing cycle -- which is what was breaking every photo
    // in production while working fine locally (`next dev`/`next start`
    // never hit Vercel's optimizer at all).
    unoptimized: true,
  },
};

export default nextConfig;
