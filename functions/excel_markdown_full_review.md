# Excel/Markdown Full Review

このレポートは、`excel_to_html/input` 由来の基本設計内容を優先して、生成HTML内の埋め込みMarkdown設計書を確認するための全件レビュー台帳です。

## Review Policy

- Excel/input由来のHTML本文を優先する。
- Excel本文自体に内部矛盾がある場合はMarkdownを勝手に直さず、要確認として残す。
- Claude Codeの指摘は、ローカルのHTML本文とMarkdown本文で再確認してから採用する。
- 重点観点: 件数、選択肢、初期値、最大文字数、CSV列、一覧列、検索条件、ページング、削除/追加項目、ステータス名。

## Current Findings

### Fixed in Markdown source

- M09-04 ページ管理: 一覧の検索ボックス、表示列（ページ名・ルーティング名・URL・ファイル名・レイアウト名）、ページ名/URL/ファイル名/meta系の最大長255文字を反映。
- M09-07 ブロック管理: 一覧の検索ボックス、表示列（ブロック名・ファイル名）、ブロック名/ファイル名の最大長255文字を反映。
- M09-10 支店トップページ管理: 限定品①/②タグとタイル配置ランダム化を項目除去扱いにし、タイル属性をフォーマット別特集/最新エキスパンション/ピックアップ商品/その他に反映。

### Requires Excel-source clarification

- M04-22 在庫振替CSV登録: Excelのテンプレート説明は2列だが、CSV定義とMarkdownは振替元商品コード・振替先商品コード・振替点数の3列。
- M04-23 在庫分割結合CSV登録: Excelのテンプレート説明は4列だが、CSV定義とMarkdownは結合元在庫区分を含む5列。
- M04-13 在庫分割結合登録編集（結合）: Excel内のステータス体系とMarkdown/M04-12側のステータス体系が一致しない。
- M04-24 在庫移動指示検索: Excelは表示件数50・ページネーションあり、Markdownは全件取得・ページングなし。
- M11-01 メンバー管理一覧: Excelのリニューアル後一覧列と、現行pf-eccube3由来の稼働列説明が食い違う。正とする画面仕様の決定が必要。
- M11-02 メンバー管理: 追加項目、2段階認証、スマレジ用アカウントの扱いにExcel内の記述差がある。正とする追加項目セットの決定が必要。

## Embedded Function Inventory

Total embedded sections: 361

### excel_to_html/output/0201_基本設計仕様書(システム設定).html

Embedded sections: 6

- `m11-01-m11-01_admin_system_setting_setting_system_member_list` / メンバー管理一覧 / `functions/pf-eccube3/m11-01_admin_system_setting_setting_system_member_list.md`
- `m11-04-m11-04_admin_system_setting_setting_system_login_history` / メンバー管理一覧 / `functions/ec-cube-enterprise/m11-04_admin_system_setting_setting_system_login_history.md`
- `m11-05-m11-05_admin_system_setting_setting_system_masterdata` / メンバー管理一覧 / `functions/ec-cube-enterprise/m11-05_admin_system_setting_setting_system_masterdata.md`
- `m11-06-m11-06_admin_system_setting_setting_system_system_info` / メンバー管理一覧 / `functions/ec-cube-enterprise/m11-06_admin_system_setting_setting_system_system_info.md`
- `m11-02-m11-02_admin_system_setting_setting_system_member_edit` / メンバー管理 / `functions/pf-eccube3/m11-02_admin_system_setting_setting_system_member_edit.md`
- `m11-03-m11-03_admin_system_setting_setting_system_authority` / 権限管理 / `functions/pf-eccube3/m11-03_admin_system_setting_setting_system_authority.md`

### excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html

Embedded sections: 34

- `m04-01-m04-01_admin_stock_stock_search_list` / 在庫検索一覧(検索入力) / `functions/ec-cube-enterprise/m04-01_admin_stock_stock_search_list.md`
- `m04-29-m04-29_admin_stock_stock_move_result_csv_import` / 在庫検索一覧(検索入力) / `functions/ec-cube-enterprise/m04-29_admin_stock_stock_move_result_csv_import.md`
- `m04-02-m04-02_admin_stock_stock_edit` / 在庫編集 / `functions/ec-cube-enterprise/m04-02_admin_stock_stock_edit.md`
- `m04-03-m04-03_admin_stock_stock_bulk_edit` / 在庫一括編集 / `functions/pf-eccube3/m04-03_admin_stock_stock_bulk_edit.md`
- `m04-04-m04-04_admin_stock_stock_csv_export` / 在庫情報CSV出力 / `functions/ec-cube-enterprise/m04-04_admin_stock_stock_csv_export.md`
- `m04-05-m04-05_admin_stock_product_stock_custom_csv_export` / 在庫情報カスタムCSV出力 / `functions/pf-eccube3/m04-05_admin_stock_product_stock_custom_csv_export.md`
- `m04-11-m04-11_admin_stock_product_stock_history_csv_export` / 在庫情報カスタムCSV出力 / `functions/pf-eccube3/m04-11_admin_stock_product_stock_history_csv_export.md`
- `m04-15-m04-15_admin_stock_stock_split_join_custom_csv_export` / 在庫情報カスタムCSV出力 / `functions/ec-cube-enterprise/m04-15_admin_stock_stock_split_join_custom_csv_export.md`
- `m04-06-m04-06_admin_stock_stock_shortage_csv_export` / 在庫切れリストCSV出力 / `functions/ec-cube-enterprise/m04-06_admin_stock_stock_shortage_csv_export.md`
- `m04-07-m04-07_admin_stock_stock_warning_csv_export` / 在庫警戒リストCSV出力 / `functions/ec-cube-enterprise/m04-07_admin_stock_stock_warning_csv_export.md`
- `m04-08-m04-08_admin_stock_stock_move_transfer_search_list` / 在庫移動・振替検索一覧(検索・結果) / `functions/ec-cube-enterprise/m04-08_admin_stock_stock_move_transfer_search_list.md`
- `m04-09-m04-09_admin_stock_stock_move_transfer_register_edit` / 在庫移動・振替登録 編集 (移動) / `functions/ec-cube-enterprise/m04-09_admin_stock_stock_move_transfer_register_edit.md`
- `m04-10-m04-10_admin_stock_stock_move_transfer_csv_export` / 在庫移動・振替情報CSV出力 / `functions/ec-cube-enterprise/m04-10_admin_stock_stock_move_transfer_csv_export.md`
- `m04-27-m04-27_admin_stock_stock_move_result_csv_export` / 在庫移動・振替情報CSV出力 / `functions/ec-cube-enterprise/m04-27_admin_stock_stock_move_result_csv_export.md`
- `m04-12-m04-12_admin_stock_stock_split_join_search_list` / 在庫分割結合検索一覧(検索・結果) / `functions/ec-cube-enterprise/m04-12_admin_stock_stock_split_join_search_list.md`
- `m04-13-m04-13_admin_stock_stock_split_join_register_edit` / 在庫分割結合登録編集（分割） / `functions/ec-cube-enterprise/m04-13_admin_stock_stock_split_join_register_edit.md`
- `m04-14-m04-14_admin_stock_stock_split_join_csv_export` / 在庫分割結合情報CSV出力 / `functions/ec-cube-enterprise/m04-14_admin_stock_stock_split_join_csv_export.md`
- `m04-16-m04-16_admin_stock_product_stock_recommend_csv_export` / 在庫リコメンドCSV出力 / `functions/pf-eccube3/m04-16_admin_stock_product_stock_recommend_csv_export.md`
- `m04-17-m04-17_admin_stock_stock_history_search_list` / 在庫履歴検索一覧(検索入力) / `functions/pf-eccube3/m04-17_admin_stock_stock_history_search_list.md`
- `m04-18-m04-18_admin_stock_stock_history_csv_export` / 在庫変動履歴CSV出力 / `functions/pf-eccube3/m04-18_admin_stock_stock_history_csv_export.md`
- `m04-19-m04-19_admin_stock_stock_shortage_history_search_list` / 欠品履歴検索一覧(検索結果) / `functions/pf-eccube3/m04-19_admin_stock_stock_shortage_history_search_list.md`
- `m04-20-m04-20_admin_stock_stock_shortage_history_csv_export` / 欠品履歴CSV出力 / `functions/ec-cube-enterprise/m04-20_admin_stock_stock_shortage_history_csv_export.md`
- `m04-21-m04-21_admin_stock_stock_csv_import` / 在庫変更CSV登録 / `functions/pf-eccube3/m04-21_admin_stock_stock_csv_import.md`
- `m04-22-m04-22_admin_stock_stock_move_transfer_csv_import` / 在庫移動CSV登録 / `functions/ec-cube-enterprise/m04-22_admin_stock_stock_move_transfer_csv_import.md`
- `m04-23-m04-23_admin_stock_stock_split_join_csv_import` / 在庫分割CSV登録 / `functions/ec-cube-enterprise/m04-23_admin_stock_stock_split_join_csv_import.md`
- `m04-24-m04-24_admin_stock_stock_move_instruction_search_create` / 在庫移動指示検索 / `functions/ec-cube-enterprise/m04-24_admin_stock_stock_move_instruction_search_create.md`
- `m04-25-m04-25_admin_stock_stock_move_instruction_export` / 在庫移動指示詳細 / `functions/ec-cube-enterprise/m04-25_admin_stock_stock_move_instruction_export.md`
- `m04-26-m04-26_admin_stock_stock_move_instruction_picking_list_print` / 在庫移動指示リスト ピッキングリスト印刷 / `functions/ec-cube-enterprise/m04-26_admin_stock_stock_move_instruction_picking_list_print.md`
- `m04-28-m04-28_admin_stock_stock_invoice_csv_export` / 送り状CSV出力 / `functions/ec-cube-enterprise/m04-28_admin_stock_stock_invoice_csv_export.md`
- `m04-30-m04-30_admin_stock_stock_barcode_replacement_list_csv_export` / バーコード貼替リストCSV出力 / `functions/ec-cube-enterprise/m04-30_admin_stock_stock_barcode_replacement_list_csv_export.md`
- `m04-31-m04-31_admin_stock_stock_inventory_plan` / 棚卸計画一覧 / `functions/pf-eccube3/m04-31_admin_stock_stock_inventory_plan.md`
- `m04-32-m04-32_admin_stock_stock_approval_list` / 在庫編集承認一覧(検索入力) / `functions/ec-cube-enterprise/m04-32_admin_stock_stock_approval_list.md`
- `m04-33-m04-33_admin_stock_stock_move_return_list_csv_export` / 在庫移動戻しリストCSV出力 / `functions/ec-cube-enterprise/m04-33_admin_stock_stock_move_return_list_csv_export.md`
- `m04-34-m04-34_admin_stock_stock_move_return_list_pdf_export` / 在庫移動戻しリストPDF / `functions/ec-cube-enterprise/m04-34_admin_stock_stock_move_return_list_pdf_export.md`

