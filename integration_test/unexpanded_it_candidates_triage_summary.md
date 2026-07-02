# 未展開候補 精査サマリ

- 端末/画面サイズ差分（IT-21）は昇格対象に分類する。
- ロケール差分はIT-21ではなく、日英別HTML/twigを持つ機能単位で判定し、不要候補に落とさず個別レビュー以上に残す。
- P3は原則として結合テスト不要候補。ただしIT-21は例外。
- IT-02/IT-25は原則不要寄り。ただしP1は個別レビューに残す。

## 全体

| 精査区分 | 件数 | P1 | P2 | P3 |
|----------|-----:|---:|---:|---:|
| 昇格対象 | 6711 | 2469 | 3950 | 292 |
| 個別レビュー | 6765 | 2329 | 4411 | 25 |
| 結合テスト不要候補 | 14923 | 0 | 11746 | 3177 |

## 区分別

| 精査区分 | 区分 | 件数 |
|----------|------|-----:|
| 昇格対象 | 管理画面 | 5586 |
| 昇格対象 | フロント | 1092 |
| 昇格対象 | API | 20 |
| 昇格対象 | バッチ | 13 |
| 個別レビュー | 管理画面 | 5615 |
| 個別レビュー | フロント | 1129 |
| 個別レビュー | バッチ | 14 |
| 個別レビュー | API | 4 |
| 個別レビュー | その他 | 3 |
| 結合テスト不要候補 | 管理画面 | 12173 |
| 結合テスト不要候補 | フロント | 2713 |
| 結合テスト不要候補 | その他 | 30 |
| 結合テスト不要候補 | API | 6 |
| 結合テスト不要候補 | バッチ | 1 |

## IFID上位

### 昇格対象

| I/FID | 件数 |
|-------|-----:|
| IT-28 | 1733 |
| IT-24 | 1457 |
| IT-05 | 1055 |
| IT-27 | 810 |
| IT-07 | 508 |
| IT-16 | 293 |
| IT-21 | 292 |
| IT-15 | 273 |
| IT-33 | 226 |
| IT-11 | 35 |
| IT-10 | 20 |
| IT-30 | 9 |

### 個別レビュー

| I/FID | 件数 |
|-------|-----:|
| IT-12 | 4841 |
| IT-26 | 895 |
| IT-25 | 691 |
| IT-02 | 297 |
| IT-14 | 24 |
| IT-20 | 9 |
| IT-01 | 4 |
| IT-32 | 4 |

### 結合テスト不要候補

| I/FID | 件数 |
|-------|-----:|
| IT-25 | 10139 |
| IT-20 | 1764 |
| IT-14 | 1701 |
| IT-02 | 467 |
| IT-01 | 288 |
| IT-12 | 288 |
| IT-06 | 255 |
| IT-03 | 12 |
| IT-32 | 6 |
| IT-13 | 3 |

## 昇格対象が多い機能

