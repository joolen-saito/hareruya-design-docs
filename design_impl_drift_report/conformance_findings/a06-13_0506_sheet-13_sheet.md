■API-A06-13 本人確認更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）リクエストの証明書IDで本人確認証明書マスタを引く。該当が無い場合は入力不正（HTTP 400）とし、エラーメッセージを返す。400 証明書IDが本人確認証明書マスタに存在しない（未指定を含む）場合は {code, errors}（errorsは「正しい証明書IDを入力してください」）を返す。
　identification が未指定の場合は MissingRequiredParameterException で HTTP 400 になるが、指定された証明書IDが mtb_identification に存在しない場合は NotFoundException('正しい証明書IDを入力してください') を投げる。NotFoundException は HTTP 404 として定義され、App API 例外リスナーが {code:404, errors:[...]} を返す。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-13:3430,3442,3453 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:288）

■API-A06-13 本人確認更新
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）入口として PUT /admin/otcBuyOrder/{id}/identification と PUT /admin/otcBuyOrder/{id}/identification.json（同一処理）を提供し、受注IDの店頭買取受注に本人確認証明書を設定し、更新担当者・更新日時とともに保存して、成功時はコード200のJSONを返す。
　本人確認更新APIのルートは #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json', name: 'api_admin_otc_buy_order_update_identification', methods: ['PUT'])] の1本だけで、拡張子なしの /admin/otcBuyOrder/{id}/identification または /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification ルートは確認できない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-13:3421 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube と /home/y-saito/Developments/ec-cube-enterprise/html。既存実装は /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:273 の /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json のみ））
