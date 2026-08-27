import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Resolve display and body text through the same app typography tokens.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-serif)"],
      },
      letterSpacing: {
        "heading": "-0.03em",
        "tight-apple": "-0.02em",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.22, 1, 0.36, 1)",
        "spring-heavy": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sidebar: "hsl(var(--sidebar))",
        "user-bubble": "hsl(var(--user-bubble))",
        "assistant-bubble": "hsl(var(--assistant-bubble))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
          6: "hsl(var(--chart-6))",
          7: "hsl(var(--chart-7))",
          8: "hsl(var(--chart-8))",
          9: "hsl(var(--chart-9))",
          10: "hsl(var(--chart-10))"
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))"
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))"
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))"
        },
        "muted-2": {
          DEFAULT: "hsl(var(--muted-2))",
          foreground: "hsl(var(--muted-2-foreground))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        // Tailwind v4 renamed its default shadow scale (v3 `shadow-sm` -> v4
        // `shadow-xs`; v4 `shadow-sm` is heavier). Pin the v3 value so existing
        // `shadow-sm` usages keep their original, lighter appearance.
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "surface-xs": "0 1px 2px hsl(0 0% 0% / 0.15)",
        "surface-sm": "0 1px 3px hsl(0 0% 0% / 0.12), 0 1px 2px hsl(0 0% 0% / 0.08)",
        "surface-md": "0 4px 12px hsl(0 0% 0% / 0.15), 0 1px 3px hsl(0 0% 0% / 0.1)",
        "surface-lg": "0 8px 30px hsl(0 0% 0% / 0.2), 0 2px 8px hsl(0 0% 0% / 0.1)",
        "glow-primary": "0 0 20px hsl(var(--primary) / 0.15), 0 0 60px hsl(var(--primary) / 0.05)",
      },
      // Tailwind v4 also renamed its blur scale (v3 `blur-sm`/`backdrop-blur-sm`
      // = 4px is now `blur-xs`/`backdrop-blur-xs`; v4 `*-sm` = 8px). Pin the v3
      // value so existing `backdrop-blur-sm` frosted surfaces keep their 4px blur.
      blur: {
        sm: "4px",
      },
      backdropBlur: {
        sm: "4px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        "border-beam": {
          "100%": { "offset-distance": "100%" }
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "gradient": {
          to: { backgroundPosition: "calc(var(--bg-size) * -1) 0" },
        },
        // Indeterminate progress sweep. Deliberately transform-only: a
        // transform animation runs on the COMPOSITOR, so it keeps moving even
        // while the main thread is blocked — which is exactly the situation it
        // reports on (an html2canvas capture of a big table freezes JS for
        // seconds). A width/left-based bar would visibly stall instead.
        "gf-indeterminate": {
          "0%": { transform: "translateX(-100%) scaleX(0.4)" },
          "50%": { transform: "translateX(25%) scaleX(0.7)" },
          "100%": { transform: "translateX(140%) scaleX(0.4)" },
        },
        "fleet-ask-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 1px var(--color-ai-halo-a), 0 0 10px -2px var(--color-ai-halo-b), 0 4px 14px -8px rgba(15,23,42,0.14)",
          },
          "50%": {
            boxShadow:
              "0 0 0 1px var(--color-ai-halo-a-strong), 0 0 16px 0 var(--color-ai-halo-b-strong), 0 6px 18px -8px rgba(15,23,42,0.18)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "border-beam":
          "border-beam calc(var(--duration)*1s) infinite linear",
        "fade-in": "fade-in 0.7s ease-out forwards",
        "gradient": "gradient 5s linear infinite",
        "gf-indeterminate": "gf-indeterminate 1.5s ease-in-out infinite",
        "fleet-ask-glow": "fleet-ask-glow 2800ms ease-in-out infinite",
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
