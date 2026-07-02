# m03-37_admin_product_product_storage_code_csv_import（管理画面_商品管理_略称タグ更新CSV登録）

## 概要

管理画面の「商品管理」→「略称タグ登録／編集」（ナビ論理キー `abbreviation_tags`）の一覧・編集画面ヘッダから「CSV取込」を開く略称タグ更新CSV登録である。略称タグマスタ（`mtb_storage_code`）を CSV または TSV で一括登録・更新する。画面の見出し文言は翻訳キー `admin.product.storage_code_csv_upload_title` により「略称タグ登録CSVアップロード」と表示されるが、ID 列を指定した既存行の上書きも行うため本書では業務呼称として「略称タグ更新CSV登録」とも呼ぶ。1 行目は日本語の列名「ID」「名称」「並び順」であり、カード CSV のような ASCII 論理キー行は使わない。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。

ec-cube-enterprise の管理ルート `admin_product_storage_code_csv`／`m03-16_admin_product_product_storage_code_import`、テンプレート `admin/Product/csv_product_storage_code.twig`、共有 CSV 取込基盤と略称タグ取込サービスを確認値とする。

本機能のカスタマイズ区分は現行踏襲である。挙動の参照リポは現行の pf-eccube3 とし、DB関連（テーブル名・列名・型・制約・関連、保存先・扱い、副作用のDB更新）は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド単位の解剖は本文の主説明としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 略称タグマスタ | `mtb_storage_code`（`name`・並び順 `rank`） | 同一スキーマ。`mtb_storage_code.name`（長さ 255）、並び順列 `rank`（予約語のため定義上はバッククォート付き、符号なし整数）が存在 |
| アルファベット順ソートフラグ | CSV では読み書きしない列 | 同一スキーマ。`mtb_storage_code.alphabet_sort_flg`（既定 false）が存在 |

並び順キーは現行・移行先とも `rank` であり、`sort_no` への置き換えは行われない。本機能が参照・更新するテーブル・列は現行と移行先で同一スキーマである。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| 略称タグ登録／編集画面ヘッダの「CSV取込」 | `GET /{admin_route}/product/storage_code/csv` | 取込専用画面が開く。 |
| 取込画面の「一覧へ戻る」 | `GET /{admin_route}/product/storage` | 略称タグ一覧・フォーム画面へ遷移する。 |
| 雛形ダウンロード | `GET /{admin_route}/product/storage_code/csv_template` | ヘッダのみの CSV ファイルが保存ダイアログで得られる。 |
| フッタの案内リンク（既存データの CSV 出力） | `GET /{admin_route}/product/storage_code/export` | 現行略称タグが CSV でダウンロードされる。 |
| ファイル選択後「アップロード」相当の送信ボタン | `POST /{admin_route}/product/storage_code/import` | 検証と取込が走り、成否メッセージ付きで GET 取込画面へリダイレクトされる。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | ブロックタイトルは商品管理。サブタイトルは `admin.product.storage_code_management`（翻訳により「略称タグ管理」）。カード見出しは `admin.product.storage_code_csv_upload_title`（「略称タグ登録CSVアップロード」）。ファイル選択は Bootstrap の `custom-file`。受付拡張子は属性で `.csv, text/csv, .tsv, text/tsv`。フォーマ表はコントローラが渡す `headers` のキー行と、値行（いずれも見た目はキーと同一文字列が並ぶ構成）。「ID」列の説明セルに任意列の注記。 |
| JS 挙動 | ファイル選択でラベルにファイル名を表示。フォーム submit 前に `$.changeLoading(true)` でローディング表示を付ける。 |
| CSS・レイアウト | `custom-file` の「参照」ラベルやラベル後ろの帯色を本テンプレート内 style で上書き。 |
| モーダル・ポップアップ | 取込前の確認ダイアログはない。 |

テンプレートに `import_errors` を渡す分岐は本コントローラの GET では行わない。エラーは主にフラッシュで次レスポンスに載る。

---

## 処理フロー

### 取込画面を表示する（GET `admin_product_storage_code_csv`）

1. 管理画面の認証・共通制約を通過する。
2. フォーム型 `admin_csv_import` でフォームを生成し、`handleRequest` する（GET では実質空）。
3. `getCsvHeader()` の連想配列をテンプレートの `headers` として渡し、Twig を描画する共有のファイル選択 UI のみを出す（`import_file` と CSRF のウィジェット）。フォーム定義上は他フィールドもあるが、本 Twig では描画しない。

