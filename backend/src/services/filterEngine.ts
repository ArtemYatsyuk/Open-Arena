import vm from 'node:vm';
import { prisma } from '../index.js';

interface CompiledFilter {
  id: string;
  name: string;
  priority: number;
  context: vm.Context;
  hasInlet: boolean;
  hasOutlet: boolean;
}

const activeFilters: CompiledFilter[] = [];
let filtersLoaded = false;

function createSandbox(): any {
  return {
    console: { log: console.log, error: console.error, warn: console.warn },
    setTimeout, clearTimeout, Math, Date, JSON,
    parseInt, parseFloat, isNaN, isFinite,
    String, Number, Boolean, Array, Object, Map, Set, RegExp,
    Error, TypeError, RangeError, Promise,
    globalThis: {} as any,
  };
}

function compileCode(code: string): { success: true; context: vm.Context; hasInlet: boolean; hasOutlet: boolean; title: string } | { success: false; error: string } {
  const sandbox = createSandbox();
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);

  const wrapped = `
    (function() {
      var module = { exports: {} };
      this.__module = module;
      ${code}
      return module.exports;
    })()
  `;

  try {
    const script = new vm.Script(wrapped);
    const mod = script.runInContext(context, { timeout: 5000 });

    return {
      success: true,
      context,
      hasInlet: typeof mod.inlet === 'function',
      hasOutlet: typeof mod.outlet === 'function',
      title: mod.title || 'Untitled',
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function compileFilter(code: string): { success: boolean; error?: string } {
  const result = compileCode(code);
  return { success: result.success, error: result.success ? undefined : result.error };
}

async function reload(): Promise<void> {
  activeFilters.length = 0;

  const records = await prisma.filter.findMany({
    where: { isActive: true },
    orderBy: { priority: 'asc' },
  });

  for (const record of records) {
    const result = compileCode(record.code);
    if (!result.success) {
      console.error(`[FilterEngine] Skipping "${record.name}": ${result.error}`);
      continue;
    }
    activeFilters.push({
      id: record.id,
      name: record.name,
      priority: record.priority,
      context: result.context,
      hasInlet: result.hasInlet,
      hasOutlet: result.hasOutlet,
    });
  }

  filtersLoaded = true;
  console.log(`[FilterEngine] ${activeFilters.length} filter(s) active`);
}

export async function ensureFiltersLoaded(): Promise<void> {
  if (!filtersLoaded) await reload();
}

export async function reloadFilters(): Promise<void> {
  filtersLoaded = false;
  await ensureFiltersLoaded();
}

function callFilter(context: vm.Context, fnName: 'inlet' | 'outlet', body: any, user: any): any {
  const bodyStr = JSON.stringify(body);
  const userStr = JSON.stringify(user);

  const wrapped = `
    (function() {
      var body = JSON.parse(${JSON.stringify(bodyStr)});
      var user = JSON.parse(${JSON.stringify(userStr)});
      try {
        var result = this.__module.exports.${fnName}(body, user);
        return JSON.stringify(result);
      } catch(e) {
        throw e.message || String(e);
      }
    })()
  `;

  const script = new vm.Script(wrapped);
  const resultJson = script.runInContext(context, { timeout: 10000 });
  return JSON.parse(resultJson);
}

export async function runInlet(body: any, userId: string, userRole: string): Promise<any> {
  await ensureFiltersLoaded();

  let current = { ...body };
  const user = { id: userId, role: userRole };

  for (const filter of activeFilters) {
    if (!filter.hasInlet) continue;
    try {
      current = callFilter(filter.context, 'inlet', current, user);
    } catch (e: any) {
      throw new Error(`Filter "${filter.name}" blocked: ${e.message}`);
    }
  }

  return current;
}

export async function runOutlet(body: any, userId: string, userRole: string): Promise<any> {
  await ensureFiltersLoaded();

  let current = { ...body };
  const user = { id: userId, role: userRole };

  for (const filter of activeFilters) {
    if (!filter.hasOutlet) continue;
    try {
      current = callFilter(filter.context, 'outlet', current, user);
    } catch (e: any) {
      console.error(`[FilterEngine] Filter "${filter.name}" outlet error:`, e.message);
    }
  }

  return current;
}
