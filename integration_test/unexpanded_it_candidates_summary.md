# 未展開候補サマリ

- 生成上限: `90` 件/ファイル
- 候補順位は既存ジェネレータのスコア順であり、P1/P2/P3の優先度順ではない
- 出力済みケース数は現行ジェネレータロジックによる再計算値
- 対象機能数: 391
- 候補観点数: 69065
- 出力済みケース数: 40666
- 未展開候補数: 28399
- 未展開P1/P2/P3: 4798 / 20107 / 3494
- 未展開あり機能数: 300
- 既存Markdownと現行ジェネレータ再計算の差分あり機能数: 300

## 区分別

| 区分 | 機能数 | 候補観点数 | 出力済み | 未展開 | P1 | P2 | P3 | 未展開あり機能数 |
|------|-------:|-----------:|---------:|-------:|---:|---:|---:|-----------------:|
| API | 66 | 2816 | 2786 | 30 | 16 | 8 | 6 | 4 |
| その他 | 3 | 306 | 273 | 33 | 3 | 30 | 0 | 3 |
| バッチ | 30 | 1876 | 1848 | 28 | 27 | 0 | 1 | 1 |
| フロント | 58 | 11267 | 6333 | 4934 | 570 | 3789 | 575 | 58 |
| 管理画面 | 234 | 52800 | 29426 | 23374 | 4182 | 16280 | 2912 | 234 |

## 未展開が多い機能

| 未展開 | 候補数 | 出力済み | 区分 | 機能No | 機能名 | 出力ファイル |
|-------:|-------:|---------:|------|--------|--------|--------------|
| 146 | 260 | 114 | フロント | F03-07 | 入荷時通知 | `f03_07_front_product_product_arrival_notification_it_cases.md` |
| 146 | 260 | 114 | フロント | F06-16 | 大会デッキ登録編集 | `f06_16_front_member_mypage_event_deck_edit_it_cases.md` |
| 146 | 260 | 114 | 管理画面 | M04-03 | 在庫一括編集 | `m04_03_admin_stock_stock_bulk_edit_it_cases.md` |
| 146 | 260 | 114 | 管理画面 | M07-03 | 買取情報編集 | `m07_03_admin_online_purchase_purchase_online_buy_order_edit_it_cases.md` |
| 146 | 260 | 114 | 管理画面 | M08-01 | 会員検索/一覧 | `m08_01_admin_customer_customer_search_list_it_cases.md` |
| 146 | 260 | 114 | 管理画面 | M10-08 | 自動メール送信テンプレ | `m10_08_admin_base_setting_setting_shop_auto_mail_it_cases.md` |
| 136 | 248 | 112 | フロント | F06-02 | 本会員登録 | `f06_02_front_member_entry_activate_it_cases.md` |
| 136 | 248 | 112 | 管理画面 | M04-02 | 在庫編集機能 | `m04_02_admin_stock_stock_edit_it_cases.md` |
| 136 | 248 | 112 | 管理画面 | M05-12 | 対応状況一括変更 | `m05_12_admin_order_order_bulk_status_change_it_cases.md` |
| 136 | 248 | 112 | 管理画面 | M05-13 | 問い合わせ番号（出荷伝票番号）入力機能 | `m05_13_admin_order_order_tracking_number_it_cases.md` |
| 136 | 248 | 112 | 管理画面 | M07-04 | 手動メール通知 | `m07_04_admin_online_purchase_purchase_manual_mail_it_cases.md` |
| 136 | 248 | 112 | 管理画面 | M08-02 | メール一括送信 | `m08_02_admin_customer_customer_mail_all_it_cases.md` |
| 136 | 248 | 112 | 管理画面 | M08-07 | メール送信履歴 | `m08_07_admin_customer_customer_mail_history_it_cases.md` |
| 136 | 248 | 112 | 管理画面 | M08-14 | 会員登録仮登録完了メール再送 | `m08_14_admin_customer_customer_resend_provisional_mail_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M03-05 | セール用価格変更CSV出力 | `m03_05_admin_product_product_sale_price_csv_export_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M03-15 | 略称タグCSV出力 | `m03_15_admin_product_product_storage_code_export_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M04-05 | 在庫情報カスタムCSV出力 | `m04_05_admin_stock_product_stock_custom_csv_export_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M04-11 | 在庫移動・振替情報カスタムCSV出力 | `m04_11_admin_stock_product_stock_history_csv_export_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M05-02 | 受注情報CSV出力 | `m05_02_admin_order_order_csv_export_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M05-07 | 送り状CSV出力 | `m05_07_admin_order_order_labels_csv_export_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M06-10 | 戻しリストCSV出力 | `m06_10_admin_store_purchase_purchase_store_return_list_csv_export_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M06-12 | 買取商品一覧CSV | `m06_12_admin_store_purchase_purchase_store_product_list_csv_export_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M07-08 | 戻しリストCSV | `m07_08_admin_online_purchase_purchase_online_return_list_csv_export_it_cases.md` |
| 131 | 241 | 110 | 管理画面 | M10-14 | 店舗一覧 | `m10_14_admin_base_setting_setting_shop_mall_shop_list_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M12-02 | 日別/月別集計 CSVダウンロード | `m12_02_admin_analytics_sales_daily_monthly_csv_export_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M12-04 | 受注/売上分析 CSVダウンロード | `m12_04_admin_analytics_sales_order_analysis_csv_export_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M12-08 | フォーマット売上分析 CSVダウンロード | `m12_08_admin_analytics_sales_format_analysis_csv_export_it_cases.md` |
| 131 | 253 | 122 | 管理画面 | M15-02 | デッキCSV出力 | `m15_02_admin_deck_deck_csv_export_it_cases.md` |
| 129 | 239 | 110 | フロント | F06-17 | 大会デッキ登録確認～完了 | `f06_17_front_member_mypage_event_deck_complete_it_cases.md` |
| 129 | 239 | 110 | フロント | F06-21 | 退会 | `f06_21_front_member_mypage_withdraw_it_cases.md` |

