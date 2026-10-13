// Small JSON files in server/data that keep answers from slow outside APIs between server
// starts. They are per machine and not in git (*.cache.json): delete one to fetch it afresh.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pathOf = (name) => fileURLToPath(new URL(`../../data/${name}.cache.json`, import.meta.url));

// What was saved, or null when nothing is saved yet or the file is damaged.
export function readCache(name) {
  try {
    return JSON.parse(readFileSync(pathOf(name), "utf8"));
  } catch {
    return null;
  }
}

export function writeCache(name, data) {
  try {
    writeFileSync(pathOf(name), `${JSON.stringify(data, null, 1)}\n`);
  } catch (err) {
    // the cache is a shortcut: without it the answer is simply fetched again next time
    console.warn(`Could not save the ${name} cache: ${err.message}`);
  }
}
