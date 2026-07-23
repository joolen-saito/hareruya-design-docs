# ネット買取管理 — 買取検索一覧

## 概要

ブラウザ向けの管理画面「ネット買取管理」において、`dtb_buy_order` を検索フォームで絞り込み、`dtb_buy_main_card` と顧客周辺データを一覧表示する機能である。翻訳上のタイトルは「ネット買取管理」、一覧は「買取一覧」。テンプレート注釈にあるとおり、表示はプラグイン HareruyaEc 由来であり、現在はコア側の Twig・コントローラへ移載されている実装が確認値である。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。ec-cube-enterprise の管理画面ソースを確認値とする。

本機能のカスタマイズ区分はカスタマイズである。現行挙動は現行リポ（pf-eccube3 の HareruyaEc プラグイン）を出自とし、リニューアル後は ec-cube-enterprise のコア実装へ移載される。挙動の確認値は ec-cube-enterprise のコア実装とし、DB関連の記述（テーブル名・列名・保存先・整合）は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|-------------------|---------------------|
| ナビから「ネット買取管理」→「買取一覧」 | `GET /{admin_route}/purchase/list` | 検索条件は空または既定の日付のみ。結果テーブルは出さず、「検索」押下まで一覧は表示しない設計となる。 |
| 「検索」ボタン | `POST /{admin_route}/purchase/search`（同一フォームのアクション、`page_no=1`） | POST 済み検索データで一覧を構成し、総件数とページングリンクを生成する。 |
| 一覧のページ送り | `GET /{admin_route}/purchase/page/{page_no}`（クエリに `sort`・`order`・`page_count` を付与しうる） | 直前の検索条件をセッションから復元し、指定ページを表示する。 |
| 表示件数プルダウン | `GET /{admin_route}/purchase/page/1?page_count=…` | マスタ `mtb_page_max` に存在する件数ならセッションへ保存し、1 ページ目から再表示する。 |
| 並び順ドロップダウン | `GET /{admin_route}/purchase/page/1?sort=…&order=ASC|DESC` | ソート条件をセッションへ保存し、1 ページ目から再表示する。 |
| 注文者名リンク（氏名） | `POST /{admin_route}/purchase/search`（クライアントが買取状況を空にし、氏名を埋めて自動送信） | 氏名の部分一致検索で再検索する。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | 検索結果ブロックとダウンロード用フォーム・ページ情報は `pagination.totalItemCount > 0` のときのみ描画する。総件数 0 のときカードに「検索条件に該当するデータがありませんでした。」を示す。列は買取番号リンク、買取依頼日時、`dtb_buy_main_card` に基づく商品名と枚数一覧、申込時買取金額合計、`packageCount` と閾値に応じた強調、`dtb_buy_main_card.sale_flg` および個別入力行の売却フラグに基づくキャンセル含有の警告、ステータス名、`dtb_player` と本人確認マスタ経由のアイコン／ラベル、利用回数、行メニュー（編集・削除リンク等）。 |
| JS 挙動 | `purchase.js`。ヘッダ全選択チェックは同一フォーム内の `buyOrderId` を持つチェックのみ同期する。ダウンロード系送信はチェック無し時 `alert` で中断する対象がある。PDF 送信は AJAX で JSON を受け取り新規ウィンドウへ HTML を書き込む。ポップアップ無効時は `alert`。氏名リンクは買取状況選択を解除し、`name_multi` に表示テキストを代入して検索フォームを `submit`。 |
| 「検索条件をクリア」 | ラベルは全条件クリアの意味だが、現行実装では `sale_flg` 相当のチェックリストではなく、`#admin_purchase_list_buy_order_status` のみ select2 で空にする。他フィールドや日付はクライアント側では消さない。 |
| CSS・レイアウト | `#result_list__custom_csv_menu` と `#result_list_main__sort_menu` の Bootstrap ドロップダウンが `display:none` と干渉するため、`.show` 時に強制ブロックへ上書きするインライン `style`。 |
| クライアント共通 | `select2`、`sort-method-display.js` で二段ドロップダウン。「ソートキー」をクリックしてから昇順／降順のサブメニューを出す操作が必要となる。ページ件数変更は別プルダウンでそのまま別 URL に遷移させる。 |
| 一覧の CSRF | 検索フォームは項目型で CSRF を無効化している。一覧下部のCSV系フォーム単体でのトークンの有無や別機能のチェック要件は別範囲とする（利用者視点では送信は同一画面内別 `formaction` へ向くだけと捉える）。 |

