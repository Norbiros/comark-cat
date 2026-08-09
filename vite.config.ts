import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    entry: {
      "comark-cat": "src/index.ts",
    },
    deps: {
      onlyBundle: false,
    },
    dts: false,
    exports: false,
    minify: true,
    publint: true,
    unused: {
      // These are optional peers loaded by the enabled Comark plugins at runtime.
      ignore: {
        dependencies: ["beautiful-mermaid", "katex", "rangi"],
      },
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
      denyWarnings: true,
    },
  },
  fmt: {},
});
