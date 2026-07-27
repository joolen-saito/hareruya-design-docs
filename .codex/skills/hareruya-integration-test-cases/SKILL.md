---
name: hareruya-integration-test-cases
description: Generate Hareruya integration test case Markdown from integration-test-viewpoints.md and HTML design documents, using the existing TSV grain and validation rules.
---

# Hareruya Integration Test Cases

## Overview

Use this skill when creating or regenerating integration test case Markdown for Hareruya design documents. It reads:

- `integration_test/integration-test-viewpoints.md`
- `functions/todo-list.md`
- HTML design documents linked from `functions/todo-list.md` in the `詳細設計書` column

Output is written to `integration_test/*_it_cases.md` using the same 10-column TSV grain as the existing files. The output basename must be derived from the linked function HTML, so it starts with the function number in normalized form such as `m01_01_...`, `f06_03_...`, `a15_01_...`, or `b05_01_...`.

## Workflow

1. Review `references/TEMPLATE.md`, `references/TERMINOLOGY.md`, and `references/CHECKLIST.md`.
2. Generate or update the Markdown files:

```bash
python3 .codex/skills/hareruya-integration-test-cases/scripts/generate_it_cases.py --repo . --overwrite
```

3. Validate the generated Markdown:

```bash
python3 .codex/skills/hareruya-integration-test-cases/scripts/format_tsv.py integration_test/admin_login_it_cases.md --check
```

4. For broad regeneration, validate every generated file:

```bash
find integration_test -name '*_it_cases.md' -type f -print0 | xargs -0 -n1 python3 .codex/skills/hareruya-integration-test-cases/scripts/format_tsv.py --check
```

5. Check that obsolete phrases are not present:

```bash
rg -n 'UI標準|\.cursor/docs/テスト観点|設計書に記載のとおり|設計どおり' integration_test .codex/skills/hareruya-integration-test-cases
```

## Unexpanded Candidate Promotion

Use the promotion workflow when existing `integration_test/*_it_cases.md` files need more cases from already-ranked candidates. This workflow updates already-output test case files in place. Do not create additional per-function test case files, because duplicate or alternate outputs make it unclear which file is current.

1. Export the current unexpanded candidate list:

```bash
python3 .codex/skills/hareruya-integration-test-cases/scripts/export_unexpanded_it_candidates.py --repo .
```

2. Dry-run promotion by the approved caps:

```bash
python3 .codex/skills/hareruya-integration-test-cases/scripts/promote_it_cases_by_rules.py --repo . --dry-run
```

3. Review `integration_test/unexpanded_promotion_rollout_summary.md` and `integration_test/unexpanded_promotion_rollout_report.tsv`.

4. Run promotion only after the dry-run report is acceptable:

```bash
python3 .codex/skills/hareruya-integration-test-cases/scripts/promote_it_cases_by_rules.py --repo .
```

5. Re-export candidates and validate all generated Markdown:

```bash
python3 .codex/skills/hareruya-integration-test-cases/scripts/export_unexpanded_it_candidates.py --repo .
find integration_test -name '*_it_cases.md' -type f -print0 | xargs -0 -n1 python3 .codex/skills/hareruya-integration-test-cases/scripts/format_tsv.py --check
```

To classify remaining unexpanded candidates instead of expanding them blindly, run:

```bash
python3 .codex/skills/hareruya-integration-test-cases/scripts/triage_unexpanded_it_candidates.py --repo .
```

This writes `integration_test/unexpanded_it_candidates_triage.tsv` and `integration_test/unexpanded_it_candidates_triage_summary.md`.

To make adoption decisions from the triage result, run:

```bash
python3 .codex/skills/hareruya-integration-test-cases/scripts/decide_unexpanded_it_candidates.py --repo .
```

This writes `integration_test/unexpanded_it_candidates_adoption.tsv` and `integration_test/unexpanded_it_candidates_adoption_summary.md`.

For files skipped because existing rows differ from current generator recomputation, do not overwrite the first 90 rows. Use the reviewed drift harness:

```bash
python3 .codex/skills/hareruya-integration-test-cases/scripts/promote_drift_it_cases.py --repo . --dry-run
python3 .codex/skills/hareruya-integration-test-cases/scripts/promote_drift_it_cases.py --repo .
```

Promotion caps:

- 90 cases: simple display, navigation, and static list features.
- 120 cases: normal search, detail, edit, and list features.
- 140 cases: admin create, update, delete, and DB write features.
- 160 cases: external integration, mail, and batch-complex features.
- 180 cases: CSV import/export, file upload/download, report, PDF, and print features.

Promotion safeguards:

