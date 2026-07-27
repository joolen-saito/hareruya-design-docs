# 商品管理 — 棚番号更新CSV登録

## 概要

管理画面の「商品管理」→「商品CSV管理」→「棚番号更新CSV登録」から開く画面で、アップロードした CSV に従って商品規格（`dtb_product_class`）の棚番号（`shelf_number_id`）を一括で更新する機能である。CSV の「商品コード」は規格の商品コード（`dtb_product_class.product_code`）に一致する規格がデータベース上ちょうど 1 件であることを前提とし、「棚番号」列は棚番号マスタ（`dtb_shelf_number`）の主キー ID を表す。列を空にするか、解釈された ID が正でない場合は棚番号未設定（NULL）に書き換える。ナビゲーションの表示名の翻訳キーは `admin.product.product_shelf_number_csv`（値は「棚番号更新CSV登録」）である。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値は EC-CUBE Enterprise の `src/Eccube` 配下とする。

本機能のカスタマイズ区分は現行踏襲である。挙動の参照リポは現行の pf-eccube3 とし、DB関連（テーブル名・列名・型・制約・関連、保存先・扱い、副作用のDB更新）は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 更新対象列 | `dtb_product_class.shelf_number_id` を `product_code` 一致で更新 | 同一スキーマ。`dtb_product_class.product_code`（長さ 255）・`shelf_number_id`（`dtb_shelf_number` への外部参照列）が存在 |
| 棚番号マスタ | `dtb_shelf_number.id` | 同一スキーマ。`dtb_shelf_number.id` が存在 |
| 取込履歴 | `dtb_csv_import_history` | 同一スキーマ。`file_name`・`create_date`・`csv_import_type_id`・`member_id` が存在 |

本機能が参照・更新するテーブル・列は現行と移行先で同一スキーマである。差分は確認できない。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| ナビ「商品管理」→「商品CSV管理」→「棚番号更新CSV登録」 | `GET /{admin_route}/product/product_shelf_number_csv_import` | アップロード画面が開き、フォーマット表と履歴が表示される。 |
| 雛形ダウンロード | `GET /{admin_route}/product/shelf_number/csv_template` | `product_shelf_number_template.csv`（ヘッダのみ）が得られる。 |
| アップロード送信 | `POST /{admin_route}/product/product_shelf_number_csv_upload` | 検証・取込後、常に `GET …/product_shelf_number_csv_import` へリダイレクトされ、フラッシュで結果が示される。 |
| 履歴の表示件数変更 | `GET /{admin_route}/product/product_shelf_number_csv_import?page_no=…&page_count=…` | クエリの件数が許容リストに含まれるときだけセッションに保存される。ページ番号はその都度セッションへ書き戻される。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | `@admin/Product/csv_product_shelf_number_update.twig` は `@admin/Product/base_csv_upload.twig` を継承する。ブロック `sub_title` は翻訳キー `admin.product.product_shelf_number_csv`。タイトル行は共通フレームの「商品管理」。サイドメニュー鍵は `product`・`product_csv_management`・`shelf_number_csv_import`。カード見出しは `admin.product.product_shelf_number_csv_upload_title` と `admin.product.product_shelf_number_csv_format_title`。ファイル入力の `accept` は `.csv`・`text/csv`・`.tsv`・`text/tsv`。フォーマット表はコントローラの `getCsvHeader()` のキー・値（説明セルはコントローラ実装ではいずれも空文字の確認値）。「商品コード」列には必須バッジ（`getRequiredCsvHeader()` に含まれるキーのみ）。続けて共通 `csv_import_history.twig`。 |
| JS 挙動 | ファイル選択でカスタムラベルへファイル名表示。送信時に `$.changeLoading(true)`。履歴の件数プルダウン変更で選択 URL へ即時遷移。 |
| CSS・レイアウト | `base_csv_upload.twig` 内の `custom-file-input` とラベル装飾。 |
| モーダル・ポップアップ | 送信前確認ダイアログはない。 |

---

## 処理フロー

### アップロード画面を表示する（GET `m03-40_admin_product_product_shelf_number_csv_import`）

1. 管理画面の認証・共通制約を通過する。
2. 管理者向け CSV 取込フォーム種別の空フォームを作成し、`handleRequest` でバインドする。
3. `page_count` が抽象コントローラの許容リスト（10, 50, 100, 300, 500, 1000, 2000, 10000, 12000 の確認値）に含まれる場合のみセッションキー文字列 `admin.product.shelf_number_csv.page_count` を更新する。
4. `page_no` はクエリまたはセッションキー文字列 `admin.product.shelf_number_csv.page_no` で決め、セッションへ書き戻す。
5. 取込履歴クエリビルダを「CSV 種別が棚番号更新 CSV（定数 ID 15）」だけに限定し、ページネータで渡す。

