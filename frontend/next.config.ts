import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ssl.pstatic.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "k.kakaocdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http", // HTTP도 지원
        hostname: "k.kakaocdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "keepick-bucket.s3.ap-northeast-2.amazonaws.com",
        pathname: "**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // node_modules/@mediapipe/face_mesh/face_mesh.js 파일을 대상으로
    config.module.rules.push({
      test: require.resolve("@mediapipe/face_mesh/face_mesh.js"),
      // exports-loader를 사용하여 FaceMesh를 CommonJS 모듈로 내보냅니다.
      use: {
        loader: "exports-loader",
        options: {
          type: "commonjs",
          exports: "FaceMesh",
        },
      },
    });

    return config;
  },
};

export default nextConfig;
