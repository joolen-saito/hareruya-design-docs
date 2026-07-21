# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-22_0306_sheet-18_sheet.json#f06-22_0306_sheet-18_sheet-conformance-cb0347cd1fd9`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-22_0306_sheet-18_sheet.json`
- sourceFindingId: `f06-22_0306_sheet-18_sheet-conformance-cb0347cd1fd9`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-22_0306_sheet-18_sheet` / F06-22 お問い合わせ
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 案内文『当店へのご要望は、下記フォームにご記入のうえ送信してください。』(英: To contact the shop, please fill out the form below.)を入力画面・確認画面に常時表示する
- implementationActual: index.twig はガイドバナー(help_guide)と h1 見出しのみで案内文段落が無い。翻訳(messages.ja.yaml/en.yaml)を grep しても『当店へのご要望』『To contact the shop』は0件。confirm.twig は別文言(front.contact.confirm_lead_before_br)を表示。front.contact.order_notice は定義のみで全テンプレ未使用。
- mismatchReason: 設計指定の案内文が入力画面・確認画面いずれにも表示されておらず、翻訳キーにも該当文言が存在しない。
- designRefDetail: 0306_基本設計仕様書(フロント_会員).html#sheet-18:236,250 (表示メッセージ 常時表示/案内)
- implRef: src/Eccube/Resource/template/default/Contact/index.twig:63-65 付近（不在）/ confirm.twig:27-28

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-22_0306_sheet-18_sheet-conformance-cb0347cd1fd9",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "0306_基本設計仕様書(フロント_会員).html#sheet-18:236,250",
  "designRefDetail": "0306_基本設計仕様書(フロント_会員).html#sheet-18:236,250 (表示メッセージ 常時表示/案内)",
  "designExpectation": "案内文『当店へのご要望は、下記フォームにご記入のうえ送信してください。』(英: To contact the shop, please fill out the form below.)を入力画面・確認画面に常時表示する",
  "designQuote": "案内文『当店へのご要望は、下記フォームにご記入のうえ送信してください。』(英: To contact the shop, please fill out the form below.)を入力画面・確認画面に常時表示する",
  "implRef": "src/Eccube/Resource/template/default/Contact/index.twig:63-65 付近（不在）/ confirm.twig:27-28",
  "implementationActual": "index.twig はガイドバナー(help_guide)と h1 見出しのみで案内文段落が無い。翻訳(messages.ja.yaml/en.yaml)を grep しても『当店へのご要望』『To contact the shop』は0件。confirm.twig は別文言(front.contact.confirm_lead_before_br)を表示。front.contact.order_notice は定義のみで全テンプレ未使用。",
  "difference": "設計指定の案内文が入力画面・確認画面いずれにも表示されておらず、翻訳キーにも該当文言が存在しない。",
  "mismatchReason": "設計指定の案内文が入力画面・確認画面いずれにも表示されておらず、翻訳キーにも該当文言が存在しない。",
  "comparisonRows": [
    {
      "item": "案内文の表示",
      "design": "『当店へのご要望は、下記フォームにご記入のうえ送信してください。』を常時表示",
      "implementation": "該当文言なし（バナー+h1のみ、確認画面は別文言）",
      "mismatch": "設計案内文が不在"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-22_0306_sheet-18_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Contact/index.twig:63-65 付近（不在）/ confirm.twig:27-28",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「案内文『当店へのご要望は、下記フォームにご記入のうえ送信してください。』(英: To contact the shop, please fill out the form below.)を入力画面・確認画面に常時表示する」。実装は「index.twig はガイドバナー(help_guide)と h1 見出しのみで案内文段落が無い。翻訳(messages.ja.yaml/en.yaml)を grep しても『当店へのご要望』『To contact the shop』は0件。confirm.twig は別文言(front.contact.confirm_lead_before_br)を表示。front.contact.order_notice は定義のみで全テンプレ未使用。」。乖離理由は「設計指定の案内文が入力画面・確認画面いずれにも表示されておらず、翻訳キーにも該当文言が存在しない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Form・入力項目",
    "Twig・画面表示"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Contact/index.twig:63-65",
    "src/Eccube/Resource/template/default/Contact/index.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Contact/index.twig:63\n60:                     >\n61:                 </a>\n62:             </div>\n63:             <div class=\"p-hareruya-entry__title\">\n64:                 <h1 class=\"c-hareruya-heading--lev1\">{{ 'front.contact.title'|trans }}</h1>\n65:             </div>\n66: ",
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
