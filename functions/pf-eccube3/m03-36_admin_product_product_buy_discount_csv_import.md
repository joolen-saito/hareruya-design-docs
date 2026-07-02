# m03-36_admin_product_product_buy_discount_csv_import（管理画面_商品管理_買取減額率変更CSV登録）

## 概要

管理画面の「商品管理」配下で、CSV により商品の買取減額率（移行先 `dtb_product.buy_discount_id`、現行は補助表 `dtb_product_sub.buy_discount_id`）を一括更新する機能である。サイドバー表示名は「買取減額率変更CSV登録」。画面サブタイトルは「買取減額率変更CSVアップロード」。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。

実装の確認値は EC-CUBE 3 系リポジトリ `pf-eccube3` の HareruyaEc プラグイン（Silex のルート定義・`ProductCsvController`・`ProductBuyDiscountImportHandler` 等）とする。Symfony 化された `ec-cube-enterprise` 単体には、本機能用の専用 HTTP ルートは現時点で無いが、`mtb_csv_import_type.id = 13` の名称「買取減額率変更登録」は enterprise のマイグレーションでも登録される。

本機能のカスタマイズ区分は現行踏襲である。挙動の参照リポは現行の pf-eccube3 とし、DB関連（テーブル名・列名・型・制約・関連、保存先・扱い、副作用のDB更新）は ec-cube-enterprise を正とする。現行は買取減額率を補助表 `dtb_product_sub` に保持するが、移行先 ec-cube-enterprise には `dtb_product_sub` が無く、買取減額率は `dtb_product.buy_discount_id` に統合されている。本書のDB記述は移行先名を主とし、現行名を括弧で添える。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 買取減額率の保存先 | 補助表 `dtb_product_sub.buy_discount_id` を UPDATE | 補助表 `dtb_product_sub` は無く、`dtb_product.buy_discount_id`（`mtb_buy_discount` への外部参照列）に統合されている |
| 商品の実在・非削除確認 | `dtb_product.product_id` と `del_flg` で確認 | `dtb_product` に `del_flg` 列が無く、公開状態は `product_status_id`（`mtb_product_status`）で表す。CSV取込時の実在・非削除判定の列対応は ec-cube-enterprise 実装で要確認 |
| 買取減額率マスタ | `mtb_buy_discount.id` | 同一スキーマ。`mtb_buy_discount.id` が存在 |
| 取込種別・履歴 | `mtb_csv_import_type.id = 13`、`dtb_csv_import_history` | 同一スキーマ。`mtb_csv_import_type`・`dtb_csv_import_history` が存在 |

現行は補助表 `dtb_product_sub` に買取減額率を持つが、移行先では商品本体 `dtb_product` の列へ統合される点が主たる差分である。商品の論理削除列 `del_flg` は移行先に存在しないため、取込時の実在判定の置き換えは ec-cube-enterprise 実装で要確認とする。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| 管理画面メニュー「商品管理」→「CSV管理」内「買取減額率変更CSV登録」 | `GET /{admin_route}/product/product_buy_discount_csv_upload` | アップロードフォーム、フォーマット説明表、直近のインポート履歴が表示される。 |
| 雛形ファイルダウンロード | `GET /{admin_route}/product/product_csv_template/buyDiscount` | `product_buy_discount.csv` 名で、BOM 付き UTF-8 のヘッダ 1 行だけのファイルが返る。 |
| CSV 選択してアップロード | `POST /{admin_route}/product/product_buy_discount_csv_upload` | 検証・更新が走る。成功時は成功フラッシュと履歴追記。失敗時はエラーを画面に列挙し、トランザクションはロールバックされる。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | ページタイトルブロックは「商品管理」。サブタイトルは Twig で「買取減額率変更CSVアップロード」。`CSVファイル選択` ラベル、`import_file` の file 入力（`accept` に `text/csv,text/tsv`）、`CSVファイルのアップロード` ボタン、フォーマット表（ヘッダ定義のキー／説明セル）、下部に「CSVインポート履歴」（ファイル名・アップロード日時・作業者名）。 |
| JS 挙動 | `card-csvimport.js` とスピナー用 `spin.min.js` を読み込む。送信時の利用者側の CSV 内容検証は行わない。 |
| CSS・レイアウト | 本機能専用の大きな独自レイアウトは無く、他の CSV アップロード系と同一親テンプレート系である。 |
| モーダル・ポップアップ | 取込前の確認ダイアログは無い。 |

---

## 処理フロー

