const ESCAPE = "\u001B";
const CSI = `${ESCAPE}[`;
const OSC = `${ESCAPE}]`;
const STRING_TERMINATOR = `${ESCAPE}\\`;

export const HIDE_CURSOR = `${CSI}?25l`;
export const SHOW_CURSOR = `${CSI}?25h`;

export function clearPrevious(lines: number): string {
  return lines > 0 ? `${CSI}${lines}F${CSI}J` : "";
}

export function formatOutput(output: string): string {
  return `${output.replace(/\n+$/, "")}\n`;
}

export function hyperlink(content: string, href: string): string {
  return `${OSC}8;;${href}${STRING_TERMINATOR}${content}${OSC}8;;${STRING_TERMINATOR}`;
}

export function visibleLink(content: string, href: string, colors: boolean): string {
  return colors ? `${content} ${CSI}2m(${href})${CSI}0m` : `${content} (${href})`;
}

export function sanitize(value: string): string {
  return value
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && (code < 127 || code > 159);
    })
    .join("");
}
