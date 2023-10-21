import { type ComponentFixtures } from "@playwright/experimental-ct-react";
import { CharcoalProvider } from "@charcoal-ui/react";
import { light } from "@charcoal-ui/theme";
import {
  CustomAtRules,
  Declaration,
  Rule,
  Selector,
  Visitor,
  transform,
} from "lightningcss";
import path from "node:path";
import fs from "node:fs/promises";
import prettier from "prettier";

export const withTheme = (reactNode: JSX.Element) => (
  <CharcoalProvider
    themeMap={{
      ":root": light,
    }}
  >
    {reactNode}
  </CharcoalProvider>
);

export const collector = {
  passThrough(code: Uint8Array[]) {
    return transform({
      filename: "charcoal.mini.css",
      code: Buffer.from(code.map((c) => c.toString()).join("\n")),
      minify: true,
    }).code;
  },

  getStyle({
    browserStyles,
    visitor,
  }: {
    browserStyles: string[];
    visitor?: Visitor<CustomAtRules>;
  }): {
    code: Uint8Array;
  } {
    let { code } = transform({
      filename: "button.css",
      code: Buffer.from(browserStyles.join("\n")),
      minify: true,
      sourceMap: false,
      visitor,
    });

    return { code };
  },

  async save(
    name: string,
    code: (string | Uint8Array)[],
    { pretty = true }: { pretty?: boolean } = {}
  ) {
    await fs.writeFile(
      path.join(__dirname, "../components", `${name.replace("ch-", "")}.css`),
      pretty
        ? await prettier.format(code.join("\n").toString(), {
            parser: "css",
          })
        : code
    );
  },

  async getBrowserStyles(
    component: Awaited<ReturnType<ComponentFixtures["mount"]>>
  ) {
    return await component.evaluate(() => {
      const ret: string[] = [];
      for (const { cssRules } of Array.from(document.styleSheets)) {
        for (const { cssText } of Array.from(cssRules)) {
          ret.push(cssText);
        }
      }

      const nodeClasss = Array.from(document.body?.querySelectorAll("*") ?? [])
        .map((e) => {
          return Array.from(e.classList);
        })
        .filter((e) => e.length);

      const [root, ...styles] = ret;
      return { root, styles, scNames: nodeClasss };
    });
  },

  scToCleanMap(scNames: string[][], cleanNames: (string | null)[]) {
    return Object.fromEntries(
      scNames.flatMap((nn, i) => {
        return nn.map((n) => [
          n,
          typeof cleanNames[i] === "string" ? cleanNames[i] : null,
        ]);
      })
    );
  },

  mapSelectorToSingleName(ss: Selector, name: string): Selector {
    return ss.map((s) => {
      if (s.type === "class") {
        return {
          ...s,
          name,
        };
      }
      return s;
    });
  },

  mapSelectorWithClassMap(
    rule: Extract<Rule, { type: "style" }>,
    classMap: Record<string, string | null>
  ): Rule {
    let ignored = false;
    rule.value.selectors = rule.value.selectors.map((ss) => {
      return ss.map((s) => {
        if (s.type === "class") {
          if (!classMap[s.name]) {
            ignored = true;
          }
          return { ...s, name: classMap[s.name]! };
        }
        return s;
      });
    });
    if (ignored) {
      // @ts-expect-error
      return { type: "ignored", value: "" };
    }
    return rule;
  },

  async getStyleWithCleanNames(
    component: Awaited<ReturnType<ComponentFixtures["mount"]>>,
    cleanNames: (string | null)[]
  ) {
    const browserStyles = await collector.getBrowserStyles(component);
    const classMap = collector.scToCleanMap(browserStyles.scNames, cleanNames);
    // console.log({ classMap, browserStyles });

    return {
      browserStyles,
      classMap,
      code: collector.getStyle({
        browserStyles: browserStyles.styles,
        visitor: {
          Rule: {
            style(rule) {
              return collector.mapSelectorWithClassMap(rule, classMap);
            },
          },
        },
      }).code,
    };
  },

  visitForButton(
    rule: Extract<Rule, { type: "style" }>,
    className: string,
    variantClassName?: [string, string | boolean]
  ) {
    rule.value.selectors = rule.value.selectors.map((ss) => {
      // without variant
      if (!variantClassName) {
        return collector.mapSelectorToSingleName(ss, className);
      }
      const [k, v] = variantClassName;

      const startWithBaseClass =
        ss[0].type === "class" && ss[0].name === className;
      // has base class
      if (!startWithBaseClass) {
        return [
          { type: "class", name: className },
          ...collector.mapSelectorToSingleName(
            ss,
            k === "variant"
              ? v.toString().toLowerCase()
              : [k, v]
                  .filter((n) => typeof n === "string")
                  .join("-")
                  .toLowerCase()
          ),
        ];
      } else {
        return ss;
      }
    });
  },
};

export const createCleaner = () => {
  const baseStyleMap: Partial<
    Record<Declaration["property"], Declaration["value"]>
  > = {};

  return {
    collect(rule: Extract<Rule, { type: "style" }>) {
      rule.value.declarations?.declarations?.forEach((d) => {
        baseStyleMap[d.property] = d.value;
      });
    },
    clean(rule: Extract<Rule, { type: "style" }>, k: string): Rule {
      // reduce classes
      if (rule.value.selectors[0]?.[1]?.type === "class") {
        if (
          rule.value.selectors[0].some(
            (s) => s.type === "pseudo-class" && s.kind === "active"
          )
        ) {
          // @ts-expect-error
          return { type: "ignored", value: "" };
        }

        let ignored = false;
        if (rule.value.declarations?.declarations) {
          rule.value.declarations.declarations =
            rule.value.declarations.declarations
              .filter((d) => {
                if (d.property === "cursor" && d.value.keyword === "default") {
                  ignored = true;
                }

                if (
                  (k === "size" || k == "fullWidth") &&
                  d.property === "unparsed" &&
                  (d.value.propertyId.property === "color" ||
                    d.value.propertyId.property === "background-color")
                ) {
                  return null;
                }

                if (
                  JSON.stringify(baseStyleMap[d.property]) ===
                  JSON.stringify(d.value)
                ) {
                  return null;
                }
                return d;
              })
              .filter(Boolean);
        }

        if (ignored) {
          // @ts-expect-error
          return { type: "ignored", value: "" };
        }
      }

      return rule;
    },
  };
};