---

## 処理フロー

### 一覧の初期 GET（ルート `admin_purchase_list`）

1. 管理画面共通の認証（管理画面 firewall）を通過する管理者がページを開く。
2. 空または既定値のみの検索フォームを生成して返す。ページネーション引数や検索済み一覧は載せない。

### POST 検索（ルート `admin_purchase_search`）

1. セッションキー基底を文字列 `purchase` にする（以下 `eccube.admin.purchase.*` と略記）。
2. フォーム名 `admin_purchase_list`、`PurchaseListType` で `handleRequest`。CSRF は無効のため送信欠落で拒否しない。
3. GET クエリまたはルート既定から `page_no` を読み、`SearchControllerTrait::search` へ渡す既定は 1。
4. `sort` はリクエスト・セッション `eccube.admin.purchase.sort`・規定値 `default` の優先順。`order` は `ASC`|`DESC`（大小混在許容）のみ受理。正規表現不一致のときはフラッシュ鍵 `admin.error.sort` を積み、一覧を出さず `admin_purchase_list` の画面構成へ落とす。
5. 表示件数はセッション `eccube.admin.purchase.search.page_count` または設定 `eccube_default_page_count` を起点とし、`mtb_page_max` に存在しない値へは退避しない。クエリに `page_count` が載り妥当なときセッションを上書きする。
6. フォームの `getData()` が `null` のときのみ、セッション `eccube.admin.purchase.search` のビューデータを復元注入する。その結果も復元できなければ初期 GET と同等の一覧無し状態を返す。
7. `DtbBuyOrderRepository::getQueryBuilderBySearchData` で問い合わせを構成し、`KnpPaginator` でページング（Knp のソート用パラメータ名は明示的に無効化）。
8. 総件数と現在ページ、`page_no`・件数によって最終ページが空になる削除直後などを補正し、必要なら 1 ページ戻したうえで再ページングする。
9. `eccube.admin.purchase.search.page_no`・検索ビューデータ・`sort`・`order`・`page_count` をセッションへ書き込む。
10. ページ項目を `PurchaseSearchAction::handle` に渡し、`additionalDataList`・`buyOrderIdsWithCancel`・`bulkPurchaseSortedBuyMainCardsByOrder`・オプション由来の bulk 対象商品 ID をテンプレートへ載せて返す。

### GET でのページ繰り（ルート `admin_purchase_page`）

1. 手順は POST 検索と同じ処理メソッドに入る。フォーム送信が無く `getData()` が `null` になるためセッションから検索条件を復元する。
2. セッションに一度も検索が無い状態で単独 GET すると、手順 6 で初期状態へフォールバックしうる。

### 並び順の受理範囲

1. `default` で主キー `b.id`。`orderDate` で `b.orderDate` が対象となる。未定義キー指定時は `Order By` 句を増やさない。

---

## 集計条件