### ファイルを取り込む（POST `m03-16_admin_product_product_storage_code_import`）

1. 管理画面の認証・共通制約を通過する。
2. `StorageCodeCsv` をインスタンス化する（ヘッダ定義・必須ヘッダ・必須外ヘッダはコントローラの private メソッドと同一内容）。
3. 同じく `admin_csv_import` のフォームを生成し `handleRequest` する。
4. `checkFormValid` で、送信・妥当性を検証する。不合格なら蓄積メッセージをエラーフラッシュに積み、一時データ削除を試み、GET `admin_product_storage_code_csv` へリダイレクトする。
5. `import_file` から `UploadedFile` を取り出す。無効・サイズ 0 ならメッセージキー `admin.common.csv_invalid_format` をエラーフラッシュに積み、同上でリダイレクトする。
6. 情報ログに「略称タグCSV登録開始」を出す。
7. 一時ディレクトリ（`eccube_csv_temp_realdir`）へランダム名で保存し、内容を読み込む。失敗やディレクトリ未設定なら `false` 相当となり、`admin.common.csv_invalid_format` でリダイレクトする。
8. 先頭 UTF-8 BOM があれば除去する。検出コードが UTF-8 以外なら UTF-8 へ変換する。改行を LF 系にそろえ、ゼロ幅・BOM 相当の除去を行う。拡張子が `tsv` のとき区切りはタブ、それ以外は `eccube_csv_import_delimiter`（既定はカンマ）。囲み文字は `eccube_csv_import_enclosure`。1 行目をヘッダとする `CsvImportService` を構築する。失敗時は `admin.common.csv_invalid_format` でリダイレクトする。
9. 期待キー一覧は `['ID','名称','並び順']` の `array_keys` 順。比較から除外するのは `['ID']` のみ。ファイル側ヘッダからも `'ID'` を除いた残りが、期待側から `'ID'` を除いた残りと順序・内容とも完全一致しなければならない。違反時は例外メッセージとして `admin.csv.error.format.header` が積まれる。
10. データ行が 1 行以上あるかを検証する。0 行なら `admin.csv.error.data.empty`。
11. ORM の SQL ログ出力を無効にする。
12. トランザクション開始後、行ごとに次を行う。行番号はヘッダを 1 行目としたときのデータ行の行番号（実装ではループ添字に 2 を足す）。
13. 行末が空要素なら 1 つ取り除く実装がある（末尾空列の抑止）。
14. 列数がヘッダ列数と一致するか検証する。不一致なら `admin.csv.error.format.body`（行番号埋め込み）。
15. 必須ヘッダは「名称」「並び順」。いずれかのセルが空文字なら `admin.csv.error.data.require`（ラベルと行番号埋め込み）。
16. 並び順の値が、このファイル内の既出の並び順と重複していれば `admin.storagecode.duplicate_csv_rank_error`（行番号埋め込み）。
17. 名称でリポジトリ検索し、既存行があり、かつ CSV の ID 列から解釈した id が既存行の id と一致しない場合は `admin.storagecode.duplicate_error`（行番号埋め込み）。
18. ID 列が無い・空・0 のときは新規エンティティ。正の整数で既存 id が取れればその行を更新対象とする。該当 id が DB に無いときは新規エンティティとして扱う（ファイル上の誤 id は新規作成に落ちる。実装を確認値とする）。
19. 名称と並び順だけを上書きし `persist` する。100 データ行ごとに flush と ORM キャッシュ解放を行う。
20. 全行後に flush、コミット、再度キャッシュ解放する。
21. 情報ログに「略称タグCSV登録完了」を出す。成功フラッシュ `admin.register.complete` を積む。一時ファイルを削除し、GET `admin_product_storage_code_csv` へリダイレクトする。

### 手順 9 以降で例外が出たとき

1. アクティブなトランザクションがあれば rollback する。
2. 情報ログに例外メッセージを残す。
3. 例外メッセージをエラーフラッシュに積む（多くは翻訳済み文言）。
4. 一時ファイル削除を試み、GET `admin_product_storage_code_csv` へリダイレクトする。

---

