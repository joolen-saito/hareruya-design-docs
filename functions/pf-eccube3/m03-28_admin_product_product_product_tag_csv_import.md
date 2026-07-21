# m03-28_admin_product_product_product_tag_csv_import（管理画面_商品管理_商品タグ更新CSV登録）

## 概要

管理画面の「商品管理」→「商品CSV管理」→「商品タグ更新CSVアップロード」から開く画面で、アップロードした CSV に従って各商品の商品タグ紐付けを一括で置換する機能である。1 つのデータ行ごとに、当該商品に紐いていたタグはいったん削除され、CSV に列挙したタグのみが追加される。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値は EC-CUBE Enterprise の `src/Eccube` 配下とする。

本機能のカスタマイズ区分は現行踏襲である。現行挙動は pf-eccube3（HareruyaEc プラグイン）を参照し、永続化に関わるテーブル名・列名などのDB関連は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

DB関連の記述は ec-cube-enterprise の実装を正とする。商品タグ中間テーブルの列構成は現行（pf-eccube3 の HareruyaEc プラグイン）と移行先（ec-cube-enterprise）で差がある。

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|---------------------|-------------------------------|
| 商品タグ中間テーブルの主キー | `dtb_product_tag.product_tag_id` | `dtb_product_tag.id`。 |
| タグ参照列 | `dtb_product_tag.tag`（プラグインのネイティブ INSERT は列 `tag` へ書く） | `dtb_product_tag.tag_id`。タグ参照列は ec-cube-enterprise では `tag_id`。 |
| `base_info_id` 列 | プラグインの SQL コメント上の見直し対象として言及されるが、ネイティブ INSERT 文（`product_id` `tag` `creator_id` `create_date`）には現れない | ec-cube-enterprise の `dtb_product_tag` には `base_info_id` 列は存在しない。テナント／拠点識別を要する場合は ec-cube-enterprise 実装で要確認。 |
| 取込履歴 | `dtb_csv_import_history`（`file_name` `create_date` `csv_import_type_id` `member_id`） | 同一スキーマ。 |

タグ置換（全削除後の再挿入）の挙動・検証順序は現行（pf-eccube3）を参照し、移行先でも同等の標準実装が ec-cube-enterprise に取り込まれている。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| ナビ「商品管理」→「商品CSV管理」→「商品タグ更新CSVアップロード」 | `GET /{admin_route}/product/product_tag_csv_upload` | アップロード画面が開き、フォーマット表と履歴が表示される。 |
| 雛形ダウンロード | `GET /{admin_route}/product/product_tag/csv_template` | `product_tag_template.csv` が得られる。 |
| アップロード送信 | `POST /{admin_route}/product/product_tag/import` | 検証・取込後、常に `GET …/product_tag_csv_upload` へリダイレクトされ、フラッシュで結果が示される。 |
| 履歴の表示件数変更 | `GET /{admin_route}/product/product_tag_csv_upload?page_no=…&page_count=…` | クエリの件数が許容リストに含まれるときだけセッションに保存される。ページ番号はその都度セッションへ書き戻される。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | `@admin/Product/csv_product_tag.twig` は共通テンプレート `@admin/Product/base_csv_upload.twig` を継承する。ブロック `sub_title` は翻訳キー `admin.product.product_tag_csv`。タイトル行は共通フレームの「商品管理」。サイドメニュー鍵は `product`・`product_csv_management`・`product_tag_csv_import`。カード上部にファイル入力と「CSV アップロード」（翻訳キーに従う）送信ボタン。続いてフォーマット説明カードの表（項目名／説明）。必須列には「必須」バッジ。説明文言はコントローラが返す配列値のまま出力され `nl2br` される。雛形はカードヘッダ右のリンク。下部に履歴テーブル（共通 `csv_import_history.twig`）：ファイル名・日時（`Y-m-d H:i`）・作業者名、件数プルダウン（10〜12000 の所定セット）、複数ページ時は共通ページャを含める。 |
| JS 挙動 | ファイル選択でカスタムラベルへファイル名表示。送信時に `$.changeLoading(true)`。履歴の件数プルダウン変更で選択 URL へ即時遷移。 |
| CSS・レイアウト | `base_csv_upload.twig` 内の `custom-file-input` とラベル装飾。 |
| モーダル・ポップアップ | 送信前確認ダイアログはない。 |

