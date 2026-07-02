# 商品管理 — 部門CSV入力

## 概要

管理画面「商品管理」に関連して、このリポジトリには部門まわりの CSV 投入が次の2系統ある。

1. 部門更新CSV（ナビ「商品CSV管理」配下の「部門更新CSV登録」）。商品コードと部門コードの対応を読み、`dtb_product_class.product_code` が一致する行の `section_id` を一括で付け替えまたはクリアする。
2. 部門CSV登録（ルート `m03-20_admin_product_product_department_csv_import`。画面タイトル翻訳キーは `admin.product.department_csv_upload`）。`mtb_section` に対し、部門IDの有無で新規 INSERT または既存行 UPDATE を行う。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。

確認値は EC-CUBE Enterprise の `src/Eccube` 配下（管理ルートプレフィックス `%eccube_admin_route%`）とする。部門一覧からの CSV ストリーミング出力は別紙 `m03-19_admin_product_product_section_csv_export.md` を正とする。部門一覧から開く「部門マスタ」用の雛形・POST 取込（`m03-18_admin_product_product_section_master_csv_upload` / `m03-18_admin_product_product_section_master_import`）はヘッダ行の並びが本書の「部門CSV登録」と異なるため、本書では仕様確定しない。

本機能のカスタマイズ区分はカスタマイズである。挙動の参照は現行リポ pf-eccube3 の HareruyaEc プラグイン実装を正とし、DB関連は ec-cube-enterprise を正とする。現行と移行先のスキーマ差は「リニューアル移行時の扱い」へ集約する。

対象はブラウザ経由の管理画面に限定する。

本文ではコントローラのメソッド単位の解剖を主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

DB関連の正典は ec-cube-enterprise とする。挙動は現行リポ pf-eccube3 の HareruyaEc プラグインを正とし、移行先との差は本節へ集約する。

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 部門マスタの列構成 | `mtb_section` は部門ID・部門名（`name`）・部門コード（`code`）・表示フラグ（`visible`）のみ。免税区分の列は無い。 | `mtb_section` に免税区分（`tax_free_division`）とスマレジ部門ID（`smaregi_category_id`）が加わる。 |
| 部門CSV登録の免税区分列 | 現行の部門マスタに免税区分列が無いため、当該列の取込は対象外。 | 本書の部門CSV登録が扱う免税区分は移行先の `mtb_section.tax_free_division` を正とする。 |
| 部門更新CSVの更新先 | `dtb_product_class` の `product_code` 一致行の `section_id` を更新または NULL 化。両者で同じ。 | 同左。 |
| 取込履歴 | 部門更新CSV成功時のみ `dtb_csv_import_history` へ記録。両者で同テーブル。 | 同左（種別 ID は移行先の `mtb_csv_import_type` を要確認）。 |

`mtb_section` の `name`／`code`／`visible`、`dtb_product_class` の `product_code`／`section_id`、`dtb_csv_import_history` は現行と移行先で同一スキーマである（免税区分・スマレジ部門ID列を除く）。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| ナビ「商品管理」→「商品CSV管理」→「部門更新CSV登録」 | `GET /{admin_route}/product/section/csv_upload` | 部門更新CSVの画面が開く。取込履歴テーブルが下に付く。 |
| 雛形ダウンロード（部門更新） | `GET /{admin_route}/product/section/csv_template` | `product_section_update.csv` が得られる。 |
| 部門更新のファイル送信 | `POST /{admin_route}/product/section/import` | 検証・取込後、常に `GET …/csv_upload` へリダイレクトされ、フラッシュで成否が分かる。 |
| 部門CSV登録画面の表示 | `GET /{admin_route}/product/department_csv_upload` | ファイル選択・一括登録ボタン、フォーマット表、雛形リンクが表示される。 |
| 部門CSV登録の送信 | `POST /{admin_route}/product/department_csv_upload` | 検証成功時は部門マスタが更新され、成功メッセージが付いた同系画面が返る。失敗時はエラー行メッセージとともに同画面。 |
| 雛形ダウンロード（部門マスタCSV登録） | `GET /{admin_route}/product/csv_template/department` | `department.csv` が得られる。 |

---

## フロント挙動

### 部門更新CSV（`csv_product_section.twig` / `base_csv_upload.twig`）