- Update existing `*_it_cases.md` files only; skip missing output files instead of creating them.
- Do not run broad unscoped generation with `--overwrite --max-cases-per-file=180`.
- Use `--only` for manual pilot regeneration.
- Skip files whose existing rows differ from the current generator recomputation. Resolve drift separately before promotion.
- Skip additions that would include P3 rows; P3 expansion requires individual review.
- Do not classify terminal / screen-size differences as disposable UI detail. `IT-21` is retained for responsive behavior.
- Do not classify locale differences as disposable UI detail. Locale differences are handled by function-level Japanese/English HTML or twig variants, not by `IT-21`; keep those candidates at individual-review level or higher.
- Playwright/E2E harness changes are out of scope for this integration-test-case skill unless explicitly requested.

## Generation Rules

- Generate from the per-function HTML links in `functions/todo-list.md`; do not generate test cases from parent Excel HTML files under `excel_to_html/output/`.
- Exclude B16-01, B16-02, B16-03, B16-04, B16-05, B16-07, B16-08, and B16-12 from integration test case generation and aggregation regardless of whether related function documents exist.
- Exclude Ph2 (phase-2 and later) whole-function features from integration test case generation and aggregation. These are functions whose Excel design docs carry a shape/textbox note such as `…はPh2で対応するため、Ph1では実装しない` / `Ph2で対応` / `フェーズ2以降で設計予定`, meaning the entire function is out of Ph1 scope. Current set (also listed in `EXCLUDED_OUTPUT_STEMS`): M03-43, M04-06, M04-07, M06-13, M08-11, M08-15, M08-16, A06-14, B01-02, B01-03, F02-05. Detection source of truth is the Excel drawing XML (`xl/drawings/*.xml`), not the generated HTML/output, because some Ph2 shape notes never reach the function HTML (e.g. F02-05).
- Do not keep fallback `case_*_it_cases.md` outputs. Those indicate a parent or non-function HTML input and must be deleted or regenerated from the matching `todo-list.md` function HTML.
- `I/FID` must be the `IT-ID` from `integration-test-viewpoints.md`.
- `テスト観点` should be the smallest meaningful category from the viewpoint row, usually `小項目`; when it is empty or `-`, use `中項目`.
- Use one TSV row for one observable assertion.
- Do not output duplicate execution cases. A duplicate is a row whose `前提条件`, `入力データ/リクエスト内容`, `操作手順/実行方法`, and `期待結果／レスポンス` match another row after whitespace normalization.
- Keep `integration_test/all_it_cases.tsv` to one physical line per test case. When aggregating Markdown TSV rows, collapse cell-internal line breaks to ` / ` so line-oriented checks do not overcount cases.
- Do not write `UI標準` in generated output. There is no UI standard document in this project.
- Do not make the expected result depend on phrases such as `設計書に記載のとおり`.
- Put non-applicable viewpoints in the target-out-of-scope table with a concrete reason.
- Keep generated cases at integration-test level. Unit-level component checks and visual styling minutiae are out of scope unless the design explicitly exposes them as behavior.
- DB write viewpoints (IT-23/IT-26) are detected from the design doc body and from the `### DB操作` subsection (reverse-design TEMPLATE). To guarantee that a function's INSERT/UPDATE (e.g. login history, last-login date) becomes test cases, the source design doc must state the operation with the verbs 登録/更新/記録 or carry a `### DB操作` table; DB facts follow ec-cube-enterprise (skill 1c).
- Notification / WebSocket viewpoints (`大項目=通知`) are only generated for realtime-notification features. Plain screen and authentication features must not carry them.
- To regenerate a single function (pilot / staged rollout) use `--only <substr>` (e.g. `--only m01-0`). Partial runs (`--only`/`--limit`) do not overwrite `all_it_cases.tsv`.
- For broad post-pilot expansion, prefer `scripts/promote_it_cases_by_rules.py` over direct generator overwrite so approved caps, drift skips, P3 skips, and existing-file-only behavior are enforced.
- Upstream prerequisite: the source design doc should satisfy `.cursor/skills/reverse-design/SOURCE-COVERAGE-CHECKLIST.md` (source↔design comprehensive reflection). Incomplete docs yield incomplete cases; fix the doc first.

## Resources

- `references/TEMPLATE.md`: Markdown and TSV structure.
- `references/TERMINOLOGY.md`: wording, priority, and expectation rules.
- `references/CHECKLIST.md`: review checklist.
- `scripts/generate_it_cases.py`: project-specific generator.
- `scripts/detect_ph2_features.py`: extracts Ph2 (phase-2) markers from the Excel design workbooks' drawing XML (`excel_to_html/input/*.xlsx`). Run it to keep `EXCLUDED_OUTPUT_STEMS` in sync with the source of truth when design docs change: `python3 .codex/skills/hareruya-integration-test-cases/scripts/detect_ph2_features.py --repo .`. A whole-function Ph2 note (e.g. `…はPh2で対応するため、Ph1では実装しない`) means the function's output stem must be excluded; a note scoped to one item inside an otherwise-Ph1 sheet is not a whole-function exclusion.
- `scripts/export_unexpanded_it_candidates.py`: exports current unexpanded candidates and summary counts.
- `scripts/promote_it_cases_by_rules.py`: promotes existing test case files by approved caps without creating new per-function files.
- `scripts/promote_drift_it_cases.py`: promotes reviewed drift files while preserving existing emitted rows.
- `scripts/triage_unexpanded_it_candidates.py`: classifies remaining unexpanded candidates as promote, review, or integration-test-unneeded candidates.
- `scripts/decide_unexpanded_it_candidates.py`: makes final adoption / rejection decisions from the triage result.
- `scripts/format_tsv.py`: TSV normalizer and validator inherited from the existing Cursor skill.

