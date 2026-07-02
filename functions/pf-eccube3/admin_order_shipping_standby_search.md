# admin_order_shipping_standby_search（管理画面_受注管理_出荷指示リスト検索）

## 概要

管理画面「受注管理」配下でナビ項目「出荷指示」として開ける画面であり、`dtb_shipping_standby`（出荷指示リスト）を複数条件で絞り込み、一覧とページネーションとして表示する検索機能である。同じ画面カード上部にはリスト生成フォームがあり、一覧の検索と同一画面に並んでいる。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。ec-cube-enterprise の Symfony 管理画面ソースを確認値とする。

対象はブラウザ経由の管理画面に限定する。リスト生成の POST・編集・削除・印刷は別処理として境界を切る。

コントローラのメソッド名は本文の主説明としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| ナビから「出荷指示」を開く | `GET /{eccube_admin_route}/standby/search` | 「生成」ブロックと「出荷指示リスト検索」ブロックのみ表示される。一覧表用のページネーションオブジェクトは渡らず結果ブロックは描画されない。 |
| 検索項目を入力し「検索する」を押す | `POST /{eccube_admin_route}/standby/search` | 入力がフォーム処理に載り、`eccube.admin.shipping_standby.*` に検索状態が保存される。該当する出荷指示リストが表形式で並び、総件数とページリンクが現れる場合がある。 |
| 検索済み状態でクエリのみでページ指定 | `GET /{eccube_admin_route}/standby/search?page_no=N`（または `pageno`）で N≥1 | 送信ボディ無しでもセッションの検索条件を復元し N ページ目を表示する。 |
| REST スタイルのパスでページ指定 | `GET /{eccube_admin_route}/standby/page/N` で N≥1 | 同上。サーバ側の開始 `$page_no` はパス値になる。 |
| `{page_no}` は 1 以上の整数。セッションに保存済みの検索条件・ソートを復元したうえで、指定ペ… | `GET /{eccube_admin_route}/standby/page/{page_no}` | `{page_no}` は 1 以上の整数。セッションに保存済みの検索条件・ソートを復元したうえで、指定ページの一覧を返す。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | ページタイトルは「出荷指示」。検索上部に「生成」カード（受注 ID レンジ・受注日レンジと送信ボタン。折りたたみ可能）はあるが一覧検索とは別フォーム `#generate_form`。検索側は `#search_form` で、出荷指示番号・注文番号（ラベルはテンプレートで「注文」と「admin.common.order_number」の連結による表示になりうる）、登録日レンジ、最終更新日レンジ、注文区分（複数チェック）、中央に「すべての検索条件をクリア」相当のリンク、フッタに「検索する」ボタン。結果側は総件数見出し、表示件数用 `select#page_count_pulldown`、表頭（番号リンク・区分・注文件数・登録日・最終更新日・行メニュー）、`pager.twig` によるページネーション。結果 0 件時はメッセージ「検索条件に該当するデータがありませんでした。」。 |
| JS 挙動 | `@admin/ShippingStandby/index.twig` の `javascript` ブロックは空。共通 `html/template/admin/assets/js/function.js` の `.search-clear` ハンドラは `#search_form` および `.search-box-inner` 内の入力だけをブラウザ上でクリアし、サーバ側セッションはこのクリックだけでは更新しない。削除リンクは共通の `csrf_token_for_anchor` と `data-method="delete"` による送信を使う別経路であり、一覧検索の本体ではない。 |
| CSS・レイアウト | `table-responsive` の `overflow: visible` に上書きするインライン `style` がある。検索結果表の各行に複製されるモーダル断片があるが検索クエリとは独立。 |
| モーダル・ポップアップ | 検索送信前の確認ダイアログはない。行メニューの削除確認は商品系の恒久削除モーダル文言を転用している断片がある（検索機能の入力検証とは無関係）。 |

補足。表示件数 `select` の各 `option` の `value` にはパス生成で URL が入っているが、本テンプレートでは `#page_count_pulldown` の `change` を束ねるスクリプトを載せていない。そのため他画面にあるページ件数変更即遷移の挙動は、当テンプレート単体では再現しない（実装を確認値とする）。

---

## 処理フロー

### 検索画面を開く初期表示になる（GET `admin_shipping_standby` でページクエリ無し、`standby/page` でない）

1. 管理画面の認証・共通制約を通過する。
2. コントローラは空の `ShippingStandbyType` と空の生成用フォームビューを返し、`pagination` は空の配列、`pageMaxis` は空、`page_count` は設定 `eccube_default_page_count` を渡す。この応答だけでは共通トレイトの検索本体は実行されないため、過去にセッションへ残った検索条件があってもこの GET だけでは復元されない。
3. Twig は `pagination` が偽値のため一覧ブロックを描画しない。

