import { fileURLToPath } from "node:url";
import path from "node:path";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../");
export const dataDir = path.join(repoRoot, "data");
export const knowledgeDir = path.join(repoRoot, "knowledge");
