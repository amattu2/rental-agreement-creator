---
description: "Use when creating or editing Vitest unit tests or Playwright E2E tests. Defines the required test description convention."
applyTo: "**/*.test.{ts,tsx},**/*.spec.{ts,tsx}"
---

# Test descriptions

Always start every test case description with "should " followed by the expected
behavior, for both Vitest and Playwright. This also applies to parameterized cases
such as `it.each` and `test.each`.

Use "should export a backup" rather than "exports a backup". Suite descriptions
such as `describe("Implementation Requirements")` may name the subject without this prefix.