| 観点 | 内容 |
|------|------|
| 表示要素 | ブロックタイトルは「商品管理」。サブタイトルは翻訳キー `admin.product.product_section_csv`（日本語確認値「部門更新CSV登録」）。カード見出しは `admin.product.product_section_csv_upload_title` / `admin.product.product_section_csv_format_title`。メニューハイライトは `product` と `product_csv_management` と `m03-18_admin_product_product_section_import`。ファイル入力は Bootstrap の `custom-file`。受付は属性上 `.csv, text/csv, .tsv, text/tsv`。フォーマット表は「項目名」「説明」の2列表。必須列には「必須」バッジ。下部に取込履歴（ファイル名・アップロード日時・作業者）。履歴は「表示件数」プルダウンで `page_no` と `page_count` をクエリに載せて切替（件数選択肢は抽象コントローラ定数どおり 10, 50, 100, …, 12000）。 |
| JS 挙動 | ファイル名をラベルに反映。フォーム submit で `$.changeLoading(true)`。 |
| CSS・レイアウト | `base_csv_upload.twig` 内の `custom-file` 用スタイル。 |
| モーダル・ポップアップ | 送信前の確認ダイアログはない。 |

### 部門CSV登録（`csv_department.twig`）

| 観点 | 内容 |
|------|------|
| 表示要素 | タイトルは `admin.product.department_csv_upload`（日本語確認値「部門CSV登録」）。サブタイトルは商品管理。メニュー指定は `['product', 'section_csv_import']`（サイドナビの同一キーが `eccube_nav` に無い場合、ハイライトは実環境で要確認）。カード「CSVアップロード」内に隠しファイル入力とファイル名表示、送信ボタンは `admin.common.bulk_registration`（一括登録の文言）。フォーマット表は `headers` のループで、必須列にバッジ。 |
| JS 挙動 | 送信時にアップロード・雛形ボタンを無効化し、スピナーを表示（spin.js）。 |
| CSS・レイアウト | コア管理画面フレーム。 |
| モーダル・ポップアップ | なし。 |

---

## 処理フロー

### 部門更新CSV画面を表示する（GET `m03-18_admin_product_product_section_csv_upload`）

1. 管理画面の認証・共通制約を通過する。
2. フォーム種別 `admin_csv_import` でフォームを生成し、`handleRequest` する（GET では実質未送信）。
3. セッションとクエリ `page_count` / `page_no` から履歴のページサイズとページ番号を解決する（既定ページサイズ 10）。
4. 取込種別 ID が部門更新CSV用（実装確認値 `mtb_csv_import_type.id = 11`。定数名 `PRODUCT_SECTION_IMPORT_CSV_ID`）である履歴を、作成日時降順でページネーション取得する。
5. テンプレートへフォーム、`headers`（「商品コード」「部門コード」の説明は空文字）、必須キー一覧、ルート名、breadcrumb 用メニュー配列を渡し描画する。

### 部門更新CSVを取り込む（POST `m03-18_admin_product_product_section_import`）

1. 管理画面の認証・共通制約を通過する。
2. ログイン利用者を取得し、フォーム種別 `admin_csv_import` で `handleRequest` する。
3. フォームが妥当でなければ各エラーを管理者向けフラッシュエラーに積み、`GET m03-18_admin_product_product_section_csv_upload` へリダイレクトする。
4. `import_file` が無ければメッセージキー `admin.common.csv_invalid_format` を積み、同上へリダイレクトする。
5. アップロード内容の改行ベース概算行数が `5010` 以上なら（抽象コントローラ定数 `ADMIN_CSV_IMPORT_MAX_ROWS`）、`admin.csv.error.upload.maxrecord` を積み、同上へリダイレクトする。
6. 情報ログ「部門更新CSV登録開始」を出す。
7. ハンドラ「部門更新」用実装を紐づけた共通 `CsvImporter` にファイルを渡し `import` する。取込サービスは一時ディレクトリ（`eccube_csv_temp_realdir`）へ保存し、拡張子が `tsv` のとき区切りはタブ、それ以外は設定 `eccube_csv_import_delimiter`（配布確認値はカンマ）。囲み文字は `eccube_csv_import_enclosure`。
8. `import` 内では先にヘッダ行の存在と 2 行目以降のデータ有無を検証する。列定義は2列固定で、1行目の列名が定義と一致し、各行の列数が一致することを検証する。「商品コード」列は必須。「部門コード」列は任意（空なら後述のとおり部門紐付け解除）。
9. 各行について、(a) 商品コードが `existsByProductCode` で真になるまでの間に一件も無ければ、その行で全処理中断（breakAll）。エラーは翻訳メッセージストア経由。(b) 部門コードが空でなければ `mtb_section.code` で部門が見つかることを検証。見つからなければマスタ不存在エラーで breakAll。
10. 検証を通過した行では `dtb_product_class` に対し `product_code` が一致する全行の `section_id` を、部門コードが空なら `null`、非空なら該当部門の ID に更新する（ネイティブ `UPDATE`）。
11. 一定行数ごとに ORM flush と clear が走る（既定 100 行境界）。トランザクションは import 内で開始し、メッセージストアにエラーがなく break も無ければコミット、それ以外はロールバックする。
12. エラーがあれば「部門更新CSV登録 異常終了」ログと各エラーメッセージをフラッシュに積む。成功時は「部門更新CSV登録完了」ログ（件数付き）、成功フラッシュ `admin.register.complete`、そして取込履歴へファイル名と作業者を INSERT する。
13. いずれにせよ `GET m03-18_admin_product_product_section_csv_upload` へリダイレクトする。

