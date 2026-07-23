# m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）

## 概要

管理画面の「商品管理」→「商品CSV管理」→「商品公開CSV登録」から開く画面で、アップロードした CSV に従って各商品の公開ステータス（`mtb_product_status` の選択）と支店向け公開フラグを一括更新する機能である。ナビおよびページ見出しの翻訳キー `admin.product.product_status_csv` では「商品公開CSV登録」と表示される。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値は EC-CUBE Enterprise の `src/Eccube` 配下とする。

本機能のカスタマイズ区分はカスタマイズである。挙動の参照リポは現行の pf-eccube3 とし、DB関連（テーブル名・列名・型・制約・関連、保存先・扱い、副作用のDB更新）は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 公開ステータス | `dtb_product.product_status_id`（`mtb_product_status` 参照） | 同一スキーマ。`dtb_product.product_status_id`・`mtb_product_status` が存在 |
| 支店の商品公開フラグ | `dtb_product.is_branch_published` | 同一スキーマ。`dtb_product.is_branch_published`（論理、コメント「支店の商品公開ステータス」、既定 true）が存在 |
| 取込履歴 | `dtb_csv_import_history` | 同一スキーマ。`file_name`・`create_date`・`csv_import_type_id`・`member_id` が存在 |

本機能が参照・更新するテーブル・列は現行と移行先で同一スキーマである。差分は確認できない。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| ナビ「商品管理」→「商品CSV管理」→「商品公開CSV登録」 | `GET /{admin_route}/product/status/csv_upload` | アップロード画面が開き、フォーマット表と履歴が表示される。 |
| 雛形ダウンロード | `GET /{admin_route}/product/status/csv_template` | `product_status_template.csv` が得られる。 |
| アップロード送信 | `POST /{admin_route}/product/status/import` | 検証・取込後、常に `GET …/product/status/csv_upload` へリダイレクトされ、フラッシュで結果が示される。 |
| 履歴の表示件数変更 | `GET /{admin_route}/product/status/csv_upload?page_no=…&page_count=…` | クエリの件数が許容リストに含まれるときだけセッションに保存される。ページ番号はその都度セッションへ書き戻される。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | `@admin/Product/csv_product_status.twig` は共通テンプレート `@admin/Product/base_csv_upload.twig` を継承する。ブロック `sub_title` は翻訳キー `admin.product.product_status_csv`（表示文言は「商品公開CSV登録」）。タイトル行は共通フレームの「商品管理」。サイドメニュー鍵は `product`・`product_csv_management`・`admin_product_status_import`。カード見出しは `admin.product.product_status_csv_upload_title`（「商品公開CSV」）およびフォーマット見出し `admin.product.product_status_csv_format_title`。ファイル入力の `accept` は `.csv`, `text/csv`, `.tsv`, `text/tsv`。続いてフォーマット説明表。必須列には「必須」バッジ。説明セルはコントローラの連想配列の値（例: 商品公開列の雛形説明 `2:非公開 1:公開`）を `nl2br` で表示。雛形はカードヘッダ右のリンク。下部に履歴テーブル（共通 `csv_import_history.twig`）：ファイル名・日時（`Y-m-d H:i`）・作業者名、件数プルダウン、複数ページ時は共通ページャ。 |
| JS 挙動 | ファイル選択でカスタムラベルへファイル名表示。送信時に `$.changeLoading(true)`。履歴の件数プルダウン変更で選択 URL へ即時遷移。 |
| CSS・レイアウト | `base_csv_upload.twig` 内の `custom-file-input` とラベル装飾。 |
| モーダル・ポップアップ | 送信前確認ダイアログはない。 |

---

## 処理フロー

### アップロード画面を表示する（GET `m03-38_admin_product_product_status_csv_upload`）

1. 管理画面の認証・共通制約を通過する。
2. 管理者向け CSV 取込フォーム種別の空フォームを作成し、`handleRequest` でバインドする（画面上は主としてファイル送信のみだが、`force_file_to_db` 等の未定義入力は送信されず任意扱いでよい）。
3. `page_count` が抽象コントローラの許容リスト（10, 50, 100, 300, 500, 1000, 2000, 10000, 12000 の確認値）に含まれる場合のみセッションキー `admin.product.status_csv.page_count` を更新する。含まれないときは既定 50 とセッション残値から決める実装順序に従う。
4. `page_no` はクエリまたはセッション `admin.product.status_csv.page_no` で決め、セッションへ書き戻す。
5. 取込履歴クエリビルダを「CSV 種別が商品公開 CSV（確認値 14）」だけに限定し、ページネータで渡す。

### 雛形をダウンロードする（GET `m03-38_admin_product_product_status_csv_template`）

