#!/usr/bin/env node

import { runMain } from "citty";
import { main } from "./cli.ts";

if (import.meta.main) {
  process.stdout.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EPIPE") {
      process.exit(0);
    }
    throw error;
  });
  await runMain(main);
}
