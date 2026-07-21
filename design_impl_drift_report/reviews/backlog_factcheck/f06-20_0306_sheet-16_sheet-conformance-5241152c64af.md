# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-20_0306_sheet-16_sheet.json#f06-20_0306_sheet-16_sheet-conformance-5241152c64af`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-20_0306_sheet-16_sheet.json`
- sourceFindingId: `f06-20_0306_sheet-16_sheet-conformance-5241152c64af`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-20_0306_sheet-16_sheet` / F06-20 配送先新規登録・変更
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 確認画面の(3-14)「登録する」押下時、ブラックリストに 1.(3-3)配送先氏名 2.(3-9)〜(3-11)住所 3.(3-12)電話番号 のいずれかが登録されている場合は、登録を行わず会員情報登録エラー画面に遷移する。
- implementationActual: DeliveryController::complete() はフォーム検証(isValid)通過後に persist/flush で即登録(202-206)し、ブラックリスト照合を行わない。DtbBlacklistRepository には Customer を引数に取る FindBlacklistByCustomer のみが存在し、配送先(CustomerAddress)の氏名/住所/電話番号を照合するメソッドは無い。会員情報登録エラー画面(route:entry_re…
- mismatchReason: 会員登録(EntryController)・会員情報変更(ChangeController:116-127 で FindBlacklistByCustomer 照合)にはブラックリスト判定があるが、配送先登録フロー(DeliveryController)には全く無い。app/Customize/Controller は .gitkeep のみでオーバーライドも無い。設計は配送先の値((3-3)氏名等)を対象とした照合・エラー画面遷移を F06-20 固有に明記しており、未実…
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-16 (機能仕様 行195-198／画面部品 3-14登録する 行216)
- implRef: 不在（src/Eccube/Controller/Front/Mypage/DeliveryController.php complete() 168-211、src/Eccube/Repository/DtbBlacklistRepository.php FindBlacklistByCustomer 36、src/Eccube/Form/Type/Front/CustomerAddressType.php）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-20_0306_sheet-16_sheet-conformance-5241152c64af",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-16",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-16 (機能仕様 行195-198／画面部品 3-14登録する 行216)",
  "designExpectation": "確認画面の(3-14)「登録する」押下時、ブラックリストに 1.(3-3)配送先氏名 2.(3-9)〜(3-11)住所 3.(3-12)電話番号 のいずれかが登録されている場合は、登録を行わず会員情報登録エラー画面に遷移する。",
  "designQuote": "確認画面の(3-14)「登録する」押下時、ブラックリストに 1.(3-3)配送先氏名 2.(3-9)〜(3-11)住所 3.(3-12)電話番号 のいずれかが登録されている場合は、登録を行わず会員情報登録エラー画面に遷移する。",
  "implRef": "不在（src/Eccube/Controller/Front/Mypage/DeliveryController.php complete() 168-211、src/Eccube/Repository/DtbBlacklistRepository.php FindBlacklistByCustomer 36、src/Eccube/Form/Type/Front/CustomerAddressType.php）",
  "implementationActual": "DeliveryController::complete() はフォーム検証(isValid)通過後に persist/flush で即登録(202-206)し、ブラックリスト照合を行わない。DtbBlacklistRepository には Customer を引数に取る FindBlacklistByCustomer のみが存在し、配送先(CustomerAddress)の氏名/住所/電話番号を照合するメソッドは無い。会員情報登録エラー画面(route:entry_regist_error)への遷移分岐も配送先フローに無く、購読 EventListener/FormExtension も無い。",
  "difference": "会員登録(EntryController)・会員情報変更(ChangeController:116-127 で FindBlacklistByCustomer 照合)にはブラックリスト判定があるが、配送先登録フロー(DeliveryController)には全く無い。app/Customize/Controller は .gitkeep のみでオーバーライドも無い。設計は配送先の値((3-3)氏名等)を対象とした照合・エラー画面遷移を F06-20 固有に明記しており、未実装。",
  "mismatchReason": "会員登録(EntryController)・会員情報変更(ChangeController:116-127 で FindBlacklistByCustomer 照合)にはブラックリスト判定があるが、配送先登録フロー(DeliveryController)には全く無い。app/Customize/Controller は .gitkeep のみでオーバーライドも無い。設計は配送先の値((3-3)氏名等)を対象とした照合・エラー画面遷移を F06-20 固有に明記しており、未実装。",
  "comparisonRows": [
    {
      "item": "確定処理でのブラックリスト照合",
      "design": "(3-3)氏名/(3-9〜11)住所/(3-12)電話でブラックリスト照合",
      "implementation": "照合なし（isValid通過で即persist/flush）",
      "mismatch": "照合処理が未実装"
    },
    {
      "item": "照合対象データ",
      "design": "配送先(CustomerAddress)の氏名/住所/電話",
      "implementation": "FindBlacklistByCustomer は Customer(会員本体)専用、CustomerAddress版なし",
      "mismatch": "配送先を照合するメソッド不在"
    },
    {
      "item": "ヒット時の遷移",
      "design": "登録せず会員情報登録エラー画面(entry_regist_error)へ遷移",
      "implementation": "配送先フローに entry_regist_error 遷移分岐なし",
      "mismatch": "エラー遷移分岐が未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-20_0306_sheet-16_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（src/Eccube/Controller/Front/Mypage/DeliveryController.php complete() 168-211、src/Eccube/Repository/DtbBlacklistRepository.php FindBlacklistByCustomer 36、src/Eccube/Form/Type/Front/CustomerAddressType.php）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「確認画面の(3-14)「登録する」押下時、ブラックリストに 1.(3-3)配送先氏名 2.(3-9)〜(3-11)住所 3.(3-12)電話番号 のいずれかが登録されている場合は、登録を行わず会員情報登録エラー画面に遷移する。」。実装は「DeliveryController::complete() はフォーム検証(isValid)通過後に persist/flush で即登録(202-206)し、ブラックリスト照合を行わない。DtbBlacklistRepository には Customer を引数に取る FindBlacklistByCustomer のみが存在し、配送先(CustomerAddress)の氏名/住所/電話番号を照合するメソッドは無い。会員情報登録エラー画面(route:entry_regist_error)への遷移分岐も配送…」。乖離理由は「会員登録(EntryController)・会員情報変更(ChangeController:116-127 で FindBlacklistByCustomer 照合)にはブラックリスト判定があるが、配送先登録フロー(DeliveryController)には全く無い。app/Customize/Controller は .gitkeep のみでオーバーライドも無い。設計は配送先の値((3-3)氏名等)を対象とした照合・エラー画面遷移を F06-20 固有に明記しており、未実装。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Form・入力項目",
    "Service・業務ルール",
    "Repository・Entity・DB",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:5334\n5331:       </section>\n5332:       <!-- function-design-embed:end f06-18-f06-18_front_member_mypage_customer_edit -->\n5333: </section>\n5334:       <section class=\"sheet-panel\" id=\"sheet-16\">\n5335:         <div class=\"sheet-heading\">\n5336:           <h2>配送先新規登録・変更</h2>\n5337:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/Mypage/DeliveryController.php",
    "src/Eccube/Repository/DtbBlacklistRepository.php",
    "src/Eccube/Form/Type/Front/CustomerAddressType.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/Mypage/DeliveryController.php:35\n32: use Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException;\n33: use Symfony\\Component\\Routing\\Attribute\\Route;\n34: \n35: class DeliveryController extends AbstractController\n36: {\n37:     protected BaseInfo $BaseInfo;\n38: ",
    "src/Eccube/Repository/DtbBlacklistRepository.php:27\n24: /**\n25:  * @extends AbstractRepository<DtbBlacklist>\n26:  */\n27: class DtbBlacklistRepository extends AbstractRepository\n28: {\n29:     public function __construct(RegistryInterface $registry)\n30:     {",
    "src/Eccube/Form/Type/Front/CustomerAddressType.php:38\n35: use Symfony\\Component\\OptionsResolver\\OptionsResolver;\n36: use Symfony\\Component\\Validator\\Constraints as Assert;\n37: \n38: class CustomerAddressType extends AbstractType\n39: {\n40:     public function __construct(protected EccubeConfig $eccubeConfig, private readonly CountryRepository $countryRepository, private readonly PrefRepository $prefRepository)\n41:     {"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