### 雛形をダウンロードする（GET `admin_product_shelf_number_csv_template`）

1. 管理画面の認証・共通制約を通過する。
2. `getCsvHeader()` のキー順で 1 行目のみを出力する CSV をストリーミング返却する（値側は雛形出力では使われず、キーがヘッダセルになる）。
3. ファイル名は `product_shelf_number_template.csv`。`Content-Type` は `application/octet-stream`。

### CSV を取込む（POST `admin_product_shelf_number_csv_upload`）

1. ログイン利用者アカウントが履歴 INSERT の `member_id` として使われる。
2. `CsvImportType` に送信をバインドする。妥当でない場合は各フォームエラーを管理者向けフラッシュに積み、`GET m03-40_admin_product_product_shelf_number_csv_import` へリダイレクトする。
3. `import_file` が null の場合、キー `admin.common.csv_invalid_format` をフラッシュし、同様にリダイレクトする。
4. アップロードファイル全文について、ダブルクォート内の改行を除いたあとの改行数を数え、その値が本コントローラの定数 `ADMIN_CSV_IMPORT_MAX_ROWS` と定義される上限（実装確認値 110000）以上なら、`admin.csv.error.upload.maxrecord`（パラメータに当該上限）をフラッシュしリダイレクトする。
5. 情報ログに「棚番号更新CSV登録開始」を出力する。
6. 棚番号更新専用の手継ハンドラと ORM・翻訳器・共通設定・ログイン利用者を渡した汎用インポータで `import` を実行する。
7. 結果にエラーが 1 件でもあれば「棚番号更新CSV登録 異常終了」をログし、各エラーを管理者向けフラッシュに積む。
8. エラーが無い場合、`admin.register.complete` を成功フラッシュに積む。「棚番号更新CSV登録完了」を件数パラメータ `count` 付きでログする。続けて取込履歴リポジトリへ種別 ID 15・クライアントオリジナルファイル名・利用者 ID を渡して INSERT する（種別マスタ行が無い環境ではリポジトリが無操作で返る実装があり得る）。
9. いずれの場合も `GET m03-40_admin_product_product_shelf_number_csv_import` へリダイレクトする。

### 専用手継内部（確認値）

1. `onBeforeImport` で列定義を初期化する。1 列目は商品コード（必須）、2 列目は棚番号 ID 列（必須フラグは付けず、符号なし数値用バリデータを含む）。
2. 共通実装により、データ行の列数が 2 でない場合や、ヘッダ名と列定義名の対応が取れない場合はエラーとなり `breakAll` で中断する。
3. 列単体検証ののち、親の `onValidateRow` の後続として、(a) 商品コードに一致する規格件数が 0 なら商品不存在エラーを積み `breakAll`。(b) 2 件以上なら商品コード重複エラーを積み `breakAll`。(c) 棚番号セルが「空でない 正の整数」として解釈される場合のみ、その ID の棚番号マスタ行が存在するか検証し、存在しなければマスタ不存在エラーを積み `breakAll`。セルが空、または整数化して 0 以下なら (c) をスキップする。
4. `onReadRow` で `replaceShelfNumber(商品コード, 棚番号 ID または null)` を呼ぶ。更新は `UPDATE dtb_product_class SET shelf_number_id = ? WHERE product_code = ?` のパラメータバインディングによる native 実行である。検証が「同一コードがちょうど 1 件」のため、運用上は該当が 1 行に収まる想定だが、SQL 自体は一致するすべての行を更新する形だ。

---

## 集計条件

本機能では売上集計は行わない。履歴は種別 ID 15 のみを `create_date` 降順でページングする。

---

## CSV 検証および行反映時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | フォームのファイル妥当性・Symfony `File` のサイズ上限（`eccube_csv_size` をメガバイト単位に付与した値。配布既定は 5M） | 失敗時はリクエスト処理内でフラッシュのみ。DB トランザクションには入らない |
| 2 | 事前の改行行数カウント | 実装で定義した上限（確認値 110000）以上ならフラッシュのみで中止 |
| 3 | 一時ファイル化後、インポータ先頭チェックでヘッダ行および 2 行目以降のデータ行が読めること | ヘッダ不正またはデータ空エラーとなりインポータがエラー配列のみ返す |
| 4 | 各データ行の列数が 2 と一致すること | 不一致なら共通メッセージストア経路で全体中断へ |
| 5 | 各行のヘッダ名対応と列検証（商品コード必須。棚番号列は空なら数値検証スキップ、非空なら符号なし数値として妥当性） | 失敗ごとに `breakAll` |
| 6 | 商品コードに一致する規格の件数が 1 件であること | 0 件・2 件以上は `breakAll` |
| 7 | 棚番号セルが正の整数として与えられているとき、その ID の `dtb_shelf_number` が存在すること | 存在しなければ `breakAll` |
| 8 | 問題なければ native UPDATE で `shelf_number_id` を設定または NULL 相当のクリア | 同一 CSV 内で同一商品コードが複数行あれば各行で UPDATE が走る。途中で `breakAll` した場合はトランザクションがロールバックされ一行も確定しない |