### excel_to_html/output/0203_基本設計仕様書(受注管理機能).html

Embedded sections: 26

- `m05-01-m05-01_admin_order_order_search_list` / 受注情報検索 一覧(検索入力) / `functions/pf-eccube3/m05-01_admin_order_order_search_list.md`
- `m05-12-m05-12_admin_order_order_bulk_status_change` / 受注情報検索 一覧(検索入力) / `functions/ec-cube-enterprise/m05-12_admin_order_order_bulk_status_change.md`
- `m05-13-m05-13_admin_order_order_tracking_number` / 受注情報検索 一覧(検索入力) / `functions/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.md`
- `m05-14-m05-14_admin_order_order_status_change` / 受注情報検索 一覧(検索入力) / `functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md`
- `m05-16-m05-16_admin_order_order_shop_memo` / 受注情報検索 一覧(検索入力) / `functions/ec-cube-enterprise/m05-16_admin_order_order_shop_memo.md`
- `m05-17-m05-17_admin_order_order_shipping_memo` / 受注情報検索 一覧(検索入力) / `functions/ec-cube-enterprise/m05-17_admin_order_order_shipping_memo.md`
- `m05-02-m05-02_admin_order_order_csv_export` / 受注一覧CSV出力 / `functions/pf-eccube3/m05-02_admin_order_order_csv_export.md`
- `m05-03-m05-03_admin_order_order_custom_csv_export` / 受注一覧カスタムCSV出力 / `functions/pf-eccube3/m05-03_admin_order_order_custom_csv_export.md`
- `m05-04-m05-04_admin_order_order_shipping_csv_export` / 受注詳細CSV出力 / `functions/pf-eccube3/m05-04_admin_order_order_shipping_csv_export.md`
- `m05-05-m05-05_admin_order_order_shipping_custom_csv_export` / 受注詳細カスタムCSV出力 / `functions/pf-eccube3/m05-05_admin_order_order_shipping_custom_csv_export.md`
- `m05-06-m05-06_admin_order_order_bulk_manual_mail` / メール一括送信 / `functions/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.md`
- `m05-15-m05-15_admin_order_order_mail` / メール一括送信 / `functions/ec-cube-enterprise/m05-15_admin_order_order_mail.md`
- `m05-07-m05-07_admin_order_order_labels_csv_export` / 送り状CSV出力 / `functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md`
- `m05-08-m05-08_admin_order_order_stack_paper_print` / スタック用紙印刷 / `functions/pf-eccube3/m05-08_admin_order_order_stack_paper_print.md`
- `m05-09-m05-09_admin_order_order_print_delivery_slips_ja` / 納品書印刷（日本語） / `functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md`
- `m05-10-m05-10_admin_order_order_print_delivery_slips_en` / 納品書印刷（英語） / `functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md`
- `m05-11-m05-11_admin_order_order_edit` / 受注情報編集 / `functions/pf-eccube3/m05-11_admin_order_order_edit.md`
- `m05-18-m05-18_admin_order_order_shipping_standby_list_create` / 出荷指示リスト生成 / `functions/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.md`
- `m05-19-m05-19_admin_order_order_shipping_standby_list_search` / 出荷指示リスト編集 / `functions/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.md`
- `m05-20-m05-20_admin_order_order_shipping_standby_detail_edit_delete` / 出荷指示リスト編集 / `functions/pf-eccube3/m05-20_admin_order_order_shipping_standby_detail_edit_delete.md`
- `m05-21-m05-21_admin_order_order_shipping_standby_picking_list_print` / ピッキングリスト印刷 / `functions/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.md`
- `m05-22-m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja` / 出荷指示ー納品書印刷（日本語） / `functions/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.md`
- `m05-23-m05-23_admin_order_order_shipping_standby_print_delivery_slips_en` / 出荷指示ー納品書印刷（英語） / `functions/pf-eccube3/m05-23_admin_order_order_shipping_standby_print_delivery_slips_en.md`
- `m05-24-m05-24_admin_order_order_shipping_export_for_import` / 出荷実績入力用CSV出力 / `functions/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.md`
- `m05-26-m05-26_admin_order_order_shipping_result_csv_import` / 出荷実績インポート登録 / `functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md`
- `m05-27-m05-27_admin_order_order_waiting_tag` / 店頭注文番号札管理 / `functions/pf-eccube3/m05-27_admin_order_order_waiting_tag.md`

### excel_to_html/output/0204_基本設計仕様書(商品管理).html

Embedded sections: 42

