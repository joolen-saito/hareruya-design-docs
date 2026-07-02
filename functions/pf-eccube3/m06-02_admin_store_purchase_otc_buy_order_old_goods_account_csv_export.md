# m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）

## 概要

管理画面の「店頭買取管理」買取一覧で、検索結果からチェックした店頭買取注文を対象に、古物台帳入力向けの項目を1注文1行としたCSVファイルをダウンロード応答として返す機能である。ヘッダ行は日本語ラベル（例:「査定ID」「年月日」）であり、商品CSVのように`dtb_csv`で項目順をカスタマイズする仕組みは使わない。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。実装の確認値はSymfony版コア（テンプレート先頭に記載の移植元パスを含む）および同一リポジトリ内のテストを正とする。

カスタマイズ区分はカスタマイズである。挙動はec-cube-enterpriseの実装を確認値とし、DB関連もec-cube-enterpriseを正とする。現行（pf-eccube3のHareruyaEcプラグイン）との差は「リニューアル移行時の扱い」に記録する。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

古物台帳CSVが参照する店頭買取系テーブルは、現行（pf-eccube3のHareruyaEcプラグイン）と移行先（ec-cube-enterprise）でテーブル名・主要列名が一致し、概ね同一スキーマである。`dtb_otc_buy_order`の`assessment_id`・`complete_date`・`total_price`・`qualified_invoice_issuer_flg`・`qualified_invoice_issuer_account_id`、`dtb_otc_buy_order_detail`の`original_quantity`、`dtb_otc_buy_order_indivisual_input_product`の`quantity`はいずれも同名である。確認できた差分は次のとおりで、DB関連はec-cube-enterpriseを正とする。

| 観点 | 現行（pf-eccube3のHareruyaEcプラグイン） | 移行先（ec-cube-enterprise） |
|------|------|------|
| 古物台帳CSVの抽出列に対応するテーブル・列 | 同名（同一スキーマ） | 同名（同一スキーマ） |
| 棚戻し列 | `dtb_otc_buy_order`に`restocked_flg`・`restocked_date`を持たない | `restocked_flg`・`restocked_date`を追加。ただし古物台帳CSVの抽出列には含まれない |

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| 検索結果が1件以上あり、一覧で注文をチェックし、「CSVダウンロード」→「古物台帳入力用CSV」を選ぶ | `POST /%eccube_admin_route%/otcbuyorder/export`（フォームに`export_type`=`old_goods_account`、複数値`otcBuyOrderIds[]`） | 選択IDに紐づく行だけを含むCSVがダウンロードされる。 |
| 検索結果が0件で一覧ブロックが「該当なし」表示のみ | （メニュー自体が描画されない） | 「CSVダウンロード」ドロップダウンは検索結果ヘッダ付近にのみ置かれるため、この入口からは実行できない。 |
| 一覧はあるがチェックを1つも付けずに「古物台帳入力用CSV」を選ぶ | `POST /%eccube_admin_route%/otcbuyorder/export`（`otcBuyOrderIds`が実質空） | エラーフラッシュが出て買取一覧のページ付きルートへリダイレクトされる。 |

送信フォーム`result_form`は`action`が`admin_otcbuyorder_export`を指す別フォームであり、検索用フォーム`search_form`とは分離されている。

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | 検索結果ボックス内、`pagination.totalItemCount > 0`のときのみ「CSVダウンロード」ドロップダウンを表示する。配下に「古物台帳入力用CSV」リンク（`data-type`=`old_goods_account`）がある。各行に`name`=`otcBuyOrderIds[]`のチェックボックスがある。表頭チェック`#allCheck`で`otcBuyOrderId`属性を持つチェックを一括オンオフする。 |
| JS挙動 | `.export-link`クリックで既定のリンク遷移を抑止し、`#export_type`隠し項目に`data-type`を代入して`#result_form`を送信する。戻しリストPDF用タイプだけ別URL・別ウィンドウとなるが、古物台帳用は通常の同一ウィンドウPOSTである。 |
| CSS・レイアウト | Bootstrapドロップダウンが非表示になる問題への回避として、`#result_list__custom_csv_menu`周りに限定したインラインスタイルがある。 |
| モーダル・ポップアップ | 出力前の確認ダイアログはない。 |

