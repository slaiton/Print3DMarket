/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent:      'var(--accent)',
        'accent-dark': 'var(--accent-dark)',
        fg:          'var(--fg)',
        'fg-muted':  'var(--fg-muted)',
        bg:          'var(--bg)',
        surface:     'var(--surface)',
        border:      'var(--border)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg:      'var(--radius-lg)',
      },
      boxShadow: {
        DEFAULT: 'var(--shadow)',
        md:      'var(--shadow-md)',
      },
    },
  },
  plugins: [],
};
