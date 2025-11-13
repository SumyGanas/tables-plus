/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      './src/**/*.{ts,tsx,js,jsx}',
      './.{ts,tsx,js,jsx}',
    ],
    prefix: "",
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        colors: {
          border: "hsl(var(--background-modifier-border))",
          input: "hsl(var(--background-modifier-border))",
          ring: "hsl(var(--interactive-accent))",
          background: "hsl(var(--background-primary))",
          foreground: "hsl(var(--text-normal))",
          primary: {
            DEFAULT: "hsl(var(--interactive-accent))",
            foreground: "hsl(var(--text-on-accent))",
          },
          secondary: {
            DEFAULT: "hsl(var(--background-secondary))",
            foreground: "hsl(var(--text-normal))",
          },
          destructive: {
            DEFAULT: "hsl(var(--text-error))",
            foreground: "hsl(var(--text-on-accent))",
          },
          muted: {
            DEFAULT: "hsl(var(--background-secondary-alt))",
            foreground: "hsl(var(--text-muted))",
          },
          accent: {
            DEFAULT: "hsl(var(--background-modifier-hover))",
            foreground: "hsl(var(--text-normal))",
          },
          popover: {
            DEFAULT: "hsl(var(--background-secondary))",
            foreground: "hsl(var(--text-normal))",
          },
          card: {
            DEFAULT: "hsl(var(--background-secondary))",
            foreground: "hsl(var(--text-normal))",
          },
        }
       
      },
    },
    plugins: [require("tailwindcss-animate")],
  }