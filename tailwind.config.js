/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page: '#0E0E10',
        shell: '#17171A',
        card: '#1C1C1F',
        field: '#222226',
        wash: '#1A1A1D',
        tx: { DEFAULT: '#F4F4F3', 2: '#A6A6AC', 3: '#77777E', 4: '#4A4A51' },
        onink: '#131315',
        spark: { DEFAULT: '#49BA61', deep: '#2E9A48', ink: '#06210f' },
        ink: { DEFAULT: '#1D1B17', 3: '#6E675B' },
      },
      fontFamily: {
        sans: ['"Google Sans Flex"', '"Google Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        serif: ['"STK Bureau Serif"', 'Georgia', 'serif'],
        mono: ['"PP Supply Mono"', 'SFMono-Regular', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: { tour: 'cubic-bezier(.625,.05,0,1)' },
    },
  },
  plugins: [],
};
