import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homePagePath = new URL("../client/src/pages/Home.tsx", import.meta.url);

describe("public Secure Sign In action", () => {
  it("uses the Clerk-aware planner handler from the header", () => {
    const source = readFileSync(homePagePath, "utf8");

    expect(source).toMatch(
      /className="header-action"\s+onClick=\{openSecurePlanner\}/,
    );
    expect(source).not.toMatch(
      /className="header-action"\s+onClick=\{\(\) => scrollTo\("#weekly-plan"\)\}/,
    );
  });
});
