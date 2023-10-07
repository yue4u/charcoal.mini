import { test } from "@playwright/experimental-ct-react";
import { IconButton } from "@charcoal-ui/react";
import { collector, createCleaner, withTheme } from "../collector";
import { Declaration, Rule } from "lightningcss";

test("IconButton", async ({ mount, page }) => {
  const className = "ch-icon-button";
  let component = await mount(
    withTheme(<IconButton icon="24/Close"></IconButton>)
  );

  const base = await collector.getBrowserStyles(component);

  const cleaner = createCleaner();

  const baseStyle = collector.getStyle({
    browserStyles: base.styles,
    visitor: {
      Rule: {
        style(rule) {
          collector.visitForButton(rule, className);
          cleaner.collect(rule);
          return rule;
        },
      },
    },
  });

  const cssCode: Uint8Array[] = [baseStyle.code];

  for (const [k, v] of [
    ["size", "XS"],
    ["size", "S"],
    ["size", "M"],
    ["variant", "Overlay"],
  ] as const) {
    await page.reload();
    component = await mount(
      withTheme(
        <IconButton icon="24/Close" {...{ [k]: v }}>
          test
        </IconButton>
      )
    );
    const nextStyle = await collector.getBrowserStyles(component);
    const [_, ...rest] = nextStyle.styles;

    cssCode.push(
      collector.getStyle({
        browserStyles: rest,
        visitor: {
          Rule: {
            style(rule) {
              collector.visitForButton(rule, className, [k, v]);
              return cleaner.clean(rule, k);
            },
          },
        },
      }).code
    );
  }

  await collector.save(className, cssCode);
});
