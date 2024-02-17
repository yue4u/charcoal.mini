import { test, expect } from "@playwright/experimental-ct-react";
import {
  Modal,
  ModalAlign,
  ModalBody,
  ModalHeader,
  OverlayProvider,
} from "@charcoal-ui/react";
import { collector, withTheme } from "../collector";

test("Modal", async ({ mount, page }) => {
  const className = "ch-modal";
  let component = await mount(
    withTheme(
      <OverlayProvider>
        <Modal title="modal" isOpen onClose={() => {}} isDismissable>
          <ModalBody>
            <ModalHeader />
            <ModalAlign>
              <div>A</div>
              <div>B</div>
            </ModalAlign>
          </ModalBody>
        </Modal>
      </OverlayProvider>
    )
  );
  const cleanNames = [
    "ch-modal",
    "ch-modal-dialog",
    "ch-modal-body",
    "ch-modal-header",
    "ch-modal-title",
    "ch-modal-align",
    "ch-modal-close",
  ];
  const base = await collector.getStyleWithCleanNames(component, cleanNames);
  
  expect(base.browserStyles.scNames.length).toBe(cleanNames.length);

  const cssCode: Uint8Array[] = [base.code];

  await collector.save(className, cssCode);
});