---

## 処理フロー

### アップロード画面を表示する（GET `admin_product_product_tag_csv_upload`）

1. 管理画面の認証・共通制約を通過する。
2. 管理者向け CSV 取込フォーム種別の空フォームを作成し、`handleRequest` でバインドする（画面上は主としてファイル送信のみだが、`force_file_to_db` 等の未定義入力は送信されず任意扱いでよい）。
3. `page_count` が抽象コントローラの許容リスト（10, 50, 100, 300, 500, 1000, 2000, 10000, 12000 の確認値）に含まれる場合のみセッションキー `admin.product.product_tag_csv.page_count` を更新する。含まれないときは既定 10 とセッション残値から決める実装順序に従う。
4. `page_no` はクエリまたはセッション `admin.product.product_tag_csv.page_no` で決め、セッションへ書き戻す。
5. 取込履歴クエリビルダを「CSV 種別が商品タグ更新」だけに限定し、ページネータで渡す。

### 雛形をダウンロードする（GET `admin_product_product_tag_csv_template`）

1. 管理画面の認証・共通制約を通過する。
2. コントローラの連想配列 `getCsvHeader()` のキー順で 1 行目のみを出力する CSV をストリーミング返却する（値列は画面上の説明用文言であり出力には使わず、ヘッダは見出し名のみ）。
3. ファイル名は `product_tag_template.csv`。`Content-Type` は `application/octet-stream`。

### CSV を取込む（POST `admin_product_product_tag_import`）

1. ログイン利用者アカウントが取込の更新者 ID になる前提で処理する（カード商品 CSV 側で行われているような `set_time_limit(0)` 呼び出しは本実装にはない）。
2. 送信を `CsvImportType` にバインドする。妥当でない場合は各フォームエラーを管理者向けフラッシュに積み、`GET admin_product_product_tag_csv_upload` へリダイレクトする。
3. `import_file` が null の場合、キー `admin.common.csv_invalid_format` をフラッシュし、同様にリダイレクトする。
4. アップロードファイル全文について、ダブルクォート内の改行を除いたあとの改行数を数え、その値が `ADMIN_CSV_IMPORT_MAX_ROWS`（5010）以上なら `admin.csv.error.upload.maxrecord`（パラメータに当該上限）をフラッシュしリダイレクトする。この上限はインポータ内部での打ち切りではなく送信前チェックのみである。
5. 情報ログに「商品タグ更新CSV登録開始」（固定文言）を出力する。
6. インポータに専用手継ハンドラ（商品タグ置換のみ）と、現在の ORM と翻訳器と共通設定参照を渡して `import` を実行する。
7. 結果にエラーが 1 件でもあれば「商品タグ更新CSV登録 異常終了」をログし、各エラーを管理者向けフラッシュに積む。
8. エラーが無い場合、`admin.register.complete` を成功フラッシュに積む。「商品タグ更新CSV登録完了」を件数パラメータ付きでログする。続けて `dtb_csv_import_history` へ種別・クライアント側オリジナルファイル名・利用者 ID を INSERT して flush する（種別実体が null のときだけ履歴側は無操作で返るリポジトリ実装）。
9. いずれの場合も `GET admin_product_product_tag_csv_upload` へリダイレクトする。

### 専用手継内部（確認値）

