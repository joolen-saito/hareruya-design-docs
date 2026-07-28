# 画面項目定義ドリフト差分レポート

HTML設計書の画面項目定義（Excel由来の 必須／最大文字数）を、機能設計書の入力項目節（現行ソースから起こした実装確認値）と突き合わせ、差分を出力する。**重複仕様の正はExcel基本設計**とし、差分は実装済み・実装違い・移行前後差へ分類する。生成物（HTML・Excel・機能設計書）は一切書き換えない。

生成: `functions/audit_item_definition_drift.py` ／ 全出力: `functions/item_definition_drift.tsv`（908行）

## サマリ

### 要対応（確定乖離）
- **必須/任意の不一致: 44 件** — HTML(Excel)とソースで必須判定が逆
- **最大文字数の不一致（両方に数値・値違い）: 11 件** — 文字型のみ（数値項目の最大値は除外）
- **最大文字数がHTMLに無いがソースにある: 29 件** — HTMLが文字数制限を書き落とし

### 要確認
- 最大文字数がHTMLにあるがソースに数値記載が無い: 44 件 — ソースがconfig委譲/範囲/非数値。TSV参照
- 未マッチ（設計書に入力項目節はあるがラベル不一致）: 606 件 — 未リバース or ラベル揺れ or Excelにのみ在る項目。TSV参照

### 参考（突合対象外）
- 設計書に入力項目節が無いシート（検索/一覧/CSV等）: 174 件

## 読み方

- **重複仕様の正典はExcel基本設計**。機能設計書はFormType＋config定数＋Doctrineからリバースした実装確認値として比較し、食い違いを実装違いまたは移行前後差として分類する。機能設計書自体の実装忠実性は別途config.yml直読みで再検証できる。
- **必須**: HTML の ◯/○/〇＝必須、-/空＝任意。条件付き（△・自由文）は判定保留で乖離に数えない。
- **最大文字数**: 文字型（半角/全角/文字列/テキスト/メール/パスワード）のみ比較。数値項目の「最大値」（金額の上限等）は文字数ではないので対象外。範囲は上限を採用。
- **maxlen-missing-html は自動でExcelの記載漏れと断定しない**。Excel要求、実装上限、移行前後差を確認してから分類する。

## 書番別

| 書番 | 必須不一致 | 最大数値不一致 | 最大HTML欠落 | 最大ソース未記載 | 未マッチ | 対象外 |
|---|---|---|---|---|---|---|
| 0201 | 0 | 1 | 0 | 0 | 3 | 0 |
| 0202 | 1 | 1 | 1 | 0 | 108 | 93 |
| 0203 | 5 | 1 | 7 | 0 | 86 | 2 |
| 0204 | 16 | 0 | 2 | 0 | 43 | 1 |
| 0205 | 0 | 0 | 0 | 0 | 7 | 0 |
| 0206 | 0 | 0 | 0 | 1 | 23 | 10 |
| 0207 | 4 | 0 | 2 | 8 | 55 | 2 |
| 0208 | 0 | 0 | 1 | 7 | 6 | 0 |
| 0209 | 13 | 5 | 10 | 8 | 60 | 8 |
| 0210 | 0 | 0 | 0 | 0 | 8 | 0 |
| 0211 | 0 | 0 | 0 | 0 | 64 | 0 |
| 0212 | 0 | 0 | 2 | 8 | 26 | 4 |
| 0213 | 1 | 0 | 1 | 0 | 10 | 17 |
| 0214 | 2 | 0 | 0 | 0 | 31 | 28 |
| 0302 | 0 | 0 | 0 | 0 | 2 | 2 |
| 0303 | 0 | 0 | 0 | 0 | 4 | 0 |
| 0304 | 0 | 0 | 0 | 0 | 18 | 3 |
| 0305 | 0 | 0 | 0 | 0 | 1 | 0 |
| 0306 | 2 | 3 | 3 | 8 | 39 | 2 |
| 0308 | 0 | 0 | 0 | 4 | 12 | 2 |

## 必須/任意の不一致（44件）

