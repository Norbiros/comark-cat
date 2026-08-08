import { expect, test } from "vite-plus/test";
import { parseWidth } from "../src/cli.ts";

test.each(["0", "-1", "10.5", "wide"])("rejects invalid width %s", (width) => {
  expect(() => parseWidth(width)).toThrow("Width must be a positive integer");
});

test("accepts a positive integer width", () => {
  expect(parseWidth("120")).toBe(120);
});