1. 管理画面の認証・共通制約を通過する。
2. CSV 出力サービスでストリームを開き、連想配列 `getCsvHeader()` のキー順で 1 行目のみを `fputcsv` 相当で書き、閉じる。値列は画面上の説明用文言でありヘッダ出力には使わない。
3. 文字エンコーディングは設定 `eccube_csv_export_encoding` に従い、UTF-8 指定時は BOM を先頭に書く共通実装である。区切り文字は `eccube_csv_export_separator`（配布既定はカンマ）。
4. ファイル名は `product_status_template.csv`。応答 `Content-Type` は `application/octet-stream`。`Content-Disposition` は添付とファイル名。

### CSV を取込む（POST `admin_product_status_import`）

1. ログイン利用者アカウントが履歴の作業者 ID になる前提で処理する。
2. 送信を `CsvImportType` にバインドする。妥当でない場合はフォーム直下のエラーを管理者向けフラッシュに積み、`GET m03-38_admin_product_product_status_csv_upload` へリダイレクトする（要確認：`$form->getErrors()` は浅い走査のため `import_file` 子要素の NotBlank/File 制約エラーは含まれず、制約違反のみの場合はフラッシュ無しでリダイレクトされる可能性がある）。
3. `import_file` が null の場合、キー `admin.common.csv_invalid_format` をフラッシュし、同様にリダイレクトする。
4. アップロードファイル全文について、ダブルクォート内の改行を除いたあとの改行数を数え、その値が `ADMIN_CSV_IMPORT_MAX_ROWS`（5010）以上なら `admin.csv.error.upload.maxrecord`（パラメータに当該上限）をフラッシュしリダイレクトする。この上限はインポータ内部での打ち切りではなく送信前チェックのみである。
5. 情報ログに「商品公開CSV登録開始」を出力する。
6. インポータに専用手継ハンドラ（公開ステータスと支店公開フラグの更新のみ）と、現在の ORM と翻訳器と共通設定参照・ログイン利用者アカウントを渡して `import` を実行する。
7. 結果にエラーが 1 件でもあれば「商品公開CSV登録 異常終了」をログし、各エラーを管理者向けフラッシュに積む。
8. エラーが無い場合、`admin.register.complete` を成功フラッシュに積む。「商品公開CSV登録完了」を件数パラメータ付きでログする。続けて `dtb_csv_import_history` へ種別 ID（確認値 14）・クライアント側オリジナルファイル名・利用者 ID を INSERT して flush する（種別実体が null のときだけ履歴側は無操作で返るリポジトリ実装）。
9. いずれの場合も `GET m03-38_admin_product_product_status_csv_upload` へリダイレクトする。

### 専用手継内部（確認値）

1. 共通ハンドラの列検証順に従い、列数 3・ヘッダ名でのセル参照・各列の必須検証および選択肢検証（公開ステータスは 1 と 2 の文字列、支店公開は 0 と 1 の文字列）を行う。
2. `onValidateRow` の追加処理として、整数化した商品 ID が `dtb_product` に 1 件存在するかをネイティブカウントで確認する。コメントでは廃止ステータスも存在扱いと書かれているが、後段の `onReadRow` では廃止の商品は更新をスキップする。不存在のときは `admin.csv.error.product.not_exists` 系メッセージを積み `breakAll` で以降行を処理しない。
3. `onReadRow` で商品を主キー取得し、`null` または現在の公開ステータスが廃止（ID 3）のときは `false` を返し当該行は件数にも含めない。それ以外はマスタから公開ステータスを取得して `setStatus`、支店列を整数の真偽へキャストして `setBranchPublished` する。
4. インポータはおおむね 100 行ごとに flush と `clear` を挟み、最後に再度 flush する。行ロックタイムアウトはハンドラ既定秒に一時的に切り替える。

---

## 集計条件

本機能では売上集計は行わない。履歴は「種別が商品公開 CSV 取込」の履歴のみを、`create_date` 降順でページングして表示する。

---

## CSV 検証および行反映時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | フォームのファイル妥当性・アップロードサイズ上限（`eccube_csv_size` をメガバイトにつけた Symfony `File` 制約） | 失敗時はリクエスト処理内でフラッシュのみ。DB トランザクションには入らない |
| 2 | 事前の改行行数カウント | `ADMIN_CSV_IMPORT_MAX_ROWS` 以上ならフラッシュのみで中止 |
| 3 | 一時ファイル化後、インポータ先頭チェックでヘッダ行および 2 行目以降のデータ行が読めること | ヘッダ形式エラーまたはデータ空エラーとなりインポータがエラー配列のみ返す |
| 4 | 各データ行の列数が 3 と一致すること | 不一致なら共通実装の列数エラーへ至り全体中断 |
| 5 | 各行の見出し名との対応および列ごとの必須・選択肢検証 | 失敗ごとに `breakAll`。最初の検証エラー検知で当該取込批次はコミットされない経路となる |
| 6 | 商品 ID の実在チェック（手継追加） | 不存在なら `breakAll` |
| 7 | 問題なければ ORM で `Product` を更新。廃止商品は読み飛ばしで件数に含めない | スキップ時もエラーメッセージは増えない |

