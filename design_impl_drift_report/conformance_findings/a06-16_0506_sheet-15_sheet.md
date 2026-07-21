■API-A06-16 【新規】ダブルチェック者更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）エンドポイントURLは PUT /api/otcBuyOrder/{id}/doublecheck.json とする。
　実装ルートは PUT /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/doubleCheckMember.json。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-15:3720-3722 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:231）

■API-A06-16 【新規】ダブルチェック者更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）リクエストパラメータは member_id、型は数値(整数)、必須、入力例は 1000、備考はメンバーIDとする。
　実装は $request->request->get('double_check_member_id') を必須として読み取り、member_id は参照していない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-15:3736-3745 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:239）

■API-A06-16 【新規】ダブルチェック者更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ダブルチェック者は新規のカラムに追加する。
　実装は dtb_otc_buy_order の新規カラムではなく、dtb_otc_buy_order_approver テーブルの role=double_check、approver_id、assigned_by_id、approved_at に保存する。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-15:3735 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderApproverEntityManager.php:29）

■API-A06-16 【新規】ダブルチェック者更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）成功時のステータスコードは 200、レスポンスデータはなしとする。
　実装は HTTP 200 で JsonResponse(['code' => Response::HTTP_OK], Response::HTTP_OK) を返す。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-15:3750-3755 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:267）
