■管理-M13-07 イベント申込一括編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）申込一覧で複数選択し「一括編集」は POST /{admin_route}/entry/bulkupdate（非同期）で、選択した申込の申込ステータスを一括変更し、結果をJSONで返す。
　実装の一括更新エンドポイントは #[Route(path: '/%eccube_admin_route%/event/entry/bulk_update', name: 'admin_event_entry_bulk_update', methods: ['POST'])]。Twig も url('admin_event_entry_bulk_update') を呼ぶ。反証検索でも /entry/bulkupdate または /entry/bulk_update の別ルートは見つからない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-12:3570 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:300）

■管理-M13-07 イベント申込一括編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）非同期リクエストでない場合は失敗メッセージのJSONを返す。
　bulkUpdateEntryStatus は JsonResponse を返すが、$request->isXmlHttpRequest() 等による非同期リクエスト判定がない。フォームが valid で entries があれば通常POSTでも更新処理へ進む。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-12:3571 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:301）

■管理-M13-07 イベント申込一括編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示メッセージは、失敗時にロケールキー admin.register.failed、完了時にロケールキー admin.register.complete をJSONで返す。
　フォーム不正時は admin.common.error_invalid_request またはフォームエラー文言、未選択/権限等は admin.event.entry.bulk_update.*、成功時は admin.event.entry.bulk_update.success を返す。messages.ja.yaml:1780-1781 に admin.register.complete/admin.register.failed は存在するが、この機能では使用していない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-12:3581 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:307）

■管理-M13-07 イベント申込一括編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一括更新ごとに申込履歴を1件記録する。
　EntryStatusBulkUpdateAction.php:63 は各申込で createEntryHistory($entry, $member->getId()) を呼ぶが、DtbEntryHistoryRepository.php:43-45 で直近履歴の申込ステータスが現在ステータスと同一なら continue し、履歴を作成しない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-12:3599 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEntryHistoryRepository.php:43）
