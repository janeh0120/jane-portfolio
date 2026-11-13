// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;

// https://astro.build/config
export default defineConfig({
  site: vercelUrl ?? 'http://localhost:4321',
  base: '/',
  // Ship CSS inside each page's HTML so styling can't fail on a separate request
  // (extensions, flaky networks, and proxies were leaving some visitors with an unstyled page).
  build: {
    inlineStylesheets: 'always',
  },
  redirects: {
    '/extra': '/play',
  },
  integrations: [
    react(),
    icon({
      include: {
        lucide: [
          'archive',
          'arrow-left',
          'arrow-right',
          'arrow-up-right',
          'check',
          'instagram',
          'linkedin',
          'mail',
          'menu',
          'monitor',
          'moon',
          'send',
          'sun',
          'trash',
          'x',
        ],
      },
    }),
  ],
  adapter: vercel(),
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
        default: '',
      }),
      ADMIN_SECRET: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      DEPLOY_HOOK_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      GITHUB_OAUTH_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      GITHUB_OAUTH_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      ADMIN_GITHUB_USER_ID: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      CLAUDE_TASK_FIRE_URL: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      CLAUDE_TASK_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
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
