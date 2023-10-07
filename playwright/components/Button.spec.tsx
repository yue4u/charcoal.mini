import { test, expect } from "@playwright/experimental-ct-react";
import { Button } from "@charcoal-ui/react";
import { collector, createCleaner, withTheme } from "../collector";

test("Button", async ({ mount, page }) => {
  const className = "ch-button";
  let component = await mount(withTheme(<Button>test</Button>));

  await expect(component).toContainText("test");

  const base = await collector.getBrowserStyles(component);

  const baseCode = collector.getStyle({
    browserStyles: [base.root],
  });

  await collector.save("base", [baseCode.code]);
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
    ["variant", "Overlay"],
    ["variant", "Primary"],
    ["variant", "Danger"],
    ["variant", "Navigation"],
    ["fullWidth", true],
    ["size", "S"],
  ] as const) {
    await page.reload();
    component = await mount(withTheme(<Button {...{ [k]: v }}>test</Button>));
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
