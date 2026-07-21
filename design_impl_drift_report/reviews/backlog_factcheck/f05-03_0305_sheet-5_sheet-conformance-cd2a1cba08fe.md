# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f05-03_0305_sheet-5_sheet.json#f05-03_0305_sheet-5_sheet-conformance-cd2a1cba08fe`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f05-03_0305_sheet-5_sheet.json`
- sourceFindingId: `f05-03_0305_sheet-5_sheet-conformance-cd2a1cba08fe`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f05-03_0305_sheet-5_sheet` / F05-03 ネット買取商品一覧
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 買取特集タグが1件指定のとき、そのタグの説明文（フリーエリア）を買取商品一覧の上部に表示する。
- implementationActual: PurchaseController::search はタグ説明文（フリーエリア）を解決・返却せず、search.twig でも一覧上部にタグ説明文を描画する箇所が無い。tags は検索用フォーム項目のみ。販売側 ProductController は getFreeAreaJp/En でタグのフリーエリアHTMLを一覧上部に出しているが買取側に同等処理が無い。
- mismatchReason: 設計は買取一覧の表示要素として『買取特集タグ説明（該当時）』を挙げ1件指定時のフリーエリア表示を明記。入口(search)・テンプレート(search.twig)・買取Blockを探索したが該当表示は不在。Tagエンティティに free_area 列はあるが買取一覧で参照していない（getFreeArea 呼び出しが Front/Purchase 配下に0件）。
- designRefDetail: excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-5（フロント挙動 表示要素／表示メッセージ『買取特集タグが1件指定のときは、タグの説明文（フリーエリア）を一覧上部に表示する』）
- implRef: 不在（探索: src/Eccube/Controller/Front/Purchase/PurchaseController.php search()返却配列、src/Eccube/Resource/template/default/Purchase/search.twig、getFreeArea参照なし）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f05-03_0305_sheet-5_sheet-conformance-cd2a1cba08fe",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-5",
  "designRefDetail": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-5（フロント挙動 表示要素／表示メッセージ『買取特集タグが1件指定のときは、タグの説明文（フリーエリア）を一覧上部に表示する』）",
  "designExpectation": "買取特集タグが1件指定のとき、そのタグの説明文（フリーエリア）を買取商品一覧の上部に表示する。",
  "designQuote": "買取特集タグが1件指定のとき、そのタグの説明文（フリーエリア）を買取商品一覧の上部に表示する。",
  "implRef": "不在（探索: src/Eccube/Controller/Front/Purchase/PurchaseController.php search()返却配列、src/Eccube/Resource/template/default/Purchase/search.twig、getFreeArea参照なし）",
  "implementationActual": "PurchaseController::search はタグ説明文（フリーエリア）を解決・返却せず、search.twig でも一覧上部にタグ説明文を描画する箇所が無い。tags は検索用フォーム項目のみ。販売側 ProductController は getFreeAreaJp/En でタグのフリーエリアHTMLを一覧上部に出しているが買取側に同等処理が無い。",
  "difference": "設計は買取一覧の表示要素として『買取特集タグ説明（該当時）』を挙げ1件指定時のフリーエリア表示を明記。入口(search)・テンプレート(search.twig)・買取Blockを探索したが該当表示は不在。Tagエンティティに free_area 列はあるが買取一覧で参照していない（getFreeArea 呼び出しが Front/Purchase 配下に0件）。",
  "mismatchReason": "設計は買取一覧の表示要素として『買取特集タグ説明（該当時）』を挙げ1件指定時のフリーエリア表示を明記。入口(search)・テンプレート(search.twig)・買取Blockを探索したが該当表示は不在。Tagエンティティに free_area 列はあるが買取一覧で参照していない（getFreeArea 呼び出しが Front/Purchase 配下に0件）。",
  "comparisonRows": [
    {
      "item": "タグ1件指定時のタグ説明文表示",
      "design": "タグのフリーエリア説明文を一覧上部に表示",
      "implementation": "解決・描画とも無し（tagsは検索フィルタのみ）",
      "mismatch": "買取特集タグ説明の表示が未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f05-03_0305_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（探索: src/Eccube/Controller/Front/Purchase/PurchaseController.php search()返却配列、src/Eccube/Resource/template/default/Purchase/search.twig、getFreeArea参照なし）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「買取特集タグが1件指定のとき、そのタグの説明文（フリーエリア）を買取商品一覧の上部に表示する。」。実装は「PurchaseController::search はタグ説明文（フリーエリア）を解決・返却せず、search.twig でも一覧上部にタグ説明文を描画する箇所が無い。tags は検索用フォーム項目のみ。販売側 ProductController は getFreeAreaJp/En でタグのフリーエリアHTMLを一覧上部に出しているが買取側に同等処理が無い。」。乖離理由は「設計は買取一覧の表示要素として『買取特集タグ説明（該当時）』を挙げ1件指定時のフリーエリア表示を明記。入口(search)・テンプレート(search.twig)・買取Blockを探索したが該当表示は不在。Tagエンティティに free_area 列はあるが買取一覧で参照していない（getFreeArea 呼び出しが Front/Purchase 配下に0件）。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Form・入力項目",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1628\n1625:       </section>\n1626:       <!-- function-design-embed:end f05-02-f05-02_front_online_purchase_buy_product_search -->\n1627: </section>\n1628:       <section class=\"sheet-panel\" id=\"sheet-5\">\n1629:         <div class=\"sheet-heading\">\n1630:           <h2>ネット買取商品一覧</h2>\n1631:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/Purchase/PurchaseController.php",
    "src/Eccube/Resource/template/default/Purchase/search.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/Purchase/PurchaseController.php:65\n62: /**\n63:  * フロント買取画面\n64:  */\n65: class PurchaseController extends AbstractController\n66: {\n67:     /**\n68:      * 買取カートのセッションキー",
    "src/Eccube/Resource/template/default/Purchase/search.twig:1\n1: {#\n2:   買取商品検索一覧\n3: #}\n4: {% extends 'default_frame.twig' %}"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