### 画面を表示する（GET `m03-36_admin_product_product_buy_discount_csv_import`）

1. 管理者として認証済みであることを前提とする。
2. `admin_csv_import` フォームを生成する（ファイル欄は必須制約あり）。
3. ヘッダ説明配列を組み立てる（後述「CSV 列とヘッダ」）。
4. メンバ向けソフトデリートフィルタを外す処理を挟み、`csvImportTypeId = 13` でインポート履歴を新しい順に最大 100 件取得する。
5. Twig `HareruyaEc/Resource/template/admin/Product/csv_product_buy_discount.twig` で描画する。

### 雛形をダウンロードする（GET `admin_product_csv_template` の `type=buyDiscount`）

1. `set_time_limit(0)` を実行する。
2. `StreamedResponse` のコールバックで、`php://output` に UTF-8 BOM（3 バイト）を書き込み、続けて `fputcsv` でヘッダ行のみを出力する。区切り文字は `config['csv_export_separator']`。列名は「商品ID」「買取減額率(ID)」の 2 つのみ。
3. `Content-Type: application/octet-stream`、`Content-Disposition: attachment; filename=product_buy_discount.csv` を付与して返す。

### CSV を取り込む（POST `admin_product_buy_discount_csv_upload`）

1. `set_time_limit(0)` を実行する。
2. フォームを束ね、Symfony のバリデーション（必須ファイル、最大サイズ `config['csv_size']` MB、MIME 制約 `CsvMimeType`）を通す。失敗時は各エラーを管理画面用フラッシュに積み、GET 描画と同様のテンプレートへ戻す。
3. `countCsvRows` で改行を数え、値が `5010` 以上ならエラーメッセージ（最大レコード数、`CSV_IMPORT_MAX` と一致する文言）を出して同画面へ戻す。カウントは引用符で囲まれたフィールド内の改行を除いた上での `\n` 出現回数である。
4. 情報ログに「買取減額率変更CSV登録開始」を出す。
5. `CsvImporter` に `ProductBuyDiscountImportHandler` を渡して `import` を呼ぶ。
6. 結果にエラーがあれば情報ログに「買取減額率変更CSV登録 異常終了」を出し、テンプレートの `errors` にメッセージ一覧を渡して再描画する。成功時は成功フラッシュ（`admin.product.csv_import.save.complete`）、完了ログと処理件数、かつ `csv_import_type` id 13 としてインポート履歴に元ファイル名と操作者を挿入する。
7. 成功・失敗どちらでも同一テンプレートでレスポンスする（リダイレクトではなく render）。

### 取込サービス内部（`CsvImporter`）

1. アップロードファイルを一時ディレクトリに保存し、内容を読み込む。
2. Windows かつ PHP7 以上ではロケール設定後、`UTF-8` と判定されれば `SJIS-win` に変換する。その他環境では UTF-8 以外を検出した場合に UTF-8 へ変換する。改行は `Str::convertLineFeed` で正規化し、ゼロ幅スペースや BOM 相当のバイト列を除去する。
3. 拡張子が `tsv` のとき区切りはタブ、それ以外は `config['csv_import_delimiter']`。囲み文字は `config['csv_import_enclosure']`。
4. 先頭行をヘッダとみなし、2 行目以降に 1 件もデータが無ければ事前エラーとする。
5. DB コネクションでトランザクション開始。行ロックタイムアウトをハンドラの既定（5 秒）に一時変更する。
6. 各行について検証（列数・列名存在・列ごとのバリデータ）し、`onReadRow` で買取減額率列（移行先 `dtb_product.buy_discount_id`、現行は補助表 `dtb_product_sub`）を更新する。100 行ごとに flush とエンティティキャッシュクリアを挟む。
7. メッセージストアにエラーが残り、かつ `breakAll` により打ち切りが発生した場合はロールバック、そうでなければコミットする（汎用実装の成功判定式に依存する）。
8. 一時ファイルを削除する。

---

## 集計条件

本機能では売上集計や件数サマリは行わない。履歴テーブルは成功完了時に 1 行追加されるのみである。

---

