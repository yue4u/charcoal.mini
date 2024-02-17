import { test, expect } from "@playwright/experimental-ct-react";
import { parse } from "node-html-parser";
import prettier from "prettier";
import fs from "node:fs/promises";
import path from "node:path";
import { getHighlighter } from "shiki";

test("example", async ({ page }, testInfo) => {

  const exampledPath = path.join(__dirname, "../dist/example.html");
  const charcoalMiniPath = path.join(__dirname, "../dist/charcoal.mini.css");
  const [exampleHtml, charcoalMini] = await Promise.all([
    fs.readFile(exampledPath, "utf-8"),
    fs.readFile(charcoalMiniPath, "utf-8"),
  ]);

  const example = parse(exampleHtml, { comment: true });

  const theme = "css-variables";
  const highlighter = await getHighlighter({
    themes: [theme],
    langs: ["html", "css", "markdown"]
  });

  example.querySelectorAll("section h2").forEach((title) => {
    if (title.textContent.startsWith(".")) {
      title.setAttribute("id", title.textContent.slice(1));
    }
  });

  (
    await Promise.all(
      example.querySelectorAll("pre").map(async (pre) => {
        const query = pre.nextElementSibling?.getAttribute("data-query");
        const content = pre.nextElementSibling?.getAttribute("data-content");

        let html: string;
        let parser = "html";
        if (query) {
          const source = example
            .querySelectorAll(query)
            .map((e) => e.outerHTML)
            .join("\n")
            .replace(
              "./charcoal.mini.css",
              "https://unpkg.com/charcoal.mini/dist/charcoal.mini.css"
            );
          html = highlighter.codeToHtml(
            await prettier.format(parse(source, { comment: false }).outerHTML, {
              parser: "html",
            }),
            {
              lang: "html",
              theme,
            }
          );
        } else if (content) {
          const lang = pre.nextElementSibling?.getAttribute("data-lang");
          if (lang) {
            html = highlighter.codeToHtml(
              await prettier.format(
                parse(content, { comment: false }).outerHTML,
                {
                  parser: lang,
                }
              ),
              { lang, theme }
            );
          } else {
            throw new Error(`expect lang for ${content}`);
          }
        } else {
          const source = pre.nextElementSibling?.outerHTML;
          if (!source) throw new Error("expect source");
          html = highlighter.codeToHtml(
            await prettier.format(parse(source, { comment: false }).outerHTML, {
              parser: "html",
            }),
            { lang: "html", theme }
          );
        }

        return [pre, html] as const;
      })
    )
  ).forEach(([pre, html]) => {
    pre.replaceWith(html);
  });
  const result = await prettier.format(example.outerHTML, { parser: "html" });

  if (testInfo.config.updateSnapshots === "all") {
    await fs.writeFile(exampledPath, result, "utf-8");
  } else {
    expect(exampleHtml).toBe(result);
  }

  await page.route(
    (url) => url.pathname.endsWith("css"),
    (route) => route.fulfill({ body: charcoalMini, contentType: "text/css" })
  );
  await page.setContent(exampleHtml);

  expect(
    await page.screenshot({ fullPage: true, animations: "disabled" })
  ).toMatchSnapshot();
});
