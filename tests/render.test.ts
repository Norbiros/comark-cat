import { expect, test } from "vite-plus/test";
import { renderMarkdown } from "../src/render.ts";

test("renders Markdown without ANSI colors", async () => {
  const output = await renderMarkdown("# Hello\n\nA **bold** word.", {
    colors: false,
    highlight: false,
    math: false,
    mermaid: false,
    width: 40,
  });

  expect(output).toContain("# Hello");
  expect(output).toContain("A bold word.");
  expect(output).not.toContain("\u001B[");
});

test("highlights fenced code with Rangi", async () => {
  const output = await renderMarkdown("```js\nconst answer = 42\n```", {
    colors: true,
    math: false,
    mermaid: false,
  });

  expect(output).toContain("\u001B[38;2;");
  expect(output).toContain("const");
});

test("renders footnotes without leaking component syntax", async () => {
  const output = await renderMarkdown("Text[^1].\n\n[^1]: Footnote body.", {
    colors: false,
    highlight: false,
    math: false,
    mermaid: false,
  });

  expect(output).toContain("Text[^1].");
  expect(output).toContain("[^1]: Footnote body.");
  expect(output).not.toContain(":sup");
  expect(output).not.toContain("::section");
});

test("renders steps as a numbered sequence", async () => {
  const output = await renderMarkdown(
    '::steps\n  ::step{title="Install"}\n  Run `vp install`.\n  ::\n  ::step{title="Build"}\n  Run `vp pack`.\n  ::\n::',
    {
      colors: false,
      highlight: false,
      math: false,
      mermaid: false,
    },
  );

  expect(output).toContain("1. Install\n   Run vp install.");
  expect(output).toContain("2. Build\n   Run vp pack.");
  expect(output).not.toContain("::steps");
});

test("keeps detected built-in Markdown features", async () => {
  const output = await renderMarkdown(
    "---\ntitle: Hidden\n---\n\n> [!NOTE]\n> Important.\n\n- [x] Complete",
    {
      colors: false,
      highlight: false,
      math: false,
      mermaid: false,
    },
  );

  expect(output).not.toContain("title: Hidden");
  expect(output).toContain("NOTE");
  expect(output).toContain("[x] Complete");
});
