/** @type {import('tailwindcss').Config} */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"IBM Plex Sans"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'], mrz: ['"OCR B"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'] },
      colors: {
        canvas: v('canvas'), surface: v('surface'), sunken: v('sunken'), ink: v('ink'), muted: v('muted'), line: v('line'),
        accent: v('accent'), accentsoft: v('accentsoft'),
        ok: v('ok'), oksoft: v('oksoft'), warn: v('warn'), warnsoft: v('warnsoft'), bad: v('bad'), badsoft: v('badsoft'), neutral: v('neutral'), neutralsoft: v('neutralsoft'),
      },
      fontSize: { '2xs': ['0.6875rem', '1rem'] },
    },
  },
  plugins: [],
};
