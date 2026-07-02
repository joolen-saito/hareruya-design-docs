# m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）

## 概要

管理画面の「商品管理」→「商品CSV管理」→「部門更新CSV登録」から開く画面で、アップロードした CSV に従って商品規格（`dtb_product_class`）の部門（`section_id`）を一括で更新する機能である。CSV の「商品コード」は規格の商品コード列（DB 上は `product_code`）に一致する行を対象とし、「部門コード」は部門マスタ（`mtb_section.code`）から部門 ID を引いて設定する。部門コードが空または空白のみの行では `section_id` を未設定（SQL の NULL）に書き換える。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値は EC-CUBE Enterprise の `src/Eccube` 配下とする。

本機能のカスタマイズ区分はカスタマイズである。挙動の参照リポは現行の pf-eccube3 とし、DB関連（テーブル名・列名・型・制約・関連、保存先・扱い、副作用のDB更新）は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 更新対象列 | `dtb_product_class.section_id`（部門ID）を `product_code` 一致で更新 | 同一スキーマ。`dtb_product_class.product_code` は長さ 255、`section_id` は `mtb_section` への外部参照列で確認値も一致 |
| 部門マスタ | `mtb_section`（`code`→`id` 解決） | 同一スキーマ。`mtb_section.id`・`code`（長さ 128）が存在 |
| 取込履歴 | `dtb_csv_import_history` | 同一スキーマ。`file_name`・`create_date`・`csv_import_type_id`・`member_id` が存在 |

本機能が参照・更新するテーブル・列は現行と移行先で同一スキーマである。差分は確認できない。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| ナビ「商品管理」→「商品CSV管理」→「部門更新CSV登録」 | `GET /{admin_route}/product/section/csv_upload` | アップロード画面が開き、フォーマット表と履歴が表示される。 |
| 雛形ダウンロード | `GET /{admin_route}/product/section/csv_template` | `product_section_update.csv`（ヘッダのみ）が得られる。 |
| アップロード送信 | `POST /{admin_route}/product/section/import` | 検証・取込後、常に `GET …/section/csv_upload` へリダイレクトされ、フラッシュで結果が示される。 |
| 履歴の表示件数変更 | `GET /{admin_route}/product/section/csv_upload?page_no=…&page_count=…` | クエリの件数が許容リストに含まれるときだけセッションに保存される。ページ番号はその都度セッションへ書き戻される。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | `@admin/Product/csv_product_section.twig` は `@admin/Product/base_csv_upload.twig` を継承する。ブロック `sub_title` は翻訳キー `admin.product.product_section_csv`（画面では「部門更新CSV登録」）。タイトル行は共通フレームの「商品管理」。サイドメニュー鍵は `product`・`product_csv_management`・`m03-18_admin_product_product_section_import`。カード見出しは `admin.product.product_section_csv_upload_title` と `admin.product.product_section_csv_format_title`。ファイル入力の `accept` は `.csv`・`text/csv`・`.tsv`・`text/tsv`。フォーマット表はコントローラの `getCsvHeader()` のキー・値（説明セルはいずれも空文字の確認値）。「商品コード」列には必須バッジ（`getRequiredCsvHeader()` のキーに含まれる列のみ）。続けて共通 `csv_import_history.twig`。 |
| JS 挙動 | ファイル選択でカスタムラベルへファイル名表示。送信時に `$.changeLoading(true)`。履歴の件数プルダウン変更で選択 URL へ即時遷移。 |
| CSS・レイアウト | `base_csv_upload.twig` 内の `custom-file-input` とラベル装飾。 |
| モーダル・ポップアップ | 送信前確認ダイアログはない。 |

---

## 処理フロー

### アップロード画面を表示する（GET `m03-18_admin_product_product_section_csv_upload`）

