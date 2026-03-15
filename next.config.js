/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        // Old share links: /?signal=<uuid> → /signal/<uuid>
        source: '/',
        has: [{ type: 'query', key: 'signal', value: '(?<id>.+)' }],
        destination: '/signal/:id',
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
        pathname: '/s2/**',
      },
    ],
  },
}

module.exports = nextConfig