1. 共通ハンドラの列検証順に従い、列数・ヘッダ名でのセル参照・各列検証・（本ハンドラは行全体バリデータ配列が空）
2. `onValidateRow` の追加処理として、データ行ごとに `dtb_product.id` が存在するかをネイティブカウントで確認する。コードコメントにあるとおり、廃止扱いの公開ステータスであっても「存在していれば対象」のままであり、状態による除外はしない。
3. 存在しない商品 ID が検知されたとき、メッセージストアに商品不存在エラー（キーは `admin.csv.error.product.not_exists` 系を経由）を載せ、`breakAll` で以降行を処理しない。
4. `onReadRow` で、取得した整数の商品 ID と、タグ ID 配列によりリポジトリの置換処理を渡すログイン利用者の ID と共に呼び出す。置換処理はネイティブ DELETE およびループ INSERT に分解される。

---

## 集計条件

本機能では売上集計は行わない。履歴は「種別が商品タグ CSV」の履歴のみを、`create_date` 降順でページングして表示する。

---

## CSV 検証および行反映時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | フォームのファイル妥当性・アップロードサイズ上限 | 失敗時はリクエスト処理内でフラッシュのみ。DB トランザクションには入らない |
| 2 | 事前の改行行数カウント | `ADMIN_CSV_IMPORT_MAX_ROWS` 以上ならフラッシュのみで中止 |
| 3 | 一時ファイル化後、インポータ先頭チェックでヘッダ行および 2 行目以降のデータ行が読めること | `admin.csv.error.format.header` またはデータ空エラーとなりインポータがエラー配列のみ返す |
| 4 | 各データ行の列数が 2 と一致すること | 不一致ならヘッダ定義済みエラー種別へ集約され全体中断へ至る共通実装経路を踏む |
| 5 | 各行のヘッダ名との対応および列ごとの単体検証（必須、数値、複数値の各部分の数値、タグ ID の実在） | 失敗ごとに `breakAll`。最初の検証エラー検知で当該取込批次はコミットされない経路となる |
| 6 | 商品 ID の実在チェック（手継追加） | 不存在なら上記エラー種別へ積んで `breakAll` |
| 7 | 問題なければネイティブ DELETE＋複数 INSERT で置換 | 既存集合は削除され、その後並び順は CSV で列挙した順での INSERT となる |

---

## 業務ルール・計算

本機能における画面上の入力はファイル 1 系統のみであり、桁計算や価格計算はない。

### 入力項目（画面上）

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| CSV ファイル | 必須 | Symfony `File` 制約で `eccube_csv_size` をメガバイト単位につけたサイズ上限（配布既定は 5M）。送信前チェックとして改行行数が抽象コントローラ定数 5010 未満であること（5010 以上でフラッシュのみで中止）。行数カウントはファイル全文を読む簡易方式でダブルクォート内改行は除く | 未選択 | アップロード済みオブジェクトから一時ディレクトリ `eccube_csv_temp_realdir` へ退避後にインポータが読込み、終了時に一時ファイルを削除試行する。コンテンツの永続先は当面 `dtb_csv_import_history` のファイル名列と商品タグ中間のみ |

### CSV の列仕様（雛形と同一の見出し名）

| 項目名（見出し行） | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 商品 ID | 必須 | 符号なし整数としての検証（桁上限の追加指定は無し）。0 は数値許容となるが、その ID の商品実在チェックへ続く | データ行のみ | `dtb_product.id` を検索キーとして利用。ヒットしない／ゼロ件なら当該行で全体中断経路へ |
| タグ ID | 必須 | 複数値はコンマで区切る（囲み文字は共通 CSV サービスのエンクロージャ設定どおり）。各トークンは 0 以上の整数規則。未入力および空白のみは必須違反。列挙した各 ID が `dtb_tag.id` に存在すること | データ行のみ | 実在チェック済みを整数配列化し、その集合で `dtb_product_tag` を再構築。既存との差分適用ではなく全削除後の再挿入 |

### エッジケース

