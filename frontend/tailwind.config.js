/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#0F766E",
          light: "#CCFBF1",
          dark: "#042F2E",
        },
        ink: {
          DEFAULT: "#0B211F",
          soft: "#4A6864",
          faint: "#7C9994",
        },
        paper: {
          DEFAULT: "#F5FAF9",
          card: "#FFFFFF",
        },
        line: "#DCEAE7",
        accent: {
          DEFAULT: "#F0A93C",
          dark: "#B5741A",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,33,31,0.04), 0 12px 32px -16px rgba(11,33,31,0.18)",
        floating: "0 20px 60px -20px rgba(11,33,31,0.35)",
      },
      backgroundImage: {
        mesh:
          "radial-gradient(60% 50% at 15% 10%, rgba(15,118,110,0.16) 0%, rgba(15,118,110,0) 60%), radial-gradient(45% 40% at 85% 0%, rgba(240,169,60,0.14) 0%, rgba(240,169,60,0) 60%)",
      },
    },
  },
  plugins: [],
};
