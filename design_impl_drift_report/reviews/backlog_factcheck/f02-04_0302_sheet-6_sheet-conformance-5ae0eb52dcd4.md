# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f02-04_0302_sheet-6_sheet.json#f02-04_0302_sheet-6_sheet-conformance-5ae0eb52dcd4`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f02-04_0302_sheet-6_sheet.json`
- sourceFindingId: `f02-04_0302_sheet-6_sheet-conformance-5ae0eb52dcd4`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f02-04_0302_sheet-6_sheet` / F02-04 支店スマホ版ナビゲーション
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 店舗紹介ページのスマホ・タブレット表示で『閲覧店舗を選択』とともに並び順付きの全店舗一覧（タブレット用店舗一覧）を表示し、表示中の店舗を選択状態にする。店舗リンク押下で選択店舗の店舗紹介ページ（GET /{_locale}/shoppage/{name} 相当）へ遷移。
- implementationActual: 支店フロント（ShopTop）に『閲覧店舗を選択』付きのタブレット用店舗一覧が存在しない。支店ヘッダ（branch_header.twig）にも複数店舗を並べて切替する店舗一覧 UI は無く、旧 shoppage 相当の独立ルートも無い。支店ルートは ShopTopController の /{_locale}{_shop}/ のみ。
- mismatchReason: front テンプレートで『閲覧店舗を選択』は 0 件（admin/mall/tenant/index.twig のみ）。イベント側の店舗切替セレクト（Event/index.twig）は店舗紹介ページの店舗一覧ではなく別物。旧 shoppage 由来 UI が未移植と見られる。
- designRefDetail: 0302_基本設計仕様書(フロント_グローバルナビ).html#sheet-6（用語『タブレット用店舗一覧』／フロント挙動／処理フロー②／画面遷移）
- implRef: 不在（支店フロントテンプレート全域で『閲覧店舗を選択』0 件／shop_top.twig・branch_header.twig に店舗切替用店舗一覧なし）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f02-04_0302_sheet-6_sheet-conformance-5ae0eb52dcd4",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "0302_基本設計仕様書(フロント_グローバルナビ).html#sheet-6",
  "designRefDetail": "0302_基本設計仕様書(フロント_グローバルナビ).html#sheet-6（用語『タブレット用店舗一覧』／フロント挙動／処理フロー②／画面遷移）",
  "designExpectation": "店舗紹介ページのスマホ・タブレット表示で『閲覧店舗を選択』とともに並び順付きの全店舗一覧（タブレット用店舗一覧）を表示し、表示中の店舗を選択状態にする。店舗リンク押下で選択店舗の店舗紹介ページ（GET /{_locale}/shoppage/{name} 相当）へ遷移。",
  "designQuote": "店舗紹介ページのスマホ・タブレット表示で『閲覧店舗を選択』とともに並び順付きの全店舗一覧（タブレット用店舗一覧）を表示し、表示中の店舗を選択状態にする。店舗リンク押下で選択店舗の店舗紹介ページ（GET /{_locale}/shoppage/{name} 相当）へ遷移。",
  "implRef": "不在（支店フロントテンプレート全域で『閲覧店舗を選択』0 件／shop_top.twig・branch_header.twig に店舗切替用店舗一覧なし）",
  "implementationActual": "支店フロント（ShopTop）に『閲覧店舗を選択』付きのタブレット用店舗一覧が存在しない。支店ヘッダ（branch_header.twig）にも複数店舗を並べて切替する店舗一覧 UI は無く、旧 shoppage 相当の独立ルートも無い。支店ルートは ShopTopController の /{_locale}{_shop}/ のみ。",
  "difference": "front テンプレートで『閲覧店舗を選択』は 0 件（admin/mall/tenant/index.twig のみ）。イベント側の店舗切替セレクト（Event/index.twig）は店舗紹介ページの店舗一覧ではなく別物。旧 shoppage 由来 UI が未移植と見られる。",
  "mismatchReason": "front テンプレートで『閲覧店舗を選択』は 0 件（admin/mall/tenant/index.twig のみ）。イベント側の店舗切替セレクト（Event/index.twig）は店舗紹介ページの店舗一覧ではなく別物。旧 shoppage 由来 UI が未移植と見られる。",
  "comparisonRows": [
    {
      "item": "タブレット用店舗一覧（閲覧店舗を選択）",
      "design": "並び順付き全店舗一覧＋『閲覧店舗を選択』、表示中を選択状態、押下で店舗紹介ページ遷移",
      "implementation": "描画経路なし",
      "mismatch": "未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f02-04_0302_sheet-6_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（支店フロントテンプレート全域で『閲覧店舗を選択』0 件／shop_top.twig・branch_header.twig に店舗切替用店舗一覧なし）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「店舗紹介ページのスマホ・タブレット表示で『閲覧店舗を選択』とともに並び順付きの全店舗一覧（タブレット用店舗一覧）を表示し、表示中の店舗を選択状態にする。店舗リンク押下で選択店舗の店舗紹介ページ（GET /{_locale}/shoppage/{name} 相当）へ遷移。」。実装は「支店フロント（ShopTop）に『閲覧店舗を選択』付きのタブレット用店舗一覧が存在しない。支店ヘッダ（branch_header.twig）にも複数店舗を並べて切替する店舗一覧 UI は無く、旧 shoppage 相当の独立ルートも無い。支店ルートは ShopTopController の /{_locale}{_shop}/ のみ。」。乖離理由は「front テンプレートで『閲覧店舗を選択』は 0 件（admin/mall/tenant/index.twig のみ）。イベント側の店舗切替セレクト（Event/index.twig）は店舗紹介ページの店舗一覧ではなく別物。旧 shoppage 由来 UI が未移植と見られる。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Twig・画面表示"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "不在（支店フロントテンプレート全域で『閲覧店舗を選択』0 件／shop_top.twig・branch_header.twig に店舗切替用店舗一覧なし）"
  ],
  "implementationSnippets": [],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
