import typescript from "rollup-plugin-typescript2";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import dts from "rollup-plugin-dts";
import json from "@rollup/plugin-json";

import pkg from "./package.json" with { type: "json" }

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: pkg.main,
        format: "cjs",
        sourcemap: "inline",
      },
      {
        file: pkg.module,
        format: "esm",
        sourcemap: "inline",
      },
    ],
    plugins: [peerDepsExternal(), typescript(), json(),],
    external: ["react", "react-dom", "tslib", "wkx", "buffer"],
  },
  {
    input: "src/index.ts",
    output: [{ file: pkg.types, format: "esm" }],
    plugins: [dts()],
  },
];
