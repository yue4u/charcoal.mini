import { collector } from "./collector";
import fs from "fs/promises";
import path from "path";
import pkg from "../package.json";

export default async function main() {
  const components = path.join(__dirname, "../components");
  const cssFiles = (await fs.readdir(components)).filter((f) =>
    f.endsWith("css")
  );
  const contents = await Promise.all(
    cssFiles.map((f) => fs.readFile(path.join(components, f)))
  );

  await collector.save(
    "../dist/charcoal.mini",
    [
      `/* Original Author @charcoal-ui v${pkg.devDependencies["@charcoal-ui/react"]}. Copyright 2022 pixiv Inc. Licensed under Apache-2.0. https://github.com/pixiv/charcoal/blob/main/LICENSE */`,
      collector.passThrough(contents),
    ],
    { pretty: false }
  );
}
