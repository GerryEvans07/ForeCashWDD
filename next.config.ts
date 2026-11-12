import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // foto struk maksimal 2 MB + sedikit ruang untuk data form lainnya
      bodySizeLimit: '3mb',
    },
  },
}

export default nextConfig
