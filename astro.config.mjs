// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;

// https://astro.build/config
export default defineConfig({
  site: vercelUrl ?? 'http://localhost:4321',
  base: '/',
  adapter: vercel(),
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: 'server', access: 'secret' }),
      ADMIN_SECRET: envField.string({ context: 'server', access: 'secret' }),
      DEPLOY_HOOK_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
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
