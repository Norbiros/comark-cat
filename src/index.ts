#!/usr/bin/env node

import { runMain } from "citty";
import { main } from "./cli.ts";

export { main, parseWidth } from "./cli.ts";
export { readMarkdown } from "./input.ts";
export { renderMarkdown } from "./render.ts";
export type { RenderOptions } from "./render.ts";

if (import.meta.main) {
  process.stdout.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EPIPE") {
      process.exit(0);
    }
    throw error;
  });
  await runMain(main);
}
