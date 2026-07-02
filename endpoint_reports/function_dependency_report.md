# 機能間依存関係整理（影響範囲・リグレッションテスト用）

## 目的

不具合修正後に、修正機能だけでなく影響しやすい周辺機能と優先して回すリグレッション観点を引けるようにするための初版整理である。

## 入力と抽出方法

- 機能別設計書: `functions/*/*.md` から 389 件を抽出。
- 結合試験観点表: `integration_test/*_it_cases.md` から各機能の IT-ID、優先度、ケース数を抽出。
- 基本設計HTMLは大分類・用語の補助情報として扱い、機能ID単位の主キーは機能別Markdownを正とする。
- 依存理由は `direct_ref`、`reverse_ref`、`shared_update_table`、`shared_db_table`、`shared_external`、`same_domain(_cross_layer)` に分類した。

## 使い方

1. 修正した機能IDを `function_dependency_inventory.tsv` で探す。
2. `function_dependency_edges.tsv` の `source_id` が該当機能の行を、score降順で確認する。
3. `direct_ref` と `shared_update_table` は原則リグレッション対象に入れる。
4. `shared_db_table` は修正内容がテーブル読み書き・集計条件・検索条件に触れた場合に対象化する。
5. `shared_external` は外部連携、CSV/PDF/API/バッチの入出力や再実行性に触れた場合に対象化する。

## 抽出サマリ

- 依存候補エッジ: 4365 件（各機能あたり上位12件をTSV出力）。
- 直接参照エッジ: 326 件。
- 共有更新テーブルエッジ: 1941 件。
- テストケース紐づき機能: 389 件。

## 影響範囲判定ルール

| 修正内容 | 追加で見る範囲 | 推奨リグレッション |
|---|---|---|
| 画面表示・JS・入力項目 | 同一機能 + `same_domain` + 直接遷移先 | P1/P2のUI部品、画面遷移、送信可否制御 |
| 登録・更新・削除 | `shared_update_table` + `shared_db_table` | P1/P2の登録内容、DB状態、副作用、二重送信 |
| 検索・一覧・CSV出力 | 同一ドメインの一覧/CSV + 共有検索セッション | 検索条件、件数、並び順、CSV/PDF内容 |
| API変更 | 同一ドメインのfront/admin/batch + 共有DB | 認証、リクエスト境界、レスポンス、状態変化 |
| バッチ変更 | 共有更新テーブル + 同一外部連携 | 再実行、対象なし、例外、ログ、更新件数 |
| 外部連携変更 | `shared_external` | 送信条件、失敗時、リトライ有無、ログ秘匿 |

## 主要な共有DBテーブル

| テーブル | 参照・言及機能数 | 更新系機能数 |
|---|---:|---:|
| `dtb_product_class` | 83 | 31 |
| `dtb_product` | 56 | 20 |
| `dtb_order` | 48 | 23 |
| `dtb_player` | 40 | 26 |
| `dtb_base_info` | 38 | 16 |
| `dtb_product_sub_class` | 34 | 7 |
| `dtb_product_stock` | 32 | 11 |
| `dtb_customer` | 31 | 18 |
| `mtb_card` | 28 | 3 |
| `mtb_card_detail` | 26 | 5 |
| `dtb_otc_buy_order` | 25 | 11 |
| `dtb_deck` | 23 | 17 |
| `dtb_member` | 21 | 16 |
| `dtb_csv_import_history` | 20 | 14 |
| `dtb_buy_order` | 20 | 10 |
| `dtb_shipping` | 19 | 7 |
| `dtb_deck_card` | 19 | 9 |
| `dtb_csv` | 18 | 2 |
| `dtb_order_item` | 17 | 3 |
| `dtb_stock_history` | 16 | 10 |

## 更新系で特に波及しやすいテーブル

| テーブル | 更新系機能数 | 主な確認観点 |
|---|---:|---|
| `dtb_product_class` | 31 | 商品表示、在庫、価格、検索、カード/API |
| `dtb_player` | 26 | 同一テーブルの登録・一覧・出力 |
| `dtb_order` | 23 | 受注状態、出荷、ポイント、スマレジ、CSV/PDF |
| `dtb_product` | 20 | 商品表示、在庫、価格、検索、カード/API |
| `dtb_customer` | 18 | 会員情報、ポイント、購入履歴、認証 |
| `dtb_deck` | 17 | 同一テーブルの登録・一覧・出力 |
| `dtb_member` | 16 | 同一テーブルの登録・一覧・出力 |
| `dtb_base_info` | 16 | 同一テーブルの登録・一覧・出力 |
| `dtb_csv_import_history` | 14 | 同一テーブルの登録・一覧・出力 |
| `dtb_event_detail` | 13 | 同一テーブルの登録・一覧・出力 |
| `dtb_otc_buy_order` | 11 | 受注状態、出荷、ポイント、スマレジ、CSV/PDF |
| `dtb_product_stock` | 11 | 商品表示、在庫、価格、検索、カード/API |
| `dtb_point_history` | 11 | 同一テーブルの登録・一覧・出力 |
| `dtb_stock_history` | 10 | 在庫数量、移動、承認、履歴、バッチ |
| `dtb_buy_order` | 10 | 受注状態、出荷、ポイント、スマレジ、CSV/PDF |

## ドメイン別機能数

