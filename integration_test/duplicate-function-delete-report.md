# integration_test 重複機能削除レポート

## 削除したファイル

- A01-01（スマレジ連携処理）: `api_smaregi_stock_sync_it_cases.md` を削除。残存: `a01_01_api_stock_smaregi_stock_sync_it_cases.md`
- A01-02（スマレジwebhook連携エラー再連携）: `api_smaregi_webhook_error_retry_it_cases.md` を削除。残存: `a01_02_api_stock_smaregi_webhook_error_retry_it_cases.md`
- A06-14（店頭買取情報一部キャンセル情報連携）: `api_otc_buy_order_partial_cancel_sync_it_cases.md` を削除。残存: `a06_14_api_store_purchase_otc_buy_order_partial_cancel_sync_it_cases.md`
- A06-15（店頭買取情報同一所属店舗メンバー取得）: `api_otc_buy_order_same_store_members_it_cases.md` を削除。残存: `a06_15_api_store_purchase_otc_buy_order_same_store_members_it_cases.md`
- A06-16（店頭買取情報ダブルチェック者更新）: `api_otc_buy_order_double_check_member_update_it_cases.md` を削除。残存: `a06_16_api_store_purchase_otc_buy_order_double_check_member_update_it_cases.md`
- B01-02（在庫切れ）: フェーズ2実装対象のため、結合テストケース対象から除外。結合テストケースファイルは残存なし。
- B01-03（在庫警告）: フェーズ2実装対象のため、結合テストケース対象から除外。結合テストケースファイルは残存なし。
- B06-01（買取自動入庫バッチ）: `batch_purchase_auto_stock_it_cases.md` を削除。残存: `b06_01_batch_purchase_purchase_auto_stock_it_cases.md`
- F06-05（マイページ）: `front_mypage_index_it_cases.md` を削除。残存: `f06_05_front_member_mypage_index_it_cases.md`
- M03-43（低価格帯カード価格変更CSV出力）: `admin_product_simple_low_price_csv_export_it_cases.md` を削除。残存: `m03_43_admin_product_product_simple_low_price_csv_export_it_cases.md`
- M03-44（低価格帯カード価格変更CSV登録）: `admin_product_simple_low_price_csv_import_it_cases.md` を削除。残存: `m03_44_admin_product_product_simple_low_price_csv_import_it_cases.md`
- M04-01（在庫検索/一覧）: `admin_stock_search_list_it_cases.md` を削除。残存: `m04_01_admin_stock_stock_search_list_it_cases.md`
- M04-02（在庫編集機能）: `admin_stock_edit_it_cases.md` を削除。残存: `m04_02_admin_stock_stock_edit_it_cases.md`
- M04-04（在庫情報CSV出力）: `admin_stock_csv_export_it_cases.md` を削除。残存: `m04_04_admin_stock_stock_csv_export_it_cases.md`
- M04-06（在庫切れリストCSV出力）: フェーズ2実装対象のため、結合テストケース対象から除外。結合テストケースファイルは残存なし。
- M04-07（在庫警戒リストCSV出力）: フェーズ2実装対象のため、結合テストケース対象から除外。結合テストケースファイルは残存なし。
- M04-08（在庫移動・振替検索/一覧）: `admin_stock_move_transfer_search_list_it_cases.md` を削除。残存: `m04_08_admin_stock_stock_move_transfer_search_list_it_cases.md`
- M04-09（在庫移動・振替登録/編集）: `admin_stock_move_transfer_register_edit_it_cases.md` を削除。残存: `m04_09_admin_stock_stock_move_transfer_register_edit_it_cases.md`
- M04-10（在庫移動・振替情報CSV出力）: `admin_stock_move_transfer_csv_export_it_cases.md` を削除。残存: `m04_10_admin_stock_stock_move_transfer_csv_export_it_cases.md`
- M04-12（在庫分割結合検索/一覧）: `admin_stock_split_join_search_list_it_cases.md` を削除。残存: `m04_12_admin_stock_stock_split_join_search_list_it_cases.md`
- M04-13（在庫分割結合登録/編集）: `admin_stock_split_join_register_edit_it_cases.md` を削除。残存: `m04_13_admin_stock_stock_split_join_register_edit_it_cases.md`
- M04-14（在庫分割結合情報CSV出力）: `admin_stock_split_join_csv_export_it_cases.md` を削除。残存: `m04_14_admin_stock_stock_split_join_csv_export_it_cases.md`
- M04-15（在庫分割結合情報カスタムCSV出力）: `admin_stock_split_join_custom_csv_export_it_cases.md` を削除。残存: `m04_15_admin_stock_stock_split_join_custom_csv_export_it_cases.md`
- M04-20（欠品履歴CSV出力）: `admin_stock_shortage_history_csv_export_it_cases.md` を削除。残存: `m04_20_admin_stock_stock_shortage_history_csv_export_it_cases.md`
- M04-22（在庫移動・振替CSV登録）: `admin_stock_move_transfer_csv_import_it_cases.md` を削除。残存: `m04_22_admin_stock_stock_move_transfer_csv_import_it_cases.md`
- M04-23（在庫分割結合CSV登録）: `admin_stock_split_join_csv_import_it_cases.md` を削除。残存: `m04_23_admin_stock_stock_split_join_csv_import_it_cases.md`
- M04-24（在庫移動指示リスト作成/検索）: `admin_stock_move_instruction_search_create_it_cases.md` を削除。残存: `m04_24_admin_stock_stock_move_instruction_search_create_it_cases.md`
- M04-25（在庫移動指示リストエクスポート）: `admin_stock_move_instruction_export_it_cases.md` を削除。残存: `m04_25_admin_stock_stock_move_instruction_export_it_cases.md`
- M04-26（ピッキングリスト印刷）: `admin_stock_move_instruction_picking_list_print_it_cases.md` を削除。残存: `m04_26_admin_stock_stock_move_instruction_picking_list_print_it_cases.md`
- M04-27（在庫移動実績入力用CSV出力）: `admin_stock_move_result_csv_export_it_cases.md` を削除。残存: `m04_27_admin_stock_stock_move_result_csv_export_it_cases.md`
- M04-28（送り状CSV出力）: `admin_stock_invoice_csv_export_it_cases.md` を削除。残存: `m04_28_admin_stock_stock_invoice_csv_export_it_cases.md`
- M04-29（在庫移動実績 インポート）: `admin_stock_move_result_csv_import_it_cases.md` を削除。残存: `m04_29_admin_stock_stock_move_result_csv_import_it_cases.md`
- M04-30（バーコード貼替リストCSV出力）: `admin_stock_barcode_replacement_list_csv_export_it_cases.md` を削除。残存: `m04_30_admin_stock_stock_barcode_replacement_list_csv_export_it_cases.md`
- M04-32（承認一覧）: `admin_stock_approval_list_it_cases.md` を削除。残存: `m04_32_admin_stock_stock_approval_list_it_cases.md`
- M04-33（戻しリストCSV）: `admin_stock_move_return_list_csv_export_it_cases.md` を削除。残存: `m04_33_admin_stock_stock_move_return_list_csv_export_it_cases.md`
- M04-34（戻しリストPDF）: `admin_stock_move_return_list_pdf_export_it_cases.md` を削除。残存: `m04_34_admin_stock_stock_move_return_list_pdf_export_it_cases.md`
- M06-10（戻しリストCSV出力）: `admin_purchase_store_return_list_csv_export_it_cases.md` を削除。残存: `m06_10_admin_store_purchase_purchase_store_return_list_csv_export_it_cases.md`
- M06-11（戻しリストPDF出力）: `admin_purchase_store_return_list_pdf_export_it_cases.md` を削除。残存: `m06_11_admin_store_purchase_purchase_store_return_list_pdf_export_it_cases.md`
- M06-12（買取商品一覧CSV）: `admin_purchase_store_product_list_csv_export_it_cases.md` を削除。残存: `m06_12_admin_store_purchase_purchase_store_product_list_csv_export_it_cases.md`
- M06-13（買取商品（キャンセル）CSV）: `admin_purchase_store_product_cancel_csv_export_it_cases.md` を削除。残存: `m06_13_admin_store_purchase_purchase_store_product_cancel_csv_export_it_cases.md`
- M07-07（買取商品（キャンセル）CSV）: `admin_purchase_online_product_cancel_csv_export_it_cases.md` を削除。残存: `m07_07_admin_online_purchase_purchase_online_product_cancel_csv_export_it_cases.md`
- M07-08（戻しリストCSV）: `admin_purchase_online_return_list_csv_export_it_cases.md` を削除。残存: `m07_08_admin_online_purchase_purchase_online_return_list_csv_export_it_cases.md`
- M07-09（戻しリストPDF）: `admin_purchase_online_return_list_pdf_export_it_cases.md` を削除。残存: `m07_09_admin_online_purchase_purchase_online_return_list_pdf_export_it_cases.md`
- M08-11（顧客分析タグマスター）: `admin_customer_analysis_tag_master_it_cases.md` を削除。残存: `m08_11_admin_customer_customer_analysis_tag_master_it_cases.md`
- M08-15（会員顧客分析タグ情報CSV出力）: フェーズ2実装対象のため、結合テストケース対象から除外。結合テストケースファイルは残存なし。
- M08-16（会員顧客分析タグ登録アップロード）: フェーズ2実装対象のため、結合テストケース対象から除外。結合テストケースファイルは残存なし。
- メンバー管理（システム情報設定／設定）: `admin_setting_system_member_it_cases.md` を削除。残存: `m11_02_admin_system_setting_setting_system_member_edit_it_cases.md`

