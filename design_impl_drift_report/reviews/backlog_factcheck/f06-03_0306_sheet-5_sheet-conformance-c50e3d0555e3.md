# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-03_0306_sheet-5_sheet.json#f06-03_0306_sheet-5_sheet-conformance-c50e3d0555e3`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-03_0306_sheet-5_sheet.json`
- sourceFindingId: `f06-03_0306_sheet-5_sheet-conformance-c50e3d0555e3`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-03_0306_sheet-5_sheet` / F06-03 ログイン
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 会員ログイン画面に、旧サイト会員向けの常時表示案内『旧サイトで会員登録がお済みの方へ、パスワード再設定のお願い / システムの移行に伴い、新サイトに初めてログインする際には「パスワード」の再設定をお願いします。』を表示する。
- implementationActual: login.twig は『会員の方』(L30〜)と『初めてご利用の方』(L100〜)の2ブロックのみで、旧サイト会員向けパスワード再設定案内ブロックが無い。対応する翻訳キー・文言(旧サイト/再設定のお願い/システムの移行)も src/Eccube 配下・html 配下の grep で0件。
- mismatchReason: 設計は常時表示の静的案内として明記。login.twig 全体・messages.ja.yaml/validators.ja.yaml・src/Eccube/html 配下 grep で該当文言の描画箇所が見当たらない。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-5 (表示メッセージ『常時表示』旧サイト会員案内・フロント挙動 表示要素『旧サイト会員向けのパスワード再設定案内を表示する』／sheet5抽出 L94,111)
- implRef: 不在

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-03_0306_sheet-5_sheet-conformance-c50e3d0555e3",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-5",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-5 (表示メッセージ『常時表示』旧サイト会員案内・フロント挙動 表示要素『旧サイト会員向けのパスワード再設定案内を表示する』／sheet5抽出 L94,111)",
  "designExpectation": "会員ログイン画面に、旧サイト会員向けの常時表示案内『旧サイトで会員登録がお済みの方へ、パスワード再設定のお願い / システムの移行に伴い、新サイトに初めてログインする際には「パスワード」の再設定をお願いします。』を表示する。",
  "designQuote": "会員ログイン画面に、旧サイト会員向けの常時表示案内『旧サイトで会員登録がお済みの方へ、パスワード再設定のお願い / システムの移行に伴い、新サイトに初めてログインする際には「パスワード」の再設定をお願いします。』を表示する。",
  "implRef": "不在",
  "implementationActual": "login.twig は『会員の方』(L30〜)と『初めてご利用の方』(L100〜)の2ブロックのみで、旧サイト会員向けパスワード再設定案内ブロックが無い。対応する翻訳キー・文言(旧サイト/再設定のお願い/システムの移行)も src/Eccube 配下・html 配下の grep で0件。",
  "difference": "設計は常時表示の静的案内として明記。login.twig 全体・messages.ja.yaml/validators.ja.yaml・src/Eccube/html 配下 grep で該当文言の描画箇所が見当たらない。",
  "mismatchReason": "設計は常時表示の静的案内として明記。login.twig 全体・messages.ja.yaml/validators.ja.yaml・src/Eccube/html 配下 grep で該当文言の描画箇所が見当たらない。",
  "comparisonRows": [
    {
      "item": "旧サイト会員向け案内ブロック",
      "design": "常時表示で描画",
      "implementation": "login.twig に該当ブロック無し",
      "mismatch": "未実装"
    },
    {
      "item": "案内文言の翻訳キー",
      "design": "『旧サイト/再設定のお願い/システムの移行』の文言を保持",
      "implementation": "locale/テンプレート grep で0件",
      "mismatch": "不在"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-03_0306_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「会員ログイン画面に、旧サイト会員向けの常時表示案内『旧サイトで会員登録がお済みの方へ、パスワード再設定のお願い / システムの移行に伴い、新サイトに初めてログインする際には「パスワード」の再設定をお願いします。』を表示する。」。実装は「login.twig は『会員の方』(L30〜)と『初めてご利用の方』(L100〜)の2ブロックのみで、旧サイト会員向けパスワード再設定案内ブロックが無い。対応する翻訳キー・文言(旧サイト/再設定のお願い/システムの移行)も src/Eccube 配下・html 配下の grep で0件。」。乖離理由は「設計は常時表示の静的案内として明記。login.twig 全体・messages.ja.yaml/validators.ja.yaml・src/Eccube/html 配下 grep で該当文言の描画箇所が見当たらない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Repository・Entity・DB",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1885\n1882:       </section>\n1883:       <!-- function-design-embed:end f06-02-f06-02_front_member_entry_activate -->\n1884: </section>\n1885:       <section class=\"sheet-panel\" id=\"sheet-5\">\n1886:         <div class=\"sheet-heading\">\n1887:           <h2>ログイン</h2>\n1888:         </div>",
  "implementationRefs": [],
  "implementationSnippets": [],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
