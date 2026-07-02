# m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）

## 概要

管理画面の「ネット買取管理」買取一覧から「ダウンロード」メニュー内の「買取商品一覧CSV」を選ぶか、買取詳細（編集）から「買取商品一覧CSV出力」を押したときに、選択または対象となった買取注文に紐づく商品明細を、在庫増減向けの固定レイアウトでCSVとしてストリーム返却する機能である。一覧ラベルの翻訳キーは`admin.purchase.online.btn.csvexport_product_list`、詳細ボタンは`admin.purchase.online.detail.btn.csvexport_product_list`である。同一HTTPルートにクエリ`type=notSale`を付けた「買取商品（キャンセル）CSV」があり、ヘッダの数量に相当する列見出しとファイル名接頭辞のみ差し替わるが、抽出SQLとサービス実装は共用する。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。テンプレート注釈で示された移植元はpf-eccube3プラグインであるが、本書の確認値はec-cube-enterpriseのコア実装とする。

本機能のカスタマイズ区分は現行踏襲であり、挙動の参照は現行リポ（pf-eccube3のネット買取プラグイン）、DB関連はec-cube-enterpriseを正とする。ネット買取の永続化テーブル（`dtb_buy_order`・`dtb_buy_main_card`・`dtb_buy_order_indivisual_input_product`等）はec-cube-enterpriseに同名で実在し、現行と移行先で同一スキーマである。店頭買取の`dtb_otc_buy_*`は別系統であり本機能では扱わない。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| 買取一覧で1件以上チェックし、「ダウンロード」から「買取商品一覧CSV」を押す | `POST /{admin_route}/purchase/csv_export_product_list?type=sale` | `buyOrderIds[]`が送信され、売却側明細を集計したCSVがダウンロードされる。 |
| 同一覧で「買取商品（キャンセル）CSV」を押す | `POST /{admin_route}/purchase/csv_export_product_list?type=notSale` | 同上だが非売却側明細を対象とし、数量列ヘッダが「キャンセル数」となり、ファイル名接頭辞が`purchase_product_cancel_list_`になる。 |
| 一覧でチェックなしのまま上記いずれかを押す | （送信はブロックしうる） | `purchase.js`が`alert`で中断する。サーバへ届いた場合はフラッシュで未選択メッセージとなり一覧へ戻る。 |
| 買取詳細で「買取商品一覧CSV出力」を押す | `POST /{admin_route}/purchase/csv_export_product_list?type=sale` | 当該買取のIDが隠し`buyOrderIds[]`で送信され、売却側CSVがダウンロードされる。詳細にはキャンセルCSV用ボタンはない。 |
| `type`が`sale`でも`notSale`でもない値 | `POST /{admin_route}/purchase/csv_export_product_list?type=…` | フラッシュに固定文言「不正なCSV種別です。」を積み、買取一覧ページへリダイレクトする（翻訳キーは経由しない）。 |

一覧フォームの`id`は`bulk_csv_export`であり、検索フォームとは別HTMLフォームである。詳細は買取更新用フォームにボタンが置かれ、`formaction`のみ本ルートへ差し替わる。

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | 一覧の結果テーブルが1件以上あるとき、行頭チェックボックス`name="buyOrderIds[]"`と、「ダウンロード」ドロップダウン内の`#csvexport_product_list`（`type=sale`）および`#csv_export_product_cancel`（`type=notSale`）がある。詳細には`id="csvexport_product_list"`の送信ボタンと`name="buyOrderIds[]"`の隠し入力がある。 |
| JS 挙動 | 一覧では`#allCheck`で同フォーム内の`buyOrderId`属性付きチェックボックスを一括オンオフする。`#csvexport_product_list`と`#csv_export_product_cancel`は`.searched_buy_order_id:checked`が0件なら`alert`で中断する。詳細の`#csvexport_product_list`はこのチェックの対象外で、隠し入力が常に送られる。クリック後約500msは`[type=submit]`の`pointer-events`を空にして多重押下を抑止する。 |
| CSS・レイアウト | CSV出力専用の追加スタイルはない（一覧ドロップダウン用の暫定スタイルは検索一覧側と同様）。 |
| モーダル・ポップアップ | 出力前の確認ダイアログはない（ブラウザの`alert`による未選択案内のみ）。 |

---

## 処理フロー

### CSVをダウンロードする（POST `admin_purchase_csv_export_product_list`）

