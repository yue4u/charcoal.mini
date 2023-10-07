import { test, expect } from "@playwright/experimental-ct-react";
import { TextArea } from "@charcoal-ui/react";
import { collector, withTheme } from "../collector";

test("TextArea", async ({ mount, page }) => {
  const className = "ch-textarea";
  let component = await mount(
    withTheme(
      <TextArea
        showCount
        showLabel
        required
        label="label"
        assistiveText="assistiveText"
        subLabel="subLabel"
        requiredText="Required"
        maxLength={100}
      />
    )
  );

  const cleanNames = [
    "ch-textarea",
    "ch-textarea-label-container",
    "ch-textarea-label",
    "ch-textarea-required",
    "ch-textarea-sub-label",
    "ch-textarea-container",
    "ch-textarea-textarea",
    "ch-textarea-count",
    "ch-textarea-assistive-text",
  ];
  const base = await collector.getStyleWithCleanNames(component, cleanNames);

  expect(base.browserStyles.scNames.length).toBe(9);

  const cssCode: Uint8Array[] = [base.code];

  await page.reload();
  component = await mount(
    withTheme(
      <TextArea
        showCount
        showLabel
        required
        label="label"
        assistiveText="assistiveText"
        subLabel="subLabel"
        requiredText="Required"
        maxLength={100}
        invalid
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

              const asContainer =
                mappedName === "ch-textarea-container" &&
                ss.filter((s) => s.type == "class").length > 1;

              const asAssistiveTest =
                mappedName === "ch-textarea-assistive-text" && ss.length === 1;

              if (!asContainer && !asAssistiveTest) {
                return [];
              }

              if (asContainer) {
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
