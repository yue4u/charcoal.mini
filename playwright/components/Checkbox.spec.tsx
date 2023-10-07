import { test, expect } from "@playwright/experimental-ct-react";
import { Checkbox } from "@charcoal-ui/react";
import { collector, withTheme } from "../collector";
import { Selector } from "lightningcss";

test("Radio", async ({ mount, page }) => {
  const className = "ch-checkbox";
  let component = await mount(
    withTheme(
      <Checkbox name="checkbox" label="label">
        Agree to ToS
      </Checkbox>
    )
  );

  const base = await collector.getStyleWithCleanNames(component, [
    "ch-checkbox",
    "ch-checkbox-input-container",
    "ch-checkbox-input",
    "ch-checkbox-icon-hide",
    "ch-checkbox-text",
  ]);

  expect(base.browserStyles.scNames.length).toBe(5);

  const cssCode: Uint8Array[] = [base.code];

  await page.reload();
  component = await mount(
    withTheme(
      <Checkbox name="labelled" label="label" checked>
        Agree to ToS
      </Checkbox>
    )
  );

  const browserStyles = await collector.getBrowserStyles(component);
  const classMap = collector.scToCleanMap(browserStyles.scNames, [
    "ch-checkbox",
    "ch-checkbox-input-container",
    "ch-checkbox-input",
    "ch-checkbox-icon",
    "ch-checkbox-text",
  ]);

  const checked = collector.getStyle({
    browserStyles: browserStyles.styles,
    visitor: {
      Rule: {
        style(rule) {
          rule.value.selectors = rule.value.selectors.flatMap((ss) => {
            // @ts-expect-error
            const mappedName = classMap[ss[0].name];
            const asIcon = mappedName === "ch-checkbox-icon";
            if (!asIcon) return [];

            return [collector.mapSelectorToSingleName(ss, mappedName)];
          });

          return rule;
        },
      },
    },
  });

  cssCode.push(checked.code);

  await collector.save(className, cssCode);
});