---

## 業務ルール・計算

本機能における画面上の入力はファイル 1 系統のみであり、価格計算はない。

### 入力項目（画面上）

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| CSV ファイル | 必須 | Symfony `File` 制約で `eccube_csv_size` をメガバイト単位につけたサイズ上限（配布既定は 5M）。送信前チェックとして改行行数が抽象コントローラ定数 5010 未満であること（5010 以上でフラッシュのみで中止）。行数カウントはファイル全文を読む簡易方式でダブルクォート内改行は除く | 未選択 | アップロード済みオブジェクトから一時ディレクトリ `eccube_csv_temp_realdir` へ退避後にインポータが読込み、終了時に一時ファイルを削除試行する。取込成功時のみ履歴にクライアントオリジナルファイル名を残す |

### CSV の列仕様（雛形と同一の見出し名）

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 商品ID | 必須 | 整数化したうえで実在検証。桁上限の列挙は専用制約にない | データ行のみ | `dtb_product.id`。不存在なら全体中断。廃止商品は存在チェックでは落ちず後段でスキップ |
| 商品公開ステータス | 必須 | 文字列として許容は `1`（公開）と `2`（非公開）のみ。画面説明は `2:非公開 1:公開` | データ行のみ | `dtb_product.product_status_id` へ `mtb_product_status` の参照を設定 |
| 支店の商品公開ステータス | 必須 | 文字列として許容は `0`（非公開）と `1`（公開）のみ。画面説明は `0:非公開 1:公開` | データ行のみ | `dtb_product.is_branch_published` に PHP の真偽へキャストして保存（0 以外の整数は実質受け付けない） |

### エッジケース

| ケース | 扱い |
|--------|------|
| 商品の公開ステータスが廃止の行 | バリデーションでは通過しうるが `onReadRow` で何も更新せず `false` を返す。エラーフラッシュは出さず、完了時の取込件数にも含めない。 |
| リポジトリの `isProductExists` コメントと手継のスキップ | ネイティブ存在確認はステータスで絞らない一方、実更新は廃止を除外するため、コメントと実行結果が一致しない場合がある。実装を確認値とする。 |
| トランザクションがロールバックされた取込 | 履歴 INSERT はエラー結果のときは実行されず、フラッシュのみ。 |
| 区切り文字 | 拡張子が `tsv` のときタブ、それ以外は `eccube_csv_import_delimiter`（配布既定はカンマ）。囲み文字は `eccube_csv_import_enclosure`。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧と反映内容 | アップロード画面の説明テーブルは静的配列であり、実行後の自動再読込はしない。反映確認は別画面または再検索へ委ねる。 |
| 履歴一覧 | 「商品公開 CSV 取込」種別に絞られるため、ほか種別のアップロードは混ぜて表示しない。 |

---

## API/バッチ結果

本機能では外部 HTTP API またはバッチを起動しない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | `POST` multipart の `admin_csv_import[import_file]` および `_token`。 |
| 成功時出力 | `302` で `product/status/csv_upload` へのリダイレクトおよび成功フラッシュ。 |
| 失敗時出力 | 同上のリダイレクトに加え、管理者向けフラッシュおよびインポータ由来の多言語済み文言。 |
| 副作用 | 条件付きで `dtb_product` の公開列の更新、`dtb_csv_import_history` への INSERT、情報ログ複数種。 |

---

## DBカラム

機能が直接書き換えることを中心に列挙する。型細部はスキーマ実体を参照する。

| テーブル | 列 | メモ |
|---------|-----|------|
| `dtb_product` | `product_status_id` | `mtb_product_status` 外部参照。CSV 値 1 または 2 に対応する行のみ通過。 |
| `dtb_product` | `is_branch_published` | 論理。CSV の 0／1 から設定。 |
| `dtb_csv_import_history` | `file_name`, `create_date`, 種別・利用者との関連鍵列 | 取込エラーなく完了したときだけ INSERT。 |

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_csv_import_history / dtb_product / mtb_product_status | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| ファイル必須 | フォーム `NotBlank`。未選択送信は Symfony 側で不可。サーバ側 null チェックでも `admin.common.csv_invalid_format`。 |
| アップロードサイズ | 設定メガバイト上限。 |
| CSV レイアウト・型 | 列数 3、各見出し名一致、必須・選択肢。 |
| 商品実在 | 手継専用。廃止商品はここでは落とさない。 |

---

## 権限・認可