| 書番 | シート | 識別ID | ラベル | HTML必須 | 設計書 | 根拠設計書 |
|---|---|---|---|---|---|---|
| 0202 | 棚卸計画一覧 | 37-2-1 | 棚卸名 | 任意 | 必須 | m04-31_admin_stock_stock_inventory_plan.md |
| 0203 | メール一括送信 | 9-2 | 件名 | 任意 | 必須 | m05-15_admin_order_order_mail.md |
| 0203 | 受注情報編集 | 15-6-4 | 欠品数量 | 必須 | 任意 | m05-11_admin_order_order_edit.md |
| 0203 | 【新規】受注情報履歴 | 16-9-3 | ポイント還元率（％） | 任意 | 必須 | m05-11_admin_order_order_edit.md |
| 0203 | 【新規】受注情報履歴 | 16-9-4 | ポイント発生 | 任意 | 必須 | m05-11_admin_order_order_edit.md |
| 0203 | 【新規】受注情報履歴 | 16-9-5 | ポイント使用 | 任意 | 必須 | m05-11_admin_order_order_edit.md |
| 0204 | 商品登録編集 | 5-4 | 商品名 | 任意 | 必須 | m03-02_admin_product_product_edit.md |
| 0204 | 商品登録編集 | 5-5 | 商品名(英) | 任意 | 必須 | m03-02_admin_product_product_edit.md |
| 0204 | 商品登録編集 | 5-16 | 購入グループ | 任意 | 必須 | m03-02_admin_product_product_edit.md |
| 0204 | 商品登録編集 | 5-17 | サイズ | 任意 | 必須 | m03-02_admin_product_product_edit.md |
| 0204 | 商品登録編集 | 5-18 | 重量 | 任意 | 必須 | m03-02_admin_product_product_edit.md |
| 0204 | 商品登録編集 | 5-19 | 割引率 | 任意 | 必須 | m03-02_admin_product_product_edit.md |
| 0204 | 商品登録編集 | 5-21 | 販売制限 | 任意 | 必須 | m03-02_admin_product_product_edit.md |
| 0204 | 商品登録編集 | 5-28 | 商品カテゴリ | 任意 | 必須 | m03-02_admin_product_product_edit.md |
| 0204 | 商品規格登録編集 | 22-5 | 言語 | 任意 | 必須 | m03-09_admin_product_product_class_edit.md |
| 0204 | 商品規格登録編集 | 22-6 | 状態 | 任意 | 必須 | m03-09_admin_product_product_class_edit.md |
| 0204 | 商品規格登録編集 | 22-12 | 販売価格 | 任意 | 必須 | m03-09_admin_product_product_class_edit.md |
| 0204 | 商品規格登録編集 | 22-15 | 買取価格 | 任意 | 必須 | m03-09_admin_product_product_class_edit.md |
| 0204 | 商品規格登録編集 | 22-16 | 代表画像 | 任意 | 必須 | m03-09_admin_product_product_class_edit.md |
| 0204 | 商品規格登録編集 | 22-23 | 棚番号 | 任意 | 必須 | m03-09_admin_product_product_class_edit.md |
| 0204 | 買取・基準価格一括編集 | 23-10 | 基準価格(NM) | 必須 | 任意 | m03-10_admin_product_product_bulk_buy_standard_price_edit.md |
| 0204 | カテゴリ登録 | 25-5 | カテゴリ名(日) | 任意 | 必須 | m03-11_admin_product_product_category_register_edit.md |
| 0207 | 会員検索一覧(検索入力) | 3-3 | 検索パターン名 | 必須 | 任意 | m08-01_admin_customer_customer_search_list.md |
| 0207 | 会員登録編集 | 9-13 | 住所1 | 必須 | 任意 | m08-04_admin_customer_customer_edit.md |
| 0207 | 会員登録編集 | 9-14 | 住所2 | 必須 | 任意 | m08-04_admin_customer_customer_edit.md |
| 0207 | 配送先編集 | 17-21 | 配送先名称 | 必須 | 任意 | m08-09_admin_customer_customer_delivery.md |
| 0209 | 特定商取引に関する法律 | 4-1-1 | 販売業者 | 任意 | 必須 | m10-02_admin_base_setting_setting_shop_tradelaw.md |
| 0209 | 特定商取引に関する法律 | 4-1-2 | 運営責任者 | 任意 | 必須 | m10-02_admin_base_setting_setting_shop_tradelaw.md |
| 0209 | 特定商取引に関する法律 | 4-1-3 | 所在地 | 任意 | 必須 | m10-02_admin_base_setting_setting_shop_tradelaw.md |
| 0209 | 特定商取引に関する法律 | 4-1-6 | メールアドレス | 任意 | 必須 | m10-02_admin_base_setting_setting_shop_tradelaw.md |
| 0209 | 特定商取引に関する法律 | 4-1-7 | URL | 任意 | 必須 | m10-02_admin_base_setting_setting_shop_tradelaw.md |
| 0209 | 利用規約管理 | 5-1 | 利用規約 | 任意 | 必須 | m10-03_admin_base_setting_setting_shop_customer_agreement.md |
| 0209 | 税率設定 | 8-2-1 | 消費税率 | 任意 | 必須 | m10-07_admin_base_setting_setting_shop_tax.md |
| 0209 | 自動送信メール | 9-1-5 | 件名 | 任意 | 必須 | m10-08_admin_base_setting_setting_shop_auto_mail.md |
| 0209 | 店舗登録 | 13-1-1 | 会社名 | 必須 | 任意 | m10-15_admin_base_setting_setting_shop_register.md |
| 0209 | 店舗登録 | 13-1-5 | 店名(英語表記) | 必須 | 任意 | m10-15_admin_base_setting_setting_shop_register.md |
| 0209 | 追加システム設定 | 14-9 | 入荷通知メールの許可 | 任意 | 必須 | m10-16_admin_base_setting_setting_shop_additional_system.md |
| 0209 | 追加システム設定 | 14-11 | 固定価格商品部門ID | 必須 | 任意 | m10-16_admin_base_setting_setting_shop_additional_system.md |
| 0209 | 追加システム設定 | 14-20 | 英語サイト専用タグID | 必須 | 任意 | m10-16_admin_base_setting_setting_shop_additional_system.md |
| 0213 | 祝日管理 | 5-9 | 日付 | 任意 | 必須 | m16-03_admin_data_data_holiday_add_delete.md |
| 0214 | イベント編集 | 5-1-2 | イベント名(英) | 必須 | 任意 | m13-02_admin_event_event_edit_delete.md |
| 0214 | イベント新規申込登録 | 18-1-8 | 支払金額 | 任意 | 必須 | m13-12_admin_event_event_entry_register.md |
| 0306 | 会員情報変更 | 15-1-12 | パスワード | 必須 | 任意 | f06-18_front_member_mypage_customer_edit.md |
| 0306 | 退会 | 17-2-3 | パスワード | 必須 | 任意 | f06-21_front_member_mypage_withdraw.md |

