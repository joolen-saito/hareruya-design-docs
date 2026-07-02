# 未展開候補サマリ

- 生成上限: `90` 件/ファイル
- 候補順位は既存ジェネレータのスコア順であり、P1/P2/P3の優先度順ではない
- 出力済みケース数は現行ジェネレータロジックによる再計算値
- 対象機能数: 380
- 候補観点数: 53450
- 出力済みケース数: 30062
- 未展開候補数: 23388
- 未展開P1/P2/P3: 8264 / 12937 / 2187
- 未展開あり機能数: 285
- 既存Markdownと現行ジェネレータ再計算の差分あり機能数: 0

## 区分別

| 区分 | 機能数 | 候補観点数 | 出力済み | 未展開 | P1 | P2 | P3 | 未展開あり機能数 |
|------|-------:|-----------:|---------:|-------:|---:|---:|---:|-----------------:|
| API | 65 | 2756 | 2668 | 88 | 52 | 18 | 18 | 4 |
| その他 | 3 | 150 | 150 | 0 | 0 | 0 | 0 | 0 |
| バッチ | 28 | 1786 | 1733 | 53 | 52 | 0 | 1 | 3 |
| フロント | 57 | 7385 | 5105 | 2280 | 907 | 1105 | 268 | 54 |
| 管理画面 | 227 | 41373 | 20406 | 20967 | 7253 | 11814 | 1900 | 224 |

## 未展開が多い機能

| 未展開 | 候補数 | 出力済み | 区分 | 機能No | 機能名 | 出力ファイル |
|-------:|-------:|---------:|------|--------|--------|--------------|
| 217 | 307 | 90 | 管理画面 | M04-21 | 在庫変更CSV登録 | `m04_21_admin_stock_stock_csv_import_it_cases.md` |
| 213 | 303 | 90 | 管理画面 | M05-10 | 納品書印刷（英語） | `m05_10_admin_order_order_print_delivery_slips_en_it_cases.md` |
| 198 | 288 | 90 | 管理画面 | M05-23 | 出荷指示：納品書印刷（英語） | `m05_23_admin_order_order_shipping_standby_print_delivery_slips_en_it_cases.md` |
| 193 | 283 | 90 | 管理画面 | M09-02 | ファイル管理 | `m09_02_admin_content_content_file_it_cases.md` |
| 192 | 282 | 90 | 管理画面 | M13-09 | CSVダウンロード | `m13_09_admin_event_event_csv_export_it_cases.md` |
| 191 | 281 | 90 | 管理画面 | M15-10 | アーキタイプ登録CSV | `m15_10_admin_deck_archetype_csv_import_it_cases.md` |
| 189 | 279 | 90 | 管理画面 | M03-06 | 商品情報カスタムCSV出力 | `m03_06_admin_product_product_custom_csv_export_it_cases.md` |
| 189 | 279 | 90 | 管理画面 | M05-05 | 配送カスタムCSV出力 | `m05_05_admin_order_order_shipping_custom_csv_export_it_cases.md` |
| 182 | 272 | 90 | 管理画面 | M03-23 | 買取/販売価格履歴検索/一覧 | `m03_23_admin_product_product_buy_sale_price_history_it_cases.md` |
| 182 | 272 | 90 | 管理画面 | M05-24 | 出荷実績入力用CSV出力 | `m05_24_admin_order_order_shipping_export_for_import_it_cases.md` |
| 182 | 272 | 90 | 管理画面 | M14-05 | カードCSV登録 | `m14_05_admin_card_card_csv_import_it_cases.md` |
| 181 | 271 | 90 | 管理画面 | M03-27 | グッズ商品CSV登録 | `m03_27_admin_product_product_goods_csv_import_it_cases.md` |
| 181 | 271 | 90 | 管理画面 | M03-40 | 棚番号更新CSV登録 | `m03_40_admin_product_product_shelf_number_csv_import_it_cases.md` |
| 180 | 270 | 90 | 管理画面 | M06-06 | 買取商品履歴全件CSV出力 | `m06_06_admin_store_purchase_purchase_store_history_csv_export_all_it_cases.md` |
| 179 | 269 | 90 | 管理画面 | M03-26 | カード商品CSV登録 | `m03_26_admin_product_product_card_csv_import_it_cases.md` |
| 179 | 269 | 90 | 管理画面 | M04-18 | 在庫履歴CSV出力 | `m04_18_admin_stock_stock_history_csv_export_it_cases.md` |
| 178 | 268 | 90 | 管理画面 | M03-28 | 商品タグ更新CSV登録 | `m03_28_admin_product_product_product_tag_csv_import_it_cases.md` |
| 178 | 268 | 90 | 管理画面 | M03-30 | 価格変更CSV登録 | `m03_30_admin_product_product_product_price_csv_import_it_cases.md` |
| 178 | 268 | 90 | 管理画面 | M03-33 | セール用高額商品価格変更CSV登録 | `m03_33_admin_product_product_sale_high_price_csv_import_it_cases.md` |
| 178 | 268 | 90 | 管理画面 | M03-35 | 部門更新CSV登録 | `m03_35_admin_product_product_section_csv_import_it_cases.md` |
| 178 | 268 | 90 | 管理画面 | M03-38 | 商品公開CSV登録 | `m03_38_admin_product_product_status_csv_it_cases.md` |
| 178 | 268 | 90 | 管理画面 | M05-04 | 配送CSV出力 | `m05_04_admin_order_order_shipping_csv_export_it_cases.md` |
| 178 | 268 | 90 | 管理画面 | M15-06 | デッキ登録CSV | `m15_06_admin_deck_deck_csv_import_it_cases.md` |
| 177 | 267 | 90 | 管理画面 | M03-37 | 略称タグ更新CSV登録 | `m03_37_admin_product_product_storage_code_csv_import_it_cases.md` |
| 172 | 262 | 90 | 管理画面 | M03-32 | 高額商品価格変更CSV登録 | `m03_32_admin_product_product_simple_high_price_csv_import_it_cases.md` |
| 171 | 261 | 90 | 管理画面 | M12-06 | 入荷通知依頼 CSVダウンロード | `m12_06_admin_analytics_sales_arrival_notification_csv_export_it_cases.md` |
| 170 | 260 | 90 | 管理画面 | M03-29 | 売上分析タグ更新CSV登録 | `m03_29_admin_product_product_tag_sales_analysis_csv_import_it_cases.md` |
| 170 | 260 | 90 | 管理画面 | M03-36 | 買取減額率変更CSV登録 | `m03_36_admin_product_product_buy_discount_csv_import_it_cases.md` |
| 170 | 260 | 90 | 管理画面 | M03-41 | カテゴリCSV登録 | `m03_41_admin_product_product_category_csv_import_it_cases.md` |
| 170 | 260 | 90 | 管理画面 | M05-21 | ピッキングリスト印刷 | `m05_21_admin_order_order_shipping_standby_picking_list_print_it_cases.md` |

