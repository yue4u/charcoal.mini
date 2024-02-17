import { test, expect } from "@playwright/experimental-ct-react";
import { TextField } from "@charcoal-ui/react";
import { collector, withTheme } from "../collector";
import { Rule } from "lightningcss";

test("TextField", async ({ mount, page }) => {
  const className = "ch-textfield";
  let component = await mount(
    withTheme(
      <TextField
        // showCount
        showLabel
        required
        label="label"
        assistiveText="assistiveText"
        subLabel="subLabel"
        requiredText="Required"
        maxLength={100}
        // prefix="prefix"
        // suffix="suffix"
      />
    )
  );

  const cleanNames = [
    "ch-textfield",
    "ch-textfield-label-container",
    "ch-textfield-label",
    "ch-textfield-required",
    "ch-textfield-sub-label",
    "ch-textfield-input-container",
    //6. "prefix-container": prefixContainer,
    //7. surround: [...prefix, ...suffix],
    "ch-textfield-input",
    //9: "suffix-container": suffixContainer,
    //10: count: count,
    "ch-textfield-assistive-text",
  ];

  const base = await collector.getStyleWithCleanNames(component, cleanNames);

  expect(base.browserStyles.scNames.length).toBe(cleanNames.length);

  const cssCode: Uint8Array[] = [base.code];

  await page.reload();
  component = await mount(
    withTheme(
      <TextField
        // showCount
        showLabel
        required
        label="label"
        assistiveText="assistiveText"
        subLabel="subLabel"
        requiredText="Required"
        maxLength={100}
        invalid
        // prefix="prefix"
        // suffix="suffix"
      />
    )
  );

  const nextStyle = await collector.getBrowserStyles(component);

  const nextClassMap = collector.scToCleanMap(nextStyle.scNames, cleanNames);

  cssCode.push(
    collector.getStyle({
      browserStyles: nextStyle.styles,
      visitor: {
        Rule: {
          style(rule) {
            rule.value.selectors = rule.value.selectors.flatMap((ss) => {
              // @ts-expect-error
              const mappedName = nextClassMap[ss[0].name];

              const asInput =
                mappedName === "ch-textfield-input-container";

              const asAssistiveTest =
                mappedName === "ch-textfield-assistive-text" && ss.length === 1;
              if (!asInput && !asAssistiveTest) {
                return [];
              }

              return [
                [
                  { type: "class", name: mappedName },
                  ...collector.mapSelectorToSingleName(ss, "invalid"),
                ],
              ];
            });

            return rule;
          },
        },
      },
    }).code
  );
  await collector.save(className, cssCode);
});