| 昇格対象 | 個別レビュー | 不要候補 | 区分 | 機能No | 機能名 | 出力ファイル |
|---------:|-------------:|---------:|------|--------|--------|--------------|
| 68 | 22 | 56 | フロント | F03-07 | 入荷時通知 | `f03_07_front_product_product_arrival_notification_it_cases.md` |
| 68 | 22 | 56 | フロント | F06-16 | 大会デッキ登録編集 | `f06_16_front_member_mypage_event_deck_edit_it_cases.md` |
| 68 | 22 | 56 | 管理画面 | M04-03 | 在庫一括編集 | `m04_03_admin_stock_stock_bulk_edit_it_cases.md` |
| 68 | 22 | 56 | 管理画面 | M07-03 | 買取情報編集 | `m07_03_admin_online_purchase_purchase_online_buy_order_edit_it_cases.md` |
| 68 | 22 | 56 | 管理画面 | M08-01 | 会員検索/一覧 | `m08_01_admin_customer_customer_search_list_it_cases.md` |
| 68 | 22 | 56 | 管理画面 | M10-08 | 自動メール送信テンプレ | `m10_08_admin_base_setting_setting_shop_auto_mail_it_cases.md` |
| 56 | 24 | 56 | フロント | F06-02 | 本会員登録 | `f06_02_front_member_entry_activate_it_cases.md` |
| 56 | 24 | 56 | 管理画面 | M04-02 | 在庫編集機能 | `m04_02_admin_stock_stock_edit_it_cases.md` |
| 56 | 24 | 56 | 管理画面 | M05-12 | 対応状況一括変更 | `m05_12_admin_order_order_bulk_status_change_it_cases.md` |
| 56 | 24 | 56 | 管理画面 | M05-13 | 問い合わせ番号（出荷伝票番号）入力機能 | `m05_13_admin_order_order_tracking_number_it_cases.md` |
| 56 | 24 | 56 | 管理画面 | M07-04 | 手動メール通知 | `m07_04_admin_online_purchase_purchase_manual_mail_it_cases.md` |
| 56 | 24 | 56 | 管理画面 | M08-02 | メール一括送信 | `m08_02_admin_customer_customer_mail_all_it_cases.md` |
| 56 | 24 | 56 | 管理画面 | M08-07 | メール送信履歴 | `m08_07_admin_customer_customer_mail_history_it_cases.md` |
| 56 | 24 | 56 | 管理画面 | M08-14 | 会員登録仮登録完了メール再送 | `m08_14_admin_customer_customer_resend_provisional_mail_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M03-05 | セール用価格変更CSV出力 | `m03_05_admin_product_product_sale_price_csv_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M03-15 | 略称タグCSV出力 | `m03_15_admin_product_product_storage_code_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M04-05 | 在庫情報カスタムCSV出力 | `m04_05_admin_stock_product_stock_custom_csv_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M04-11 | 在庫移動・振替情報カスタムCSV出力 | `m04_11_admin_stock_product_stock_history_csv_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M05-02 | 受注情報CSV出力 | `m05_02_admin_order_order_csv_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M05-07 | 送り状CSV出力 | `m05_07_admin_order_order_labels_csv_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M06-10 | 戻しリストCSV出力 | `m06_10_admin_store_purchase_purchase_store_return_list_csv_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M06-12 | 買取商品一覧CSV | `m06_12_admin_store_purchase_purchase_store_product_list_csv_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M07-08 | 戻しリストCSV | `m07_08_admin_online_purchase_purchase_online_return_list_csv_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M10-14 | 店舗一覧 | `m10_14_admin_base_setting_setting_shop_mall_shop_list_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M12-02 | 日別/月別集計 CSVダウンロード | `m12_02_admin_analytics_sales_daily_monthly_csv_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M12-04 | 受注/売上分析 CSVダウンロード | `m12_04_admin_analytics_sales_order_analysis_csv_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M12-08 | フォーマット売上分析 CSVダウンロード | `m12_08_admin_analytics_sales_format_analysis_csv_export_it_cases.md` |
| 54 | 21 | 56 | 管理画面 | M15-02 | デッキCSV出力 | `m15_02_admin_deck_deck_csv_export_it_cases.md` |
| 53 | 21 | 45 | フロント | F02-05 | 通知 | `f02_05_front_global_nav_global_nav_notification_it_cases.md` |
| 53 | 21 | 45 | フロント | F04-04 | 決済~購入完了 | `f04_04_front_cart_shopping_complete_it_cases.md` |
| 53 | 21 | 45 | フロント | F05-06 | ネット買取買取手続き～完了 | `f05_06_front_online_purchase_buy_shopping_complete_it_cases.md` |
| 53 | 21 | 45 | フロント | F08-03 | 店頭買取査定申込登録確認～完了 | `f08_03_front_store_purchase_otc_buy_entry_complete_it_cases.md` |
| 53 | 21 | 45 | フロント | F06-04 | パスワード変更 | `f06_04_front_member_forgot_password_reset_it_cases.md` |
| 53 | 21 | 45 | フロント | F06-08 | 入荷待ち商品一覧 | `f06_08_front_member_mypage_arrival_notification_it_cases.md` |
| 53 | 21 | 45 | フロント | F06-13 | オンライン本人確認 | `f06_13_front_member_mypage_online_identification_it_cases.md` |
| 53 | 21 | 55 | フロント | F06-17 | 大会デッキ登録確認～完了 | `f06_17_front_member_mypage_event_deck_complete_it_cases.md` |
| 53 | 21 | 55 | フロント | F06-21 | 退会 | `f06_21_front_member_mypage_withdraw_it_cases.md` |
| 53 | 21 | 45 | フロント | F06-22 | お問い合わせ | `f06_22_front_member_mypage_contact_it_cases.md` |
| 53 | 21 | 45 | フロント | F07-04 | 大会申込～完了 | `f07_04_front_event_event_entry_complete_it_cases.md` |
| 53 | 21 | 55 | 管理画面 | M04-13 | 在庫分割結合登録/編集 | `m04_13_admin_stock_stock_split_join_register_edit_it_cases.md` |