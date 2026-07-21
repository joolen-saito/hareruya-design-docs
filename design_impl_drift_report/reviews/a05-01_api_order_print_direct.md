OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26a6-3689-71b1-ac3b-348536b84ea5
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: a05-01_api_order_print_direct
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/a05-01_api_order_print_direct.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html
- 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube （必要に応じ /home/y-saito/Developments/ec-cube-enterprise 全体）

## 手順
1. 差分候補JSONの各findingについて、designRef(設計書 file:line)とimplRef(実装 file:line)を**実際に開いて**突き合わせる。
2. 次の観点で批判的に指摘（各指摘に file:line 根拠を付ける）:
   - 誤検知(FALSE_POSITIVE): 実装は別ファイル/別ルート/別名で設計どおり実現、または引用/行番号が誤り。
   - 見落とし(MISSED): 設計書の重要節（処理フロー/判定順序/バリデーション/DB操作/権限/エラー処理/セッション等）で実装と異なるのにfindingsに無い差分。
   - 根拠不備(WEAK_EVIDENCE): designRef/implRefが存在しない・的外れ・引用が創作。
   - 重要度誤り(SEVERITY): high/med/lowが業務影響と不整合。
3. 各指摘を「種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応」で簡潔に列挙。
4. 最後に必ず1行: VERDICT: false_positive=<n>, missed=<n>, weak_evidence=<n>, 総合=<信頼できる|要修正|大幅要修正>

warning: Codex could not find bubblewrap on PATH. Install bubblewrap with your OS package manager. See the sandbox prerequisites: https://developers.openai.com/codex/concepts/sandboxing#prerequisites. Codex will use the bundled bubblewrap in the meantime.
codex
対象がHareruya設計書監査なので、専用スキルの手順を確認してから、JSON・設計HTML・実装参照を実ファイルで突き合わせます。まず読み取りだけで根拠行を集めます。
exec
/bin/bash -lc "sed -n '1,240p' /home/y-saito/Developments/hareruya-design-docs/.codex/skills/hareruya-integration-test-cases/SKILL.md && sed -n '1,220p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/a05-01_api_order_print_direct.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 180ms:
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
{
  "functionId": "a05-01_api_order_print_direct",
  "title": "API 受注管理 — 注文印刷（印刷情報送信・印刷済み更新）",
  "domain": "a05",
  "kind": "api",
  "designHtml": "function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html",
  "findings": [
    {
      "dimension": "①ルート/HTTPメソッド",
      "severity": "high",
      "designRef": "function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html:238",
      "designQuote": "GET /order/print/direct（ConnectionTypeがGetRequest） ... POST /order/print/direct（ConnectionTypeがSetResponse）",
      "implRef": "src/Eccube/Controller/App/OrderController.php:43",
      "difference": "設計はパス /order/print/direct をGET・POST両方に割り当て、GET=GetRequest・POST=SetResponse とする。実装ルートは #[Route(path: '/api/order/prints/direct/{base_info_id}', methods: ['POST'])] で、(a) /api プレフィックス付き・print が prints・末尾に {base_info_id} 必須セグメントを持ちパスが不一致、(b) methods が POST のみでGET未登録。GetRequest をGETで呼ぶと405となる。ただし設計は挙動参照リポを pf-api、DBを ec-cube-enterprise とする再現設計で、ルート差は一部アーキテクチャ差でもある。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "OrderController.php:43 の Route属性で methods:['POST'] のみ、path=/api/order/prints/direct/{base_info_id} を確認。設計HTML:238 の 利用者視点の入口テーブルで GET/POST /order/print/direct を確認。"
    },
    {
      "dimension": "②業務ルール・計算",
      "severity": "high",
      "designRef": "function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html:247",
      "designQuote": "配送がスムーズ店頭受取の場合は合計金額欄を「スムーズ店頭受取」とする。",
      "implRef": "src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:129",
      "difference": "設計はスムーズ店頭受取の受注で合計金額欄を文言「スムーズ店頭受取」に置換すると規定。実装 getPrintData(行129)は配送方法を判定せず常に $paymentTotal(payment_total の生値)を出力。加えて取得元リポジトリ(getPrintOrderListMainShop:1517 / getDirectPrintOrderList:1575,1597)も payment_total を生値SELECTするのみで配送方法を印刷側に渡さず、置換ロジック自体が存在しない。印字結果が設計と異なる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "OrderDirectPrintAction.php:74,129 で $paymentTotal=$Order['payment_total'] を無条件出力。OrderRepository.php:1517/1575/1597 で payment_total を生値SELECT、配送方法(delivery)は印刷データに渡らない。"
    },
    {
      "dimension": "④DBカラム・DB操作",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html:310",
      "designQuote": "店頭注文番号dtb_order_number value（現行は補助表dtb_order_subのwaiting_number） 印刷情報の店頭注文番号欄。受注IDで引く。",
      "implRef": "src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:97",
      "difference": "設計は印刷情報の「店頭注文番号欄」を dtb_order_number.value（待ち番号/waiting_number）から取得すると規定。実装は dtb_order_number も waiting_number も参照せず（両リポジトリのSELECTに該当列なし）、店頭注文番号欄(行94ラベル→行97値)・注文番号欄(行114ラベル→行117値)の双方に同じ $orderNumber(order_number) を出力。店頭注文番号欄に待ち番号でなく注文番号が印字される。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "OrderDirectPrintAction.php:77 で $orderNumber=order_number、行97(店頭注文番号欄下)・行117(注文番号欄下)ともに {$orderNumber} を出力。OrderRepository.php:1508-1629 のSELECTに dtb_order_number 結合・waiting_number 列が無いことを確認。"
    },
    {
      "dimension": "⑧バッチ/API入出力・副作用",
      "severity": "high",
      "designRef": "function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html:298",
      "designQuote": "印刷ログファイルの書き出し（GetRequest）。生成した印刷情報が空でない場合、印刷情報のXMLをログ保存ディレクトリ（var/log/print_logs/配下）にタイムスタンプと一意名を付けたファイルとして書き出す。ディレクトリが存在しない場合は作成する。",
      "implRef": "src/Eccube/Controller/App/OrderController.php:57",
      "difference": "設計は GetRequest 成功時の副作用として印刷情報XMLの print_logs へのファイル書き出しを必須挙動と規定（本書で扱うこと:223・副作用:298・ログ監査:322で明記）。実装は当該ブロックが '// TODO :後ほど対応'（行57）で丸ごとコメントアウト（行58-67）されており、ログファイル書き出しの副作用が未実装。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "OrderController.php:57 のコメント '// TODO :後ほど対応' 直下、行58-67 の file_put_contents/mkdir を含むブロックが /* */ でコメントアウトされていることを確認。"
    },
    {
      "dimension": "⑦エラー処理",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html:265",
      "designQuote": "（応答なし） ConnectionTypeがGetRequest・SetResponseのいずれにも一致しない 応答を組み立てず本文を返さない。",
      "implRef": "src/Eccube/Controller/App/OrderController.php:91",
      "difference": "設計は ConnectionType が想定値に一致しない場合『応答を組み立てず本文を返さない』と規定（バリデーション:302・エラー処理:319でも同旨）。実装(行91-96)は HTTP 400(BAD_REQUEST)・Content-Type text/plain の空 StreamedResponse を明示的に返しており、設計の『応答なし』と異なる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "OrderController.php:91-96 で GetRequest/SetResponse 双方に非該当時、setStatusCode(Response::HTTP_BAD_REQUEST) の StreamedResponse を return することを確認。設計HTML:265 の失敗レスポンス表で『（応答なし）…本文を返さない』を確認。"
    },
    {
      "dimension": "②業務ルール・計算",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html:247",
      "designQuote": "印刷対象の受注一覧を取得する。店頭受取で注文受領の受注、スムーズ店頭受取で所定の支払方法かつ未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードありの受注、ブラウザ印刷フラグが立つ受注を対象とし、最大10件を取得する。",
      "implRef": "src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:44",
      "difference": "設計は抽出条件を単一系統（店頭受取NEW＋スムーズ店頭受取条件群＋browser_print_flg、最大10件）として記述。実装(行44-48)は BaseInfo->isMainShop() で分岐し、本店は getPrintOrderListMainShop（OTC-NEW＋smoothOtc条件群＋browser_print_flg の3系統OR、設計相当）を使うが、支店は getDirectPrintOrderList を使い『スムーズ店頭受取(smoothOtc)』の抽出ブランチが欠落（(OTC+NEW+smaregi) UNION (browser_print_flg) のみ）。設計に無い本店/支店分岐が存在し、支店ではスムーズ店頭受取受注が印刷対象から漏れる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "OrderDirectPrintAction.php:44-48 の isMainShop分岐を確認。OrderRepository.php:1526-1544 の本店クエリは smoothOtc(1531-1542)を含む3系統OR。同:1565-1608 の支店クエリUNIONは (OTC+NEW+smaregi_code) と (browser_print_flg) の2系統のみで SMOOTH_OTC 条件が無いことを確認。"
    },
    {
      "dimension": "④DBカラム・DB操作",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html:249",
      "designQuote": "立っていない場合は受注のステータスをピック中へ更新し、補助情報の確定日時に現在時刻を設定する。",
      "implRef": "src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:91",
      "difference": "設計は SetResponse でブラウザ印刷フラグが立たない場合『ステータスをピック中へ更新し確定日時(confirm_date)に現在時刻を設定』と規定。実装(行91-97)は BaseInfo->isMainShop() で分岐し、本店は setConfirmDate、支店は setPickingDate を設定する（設計に無い本店/支店分岐）。また設計DBカラム(:310)は picking_date・pick_finish_date を『ピック中へ更新する際に設定』とするが、実装は pick_finish_date を一切設定せず、支店では confirm_date を設定しない。設定される日時列が設計と一致しない。なお設計自体が処理フロー(confirm_date)とDBカラム(picking_date/pick_finish_date)で列指定に揺れがある点に留意。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "UpdatePrintedOrderStatusAction.php:91-97 で isMainShop→setConfirmDate、else→setPickingDate を確認。pick_finish_date のセッタ呼び出しは同ファイル内に存在しない。設計HTML:249(confirm_date)と:310(picking_date・pick_finish_date)の記述差も確認。"
    }
  ]
}

