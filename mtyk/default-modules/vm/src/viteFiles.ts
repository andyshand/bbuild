export const packageJson = JSON.stringify(
  {
    name: 'node-vite',
    version: '1.0.0',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      serve: 'vite preview',
    },
    dependencies: {
      '@emotion/react': '^11.10.6',
      '@emotion/styled': '^11.10.6',
      react: '18.2.0',
      'react-dom': '18.2.0',
    },
    packageManager: 'yarn@3.5.0',
    devDependencies: {
      '@emotion/babel-plugin': '^11.10.6',
      '@types/node': '^18.16.1',
      '@types/react': '18.0.11',
      '@types/react-dom': '18.0.11',
      '@vitejs/plugin-react': '1.3.1',
      autoprefixer: '^10.4.14',
      postcss: '^8.4.23',
      sharp: '^0.32.0',
      tailwindcss: '^3.3.1',
      typescript: '5.0.4',
      vite: '4.3.1',
    },
    private: true,
  },
  null,
  2,
)
export const viteContainerYarnCachePath = '/root/.yarn'

export const yarnRC = `nodeLinker: node-modules`
export const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
    screens: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1322px',
      '2xl': '1536px',
    },
  },
  plugins: [],
};
`
export const viteConfig = `import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const outputDir = process.env.OUTPUT_DIR || 'dist'

export default defineConfig({
  build: {
    outDir: outputDir,
  },
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],
})
`
export const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="robots" content="noindex">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      #root {
        height: 100vh;
        width: 100vw;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
        overflow-y: scroll;      
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
`

export const viteContainerYarnCache = `/.yarn/cache`
export const runSh = `#!/bin/bash

yarn set version berry
YARN_CACHE_FOLDER=${viteContainerYarnCache} yarn
yarn run dev --port $PORT --host 0.0.0.0
`
