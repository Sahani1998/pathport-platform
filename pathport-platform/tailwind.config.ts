import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#030810",
          900: "#060C1A",
          800: "#0A1122",
          700: "#0D1730",
          600: "#122040",
          500: "#1A2B54",
          400: "#253E72",
          300: "#2E4E8A",
        },
        pathBlue: {
          50:  "#E8F3FF",
          100: "#C5DDFF",
          200: "#96C2FF",
          300: "#60A5FA",
          400: "#3B9EFF",
          500: "#2979FF",
          600: "#1A5FDB",
          700: "#1247B3",
          800: "#0D358A",
          900: "#082463",
        },
        gold: {
          50:  "#FFF8E8",
          100: "#FEECC0",
          200: "#FDDB88",
          300: "#FBC64A",
          400: "#F0A500",
          500: "#D99300",
          600: "#B87800",
          700: "#935F00",
          800: "#6E4600",
          900: "#4A2F00",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body:    ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gold-gradient":   "linear-gradient(135deg, #D99300 0%, #FBC64A 50%, #D99300 100%)",
        "blue-gradient":   "linear-gradient(135deg, #1A5FDB 0%, #3B9EFF 100%)",
        "grid-subtle":     "linear-gradient(rgba(59,158,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,158,255,0.03) 1px, transparent 1px)",
      },
      animation: {
        "float":      "float 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "slide-up":   "slideUp 0.4s ease-out",
        "fade-in":    "fadeIn 0.6s ease-out",
        "ping-slow":  "ping 2s cubic-bezier(0,0,0.2,1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)"  },
          "50%":      { transform: "translateY(-14px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%":      { opacity: "0.9" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to:   { opacity: "1", transform: "translateY(0)"    },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
      },
      boxShadow: {
        "gold":         "0 0 40px rgba(240,165,0,0.35)",
        "gold-sm":      "0 0 20px rgba(240,165,0,0.22)",
        "blue":         "0 0 40px rgba(41,121,255,0.35)",
        "blue-sm":      "0 0 20px rgba(41,121,255,0.20)",
        "glass":        "0 8px 32px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.07)",
        "glass-hover":  "0 16px 48px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.10)",
        "card":         "0 4px 24px rgba(0,0,0,0.40)",
      },
    },
  },
  plugins: [],
};

export default config;