- `m03-01-m03-01_admin_product_product_search_list` / 商品マスター(検索入力) / `functions/pf-eccube3/m03-01_admin_product_product_search_list.md`
- `m03-02-m03-02_admin_product_product_edit` / 商品登録編集 / `functions/pf-eccube3/m03-02_admin_product_product_edit.md`
- `m03-05-m03-05_admin_product_product_sale_price_csv_export` / セール用価格変更CSV出力 / `functions/pf-eccube3/m03-05_admin_product_product_sale_price_csv_export.md`
- `m03-06-m03-06_admin_product_product_custom_csv_export` / 商品情報カスタムCSV出力 / `functions/pf-eccube3/m03-06_admin_product_product_custom_csv_export.md`
- `m03-26-m03-26_admin_product_product_card_csv_import` / カード商品CSV登録 / `functions/pf-eccube3/m03-26_admin_product_product_card_csv_import.md`
- `m03-03-m03-03_admin_product_product_card_csv_export` / カード商品CSV出力 / `functions/pf-eccube3/m03-03_admin_product_product_card_csv_export.md`
- `m03-27-m03-27_admin_product_product_goods_csv_import` / グッズ商品CSV登録 / `functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md`
- `m03-04-m03-04_admin_product_product_goods_csv_export` / グッズ商品CSV出力 / `functions/pf-eccube3/m03-04_admin_product_product_goods_csv_export.md`
- `m03-28-m03-28_admin_product_product_product_tag_csv_import` / 商品タグ更新CSV登録 / `functions/pf-eccube3/m03-28_admin_product_product_product_tag_csv_import.md`
- `m03-17-m03-17_admin_product_product_sales_analysis_management` / 売上分析タグ登録編集 / `functions/pf-eccube3/m03-17_admin_product_product_sales_analysis_management.md`
- `m03-29-m03-29_admin_product_product_tag_sales_analysis_csv_import` / 売上分析タグ更新CSV登録 / `functions/pf-eccube3/m03-29_admin_product_product_tag_sales_analysis_csv_import.md`
- `m03-38-m03-38_admin_product_product_status_csv` / 商品公開CSV登録 / `functions/pf-eccube3/m03-38_admin_product_product_status_csv.md`
- `m03-08-m03-08_admin_product_product_product_class_list` / 商品規格一覧 / `functions/pf-eccube3/m03-08_admin_product_product_product_class_list.md`
- `m03-09-m03-09_admin_product_product_class_edit` / 商品規格登録編集 / `functions/pf-eccube3/m03-09_admin_product_product_class_edit.md`
- `m03-10-m03-10_admin_product_product_bulk_buy_standard_price_edit` / 買取・基準価格一括編集 / `functions/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.md`
- `m03-45-m03-45_admin_product_product_category_list` / カテゴリ一覧 / `functions/pf-eccube3/m03-45_admin_product_product_category_list.md`
- `m03-11-m03-11_admin_product_product_category_register_edit` / カテゴリ登録 / `functions/pf-eccube3/m03-11_admin_product_product_category_register_edit.md`
- `m03-12-m03-12_admin_product_product_category_csv_export` / カテゴリCSV出力 / `functions/pf-eccube3/m03-12_admin_product_product_category_csv_export.md`
- `m03-13-m03-13_admin_product_product_tag` / タグ登録 / `functions/pf-eccube3/m03-13_admin_product_product_tag.md`
- `m03-14-m03-14_admin_product_product_abbreviation_tag_register_edit` / 略称タグ登録 / `functions/pf-eccube3/m03-14_admin_product_product_abbreviation_tag_register_edit.md`
- `m03-15-m03-15_admin_product_product_storage_code_export` / 略称タグCSV出力 / `functions/pf-eccube3/m03-15_admin_product_product_storage_code_export.md`
- `m03-16-m03-16_admin_product_product_storage_code_import` / 略称タグCSVアップロード / `functions/pf-eccube3/m03-16_admin_product_product_storage_code_import.md`
- `m03-18-m03-18_admin_product_product_section` / 部門登録 / `functions/pf-eccube3/m03-18_admin_product_product_section.md`
- `m03-19-m03-19_admin_product_product_section_csv_export` / 部門CSV出力 / `functions/pf-eccube3/m03-19_admin_product_product_section_csv_export.md`
- `m03-20-m03-20_admin_product_product_department_csv_import` / 部門登録CSVアップロード / `functions/pf-eccube3/m03-20_admin_product_product_department_csv_import.md`
- `m03-21-m03-21_admin_product_product_shelf_number_register_edit` / 棚番登録 編集 / `functions/pf-eccube3/m03-21_admin_product_product_shelf_number_register_edit.md`
- `m03-22-m03-22_admin_product_product_sell_group` / 購入グループ管理 / `functions/pf-eccube3/m03-22_admin_product_product_sell_group.md`
- `m03-23-m03-23_admin_product_product_buy_sale_price_history` / 買取・販売価格履歴検索 / `functions/pf-eccube3/m03-23_admin_product_product_buy_sale_price_history.md`
- `m03-24-m03-24_admin_product_product_buy_sale_price_history_csv_export` / 買取 販売価格履歴情報CSV出力 / `functions/pf-eccube3/m03-24_admin_product_product_buy_sale_price_history_csv_export.md`
- `m03-25-m03-25_admin_product_product_duplicate_product_code_check` / 重複商品コード確認 / `functions/pf-eccube3/m03-25_admin_product_product_duplicate_product_code_check.md`
- `m03-30-m03-30_admin_product_product_product_price_csv_import` / 基準価格変更CSVアップロード / `functions/pf-eccube3/m03-30_admin_product_product_product_price_csv_import.md`
- `m03-34-m03-34_admin_product_product_discount_csv_import` / 基準価格変更CSVアップロード / `functions/pf-eccube3/m03-34_admin_product_product_discount_csv_import.md`
- `m03-36-m03-36_admin_product_product_buy_discount_csv_import` / 基準価格変更CSVアップロード / `functions/pf-eccube3/m03-36_admin_product_product_buy_discount_csv_import.md`
- `m03-31-m03-31_admin_product_product_sale_price_csv_import` / セール用価格変更CSVアップロード / `functions/pf-eccube3/m03-31_admin_product_product_sale_price_csv_import.md`
- `m03-44-m03-44_admin_product_product_simple_low_price_csv_import` / 低価格帯カード価格変更CSV出力 / `functions/ec-cube-enterprise/m03-44_admin_product_product_simple_low_price_csv_import.md`
- `m03-43-m03-43_admin_product_product_simple_low_price_csv_export` / 低価格帯カード価格変更CSVフォーマット / `functions/ec-cube-enterprise/m03-43_admin_product_product_simple_low_price_csv_export.md`
- `m03-32-m03-32_admin_product_product_simple_high_price_csv_import` / 高額商品価格変更CSVフォーマット / `functions/pf-eccube3/m03-32_admin_product_product_simple_high_price_csv_import.md`
- `m03-33-m03-33_admin_product_product_sale_high_price_csv_import` / セール用高額商品価格変更CSVアップロード / `functions/pf-eccube3/m03-33_admin_product_product_sale_high_price_csv_import.md`
- `m03-35-m03-35_admin_product_product_section_csv_import` / 部門更新CSV登録 / `functions/pf-eccube3/m03-35_admin_product_product_section_csv_import.md`
- `m03-37-m03-37_admin_product_product_storage_code_csv_import` / 略称タグ更新CSV登録 / `functions/pf-eccube3/m03-37_admin_product_product_storage_code_csv_import.md`
- `m03-40-m03-40_admin_product_product_shelf_number_csv_import` / 棚番号更新CSV登録 / `functions/pf-eccube3/m03-40_admin_product_product_shelf_number_csv_import.md`
- `m03-41-m03-41_admin_product_product_category_csv_import` / カテゴリ登録CSVアップロード / `functions/pf-eccube3/m03-41_admin_product_product_category_csv_import.md`

### excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html

Embedded sections: 13

- `m06-01-m06-01_admin_store_purchase_purchase_store_search_list` / 買取一覧(検索入力) / `functions/pf-eccube3/m06-01_admin_store_purchase_purchase_store_search_list.md`
- `m06-02-m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export` / 古物台帳入力用CSV出力 / `functions/pf-eccube3/m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export.md`
- `m06-12-m06-12_admin_store_purchase_purchase_store_product_list_csv_export` / 【新規】買取商品一覧CSV出力項目 / `functions/ec-cube-enterprise/m06-12_admin_store_purchase_purchase_store_product_list_csv_export.md`
- `m06-13-m06-13_admin_store_purchase_purchase_store_product_cancel_csv_export` / 【新規】買取商品一覧（キャンセル）CSV出力項目 / `functions/ec-cube-enterprise/m06-13_admin_store_purchase_purchase_store_product_cancel_csv_export.md`
- `m06-10-m06-10_admin_store_purchase_purchase_store_return_list_csv_export` / 【新規】戻しリストCSV出力 / `functions/ec-cube-enterprise/m06-10_admin_store_purchase_purchase_store_return_list_csv_export.md`
- `m06-11-m06-11_admin_store_purchase_purchase_store_return_list_pdf_export` / 【新規】戻しリストPDF出力 / `functions/ec-cube-enterprise/m06-11_admin_store_purchase_purchase_store_return_list_pdf_export.md`
- `m06-03-m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit` / 買取詳細 / `functions/pf-eccube3/m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.md`
- `m06-04-m06-04_admin_store_purchase_purchase_store_status_change` / ステータス変更 / `functions/pf-eccube3/m06-04_admin_store_purchase_purchase_store_status_change.md`
- `m06-05-m06-05_admin_store_purchase_purchase_store_history` / 買取商品履歴(検索入力) / `functions/pf-eccube3/m06-05_admin_store_purchase_purchase_store_history.md`
- `m06-07-m06-07_admin_store_purchase_purchase_store_history_select_csv_export` / 買取商品履歴(検索結果) / `functions/pf-eccube3/m06-07_admin_store_purchase_purchase_store_history_select_csv_export.md`
- `m06-06-m06-06_admin_store_purchase_purchase_store_history_csv_export_all` / 買取商品履歴CSV出力 / `functions/pf-eccube3/m06-06_admin_store_purchase_purchase_store_history_csv_export_all.md`
- `m06-08-m06-08_admin_store_purchase_purchase_store_summary` / 買取集計データ(検索入力) / `functions/pf-eccube3/m06-08_admin_store_purchase_purchase_store_summary.md`
- `m06-09-m06-09_admin_store_purchase_otc_buy_order_summary_csv_export` / 買取集計データCSV出力 / `functions/pf-eccube3/m06-09_admin_store_purchase_otc_buy_order_summary_csv_export.md`

### excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html

Embedded sections: 9

