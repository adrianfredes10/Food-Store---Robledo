/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        bg: {
          DEFAULT: "var(--color-bg)",
          secondary: "var(--color-bg-secondary)",
          tertiary: "var(--color-bg-tertiary)",
        },
        admin: {
          shell: "var(--admin-shell)",
          overlay: "var(--admin-overlay)",
          sidebar: {
            DEFAULT: "var(--admin-sidebar-bg)",
            border: "var(--admin-sidebar-border)",
            fg: "var(--admin-sidebar-fg)",
            muted: "var(--admin-sidebar-muted)",
            highlight: "var(--admin-sidebar-highlight)",
            subtle: "var(--admin-sidebar-subtle)",
            brand: "var(--admin-sidebar-brand)",
          },
          topbar: {
            DEFAULT: "var(--admin-topbar-bg)",
            border: "var(--admin-topbar-border)",
          },
        },
      },
    },
  },
  plugins: [],
};
