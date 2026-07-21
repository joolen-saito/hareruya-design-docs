# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f02-04_0302_sheet-6_sheet.json#f02-04_0302_sheet-6_sheet-conformance-add7cac61ff8`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f02-04_0302_sheet-6_sheet.json`
- sourceFindingId: `f02-04_0302_sheet-6_sheet-conformance-add7cac61ff8`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f02-04_0302_sheet-6_sheet` / F02-04 支店スマホ版ナビゲーション
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 店舗紹介ページのスマホ表示で、登録済みの右カラム項目だけをセクションナビへ並べ（値の無いセクションは非表示）、『店舗案内・初心者講習会・取り扱い商品・買取・スタッフ・その他・アクセス』の定義順で表示、出力順の末尾要素へ末尾用クラスを付与。押下で同一ページ内アンカー移動。表示有無判定は dtb_shop_page_element の element／value を用いる。
- implementationActual: DtbShopPageElement の Entity／Repository は移植されて存在するが、Controller／Twig／JS から一切参照されない。支店ページは shop_top.twig の商材ブロックで構成され、右カラムセクションナビ（ページ内アンカー導線）は未実装。
- mismatchReason: php 全体で ShopPageElement 参照は Entity/Repository 定義以外 0 件。セクション名（初心者講習会・取り扱い商品・スタッフ 等）や末尾用クラス付与ロジックもテンプレートに不在。旧 shoppage 由来要素がリニューアルの ShopTop 再編時に未移植と見られる。
- designRefDetail: 0302_基本設計仕様書(フロント_グローバルナビ).html#sheet-6（用語『右カラムセクションナビ』／処理フロー②③／業務ルール『右カラムナビの順序』『右カラムナビの表示有無』／DBカラム dtb_shop_page_element）
- implRef: 不在（src/Eccube/Controller/Shop/ShopTopController.php＋shop_top.twig／src/Eccube/Repository/DtbShopPageElementRepository.php は未参照）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f02-04_0302_sheet-6_sheet-conformance-add7cac61ff8",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "0302_基本設計仕様書(フロント_グローバルナビ).html#sheet-6",
  "designRefDetail": "0302_基本設計仕様書(フロント_グローバルナビ).html#sheet-6（用語『右カラムセクションナビ』／処理フロー②③／業務ルール『右カラムナビの順序』『右カラムナビの表示有無』／DBカラム dtb_shop_page_element）",
  "designExpectation": "店舗紹介ページのスマホ表示で、登録済みの右カラム項目だけをセクションナビへ並べ（値の無いセクションは非表示）、『店舗案内・初心者講習会・取り扱い商品・買取・スタッフ・その他・アクセス』の定義順で表示、出力順の末尾要素へ末尾用クラスを付与。押下で同一ページ内アンカー移動。表示有無判定は dtb_shop_page_element の element／value を用いる。",
  "designQuote": "店舗紹介ページのスマホ表示で、登録済みの右カラム項目だけをセクションナビへ並べ（値の無いセクションは非表示）、『店舗案内・初心者講習会・取り扱い商品・買取・スタッフ・その他・アクセス』の定義順で表示、出力順の末尾要素へ末尾用クラスを付与。押下で同一ページ内アンカー移動。表示有無判定は dtb_shop_page_element の element／value を用いる。",
  "implRef": "不在（src/Eccube/Controller/Shop/ShopTopController.php＋shop_top.twig／src/Eccube/Repository/DtbShopPageElementRepository.php は未参照）",
  "implementationActual": "DtbShopPageElement の Entity／Repository は移植されて存在するが、Controller／Twig／JS から一切参照されない。支店ページは shop_top.twig の商材ブロックで構成され、右カラムセクションナビ（ページ内アンカー導線）は未実装。",
  "difference": "php 全体で ShopPageElement 参照は Entity/Repository 定義以外 0 件。セクション名（初心者講習会・取り扱い商品・スタッフ 等）や末尾用クラス付与ロジックもテンプレートに不在。旧 shoppage 由来要素がリニューアルの ShopTop 再編時に未移植と見られる。",
  "mismatchReason": "php 全体で ShopPageElement 参照は Entity/Repository 定義以外 0 件。セクション名（初心者講習会・取り扱い商品・スタッフ 等）や末尾用クラス付与ロジックもテンプレートに不在。旧 shoppage 由来要素がリニューアルの ShopTop 再編時に未移植と見られる。",
  "comparisonRows": [
    {
      "item": "右カラムセクションナビ",
      "design": "dtb_shop_page_element を用いた登録済みセクションのページ内アンカーナビ",
      "implementation": "描画経路なし",
      "mismatch": "未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f02-04_0302_sheet-6_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（src/Eccube/Controller/Shop/ShopTopController.php＋shop_top.twig／src/Eccube/Repository/DtbShopPageElementRepository.php は未参照）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「店舗紹介ページのスマホ表示で、登録済みの右カラム項目だけをセクションナビへ並べ（値の無いセクションは非表示）、『店舗案内・初心者講習会・取り扱い商品・買取・スタッフ・その他・アクセス』の定義順で表示、出力順の末尾要素へ末尾用クラスを付与。押下で同一ページ内アンカー移動。表示有無判定は dtb_shop_page_element の element／value を用いる。」。実装は「DtbShopPageElement の Entity／Repository は移植されて存在するが、Controller／Twig／JS から一切参照されない。支店ページは shop_top.twig の商材ブロックで構成され、右カラムセクションナビ（ページ内アンカー導線）は未実装。」。乖離理由は「php 全体で ShopPageElement 参照は Entity/Repository 定義以外 0 件。セクション名（初心者講習会・取り扱い商品・スタッフ 等）や末尾用クラス付与ロジックもテンプレートに不在。旧 shoppage 由来要素がリニューアルの ShopTop 再編時に未移植と見られる。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "DB・保存/更新処理未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Service・業務ルール",
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "src/Eccube/Controller/Shop/ShopTopController.php",
    "src/Eccube/Repository/DtbShopPageElementRepository.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Shop/ShopTopController.php:34\n31: use Symfony\\Component\\Routing\\Attribute\\Route;\n32: use Symfony\\Component\\Routing\\Generator\\UrlGeneratorInterface;\n33: \n34: class ShopTopController extends AbstractController\n35: {\n36:     private const BEST_SELLER_LIMIT = 30;\n37:     private const SALE_PRODUCT_LIMIT = 30;",
    "src/Eccube/Repository/DtbShopPageElementRepository.php:24\n21: /**\n22:  * @extends AbstractRepository<DtbShopPageElement>\n23:  */\n24: class DtbShopPageElementRepository extends AbstractRepository\n25: {\n26:     public function __construct(ManagerRegistry $registry)\n27:     {"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