### 部門CSV登録画面を表示する（GET `m03-20_admin_product_product_department_csv_import`）

1. `CsvImportType` のフォームを生成する。
2. `getDepartmentCsvHeader()` によりフォーマット表用のヘッダ定義を組み立て、`renderWithError` でテンプレート描画する（エラー collection が空なら通常表示）。

### 部門CSV登録を実行する（POST `m03-20_admin_product_product_department_csv_import`）

1. フォームを `handleRequest` し、妥当性失敗時はエラーメッセージを `_errors` に足して同画面を返す。
2. ファイル未選択時は `admin.common.csv_invalid_no_data` を積み、同画面。
3. 情報ログ「部門CSV登録開始」。
4. `getImportData` で CSV を読み込む。失敗時は `admin.common.csv_invalid_format`。必須ヘッダ（部門名・部門コード・免税区分。部門ID・表示フラグは任意列）が欠ける、またはデータ行が 0 なら同様。
5. DB トランザクションを開始する（実装確認値）。データ行ごとに次を実行する。
6. 部門ID列に非空値がある場合、数字のみでなければ「◯行目の部門IDが存在しません。」形式のエラーで打ち切り。数字なら該当 ID の `mtb_section` を取得。無ければ新規ではなく「更新対象の部門IDが存在しません。…空で登録」とメッセージして打ち切り。空なら新規 `MtbSection`。
7. 部門名・部門コードが空なら行番号付きエラーで打ち切り。非空なら前後空白除去して setter へ。
8. 免税区分が空ならエラーで打ち切り。非空なら trim した文字列を数値列へ渡す（コントローラに `strict_types` が無いため、数値文字列は整数化され得る。0・1・2 以外の整合性は追加検証なし）。
9. 表示フラグ列が非空なら値が文字列 `'1'` と一致する場合のみ真、それ以外は偽。列が空または空白のみなら偽。
10. エンティティを `persist` し、行ごとに `flush` する。
11. 全行成功後にコミット、情報ログ「部門CSV登録完了」、成功フラッシュ `admin.common.csv_upload_complete`、Doctrine キャッシュユーティリティでクリアする。
12. エラー時は `renderWithError` がロールバックし、テンプレートへエラー一覧を渡す。

---

## 集計条件

本機能では売上・在庫の集計は行わない。

---

## 部門更新CSV取込時の判定順序（概要）

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | フォーム妥当性・ファイル必須 | 失敗時はエラーフラッシュしアップロード画面へリダイレクト。 |
| 2 | 行数概算が 5010 未満か | 以上なら `admin.csv.error.upload.maxrecord` でリダイレクト。 |
| 3 | `CsvImporter` の事前検証（ヘッダ・データ行の存在） | 失敗時は結果のエラー配列をフラッシュ。 |
| 4 | 各行の列数・必須・商品存在・部門コードのマスタ存在 | いずれかで breakAll なら以降の行は処理されず、トランザクションはロールバック。 |
| 5 | コミット | 成功時のみ取込履歴 INSERT。 |

---

## 部門CSV登録時の判定順序（概要）

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | フォーム・ファイル | 失敗時は同画面にエラー表示。 |
| 2 | CSV 形式・必須ヘッダ・データ 1 行以上 | 失敗時は同画面。 |
| 3 | 部門ID列の形式と既存行の有無 | 不正・不存在なら当該行メッセージで打ち切り。 |
| 4 | 部門名・部門コード・免税区分の非空 | 失敗時は当該行メッセージで打ち切り。 |
| 5 | コミット・キャッシュクリア | 成功フラッシュを積み同テンプレート表示。 |

