/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    swc: true,
  },
  swcMinify: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