---

## 処理フロー

### CSVをダウンロードする（POST、`export_type`=`old_goods_account`）

1. 管理画面の認証を通過したリクエストのみが到達する。
2. コントローラでPHPの実行時間制限を無効にする（`set_time_limit(0)`）。
3. リクエストボディから`export_type`を読む。`OtcBuyOrderCsvExportService::CSV_TYPES`に無いキーのときは例外となり、管理者向けのシステムエラー画面相当の応答になる。
4. `otcBuyOrderIds`をすべて整数に変換し、変換結果が空配列のときは翻訳キー`admin.purchase.online.csv_export.no_selection`のエラーをフラッシュに積み、セッションキー`eccube.admin.otcbuyorder.search.page_no`があればそのページ番号、無ければ1として`admin_otcbuyorder_page`へリダイレクトする。
5. `old_goods_account`では戻しリスト向けの追加バリデーションは実行しない。
6. CSVエクスポート処理に制御を渡す。ストリーム応答のコールバック内で共通CSV出力サービスを開き、UTF-8設定時はBOMを書いたうえで、ヘッダ行にサービス定数に沿った日本語ラベルを出力する。
7. リポジトリ層の生SQLイテレータで、指定IDかつ実在する注文のみを行として取得し、ヘッダキー順に値を並べ替えて1行ずつ書く。
8. ファイル名は接頭辞`old_goods_account_`、日時（`YmdHis`）、拡張子`.csv`を連結したものとする。`Content-Type`は`application/octet-stream`。`Content-Disposition`は`attachment; filename=`に前述ファイル名を連結する形式とする。
9. 応答オブジェクト返却の直前に、情報ログへファイル名を含むメッセージを書く（ログはコールバック内のストリーム送信完了より前に実行される）。

### 指定IDの一部だけがデータベースに存在するとき

1. SQLは`WHERE o.id IN (:ids)`であり、存在しないIDは結果行に現れない。
2. 存在するIDが1つも無いときもエラーにせず、ヘッダのみのCSVが返る。

---

## 集計条件

| 指標 | 集計の要点 |
|------|------------|
| 出力対象行 | POSTで渡された店頭買取注文IDのうち、`dtb_otc_buy_order`に存在するもの。ステータスや店舗によるフィルタはSQLに含まれない。 |
| 数量（`totalQuantity`） | `dtb_otc_buy_order_detail`の`original_quantity`合計と、`dtb_otc_buy_order_indivisual_input_product`の`quantity`合計を注文単位で足す。いずれも左外部結合し、無い側は0として扱う。 |
| 並び順 | `assessment_id`降順（文字列並び）。 |

---

## CSV列とデータソースの対応

ヘッダ行に並ぶ日本語ラベルと、データ行のキー対応は次のとおり（サービス内の配列キー順が出力順）。

| ヘッダラベル（確認値） | データキー | 内容の要点 |
|------------------------|------------|------------|
| 査定ID | assessmentId | `dtb_otc_buy_order.assessment_id`。 |
| 年月日 | completeDate | `complete_date`を東京タイムゾーン前提で`YYYY年M月D日`形式の日本語表記（PostgreSQL`TO_CHAR`。月日は先頭ゼロ無しの指定。グレゴリオ暦）。 |
| 代金 | totalPrice | `dtb_otc_buy_order.total_price`。 |
| 数量 | totalQuantity | 上記「集計条件」の合計。 |
| 氏名 | fullName | `last_name`と`first_name`の間に全角空白を挟んだ連結。 |
| 身分証 | identificationType | `mtb_identification.name`（外部キー未設定時はNULL）。 |
| 住所 | address | 国IDが日本（マスタ定数392）のときは「県名」「addr01」「addr02」「addr03」を半角空白で`CONCAT_WS`。海外のときは「国名」「addr03」「addr02」「addr01」の順で同様に連結。 |
| 年齢 | age | `apply_date`と`birth`に対してPostgreSQLの`AGE`で間隔を求め、`EXTRACT(YEAR FROM …)`で年数のみを出力する（単体テストでは申込日と生年月日から期待される整数と一致する）。 |
| 電話番号 | phoneNumber | NULLまたは空ならそのまま。それ以外は`="番号"`形式とし、番号内の二重引用符はCSV向けにエスケープする。 |
| 事業者であるか | qualifiedInvoiceIssuerFlg | `dtb_otc_buy_order.qualified_invoice_issuer_flg`。CSV書き込み時は文字列化経路により真が`1`、偽が空文字になる。 |
| 事業者番号 | qualifiedInvoiceIssuerNumber | `dtb_qualified_invoice_issuer_account.qualified_invoice_issuer_code`（未紐付け時はNULLで空出力）。 |

