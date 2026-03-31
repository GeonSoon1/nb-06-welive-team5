import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // images: {
  //   domains: ['sprint-be-project.s3.ap-northeast-2.amazonaws.com'],
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mywelive-bucket.s3.ap-northeast-2.amazonaws.com',
        port: '',
        pathname: '/**', // 버킷 내의 모든 경로의 이미지를 허용
      },
    ],
  },
  webpack(config: Configuration) {
    config.module?.rules?.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
