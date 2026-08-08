import { spawn } from "node:child_process";
import { defineCommand } from "citty";
import packageJson from "../package.json" with { type: "json" };
import { readMarkdown } from "./input.ts";
import { renderMarkdown } from "./render.ts";

export function parseWidth(value: string): number {
  const width = Number(value);
  if (!Number.isInteger(width) || width < 1) {
    throw new Error(`Width must be a positive integer, received ${JSON.stringify(value)}.`);
  }
  return width;
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
    name: "comark",
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
    highlight: {
      type: "boolean",
      description: "Enable Rangi syntax highlighting",
      negativeDescription: "Disable syntax highlighting",
      default: true,
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
          "comark: no Markdown to render",
          "",
          "  comark README.md",
          "  cat README.md | comark",
          "",
          "Run `comark --help` for more options.",
          "",
        ].join("\n"),
      );
      process.exitCode = 1;
      return;
    }

    const markdown = await readMarkdown(args._);
    const output = await renderMarkdown(markdown, {
      colors: args.color,
      highlight: args.highlight,
      math: args.math,
      mermaid: args.mermaid,
      width: parseWidth(args.width),
    });

    const formatted = `${output.replace(/\n+$/, "")}\n`;
    if (args.pager) await writeToPager(formatted);
    else process.stdout.write(formatted);
  },
});