## 追加削除（正本一覧採用に伴う重複機能ID・2026-07-16）

正本一覧（`it-target-functions.md`）を対象基準として採用。以下は機能名が既存機能と完全一致する重複機能IDのため、正本一覧から除外しITケースファイルを削除した。

- A06-09（商品名から商品詳細の情報を取得）: `a06_09_api_product_search_by_name_it_cases.md` を削除。A06-08系と重複。
- A06-10（商品IDリストから買取用商品情報を取得）: `a06_10_api_buying_products_by_ids_it_cases.md` を削除。A06-07と重複。
- A06-17（カード詳細IDから買取用商品情報を取得）: `a06_17_api_buying_products_by_detail_it_cases.md` を削除。A06-06と重複。
- A06-18（商品IDリストから買取用商品情報を取得）: `a06_18_api_buying_products_by_ids_it_cases.md` を削除。A06-07/10と重複。
- A08-01（トップバナー情報取得）: `a08_01_api_top_banner_get_it_cases.md` を削除。A16-01と重複。
- A08-02（トップバナー一覧取得）: `a08_02_api_top_banner_list_it_cases.md` を削除。A16-02と重複。

※ 対応するE2Eケースファイル（`integration_test/e2e/a06_09|a06_10|a06_17|a06_18|a08_01|a08_02 *_e2e_cases.md`）は現ブランチで未コミット変更を含むため、本作業では削除保留（要判断）。

## スキップ

- なし
