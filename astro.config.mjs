// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://janeh0120.github.io',
  base: '/jane-portfolio/',
  vite: {
    plugins: [tailwindcss()],
  },
});