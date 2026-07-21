■API-A05-02 注文印刷_該当受注のステータスを印刷済みに変更
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）A05-02 はエンドポイント URL `/order/prints/status/printed`、HTTP メソッド POST、リクエスト XML、レスポンスなし（ステータスコードのみ）として提供し、既存の `ConnectionType` 分岐から A05-02 とエンドポイントを分ける。
　実装のルートは `#[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', methods: ['POST'])]` で、A05-01/A05-02 を同一メソッド内の `ConnectionType`（`GetRequest` / `SetResponse`）で分岐している。`/order/prints/status/printed` は実装検索で見つからない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-4:1151-1155 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43）

■API-A05-02 注文印刷_該当受注のステータスを印刷済みに変更
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）プリンタ側でエラーがあった場合、レスポンスデータ内のエラーコードをログに追記する。印刷結果 XML は成功(true)/失敗(false)と、失敗時の code（例: EX_BADPORT, EX_TIMEOUT 等）を含むため、印刷結果の詳細を参照してエラー有無を確認する。
　実装は XML パース失敗時に本文と `XMLパースエラー` をログ出力し、`(string) $xml->ServerDirectPrint === 'false'` または `count($xml->ePOSPrint) < 1` の場合に本文だけをログ出力する。一方、各 `ePOSPrint/PrintResponse/response` の `success` 属性や `code` 属性を読まず、`printjobid` から受注 ID を取り出してステータス更新へ進む。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-4:1159-1206 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:55）