| ケース | 扱い |
|--------|------|
| タグをすべて外したい | 検証では「タグ ID」が必須のためブランクのみの行は通らず、CSV 側から「タグなし状態」だけを表現することは、この取込の必須制約下では想定しない。 |
| 同一行で同一タグ ID を重複記載 | コンマ分割・整数変換のままループ INSERT するため、`dtb_product_tag` に複数行が並び得る。アプリ側で重複除去はしない。DB 側に一意制約が無ければ両方残る経路となる。 |
| トランザクションがロールバックされた取込 | 履歴 INSERT はエラー結果のときは実行されず、フラッシュのみ。 |
| インポータの `clear()` と同一トランザクション内での参照 | flush ごとに ORM が clear される間隔があるため、`Product` オブジェクト依存の処理はネイティブ SQL 側に閉じている。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧と反映内容 | アップロード画面の説明テーブルは静的配列であり、実行後の自動再読込はしない。反映確認は別画面または再検索へ委ねる。 |
| 履歴一覧 | 「商品タグ取込」種別に絞られるため、ほか種別のアップロードは混ぜて表示しない。 |

---

## API/バッチ結果

本機能では外部 HTTP API またはバッチを起動しない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | `POST` multipart の `admin_csv_import[import_file]` および `_token`。 |
| 成功時出力 | `302` で `product_tag_csv_upload` へのリダイレクトおよび成功フラッシュ。 |
| 失敗時出力 | 同上のリダイレクトに加え、`admin`、`admin.alert` に相当するフラッシュおよびインポータ由来の多言語済み文言。 |
| 副作用 | `dtb_product_tag` の削除・追加、条件付きで `dtb_csv_import_history` への INSERT、情報ログ複数種。 |

---

## DBカラム

機能が直接書き換えることを中心に列挙する。型細部はスキーマ実体を参照する。

| テーブル | 列 | メモ |
|---------|-----|------|
| `dtb_product_tag` | `id`, `product_id`, `tag_id`, `creator_id`, `create_date` | 一律 DELETE 後に入力配列順で INSERT。ec-cube-enterprise の列は `id`（主キー）・`product_id`・`tag_id`・`creator_id`・`create_date`。現行（pf-eccube3）はタグ参照列が `tag`、主キーが `product_tag_id` で、`base_info_id` 列は持たない（差は「リニューアル移行時の扱い」を参照）。 |
| `dtb_csv_import_history` | `file_name`, `create_date`, 種別・利用者との関連鍵列 | 取込エラーなく完了したときだけ INSERT。 |

読み取りでは `dtb_product` の実在カウント、`dtb_tag` の ID 一覧（ネイティブ SELECT）が使われる。

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_csv_import_history / dtb_product / dtb_product_tag / dtb_tag | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| ファイル必須 | フォーム `NotBlank`。未選択送信は Symfony 側で不可。サーバ側 null チェックでも `admin.common.csv_invalid_format`。 |
| アップロードサイズ | 設定メガバイト上限。 |
| CSV レイアウト・型 | 列数、`商品 ID` と `タグ ID` の各検証チェーンおよびタグ実在チェック。 |
| 商品実在 | 手継専用。 |

---

## 権限・認可

管理画面共通の認証を通過した利用者のみがルートへ到達する前提とする。本ドキュメントではロール細部を確定しない。

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| ナビまたはブックマークで画面を開く | `GET …/product_tag_csv_upload`。 |
| テンプレート取得・一覧操作 |（テンプレートは GET。履歴のみ）クエリでの再描画またはページャ。 |
| 送信完了（成功または失敗） | 常に `GET …/product_tag_csv_upload` へのリダイレクト。

