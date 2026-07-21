# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f03-05_0303_sheet-7_sheet.json#f03-05_0303_sheet-7_sheet-conformance-125cb18180b5`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f03-05_0303_sheet-7_sheet.json`
- sourceFindingId: `f03-05_0303_sheet-7_sheet-conformance-125cb18180b5`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f03-05_0303_sheet-7_sheet` / F03-05 商品リコメンド
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: マイページで種別 mypage のおすすめブロックを非同期取得し、会員の最新注文商品（最高額商品）を基準商品としておすすめ商品を抽出・スライダー表示する。0件のときのみ空メッセージを表示する。
- implementationActual: MypageController::index は 'Customer' と 'nextDeadlinePointHistory' のみ返し recommendProducts をセットしない。マイページテンプレートは block_product_recommend を render せず直接 recommendProducts 変数を参照するため line246 の条件は常に偽となり、常に line266 の空メッセージだけが表示される。line20-21 に『TODO:…
- mismatchReason: src/ 全体で recommendProducts をセットする処理を grep したが不在。ProductRecommendController のみが RecommendService を呼ぶが、マイページからは context=mypage で呼び出されておらず、user_recommend_product.twig の mypage 分岐は死コード。マイページのおすすめ表示は未実装（TODO）。
- designRefDetail: excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-7 (利用者視点の入口『マイページ表示時のおすすめブロック 非同期のおすすめ取得（種別 mypage）会員の最新注文商品を基準におすすめを表示する』／処理フロー『ページ種別が mypage または complete の場合、ログイン会員の最新注文の商品を基準商品とする』)
- implRef: src/Eccube/Controller/Front/Mypage/MypageController.php:127-138 ; src/Eccube/Resource/template/default/Mypage/index.twig:20-21,246,266

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f03-05_0303_sheet-7_sheet-conformance-125cb18180b5",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-7",
  "designRefDetail": "excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-7 (利用者視点の入口『マイページ表示時のおすすめブロック 非同期のおすすめ取得（種別 mypage）会員の最新注文商品を基準におすすめを表示する』／処理フロー『ページ種別が mypage または complete の場合、ログイン会員の最新注文の商品を基準商品とする』)",
  "designExpectation": "マイページで種別 mypage のおすすめブロックを非同期取得し、会員の最新注文商品（最高額商品）を基準商品としておすすめ商品を抽出・スライダー表示する。0件のときのみ空メッセージを表示する。",
  "designQuote": "マイページで種別 mypage のおすすめブロックを非同期取得し、会員の最新注文商品（最高額商品）を基準商品としておすすめ商品を抽出・スライダー表示する。0件のときのみ空メッセージを表示する。",
  "implRef": "src/Eccube/Controller/Front/Mypage/MypageController.php:127-138 ; src/Eccube/Resource/template/default/Mypage/index.twig:20-21,246,266",
  "implementationActual": "MypageController::index は 'Customer' と 'nextDeadlinePointHistory' のみ返し recommendProducts をセットしない。マイページテンプレートは block_product_recommend を render せず直接 recommendProducts 変数を参照するため line246 の条件は常に偽となり、常に line266 の空メッセージだけが表示される。line20-21 に『TODO: ECCUBE_HARERUYA-164 … 商品リコメンド実装時に追加する』の未実装コメントが残り、recommend_js.twig include もコメントアウトされている。マイページの基準商品決定・おすすめ抽出（RecommendService 呼び出し）は Controller/Service/EventSubscriber いずれにも存在しない。",
  "difference": "src/ 全体で recommendProducts をセットする処理を grep したが不在。ProductRecommendController のみが RecommendService を呼ぶが、マイページからは context=mypage で呼び出されておらず、user_recommend_product.twig の mypage 分岐は死コード。マイページのおすすめ表示は未実装（TODO）。",
  "mismatchReason": "src/ 全体で recommendProducts をセットする処理を grep したが不在。ProductRecommendController のみが RecommendService を呼ぶが、マイページからは context=mypage で呼び出されておらず、user_recommend_product.twig の mypage 分岐は死コード。マイページのおすすめ表示は未実装（TODO）。",
  "comparisonRows": [
    {
      "item": "マイページ基準商品決定",
      "design": "会員の最新注文の最高額商品を基準",
      "implementation": "処理なし（recommendProducts 未セット）",
      "mismatch": "未実装"
    },
    {
      "item": "おすすめ抽出/表示",
      "design": "非同期取得しスライダー表示",
      "implementation": "常に空メッセージのみ表示",
      "mismatch": "未実装（TODO コメント残存）"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f03-05_0303_sheet-7_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Controller/Front/Mypage/MypageController.php:127-138 ; src/Eccube/Resource/template/default/Mypage/index.twig:20-21,246,266",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「マイページで種別 mypage のおすすめブロックを非同期取得し、会員の最新注文商品（最高額商品）を基準商品としておすすめ商品を抽出・スライダー表示する。0件のときのみ空メッセージを表示する。」。実装は「MypageController::index は 'Customer' と 'nextDeadlinePointHistory' のみ返し recommendProducts をセットしない。マイページテンプレートは block_product_recommend を render せず直接 recommendProducts 変数を参照するため line246 の条件は常に偽となり、常に line266 の空メッセージだけが表示される。line20-21 に『TODO: ECCUBE_HARERUYA-164…」。乖離理由は「src/ 全体で recommendProducts をセットする処理を grep したが不在。ProductRecommendController のみが RecommendService を呼ぶが、マイページからは context=mypage で呼び出されておらず、user_recommend_product.twig の mypage 分岐は死コード。マイページのおすすめ表示は未実装（TODO）。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Service・業務ルール",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2657\n2654:       </section>\n2655:       <!-- function-design-embed:end f03-04-f03-04_front_product_product_category_list -->\n2656: </section>\n2657:       <section class=\"sheet-panel\" id=\"sheet-7\">\n2658:         <div class=\"sheet-heading\">\n2659:           <h2>商品リコメンド</h2>\n2660:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/Mypage/MypageController.php:127-138",
    "src/Eccube/Resource/template/default/Mypage/index.twig:20-21,246,266",
    "src/Eccube/Controller/Front/Mypage/MypageController.php",
    "src/Eccube/Resource/template/default/Mypage/index.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/Mypage/MypageController.php:127\n124:      * @return array<string, mixed>\n125:      */\n126:     #[Route(path: '/mypage/', name: 'mypage', methods: ['GET'])]\n127:     #[Template(template: 'Mypage/index.twig')]\n128:     public function index(Request $request, PaginatorInterface $paginator): array\n129:     {\n130:         /** @var Customer $Customer */",
    "src/Eccube/Resource/template/default/Mypage/index.twig:20\n17: {% block javascript %}\n18: <script src=\"{{ asset('assets/js/vendor/jquery.simple.timer.js') }}\"></script>\n19: <script src=\"{{ asset('assets/js/vendor/jquery-barcode.min.js') }}\"></script>\n20: {# TODO: ECCUBE_HARERUYA-164 マイページ 別紙「0303_基本設計仕様書(フロント_商品)」のシート「商品リコメンド」実装時に追加する #}\n21: {#{% include 'Block/js/recommend_js.twig' with {'recommend_type': 'mypage'} %}#}\n22: {% include 'Block/js/point_barcode_js.twig' %}\n23: {% include 'Block/_top_page_scripts.twig' %}",
    "src/Eccube/Controller/Front/Mypage/MypageController.php:52\n49: use Symfony\\Component\\Routing\\Attribute\\Route;\n50: use Symfony\\Component\\Security\\Http\\Authentication\\AuthenticationUtils;\n51: \n52: class MypageController extends AbstractController\n53: {\n54:     protected ProductRepository $productRepository;\n55: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
