# 商品管理 — カスタムデータ CSV ダウンロード（商品情報）

## 概要

管理画面の「商品管理」商品一覧で、プルダウン「カスタムデータ CSV ダウンロード」から選んだ CSV 出力定義（拡張）に沿って、商品検索条件と同一の抽出範囲の商品規格行を、あらかじめコード上に定義した列キーに基づき DQL／SQL で組み立て、CSV ストリームとして返す機能である。一覧上のチェックボックス選択や POST は不要で、セッションに保存された商品検索条件だけを参照する。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。コアの `ec-cube-enterprise` 配下ソースを確認値とする。

本機能のカスタマイズ区分はカスタマイズである。画面・処理の挙動は現行リポ（pf-eccube3）の実装を参照し、DB関連（テーブル名・列名・保存先・副作用のDB更新）は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

本機能が参照するCSV拡張・出力定義のスキーマは、現行 pf-eccube3 と移行先 ec-cube-enterprise で同一スキーマである。

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 出力列キー | `dtb_csv.column_name` | `dtb_csv.column_name`（実在確認済み） |
| 出力順キー | `dtb_csv_csv_extension.rank` | `dtb_csv_csv_extension.rank`（実在確認済み） |
| 拡張の削除方式 | `dtb_csv_extension.deleted_at` による論理削除 | 同一（`deleted_at`） |

基本設計が描く本機能固有の追加仕様は無い。並び順キーは両者とも `rank` であり、`sort_no` は `dtb_csv` 側の項目並び順に限る。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| 商品一覧右上のプルダウンで、空白以外の拡張名を選ぶ | `GET /{admin_route}/product/product_all_csv_custom_export/{csvExtensionId}` | 現在の商品検索条件に一致する規格が CSV でダウンロードされる。 |
| 同プルダウンで「カスタム CSV 出力項目設定」を選ぶ | `GET /{admin_route}/setting/shop/custom_csv/1`（`csvTypeId` は商品 CSV 種別の実装値） | CSV 出力項目の設定画面が開く。拡張の編集時は URL 末尾に拡張 ID が付く。 |
| 商品用 CSV 拡張の新規・編集フォームを表示する。既定の `csvTypeId` は商品 CSV 種別（… | `GET /{admin_route}/setting/shop/custom_csv/{csvTypeId}/{csvExtensionId}` | 商品用 CSV 拡張の新規・編集フォームを表示する。既定の `csvTypeId` は商品 CSV 種別（数値 1）。 |
| フォーム送信で拡張名・出力項目リストを保存する。 | `POST 上記と同一パターン` | フォーム送信で拡張名・出力項目リストを保存する。 |
| 拡張と中間テーブル行を削除する。 | `DELETE /{admin_route}/setting/shop/custom_csv/delete/{csvExtensionId}` | 拡張と中間テーブル行を削除する。 |

プルダウン変更時のクライアントは `window.location.href` による GET のみで、CSRF トークンは送らない。

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | 商品一覧 `index.twig` で `select#csv_pulldown`。先頭オプションは翻訳キー `admin.product.custom_csv_export`（日本語メッセージ資源上は「カスタムデータ CSV ダウンロード」）。続いて `ProductCsvExtensions`（CSV 種別が商品かつ `deleted_at` が無い拡張）ごとの URL、最後に設定画面へのオプション。 |
| JS 挙動 | `#csv_pulldown` の `change` で選択値が非空ならその URL へ遷移。出力ボタン専用の二重押し防止や確認ダイアログは無い。 |
| CSS・レイアウト | 本機能専用の追加スタイルはプルダウン周りに限らない（一覧共通）。 |
| モーダル・ポップアップ | ダウンロード前の確認は無い。 |

設定画面 `custom_csv.twig` では、左右の `select` への項目移動・全移動・並べ替えボタン、CSV 種別・拡張の変更で `location.href` 遷移、送信前に両リストの option をすべて `selected` にする処理がある。