## 買取減額率変更 CSV 取込時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | フォーム妥当性（必須・サイズ・MIME） | 失敗時はフラッシュのみ、取込は実行しない。 |
| 2 | 行数上限（`countCsvRows` が 5010 以上） | エラーメッセージで中断。 |
| 3 | ヘッダ行の有無・データ行の有無 | `CsvImporter` 事前検証でエラー配列を返し取込中断。 |
| 4 | 1 行あたりの列数が 2 と一致するか | 一致しない場合は列数不正として全体打ち切り。 |
| 5 | セルが列定義の名前で参照可能か・各列のバリデータ | 商品 ID は必須かつ非負整数形式。買取減額率 ID は空欄可。値ありなら非負整数形式かつ `mtb_buy_discount` に存在する ID であること。 |
| 6 | `dtb_product` に該当行があり、かつ無効化されていないか（現行は `del_flg` で判定。移行先 ec-cube-enterprise には `del_flg` が無く判定列は要確認） | 無い場合は商品不存在エラーで全体打ち切り。 |
| 7 | 上記を通過した行 | 買取減額率列（移行先 `dtb_product.buy_discount_id`、現行は補助表 `dtb_product_sub`）を UPDATE。 |

---

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| 更新単位 | 1 CSV 行につき 1 商品 ID。規格（`dtb_product_class`）ごとの更新は行わない。 |
| NULL の意味 | 買取減額率列が空のとき、変換結果は `null` であり、`UPDATE` の `buy_discount_id` に null がセットされる実装である。 |
| 重複商品 ID | 同一ファイル内に同一商品 ID が複数行あれば、後から処理された行が最終的な値を残す（エラーにはしない）。 |
| 他列の扱い | 現行は既存の補助表 `dtb_product_sub` を取得し、説明・サイズ・割引率などは CSV 以外の現行値のまま `UPDATE` 文に載せる。移行先 ec-cube-enterprise では買取減額率は `dtb_product.buy_discount_id` へ統合される。 |

本機能では金額や率の再計算は行わない。買取価格の再計算は別処理の正とする。

### 入力項目

画面の入力は CSV ではなくファイル選択のみである。以下は画面ラベル単位とする。

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| CSVファイル選択 | 必須 | `config['csv_size']` MB まで（Symfony `File` 制約） | なし | アップロード一時領域へ保存後、取込パイプラインが読み取る。MIME は `CsvMimeType` により検証。 |

### CSV データ列（論理）

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 商品ID | 必須 | 桁上限は商品 ID 列の符号なし整数バリデータに従う（別途 `NumericMaxLength` は商品 ID 列には未付与） | なし | 更新対象の `dtb_product.product_id`。存在・非削除を原生 SQL で確認（現行は `del_flg` 参照。移行先 ec-cube-enterprise には `del_flg` が無く判定列は要確認）。 |
| 買取減額率(ID) | 任意 | `createUnsignedNumericColumn` の既定により桁上限用 `NumericMaxLength` は付かない | 空欄可 | `dtb_product.buy_discount_id`（現行は補助表 `dtb_product_sub.buy_discount_id`）。空欄は NULL。値ありは `mtb_buy_discount.id` に存在すること。 |

### エッジケース

| ケース | 扱い |
|--------|------|
| 商品は存在するが補助表 `dtb_product_sub` に行が無い（現行） | 現行で `getProductSubByProductId` が null を返すと、取得結果に対するメソッド呼び出しで実行時例外となりうる。トランザクションはロールバック方向である。移行先 ec-cube-enterprise では買取減額率が `dtb_product` に統合されるため補助表の不在は起きない。 |
| 途中行で検証エラー（商品不存在・マスタ不存在など） | `breakAll` により以降の行は処理されず、メッセージストアに複数件が載る。 |
| 同一取込での部分的コミット | トランザクション単位のため、打ち切り時はコミットされない設計である。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 商品本体との関係 | 検証は `dtb_product` のみを参照する。更新は買取減額率列（移行先 `dtb_product.buy_discount_id`、現行は補助表 `dtb_product_sub.buy_discount_id`）に対して行う。現行で画面の商品詳細がサブを参照していれば連動して見えるが、本体のみを読む経路があれば一致しない場合がある。移行先では同一テーブルへ統合される。 |
| インポート履歴 | 成功時のみ `dtb_csv_import_history` に記録する。失敗時は追記されない。移行先・現行とも同一スキーマ。 |
| ORM キャッシュ | 100 行ごとに flush とクリアを行うため、長大ファイルでもメモリを抑える意図がある。 |

---

## API/バッチ結果