## 集計条件

本機能では件数集計や売上集計は行わない。

---

## 取込時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | フォーム送信・CSRF・ファイル必須・Symfony `File` の最大サイズ | 不合格ならエラーフラッシュ複数または単一、リダイレクトで取込画面へ。 |
| 2 | 一時保存と `CsvImportService` 構築 | 失敗時は `admin.common.csv_invalid_format`。 |
| 3 | ヘッダ（`ID` 除外後）が `名称`→`並び順` の順で期待と完全一致 | 違反時 `admin.csv.error.format.header`。 |
| 4 | データ行が 1 行以上 | 違反時 `admin.csv.error.data.empty`。 |
| 5 | 各行の列数がヘッダ列数と一致 | 違反時 `admin.csv.error.format.body`。 |
| 6 | 名称・並び順が空でない | 違反時 `admin.csv.error.data.require`。 |
| 7 | 同一ファイル内で並び順が一意 | 違反時 `admin.storagecode.duplicate_csv_rank_error`。 |
| 8 | 名称の一意（同一名称は同一 ID 更新時のみ許容） | 違反時 `admin.storagecode.duplicate_error`。 |
| 9 | トランザクションコミット | 失敗時は例外経路で rollback。 |

---

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| 新規と更新 | ID 列が無効または未解決なら新規 INSERT。既存 id が取れればその行の名称・並び順を更新。 |
| 並び順 | 文字列として読み取ったのち整数キャストで保存する。 |
| アルファベット順ソートフラグ | CSV では読み書きしない。新規行はエンティティ既定（偽）。既存行更新時は当該列を触らないため DB 上の現行値が維持される。 |

本機能では金額計算や締め日計算は行わない。

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| CSVファイル選択 | 必須 | ファイルサイズ上限は設定 `eccube_csv_size` メガバイト単位で Symfony `File` 制約に渡る（配布 `eccube.yaml` では 5）。拡張子は `.csv` または `.tsv` を選べる UI になっている。MIME の追加制約は本フォーム型では掛けていない | 未選択 | フォーム項目キー `import_file`。永続化はせず一時ファイル経由でパイプラインへ渡す。空ファイルは通常 `NotBlank` で弾かれる。 |

### エッジケース

| ケース | 扱い |
|--------|------|
| ヘッダのみでデータ行がない | `admin.csv.error.data.empty`。 |
| ID に DB に無い番号を書く | 新規行として作成される（実装を確認値とする）。 |
| 名称を既存の別 id が持つ値に変える | `admin.storagecode.duplicate_error`。 |
| 同一並び順を別行に書く | 後から処理する行で `admin.storagecode.duplicate_csv_rank_error`。 |
| 106 行以上の大量行 | 100 行境界で中間 flush と `clear` によりメモリを抑える。全体は 1 トランザクション。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧画面との一致 | 取込成功後は同一 DB を見る略称タグ一覧なら再表示で反映される。 |
| CSV に無い列 | アルファベット順ソートフラグ等は取込で変わらない。画面フォームと CSV を混在で運用すると、その列は画面操作時のみ変わり得る。 |
| 失敗時 | トランザクション rollback により、当該リクエスト中に処理した行はコミットされない。 |

---

## API/バッチ結果

本機能では API 呼び出し・バッチ実行を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | multipart の `import_file`、フォーム CSRF。期待ヘッダとデータ行。 |
| 成功時出力 | HTTP 302 で `admin_product_storage_code_csv`、フラッシュ成功 `admin.register.complete`。 |
| 失敗時出力 | HTTP 302 で同上、フラッシュにエラー文言。 |
| 副作用 | `mtb_storage_code` の INSERT または既存行の名称・並び順 UPDATE。一時ファイルの削除。情報ログ。 |

---

## DBカラム

本取込が直接書き換え対象とするのは次の範囲に限られる（新規時は id は自動採番）。

| テーブル | 列 | メモ |
|---------|-----|------|
| `mtb_storage_code` | `name` | 名称。ORM 上は 255 文字列。 |
| `mtb_storage_code` | `rank` | 並び順。符号なし整数。 |

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | mtb_storage_code | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| ファイル | Symfony `NotBlank`、`File` の `maxSize`（メガバイト＝`eccube_csv_size`）。 |
| ヘッダ・行 | 共有メソッドにより列集合・列数・必須セル・業務重複を検証。 |