1. 管理画面の認証・共通制約を通過する。
2. 管理者向け CSV 取込フォーム種別の空フォームを作成し、`handleRequest` でバインドする。
3. `page_count` が抽象コントローラの許容リスト（10, 50, 100, 300, 500, 1000, 2000, 10000, 12000 の確認値）に含まれる場合のみセッションキー文字列 `admin.product.section_csv.page_count` を更新する。
4. `page_no` はクエリまたはセッションキー文字列 `admin.product.section_csv.page_no` で決め、セッションへ書き戻す。
5. 取込履歴クエリビルダを「CSV 種別が部門更新 CSV（ID 11）」だけに限定し、ページネータで渡す。

### 雛形をダウンロードする（GET `m03-18_admin_product_product_section_csv_template`）

1. 管理画面の認証・共通制約を通過する。
2. `getCsvHeader()` のキー順で 1 行目のみを出力する CSV をストリーミング返却する（値側は雛形出力では使われず、キーがヘッダセルになる）。
3. ファイル名は `product_section_update.csv`。`Content-Type` は `application/octet-stream`。

### CSV を取込む（POST `m03-18_admin_product_product_section_import`）

1. ログイン利用者アカウントが履歴 INSERT の `member_id` として使われる。
2. `CsvImportType` に送信をバインドする。妥当でない場合は各フォームエラーを管理者向けフラッシュに積み、`GET m03-18_admin_product_product_section_csv_upload` へリダイレクトする。
3. `import_file` が null の場合、キー `admin.common.csv_invalid_format` をフラッシュし、同様にリダイレクトする。
4. アップロードファイル全文について、ダブルクォート内の改行を除いたあとの改行数を数え、その値が抽象コントローラ定数 `ADMIN_CSV_IMPORT_MAX_ROWS`（5010）以上なら `admin.csv.error.upload.maxrecord`（パラメータに当該上限）をフラッシュしリダイレクトする。
5. 情報ログに「部門更新CSV登録開始」を出力する。
6. 部門更新専用の手継ハンドラと ORM・翻訳器・共通設定・ログイン利用者を渡した汎用インポータで `import` を実行する。
7. 結果にエラーが 1 件でもあれば「部門更新CSV登録 異常終了」をログし、各エラーを管理者向けフラッシュに積む。
8. エラーが無い場合、`admin.register.complete` を成功フラッシュに積む。「部門更新CSV登録完了」を件数パラメータ付きでログする。続けて取込履歴リポジトリへ種別 ID 11・クライアントオリジナルファイル名・利用者 ID を渡して INSERT する（種別マスタ行が無い環境ではリポジトリが無操作で返る）。
9. いずれの場合も `GET m03-18_admin_product_product_section_csv_upload` へリダイレクトする。

### 専用手継内部（確認値）

1. `onBeforeImport` で列定義を初期化する。1 列目は商品コード列（必須）、2 列目は部門コード列（必須フラグは付けない）。
2. 共通実装により、データ行の列数が 2 でない場合や、ヘッダ名と列定義名の対応が取れない場合はエラーとなり `breakAll` で中断する。
3. 列単体検証で商品コードが必須（空は不可）。部門コードは文字列列として空も許容される。
4. `onValidateRow` の追加処理として、(a) 商品コードに一致する規格が存在しない場合は商品不存在エラーを積み `breakAll`。(b) 部門コードが空でないときに `mtb_section.code` が一致する行が無い場合はマスタ不存在エラーを積み `breakAll`。部門コードが trim 後空のときは (b) をスキップする。
5. `onReadRow` で `replaceSection(商品コード, 部門IDまたはnull)` を呼ぶ。更新は `UPDATE dtb_product_class SET section_id = ? WHERE product_code = ?` のパラメータバインディングによる native 実行で、`product_code` が一致するすべての規格行が対象となる。

---

## 集計条件

本機能では売上集計は行わない。履歴は種別 ID 11 のみを `create_date` 降順でページングする。

---