| 指標 | 集計の要点 |
|------|-------------|
| 一覧の総件数とページ構成 | `DtbBuyOrder` を基底エイリアス `b`。条件は以下の論理積により絞った行を KnpPaginator が数える（クエリ側で `DISTINCT` を強制しない。結合により同一注文が二重に数えられうる状況は実装確認値であり、JOINの重複結果を許容しない要件は本書で固定しない）。 |
| キャンセル含有表示 | POST 済み一覧の対象 ID について、`dtb_buy_main_card.sale_flg` が非売却、または個別入力 `dtb_buy_order_indivisual_input_product.sale_flg` が非売却が一つでもあればヒット一覧に含める。 |
| `additionalDataList` の利用回数／本人確認ラベル | `dtb_buy_order` を顧客でまとめた件数と `dtb_player` 経由の本人確認マスタ日本語名を返す集約問い合わせの配列を、顧客 ID をキーにした連想配列へ畳む。同一顧客で複数行が返る場合は PHP の `array_column` により後勝ちとなる点は実装確認値とする。 |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|---|---|---|----------|---|----------|
| M07-01-MSG-001 | 管理画面上部 | 削除しました | Deleted | 買取情報の削除が完了したとき | 削除し、買取検索一覧画面に遷移する |
| M07-01-MSG-002 | 確認モーダル | 買取番号%id% を削除してもよろしいですか？ | 買取番号%id% を削除してもよろしいですか？ | 買取一覧で削除を選択したとき（削除前の確認） | OKで削除し、買取検索一覧画面に遷移する／キャンセルで現在の画面に留まる |

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| 買取状況（複数選択） | 指定した各 `mtb_buy_order_status` が現在の `dtb_buy_order.BuyOrderStatus` に該当する行だけ残す（OR による包含）。 |
| 進捗日付レンジ | `MtbBuyOrderStatus::BUY_ORDER_STATUS` の各識別子に応じ、`{識別子}_date_from`・`_date_to` が存在するときのみ履歴テーブルを結合。下限は同日 00:00:00 以上、上限は終了日の翌日 00:00:00 未満として解釈する。両方未指定の状態はクエリ側でスキップする。フォーム側は並び順用の許可リストに沿った状態についてのみ入力欄を生成するため、画面上はその集合の期間のみ操作対象となる。 |
| 買取番号 | 入力が空でなく `StringUtil::isNotBlank` 真のとき、文字列から整数への PHP 規則に従い `b.id` へ等号一致させる（数値へ解釈できない文字のみのときは整数 0 とみなされる実装である）。 |
| 注文者名 | Unicode 空白と半角コンマ空白で分割し、各区切りトークンごとに `lastName`・`firstName`・`lastNameKana`・`firstNameKana` のいずれかへ部分一致（`%`／`_` をエスケープ）を OR で束ね、その束をトークン数分 AND で繋ぐ。 |
| 商品名フィールド複数個 | 「AND 検索」選択時は、入力のあるフィールドごとに `BuyMainCards` と `Product` を結び、同名または英語名の LIKE を OR で束ね、フィールドごとの束をすべて AND で繋ぐ。「OR 検索」選択時は、入力のある各フィールドの LIKE 条件ひとつずつが全体 OR の枝となる。複数フィールド入力で両方とも文字が入っていると、AND／OR で結合規則が反転する。 |
| 本人確認（複数選択） | 状態を未選択または全解除のままであるとき結合しない。状態を複数選択したときは選択 ID のどれかに合致する`dtb_player`行を、`dtb_buy_order.Customer` と同一会員について内部結合するため、選択された状態への該当行が無い会員の注文は一覧に出ない（未検索側はすべての買取注文が対象となる）。 |
| 利用回数範囲 | サブクエリで顧客ごとの `dtb_buy_order` の件数を算出し、その件数について下限・上限がある場合のみ `having` と主クエリへの `customer id IN (...)` で制約する。空欄側は適用しない。属性 `min=1` のみでありサーバ側の整数上限は別設定にない。 |
| 棚戻し未完了のみ | フラグがオンなら `dtb_buy_order.restocked_flg` が偽のみ。 |
| 申込時買取金額合計 | 各選んで買取カードごと、`ApplicationPrices` が 1 件なら単価に枚数、複数ならカード状態 ID が NM と一致する申込単価に枚数、該当が無ければ加算しない。 |
| `bulkPurchaseSortedBuyMainCardsByOrder` | 選んで買取カテゴリの `dtb_buy_main_card` に限り並べ、`mtb_option` が数値のみのときその商品 ID の行を優先、その後単価降順、`CardCondition.id` の昇順で安定化する（価格が null のとき 0 とみなされる）。個別入力行は一覧のこの列には出さない。 |
| `packageCount` の警告 | 設定値 `eccube_buy_order_package_count_warning`（既定 3）以上なら画面上で警告色および太字になる。値が null は空セルとして描画される。 |

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 買取状況 | 任意 | Choice の多重選択のみ（文字列長の単独上限ではない）。 | `mtb_buy_order_status` の rank 昇順リストから未選択相当。複数検索結果はクエリ側で現在状態の IN で解釈。 | フォーム識別子 `buy_order_status`。クエリ復元値は Symfony の収集済みオブジェクトまたは配列。 |
| 買取番号 | 任意 | 255（設定 `eccube_stext_len` の値）。 | 無記入。 | フォーム識別子 `purchase_number`。`Length` で超過するとフォーム検証エラー表示。クエリ側はブランク時スキップ。 |
| 注文者名 | 任意 | フォーム上の桁上限は未定義だが入力欄クラスで検索入力系。ブランク不可文字の仕様ではない。 | 無記入。 | `name_multi`。分割後トークンの部分一致論理については上記。 |
| 利用回数（下限／上限） | 任意 | 整数ウィジェット。HTML 属性のみ `min=1`。サーバ側の桁上限は未定義実装が確認値。 | 無記入。 | `orderCountFrom`・`orderCountTo`。空のとき範囲条件を適用しない。単独指定可。 |
| 商品名１〜３ | 任意 | Symfony `TextType` の既定サイズのみ。環境での HTML `maxlength` の付与は実装側に準拠。 | 無記入。 | `product_name1`〜`3`。AND/OR ルールは前述。 |
| AND／OR検索 | 任意 | ラジオ 2択のみ。 | 最初の選択肢（AND検索側）になる Choice 定義。 | `product_name_select`。保存値が OR 論理側のとき `1` と解釈し OR クエリとなる。整数比較。 |
| 本人確認 | 任意 | 選択肢ごとマスタ値。 | 全てオフ状態（`expanded` かつ `multiple`）。無選択で条件なし。 | `identityConfirmStatus`。ID 一覧で `dtb_player` へ INNER JOIN。 |
| ステータス別期間入力群 | 任意 | HTML5 の日付ウィジェット。形式 `yyyy-MM-dd`。単一テキスト入力。識別子は `{request,arrival,assessing,...,stocking_complete,cancellation}_date_from` と `_date_to` の並び順で生成（実装リストに含まれる進捗についてのみ）。 | `request_date_from` のみ `new DateTime()` を `eccube_default_from_term`（既定 `-3 month`）で_modify した値。他は未入力。 | 履歴側 `dtb_buy_order_status_histry.create_date` の範囲。両端未入力の状態はクエリ側で無視される。フォーム側に載らない状態の進捗日付フィールドもリポジトリは一般的に受けられるが、この画面経路では通常生成されない空キーとなる。 |
| 棚戻し未完了のみ表示 | 任意 | boolean。 | オフ（偽）。 | `restock_incomplete_only`。オンで `dtb_buy_order.restocked_flg` が偽の行のみ。 |

