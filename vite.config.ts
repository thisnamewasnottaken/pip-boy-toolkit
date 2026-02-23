import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    // GitHub Pages deploys to /pip-boy-toolkit/
    base: '/pip-boy-toolkit/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
        coverage: {
            provider: 'v8',
            // 'text' → terminal table, 'json' → Codecov, 'json-summary' → PR comment action, 'html' → local browser report
            reporter: ['text', 'json', 'json-summary', 'html'],
            reportsDirectory: './coverage',
        },
    },
});
