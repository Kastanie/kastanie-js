import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite";

const buildNumberFile = new URL("./build-number.json", import.meta.url);
const packageFile = new URL("./package.json", import.meta.url);

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function getBuildNumber(increment) {
  const buildNumber = readJson(buildNumberFile).build + (increment ? 1 : 0);

  if (increment) {
    writeFileSync(
      buildNumberFile,
      `${JSON.stringify({ build: buildNumber }, null, 2)}\n`,
    );
  }

  return buildNumber;
}

export default defineConfig(({ command }) => {
  const version = readJson(packageFile).version;
  const buildNumber = getBuildNumber(command === "build");

  return {
    root: "src",
    publicDir: "../public",
    base: "./",
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __BUILD_NUMBER__: JSON.stringify(buildNumber),
      __BUILD_VERSION__: JSON.stringify(`${version}+${buildNumber}`),
    },
    build: {
      outDir: "../dist",
      emptyOutDir: true,
    },
  };
});
