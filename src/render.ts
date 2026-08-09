import { resolveAttribute, type NodeHandler } from "@comark/ansi/render";
import type { Readable } from "node:stream";
import {
  clearPrevious,
  formatOutput,
  HIDE_CURSOR,
  hyperlink,
  sanitize,
  SHOW_CURSOR,
  visibleLink,
} from "./terminal.ts";

export interface RenderOptions {
  colors?: boolean;
  highlight?: boolean;
  hyperlinks?: boolean;
  math?: boolean;
  mermaid?: boolean;
  width?: number;
}

type MarkdownRenderer = (markdown: string, options?: RenderOptions) => Promise<string>;

function link(hyperlinks: boolean): NodeHandler {
  return async (node, state) => {
    const rawHref = resolveAttribute(node[1], state.renderData, "href");
    const href = sanitize(
      typeof rawHref === "string" || typeof rawHref === "number" ? String(rawHref) : "",
    );
    const content = await state.flow(node, state);

    if (!href) return content;
    return hyperlinks
      ? hyperlink(content, href)
      : visibleLink(content, href, Boolean(state.context.colors));
  };
}

const Step: NodeHandler = async (node, state) => {
  const rawTitle = node[1].title;
  const title =
    typeof rawTitle === "string" || typeof rawTitle === "number" ? String(rawTitle) : "";
  const content = (await state.flow(node, state)).trim();
  return [title, content].filter(Boolean).join("\n");
};

const Steps: NodeHandler = async (node, state) => {
  const steps = node
    .slice(2)
    .filter(
      (child): child is Parameters<NodeHandler>[0] => Array.isArray(child) && child[0] === "step",
    );
  const output: string[] = [];

  for (const [index, step] of steps.entries()) {
    const rendered = await Step(step, state);
    output.push(`${index + 1}. ${rendered.replaceAll("\n", "\n   ")}`);
  }

  return `${output.join("\n\n")}\n\n`;
};

export async function renderMarkdown(markdown: string, options: RenderOptions = {}) {
  const enableMath = options.math ?? true;
  const enableMermaid = options.mermaid ?? true;
  const hasEmoji = /(^|[^\w]):[a-z0-9_+-]+:(?!\w)/i.test(markdown);
  const hasFootnotes = /\[\^[^\]\s]+\]/.test(markdown);
  const hasMath = enableMath && markdown.includes("$");
  const hasMermaid =
    enableMermaid && /^ {0,3}(?:`{3,}|~{3,})[ \t]*mermaid(?:\s|$)/im.test(markdown);
  const hasHighlightedCode =
    options.highlight !== false &&
    /^ {0,3}(?:`{3,}|~{3,})[ \t]*(?!mermaid(?:\s|$))\S+/im.test(markdown);
  const hasFrontmatter = /^(?:\uFEFF)?---[ \t]*\r?\n/.test(markdown);
  const hasAlert = /^ {0,3}>[ \t]*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/im.test(markdown);
  const hasTaskList = /^\s*[-+*][ \t]+\[[ xX]\][ \t]+/m.test(markdown);
  const hasComponent = /(^|\s):{1,2}[A-Za-z][\w-]*/m.test(markdown);
  const hasAttributes = /\{(?:[#.]|[\w-]+\s*=)[^\n}]*\}/.test(markdown);
  const needsComponents = hasComponent || hasAlert || hasTaskList || hasFootnotes;

  const defaultPluginPromises = [
    ...(hasFrontmatter
      ? [import("@comark/ansi/plugins/frontmatter").then((module) => module.default())]
      : []),
    ...(hasAlert ? [import("@comark/ansi/plugins/alert").then((module) => module.default())] : []),
    ...(hasTaskList
      ? [import("@comark/ansi/plugins/task-list").then((module) => module.default())]
      : []),
    ...(needsComponents
      ? [import("@comark/ansi/plugins/components").then((module) => module.default())]
      : []),
    ...(hasAttributes
      ? [import("@comark/ansi/plugins/attributes").then((module) => module.default())]
      : []),
  ];

  const [
    ansiModule,
    defaultPlugins,
    emojiModule,
    footnotesModule,
    mathModule,
    mermaidModule,
    rangiModule,
  ] = await Promise.all([
    import("@comark/ansi"),
    Promise.all(defaultPluginPromises),
    hasEmoji ? import("@comark/ansi/plugins/emoji") : undefined,
    hasFootnotes ? import("@comark/ansi/plugins/footnotes") : undefined,
    hasMath ? import("@comark/ansi/plugins/math") : undefined,
    hasMermaid ? import("@comark/ansi/plugins/mermaid") : undefined,
    hasHighlightedCode ? import("@comark/ansi/plugins/rangi") : undefined,
  ]);

  type AnsiOptions = NonNullable<Parameters<typeof ansiModule.renderAnsi>[1]>;
  const plugins: NonNullable<AnsiOptions["plugins"]> = [...defaultPlugins];
  const components: NonNullable<AnsiOptions["components"]> = {
    a: link(options.hyperlinks ?? false),
    Step,
    Steps,
  };

  if (emojiModule) plugins.push(emojiModule.default());
  if (footnotesModule) {
    plugins.push(footnotesModule.default());
    components.Footnote = footnotesModule.Footnote;
  }
  if (mathModule) {
    plugins.push(mathModule.default());
    components.Math = mathModule.Math;
  }
  if (mermaidModule) {
    plugins.push(mermaidModule.default());
    components.Mermaid = mermaidModule.Mermaid;
  }
  if (rangiModule) plugins.push(rangiModule.default({ lineNumbers: true }));

  return ansiModule.renderAnsi(markdown, {
    colors: options.colors,
    width: options.width,
    registerDefaultPlugins: false,
    plugins,
    components,
  });
}

export async function renderMarkdownStream(
  input: Readable,
  options: RenderOptions = {},
  writer: (output: string) => void = (output) => process.stdout.write(output),
  renderer: MarkdownRenderer = renderMarkdown,
): Promise<void> {
  let markdown = "";
  let renderedLines = 0;
  let started = false;
  input.setEncoding("utf8");

  try {
    for await (const chunk of input) {
      if (!started) {
        writer(HIDE_CURSOR);
        started = true;
      }

      markdown += chunk;
      const output = await renderer(markdown, options);
      const formatted = formatOutput(output);
      writer(`${clearPrevious(renderedLines)}${formatted}`);
      renderedLines = formatted.match(/\n/g)?.length ?? 0;
    }
  } finally {
    if (started) writer(SHOW_CURSOR);
  }
}
