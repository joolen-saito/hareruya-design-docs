# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-22_0306_sheet-18_sheet.json#f06-22_0306_sheet-18_sheet-conformance-da1de78be63d`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-22_0306_sheet-18_sheet.json`
- sourceFindingId: `f06-22_0306_sheet-18_sheet-conformance-da1de78be63d`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-22_0306_sheet-18_sheet` / F06-22 お問い合わせ
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: (1-10)戻る ボタン: 押下するとブラウザの履歴から1つ前のページに遷移する
- implementationActual: 「戻る」は <a href="{{ url('homepage') }}"> の静的リンクで常に本店ECTOP(homepage)へ遷移。ContactController/index.twig/Block/js/contact_js.twig に history.back 相当の onclick 等は存在しない。
- mismatchReason: 設計はブラウザ履歴の直前ページへ遷移する指定。実装は homepage への固定リンクで遷移先が異なる。
- designRefDetail: 0306_基本設計仕様書(フロント_会員).html#sheet-18:78 (レイアウト表 1-10)
- implRef: src/Eccube/Resource/template/default/Contact/index.twig:388

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-22_0306_sheet-18_sheet-conformance-da1de78be63d",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "0306_基本設計仕様書(フロント_会員).html#sheet-18:78",
  "designRefDetail": "0306_基本設計仕様書(フロント_会員).html#sheet-18:78 (レイアウト表 1-10)",
  "designExpectation": "(1-10)戻る ボタン: 押下するとブラウザの履歴から1つ前のページに遷移する",
  "designQuote": "(1-10)戻る ボタン: 押下するとブラウザの履歴から1つ前のページに遷移する",
  "implRef": "src/Eccube/Resource/template/default/Contact/index.twig:388",
  "implementationActual": "「戻る」は <a href=\"{{ url('homepage') }}\"> の静的リンクで常に本店ECTOP(homepage)へ遷移。ContactController/index.twig/Block/js/contact_js.twig に history.back 相当の onclick 等は存在しない。",
  "difference": "設計はブラウザ履歴の直前ページへ遷移する指定。実装は homepage への固定リンクで遷移先が異なる。",
  "mismatchReason": "設計はブラウザ履歴の直前ページへ遷移する指定。実装は homepage への固定リンクで遷移先が異なる。",
  "comparisonRows": [
    {
      "item": "戻るボタンの遷移先",
      "design": "ブラウザ履歴の1つ前のページ (history.back)",
      "implementation": "homepage への静的リンク",
      "mismatch": "遷移先が固定URLで履歴戻りにならない"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-22_0306_sheet-18_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Contact/index.twig:388",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「(1-10)戻る ボタン: 押下するとブラウザの履歴から1つ前のページに遷移する」。実装は「「戻る」は <a href=\"{{ url('homepage') }}\"> の静的リンクで常に本店ECTOP(homepage)へ遷移。ContactController/index.twig/Block/js/contact_js.twig に history.back 相当の onclick 等は存在しない。」。乖離理由は「設計はブラウザ履歴の直前ページへ遷移する指定。実装は homepage への固定リンクで遷移先が異なる。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Twig・画面表示"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Contact/index.twig:388",
    "src/Eccube/Resource/template/default/Contact/index.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Contact/index.twig:388\n385:                                 <span>{{ 'front.contact.go_to_confirm'|trans }}</span>\n386:                                 <i class=\"icon-hareruya-arrow-right c-hareruya-icon--xs\" aria-hidden=\"true\"></i>\n387:                             </button>\n388:                             <a class=\"c-hareruya-btn c-hareruya-btn--lg\" href=\"{{ url('homepage') }}\">{{ 'common.back'|trans }}</a>\n389:                         </div>\n390:                     </div>\n391:                 </form>",
    "src/Eccube/Resource/template/default/Contact/index.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
