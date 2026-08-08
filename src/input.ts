import { readFile } from "node:fs/promises";
import type { Readable } from "node:stream";

export async function readMarkdown(
  files?: string | string[],
  stdin: Readable = process.stdin,
): Promise<string> {
  const inputs = typeof files === "string" ? [files] : files;
  if (inputs?.length) {
    const markdown: string[] = [];

    for (const file of inputs) {
      if (file === "-") {
        markdown.push(await readMarkdown(undefined, stdin));
        continue;
      }

      try {
        markdown.push(await readFile(file, "utf8"));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Cannot read ${JSON.stringify(file)}: ${message}`, { cause: error });
      }
    }

    return markdown.join("");
  }

  let markdown = "";
  stdin.setEncoding("utf8");
  for await (const chunk of stdin) {
    markdown += chunk;
  }
  return markdown;
}