## CSV 検証および行反映時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | フォームのファイル妥当性・Symfony `File` のサイズ上限（`eccube_csv_size` をメガバイト単位に付与した値。配布既定は 5M） | 失敗時はリクエスト処理内でフラッシュのみ。DB トランザクションには入らない |
| 2 | 事前の改行行数カウント | 5010 以上ならフラッシュのみで中止 |
| 3 | 一時ファイル化後、インポータ先頭チェックでヘッダ行および 2 行目以降のデータ行が読めること | ヘッダ不正またはデータ空エラーとなりインポータがエラー配列のみ返す |
| 4 | 各データ行の列数が 2 と一致すること | 不一致なら共通メッセージストア経路で全体中断へ |
| 5 | 各行のヘッダ名対応と列検証（商品コード必須、部門コードは空可） | 失敗ごとに `breakAll` |
| 6 | 商品コードに対応する規格の実在 | 不存在なら `breakAll` |
| 7 | 部門コードが非空のとき `mtb_section.code` の実在 | 不存在なら `breakAll` |
| 8 | 問題なければ native UPDATE で `section_id` を設定または NULL クリア | 同一 CSV 内で同一商品コードが複数行あれば、各行ごとに UPDATE が繰り返され、最終行の値が残る |

---

## 業務ルール・計算

本機能における画面上の入力はファイル 1 系統のみであり、価格計算はない。ファイル内データ列は雛形の見出し行どおりとする。

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| CSV ファイル | 必須 | Symfony `File` 制約で `eccube_csv_size` をメガバイト単位につけたサイズ上限（配布既定は 5M）。送信前チェックとして改行行数が 5010 未満であること（5010 以上でフラッシュのみで中止）。行数カウントはファイル全文を読む簡易方式でダブルクォート内改行は除く。拡張子が `tsv` のときは区切りがタブになる | 未選択 | 一時ディレクトリ `eccube_csv_temp_realdir` へ退避後にインポータが読込み、終了時に一時ファイル削除を試行。成功時のみ履歴にオリジナルファイル名を記録 |

アップロードしたファイルのデータ行は、次の表どおり 2 列とする。

### ファイル内データ列

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 商品コード | 必須 | 文字列列として Symfony Length は付かない。DB 上の `dtb_product_class.product_code` は長さ 255 の確認値 | データ行のみ | 一致する規格の `product_code` を持つ行すべての `section_id` を更新対象とする |
| 部門コード | 任意 | 文字列列として桁上限の追加バリデータは無し | データ行のみ | trim 後が空なら `section_id` を NULL に更新。非空なら `mtb_section.code` で検索した ID をセット。存在しなければ当該行で全体中断 |

### エッジケース

| ケース | 扱い |
|--------|------|
| 部門を未設定に戻したい | 部門コード列を空にすると検証をスキップし、`section_id` が NULL に更新される。 |
| 同一商品コードを複数データ行に書く | 各行で UPDATE が走る。途中行でエラーが無ければすべて適用され、同一コードに対しては後勝ちとなる。途中で `breakAll` した場合はトランザクションがロールバックされ一行も確定しない。 |
| 同一 `product_code` を持つ規格が複数行 | いずれも同じ UPDATE の WHERE に該当し、まとめて同じ `section_id` に更新される。 |
| トランザクションがロールバックされた取込 | 履歴 INSERT は実行されず、フラッシュにエラーのみ。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧と反映内容 | アップロード画面は実行後も自動で CSV を再読込しない。規格の部門は別画面で確認する必要がある。 |
| 履歴一覧 | 種別 ID 11 に絞るため、他 CSV の履歴と混在しない。 |

---

## API/バッチ結果

本機能では外部 HTTP API またはバッチを起動しない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | multipart の CSV（または TSV）ファイル、CSRF トークン |
| 成功時出力 | PRG パターンで GET `m03-18_admin_product_product_section_csv_upload` へリダイレクトし、成功フラッシュとログ、履歴 1 件 INSERT |
| 失敗時出力 | 同上リダイレクトにエラーフラッシュ、異常時はログ文言「異常終了」。インポータ外例外は捕捉しない |
| 副作用 | `dtb_product_class.section_id` の一括更新、条件付きで `dtb_csv_import_history` への追記、情報ログ |

---

## DBカラム