---

## 業務ルール・計算

本機能における画面上の入力はファイル 1 系統のみであり、価格計算はない。ファイル内データ列は雛形の見出し行どおりとする。

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| CSV ファイル | 必須 | Symfony `File` 制約で `eccube_csv_size` をメガバイト単位につけたサイズ上限（配布既定は 5M）。送信前チェックとして改行行数が本コントローラの上限未満であること（実装確認値では上限 110000。以上でフラッシュのみで中止）。行数カウントはファイル全文を読む簡易方式でダブルクォート内改行は除く。拡張子が `tsv` のときは区切りがタブになる | 未選択 | 一時ディレクトリ `eccube_csv_temp_realdir` へ退避後にインポータが読込み、終了時に一時ファイル削除を試行。成功時のみ履歴にオリジナルファイル名を記録 |

アップロードしたファイルのデータ行は、次の表どおり 2 列とする。

### ファイル内データ列

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 商品コード | 必須 | 文字列列。列検証上の長さ上限は専用 `Length` によらない。DB 上の `dtb_product_class.product_code` は長さ 255 の確認値 | データ行のみ | 同一コードの規格がちょうど 1 件であることが検証される。更新 SQL の WHERE は `product_code` 一致 |
| 棚番号 | 任意 | 列は符号なし数値用。空のとき数値検証はスキップ。非空で数値でない場合は列検証で失敗し全体中断 | データ行のみ | 正の整数 ID が解釈されるときだけマスタ存在を確認し、`dtb_product_class.shelf_number_id` にその ID を書く。空、または 0 以下として解釈される値は NULL 更新（未設定）とする |

### エッジケース

| ケース | 扱い |
|--------|------|
| 棚番号を未設定に戻したい | 棚番号列を空にするか、0 または解釈上 0 以下の値にし、マスタ存在チェックを経ずに `shelf_number_id` を未設定に更新できる。 |
| 同一商品コードを複数データ行に書く | 検証は各行で行われる。いずれかの行で失敗するとトランザクション全体がロールバックする。すべて成功すれば各行で UPDATE が実行され、後行が前行を上書きしうる。 |
| 同一 `product_code` の規格が複数存在するデータ不整合 | 件数が 2 以上と判定され、重複エラーで全体中断する。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧と反映内容 | アップロード画面は実行後も自動で DB を再読込しない。規格の棚番号は別画面で確認する必要がある。 |
| 履歴一覧 | 種別 ID 15 に絞るため、他 CSV の履歴と混在しない。 |

---

## API/バッチ結果

本機能では外部 HTTP API またはバッチを起動しない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | multipart の CSV（または TSV）ファイル、CSRF トークン |
| 成功時出力 | PRG パターンで GET `m03-40_admin_product_product_shelf_number_csv_import` へリダイレクトし、成功フラッシュとログ、履歴 1 件 INSERT |
| 失敗時出力 | 同上リダイレクトにエラーフラッシュ、異常時はログ文言「異常終了」。インポータ外例外は捕捉しない |
| 副作用 | `dtb_product_class.shelf_number_id` の一括更新、条件付きで `dtb_csv_import_history` への追記、情報ログ |

---

## DBカラム

| テーブル | 列 | メモ |
|---------|-----|------|
| `dtb_product_class` | `product_code`, `shelf_number_id` | 更新対象。`shelf_number_id` は `dtb_shelf_number` への外部キー想定。 |
| `dtb_shelf_number` | `id` | 参照のみ（棚番号 ID の実在確認）。 |
| `dtb_csv_import_history` | `file_name`, `create_date`, `csv_import_type_id`, `member_id` | 成功時のみ INSERT。種別は確認値 15。 |

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_csv_import_history / dtb_product_class / dtb_shelf_number | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| アップロードファイル | `CsvImportType` の `NotBlank` と `File`（最大サイズ）。未選択や不正時はフォームエラーまたは `admin.common.csv_invalid_format`。 |
| CSV 全体 | インポータのヘッダ・データ行存在チェック、区切り・囲みは共通 `CsvImportService` と設定 `eccube_csv_import_delimiter`・`eccube_csv_import_enclosure`。 |
| 各行 | 列数 2、商品コード必須、規格件数ちょうど 1、棚番号が正の整数 ID と解釈されるときだけ棚番号マスタ実在を確認する。 |

---

## 権限・認可