- `m07-01-m07-01_admin_online_purchase_purchase_online_search_list` / 買取一覧(検索入力) / `functions/pf-eccube3/m07-01_admin_online_purchase_purchase_online_search_list.md`
- `m07-02-m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export` / 古物台帳入力用CSV出力項目 / `functions/pf-eccube3/m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export.md`
- `m07-05-m07-05_admin_online_purchase_purchase_csv_export_deposit` / 入金CSV出力項目 / `functions/pf-eccube3/m07-05_admin_online_purchase_purchase_csv_export_deposit.md`
- `m07-06-m07-06_admin_online_purchase_purchase_online_product_list_csv_export` / 買取商品一覧CSV出力項目 / `functions/pf-eccube3/m07-06_admin_online_purchase_purchase_online_product_list_csv_export.md`
- `m07-07-m07-07_admin_online_purchase_purchase_online_product_cancel_csv_export` / 【新規】買取商品一覧（キャンセル）CSV出力項目 / `functions/ec-cube-enterprise/m07-07_admin_online_purchase_purchase_online_product_cancel_csv_export.md`
- `m07-08-m07-08_admin_online_purchase_purchase_online_return_list_csv_export` / 【新規】戻しリストCSV出力 / `functions/ec-cube-enterprise/m07-08_admin_online_purchase_purchase_online_return_list_csv_export.md`
- `m07-09-m07-09_admin_online_purchase_purchase_online_return_list_pdf_export` / 【新規】戻しリストPDF出力 / `functions/ec-cube-enterprise/m07-09_admin_online_purchase_purchase_online_return_list_pdf_export.md`
- `m07-03-m07-03_admin_online_purchase_purchase_online_buy_order_edit` / 買取情報編集 / `functions/pf-eccube3/m07-03_admin_online_purchase_purchase_online_buy_order_edit.md`
- `m07-04-m07-04_admin_online_purchase_purchase_manual_mail` / 手動メール通知(入力画面) / `functions/pf-eccube3/m07-04_admin_online_purchase_purchase_manual_mail.md`

### excel_to_html/output/0207_基本設計仕様書(会員管理機能).html

Embedded sections: 16

- `m08-01-m08-01_admin_customer_customer_search_list` / 会員検索一覧(検索入力) / `functions/pf-eccube3/m08-01_admin_customer_customer_search_list.md`
- `m08-03-m08-03_admin_customer_customer_csv_export` / 会員検索一覧(検索入力) / `functions/pf-eccube3/m08-03_admin_customer_customer_csv_export.md`
- `m08-15-m08-15_admin_customer_customer_analysis_tag_csv_export` / 会員検索一覧(検索入力) / `functions/ec-cube-enterprise/m08-15_admin_customer_customer_analysis_tag_csv_export.md`
- `m08-16-m08-16_admin_customer_customer_analysis_tag_csv_import` / 会員検索一覧(検索入力) / `functions/ec-cube-enterprise/m08-16_admin_customer_customer_analysis_tag_csv_import.md`
- `m08-02-m08-02_admin_customer_customer_mail_all` / メール一括送信 / `functions/pf-eccube3/m08-02_admin_customer_customer_mail_all.md`
- `m08-04-m08-04_admin_customer_customer_edit` / 会員登録編集 / `functions/pf-eccube3/m08-04_admin_customer_customer_edit.md`
- `m08-05-admin_customer_point` / ポイント付与 / `functions/pf-eccube3/admin_customer_point.md`
- `m08-06-admin_customer_point` / ポイント履歴確認 / `functions/pf-eccube3/admin_customer_point.md`
- `m08-07-m08-07_admin_customer_customer_mail_history` / メール配信履歴 / `functions/pf-eccube3/m08-07_admin_customer_customer_mail_history.md`
- `m08-08-m08-08_admin_customer_customer_manual_mail` / 手動メール通知(入力画面) / `functions/pf-eccube3/m08-08_admin_customer_customer_manual_mail.md`
- `m08-09-m08-09_admin_customer_customer_delivery` / 配送先編集 / `functions/pf-eccube3/m08-09_admin_customer_customer_delivery.md`
- `m08-10-m08-10_admin_customer_customer_online_identification` / オンライン本人確認 / `functions/pf-eccube3/m08-10_admin_customer_customer_online_identification.md`
- `m08-11-m08-11_admin_customer_customer_analysis_tag_master` / 【新規】顧客分析タグ / `functions/ec-cube-enterprise/m08-11_admin_customer_customer_analysis_tag_master.md`
- `m08-12-m08-12_admin_customer_customer_group` / 顧客グループ管理 / `functions/pf-eccube3/m08-12_admin_customer_customer_group.md`
- `m08-13-m08-13_admin_customer_customer_blacklist` / ブラックリスト管理 / `functions/pf-eccube3/m08-13_admin_customer_customer_blacklist.md`
- `m08-14-m08-14_admin_customer_customer_resend_provisional_mail` / 会員登録仮登録完了メール再送 / `functions/pf-eccube3/m08-14_admin_customer_customer_resend_provisional_mail.md`

### excel_to_html/output/0208_基本設計仕様書(カード管理).html

Embedded sections: 10

- `m14-01-m14-01_admin_card_card_search` / カード一覧(検索入力) / `functions/pf-eccube3/m14-01_admin_card_card_search.md`
- `m14-02-m14-02_admin_card_card_csv_export` / カード一覧(検索入力) / `functions/pf-eccube3/m14-02_admin_card_card_csv_export.md`
- `m14-03-m14-03_admin_card_card_bulk_delete` / カード一覧(検索入力) / `functions/pf-eccube3/m14-03_admin_card_card_bulk_delete.md`
- `m14-04-m14-04_admin_card_card_register_update_delete` / カード詳細(登録・編集・削除) / `functions/pf-eccube3/m14-04_admin_card_card_register_update_delete.md`
- `m14-05-m14-05_admin_card_card_csv_import` / カード登録CSVアップロード / `functions/pf-eccube3/m14-05_admin_card_card_csv_import.md`
- `m14-06-m14-06_admin_card_cardset_list` / カードセット管理(一覧) / `functions/pf-eccube3/m14-06_admin_card_cardset_list.md`
- `m14-07-m14-07_admin_card_cardset_image_download` / 画像ダウンロード(セット別) / `functions/pf-eccube3/m14-07_admin_card_cardset_image_download.md`
- `m14-08-m14-08_admin_card_cardset_register_update_delete` / カードセット詳細（登録・編集・削除) / `functions/pf-eccube3/m14-08_admin_card_cardset_register_update_delete.md`
- `m14-09-m14-09_admin_card_format_list` / フォーマット一覧 / `functions/pf-eccube3/m14-09_admin_card_format_list.md`
- `m14-10-m14-10_admin_card_card_format_register_edit_delete` / フォーマット詳細(登録・編集・削除) / `functions/pf-eccube3/m14-10_admin_card_card_format_register_edit_delete.md`

### excel_to_html/output/0209_基本設計仕様書(基本情報設定).html

Embedded sections: 16

- `m10-01-m10-01_admin_shop_setting_setting_shop` / 基本設定(旧ショップマスター) / `functions/pf-eccube3/m10-01_admin_shop_setting_setting_shop.md`
- `m10-05-m10-05_admin_base_setting_setting_shop_delivery_free_conditions` / 基本設定(旧ショップマスター) / `functions/pf-eccube3/m10-05_admin_base_setting_setting_shop_delivery_free_conditions.md`
- `m10-06-m10-06_admin_base_setting_setting_shop_delivery` / 基本設定(旧ショップマスター) / `functions/pf-eccube3/m10-06_admin_base_setting_setting_shop_delivery.md`
- `m10-11-m10-11_admin_base_setting_setting_shop_order_status` / 基本設定(旧ショップマスター) / `functions/ec-cube-enterprise/m10-11_admin_base_setting_setting_shop_order_status.md`
- `m10-12-m10-12_admin_base_setting_setting_shop_calendar` / 基本設定(旧ショップマスター) / `functions/ec-cube-enterprise/m10-12_admin_base_setting_setting_shop_calendar.md`
- `m10-14-m10-14_admin_base_setting_setting_shop_mall_shop_list` / 基本設定(旧ショップマスター) / `functions/ec-cube-enterprise/m10-14_admin_base_setting_setting_shop_mall_shop_list.md`
- `m10-02-m10-02_admin_base_setting_setting_shop_tradelaw` / 特定商取引に関する法律 / `functions/pf-eccube3/m10-02_admin_base_setting_setting_shop_tradelaw.md`
- `m10-03-m10-03_admin_base_setting_setting_shop_customer_agreement` / 利用規約管理 / `functions/pf-eccube3/m10-03_admin_base_setting_setting_shop_customer_agreement.md`
- `m10-04-m10-04_admin_base_setting_setting_shop_payment` / 支払い方法 手数料設定 / `functions/pf-eccube3/m10-04_admin_base_setting_setting_shop_payment.md`
- `m10-07-m10-07_admin_base_setting_setting_shop_tax` / 税率設定 / `functions/pf-eccube3/m10-07_admin_base_setting_setting_shop_tax.md`
- `m10-08-m10-08_admin_base_setting_setting_shop_auto_mail` / 自動送信メール / `functions/pf-eccube3/m10-08_admin_base_setting_setting_shop_auto_mail.md`
- `m10-09-m10-09_admin_base_setting_setting_shop_mail` / メール設定 / `functions/pf-eccube3/m10-09_admin_base_setting_setting_shop_mail.md`
- `m10-10-m10-10_admin_base_setting_setting_shop_csv` / CSV出力項目設定 / `functions/pf-eccube3/m10-10_admin_base_setting_setting_shop_csv.md`
- `m10-13-m10-13_admin_base_setting_setting_shop_csv_custom` / カスタムCSV出力設定 / `functions/pf-eccube3/m10-13_admin_base_setting_setting_shop_csv_custom.md`
- `m10-15-m10-15_admin_base_setting_setting_shop_register` / 店舗登録 / `functions/pf-eccube3/m10-15_admin_base_setting_setting_shop_register.md`
- `m10-16-m10-16_admin_base_setting_setting_shop_additional_system` / 追加システム設定 / `functions/pf-eccube3/m10-16_admin_base_setting_setting_shop_additional_system.md`

