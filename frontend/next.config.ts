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
        protocol: "http",
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
  // 🔥 간단한 해결: 서버 사이드에서 MediaPipe 모듈들을 완전히 제외
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 서버 사이드에서는 MediaPipe 관련 모듈들을 externals로 처리
      config.externals = config.externals || [];
      config.externals.push({
        '@mediapipe/face_mesh': 'commonjs @mediapipe/face_mesh',
        '@mediapipe/tasks-vision': 'commonjs @mediapipe/tasks-vision',
        '@mediapipe/camera_utils': 'commonjs @mediapipe/camera_utils',
        '@mediapipe/drawing_utils': 'commonjs @mediapipe/drawing_utils'
      });
    } else {
      // 클라이언트 사이드에서는 FaceMesh exports-loader 설정 추가
      config.module.rules.push({
        test: require.resolve("@mediapipe/face_mesh/face_mesh.js"),
        use: {
          loader: "exports-loader",
          options: {
            type: "commonjs",
            exports: "FaceMesh",
          },
        },
      });
    }

    return config;
  },
};

export default nextConfig;