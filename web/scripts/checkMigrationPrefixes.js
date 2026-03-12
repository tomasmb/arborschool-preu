#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const migrationsDir = path.join(__dirname, "../db/migrations");
const allowedDuplicatePrefixes = new Set(["0003", "0004"]);

const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const grouped = new Map();

for (const file of files) {
  const [prefix] = file.split("_");
  if (!/^\d{4}$/.test(prefix)) {
    continue;
  }

  const current = grouped.get(prefix) ?? [];
  current.push(file);
  grouped.set(prefix, current);
}

const disallowed = [...grouped.entries()].filter(
  ([prefix, group]) => group.length > 1 && !allowedDuplicatePrefixes.has(prefix)
);

if (disallowed.length > 0) {
  console.error("[checkMigrationPrefixes] Duplicate migration prefixes found:");
  for (const [prefix, group] of disallowed) {
    console.error(`- ${prefix}: ${group.join(", ")}`);
  }
  process.exit(1);
}

console.log("[checkMigrationPrefixes] OK");
process.exit(0);
