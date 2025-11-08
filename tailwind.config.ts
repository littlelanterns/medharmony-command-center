import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark-blue': '#002C5F',
        'primary-teal': '#008080',
        'accent-emerald': '#50C878',
        'accent-silver': '#C0C0C0',
      },
    },
  },
  plugins: [],
};

export default config;
