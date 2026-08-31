/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0F766E",
          dark: "#115E59",
          light: "#CCFBF1",
        },
        canvas: "#F3F6F5",
        sos: "#DC2626",
      },
    },
  },
  plugins: [],
};
