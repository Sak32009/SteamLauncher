import { builtinModules } from 'node:module';
import { join, basename } from 'node:path';
import { cwd } from 'node:process';

import type { UserConfigExport } from 'vite';
import { defineConfig } from 'vite';

import { dependencies } from './package.json';

const builtinModulesNodeProtocol = builtinModules.map((module) => `node:${module}`);
const externalModules = [...Object.keys(dependencies), 'electron'];

export default function createConfig(packagePath: string) {
  return defineConfig(({ mode }) => {
    const isDevelopment = mode === 'development';
    const rootPath = cwd();
    const viteDistributionName = basename(packagePath);
    const viteRoot = join(packagePath, 'src');
    const viteOutDirectory = join(packagePath, 'dist');
    const viteConfig: UserConfigExport = {
      base: '',
      build: {
        emptyOutDir: true,
        outDir: viteOutDirectory,
        polyfillModulePreload: false,
        target: 'esnext',
      },
      envDir: rootPath,
      root: viteRoot,
    };

    if (isDevelopment) {
      viteConfig.build!.minify = false;
    }

    if (viteDistributionName === 'main' || viteDistributionName === 'preload') {
      viteConfig.build!.lib = {
        entry: join(viteRoot, 'index.ts'),
        fileName: viteDistributionName,
        formats: ['cjs'],
      };
      viteConfig.build!.rollupOptions = {
        external: [...externalModules, ...builtinModules, ...builtinModulesNodeProtocol],
      };
    }

    return viteConfig;
  });
}