## 未展開P1が多い機能

| P1 | P2 | P3 | 未展開 | 区分 | 機能No | 機能名 | 出力ファイル |
|---:|---:|---:|-------:|------|--------|--------|--------------|
| 63 | 112 | 14 | 189 | 管理画面 | M05-05 | 配送カスタムCSV出力 | `m05_05_admin_order_order_shipping_custom_csv_export_it_cases.md` |
| 63 | 115 | 15 | 193 | 管理画面 | M09-02 | ファイル管理 | `m09_02_admin_content_content_file_it_cases.md` |
| 63 | 113 | 15 | 191 | 管理画面 | M15-10 | アーキタイプ登録CSV | `m15_10_admin_deck_archetype_csv_import_it_cases.md` |
| 62 | 113 | 14 | 189 | 管理画面 | M03-06 | 商品情報カスタムCSV出力 | `m03_06_admin_product_product_custom_csv_export_it_cases.md` |
| 62 | 115 | 15 | 192 | 管理画面 | M13-09 | CSVダウンロード | `m13_09_admin_event_event_csv_export_it_cases.md` |
| 56 | 95 | 15 | 166 | 管理画面 | M05-08 | スタック用紙印刷 | `m05_08_admin_order_order_stack_paper_print_it_cases.md` |
| 52 | 103 | 15 | 170 | 管理画面 | M05-21 | ピッキングリスト印刷 | `m05_21_admin_order_order_shipping_standby_picking_list_print_it_cases.md` |
| 51 | 116 | 15 | 182 | 管理画面 | M03-23 | 買取/販売価格履歴検索/一覧 | `m03_23_admin_product_product_buy_sale_price_history_it_cases.md` |
| 51 | 113 | 15 | 179 | 管理画面 | M03-26 | カード商品CSV登録 | `m03_26_admin_product_product_card_csv_import_it_cases.md` |
| 51 | 116 | 14 | 181 | 管理画面 | M03-27 | グッズ商品CSV登録 | `m03_27_admin_product_product_goods_csv_import_it_cases.md` |
| 51 | 113 | 14 | 178 | 管理画面 | M03-28 | 商品タグ更新CSV登録 | `m03_28_admin_product_product_product_tag_csv_import_it_cases.md` |
| 51 | 113 | 14 | 178 | 管理画面 | M03-30 | 価格変更CSV登録 | `m03_30_admin_product_product_product_price_csv_import_it_cases.md` |
| 51 | 113 | 14 | 178 | 管理画面 | M03-33 | セール用高額商品価格変更CSV登録 | `m03_33_admin_product_product_sale_high_price_csv_import_it_cases.md` |
| 51 | 113 | 14 | 178 | 管理画面 | M03-35 | 部門更新CSV登録 | `m03_35_admin_product_product_section_csv_import_it_cases.md` |
| 51 | 112 | 14 | 177 | 管理画面 | M03-37 | 略称タグ更新CSV登録 | `m03_37_admin_product_product_storage_code_csv_import_it_cases.md` |
| 51 | 113 | 14 | 178 | 管理画面 | M03-38 | 商品公開CSV登録 | `m03_38_admin_product_product_status_csv_it_cases.md` |
| 51 | 116 | 14 | 181 | 管理画面 | M03-40 | 棚番号更新CSV登録 | `m03_40_admin_product_product_shelf_number_csv_import_it_cases.md` |
| 51 | 114 | 14 | 179 | 管理画面 | M04-18 | 在庫履歴CSV出力 | `m04_18_admin_stock_stock_history_csv_export_it_cases.md` |
| 51 | 113 | 14 | 178 | 管理画面 | M05-04 | 配送CSV出力 | `m05_04_admin_order_order_shipping_csv_export_it_cases.md` |
| 51 | 116 | 15 | 182 | 管理画面 | M05-24 | 出荷実績入力用CSV出力 | `m05_24_admin_order_order_shipping_export_for_import_it_cases.md` |
| 51 | 115 | 14 | 180 | 管理画面 | M06-06 | 買取商品履歴全件CSV出力 | `m06_06_admin_store_purchase_purchase_store_history_csv_export_all_it_cases.md` |
| 51 | 116 | 15 | 182 | 管理画面 | M14-05 | カードCSV登録 | `m14_05_admin_card_card_csv_import_it_cases.md` |
| 51 | 113 | 14 | 178 | 管理画面 | M15-06 | デッキ登録CSV | `m15_06_admin_deck_deck_csv_import_it_cases.md` |
| 49 | 101 | 15 | 165 | 管理画面 | M03-19 | 部門CSV出力 | `m03_19_admin_product_product_section_csv_export_it_cases.md` |
| 46 | 11 | 6 | 63 | 管理画面 | M15-03 | 一括削除 | `m15_03_admin_deck_deck_bulk_delete_it_cases.md` |
| 45 | 16 | 10 | 71 | 管理画面 | M03-10 | 買取・販売価格一括編集 | `m03_10_admin_product_product_bulk_buy_standard_price_edit_it_cases.md` |
| 45 | 16 | 10 | 71 | 管理画面 | M05-20 | 出荷指示リスト詳細編集/削除 | `m05_20_admin_order_order_shipping_standby_detail_edit_delete_it_cases.md` |
| 45 | 15 | 10 | 70 | 管理画面 | M14-03 | 一括削除 | `m14_03_admin_card_card_bulk_delete_it_cases.md` |
| 45 | 20 | 2 | 67 | 管理画面 | M15-05 | デッキ新規登録/編集/削除/複製 | `m15_05_admin_deck_deck_edit_it_cases.md` |
| 45 | 15 | 10 | 70 | 管理画面 | M15-07 | デッキタグ一覧 | `m15_07_admin_deck_deck_tag_list_it_cases.md` |