| ドメイン | 機能数 |
|---|---:|
| `admin/product` | 42 |
| `admin/stock` | 34 |
| `admin/order` | 26 |
| `front/member` | 23 |
| `api/deck` | 18 |
| `admin/customer` | 16 |
| `admin/base` | 15 |
| `admin/event` | 15 |
| `admin/store` | 13 |
| `api/store` | 12 |
| `admin/deck` | 11 |
| `admin/content` | 10 |
| `admin/card` | 10 |
| `admin/online` | 9 |
| `batch/order` | 9 |
| `front/product` | 8 |
| `admin/analytics` | 8 |
| `admin/data` | 8 |
| `api/product` | 7 |
| `api/online` | 7 |
| `batch/product` | 7 |
| `admin/home` | 6 |
| `admin/system` | 6 |
| `batch/customer` | 6 |
| `front/online` | 6 |

## 外部連携・入出力キーワード

| キーワード | 機能数 |
|---|---:|
| API | 363 |
| バッチ | 305 |
| CSV | 178 |
| メール | 103 |
| 支店 | 81 |
| スマレジ | 73 |
| PDF | 32 |
| S3 | 9 |
| Webhook | 7 |
| WordPress | 3 |
| SPLINKS | 1 |

## 依存候補が多い機能

| 機能ID | 機能名 | outgoing | incoming | 主な更新テーブル |
|---|---|---:|---:|---|
| `a02-05` | API 商品管理 — 更新商品規格取得 | 12 | 81 | `dtb_product`, `dtb_product_category`, `dtb_product_class`, `dtb_product_image`, `dtb_product_stock` |
| `a02-02` | API 商品管理 — ポップアップ用カード情報取得 | 12 | 72 |  |
| `a02-03` | API 商品管理 — ポップアップ用商品情報取得（旧商品ID） | 12 | 59 |  |
| `a02-04` | API 商品管理 — ポップアップ用カード情報取得（旧商品ID） | 12 | 59 |  |
| `a05-01` | API 受注管理 — 注文印刷（印刷情報送信・印刷済み更新） | 12 | 44 | `dtb_order`, `dtb_order_sub` |
| `a05-02` | API 受注管理 — 注文印刷（印刷情報送信・印刷済み更新） | 12 | 43 | `dtb_order`, `dtb_order_sub` |
| `b02-02` | バッチ 商品管理 — 入荷通知キャンセル | 12 | 43 | `dtb_product`, `dtb_product_class`, `dtb_product_request` |
| `b05-02` | バッチ 受注管理 — 購入完了手続き再処理 | 12 | 42 | `dtb_order`, `dtb_order_sub`, `dtb_point_history`, `dtb_product_class`, `dtb_stock_history` |
| `f03-02` | F03-02（商品詳細） | 12 | 42 | `dtb_customer_favorite_product`, `dtb_favorite_product`, `dtb_product`, `dtb_product_class`, `mtb_option` |
| `a17-03` | API その他 — PointGranterAPI連携 | 12 | 40 | `dtb_customer`, `dtb_player`, `dtb_point_history` |
| `a05-04` | API 受注管理 — スマレジ受信処理（ポイント履歴取得） | 12 | 38 | `dtb_order_sub`, `dtb_player`, `dtb_point_history`, `mtb_option`, `mtb_point_type` |
| `m03-26` | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録） | 12 | 38 | `dtb_csv_import_history`, `dtb_price_history`, `dtb_product`, `dtb_product_category`, `dtb_product_class` |
| `m03-27` | m03-27_admin_product_product_goods_csv_import（管理画面_商品管理_グッズ商品CSV登録） | 12 | 38 | `dtb_csv_import_history`, `dtb_price_history`, `dtb_product`, `dtb_product_category`, `dtb_product_class` |
| `a06-09` | API 店頭買取管理 — 商品名から商品詳細の情報を取得 | 12 | 37 |  |
| `a06-01` | API 店頭買取管理 — 買取アプリ用ログイン | 12 | 36 | `dtb_base_info`, `dtb_member`, `dtb_member_sub` |
| `a06-03` | API 店頭買取管理 — 店頭買取受注詳細更新 | 12 | 35 |  |
| `b05-01` | バッチ 受注管理 — 注文番号登録 | 12 | 34 | `dtb_order`, `dtb_order_number`, `dtb_order_sub` |
| `b05-04` | バッチ 受注管理 — スマレジ商品再連携 | 12 | 32 | `dtb_order`, `dtb_order_sub` |
| `a17-05` | API 店頭買取管理 — 商品名から商品詳細の情報を取得 | 12 | 31 |  |
| `b05-05` | バッチ 受注管理 — スマレジ商品削除 | 12 | 30 | `dtb_order`, `dtb_order_sub` |

## 成果物

- `function_dependency_inventory.tsv`: 機能ごとのDB、更新テーブル、外部連携、テストケース数。
- `function_dependency_edges.tsv`: 機能間の依存候補。scoreが高いほどリグレッション候補として優先。
- `build_function_dependency_report.py`: 再生成スクリプト。

## 注意点

- この初版は設計書本文からの抽出であり、実コードの呼び出しグラフではない。
- 共有DBテーブルは依存候補であり、必ずしも同一レコード・同一条件を触るとは限らない。
- 修正PR単位の最終影響範囲は、変更ファイル、SQL、ルート、テンプレート、フォーム、バッチコマンドを突き合わせて確定する。