名称の最大長はフォーム型の個別 Length ではなく、永続化先列長に依存する（255）。取込処理では文字列長の上限エラーは別レイヤで扱われ得る（実装を確認値とする）。

---

## 権限・認可

| 利用者状態 | 取込画面 GET | 取込 POST | 雛形・エクスポート GET |
|------------|--------------|-----------|-------------------------|
| 未ログイン | 管理画面ログインへ誘導される（共通） | 同上 | 同上 |
| 管理画面ログイン済み | 到達可（細かいロール制限はコアの管理権限設定を正とする） | 同上 | 同上 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 略称タグ一覧・編集から「CSV取込」 | GET 取込画面 |
| 取込成功・失敗のいずれも（コントローラのリダイレクト） | GET 取込画面（フラッシュのみ変わる） |
| 「一覧へ戻る」 | GET 略称タグ一覧（`admin_product_storage_code`） |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| POST 取込 | フラッシュに成功またはエラーを積む。一時ファイルを削除する | GET で空フォームに近い状態。メッセージはフラッシュ表示 |

略称タグ一覧側のセッションキー `admin.product.storage.page_no` 等は本 GET／POST では更新しない。

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| フォーム不正・ファイル未選択・サイズ超過 | 共有ヘルパが貯めたメッセージをフラッシュ、一時削除試行、取込画面へ |
| 文字コード・パース・一時ディレクトリ異常 | `admin.common.csv_invalid_format` |
| ヘッダ不一致 | `admin.csv.error.format.header` |
| データ 0 行 | `admin.csv.error.data.empty` |
| 列数不一致 | `admin.csv.error.format.body`（行番号） |
| 必須空 | `admin.csv.error.data.require` |
| 並び順のファイル内重複 | `admin.storagecode.duplicate_csv_rank_error` |
| 名称の他人 id との衝突 | `admin.storagecode.duplicate_error` |
| その他 Throwable | メッセージをログとフラッシュに載せ、rollback |

---

## 試行制限

本機能ではログイン試行制限やレート制限を独自に扱わない（管理画面ファイアウォール共通の throttling のみ）。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 取込開始直後 | 情報ログ「略称タグCSV登録開始」 |
| パース等で早期失敗 | 情報ログ「略称タグCSVインポートでエラーが発生しました」 |
| 登録処理中の例外 | 情報ログにメッセージ配列 |
| 正常終了直前 | 情報ログ「略称タグCSV登録完了」 |

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
| GET／POST 取込 | 略称タグ一覧用のページ番号セッションは読み書きしない。 |

### セッションへ保存しない情報

- アップロードファイル本体

---

## Cookie

本機能が独自に Cookie を書き換えない。セッション Cookie は管理画面ファイアウォール共通。

---

## 排他制御・トランザクション

取込本体は 1 接続上のトランザクションで囲む。楽観ロック列は持たない。別セッションからの同時取込と順序競合する余地は残る（アプリ層で直列化しない）。

---

## 調査補助（grep 向け）

実装の基準ファイルの例: `src/Eccube/Controller/Admin/Product/StorageCodeController.php`、`src/Eccube/Service/Csv/StorageCodeCsv.php`、`src/Eccube/Service/Csv/AbstractCsvService.php`、`src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig`、`src/Eccube/Form/Type/Admin/CsvImportType.php`。

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_product_storage_code_csv` … `GET` … `/{admin_route}/product/storage_code/csv`（アップロードフォーム、フォーマット説明表、雛形ダウンロード・一覧へ戻るリンクを表示する。）
- `m03-16_admin_product_product_storage_code_import` … `POST` … `/{admin_route}/product/storage_code/import`（multipart で送られたファイルを検証し、取込に成功したらフラッシュ成功を積み、GET `admin_product_storage_code_csv` へリダイレクトする。）
- `admin_product_storage_code_csv_template` … `GET` … `/{admin_route}/product/storage_code/csv_template`（ヘッダ行のみの雛形 CSV をダウンロード応答として返す（本画面からリンク）。）
- `m03-15_admin_product_product_storage_code_export` … `GET` … `/{admin_route}/product/storage_code/export`（現行マスタを CSV でダウンロードする（フッタ案内の参照先。取込パイプライン本体ではない）。）
