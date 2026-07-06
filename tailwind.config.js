/** @type {import('tailwindcss').Config} */
// Tailwind theme is a THIN BRIDGE onto the Attio design tokens in
// src/styles/tokens.css — no second design language. shadcn-style semantic
// names (background/foreground/primary/…) alias the existing CSS variables,
// so every ui/* component inherits the Attio skin and dark mode for free.
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{vue,js,ts}', './.verify/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        // shadcn semantics → Attio tokens
        background: 'var(--surface-base)',
        foreground: 'var(--text-primary)',
        card: { DEFAULT: 'var(--surface-raised)', foreground: 'var(--text-primary)' },
        popover: { DEFAULT: 'var(--surface-raised)', foreground: 'var(--text-primary)' },
        primary: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-contrast)', hover: 'var(--accent-hover)', active: 'var(--accent-active)' },
        secondary: { DEFAULT: 'var(--surface-sunken)', foreground: 'var(--text-primary)' },
        muted: { DEFAULT: 'var(--surface-sunken)', foreground: 'var(--text-secondary)' },
        accent: { DEFAULT: 'var(--surface-hover)', foreground: 'var(--text-primary)' }, // shadcn "accent" = hover surface
        destructive: { DEFAULT: 'var(--status-error)', foreground: 'var(--accent-contrast)', soft: 'var(--status-error-soft)' },
        border: 'var(--border-default)',
        input: 'var(--border-default)',
        ring: 'var(--accent)',
        // direct Attio extras used across views
        tertiary: 'var(--text-tertiary)',
        disabled: 'var(--text-disabled)',
        sunken: 'var(--surface-sunken)',
        raised: 'var(--surface-raised)',
        hover: 'var(--surface-hover)',
        active: 'var(--surface-active)',
        scrim: 'var(--overlay-scrim)',
        'accent-brand': { DEFAULT: 'var(--accent)', soft: 'var(--accent-soft)', ink: 'var(--accent-active)' },
        success: { DEFAULT: 'var(--status-success)', soft: 'var(--status-success-soft)' },
        warning: { DEFAULT: 'var(--status-warning)', soft: 'var(--status-warning-soft)' },
        subtle: 'var(--border-subtle)',
        strong: 'var(--border-strong)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        hairline: 'var(--shadow-hairline)',
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        ring: 'var(--focus-ring)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        xs: ['var(--text-xs)', { lineHeight: 'var(--leading-normal)' }],
        sm: ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
        base: ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
        md: ['var(--text-md)', { lineHeight: 'var(--leading-normal)' }],
        lg: ['var(--text-lg)', { lineHeight: 'var(--leading-tight)' }],
        xl: ['var(--text-xl)', { lineHeight: 'var(--leading-tight)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        medium: 'var(--duration-medium)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        in: 'var(--ease-in)',
        'in-out': 'var(--ease-in-out)',
        out: 'var(--ease-out)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
