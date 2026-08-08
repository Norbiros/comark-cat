import { PassThrough } from "node:stream";
import { expect, test } from "vite-plus/test";
import { readMarkdown } from "../src/input.ts";

test("reads Markdown from stdin", async () => {
  const stdin = new PassThrough();
  stdin.end("# Piped input\n");

  await expect(readMarkdown(undefined, stdin)).resolves.toBe("# Piped input\n");
});

test("reads Markdown from a file", async () => {
  await expect(readMarkdown("README.md")).resolves.toContain("## What is it?");
});

test("reads multiple Markdown files in argument order", async () => {
  const markdown = await readMarkdown(["README.md", "DEVELOPMENT.md"]);

  expect(markdown).toContain("## What is it?");
  expect(markdown).toContain("# Development");
  expect(markdown.indexOf("## What is it?")).toBeLessThan(markdown.indexOf("# Development"));
});
