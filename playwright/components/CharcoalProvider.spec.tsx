import { CharcoalProvider } from "@charcoal-ui/react";
import { light } from "@charcoal-ui/theme";
import { test, expect } from "@playwright/experimental-ct-react";

// HACK: include CharcoalProvider to the test build bundle
test("CharcoalProvider", async ({ mount, page }) => {
  await mount(
    <CharcoalProvider
      themeMap={{
        ":root": light,
      }}
    />
  );
});
