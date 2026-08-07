import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    deps: {
      neverBundle: true,
    },
    dts: {
      tsgo: true,
    },
    exports: true,
    publint: true,
    sourcemap: true,
    unused: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