---

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| 部門更新CSVの同一商品コード | `product_code` に一致する複数の `dtb_product_class` が存在する場合、同一 UPDATE 条件によりまとめて同じ `section_id` になる。 |
| 部門コード空 | 部門更新CSVで部門コードが空（トリム後）のとき、`section_id` を `null` にする。 |
| 部門CSV登録の新規と更新 | 部門ID列が空なら新規行。非空で既存 ID が取れればその行を更新。 |
| 免税区分の取りうる値 | メッセージ定義上は 0 対象外・1 一般品・2 消耗品。実装は空チェックのみ。 |

本機能では金額計算や締め処理は行わない。

### 入力項目

#### 部門更新CSV

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| CSVファイル選択 | 必須 | ファイルサイズ上限は設定 `eccube_csv_size` をメガバイト単位で Symfony `File` 制約に渡す（配布 `eccube.yaml` では 5）。画面は CSV/TSV を選択可能 | 未選択 | フォーム項目キー `import_file`。一時ディレクトリ経由で `CsvImporter` へ渡す。 |

#### 部門CSV登録

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| CSVファイル選択 | 必須 | 同上 | 未選択 | フォーム項目キー `import_file`。`getImportData` へ渡る。受付 MIME は UI 上 `text/csv,text/tsv`。 |

CSV 行内の各列の最大長は、フォーム型の文字長制約ではなく DB 定義に依存する。部門名・部門コードのエンティティ定義はいずれも 128 文字（`Types::STRING`, length 128）。

### エッジケース

| ケース | 扱い |
|--------|------|
| 部門更新CSVで先頭データ行が不正 | breakAll により後続行は処理されず、トランザクションはロールバックされる。 |
| 部門更新CSVの行数が上限ちょうど | `countCsvRows` が改行数ベースのため、環境・末尾改行で境界付近は実測が安全。 |
| 部門CSV登録で免税区分に任意文字列 | 空でなければ通過し得る（数値以外の厳密拒否は実装されていない）。 |
| 部門CSV登録は行数上限チェック無し | `ADMIN_CSV_IMPORT_MAX_ROWS` は部門更新CSVの POST のみで使用。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 部門更新CSV成功後 | 同一 DB を参照する商品規格一覧・詳細は再表示で `section_id` の変更が見える。ORM を経由しない UPDATE のため、同一リクエスト内の永続コンテキストと表示のズレはあり得る。 |
| 履歴 | 部門更新CSVのみ `dtb_csv_import_history` に残る。部門CSV登録は履歴テーブルへ書かない。 |
| 失敗時 | 部門更新CSVはロールバックにより当該リクエストの更新はコミットされない。部門CSV登録もエラー時はロールバック。 |

---

## API/バッチ結果

本機能では API 呼び出し・バッチ実行を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | multipart の `import_file`、フォーム CSRF。各部門系 CSV は UTF-8 または設定配列 `eccube_csv_import_encoding` に基づく検出・変換（インポータ系の既定経路）。 |
| 成功時出力 | 部門更新CSVは 302 でアップロード画面へ戻り成功フラッシュ。部門CSV登録は 200 で同一画面に成功フラッシュ。 |
| 失敗時出力 | 部門更新CSVはエラーフラッシュのみでリダイレクト。部門CSV登録は画面内 `errors` リストとテンプレート。 |
| 副作用 | `mtb_section` の INSERT/UPDATE、または `dtb_product_class.section_id` の UPDATE。Doctrine メタデータキャッシュのクリア（部門CSV登録成功時）。情報ログ。 |

---

## DBカラム

| テーブル | 列 | メモ |
|---------|-----|------|
| `dtb_product_class` | `product_code`, `section_id` | 部門更新CSVで `product_code` 一致行の `section_id` を更新または NULL。 |
| `mtb_section` | `id`, `name`, `code`, `tax_free_division`, `visible`, … | 部門CSV登録の新規・更新対象。スマレジ部門 ID 等は本 CSV では触れない。 |
| `dtb_csv_import_history` | 種別・ファイル名・作成日時・作業者 | 部門更新CSV成功時のみ追加（種別 ID 11）。 |

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_csv_import_history / dtb_product_class / mtb_section | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| 部門更新CSV | フォーム `NotBlank`/`File` 最大サイズ。インポータのヘッダ一致・列数・必須列・参照マスタ存在。 |
| 部門CSV登録 | 同上に加え、必須ヘッダ集合の包含、部門IDの数字形式、既存 ID の実在、名称・コード・免税区分の非空。 |

