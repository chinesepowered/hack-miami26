/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070912",
          900: "#0B0F19",
          800: "#121826",
          700: "#1B2333",
          600: "#2A3346",
          500: "#475063",
        },
        brand: {
          400: "#7CFFB2",
          500: "#19F58A",
          600: "#10C46A",
        },
        accent: {
          violet: "#B084FF",
          pink: "#FF6BB1",
          amber: "#FFC857",
        },
      },
      fontFamily: {
        display: ["System"],
      },
    },
  },
  plugins: [],
};