### 「検索する」で一覧を構築する（POST `admin_shipping_standby`）

1. 管理画面の認証・共通制約を通過する。
2. `index` は POST のため `search` に制御が移り、`SearchControllerTrait::search` が実行される。
3. `sort` はリクエストクエリ優先、なければセッション `eccube.admin.shipping_standby.sort`、なければ既定 `default`。`order` も同様にクエリ優先、`eccube.admin.shipping_standby.order`、既定 `DESC`。
4. `order` が正規表現 `^(ASC|DESC|asc|desc)$` に一致しない場合、管理メッセージスタックへ `admin.error.sort` を積み、`index($request, $paginator)` を再帰する。初期 GET と同様、一覧は載らない状態に戻る。
5. ページマスタを全取得し、`page_count` クエリがマスタのいずれかの `name` と一致するときのみセッション `eccube.admin.shipping_standby.search.page_count` をその値へ更新する。許容リスト外なら無視し、既定はセッション値または設定 `eccube_default_page_count`。マスタの集合に現在のページ件数が含まれないときは調整してセッションを直す実装がある。
6. `handleRequest` 後の `$searchForm->getData()` が PHP の `null` のときのみ、セッション `eccube.admin.shipping_standby.search` のビューデータへ `FormUtil::submitAndGetData` で戻す。両方とも得られない場合は再び初期表示の `index` に落ちる。
7. `$searchData` に `pattern_id`、`sort`、`order` をマージしたうえで、リポジトリの `getQueryBuilderBySearchData` を呼ぶ。
8. セッションへ `eccube.admin.shipping_standby.search.page_no`、`eccube.admin.shipping_standby.search`（ビューデータ）、`eccube.admin.shipping_standby.sort`、`eccube.admin.shipping_standby.order`、`eccube.admin.shipping_standby.search.page_count` を書き込む。
9. Knp ページネータでページ `$pageNo`（POST 開始時は 1）、件数 `$pageCount` で分割する。総件数と現在ページの組み合わせが空ページになるときはページ番号を 1 減らして再ページングする実装がある。
10. Twig へ `pagination`、`pageMaxis`、`page_count`、`generateForm`、`searchForm` を渡して描画する。

### GET でページ番号だけ指定して続きを読む（`admin_shipping_standby` のクエリ、または `admin_shipping_standby_page`）

1. `page_no > 0` と判定されると、`index` は直接 `search` を呼ぶ。以降は上記トレイト手順と同様で、`handleRequest` では入力が空になりがちなのでセッションのビューデータから復元する分岐が主となる。
2. `pager.twig` のリンクはルート名 `admin_shipping_standby` とクエリマージにより `page_no` を載せて生成される。

---

## 集計・判定・計算

| 項目 | 内容 |
|------|------|
| 一覧総件数 | `getQueryBuilderBySearchData` が返すクエリビルダに対しページネータが `COUNT` で求める総件数と、同一クエリ由来の一覧は一致する。 |
| DISTINCT | クエリビルダ先頭で `distinct(true)` とし、`order_id` 条件での `Orders` JOIN により行が増えうるときもリスト主キー単位で一意化される。 |

### クエリへの条件適用順（リポジトリ）

以下は「値が空とみなされるならその句を付けない」スタイルであり、順序は実装ソースの並びによる。

| 順序 | 入力キー（フォーム側） | 条件 |
|------|------------------------|------|
| 先頭固定 | （内部）sort / order | ソートキーは `default`→`s.id`、`create_date`→`s.createDate`、`update_date`→`s.updateDate`。未知キーは `default` に戻す。`order` は大文字化し `ASC` 以外ならすべて `DESC` として適用される。 |
| 1 | `standby_id` | `s.id` が完全一致。 |
| 2 | `order_id` | `Orders` を JOIN し、該当受注が 1 件でも含まれるリストだけを残す。 |
| 3 | `create_date_from` | `s.createDate` が以上。 |
| 4 | `create_date_to` | `s.createDate` が以下。 |
| 5 | `update_date_from` | `s.updateDate` が以上。 |
| 6 | `update_date_to` | `s.updateDate` が以下。 |
| 7 | `order_type` | チェック済みエンティティから ID を収集し `IDENTITY(s.OrderType)` がその集合に属するものだけとする。空配列・未送信なら条件なし。配列だがオブジェクトではない要素は ID に積まれない。 |

すべての入力が実質空のときは上記フィルタ句は付かず、ソートのみの一覧になる。

---

## 入力項目