## 実行可能グレード具体化と concretized.tsv 出力（2026-07-27 追加）

母集合 `integration_test/all_it_cases.tsv`（汎用テンプレ・凍結）を実行可能グレードへ具体化する
下流工程。統治＝`integration_test/CONCRETIZATION_GATES.md`（Gate A機械／B著者自己監査／C codex上限2パス／D concretized.tsv出力）。

- 候補は `integration_test/e2e/exec/_drafts/<fid>_..._executable_draft.md`（§0-§10。§4=14列具体ケース／§1=L1オラクル）
  ＋ `e2e/fixtures/oracle/_drafts/<fid>_..._oracle_draft.json`。**`_drafts/`隔離**（正式化はM0機械後）。
- **Gate A（codex前必須・exit1）**: `.codex/skills/hareruya-message-inventory/scripts/gate_concretize_candidate.py --fid <fid>`。
- **Gate D（候補確定後）**: `.codex/skills/hareruya-message-inventory/scripts/emit_concretized_tsv.py --fid <fid>`
  → `integration_test/e2e/exec/tsv/<fid>_..._concretized.tsv`＝**母集合 all_it_cases.tsv と同一11列テンプレート**の
  具体化ビュー（各母集合テストIDを保持し、bound行に前提/入力/手順/期待の具体値＋`[L1:..]`＋実行方法を反映。
  TBD/excluded行は`【TBD】`/`【対象外】`で明示）。派生ビューなので手編集せず、mdを直して再生成する。
- 役割: 著者=sonnet subagent／レビュー=codex／独立性維持（[[role-assignment-after-fable5-limit]]）。

### concretized.tsv の出力規約（確定・2026-07-27ユーザー承認）
- **列**: 母集合11列＋『自動検証（内部: session/DB/URL）』＝12列。期待は「画面で目視できる結果」を主、目視できない内部（session/page_count/DB列/正確なURL/HTTPステータス）は『自動検証(内部)』列へ分離（Gate B6）。
- **出力対象**: **bound(実行可能)行のみ**。実行方法=対象外(excluded)/保留(TBD)の行は**tsvに出さない**（分類・理由はcandidate md §8/§9で管理。会計完全性 bound+TBD+excluded=母集合N を機械ゲート）。
- **人間可読**: 機械タグ([L1:..]/fixture/@TBD-D5)除去・SEEDコード→自然文・URL可読化。**『（パイロット共通）』等の内部注記は出力しない**。
- **過剰生成の除外(Gate B7)**: read-only機能に母集合が機械生成した更新/登録/削除観点は読み替えずexcluded。
- **要実機の扱い**: 期待/手順の『（…要実機…）』注記は出力除去。操作手段自体が要実機で机上テスト不可の行はtsv非出力（md管理）。
- **観点補正(Gate B8)**: 母集合の観点ラベル誤り(認証を更新内容, メッセージ表示を非同期更新等)は候補md『## 観点補正』表で正し、emitがconcretized.tsvの観点列を是正(母集合不変)。内容が実在し他で被覆なしならexcludedにせずbound維持。
- **画面検証優先(Gate B9)**: 編集系の登録/更新内容は『保存→編集画面を再表示して保存値を目視』が主(実行方法=Playwright)。DB照会は画面に現れない構造的事実(件数不変・全削除→再INSERTの物理置換・行同一性)の副次のみ。逆に画面に現れない構造的事実を『画面で目視』と主張しない。物理置換等の機械証明は一次資料に識別子が無ければTBD(ctidはMVCCで不可)。
- **期待は画面で確認できる内容(Gate B11)**: 期待結果に『（画面上の目立った変化なし）』等のプレースホルダを置かない。保存反映は編集画面を再表示して該当項目(選択タグ/割引率/カテゴリ/画像プレビュー等)が表示されることを直接記述(L1既存の初期表示仕様の帰結)。C-069等への先送り禁止。純内部事実(update_date等)しか無い行は内部専用と明示し実行区分を見直す。
- **操作手順は純粋なUI操作(Gate B10)**: 操作手順にdb.ts/afterEach等の検証・後始末を書かない(DB照会は自動検証(内部)列)。削除の実行結果も画面(一覧/詳細から消える・完了メッセージ)で確認しDBは副次。
- **母集合の完全重複排除(Gate B12)**: 母集合が同一候補ケース(§8 C-ref一致)にマップする複数行は、emitが代表1件のみtsv出力・残りは重複として非出力(会計はbound維持)。観点/期待同一でも別候補なら重複でない。
