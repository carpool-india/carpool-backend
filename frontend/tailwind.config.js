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
          DEFAULT: "#285A40",
          light: "#E5F1CE",
          dark: "#153E32",
        },
        ink: {
          DEFAULT: "#183D32",
          soft: "#586F5C",
          faint: "#6B806C",
        },
        paper: {
          DEFAULT: "#F7F8F2",
          card: "#FFFFFF",
        },
        line: "#DFE5D9",
        accent: {
          DEFAULT: "#F0A93C",
          dark: "#B5741A",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,33,31,0.04), 0 12px 32px -16px rgba(11,33,31,0.18)",
        floating: "0 20px 60px -20px rgba(11,33,31,0.35)",
        glow: "0 0 0 4px rgba(15,118,110,0.12), 0 18px 40px -18px rgba(15,118,110,0.45)",
      },
      backgroundImage: {
        mesh:
          "radial-gradient(60% 50% at 15% 10%, rgba(15,118,110,0.16) 0%, rgba(15,118,110,0) 60%), radial-gradient(45% 40% at 85% 0%, rgba(240,169,60,0.14) 0%, rgba(240,169,60,0) 60%)",
      },
    },
  },
  plugins: [],
};
