import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: 'https://bakeevx.harvincadag811.chatgpt.site', output: 'static', trailingSlash: 'always', integrations: [sitemap()], devToolbar: {enabled: false} });