クエリ実行前にDB接続で`SET TIME ZONE 'Asia/Tokyo'`を発行する。

---

## 業務ルール・計算

本機能は画面入力の保存は行わない。送信パラメータは次のとおり扱う。

| 項目 | 内容 |
|------|------|
| export_type | `old_goods_account`のみが古物台帳用。他値は本書の対象外。 |
| otcBuyOrderIds | 整数配列として解釈。空ならエラーでリダイレクト。 |

### 入力項目

本機能では永続化フォームの入力項目表は置かない。利用者が操作するのはチェックボックスとドロップダウンによる送信のみである。

### エッジケース

| ケース | 扱い |
|--------|------|
| 明細も個別入力商品も無い注文 | 数量は0として出力される。 |
| 電話番号がNULLまたは空 | `phoneNumber`列はNULLまたは空文字のまま出力され、`="…"`形式にならない。 |
| 身分証・職業・適格請求書アカウントが未設定 | 対応列は空またはNULLに準ずる出力となる。 |
| POSTされたIDがすべて存在しない | ヘッダのみのCSVが返り、エラーにしない。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧との対応 | 同一検索結果からチェックしたIDは、その時点のデータベース状態がそのままCSVに反映される。一覧表示後に他処理で注文が変更・削除された場合、再検索せずに出力すると一覧記憶と一致しないことがある。 |
| トランザクション | 本処理は参照SQLとストリーム出力のみであり、注文データを更新しない（戻しリストCSV種別での別副作用は本機能では扱わない）。 |

---

## API/バッチ結果

本機能ではAPI呼び出し・バッチ実行を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | POSTボディの`export_type`、`otcBuyOrderIds`（複数フィールド名`otcBuyOrderIds[]`）。 |
| 成功時出力 | `StreamedResponse`本体にCSVバイト列。先頭行はヘッダ。 |
| 失敗時出力 | 選択なしはフラッシュエラー付きリダイレクト。種別不正は例外経由のエラー応答（テストでHTTP500とシステムエラー文言を確認）。 |
| 副作用 | `old_goods_account`では注文レコードを更新しない。情報ログにファイル名が残る。 |

---

## DBカラム

当機能のデータ抽出に直接現れる主な列・結合先を示す（型の細部はスキーマ参照）。

| テーブル | 列・結合 | メモ |
|----------|-----------|------|
| `dtb_otc_buy_order` | `id`、`assessment_id`、`complete_date`、`total_price`、`last_name`、`first_name`、`apply_date`、`birth`、`country_id`、`pref_id`、`addr01`〜`addr03`、`tel_no`、`job_id`、`identification_id`、`qualified_invoice_issuer_flg`、`qualified_invoice_issuer_account_id` | 主テーブル。 |
| `dtb_otc_buy_order_detail` | `otc_buy_order_id`、`original_quantity` | 数量集計サブクエリ。 |
| `dtb_otc_buy_order_indivisual_input_product` | `otc_buy_order_id`、`quantity` | 数量集計サブクエリ。 |
| `mtb_pref` | `name` | 日本住所の県名。 |
| `mtb_country` | `id`、`name` | 国内外判定と国名。 |
| `mtb_identification` | `name` | 身分証種別表示名。 |
| `mtb_job` | `name` | 職業表示名。 |
| `dtb_qualified_invoice_issuer_account` | `qualified_invoice_issuer_code` | 事業者番号。 |

### DB操作

本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 検索 | dtb_otc_buy_order / dtb_otc_buy_order_detail / dtb_otc_buy_order_indivisual_input_product / dtb_qualified_invoice_issuer_account / mtb_country / mtb_identification 等 | 検索条件に合致するレコードを抽出する。抽出結果を所定フォーマットでファイル出力する。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| export_type | 許可リスト外は例外で失敗する。 |
| otcBuyOrderIds | 整数化後に空ならエラーメッセージを表示してリダイレクトする。 |
| 店舗権限・ステータス | `old_goods_account`ではエクスポート前に追加チェックしない。 |