1. 管理画面の認証・共通制約を通過する。
2. PHPの実行時間制限を無効にする（`set_time_limit(0)`）。
3. リクエストボディから`buyOrderIds`をすべて取得し、各要素を`intval`したうえで`array_filter`により0を除く。
4. 手順3の配列が空である場合、翻訳キー`admin.purchase.online.csv_export.no_selection`のエラーをフラッシュに積み、セッションキー`eccube.admin.purchase.search.page_no`（無ければ1）を`page_no`として`admin_purchase_page`へリダイレクトする。
5. クエリ`type`を読む。`sale`なら売却側、`notSale`なら非売却側として内部的に真偽を決める。どちらでもない場合、フラッシュに文字列「不正なCSV種別です。」を積み、手順4と同様に一覧へリダイレクトする。
6. 買取商品一覧CSV用サービスへ手順3のID配列と真偽を渡す。
7. サービスは買取注文リポジトリで、`id`が手順3の集合に含まれる買取注文を`id`昇順で取得する。
8. 手順7の結果が空配列である場合、`RuntimeException`としメッセージ文字列は`admin.purchase.online.csv_export.not_registered_buy_order_id`とする。コントローラはこれを翻訳してフラッシュに積み、手順4と同様に一覧へリダイレクトする。
9. 手順7で少なくとも1件でも存在すれば手順8には至らない。手順3にDBに存在しないIDが混ざっても、取得結果が空にならない限りエラーにしない（SQLの`IN`句は存在するIDのみヒットする）。
10. サービスは同一リポジトリの`getProductListDataForExportCsv`を呼び、反復可能な行集合を受け取る。売却／非売却は`dtb_buy_main_card.sale_flg`および個別入力の`sale_flg`と一致する行に限定される。非売却側のときはさらに買取注文のステータスがキャンセルIDの行は通常枝・個別入力枝の両方で除外される。
11. `StreamedResponse`のコールバック内で共通のCSVエクスポートサービスを開き、ヘッダ行を出力し、各行についてヘッダキー順に値を並べ替えて出力し、閉じる。値欠損キーは空文字になる。
12. 売却側のときファイル名接頭辞は`purchase_product_list_`、非売却側は`purchase_product_cancel_list_`とする。続けてリクエストに含まれた買取注文IDの最小値を`printf('%07d', …)`した番号、アンダースコア、日時`YmdHis`、拡張子`.csv`を連結する。
13. 応答の`Content-Type`は`application/octet-stream`とし、`Content-Disposition`は`attachment`で上記ファイル名を付与する。
14. ストリーム送信の完了扱いで情報ログに「買取商品一覧CSV出力完了.」とファイル名を記録する。

### SQLが0行のとき

1. 買取注文は存在するが、売却／非売却の条件やJOINにより明細行が1件も組み立てられない場合、データ行は出力されずヘッダのみのCSVとなる実装である。

### コントローラ外で捕捉しない例外

1. 本書ではSymfonyの汎用エラーハンドリングに委ねる経路のみとし、詳細は別資料とする。

---

## POSTパラメータ・クエリ（エクスポート要求）

本機能はブラウザフォームからのPOSTを受け取るが、店舗設定のCSV型定義（`dtb_csv`）で列を増減する方式ではない。よって「入力項目」表（5列）は置かず、送信内容のみ整理する。

| 名前 | 必須 | 内容 |
|------|------|------|
| `buyOrderIds` または `buyOrderIds[]` | 実質必須 | 整数配列。空またはすべてが0に正規化後に失われるとエラーフラッシュして一覧へ戻る。 |
| `type`（クエリ） | 実質必須 | 文字列`sale`または`notSale`。欠損やその他の値は固定文言のフラッシュとリダイレクト。 |

詳細画面では編集フォームの他フィールドも同じPOSTに含まれる。エクスポート処理が読むのは上記に限らずとも、CSV生成が参照するのは買取注文IDとクエリ`type`である。

---

## 集計条件（抽出・集約の要点）

### 対象となる規格JOIN（状態あり通常枝）

- `dtb_product_class`は、`dtb_buy_main_card`の言語ID・カード状態IDと一致し、`high_price_code`がNULLであり、`product_status_id`が公開または非公開（論理削除相当の廃止は除外）である規格に限定して結合する。
- `dtb_buy_main_card.sale_flg`が手順10の真偽と一致する行のみ。
- 選択された買取注文IDに限定する。

