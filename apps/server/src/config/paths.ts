import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));

export function findProjectRoot(startDir = moduleDir): string {
  let current = resolve(startDir);

  while (true) {
    if (existsSync(join(current, "config", "app.json"))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`Unable to locate project root containing config/app.json from ${startDir}`);
    }

    current = parent;
  }
}

export function resolveProjectPath(...segments: string[]): string {
  return join(findProjectRoot(), ...segments);
}
