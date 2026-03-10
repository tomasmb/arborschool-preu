import { loadEnvConfig } from "@next/env";

let isLoaded = false;

export function ensureScriptEnvLoaded() {
  if (isLoaded) {
    return;
  }

  loadEnvConfig(process.cwd());
  isLoaded = true;
}

ensureScriptEnvLoaded();