---

## 処理フロー

### カスタム CSV をダウンロードする（`admin_product_all_csv_custom_export`）

1. 管理画面の認証・共通制約を通過する。
2. パス変数の ID で `dtb_csv_extension` を取得する。論理削除（`deleted_at` 非 null）または CSV 種別が商品以外なら HTTP 404 とする。
3. 中間テーブル経由で `dtb_csv` を `rank` 昇順、`sort_no` 昇順で取得する。
4. 各 `dtb_csv` の `column_name` をトリムし、空でないものだけを列キーとして順に連結し、カンマ区切りの `columns` クエリ内部表現にする。連結後に一度も有効な文字列が無ければ HTTP 404 とする。
5. `set_time_limit(0)` と ORM の SQL ロガー無効化を行う。
6. `ProductAllCsv` に対し `initByQuery(['columns' => …])` を呼ぶ。列キー文字列はサービス内で解釈され、`ProductAllCsv::getAvailableColumns` に存在するキーのみ残る。すべて無効な場合はサービス側で既定列セットにフォールバックする。
7. 同一リクエストのセッションから商品検索ビューデータを読み、`SearchProductType` のビルダに `ADMIN_PRODUCT_INDEX_INITIALIZE` イベントを投げたうえでフォームに載せ、セッション値とフォーム既定をマージして `submitAndGetData` する。得られた配列を `setAdminSearchData` に渡す（ファイル名は `product_custom` 接頭辞になる）。
8. `StreamedResponse` を生成する。コールバック内で BOM（UTF-8 のときのみ）・ヘッダ行・データ行を `eccube_csv_export_separator` と `eccube_csv_export_encoding` に従い出力する。データは規格 ID 単位でバッチ（200 行）ごとに flush する。
9. レスポンスヘッダの `Content-Type` は `text/csv;charset={設定のエンコーディング}`、`Content-Disposition` は `attachment; filename="product_custom{YmdHis}.csv"` 形式とする。

### 検索結果が 0 件のとき

1. 検索用サブクエリで得た規格 ID 一覧が空なら、本体クエリに `1 = 0` が付与される。
2. データ行は出力されず、ヘッダ行のみの CSV となる。

### 拡張の列キーがすべて無効なとき

1. コントローラは手順 4 で 404 にならない（空文字列だけが列から除かれたうえで残キーがある）。
2. サービスは有効キーが尽きた場合に既定列一式で出力する。

---

## 集計条件

| 指標 | 集計の要点 |
|------|------------|
| 出力行 | 商品規格（`dtb_product_class`）1 行につき CSV 1 行。`GROUP BY pc.id`。 |
| 検索条件 | 管理商品検索と同じ `getQueryBuilderBySearchDataForAdmin` をサブクエリに用い、得られた規格 ID をチャンク（500 件）で `IN` し `OR` 連結する。検索ありのときは一覧と同様に `visible` による追加絞り込みは行わない（実装コメントどおり）。 |
| 並び | 検索ありのときは `pc.id` 昇順のみ。検索データが無いフォールバック経路では在庫・言語・レアリティ・棚番号など複合キーの降順／昇順（実装の `sortProduct` どおり）を用いるが、本機能は通常 `setAdminSearchData` により検索あり側に入る。 |

---

## データ行の組み立て（業務ルール）

- ヘッダは、列定義に日本語ラベル `label` がある場合はそれを優先し、無ければ列キーに応じた固定日本語名または英語名（ヘッダ言語指定がある場合。本コントローラ経路ではクエリに `header` を付けないため日本語側が既定）を使う。
- セル値はスカラー・真偽・日時を文字列に正規化し、日時は `Y-m-d H:i:s` 形式とする。
- 画像・タグ・カテゴリ・カラー・原価単価など複数値になり得る列は、バッチ内で別 SQL（`STRING_AGG` 等）により規格 ID 単位で上書きする。カード色は商品のカード詳細経由の `card_id` が無い場合は空とする。
- `unit_cost`（原価単価）は在庫 0 未満の扱いで文字列 `0`、それ以外は総原価／在庫の丸め（実装どおり）を文字列化する。