| テーブル | 列 | メモ |
|---------|-----|------|
| `dtb_product_class` | `product_code`, `section_id` | 更新対象。`section_id` は外部キーで `mtb_section` を参照する想定の列である。 |
| `mtb_section` | `id`, `code` | 参照のみ（コード→ID 解決）。 |
| `dtb_csv_import_history` | `file_name`, `create_date`, `csv_import_type_id`, `member_id` | 成功時のみ INSERT。種別は ID 11。 |

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_csv_import_history / dtb_product_class / mtb_section | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| アップロードファイル | `CsvImportType` の `NotBlank` と `File`（最大サイズ）。未選択や不正時はフォームエラーまたは `admin.common.csv_invalid_format`。 |
| CSV 全体 | インポータのヘッダ・データ行存在チェック、区切り・囲みは共通 `CsvImportService` と設定 `eccube_csv_import_delimiter`・`eccube_csv_import_enclosure`。文字コードはサービス側フィルタで UTF-8 に寄せる経路がある（SJIS 系ファイルを含む）。 |
| 各行 | 列数 2、商品コード必須、規格実在、部門コード非空時は部門実在。 |

---

## 権限・認可

| 利用者状態 | 部門更新 CSV 画面・雛形・取込 POST |
|------------|-------------------------------------|
| 未ログインのゲスト | 管理画面ファイアウォールにより当パスへ到達しない想定 |
| ログイン済み管理者 | 実装個別のアノテーション制限は付けず、`/%eccube_admin_route%/` の共通ルールに従う |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| POST 取込の完了（成功・失敗いずれも） | `GET …/product/section/csv_upload` |
| ナビから開く | `GET …/product/section/csv_upload` |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| GET 画面で `page_count`／`page_no` をクエリ指定 | 許容値ならセッションキー `admin.product.section_csv.page_count` を更新。`page_no` は常にセッションへ書き戻し | 指定ページの履歴一覧 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| フォーム不正 | 管理者向けエラーフラッシュを積みリダイレクト |
| ファイル未選択（null） | `admin.common.csv_invalid_format` をフラッシュしてリダイレクト |
| 行数上限超過 | `admin.csv.error.upload.maxrecord` をフラッシュしてリダイレクト |
| インポータが返した検証エラー | 各メッセージをフラッシュに積みリダイレクト。DB はロールバック |
| 実行時例外（インポータ内部など） | 本コントローラは捕捉しないため、Symfony の例外処理に委ねられる |

---

## 試行制限

本機能ではレートリミットを設けない。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 取込開始直前 | 情報ログ「部門更新CSV登録開始」 |
| 取込正常終了 | 情報ログ「部門更新CSV登録完了」と件数パラメータ `count` |
| 取込がエラー結果 | 情報ログ「部門更新CSV登録 異常終了」 |

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
| 履歴ページング | キー文字列 `admin.product.section_csv.page_count` と `admin.product.section_csv.page_no` に保存する。値は整数。 |

### セッションへ保存しない情報

- アップロードファイルのバイナリ本文

---

## Cookie

本機能専用の Cookie は定義しない。セッション Cookie は管理画面全体の設定に従う。

---

## 排他制御・トランザクション

インポータは DB 接続のトランザクションを開始し、検証エラーで `breakAll` した場合はロールバックする。成功時のみコミットする。行ロックタイムアウトは手継の既定値（確認値 5 秒）をインポータが設定する。規格更新は ORM のエンティティではなく native UPDATE を用いる。

---

## 調査補助（grep向け）

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `m03-18_admin_product_product_section_csv_upload` … `GET` … `/{admin_route}/product/section/csv_upload`（アップロードフォーム、フォーマット説明表、雛形へのリンク、CSV 取込履歴のページネーションを表示する。）
- `m03-18_admin_product_product_section_import` … `POST` … `/{admin_route}/product/section/import`（アップロードされた CSV を検証し取込処理を実行する。終了後は常に `GET m03-18_admin_product_product_section_csv_upload` へ HTTP リダイレクトする。）
- `m03-18_admin_product_product_section_csv_template` … `GET` … `/{admin_route}/product/section/csv_template`（ヘッダ行のみの雛形 `product_section_update.csv` を `application/octet-stream` で返す。）
