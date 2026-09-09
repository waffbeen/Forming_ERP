import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/indas-ui/dist/**/*.{js,cjs}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Backgrounds
        'bg-app': 'rgb(var(--bg-app) / <alpha-value>)',
        'bg-surface': 'rgb(var(--bg-surface) / <alpha-value>)',
        'bg-header': 'rgb(var(--bg-header) / <alpha-value>)',
        'bg-sidebar': 'rgb(var(--bg-sidebar) / <alpha-value>)',
        'bg-sidebar-hover': 'rgb(var(--bg-sidebar-hover) / <alpha-value>)',
        'bg-subtle': 'rgb(var(--bg-subtle) / <alpha-value>)',
        'bg-hover': 'rgb(var(--bg-hover) / <alpha-value>)',
        'bg-selected': 'rgb(var(--bg-selected) / <alpha-value>)',
        'bg-grid-header': 'rgb(var(--bg-grid-header) / <alpha-value>)',
        'bg-default': 'rgb(var(--bg-default) / <alpha-value>)',

        // Foregrounds
        'fg-default': 'rgb(var(--fg-default) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        'fg-subtle': 'rgb(var(--fg-subtle) / <alpha-value>)',
        'fg-inverse': 'rgb(var(--fg-inverse) / <alpha-value>)',
        'fg-sidebar': 'rgb(var(--fg-sidebar) / <alpha-value>)',
        'fg-sidebar-dim': 'rgb(var(--fg-sidebar-dim) / <alpha-value>)',

        // Primary, per theme variant, plus on-primary for text contrast
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
        'primary-subtle': 'rgb(var(--color-primary-subtle) / <alpha-value>)',
        'primary-line': 'rgb(var(--color-primary-line) / <alpha-value>)',
        'on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',

        // This app's second colour: scrap, skeleton and material callouts.
        // Named 'highlight' so it never collides with indas-ui's accent,
        // which is an alias of primary.
        highlight: 'rgb(var(--color-highlight) / <alpha-value>)',
        'highlight-subtle': 'rgb(var(--color-highlight-subtle) / <alpha-value>)',

        // Borders
        'bd-default': 'rgb(var(--bd-default) / <alpha-value>)',
        'bd-strong': 'rgb(var(--bd-strong) / <alpha-value>)',
        'bd-subtle': 'rgb(var(--bd-subtle) / <alpha-value>)',

        // Aliases and extra tokens indas-ui components reference
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
        'accent-subtle': 'rgb(var(--color-accent-subtle) / <alpha-value>)',
        'accent-muted': 'rgb(var(--color-accent-muted) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        'fg-accent': 'rgb(var(--fg-accent) / <alpha-value>)',
        'bd-accent': 'rgb(var(--bd-accent) / <alpha-value>)',
        'bd-medium': 'rgb(var(--bd-medium) / <alpha-value>)',
        'bg-overlay': 'rgb(var(--bg-overlay) / <alpha-value>)',
        icon: 'rgb(var(--color-icon) / <alpha-value>)',
        'icon-hover': 'rgb(var(--color-icon-hover) / <alpha-value>)',
        'icon-accent': 'rgb(var(--color-icon-accent) / <alpha-value>)',
        card: 'rgb(var(--bg-surface) / <alpha-value>)',
        border: 'rgb(var(--bd-default) / <alpha-value>)',
        background: 'rgb(var(--bg-app) / <alpha-value>)',
        foreground: 'rgb(var(--fg-default) / <alpha-value>)',
        muted: 'rgb(var(--bg-subtle) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--fg-muted) / <alpha-value>)',
        destructive: 'rgb(var(--color-error) / <alpha-value>)',
        ring: 'rgb(var(--bd-accent) / <alpha-value>)',

        // Status
        success: 'rgb(var(--color-success) / <alpha-value>)',
        'success-subtle': 'rgb(var(--color-success-subtle) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        'warning-subtle': 'rgb(var(--color-warning-subtle) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        'error-subtle': 'rgb(var(--color-error-subtle) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        'info-subtle': 'rgb(var(--color-info-subtle) / <alpha-value>)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs: ['0.75rem', { lineHeight: '1.05rem' }],
        sm: ['0.8125rem', { lineHeight: '1.2rem' }],
        base: ['0.875rem', { lineHeight: '1.3rem' }],
        lg: ['1rem', { lineHeight: '1.45rem' }],
        xl: ['1.125rem', { lineHeight: '1.6rem' }],
        '2xl': ['1.375rem', { lineHeight: '1.85rem' }],
        '3xl': ['1.75rem', { lineHeight: '2.2rem' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fadeIn .18s ease-out',
        'slide-up': 'slideUp .2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