codex
差分候補の中身は7件でした。次に、候補が参照している設計行と実装行をそのまま開き、周辺行も含めて引用の成立性を確認します。
exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html | sed -n '220,330p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   220	<ul><li>A05-01 注文印刷_印刷情報をプリンタへ送信（<code>ConnectionType</code>が<code>GetRequest</code>の分岐）</li><li>A05-02 注文印刷_該当受注のステータスを印刷済みに変更（<code>ConnectionType</code>が<code>SetResponse</code>の分岐）</li></ul>
   221	<hr>
   222	<h2 id="本書で扱うこと">本書で扱うこと</h2>
   223	<ul><li>印刷対象受注の抽出と、スタック用紙の印刷情報（XML）の生成・送信（<code>GetRequest</code>）</li><li>印刷完了後の該当受注のステータス更新（<code>SetResponse</code>）</li><li>印刷情報のXMLログファイルへの書き出しという副作用</li><li>本エンドポイントの認証有無</li></ul>
   224	<hr>
   225	<h2 id="本書で扱わないこと">本書で扱わないこと</h2>
   226	<p>以下は本書では仕様確定せず、実装または別APIの設計を正とする。</p>
   227	<ul><li>印刷クライアント側の通信制御・再送・プリンタ機種仕様（呼び出し元クライアントの仕様を正とする）</li><li>店頭注文番号そのものの採番・参照API（A05-03 店頭注文番号取得の設計を正とする）</li><li>受注ステータスの遷移ルール全般（受注管理の各設計を正とする）</li><li>まとめ買取・買取受注に関する各API（ネット買取・店頭買取の各設計を正とする）</li></ul>
   228	<hr>
   229	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   230	<p>挙動は現行（pf-api）を正とし、DBスキーマは移行先のec-cube-enterpriseを正とする。現行と移行先で次の差がある。</p>
   231	<div class="table-wrap"><table><thead><tr><th>観点</th><th>現行（pf-api）</th><th>移行先（ec-cube-enterprise）</th></tr></thead><tbody><tr><td>受注補助情報の配置</td><td>注文番号・スマレジコード・ブラウザ印刷フラグ・確定日時等を補助表<code>dtb_order_sub</code>に分離して持つ。</td><td>同等の列を受注<code>dtb_order</code>へ統合する（<code>order_number</code>・<code>smaregi_code</code>・<code>browser_print_flg</code>・<code>confirm_date</code>等）。補助表は持たない。</td></tr><tr><td>印刷済み（ピック中）への更新</td><td>受注ステータスの更新と補助表の確定日時更新で印刷済み相当を表す。</td><td>受注<code>dtb_order</code>の<code>picking_date</code>・<code>pick_finish_date</code>・<code>browser_print_flg</code>で印刷・ピック状態を保持する。</td></tr><tr><td>店頭注文番号（待ち番号）</td><td>補助表<code>dtb_order_sub</code>の<code>waiting_number</code>で持つ。</td><td>店頭注文番号<code>dtb_order_number</code>の<code>value</code>（および受注<code>dtb_order</code>の<code>order_number</code>）で持つ。</td></tr><tr><td>配送方法の判別</td><td>配送<code>dtb_shipping</code>の配送方法で店頭受取・スムーズ店頭受取を判別する。</td><td>同一スキーマ。<code>dtb_shipping</code>の配送方法で判別する。</td></tr></tbody></table></div>
   232	<p>応答形式（XML・空応答）とプリンタ向けレイアウトは移行後も挙動仕様としてpf-apiを正とする。</p>
   233	<hr>
   234	<h2 id="用語">用語</h2>
   235	<div class="table-wrap"><table><thead><tr><th>用語</th><th>説明</th></tr></thead><tbody><tr><td>スタック用紙</td><td>店頭で受注内容を印字するロール紙。1受注ごとに1枚分の印刷情報を生成する。</td></tr><tr><td>印刷情報</td><td>プリンタが解釈するXML。<code>ePOSPrint</code>要素ごとに1受注分の印字レイアウトを持つ。</td></tr><tr><td>店頭注文番号</td><td>店頭受取の受注に紐づく待ち番号。印刷情報の店頭注文番号欄に印字する。</td></tr><tr><td>ブラウザ印刷フラグ</td><td>受注の補助情報が持つフラグ。ブラウザ経由の印刷待ち受注を印刷対象に含める判定に用いる。</td></tr><tr><td>印刷ログファイル</td><td>印刷不具合検証のために生成した印刷情報のXMLを保存するファイル。</td></tr></tbody></table></div>
   236	<hr>
   237	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   238	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>印刷情報をプリンタへ送信（A05-01）</td><td><code>GET /order/print/direct</code>（<code>ConnectionType</code>が<code>GetRequest</code>）</td><td>印刷対象受注のスタック用紙印刷情報をXMLで返す。対象が無い場合は空のデータを返す。</td></tr><tr><td>該当受注のステータスを印刷済みに変更（A05-02）</td><td><code>POST /order/print/direct</code>（<code>ConnectionType</code>が<code>SetResponse</code>）</td><td>印刷完了として受け取った受注のステータスをピック中へ更新し、空の本文を返す。</td></tr></tbody></table></div>
   239	<p>同一パス<code>/order/print/direct</code>がGETとPOSTの両方で同じ処理に割り当てられており、分岐は<code>ConnectionType</code>の値で決まる。応答形式はXMLまたは空応答であり、JSONではない。呼び出し元は店頭のスタック用紙プリンタ（印刷クライアント）。</p>
   240	<hr>
   241	<h2 id="認証・認可">認証・認可</h2>
   242	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>認証方式</td><td>本エンドポイントは認証処理を行わない。<code>jwt-token</code>ヘッダの検証も管理ログインのプロキシも経由しない。pf-apiの他の管理系APIが用いる共通の認証処理を呼び出さず、未認証で実行できる。</td></tr><tr><td>認証失敗時</td><td>認証判定そのものを持たないため、認証失敗による拒否（HTTP 401）を返さない。</td></tr><tr><td>認可</td><td>呼び出し可能なクライアントは店頭のスタック用紙プリンタ（印刷クライアント）。アプリケーション層での利用者照合は行わない。</td></tr></tbody></table></div>
   243	<p>未認証で実行できる点は本書の確認値である。トークン原値・署名シークレットは本書に記載しない。</p>
   244	<hr>
   245	<h2 id="処理フロー">処理フロー</h2>
   246	<h3 id="印刷情報を送信する-GET-order-print-direct-ConnectionType-が-GetRequest">印刷情報を送信する（GET <code>/order/print/direct</code>、<code>ConnectionType</code>が<code>GetRequest</code>）</h3>
   247	<ol><li>リクエストの<code>ConnectionType</code>を読み、値が<code>GetRequest</code>であることを判定する。</li><li>印刷対象の受注一覧を取得する。店頭受取で注文受領の受注、スムーズ店頭受取で所定の支払方法かつ未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードありの受注、ブラウザ印刷フラグが立つ受注を対象とし、最大10件を取得する。</li><li>受注ごとに、注文日・合計金額・店頭注文番号・スマレジコード・問い合わせ有無・注文詳細URLを組み立て、1受注分の印刷情報（<code>ePOSPrint</code>要素）を生成する。配送がスムーズ店頭受取の場合は合計金額欄を「スムーズ店頭受取」とする。</li><li>全受注分を束ねたスタック用紙の印刷情報XMLを生成する。対象受注が無い場合はXMLを生成せず空文字とする。</li><li>生成した印刷情報が空でない場合、印刷不具合検証のため印刷情報のXMLをログファイルへ書き出す（副作用）。</li><li>印刷情報XMLを応答本体としてストリーム送信する。応答のContent-Typeは<code>application/octet-stream</code>とする。</li></ol>
   248	<h3 id="印刷済みステータスへ更新する-POST-order-print-direct-ConnectionType-が-SetResponse">印刷済みステータスへ更新する（POST <code>/order/print/direct</code>、<code>ConnectionType</code>が<code>SetResponse</code>）</h3>
   249	<ol><li>リクエストの<code>ConnectionType</code>を読み、値が<code>SetResponse</code>であることを判定する。</li><li>POSTで受け取った<code>ResponseFile</code>のXMLを解析する。解析に失敗した場合は内容とエラーを記録して更新を行わずに戻る。</li><li>XMLの直接印刷結果が偽、または印刷結果要素が1件も無い場合は内容を記録して更新を行わずに戻る。</li><li>印刷結果要素ごとに、印刷ジョブIDの先頭部分から受注IDを取り出し、対象受注を特定する。受注が見つからない場合はエラーを記録して次の要素へ進む。</li><li>対象受注の補助情報のブラウザ印刷フラグが立っている場合は、そのフラグを倒すだけに留める。立っていない場合は受注のステータスをピック中へ更新し、補助情報の確定日時に現在時刻を設定する。</li><li>各受注の更新を反映する。</li><li>空の本文（HTTP 200、<code>text/xml</code>）を返す。</li></ol>
   250	<hr>
   251	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   252	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>更新対象</td><td>リクエストで指定されたID・入力値に対応する業務データを対象にする。対象特定、入力不正、認証・認可の判定順序は処理フローとバリデーションの各節を正とする。</td></tr><tr><td>更新方法</td><td>入力値を対象データへ上書きまたは追加登録する。履歴登録や関連データ更新がある場合は入出力の副作用およびDBカラムの節を正とする。</td></tr><tr><td>計算処理</td><td>本APIでは金額・税・ポイント・在庫数量の再計算や丸めを行わない。ステータスやコメント等の更新は、実装で定義された遷移・存在確認・担当者判定に従う。</td></tr><tr><td>応答値</td><td>成功時は処理結果コードまたは更新後に取得した値を返す。レスポンス値は本API内で独自集計せず、保存結果または取得結果をJSON応答へ整形する。</td></tr></tbody></table></div>
   253	<hr>
   254	<h2 id="入出力">入出力</h2>
   255	<h3 id="リクエスト">リクエスト</h3>
   256	<div class="table-wrap"><table><thead><tr><th>パラメータ</th><th>位置</th><th>型</th><th>必須／任意</th><th>説明</th></tr></thead><tbody><tr><td><code>ConnectionType</code></td><td>クエリまたはボディ</td><td>string</td><td>必須</td><td>動作の分岐。<code>GetRequest</code>で印刷情報送信、<code>SetResponse</code>でステータス更新。いずれにも一致しない場合は処理を行わず本文を返さない。</td></tr><tr><td><code>ResponseFile</code></td><td>ボディ</td><td>string</td><td><code>SetResponse</code>時に必須</td><td>プリンタが返した印刷結果のXML文字列。直接印刷結果の真偽と印刷結果要素（印刷ジョブID）を含む。<code>SetResponse</code>の更新対象の特定に用いる。</td></tr></tbody></table></div>
   257	<p><code>ConnectionType</code>はGET・POSTいずれのリクエストからも取得する。<code>ResponseFile</code>はPOST本文から取得する。</p>
   258	<h3 id="レスポンス-成功">レスポンス（成功）</h3>
   259	<p>応答はJSONではない。分岐ごとに応答形式が異なる。</p>
   260	<div class="table-wrap"><table><thead><tr><th>分岐</th><th>HTTPステータス</th><th>Content-Type</th><th>本体</th></tr></thead><tbody><tr><td><code>GetRequest</code>（A05-01）</td><td>200</td><td><code>application/octet-stream</code></td><td>スタック用紙の印刷情報XMLをストリーム送信する。対象受注が無い場合は空のデータ。</td></tr><tr><td><code>SetResponse</code>（A05-02）</td><td>200</td><td><code>text/xml; charset=utf-8</code></td><td>空の本文（本文長0）。</td></tr></tbody></table></div>
   261	<p><code>GetRequest</code>が返すXMLの構造は次のとおり。</p>
   262	<div class="table-wrap"><table><thead><tr><th>要素</th><th>説明</th></tr></thead><tbody><tr><td><code>PrintRequestInfo</code></td><td>ルート要素。バージョン属性を持ち、配下に受注ごとの<code>ePOSPrint</code>を並べる。</td></tr><tr><td><code>ePOSPrint</code></td><td>受注1件分の印刷情報。印刷先・タイムアウト・印刷ジョブID（受注ID）と印字レイアウトを持つ。</td></tr><tr><td><code>ePOSPrint/Parameter/printjobid</code></td><td>印刷ジョブID。受注IDを用いる。<code>SetResponse</code>での受注特定に対応する。</td></tr><tr><td><code>ePOSPrint/PrintData</code></td><td>印字レイアウト。店頭注文番号・注文詳細URLのQRコード・注文日・注文番号・お客様名・合計金額・スマレジコードのバーコード・各種チェック欄を含む。</td></tr></tbody></table></div>
   263	<h3 id="レスポンス-失敗">レスポンス（失敗）</h3>
   264	<p>本エンドポイントは認証・入力検証による明示的なエラー応答を組み立てない。異常時のふるまいは次のとおり。</p>
   265	<div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>200</td><td><code>GetRequest</code>で対象受注が無い</td><td>空のデータ（XML本体を持たない）</td></tr><tr><td>200</td><td><code>SetResponse</code>で<code>ResponseFile</code>の解析失敗、直接印刷結果が偽、印刷結果要素が無い、または受注が見つからない</td><td>空の本文。更新は行わず、内容とエラーをログに記録する。</td></tr><tr><td>（応答なし）</td><td><code>ConnectionType</code>が<code>GetRequest</code>・<code>SetResponse</code>のいずれにも一致しない</td><td>応答を組み立てず本文を返さない。</td></tr><tr><td>500</td><td>印刷情報生成中・データ取得中・ファイル書き出し中の例外</td><td>共通例外処理に委ねる</td></tr></tbody></table></div>
   266	<h3 id="サンプルレスポンス">サンプルレスポンス</h3>
   267	<p><code>GetRequest</code>時の応答本体の代表例（実装確認値に基づくXML構造。受注IDなどは代表値）。</p>
   268	<pre><code class="language-xml">&lt;?xml version="1.0" encoding="utf-8"?&gt;
   269	&lt;PrintRequestInfo Version="3.00"&gt;
   270	  &lt;ePOSPrint&gt;
   271	    &lt;Parameter&gt;
   272	      &lt;devid&gt;local_printer&lt;/devid&gt;
   273	      &lt;timeout&gt;10000&lt;/timeout&gt;
   274	      &lt;printjobid&gt;1000001&lt;/printjobid&gt;
   275	    &lt;/Parameter&gt;
   276	    &lt;PrintData&gt;
   277	      &lt;epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print"&gt;
   278	        &lt;text lang="ja"/&gt;
   279	        &lt;page&gt;
   280	          &lt;text&gt;店頭注文番号&lt;/text&gt;
   281	          &lt;symbol type="qrcode_model_2"&gt;https://example.test/admin/order/1000001/edit&lt;/symbol&gt;
   282	          &lt;text&gt;注文番号&lt;/text&gt;
   283	          &lt;text&gt;20260603-0001&lt;/text&gt;
   284	          &lt;text&gt;お客様名&lt;/text&gt;
   285	          &lt;text&gt;テスト 太郎&lt;/text&gt;
   286	          &lt;text&gt;合計金額&lt;/text&gt;
   287	          &lt;text&gt;\1,500&lt;/text&gt;
   288	          &lt;barcode type="jan13"&gt;4900000000000&lt;/barcode&gt;
   289	        &lt;/page&gt;
   290	        &lt;cut type="feed"/&gt;
   291	      &lt;/epos-print&gt;
   292	    &lt;/PrintData&gt;
   293	  &lt;/ePOSPrint&gt;
   294	&lt;/PrintRequestInfo&gt;</code></pre>
   295	<p><code>SetResponse</code>時は本文を持たない（HTTP 200、<code>text/xml</code>、本文長0）。</p>
   296	<h3 id="副作用">副作用</h3>
   297	<p>本エンドポイントは参照のみではなく、次の副作用を持つ。</p>
   298	<ul><li>印刷ログファイルの書き出し（<code>GetRequest</code>）。生成した印刷情報が空でない場合、印刷情報のXMLをログ保存ディレクトリ（<code>var/log/print_logs/</code>配下）にタイムスタンプと一意名を付けたファイルとして書き出す。ディレクトリが存在しない場合は作成する。</li><li>受注ステータスの更新（<code>SetResponse</code>）。印刷結果に含まれる受注について、ブラウザ印刷フラグが立つ場合はフラグを倒し、立たない場合は受注のステータスをピック中へ更新し、補助情報の確定日時に現在時刻を設定する。これらはデータベースへの更新である。</li></ul>
   299	<p>応答はXMLまたは空応答であり、JSON応答整形・camelCaseのプロパティ命名は適用しない。</p>
   300	<hr>
   301	<h2 id="バリデーション">バリデーション</h2>
   302	<p>本エンドポイントはフォーム型やマスタ存在チェックによる入力検証を行わない。<code>ConnectionType</code>が想定値（<code>GetRequest</code>・<code>SetResponse</code>）に一致しない場合は処理を行わず応答を組み立てない。<code>SetResponse</code>では<code>ResponseFile</code>のXML解析に失敗した場合と直接印刷結果が偽・印刷結果要素なしの場合に更新を行わずログに記録して戻る。</p>
   303	<hr>
   304	<h2 id="データ整合性">データ整合性</h2>
   305	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>参照時点</td><td><code>GetRequest</code>は呼び出し時点の印刷対象受注（最大10件）を取得して印刷情報を返す。</td></tr><tr><td>更新の有無</td><td><code>GetRequest</code>は受注ステータスを更新しない（印刷ログファイルの書き出しのみ）。<code>SetResponse</code>は受注ステータスと補助情報を更新する。</td></tr><tr><td>取得と更新の一致</td><td><code>GetRequest</code>で抽出した受注集合と<code>SetResponse</code>で更新される受注集合は同一トランザクションで保証されない。<code>SetResponse</code>はプリンタが返した<code>ResponseFile</code>の印刷ジョブID（受注ID）を基準に対象を特定する。</td></tr><tr><td>印刷とステータスの関係</td><td><code>GetRequest</code>は印刷情報を返した時点では受注を未印刷のまま残し、<code>SetResponse</code>を受け取って初めてピック中へ更新する。両者の呼び出しの間に受注が変化し得る。</td></tr></tbody></table></div>
   306	<hr>
   307	<h2 id="DBカラム">DBカラム</h2>
   308	<p>機能に直接関係する列のみ記載する。移行先（ec-cube-enterprise）の名称を主とし、現行（pf-api）で配置が異なる列は括弧で添える。型や一覧の細部はスキーマを参照する。</p>
   309	<p>現行は注文番号・スマレジコード・ブラウザ印刷フラグ・確定日時等を補助表<code>dtb_order_sub</code>に持つが、移行先はこれらを受注<code>dtb_order</code>へ統合する。</p>
   310	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td>受注<code>dtb_order</code></td><td>受注ID</td><td>印刷ジョブIDと注文詳細URLに用いる。<code>SetResponse</code>の対象特定にも用いる。</td></tr><tr><td>受注<code>dtb_order</code></td><td>受注ステータス（<code>order_status_id</code>）</td><td>印刷対象抽出の条件、および<code>SetResponse</code>でピック中へ更新する対象。</td></tr><tr><td>受注<code>dtb_order</code></td><td><code>picking_date</code>・<code>pick_finish_date</code></td><td><code>SetResponse</code>でピック中へ更新する際に設定する。</td></tr><tr><td>受注<code>dtb_order</code></td><td>注文日（<code>order_date</code>）</td><td>印刷情報の注文日欄。</td></tr><tr><td>受注<code>dtb_order</code></td><td>注文者氏名・氏名カナ</td><td>印刷情報のお客様名欄（カナを優先し、無ければ氏名）。</td></tr><tr><td>受注<code>dtb_order</code></td><td>合計金額（<code>payment_total</code>）</td><td>印刷情報の合計金額欄。スムーズ店頭受取時は文言に置換する。</td></tr><tr><td>受注<code>dtb_order</code></td><td><code>order_number</code>（現行は補助表<code>dtb_order_sub</code>の<code>order_number</code>）</td><td>印刷情報の注文番号欄。抽出条件で注文番号ありを必須とする。</td></tr><tr><td>受注<code>dtb_order</code></td><td><code>smaregi_code</code>（現行は<code>dtb_order_sub</code>）</td><td>印刷情報のバーコードに用いる。抽出条件にも用いる。</td></tr><tr><td>受注<code>dtb_order</code></td><td><code>browser_print_flg</code>（現行は<code>dtb_order_sub</code>）</td><td>印刷対象抽出の条件。<code>SetResponse</code>では立つ場合にフラグを倒すだけに留める。</td></tr><tr><td>受注<code>dtb_order</code></td><td><code>confirm_date</code>（現行は<code>dtb_order_sub</code>）</td><td><code>SetResponse</code>でステータス更新時に現在時刻を設定する。抽出条件では未設定を要求する。</td></tr><tr><td>受注<code>dtb_order</code></td><td>出荷日時・取消日時・受領日時・店頭予約日時（現行は<code>dtb_order_sub</code>の各日時列）</td><td>スムーズ店頭受取の抽出条件で未設定を要求する。</td></tr><tr><td>店頭注文番号<code>dtb_order_number</code></td><td><code>value</code>（現行は補助表<code>dtb_order_sub</code>の<code>waiting_number</code>）</td><td>印刷情報の店頭注文番号欄。受注IDで引く。</td></tr><tr><td>配送<code>dtb_shipping</code></td><td>配送方法</td><td>店頭受取・スムーズ店頭受取の判別。抽出条件と合計金額欄の文言切替に用いる。</td></tr></tbody></table></div>
   311	<h3 id="DB操作">DB操作</h3>
   312	<p>本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。</p>
   313	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>検索</td><td>dtb_order / dtb_order_number / dtb_order_sub / dtb_shipping</td><td>検索条件に合致するレコードを抽出する。抽出結果を所定フォーマットでファイル出力する。</td></tr></tbody></table></div>
   314	<hr>
   315	<h2 id="権限・認可">権限・認可</h2>
   316	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>注文印刷（印刷情報送信・印刷済み更新）</th></tr></thead><tbody><tr><td>店頭のスタック用紙プリンタ（印刷クライアント）</td><td>認証なしで印刷情報の取得とステータス更新を実行できる。</td></tr><tr><td>その他のクライアント</td><td>アプリケーション層での照合を行わないため、到達できれば同様に実行できる。利用制御はネットワーク・経路側に依存する。</td></tr></tbody></table></div>
   317	<hr>
   318	<h2 id="エラー処理">エラー処理</h2>
   319	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td><code>ConnectionType</code>が想定値に一致しない</td><td>処理を行わず応答を組み立てない。</td></tr><tr><td><code>GetRequest</code>で対象受注が無い</td><td>空のデータを返す。ログファイルの書き出しも行わない。</td></tr><tr><td><code>SetResponse</code>で<code>ResponseFile</code>の解析失敗</td><td>内容とエラーをログに記録し、更新を行わずに戻る。</td></tr><tr><td><code>SetResponse</code>で直接印刷結果が偽・印刷結果要素なし</td><td>内容をログに記録し、更新を行わずに戻る。</td></tr><tr><td><code>SetResponse</code>で受注が見つからない</td><td>該当受注IDのエラーをログに記録し、その要素を飛ばして次へ進む。</td></tr><tr><td>印刷情報生成・データ取得・ファイル書き出し中の例外</td><td>共通例外処理に委ねる（HTTP 500相当）。</td></tr></tbody></table></div>
   320	<hr>
   321	<h2 id="ログ・監査">ログ・監査</h2>
   322	<p><code>SetResponse</code>では、<code>ResponseFile</code>の解析失敗・直接印刷結果が偽・印刷結果要素なし・受注が見つからない場合に、その内容やエラーをログへ記録する。<code>GetRequest</code>では、生成した印刷情報のXMLを印刷不具合検証用のログファイル（<code>var/log/print_logs/</code>配下）へ書き出す。</p>
   323	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   324	<ul><li>JWTトークンの原値</li><li>署名シークレット（<code>auth_magic</code>）</li><li>Cookie値・セッションIDの完全値</li></ul>
   325	<hr>
   326	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   327	<p><code>GetRequest</code>は受注を更新せず、ロックの対象を持たない。<code>SetResponse</code>は受注ごとに更新を反映するが、印刷結果に含まれる受注集合に対する明示的な悲観ロック・楽観ロックは設けていない。<code>GetRequest</code>で抽出した受注と<code>SetResponse</code>で更新する受注は別リクエストであり、同一トランザクション境界で保証しない。</p>
   328	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   329	    </main>
   330	  </div>

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php | sed -n '1,170p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Service\Admin\Order;
    17	
    18	use Eccube\Repository\BaseInfoRepository;
    19	use Eccube\Repository\OrderRepository;
    20	use Eccube\Service\Admin\Order\ActionInput\OrderDirectPrintInput;
    21	
    22	class OrderDirectPrintAction
    23	{
    24	    public function __construct(
    25	        private readonly BaseInfoRepository $baseInfoRepository,
    26	        private readonly OrderRepository $orderRepository,
    27	    ) {
    28	    }
    29	
    30	    /**
    31	     * 印刷データを取得する
    32	     *
    33	     * @param OrderDirectPrintInput $input
    34	     *
    35	     * @throws \Exception
    36	     */
    37	    public function handle(OrderDirectPrintInput $input): string
    38	    {
    39	        $uri = $input->uri;
    40	        $base_info_id = $input->base_info_id;
    41	
    42	        $BaseInfo = $this->baseInfoRepository->find($base_info_id);
    43	
    44	        if ($BaseInfo && $BaseInfo->isMainShop()) {
    45	            $OrderDataList = $this->orderRepository->getPrintOrderListMainShop($base_info_id);
    46	        } else {
    47	            $OrderDataList = $this->orderRepository->getDirectPrintOrderList($base_info_id);
    48	        }
    49	
    50	        if (empty($OrderDataList)) {
    51	            return '';
    52	        }
    53	
    54	        $PrintList = [];
    55	        foreach ($OrderDataList as $OrderData) {
    56	            $PrintList[] = $this->getPrintData($OrderData, $uri);
    57	        }
    58	        $xmlData = $this->getXmlData($PrintList);
    59	
    60	        return $xmlData;
    61	    }
    62	
    63	    /**
    64	     * スタック用紙の受注1つ分の印刷データ生成
    65	     *
    66	     * @param array<string, mixed> $Order
    67	     * @param string $uri
    68	     *
    69	     * @return string
    70	     */
    71	    private function getPrintData(array $Order, string $uri): string
    72	    {
    73	        $orderDate = $Order['order_date'] !== null ? $Order['order_date']->format('Y/m/d H:i') : '';
    74	        $paymentTotal = $Order['payment_total'];
    75	        $orderName = htmlspecialchars($Order['name_kana'] ?: $Order['name'], ENT_XML1, 'UTF-8');
    76	        $contactText = $Order['hasMessage'] ? '問い合わせ有' : '';
    77	        $orderNumber = htmlspecialchars((string) $Order['order_number'], ENT_XML1, 'UTF-8');
    78	        $smaregiCode = htmlspecialchars((string) $Order['smaregi_code'], ENT_XML1, 'UTF-8');
    79	
    80	        return <<<EOX
    81	          <ePOSPrint>
    82	            <Parameter>
    83	              <devid>local_printer</devid>
    84	              <timeout>10000</timeout>
    85	              <printjobid>{$Order['order_id']}</printjobid>
    86	            </Parameter>
    87	            <PrintData>
    88	              <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
    89	                <text lang="ja"/>
    90	                <page>
    91	                  <area x="0" y="0" width="512" height="751"/>
    92	                  <rectangle x1="0" y1="0" x2="511" y2="200" style="thin"/>
    93	                  <position x="18" y="25"/>
    94	                  <text>店頭注文番号</text>
    95	                  <rectangle x1="0" y1="0" x2="511" y2="200" style="thin"/>
    96	                  <position x="200" y="150"/>
    97	                  <text width="5" height="5">{$orderNumber}</text>
    98	                  <rectangle x1="0" y1="200" x2="511" y2="400" style="thin"/>
    99	                  <rectangle x1="0" y1="200" x2="175" y2="400" style="thin"/>
   100	                  <position x="18" y="225"/>
   101	                  <text width="1" height="1">注文詳細URL</text>
   102	                  <position x="14" y="243"/>
   103	                  <symbol type="qrcode_model_2" level="default" width="5" height="0" size="0">{$uri}admin/order/{$Order['order_id']}/edit</symbol>
   104	                  <position x="179" y="230"/>
   105	                  <text>備考　　{$contactText}</text>
   106	                  <rectangle x1="0" y1="400" x2="210" y2="450" style="thin"/>
   107	                  <position x="25" y="434"/>
   108	                  <text>注文日</text>
   109	                  <rectangle x1="210" y1="400" x2="511" y2="450" style="thin"/>
   110	                  <position x="235" y="434"/>
   111	                  <text>{$orderDate}</text>
   112	                  <rectangle x1="0" y1="450" x2="210" y2="500" style="thin"/>
   113	                  <position x="25" y="484"/>
   114	                  <text>注文番号</text>
   115	                  <rectangle x1="210" y1="450" x2="511" y2="500" style="thin"/>
   116	                  <position x="235" y="484"/>
   117	                  <text>{$orderNumber}</text>
   118	                  <rectangle x1="0" y1="500" x2="210" y2="550" style="thin"/>
   119	                  <position x="25" y="534"/>
   120	                  <text>お客様名</text>
   121	                  <rectangle x1="210" y1="500" x2="511" y2="550" style="thin"/>
   122	                  <position x="235" y="534"/>
   123	                  <text>{$orderName}</text>
   124	                  <rectangle x1="0" y1="550" x2="210" y2="600" style="thin"/>
   125	                  <position x="25" y="584"/>
   126	                  <text>合計金額</text>
   127	                  <rectangle x1="210" y1="550" x2="511" y2="600" style="thin"/>
   128	                  <position x="235" y="584"/>
   129	                  <text>{$paymentTotal}</text>
   130	                  <rectangle x1="0" y1="600" x2="210" y2="650" style="thin"/>
   131	                  <position x="25" y="634"/>
   132	                  <text>変更後金額</text>
   133	                  <rectangle x1="210" y1="600" x2="511" y2="650" style="thin"/>
   134	                  <position x="8" y="720"/>
   135	                  <barcode type="jan13" hri="below" font="font_b" width="2" height="50">{$smaregiCode}</barcode>
   136	                  <position x="225" y="684"/>
   137	                  <text>高額　　{$Order['expensive']}</text>
   138	                  <position x="370" y="684"/>
   139	                  <text>サプライ □</text>
   140	                  <position x="225" y="734"/>
   141	                  <text>欠品　　□</text>
   142	                  <position x="370" y="734"/>
   143	                  <text>Wチェック□</text>
   144	                </page>
   145	                <cut type="feed"/>
   146	              </epos-print>
   147	            </PrintData>
   148	          </ePOSPrint>
   149	        EOX;
   150	    }
   151	
   152	    /**
   153	     * スタック用紙のXMLデータ生成
   154	     *
   155	     * @param array<int, string> $PrintList
   156	     *
   157	     * @return string
   158	     */
   159	    private function getXmlData(array $PrintList): string
   160	    {
   161	        $xml = implode('', $PrintList);
   162	
   163	        return <<<EOX
   164	            <?xml version="1.0" encoding="utf-8"?>
   165	            <PrintRequestInfo Version="3.00">
   166	                {$xml}
   167	            </PrintRequestInfo>
   168	            EOX;
   169	    }
   170	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php | sed -n '1,130p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Controller\App;
    17	
    18	use Eccube\Controller\AbstractController;
    19	use Eccube\Service\Admin\Order\ActionInput\OrderDirectPrintInput;
    20	use Eccube\Service\Admin\Order\ActionInput\UpdatePrintedOrderStatusInput;
    21	use Eccube\Service\Admin\Order\OrderDirectPrintAction;
    22	use Eccube\Service\Admin\Order\UpdatePrintedOrderStatusAction;
    23	use Symfony\Component\HttpFoundation\Request;
    24	use Symfony\Component\HttpFoundation\Response;
    25	use Symfony\Component\HttpFoundation\StreamedResponse;
    26	use Symfony\Component\Routing\Attribute\Route;
    27	
    28	class OrderController extends AbstractController
    29	{
    30	    public function __construct(
    31	        private readonly OrderDirectPrintAction $orderDirectPrintAction,
    32	        private readonly UpdatePrintedOrderStatusAction $updatePrintedOrderStatusAction,
    33	    ) {
    34	    }
    35	
    36	    /**
    37	     * サーバダイレクト印刷API
    38	     *
    39	     * @param Request $request
    40	     *
    41	     * @return StreamedResponse
    42	     */
    43	    #[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', requirements: ['base_info_id' => '\d+'], methods: ['POST'])]
    44	    public function orderDirectPrint(Request $request, int $base_info_id): StreamedResponse
    45	    {
    46	        $connectionType = $request->get('ConnectionType');
    47	
    48	        if ($connectionType === 'GetRequest') {
    49	            // 印刷データ送信処理
    50	            $uri = $request->getUriForPath('/');
    51	
    52	            $xmlData = $this->orderDirectPrintAction->handle(new OrderDirectPrintInput(
    53	                uri: $uri,
    54	                base_info_id: $base_info_id,
    55	            ));
    56	
    57	            // TODO :後ほど対応
    58	            /* 印刷不具合検証のためXMLデータをファイル出力する
    59	            if (!empty($xmlData)) {
    60	                $dir = '/var/www/html/ec-cube/var/log/print_logs/';
    61	                if (!is_dir($dir)) {
    62	                    mkdir($dir, 0777, true);
    63	                }
    64	                $filename = $dir . 'print_' . date('Ymd_His') . '_' . uniqid() . '.xml';;
    65	                file_put_contents($filename, $xmlData);
    66	            }
    67	            */
    68	
    69	            $response = new StreamedResponse();
    70	            $response->setCallback(function () use ($xmlData) {
    71	                echo $xmlData;
    72	            });
    73	            $response->headers->set('Content-Type', 'application/octet-stream');
    74	
    75	            return $response;
    76	        } elseif ($connectionType === 'SetResponse') {
    77	            // 印刷が完了した受注のステータスを更新
    78	            $this->updatePrintedOrderStatusAction->handle(new UpdatePrintedOrderStatusInput(
    79	                responseFile: $request->get('ResponseFile', ''),
    80	                base_info_id: $base_info_id,
    81	            ));
    82	
    83	            $response = new StreamedResponse();
    84	            $response->setCallback(function () { });
    85	            $response->setStatusCode(Response::HTTP_OK);
    86	            $response->headers->set('Content-Type', 'text/xml; charset=utf-8');
    87	
    88	            return $response;
    89	        }
    90	
    91	        $response = new StreamedResponse();
    92	        $response->setCallback(function () { });
    93	        $response->setStatusCode(Response::HTTP_BAD_REQUEST);
    94	        $response->headers->set('Content-Type', 'text/plain; charset=utf-8');
    95	
    96	        return $response;
    97	    }
    98	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php | sed -n '1,150p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Service\Admin\Order;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Entity\Master\OrderStatus;
    20	use Eccube\Repository\BaseInfoRepository;
    21	use Eccube\Repository\Master\OrderStatusRepository;
    22	use Eccube\Repository\OrderRepository;
    23	use Eccube\Service\Admin\Order\ActionInput\UpdatePrintedOrderStatusInput;
    24	use Psr\Log\LoggerInterface;
    25	
    26	class UpdatePrintedOrderStatusAction
    27	{
    28	    public function __construct(
    29	        private readonly EntityManagerInterface $entityManager,
    30	        private readonly BaseInfoRepository $baseInfoRepository,
    31	        private readonly OrderStatusRepository $orderStatusRepository,
    32	        private readonly OrderRepository $orderRepository,
    33	        private readonly LoggerInterface $logger,
    34	    ) {
    35	    }
    36	
    37	    /**
    38	     * 印刷が完了した受注のステータスを更新する
    39	     *
    40	     * @param UpdatePrintedOrderStatusInput $input
    41	     *
    42	     * @throws \Exception
    43	     */
    44	    public function handle(UpdatePrintedOrderStatusInput $input): void
    45	    {
    46	        $responseFile = $input->responseFile;
    47	
    48	        $xml = @simplexml_load_string($responseFile);
    49	        if ($xml === false) {
    50	            $this->logger->error($responseFile);
    51	            $this->logger->error('XMLパースエラー');
    52	
    53	            return;
    54	        }
    55	        if ((string) $xml->ServerDirectPrint === 'false' || count($xml->ePOSPrint) < 1) {
    56	            $this->logger->error($responseFile);
    57	
    58	            return;
    59	        }
    60	
    61	        $BaseInfo = $this->baseInfoRepository->find($input->base_info_id);
    62	        $pickingStatus = $this->orderStatusRepository->find(OrderStatus::PICKING);
    63	
    64	        if (!$BaseInfo) {
    65	            $this->logger->error("ステータス更新エラー：BaseInfo（ID: {$input->base_info_id}）が存在しません。");
    66	
    67	            return;
    68	        }
    69	
    70	        if (!$pickingStatus) {
    71	            $this->logger->error('ステータス更新エラー：PICKINGステータスが存在しません。');
    72	
    73	            return;
    74	        }
    75	
    76	        $this->entityManager->beginTransaction();
    77	        try {
    78	            foreach ($xml->ePOSPrint as $print) {
    79	                $orderId = explode('_', (string) $print->Parameter->printjobid)[0];
    80	
    81	                $Order = $this->orderRepository->find($orderId);
    82	                if (!$Order) {
    83	                    $this->logger->error("ステータス更新エラー：受注ID{$orderId}が存在しません。");
    84	
    85	                    continue;
    86	                }
    87	                if ($Order->isBrowserPrintFlg()) {
    88	                    $Order->setBrowserPrintFlg(false);
    89	                } else {
    90	                    $Order->setOrderStatus($pickingStatus);
    91	                    if ($BaseInfo->isMainShop()) {
    92	                        // 本店の場合、注文確定日を更新
    93	                        $Order->setConfirmDate(new \DateTime());
    94	                    } else {
    95	                        // 支店の場合、ピック開始日を更新
    96	                        $Order->setPickingDate(new \DateTime());
    97	                    }
    98	                }
    99	                $this->entityManager->persist($Order);
   100	                $this->entityManager->flush();
   101	            }
   102	
   103	            $this->entityManager->commit();
   104	        } catch (\Throwable $e) {
   105	            $this->entityManager->rollback();
   106	
   107	            throw $e;
   108	        }
   109	    }
   110	}

codex
主要な参照行は存在し、候補の大半は少なくとも参照先としては実在します。続けてリポジトリの抽出SQLと、別ルート・別実装で設計どおりになっていないかを検索します。
exec
/bin/bash -lc 'rg -n "order/prints/direct|order/print/direct|order_direct_print|ConnectionType|GetRequest|SetResponse" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/config -S' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1480,1645p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1480	                s.addr03,
  1481	                s.tel01,
  1482	                s.tel02,
  1483	                s.tel03,
  1484	                d.id,
  1485	                t.id
  1486	            ');
  1487	
  1488	        $result = $qb
  1489	            ->getQuery()
  1490	            ->getResult();
  1491	
  1492	        array_walk_recursive($result, function (&$item) {
  1493	            if ($item instanceof \DateTime) {
  1494	                $item = $item->format(self::CSV_DATE_FORMAT);
  1495	            }
  1496	        });
  1497	
  1498	        return $result;
  1499	    }
  1500	
  1501	    /**
  1502	     * スタック用紙の印字情報取得（本店）
  1503	     *
  1504	     * @param int $base_info_id
  1505	     *
  1506	     * @return array<int, array<string, mixed>> $result
  1507	     */
  1508	    public function getPrintOrderListMainShop(int $base_info_id): array
  1509	    {
  1510	        $qb = $this->createQueryBuilder('o');
  1511	        $qb->select([
  1512	            'o.id AS order_id',
  1513	            'o.order_date AS order_date',
  1514	            'o.order_number AS order_number',
  1515	            "CONCAT(o.kana01, ' ', o.kana02) AS name_kana",
  1516	            "CONCAT(o.name01, ' ', o.name02) AS name",
  1517	            'o.payment_total AS payment_total',
  1518	            'IDENTITY(o.OrderStatus) AS status',
  1519	            "'□' AS expensive",
  1520	            'o.smaregi_code AS smaregi_code',
  1521	            'CASE WHEN o.message IS NOT NULL THEN true ELSE false END AS hasMessage',
  1522	        ])
  1523	            ->join('\Eccube\Entity\Shipping', 's', 'WITH', 's.Order = o')
  1524	            ->where('IDENTITY(o.baseInfo) = :baseInfoId')
  1525	            ->andWhere('o.order_number IS NOT NULL')
  1526	            ->andWhere($qb->expr()->orX(
  1527	                $qb->expr()->andX(
  1528	                    's.Delivery = :otc',
  1529	                    'o.OrderStatus = :orderNew'
  1530	                ),
  1531	                $qb->expr()->andX(
  1532	                    's.Delivery = :smoothOtc',
  1533	                    'o.OrderStatus <> :processing',
  1534	                    'o.Payment IN (:payments)',
  1535	                    'o.confirmDate IS NULL',
  1536	                    'o.commitDate IS NULL',
  1537	                    'o.shippingDate IS NULL',
  1538	                    'o.cancel_date IS NULL',
  1539	                    'o.receiptDate IS NULL',
  1540	                    'o.otc_rsv_date IS NULL',
  1541	                    'o.smaregi_code IS NOT NULL'
  1542	                ),
  1543	                'o.browser_print_flg = true'
  1544	            ))
  1545	            ->setParameter('baseInfoId', $base_info_id)
  1546	            ->setParameter('otc', Delivery::OTC)
  1547	            ->setParameter('orderNew', OrderStatus::NEW)
  1548	            ->setParameter('smoothOtc', Delivery::SMOOTH_OTC)
  1549	            ->setParameter('processing', OrderStatus::PROCESSING)
  1550	            ->setParameter('payments', [Payment::EC_CREDIT, Payment::EC_SPLINKS_CREDIT, Payment::EC_PAYMENT_NONE])
  1551	            ->groupBy('o.id')
  1552	            ->setMaxResults(10)
  1553	        ;
  1554	
  1555	        return $qb->getQuery()->getResult();
  1556	    }
  1557	
  1558	    /**
  1559	     * ダイレクト印刷用スタック用紙の印字情報取得
  1560	     *
  1561	     * @param int $base_info_id
  1562	     *
  1563	     * @return array<int, array<string, mixed>> $result
  1564	     */
  1565	    public function getDirectPrintOrderList(int $base_info_id): array
  1566	    {
  1567	        $sql = <<<EOT
  1568	            (
  1569	                SELECT
  1570	                    o.id AS order_id,
  1571	                    o.order_date,
  1572	                    o.order_number,
  1573	                    CONCAT(o.kana01, ' ', o.kana02) AS name_kana,
  1574	                    CONCAT(o.name01, ' ', o.name02) AS name,
  1575	                    o.payment_total,
  1576	                    '□' AS expensive,
  1577	                    o.smaregi_code,
  1578	                    CASE WHEN o.message IS NOT NULL THEN true ELSE false END AS has_message
  1579	                FROM dtb_order o
  1580	                JOIN dtb_shipping s ON s.order_id = o.id
  1581	                JOIN mtb_order_status os ON os.id = o.order_status_id
  1582	                WHERE o.base_info_id = :baseInfoId
  1583	                  AND o.order_number IS NOT NULL
  1584	                  AND s.delivery_id = :otc
  1585	                  AND o.order_status_id = :orderNew
  1586	                  AND o.smaregi_code IS NOT NULL
  1587	                GROUP BY o.id
  1588	            )
  1589	            UNION
  1590	            (
  1591	                SELECT
  1592	                    o.id AS order_id,
  1593	                    o.order_date,
  1594	                    o.order_number,
  1595	                    CONCAT(o.kana01, ' ', o.kana02) AS name_kana,
  1596	                    CONCAT(o.name01, ' ', o.name02) AS name,
  1597	                    o.payment_total,
  1598	                    '□' AS expensive,
  1599	                    o.smaregi_code,
  1600	                    CASE WHEN o.message IS NOT NULL THEN true ELSE false END AS has_message
  1601	                FROM dtb_order o
  1602	                JOIN dtb_shipping s ON s.order_id = o.id
  1603	                WHERE o.base_info_id = :baseInfoId
  1604	                    AND o.order_number IS NOT NULL
  1605	                    AND o.browser_print_flg = true
  1606	                GROUP BY o.id
  1607	            )
  1608	            LIMIT 10
  1609	            EOT;
  1610	
  1611	        $rsm = new ResultSetMapping();
  1612	        $rsm
  1613	            ->addScalarResult('order_id', 'order_id')
  1614	            ->addScalarResult('order_date', 'order_date', 'datetimetz')
  1615	            ->addScalarResult('order_number', 'order_number')
  1616	            ->addScalarResult('name_kana', 'name_kana')
  1617	            ->addScalarResult('name', 'name')
  1618	            ->addScalarResult('payment_total', 'payment_total')
  1619	            ->addScalarResult('expensive', 'expensive')
  1620	            ->addScalarResult('smaregi_code', 'smaregi_code')
  1621	            ->addScalarResult('has_message', 'hasMessage')
  1622	        ;
  1623	
  1624	        $result = $this->getEntityManager()
  1625	            ->createNativeQuery($sql, $rsm)
  1626	            ->setParameters([
  1627	                'baseInfoId' => $base_info_id,
  1628	                'otc' => Delivery::OTC,
  1629	                'orderNew' => OrderStatus::NEW,
  1630	            ])
  1631	            ->getResult();
  1632	
  1633	        return $result;
  1634	    }
  1635	
  1636	    /**
  1637	     * 受注メール送信に必要な注文情報を取得
  1638	     *
  1639	     * @return array{Order|null, Delivery|null}
  1640	     */
  1641	    public function findForOrderMail(int $orderId): array
  1642	    {
  1643	        $result = $this->getEntityManager()->createQueryBuilder()
  1644	            ->from('Eccube\Entity\Order', 'o')
  1645	            ->select('o')

exec
/bin/bash -lc 'rg -n "dtb_order_number|OrderNumber|waiting_number|setPickFinishDate|pick_finish|SMOOTH_OTC|smoothOtc|browser_print_flg|confirm_date|picking_date" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube -S' in /home/y-saito/Developments/hareruya-design-docs
 exited 2 in 122ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/ConnectionType.php:17: * Class ConnectionType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/ConnectionType.php:20:enum ConnectionType: string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PageLayoutRepository.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PageLayoutRepository.php:37:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/MallReferenceViaTenantViewRepository.php:18:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/MallReferenceViaTenantViewRepository.php:32:        $connectionName = ConnectionType::HIGH_TRAFFIC_READ_ONLY;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/RegisterCustomerViewRepository.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/RegisterCustomerViewRepository.php:35:        $connectionName = ConnectionType::HIGH_TRAFFIC_READ_ONLY;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/LoginCustomerViewRepository.php:18:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/LoginCustomerViewRepository.php:30:        $connectionName = ConnectionType::HIGH_TRAFFIC_READ_ONLY;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/MemberNameCheckViewRepository.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/MemberNameCheckViewRepository.php:33:        $connectionName = ConnectionType::HIGH_TRAFFIC_READ_ONLY;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/LoginMemberViewRepository.php:18:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/LoginMemberViewRepository.php:30:        $connectionName = ConnectionType::HIGH_TRAFFIC_READ_ONLY;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:27:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:77:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43:    #[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', requirements: ['base_info_id' => '\d+'], methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:46:        $connectionType = $request->get('ConnectionType');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:48:        if ($connectionType === 'GetRequest') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:76:        } elseif ($connectionType === 'SetResponse') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/LayoutRepository.php:21:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/LayoutRepository.php:38:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CategoryRepository.php:29:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CategoryRepository.php:49:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/NewsRepository.php:22:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/NewsRepository.php:38:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/BlockRepository.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/BlockRepository.php:40:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/BaseInfoRepository.php:22:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/BaseInfoRepository.php:45:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/BlockPositionRepository.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/BlockPositionRepository.php:40:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/ProductListMaxRepository.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/ProductListMaxRepository.php:35:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/DeviceTypeRepository.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/DeviceTypeRepository.php:35:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/TaxRuleRepository.php:20:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/TaxRuleRepository.php:59:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/ProductListOrderByRepository.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/ProductListOrderByRepository.php:35:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PluginRepository.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PluginRepository.php:34:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PermissionAccessUrlRepository.php:21:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PermissionAccessUrlRepository.php:33:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:24:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:62:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PageRepository.php:21:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PageRepository.php:77:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchProductBlockType.php:17:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchProductBlockType.php:33:        ConnectionType $__connectionType = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchFavoriteType.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchFavoriteType.php:38:        ConnectionType $connectionType = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchProductType.php:17:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchProductType.php:55:        ConnectionType $__connectionType = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/AuthorityRoleRepository.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/AuthorityRoleRepository.php:36:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CartRepository.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CartRepository.php:34:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:28:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:101:        ConnectionType $connectionName = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:20:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:82:        ConnectionType $connectionType = ConnectionType::LOW_TRAFFIC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/ShoppingHistoryType.php:19:use Eccube\Common\ConnectionType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/ShoppingHistoryType.php:36:        ConnectionType $__connectionType = ConnectionType::LOW_TRAFFIC,

 succeeded in 117ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/OrderUtil.php:33:    public static function getOrderNumbers(mixed $orderRepository, array $orderIds): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/OrderUtil.php:37:            $orderNumbers[$order->getid()] = $order->getOrderNumber();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:294:            PurchasePattern::ECCUBE_SMOOTH_OTC => $this->handleSmoothOtc($transaction, $context),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:42:    #[Route(path: '/waiting_number', name: 'waiting_number', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:43:    #[Template(template: 'Waiting/waiting_number.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:56:    #[Route(path: '/waiting_api/get_waiting_number/{base_info_id}', name: 'get_waiting_number', requirements: ['base_info_id' => '\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:76:        'confirm_datetime' => 'o.confirmDate',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:142:     *         waiting_number?:int|string|null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:195:     *         confirm_date_start?:\DateTimeInterface|null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:196:     *         confirm_datetime_start?:\DateTimeInterface|null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:197:     *         confirm_date_end?:\DateTimeInterface|null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:198:     *         confirm_datetime_end?:\DateTimeInterface|null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:199:     *         confirm_datetime_since_before?:int|string|null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:200:     *         confirm_datetime_until_before?:int|string|null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:201:     *         confirm_datetime_enter?:array<int, string>|null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:380:        // confirm_datetime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:382:        $this->addDateCondition($qb, 'o.confirmDate', $searchData['confirm_datetime_start'], $searchData['confirm_datetime_end']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:384:        $this->addSinceAndUntilCondition($qb, 'o.confirmDate', $searchData['confirm_datetime_since_before'], $searchData['confirm_datetime_until_before']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:542:        // waiting_number
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:543:        if (!empty($searchData['waiting_number'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:545:                ->andWhere('o.waitingNumber = :waiting_number')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:546:                ->setParameter('waiting_number', $searchData['waiting_number']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:682:            $row[] = $order->getOrderNumber() ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:773:     * - Shipping.Delivery が OTC または SMOOTH_OTC
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1269:    public function getNextOrderNumber(): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1532:                    's.Delivery = :smoothOtc',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1543:                'o.browser_print_flg = true'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1548:            ->setParameter('smoothOtc', Delivery::SMOOTH_OTC)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1605:                    AND o.browser_print_flg = true
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1823:            ->setParameter('delivery', [Delivery::OTC, Delivery::SMOOTH_OTC])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2072:     *  3. 取得結果を各 Order の otcSmaregiLinkedPurchaseDate / otcSmaregiLinkedOrderNumbers にセットする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2094:                $orderNumber = $Order->getOrderNumber();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2095:                $Order->setOtcSmaregiLinkedOrderNumbers($orderNumber !== null ? [$orderNumber] : []);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2112:        $orderNumbersLookup = $this->findOtcOrderNumbersByNextOrderIds($lookupIds);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2128:            $fallbackOrderNumber = $Order->getOrderNumber();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2129:            $Order->setOtcSmaregiLinkedOrderNumbers(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2130:                $orderNumbersLookup[$lookupKey] ?? ($fallbackOrderNumber !== null ? [$fallbackOrderNumber] : []),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2198:    private function findOtcOrderNumbersByNextOrderIds(array $nextOrderIds): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:530:        $orderNumber = $Order->getOrderNumber();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNumberRepository.php:21:use Eccube\Entity\DtbOrderNumber;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNumberRepository.php:24: * @extends AbstractRepository<DtbOrderNumber>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNumberRepository.php:26: * @see DtbOrderNumber
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNumberRepository.php:28:class DtbOrderNumberRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNumberRepository.php:35:        parent::__construct($registry, DtbOrderNumber::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNumberRepository.php:43:    public function nextValue(int $baseInfoId): DtbOrderNumber
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNumberRepository.php:53:                ->update(DtbOrderNumber::class, 'wn')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNumberRepository.php:87:    public function getCurrentValue(int $baseInfoId): DtbOrderNumber
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWaitingNumberCounterRepository.php:48:INSERT INTO dtb_waiting_number_counter (base_info_id, current_value)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWaitingNumberCounterRepository.php:51:DO UPDATE SET current_value = dtb_waiting_number_counter.current_value + 1
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWaitingNumberCounterRepository.php:72:        $connection->executeStatement('TRUNCATE TABLE dtb_waiting_number_counter');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:37:    private const ANALYSIS_DATE_COLUMNS = ['order_date', 'confirm_date', 'payment_date', 'shipping_date', 'closing_date', 'cancel_date'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWaitingNumberRepository.php:40:        $connection->executeStatement('TRUNCATE TABLE dtb_waiting_number');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:83:                ->setOrder($Customer->getOrderByOrderNumber($orderNumber))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:176:            (string) ($Order->getOrderNumber() ?? ''),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:189:            'smooth_otc' => Delivery::SMOOTH_OTC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:212:        $Order->setOrderNumber(sprintf('%08d', random_int(0, 99999999)));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:68:        $displayOrderNumber = $orderNumber !== '' ? $orderNumber : ($Order->getOrderNumber() ?? '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:100:                        $displayOrderNumber,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:55:            $orderNumber = $Order->getOrderNumber();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:894:                'browser_print_flg' => true,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:890:            case 'picking_date':
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:898:            case 'confirm_date':
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcProductCodeGenerator.php:45:        $orderNumberPart = $this->normalizeOrderNumber($orderNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcProductCodeGenerator.php:70:    private function normalizeOrderNumber(string $orderNumber): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:128:                    // 支店の場合(OTC/SMOOTH_OTCのみ表示)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:130:                        'id' => [Delivery::OTC, Delivery::SMOOTH_OTC],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:335:        $orderNumbers = OrderUtil::getOrderNumbers($this->orderRepository, $orderIds);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:464:            'orderNumber' => $Order->getOrderNumber(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:69:        $orderNumber = (string) ($Order->getOrderNumber() ?? '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:255:        $name = (string) $Order->getOrderNumber();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:300:            if ($delivery instanceof Delivery && $delivery->getId() === Delivery::SMOOTH_OTC) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:327:            'orderNumber' => $Order->getOrderNumber(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/complete.twig:70:                        <p class="c-hareruya-text">{{ 'front.shopping.complete_message__waiting_number'|trans }} : {{ waitingNumber }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/complete.twig:71:                        <p class="c-hareruya-text">{{ 'front.shopping.complete_message__waiting_number_message'|trans|nl2br }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:169:        $orderNumbers = OrderUtil::getOrderNumbers($orderRepository, $orderIds);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SalesType.php:43:        'admin.analysis.sales.date_type.confirm_date' => 'confirm_date',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternResolver.php:39:        if ($context->pickupMethod === PickupMethod::SMOOTH_OTC) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternResolver.php:40:            return PurchasePattern::ECCUBE_SMOOTH_OTC;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternContextBuilder.php:157:                    Delivery::SMOOTH_OTC => PickupMethod::SMOOTH_OTC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PickupMethod.php:20:    case SMOOTH_OTC = 'smooth_otc';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:125:                if ($orderNumber && !$Customer->hasOrderNumber($orderNumber)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePattern.php:20:    case ECCUBE_SMOOTH_OTC = 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:165:                // 支店の場合(OTC/SMOOTH_OTCのみ表示)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:167:                    'id' => [Delivery::OTC, Delivery::SMOOTH_OTC],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:66:        $this->addDateRange($builder, 'confirm', 'admin.order.confirm_date', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:119:            ->add('waiting_number', NumberType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:120:                'label' => 'admin.order.waiting_number',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:124:                    'placeholder' => 'admin.order.waiting_number',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:398:                $confirmDatetimeStart = $form['confirm_datetime_start']->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:399:                $confirmDatetimeEnd = $form['confirm_datetime_end']->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:403:                        $form['confirm_datetime_end']->addError(new FormError(trans('admin.product.date_range_error')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderSequenceNoProcessor.php:42:            $Order->setOrderNumber(sprintf('%08d', $this->orderRepository->getNextOrderNumber()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php:123:                    $stockChangeReason = "受注による減算 注文番号：{$itemHolder->getOrderNumber()} 受注時価格：{$item->getProductClass()->getPrice02()} 円";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php:133:                    $stockChangeReason = "キャンセル時の在庫戻し 注文番号：{$itemHolder->getOrderNumber()}";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:82:                $orderNumberEntity = $Order->getOrderNumber();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:47:        $orderNumbers = OrderUtil::getOrderNumbers($this->orderRepository, $orderIds);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbWaitingNumberCounter.php:22:#[ORM\Table(name: 'dtb_waiting_number_counter')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1225:front.shopping.complete_message__waiting_number: TC Order Number
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1226:front.shopping.complete_message__waiting_number_message: "※Customers who placed an order from an in-store computer: when your items are ready, your TC Order Number will be displayed on the in-store order monitor.<br>Please come to the register counter when your TC Order Number appears.<br>"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:46:     * @method string|null getOrderNumber()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:47:     * @method Order setOrderNumber(?string $order_number)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:63:     * @method Order setPickingDate(?\DateTime $picking_date)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:65:     * @method Order setPickFinishDate(?\DateTime $pick_finish_date)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:104:     * @method Order setBrowserPrintFlg(bool $browser_print_flg)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:141:     * @method list<string> getOtcSmaregiLinkedOrderNumbers()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:142:     * @method Order setOtcSmaregiLinkedOrderNumbers(list<string> $otcSmaregiLinkedOrderNumbers)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:644:        #[ORM\Column(name: 'waiting_number', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => '店舗販売用整理番号'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:666:        #[ORM\Column(name: 'confirm_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '注文確定日'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:675:        #[ORM\Column(name: 'picking_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => 'ピック開始日'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:676:        private ?\DateTime $picking_date = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:678:        #[ORM\Column(name: 'pick_finish_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => 'ピック完了日'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:679:        private ?\DateTime $pick_finish_date = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:735:        #[ORM\Column(name: 'browser_print_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => 'ブラウザ印刷フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:736:        private bool $browser_print_flg = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:795:        private array $otcSmaregiLinkedOrderNumbers = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1768:        public function getOrderNumber(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1773:        public function setOrderNumber(?string $order_number): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1866:            return $this->picking_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1869:        public function setPickingDate(?\DateTime $picking_date): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1871:            $this->picking_date = $picking_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1878:            return $this->pick_finish_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1881:        public function setPickFinishDate(?\DateTime $pick_finish_date): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1883:            $this->pick_finish_date = $pick_finish_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2111:            return $this->browser_print_flg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2114:        public function setBrowserPrintFlg(bool $browser_print_flg): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2116:            $this->browser_print_flg = $browser_print_flg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2364:            return $this->getPrimaryDeliveryId() === Delivery::SMOOTH_OTC;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2412:        public function getOtcSmaregiLinkedOrderNumbers(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2414:            return $this->otcSmaregiLinkedOrderNumbers;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2420:         * @param list<string> $otcSmaregiLinkedOrderNumbers
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2422:        public function setOtcSmaregiLinkedOrderNumbers(array $otcSmaregiLinkedOrderNumbers): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2424:            $this->otcSmaregiLinkedOrderNumbers = $otcSmaregiLinkedOrderNumbers;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:43:        public const SMOOTH_OTC = 7;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:51:            self::SMOOTH_OTC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1530:front.shopping.complete_message__waiting_number: TC注文番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1531:front.shopping.complete_message__waiting_number_message: '※店内のパソコンからご注文のお客様は、商品の用意が完了すると、店内注文モニターにTC注文番号が表示されます。<br>TC注文番号が表示されましたら、レジカウンターまでお越しください。<br>'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5773:admin.order.waiting_number: 店頭注文番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5774:admin.order.confirm_date: ピック中
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6152:admin.analysis.sales.date_type.confirm_date: 注文確定日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/waiting_tag.twig:92:                                {# TODO: /店舗CD/waiting_number - フロントURLが決まり次第実装 を別タブで表示 #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/waiting_tag.twig:93:                                <a class="btn btn-ec-conversion btn-block w-100 py-3" href="/{{ form.BaseInfo.vars.value }}/waiting_number" target="_blank">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:554:                        <label class="col-form-label">{{ 'admin.order.confirm_date'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:557:                                {{ form_widget(searchForm.confirm_datetime_start) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:558:                                {{ form_errors(searchForm.confirm_datetime_start) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:562:                                {{ form_widget(searchForm.confirm_datetime_end) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:563:                                {{ form_errors(searchForm.confirm_datetime_end) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:571:                                {{ form_widget(searchForm.confirm_datetime_since_before) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:572:                                {{ form_errors(searchForm.confirm_datetime_since_before) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:578:                                {{ form_widget(searchForm.confirm_datetime_until_before) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:579:                                {{ form_errors(searchForm.confirm_datetime_until_before) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:587:                                {{ form_widget(searchForm.confirm_datetime_enter,  { 'label_attr': { 'class': 'checkbox-inline' }}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:588:                                {{ form_errors(searchForm.confirm_datetime_enter) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1030:                                {{ form_widget(searchForm.waiting_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1031:                                {{ form_errors(searchForm.waiting_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:44:                {% if DeliverySlip.delivery_id == constant('Eccube\\Entity\\Delivery::SMOOTH_OTC') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig:96:            url: '{{ url('get_waiting_number', {'base_info_id': BaseInfo.id}) }}',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:140:                                            {{ Order.otcSmaregiLinkedOrderNumbers|join(', ') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/order_receipt.twig:31:                    {% if orderReceipt.delivery_id == constant('Eccube\\Entity\\Delivery::SMOOTH_OTC') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:861:                                            <div class="col">{{ Order.picking_date ? Order.picking_date|date_sec : '' }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:862:                                            {% if Order.picking_date %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:863:                                                <div class="col"><button type="button" class="btn btn-ec-regular clear-date" data-target="picking_date">クリア</button></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNumber.php:20:use Eccube\Repository\DtbOrderNumberRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNumber.php:22:#[ORM\Table(name: 'dtb_order_number')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNumber.php:23:#[ORM\Entity(repositoryClass: DtbOrderNumberRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNumber.php:24:class DtbOrderNumber extends AbstractEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNumber.php:57:    public function setValue(int $value): DtbOrderNumber
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNumber.php:69:    public function setBaseInfo(?BaseInfo $BaseInfo): DtbOrderNumber
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNumber.php:84:    public function setUpdateDate(\DateTime $updateDate): DtbOrderNumber
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNumber.php:94:    public function nextValue(): DtbOrderNumber
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbWaitingNumber.php:22:#[ORM\Table(name: 'dtb_waiting_number')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbWaitingNumber.php:39:    #[ORM\Column(name: 'waiting_number', type: Types::INTEGER, nullable: false, options: ['unsigned' => true, 'comment' => '店舗販売用整理番号'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1301:        public function hasOrderNumber(string $orderNumber): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1304:                if ($Order->getOrderNumber() === $orderNumber) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1312:        public function getOrderByOrderNumber(?string $orderNumber): ?Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1319:                if ($Order->getOrderNumber() === $orderNumber) {

codex
別ルート検索では、この機能名・パス・ConnectionTypeを扱う実装は `OrderController` 周辺に限られそうです。候補にない重要節として、認証・DB操作・ResponseFile処理なども実装と照合します。
exec
/bin/bash -lc 'rg -n "ResponseFile|ServerDirectPrint|printjobid|simplexml_load_string|orderDirectPrint|UpdatePrintedOrderStatusAction|OrderDirectPrintAction" /home/y-saito/Developments/ec-cube-enterprise/tests /home/y-saito/Developments/ec-cube-enterprise/src -S' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "rg -n \"firewall|access_control|/api|jwt-token|OrderController|order_direct_print|api/order/prints/direct|stateless|security\" /home/y-saito/Developments/ec-cube-enterprise -g '*.yaml' -g '*.php' -g '*.yml' -S" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '620,690p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '1858,1888p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 164ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:22:class OrderDirectPrintAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:85:              <printjobid>{$Order['order_id']}</printjobid>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:26:class UpdatePrintedOrderStatusAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:48:        $xml = @simplexml_load_string($responseFile);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:55:        if ((string) $xml->ServerDirectPrint === 'false' || count($xml->ePOSPrint) < 1) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:79:                $orderId = explode('_', (string) $print->Parameter->printjobid)[0];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:21:use Eccube\Service\Admin\Order\OrderDirectPrintAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:22:use Eccube\Service\Admin\Order\UpdatePrintedOrderStatusAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:31:        private readonly OrderDirectPrintAction $orderDirectPrintAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:32:        private readonly UpdatePrintedOrderStatusAction $updatePrintedOrderStatusAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:44:    public function orderDirectPrint(Request $request, int $base_info_id): StreamedResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:52:            $xmlData = $this->orderDirectPrintAction->handle(new OrderDirectPrintInput(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:79:                responseFile: $request->get('ResponseFile', ''),
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php:26:use Eccube\Service\Admin\Order\UpdatePrintedOrderStatusAction;
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php:32: * UpdatePrintedOrderStatusAction::handle() のテスト
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php:36:final class UpdatePrintedOrderStatusActionTest extends TestCase
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php:48:    private UpdatePrintedOrderStatusAction $action;
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php:58:        $this->action = new UpdatePrintedOrderStatusAction(
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php:260:     * ServerDirectPrint が false の場合、responseFile がログ出力されること
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php:264:    public function testHandleLogsResponseFileWhenServerDirectPrintIsFalse(): void
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php:282:    public function testHandleLogsResponseFileWhenEposPrintIsEmpty(): void
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php:465:                        <printjobid>{$printJobId}</printjobid>
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php:474:                <ServerDirectPrint>{$serverDirectPrint}</ServerDirectPrint>
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:20:use Eccube\Service\Admin\Order\OrderDirectPrintAction;
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:21:use Eccube\Service\Admin\Order\UpdatePrintedOrderStatusAction;
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:29:     * orderDirectPrint - 正常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:38:        $orderDirectPrintActionMock = $this->createMock(OrderDirectPrintAction::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:39:        $orderDirectPrintActionMock
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:49:        static::getContainer()->set(OrderDirectPrintAction::class, $orderDirectPrintActionMock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:51:        $updatePrintedOrderStatusActionMock = $this->createMock(UpdatePrintedOrderStatusAction::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:56:        static::getContainer()->set(UpdatePrintedOrderStatusAction::class, $updatePrintedOrderStatusActionMock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:74:     * orderDirectPrint - 正常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:82:        $orderDirectPrintActionMock = $this->createMock(OrderDirectPrintAction::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:83:        $orderDirectPrintActionMock
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:88:        static::getContainer()->set(OrderDirectPrintAction::class, $orderDirectPrintActionMock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:90:        $updatePrintedOrderStatusActionMock = $this->createMock(UpdatePrintedOrderStatusAction::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:94:        static::getContainer()->set(UpdatePrintedOrderStatusAction::class, $updatePrintedOrderStatusActionMock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:110:     * orderDirectPrint - 正常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:118:        $orderDirectPrintActionMock = $this->createMock(OrderDirectPrintAction::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:119:        $orderDirectPrintActionMock
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:122:        static::getContainer()->set(OrderDirectPrintAction::class, $orderDirectPrintActionMock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:124:        $updatePrintedOrderStatusActionMock = $this->createMock(UpdatePrintedOrderStatusAction::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:135:        static::getContainer()->set(UpdatePrintedOrderStatusAction::class, $updatePrintedOrderStatusActionMock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:143:                'ResponseFile' => 'dummy_response.xml',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:154:     * orderDirectPrint - 異常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:162:        $orderDirectPrintActionMock = $this->createMock(OrderDirectPrintAction::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:163:        $orderDirectPrintActionMock
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:166:        static::getContainer()->set(OrderDirectPrintAction::class, $orderDirectPrintActionMock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:168:        $updatePrintedOrderStatusActionMock = $this->createMock(UpdatePrintedOrderStatusAction::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:172:        static::getContainer()->set(UpdatePrintedOrderStatusAction::class, $updatePrintedOrderStatusActionMock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/OrderDirectPrintActionTest.php:22:use Eccube\Service\Admin\Order\OrderDirectPrintAction;
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/OrderDirectPrintActionTest.php:27: * OrderDirectPrintAction::handle() のテスト
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/OrderDirectPrintActionTest.php:31:final class OrderDirectPrintActionTest extends TestCase
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/OrderDirectPrintActionTest.php:37:    private OrderDirectPrintAction $action;
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/OrderDirectPrintActionTest.php:44:        $this->action = new OrderDirectPrintAction($this->baseInfoRepository, $this->orderRepository);

 succeeded in 154ms:
/home/y-saito/Developments/ec-cube-enterprise/plugin_repos/SlnPayment42/Controller/PaymentController.php:98:        private readonly Security $security,
/home/y-saito/Developments/ec-cube-enterprise/plugin_repos/SlnPayment42/Controller/PaymentController.php:134:        if ($this->security->getUser() instanceof Customer) {
/home/y-saito/Developments/ec-cube-enterprise/plugin_repos/SlnPayment42/Controller/PaymentController.php:140:            $this->security->login($Customer, 'form_login', 'customer');
/home/y-saito/Developments/ec-cube-enterprise/docker-compose.yml:67:      SMAREGI_API_URL: ${SMAREGI_API_URL:-https://api.smaregi.dev}
/home/y-saito/Developments/ec-cube-enterprise/plugin_repos/SlnPayment42/Controller/Admin/OrderController.php:35:class OrderController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/docs/testing/sheet_export_config.yaml:111:  - dir: security
/home/y-saito/Developments/ec-cube-enterprise/docs/testing/sheet_export_config.yaml:473:  - feature_path: setting/security/setting_security.feature
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services_test.yaml:12:    security.csrf.token_manager:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:99:        private readonly Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:652:        $user = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:146: *         stateless_token_ids?: list<scalar|null|Param>,
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:147: *         check_header?: scalar|null|Param, // Whether to check the CSRF token in a header in addition to a cookie when using stateless protection. // Default: false
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:148: *         cookie_name?: scalar|null|Param, // The name of the cookie to use when using stateless protection. // Default: "csrf-token"
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:696: *     hide_user_not_found?: bool|Param, // Deprecated: The "hide_user_not_found" option is deprecated and will be removed in 8.0. Use the "expose_security_errors" option instead.
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:697: *     expose_security_errors?: \Symfony\Component\Security\Http\Authentication\ExposeSecurityLevel::None|\Symfony\Component\Security\Http\Authentication\ExposeSecurityLevel::AccountStatus|\Symfony\Component\Security\Http\Authentication\ExposeSecurityLevel::All|Param, // Default: "none"
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:748: *     firewalls: array<string, array{ // Default: []
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:752: *         security?: bool|Param, // Default: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:753: *         user_checker?: scalar|null|Param, // The UserChecker to use when authenticating users in this firewall. // Default: "security.user_checker"
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:759: *         stateless?: bool|Param, // Default: false
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:989: *     access_control?: list<array{ // Default: []
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:1613: *     security?: SecurityConfig,
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:1629: *         security?: SecurityConfig,
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:1649: *         security?: SecurityConfig,
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:1668: *         security?: SecurityConfig,
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:1687: *         security?: SecurityConfig,
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:1704: *         security?: SecurityConfig,
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:1768: *     stateless?: bool,
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:1788: *     stateless?: bool,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:39:     * 参考: https://developers.smaregi.dev/platform-api-reference/apis/pos/operations/poststockproductidadd/
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:82:     * 参考: https://developers.smaregi.dev/platform-api-reference/apis/pos/operations/getstockchangesproductidstoreid/
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:122:     * 参考: https://developers.smaregi.dev/platform-api-reference/apis/pos/operations/getstock/
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:152:     * 参考: https://developers.smaregi.dev/platform-api-reference/apis/pos/operations/getstockchangesproductidstoreid/
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiAccessTokenService.php:32:     * https://developers.smaregi.dev/platform-api-reference/apis/pos/#authentication
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/tenant_creation_flow.yaml:9:            - '@security.helper'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/tenant_creation_flow.yaml:20:            - '@security.helper'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/test/generator.yaml:5:      - '@security.user_password_hasher'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Enterprise/Tenant/CreateProcessor/GenerateTenantMailTemplatesProcessor.php:31:    public function __construct(private readonly MailTemplateRepository $mailTemplateRepository, private readonly Security $security, private readonly FileManager $fileManager, private readonly EccubeConfig $eccubeConfig)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Enterprise/Tenant/CreateProcessor/GenerateTenantMailTemplatesProcessor.php:84:            $Member = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/test/security.yml:1:security:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Enterprise/Tenant/CreateProcessor/GenerateInitialTenantTradeLaw.php:32:        private readonly Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Enterprise/Tenant/CreateProcessor/GenerateInitialTenantTradeLaw.php:45:        $member = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/MergeCartPostLoginListener.php:34:    public function __construct(protected EntityManagerInterface $em, protected CartService $cartService, protected PurchaseFlow $purchaseFlow, protected RequestStack $requestStack, private readonly Security $security)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/MergeCartPostLoginListener.php:59:        $user = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:171:        $I->amOnPage('/'.$config['eccube_admin_route'].'/setting/system/security');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:172:        $I->see('セキュリティ管理システム設定', '#page_admin_setting_system_security .c-pageTitle__titles');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:173:        $I->see('管理画面URL設定', '#page_admin_setting_system_security > div.c-container > div.c-contentsArea > form > div > div.c-contentsArea__primaryCol > div > div > div.card-header > div > div.col-8 > span');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:182:        $I->amOnPage('/'.$config['eccube_admin_route'].'/setting/system/security');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:183:        $I->see('セキュリティ管理システム設定', '#page_admin_setting_system_security .c-pageTitle__titles');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:185:        $I->fillField(['id' => 'admin_security_admin_route_dir'], 'admin2');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:186:        $I->click('#page_admin_setting_system_security form div.c-contentsArea__cols > div.c-conversionArea > div > div > div:nth-child(2) > div > div > button');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:189:        $I->amOnPage('/admin2/setting/system/security');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:190:        $I->fillField(['id' => 'admin_security_admin_route_dir'], $config['eccube_admin_route']);
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:191:        $I->click('#page_admin_setting_system_security form div.c-contentsArea__cols > div.c-conversionArea > div > div > div:nth-child(2) > div > div > button');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:207:        $I->amOnUrl($httpsBaseUrl.$config['eccube_admin_route'].'/setting/system/security');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:208:        $I->checkOption(['id' => 'admin_security_force_ssl']);
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:209:        $I->click('#page_admin_setting_system_security form div.c-contentsArea__cols > div.c-conversionArea > div > div > div:nth-child(2) > div > div > button');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:216:        $I->amOnUrl($httpsBaseUrl.$config['eccube_admin_route'].'/setting/system/security');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:217:        $I->uncheckOption(['id' => 'admin_security_force_ssl']);
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:218:        $I->click('#page_admin_setting_system_security form div.c-contentsArea__cols > div.c-conversionArea > div > div > div:nth-child(2) > div > div > button');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:230:        $I->amOnPage('/'.$config['eccube_admin_route'].'/setting/system/security');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:231:        $I->see('セキュリティ管理システム設定', '#page_admin_setting_system_security .c-pageTitle__titles');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:233:        $I->fillField(['id' => 'admin_security_admin_deny_hosts'], '1.1.1.1');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:234:        $I->click('#page_admin_setting_system_security form div.c-contentsArea__cols > div.c-conversionArea > div > div > div:nth-child(2) > div > div > button');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:448:        $I->amOnPage('/'.$config['eccube_admin_route'].'/setting/system/security');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:449:        $I->see('セキュリティ管理システム設定', '#page_admin_setting_system_security .c-pageTitle__titles');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:451:        $I->fillField(['id' => 'admin_security_admin_allow_hosts'], '1.1.1.1');
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/EA08SysteminfoCest.php:452:        $I->click('#page_admin_setting_system_security form div.c-contentsArea__cols > div.c-conversionArea > div > div > div:nth-child(2) > div > div > button');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginHistoryListener.php:38:    public function __construct(private readonly EntityManagerInterface $entityManager, private readonly RequestStack $requestStack, private readonly Context $requestContext, private readonly LoginMemberViewRepository $memberViewRepository, private readonly LoginHistoryStatusRepository $loginHistoryStatusRepository, private readonly EccubeConfig $eccubeConfig, private readonly Security $security, private readonly UrlGeneratorInterface $urlGenerator)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginHistoryListener.php:75:        $user = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/Plugin/PL06SecurityCheckCest.php:26:        $I->scrollTo(['id' => 'securitychecker4_config_tools_agreement'], 0, -100);
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/Plugin/PL06SecurityCheckCest.php:27:        $I->click(['id' => 'securitychecker4_config_eccube_share_0']);
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/Plugin/PL06SecurityCheckCest.php:28:        $I->checkOption(['id' => 'securitychecker4_config_tools_agreement']);
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/Plugin/PL06SecurityCheckCest.php:29:        $I->click(['css' => '#page_securitychecker4_admin_config > div > div.c-contentsArea > form > div > div > div.c-conversionArea > div > div > div:nth-child(2) > div > div > button']);
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/Plugin/PL06SecurityCheckCest.php:30:        $I->waitForText('セキュリティチェックが完了しました。', 120, ['css' => '#page_securitychecker4_admin_config > div > div.c-contentsArea > div.alert.alert-success.alert-dismissible.fade.show.m-3 > span']);
/home/y-saito/Developments/ec-cube-enterprise/codeception/acceptance/Plugin/PL08ApiCest.php:67:        $url = '/api?query={ product(id: 1) { id, name } }';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/CSPHeaderListener.php:56:        $cspEnable = $this->eccubeConfig->get('eccube_content_security_policy_enabled');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/CSPHeaderListener.php:61:                $cspEnableResources = $this->eccubeConfig->get('eccube_content_security_policy_enabled_resources');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Enterprise/AuditLogListener.php:118:        $context['loginId'] = $event->getRequest()?->getSession()?->get('_security.last_username') ?? '不明';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/InvalidLocaleRedirectListener.php:81:        // App向けAPI（/api/）の場合は何もしない
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/InvalidLocaleRedirectListener.php:82:        if (str_starts_with($pathInfo, '/api/')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/TwigInitializeListener.php:148:            $is_admin = $request->getSession()->has('_security_admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallPluginController.php:189:                $composerApiService->execRemove('ec-cube/api42');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php:75:    #[Route(path: '/%eccube_admin_route%/store/plugin/api/search', name: 'admin_store_plugin_owners_search', methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php:76:    #[Route(path: '/%eccube_admin_route%/store/plugin/api/search/page/{page_no}', name: 'admin_store_plugin_owners_search_page', requirements: ['page_no' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php:179:    #[Route(path: '/%eccube_admin_route%/store/plugin/api/install/{id}/confirm', name: 'admin_store_plugin_install_confirm', requirements: ['id' => '\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php:202:    #[Route(path: '/%eccube_admin_route%/store/plugin/api/install', name: 'admin_store_plugin_api_install', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php:248:    #[Route(path: '/%eccube_admin_route%/store/plugin/api/delete/{id}/uninstall', name: 'admin_store_plugin_api_uninstall', requirements: ['id' => '\d+'], methods: ['DELETE'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php:293:    #[Route(path: '/%eccube_admin_route%/store/plugin/api/upgrade', name: 'admin_store_plugin_api_upgrade', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php:358:    #[Route(path: '/%eccube_admin_route%/store/plugin/api/schema_update', name: 'admin_store_plugin_api_schema_update', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php:404:    #[Route(path: '/%eccube_admin_route%/store/plugin/api/update', name: 'admin_store_plugin_api_update', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php:441:    #[Route(path: '/%eccube_admin_route%/store/plugin/api/upgrade/{id}/confirm', name: 'admin_store_plugin_update_confirm', requirements: ['id' => '\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/EventListener/InvalidLocaleRedirectListenerTest.php:182:            'security_txt' => ['/.well-known/security.txt'],
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/EventListener/InvalidLocaleRedirectListenerTest.php:189:     * App向けAPI（/api/）の場合は何もしないこと
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/EventListener/InvalidLocaleRedirectListenerTest.php:195:        $request = Request::create('/api/v1/admin/optionBulkPurchaseId.json');
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:1:security:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:18:        # https://symfony.com/doc/current/security.html#b-configuring-how-users-are-loaded
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:21:        # To load users from somewhere else: https://symfony.com/doc/current/security/custom_provider.html
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:26:    # https://symfony.com/doc/current/security.html#initial-security-yml-setup-authentication
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:27:    firewalls:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:30:            security: false
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:31:        # EC-CUBEのリスナーがセッションを使用しているため、stateless: falseに設定。本当はtrueにしたい。
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:33:            pattern: ^/api/v1/
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:34:            stateless: false
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:51:                success_handler: eccube.security.success_handler
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:52:                failure_handler: eccube.security.failure_handler
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:69:            security: false
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:90:                success_handler: eccube.security.success_handler
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:91:                failure_handler: eccube.security.failure_handler
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:297:        - '/api/v1/admin/login.json'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:299:    eccube_content_security_policy_enabled: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:300:    eccube_content_security_policy_enabled_resources:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services.yaml:397:    eccube.security.success_handler:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services.yaml:400:    eccube.security.failure_handler:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services.yaml:403:    eccube.security.logout.success_handler:
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/AbstractWebTestCase.php:82:        $firewallContext = $User instanceof Customer ? 'customer' : 'admin';
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/AbstractWebTestCase.php:83:        $this->client->loginUser($User, $firewallContext);
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/codeception/generator.yaml:5:      - '@security.user_password_hasher'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/dev/generator.yaml:5:      - '@security.user_password_hasher'
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Purchase/PurchaseControllerBulkDetailSellTest.php:58:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Purchase/PurchaseControllerBulkDetailSellTest.php:92:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Purchase/PurchaseControllerUpdateTest.php:82:        $csrfTokenManager = $this->client->getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Purchase/PurchaseControllerUpdateTest.php:198:        $csrfTokenManager = $this->client->getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Purchase/PurchaseControllerDetailDeleteTest.php:59:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Purchase/PurchaseControllerDetailDeleteTest.php:111:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Purchase/PurchaseControllerDetailDeleteTest.php:141:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Purchase/PurchaseControllerDeleteTest.php:39:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Purchase/PurchaseControllerDeleteTest.php:62:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/InventoryPlanControllerTest.php:46:        $loggedInUser = static::getContainer()->get('security.token_storage')->getToken()?->getUser();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockSplitControllerTest.php:112:        $this->client->getContainer()->set('security.csrf.token_manager', $mock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockMoveControllerTest.php:63:        $loggedInUser = static::getContainer()->get('security.token_storage')->getToken()?->getUser();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockMoveControllerTest.php:633:        $this->client->getContainer()->set('security.csrf.token_manager', $csrfTokenManager);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockMoveControllerTest.php:946:        $this->client->getContainer()->set('security.csrf.token_manager', $csrfTokenManager);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockMoveTransferControllerStockTransferCsvTest.php:53:        $loggedInUser = static::getContainer()->get('security.token_storage')->getToken()?->getUser();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockTransferControllerTest.php:59:        $token = static::getContainer()->get('security.token_storage')->getToken();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockMoveControllerCsvTest.php:464:        $this->client->getContainer()->set('security.csrf.token_manager', $mock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockApprovalListControllerTest.php:272:        $csrfToken = static::getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockApprovalListControllerTest.php:289:        $csrfToken = static::getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockApprovalListControllerTest.php:312:        $csrfToken = static::getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockApprovalListControllerTest.php:348:        $csrfToken = static::getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockSplitJoinControllerTest.php:84:        $this->client->getContainer()->set('security.csrf.token_manager', $mock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockBulkApprovalControllerTest.php:41:        $loggedInUser = static::getContainer()->get('security.token_storage')->getToken()?->getUser();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockMoveTransferControllerStockMoveCsvTest.php:53:        $loggedInUser = static::getContainer()->get('security.token_storage')->getToken()?->getUser();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Stock/StockJoinControllerTest.php:897:        $this->client->getContainer()->set('security.csrf.token_manager', $mock);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/LatestArticlesBlockPayloadBuilder.php:28:    private const API_URL = 'https://api.corp.hareruyamtg.com/user_data/lp/json/latest_articles.json';
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Setting/System/SecurityControllerTest.php:56:        $this->client->request(Request::METHOD_GET, $this->generateUrl('admin_setting_system_security'));
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Setting/System/SecurityControllerTest.php:71:            $this->generateUrl('admin_setting_system_security'),
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Setting/System/SecurityControllerTest.php:73:                'admin_security' => $formData,
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Setting/System/SecurityControllerTest.php:82:        $this->expected = 'admin.setting.system.security.admin_url_changed';
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Setting/System/SecurityControllerTest.php:103:            $this->generateUrl('admin_setting_system_security'),
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Setting/System/SecurityControllerTest.php:105:                'admin_security' => $formData,
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Setting/System/SecurityControllerTest.php:132:     * Test tenant users cannot access security settings
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Setting/System/SecurityControllerTest.php:143:        $this->client->request(Request::METHOD_GET, $this->generateUrl('admin_setting_system_security'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/BottomNavBlockPayloadBuilder.php:36:        private readonly Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/BottomNavBlockPayloadBuilder.php:63:        $user = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/HeaderUserBlockPayloadBuilder.php:28:        private readonly Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/HeaderUserBlockPayloadBuilder.php:38:        $user = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/HareruyaChannelBlockPayloadBuilder.php:27:    private const API_URL = 'https://api.corp.hareruyamtg.com/user_data/lp/json/latest_videos.json';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/FavoritesBlockPayloadBuilder.php:34:        private readonly Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/FavoritesBlockPayloadBuilder.php:48:        $Customer = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/e2e/generator.yaml:5:      - '@security.user_password_hasher'
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Event/EntryControllerTest.php:775:        $this->client->getContainer()->set('security.csrf.token_manager', $mock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Event/BannerControllerTest.php:425:        $csrfTokenManager = static::getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Event/BannerControllerTest.php:447:        $csrfTokenManager = static::getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IsAccessibleRouteExtension.php:28:        private readonly Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IsAccessibleRouteExtension.php:52:        $Member = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Sandbox/SecurityPolicyDecorator.php:24:    public function __construct(private readonly BasePolicy $securityPolicy)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Sandbox/SecurityPolicyDecorator.php:38:        $this->securityPolicy->checkSecurity($tags, $filters, $functions);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Sandbox/SecurityPolicyDecorator.php:54:        $this->securityPolicy->checkMethodAllowed($obj, $method);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Sandbox/SecurityPolicyDecorator.php:66:        $this->securityPolicy->checkPropertyAllowed($obj, $method);
/home/y-saito/Developments/ec-cube-enterprise/codeception/_support/Page/Admin/ApiWebHookPage.php:21:        $page->goPage('/api/webhook', 'WebHook管理API管理');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:38:    #[Route(path: '/%eccube_admin_route%/setting/system/security', name: 'admin_setting_system_security', methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:39:    #[Template(template: '@admin/Setting/System/security.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:51:                return $this->redirectToRoute('admin_setting_system_security');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:92:                $this->addSuccess('admin.setting.system.security.admin_url_changed', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:109:            return $this->redirectToRoute('admin_setting_system_security');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:115:            $this->addWarning('admin.setting.system.security.admin_url_warning', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:120:            $this->addWarning('admin.setting.system.security.not_found_env_file', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/PaymentController.php:176:     * @see https://pqina.nl/filepond/docs/api/server/#process
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/PaymentController.php:226:     * @see https://pqina.nl/filepond/docs/api/server/#load
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/PaymentController.php:275:     * @see https://pqina.nl/filepond/docs/api/server/#revert
/home/y-saito/Developments/ec-cube-enterprise/codeception/_support/Page/Admin/SystemSecurityPage.php:22:        return $page->goPage('/setting/system/security', 'セキュリティ管理システム設定');
/home/y-saito/Developments/ec-cube-enterprise/codeception/_support/Page/Admin/SystemSecurityPage.php:35:        $this->tester->fillField(['id' => 'admin_security_front_allow_hosts'], $ip);
/home/y-saito/Developments/ec-cube-enterprise/codeception/_support/Page/Admin/SystemSecurityPage.php:42:        $this->tester->fillField(['id' => 'admin_security_front_deny_hosts'], $ip);
/home/y-saito/Developments/ec-cube-enterprise/codeception/_support/Page/Admin/SystemSecurityPage.php:49:        $this->tester->click('#page_admin_setting_system_security form div.c-contentsArea__cols > div.c-conversionArea > div > div > div:nth-child(2) > div > div > button');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:342:     * @see https://pqina.nl/filepond/docs/api/server/#process
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:397:     * @see https://pqina.nl/filepond/docs/api/server/#load
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:475:     * @see https://pqina.nl/filepond/docs/api/server/#revert
/home/y-saito/Developments/ec-cube-enterprise/codeception/_support/Page/Admin/PluginSearchPage.php:27:        return $page->goPage('/store/plugin/api/search', 'プラグインを探すオーナーズストア');
/home/y-saito/Developments/ec-cube-enterprise/codeception/_support/Page/Admin/ApiOauthPage.php:21:        $page->goPage('/api/oauth', 'OAuth管理API管理');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:78:class OrderController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:83:     * OrderController constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php:40:class SearchOrderController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php:48:     * - 1ページ目の表示のみ処理し、2ページ目以降は通常のOrderControllerのindexメソッドで処理される.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:59:class OtcBuyOrderController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:366:     * @see https://pqina.nl/filepond/docs/api/server/#process
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:420:     * @see https://pqina.nl/filepond/docs/api/server/#load
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:467:     * @see https://pqina.nl/filepond/docs/api/server/#revert
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/CustomExportCsvController.php:54:     * OrderController constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1368:        $is_admin = $this->session->has('_security_admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:72:        private readonly Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:315:            $this->security->login($ActivatedCustomer, 'form_login', 'customer');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Customer/CustomerControllerTest.php:399:                $container->get('security.csrf.token_manager'),
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Customer/CustomerControllerTest.php:439:                $container->get('security.csrf.token_manager'),
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Customer/CustomerControllerTest.php:480:                $container->get('security.csrf.token_manager'),
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/FormatControllerTest.php:159:        $csrfTokenManager = static::getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardControllerTest.php:94:        $csrfTokenManager = static::getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardControllerTest.php:132:        $csrfTokenManager = static::getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardControllerTest.php:286:        $csrfTokenManager = static::getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardControllerTest.php:327:        $csrfTokenManager = static::getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardControllerTest.php:372:        $csrfToken = $this->client->getContainer()->get('security.csrf.token_manager')
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardControllerTest.php:422:        $csrfToken = $this->client->getContainer()->get('security.csrf.token_manager')
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardCsvControllerTest.php:172:        $token = $this->client->getContainer()->get('security.csrf.token_manager')
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardCsvControllerTest.php:203:        $token = $this->client->getContainer()->get('security.csrf.token_manager')
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardCsvControllerTest.php:241:        $token = $this->client->getContainer()->get('security.csrf.token_manager')
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardCsvControllerTest.php:276:        $token = $this->client->getContainer()->get('security.csrf.token_manager')
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardsetControllerTest.php:101:        $csrfTokenManager = static::getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Card/CardsetControllerTest.php:171:        $csrfTokenManager = static::getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Order/SearchOrderControllerTest.php:24:final class SearchOrderControllerTest extends AbstractAdminWebTestCase
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Order/OrderControllerTest.php:38:final class OrderControllerTest extends AbstractAdminWebTestCase
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/EntryActivateControllerTest.php:119:        $security = $this->createMock(Security::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/EntryActivateControllerTest.php:120:        $security->expects($this->once())
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/EntryActivateControllerTest.php:123:        static::getContainer()->set(Security::class, $security);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/DeckBuilder/LoginControllerTest.php:164:     * 有効な jwt-token ヘッダーを送信した場合に 200 が返ること
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/DeckBuilder/LoginControllerTest.php:187:     * jwt-token ヘッダーなしで送信した場合に 401 が返ること
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/DeckBuilder/LoginControllerTest.php:201:     * 不正な jwt-token を送信した場合に 401 が返ること
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:52:        $this->client->request(Request::METHOD_GET, "/api/product/detail/{$productId}", ['lang' => 'JP']);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:87:        $this->client->request(Request::METHOD_GET, "/api/product/detail/{$invalidProductId}", ['lang' => 'JP']);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:109:        $this->client->request(Request::METHOD_GET, "/api/product/detail/{$productId}");
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:130:        $this->client->request(Request::METHOD_GET, "/api/product/detail/{$productId}", ['lang' => 'EN']);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:212:        $this->client->request(Request::METHOD_GET, "/api/popup/product/ja/{$Product->getId()}");
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:243:        $this->client->request(Request::METHOD_GET, '/api/popup/product/ja/999999');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:261:        $this->client->request(Request::METHOD_GET, '/api/popup/product/xx/1');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:279:        $this->client->request(Request::METHOD_GET, '/api/popup/product/ja/abc');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:300:        $this->client->request(Request::METHOD_GET, "/api/popup/card/ja/{$cardId}");
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:332:        $this->client->request(Request::METHOD_GET, '/api/popup/card/ja/999999');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:350:        $this->client->request(Request::METHOD_GET, '/api/popup/card/xx/1');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/ProductControllerTest.php:368:        $this->client->request(Request::METHOD_GET, '/api/popup/card/ja/abc');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:28:     * GET /api/categories/tree - 正常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:35:        $this->client->request(Request::METHOD_GET, '/api/categories/tree');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:54:     * GET /api/categories/tree - 正常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:73:        $this->client->request(Request::METHOD_GET, '/api/categories/tree');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:81:     * GET /api/categories/{id}/tree - 異常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:88:        $this->client->request(Request::METHOD_GET, '/api/categories/999999999/tree');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:98:     * GET /api/categories/{id}/tree - 正常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:124:        $this->client->request(Request::METHOD_GET, "/api/categories/{$id}/tree");
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:150:     * GET /api/categories/{id}/tree - 正常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:176:        $this->client->request(Request::METHOD_GET, "/api/categories/{$id}/tree");
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:194:     * GET /api/categories/{id}/tree/false - 正常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:211:        $this->client->request(Request::METHOD_GET, "/api/categories/{$id}/tree/false");
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:221:     * GET /api/categories/{id}/tree/{branch} - 異常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:228:        $this->client->request(Request::METHOD_GET, '/api/categories/1/tree/maybe');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:234:     * GET /api/categories/{id}/tree/true と /tree/false - 正常系
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:274:        $this->client->request(Request::METHOD_GET, "/api/categories/{$parentId}/tree/true");
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/CategoryControllerTest.php:281:        $this->client->request(Request::METHOD_GET, "/api/categories/{$parentId}/tree/false");
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/OtcBuyOrder/OtcBuyOrderControllerTest.php:31:class OtcBuyOrderControllerTest extends AbstractAdminWebTestCase
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/OtcBuyOrder/OtcBuyOrderControllerTest.php:736:        $csrfTokenManager = static::getContainer()->get('security.csrf.token_manager');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:26:class OrderControllerTest extends AbstractWebTestCase
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:62:            '/api/order/prints/direct/1',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:99:            '/api/order/prints/direct/1',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:140:            '/api/order/prints/direct/1',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php:177:            '/api/order/prints/direct/1',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Data/HolidayControllerTest.php:126:            ->get('security.csrf.token_manager')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/AccessToken/JwtTokenHeaderExtractor.php:29:    private const HEADER_NAME = 'jwt-token';
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/SectionControllerTest.php:73:        $this->client->request(Request::METHOD_GET, '/api/v1/admin/sections.json', [], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/SectionControllerTest.php:106:        $this->client->request(Request::METHOD_GET, '/api/v1/admin/sections.json', [], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:69:            '/api/v1/admin/optionBulkPurchaseId.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:89:        $this->client->request(Request::METHOD_GET, '/api/v1/admin/optionBulkPurchaseId.json');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:106:            '/api/v1/admin/optionBulkPurchaseId.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:138:            '/api/v1/admin/optionBulkPurchaseId.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:177:            '/api/v1/admin/fixedPriceSection.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:210:            '/api/v1/admin/fixedPriceSection.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/ProductControllerTest.php:1101:        static::getContainer()->set('security.csrf.token_manager', $mock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/ProductControllerTest.php:1155:        static::getContainer()->set('security.csrf.token_manager', $mock);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyingControllerTest.php:168:            '/api/v1/buying/'.$cardDetailId.'.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyingControllerTest.php:196:            '/api/v1/buying/1.json'
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyingControllerTest.php:218:            '/api/v1/buying/'.$nonExistentId.'.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyingControllerTest.php:246:            '/api/v1/buying/products',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyingControllerTest.php:278:            '/api/v1/buying/products',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyingControllerTest.php:310:            '/api/v1/buying/products',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyingControllerTest.php:348:            '/api/v1/buying/products',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyingControllerTest.php:378:            '/api/v1/search',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyingControllerTest.php:411:            '/api/v1/search',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyingControllerTest.php:437:            '/api/v1/search',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductControllerTest.php:83:            '/api/v1/admin/buyOrderIndivisualInputProduct.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductControllerTest.php:132:            '/api/v1/admin/buyOrderIndivisualInputProduct.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductControllerTest.php:166:            '/api/v1/admin/buyOrderIndivisualInputProduct.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductControllerTest.php:194:            '/api/v1/admin/buyOrderIndivisualInputProduct.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductControllerTest.php:219:            '/api/v1/admin/buyOrderIndivisualInputProduct.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductControllerTest.php:241:            '/api/v1/admin/buyOrderIndivisualInputProduct.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/ShelfNumberControllerTest.php:207:            '_token' => $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue(),
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/ShelfNumberControllerTest.php:226:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/ShelfNumberControllerTest.php:257:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:28:class BuyOrderControllerTest extends AbstractWebTestCase
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:87:        $this->client->request(Request::METHOD_GET, '/api/v1/admin/buyOrders.json', [], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:147:        $this->client->request(Request::METHOD_GET, '/api/v1/admin/buyOrders.json', [], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:163:        $this->client->request(Request::METHOD_GET, '/api/v1/admin/buyOrders.json');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:191:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'/freeComment.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:224:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'/freeComment.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:252:            '/api/v1/admin/buyOrder/'.$buyOrderId.'/freeComment.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:291:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'/freeComment.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:322:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'/freeComment.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:350:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:379:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:410:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:441:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:473:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:501:            '/api/v1/admin/buyOrder/'.$buyOrderId.'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:539:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:568:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:602:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:635:            '/api/v1/admin/buyOrder/'.$buyOrderId.'.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:673:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:709:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:805:            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/LoginControllerTest.php:24: * POST /api/v1/admin/login.json の結合テスト
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:31:class OtcBuyOrderControllerTest extends AbstractWebTestCase
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:93:        $this->client->request(Request::METHOD_GET, '/api/v1/admin/otcBuyOrders.json', [], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:182:        $this->client->request(Request::METHOD_GET, '/api/v1/admin/otcBuyOrders.json', [], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:207:        $this->client->request(Request::METHOD_GET, '/api/v1/admin/otcBuyOrders.json', [], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:254:        $this->client->request(Request::METHOD_GET, '/api/v1/admin/otcBuyOrders.json', [], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:286:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'.json', [], [], ['HTTP_JWT_TOKEN' => $token, 'CONTENT_TYPE' => 'application/json'], json_encode($updateOtcBuyOrderRequest));
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:316:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$otcBuyOrderId.'.json', [], [], ['HTTP_JWT_TOKEN' => $token, 'CONTENT_TYPE' => 'application/json'], json_encode($updateOtcBuyOrderRequest));
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:345:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'.json', [], [], ['HTTP_JWT_TOKEN' => $token, 'CONTENT_TYPE' => 'application/json'], json_encode($updateOtcBuyOrderRequest));
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:374:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'.json', [], [], ['HTTP_JWT_TOKEN' => $token, 'CONTENT_TYPE' => 'application/json'], json_encode($updateOtcBuyOrderRequest));
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:401:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'.json', [], [], ['HTTP_JWT_TOKEN' => $token, 'CONTENT_TYPE' => 'application/json'], json_encode($updateOtcBuyOrderRequest));
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:431:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'.json', [], [], ['HTTP_JWT_TOKEN' => $token, 'CONTENT_TYPE' => 'application/json'], json_encode($updateOtcBuyOrderRequest));
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:453:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/freeComment.json', ['free_comment' => $freeComment], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:472:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/freeComment.json', [], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:494:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$otcBuyOrderId.'/freeComment.json', ['free_comment' => $freeComment], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:523:            '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/freeComment.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:557:            '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:583:            '/api/v1/admin/otcBuyOrder/'.$otcBuyOrderId.'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:609:            '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:636:            '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:667:            '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/status.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:692:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/doubleCheckMember.json', ['double_check_member_id' => $DoubleCheckMember->getId()], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:712:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/doubleCheckMember.json', ['double_check_member_id' => $NonExistingDoubleCheckMemberId], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:734:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$otcBuyOrderId.'/doubleCheckMember.json', ['double_check_member_id' => $DoubleCheckMember->getId()], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:763:            '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/doubleCheckMember.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:788:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/identification.json', ['identification' => $Identification->getId()], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:808:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/identification.json', ['identification' => $nonExistingIdentificationId], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:830:        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$otcBuyOrderId.'/identification.json', ['identification' => $Identification->getId()], [], ['HTTP_JWT_TOKEN' => $token]);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:859:            '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/identification.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyMainCardControllerTest.php:98:            '/api/v1/admin/buyMainCard.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyMainCardControllerTest.php:157:            '/api/v1/admin/buyMainCard.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyMainCardControllerTest.php:193:            '/api/v1/admin/buyMainCard.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyMainCardControllerTest.php:221:            '/api/v1/admin/buyMainCard.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyMainCardControllerTest.php:246:            '/api/v1/admin/buyMainCard.json',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyMainCardControllerTest.php:268:            '/api/v1/admin/buyMainCard.json',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/CustomerIdSetSubscriber.php:35:        Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/CustomerIdSetSubscriber.php:39:        $this->user = $security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/SellGroupControllerTest.php:195:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/SellGroupControllerTest.php:226:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/TagControllerTest.php:198:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken('tag'.$id)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/TagControllerTest.php:236:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken('tag'.$id)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/TagControllerTest.php:269:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken('tag'.$id)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/StorageCodeControllerTest.php:195:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/StorageCodeControllerTest.php:225:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/StorageCodeControllerTest.php:248:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/LoginType.php:46:            'data' => $this->session->get('_security.last_username'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:117:        // JWTトークンを持つAPI（/api/v1/...）は system に切り替える
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:124:                && $mainRequest->headers->has('jwt-token')
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/TagSalesAnalysisControllerTest.php:143:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/TagSalesAnalysisControllerTest.php:174:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/Admin/Product/TagSalesAnalysisControllerTest.php:217:        $token = $this->client->getContainer()->get('security.csrf.token_manager')->getToken(Constant::TOKEN_NAME)->getValue();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/FrontPurchaseControllerTest.php:226:        static::getContainer()->get('security.untracked_token_storage')->setToken($token);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/FrontPurchaseControllerTest.php:228:        $session->set('_security_customer', serialize($token));
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:58:        $security = $this->createMock(Security::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:59:        $security->method('getUser')->willReturn($testMember);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:63:            $security,
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:94:        $security = $this->createMock(Security::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:95:        $security->method('getUser')->willReturn($testMember);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:99:            $security,
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:130:        $security = $this->createMock(Security::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:131:        $security->method('getUser')->willReturn($testMember);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:135:            $security,
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:166:        $security = $this->createMock(Security::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:167:        $security->method('getUser')->willReturn($testMember);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:171:            $security,
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:199:        $security = $this->createMock(Security::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:200:        $security->method('getUser')->willReturn(null);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Twig/Extension/IsAccessibleRouteExtensionTest.php:204:            $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/EccubeExtension.php:101:        // security.ymlでは制御できないため, ここで定義する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/EccubeExtension.php:102:        $container->prependExtensionConfig('security', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/EccubeExtension.php:103:            'access_control' => $accessControl,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:83:        private readonly Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:504:        $user = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/SmaregiCustomerServiceTest.php:44:            'https://api.example',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/SmaregiCustomerServiceTest.php:311:            ->with('https://api.example', 'contract-1', 'token', 'cust-9')
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/SmaregiCustomerServiceTest.php:419:            ->with('https://api.example', 'contract-1', 'token', 'cust-9', 100)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:35:        protected Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:98:        $Member = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Security/AccessToken/JwtTokenHeaderExtractorTest.php:34:     * jwt-tokenヘッダーからトークンを取得できること
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Security/AccessToken/JwtTokenHeaderExtractorTest.php:43:        $request->headers->set('jwt-token', $expectedToken);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Security/AccessToken/JwtTokenHeaderExtractorTest.php:80:        $request->headers->set('jwt-token', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:54:    protected Security $security;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:56:    public function __construct(BaseInfoRepository $baseInfoRepository, Security $security)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:59:        $this->security = $security;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:191:        $Member = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderStatusType.php:30:        protected Security $security,
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Stock/SmaregiStockBackfillActionTest.php:187:            'https://api.example/v1',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:64:    protected Security $security;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:66:    public function __construct(EccubeConfig $eccubeConfig, RequestStack $requestStack, BaseInfoRepository $baseInfoRepository, Security $security)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:71:        $this->security = $security;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:221:        $Member = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Otc/SmaregiOtcOrderSyncServiceTest.php:33:    private const API_URL = 'https://api.example/v1';
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Otc/SmaregiOtcDeleteServiceTest.php:28:    private const API_URL = 'https://api.example/v1';
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/SmaregiCustomerResolverTest.php:45:            'https://api.example',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/SmaregiCustomerResolverTest.php:75:            ->with('https://api.example', 'contract-1', 'token', 'smaregi-cust-1')
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Webhook/Transaction/Handler/EditedHandlerTest.php:168:            'https://api.smaregi.example',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:43:            'https://api.example/v1/contract-1/pos/stock/prod-123/add',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:56:            'https://api.example/v1',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:79:            'https://api.example/v1/contract-1/pos/stock/prod%2Fwith%20space/add',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:86:            'https://api.example/v1',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:106:            'https://api.example/v1/contract-1/pos/stock/p1/add',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:113:            'https://api.example/v1/',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:133:        $client->add('https://api.example/v1', 'contract-1', 'token', 'store-1', 'p1', 0);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:146:            new ConnectException('connect failed', new Request('POST', 'https://api.example/v1/contract-1/pos/stock/p1/add'))
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:152:            'https://api.example/v1',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:181:            'https://api.example/v1',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:204:            'https://api.example/v1/contract-1/pos/stock',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:217:        $out = $client->listStocks('https://api.example/v1', 'contract-1', 'token', ['page' => '1', 'limit' => '100']);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:234:            'https://api.example/v1/contract-1/pos/stock/changes/p1/s1',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:245:            'https://api.example/v1',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:268:            'https://api.example/v1/contract-1/pos/stock/changes/p%2F1/s%201',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiStockApiClientTest.php:274:        $client->listStockChanges('https://api.example/v1', 'contract-1', 'token', 'p/1', 's 1', []);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:58:            'https://api.example/v1/contract-1/pos/customers',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:66:        $out = $client->listByCustomerCode('https://api.example/v1', 'contract-1', 'token', 'M0001');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:90:            'https://api.example/v1/contract-1/pos/customers',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:98:        $out = $client->listByCustomerNo('https://api.example/v1', 'contract-1', 'token', '1234567890');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:120:            'https://api.example/v1/contract-1/pos/customers',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:128:        $out = $client->create('https://api.example/v1', 'contract-1', 'token', [
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:152:            'https://api.example/v1/contract-1/pos/customers/c100',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:159:        $out = $client->get('https://api.example/v1', 'contract-1', 'token', 'c100');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:176:            'https://api.example/v1/contract-1/pos/customers/c100',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:183:        $out = $client->delete('https://api.example/v1', 'contract-1', 'token', 'c100');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:199:            'https://api.example/v1/contract-1/pos/customers/c100/point/add',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:207:        $out = $client->addPoint('https://api.example/v1', 'contract-1', 'token', 'c100', -50);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:223:            'https://api.example/v1/contract-1/pos/customers/c100',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:231:        $out = $client->update('https://api.example/v1', 'contract-1', 'token', 'c100', [
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiCustomerApiClientTest.php:252:        $out = $client->create('https://api.example/v1', 'contract-1', 'token', [
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiProductApiClientTest.php:49:            'https://api.example/v1/contract-1/pos/products',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiProductApiClientTest.php:64:        $out = $client->listByProductCode('https://api.example/v1', 'contract-1', 'token', 'SKU01');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BarcodeReplacementListType.php:34:        private readonly Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BarcodeReplacementListType.php:113:        $Member = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiTransactionApiClientTest.php:67:            'https://api.example/v1/contract-1/pos/transactions/12345',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiTransactionApiClientTest.php:83:        $out = $client->getTransaction('https://api.example/v1', 'contract-1', 'token', '12345');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiTransactionApiClientTest.php:108:        $out = $client->getTransaction('https://api.example/v1', 'c', 't', '999');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiTransactionApiClientTest.php:127:        $out = $client->getTransaction('https://api.example/v1', 'c', 't', '999');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiTransactionApiClientTest.php:144:            'https://api.example/v1/contract-1/pos/transactions',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiTransactionApiClientTest.php:154:            'https://api.example/v1',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiSectionApiClientTest.php:49:            'https://api.example/v1/contract-1/pos/categories',
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiSectionApiClientTest.php:64:        $out = $client->listByCategoryCode('https://api.example/v1', 'contract-1', 'token', 'S01');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:43:    #[Route('/api/user/login', name: 'api_deck_builder_login', methods: ['POST', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:79:    #[Route('/api/user/logout', name: 'api_deck_builder_logout', methods: ['POST', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/LoginController.php:86:        $token = $request->headers->get('jwt-token', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:71:    #[Route('/api/cards', name: 'api_deck_builder_cards_search', methods: ['GET', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:142:    #[Route('/api/cards/{id}', name: 'api_deck_builder_card', methods: ['GET', 'OPTIONS'], requirements: ['id' => '\d+'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:160:    #[Route('/api/card', name: 'api_deck_builder_card_search', methods: ['GET', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Stock/InventoryPlanListType.php:41:        private readonly Security $security,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Stock/InventoryPlanListType.php:142:        $user = $this->security->getUser();
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/Mock/SmaregiMockHttpClientFactoryTest.php:56:        $response = $client->request('GET', 'https://api.smaregi.dev/pos/sb_test/products', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/ArchetypeController.php:38:    #[Route('/api/archetypes/{formatId}', name: 'api_deck_builder_archetypes', methods: ['GET', 'OPTIONS'], requirements: ['formatId' => '\d+'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/ArchetypeController.php:61:    #[Route('/api/archetype/{id}', name: 'api_deck_builder_archetype', methods: ['GET', 'OPTIONS'], requirements: ['id' => '\d+'])]
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/Mock/SmaregiMockResponderTest.php:61:        $request = new Request('GET', 'https://api.smaregi.dev/sb_test/pos/products?product_code=000972');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/Mock/SmaregiMockResponderTest.php:80:        $request = new Request('POST', 'https://api.smaregi.dev/sb_test/pos/products', [
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/Mock/SmaregiMockResponderTest.php:100:        $request = new Request('PATCH', 'https://api.smaregi.dev/sb_test/pos/products/abc-123', [
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/Mock/SmaregiMockResponderTest.php:120:        $request = new Request('GET', 'https://api.smaregi.dev/sb_test/pos/categories?category_code=1001');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/Mock/SmaregiMockResponderTest.php:138:        $request = new Request('GET', 'https://api.smaregi.dev/sb_test/pos/customers?customer_code=2900000000017');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/Mock/SmaregiMockResponderTest.php:155:        $request = new Request('GET', 'https://api.smaregi.dev/sb_test/pos/customers?customer_no=1234567890');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/Mock/SmaregiMockResponderTest.php:173:        $request = new Request('POST', 'https://api.smaregi.dev/sb_test/pos/customers', [
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/Mock/SmaregiMockResponderTest.php:193:        $request = new Request('GET', 'https://api.smaregi.dev/sb_test/pos/customers/c100');
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/Mock/SmaregiMockResponderTest.php:211:        $request = new Request('GET', 'https://api.smaregi.dev/sb_test/pos/stocks');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/MasterController.php:77:    #[Route('/api/master/{name}', name: 'api_deck_builder_master', methods: ['GET', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:102:                'label' => 'admin.setting.system.security.force_ssl',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:134:                            $form['front_allow_hosts']->addError(new FormError(trans('admin.setting.system.security.ip_limit_invalid_ip_and_submask', ['%ip%' => $ip])));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:153:                            $form['front_deny_hosts']->addError(new FormError(trans('admin.setting.system.security.ip_limit_invalid_ip_and_submask', ['%ip%' => $ip])));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:172:                            $form['admin_allow_hosts']->addError(new FormError(trans('admin.setting.system.security.ip_limit_invalid_ipv4', ['%ip%' => $ip])));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:191:                            $form['admin_deny_hosts']->addError(new FormError(trans('admin.setting.system.security.ip_limit_invalid_ipv4', ['%ip%' => $ip])));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:198:                    $form['force_ssl']->addError(new FormError(trans('admin.setting.system.security.ip_limit_invalid_https')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:237:        return 'admin_security';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:43:    #[Route('/api/user', name: 'api_deck_builder_user', methods: ['GET', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:51:        $token = $request->headers->get('jwt-token', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:78:    #[Route('/api/user', name: 'api_deck_builder_user_update', methods: ['PUT', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:85:        $token = $request->headers->get('jwt-token', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/AbstractDeckBuilderController.php:62:        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, jwt-token');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CategoryController.php:37:    #[Route(path: '/api/categories/tree', name: 'api_categories_tree', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CategoryController.php:61:    #[Route(path: '/api/categories/{id}/tree', name: 'api_categories_tree_by_id', requirements: ['id' => '\\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CategoryController.php:70:    #[Route(path: '/api/categories/{id}/tree/{branch}', name: 'api_categories_tree_by_id_branch', requirements: ['id' => '\\d+', 'branch' => 'true|false'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:28:class OrderController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43:    #[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', requirements: ['base_info_id' => '\d+'], methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:50:    #[Route(path: '/api/product/detail/{productId}', name: 'product_detail_by_product_id', requirements: ['productId' => '\\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:51:    #[Route(path: '/api/product/detail/{productId}.json', name: 'product_detail_by_product_id_json', requirements: ['productId' => '\\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:150:    #[Route(path: '/api/popup/product/{lang}/{productId}', name: 'popup_product_by_product_id', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:265:    #[Route(path: '/api/popup/card/{lang}/{cardId}', name: 'popup_product_by_card_id', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:75:    #[Route('/api/deck', name: 'api_deck_builder_deck_post', methods: ['POST', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:82:        $token = $request->headers->get('jwt-token', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:124:    #[Route('/api/deck/{id}', name: 'api_deck_builder_deck_update', methods: ['PUT', 'OPTIONS'], requirements: ['id' => '\d+'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:131:        $token = $request->headers->get('jwt-token', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:177:    #[Route('/api/deck/{id}', name: 'api_deck_builder_deck_delete', methods: ['DELETE', 'OPTIONS'], requirements: ['id' => '\d+'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:184:        $token = $request->headers->get('jwt-token', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:214:    #[Route('/api/deck/{id}', name: 'api_deck_builder_deck_get', methods: ['GET', 'OPTIONS'], requirements: ['id' => '\d+'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:262:    #[Route('/api/decks', name: 'api_deck_builder_decks', methods: ['GET', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:522:    #[Route('/api/deck/usage_analysis/{formatId}', name: 'api_deck_builder_usage_analysis', methods: ['GET', 'OPTIONS'], requirements: ['formatId' => '\d+'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:556:    #[Route('/api/metagame', name: 'api_deck_builder_metagame', methods: ['GET', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:643:    #[Route('/api/recent_event', name: 'api_deck_builder_recent_event', methods: ['GET', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:667:    #[Route('/api/deck/import', name: 'api_deck_builder_deck_import_post', methods: ['POST', 'OPTIONS'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:677:    #[Route('/api/deck/import/{id}', name: 'api_deck_builder_deck_import_put', methods: ['PUT', 'OPTIONS'], requirements: ['id' => '\d+'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:689:        $token = $request->headers->get('jwt-token', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:749:        $token = $request->headers->get('jwt-token', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:52:class OtcBuyOrderController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:45:class BuyOrderController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:909:            // see https://symfony.com/doc/2.7/security/entity_provider.html#create-your-user-entity
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Block/FavoritesBlockPayloadBuilderTest.php:39:        $security = $this->createMock(Security::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Block/FavoritesBlockPayloadBuilderTest.php:40:        $security->method('getUser')->willReturn(null);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Block/FavoritesBlockPayloadBuilderTest.php:48:            $security,
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Block/FavoritesBlockPayloadBuilderTest.php:69:        $security = $this->createMock(Security::class);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Block/FavoritesBlockPayloadBuilderTest.php:70:        $security->method('getUser')->willReturn($Customer);
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Block/FavoritesBlockPayloadBuilderTest.php:92:            $security,
/home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/Smaregi/Api/SmaregiGuzzleClientFactoryTest.php:31:        $this->request = new Request('GET', 'https://example.test/api');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:1058:     * `/api/deck/usage_analysis/{formatId}` 用の採用枚数集計。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPriceHistoryRepository.php:80:    //         ->setMemberId($app['security']->getToken()->getUser()->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php:64:         * @see \Eccube\Controller\Admin\Order\OrderController::delete()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Member.php:560:            // see https://symfony.com/doc/2.7/security/entity_provider.html#create-your-user-entity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:162:     * Admin/Order/OrderController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:466:front.privacy.intro2: "Hareruya provides services on the premise that customers have consented to the handling of personal information and security on the Hareruya website. Please be aware that the content described herein may be changed or revised to provide customers with safer and more secure services, and such changes will be deemed to have been agreed to simultaneously."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:479:front.privacy.s5.title: "5. We will implement necessary and appropriate security measures against risks such as unauthorized access, loss, destruction, falsification, and leakage of customers' personal information."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1713:admin.common.admin_url_warning: 'Please set the Admin Console URL that is hard to guess for security. You can set it at "<a href="%url%">Security</a>".'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1714:admin.common.restrict_file_upload_info: "If this feature is used infrequently, disabling it while not in use provides additional security. You can disable this feature by setting the environment variable ECCUBE_RESTRICT_FILE_UPLOAD to 1."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2592:admin.setting.system.security_management: Security
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2795:admin.setting.system.security__card_title: Security Settings
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2796:admin.setting.system.security_admin_url__card_title: Admin Console URL Setting
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2797:admin.setting.system.security_admin_ip_limit__card_title: Admin Console IP Restrictions Setting
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2798:admin.setting.system.security_front_ip_limit__card_title: Storefront IP Restrictions Setting
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2799:admin.setting.system.security_connect_card_title: Connect Setting
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2800:admin.setting.system.security.admin_url: Admin Console URL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2801:admin.setting.system.security.admin_url_description: It is recommended to set the URL which would NOT be easily guessed.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2802:admin.setting.system.security.admin_url_changed: The URL of Admin Console has been changed. Please sign in again.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2803:admin.setting.system.security.ip_limit: IP Restrictions(Allow List)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2804:admin.setting.system.security.ip_limit_description: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2808:admin.setting.system.security.ip_limit_sample: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2811:admin.setting.system.security.ip_limit_deny: IP Restrictions(Deny List)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2812:admin.setting.system.security.ip_limit_description_deny: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2816:admin.setting.system.security.front_ip_limit_description: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2820:admin.setting.system.security.front_ip_limit_description_deny: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2824:admin.setting.system.security.force_ssl: SSL is mandatory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2825:admin.setting.system.security.force_ssl_description: Only https access is allowed to set SSL restrictions.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2826:admin.setting.system.security.ip_limit_invalid_ipv4: "%ip% is not an IPv4 address."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2827:admin.setting.system.security.ip_limit_invalid_https: "http is not allowed to do this setting."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2828:admin.setting.system.security.admin_url_warning: Please set the Admin Console URL that is hard to guess for security.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2829:admin.setting.system.security.not_found_env_file: .env file not found. If you do not use the .env file you can not change security config in Admin Console.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2830:admin.setting.system.security.trusted_hosts: Trusted hosts
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2831:admin.setting.system.security.trusted_hosts_sample: ^example\.com$,^example\.org$
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2832:admin.setting.system.security.trusted_hosts_description: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3212:tooltip.setting.system.security.admin_url: Set the URL to sign in to the Admin Console. Please specify a URL which is hardly guessed.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3213:tooltip.setting.system.security.front_ip_limit: Restricting IP addresses which are allowed to sign in to the Front Screen.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3214:tooltip.setting.system.security.front_ip_limit_deny: IP addresses where access to the Front Screen is denied.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3215:tooltip.setting.system.security.ip_limit: Restricting IP addresses which are allowed to sign in to the Admin Console.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3216:tooltip.setting.system.security.ip_limit_deny: IP addresses where access to the Admin Console is denied.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3217:tooltip.setting.system.security.force_ssl: Restricting the access to the Front Screen and Admin Console to via SSL(https).
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3218:tooltip.setting.system.security.trusted_hosts: Deny access to non-trusted hosts.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3266:install.security_configuration: Security Settings
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3268:install.directory_name_notice: To ensure the security, please enter a directory name hard to guess.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/validators.en.yaml:48:error.customer_login.password_length_required: Due to security enhancement, passwords must be at least 12 characters. Please reset your password via the password reset page.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2946:admin.setting.system.security_management: セキュリティ管理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3220:admin.setting.system.security__card_title: セキュリティ設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3221:admin.setting.system.security_admin_url__card_title: 管理画面URL設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3222:admin.setting.system.security_admin_ip_limit__card_title: 管理画面IP制限設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3223:admin.setting.system.security_front_ip_limit__card_title: フロント画面IP制限設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3224:admin.setting.system.security_connect_card_title: 接続設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3225:admin.setting.system.security.admin_url: 管理画面URL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3226:admin.setting.system.security.admin_url_description: 推測されにくいURLを設定することを推奨します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3227:admin.setting.system.security.admin_url_changed: 管理画面のURLを変更しました。再度ログインを行ってください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3228:admin.setting.system.security.ip_limit: IP制限(許可リスト)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3229:admin.setting.system.security.ip_limit_description: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3233:admin.setting.system.security.ip_limit_sample: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3236:admin.setting.system.security.ip_limit_deny: IP制限(拒否リスト)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3237:admin.setting.system.security.ip_limit_description_deny: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3241:admin.setting.system.security.front_ip_limit_description: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3245:admin.setting.system.security.front_ip_limit_description_deny: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3249:admin.setting.system.security.force_ssl: SSLを強制
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3250:admin.setting.system.security.force_ssl_description: httpsからの接続でなければSSL制限を設定できません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3251:admin.setting.system.security.ip_limit_invalid_ipv4: "%ip%はIPv4アドレスではありません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3252:admin.setting.system.security.ip_limit_invalid_ip_and_submask: "%ip%はIPv4/ビットマスクの形式ではありません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3253:admin.setting.system.security.ip_limit_invalid_https: "httpの場合には設定できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3254:admin.setting.system.security.admin_url_warning: 管理画面URLは、セキュリティのため推測されにくいものを設定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3255:admin.setting.system.security.not_found_env_file: .envファイルが見つかりません。.envを利用していない場合はセキュリティ設定を管理画面から変更できません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3256:admin.setting.system.security.trusted_hosts: 信頼できるホスト名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3257:admin.setting.system.security.trusted_hosts_sample: ^example\.com$,^example\.org$
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3258:admin.setting.system.security.trusted_hosts_description: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3640:tooltip.setting.system.security.admin_url: 管理画面にログインするためのURLを指定します。推測されにくいURLを指定して下さい。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3641:tooltip.setting.system.security.front_ip_limit: フロント画面にアクセスできる接続元のIPアドレスを制限します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3642:tooltip.setting.system.security.front_ip_limit_deny: フロント画面へのアクセスを拒否する接続元のIPアドレスを指定します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3643:tooltip.setting.system.security.ip_limit: 管理画面にログインできる接続元のIPアドレスを制限します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3644:tooltip.setting.system.security.ip_limit_deny: 管理画面へのアクセスを拒否する接続元のIPアドレスを指定します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3645:tooltip.setting.system.security.force_ssl: フロント画面と管理画面への接続をSSL(https)での接続に制限します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3646:tooltip.setting.system.security.trusted_hosts: 設定されたホスト名以外でのアクセスを拒否します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3695:install.security_configuration: セキュリティの設定

 succeeded in 145ms:
   620	        private ?Payment $Payment = null;
   621	
   622	        #[ORM\ManyToOne(targetEntity: DeviceType::class)]
   623	        #[ORM\JoinColumn(name: 'device_type_id', referencedColumnName: 'id')]
   624	        private ?DeviceType $DeviceType = null;
   625	
   626	        /**
   627	         * OrderStatusより先にプロパティを定義しておかないとセットされなくなる
   628	         */
   629	        #[ORM\ManyToOne(targetEntity: CustomerOrderStatus::class)]
   630	        #[ORM\JoinColumn(name: 'order_status_id', referencedColumnName: 'id')]
   631	        private ?CustomerOrderStatus $CustomerOrderStatus = null;
   632	
   633	        /**
   634	         * OrderStatusより先にプロパティを定義しておかないとセットされなくなる
   635	         */
   636	        #[ORM\ManyToOne(targetEntity: OrderStatusColor::class)]
   637	        #[ORM\JoinColumn(name: 'order_status_id', referencedColumnName: 'id')]
   638	        private ?OrderStatusColor $OrderStatusColor = null;
   639	
   640	        #[ORM\ManyToOne(targetEntity: OrderStatus::class)]
   641	        #[ORM\JoinColumn(name: 'order_status_id', referencedColumnName: 'id')]
   642	        private ?OrderStatus $OrderStatus = null;
   643	
   644	        #[ORM\Column(name: 'waiting_number', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => '店舗販売用整理番号'])]
   645	        private ?int $waitingNumber = null;
   646	
   647	        #[ORM\Column(name: 'order_number', type: Types::STRING, length: 11, nullable: true, options: ['unsigned' => true, 'comment' => '注文番号'])]
   648	        private ?string $order_number = null;
   649	
   650	        #[ORM\JoinColumn(name: 'operator_id', referencedColumnName: 'id')]
   651	        #[ORM\ManyToOne(targetEntity: Member::class)]
   652	        private ?Member $Member = null;
   653	
   654	        #[ORM\Column(name: 'gained_points', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'ポイント発生'])]
   655	        private ?int $gained_points = null;
   656	
   657	        #[ORM\Column(name: 'spended_points', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'ポイント使用'])]
   658	        private ?int $spended_points = null;
   659	
   660	        #[ORM\Column(name: 'payment_detail', type: Types::STRING, length: 255, nullable: true, options: ['comment' => '支払詳細'])]
   661	        private ?string $payment_detail = null;
   662	
   663	        #[ORM\Column(name: 'credit_payment_total', type: Types::INTEGER, nullable: true, options: ['comment' => '与信時金額合計'])]
   664	        private ?int $credit_payment_total = null;
   665	
   666	        #[ORM\Column(name: 'confirm_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '注文確定日'])]
   667	        private ?\DateTime $confirmDate = null;
   668	
   669	        #[ORM\Column(name: 'commit_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '出荷指示日'])]
   670	        private ?\DateTime $commitDate = null;
   671	
   672	        #[ORM\Column(name: 'shipping_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '出荷日'])]
   673	        private ?\DateTime $shippingDate = null;
   674	
   675	        #[ORM\Column(name: 'picking_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => 'ピック開始日'])]
   676	        private ?\DateTime $picking_date = null;
   677	
   678	        #[ORM\Column(name: 'pick_finish_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => 'ピック完了日'])]
   679	        private ?\DateTime $pick_finish_date = null;
   680	
   681	        #[ORM\Column(name: 'closing_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '販売完了日'])]
   682	        private ?\DateTime $closing_date = null;
   683	
   684	        #[ORM\Column(name: 'cancel_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => 'キャンセル日'])]
   685	        private ?\DateTime $cancel_date = null;
   686	
   687	        #[ORM\Column(name: 'receipt_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '売上確定日'])]
   688	        private ?\DateTime $receiptDate = null;
   689	
   690	        #[ORM\Column(name: 'due_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '支払期限日'])]
  1858	
  1859	        public function getShippingDate(): ?\DateTime
  1860	        {
  1861	            return $this->shippingDate;
  1862	        }
  1863	
  1864	        public function getPickingDate(): ?\DateTime
  1865	        {
  1866	            return $this->picking_date;
  1867	        }
  1868	
  1869	        public function setPickingDate(?\DateTime $picking_date): Order
  1870	        {
  1871	            $this->picking_date = $picking_date;
  1872	
  1873	            return $this;
  1874	        }
  1875	
  1876	        public function getPickFinishDate(): ?\DateTime
  1877	        {
  1878	            return $this->pick_finish_date;
  1879	        }
  1880	
  1881	        public function setPickFinishDate(?\DateTime $pick_finish_date): Order
  1882	        {
  1883	            $this->pick_finish_date = $pick_finish_date;
  1884	
  1885	            return $this;
  1886	        }
  1887	
  1888	        public function getClosingDate(): ?\DateTime

codex
認証については出力が多かったため、設定ファイル本体に絞って確認します。ここは候補JSONに無い見落としになり得る箇所なので、ルートがどの firewall に入るかを行番号付きで確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/OrderControllerTest.php | sed -n '1,210p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Tests\Web\App;
    17	
    18	use Eccube\Service\Admin\Order\ActionInput\OrderDirectPrintInput;
    19	use Eccube\Service\Admin\Order\ActionInput\UpdatePrintedOrderStatusInput;
    20	use Eccube\Service\Admin\Order\OrderDirectPrintAction;
    21	use Eccube\Service\Admin\Order\UpdatePrintedOrderStatusAction;
    22	use Eccube\Tests\Web\AbstractWebTestCase;
    23	use Symfony\Component\HttpFoundation\Request;
    24	use Symfony\Component\HttpFoundation\Response;
    25	
    26	class OrderControllerTest extends AbstractWebTestCase
    27	{
    28	    /**
    29	     * orderDirectPrint - 正常系
    30	     * ConnectionType=GetRequest の場合、印刷データが正常に返却されること
    31	     *
    32	     * @group HARERUYA
    33	     */
    34	    public function testOrderDirectPrintGetRequestSuccess(): void
    35	    {
    36	        // Arrange
    37	        // Controller以外はモック化してテストする
    38	        $orderDirectPrintActionMock = $this->createMock(OrderDirectPrintAction::class);
    39	        $orderDirectPrintActionMock
    40	            ->expects($this->once())
    41	            ->method('handle')
    42	            ->with($this->callback(function (OrderDirectPrintInput $Input): bool {
    43	                $this->assertSame('http://localhost/', $Input->uri);
    44	                $this->assertSame(1, $Input->base_info_id);
    45	
    46	                return true;
    47	            }))
    48	            ->willReturn('<xml>print_data</xml>');
    49	        static::getContainer()->set(OrderDirectPrintAction::class, $orderDirectPrintActionMock);
    50	
    51	        $updatePrintedOrderStatusActionMock = $this->createMock(UpdatePrintedOrderStatusAction::class);
    52	        // テーブル更新はされないことを監視
    53	        $updatePrintedOrderStatusActionMock
    54	            ->expects($this->never())
    55	            ->method('handle');
    56	        static::getContainer()->set(UpdatePrintedOrderStatusAction::class, $updatePrintedOrderStatusActionMock);
    57	
    58	        // Act
    59	        // このテストではbase_info_idは数値であればよいので本店：1を指定
    60	        $this->client->request(
    61	            Request::METHOD_POST,
    62	            '/api/order/prints/direct/1',
    63	            ['ConnectionType' => 'GetRequest']
    64	        );
    65	
    66	        // Assert
    67	        $response = $this->client->getResponse();
    68	        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
    69	        // レスポンスヘッダが想定通りかどうか確認する
    70	        $this->assertSame('application/octet-stream', $response->headers->get('Content-Type'));
    71	    }
    72	
    73	    /**
    74	     * orderDirectPrint - 正常系
    75	     * ConnectionType=GetRequest でActionが空文字を返しても、HTTP 200 が返却されること
    76	     *
    77	     * @group HARERUYA
    78	     */
    79	    public function testOrderDirectPrintGetRequestWithEmptyResponseBodySuccess(): void
    80	    {
    81	        // Arrange
    82	        $orderDirectPrintActionMock = $this->createMock(OrderDirectPrintAction::class);
    83	        $orderDirectPrintActionMock
    84	            ->expects($this->once())
    85	            ->method('handle')
    86	            // 空文字を返す
    87	            ->willReturn('');
    88	        static::getContainer()->set(OrderDirectPrintAction::class, $orderDirectPrintActionMock);
    89	
    90	        $updatePrintedOrderStatusActionMock = $this->createMock(UpdatePrintedOrderStatusAction::class);
    91	        $updatePrintedOrderStatusActionMock
    92	            ->expects($this->never())
    93	            ->method('handle');
    94	        static::getContainer()->set(UpdatePrintedOrderStatusAction::class, $updatePrintedOrderStatusActionMock);
    95	
    96	        // Act
    97	        $this->client->request(
    98	            Request::METHOD_POST,
    99	            '/api/order/prints/direct/1',
   100	            ['ConnectionType' => 'GetRequest']
   101	        );
   102	
   103	        // Assert
   104	        $response = $this->client->getResponse();
   105	        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
   106	        $this->assertSame('application/octet-stream', $response->headers->get('Content-Type'));
   107	    }
   108	
   109	    /**
   110	     * orderDirectPrint - 正常系
   111	     * ConnectionType=SetResponse の場合、受注情報更新処理が正しい引数で呼出され、正常レスポンスが返却されること
   112	     *
   113	     * @group HARERUYA
   114	     */
   115	    public function testOrderDirectPrintSetResponseSuccess(): void
   116	    {
   117	        // Arrange
   118	        $orderDirectPrintActionMock = $this->createMock(OrderDirectPrintAction::class);
   119	        $orderDirectPrintActionMock
   120	            ->expects($this->never())
   121	            ->method('handle');
   122	        static::getContainer()->set(OrderDirectPrintAction::class, $orderDirectPrintActionMock);
   123	
   124	        $updatePrintedOrderStatusActionMock = $this->createMock(UpdatePrintedOrderStatusAction::class);
   125	        $updatePrintedOrderStatusActionMock
   126	            ->expects($this->once())
   127	            ->method('handle')
   128	            // コントローラから handle()が呼ばれた際に、引数が正しいことを確認する
   129	            ->with($this->callback(function (UpdatePrintedOrderStatusInput $Input): bool {
   130	                $this->assertSame('dummy_response.xml', $Input->responseFile);
   131	                $this->assertSame(1, $Input->base_info_id);
   132	
   133	                return true;
   134	            }));
   135	        static::getContainer()->set(UpdatePrintedOrderStatusAction::class, $updatePrintedOrderStatusActionMock);
   136	
   137	        // Act
   138	        $this->client->request(
   139	            Request::METHOD_POST,
   140	            '/api/order/prints/direct/1',
   141	            [
   142	                'ConnectionType' => 'SetResponse',
   143	                'ResponseFile' => 'dummy_response.xml',
   144	            ]
   145	        );
   146	
   147	        // Assert
   148	        $response = $this->client->getResponse();
   149	        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
   150	        $this->assertSame('text/xml; charset=utf-8', $response->headers->get('Content-Type'));
   151	    }
   152	
   153	    /**
   154	     * orderDirectPrint - 異常系
   155	     * ConnectionType が GetRequest/SetResponse 以外の場合、HTTP 400 Bad Request が返却されること
   156	     *
   157	     * @group HARERUYA
   158	     */
   159	    public function testOrderDirectPrintInvalidConnectionTypeReturnsBadRequest(): void
   160	    {
   161	        // Arrange
   162	        $orderDirectPrintActionMock = $this->createMock(OrderDirectPrintAction::class);
   163	        $orderDirectPrintActionMock
   164	            ->expects($this->never())
   165	            ->method('handle');
   166	        static::getContainer()->set(OrderDirectPrintAction::class, $orderDirectPrintActionMock);
   167	
   168	        $updatePrintedOrderStatusActionMock = $this->createMock(UpdatePrintedOrderStatusAction::class);
   169	        $updatePrintedOrderStatusActionMock
   170	            ->expects($this->never())
   171	            ->method('handle');
   172	        static::getContainer()->set(UpdatePrintedOrderStatusAction::class, $updatePrintedOrderStatusActionMock);
   173	
   174	        // Act
   175	        $this->client->request(
   176	            Request::METHOD_POST,
   177	            '/api/order/prints/direct/1',
   178	            ['ConnectionType' => 'InvalidType']
   179	        );
   180	
   181	        // Assert
   182	        $response = $this->client->getResponse();
   183	        $this->assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
   184	        $this->assertSame('text/plain; charset=utf-8', $response->headers->get('Content-Type'));
   185	    }
   186	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml | sed -n '1,110p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	security:
     2	    password_hashers:
     3	        legacy:
     4	            id: 'Eccube\Security\PasswordHasher\PasswordHasher'
     5	        Eccube\Entity\Customer:
     6	            algorithm: 'auto'
     7	            migrate_from:
     8	                - legacy
     9	        Eccube\Entity\Views\RegisterCustomerView:
    10	            algorithm: 'auto'
    11	            migrate_from:
    12	                - legacy
    13	        Eccube\Entity\Member:
    14	            algorithm: 'auto'
    15	            migrate_from:
    16	                - legacy
    17	    providers:
    18	        # https://symfony.com/doc/current/security.html#b-configuring-how-users-are-loaded
    19	        # In this example, users are stored via Doctrine in the database
    20	        # To see the users at src/App/DataFixtures/ORM/LoadFixtures.php
    21	        # To load users from somewhere else: https://symfony.com/doc/current/security/custom_provider.html
    22	        member_provider:
    23	            id: Eccube\Security\Core\User\MemberProvider
    24	        customer_provider:
    25	            id: Eccube\Security\Core\User\CustomerProvider
    26	    # https://symfony.com/doc/current/security.html#initial-security-yml-setup-authentication
    27	    firewalls:
    28	        dev:
    29	            pattern: ^/(_(profiler|wdt)|css|images|js)/
    30	            security: false
    31	        # EC-CUBEのリスナーがセッションを使用しているため、stateless: falseに設定。本当はtrueにしたい。
    32	        app:
    33	            pattern: ^/api/v1/
    34	            stateless: false
    35	            provider: member_provider
    36	            access_token:
    37	                token_handler: Eccube\Security\AccessToken\JwtTokenHandler
    38	                token_extractors:
    39	                    - Eccube\Security\AccessToken\JwtTokenHeaderExtractor
    40	        admin:
    41	            pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']
    42	            provider: member_provider
    43	            form_login:
    44	                enable_csrf: true
    45	                check_path: admin_login
    46	                login_path: admin_login
    47	                default_target_path: admin_homepage
    48	                username_parameter: 'login_id'
    49	                password_parameter: 'password'
    50	                use_forward: false
    51	                success_handler: eccube.security.success_handler
    52	                failure_handler: eccube.security.failure_handler
    53	            remember_me:
    54	                secret: '%kernel.secret%'
    55	                lifetime: 86400
    56	                name: '%eccube_rememberme_admin_cookie_name%'
    57	                always_remember_me: true
    58	                secure: true
    59	                samesite: none
    60	                token_provider:
    61	                  service: eccube.rememberme.redis_token_provider.member
    62	            login_throttling:
    63	                limiter: app.login_rate_limiter
    64	            logout:
    65	                path: admin_logout
    66	                target: admin_login
    67	        smaregi:
    68	            pattern: '^/%eccube_smaregi_webhook_route%/'
    69	            security: false
    70	        customer:
    71	            pattern: ^/
    72	            provider: customer_provider
    73	            remember_me:
    74	                secret: '%kernel.secret%'
    75	                lifetime: 86400
    76	                name: '%eccube_rememberme_cookie_name%'
    77	                remember_me_parameter: 'login_memory'
    78	                secure: true
    79	                samesite: none
    80	                token_provider:
    81	                  service: eccube.rememberme.redis_token_provider.customer
    82	            form_login:
    83	                enable_csrf: true
    84	                check_path: mypage_login
    85	                login_path: mypage_login
    86	                default_target_path: homepage
    87	                username_parameter: 'login_email'
    88	                password_parameter: 'login_pass'
    89	                use_forward: false
    90	                success_handler: eccube.security.success_handler
    91	                failure_handler: eccube.security.failure_handler
    92	            login_throttling:
    93	                max_attempts: 5
    94	                interval: '30 minutes'
    95	            logout:
    96	                path: logout
    97	                target: homepage
    98	
    99	    access_decision_manager:
   100	        strategy: unanimous
   101	        allow_if_all_abstain: false

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/OrderDirectPrintActionTest.php | sed -n '1,240p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Tests\Service\App\Order;
    17	
    18	use Eccube\Entity\BaseInfo;
    19	use Eccube\Repository\BaseInfoRepository;
    20	use Eccube\Repository\OrderRepository;
    21	use Eccube\Service\Admin\Order\ActionInput\OrderDirectPrintInput;
    22	use Eccube\Service\Admin\Order\OrderDirectPrintAction;
    23	use PHPUnit\Framework\MockObject\MockObject;
    24	use PHPUnit\Framework\TestCase;
    25	
    26	/**
    27	 * OrderDirectPrintAction::handle() のテスト
    28	 *
    29	 * 店頭印刷用 XML（PrintRequestInfo 内の ePOSPrint）を組み立てるアクション。
    30	 */
    31	final class OrderDirectPrintActionTest extends TestCase
    32	{
    33	    private BaseInfoRepository&MockObject $baseInfoRepository;
    34	
    35	    private OrderRepository&MockObject $orderRepository;
    36	
    37	    private OrderDirectPrintAction $action;
    38	
    39	    #[\Override]
    40	    protected function setUp(): void
    41	    {
    42	        $this->baseInfoRepository = $this->createMock(BaseInfoRepository::class);
    43	        $this->orderRepository = $this->createMock(OrderRepository::class);
    44	        $this->action = new OrderDirectPrintAction($this->baseInfoRepository, $this->orderRepository);
    45	    }
    46	
    47	    /**
    48	     * handle - 正常系
    49	     * $base_info_id が本店の場合、getPrintOrderListMainShop 経由で $xmlData が取得できること
    50	     *
    51	     * @group HARERUYA
    52	     */
    53	    public function testHandleReturnsXmlWhenMainShop(): void
    54	    {
    55	        // Arrange
    56	        $baseInfoId = 1;
    57	        // べースURL（テストのためなんでもOK）
    58	        $uri = 'http://localhost/';
    59	        $OrderRow = $this->createOrderDataRow(orderId: 101, orderNumber: '00000101');
    60	
    61	        $BaseInfo = $this->createMock(BaseInfo::class);
    62	        $BaseInfo->method('isMainShop')->willReturn(true);
    63	
    64	        $this->baseInfoRepository->expects($this->once())->method('find')->with($baseInfoId)->willReturn($BaseInfo);
    65	        $this->orderRepository
    66	            ->expects($this->once())
    67	            ->method('getPrintOrderListMainShop')
    68	            ->with($baseInfoId)
    69	            ->willReturn([$OrderRow]);
    70	        $this->orderRepository->expects($this->never())->method('getDirectPrintOrderList');
    71	
    72	        // Act
    73	        $xmlData = $this->action->handle(new OrderDirectPrintInput($uri, $baseInfoId));
    74	
    75	        // Assert
    76	        $this->assertXmlPrintRequestContainsOrder($xmlData, $uri, $OrderRow);
    77	    }
    78	
    79	    /**
    80	     * handle - 正常系
    81	     * $base_info_id が支店の場合、getDirectPrintOrderList 経由で $xmlData が取得できること
    82	     *
    83	     * @group HARERUYA
    84	     */
    85	    public function testHandleReturnsXmlWhenBranchShop(): void
    86	    {
    87	        // Arrange
    88	        $baseInfoId = 2;
    89	        // 本店テストと異なるベースURLを設定
    90	        $uri = 'http://localhost/branchStore/';
    91	        $OrderRow = $this->createOrderDataRow(orderId: 202, orderNumber: '00000202');
    92	
    93	        $BaseInfo = $this->createMock(BaseInfo::class);
    94	        $BaseInfo->method('isMainShop')->willReturn(false);
    95	
    96	        $this->baseInfoRepository->expects($this->once())->method('find')->with($baseInfoId)->willReturn($BaseInfo);
    97	        $this->orderRepository
    98	            ->expects($this->once())
    99	            ->method('getDirectPrintOrderList')
   100	            ->with($baseInfoId)
   101	            ->willReturn([$OrderRow]);
   102	        $this->orderRepository->expects($this->never())->method('getPrintOrderListMainShop');
   103	
   104	        // Act
   105	        $xmlData = $this->action->handle(new OrderDirectPrintInput($uri, $baseInfoId));
   106	
   107	        // Assert
   108	        $this->assertXmlPrintRequestContainsOrder($xmlData, $uri, $OrderRow);
   109	    }
   110	
   111	    /**
   112	     * handle - 正常系
   113	     * $OrderDataList が空の場合、空文字が返ること
   114	     *
   115	     * @group HARERUYA
   116	     */
   117	    public function testHandleReturnsEmptyStringWhenOrderDataListIsEmpty(): void
   118	    {
   119	        // Arrange
   120	        $baseInfoId = 3;
   121	        $uri = 'http://localhost/';
   122	        $BaseInfo = $this->createMock(BaseInfo::class);
   123	        $BaseInfo->method('isMainShop')->willReturn(false);
   124	
   125	        $this->baseInfoRepository->method('find')->willReturn($BaseInfo);
   126	        $this->orderRepository->method('getDirectPrintOrderList')->willReturn([]);
   127	
   128	        // Act
   129	        $xmlData = $this->action->handle(new OrderDirectPrintInput($uri, $baseInfoId));
   130	
   131	        // Assert
   132	        $this->assertSame('', $xmlData);
   133	    }
   134	
   135	    /**
   136	     * handle - 正常系
   137	     * BaseInfo が見つからない場合は getDirectPrintOrderList が呼ばれること
   138	     *
   139	     * @group HARERUYA
   140	     */
   141	    public function testHandleUsesGetDirectPrintOrderListWhenBaseInfoNotFound(): void
   142	    {
   143	        // Arrange
   144	        $baseInfoId = 99;
   145	        $uri = 'http://localhost/';
   146	        $OrderRow = $this->createOrderDataRow(orderId: 303, orderNumber: '00000303');
   147	
   148	        // BaseInfoIdをnullで返すように設定＝見つからない状態
   149	        $this->baseInfoRepository->expects($this->once())->method('find')->with($baseInfoId)->willReturn(null);
   150	        $this->orderRepository
   151	            ->expects($this->once())
   152	            ->method('getDirectPrintOrderList')
   153	            ->with($baseInfoId)
   154	            ->willReturn([$OrderRow]);
   155	        $this->orderRepository->expects($this->never())->method('getPrintOrderListMainShop');
   156	
   157	        // Act
   158	        $xmlData = $this->action->handle(new OrderDirectPrintInput($uri, $baseInfoId));
   159	
   160	        // Assert
   161	        $this->assertStringContainsString('<PrintRequestInfo Version="3.00">', $xmlData);
   162	        $this->assertStringContainsString((string) $OrderRow['order_number'], $xmlData);
   163	    }
   164	
   165	    /**
   166	     * handle - 正常系
   167	     * 受注が複数件ある場合、ePOSPrint ブロックが件数分連結され PrintRequestInfo で包まれること
   168	     *
   169	     * @group HARERUYA
   170	     */
   171	    public function testHandleConcatenatesMultipleEposPrintBlocksInPrintRequestInfo(): void
   172	    {
   173	        // Arrange
   174	        $baseInfoId = 4;
   175	        // 他ケースと見分けやすくするためベースURLを設定
   176	        $uri = 'http://localhost/multipleOrders/';
   177	        $rows = [
   178	            $this->createOrderDataRow(orderId: 1, orderNumber: '00000001'),
   179	            $this->createOrderDataRow(orderId: 2, orderNumber: '00000002'),
   180	        ];
   181	
   182	        $BaseInfo = $this->createMock(BaseInfo::class);
   183	        $BaseInfo->method('isMainShop')->willReturn(true);
   184	
   185	        $this->baseInfoRepository->method('find')->willReturn($BaseInfo);
   186	        $this->orderRepository->method('getPrintOrderListMainShop')->willReturn($rows);
   187	
   188	        // Act
   189	        $xmlData = $this->action->handle(new OrderDirectPrintInput($uri, $baseInfoId));
   190	
   191	        // Assert
   192	        $this->assertSame(2, substr_count($xmlData, '<ePOSPrint>'));
   193	        $this->assertSame(1, substr_count($xmlData, '<PrintRequestInfo Version="3.00">'));
   194	        $this->assertSame(1, substr_count($xmlData, '<?xml version="1.0" encoding="utf-8"?>'));
   195	    }
   196	
   197	    /**
   198	     * handle - 異常系
   199	     * baseInfoRepository::find が例外を投げた場合、その例外が再スローされること
   200	     *
   201	     * @group HARERUYA
   202	     */
   203	    public function testHandleRethrowsWhenBaseInfoRepositoryFindThrows(): void
   204	    {
   205	        // Arrange：エラー（例外）を発生させる
   206	        $ex = new \RuntimeException('find failed');
   207	        $this->baseInfoRepository->method('find')->willThrowException($ex);
   208	
   209	        // Assert：RuntimeExceptionが発生することを期待
   210	        $this->expectException(\RuntimeException::class);
   211	        $this->expectExceptionMessage('find failed');
   212	
   213	        // Act
   214	        $this->action->handle(new OrderDirectPrintInput('http://localhost/', 1));
   215	    }
   216	
   217	    /**
   218	     * handle - 異常系
   219	     * orderRepository::getPrintOrderListMainShop が例外を投げた場合、その例外が再スローされること
   220	     *
   221	     * @group HARERUYA
   222	     */
   223	    public function testHandleRethrowsWhenOrderRepositoryGetPrintOrderListMainShopThrows(): void
   224	    {
   225	        // Arrange
   226	        $baseInfoId = 5;
   227	        $ex = new \InvalidArgumentException('print list error');
   228	
   229	        $BaseInfo = $this->createMock(BaseInfo::class);
   230	        $BaseInfo->method('isMainShop')->willReturn(true);
   231	
   232	        // エラー（例外）を発生させる
   233	        $this->baseInfoRepository->method('find')->willReturn($BaseInfo);
   234	        $this->orderRepository->method('getPrintOrderListMainShop')->willThrowException($ex);
   235	
   236	        // Assert：InvalidArgumentExceptionが発生することを期待
   237	        $this->expectException(\InvalidArgumentException::class);
   238	        $this->expectExceptionMessage('print list error');
   239	
   240	        // Act

codex
テストも実装と同じ `/api/order/prints/direct/{id}` のPOST前提を固定しており、設計との差分を覆す根拠にはなりません。最後に候補の引用精度と、設計書自体の矛盾が重要度評価に影響するかを整理します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml | sed -n '101,190p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   101	        allow_if_all_abstain: false

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/OrderDirectPrintActionTest.php | sed -n '240,430p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   240	        // Act
   241	        $this->action->handle(new OrderDirectPrintInput('http://localhost/', $baseInfoId));
   242	    }
   243	
   244	    /**
   245	     * カスタム検証メソッド
   246	     *
   247	     * @param array<string, mixed> $OrderRow
   248	     */
   249	    private function assertXmlPrintRequestContainsOrder(string $xmlData, string $uri, array $OrderRow): void
   250	    {
   251	        // XMLデータの基本構造が想定通りかチェック
   252	        $this->assertStringContainsString('<?xml version="1.0" encoding="utf-8"?>', $xmlData);
   253	        $this->assertStringContainsString('<PrintRequestInfo Version="3.00">', $xmlData);
   254	        $this->assertStringContainsString('<ePOSPrint>', $xmlData);
   255	        // 受注データが指定通りかチェック
   256	        $this->assertStringContainsString((string) $OrderRow['order_number'], $xmlData);
   257	        $this->assertStringContainsString((string) $OrderRow['order_id'], $xmlData);
   258	        // QRコード用URLが正しいかチェック
   259	        $expectedQr = $uri.'admin/order/'.$OrderRow['order_id'].'/edit';
   260	        $this->assertStringContainsString($expectedQr, $xmlData);
   261	    }
   262	
   263	    /**
   264	     * 受注データのダミー（テストデータ）を1行分作成
   265	     *
   266	     * @return array<string, mixed>
   267	     */
   268	    private function createOrderDataRow(int $orderId, string $orderNumber): array
   269	    {
   270	        return [
   271	            'order_id' => $orderId,
   272	            'order_number' => $orderNumber,
   273	            'order_date' => new \DateTime('2026-04-23 12:00:00'),
   274	            'payment_total' => 12345,
   275	            'name_kana' => 'テスト',
   276	            'name' => 'テスト太郎',
   277	            'hasMessage' => false,
   278	            'smaregi_code' => '4901234567890',
   279	            'expensive' => '□',
   280	        ];
   281	    }
   282	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php | sed -n '1,190p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Service/App/Order/UpdatePrintedOrderStatusActionTest.php | sed -n '190,390p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Tests\Service\App\Order;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Entity\BaseInfo;
    20	use Eccube\Entity\Master\OrderStatus;
    21	use Eccube\Entity\Order;
    22	use Eccube\Repository\BaseInfoRepository;
    23	use Eccube\Repository\Master\OrderStatusRepository;
    24	use Eccube\Repository\OrderRepository;
    25	use Eccube\Service\Admin\Order\ActionInput\UpdatePrintedOrderStatusInput;
    26	use Eccube\Service\Admin\Order\UpdatePrintedOrderStatusAction;
    27	use PHPUnit\Framework\MockObject\MockObject;
    28	use PHPUnit\Framework\TestCase;
    29	use Psr\Log\LoggerInterface;
    30	
    31	/**
    32	 * UpdatePrintedOrderStatusAction::handle() のテスト
    33	 *
    34	 * 印刷レスポンス XML に応じて受注の印刷フラグ・ステータス・日時を更新するアクション。
    35	 */
    36	final class UpdatePrintedOrderStatusActionTest extends TestCase
    37	{
    38	    private EntityManagerInterface&MockObject $entityManager;
    39	
    40	    private BaseInfoRepository&MockObject $baseInfoRepository;
    41	
    42	    private OrderStatusRepository&MockObject $orderStatusRepository;
    43	
    44	    private OrderRepository&MockObject $orderRepository;
    45	
    46	    private LoggerInterface&MockObject $logger;
    47	
    48	    private UpdatePrintedOrderStatusAction $action;
    49	
    50	    #[\Override]
    51	    protected function setUp(): void
    52	    {
    53	        $this->entityManager = $this->createMock(EntityManagerInterface::class);
    54	        $this->baseInfoRepository = $this->createMock(BaseInfoRepository::class);
    55	        $this->orderStatusRepository = $this->createMock(OrderStatusRepository::class);
    56	        $this->orderRepository = $this->createMock(OrderRepository::class);
    57	        $this->logger = $this->createMock(LoggerInterface::class);
    58	        $this->action = new UpdatePrintedOrderStatusAction(
    59	            $this->entityManager,
    60	            $this->baseInfoRepository,
    61	            $this->orderStatusRepository,
    62	            $this->orderRepository,
    63	            $this->logger,
    64	        );
    65	    }
    66	
    67	    /**
    68	     * handle - 正常系
    69	     * pickingStatus がない場合、ステータス更新エラーがログに出力されること
    70	     *
    71	     * @group HARERUYA
    72	     */
    73	    public function testHandleLogsErrorWhenPickingStatusNotFound(): void
    74	    {
    75	        // Arrange
    76	        $responseFile = $this->createResponseXml(serverDirectPrint: 'true', printJobIds: ['100']);
    77	        $BaseInfo = $this->createMock(BaseInfo::class);
    78	        $this->baseInfoRepository->method('find')->with(1)->willReturn($BaseInfo);
    79	        // find(OrderStatus::PICKING) が null を返すように設定
    80	        $this->orderStatusRepository->method('find')->with(OrderStatus::PICKING)->willReturn(null);
    81	        $this->logger
    82	            ->expects($this->once())
    83	            ->method('error')
    84	            ->with('ステータス更新エラー：PICKINGステータスが存在しません。');
    85	        // トランザクションが呼ばれないことを期待
    86	        $this->entityManager->expects($this->never())->method('beginTransaction');
    87	
    88	        // Act
    89	        $this->action->handle(new UpdatePrintedOrderStatusInput($responseFile, 1));
    90	    }
    91	
    92	    /**
    93	     * handle - 正常系
    94	     * Order がない場合、ステータス更新エラーがログに出力されること
    95	     *
    96	     * @group HARERUYA
    97	     */
    98	    public function testHandleLogsErrorWhenOrderNotFound(): void
    99	    {
   100	        // Arrange
   101	        $responseFile = $this->createResponseXml(serverDirectPrint: 'true', printJobIds: ['123']);
   102	        $BaseInfo = $this->createMock(BaseInfo::class);
   103	        $PickingStatus = $this->createMock(OrderStatus::class);
   104	        $this->baseInfoRepository->method('find')->with(1)->willReturn($BaseInfo);
   105	        $this->orderStatusRepository->method('find')->with(OrderStatus::PICKING)->willReturn($PickingStatus);
   106	        // find(123) が null を返すように設定
   107	        $this->orderRepository->method('find')->with('123')->willReturn(null);
   108	        // 見つからない受注は無視し、ログだけ残して次に進む
   109	        $this->logger
   110	            ->expects($this->once())
   111	            ->method('error')
   112	            ->with('ステータス更新エラー：受注ID123が存在しません。');
   113	        $this->entityManager->expects($this->once())->method('beginTransaction');
   114	        $this->entityManager->expects($this->once())->method('commit');
   115	        // トランザクションは実行するが、更新（保存）は行わない
   116	        $this->entityManager->expects($this->never())->method('persist');
   117	        $this->entityManager->expects($this->never())->method('flush');
   118	
   119	        // Act
   120	        $this->action->handle(new UpdatePrintedOrderStatusInput($responseFile, 1));
   121	    }
   122	
   123	    /**
   124	     * handle - 正常系
   125	     * isBrowserPrintFlg が true の場合、false に更新されること
   126	     *
   127	     * @group HARERUYA
   128	     */
   129	    public function testHandleSetsBrowserPrintFlgFalseWhenTrue(): void
   130	    {
   131	        // Arrange
   132	        $responseFile = $this->createResponseXml(serverDirectPrint: 'true', printJobIds: ['101']);
   133	        $BaseInfo = $this->createMock(BaseInfo::class);
   134	        $PickingStatus = $this->createMock(OrderStatus::class);
   135	        $Order = $this->createMock(Order::class);
   136	        // isBrowserPrintFlg() が true を返すように設定
   137	        $Order->method('isBrowserPrintFlg')->willReturn(true);
   138	        // setBrowserPrintFlg(false) が呼ばれることを期待
   139	        $Order->expects($this->once())->method('setBrowserPrintFlg')->with(false)->willReturnSelf();
   140	        // フラグのクリアだけを行い、ステータス遷移等はスキップする
   141	        $Order->expects($this->never())->method('setOrderStatus');
   142	        $this->baseInfoRepository->method('find')->willReturn($BaseInfo);
   143	        $this->orderStatusRepository->method('find')->willReturn($PickingStatus);
   144	        $this->orderRepository->method('find')->with('101')->willReturn($Order);
   145	        $this->entityManager->expects($this->once())->method('beginTransaction');
   146	        $this->entityManager->expects($this->once())->method('persist')->with($Order);
   147	        $this->entityManager->expects($this->once())->method('flush');
   148	        $this->entityManager->expects($this->once())->method('commit');
   149	
   150	        // Act
   151	        $this->action->handle(new UpdatePrintedOrderStatusInput($responseFile, 1));
   152	    }
   153	
   154	    /**
   155	     * handle - 正常系
   156	     * isBrowserPrintFlg が false の場合、OrderStatus が PICKING に更新されること
   157	     *
   158	     * @group HARERUYA
   159	     */
   160	    public function testHandleSetsPickingStatusWhenBrowserPrintFlgFalse(): void
   161	    {
   162	        // Arrange
   163	        $responseFile = $this->createResponseXml(serverDirectPrint: 'true', printJobIds: ['102']);
   164	        $BaseInfo = $this->createMock(BaseInfo::class);
   165	        $BaseInfo->method('isMainShop')->willReturn(false);
   166	        $PickingStatus = $this->createMock(OrderStatus::class);
   167	        $Order = $this->createMock(Order::class);
   168	        // isBrowserPrintFlg() が false を返すように設定
   169	        $Order->method('isBrowserPrintFlg')->willReturn(false);
   170	        // 1回だけステータスがピック中に変更されることを期待
   171	        $Order->expects($this->once())->method('setOrderStatus')->with($PickingStatus)->willReturnSelf();
   172	        $this->baseInfoRepository->method('find')->willReturn($BaseInfo);
   173	        $this->orderStatusRepository->method('find')->willReturn($PickingStatus);
   174	        $this->orderRepository->method('find')->with('102')->willReturn($Order);
   175	        $this->entityManager->expects($this->once())->method('beginTransaction');
   176	        $this->entityManager->expects($this->once())->method('persist')->with($Order);
   177	        $this->entityManager->expects($this->once())->method('flush');
   178	        $this->entityManager->expects($this->once())->method('commit');
   179	
   180	        // Act
   181	        $this->action->handle(new UpdatePrintedOrderStatusInput($responseFile, 1));
   182	    }
   183	
   184	    /**
   185	     * handle - 正常系
   186	     * isBrowserPrintFlg が false かつ本店の場合、注文確定日が現在日時で更新されること
   187	     *
   188	     * @group HARERUYA
   189	     */
   190	    public function testHandleUpdatesConfirmDateForMainShopWhenBrowserPrintFlgFalse(): void
   190	    public function testHandleUpdatesConfirmDateForMainShopWhenBrowserPrintFlgFalse(): void
   191	    {
   192	        // Arrange
   193	        $responseFile = $this->createResponseXml(serverDirectPrint: 'true', printJobIds: ['103']);
   194	        $BaseInfo = $this->createMock(BaseInfo::class);
   195	        // 本店の場合
   196	        $BaseInfo->method('isMainShop')->willReturn(true);
   197	        $PickingStatus = $this->createMock(OrderStatus::class);
   198	        $Order = $this->createMock(Order::class);
   199	        // isBrowserPrintFlg() が false を返すように設定
   200	        $Order->method('isBrowserPrintFlg')->willReturn(false);
   201	        // 1回だけ注文確定日が更新されることを期待
   202	        $Order->expects($this->once())->method('setOrderStatus')->with($PickingStatus)->willReturnSelf();
   203	        $Order->expects($this->once())
   204	            ->method('setConfirmDate')
   205	            ->with($this->callback(fn ($value) => $value instanceof \DateTime))
   206	            ->willReturnSelf();
   207	        // ピック開始日は更新されないことを期待
   208	        $Order->expects($this->never())->method('setPickingDate');
   209	        $this->baseInfoRepository->method('find')->willReturn($BaseInfo);
   210	        $this->orderStatusRepository->method('find')->willReturn($PickingStatus);
   211	        $this->orderRepository->method('find')->with('103')->willReturn($Order);
   212	        $this->entityManager->expects($this->once())->method('beginTransaction');
   213	        $this->entityManager->expects($this->once())->method('persist')->with($Order);
   214	        $this->entityManager->expects($this->once())->method('flush');
   215	        $this->entityManager->expects($this->once())->method('commit');
   216	
   217	        // Act
   218	        $this->action->handle(new UpdatePrintedOrderStatusInput($responseFile, 1));
   219	    }
   220	
   221	    /**
   222	     * handle - 正常系
   223	     * isBrowserPrintFlg が false かつ支店の場合、ピック開始日が現在日時で更新されること
   224	     *
   225	     * @group HARERUYA
   226	     */
   227	    public function testHandleUpdatesPickingDateForBranchShopWhenBrowserPrintFlgFalse(): void
   228	    {
   229	        // Arrange
   230	        $responseFile = $this->createResponseXml(serverDirectPrint: 'true', printJobIds: ['104']);
   231	        $BaseInfo = $this->createMock(BaseInfo::class);
   232	        // 支店の場合
   233	        $BaseInfo->method('isMainShop')->willReturn(false);
   234	        $PickingStatus = $this->createMock(OrderStatus::class);
   235	        $Order = $this->createMock(Order::class);
   236	        // isBrowserPrintFlg() が false を返すように設定
   237	        $Order->method('isBrowserPrintFlg')->willReturn(false);
   238	        // 1回だけピック開始日が更新されることを期待
   239	        $Order->expects($this->once())->method('setOrderStatus')->with($PickingStatus)->willReturnSelf();
   240	        $Order->expects($this->once())
   241	            ->method('setPickingDate')
   242	            ->with($this->callback(fn ($value) => $value instanceof \DateTime))
   243	            ->willReturnSelf();
   244	        // 注文確定日は更新されないことを期待
   245	        $Order->expects($this->never())->method('setConfirmDate');
   246	        $this->baseInfoRepository->method('find')->willReturn($BaseInfo);
   247	        $this->orderStatusRepository->method('find')->willReturn($PickingStatus);
   248	        $this->orderRepository->method('find')->with('104')->willReturn($Order);
   249	        $this->entityManager->expects($this->once())->method('beginTransaction');
   250	        $this->entityManager->expects($this->once())->method('persist')->with($Order);
   251	        $this->entityManager->expects($this->once())->method('flush');
   252	        $this->entityManager->expects($this->once())->method('commit');
   253	
   254	        // Act
   255	        $this->action->handle(new UpdatePrintedOrderStatusInput($responseFile, 2));
   256	    }
   257	
   258	    /**
   259	     * handle - 正常系
   260	     * ServerDirectPrint が false の場合、responseFile がログ出力されること
   261	     *
   262	     * @group HARERUYA
   263	     */
   264	    public function testHandleLogsResponseFileWhenServerDirectPrintIsFalse(): void
   265	    {
   266	        // Arrange
   267	        $responseFile = $this->createResponseXml(serverDirectPrint: 'false', printJobIds: ['200']);
   268	        $this->logger->expects($this->once())->method('error')->with($responseFile);
   269	        $this->baseInfoRepository->expects($this->never())->method('find');
   270	        $this->entityManager->expects($this->never())->method('beginTransaction');
   271	
   272	        // Act
   273	        $this->action->handle(new UpdatePrintedOrderStatusInput($responseFile, 1));
   274	    }
   275	
   276	    /**
   277	     * handle - 正常系
   278	     * ePOSPrint が 0 件の場合、responseFile がログ出力されること
   279	     *
   280	     * @group HARERUYA
   281	     */
   282	    public function testHandleLogsResponseFileWhenEposPrintIsEmpty(): void
   283	    {
   284	        // Arrange
   285	        $responseFile = $this->createResponseXml(serverDirectPrint: 'true', printJobIds: []);
   286	        $this->logger->expects($this->once())->method('error')->with($responseFile);
   287	        $this->baseInfoRepository->expects($this->never())->method('find');
   288	        $this->entityManager->expects($this->never())->method('beginTransaction');
   289	
   290	        // Act
   291	        $this->action->handle(new UpdatePrintedOrderStatusInput($responseFile, 1));
   292	    }
   293	
   294	    /**
   295	     * handle - 正常系
   296	     * ePOSPrint が複数件で一部受注が見つからない場合でも、見つかった受注は更新されること
   297	     *
   298	     * @group HARERUYA
   299	     */
   300	    public function testHandleContinuesWhenSomeOrdersNotFoundInMultipleEposPrint(): void
   301	    {
   302	        // Arrange
   303	        $responseFile = $this->createResponseXml(serverDirectPrint: 'true', printJobIds: ['301', '302']);
   304	        $BaseInfo = $this->createMock(BaseInfo::class);
   305	        $BaseInfo->method('isMainShop')->willReturn(false);
   306	        $PickingStatus = $this->createMock(OrderStatus::class);
   307	        $FoundOrder = $this->createMock(Order::class);
   308	        $FoundOrder->method('isBrowserPrintFlg')->willReturn(false);
   309	        $FoundOrder->expects($this->once())->method('setOrderStatus')->with($PickingStatus)->willReturnSelf();
   310	        $FoundOrder->expects($this->once())->method('setPickingDate')->with($this->isInstanceOf(\DateTime::class))->willReturnSelf();
   311	        // find(301) が null を返すように設定
   312	        $this->baseInfoRepository->method('find')->willReturn($BaseInfo);
   313	        $this->orderStatusRepository->method('find')->willReturn($PickingStatus);
   314	        $this->orderRepository->expects($this->exactly(2))
   315	            ->method('find')
   316	            // 301は見つからないので無視し、302は見つかったのでFoundOrderを返す
   317	            ->willReturnCallback(fn (string $orderId) => match ($orderId) {
   318	                '301' => null,
   319	                '302' => $FoundOrder,
   320	                default => null,
   321	            });
   322	        $this->logger
   323	            ->expects($this->once())
   324	            ->method('error')
   325	            ->with('ステータス更新エラー：受注ID301が存在しません。');
   326	        $this->entityManager->expects($this->once())->method('beginTransaction');
   327	        $this->entityManager->expects($this->once())->method('persist')->with($FoundOrder);
   328	        $this->entityManager->expects($this->once())->method('flush');
   329	        $this->entityManager->expects($this->once())->method('commit');
   330	
   331	        // Act
   332	        $this->action->handle(new UpdatePrintedOrderStatusInput($responseFile, 1));
   333	    }
   334	
   335	    /**
   336	     * handle - 異常系
   337	     * flush が例外を投げた場合、rollback され例外が再スローされること
   338	     *
   339	     * @group HARERUYA
   340	     */
   341	    public function testHandleRollsBackAndRethrowsWhenFlushThrows(): void
   342	    {
   343	        // Arrange
   344	        $responseFile = $this->createResponseXml(serverDirectPrint: 'true', printJobIds: ['401']);
   345	        $BaseInfo = $this->createMock(BaseInfo::class);
   346	        $BaseInfo->method('isMainShop')->willReturn(true);
   347	        $PickingStatus = $this->createMock(OrderStatus::class);
   348	        $Order = $this->createMock(Order::class);
   349	        $Order->method('isBrowserPrintFlg')->willReturn(false);
   350	        $Order->method('setOrderStatus')->with($PickingStatus)->willReturnSelf();
   351	        $Order->method('setConfirmDate')->with($this->isInstanceOf(\DateTime::class))->willReturnSelf();
   352	
   353	        $this->baseInfoRepository->method('find')->willReturn($BaseInfo);
   354	        $this->orderStatusRepository->method('find')->willReturn($PickingStatus);
   355	        $this->orderRepository->method('find')->with('401')->willReturn($Order);
   356	        $this->entityManager->expects($this->once())->method('beginTransaction');
   357	        $this->entityManager->expects($this->once())->method('persist')->with($Order);
   358	        $this->entityManager->expects($this->once())->method('rollback');
   359	        // commit() は呼ばれないことを期待
   360	        $this->entityManager->expects($this->never())->method('commit');
   361	        // flush() が例外を投げるように設定
   362	        $this->entityManager->method('flush')->willThrowException(new \RuntimeException('flush failed'));
   363	
   364	        // Assert：RuntimeExceptionが発生することを期待
   365	        $this->expectException(\RuntimeException::class);
   366	        $this->expectExceptionMessage('flush failed');
   367	
   368	        // Act
   369	        $this->action->handle(new UpdatePrintedOrderStatusInput($responseFile, 1));
   370	    }
   371	
   372	    /**
   373	     * handle - 異常系
   374	     * orderRepository::find が例外を投げた場合、rollback され例外が再スローされること
   375	     *
   376	     * @group HARERUYA
   377	     */
   378	    public function testHandleRollsBackAndRethrowsWhenOrderRepositoryFindThrows(): void
   379	    {
   380	        // Arrange
   381	        $responseFile = $this->createResponseXml(serverDirectPrint: 'true', printJobIds: ['402']);
   382	        $BaseInfo = $this->createMock(BaseInfo::class);
   383	        $PickingStatus = $this->createMock(OrderStatus::class);
   384	        $this->baseInfoRepository->method('find')->willReturn($BaseInfo);
   385	        $this->orderStatusRepository->method('find')->willReturn($PickingStatus);
   386	        // find(402) が例外を投げるように設定
   387	        $this->orderRepository->method('find')->with('402')->willThrowException(new \RuntimeException('find failed'));
   388	        $this->entityManager->expects($this->once())->method('beginTransaction');
   389	        $this->entityManager->expects($this->once())->method('rollback');
   390	        // commit() は呼ばれないことを期待

codex
FALSE_POSITIVE | 全finding | 誤検知は確認できません。7件とも参照行は実在し、別ルート・別実装で設計どおり実現している根拠も見つかりませんでした。 | `OrderController.php:43`, `OrderDirectPrintAction.php:44`, `OrderRepository.php:1508`, `OrderRepository.php:1565` | 候補は基本的に維持。

WEAK_EVIDENCE | 全finding | designRef/implRefの不存在、引用の創作、参照先の的外れは確認できません。 | `a05-01_api_order_print_direct.html:238`, `:247`, `:249`, `:265`, `:298`, `:310`; `OrderController.php:43`, `:57`, `:91`; `OrderDirectPrintAction.php:74`, `:97`, `:129`; `UpdatePrintedOrderStatusAction.php:91` | 根拠不備としての修正は不要。

MISSED | ④DBカラム・DB操作 | 設計書のDB操作節は「本機能は参照系であり、DBへの登録・更新・削除は行わない」と書く一方、実装はSetResponseで受注を更新する。既存findingは日時列差分を指摘しているが、このDB操作節そのものとの不一致、かつ設計書内部の矛盾を明示していない。 | `a05-01_api_order_print_direct.html:312`, `UpdatePrintedOrderStatusAction.php:87`, `UpdatePrintedOrderStatusAction.php:90`, `UpdatePrintedOrderStatusAction.php:99` | findingsに「DB操作節の記載は処理フロー/副作用節と矛盾。実装差分として扱う場合は設計側の正本解釈が必要」と追記。

SEVERITY | ④DBカラム・DB操作 | UpdatePrintedOrderStatusActionの日時列差分はmed据え置きが妥当。設計の処理フローはconfirm_date、DBカラム節はpicking_date・pick_finish_date、DB操作節は更新なしで揺れており、high断定は根拠が弱い。 | `a05-01_api_order_print_direct.html:249`, `a05-01_api_order_print_direct.html:310`, `a05-01_api_order_print_direct.html:312`, `UpdatePrintedOrderStatusAction.php:91` | severityはmed維持。設計の列指定を先に確定する。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
85,525
FALSE_POSITIVE | 全finding | 誤検知は確認できません。7件とも参照行は実在し、別ルート・別実装で設計どおり実現している根拠も見つかりませんでした。 | `OrderController.php:43`, `OrderDirectPrintAction.php:44`, `OrderRepository.php:1508`, `OrderRepository.php:1565` | 候補は基本的に維持。

WEAK_EVIDENCE | 全finding | designRef/implRefの不存在、引用の創作、参照先の的外れは確認できません。 | `a05-01_api_order_print_direct.html:238`, `:247`, `:249`, `:265`, `:298`, `:310`; `OrderController.php:43`, `:57`, `:91`; `OrderDirectPrintAction.php:74`, `:97`, `:129`; `UpdatePrintedOrderStatusAction.php:91` | 根拠不備としての修正は不要。

MISSED | ④DBカラム・DB操作 | 設計書のDB操作節は「本機能は参照系であり、DBへの登録・更新・削除は行わない」と書く一方、実装はSetResponseで受注を更新する。既存findingは日時列差分を指摘しているが、このDB操作節そのものとの不一致、かつ設計書内部の矛盾を明示していない。 | `a05-01_api_order_print_direct.html:312`, `UpdatePrintedOrderStatusAction.php:87`, `UpdatePrintedOrderStatusAction.php:90`, `UpdatePrintedOrderStatusAction.php:99` | findingsに「DB操作節の記載は処理フロー/副作用節と矛盾。実装差分として扱う場合は設計側の正本解釈が必要」と追記。

SEVERITY | ④DBカラム・DB操作 | UpdatePrintedOrderStatusActionの日時列差分はmed据え置きが妥当。設計の処理フローはconfirm_date、DBカラム節はpicking_date・pick_finish_date、DB操作節は更新なしで揺れており、high断定は根拠が弱い。 | `a05-01_api_order_print_direct.html:249`, `a05-01_api_order_print_direct.html:310`, `a05-01_api_order_print_direct.html:312`, `UpdatePrintedOrderStatusAction.php:91` | severityはmed維持。設計の列指定を先に確定する。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
