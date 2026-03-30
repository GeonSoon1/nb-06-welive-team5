import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // 1. [핵심] 정적 HTML 배포를 위한 설정 (S3 배포 필수)
  output: 'export', 
  
  // 2. [핵심] 이미지 최적화 비활성화
  // Next.js의 기본 이미지 최적화는 '서버'가 필요합니다. 
  // S3는 서버가 없으므로 이 기능을 끄거나 외부 로더를 써야 합니다.
  images: {
    unoptimized: true, 
    domains: ['sprint-be-project.s3.ap-northeast-2.amazonaws.com'],
  },

  // 기존 SVG 설정 유지
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