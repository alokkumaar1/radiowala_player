/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — the site has no server-side logic, so it deploys as plain
  // files to Netlify / GitHub Pages / Cloudflare Pages.
  output: 'export',
  images: { unoptimized: true },
}

export default nextConfig