### エッジケース

| ケース | 扱い |
|--------|------|
| ソートクエリ不正 | フラッシュ `admin.error.sort` を積む。一覧は初期 GET 相当になり、一覧カード無し状態を返す。 |
| POST 復元結果が一覧 0件 | メッセージカードのみ。ダウンロード UI は無し。 |
| 一覧表示中に総件数とページサイズ関係から現在ページが空 | 自動でページ番号を 1減じて再フェッチする。セッション上の現在ページも更新される。 |
| 氏名自動検索 | 買取状況の select2 が空送信されるのみで、入力済み日付フィールドなどは送信時点の値が残ったまま再検索に使われる実装となる。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧の買取状況名 | DB 読み込み済みオブジェクトからの表示であり、リスト取得時と描画間に別処理で状態が進むと差が生じうる同一セッション内の再フェッチ問題は通常運用では管理者操作が無い限り小さい。 |
| 本人確認表示 | 集約問い合わせの後勝ちと顧客・Player 関係の前提に依存する。詳細画面の同一顧客表示と常に一致する保証は本書で述べない。 |
| 申込金額合計 | 申込価格と枚数の積の合算であり、査定後の確定価格や在庫反映後の金額ではない。 |

---

## API/バッチ結果

本機能では管理画面の HTTP 画面描画のみを扱い、外部 API 呼び出しやバッチ起動は行わない（ダウンロード系は別ルート）。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | GET 初期は無、POST 検索はマルチパート／urlencoded の `admin_purchase_list[...]`。ページ GET はクエリ `page_no`・`page_count`・`sort`・`order`。 |
| 成功時出力 | HTML（`@admin/Purchase/index.twig`）。セッション更新。 |
| 失敗時出力 | ソート不正時はフラッシュと初期画面。バリデーションエラーはテンプレートの `form_errors` に従い該当項目下へ。 |
| 副作用 | セッションキー `eccube.admin.purchase.search`・`search.page_no`・`search.page_count`・`sort`・`order` の更新。 |