---

## 権限・認可

| 利用者状態 | 部門更新CSV 3 ルート | 部門CSV登録・雛形 |
|------------|----------------------|---------------------|
| 未ログイン（一般客） | 管理画面ログインへ誘導される | 同上 |
| 管理画面ログイン済み | アクセス可（ロール細分はセキュリティ設定の範囲） | 同上 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 部門更新 POST 完了 | `GET /{admin_route}/product/section/csv_upload` |
| 部門CSV登録 POST 完了（成功・一部失敗を問わずテンプレート再描画の実装） | 同一 URL の HTML 応答 |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| 部門更新の履歴ページング | GET/POST のクエリまたはセッションに `page_no`, `page_count` を保持 | リダイレクト先 GET ではセッション値が引き続き使われる。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 部門更新で行数超過 | `admin.csv.error.upload.maxrecord` をフラッシュしてアップロード画面へ。 |
| 部門更新で商品未存在・部門未存在 | `CsvImporter` のメッセージをフラッシュしてアップロード画面へ。トランザクションロールバック。 |
| 部門CSV登録で形式・必須欠如 | 画面内エラーまたは翻訳メッセージ。ロールバック。 |
| CSRF 不正 | フォーム検証失敗経路（部門更新はリダイレクト、部門登録はフォームエラー表示）。 |

---

## 試行制限

本機能ではログイン試行制限（セキュリティーの throttling）以外の、CSV 専用レート制限は実装されていない。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 部門更新CSV POST 開始 | 情報ログ「部門更新CSV登録開始」 |
| 部門更新CSV 成功 | 情報ログ「部門更新CSV登録完了」と件数 |
| 部門更新CSV 失敗 | 情報ログ「部門更新CSV登録 異常終了」 |
| 部門CSV登録 | 情報ログ「部門CSV登録開始」「部門CSV登録完了」 |

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
| 部門更新CSVの履歴ページング | キー文字列は `admin.product.section_csv.page_count` および `admin.product.section_csv.page_no` をセッションキーとして用いる。 |
| フラッシュ | 成功・エラーメッセージは Symfony フラッシュバッグ経由で次 GET に表示。 |

### セッションへ保存しない情報

- アップロードファイルの実体（一時ファイルはディスク。完了後は削除される実装経路が多い）。

---

## Cookie

本機能独自の Cookie は使わない。セッション Cookie は管理画面ファイアウォールの共通設定に従う。

---

## 排他制御・トランザクション

| 観点 | 内容 |
|------|------|
| 部門更新CSV | `CsvImporter` が DB トランザクションと行ロックタイムアウト（ハンドラ既定 5 秒範囲内）を設定し、エラー時はロールバックする。 |
| 部門CSV登録 | 親コントローラがトランザクションを張り、行途中失敗でロールバックする。 |
| 楽観ロック | 当機能は `mtb_section` のバージョン列を検証しない。 |

---

## 調査補助（grep 向け）

ルート名 `m03-18_admin_product_product_section_csv_upload`, `m03-18_admin_product_product_section_import`, `m03-20_admin_product_product_department_csv_import`, `admin_product_csv_template`（`type=department`）。ハンドラ実装は `ProductSectionUpdateImportHandler`。部門マスタ CSV の Legacy 取込本文は `CsvImportController::csvDepartment`。

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `m03-18_admin_product_product_section_csv_upload` … `GET` … `/{admin_route}/product/section/csv_upload`（部門更新CSVのフォーム、フォーマット表、雛形ダウンロード、取込履歴ページネーションを表示する。）
- `m03-18_admin_product_product_section_import` … `POST` … `/{admin_route}/product/section/import`（部門更新CSVを検証・取込し、成否に応じてフラッシュを積み、`GET m03-18_admin_product_product_section_csv_upload` へリダイレクトする。）
- `m03-18_admin_product_product_section_csv_template` … `GET` … `/{admin_route}/product/section/csv_template`（部門更新CSVのヘッダのみの雛形 `product_section_update.csv` を返す。）
- `m03-20_admin_product_product_department_csv_import` … `GET, POST` … `/{admin_route}/product/department_csv_upload`（部門CSV登録の画面を表示する。POST では部門マスタを検証・登録し、エラー時は同画面、成功時は成功フラッシュ付きで同テンプレートを再表示する。）
- ``admin_product_csv_template`（`type=department`）` … `GET` … `/{admin_route}/product/csv_template/department`（部門CSV登録用のヘッダのみ雛形 `department.csv` を返す。）