### 状態なし通常枝

- `dtb_buy_main_card.card_condition_id`がNULLの行を対象とする。規格テーブルにはJOINせず、商品名・略称タグ・レアリティなどは商品側から取得する。
- 数量は同一グループ内で`SUM(bmc.count)`する。グループキーは実装どおり`bmc.product_id`、`p.name`、`bmc.price`、`bmc.language_id`、`sc.name`、`r.code`、`p.id`である。

### 個別入力枝

- `dtb_buy_order_indivisual_input_product`の`sale_flg`が手順10の真偽と一致する行。
- `language_id`はSQL上常に数値1として出力される枝がある。
- `standard_price`はNULL、`product_code`は空文字、`storage_code`・`rarity_code`・`condition_code`は空文字になる実装である。

### 非売却側でのキャンセル注文除外

- `saleFlg`が偽のとき、`dtb_buy_order.buy_order_status_id`がキャンセル定数の注文は、通常枝・個別入力枝の両方のWHEREから除外する。

### 同一キーでの数量集約（状態あり）

- 同一`dtb_product_class`行に対し同一査定単価の明細をまとめ、`SUM(bmc.count)`を`product_count`とする。単価が異なる場合は別行になる。

### 並び順（結果全体）

- SQL末尾の`ORDER BY`により、(1)個別入力でない行を先に、(2)`product_id`昇順、(3)商品コードNULLを後ろに、(4)カード状態ID昇順、といった実装順になる。

---

## 出力列とデータの対応

ヘッダ連想配列はサービス定数`CSV_HEADER`のキー順である。売却側では値側の日本語見出しがそのまま1行目になる。非売却側では同一キー`product_count`の見出しだけが「キャンセル数」に置き換わり、列の数自体は増えない。

内部キーからCSV値への対応は次のとおり。データ行はクエリ結果の連想配列からヘッダキー順に抜き出す。クエリは並び・集約用の内部列も返すが、ヘッダに無いキーはCSVへ出力しない。

| CSV列名（ヘッダ） | データの由来・規則 |
|-------------------|---------------------|
| 商品コード | 状態あり通常枝では`dtb_product_class.product_code`。状態なし・個別入力枝では空文字になりうる。 |
| 在庫増減数／キャンセル数 | 売却側では見出しは「在庫増減数」。非売却側では同一意味の数量が「キャンセル数」の見出しで出力される。値はSQLの`product_count`（集約結果または個別入力数量）。 |
| 商品名 | 商品名または個別入力商品名。 |
| 基準価格 | 状態あり通常枝では規格の基準価格。状態なし・個別入力ではNULLまたは空として出力されうる。 |
| 買取価格 | 通常明細では`dtb_buy_main_card.price`、個別入力では個別入力の単価。 |
| 言語ID | 通常明細では明細の言語ID。個別入力枝の実装では常に1として返す枝がある。 |
| 略称タグ | 商品のストレージコードマスタ名称。無JOIN時は空文字になりうる。 |
| レアリティ | カード詳細経由のレアリティコード。無ければ空文字。 |
| 状態 | カード状態マスタコード。状態なし通常枝・個別入力では空文字になりうる。 |

---

## エッジケース

| 状況 | ふるまい |
|------|----------|
| 買取注文IDを複数指定し一部のみ存在 | 存在する注文だけがSQL対象。取得結果が空なら「存在しない買取注文情報ID」メッセージ。 |
| 存在するが明細が条件に合わない | ヘッダのみのCSVが返る。 |
| 文字コード | `eccube_csv_export_encoding`がUTF-8（大小無視）のときのみBOMを付与する。それ以外はBOMなしで変換先エンコーディングへ変換する。 |
| CSV区切り・クォート | `eccube_csv_export_separator`および`fputcsv`相当の引用・エスケープ規則に従う（確認値はカンマ区切りが既定パラメータにある）。 |
| 不正`type` | 翻訳を経由しない固定文言でフラッシュする。 |

---

## 業務ルール・計算

- 出力対象は画面・APIで確定した検索条件、権限、店舗・支店条件に一致するレコードに限定する。
- 金額・数量・日時・ステータスは参照時点の永続化済み値をそのまま出力し、CSV生成時に再計算・補正しない。
- 文字コード、列順、ヘッダ、空値表現は既存CSV仕様を正とし、該当値がない項目は空欄として扱う。
- 件数上限やページングの有無は呼び出し元の検索条件・既存実装に従い、出力途中で対象データが更新されても再読込による整合補正は行わない。