| 利用者状態 | 棚番号更新 CSV 画面・雛形・取込 POST |
|------------|--------------------------------------|
| 未ログインのゲスト | 管理画面ファイアウォールにより当パスへ到達しない想定 |
| ログイン済み管理者 | 実装個別のアノテーション制限は付けず、`/%eccube_admin_route%/` の共通ルールに従う |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| POST 取込の完了（成功・失敗いずれも） | `GET …/product/product_shelf_number_csv_import` |
| ナビから開く | `GET …/product/product_shelf_number_csv_import` |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| GET 画面で `page_count`／`page_no` をクエリ指定 | 許容値ならセッションキー `admin.product.shelf_number_csv.page_count` を更新。`page_no` は常にセッションへ書き戻し | 指定ページの履歴一覧 |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M03-40-MSG-001 | 管理画面上部 | CSVのフォーマットが一致しません | （英訳なし） | フォームが有効であるにもかかわらず、import_file が null のとき | 管理画面_商品管理_棚番号更新CSV登録画面に遷移する |
| M03-40-MSG-002 | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | （英訳なし） | 上限を超える行数のCSVファイルを登録したとき | 管理画面_商品管理_棚番号更新CSV登録画面に遷移する |
| M03-40-MSG-004 | 管理画面上部 | 登録が完了しました。 | （英訳なし） | CSVファイルを正常に登録したとき | 管理画面_商品管理_棚番号更新CSV登録画面に遷移する |
| M03-40-MSG-003 | 管理画面上部 | CSVのフォーマットが一致しません。 ／ CSVデータが存在しません。 ／ CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。 ／ %d 行目の %s ではデータを取得できません。 ／ %s は必須項目です。 %d 行目のデータを確認してください。 ／ %d 行目の %s の値が異常です。 ／ %d 行目の商品コードの値 %s は重複して登録されてるため更新できません。 ／ %s : %s がマスターから取得できません。 %d 行目のデータを確認してください。 | （英訳なし） | CSVアップロードボタンを押下し、CSVのヘッダー形式またはデータ行の列数が不正、もしくはヘッダー以外のデータ行が存在しないとき | エラーフラッシュを設定し、棚番号更新CSVアップロード画面へ遷移する |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| フォーム不正 | 管理者向けエラーフラッシュを積みリダイレクト |
| ファイル未選択（null） | `admin.common.csv_invalid_format` をフラッシュしてリダイレクト |
| 行数上限超過 | `admin.csv.error.upload.maxrecord` をフラッシュしてリダイレクト |
| インポータが返した検証エラー | 各メッセージをフラッシュに積みリダイレクト。行別検証エラー時は DB をロールバック（取込前検証＝ヘッダ行不一致/データ行無しの場合は DB 未変更） |
| 実行時例外（インポータ内部など） | 本コントローラは捕捉しないため、Symfony の例外処理に委ねられる |

---

## 試行制限

本機能ではレートリミットを設けない。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 取込開始直前 | 情報ログ「棚番号更新CSV登録開始」 |
| 取込正常終了 | 情報ログ「棚番号更新CSV登録完了」と件数パラメータ `count` |
| 取込がエラー結果 | 情報ログ「棚番号更新CSV登録 異常終了」 |

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
| 履歴ページング | キー文字列 `admin.product.shelf_number_csv.page_count` と `admin.product.shelf_number_csv.page_no` に保存する。値は整数。 |

### セッションへ保存しない情報

- アップロードファイルのバイナリ本文

---

## Cookie

本機能専用の Cookie は定義しない。セッション Cookie は管理画面全体の設定に従う。

---

## 排他制御・トランザクション

インポータは DB 接続のトランザクションを開始し、検証エラーで `breakAll` した場合はロールバックする。成功時のみコミットする。行ロックタイムアウトは手継の既定値（確認値 5 秒）をインポータが設定する。規格更新は ORM のエンティティではなく native UPDATE を用いる。取込処理中は一定行ごとに ORM の `flush` と `clear` が走るが、本手継の更新は接続直実行の SQL であり、コミットまでは同一トランザクションに含まれる。

---

## 調査補助（grep向け）

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `m03-40_admin_product_product_shelf_number_csv_import` … `GET` … `/{admin_route}/product/product_shelf_number_csv_import`（アップロードフォーム、フォーマット説明表、雛形へのリンク、CSV 取込履歴のページネーションを表示する。）
- `admin_product_shelf_number_csv_upload` … `POST` … `/{admin_route}/product/product_shelf_number_csv_upload`（アップロードされた CSV を検証し取込処理を実行する。終了後は常に `GET m03-40_admin_product_product_shelf_number_csv_import` へ HTTP リダイレクトする。）
- `admin_product_shelf_number_csv_template` … `GET` … `/{admin_route}/product/shelf_number/csv_template`（ヘッダ行のみの雛形 `product_shelf_number_template.csv` を `application/octet-stream` で返す。）
