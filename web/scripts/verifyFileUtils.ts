import { readFileSync } from "node:fs";
import path from "node:path";

export function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
