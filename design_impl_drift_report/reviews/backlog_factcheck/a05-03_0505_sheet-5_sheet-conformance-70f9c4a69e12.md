# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/a05-03_0505_sheet-5_sheet.json#a05-03_0505_sheet-5_sheet-conformance-70f9c4a69e12`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/a05-03_0505_sheet-5_sheet.json`
- sourceFindingId: `a05-03_0505_sheet-5_sheet-conformance-70f9c4a69e12`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `a05-03_0505_sheet-5_sheet` / A05-03 店頭注文番号取得
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 店頭注文番号リストの取得は GET /{_locale}/waiting_api/get_waiting で提供し、本APIはリクエストパラメータを持たない。パスパラメータ {_locale} は言語識別子であり、取得対象の絞り込みには用いない。
- implementationActual: 実装は GET /waiting_api/get_waiting_number/{base_info_id} の `get_waiting_number` ルートを定義し、Twig も `BaseInfo.id` を渡して呼び出す。Controller は `base_info_id > 0` の場合だけ取得処理に入り、注文番号札・注文番号の双方を BaseInfo で絞り込む。
- mismatchReason: 設計は URL を `/{_locale}/waiting_api/get_waiting` とし、入力パラメータなし、`{_locale}` は取得対象の絞り込みに使わない外部契約としている。一方、実装は URL 名称が `get_waiting_number` で、追加パスパラメータ `{base_info_id}` を必須化し、これを取得対象の店舗絞り込みに使用しているため、呼び出し契約と入力条件が設計と一致しない。反証として `get_waiting`、`waiti…
- designRefDetail: excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-5:1463,1476
- implRef: src/Eccube/Controller/Front/WaitingNumberController.php:56,57,61,64,69,71,77,79; src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig:96; src/Eccube/Repository/DtbWaitingNumberRepository.php:43,49,50; 不在（探索範囲: src/Eccube と htm…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "a05-03_0505_sheet-5_sheet-conformance-70f9c4a69e12",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-5:1463,1476",
  "designRefDetail": null,
  "designExpectation": "店頭注文番号リストの取得は GET /{_locale}/waiting_api/get_waiting で提供し、本APIはリクエストパラメータを持たない。パスパラメータ {_locale} は言語識別子であり、取得対象の絞り込みには用いない。",
  "designQuote": "店頭注文番号リストの取得は GET /{_locale}/waiting_api/get_waiting で提供し、本APIはリクエストパラメータを持たない。パスパラメータ {_locale} は言語識別子であり、取得対象の絞り込みには用いない。",
  "implRef": "src/Eccube/Controller/Front/WaitingNumberController.php:56,57,61,64,69,71,77,79; src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig:96; src/Eccube/Repository/DtbWaitingNumberRepository.php:43,49,50; 不在（探索範囲: src/Eccube と html/template の Route/Twig/YAML/PHP を get_waiting, waiting_api, get_waiting_number で検索し、/{_locale}/waiting_api/get_waiting または get_waiting 名のルートは未検出）",
  "implementationActual": "実装は GET /waiting_api/get_waiting_number/{base_info_id} の `get_waiting_number` ルートを定義し、Twig も `BaseInfo.id` を渡して呼び出す。Controller は `base_info_id > 0` の場合だけ取得処理に入り、注文番号札・注文番号の双方を BaseInfo で絞り込む。",
  "difference": "設計は URL を `/{_locale}/waiting_api/get_waiting` とし、入力パラメータなし、`{_locale}` は取得対象の絞り込みに使わない外部契約としている。一方、実装は URL 名称が `get_waiting_number` で、追加パスパラメータ `{base_info_id}` を必須化し、これを取得対象の店舗絞り込みに使用しているため、呼び出し契約と入力条件が設計と一致しない。反証として `get_waiting`、`waiting_api`、`get_waiting_number`、`base_info_id`、Twig の `url('get_waiting_number')` を検索したが、設計通りの無パラメータ API ルートは確認できなかった。",
  "mismatchReason": "設計は URL を `/{_locale}/waiting_api/get_waiting` とし、入力パラメータなし、`{_locale}` は取得対象の絞り込みに使わない外部契約としている。一方、実装は URL 名称が `get_waiting_number` で、追加パスパラメータ `{base_info_id}` を必須化し、これを取得対象の店舗絞り込みに使用しているため、呼び出し契約と入力条件が設計と一致しない。反証として `get_waiting`、`waiting_api`、`get_waiting…",
  "comparisonRows": [
    {
      "item": "HTTPエンドポイント",
      "design": "GET /{_locale}/waiting_api/get_waiting",
      "implementation": "#[Route(path: '/waiting_api/get_waiting_number/{base_info_id}', name: 'get_waiting_number', methods: ['GET'])]",
      "mismatch": "パス末尾が `get_waiting` ではなく `get_waiting_number/{base_info_id}` になっている。"
    },
    {
      "item": "入力パラメータ",
      "design": "リクエストパラメータなし。`{_locale}` は言語識別子で取得対象の絞り込みには用いない。",
      "implementation": "Controller メソッドは `int $base_info_id` を受け取り、Twig は `url('get_waiting_number', {'base_info_id': BaseInfo.id})` を生成する。",
      "mismatch": "設計にない `base_info_id` が API 呼び出し契約に追加されている。"
    },
    {
      "item": "取得対象の絞り込み",
      "design": "利用者の資格情報による絞り込みは行わず、パスパラメータ `{_locale}` も取得対象の絞り込みに使わない。",
      "implementation": "`findBy(['BaseInfo' => $base_info_id])` と `getWaitingNumberByStatus(..., $base_info_id)` により BaseInfo で絞り込む。Repository も `IDENTITY(wn.BaseInfo) = :baseInfoId` を条件にしている。",
      "mismatch": "設計で非入力・非絞り込みのはずの API が、店舗ID相当のパス値を必須条件として取得対象を限定している。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "a05-03_0505_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Controller/Front/WaitingNumberController.php:56,57,61,64,69,71,77,79; src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig:96; src/Eccube/Repository/DtbWaitingNumberRepository.php:43,49,50; 不在（探索範囲: src/Eccube と html/template の Route/Twig/YAML/PHP を get_waiting, waiting_api, get_waiting_number で検索し、/{_locale}/waiting_api/get_waiting または get_waiting 名のルートは未検出）",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「店頭注文番号リストの取得は GET /{_locale}/waiting_api/get_waiting で提供し、本APIはリクエストパラメータを持たない。パスパラメータ {_locale} は言語識別子であり、取得対象の絞り込みには用いない。」。実装は「実装は GET /waiting_api/get_waiting_number/{base_info_id} の `get_waiting_number` ルートを定義し、Twig も `BaseInfo.id` を渡して呼び出す。Controller は `base_info_id > 0` の場合だけ取得処理に入り、注文番号札・注文番号の双方を BaseInfo で絞り込む。」。乖離理由は「設計は URL を `/{_locale}/waiting_api/get_waiting` とし、入力パラメータなし、`{_locale}` は取得対象の絞り込みに使わない外部契約としている。一方、実装は URL 名称が `get_waiting_number` で、追加パスパラメータ `{base_info_id}` を必須化し、これを取得対象の店舗絞り込みに使用しているため、呼び出し契約と入力条件が設計と一致しない。反証として `get_waiting`、`waiting_api`、`get_waiting…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Form・入力項目",
    "Twig・画面表示",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "src/Eccube/Controller/Front/WaitingNumberController.php:56,57,61,64,69,71,77,79",
    "src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig:96",
    "src/Eccube/Repository/DtbWaitingNumberRepository.php:43,49,50",
    "src/Eccube/Controller/Front/WaitingNumberController.php",
    "src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig",
    "src/Eccube/Repository/DtbWaitingNumberRepository.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/WaitingNumberController.php:56\n53:      *\n54:      * @return JsonResponse\n55:      */\n56:     #[Route(path: '/waiting_api/get_waiting_number/{base_info_id}', name: 'get_waiting_number', requirements: ['base_info_id' => '\\d+'], methods: ['GET'])]\n57:     public function getWaitingNumber(Request $request, int $base_info_id): JsonResponse\n58:     {\n59:         $returnResponse = [];",
    "src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig:96\n93:     function update() {\n94:         $.ajax({\n95:             type: 'GET',\n96:             url: '{{ url('get_waiting_number', {'base_info_id': BaseInfo.id}) }}',\n97:             {# TODO: ECCUBE_HARERUYA-182 店頭注文呼び出し番号表示 店舗切り替えができるようになったら修正 #}\n98:             data: {},\n99:             success: function(result) {",
    "src/Eccube/Repository/DtbWaitingNumberRepository.php:43\n40:         $connection->executeStatement('TRUNCATE TABLE dtb_waiting_number');\n41:     }\n42: \n43:     public function getWaitingNumberByStatus(int $status, int $baseInfoId): mixed\n44:     {\n45:         return $this->createQueryBuilder('wn')\n46:             ->select('wn')"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