列キー一覧の全体はソース内の `ProductAllCsv::AVAILABLE_COLUMNS` を正とする（商品本体・規格・カード・カード詳細・部門などのブロックに分かれる）。

---

## 業務ルール・計算

本機能では金額の再計算や税率計算は行わない。DB 上の値と集約 SQL の結果をそのまま出力する。

### 入力項目（設定画面: CSV 出力項目）

商品のカスタム CSV を定義する「基本情報設定 › カスタム CSV」フォーム（CSV 種別が商品の画面）における、利用者が触る主要項目は次のとおり。ファイル名や `column_name` は運用で `dtb_csv` に保持される。

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| CSV 種別 | 必須 | 選択肢 | 画面 URL の種別 | 変更時は `location.href` で別種別の GET へ遷移。商品以外は本書の出力対象外。 |
| カスタム CSV | 任意 | 選択肢 | 新規 or 既存拡張 | `dtb_csv_extension`。プルダウン変更で同画面の別拡張を GET 表示。 |
| 出力名 | 必須 | テキスト（Symfony `TextType` 既定。DB は `dtb_csv_extension` の名称列の実スキーマに従う） | 既存時は保存済み名称 | 保存時に拡張エンティティへ反映。一覧プルダウンに表示される名称。 |
| 出力しない項目 | 任意 | 複数選択リスト | CSV 種別・既存選択に応じて `dtb_csv` から除外済み集合 | 保存時は「出力する項目」のみが中間テーブルへ書かれる。 |
| 出力する項目 | 任意 | 複数選択リスト | 既存拡張時は `rank` 順 | 画面上の順序が `dtb_csv_csv_extension.rank` になる。各行の `dtb_csv.column_name` がエクスポート列キーになる。 |

### エッジケース

| ケース | 扱い |
|--------|------|
| `column_name` が null または空 | その列はコントローラの列リストから除外。すべて空なら 404。 |
| `column_name` が定義に無いキー | サービスで黙って除外。有効キーが無ければ既定列。 |
| 拡張が論理削除済み | 404。 |
| 外部キー制約で削除失敗 | 設定画面でエラーメッセージ表示し、当該拡張の編集 URL へリダイレクトする。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧との一致 | 同じセッション検索条件であれば、一覧が使う問い合わせと同一関数から得た規格 ID で絞るため、一覧に出る規格行と出力行は対応する。 |
| リアルタイム性 | ダウンロード開始時点の DB 状態を読む。長時間ストリーム中の他操作との整合は保証しない。 |

---

## API/バッチ結果

本機能では外部 API 呼び出しやバッチ実行を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | HTTP パス `csvExtensionId`。本文・クエリはコントローラが列構成に使わない（列は DB の `column_name` のみ）。セッションの `eccube.admin.product.search`。設定画面では POST ボディ `admin_custom_csv` 配下。 |
| 成功時出力 | `text/csv` ストリーム、ファイル名 `product_custom{YmdHis}.csv`。 |
| 失敗時出力 | 404（不正拡張・列名皆無）。 |
| 副作用 | 参照のみ。設定の POST／DELETE 時のみ `dtb_csv_extension` と `dtb_csv_csv_extension` を更新。 |

---

## DBカラム

| テーブル | 列 | メモ |
|---------|-----|------|
| `dtb_csv_extension` | `id`, `name`, `csv_type_id`, `deleted_at` | 拡張の生存・種別判定に使用。 |
| `dtb_csv_csv_extension` | `csv_extension_id`, `csv_id`, `rank` | 出力順。 |
| `dtb_csv` | `id`, `csv_type_id`, `column_name`, `disp_name`, `sort_no` | エクスポートでは `column_name` が列キー。`disp_name` は設定画面の表示ラベル。 |

