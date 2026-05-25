import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oesdijljjojntrmslbwk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:lang/content/motion/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy',  value: 'same-origin'  },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        '@ffmpeg/ffmpeg',
        '@ffmpeg/util',
        '@ffmpeg/core',
      ];

      config.plugins.push(
        new (require('webpack').NormalModuleReplacementPlugin)(
          /^node:/,
          (resource: { request: string }) => {
            resource.request = resource.request.replace(/^node:/, '');
          }
        )
      );

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, https: false, http: false,
        path: false, stream: false, zlib: false,
        net: false, tls: false, child_process: false,
        os: false, crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;