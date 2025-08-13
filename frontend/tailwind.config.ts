import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/entities/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/widgets/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 1. 새로운 색상 팔레트 정의
      colors: {
        // 메인 컬러
        main: {
          black: "#222222",
          orange: "#FE7A25",
          yellow: "#FCBC34",
        },
        // 보조 컬러
        accent: {
          beige: "#F5E7C6",
          "beige-light": "#FAF3E1",
          red: "#D22016",
        },
        background: "#222222",
        "background-secondary": "#1C1C1E",
        primary: "#FE7A25",
        "primary-hover": "#E06B1F",
        secondary: "#FCBC34",
        "secondary-hover": "#E4A92E",
        surface: "#2C2C2E",
        "text-primary": "#FFFFFF",
        "text-secondary": "#A0A0A5",
        "border-primary": "#424245",
      },
      // 2. 폰트 유틸리티 클래스 정의
      fontFamily: {
        header: ["SB-Aggro", "sans-serif"], // 제목, 헤더용 (어그로체)
        body: ["Line-Seed", "sans-serif"], // 본문, 일반 텍스트용 (LINE Seed)
      },
    },
  },
  plugins: [],
};

export default config;
