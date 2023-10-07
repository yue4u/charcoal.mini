import { test, expect } from "@playwright/experimental-ct-react";
import { Radio, RadioGroup } from "@charcoal-ui/react";
import { collector, withTheme } from "../collector";

test("Radio", async ({ mount, page }) => {
  const className = "ch-radio";
  let component = await mount(
    withTheme(
      <RadioGroup label="選択肢" name="1" value="1" onChange={() => {}}>
        <Radio value="1">選ぶ</Radio>
      </RadioGroup>
    )
  );

  const base = await collector.getStyleWithCleanNames(component, [
    "ch-radio-group",
    "ch-radio",
    "ch-radio-input",
    "ch-radio-text",
  ]);

  expect(base.browserStyles.scNames.length).toBe(4);

  await collector.save(className, [base.code]);
});