管理画面共通の認証を通過した利用者のみがルートへ到達する前提とする。本ドキュメントではロール細部を確定しない。

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| ナビまたはブックマークで画面を開く | `GET …/product/status/csv_upload`。 |
| 雛形・履歴操作 | 雛形は GET。履歴はクエリ再描画またはページャ。 |
| 送信完了（成功または失敗） | 常に `GET …/product/status/csv_upload` へのリダイレクト。 |

### 遷移時に引き続く状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| 表示件数・ページ変更 | セッションに `page_no` と条件付き `page_count` を保存する | GET 結果の履歴リストが選択したページサイズになる |
| アップロード後 | リダイレクト応答のみ。フォーム状態はサーバ側で保持しない | フラッシュで結果のみ残る |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| フォーム検証エラー・ファイル null・行数超過 | HTTP フラッシュのみ。インポータのトランザクション開始前またはインポータの早期終了のみ。 |
| ヘッダ不備／データ無し／行検証／商品不存在 | インポータがエラー結果を返し、コントローラがフラッシュに展開する。変更はコミットされない構成を取る共通実装側の判定に従う。 |
| インポータ内部の一般例外 | ロールバック試行後に例外を伝播させる。このコントローラは try-catch で握りつぶさない経路にある。 |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|
| M03-38-MSG-001 | 管理画面上部 | 要ソース確認 | 要ソース確認 | 要ソース確認 |
| M03-38-MSG-002 | 管理画面上部 | CSVのフォーマットが一致しません | CSVファイルを登録したときに、ファイルを読み込めないとき | 商品公開CSV登録画面に遷移する |
| M03-38-MSG-003 | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | 登録するCSVファイルの行数が上限以上のとき | 商品公開CSV登録画面に遷移する |
| M03-38-MSG-004 | 管理画面上部 | 要ソース確認 | 要ソース確認 | 要ソース確認 |
| M03-38-MSG-005 | 管理画面上部 | 登録が完了しました。 | 商品公開CSVの登録が完了したとき | 商品公開CSV登録画面に遷移する |

---

## 試行制限

本機能では試行制限を扱わない。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 取込処理に入った直後 | 「商品公開CSV登録開始」。 |
| 正常完了後 | 「商品公開CSV登録完了」と件数引数の連想情報。 |
| 結果にエラーが残ったとき | 「商品公開CSV登録 異常終了」。 |

### ログに出してはいけないもの

- パスワード類
- なりすまし対策トークンおよび CSRF トークンの原値過多
- Cookie 値およびセッション ID 完全値

---

## セッション

### 本機能におけるセッション

| 観点 | 内容 |
|------|------|
| 一覧ページング閲覧状態 | GET クエリ許容値に基づき `admin.product.status_csv.page_no` と条件付き `admin.product.status_csv.page_count` を更新する |

### セッションへ保存しない情報

- アップロードファイルの本文
- CSV データ行単位の中間状態

---

## Cookie

別紙である管理ログイン共通のセッション用 Cookie が前提のみで、機能固有 Cookie は増やさない。

---

## 排他制御・トランザクション

インポータが DB コネクション上で単一トランザクションとして取り込む。行ロックタイムアウトはハンドラ既定（数秒単位）。同一商品への競合同時取込における順序や待ちは運用側の確認事項であり、コード上楽観バージョン列は対象としない。

---

## 調査補助（grep 用途）

ソース上の名前を隔離記載する。

- アップロード・取込・雛形: `src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php`
- 行処理ハンドラ: `src/Eccube/Service/Csv/Importer/Event/ProductStatusUpdateImportHandler.php`
- 汎用インポータ: `src/Eccube/Service/Csv/Importer/CsvImporter.php`
- 共通アップロード UI: `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig`
- 機能ラッピングのみの Twig: `src/Eccube/Resource/template/admin/Product/csv_product_status.twig`
- UI 自動テスト: `tests/Eccube/Tests/Web/Admin/Product/Csv/ProductStatusCsvControllerTest.php`
- ハンドラ単体テスト: `tests/Eccube/Tests/Service/Csv/Importer/Event/ProductStatusUpdateImportHandlerTest.php`

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `m03-38_admin_product_product_status_csv_upload` … `GET` … `/{admin_route}/product/status/csv_upload`（アップロードフォーム、フォーマット説明表、雛形へのリンク、CSV 取込履歴のページネーションを表示する。）
- `admin_product_status_import` … `POST` … `/{admin_route}/product/status/import`（アップロードされた CSV を検証し取込処理を実行する。終了後は常に `GET m03-38_admin_product_product_status_csv_upload` へ HTTP リダイレクトする。）
- `m03-38_admin_product_product_status_csv_template` … `GET` … `/{admin_route}/product/status/csv_template`（ヘッダ行のみの雛形 `product_status_template.csv` を `application/octet-stream` で返す。）
