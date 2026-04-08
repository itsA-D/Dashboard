import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#10223c",
        paper: "#f5f2ea",
        ember: "#c75c3d",
        moss: "#6d8b65",
        mist: "#dfe6ef",
        slate: "#5d6877"
      },
      boxShadow: {
        card: "0 20px 60px rgba(16, 34, 60, 0.12)"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
