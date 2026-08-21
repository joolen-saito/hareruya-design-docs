# Implementation Rules

## Scope

- Target only rows in `functions/todo-list.md` whose customization category is `標準`.
- Prefer functions with an existing `integration_test/e2e/*_e2e_cases.md` file and missing/thin `e2e/spec` coverage.
- Keep standard-function expectations aligned to ec-cube-enterprise design, not current defects.
- Exclude Ph2 (phase-2 and later) whole-function features. Their Excel design docs carry a shape/textbox note such as `…はPh2で対応するため、Ph1では実装しない` / `Ph2で対応` / `フェーズ2以降で設計予定`. Do not create or keep `e2e_cases.md`, `e2e/spec`, or `e2e/pages` for them (not even as `test.fixme`). Current set: M03-43, M04-06, M04-07, M06-13, M08-11, M08-15, M08-16, A06-14, B01-02, B01-03, F02-05. The generator drivers (`.codex/e2e_workflow.js` / `e2e_review.js` / `e2e_audit.js`) skip these via their `EXCLUDED_STEMS` set.
- Keep the first TSV fence in every `integration_test/e2e/*_e2e_cases.md` at 14 columns: the existing 10 case-definition columns plus `実施者`, `実施日`, `結果`, `失敗理由`. The execution-management cells start empty.

## Screen Reachability (integration tests must traverse transitions)

Full rules: [TRANSITION_RULES.md](TRANSITION_RULES.md). Summary:

- The reachability class of every screen path comes from `e2e/config/screen-reachability.tsv`
  (evidence `file:line` required). Never infer a class; unregistered paths are undecided.
- `transition-only` screens (confirm / complete / wizard steps / order-context screens) must be
  reached with `reachVia()` from their entry screen. Opening them with `page.goto()` is a defect:
  it skips the transition under test and trips the design-documented guard instead.
- `action-endpoint` paths (POST/PUT/PATCH/DELETE only) are not screens. Never `page.goto()` them;
  trigger them through on-screen actions.
- Import `test` from `e2e/fixtures/reachability.fixture.ts` and reach screens through
  `e2e/helpers/navigation.ts` (`enter` / `reachVia` / `step` / `directAccess`) instead of raw
  `page.goto()`. The fixture replaces `page.goto` itself, so a forgotten helper still fails at
  runtime; the helpers enforce the contract (no `goto` inside a transition action, no
  `directAccess` on an entry screen).
- `要確認` means the design doc does not settle direct access for that screen. Do not upgrade it to
  `transition-only` or `entry-direct` to make the audit quiet; settle it with evidence first.
- Direct access is allowed only when direct access itself is the viewpoint (unauthenticated access,
  missing-state guard, URL contract). Declare it with `directAccess(page, path, reason)`, or with an
  `@direct-access: <reason>` comment within 8 lines above a raw `page.goto()`.
- Do not treat the mother-set `テスト観点` column (e.g. 「未認証」) as evidence of a direct-access
  case; it is generator noise. The intent must appear verbatim in the steps.

## Logical Naming (no physical names)

Full rules: `.cursor/skills/logical-naming/SKILL.md`. Summary:

- Case Markdown, spec/page comments and oracle text use logical names: message ID + on-screen text
  for messages, business names for session data / routes / DB tables and columns.
- Translation keys, session keys, flash keys, route bind names and `dtb_`/`mtb_`/`plg_` names are not
  written at all — not even in parentheses as evidence. `e2e/config/logical-names.tsv` holds the
  mapping, and every row needs `出典`.
- Selectors, `file:line`, HTTP paths, command names, executable SQL and seed definitions stay
  physical; they are execution values, not descriptions.
- The audit is baselined: legacy files are recorded in `.cursor/skills/logical-naming/baseline.tsv`
  and only newly added physical names fail. Do not raise the baseline to silence a new violation.

## Spec Pattern

- Start with unauthenticated direct-access tests when the screen is admin-only, and write them with
  `directAccess()` so the intent is declared (this is the direct-access viewpoint, not a shortcut).
- Add authenticated display/navigation tests guarded by credentials. Reach `transition-only` screens
  with `reachVia()`; never shortcut them with `page.goto()`.
- Add mutation tests only when rollback or a dedicated seed is available.
- Add `test.fixme` for planned automation blocked by seed, environment setting, external service, or destructive shared-state risk.
- For seed-backed cases, add the seed set to `e2e/seed/manifest.json`, apply it with `e2e/seed/lib/apply.sh`, export its env contract via `e2e/seed/lib/seed-env.sh`, and import values from `e2e/config/seed.config.ts` in the spec.
- Do not keep a case as `test.fixme` solely because it previously lacked seed data; after the seed exists, make the case live unless another blocker remains.
- Do not mirror every manual or out-of-scope E2E case as `fixme`; keep those in the case Markdown.

## Page Object Pattern

- Keep one class per function page where possible.
- Store route URLs in the Page Object using `ECCUBE_ADMIN_ROUTE`.
- Do not add a `gotoX()` method that navigates straight to a `transition-only` screen. Expose the
  on-screen commands (click / submit) instead and let the spec compose the path with `reachVia()`.
- Expose locators for stable screen regions and commands.
- Put design/Twig/message provenance in comments only where it prevents future oracle drift.

## Verification

Run these before finishing a rollout slice:

```bash
python3 .cursor/skills/logical-naming/scripts/audit_logical_naming.py --repo .
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/audit_standard_playwright.py --repo .
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/extract_screen_transitions.py --selftest
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/extract_screen_transitions.py --repo .
python3 .codex/skills/hareruya-playwright-standard-tests/scripts/audit_transition_paths.py --repo . --scope <target fids> --strict
e2e/seed/lib/apply.sh <needed SEED ids>
eval "$(e2e/seed/lib/seed-env.sh)"
cd e2e && npx playwright test spec/_harness/navigation.selfcheck.spec.ts spec/_harness/logical-naming.selfcheck.spec.ts
cd e2e && npx playwright test --list
```
