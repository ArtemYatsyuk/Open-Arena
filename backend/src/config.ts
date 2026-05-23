import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configSchema } from '@open-arena/shared';
import type { Config } from '@open-arena/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve path to the closest config.json.
 *
 * Lookup order:
 *   1. <root>/data/config.json        (preferred — Phase 0 migration target)
 *   2. <root>/config.json             (legacy — backwards compatibility)
 *
 * @returns { path: string; isDataDir: boolean }
 */
export function resolveConfigPath(): { path: string; isDataDir: boolean } {
  const rootDir = path.resolve(__dirname, '../..');
  const dataPath = path.join(rootDir, 'data', 'config.json');
  const legacyPath = path.join(rootDir, 'config.json');

  if (fs.existsSync(dataPath)) {
    return { path: dataPath, isDataDir: true };
  }
  return { path: legacyPath, isDataDir: false };
}

const resolved = resolveConfigPath();
export const configPath = resolved.path;
export const isDataDir = resolved.isDataDir;

let config: Config;
let watchers: Array<(cfg: Config) => void> = [];

function loadConfig(): Config {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    config = configSchema.parse(parsed);
    watchers.forEach((fn) => fn(config));
  } catch (e: any) {
    if (e?.issues) {
      console.error('Config validation errors:', JSON.stringify(e.issues, null, 2));
    } else {
      console.error('Failed to load config.json:', e.message);
    }
    if (!config) throw new Error('Config file missing or invalid at startup');
  }
  return config;
}

export function getConfig(): Config {
  if (!config) loadConfig();
  return config;
}

export function getModelById(id: string): Config['models'][number] | undefined {
  return getConfig().models.find((m) => m.id === id);
}

export function getDefaultModelId(): string {
  return getConfig().defaultModelId;
}

export function onConfigChange(fn: (cfg: Config) => void) {
  watchers.push(fn);
}

export function reloadConfig() {
  loadConfig();
}

export function initConfigWatcher() {
  loadConfig();
  fs.watch(configPath, () => {
    setTimeout(() => loadConfig(), 100);
  });
}