---

## DBカラム

当機能の検索条件・結合に直接現れる主な列（型の細部はスキーマを参照）。

| テーブル | 列 | メモ |
|----------|-----|------|
| `dtb_buy_order` | `id`・`order_date`・`last_name`・`first_name`・`last_name_kana`・`first_name_kana`・`package_count`・`restocked_flg`・顧客外部キー・ステータス外部キー | 一覧の主キーと氏名表示、ソート、棚戻し条件。 |
| `dtb_buy_order_status_histry` | `buy_order_id`・`buy_order_status_id`・`create_date` | 進捗日付レンジ。 |
| `dtb_buy_main_card` | `buy_order_id`・`product_id`・`count`・`sale_flg`（など） | 商品名検索結合、キャンセル判定、詳細列。 |
| `dtb_product` | `name`・`name_en` | 商品名 LIKE。 |
| `dtb_player` | `customer_id`・`identity_confirm_status_id` | 本人確認絞り込み。 |
| `mtb_buy_order_status` | `id`・`name`・`rank` | 状態表示とフィルタ。 |
| `mtb_identity_confirm_status` | `id`・`name_jp` | 本人確認の日本語表示。 |
| `mtb_page_max` | `name` | 表示件数の許可集合。 |
| `mtb_option` | `option_key`・`option_value` | まとめ買取商品 ID。 |

### DB操作

本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 検索 | dtb_buy_main_card / dtb_buy_order / dtb_buy_order_status_histry / dtb_player / dtb_product / mtb_buy_order_status 等 | 検索条件に合致するレコードを抽出する。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| 買取番号 | `Length` 最大 `eccube_stext_len`。 |
| 利用回数 | HTML `min=1` のヒントのみ。Symfony の下限・桁制約追加は実装しない。 |

---

## 権限・認可

| 利用者状態 | 本画面および検索一覧 |
|------------|-----------------------|
| 未ログイン | 管理ログインへ誘導（管理 firewall）。 |
| 管理メンバー（ログイン済） | アノテーション等の機能別細目はソース上、このコントローラでは追加の機能別明示が無い構成が確認値。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 買取番号または編集リンク | `GET …/purchase/{id}/edit`。 |
| ページャの各種リンク | `admin_purchase_page` に現在のクエリ（`sort`/`order`/可能なら `page_count`）を付与。 |
| 削除・更新後のリスト復帰等（別機能） | セッションの `eccube.admin.purchase.search.page_no` を読み現在ページへ redirect する共通ヘルパーが存在する。 |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|---------------|---------------------|
| POST またはページ GET が成功したあと別画面から戻る | セッションに検索ビューデータとページ番号が残る | `admin_purchase_page` の GET で同一条件の続きを表示しうる |
| 初期 `admin_purchase_list` | セッションを書き換えない（本コントローラの index 実装範囲） | 以前の検索セッションが残っていても画面は空のフォームに見えるが、条件はセッションに残存しうる点に注意 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 並び順パラメータが `ASC`/`DESC` 以外 | フラッシュ `admin.error.sort`、初期一覧相当のテンプレートを返す。 |
| バリデーションエラー | 該当フィールド近傍にエラー表示。一覧は `pagination` の有無に依存（エラー時も trait は概ね検索経路を通るが、データ不整合時の分岐は Symfony のフォーム実装に従う）。 |