## データ整合性

- CSVは出力時点のDB状態で読み取る。一覧画面の表示時刻との間に明細が変われば一致しない場合がある。
- 詳細画面から出力するときも、編集途中の未保存内容はCSVに反映されない（送信対象は保存済みデータとクエリ結果のみ）。

---

## 副作用

- DB更新は行わない。
- 成功時は情報ログにファイル名を残す。
- エラー時はフラッシュメッセージを積み、買取一覧のページ番号をセッションから復元したURLへリダイレクトする。

---

## API／バッチ

本機能では扱わない。

---

## 権限・認可

管理画面にログインしたオペレータが利用する。ロール粒度の詳細は管理画面共通の権限モデルを正とする。

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| エクスポート成功 | ブラウザがファイルダウンロードを処理する。サーバはストリーム応答を返す。 |
| ID未選択、不正`type`、キャッチした実行時例外 | フラッシュを積み、`GET /{admin_route}/purchase/page/{page_no}`へリダイレクト（`page_no`はセッション`eccube.admin.purchase.search.page_no`の確認値）。 |

---

## エラー処理

| トリガー | 利用者への示し |
|----------|----------------|
| `buyOrderIds`が空 | 翻訳`admin.purchase.online.csv_export.no_selection` |
| 指定IDに対応する買取注文が1件もない | 翻訳`admin.purchase.online.csv_export.not_registered_buy_order_id` |
| `type`が`sale`でも`notSale`でもない | フラッシュ文言「不正なCSV種別です。」（固定文字列） |

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| ストリーム送信完了扱い | 情報レベルで「買取商品一覧CSV出力完了.」とファイル名 |

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークン
- Cookie値
- セッションIDの完全値
- Remember Meトークンの原値

---

## セッション

一覧へ戻すリダイレクト先のページ番号に`eccube.admin.purchase.search.page_no`を使う。当機能はこのキーを更新しない。

---

## 排他制御・トランザクション

読み取りのみであり、当機能は楽観ロック・悲観ロックや書き込みトランザクションを開始しない。

---

## 調査補助（grep向け）

- ルート処理とタイムアウト抑止・`type`分岐: `src/Eccube/Controller/Admin/Purchase/PurchaseController.php`（`admin_purchase_csv_export_product_list`）
- CSVヘッダ・ファイル名・ストリーム: `src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php`
- 抽出SQL: `src/Eccube/Repository/DtbBuyOrderRepository.php`（`getProductListDataForExportCsv`）
- ストリーム書き込み・エンコーディング: `src/Eccube/Service/CsvExportService.php`（`fopen` / `fputcsv`）
- 一覧テンプレート: `src/Eccube/Resource/template/admin/Purchase/index.twig`
- 詳細テンプレート: `src/Eccube/Resource/template/admin/Purchase/detail.twig`
- クライアント検証（一覧）: `html/template/admin/assets/js/Purchase/purchase.js`
- 詳細の多重押下抑止: `html/template/admin/assets/js/Purchase/purchasedetail.js`

---


### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_purchase_csv_export_product_list` … `POST` … `/{admin_route}/purchase/csv_export_product_list`（リクエストボディの買取注文ID一覧とクエリ`type`を読み、`type`が`sale`なら売却側明細、`notSale`なら非売却側明細を集計したCSVをストリーム返却する。）

## リニューアル移行時の扱い

DB関連の正典はec-cube-enterpriseとする。本機能が参照するネット買取テーブル（`dtb_buy_order`・`dtb_buy_main_card`・`dtb_buy_order_indivisual_input_product`・`dtb_product_class`）は現行（pf-eccube3）とec-cube-enterpriseで同名・同一スキーマであり、列名の読み替えは生じない。ステータス履歴は`dtb_buy_order_status_histry`（綴りはec-cube-enterprise実装どおり）、実在庫は`dtb_buy_order_stock`を正とする。店頭買取の`dtb_otc_buy_order`系は別系統（M07-07以降の一部資料が参照する`dtb_otc_*`はネット買取ではなく店頭買取の表である）。

本機能固有のCookieやRemember Meは扱わない。セッションキー`eccube.admin.purchase.search.page_no`は実装の確認値である。
