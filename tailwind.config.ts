import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // NH 브랜드 톤 (NH농협 그린 계열)
        nh: {
          green: "#009a44",
          greenDark: "#007a36",
          yellow: "#ffd400",
          gray: "#f4f6f5",
        },
      },
    },
  },
  plugins: [],
};

export default config;
