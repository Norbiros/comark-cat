import { Readable } from "node:stream";
import { stripVTControlCharacters } from "node:util";
import { expect, test } from "vite-plus/test";
import { renderMarkdown, renderMarkdownStream } from "../src/render.ts";

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

test("renders links as OSC 8 hyperlinks", async () => {
  const output = await renderMarkdown("Read [the docs](https://example.com/docs).", {
    colors: false,
    hyperlinks: true,
  });

  expect(output).toContain("\u001B]8;;https://example.com/docs\u001B\\the docs\u001B]8;;\u001B\\");
  expect(output).not.toContain("the docs (https://example.com/docs)");
});

test("falls back to visible link destinations when hyperlinks are off", async () => {
  const output = await renderMarkdown("Read [the docs](https://example.com/docs).", {
    colors: false,
    hyperlinks: false,
  });

  expect(output).toContain("the docs (https://example.com/docs)");
  expect(output).not.toContain("\u001B]8;;");
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

test.each([
  { colors: true, highlight: true, colored: true },
  { colors: false, highlight: true, colored: false },
  { colors: true, highlight: false, colored: false },
])(
  "renders frontmatter without fences with $colors colors and $highlight highlighting",
  async ({ colors, highlight, colored }) => {
    const source = '---\n# Comment\ntitle: "**literal**"\nitems:\n  - one\n  - two\n---';
    const output = await renderMarkdown(source, { frontmatter: true, colors, highlight });

    expect(output.includes("\u001B[")).toBe(colored);
    expect(stripVTControlCharacters(output).trimEnd()).toBe(source);
  },
);

test("omits fences only for frontmatter, preserving ordinary YAML code blocks", async () => {
  const output = await renderMarkdown("---\ntitle: Visible\n---\n\n```yaml\nkey: value\n```", {
    colors: false,
    frontmatter: true,
    highlight: false,
  });

  expect(output).toMatch(/^---\ntitle: Visible\n---\n/);
  expect(output.match(/```/g)).toHaveLength(2);
  expect(output).toContain("key: value");
});

test("does not mistake separators in the body for frontmatter", async () => {
  const markdown = "# Body\n\n---\ntitle: ordinary content\n---";
  const options = { colors: false, highlight: false };
  expect(await renderMarkdown(markdown, { ...options, frontmatter: true })).toBe(
    await renderMarkdown(markdown, { ...options, frontmatter: false }),
  );
});

test("re-renders accumulated Markdown as input streams", async () => {
  const rendered: string[] = [];
  const written: string[] = [];
  const input = Readable.from(["# Hel", "lo\n"]);

  await renderMarkdownStream(
    input,
    { colors: false },
    (output) => written.push(output),
    async (markdown) => {
      rendered.push(markdown);
      return `rendered: ${markdown}`;
    },
  );

  expect(rendered).toEqual(["# Hel", "# Hello\n"]);
  expect(written).toEqual([
    "\u001B[?25l",
    "rendered: # Hel\n",
    "\u001B[1F\u001B[Jrendered: # Hello\n",
    "\u001B[?25h",
  ]);
});

test("restores the cursor when streaming render fails", async () => {
  const written: string[] = [];
  const input = Readable.from(["partial"]);

  await expect(
    renderMarkdownStream(
      input,
      {},
      (output) => written.push(output),
      async () => {
        throw new Error("render failed");
      },
    ),
  ).rejects.toThrow("render failed");
  expect(written.at(-1)).toBe("\u001B[?25h");
});