---

## 権限・認可

| 利用者状態 | 本機能（CSVダウンロード） |
|------------|---------------------------|
| 管理画面未ログイン | 管理画面ログインフローへ誘導される（詳細は管理画面共通セキュリティ設定を正とする）。 |
| 管理画面ログイン済み | ルートに到達できればエクスポート処理が実行される実装である。店舗単位の編集権限チェックはこの種別では行わない。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| CSV送信が成功 | ブラウザのファイルダウンロードとして応答（画面ルート遷移なし）。 |
| `otcBuyOrderIds`が空 | `admin_otcbuyorder_page`へHTTPリダイレクト（ページ番号はセッション確認値）。 |
| `export_type`不正 | エラー応答（一覧へのアプリ制御リダイレクトではない）。 |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|-------------------|
| 選択なしエラー | フラッシュにエラーを積む | 買取一覧の該当ページが再表示され、エラーメッセージが見える。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| チェックされた注文が0件 | 翻訳メッセージをフラッシュし、`admin_otcbuyorder_page`へリダイレクト。 |
| `export_type`が未知 | 例外によりエラー応答（運用上は不正改ざんや実装不整合時）。 |

---

## 試行制限

本機能では試行制限を扱わない。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| CSV応答オブジェクト生成直前 | 情報ログに「店頭買取CSV出力完了」とファイル名が出力される（種別が古物台帳でも同一文言）。 |

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークン
- Cookie値
- セッションIDの完全値
- Remember Meトークンの原値

---

## セッション

### 本機能におけるセッション

| 観点 | 内容 |
|------|------|
| 選択なし時のリダイレクト先ページ | `eccube.admin.otcbuyorder.search.page_no`を読む。無ければ1。 |

### セッションへ保存しない情報

本機能のCSV出力処理自体はセッションを更新しない（読むのみ）。

---

## Cookie

本機能単体で新たにCookieを設定しない。セッション識別子は管理画面共通の仕組みに従う。

---

## 排他制御・トランザクション

本機能は参照とストリーム出力のみであり、`old_goods_account`において楽観ロック・悲観ロックやアプリ定義のトランザクション境界は持たない。

---

## 文字コード・区切り文字（確認値）

共通CSV出力サービスの設定に従う。

| 項目 | 内容 |
|------|------|
| エンコーディング | `eccube_csv_export_encoding`。既定パッケージ設定では`UTF-8`。UTF-8のとき先行してBOMバイト列を書く。 |
| 区切り | `eccube_csv_export_separator`。既定はカンマ。 |
| クォート | PHP標準の`fputcsv`に準ずる（エンクロージャとエスケープ文字はサービス実装の確認値）。 |

---

## セキュリティ補足（CSRF）

エクスポート用`result_form`にSymfonyフォームが自動付与するCSRFフィールドはなく、当エンドポイントでもCSRFトークン検証は行わない。到達制御は管理画面の認証に依存する。

---

## 調査補助（ソース位置の索引）

グレップやIDE検索の手がかりとして、主な実装位置を示す。

- `src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php`（ルート`admin_otcbuyorder_export`）
- `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php`（`CSV_TYPES['old_goods_account']`）
- `src/Eccube/Repository/DtbOtcBuyOrderRepository.php`（`getOldAccountCsvExportData`）
- `src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig`、`html/template/admin/assets/js/OtcBuyOrder/otc-buy-order.js`
- `tests/Eccube/Tests/Repository/DtbOtcBuyOrderRepositoryTest.php`（住所・数量・電話形式など）
- `tests/Eccube/Tests/Web/Admin/OtcBuyOrder/OtcBuyOrderControllerTest.php`（CSV応答の smoke）

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_otcbuyorder_export` … `POST` … `/%eccube_admin_route%/otcbuyorder/export`（`export_type`と選択された店頭買取注文IDの一覧を受け取り、種別に応じたCSVまたは別処理へ振り分ける。古物台帳用は`export_type`=`old_goods_account`のとき。）