### excel_to_html/output/0210_基本設計仕様書(コンテンツ管理).html

Embedded sections: 10

- `m09-01-m09-01_admin_content_content_news` / ページ管理(一覧) / `functions/ec-cube-enterprise/m09-01_admin_content_content_news.md`
- `m09-02-m09-02_admin_content_content_file` / ページ管理(一覧) / `functions/ec-cube-enterprise/m09-02_admin_content_content_file.md`
- `m09-03-m09-03_admin_content_content_layout` / ページ管理(一覧) / `functions/ec-cube-enterprise/m09-03_admin_content_content_layout.md`
- `m09-04-m09-04_admin_content_content_page` / ページ管理(一覧) / `functions/pf-eccube3/m09-04_admin_content_content_page.md`
- `m09-05-m09-05_admin_content_content_css` / ページ管理(一覧) / `functions/ec-cube-enterprise/m09-05_admin_content_content_css.md`
- `m09-06-m09-06_admin_content_content_js` / ページ管理(一覧) / `functions/ec-cube-enterprise/m09-06_admin_content_content_js.md`
- `m09-08-m09-08_admin_content_content_cache` / ページ管理(一覧) / `functions/ec-cube-enterprise/m09-08_admin_content_content_cache.md`
- `m09-09-m09-09_admin_content_content_maintenance` / ページ管理(一覧) / `functions/ec-cube-enterprise/m09-09_admin_content_content_maintenance.md`
- `m09-07-m09-07_admin_content_content_block` / ブロック管理(一覧) / `functions/pf-eccube3/m09-07_admin_content_content_block.md`
- `m09-10-m09-10_admin_content_content_branch_top_page` / 支店トップページ管理 / `functions/pf-eccube3/m09-10_admin_content_content_branch_top_page.md`

### excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html

Embedded sections: 10

- `m12-01-m12-01_admin_analytics_sales_daily_monthly_summary` / 日別・月別集計 集計一覧(検索項目-日別) / `functions/pf-eccube3/m12-01_admin_analytics_sales_daily_monthly_summary.md`
- `m12-02-m12-02_admin_analytics_sales_daily_monthly_csv_export` / 日別・月別集計 CSV出力 / `functions/pf-eccube3/m12-02_admin_analytics_sales_daily_monthly_csv_export.md`
- `m12-03-m12-03_admin_analytics_sales_order_analysis_summary` / 受注売上分析 集計一覧(検索項目) / `functions/pf-eccube3/m12-03_admin_analytics_sales_order_analysis_summary.md`
- `m12-04-m12-04_admin_analytics_sales_order_analysis_csv_export` / 受注売上分析 CSV出力(商品) / `functions/pf-eccube3/m12-04_admin_analytics_sales_order_analysis_csv_export.md`
- `m12-05-m12-05_admin_analytics_sales_arrival_notification_search_list` / 入荷通知依頼 一覧表示(検索項目) / `functions/pf-eccube3/m12-05_admin_analytics_sales_arrival_notification_search_list.md`
- `m12-06-m12-06_admin_analytics_sales_arrival_notification_csv_export` / 入荷通知依頼 CSV出力 / `functions/pf-eccube3/m12-06_admin_analytics_sales_arrival_notification_csv_export.md`
- `m12-07-m12-07_admin_analytics_sales_format_analysis_summary` / フォーマット売上分析 集計一覧(検索項目) / `functions/pf-eccube3/m12-07_admin_analytics_sales_format_analysis_summary.md`
- `m12-08-m12-08_admin_analytics_sales_format_analysis_csv_export` / フォーマット売上分析 CSV出力 / `functions/pf-eccube3/m12-08_admin_analytics_sales_format_analysis_csv_export.md`
- `m12-09-admin_analysis_used_card` / 特集タグ編集CSVダウンロード(検索項目) / `functions/pf-eccube3/admin_analysis_used_card.md`
- `m12-10-admin_analysis_used_card` / 特集タグ編集CSVダウンロード CSV出力 / `functions/pf-eccube3/admin_analysis_used_card.md`

### excel_to_html/output/0212_基本設計仕様書(デッキ管理).html

Embedded sections: 11

- `m15-01-m15-01_admin_deck_deck_search` / デッキ一覧(検索入力) / `functions/pf-eccube3/m15-01_admin_deck_deck_search.md`
- `m15-03-m15-03_admin_deck_deck_bulk_delete` / デッキ一覧(検索入力) / `functions/pf-eccube3/m15-03_admin_deck_deck_bulk_delete.md`
- `m15-04-m15-04_admin_deck_deck_bulk_update` / デッキ一覧(検索入力) / `functions/pf-eccube3/m15-04_admin_deck_deck_bulk_update.md`
- `m15-11-m15-11_admin_deck_deck_latest_event` / デッキ一覧(検索入力) / `functions/pf-eccube3/m15-11_admin_deck_deck_latest_event.md`
- `m15-02-m15-02_admin_deck_deck_csv_export` / デッキ編集 / `functions/pf-eccube3/m15-02_admin_deck_deck_csv_export.md`
- `m15-05-m15-05_admin_deck_deck_edit` / デッキ編集 / `functions/pf-eccube3/m15-05_admin_deck_deck_edit.md`
- `m15-06-m15-06_admin_deck_deck_csv_import` / デッキ登録CSVアップロード / `functions/pf-eccube3/m15-06_admin_deck_deck_csv_import.md`
- `m15-07-m15-07_admin_deck_deck_tag_list` / デッキタグ一覧 / `functions/pf-eccube3/m15-07_admin_deck_deck_tag_list.md`
- `m15-08-m15-08_admin_deck_deck_archetype_search` / アーキタイプ管理(検索入力) / `functions/pf-eccube3/m15-08_admin_deck_deck_archetype_search.md`
- `m15-09-m15-09_admin_deck_deck_archetype_crud` / アーキタイプ編集 / `functions/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.md`
- `m15-10-m15-10_admin_deck_archetype_csv_import` / アーキタイプ登録CSVアップロード / `functions/pf-eccube3/m15-10_admin_deck_archetype_csv_import.md`

### excel_to_html/output/0213_基本設計仕様書(データ管理).html

Embedded sections: 8

- `m16-01-m16-01_admin_data_top_banner` / バナー設定 / `functions/pf-eccube3/m16-01_admin_data_top_banner.md`
- `m16-02-m16-02_admin_data_data_top_banner` / 画像設定 / `functions/pf-eccube3/m16-02_admin_data_data_top_banner.md`
- `m16-03-m16-03_admin_data_data_holiday_add_delete` / 祝日管理 / `functions/pf-eccube3/m16-03_admin_data_data_holiday_add_delete.md`
- `m16-04-m16-04_admin_data_hareruya_mtg_masterdata` / MTGマスターデータ / `functions/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.md`
- `m16-05-m16-05_admin_data_data_sale_discount_list` / 販売割引率一覧 / `functions/pf-eccube3/m16-05_admin_data_data_sale_discount_list.md`
- `m16-06-m16-06_admin_data_data_buy_price_list` / 買取価格対応表(一覧) / `functions/pf-eccube3/m16-06_admin_data_data_buy_price_list.md`
- `m16-07-m16-07_admin_data_data_buy_price_list_edit` / 買取価格対応表(編集) / `functions/pf-eccube3/m16-07_admin_data_data_buy_price_list_edit.md`
- `m16-08-m16-08_admin_data_data_buy_discount_list` / 買取減額率一覧 / `functions/pf-eccube3/m16-08_admin_data_data_buy_discount_list.md`

### excel_to_html/output/0214_基本設計仕様書(イベント管理).html

Embedded sections: 15

