const path = require('path')

/**
 * The app sits in a subfolder of a directory that also holds a stray
 * package-lock.json, and Next walks up to the outermost lockfile to decide
 * where the project root is. That put the root one level too high, and the
 * bundler then resolved its own runtime modules under a path its client
 * manifest did not know about, which surfaced as every page 500ing. Pinning
 * the root keeps both bundlers pointed at this folder.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
}

module.exports = nextConfig
