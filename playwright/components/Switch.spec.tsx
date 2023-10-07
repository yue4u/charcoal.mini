import { test, expect } from "@playwright/experimental-ct-react";
import { Switch } from "@charcoal-ui/react";
import { collector, withTheme } from "../collector";

test("Switch", async ({ mount, page }) => {
  const className = "ch-switch";
  let component = await mount(
    withTheme(
      <Switch name="switch" onChange={() => {}}>
        Turn off light
      </Switch>
    )
  );

  const base = await collector.getStyleWithCleanNames(component, [
    "ch-switch",
    "ch-switch-input",
    "ch-switch-text",
  ]);

  expect(base.browserStyles.scNames.length).toBe(3);

  await collector.save(className, [base.code]);
});