## 最大文字数の不一致（両方に数値）（11件）

| 書番 | シート | 識別ID | ラベル | HTML | 設計書 | 根拠設計書 |
|---|---|---|---|---|---|---|
| 0201 | メンバー管理 | 4-1-1 | 名前 | 255 | 50 | m11-02_admin_system_setting_setting_system_member_edit.md |
| 0202 | 在庫一括編集 | 7-2-11 | 在庫変動理由 | 16384 | 65535 | m04-03_admin_stock_stock_bulk_edit.md |
| 0203 | 受注情報編集 | 15-10-22 | 会社名 | 50 | 255 | m05-11_admin_order_order_edit.md |
| 0209 | 自動送信メール | 9-1-4 | テンプレ名称 | 255 | 50 | m10-08_admin_base_setting_setting_shop_auto_mail.md |
| 0209 | 店舗登録 | 13-1-1 | 会社名 | 255 | 50 | m10-15_admin_base_setting_setting_shop_register.md |
| 0209 | 店舗登録 | 13-1-3 | 店名 | 255 | 50 | m10-15_admin_base_setting_setting_shop_register.md |
| 0209 | 店舗登録 | 13-1-5 | 店名(英語表記) | 255 | 200 | m10-15_admin_base_setting_setting_shop_register.md |
| 0209 | 店舗登録 | 13-1-14 | 店舗営業時間 | 255 | 50 | m10-15_admin_base_setting_setting_shop_register.md |
| 0306 | 新規会員登録 | 3-1-21 | 会社名 | 100 | 255 | f06-01_front_member_customer_entry.md |
| 0306 | 会員情報変更 | 15-1-21 | 会社名 | 100 | 50 | f06-18_front_member_mypage_customer_edit.md |
| 0306 | 配送先新規登録・変更 | 16-2-15 | 会社名 | 100 | 50 | f06-20_front_member_mypage_delivery_edit.md |

## 最大文字数がHTMLに無いがソースにある（29件）

