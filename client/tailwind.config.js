/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f7f4ee",
        foreground: "#1c1810",
        gold: "#c49a2e",
        ember: "#b83e2f",
        teal: "#2aa898",
        ink: "#eee9de",
        panel: "#ffffff",
        line: "#e2ddd3",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 24px 80px rgba(212, 168, 71, 0.16)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(0, -12px, 0) scale(1.03)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 168, 71, 0)" },
          "50%": { boxShadow: "0 0 0 6px rgba(212, 168, 71, 0.16)" },
        },
      },
      animation: {
        drift: "drift 9s ease-in-out infinite",
        fadeIn: "fadeIn 420ms ease-out both",
        pulseGold: "pulseGold 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