### DB操作

本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 検索 | dtb_csv / dtb_csv_csv_extension / dtb_csv_extension | 検索条件に合致するレコードを抽出する。抽出結果を所定フォーマットでファイル出力する。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| 設定フォーム・出力名 | `NotBlank`。 |
| カスタム CSV ダウンロード | リクエストボディの検証は行わない。拡張と列の実在チェックは 404 で表現。 |

---

## 権限・認可

| 利用者状態 | 画面・アクション |
|------------|------------------|
| 管理画面にログインしルートに到達できる主体 | プルダウンからの CSV ダウンロードおよび設定画面の表示・保存・削除が可能（管理エリアのロール設計に従う）。 |
| 未認証 | 管理画面共通の制約により到達しない。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 商品一覧で拡張を選択 | 同一タブで CSV ダウンロード URL（GET）。 |
| 商品一覧で設定を選択 | `custom_csv` 設定 GET。 |
| 設定で登録成功 | フラッシュ成功後、同一拡張の GET へリダイレクト。 |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| 一覧から CSV | セッション検索は変更しない | 検索条件に基づく CSV |
| 一覧から設定 | 同上 | CSV 種別 1（商品）のフォーム |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 不正または削除済み拡張、または列名が皆無 | HTTP 404。 |
| 設定削除で外部キーエラー | フラッシュエラー、編集画面へ遷移。 |

---

## 試行制限

本機能では試行制限を扱わない。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 本ルートの CSV ストリーム | 専用の `log_info` はコントローラに無い（`admin_custom_export` 側にはファイル名ログがあるが本ルートは別）。 |

### ログに出してはいけないもの

- パスワード
- CSRF トークン
- Cookie 値
- セッション ID の完全値

---

## セッション

### 本機能におけるセッション

| 観点 | 内容 |
|------|------|
| 商品一覧からの出力 | 読み取るのみ。キー `eccube.admin.product.search`。ページ番号キー `eccube.admin.product.search.page_no` は本ダウンロードでは参照しない。 |

### セッションへ保存しない情報

ダウンロード処理はセッションを更新しない。

---

## Cookie

本機能ではセッション Cookie 以外の専用 Cookie を扱わない。セッションの仕様は管理画面共通。

---

## 排他制御・トランザクション

CSV ダウンロードは読み取りのみ。設定保存はトランザクション内で拡張と中間行を更新する。

---

## 調査補助（grep 向け）

実装の所在: 商品一覧テンプレート `src/Eccube/Resource/template/admin/Product/index.twig`、エクスポート `src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php`（`csvCustomExport`）、出力本体 `src/Eccube/Service/ProductAllCsv.php`、拡張の集合 `src/Eccube/Repository/DtbCsvExtensionRepository.php`（`findActiveByCsvTypeId`）、設定 `src/Eccube/Controller/Admin/Setting/Shop/CustomerCsvController.php`。

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_product_all_csv_custom_export` … `GET, POST` … `/{admin_route}/product/product_all_csv_custom_export/{csvExtensionId}`（パス変数の CSV 拡張 ID に対応する列キー列と検索条件で `ProductAllCsv` を実行し、CSV を返す。）
- `m10-13_admin_base_setting_setting_shop_csv_custom` … `GET` … `/{admin_route}/setting/shop/custom_csv/{csvTypeId}/{csvExtensionId}`（商品用 CSV 拡張の新規・編集フォームを表示する。既定の `csvTypeId` は商品 CSV 種別（数値 1）。）
- `m10-13_admin_base_setting_setting_shop_csv_custom_update` … `POST` … `上記と同一パターン`（フォーム送信で拡張名・出力項目リストを保存する。）
- `m10-13_admin_base_setting_setting_shop_csv_custom_delete` … `DELETE` … `/{admin_route}/setting/shop/custom_csv/delete/{csvExtensionId}`（拡張と中間テーブル行を削除する。）