| 書番 | シート | 識別ID | ラベル | HTML | ソース最大 | 根拠設計書 |
|---|---|---|---|---|---|---|
| 0202 | 棚卸計画一覧 | 37-2-1 | 棚卸名 | - | 255 | m04-31_admin_stock_stock_inventory_plan.md |
| 0203 | 受注情報検索 一覧(検索入力) | 3-1-2 | 注文番号 | - | 255 | m05-01_admin_order_order_search_list.md |
| 0203 | 受注情報検索 一覧(検索入力) | 3-2-8 | 電話番号 | - | 14 | m05-01_admin_order_order_search_list.md |
| 0203 | メール一括送信 | 9-2 | 件名 | - | 255 | m05-15_admin_order_order_mail.md |
| 0203 | 受注情報編集 | 15-3-24 | スマレジメモ | - | 3000 | m05-11_admin_order_order_edit.md |
| 0203 | 【新規】受注情報履歴 | 16-1-24 | スマレジメモ | - | 3000 | m05-11_admin_order_order_edit.md |
| 0203 | 【新規】受注情報履歴 | 16-9-3 | ポイント還元率（％） | - | 9 | m05-11_admin_order_order_edit.md |
| 0203 | 出荷指示リスト編集 | 19-5 | 備考 | - | 3000 | m05-20_admin_order_order_shipping_standby_detail_edit_delete.md |
| 0204 | 商品マスター(検索入力) | 3-4 | ID | - | 10 | m03-01_admin_product_product_search_list.md |
| 0204 | タグ登録 | 27-2 | 名称(英) | - | 255 | m03-13_admin_product_product_tag.md |
| 0207 | 会員検索一覧(検索入力) | 3-33 | DCIナンバー | - | 16 | m08-01_admin_customer_customer_search_list.md |
| 0207 | 会員登録編集 | 9-31 | DCIナンバー | - | 16 | m08-04_admin_customer_customer_edit.md |
| 0208 | カードセット詳細（登録・編集・削除) | 12-6 | 並び順 | - | 8 | m14-08_admin_card_cardset_register_update_delete.md |
| 0209 | 基本設定(旧ショップマスター) | 3-1-1 | 会社名 | - | 50 | m10-01_admin_shop_setting_setting_shop.md |
| 0209 | 基本設定(旧ショップマスター) | 3-1-2 | 会社名(フリガナ) | - | 50 | m10-01_admin_shop_setting_setting_shop.md |
| 0209 | 基本設定(旧ショップマスター) | 3-1-3 | 店名 | - | 50 | m10-01_admin_shop_setting_setting_shop.md |
| 0209 | 基本設定(旧ショップマスター) | 3-1-4 | 店名(フリガナ) | - | 50 | m10-01_admin_shop_setting_setting_shop.md |
| 0209 | 基本設定(旧ショップマスター) | 3-1-5 | 店名(英語表記) | - | 200 | m10-01_admin_shop_setting_setting_shop.md |
| 0209 | 基本設定(旧ショップマスター) | 3-1-9 | 店舗営業時間 | - | 50 | m10-01_admin_shop_setting_setting_shop.md |
| 0209 | 基本設定(旧ショップマスター) | 3-2-1 | 送料無料条件(金額) | - | 8 | m10-01_admin_shop_setting_setting_shop.md |
| 0209 | 基本設定(旧ショップマスター) | 3-5-1 | 経度 | - | 6 | m10-01_admin_shop_setting_setting_shop.md |
| 0209 | 基本設定(旧ショップマスター) | 3-5-2 | 緯度 | - | 6 | m10-01_admin_shop_setting_setting_shop.md |
| 0209 | 税率設定 | 8-2-1 | 消費税率 | - | 100 | m10-07_admin_base_setting_setting_shop_tax.md |
| 0212 | デッキ一覧(検索入力) | 3-24 | DCIナンバー | - | 50 | m15-04_admin_deck_deck_bulk_update.md |
| 0212 | アーキタイプ編集 | 11-11 | 旧アーキタイプID | - | 16 | m15-09_admin_deck_deck_archetype_crud.md |
| 0213 | バナー設定 | 3-3 | リンク先URL | - | 255 | m16-01_admin_data_top_banner.md |
| 0306 | ログイン | 5-2 | メールアドレス | - | 320 | f06-03_front_member_customer_login.md |
| 0306 | ログイン | 5-3 | パスワード | - | 320 | f06-03_front_member_customer_login.md |
| 0306 | 配送先新規登録・変更 | 16-3-3 | 配送先名称 | - | 128 | f06-20_front_member_mypage_delivery_edit.md |

