import { spawn } from "node:child_process";
import { defineCommand } from "citty";
import { createSupportsHyperlinks } from "supports-hyperlinks";
import packageJson from "../package.json" with { type: "json" };
import { readMarkdown } from "./input.ts";
import { renderMarkdown, renderMarkdownStream, type RenderOptions } from "./render.ts";
import { formatOutput } from "./terminal.ts";

export function parseWidth(value: string): number {
  const width = Number(value);
  if (!Number.isInteger(width) || width < 1) {
    throw new Error(`Width must be a positive integer, received ${JSON.stringify(value)}.`);
  }
  return width;
}

export type HyperlinkMode = "auto" | "on" | "off";

export function parseHyperlinkMode(value: string): HyperlinkMode {
  if (value === "auto" || value === "on" || value === "off") return value;
  throw new Error(`Hyperlinks must be auto, on, or off; received ${JSON.stringify(value)}.`);
}

export function useHyperlinks(
  mode: HyperlinkMode,
  output: Pick<NodeJS.WriteStream, "isTTY"> = process.stdout,
): boolean {
  if (mode !== "auto") return mode === "on";
  return createSupportsHyperlinks(output);
}

async function writeToPager(output: string): Promise<void> {
  const command = process.env.PAGER?.trim() || "less -R -F -X";
  const pager = spawn(command, {
    shell: true,
    stdio: ["pipe", "inherit", "inherit"],
    windowsHide: true,
  });

  pager.stdin.end(output);
  await new Promise<void>((resolve, reject) => {
    pager.once("error", reject);
    pager.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Pager exited with code ${code ?? "unknown"}.`));
    });
  });
}

const defaultColors = Boolean(process.stdout.isTTY && process.env.NO_COLOR === undefined);

export const main = defineCommand({
  meta: {
    name: "comark-cat",
    version: packageJson.version,
    description: "Render Markdown as styled ANSI output in the terminal.",
  },
  args: {
    files: {
      type: "positional",
      description: "Markdown files to render; omit them or use - to read stdin",
      required: false,
    },
    width: {
      type: "string",
      alias: ["w"],
      description: "Terminal width used for block elements",
      valueHint: "columns",
      default: String(process.stdout.columns ?? 80),
    },
    color: {
      type: "boolean",
      description: "Force ANSI colors",
      negativeDescription: "Disable ANSI colors",
      default: defaultColors,
    },
    pager: {
      type: "boolean",
      alias: ["p"],
      description: "Display output with $PAGER or less",
      default: false,
    },
    stream: {
      type: "boolean",
      description: "Render piped stdin as it arrives",
      default: false,
    },
    highlight: {
      type: "boolean",
      description: "Enable Rangi syntax highlighting",
      negativeDescription: "Disable syntax highlighting",
      default: true,
    },
    hyperlinks: {
      type: "string",
      description: "Render links as OSC 8 hyperlinks: auto, on, or off",
      valueHint: "mode",
      default: "auto",
    },
    math: {
      type: "boolean",
      description: "Enable inline and block math",
      negativeDescription: "Disable math parsing",
      default: true,
    },
    mermaid: {
      type: "boolean",
      description: "Render Mermaid diagrams as terminal text",
      negativeDescription: "Disable Mermaid rendering",
      default: true,
    },
  },
  async run({ args }) {
    if (args._.length === 0 && process.stdin.isTTY) {
      process.stderr.write(
        [
          "comark-cat: no Markdown to render",
          "",
          "  comark-cat README.md",
          "  cat README.md | comark-cat",
          "",
          "Run `comark-cat --help` for more options.",
          "",
        ].join("\n"),
      );
      process.exitCode = 1;
      return;
    }

    if (args.stream && (args._.length > 1 || (args._[0] !== undefined && args._[0] !== "-"))) {
      throw new Error("--stream only supports stdin input.");
    }
    if (args.stream && args.pager) {
      throw new Error("--stream cannot be used with --pager.");
    }

    const hyperlinkMode = parseHyperlinkMode(args.hyperlinks);
    const renderOptions: RenderOptions = {
      colors: args.color,
      highlight: args.highlight,
      hyperlinks: useHyperlinks(hyperlinkMode),
      math: args.math,
      mermaid: args.mermaid,
      width: parseWidth(args.width),
    };

    if (args.stream) {
      await renderMarkdownStream(process.stdin, renderOptions);
      return;
    }

    const markdown = await readMarkdown(args._);
    const output = await renderMarkdown(markdown, renderOptions);

    const formatted = formatOutput(output);
    if (args.pager) await writeToPager(formatted);
    else process.stdout.write(formatted);
  },
});