- `m13-01-m13-01_admin_event_event_search_list` / イベント一覧(検索入力) / `functions/pf-eccube3/m13-01_admin_event_event_search_list.md`
- `m13-02-m13-02_admin_event_event_edit_delete` / イベント編集 / `functions/pf-eccube3/m13-02_admin_event_event_edit_delete.md`
- `m13-03-m13-03_admin_event_event_schedule_add` / 日程登録 / `functions/pf-eccube3/m13-03_admin_event_event_schedule_add.md`
- `m13-04-m13-04_admin_event_event_repeat_schedule` / 繰返日程追加 / `functions/pf-eccube3/m13-04_admin_event_event_repeat_schedule.md`
- `m13-05-m13-05_admin_event_event_duplicate_register` / 複製新規 / `functions/pf-eccube3/m13-05_admin_event_event_duplicate_register.md`
- `m13-06-m13-06_admin_event_event_entry_management_search` / イベント申込一覧(検索入力) / `functions/pf-eccube3/m13-06_admin_event_event_entry_management_search.md`
- `m13-07-m13-07_admin_event_event_entry_bulk_update` / イベント申込一括編集 / `functions/pf-eccube3/m13-07_admin_event_event_entry_bulk_update.md`
- `m13-08-m13-08_admin_event_event_deck_view` / デッキ表示 / `functions/pf-eccube3/m13-08_admin_event_event_deck_view.md`
- `m13-09-m13-09_admin_event_event_csv_export` / CSVダウンロード / `functions/pf-eccube3/m13-09_admin_event_event_csv_export.md`
- `m13-10-m13-10_admin_event_event_entry_edit` / イベント申込詳細・編集 / `functions/pf-eccube3/m13-10_admin_event_event_entry_edit.md`
- `m13-11-m13-11_admin_event_event_entry_search` / イベント申込登録(検索入力) / `functions/pf-eccube3/m13-11_admin_event_event_entry_search.md`
- `m13-12-m13-12_admin_event_event_entry_register` / イベント新規申込登録 / `functions/pf-eccube3/m13-12_admin_event_event_entry_register.md`
- `m13-13-m13-13_admin_event_event_entry_csv_import` / イベント一括登録CSV / `functions/pf-eccube3/m13-13_admin_event_event_entry_csv_import.md`
- `m13-14-m13-14_admin_event_event_banner` / バナー設定 / `functions/pf-eccube3/m13-14_admin_event_event_banner.md`
- `m13-15-m13-15_admin_event_event_image_setting` / 画像設定 / `functions/pf-eccube3/m13-15_admin_event_event_image_setting.md`

### excel_to_html/output/0301_基本設計仕様書(フロント_トップ).html

Embedded sections: 2

- `f01-01-f01-01_front_top_home_main` / ECTOP / `functions/pf-eccube3/f01-01_front_top_home_main.md`
- `f01-02-f01-02_front_top_home_branch` / 支店ECTOP / `functions/pf-eccube3/f01-02_front_top_home_branch.md`

### excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html

Embedded sections: 5

- `f02-01-f02-01_front_global_nav_global_nav_pc` / PC版ナビゲーション / `functions/pf-eccube3/f02-01_front_global_nav_global_nav_pc.md`
- `f02-02-f02-02_front_global_nav_global_nav_sp` / スマホ版ナビゲーション / `functions/pf-eccube3/f02-02_front_global_nav_global_nav_sp.md`
- `f02-03-f02-03_front_global_nav_branch_global_nav_pc` / 支店PC版ナビゲーション / `functions/pf-eccube3/f02-03_front_global_nav_branch_global_nav_pc.md`
- `f02-04-f02-04_front_global_nav_branch_global_nav_sp` / 支店スマホ版ナビゲーション / `functions/pf-eccube3/f02-04_front_global_nav_branch_global_nav_sp.md`
- `f02-05-f02-05_front_global_nav_global_nav_notification` / 通知 / `functions/pf-eccube3/f02-05_front_global_nav_global_nav_notification.md`

### excel_to_html/output/0303_基本設計仕様書(フロント_商品).html

Embedded sections: 8

- `f03-01-f03-01_front_product_product_search_list` / 商品一覧 / `functions/pf-eccube3/f03-01_front_product_product_search_list.md`
- `f03-02-f03-02_front_product_product_detail` / 商品詳細 / `functions/pf-eccube3/f03-02_front_product_product_detail.md`
- `f03-03-f03-03_front_product_product_detail_search` / 商品詳細検索 / `functions/pf-eccube3/f03-03_front_product_product_detail_search.md`
- `f03-04-f03-04_front_product_product_category_list` / カテゴリ一覧 / `functions/pf-eccube3/f03-04_front_product_product_category_list.md`
- `f03-05-f03-05_front_product_block_recommend` / 商品リコメンド / `functions/pf-eccube3/f03-05_front_product_block_recommend.md`
- `f03-06-f03-06_front_product_product_recently_viewed` / 最近チェックした商品 / `functions/pf-eccube3/f03-06_front_product_product_recently_viewed.md`
- `f03-07-f03-07_front_product_product_arrival_notification` / 入荷時通知 / `functions/pf-eccube3/f03-07_front_product_product_arrival_notification.md`
- `f03-08-f03-08_front_product_product_favorite` / お気に入り / `functions/pf-eccube3/f03-08_front_product_product_favorite.md`

### excel_to_html/output/0304_基本設計仕様書(フロント_注文).html

Embedded sections: 6

- `f04-01-f04-01_front_cart_cart_index` / 買い物かご / `functions/pf-eccube3/f04-01_front_cart_cart_index.md`
- `f04-02-f04-02_front_cart_shopping_order_method` / ご注文方法指定 / `functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md`
- `f04-03-f04-03_front_cart_shopping_delivery_edit` / 配送先の新規登録_変更 / `functions/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.md`
- `f04-04-f04-04_front_cart_shopping_complete` / 決済~購入完了 / `functions/pf-eccube3/f04-04_front_cart_shopping_complete.md`
- `f06-06-f06-06_front_member_mypage_order_history` / 注文購入履歴一覧 / `functions/pf-eccube3/f06-06_front_member_mypage_order_history.md`
- `f06-07-f06-07_front_member_mypage_order_history_detail` / 注文購入履歴詳細 / `functions/pf-eccube3/f06-07_front_member_mypage_order_history_detail.md`

### excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html

Embedded sections: 9

- `f05-01-f05-01_front_online_purchase_buy_top` / ネット買取トップページ / `functions/pf-eccube3/f05-01_front_online_purchase_buy_top.md`
- `f05-02-f05-02_front_online_purchase_buy_product_search` / ネット買取商品検索 / `functions/pf-eccube3/f05-02_front_online_purchase_buy_product_search.md`
- `f05-03-f05-03_front_online_purchase_buy_product_list` / ネット買取商品一覧 / `functions/pf-eccube3/f05-03_front_online_purchase_buy_product_list.md`
- `f05-04-f05-04_front_online_purchase_buy_product_detail` / ネット買取商品詳細 / `functions/pf-eccube3/f05-04_front_online_purchase_buy_product_detail.md`
- `f05-05-f05-05_front_online_purchase_buy_cart` / ネット買取カート / `functions/pf-eccube3/f05-05_front_online_purchase_buy_cart.md`
- `f05-06-f05-06_front_online_purchase_buy_shopping_complete` / ネット買取買取手続き～完了 / `functions/pf-eccube3/f05-06_front_online_purchase_buy_shopping_complete.md`
- `f06-11-f06-11_front_member_mypage_buy_history` / 買取履歴一覧 / `functions/pf-eccube3/f06-11_front_member_mypage_buy_history.md`
- `f06-12-f06-12_front_member_mypage_buy_history_detail` / 買取履歴詳細 / `functions/pf-eccube3/f06-12_front_member_mypage_buy_history_detail.md`
- `f06-12-f06-12_front_member_mypage_bulk_purchase_result` / まとめて買取査定結果 / `functions/pf-eccube3/f06-12_front_member_mypage_bulk_purchase_result.md`

### excel_to_html/output/0306_基本設計仕様書(フロント_会員).html

Embedded sections: 21

- `f06-01-f06-01_front_member_customer_entry` / 新規会員登録 / `functions/pf-eccube3/f06-01_front_member_customer_entry.md`
- `f06-19-f06-19_front_member_mypage_credit_card` / 新規会員登録 / `functions/ec-cube-enterprise/f06-19_front_member_mypage_credit_card.md`
- `f06-02-f06-02_front_member_entry_activate` / 本会員登録 / `functions/pf-eccube3/f06-02_front_member_entry_activate.md`
- `f06-03-f06-03_front_member_customer_login` / ログイン / `functions/pf-eccube3/f06-03_front_member_customer_login.md`
- `f06-04-f06-04_front_member_forgot_password_reset` / パスワード再発行 / `functions/pf-eccube3/f06-04_front_member_forgot_password_reset.md`
- `f06-05-f06-05_front_member_mypage_index` / マイページ / `functions/pf-eccube3/f06-05_front_member_mypage_index.md`
- `f06-08-f06-08_front_member_mypage_arrival_notification` / 入荷待ち商品一覧 / `functions/pf-eccube3/f06-08_front_member_mypage_arrival_notification.md`
- `f06-09-f06-09_front_member_mypage_favorite_product` / お気に入り商品一覧 / `functions/pf-eccube3/f06-09_front_member_mypage_favorite_product.md`
- `f06-10-f06-10_front_member_mypage_point_history` / ポイント履歴 / `functions/pf-eccube3/f06-10_front_member_mypage_point_history.md`
- `f06-13-f06-13_front_member_mypage_online_identification` / オンライン本人確認 / `functions/pf-eccube3/f06-13_front_member_mypage_online_identification.md`
- `f06-14-f06-14_front_member_mypage_event_reserved_list` / マイイベント・デッキ登録 / `functions/pf-eccube3/f06-14_front_member_mypage_event_reserved_list.md`
- `f06-16-f06-16_front_member_mypage_event_deck_edit` / 大会デッキ登録編集 / `functions/pf-eccube3/f06-16_front_member_mypage_event_deck_edit.md`
- `f06-17-f06-17_front_member_mypage_event_deck_complete` / 大会デッキ登録確認～完了 / `functions/pf-eccube3/f06-17_front_member_mypage_event_deck_complete.md`
- `f06-18-f06-18_front_member_mypage_customer_edit` / 会員情報変更 / `functions/pf-eccube3/f06-18_front_member_mypage_customer_edit.md`
- `f06-20-f06-20_front_member_mypage_delivery_edit` / 配送先新規登録・変更 / `functions/pf-eccube3/f06-20_front_member_mypage_delivery_edit.md`
- `f06-21-f06-21_front_member_mypage_withdraw` / 退会 / `functions/pf-eccube3/f06-21_front_member_mypage_withdraw.md`
- `f06-22-f06-22_front_member_mypage_contact` / お問い合わせ / `functions/pf-eccube3/f06-22_front_member_mypage_contact.md`
- `f06-23-front_contact_history` / お問い合わせ履歴 / `functions/pf-eccube3/front_contact_history.md`
- `f06-24-front_contact_history` / お問い合わせ履歴詳細 / `functions/pf-eccube3/front_contact_history.md`
- `f06-25-f06-25_front_member_store_order_call_number` / 店頭注文呼び出し番号表示 / `functions/pf-eccube3/f06-25_front_member_store_order_call_number.md`
- `f06-26-f06-26_front_member_store_pc_account_control` / 店頭PC用アカウント制御 / `functions/pf-eccube3/f06-26_front_member_store_pc_account_control.md`

### excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html

Embedded sections: 4

- `f07-01-f07-01_front_event_event_top` / イベント大会TOP / `functions/pf-eccube3/f07-01_front_event_event_top.md`
- `f07-02-f07-02_front_event_event_search` / 大会詳細検索 / `functions/pf-eccube3/f07-02_front_event_event_search.md`
- `f07-03-f07-03_front_event_event_detail` / 大会詳細 / `functions/pf-eccube3/f07-03_front_event_event_detail.md`
- `f07-04-f07-04_front_event_event_entry_complete` / 大会申込～完了 / `functions/pf-eccube3/f07-04_front_event_event_entry_complete.md`

### excel_to_html/output/0308_基本設計仕様書(フロント_店頭買取).html

Embedded sections: 3

- `f08-01-f08-01_front_store_purchase_otc_buy_entry_login` / 店頭買取査定申込前ログイン / `functions/pf-eccube3/f08-01_front_store_purchase_otc_buy_entry_login.md`
- `f08-02-f08-02_front_store_purchase_otc_buy_entry_input` / 店頭買取査定申込情報入力 / `functions/pf-eccube3/f08-02_front_store_purchase_otc_buy_entry_input.md`
- `f08-03-f08-03_front_store_purchase_otc_buy_entry_complete` / 店頭買取査定申込登録確認～完了 / `functions/pf-eccube3/f08-03_front_store_purchase_otc_buy_entry_complete.md`

### excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html

Embedded sections: 4

- `b01-02-b01-02_batch_data_stock_shortage` / 在庫切れバッチ / `functions/ec-cube-enterprise/b01-02_batch_data_stock_shortage.md`
- `b01-03-b01-03_batch_data_stock_warning` / 在庫警戒バッチ / `functions/ec-cube-enterprise/b01-03_batch_data_stock_warning.md`
- `b02-03-b02-03_batch_product_product_storage_period_summary` / 期間別入庫数集計バッチ / `functions/pf-eccube3/b02-03_batch_product_product_storage_period_summary.md`
- `b02-07-b02-07_batch_product_product_weekly_stock_history_update` / 週間在庫履歴更新バッチ / `functions/pf-eccube3/b02-07_batch_product_product_weekly_stock_history_update.md`

### excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html

Embedded sections: 5

- `b02-01-b02-01_batch_product_product_sales_period_summary` / 期間別販売数集計 / `functions/pf-eccube3/b02-01_batch_product_product_sales_period_summary.md`
- `b02-02-b02-02_batch_product_product_arrival_notification_cancel` / 入荷通知キャンセル / `functions/pf-eccube3/b02-02_batch_product_product_arrival_notification_cancel.md`
- `b02-04-b02-04_batch_product_product_no_section_check` / 商品部門未設定チェック / `functions/pf-eccube3/b02-04_batch_product_product_no_section_check.md`
- `b02-05-b02-05_batch_product_product_favorite_sale_notification` / お気に入り商品セール通知 / `functions/pf-eccube3/b02-05_batch_product_product_favorite_sale_notification.md`
- `b02-06-b02-06_batch_product_product_stock_initialize` / 在庫初期化 / `functions/pf-eccube3/b02-06_batch_product_product_stock_initialize.md`

### excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html

Embedded sections: 9

- `b05-01-b05-01_batch_order_order_copy_order_number` / 注文番号登録 / `functions/pf-eccube3/b05-01_batch_order_order_copy_order_number.md`
- `b05-02-b05-02_batch_order_order_resend_mail` / 購入完了手続き再処理 / `functions/pf-eccube3/b05-02_batch_order_order_resend_mail.md`
- `b05-03-b05-03_batch_order_order_store_call_number_initialize` / 店頭注文番号初期化 / `functions/pf-eccube3/b05-03_batch_order_order_store_call_number_initialize.md`
- `b05-04-b05-04_batch_order_order_resend_smaregi_product` / スマレジ商品再連携 / `functions/pf-eccube3/b05-04_batch_order_order_resend_smaregi_product.md`
- `b05-05-b05-05_batch_order_order_delete_smaregi_product` / スマレジ商品削除 / `functions/pf-eccube3/b05-05_batch_order_order_delete_smaregi_product.md`
- `b05-06-b05-06_batch_order_order_check_duplicate_point` / ポイント二重登録チェック / `functions/pf-eccube3/b05-06_batch_order_order_check_duplicate_point.md`
- `b05-07-b05-07_batch_order_order_check_not_reflected_point` / ポイント利用未反映チェック / `functions/pf-eccube3/b05-07_batch_order_order_check_not_reflected_point.md`
- `b05-08-b05-08_batch_order_smaregi_check_error_order` / スマレジEC受注連携エラー再連携 / `functions/pf-eccube3/b05-08_batch_order_smaregi_check_error_order.md`
- `b05-09-b05-09_batch_order_smaregi_check_transaction` / スマレジ取引連携エラー再連携 / `functions/pf-eccube3/b05-09_batch_order_smaregi_check_transaction.md`

### excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html

Embedded sections: 2

- `b06-01-b06-01_batch_purchase_purchase_auto_stock` / 【新規】買取自動入庫バッチ / `functions/ec-cube-enterprise/b06-01_batch_purchase_purchase_auto_stock.md`
- `b06-02-b06-02_batch_purchase_purchase_summary` / 買取集計バッチ / `functions/pf-eccube3/b06-02_batch_purchase_purchase_summary.md`

### excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html

Embedded sections: 6

- `b08-01-b08-01_batch_customer_customer_send_account_migration` / リニューアル時パスワードリセットメール送信 / `functions/pf-eccube3/b08-01_batch_customer_customer_send_account_migration.md`
- `b08-04-b08-04_batch_customer_customer_check_blank_required` / リニューアル時パスワードリセットメール送信 / `functions/pf-eccube3/b08-04_batch_customer_customer_check_blank_required.md`
- `b08-02-b08-02_batch_customer_customer_lost_points` / ポイント失効 / `functions/pf-eccube3/b08-02_batch_customer_customer_lost_points.md`
- `b08-03-b08-03_batch_customer_customer_point_expire_notification` / ポイント有効期限通知 / `functions/pf-eccube3/b08-03_batch_customer_customer_point_expire_notification.md`
- `b08-05-b08-05_batch_customer_customer_adjust_point_variance` / ポイント差分発生通知 / `functions/pf-eccube3/b08-05_batch_customer_customer_adjust_point_variance.md`
- `b08-06-b08-06_batch_customer_smaregi_update_point` / スマレジ使用ポイント連携 / `functions/pf-eccube3/b08-06_batch_customer_smaregi_update_point.md`

### excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html

Embedded sections: 2

- `b13-01-b13-01_batch_event_event_check_processing_payment` / 決済処理中チェックバッチ / `functions/pf-eccube3/b13-01_batch_event_event_check_processing_payment.md`
- `b13-02-b13-02_batch_event_event_check_cvs_payment` / コンビニ支払チェックバッチ / `functions/pf-eccube3/b13-02_batch_event_event_check_cvs_payment.md`

### excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html

Embedded sections: 2

- `a01-01-a01-01_api_stock_smaregi_stock_sync` / スマレジ連携処理 / `functions/ec-cube-enterprise/a01-01_api_stock_smaregi_stock_sync.md`
- `a01-02-a01-02_api_stock_smaregi_webhook_error_retry` / スマレジwebhook連携エラー再連携 / `functions/ec-cube-enterprise/a01-02_api_stock_smaregi_webhook_error_retry.md`