## 最大文字数がHTMLにあるがソースに数値記載が無い（要確認）（44件）

| 書番 | シート | 識別ID | ラベル | HTML | 設計書記載 | 根拠設計書 |
|---|---|---|---|---|---|---|
| 0206 | 買取一覧(検索入力) | 3-2 | 買取番号 | 50 | 255（設定 `eccube_stext_len` の値）。 | m07-01_admin_online_purchase_purchase_online_search_list.md |
| 0207 | 会員検索一覧(検索入力) | 3-1 | 会員ID・メールアドレス・お名前 | 255 | コアの会員検索フォームに準ずる | m08-01_admin_customer_customer_search_list.md |
| 0207 | 会員検索一覧(検索入力) | 3-3 | 検索パターン名 | 30865 | コア標準テキスト | m08-01_admin_customer_customer_search_list.md |
| 0207 | 会員検索一覧(検索入力) | 3-18 | 購入商品名・コード | 50 | コアの会員検索フォームに準ずる | m08-01_admin_customer_customer_search_list.md |
| 0207 | 会員登録編集 | 9-6 | 会社名 | 50 | コア会員フォームに準ずる | m08-04_admin_customer_customer_edit.md |
| 0207 | 会員登録編集 | 9-13 | 住所1 | 200 | SJIS換算の上限（プラグイン定数`customer_address.length.addr`） | m08-04_admin_customer_customer_edit.md |
| 0207 | 会員登録編集 | 9-14 | 住所2 | 200 | SJIS換算の上限（同上） | m08-04_admin_customer_customer_edit.md |
| 0207 | 会員登録編集 | 9-16 | メールアドレス | 255 | コア会員フォームに準ずる | m08-04_admin_customer_customer_edit.md |
| 0207 | 会員登録編集 | 9-23 | パスワード | 32 | 確認用と合わせて2入力 | m08-04_admin_customer_customer_edit.md |
| 0208 | カード詳細(登録・編集・削除) | 6-1-2 | カード名(英) | 255 | 同上 | m14-04_admin_card_card_register_update_delete.md |
| 0208 | カード詳細(登録・編集・削除) | 6-1-3 | アリーナカード名(日) | 255 | 同上 | m14-04_admin_card_card_register_update_delete.md |
| 0208 | カード詳細(登録・編集・削除) | 6-1-4 | アリーナカード名(英) | 255 | 同上 | m14-04_admin_card_card_register_update_delete.md |
| 0208 | カード詳細(登録・編集・削除) | 6-1-6 | ルールテキスト(英) | 1024 | 同上 | m14-04_admin_card_card_register_update_delete.md |
| 0208 | カード詳細(登録・編集・削除) | 6-2-4 | ルールテキスト(英) | 1024 | 同上 | m14-04_admin_card_card_register_update_delete.md |
| 0208 | カード詳細(登録・編集・削除) | 6-2-8 | フレーバーテキスト(英) | 1024 | 同上 | m14-04_admin_card_card_register_update_delete.md |
| 0208 | フォーマット詳細(登録・編集・削除) | 14-21 | ルール説明(英) | 65535 | 同上 | m14-10_admin_card_card_format_register_edit_delete.md |
| 0209 | 自動送信メール | 9-1-5 | 件名 | 255 | Symfony Length制約は無し（移行先は文字列255、現行はtext型） | m10-08_admin_base_setting_setting_shop_auto_mail.md |
| 0209 | 追加システム設定 | 14-2 | 買取専用メールアドレス | 255 | —（text） | m10-16_admin_base_setting_setting_shop_additional_system.md |
| 0209 | 追加システム設定 | 14-12 | 買取部門集計送信メールアドレス | 255 | —（text） | m10-16_admin_base_setting_setting_shop_additional_system.md |
| 0209 | 追加システム設定 | 14-13 | 必須項目が空欄である会員送信メールアドレス | 255 | —（text） | m10-16_admin_base_setting_setting_shop_additional_system.md |
| 0209 | 追加システム設定 | 14-14 | ポイント利用が反映されない決済の送信先メールアドレス | 255 | —（text） | m10-16_admin_base_setting_setting_shop_additional_system.md |
| 0209 | 追加システム設定 | 14-16 | 購入処理エラー通知先メールアドレス | 255 | —（text） | m10-16_admin_base_setting_setting_shop_additional_system.md |
| 0209 | 追加システム設定 | 14-17 | イベント決済確認エラー通知メールアドレス | 255 | —（text） | m10-16_admin_base_setting_setting_shop_additional_system.md |
| 0209 | 追加システム設定 | 14-18 | 身分証の有効期限切れ会員送信メールアドレス | 255 | —（text） | m10-16_admin_base_setting_setting_shop_additional_system.md |
| 0212 | デッキ一覧(検索入力) | 3-16 | 成績 | 50 | フォームに Length 制約なし | m15-04_admin_deck_deck_bulk_update.md |
| 0212 | デッキ一覧(検索入力) | 3-23 | デッキ名 | 50 | 文字列 50（`stext_len`） | m15-01_admin_deck_deck_search.md |
| 0212 | デッキ一覧(検索入力) | 3-25 | プレイヤー名 | 50 | 文字列 50（`stext_len`） | m15-01_admin_deck_deck_search.md |
| 0212 | デッキ編集 | 5-1 | デッキ名 | 255 | 255（`deck.length.short_name`。Symfony Length と input maxlength） | m15-05_admin_deck_deck_edit.md |
| 0212 | デッキ編集 | 5-21 | 成績 | 32 | 32（`deck.length.result`） | m15-05_admin_deck_deck_edit.md |
| 0212 | デッキ編集 | 5-22 | 引用元URL | 2048 | 255（`deck.length.url`） | m15-05_admin_deck_deck_edit.md |
| 0212 | アーキタイプ編集 | 11-2 | アーキタイプ名(英) | 255 | 同上 | m15-09_admin_deck_deck_archetype_crud.md |
| 0212 | アーキタイプ編集 | 11-4 | 解説(英) | 1024 | 同上 | m15-09_admin_deck_deck_archetype_crud.md |
| 0306 | 新規会員登録 | 3-1-10 | メールアドレス | 255 | メール用フォーム部品の上限に従う（再入力一致を要する） | f06-01_front_member_customer_entry.md |
| 0306 | 新規会員登録 | 3-1-11 | メールアドレス(確認) | 255 | 同上 | f06-01_front_member_customer_entry.md |
| 0306 | 新規会員登録 | 3-1-12 | パスワード | 50 | パスワード用フォーム部品の上限に従う（再入力一致を要する） | f06-01_front_member_customer_entry.md |
| 0306 | 新規会員登録 | 3-1-13 | パスワード(確認) | 50 | 同上 | f06-01_front_member_customer_entry.md |
| 0306 | パスワード再発行 | 6-3-4 | 新しいパスワード(確認) | 50 | 同上 | f06-04_front_member_forgot_password_reset.md |
| 0306 | 会員情報変更 | 15-1-10 | メールアドレス | 255 | フォーム上限なし（メール形式） | f06-18_front_member_mypage_customer_edit.md |
| 0306 | 会員情報変更 | 15-1-12 | パスワード | 50 | フォーム上限なし（パスワード種別、2欄一致） | f06-18_front_member_mypage_customer_edit.md |
| 0306 | 退会 | 17-2-3 | パスワード | 32 | フォーム上限なし（パスワード種別の入力欄） | f06-21_front_member_mypage_withdraw.md |
| 0308 | 店頭買取査定申込前ログイン | 3-2 | メールアドレス | 320 | フォーム上限なし（ログイン用） | f08-01_front_store_purchase_otc_buy_entry_login.md |
| 0308 | 店頭買取査定申込前ログイン | 3-3 | パスワード | 320 | フォーム上限なし（パスワード種別の入力欄） | f08-01_front_store_purchase_otc_buy_entry_login.md |
| 0308 | 店頭買取査定申込情報入力 | 4-4 | お名前（姓） | 128 | 住所名の文字数（確認値はお届け先住所長設定）。空白不可の形式検証あり | f08-02_front_store_purchase_otc_buy_entry_input.md |
| 0308 | 店頭買取査定申込情報入力 | 4-5 | お名前（名） | 128 | 同上 | f08-02_front_store_purchase_otc_buy_entry_input.md |

## 未マッチ・突合対象外について

未マッチ 606 件と突合対象外 174 件は件数が多いため本レポートには列挙しない。`functions/item_definition_drift.tsv` の `kind=unmatched-label` / `kind=no-input-section` を参照。未マッチには 「Excelにあってソースに無い項目（真の差分）」と「ラベル表記揺れ」が混在する。

