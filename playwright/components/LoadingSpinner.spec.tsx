import { test, expect } from "@playwright/experimental-ct-react";
import { LoadingSpinner } from "@charcoal-ui/react";
import { collector, withTheme } from "../collector";

test("LoadingSpinner", async ({ mount, page }) => {
  const className = "ch-loading-spinner";
  let component = await mount(withTheme(<LoadingSpinner />));

  const base = await collector.getBrowserStyles(component);

  expect(base.scNames.length).toBe(2);

  const classMap = collector.scToCleanMap(base.scNames, [
    "ch-loading-spinner",
    "ch-loading-spinner-bubble",
  ]);

  const baseStyle = collector.getStyle({
    browserStyles: base.styles,
    visitor: {
      Rule: {
        keyframes(k) {
          if (k.value.vendorPrefix.length) {
            return { type: "ignored", value: "" };
          }

          k.value.name.value = "spin";
          return k;
        },
        style(rule) {
          const ret = collector.mapSelectorWithClassMap(rule, classMap);
          if (ret.type === "ignored") return ret;

          rule.value.declarations.declarations =
            rule.value.declarations.declarations.map((d) => {
              if (d.property === "animation") {
                d.value = d.value.map((a) => {
                  if (a.name.type === "ident") {
                    a.name.value = "spin";
                  }
                  return a;
                });
              }
              return d;
            });

          return rule;
        },
      },
    },
  });

  await collector.save(className, [baseStyle.code]);
});
