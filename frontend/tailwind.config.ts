import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#101116",
        mist: "#f6f7fb",
        ember: "#ff6b4a",
        iris: "#635bff",
        teal: "#0f9f8f"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(16, 17, 22, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
