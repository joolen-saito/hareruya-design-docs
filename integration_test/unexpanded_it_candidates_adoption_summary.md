# 未展開候補 採否判断サマリ

## 判断基準

- 昇格対象は採用。
- P1は原則採用。
- 日英別HTML/twig差分の可能性がある機能は、優先度に関わらず採用。
- API/外部取得・受信検証は採用。
- 非ロケールのP2/P3 UI詳細・単純表示・重複粒度は不採用。

## 全体

| 採否 | 件数 | P1 | P2 | P3 |
|------|-----:|---:|---:|---:|
| 反映済み | 9317 | 4798 | 4202 | 317 |
| 採用 | 0 | 0 | 0 | 0 |
| 不採用 | 19082 | 0 | 15905 | 3177 |

## 区分別

| 採否 | 区分 | 件数 |
|------|------|-----:|
| 反映済み | 管理画面 | 7807 |
| 反映済み | フロント | 1444 |
| 反映済み | バッチ | 27 |
| 反映済み | API | 24 |
| 反映済み | その他 | 15 |
| 不採用 | 管理画面 | 15567 |
| 不採用 | フロント | 3490 |
| 不採用 | その他 | 18 |
| 不採用 | API | 6 |
| 不採用 | バッチ | 1 |

## IFID上位

### 反映済み

| I/FID | 件数 |
|-------|-----:|
| IT-28 | 1733 |
| IT-24 | 1457 |
| IT-05 | 1055 |
| IT-26 | 895 |
| IT-27 | 810 |
| IT-25 | 696 |
| IT-12 | 665 |
| IT-07 | 508 |
| IT-02 | 297 |
| IT-16 | 293 |
| IT-21 | 292 |
| IT-15 | 273 |
| IT-33 | 226 |
| IT-11 | 35 |
| IT-14 | 24 |
| IT-10 | 20 |
| IT-03 | 12 |
| IT-20 | 9 |
| IT-30 | 9 |
| IT-01 | 4 |

### 採用

| I/FID | 件数 |
|-------|-----:|

### 不採用

| I/FID | 件数 |
|-------|-----:|
| IT-25 | 10134 |
| IT-12 | 4464 |
| IT-20 | 1764 |
| IT-14 | 1701 |
| IT-02 | 467 |
| IT-01 | 288 |
| IT-06 | 255 |
| IT-32 | 6 |
| IT-13 | 3 |

## 採用候補が多い機能

