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
    null, //6. "prefix-container": prefixContainer,
    null, //7. surround: [...prefix, ...suffix],
    "ch-textfield-input",
    null, //9: "suffix-container": suffixContainer,
    null, //10: count: count,
    "ch-textfield-assistive-text",
  ];

  const base = await collector.getStyleWithCleanNames(component, cleanNames);

  expect(base.browserStyles.scNames.length).toBe(12);

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
                mappedName === "ch-textfield-input" &&
                // @ts-expect-error
                ss[0]?.name === ss[1]?.name;

              const asAssistiveTest =
                mappedName === "ch-textfield-assistive-text" && ss.length === 1;
              if (!asInput && !asAssistiveTest) {
                return [];
              }

              if (asInput) {
                ss.shift();
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