## 未展開P1が多い機能

| P1 | P2 | P3 | 未展開 | 区分 | 機能No | 機能名 | 出力ファイル |
|---:|---:|---:|-------:|------|--------|--------|--------------|
| 31 | 59 | 15 | 105 | 管理画面 | M03-02 | 商品編集機能 | `m03_02_admin_product_product_edit_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M03-09 | 商品規格登録/編集 | `m03_09_admin_product_product_class_edit_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M03-10 | 買取・販売価格一括編集 | `m03_10_admin_product_product_bulk_buy_standard_price_edit_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M03-45 | カテゴリー一覧 | `m03_45_admin_product_product_category_list_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M03-13 | タグ登録/編集 | `m03_13_admin_product_product_tag_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M03-14 | 略称タグ登録/編集 | `m03_14_admin_product_product_abbreviation_tag_register_edit_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M03-17 | 売上分析タグ登録/編集 | `m03_17_admin_product_product_sales_analysis_management_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M03-18 | 部門登録/編集 | `m03_18_admin_product_product_section_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M03-21 | 棚番登録/編集 | `m03_21_admin_product_product_shelf_number_register_edit_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M03-22 | 購入グループ管理 | `m03_22_admin_product_product_sell_group_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M04-01 | 在庫検索/一覧 | `m04_01_admin_stock_stock_search_list_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M04-24 | 在庫移動指示リスト作成/検索 | `m04_24_admin_stock_stock_move_instruction_search_create_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M05-20 | 出荷指示リスト詳細編集/削除 | `m05_20_admin_order_order_shipping_standby_detail_edit_delete_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M05-27 | 店頭注文番号札管理 | `m05_27_admin_order_order_waiting_tag_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M08-09 | 配送先一覧表示/編集 | `m08_09_admin_customer_customer_delivery_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M08-13 | ブラックリスト登録/編集/削除 | `m08_13_admin_customer_customer_blacklist_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M09-01 | 新着情報管理 | `m09_01_admin_content_content_news_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M09-03 | レイアウト管理 | `m09_03_admin_content_content_layout_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M09-04 | ページ管理 | `m09_04_admin_content_content_page_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M09-07 | ブロック管理 | `m09_07_admin_content_content_block_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M10-04 | 支払い方法/手数料設定 | `m10_04_admin_base_setting_setting_shop_payment_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M10-06 | 配送業者/配送料/配送時間設定 | `m10_06_admin_base_setting_setting_shop_delivery_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M10-07 | 税率設定 | `m10_07_admin_base_setting_setting_shop_tax_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M10-12 | 定休日カレンダー設定 | `m10_12_admin_base_setting_setting_shop_calendar_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M11-01 | メンバー管理一覧 | `m11_01_admin_system_setting_setting_system_member_list_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M11-03 | 権限管理 | `m11_03_admin_system_setting_setting_system_authority_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M11-04 | ログイン履歴 | `m11_04_admin_system_setting_setting_system_login_history_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M11-05 | マスタデータ管理 | `m11_05_admin_system_setting_setting_system_masterdata_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M12-05 | 入荷通知依頼 一覧表示 | `m12_05_admin_analytics_sales_arrival_notification_search_list_it_cases.md` |
| 31 | 59 | 15 | 105 | 管理画面 | M13-01 | イベント一覧検索 | `m13_01_admin_event_event_search_list_it_cases.md` |