### 遷移時に引き続く状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| 表示件数・ページ変更 | セッションに `page_no` と条件付き `page_count` を保存する | GET 結果の履歴リストが選択したページサイズになる |
| アップロード後 |（リダイレクト応答のみ。フォーム状態はサーバ側で保持しない） | フラッシュで結果のみ残る |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| フォーム検証エラー・ファイル null・行数超過 | HTTP フラッシュのみ。インポータのトランザクション開始前またはインポータの早期終了のみ。 |
| ヘッダ不備／データ無し／行検証／商品不存在／タグ不存在 | インポータが終了コード相当の結果を返し、コントローラがフラッシュに展開する。変更はコミットされない構成を取る共通実装側の判定に従う。 |
| インポータ内部の一般例外 | ロールバック試行後に例外を伝播させる。このコントローラは try-catch で握りつぶさない経路にある。 |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 |
|--------------|----------|--------------|----------|
| M03-28-MSG-002 | 画面上部フラッシュ | CSVのフォーマットが一致しません | 有効なフォーム送信後、アップロードファイルが未取得（null）のとき（`admin.common.csv_invalid_format`） |
| M03-28-MSG-003 | 画面上部フラッシュ | %maxRecord% 行を超えるCSVファイルは登録できません。 | CSV 行数が上限（`%maxRecord%`=`ADMIN_CSV_IMPORT_MAX_ROWS`）以上のとき（`admin.csv.error.upload.maxrecord`） |
| M03-28-MSG-005 | 画面上部フラッシュ | 登録が完了しました。 | CsvImporter の取込結果にエラーがないとき（`admin.register.complete`） |
| M03-28-MSG-001 | 画面上部フラッシュ | 要ソース確認 | アップロードフォームが不正（`$form->isValid()`=false）のとき。各検証エラーメッセージ（`$error->getMessage()`・可変値）をそのままフラッシュ |
| M03-28-MSG-004 | 画面上部フラッシュ | 要ソース確認 | CsvImporter の取込結果にエラーがあるとき。各行のエラーメッセージ（`$error['message']`・可変値）を全件フラッシュ |

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 取込処理に入った直後 | 「商品タグ更新CSV登録開始」。 |
| 正常完了後 | 「商品タグ更新CSV登録完了」と件数引数の連想情報。 |
| 結果にエラーが残ったとき | 「商品タグ更新CSV登録 異常終了」。 |

### ログに出してはいけないもの

- パスワード類
- なりすまし対策トークンおよび CSRF トークンの原値過多
- Cookie 値およびセッション ID 完全値

---

## セッション

### 本機能におけるセッション

| 観点 | 内容 |
|------|------|
| 一覧ページング閲覧状態 | GET クエリ許容値に基づき `admin.product.product_tag_csv.page_no` と条件付き `page_count` を更新する |

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

- アップロード・取込・雛形: `src/Eccube/Controller/Admin/Product/Csv/ProductTagCsvController.php`
- 行処理ハンドラ: `src/Eccube/Service/Csv/Importer/Event/ProductTagUpdateImportHandler.php`
- 汎用インポータ: `src/Eccube/Service/Csv/Importer/CsvImporter.php`
- 共通アップロード UI: `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig`
- 機能ラッピングのみの Twig: `src/Eccube/Resource/template/admin/Product/csv_product_tag.twig`
- UI 自動テスト: `tests/Eccube/Tests/Web/Admin/Product/Csv/ProductTagCsvControllerTest.php`

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_product_product_tag_csv_upload` … `GET` … `/{admin_route}/product/product_tag_csv_upload`（アップロードフォーム、フォーマット説明表、雛形へのリンク、CSV 取込履歴のページネーションを表示する。）
- `admin_product_product_tag_import` … `POST` … `/{admin_route}/product/product_tag/import`（アップロードされた CSV を検証し取込処理を実行する。終了後は常に `GET admin_product_product_tag_csv_upload` へ HTTP リダイレクトする。）
- `admin_product_product_tag_csv_template` … `GET` … `/{admin_route}/product/product_tag/csv_template`（ヘッダ行のみの雛形 `product_tag_template.csv` を `application/octet-stream` で返す（アップロード画面側のパス断片とは異なる）。）
