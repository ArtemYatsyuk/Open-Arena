import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../../config.json');

export interface ModelConfig {
  id: string;
  name: string;
  baseUrl: string;
  endpoint: string;
  modelId: string;
  apiKeyEnv: string;
  streaming: boolean;
  contextWindow: number;
  description: string;
}

export interface AppConfig {
  name: string;
  logoUrl: string;
  allowRegistration: boolean;
  maxConversationsPerUser: number;
}

export interface FullConfig {
  models: ModelConfig[];
  defaultModelId: string;
  app: AppConfig;
}

let config: FullConfig;
let watchers: ((cfg: FullConfig) => void)[] = [];

function loadConfig(): FullConfig {
  const raw = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(raw);
  watchers.forEach(fn => fn(config));
  return config;
}

export function getConfig(): FullConfig {
  if (!config) loadConfig();
  return config;
}

export function getModelById(id: string): ModelConfig | undefined {
  return getConfig().models.find(m => m.id === id);
}

export function getDefaultModelId(): string {
  return getConfig().defaultModelId;
}

export function onConfigChange(fn: (cfg: FullConfig) => void) {
  watchers.push(fn);
}

export function initConfigWatcher() {
  loadConfig();
  fs.watch(configPath, () => {
    setTimeout(() => loadConfig(), 100);
  });
}
