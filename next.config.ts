/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    /**
     * Allow remote logos from any HTTPS domain without having to enumerate
     * every possible hostname — ideal for user‑supplied issuer assets.
     * Adjust pathname/port if you need stricter control.
     */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**',
      },
    ],
  },
}

module.exports = nextConfig