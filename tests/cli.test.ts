import { expect, test } from "vite-plus/test";
import { parseHyperlinkMode, parseWidth, useHyperlinks } from "../src/cli.ts";

test.each(["0", "-1", "10.5", "wide"])("rejects invalid width %s", (width) => {
  expect(() => parseWidth(width)).toThrow("Width must be a positive integer");
});

test("accepts a positive integer width", () => {
  expect(parseWidth("120")).toBe(120);
});

test.each(["auto", "on", "off"] as const)("accepts hyperlink mode %s", (mode) => {
  expect(parseHyperlinkMode(mode)).toBe(mode);
});

test("rejects an invalid hyperlink mode", () => {
  expect(() => parseHyperlinkMode("always")).toThrow("Hyperlinks must be auto, on, or off");
});

test("resolves explicit hyperlink modes independently of the terminal", () => {
  expect(useHyperlinks("on", { isTTY: false })).toBe(true);
  expect(useHyperlinks("off", { isTTY: true })).toBe(false);
});

test("disables automatic hyperlinks for non-terminal output", () => {
  expect(useHyperlinks("auto", { isTTY: false })).toBe(false);
});
