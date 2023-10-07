import { test, expect } from "@playwright/experimental-ct-react";
import { parse } from "node-html-parser";
import shiki from "shiki";
import prettier from "prettier";
import fs from "node:fs/promises";
import path from "node:path";

test("example", async ({ page }, testInfo) => {
  const exampledPath = path.join(__dirname, "../dist/example.html");
  const charcoalMiniPath = path.join(__dirname, "../dist/charcoal.mini.css");
  const [exampleHtml, charcoalMini] = await Promise.all([
    fs.readFile(exampledPath, "utf-8"),
    fs.readFile(charcoalMiniPath, "utf-8"),
  ]);

  const example = parse(exampleHtml, { comment: true });

  const highlighter = await shiki.getHighlighter({
    theme: "css-variables",
  });

  (
    await Promise.all(
      example.querySelectorAll("pre").map(async (pre) => {
        const query = pre.nextElementSibling.getAttribute("data-query");
        return [
          pre,
          highlighter.codeToHtml(
            await prettier.format(
              parse(
                query
                  ? example
                      .querySelectorAll(query)
                      .map((e) => e.outerHTML)
                      .join("\n")
                  : pre.nextElementSibling.outerHTML,
                { comment: false }
              ).outerHTML,
              {
                parser: "html",
              }
            ),
            { lang: "html" }
          ),
        ] as const;
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

    await page.route(
      (url) => url.pathname.endsWith("css"),
      (route) => route.fulfill({ body: charcoalMini, contentType: "text/css" })
    );
    await page.setContent(exampleHtml);

    expect(
      await page.screenshot({ fullPage: true, animations: "disabled" })
    ).toMatchSnapshot();
  }
});
