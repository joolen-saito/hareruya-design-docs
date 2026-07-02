# URLエンドポイント存在確認レポート

## 確認条件

- 対象HTML: `functions/todo-list.md` の `[html](...)` リンク先 392 件
- 抽出したURLエンドポイント: 1109 件
- ec-cube-enterprise側抽出ルート: 1149 件
- 比較方法: HTTPメソッド + パス。クエリ文字列は除外、`%admin%` は `%eccube_admin_route%` と同一扱い、`/{_locale}` と `/{_locale}{_shop}` の表記差、動的セグメント（`{id}` 等）と具体値の差は吸収。
- 除外: `実装要確認`、`上記パス`、`…` など具体URLでない記載。

## 存在しない可能性が高いURLエンドポイント

| 機能No | 機能名 | HTML | 入口 | 記載URL | 備考 |
|---|---|---|---|---|---|
| F01-02 | 支店ECTOP | `function_spec_html_preview/pf-eccube3/f01-02_front_top_home_branch.html` | 店舗紹介ページを開く | `GET /{_locale}/shoppage/{name}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F01-02 | 支店ECTOP | `function_spec_html_preview/pf-eccube3/f01-02_front_top_home_branch.html` | 店舗一覧（左カラム・SP）内のリンク | `GET /{_locale}/shoppage/{name}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F01-02 | 支店ECTOP | `function_spec_html_preview/pf-eccube3/f01-02_front_top_home_branch.html` | 店舗未存在・当該言語のページ要素なし | `GET /{_locale}/shoppage/{name}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F02-03 | 支店PC版ナビゲーション | `function_spec_html_preview/pf-eccube3/f02-03_front_global_nav_branch_global_nav_pc.html` | 店舗紹介ページをPCで開く | `GET /{_locale}/shoppage/{name}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F02-03 | 支店PC版ナビゲーション | `function_spec_html_preview/pf-eccube3/f02-03_front_global_nav_branch_global_nav_pc.html` | 左カラム店舗一覧の店舗リンク押下 | `GET /{_locale}/shoppage/{name}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F02-04 | 支店スマホ版ナビゲーション | `function_spec_html_preview/pf-eccube3/f02-04_front_global_nav_branch_global_nav_sp.html` | 店舗紹介ページをスマホで開く | `GET /{_locale}/shoppage/{name}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F02-04 | 支店スマホ版ナビゲーション | `function_spec_html_preview/pf-eccube3/f02-04_front_global_nav_branch_global_nav_sp.html` | タブレット用店舗一覧の店舗リンク押下 | `GET /{_locale}/shoppage/{name}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F02-05 | 通知 | `function_spec_html_preview/pf-eccube3/f02-05_front_global_nav_global_nav_notification.html` | カート個数の非同期取得 | `GET /{_locale}/cart/get` | ec-cube-enterpriseの抽出ルートに一致なし |
| F03-01 | 商品一覧 | `function_spec_html_preview/pf-eccube3/f03-01_front_product_product_search_list.html` | 一覧の商品サムネイルの遅延読み込み | `GET /{_locale}/products/search/lazy` | ec-cube-enterpriseの抽出ルートに一致なし |
| F03-02 | 商品詳細 | `function_spec_html_preview/pf-eccube3/f03-02_front_product_product_detail.html` | 旧商品コードから開く | `GET /{_locale}/forward/{oldCode}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F03-06 | 最近見た商品 | `function_spec_html_preview/pf-eccube3/f03-06_front_product_product_recently_viewed.html` | 最近見た商品ブロックの読み込み | `GET /{_locale}/block/history` | ec-cube-enterpriseの抽出ルートに一致なし |
| F03-07 | 入荷時通知 | `function_spec_html_preview/pf-eccube3/f03-07_front_product_product_arrival_notification.html` | 入荷通知ボタン（商品詳細・商品一覧） | `POST /{_locale}/cart/pushReceive` | ec-cube-enterpriseの抽出ルートに一致なし |
| F03-08 | お気に入り | `function_spec_html_preview/pf-eccube3/f03-08_front_product_product_favorite.html` | 商品詳細などのお気に入り登録ボタン | `POST /products/favorite/add` | ec-cube-enterpriseの抽出ルートに一致なし |
| F03-08 | お気に入り | `function_spec_html_preview/pf-eccube3/f03-08_front_product_product_favorite.html` | お気に入り解除ボタン | `DELETE /products/favorite/remove` | ec-cube-enterpriseの抽出ルートに一致なし |
| F03-08 | お気に入り | `function_spec_html_preview/pf-eccube3/f03-08_front_product_product_favorite.html` | マイページの「お気に入り登録商品一覧」ブロック | `GET /mypage/favorite/list` | ec-cube-enterpriseの抽出ルートに一致なし |
| F03-08 | お気に入り | `function_spec_html_preview/pf-eccube3/f03-08_front_product_product_favorite.html` | 一覧の「セール対象商品のみ表示する」切替 | `GET /mypage/favorite/list?sale=1` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-01 | 買い物かご | `function_spec_html_preview/pf-eccube3/f04-01_front_cart_cart_index.html` | 再計算（数量更新） | `POST /{_locale}/cart/update` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-01 | 買い物かご | `function_spec_html_preview/pf-eccube3/f04-01_front_cart_cart_index.html` | カート一括削除 | `GET /{_locale}/cart/clear` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-01 | 買い物かご | `function_spec_html_preview/pf-eccube3/f04-01_front_cart_cart_index.html` | 購入手続きへ進む | `POST /{_locale}/cart/buystep` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-01 | 買い物かご | `function_spec_html_preview/pf-eccube3/f04-01_front_cart_cart_index.html` | カートに商品を追加（XHR） | `POST /{_locale}/cart/add` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-01 | 買い物かご | `function_spec_html_preview/pf-eccube3/f04-01_front_cart_cart_index.html` | カートに追加して表示 | `POST /{_locale}/cart/add_show` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-01 | 買い物かご | `function_spec_html_preview/pf-eccube3/f04-01_front_cart_cart_index.html` | カート内容取得（XHR） | `GET /{_locale}/cart/get` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-01 | 買い物かご | `function_spec_html_preview/pf-eccube3/f04-01_front_cart_cart_index.html` | 入荷通知依頼（XHR） | `POST /{_locale}/cart/pushReceive` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-01 | 買い物かご | `function_spec_html_preview/pf-eccube3/f04-01_front_cart_cart_index.html` | プリフライト | `OPTIONS /{_locale}/cart/get` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-01 | 買い物かご | `function_spec_html_preview/pf-eccube3/f04-01_front_cart_cart_index.html` | プリフライト | `OPTIONS /{_locale}/cart/add` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-02 | ご注文方法指定 | `function_spec_html_preview/pf-eccube3/f04-02_front_cart_shopping_order_method.html` | 配送業者を変更 | `POST /{_locale}/shopping/delivery` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-02 | ご注文方法指定 | `function_spec_html_preview/pf-eccube3/f04-02_front_cart_shopping_order_method.html` | お支払い方法・要望・ポイントを変更 | `POST /{_locale}/shopping/payment` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-02 | ご注文方法指定 | `function_spec_html_preview/pf-eccube3/f04-02_front_cart_shopping_order_method.html` | 注文エラー画面 | `GET /{_locale}/shopping/shopping_error` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-03 | 配送先の新規登録・変更 | `function_spec_html_preview/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.html` | お届け先を新規登録（編集画面） | `GET /{_locale}/shopping/delivery/new/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-03 | 配送先の新規登録・変更 | `function_spec_html_preview/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.html` | お届け先を新規登録（編集画面） | `POST /{_locale}/shopping/delivery/new/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-03 | 配送先の新規登録・変更 | `function_spec_html_preview/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.html` | 既存お届け先を編集 | `GET /{_locale}/shopping/delivery/{id}/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-03 | 配送先の新規登録・変更 | `function_spec_html_preview/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.html` | 既存お届け先を編集 | `POST /{_locale}/shopping/delivery/{id}/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-03 | 配送先の新規登録・変更 | `function_spec_html_preview/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.html` | 確認画面から登録 | `POST /{_locale}/shopping/delivery/new/confirm` | ec-cube-enterpriseの抽出ルートに一致なし |
| F04-03 | 配送先の新規登録・変更 | `function_spec_html_preview/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.html` | 確認画面から登録 | `POST /{_locale}/shopping/delivery/{id}/confirm` | ec-cube-enterpriseの抽出ルートに一致なし |
| F05-02 | ネット買取商品検索 | `function_spec_html_preview/pf-eccube3/f05-02_front_online_purchase_buy_product_search.html` | 商品カテゴリ一覧（主にスマートフォン用）からの導線 | `GET /{_locale}/purchase/category` | ec-cube-enterpriseの抽出ルートに一致なし |
| F05-04 | ネット買取商品詳細 | `function_spec_html_preview/pf-eccube3/f05-04_front_online_purchase_buy_product_detail.html` | 旧商品コードからの転送 | `GET /{_locale}/purchase/forward/{oldCode}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F05-05 | ネット買取カート | `function_spec_html_preview/pf-eccube3/f05-05_front_online_purchase_buy_cart.html` | カート内商品の削除 | `PUT /{_locale}/purchase/{id}/remove` | ec-cube-enterpriseの抽出ルートに一致なし |
| F05-05 | ネット買取カート | `function_spec_html_preview/pf-eccube3/f05-05_front_online_purchase_buy_cart.html` | 数量の再計算（更新） | `POST /{_locale}/purchase/update` | ec-cube-enterpriseの抽出ルートに一致なし |
| F08-02 | 店頭買取査定申込情報入力 | `function_spec_html_preview/pf-eccube3/f08-02_front_store_purchase_otc_buy_entry_input.html` | エントリー（開始画面） | `POST /{_locale}/otcbuy/{name}/entry` | ec-cube-enterpriseの抽出ルートに一致なし |
| F08-02 | 店頭買取査定申込情報入力 | `function_spec_html_preview/pf-eccube3/f08-02_front_store_purchase_otc_buy_entry_input.html` | 会員登録フォーム | `GET /{_locale}/otcbuy/{name}/register_customer` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-02 | 本会員登録 | `function_spec_html_preview/pf-eccube3/f06-02_front_member_entry_activate.html` | 仮会員登録完了メール内のアクティベートURL | `GET /entry/activate/{secret_key}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-03 | ログイン | `function_spec_html_preview/pf-eccube3/f06-03_front_member_customer_login.html` | ログイン送信 | `POST /{_locale}/login_check` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-04 | パスワード変更 | `function_spec_html_preview/pf-eccube3/f06-04_front_member_forgot_password_reset.html` | 「変更する」ボタン | `POST /forgot/resetcomplete/{resetKey}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-05 | マイページ | `function_spec_html_preview/pf-eccube3/f06-05_front_member_mypage_index.html` | ヘッダー用保有ポイント | `GET /{_locale}/mypage/point_in_header` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-06 | 購入履歴一覧 | `function_spec_html_preview/pf-eccube3/f06-06_front_member_mypage_order_history.html` | 注文番号リンク | `GET /{_locale}/mypage/shopping_history/detail/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-06 | 購入履歴一覧 | `function_spec_html_preview/pf-eccube3/f06-06_front_member_mypage_order_history.html` | 「この注文内容で再度購入する」 | `POST /{_locale}/mypage/shopping_history/repurchase` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-06 | 購入履歴一覧 | `function_spec_html_preview/pf-eccube3/f06-06_front_member_mypage_order_history.html` | 領収書発行 | `GET /{_locale}/mypage/shopping_history/printOrderReceipt/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-07 | 購入履歴詳細 | `function_spec_html_preview/pf-eccube3/f06-07_front_member_mypage_order_history_detail.html` | 購入履歴一覧の注文番号リンク | `GET /{_locale}/mypage/shopping_history/detail/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-07 | 購入履歴詳細 | `function_spec_html_preview/pf-eccube3/f06-07_front_member_mypage_order_history_detail.html` | 「この注文商品をもう一度購入する」 | `POST /{_locale}/mypage/shopping_history/repurchase` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-07 | 購入履歴詳細 | `function_spec_html_preview/pf-eccube3/f06-07_front_member_mypage_order_history_detail.html` | 領収書発行 | `GET /{_locale}/mypage/shopping_history/printOrderReceipt/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-09 | お気に入り商品一覧 | `function_spec_html_preview/pf-eccube3/f06-09_front_member_mypage_favorite_product.html` | マイページの「お気に入り登録商品一覧」ブロック | `GET /{_locale}/mypage/favorite/list` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-09 | お気に入り商品一覧 | `function_spec_html_preview/pf-eccube3/f06-09_front_member_mypage_favorite_product.html` | 「セール対象商品のみ表示する」切替 | `GET /{_locale}/mypage/favorite/list?sale=1` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-09 | お気に入り商品一覧 | `function_spec_html_preview/pf-eccube3/f06-09_front_member_mypage_favorite_product.html` | 表示順の切替（登録順・価格高い順・価格安い順） | `GET /{_locale}/mypage/favorite/list?sort=default` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-11 | 買取履歴一覧 | `function_spec_html_preview/pf-eccube3/f06-11_front_member_mypage_buy_history.html` | オーダーID・処理状態画像 | `GET /{_locale}/mypage/purchase_history/detail/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-12 | 買取履歴詳細 | `function_spec_html_preview/pf-eccube3/f06-12_front_member_mypage_buy_history_detail.html` | 買取履歴一覧のオーダーID・処理状態画像 | `GET /{_locale}/mypage/purchase_history/detail/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-12 | 買取履歴詳細 | `function_spec_html_preview/pf-eccube3/f06-12_front_member_mypage_buy_history_detail.html` | 詳細画面の「承諾確定」ボタン | `POST /{_locale}/mypage/purchase_history/update/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-12 | まとめて買取査定結果 | `function_spec_html_preview/pf-eccube3/f06-12_front_member_mypage_bulk_purchase_result.html` | 買取履歴詳細の「こちら（すべての査定結果）」リンク | `GET /mypage/purchase_history/list/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-14 | 予約済み大会一覧 | `function_spec_html_preview/pf-eccube3/f06-14_front_member_mypage_event_reserved_list.html` | マイページの「予約済み大会一覧」ブロック | `GET /{_locale}/mypage/events` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-14 | 予約済み大会一覧 | `function_spec_html_preview/pf-eccube3/f06-14_front_member_mypage_event_reserved_list.html` | 一覧のイベント名リンク | `GET /{_locale}/events/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-14 | 予約済み大会一覧 | `function_spec_html_preview/pf-eccube3/f06-14_front_member_mypage_event_reserved_list.html` | 「デッキ登録」ボタン | `GET /{_locale}/mypage/deckentry_list` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-20 | 配送先新規登録・変更 | `function_spec_html_preview/pf-eccube3/f06-20_front_member_mypage_delivery_edit.html` | 確認画面の「登録する」送信 | `POST /{_locale}/mypage/delivery/new/confirm` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-20 | 配送先新規登録・変更 | `function_spec_html_preview/pf-eccube3/f06-20_front_member_mypage_delivery_edit.html` | 確認画面の「登録する」送信 | `POST /{_locale}/mypage/delivery/{id}/confirm` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-25 | 店頭注文呼び出し番号表示 | `function_spec_html_preview/pf-eccube3/f06-25_front_member_store_order_call_number.html` | 店内モニター画面（第1） | `GET /{_locale}/waiting_number_1` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-25 | 店頭注文呼び出し番号表示 | `function_spec_html_preview/pf-eccube3/f06-25_front_member_store_order_call_number.html` | 店内モニター画面（第2） | `GET /{_locale}/waiting_number_2` | ec-cube-enterpriseの抽出ルートに一致なし |
| F06-25 | 店頭注文呼び出し番号表示 | `function_spec_html_preview/pf-eccube3/f06-25_front_member_store_order_call_number.html` | 注文番号取得API | `GET /{_locale}/waiting_api/get_waiting` | ec-cube-enterpriseの抽出ルートに一致なし |
| F07-01 | イベント大会TOP | `function_spec_html_preview/pf-eccube3/f07-01_front_event_event_top.html` | 複数日程イベントを押下 | `GET /{_locale}/events/{eventId}/{eventDate}/` | ec-cube-enterpriseの抽出ルートに一致なし |
| F07-02 | 大会詳細検索 | `function_spec_html_preview/pf-eccube3/f07-02_front_event_event_search.html` | 検索フォームを開く | `GET /{_locale}/events/search` | ec-cube-enterpriseの抽出ルートに一致なし |
| F07-03 | 大会詳細 | `function_spec_html_preview/pf-eccube3/f07-03_front_event_event_detail.html` | デッキ登録・編集ボタンを押下 | `GET /{_locale}/deckentry/edit?eventDetailId={eventDetailId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| F07-04 | 大会申込～完了 | `function_spec_html_preview/pf-eccube3/f07-04_front_event_event_entry_complete.html` | 申込を登録する | `POST /{_locale}/events/registration` | ec-cube-enterpriseの抽出ルートに一致なし |
| F07-04 | 大会申込～完了 | `function_spec_html_preview/pf-eccube3/f07-04_front_event_event_entry_complete.html` | 決済URLを取得する | `POST /{_locale}/events/payment_url` | ec-cube-enterpriseの抽出ルートに一致なし |
| F07-04 | 大会申込～完了 | `function_spec_html_preview/pf-eccube3/f07-04_front_event_event_entry_complete.html` | 決済後に戻る | `GET /{_locale}/events/payment_finish` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-02 | 商品編集機能 | `function_spec_html_preview/pf-eccube3/m03-02_admin_product_product_edit.html` | 商品を登録（更新）ボタン押下 | `POST /{admin_route}/product/product/{id}/edit/update` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-02 | 商品編集機能 | `function_spec_html_preview/pf-eccube3/m03-02_admin_product_product_edit.html` | 商品画像の追加（非同期） | `POST /{admin_route}/product/product/image/add` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-02 | 商品編集機能 | `function_spec_html_preview/pf-eccube3/m03-02_admin_product_product_edit.html` | 規格設定へ遷移 | `GET /{admin_route}/product/product/{id}/class/list` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-06 | 商品情報カスタムCSV出力 | `function_spec_html_preview/pf-eccube3/m03-06_admin_product_product_custom_csv_export.html` | 同プルダウンで「カスタム CSV 出力項目設定」を選ぶ | `GET /{admin_route}/setting/shop/custom_csv/1` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-09 | 商品規格登録/編集 | `function_spec_html_preview/pf-eccube3/m03-09_admin_product_product_class_edit.html` | 規格一覧を開く | `GET /{admin_route}/product/product/{id}/class/list` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-09 | 商品規格登録/編集 | `function_spec_html_preview/pf-eccube3/m03-09_admin_product_product_class_edit.html` | 規格の新規登録画面 | `GET /{admin_route}/product/product/{id}/class/new` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-09 | 商品規格登録/編集 | `function_spec_html_preview/pf-eccube3/m03-09_admin_product_product_class_edit.html` | 規格の編集画面 | `GET /{admin_route}/product/product/{id}/class/{classId}/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-09 | 商品規格登録/編集 | `function_spec_html_preview/pf-eccube3/m03-09_admin_product_product_class_edit.html` | 規格の新規登録送信 | `POST /{admin_route}/product/product/{id}/class/new/create` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-09 | 商品規格登録/編集 | `function_spec_html_preview/pf-eccube3/m03-09_admin_product_product_class_edit.html` | 規格の更新送信 | `POST /{admin_route}/product/product/{id}/class/{classId}/edit/update` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-09 | 商品規格登録/編集 | `function_spec_html_preview/pf-eccube3/m03-09_admin_product_product_class_edit.html` | 規格の削除 | `DELETE /{admin_route}/product/product/{id}/class/{classId}/edit/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-13 | タグ登録/編集 | `function_spec_html_preview/pf-eccube3/m03-13_admin_product_product_tag.html` | conversion の「登録」 | `POST /{admin_route}/product/tag/store` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-14 | 略称タグ登録/編集 | `function_spec_html_preview/pf-eccube3/m03-14_admin_product_product_abbreviation_tag_register_edit.html` | 画面下部「登録」 | `POST /{admin_route}/product/storage_code/store` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-16 | 略称タグCSV入力 | `function_spec_html_preview/pf-eccube3/m03-16_admin_product_product_storage_code_import.html` | 略称タグ管理の「CSV入力」 | `GET /{admin_route}/product/storage_code/import` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-17 | 売上分析タグ登録/編集 | `function_spec_html_preview/pf-eccube3/m03-17_admin_product_product_sales_analysis_management.html` | フォーム送信による登録または更新。`id` がパスにある場合は当該行を更新対象として束ねる。 | `POST /{admin_route}/product/tag_sales_analysis/store` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-18 | 部門登録/編集 | `function_spec_html_preview/pf-eccube3/m03-18_admin_product_product_section.html` | 「登録」ボタン（新規） | `POST /{admin_route}/product/section/store` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-21 | 棚番登録/編集 | `function_spec_html_preview/pf-eccube3/m03-21_admin_product_product_shelf_number_register_edit.html` | conversion の「登録」 | `POST /{admin_route}/product/shelf_number/store` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-31 | セール用価格変更CSV登録 | `function_spec_html_preview/pf-eccube3/m03-31_admin_product_product_sale_price_csv_import.html` | アップロード画面を開く | `GET /{admin_route}/product/product_price_csv_upload` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-31 | セール用価格変更CSV登録 | `function_spec_html_preview/pf-eccube3/m03-31_admin_product_product_sale_price_csv_import.html` | CSVをアップロード | `POST /{admin_route}/product/product_price_csv_upload` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-31 | セール用価格変更CSV登録 | `function_spec_html_preview/pf-eccube3/m03-31_admin_product_product_sale_price_csv_import.html` | 雛形ファイルダウンロード | `GET /{admin_route}/product/product_csv_template/price` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-34 | 割引率変更CSV登録 | `function_spec_html_preview/pf-eccube3/m03-34_admin_product_product_discount_csv_import.html` | 商品管理メニューから「CSVダウンロード・アップロード」系の配下にある「割引率変更CSV登録」 | `GET /{admin_route}/product/product_discount_csv_upload` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-34 | 割引率変更CSV登録 | `function_spec_html_preview/pf-eccube3/m03-34_admin_product_product_discount_csv_import.html` | 同一画面でファイルを選び「CSVファイルのアップロード」を押下 | `POST /{admin_route}/product/product_discount_csv_upload` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-34 | 割引率変更CSV登録 | `function_spec_html_preview/pf-eccube3/m03-34_admin_product_product_discount_csv_import.html` | フォーマット欄の「雛形ファイルダウンロード」 | `GET /{admin_route}/product/product_csv_template/discount` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-34 | 割引率変更CSV登録 | `function_spec_html_preview/pf-eccube3/m03-34_admin_product_product_discount_csv_import.html` | `type` が `discount` のとき、割引率変更用のヘッダのみを持つ UTF-8（BOM 付き）… | `GET /{admin_route}/product/product_csv_template/{type}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-36 | 買取減額率変更CSV登録 | `function_spec_html_preview/pf-eccube3/m03-36_admin_product_product_buy_discount_csv_import.html` | 管理画面メニュー「商品管理」→「CSV管理」内「買取減額率変更CSV登録」 | `GET /{admin_route}/product/product_buy_discount_csv_upload` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-36 | 買取減額率変更CSV登録 | `function_spec_html_preview/pf-eccube3/m03-36_admin_product_product_buy_discount_csv_import.html` | 雛形ファイルダウンロード | `GET /{admin_route}/product/product_csv_template/buyDiscount` | ec-cube-enterpriseの抽出ルートに一致なし |
| M03-36 | 買取減額率変更CSV登録 | `function_spec_html_preview/pf-eccube3/m03-36_admin_product_product_buy_discount_csv_import.html` | CSV 選択してアップロード | `POST /{admin_route}/product/product_buy_discount_csv_upload` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-03 | 在庫一括編集 | `function_spec_html_preview/pf-eccube3/m04-03_admin_stock_stock_bulk_edit.html` | 商品検索一覧で商品を選び「在庫一括編集」を押下 | `POST /%eccube_admin_route%/product/edit_bulk_update_stock` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-03 | 在庫一括編集 | `function_spec_html_preview/pf-eccube3/m04-03_admin_stock_stock_bulk_edit.html` | 在庫一括編集画面で「登録」を押下 | `POST /%eccube_admin_route%/product/bulk_update_stock` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-03 | 在庫一括編集 | `function_spec_html_preview/pf-eccube3/m04-03_admin_stock_stock_bulk_edit.html` | 「商品検索に戻る」を押下 | `GET /%eccube_admin_route%/product/search/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-11 | 在庫移動・振替情報カスタムCSV出力 | `function_spec_html_preview/pf-eccube3/m04-11_admin_stock_product_stock_history_csv_export.html` | 在庫履歴の「CSV出力」 | `POST /{admin_route}/product/history/stock/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-17 | 在庫履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m04-17_admin_stock_stock_history_search_list.html` | 価格・在庫一覧を開く | `GET /%eccube_admin_route%/product/history` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-17 | 在庫履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m04-17_admin_stock_stock_history_search_list.html` | 「検索する」で送信 | `POST /%eccube_admin_route%/product/history/search/1` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-17 | 在庫履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m04-17_admin_stock_stock_history_search_list.html` | ページネーションでNページへ | `GET /%eccube_admin_route%/product/history/search/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-17 | 在庫履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m04-17_admin_stock_stock_history_search_list.html` | 価格一覧のCSVダウンロード | `GET /%eccube_admin_route%/product/history/price/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-17 | 在庫履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m04-17_admin_stock_stock_history_search_list.html` | 在庫一覧のCSVダウンロード | `GET /%eccube_admin_route%/product/history/stock/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-18 | 在庫履歴CSV出力 | `function_spec_html_preview/pf-eccube3/m04-18_admin_stock_stock_history_csv_export.html` | 在庫一覧でCSVダウンロードを押下 | `GET /%eccube_admin_route%/product/history/stock/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-19 | 欠品履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m04-19_admin_stock_stock_shortage_history_search_list.html` | 欠品履歴一覧を開く | `GET /%eccube_admin_route%/product/stockout/history` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-19 | 欠品履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m04-19_admin_stock_stock_shortage_history_search_list.html` | 「検索する」で送信 | `POST /%eccube_admin_route%/product/stockout/history/search/1` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-19 | 欠品履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m04-19_admin_stock_stock_shortage_history_search_list.html` | ページネーションでNページへ | `GET /%eccube_admin_route%/product/stockout/history/search/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-19 | 欠品履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m04-19_admin_stock_stock_shortage_history_search_list.html` | 一覧の商品名リンク | `GET /%eccube_admin_route%/product/product/{id}/class/{classId}/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-21 | 在庫変更CSV登録 | `function_spec_html_preview/pf-eccube3/m04-21_admin_stock_stock_csv_import.html` | 在庫変更CSVアップロード画面を開く | `GET /%eccube_admin_route%/product/product_stock_csv_upload` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-21 | 在庫変更CSV登録 | `function_spec_html_preview/pf-eccube3/m04-21_admin_stock_stock_csv_import.html` | CSVファイルと変更理由を送信 | `POST /%eccube_admin_route%/product/product_stock_csv_upload` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-21 | 在庫変更CSV登録 | `function_spec_html_preview/pf-eccube3/m04-21_admin_stock_stock_csv_import.html` | 雛形ファイルダウンロード | `GET /%eccube_admin_route%/product/product_csv_template/stock` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-31 | 棚卸計画 | `function_spec_html_preview/pf-eccube3/m04-31_admin_stock_stock_inventory_plan.html` | 棚卸計画一覧を開く | `GET /%eccube_admin_route%/product/inventory_plan/search/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-31 | 棚卸計画 | `function_spec_html_preview/pf-eccube3/m04-31_admin_stock_stock_inventory_plan.html` | 新規登録画面を開く | `GET /%eccube_admin_route%/product/inventory_plan/new` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-31 | 棚卸計画 | `function_spec_html_preview/pf-eccube3/m04-31_admin_stock_stock_inventory_plan.html` | 新規登録を送信 | `POST /%eccube_admin_route%/product/inventory_plan` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-31 | 棚卸計画 | `function_spec_html_preview/pf-eccube3/m04-31_admin_stock_stock_inventory_plan.html` | 編集画面を開く | `GET /%eccube_admin_route%/product/inventory_plan/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M04-31 | 棚卸計画 | `function_spec_html_preview/pf-eccube3/m04-31_admin_stock_stock_inventory_plan.html` | 更新を送信 | `POST /%eccube_admin_route%/product/inventory_plan/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M05-03 | 受注情報カスタムCSV出力 | `function_spec_html_preview/pf-eccube3/m05-03_admin_order_order_custom_csv_export.html` | 同ドロップダウンで「出力項目設定」を選ぶ | `GET /{admin_route}/setting/shop/custom_csv/3` | ec-cube-enterpriseの抽出ルートに一致なし |
| M05-19 | 出荷指示リスト検索 | `function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html` | ナビ「出荷指示」 | `GET /{admin_route}/standby/search` | ec-cube-enterpriseの抽出ルートに一致なし |
| M05-19 | 出荷指示リスト検索 | `function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html` | 「検索する」ボタン | `POST /{admin_route}/standby/search` | ec-cube-enterpriseの抽出ルートに一致なし |
| M05-19 | 出荷指示リスト検索 | `function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html` | ページネーションのリンク | `GET /{admin_route}/standby/search?page_no=N` | ec-cube-enterpriseの抽出ルートに一致なし |
| M05-19 | 出荷指示リスト検索 | `function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html` | パスパラメータ `page_no`（1 以上の数字）でページ指定。内部では `index` の `$pag… | `GET /{admin_route}/standby/page/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M05-22 | 出荷指示：納品書印刷（日本語） | `function_spec_html_preview/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.html` | ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、`admin_shipping_standby_edit` の編集を開いたうえで、少なくとも1件オンで「納品書印刷（日本語）」を押したとき | `POST /{admin_route}/standby/（出荷指示リスト主キー` | ec-cube-enterpriseの抽出ルートに一致なし |
| M05-22 | 出荷指示：納品書印刷（日本語） | `function_spec_html_preview/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.html` | メソッドがGETのみでリクエストにオン受注キー一覧が載らない | `GET /{admin_route}/standby/（リスト主キー` | ec-cube-enterpriseの抽出ルートに一致なし |
| M05-26 | 出荷実績インポート登録 | `function_spec_html_preview/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.html` | 「CSV，TSVファイルのアップロード」を押してファイル送信 | `POST /{admin_route}/order/shipping_result_csv/upload` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-01 | 買取検索/一覧 | `function_spec_html_preview/pf-eccube3/m06-01_admin_store_purchase_purchase_store_search_list.html` | 管理画面ナビ「店頭買取管理」→「買取一覧」 | `GET /{admin_route}/otcbuyorder` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-01 | 買取検索/一覧 | `function_spec_html_preview/pf-eccube3/m06-01_admin_store_purchase_purchase_store_search_list.html` | 検索ボタン押下 | `POST /{admin_route}/otcbuyorder` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-01 | 買取検索/一覧 | `function_spec_html_preview/pf-eccube3/m06-01_admin_store_purchase_purchase_store_search_list.html` | パス形式のページング | `GET /{admin_route}/otcbuyorder/page/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-02 | 古物台帳入力用CSV出力 | `function_spec_html_preview/pf-eccube3/m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export.html` | 検索結果が1件以上あり、一覧で注文をチェックし、「CSVダウンロード」→「古物台帳入力用CSV」を選ぶ | `POST /%eccube_admin_route%/otcbuyorder/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-02 | 古物台帳入力用CSV出力 | `function_spec_html_preview/pf-eccube3/m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export.html` | 一覧はあるがチェックを1つも付けずに「古物台帳入力用CSV」を選ぶ | `POST /%eccube_admin_route%/otcbuyorder/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-03 | 買取情報編集 | `function_spec_html_preview/pf-eccube3/m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html` | 店頭買取一覧の行から詳細へ | `GET /%eccube_admin_route%/otcbuyorder/{otcBuyOrderId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-03 | 買取情報編集 | `function_spec_html_preview/pf-eccube3/m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.html` | 「ステータス変更」リンク | `GET /%eccube_admin_route%/otcbuyorder/status/{otcBuyOrderId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-04 | 買取ステータス変更 | `function_spec_html_preview/pf-eccube3/m06-04_admin_store_purchase_purchase_store_status_change.html` | 店頭買取詳細の「ステータス変更」リンク | `GET /{admin_route}/otcbuyorder/status/{otcBuyOrderId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-05 | 買取商品履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m06-05_admin_store_purchase_purchase_store_history.html` | ナビ「店頭買取管理」→「買取商品履歴」 | `GET /{admin_route}/otcbuyorder/history` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-05 | 買取商品履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m06-05_admin_store_purchase_purchase_store_history.html` | 検索フォームの「検索する」 | `POST /{admin_route}/otcbuyorder/history` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-05 | 買取商品履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m06-05_admin_store_purchase_purchase_store_history.html` | ページャの各種リンク | `GET /{admin_route}/otcbuyorder/history/page/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-05 | 買取商品履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m06-05_admin_store_purchase_purchase_store_history.html` | CSV メニュー「選択した商品履歴取得」 | `POST /{admin_route}/otcbuyorder/history/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-05 | 買取商品履歴検索/一覧 | `function_spec_html_preview/pf-eccube3/m06-05_admin_store_purchase_purchase_store_history.html` | CSV メニュー「検索結果全件取得」 | `POST /{admin_route}/otcbuyorder/history/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-06 | 買取商品履歴全件CSV出力 | `function_spec_html_preview/pf-eccube3/m06-06_admin_store_purchase_purchase_store_history_csv_export_all.html` | 買取商品履歴で条件を入力し「検索する」を押して検索成功 | `POST /{admin_route}/otcbuyorder/history` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-06 | 買取商品履歴全件CSV出力 | `function_spec_html_preview/pf-eccube3/m06-06_admin_store_purchase_purchase_store_history_csv_export_all.html` | 検索済みであり一覧上部の「CSVダウンロード」から「検索結果全件取得」を押す | `POST /{admin_route}/otcbuyorder/history/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-06 | 買取商品履歴全件CSV出力 | `function_spec_html_preview/pf-eccube3/m06-06_admin_store_purchase_purchase_store_history_csv_export_all.html` | セッションに保存した検索条件で指定ページを再表示する（ページ番号はパスまたはクエリのいずれか）。 | `GET /{admin_route}/otcbuyorder/history/page/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-07 | 買取商品履歴選択CSV出力 | `function_spec_html_preview/pf-eccube3/m06-07_admin_store_purchase_purchase_store_history_select_csv_export.html` | 買取商品履歴で検索し、結果件数が正で一覧と「CSVダウンロード」が表示された状態で、行をチェックして「選択した商品履歴取得」を押す | `POST /{admin_route}/otcbuyorder/history/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M06-07 | 買取商品履歴選択CSV出力 | `function_spec_html_preview/pf-eccube3/m06-07_admin_store_purchase_purchase_store_history_select_csv_export.html` | 同上でチェックを付けず「選択した商品履歴取得」を押す | `POST /{admin_route}/otcbuyorder/history/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-01 | 会員検索/一覧 | `function_spec_html_preview/pf-eccube3/m08-01_admin_customer_customer_search_list.html` | 保存した検索パターンを適用 | `GET /{admin_route}/customer/search/pattern/{patternId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-02 | メール一括送信 | `function_spec_html_preview/pf-eccube3/m08-02_admin_customer_customer_mail_all.html` | 「確認」ボタン | `POST /{admin_route}/customer/mail_confirm` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-02 | メール一括送信 | `function_spec_html_preview/pf-eccube3/m08-02_admin_customer_customer_mail_all.html` | 「送信」ボタン | `POST /{admin_route}/customer/mail_complete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-05 | ポイント付与 | `function_spec_html_preview/pf-eccube3/m08-05_admin_customer_point.html` | 「登録」ボタン（付与） | `POST /{admin_route}/customer/point/{id}/update/{type}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-06 | ポイント履歴 | `function_spec_html_preview/pf-eccube3/m08-06_admin_customer_point.html` | 「登録」ボタン（付与） | `POST /{admin_route}/customer/point/{id}/update/{type}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-07 | メール送信履歴 | `function_spec_html_preview/pf-eccube3/m08-07_admin_customer_customer_mail_history.html` | 会員詳細等の「メール送信履歴」 | `GET /{admin_route}/customer/{id}/mail_history` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-09 | 配送先一覧表示/編集 | `function_spec_html_preview/pf-eccube3/m08-09_admin_customer_customer_delivery.html` | 会員詳細等の「配送先一覧」 | `GET /{admin_route}/customer/{id}/delivery` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-09 | 配送先一覧表示/編集 | `function_spec_html_preview/pf-eccube3/m08-09_admin_customer_customer_delivery.html` | 配送先の「編集」 | `POST /{admin_route}/customer/delivery/{id}/update` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-09 | 配送先一覧表示/編集 | `function_spec_html_preview/pf-eccube3/m08-09_admin_customer_customer_delivery.html` | 配送先の「削除」 | `DELETE /{admin_route}/customer/delivery/{id}/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-12 | 顧客グループ管理 | `function_spec_html_preview/pf-eccube3/m08-12_admin_customer_customer_group.html` | ナビ「顧客グループ管理」 | `GET /{admin_route}/customer_group/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-12 | 顧客グループ管理 | `function_spec_html_preview/pf-eccube3/m08-12_admin_customer_customer_group.html` | 「登録」ボタン（新規） | `POST /{admin_route}/customer_group/new` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-12 | 顧客グループ管理 | `function_spec_html_preview/pf-eccube3/m08-12_admin_customer_customer_group.html` | 「更新」ボタン（既存） | `POST /{admin_route}/customer_group/{id}/update` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-12 | 顧客グループ管理 | `function_spec_html_preview/pf-eccube3/m08-12_admin_customer_customer_group.html` | 「削除」ボタン | `DELETE /{admin_route}/customer_group/{id}/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M08-14 | 会員登録仮登録完了メール再送 | `function_spec_html_preview/pf-eccube3/m08-14_admin_customer_customer_resend_provisional_mail.html` | 会員一覧の「仮登録完了メール再送」操作 | `PUT /{admin_route}/customer/{id}/resend` | ec-cube-enterpriseの抽出ルートに一致なし |
| M09-10 | 支店トップページ管理 | `function_spec_html_preview/pf-eccube3/m09-10_admin_content_content_branch_top_page.html` | 支店トップページ管理を開く | `GET /{admin_route}/integration/toppage_management/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M09-10 | 支店トップページ管理 | `function_spec_html_preview/pf-eccube3/m09-10_admin_content_content_branch_top_page.html` | 支店選択を変更する | `GET /{admin_route}/integration/toppage_management/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M09-10 | 支店トップページ管理 | `function_spec_html_preview/pf-eccube3/m09-10_admin_content_content_branch_top_page.html` | 登録を押下する | `POST /{admin_route}/integration/toppage_management/register/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-03 | 会員規約設定 | `function_spec_html_preview/pf-eccube3/m10-03_admin_base_setting_setting_shop_customer_agreement.html` | 管理ナビから当画面を開く | `GET /{admin_route}/setting/shop/customer_agreement` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-03 | 会員規約設定 | `function_spec_html_preview/pf-eccube3/m10-03_admin_base_setting_setting_shop_customer_agreement.html` | 値を入力して送信する | `POST /{admin_route}/setting/shop/customer_agreement` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-04 | 支払い方法/手数料設定 | `function_spec_html_preview/pf-eccube3/m10-04_admin_base_setting_setting_shop_payment.html` | 「上へ」 | `PUT /{admin_route}/setting/shop/payment/{id}/up` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-04 | 支払い方法/手数料設定 | `function_spec_html_preview/pf-eccube3/m10-04_admin_base_setting_setting_shop_payment.html` | 「下へ」 | `PUT /{admin_route}/setting/shop/payment/{id}/down` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-04 | 支払い方法/手数料設定 | `function_spec_html_preview/pf-eccube3/m10-04_admin_base_setting_setting_shop_payment.html` | ロゴ画像を非同期アップロード | `POST /{admin_route}/setting/shop/payment/image/add` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-06 | 配送業者/配送料/配送時間設定 | `function_spec_html_preview/pf-eccube3/m10-06_admin_base_setting_setting_shop_delivery.html` | 一覧で行をドラッグして並べ替える | `POST /{admin_route}/setting/shop/delivery/rank/move` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-07 | 税率設定 | `function_spec_html_preview/pf-eccube3/m10-07_admin_base_setting_setting_shop_tax.html` | 一覧から「編集」を選ぶ | `GET /{admin_route}/setting/shop/tax/{id}/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-07 | 税率設定 | `function_spec_html_preview/pf-eccube3/m10-07_admin_base_setting_setting_shop_tax.html` | 共通税率で下部「登録」を押す | `POST /{admin_route}/setting/shop/tax/{id}/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-07 | 税率設定 | `function_spec_html_preview/pf-eccube3/m10-07_admin_base_setting_setting_shop_tax.html` | 「個別税率設定」ブロックの「登録」を押す | `POST /{admin_route}/setting/shop/tax/edit_param` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-07 | 税率設定 | `function_spec_html_preview/pf-eccube3/m10-07_admin_base_setting_setting_shop_tax.html` | 編集対象IDが存在しない | `GET /{admin_route}/setting/shop/tax/{id}/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-08 | 自動メール送信テンプレ | `function_spec_html_preview/pf-eccube3/m10-08_admin_base_setting_setting_shop_auto_mail.html` | 管理ナビの「店舗設定」配下から「自動送信メール」を開く | `GET /{admin_route}/mall/auto_mail` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-08 | 自動メール送信テンプレ | `function_spec_html_preview/pf-eccube3/m10-08_admin_base_setting_setting_shop_auto_mail.html` | テンプレ選択を変更する | `GET /{admin_route}/mall/auto_mail/{Mail}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-08 | 自動メール送信テンプレ | `function_spec_html_preview/pf-eccube3/m10-08_admin_base_setting_setting_shop_auto_mail.html` | 値を入力して「登録」を押す | `POST /{admin_route}/mall/auto_mail/{Mail}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M10-08 | 自動メール送信テンプレ | `function_spec_html_preview/pf-eccube3/m10-08_admin_base_setting_setting_shop_auto_mail.html` | 自動送信対象外の識別子をURL等で直接指定する | `GET /{admin_route}/mall/auto_mail/{Mail}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M11-02 | メンバー管理 | `function_spec_html_preview/pf-eccube3/m11-02_admin_system_setting_setting_system_member_edit.html` | 登録ボタンで編集を送信する | `POST /%admin_route%/setting/system/member/{id}/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-01 | 日別/月別集計 集計一覧表示 | `function_spec_html_preview/pf-eccube3/m12-01_admin_analytics_sales_daily_monthly_summary.html` | サイドメニュー「日別集計」 | `POST /{admin_route}/analysis/summary/daily` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-01 | 日別/月別集計 集計一覧表示 | `function_spec_html_preview/pf-eccube3/m12-01_admin_analytics_sales_daily_monthly_summary.html` | サイドメニュー「月別集計」 | `POST /{admin_route}/analysis/summary/monthly` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-03 | 受注/売上分析 集計一覧表示 | `function_spec_html_preview/pf-eccube3/m12-03_admin_analytics_sales_order_analysis_summary.html` | サイドメニュー「受注・売上分析」 | `POST /{admin_route}/analysis/sales` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-03 | 受注/売上分析 集計一覧表示 | `function_spec_html_preview/pf-eccube3/m12-03_admin_analytics_sales_order_analysis_summary.html` | 検索ボタン押下 | `POST /{admin_route}/analysis/sales/result` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-05 | 入荷通知依頼 一覧表示 | `function_spec_html_preview/pf-eccube3/m12-05_admin_analytics_sales_arrival_notification_search_list.html` | サイドメニュー「入荷通知依頼」 | `GET /{admin_route}/analysis/request` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-05 | 入荷通知依頼 一覧表示 | `function_spec_html_preview/pf-eccube3/m12-05_admin_analytics_sales_arrival_notification_search_list.html` | 検索ボタン押下 | `POST /{admin_route}/analysis/request/result` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-06 | 入荷通知依頼 CSVダウンロード | `function_spec_html_preview/pf-eccube3/m12-06_admin_analytics_sales_arrival_notification_csv_export.html` | 検索結果一覧の「CSVダウンロード」 | `GET /{admin_route}/analysis/request/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-07 | フォーマット売上分析 集計一覧表示 | `function_spec_html_preview/pf-eccube3/m12-07_admin_analytics_sales_format_analysis_summary.html` | サイドメニュー「フォーマット売上分析」 | `GET /{admin_route}/analysis/format_sales` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-07 | フォーマット売上分析 集計一覧表示 | `function_spec_html_preview/pf-eccube3/m12-07_admin_analytics_sales_format_analysis_summary.html` | 検索ボタン押下 | `POST /{admin_route}/analysis/format_sales/result` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-08 | フォーマット売上分析 CSVダウンロード | `function_spec_html_preview/pf-eccube3/m12-08_admin_analytics_sales_format_analysis_csv_export.html` | 集計結果の「CSVダウンロード」 | `POST /{admin_route}/analysis/format_sales/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-09 | デッキ採用枚数集計 出力条件変更 | `function_spec_html_preview/pf-eccube3/m12-09_admin_analysis_used_card.html` | ナビ「デッキ採用枚数集計」 | `GET /{admin_route}/analysis/used_card` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-09 | デッキ採用枚数集計 出力条件変更 | `function_spec_html_preview/pf-eccube3/m12-09_admin_analysis_used_card.html` | 「検索」ボタン | `POST /{admin_route}/analysis/used_card` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-09 | デッキ採用枚数集計 出力条件変更 | `function_spec_html_preview/pf-eccube3/m12-09_admin_analysis_used_card.html` | CSVダウンロード（形式指定） | `GET /{admin_route}/analysis/used_card/export/{mode}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-10 | デッキ採用枚数集計 特集タグ編集用CSVダウンロード | `function_spec_html_preview/pf-eccube3/m12-10_admin_analysis_used_card.html` | ナビ「デッキ採用枚数集計」 | `GET /{admin_route}/analysis/used_card` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-10 | デッキ採用枚数集計 特集タグ編集用CSVダウンロード | `function_spec_html_preview/pf-eccube3/m12-10_admin_analysis_used_card.html` | 「検索」ボタン | `POST /{admin_route}/analysis/used_card` | ec-cube-enterpriseの抽出ルートに一致なし |
| M12-10 | デッキ採用枚数集計 特集タグ編集用CSVダウンロード | `function_spec_html_preview/pf-eccube3/m12-10_admin_analysis_used_card.html` | CSVダウンロード（形式指定） | `GET /{admin_route}/analysis/used_card/export/{mode}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-01 | イベント一覧検索 | `function_spec_html_preview/pf-eccube3/m13-01_admin_event_event_search_list.html` | イベント一覧を開く | `GET /%admin_route%/event/list` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-01 | イベント一覧検索 | `function_spec_html_preview/pf-eccube3/m13-01_admin_event_event_search_list.html` | 検索フォームを送信 | `POST /%admin_route%/event/search/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-01 | イベント一覧検索 | `function_spec_html_preview/pf-eccube3/m13-01_admin_event_event_search_list.html` | 新規登録ボタン | `GET /%admin_route%/event/new` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-02 | イベント編集/削除 | `function_spec_html_preview/pf-eccube3/m13-02_admin_event_event_edit_delete.html` | 新規登録画面を開く | `GET /%admin_route%/event/new` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-02 | イベント編集/削除 | `function_spec_html_preview/pf-eccube3/m13-02_admin_event_event_edit_delete.html` | イベント更新の送信 | `POST /%admin_route%/event/{id}/create` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-02 | イベント編集/削除 | `function_spec_html_preview/pf-eccube3/m13-02_admin_event_event_edit_delete.html` | チェックした日程削除 | `POST /%admin_route%/event/{id}/detaildelete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-03 | 日程追加 | `function_spec_html_preview/pf-eccube3/m13-03_admin_event_event_schedule_add.html` | イベントの「日程追加」 | `GET /{admin_route}/event/{eventId}/schedule/new` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-04 | 繰り返し日程登録 | `function_spec_html_preview/pf-eccube3/m13-04_admin_event_event_repeat_schedule.html` | イベントの「繰り返し日程登録」 | `GET /{admin_route}/event/repeatschedule/{eventId}/new` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-04 | 繰り返し日程登録 | `function_spec_html_preview/pf-eccube3/m13-04_admin_event_event_repeat_schedule.html` | 「登録」ボタン | `POST /{admin_route}/event/repeatschedule/{eventId}/create` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-05 | 複製新規 | `function_spec_html_preview/pf-eccube3/m13-05_admin_event_event_duplicate_register.html` | 複製新規ボタン（編集画面） | `GET /%admin_route%/event/{duplicateId}/duplicate` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-06 | イベント申込検索 | `function_spec_html_preview/pf-eccube3/m13-06_admin_event_event_entry_management_search.html` | 申込一覧を開く | `GET /%admin_route%/entry/list` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-06 | イベント申込検索 | `function_spec_html_preview/pf-eccube3/m13-06_admin_event_event_entry_management_search.html` | 検索フォームを送信 | `POST /%admin_route%/entry/search` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-06 | イベント申込検索 | `function_spec_html_preview/pf-eccube3/m13-06_admin_event_event_entry_management_search.html` | ページ送り・表示件数変更・ソート変更 | `GET /%admin_route%/entry/page/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-06 | イベント申込検索 | `function_spec_html_preview/pf-eccube3/m13-06_admin_event_event_entry_management_search.html` | イベント詳細指定表示 | `GET /%admin_route%/entry/{eventDetailId}/detail/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-06 | イベント申込検索 | `function_spec_html_preview/pf-eccube3/m13-06_admin_event_event_entry_management_search.html` | デッキ表示ボタン | `GET /%admin_route%/entry/deckList` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-06 | イベント申込検索 | `function_spec_html_preview/pf-eccube3/m13-06_admin_event_event_entry_management_search.html` | CSV出力 | `GET /%admin_route%/entry/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-06 | イベント申込検索 | `function_spec_html_preview/pf-eccube3/m13-06_admin_event_event_entry_management_search.html` | 申込の編集 | `GET /%admin_route%/entry/{eventEntryId}/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-07 | イベント申込一括編集 | `function_spec_html_preview/pf-eccube3/m13-07_admin_event_event_entry_bulk_update.html` | 申込一覧で複数選択し「一括編集」 | `POST /{admin_route}/entry/bulkupdate` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-08 | デッキ表示 | `function_spec_html_preview/pf-eccube3/m13-08_admin_event_event_deck_view.html` | デッキ表示ボタン（申込一覧） | `GET /%admin_route%/entry/deckList` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-09 | CSVダウンロード | `function_spec_html_preview/pf-eccube3/m13-09_admin_event_event_csv_export.html` | イベント申込一覧のCSVダウンロード | `GET /%eccube_admin_route%/entry/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-09 | CSVダウンロード | `function_spec_html_preview/pf-eccube3/m13-09_admin_event_event_csv_export.html` | イベント詳細指定のCSVダウンロード | `GET /%eccube_admin_route%/entry/{eventDetailId}/export` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-09 | CSVダウンロード | `function_spec_html_preview/pf-eccube3/m13-09_admin_event_event_csv_export.html` | 雛形ファイルダウンロード | `GET /%eccube_admin_route%/entry/entry_csv_template` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-10 | イベント申込詳細・編集 | `function_spec_html_preview/pf-eccube3/m13-10_admin_event_event_entry_edit.html` | 申込一覧から編集 | `GET /%eccube_admin_route%/entry/{eventEntryId}/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-10 | イベント申込詳細・編集 | `function_spec_html_preview/pf-eccube3/m13-10_admin_event_event_entry_edit.html` | 申込更新の送信 | `POST /%eccube_admin_route%/entry/{eventEntryId}/update` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-10 | イベント申込詳細・編集 | `function_spec_html_preview/pf-eccube3/m13-10_admin_event_event_entry_edit.html` | プレイヤー検索（モーダル） | `POST /%eccube_admin_route%/entry/search/player/html` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-10 | イベント申込詳細・編集 | `function_spec_html_preview/pf-eccube3/m13-10_admin_event_event_entry_edit.html` | プレイヤー検索ページ送り | `GET /%eccube_admin_route%/entry/search/player/html/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-11 | イベント申込登録検索 | `function_spec_html_preview/pf-eccube3/m13-11_admin_event_event_entry_search.html` | 申込登録のイベント検索（キーワード・日付） | `POST /{admin_route}/entry/search/event/html` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-11 | イベント申込登録検索 | `function_spec_html_preview/pf-eccube3/m13-11_admin_event_event_entry_search.html` | 検索結果のページ送り | `GET /{admin_route}/entry/search/event/html/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-11 | イベント申込登録検索 | `function_spec_html_preview/pf-eccube3/m13-11_admin_event_event_entry_search.html` | イベントIDによる直接検索 | `POST /{admin_route}/entry/search/event/id` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-12 | イベント新規申込登録 | `function_spec_html_preview/pf-eccube3/m13-12_admin_event_event_entry_register.html` | 登録先選択画面 | `GET /%eccube_admin_route%/entry/select` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-12 | イベント新規申込登録 | `function_spec_html_preview/pf-eccube3/m13-12_admin_event_event_entry_register.html` | 新規申込の入力表示 | `GET /%eccube_admin_route%/entry/{eventDetailId}/new` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-12 | イベント新規申込登録 | `function_spec_html_preview/pf-eccube3/m13-12_admin_event_event_entry_register.html` | 新規申込の登録送信 | `POST /%eccube_admin_route%/entry/{eventDetailId}/create` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-12 | イベント新規申込登録 | `function_spec_html_preview/pf-eccube3/m13-12_admin_event_event_entry_register.html` | プレイヤー検索（モーダル） | `POST /%eccube_admin_route%/entry/search/player/html` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-13 | イベント申込一括CSV登録 | `function_spec_html_preview/pf-eccube3/m13-13_admin_event_event_entry_csv_import.html` | 一括登録のアップロード画面 | `GET /%eccube_admin_route%/entry/bulkentry` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-13 | イベント申込一括CSV登録 | `function_spec_html_preview/pf-eccube3/m13-13_admin_event_event_entry_csv_import.html` | CSVのアップロード送信 | `POST /%eccube_admin_route%/entry/bulkentry/upload` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-13 | イベント申込一括CSV登録 | `function_spec_html_preview/pf-eccube3/m13-13_admin_event_event_entry_csv_import.html` | 雛形ファイルダウンロード | `GET /%eccube_admin_route%/entry/entry_csv_template` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-14 | バナー設定 | `function_spec_html_preview/pf-eccube3/m13-14_admin_event_event_banner.html` | ナビ「バナー設定（イベント）」 | `GET /{admin_route}/banner/event` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-14 | バナー設定 | `function_spec_html_preview/pf-eccube3/m13-14_admin_event_event_banner.html` | 店舗で絞り込み | `GET /{admin_route}/banner/event/{html_class}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-14 | バナー設定 | `function_spec_html_preview/pf-eccube3/m13-14_admin_event_event_banner.html` | 「バナー設定」ボタン | `POST /{admin_route}/banner/event` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-14 | バナー設定 | `function_spec_html_preview/pf-eccube3/m13-14_admin_event_event_banner.html` | 「バナー設定」ボタン | `POST /{admin_route}/banner/event/{html_class}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-14 | バナー設定 | `function_spec_html_preview/pf-eccube3/m13-14_admin_event_event_banner.html` | バナーの「削除」 | `DELETE /{admin_route}/banner/event/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-15 | 画像設定 | `function_spec_html_preview/pf-eccube3/m13-15_admin_event_event_image_setting.html` | イベントバナー管理（全店舗） | `GET /%eccube_admin_route%/banner/event` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-15 | 画像設定 | `function_spec_html_preview/pf-eccube3/m13-15_admin_event_event_image_setting.html` | イベントバナー管理（店舗絞り込み） | `GET /%eccube_admin_route%/banner/event/{html_class}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-15 | 画像設定 | `function_spec_html_preview/pf-eccube3/m13-15_admin_event_event_image_setting.html` | 画像アップロード・バナー設定の送信 | `POST /%eccube_admin_route%/banner/event` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-15 | 画像設定 | `function_spec_html_preview/pf-eccube3/m13-15_admin_event_event_image_setting.html` | 画像アップロード・バナー設定の送信（店舗絞り込み） | `POST /%eccube_admin_route%/banner/event/{html_class}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-15 | 画像設定 | `function_spec_html_preview/pf-eccube3/m13-15_admin_event_event_image_setting.html` | 画像削除 | `DELETE /%eccube_admin_route%/banner/event/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M13-15 | 画像設定 | `function_spec_html_preview/pf-eccube3/m13-15_admin_event_event_image_setting.html` | 画像削除（店舗絞り込み） | `DELETE /%eccube_admin_route%/banner/event/delete/{html_class}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-01 | カード検索 | `function_spec_html_preview/pf-eccube3/m14-01_admin_card_card_search.html` | 一覧のカード名リンク | `GET /{admin_route}/card/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-02 | カード情報CSV出力 | `function_spec_html_preview/pf-eccube3/m14-02_admin_card_card_csv_export.html` | 検索結果が 1 件以上あり、一覧でカードをチェックして「CSV出力」を押す | `POST /{admin_route}/card/csvexport` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-03 | 一括削除 | `function_spec_html_preview/pf-eccube3/m14-03_admin_card_card_bulk_delete.html` | 検索結果が 1 件以上あり、一覧でカードにチェックを入れ、「一括削除」を押して確認で OK | `POST /{admin_route}/card/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-03 | 一括削除 | `function_spec_html_preview/pf-eccube3/m14-03_admin_card_card_bulk_delete.html` | 検索結果はあるがチェックを付けずに「一括削除」を押す | `POST /{admin_route}/card/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-04 | カード新規登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m14-04_admin_card_card_register_update_delete.html` | 一覧のカード名リンクから詳細へ | `GET /{admin_route}/card/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-04 | カード新規登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m14-04_admin_card_card_register_update_delete.html` | 編集で入力し保存 | `POST /{admin_route}/card/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-04 | カード新規登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m14-04_admin_card_card_register_update_delete.html` | 詳細サイドバーで削除を確定（確認ダイアログ後） | `DELETE /{admin_route}/card/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-05 | カードCSV登録 | `function_spec_html_preview/pf-eccube3/m14-05_admin_card_card_csv_import.html` | カード一覧上部の「CSV,TSV取り込み」リンク | `GET /{admin_route}/card/csvimport` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-05 | カードCSV登録 | `function_spec_html_preview/pf-eccube3/m14-05_admin_card_card_csv_import.html` | フォーマット説明を読み、ファイルを選んで「CSV, TSVファイルのアップロード」押下 | `POST /{admin_route}/card/csvimport` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-06 | カードセット一覧 | `function_spec_html_preview/pf-eccube3/m14-06_admin_card_cardset_list.html` | ページャのリンク | `GET /{admin_route}/cardset/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-06 | カードセット一覧 | `function_spec_html_preview/pf-eccube3/m14-06_admin_card_cardset_list.html` | 表メニューの「削除」 | `DELETE /{admin_route}/cardset/{id}/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-06 | カードセット一覧 | `function_spec_html_preview/pf-eccube3/m14-06_admin_card_cardset_list.html` | 「画像ダウンロード(言語別)」 | `POST /{admin_route}/cardset/download_lang` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-07 | 画像ダウンロード(2種) | `function_spec_html_preview/pf-eccube3/m14-07_admin_card_cardset_image_download.html` | カードセット一覧で 1 件以上チェックし、「画像ダウンロード(言語別)」を押す | `POST /{admin_route}/cardset/download_lang` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-08 | カードセット新規登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m14-08_admin_card_cardset_register_update_delete.html` | 新規で入力し「登録」を押す | `POST /{admin_route}/cardset/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-08 | カードセット新規登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m14-08_admin_card_cardset_register_update_delete.html` | 編集で入力し「更新」を押す | `POST /{admin_route}/cardset/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-08 | カードセット新規登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m14-08_admin_card_cardset_register_update_delete.html` | 編集画面の「削除」（確認後） | `DELETE /{admin_route}/cardset/{id}/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-08 | カードセット新規登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m14-08_admin_card_cardset_register_update_delete.html` | 一覧表メニュー「削除」（確認後） | `DELETE /{admin_route}/cardset/{id}/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-08 | カードセット新規登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m14-08_admin_card_cardset_register_update_delete.html` | フッタ「検索画面に戻る」 | `GET /{admin_route}/cardset/{page_no}?resume=1` | ec-cube-enterpriseの抽出ルートに一致なし |
| M14-09 | フォーマット一覧 | `function_spec_html_preview/pf-eccube3/m14-09_admin_card_format_list.html` | 行末メニュー「削除」 | `DELETE /{admin_route}/format/{formatId}/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-01 | デッキ検索/一覧 | `function_spec_html_preview/pf-eccube3/m15-01_admin_deck_deck_search.html` | 行のデッキ詳細リンク／編集 | `GET /{admin_route}/deck/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-02 | デッキCSV出力 | `function_spec_html_preview/pf-eccube3/m15-02_admin_deck_deck_csv_export.html` | 検索結果が 1 件以上あり、デッキにチェックを付けて「CSV出力」（標準）を押す | `POST /{admin_route}/deck/csvexport` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-02 | デッキCSV出力 | `function_spec_html_preview/pf-eccube3/m15-02_admin_deck_deck_csv_export.html` | 同一覧で「CSV出力（旧サイト）」相当のボタンを押す（翻訳キーは `admin.btn.csvexport_old`） | `POST /{admin_route}/deck/csvexport_old` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-03 | 一括削除 | `function_spec_html_preview/pf-eccube3/m15-03_admin_deck_deck_bulk_delete.html` | 検索結果が 1 件以上あり、一覧でデッキにチェックを入れ、「一括削除」を押して確認で OK | `POST /{admin_route}/deck/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-03 | 一括削除 | `function_spec_html_preview/pf-eccube3/m15-03_admin_deck_deck_bulk_delete.html` | 検索結果はあるがチェックを付けずに「一括削除」を押す | `POST /{admin_route}/deck/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-05 | デッキ新規登録/編集/削除/複製 | `function_spec_html_preview/pf-eccube3/m15-05_admin_deck_deck_edit.html` | ナビでデッキ一覧を開いたあと一覧から詳細リンクや新規 | `GET /{admin_route}/deck/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-05 | デッキ新規登録/編集/削除/複製 | `function_spec_html_preview/pf-eccube3/m15-05_admin_deck_deck_edit.html` | 一覧から削除リンク（アンカーで DELETE 送信） | `DELETE /{admin_route}/deck/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-05 | デッキ新規登録/編集/削除/複製 | `function_spec_html_preview/pf-eccube3/m15-05_admin_deck_deck_edit.html` | 編集画面上部の送信 | `POST /{admin_route}/deck/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-05 | デッキ新規登録/編集/削除/複製 | `function_spec_html_preview/pf-eccube3/m15-05_admin_deck_deck_edit.html` | リクエストボディに含ま複数のデッキ ID を順に削除する（単体削除と同じ検証適用）。本書では「一覧側からの… | `POST /{admin_route}/deck/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-06 | デッキ登録CSV | `function_spec_html_preview/pf-eccube3/m15-06_admin_deck_deck_csv_import.html` | デッキ検索画面（テンプレート `deck.twig`）の「CSV,TSV取り込み」リンク | `GET /{admin_route}/deck/csvimport` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-06 | デッキ登録CSV | `function_spec_html_preview/pf-eccube3/m15-06_admin_deck_deck_csv_import.html` | 同画面でファイルを選び送信ボタンを押す | `POST /{admin_route}/deck/csvimport` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-07 | デッキタグ一覧 | `function_spec_html_preview/pf-eccube3/m15-07_admin_deck_deck_tag_list.html` | カスタム一覧を既定件数・既定ページ・既定並びで開く（ルート名前付きリンクや直接入力を含む） | `GET /{admin_route}/deckTag` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-07 | デッキタグ一覧 | `function_spec_html_preview/pf-eccube3/m15-07_admin_deck_deck_tag_list.html` | 表示件数（10〜100 の 10 段階）、ページ、`sortKey` を変えて再度開く | `GET /{admin_route}/deckTag/{pageCount}/{pageNo}/{sortKey}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-07 | デッキタグ一覧 | `function_spec_html_preview/pf-eccube3/m15-07_admin_deck_deck_tag_list.html` | 一覧の編集または新規をモーダルで編集して登録 | `POST /{admin_route}/deckTag/{pageCount}/{pageNo}/{sortKey}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-07 | デッキタグ一覧 | `function_spec_html_preview/pf-eccube3/m15-07_admin_deck_deck_tag_list.html` | 一覧の削除ボタン | `DELETE /{admin_route}/deckTag/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-09 | アーキタイ登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.html` | 一覧の名称リンクから編集へ | `GET /{admin_route}/archetype/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-09 | アーキタイ登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.html` | 編集画面で「更新」を押す | `POST /{admin_route}/archetype/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-09 | アーキタイ登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.html` | 編集画面または一覧のドロップダウンから「削除」を選び、確認後に実行 | `DELETE /{admin_route}/archetype/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-09 | アーキタイ登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.html` | 編集画面の「代表カード」モーダル用。カード画像の検索結果 HTML 片を返す（XHR）。 | `POST /{admin_route}/archetype/search/main_card/html` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-09 | アーキタイ登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.html` | 同上のページング（XHR）。 | `GET /{admin_route}/archetype/search/main_card/html/{page_no}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-09 | アーキタイ登録/編集/削除 | `function_spec_html_preview/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.html` | 代表カード確定時にカード画像 ID から名称・URL を JSON で返す（XHR）。 | `POST /{admin_route}/archetype/search/main_card/id` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-10 | アーキタイプ登録CSV | `function_spec_html_preview/pf-eccube3/m15-10_admin_deck_archetype_csv_import.html` | サイドバー「デッキ管理」「アーキタイプ一覧」で一覧を開き、画面上部の CSV インポートボタンを押す | `GET /{admin_route}/archetype/csvimport` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-10 | アーキタイプ登録CSV | `function_spec_html_preview/pf-eccube3/m15-10_admin_deck_archetype_csv_import.html` | 「CSV, TSVファイルのアップロード」を押す（ファイルを選んだ状態） | `POST /{admin_route}/archetype/csvimport` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-10 | アーキタイプ登録CSV | `function_spec_html_preview/pf-eccube3/m15-10_admin_deck_archetype_csv_import.html` | ソース上バインドのみ存在する。確認したリビジョンでは取込サービスとコンストラクタシグネチャおよび出力メソッ… | `POST /{admin_route}/archetype/csvexport` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-11 | 直近の大会編集 | `function_spec_html_preview/pf-eccube3/m15-11_admin_deck_deck_latest_event.html` | デッキ管理メニューから「直近の大会管理」を開く | `GET /{admin_route}/latest_event_deck` | ec-cube-enterpriseの抽出ルートに一致なし |
| M15-11 | 直近の大会編集 | `function_spec_html_preview/pf-eccube3/m15-11_admin_deck_deck_latest_event.html` | 「直近の大会設定」ボタンで送信 | `POST /{admin_route}/latest_event_deck/update` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-01 | バナー設定(トップバナー管理) | `function_spec_html_preview/pf-eccube3/m16-01_admin_data_top_banner.html` | ナビからトップバナー管理を開く | `GET /{admin_route}/banner/top` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-01 | バナー設定(トップバナー管理) | `function_spec_html_preview/pf-eccube3/m16-01_admin_data_top_banner.html` | 店舗ドロップダウンで店舗を選ぶ | `GET /{admin_route}/banner/top/{html_class}#upload_wrap` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-01 | バナー設定(トップバナー管理) | `function_spec_html_preview/pf-eccube3/m16-01_admin_data_top_banner.html` | 各枠の「バナー設定」ボタン | `POST /{admin_route}/banner/top` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-01 | バナー設定(トップバナー管理) | `function_spec_html_preview/pf-eccube3/m16-01_admin_data_top_banner.html` | 各枠の「バナー設定」ボタン | `POST /{admin_route}/banner/top/{html_class}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-01 | バナー設定(トップバナー管理) | `function_spec_html_preview/pf-eccube3/m16-01_admin_data_top_banner.html` | 店舗絞り込み時の削除。`select_file` に加えパスに `{html_class}` が含まれる。 | `DELETE /{admin_route}/banner/top/delete/{html_class}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-02 | 画像設定(トップバナー管理) | `function_spec_html_preview/pf-eccube3/m16-02_admin_data_data_top_banner.html` | ナビ「データ管理」→「トップバナー管理」 | `GET /{admin_route}/banner/top` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-02 | 画像設定(トップバナー管理) | `function_spec_html_preview/pf-eccube3/m16-02_admin_data_data_top_banner.html` | 画像一覧のドロップダウンで店舗を選ぶ | `GET /{admin_route}/banner/top/{html_class}#upload_wrap` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-02 | 画像設定(トップバナー管理) | `function_spec_html_preview/pf-eccube3/m16-02_admin_data_data_top_banner.html` | 「バナー設定」ボタン | `POST /{admin_route}/banner/top` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-02 | 画像設定(トップバナー管理) | `function_spec_html_preview/pf-eccube3/m16-02_admin_data_data_top_banner.html` | 「バナー設定」ボタン | `POST /{admin_route}/banner/top/{html_class}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-02 | 画像設定(トップバナー管理) | `function_spec_html_preview/pf-eccube3/m16-02_admin_data_data_top_banner.html` | 同上（店舗サブディレクトリ文脈）。 | `DELETE /{admin_route}/banner/top/delete/{html_class}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-03 | 祝日追加/削除 | `function_spec_html_preview/pf-eccube3/m16-03_admin_data_data_holiday_add_delete.html` | ナビ「データ管理」→「祝日管理」 | `GET /{admin_route}/holiday` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-03 | 祝日追加/削除 | `function_spec_html_preview/pf-eccube3/m16-03_admin_data_data_holiday_add_delete.html` | 追加フォームで「追加」を押す | `POST /{admin_route}/holiday/add` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-03 | 祝日追加/削除 | `function_spec_html_preview/pf-eccube3/m16-03_admin_data_data_holiday_add_delete.html` | 一覧の「削除」リンク | `POST /{admin_route}/holiday/{id}/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-03 | 祝日追加/削除 | `function_spec_html_preview/pf-eccube3/m16-03_admin_data_data_holiday_add_delete.html` | CSRF が無効な追加送信 | `POST /{admin_route}/holiday/add` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-03 | 祝日追加/削除 | `function_spec_html_preview/pf-eccube3/m16-03_admin_data_data_holiday_add_delete.html` | CSRF が無効な削除送信 | `POST /{admin_route}/holiday/{id}/delete` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-03 | 祝日追加/削除 | `function_spec_html_preview/pf-eccube3/m16-03_admin_data_data_holiday_add_delete.html` | 期間内の公的祝日を一括登録する（本書では詳細を扱わない）。 | `POST /{admin_route}/holiday/load` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-04 | MTGマスターデータ編集 | `function_spec_html_preview/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.html` | 側メニュー「データ管理」内「MTGマスターデータ」から開く（ナビでは `GET` のリンク） | `GET /{admin_route}/masterdata` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-04 | MTGマスターデータ編集 | `function_spec_html_preview/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.html` | プルダウンで種別を選び「選択」を押す | `POST /{admin_route}/masterdata` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-04 | MTGマスターデータ編集 | `function_spec_html_preview/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.html` | ブックマークや名前付き URL で一覧を開く | `GET /{admin_route}/masterdata/{entity}/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-04 | MTGマスターデータ編集 | `function_spec_html_preview/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.html` | 一覧表を編集後「登録」 | `POST /{admin_route}/masterdata/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-04 | MTGマスターデータ編集 | `function_spec_html_preview/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.html` | 一覧表示コントローラと同一処理に振り向けられる POST のみのルート。側メニュー「デッキタグ一覧」がこの… | `POST /{admin_route}/masterdata/Plugin-HareruyaEc-Entity-MtbDeckTag/edit` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-05 | 割引率一覧表示 | `function_spec_html_preview/pf-eccube3/m16-05_admin_data_data_sale_discount_list.html` | ナビ「データ管理」→「販売割引率一覧」 | `GET /{admin_route}/discount` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-05 | 割引率一覧表示 | `function_spec_html_preview/pf-eccube3/m16-05_admin_data_data_sale_discount_list.html` | ブラウザで `/{admin_route}/discount` に直接 GET | `GET /{admin_route}/discount` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-06 | 買取価格対応表一覧表示 | `function_spec_html_preview/pf-eccube3/m16-06_admin_data_data_buy_price_list.html` | ナビ「データ管理」→「買取価格対応表」 | `GET /{admin_route}/buy_price_list` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-06 | 買取価格対応表一覧表示 | `function_spec_html_preview/pf-eccube3/m16-06_admin_data_data_buy_price_list.html` | 一覧の金額セル | `GET /{admin_route}/buy_price_list/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-07 | 買取価格対応修正 | `function_spec_html_preview/pf-eccube3/m16-07_admin_data_data_buy_price_list_edit.html` | 一覧の金額セルを押す | `GET /{admin_route}/buy_price_list/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-07 | 買取価格対応修正 | `function_spec_html_preview/pf-eccube3/m16-07_admin_data_data_buy_price_list_edit.html` | 「更新」を押す | `POST /{admin_route}/buy_price_list/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-07 | 買取価格対応修正 | `function_spec_html_preview/pf-eccube3/m16-07_admin_data_data_buy_price_list_edit.html` | 「戻る」を押す | `GET /{admin_route}/buy_price_list` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-08 | 買取減額率一覧表示 | `function_spec_html_preview/pf-eccube3/m16-08_admin_data_data_buy_discount_list.html` | ナビ「データ管理」→「買取減額率一覧」 | `GET /{admin_route}/buy_discount` | ec-cube-enterpriseの抽出ルートに一致なし |
| M16-08 | 買取減額率一覧表示 | `function_spec_html_preview/pf-eccube3/m16-08_admin_data_data_buy_discount_list.html` | ブラウザで `/{admin_route}/buy_discount` に直接 GET | `GET /{admin_route}/buy_discount` | ec-cube-enterpriseの抽出ルートに一致なし |
| A02-01 | ポップアップ用商品情報取得 | `function_spec_html_preview/pf-api/a02-01_api_product_popup_product.html` | 記事内ポップアップ用の商品情報取得 | `GET /popup/product/{lang}/{productId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A02-02 | ポップアップ用カード情報取得 | `function_spec_html_preview/pf-api/a02-02_api_product_popup_card.html` | 記事内ポップアップ用のカード情報取得 | `GET /popup/card/{lang}/{cardId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A05-01 | 注文印刷_印刷情報をプリンタへ送信 | `function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html` | 印刷情報をプリンタへ送信（A05-01） | `GET /order/print/direct` | ec-cube-enterpriseの抽出ルートに一致なし |
| A05-01 | 注文印刷_印刷情報をプリンタへ送信 | `function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html` | 該当受注のステータスを印刷済みに変更（A05-02） | `POST /order/print/direct` | ec-cube-enterpriseの抽出ルートに一致なし |
| A05-02 | 注文印刷_該当受注のステータスを印刷済みに変更 | `function_spec_html_preview/pf-api/a05-02_api_order_print_direct.html` | 印刷情報をプリンタへ送信（A05-01） | `GET /order/print/direct` | ec-cube-enterpriseの抽出ルートに一致なし |
| A05-02 | 注文印刷_該当受注のステータスを印刷済みに変更 | `function_spec_html_preview/pf-api/a05-02_api_order_print_direct.html` | 該当受注のステータスを印刷済みに変更（A05-02） | `POST /order/print/direct` | ec-cube-enterpriseの抽出ルートに一致なし |
| A05-03 | 店頭注文番号取得 | `function_spec_html_preview/pf-eccube3/a05-03_api_order_order_store_call_number.html` | 店頭注文番号リストの取得 | `GET /{_locale}/waiting_api/get_waiting` | ec-cube-enterpriseの抽出ルートに一致なし |
| A05-04 | スマレジ受信処理 | `function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html` | スマレジ取引通知の受信 | `POST /{_locale}/smaregi/transaction` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-01 | 買取アプリ用ログイン | `function_spec_html_preview/pf-api/a06-01_api_store_purchase_admin_login.html` | 買取アプリからのログイン | `POST /admin/login.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-02 | 店頭買取受注一覧取得 | `function_spec_html_preview/pf-api/a06-02_api_store_purchase_otc_buy_order_list.html` | 店頭買取受注一覧の取得 | `GET /admin/otcBuyOrders.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-02 | 店頭買取受注一覧取得 | `function_spec_html_preview/pf-api/a06-02_api_store_purchase_otc_buy_order_list.html` | 同上（拡張子なし別名） | `GET /admin/otcBuyOrders` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-03 | 店頭買取受注詳細更新 | `function_spec_html_preview/pf-api/a06-03_api_store_purchase_otc_buy_order_update.html` | 店頭買取受注の詳細更新 | `PUT /admin/otcBuyOrder/{id}.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-04 | 店頭買取受注コメント更新 | `function_spec_html_preview/pf-api/a06-04_api_store_purchase_otc_buy_order_free_comment.html` | 店頭買取受注のコメント更新 | `PUT /admin/otcBuyOrder/{id}/freeComment` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-04 | 店頭買取受注コメント更新 | `function_spec_html_preview/pf-api/a06-04_api_store_purchase_otc_buy_order_free_comment.html` | 同上（拡張子あり別名） | `PUT /admin/otcBuyOrder/{id}/freeComment.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-05 | 店頭買取受注ステータス更新 | `function_spec_html_preview/pf-api/a06-05_api_store_purchase_otc_buy_order_status.html` | 店頭買取受注のステータス更新 | `PUT /admin/otcBuyOrder/{id}/status.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-05 | 店頭買取受注ステータス更新 | `function_spec_html_preview/pf-api/a06-05_api_store_purchase_otc_buy_order_status.html` | 同上（拡張子なし別名） | `PUT /admin/otcBuyOrder/{id}/status` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-06 | カード詳細IDから買取用商品情報を取得 | `function_spec_html_preview/pf-api/a06-06_api_buying_products_by_detail.html` | カード詳細IDから買取用商品情報取得 | `GET /buying/{detailId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-07 | 商品IDリストから買取用商品情報を取得 | `function_spec_html_preview/pf-api/a06-07_api_buying_products_by_ids.html` | 商品IDリストから買取用商品情報取得 | `POST /buying/products` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-10 | 商品IDリストから買取用商品情報を取得する | `function_spec_html_preview/pf-api/a06-10_api_buying_products_by_ids.html` | 商品IDリストから買取用商品情報取得 | `POST /buying/products` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-13 | 本人確認更新 | `function_spec_html_preview/pf-api/a06-13_api_store_purchase_otc_buy_order_identification.html` | 店頭買取受注の本人確認更新 | `PUT /admin/otcBuyOrder/{id}/identification` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-13 | 本人確認更新 | `function_spec_html_preview/pf-api/a06-13_api_store_purchase_otc_buy_order_identification.html` | 同上（拡張子あり別名） | `PUT /admin/otcBuyOrder/{id}/identification.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-17 | 買取用商品情報取得 | `function_spec_html_preview/pf-api/a06-17_api_buying_products_by_detail.html` | カード詳細IDから買取用商品情報取得 | `GET /buying/{detailId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A06-18 | 買取用商品情報一括取得 | `function_spec_html_preview/pf-api/a06-18_api_buying_products_by_ids.html` | 商品IDリストから買取用商品情報取得 | `POST /buying/products` | ec-cube-enterpriseの抽出ルートに一致なし |
| A07-01 | まとめて買取商品IDの取得 | `function_spec_html_preview/pf-api/a07-01_api_online_purchase_bulk_purchase_id.html` | まとめ買取商品IDの取得 | `GET /admin/optionBulkPurchaseId.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A07-02 | ネット買取受注一覧取得 | `function_spec_html_preview/pf-api/a07-02_api_online_purchase_buy_order_list.html` | ネット買取受注一覧の取得 | `GET /admin/buyOrders.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A07-03 | ネット買取受注コメント更新 | `function_spec_html_preview/pf-api/a07-03_api_online_purchase_buy_order_free_comment.html` | ネット買取受注のコメント更新 | `PUT /admin/buyOrder/{id}/freeComment.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A07-04 | ネット買取受注ステータス更新 | `function_spec_html_preview/pf-api/a07-04_api_online_purchase_buy_order_status.html` | ネット買取受注のステータス更新 | `PUT /admin/buyOrder/{id}/status.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A07-05 | ネット買取注文の査定終了処理 | `function_spec_html_preview/pf-api/a07-05_api_online_purchase_buy_order_end.html` | ネット買取注文の査定終了処理 | `PUT /admin/buyOrder/{id}.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A07-06 | 複数ネット買取IDからネット買取受注の商品一覧を取得 | `function_spec_html_preview/pf-api/a07-06_api_online_purchase_buy_main_card.html` | 複数ネット買取IDから買取代表カード一覧取得 | `POST /admin/buyMainCard.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A07-07 | 複数ネット買取IDから個別入力商品の一覧を取得 | `function_spec_html_preview/pf-api/a07-07_api_online_purchase_buy_order_indivisual_input_product.html` | 複数ネット買取IDから個別入力商品一覧取得 | `POST /admin/buyOrderIndivisualInputProduct.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| A14-01 | カードIDからカード情報を取得 | `function_spec_html_preview/pf-api/a14-01_api_card_card_get.html` | カードIDからカード情報を取得 | `GET /cards/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A14-02 | カード詳細IDからカード詳細情報を取得 | `function_spec_html_preview/pf-api/a14-02_api_card_card_detail_get.html` | カード詳細IDからカード詳細情報を取得 | `GET /cardDetails/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A15-05 | ユーザー情報変更 | `function_spec_html_preview/pf-api/a15-05_api_deck_builder_deck_user_update.html` | 自分のユーザー情報変更 | `PUT /user` | ec-cube-enterpriseの抽出ルートに一致なし |
| A15-06 | マスタ検索 | `function_spec_html_preview/pf-api/a15-06_api_deck_builder_deck_master.html` | マスタ検索 | `GET /master/{name}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A15-07 | アーキタイプ検索 | `function_spec_html_preview/pf-api/a15-07_api_deck_builder_deck_archetype_search.html` | アーキタイプ検索 | `GET /archetypes/{formatId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A15-10 | デッキ情報登更新 | `function_spec_html_preview/pf-api/a15-10_api_deck_builder_deck_update.html` | デッキ情報の更新 | `PUT /deck/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A15-11 | デッキ情報削除 | `function_spec_html_preview/pf-api/a15-11_api_deck_builder_deck_delete.html` | デッキ情報の削除 | `DELETE /deck/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A15-12 | デッキ情報参照 | `function_spec_html_preview/pf-api/a15-12_api_deck_builder_deck_get.html` | デッキ情報の参照 | `GET /deck/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A15-15 | 採用枚数情報参照 | `function_spec_html_preview/pf-api/a15-15_api_deck_builder_deck_usage_card.html` | 採用枚数情報参照 | `GET /deck/usage_card/{formatId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A15-17 | デッキ登録インポート | `function_spec_html_preview/pf-api/a15-17_api_deck_builder_deck_import_register.html` | デッキ登録インポート | `POST /deck/import` | ec-cube-enterpriseの抽出ルートに一致なし |
| A15-18 | デッキ更新インポート | `function_spec_html_preview/pf-api/a15-18_api_deck_builder_deck_import_update.html` | デッキ更新インポート | `PUT /deck/import/{id}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A17-04 | [任意門]商品IDに紐づく商品詳細の情報を取得 | `function_spec_html_preview/pf-api/a17-04_api_other_product_detail.html` | 商品IDによる商品詳細の取得 | `GET /product/detail/{productId}` | ec-cube-enterpriseの抽出ルートに一致なし |
| A17-04 | [任意門]商品IDに紐づく商品詳細の情報を取得 | `function_spec_html_preview/pf-api/a17-04_api_other_product_detail.html` | 同上（拡張子あり別名） | `GET /product/detail/{productId}.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-01 | 店頭買取 | `function_spec_html_preview/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.html` | MTGバイヤーでログインする | `POST /admin/login.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-01 | 店頭買取 | `function_spec_html_preview/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.html` | MTGバイヤーで査定対象を取得する | `GET /admin/otcBuyOrders.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-01 | 店頭買取 | `function_spec_html_preview/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.html` | MTGバイヤーで査定対象を取得する | `GET /admin/otcBuyOrders` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-01 | 店頭買取 | `function_spec_html_preview/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.html` | MTGバイヤーで査定結果を確定する | `PUT /admin/otcBuyOrder/{id}.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-01 | 店頭買取 | `function_spec_html_preview/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.html` | MTGバイヤーでステータスを更新する | `PUT /admin/otcBuyOrder/{id}/status.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-01 | 店頭買取 | `function_spec_html_preview/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.html` | MTGバイヤーでフリーコメントを更新する | `PUT /admin/otcBuyOrder/{id}/free_comment.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-01 | 店頭買取 | `function_spec_html_preview/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.html` | MTGバイヤーでフリーコメントを更新する | `PUT /admin/otcBuyOrder/{id}/free_comment` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-01 | 店頭買取 | `function_spec_html_preview/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.html` | MTGバイヤーで本人確認状態を更新する | `PUT /admin/otcBuyOrder/{id}/identification.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-02 | ネット買取 | `function_spec_html_preview/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.html` | MTGバイヤーでログインする | `POST /admin/login.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-02 | ネット買取 | `function_spec_html_preview/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.html` | 査定対象のネット買取受注を取得する | `GET /admin/buyOrders.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-02 | ネット買取 | `function_spec_html_preview/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.html` | 査定結果を確定する | `PUT /admin/buyOrder/{id}.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-02 | ネット買取 | `function_spec_html_preview/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.html` | ステータスを更新する | `PUT /admin/buyOrder/{id}/status.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-02 | ネット買取 | `function_spec_html_preview/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.html` | フリーコメントを更新する | `PUT /admin/buyOrder/{id}/freeComment.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-02 | ネット買取 | `function_spec_html_preview/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.html` | 個別入力商品を登録する | `POST /admin/buyOrderIndivisualInputProduct.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-02 | ネット買取 | `function_spec_html_preview/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.html` | メインカードを登録する | `POST /admin/buyMainCard.json` | ec-cube-enterpriseの抽出ルートに一致なし |
| O01-03 | 入庫モード | `function_spec_html_preview/pf-eccube3/o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.html` | MTGバイヤー入庫モードでステータスを進める | `PUT /admin/buyOrder/{id}/status.json` | ec-cube-enterpriseの抽出ルートに一致なし |

## 集計

- A02-01: 1件
- A02-02: 1件
- A05-01: 2件
- A05-02: 2件
- A05-03: 1件
- A05-04: 1件
- A06-01: 1件
- A06-02: 2件
- A06-03: 1件
- A06-04: 2件
- A06-05: 2件
- A06-06: 1件
- A06-07: 1件
- A06-10: 1件
- A06-13: 2件
- A06-17: 1件
- A06-18: 1件
- A07-01: 1件
- A07-02: 1件
- A07-03: 1件
- A07-04: 1件
- A07-05: 1件
- A07-06: 1件
- A07-07: 1件
- A14-01: 1件
- A14-02: 1件
- A15-05: 1件
- A15-06: 1件
- A15-07: 1件
- A15-10: 1件
- A15-11: 1件
- A15-12: 1件
- A15-15: 1件
- A15-17: 1件
- A15-18: 1件
- A17-04: 2件
- F01-02: 3件
- F02-03: 2件
- F02-04: 2件
- F02-05: 1件
- F03-01: 1件
- F03-02: 1件
- F03-06: 1件
- F03-07: 1件
- F03-08: 4件
- F04-01: 9件
- F04-02: 3件
- F04-03: 6件
- F05-02: 1件
- F05-04: 1件
- F05-05: 2件
- F06-02: 1件
- F06-03: 1件
- F06-04: 1件
- F06-05: 1件
- F06-06: 3件
- F06-07: 3件
- F06-09: 3件
- F06-11: 1件
- F06-12: 3件
- F06-14: 3件
- F06-20: 2件
- F06-25: 3件
- F07-01: 1件
- F07-02: 1件
- F07-03: 1件
- F07-04: 3件
- F08-02: 2件
- M03-02: 3件
- M03-06: 1件
- M03-09: 6件
- M03-13: 1件
- M03-14: 1件
- M03-16: 1件
- M03-17: 1件
- M03-18: 1件
- M03-21: 1件
- M03-31: 3件
- M03-34: 4件
- M03-36: 3件
- M04-03: 3件
- M04-11: 1件
- M04-17: 5件
- M04-18: 1件
- M04-19: 4件
- M04-21: 3件
- M04-31: 5件
- M05-03: 1件
- M05-19: 4件
- M05-22: 2件
- M05-26: 1件
- M06-01: 3件
- M06-02: 2件
- M06-03: 2件
- M06-04: 1件
- M06-05: 5件
- M06-06: 3件
- M06-07: 2件
- M08-01: 1件
- M08-02: 2件
- M08-05: 1件
- M08-06: 1件
- M08-07: 1件
- M08-09: 3件
- M08-12: 4件
- M08-14: 1件
- M09-10: 3件
- M10-03: 2件
- M10-04: 3件
- M10-06: 1件
- M10-07: 4件
- M10-08: 4件
- M11-02: 1件
- M12-01: 2件
- M12-03: 2件
- M12-05: 2件
- M12-06: 1件
- M12-07: 2件
- M12-08: 1件
- M12-09: 3件
- M12-10: 3件
- M13-01: 3件
- M13-02: 3件
- M13-03: 1件
- M13-04: 2件
- M13-05: 1件
- M13-06: 7件
- M13-07: 1件
- M13-08: 1件
- M13-09: 3件
- M13-10: 4件
- M13-11: 3件
- M13-12: 4件
- M13-13: 3件
- M13-14: 5件
- M13-15: 6件
- M14-01: 1件
- M14-02: 1件
- M14-03: 2件
- M14-04: 3件
- M14-05: 2件
- M14-06: 3件
- M14-07: 1件
- M14-08: 5件
- M14-09: 1件
- M15-01: 1件
- M15-02: 2件
- M15-03: 2件
- M15-05: 4件
- M15-06: 2件
- M15-07: 4件
- M15-09: 6件
- M15-10: 3件
- M15-11: 2件
- M16-01: 5件
- M16-02: 5件
- M16-03: 6件
- M16-04: 5件
- M16-05: 2件
- M16-06: 2件
- M16-07: 3件
- M16-08: 2件
- O01-01: 8件
- O01-02: 7件
- O01-03: 1件