ラベル文言は翻訳リソースを正とする。テンプレートでは一部ラベルがフィームの `label` とメッセージキーの連結で表示される。

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 出荷指示番号（画面上はラベル断片連結になりうる） | 任意 | 整数入力。Symfony の整数型ウィジェットの取りうる桁は実行環境整数範囲に従う。 | GET 初期は空 | キー `standby_id`。空でなけリスト主キー完全一致。送信後ビューデータはセッション `eccube.admin.shipping_standby.search`。 |
| 注文番号（同上） | 任意 | 同上 | 同上 | キー `order_id`。空でなけ受注 ID 完全一致で紐づくリストに限定。画面上の文言はテンプレートで「admin.common.order_number」との連結となる。 |
| 登録日（開始および終了。プレースホルダで日時形式を示唆） | 任意 | datetime シングルテキスト。実効的な許容フォーマットは Symfony の datetime ウィジェット解釈に従う。 | 同上 | キー `create_date_from` / `create_date_to`。それぞれ以上・以下。 |
| 最終更新日（開始および終了） | 任意 | 同上 | 同上 | キー `update_date_from` / `update_date_to`。それぞれ以上・以下。 |
| 注文区分（フォーム定義ではラベル「注文区分」） | 任意 | チェック複数選択 | 未選択 | キー `order_type`。`MtbOrderType` エンティティの ID 集合で `IDENTITY(s.OrderType)` を絞り込む。 |

### エッジケース

| ケース | 扱い |
|--------|------|
| セッションに検索条件がある状態で単に `GET /standby/search` を開き直した | トレイトを経由しないため一覧は最初から伏せられ、入力欄も空フォームとなる。一覧を再び見るには POST 送信か、ページクエリ付き GET、`/standby/page/N` が必要。 |
| 並び順文字列が不正 | `admin.error.sort` を積み、初期状態に相当する応答になる。 |
| 表示件数 `select` だけ変更 | 本テンプレート単体には `change` ハンドラが無いので、ユーザー操作のみでは URL が変わらない。 |
| 「検索条件をクリア」クリックのみ | DOM の値はクリアされるが送信しない限りサーバ側のセッションは以前のまま。 |

---

## データ整合性

- 一覧に出る ID・日付・区分は `dtb_shipping_standby` と関連マスタの読み取り時点の値である。同一セッション内で別タブが更新しても、再検索やページ移動まで画面は古い結果のままになりうる。
- 受注との紐づけは中間テーブル経由の多対多である。`order_id` 検索は「その受注を含むリスト」の存在で絞る。

---

## API／バッチ結果

本機能では扱わない。

---

## 副作用

| 種別 | 内容 |
|------|------|
| セッション | `eccube.admin.shipping_standby.search.page_count`、`eccube.admin.shipping_standby.search.page_no`、`eccube.admin.shipping_standby.search`、`eccube.admin.shipping_standby.sort`、`eccube.admin.shipping_standby.order` の読み書き。 |
| データベース | 検索処理は参照のみ。 |
| ログ | 検索専用の追加ログ出力は本経路では設けていない。 |

調査補助。リスト削除成功時のリダイレクトはセッションキー `admin.shipping_standby.search.page_no` を読む一方、トレイトは `eccube.admin.shipping_standby.search.page_no` を用いる。また遷移先ルート名に `admin_shipping_standby_search` が使われているが、ルート定義一覧に同名の `name` は無い。検索フォームのふるまい自体とは別だが、削除後の一覧復帰を追う際の実装差分として触れる。

---

## 調査補助（grep 用）

| 用途 | パス例 |
|------|--------|
| ルートと入口分岐 | `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php` |
| 検索共通処理 | `src/Eccube/Controller/Admin/SearchControllerTrait.php` |
| 検索クエリ組み立て | `src/Eccube/Repository/DtbShippingStandbyRepository.php` の `getQueryBuilderBySearchData` |
| フォーム定義 | `src/Eccube/Form/Type/Admin/Order/ShippingStandbyType.php` |
| 一覧テンプレート | `src/Eccube/Resource/template/admin/ShippingStandby/index.twig` |
| メッセージ | `src/Eccube/Resource/locale/messages.ja.yaml` の `admin.order.shipping_standby_*` |
| ナビリンク | `app/config/eccube/packages/eccube_nav.yaml` の `shipping_instructions.url` が `admin_shipping_standby` |

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_shipping_standby` … `GET, POST` … `/{eccube_admin_route}/standby/search`（GET は検索フォームと生成フォームのみの初期描画で一覧結果は載せない。POST は送信された検索条件で一覧検索結果を構築する。クエリ `pageno` または `page_no` に 1 以上の整数がある GET でも、フォーム入力が空とみなされる場合と同様にセッションの検索条件を復元して指定ページを表示する。）
- `admin_shipping_standby_page` … `GET` … `/{eccube_admin_route}/standby/page/{page_no}`（`{page_no}` は 1 以上の整数。セッションに保存済みの検索条件・ソートを復元したうえで、指定ページの一覧を返す。）