### excel_to_html/output/0502_基本設計仕様書(API_商品管理).html

Embedded sections: 5

- `a02-01-a02-01_api_product_popup_product` / ポップアップ用商品情報取得 / `functions/pf-api/a02-01_api_product_popup_product.md`
- `a02-02-a02-02_api_product_popup_card` / ポップアップ用カード情報取得 / `functions/pf-api/a02-02_api_product_popup_card.md`
- `a02-03-a02-03_api_product_popup_product_old` / ポップアップ用商品情報取得（旧商品ID） / `functions/pf-api/a02-03_api_product_popup_product_old.md`
- `a02-04-a02-04_api_product_popup_card_old` / ポップアップ用カード情報取得（旧商品ID） / `functions/pf-api/a02-04_api_product_popup_card_old.md`
- `a02-05-a02-05_api_product_updated_product_class` / 更新商品規格取得 / `functions/pf-api/a02-05_api_product_updated_product_class.md`

### excel_to_html/output/0505_基本設計仕様書(API_受注管理).html

Embedded sections: 4

- `a05-01-api_order_print_direct` / 注文印刷_印刷情報をプリンタへ送信 / `functions/pf-api/api_order_print_direct.md`
- `a05-02-api_order_print_direct` / 注文印刷_該当受注のステータスを印刷済みに変更 / `functions/pf-api/api_order_print_direct.md`
- `a05-03-a05-03_api_order_order_store_call_number` / 店頭注文番号取得 / `functions/pf-eccube3/a05-03_api_order_order_store_call_number.md`
- `a05-04-a05-04_api_order_order_smaregi_receive` / スマレジ受信処理 / `functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md`

### excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html

Embedded sections: 18

- `a06-01-a06-01_api_store_purchase_admin_login` / 買取アプリ用ログイン / `functions/pf-api/a06-01_api_store_purchase_admin_login.md`
- `a06-02-a06-02_api_store_purchase_otc_buy_order_list` / 店頭買取情報取得 / `functions/pf-api/a06-02_api_store_purchase_otc_buy_order_list.md`
- `a06-15-a06-15_api_store_purchase_otc_buy_order_same_store_members` / 店頭買取情報取得 / `functions/ec-cube-enterprise/a06-15_api_store_purchase_otc_buy_order_same_store_members.md`
- `a06-03-a06-03_api_store_purchase_otc_buy_order_update` / 店頭買取情報更新 / `functions/pf-api/a06-03_api_store_purchase_otc_buy_order_update.md`
- `a06-04-a06-04_api_store_purchase_otc_buy_order_free_comment` / 店頭買取情報コメント更新 / `functions/pf-api/a06-04_api_store_purchase_otc_buy_order_free_comment.md`
- `a06-05-a06-05_api_store_purchase_otc_buy_order_status` / 店頭買取情報ステータス更新 / `functions/pf-api/a06-05_api_store_purchase_otc_buy_order_status.md`
- `a06-06-api_buying_products_by_detail` / カード詳細IDから買取用商品情報を取得 / `functions/pf-api/api_buying_products_by_detail.md`
- `a06-07-api_buying_products_by_ids` / 商品IDリストから買取用商品情報を取得 / `functions/pf-api/api_buying_products_by_ids.md`
- `a06-09-api_product_search_by_name` / 商品IDリストから買取用商品情報を取得 / `functions/pf-api/api_product_search_by_name.md`
- `a06-10-api_buying_products_by_ids` / 商品IDリストから買取用商品情報を取得 / `functions/pf-api/api_buying_products_by_ids.md`
- `a06-08-a06-08_api_store_purchase_buying_products_search` / カード名から買取用商品情報を取得 / `functions/pf-api/a06-08_api_store_purchase_buying_products_search.md`
- `a06-17-api_buying_products_by_detail` / カード名から買取用商品情報を取得 / `functions/pf-api/api_buying_products_by_detail.md`
- `a06-18-api_buying_products_by_ids` / カード名から買取用商品情報を取得 / `functions/pf-api/api_buying_products_by_ids.md`
- `a06-11-a06-11_api_store_purchase_section_list` / 部門一覧を取得 / `functions/pf-api/a06-11_api_store_purchase_section_list.md`
- `a06-12-a06-12_api_store_purchase_fixed_price_section` / 固定価格部門の部門情報を取得 / `functions/pf-api/a06-12_api_store_purchase_fixed_price_section.md`
- `a06-13-a06-13_api_store_purchase_otc_buy_order_identification` / 本人確認更新 / `functions/pf-api/a06-13_api_store_purchase_otc_buy_order_identification.md`
- `a06-14-a06-14_api_store_purchase_otc_buy_order_partial_cancel_sync` / 【新規】店頭買取情報一部キャンセル情報連携 / `functions/ec-cube-enterprise/a06-14_api_store_purchase_otc_buy_order_partial_cancel_sync.md`
- `a06-16-a06-16_api_store_purchase_otc_buy_order_double_check_member_update` / 【新規】ダブルチェック者更新 / `functions/ec-cube-enterprise/a06-16_api_store_purchase_otc_buy_order_double_check_member_update.md`

### excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html

Embedded sections: 7

- `a07-01-a07-01_api_online_purchase_bulk_purchase_id` / まとめて買取商品IDの取得 / `functions/pf-api/a07-01_api_online_purchase_bulk_purchase_id.md`
- `a07-02-a07-02_api_online_purchase_buy_order_list` / ネット買取受注一覧取得 / `functions/pf-api/a07-02_api_online_purchase_buy_order_list.md`
- `a07-03-a07-03_api_online_purchase_buy_order_free_comment` / ネット買取受注コメント更新 / `functions/pf-api/a07-03_api_online_purchase_buy_order_free_comment.md`
- `a07-04-a07-04_api_online_purchase_buy_order_status` / ネット買取受注ステータス更新 / `functions/pf-api/a07-04_api_online_purchase_buy_order_status.md`
- `a07-05-a07-05_api_online_purchase_buy_order_end` / ネット買取注文の査定終了処理 / `functions/pf-api/a07-05_api_online_purchase_buy_order_end.md`
- `a07-07-a07-07_api_online_purchase_buy_order_indivisual_input_product` / 複数ネット買取IDからネット買取受注の商品一覧を取得 / `functions/pf-api/a07-07_api_online_purchase_buy_order_indivisual_input_product.md`
- `a07-06-a07-06_api_online_purchase_buy_main_card` / 複数ネット買取IDから個別入力商品の一覧を取得 / `functions/pf-api/a07-06_api_online_purchase_buy_main_card.md`

### excel_to_html/output/0514_基本設計仕様書(API_カード管理).html

Embedded sections: 3

- `a14-01-a14-01_api_card_card_get` / カードIDからカード情報を取得 / `functions/pf-api/a14-01_api_card_card_get.md`
- `a14-02-a14-02_api_card_card_detail_get` / カード詳細IDからカード詳細情報を取得 / `functions/pf-api/a14-02_api_card_card_detail_get.md`
- `a14-03-a14-03_api_card_card_search_single` / 検索クエリに一致するカード情報1件を取得 / `functions/pf-api/a14-03_api_card_card_search_single.md`

### excel_to_html/output/0516_基本設計仕様書(API_データ管理).html

Embedded sections: 2

- `a16-01-api_top_banner_get` / トップバナー情報取得 / `functions/pf-api/api_top_banner_get.md`
- `a16-02-api_top_banner_list` / 言語コードに紐づいたトップバナーの情報一覧を取得 / `functions/pf-api/api_top_banner_list.md`

### excel_to_html/output/0517_基本設計仕様書(API_その他).html

Embedded sections: 5

- `a17-01-a17-01_api_other_article_search_single` / 検索クエリに一致する記事情報1件を取得 / `functions/pf-api/a17-01_api_other_article_search_single.md`
- `a17-02-a17-02_api_other_article_related` / 記事IDに関連する記事情報を取得 / `functions/pf-api/a17-02_api_other_article_related.md`
- `a17-03-a17-03_api_other_point_granter` / PointGranterAPI連携 / `functions/pf-eccube3/a17-03_api_other_point_granter.md`
- `a17-04-a17-04_api_other_product_detail` / 商品IDに紐づく商品詳細の情報を取得 / `functions/pf-api/a17-04_api_other_product_detail.md`
- `a17-05-api_product_search_by_name` / 商品名から商品詳細の情報を取得 / `functions/pf-api/api_product_search_by_name.md`

### excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html

Embedded sections: 3

- `o01-01-o01-01_other_mtg_buyer_mtg_buyer_store_purchase` / MTGバイヤー店頭買取査定 / `functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md`
- `o01-02-o01-02_other_mtg_buyer_mtg_buyer_online_purchase` / MTGバイヤー店頭買取査定 / `functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md`
- `o01-03-o01-03_other_mtg_buyer_mtg_buyer_stock_inbound` / MTGバイヤー店頭買取査定 / `functions/pf-eccube3/o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.md`
