import type { NextConfig } from 'next'

const config: NextConfig = {
  async rewrites() {
    return [
      { source: '/', destination: '/brief.html' },
      { source: '/brief', destination: '/brief.html' },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default config