本機能では管理画面外の API 呼び出し・バッチ実行を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | マルチパートの `import_file`、CSRF トークン（フォーム名前 `admin_csv_import`）。 |
| 成功時出力 | 同一 URL の HTML。成功フラッシュ。履歴 1 件追加。 |
| 失敗時出力 | 同一 URL の HTML。フィールド／行ごとのエラーメッセージ（テンプレート上は赤文字）。 |
| 副作用 | 買取減額率列（移行先 `dtb_product.buy_discount_id`、現行は補助表 `dtb_product_sub.buy_discount_id`）の更新、トランザクションログ、情報ログ、成功時のみ CSV 履歴（`dtb_csv_import_history`）。 |

---

## DBカラム

| テーブル | 列 | メモ |
|---------|-----|------|
| `dtb_product`（現行は補助表 `dtb_product_sub`） | `buy_discount_id` | 本取込が変更する主たる列。移行先では商品本体 `dtb_product` の列、現行は補助表 `dtb_product_sub` の列。 |
| `mtb_buy_discount` | `id` | CSV 値の参照整合性チェックに使用（存在しなければエラー）。移行先・現行とも同一スキーマ。 |
| `dtb_product` | `product_id`（現行は `del_flg` も参照） | 商品の存在チェックに使用。移行先には `del_flg` 列が無く、実在・非削除判定の列対応は ec-cube-enterprise 実装で要確認。 |
| `mtb_csv_import_type` | `id = 13` | 名称「買取減額率変更登録」（マイグレーション定義の確認値）。移行先にも存在。 |

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_product / dtb_product_sub / mtb_buy_discount / mtb_csv_import_type | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| ファイル未選択 | Symfony `NotBlank`。 |
| ファイルサイズ超過 | `config['csv_size']` MB 上限。 |
| CSV MIME | カスタム制約 `CsvMimeType`（バリデータ実装は別ファイル）。 |
| 商品 ID | 空でなく、符号なし整数形式。商品マスタ存在・非削除。 |
| 買取減額率 ID | 空ならスキップ。値ありなら符号なし整数形式かつ `mtb_buy_discount` に存在。 |

---

## 権限・認可

| 利用者状態 | 本画面・POST |
|------------|----------------|
| 管理画面にログインし、当プラグインの商品 CSV メニューに到達できる管理者 | 表示・取込とも許可される実装である。細かなロール分岐は URL 単位の Symfony Security 設定を正とする。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| GET | 同一 URL のフォーム画面 |
| POST 成功 | 同一 URL を再描画（リダイレクトなし） |
| POST 失敗 | 同一 URL を再描画 |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| POST 後 | フラッシュメッセージをセッションに積む場合がある | フォームは再表示。履歴は DB 最新（成功時は 1 件増える可能性）。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| フォーム不正 | フラッシュに各メッセージ。 |
| 行数オーバー | 翻訳メッセージで最大件数を提示。 |
| CSV 形式・ヘッダ・行検証 | `CsvImporter` の `MessageStore` 経由で行番号付きメッセージをテンプレートに渡す。 |
| 例外 | コネクションはロールバックを試み、例外を再送出する。 |

---

## 試行制限

本機能ではアカウント単位の試行制限を扱わない。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 取込開始 | 情報ログ「買取減額率変更CSV登録開始」 |
| 正常完了 | 情報ログ「買取減額率変更CSV登録完了」と `count` |
| 検証失敗で打ち切り | 情報ログ「買取減額率変更CSV登録 異常終了」 |

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークン
- Cookie 値
- セッション ID の完全値

---

## セッション

フラッシュメッセージと CSRF トークンに依存する。取込処理自体が独自のセッションキーに成否を書き込む実装は無い。

---

## Cookie

セッション用 Cookie はフレームワーク既定に従う。本機能独自の Cookie 操作は無い。

---

## 排他制御・トランザクション

- 取込全体は単一トランザクションに載る。
- 行ロックタイムアウトはインポートハンドラの `getLockTimeout` が返す秒値（1 以上 30 以下、既定 5）に一時変更する。
- 楽観ロック番号による衝突検知は本ハンドラでは扱わない。

---

## 調査補助（grep向け）

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `m03-36_admin_product_product_buy_discount_csv_import` … `GET` … `/{admin_route}/product/product_buy_discount_csv_upload`（アップロード画面表示・履歴一覧の取得）
- `admin_product_buy_discount_csv_upload` … `POST` … `/{admin_route}/product/product_buy_discount_csv_upload`（選択ファイルの取込実行）
- `admin_product_csv_template` … `GET` … `/{admin_route}/product/product_csv_template/buyDiscount`（雛形 CSV（UTF-8 BOM 付き 1 行ヘッダのみ）のダウンロード）
