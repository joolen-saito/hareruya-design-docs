■API-A07-02 ネット買取受注一覧取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）成功レスポンスはHTTP 200で、応答本体は受注ごとのオブジェクト配列。netBuyOrderId と netOrderStatusId は integer、applyDate はISO8601形式、freeComment は未設定時 null、memberName は紐づく会員が無い場合 null とする。応答はcamelCase、日時はISO8601、serialize_null有効とする。
　実装は netBuyOrderId と netOrderStatusId を文字列にキャストし、applyDate を `Y/m/d H:i:s` 形式に整形し、freeComment/memberName の null を空文字へ置換して返している。確認お願いします。（設計根拠: excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html#sheet-4:1141-1142,1165 ／ 実装: src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:71-76）

■API-A07-02 ネット買取受注一覧取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）認証失敗時（トークン欠落・署名不正・該当する管理者会員なし）はHTTP 401とし、本文を持たない認証拒否を返す。
　App APIの例外処理は401を含むエラー時に `JsonResponse(['code' => $statusCode, 'errors' => $errors], $statusCode)` を返す。401の場合のerrorsは `['認証エラー']` になる。確認お願いします。（設計根拠: excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html#sheet-4:1144 ／ 実装: src/Eccube/EventListener/ExceptionListener.php:72-100,136-139）