| 採用 | 不採用 | 区分 | 機能No | 機能名 | 出力ファイル |
|-----:|-------:|------|--------|--------|--------------|
| 0 | 35 | フロント | F01-01 | 本店ECTOP | `f01_01_front_top_home_main_it_cases.md` |
| 0 | 66 | フロント | F01-02 | 支店ECTOP | `f01_02_front_top_home_branch_it_cases.md` |
| 0 | 26 | フロント | F02-01 | PC版ナビゲーション | `f02_01_front_global_nav_global_nav_pc_it_cases.md` |
| 0 | 26 | フロント | F02-02 | スマホ版ナビゲーション | `f02_02_front_global_nav_global_nav_sp_it_cases.md` |
| 0 | 66 | フロント | F02-03 | 支店PC版ナビゲーション | `f02_03_front_global_nav_branch_global_nav_pc_it_cases.md` |
| 0 | 66 | フロント | F02-04 | 支店スマホ版ナビゲーション | `f02_04_front_global_nav_branch_global_nav_sp_it_cases.md` |
| 0 | 60 | フロント | F02-05 | 通知 | `f02_05_front_global_nav_global_nav_notification_it_cases.md` |
| 0 | 61 | フロント | F03-01 | 商品一覧 | `f03_01_front_product_product_search_list_it_cases.md` |
| 0 | 69 | フロント | F03-02 | 商品詳細 | `f03_02_front_product_product_detail_it_cases.md` |
| 0 | 26 | フロント | F03-03 | 商品詳細検索 | `f03_03_front_product_product_detail_search_it_cases.md` |
| 0 | 26 | フロント | F03-04 | カテゴリ一覧 | `f03_04_front_product_product_category_list_it_cases.md` |
| 0 | 46 | フロント | F03-05 | 商品リコメンド | `f03_05_front_product_block_recommend_it_cases.md` |
| 0 | 35 | フロント | F03-06 | 最近見た商品 | `f03_06_front_product_product_recently_viewed_it_cases.md` |
| 0 | 71 | フロント | F03-07 | 入荷時通知 | `f03_07_front_product_product_arrival_notification_it_cases.md` |
| 0 | 71 | フロント | F03-08 | お気に入り | `f03_08_front_product_product_favorite_it_cases.md` |
| 0 | 71 | フロント | F04-01 | 買い物かご | `f04_01_front_cart_cart_index_it_cases.md` |
| 0 | 66 | フロント | F04-02 | ご注文方法指定 | `f04_02_front_cart_shopping_order_method_it_cases.md` |
| 0 | 66 | フロント | F04-03 | 配送先の新規登録・変更 | `f04_03_front_cart_shopping_delivery_edit_it_cases.md` |
| 0 | 60 | フロント | F04-04 | 決済~購入完了 | `f04_04_front_cart_shopping_complete_it_cases.md` |
| 0 | 71 | フロント | F05-01 | ネット買取トップページ | `f05_01_front_online_purchase_buy_top_it_cases.md` |
| 0 | 66 | フロント | F05-02 | ネット買取商品検索 | `f05_02_front_online_purchase_buy_product_search_it_cases.md` |
| 0 | 66 | フロント | F05-03 | ネット買取商品一覧 | `f05_03_front_online_purchase_buy_product_list_it_cases.md` |
| 0 | 66 | フロント | F05-04 | ネット買取商品詳細 | `f05_04_front_online_purchase_buy_product_detail_it_cases.md` |
| 0 | 69 | フロント | F05-05 | ネット買取カート | `f05_05_front_online_purchase_buy_cart_it_cases.md` |
| 0 | 60 | フロント | F05-06 | ネット買取買取手続き～完了 | `f05_06_front_online_purchase_buy_shopping_complete_it_cases.md` |
| 0 | 66 | フロント | F08-01 | 店頭買取査定申込前ログイン | `f08_01_front_store_purchase_otc_buy_entry_login_it_cases.md` |
| 0 | 66 | フロント | F08-02 | 店頭買取査定申込情報入力 | `f08_02_front_store_purchase_otc_buy_entry_input_it_cases.md` |
| 0 | 60 | フロント | F08-03 | 店頭買取査定申込登録確認～完了 | `f08_03_front_store_purchase_otc_buy_entry_complete_it_cases.md` |
| 0 | 59 | フロント | F06-01 | 新規会員登録 | `f06_01_front_member_customer_entry_it_cases.md` |
| 0 | 71 | フロント | F06-02 | 本会員登録 | `f06_02_front_member_entry_activate_it_cases.md` |
| 0 | 66 | フロント | F06-03 | ログイン | `f06_03_front_member_customer_login_it_cases.md` |
| 0 | 60 | フロント | F06-04 | パスワード変更 | `f06_04_front_member_forgot_password_reset_it_cases.md` |
| 0 | 66 | フロント | F06-05 | マイページ | `f06_05_front_member_mypage_index_it_cases.md` |
| 0 | 26 | フロント | F06-06 | 購入履歴一覧 | `f06_06_front_member_mypage_order_history_it_cases.md` |
| 0 | 26 | フロント | F06-07 | 購入履歴詳細 | `f06_07_front_member_mypage_order_history_detail_it_cases.md` |
| 0 | 60 | フロント | F06-08 | 入荷待ち商品一覧 | `f06_08_front_member_mypage_arrival_notification_it_cases.md` |
| 0 | 71 | フロント | F06-09 | お気に入り商品一覧 | `f06_09_front_member_mypage_favorite_product_it_cases.md` |
| 0 | 71 | フロント | F06-10 | ポイント履歴 | `f06_10_front_member_mypage_point_history_it_cases.md` |
| 0 | 71 | フロント | F06-11 | 買取履歴一覧 | `f06_11_front_member_mypage_buy_history_it_cases.md` |
| 0 | 69 | フロント | F06-12 | 買取履歴詳細 | `f06_12_front_member_mypage_buy_history_detail_it_cases.md` |
| 0 | 71 | フロント | F06-12 | まとめて買取査定結果 | `f06_12_front_member_mypage_bulk_purchase_result_it_cases.md` |
| 0 | 60 | フロント | F06-13 | オンライン本人確認 | `f06_13_front_member_mypage_online_identification_it_cases.md` |
| 0 | 71 | フロント | F06-14 | 予約済み大会一覧 | `f06_14_front_member_mypage_event_reserved_list_it_cases.md` |
| 0 | 71 | フロント | F06-16 | 大会デッキ登録編集 | `f06_16_front_member_mypage_event_deck_edit_it_cases.md` |
| 0 | 70 | フロント | F06-17 | 大会デッキ登録確認～完了 | `f06_17_front_member_mypage_event_deck_complete_it_cases.md` |
| 0 | 71 | フロント | F06-18 | 会員情報変更 | `f06_18_front_member_mypage_customer_edit_it_cases.md` |
| 0 | 71 | フロント | F06-19 | クレジットカード情報登録・変更 | `f06_19_front_member_mypage_credit_card_it_cases.md` |
| 0 | 69 | フロント | F06-20 | 配送先新規登録・変更 | `f06_20_front_member_mypage_delivery_edit_it_cases.md` |
| 0 | 70 | フロント | F06-21 | 退会 | `f06_21_front_member_mypage_withdraw_it_cases.md` |
| 0 | 60 | フロント | F06-22 | お問い合わせ | `f06_22_front_member_mypage_contact_it_cases.md` |