import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pitchDark: "#0B2E23",
        pitch: "#123A28",
        pitch2: "#0E3323",
        gold: "#F4C430",
        goldDeep: "#C9971E",
        chalk: "#F5F1E6",
        chalkDim: "#C9CBC3",
        ink: "#08150F",
        redCard: "#E15252"
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        sans: ["Inter", "sans-serif"]
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        championPulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" }
        },
        confettiFall: {
          to: { transform: "translateY(110vh) rotate(540deg)", opacity: "0.9" }
        }
      },
      animation: {
        float: "float 3.4s ease-in-out infinite",
        championPulse: "championPulse 1.8s ease-in-out infinite",
        confettiFall: "confettiFall linear forwards"
      }
    }
  },
  plugins: []
};

export default config;