---

## 試行制限

本機能では試行制限を扱わない（管理ログインのスロットリングは全体設定）。

---

## ログ・監査

一覧の検索・ページ表示そのものに専用の業務監査ログは設けない実装が確認値。ダウンロード系は別ルートで情報ログを残す場合がある。

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークン
- Cookie 値
- セッション ID の完全値
- Remember Me トークンの原値

---

## セッション

### 本機能におけるセッション

| 観点 | 内容 |
|------|------|
| キー接頭辞 | `eccube.admin.purchase.*`（実装の `SearchControllerTrait` が `purchase` を渡す）。 |
| 保持するもの | 検索条件のシリアライズ済みビューデータ、現在ページ、表示件数、ソートキー、昇降順。 |
| 更新タイミング | `admin_purchase_search` と `admin_purchase_page` の処理が通過するたび。 |

### セッションへ保存しない情報

パスワードやトークン原値を検索条件に載せる設計ではない。画面は氏名・番号・日付・選択肢に限る。

---

## Cookie

本機能は管理画面のセッション Cookie に依存するのみとし、独自 Cookie を追加しない。

---

## リニューアル移行時の扱い

現行は pf-eccube3 の HareruyaEc プラグインが買取検索・一覧のロジックと買取関連テーブルを保持し、リニューアル後は ec-cube-enterprise のコアへ移載される。DB関連の記述は ec-cube-enterprise を正とする。

- 表示件数マスタは、現行 pf-eccube3 が `mtb_pagemax`、移行先 ec-cube-enterprise が `mtb_page_max` である。本書の本文・DBカラム節は移行先名で記す。
- 買取状況の並び順キーは、移行先 ec-cube-enterprise の買取状況マスタ `mtb_buy_order_status` では `rank` 列を用いる（汎用マスタの `sort_no` ではない）。
- 買取注文ステータス履歴テーブルは ec-cube-enterprise 実装では `dtb_buy_order_status_histry`（綴りは実装どおり）である。本書はこの名称で記す。
- 個別入力商品テーブルは ec-cube-enterprise 実装では単数形 `dtb_buy_order_indivisual_input_product` である。
- 上記以外の買取関連テーブル・列について、現行プラグインと移行先コアの個別の差異は本書では網羅照合していない。差異が疑われる箇所は ec-cube-enterprise 実装を確認値とする。

---

## 排他制御・トランザクション

一覧は参照中心であり、当画面の閲覧・検索単体で楽観／悲観ロックを掛けない。更新系は別ルートのトランザクションに従う。

---

## 調査補助（grep 向け）

ルート定義とテンプレート本文は `src/Eccube/Controller/Admin/Purchase/PurchaseController.php`、`src/Eccube/Resource/template/admin/Purchase/index.twig`。検索条件の組み立ては `src/Eccube/Repository/DtbBuyOrderRepository.php` の `getQueryBuilderBySearchData`。セッション保存は `src/Eccube/Controller/Admin/SearchControllerTrait.php`。付帯データは `src/Eccube/Service/Admin/Purchase/PurchaseSearchAction.php`。クライアントは `html/template/admin/assets/js/Purchase/purchase.js`（ビルドパスは `assets/js/Purchase/purchase.js` の `admin` パッケージ）。

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_purchase_list` … `GET` … `/{admin_route}/purchase/list`（検索フォームのみ初期表示する。一覧・ページネーション・並び順・セッションに保持した検索条件は復元しない。）
- `admin_purchase_search` … `POST` … `/{admin_route}/purchase/search`（クエリまたはボディ経由の `page_no`（検索開始時は既定 1）を含め、フォームの検索データで一覧を構成する。成功時は一覧とセッション更新を同一テンプレートで描画する。）
- `admin_purchase_page` … `GET` … `/{admin_route}/purchase/page/{page_no}`（セッションに保存された検索条件・並び順・表示件数を読み込み、`{page_no}` ページを表示する。ページャや表示件数プルダウンの遷移先として使われる。）
