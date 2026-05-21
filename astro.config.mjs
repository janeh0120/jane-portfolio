// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://janeh0120.github.io',
  base: '/jane-portfolio/',
  adapter: vercel(),
  env: {
    schema: {
      MONGODB_URI: envField.string({ context: 'server', access: 'secret' }),
      MONGODB_DB_NAME: envField.string({
        context: 'server',
        access: 'public',
        default: 'jane-portfolio',
      }),
      ADMIN_SECRET: envField.string({ context: 'server', access: 'secret' }),
      PUBLIC_COMMENT_API_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});