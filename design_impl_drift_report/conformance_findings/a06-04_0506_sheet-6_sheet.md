■API-A06-04 店頭買取情報コメント更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）店頭買取情報コメント更新APIのエンドポイントURLは PUT /api/admin/otcBuyOrder/{id}/freeComment.json とする。
　実装ルートは #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/freeComment.json', ... methods: ['PUT'])] で、既定の eccube_api_v1_route は api/v1 のため、実際のパスは /api/v1/admin/otcBuyOrder/{id}/freeComment.json となる。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-6:1613-1618 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:156, /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:6）

■API-A06-04 店頭買取情報コメント更新
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）店頭買取受注のコメント更新は拡張子なし別名 PUT /admin/otcBuyOrder/{id}/freeComment でも、拡張子ありと同一処理として呼び出せること。
　実装されているのは拡張子ありの #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/freeComment.json', name: 'api_admin_otc_buy_order_update_free_comment', methods: ['PUT'])] のみ。拡張子なし /admin/otcBuyOrder/{id}/freeComment または /api/v1/admin/otcBuyOrder/{id}/freeComment の Route 定義は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-6:1689-1691,1697-1699 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html, /home/y-saito/Developments/ec-cube-enterprise/app/config; 検索語: otcBuyOrder/{id}/freeComment, freeComment.json, api_admin_otc_buy_order_update_free_comment, /api/admin/otcBuyOrder））
