import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

export default defineConfig(({mode}) => {
  const offline = mode === 'offline';
  return {
    plugins: offline ? [viteSingleFile({outputFileName:'WebStudio.html'})] : [],
    base: offline ? './' : '/',
    build: offline ? {
      outDir:'offline',
      assetsInlineLimit: 100_000_000,
      copyPublicDir:false,
      rollupOptions:{input:'offline-source.html'}
    } : {},
    server: {host: '0.0.0.0', allowedHosts: ['.e2b.app']},
    preview: {host: '0.0.0.0', allowedHosts: ['.e2b.app']}
  };
});
