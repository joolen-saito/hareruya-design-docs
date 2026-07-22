# 商品管理 — 棚番号登録/編集

## 概要

管理画面「商品管理」配下で、棚番号マスタ `dtb_shelf_number` を一覧・新規・編集・削除し、`sort_no` 昇順でページ送り表示する機能である。ナビの表示は翻訳キー `admin.product.shelf_number_management`（確認値として「棚番号登録/編集」と表示される構成に依存）。同一画面上部に入力フォーム、下部に一覧とページャがある。画面上部から CSV 出力と棚番号マスタ CSV 取込画面へ移動できる。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値は ec-cube-enterprise コアの `ShelfNumberController`、フォーム種別の定義、`DtbShelfNumber` と関連する商品規格の参照、Twig `shelf_number.twig`・`csv_product_shelf_number.twig`、インポート用 `ShelfNumberMasterImportHandler` を正とする。

本機能のカスタマイズ区分は現行踏襲である。挙動の参照は現行リポ pf-eccube3 の HareruyaEc プラグイン実装を正とし、DB関連は ec-cube-enterprise を正とする。現行と移行先のスキーマ差は「リニューアル移行時の扱い」へ集約する。

商品規格側に別ルートがある「棚番号更新 CSV」（商品コードと棚番号 ID の対応更新）は、`ProductShelfNumberCsvController` と取込処理が担当する別機能であり、ナビ項目も異なる。

対象はブラウザ経由の管理画面に限定する。

本文ではフレームワークのコントローラのメソッド名を主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

DB関連の正典は ec-cube-enterprise とする。挙動は現行リポ pf-eccube3 の HareruyaEc プラグインを正とし、移行先との差は本節へ集約する。

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 棚番号マスタの列 | `dtb_shelf_number` は棚番号ID（`id`）・名称（`name` 255、一意）・並び順（`sort_no`）を持つ。 | 同一の列構成（`id`／`name` 255 一意／`sort_no`）。同一スキーマである。 |
| 削除時の参照判定 | 当該棚番号を参照する商品規格サブ（`dtb_product_sub_class` 系）の有無で削除可否を判定する。 | 移行先は商品規格（`dtb_product_class`）の参照有無で判定する。 |
| 並び順キー・削除方式 | 一覧は `sort_no` 昇順、削除は物理削除。両者で同じ（`rank` ではなく `sort_no`）。 | 同左。 |

`dtb_shelf_number` の列名・桁・一意制約は現行と移行先で同一スキーマである。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| ナビ「棚番号登録/編集」 | `GET /{admin_route}/product/shelf_number` | 新規用フォームと一覧（既定は 1 ページ目）を表示する。ページ番号・表示件数はセッションまたは既定に従う。 |
| 一覧の ID・名称・編集ボタン | `GET /{admin_route}/product/shelf_number/{id}` | 当該行の現行値がフォームに載る。ページャは編集モード用ルートに接続する。 |
| 編集時「新規登録へ戻る」 | `GET /{admin_route}/product/shelf_number` | 新規モードに戻る。保存は行わない。 |
| 一覧ページリンク（新規時） | `GET /{admin_route}/product/shelf_number/page/{page_no}` | セッションのページ番号が更新され、当該ページの一覧が返る。 |
| 一覧ページリンク（編集時） | `GET /{admin_route}/product/shelf_number/{id}/page/{page_no}` | 同上。パスの `id` が編集中の行。 |
| 表示件数セレクト変更 | 現在 URL に `?page_count=N` を付けて `GET` | セッションの表示件数が `N` に更新され、同一画面構成が再描画される。選択肢は 10, 50, 100, 300, 500, 1000, 2000, 10000, 12000 のみ。 |
| conversion の「登録」 | `POST /{admin_route}/product/shelf_number/store` または `…/store/{id}` | 検証成功時は保存し、成功メッセージののち `GET admin_product_shelf_number` へリダイレクトする（同一ルートに追加パラメータを渡す実装のため、生成 URL にクエリが付く場合がある）。失敗時は 200 で同一テンプレートを再描画する。一意制約違反時は一覧へリダイレクトしエラーメッセージを積む。 |
| 一覧の「削除」 | `DELETE /{admin_route}/product/shelf_number/{id}/delete` | 商品規格に参照が無ければ削除し成功メッセージ。参照があれば削除せずエラーメッセージ。いずれも一覧ルートへリダイレクトする。 |
| 「CSV出力」 | `GET /{admin_route}/product/shelf_number/export` | マスタ全件の CSV をダウンロードする。 |
| 「CSV取込」 | `GET /{admin_route}/product/shelf_number/master_csv_upload`（または `…/csv`） | マスタ CSV 用アップロード画面を表示する。 |
| マスタ CSV 用のヘッダー雛形をダウンロードする。 | `GET /{admin_route}/product/shelf_number/master_csv_template` | マスタ CSV 用のヘッダー雛形をダウンロードする。 |
| 上記と同一画面だが別 URL（後方互換用）。アップロード画面を表示する。 | `GET /{admin_route}/product/shelf_number/csv` | 上記と同一画面だが別 URL（後方互換用）。アップロード画面を表示する。 |
| マスタ CSV の取込。 | `POST /{admin_route}/product/shelf_number/master_import` | マスタ CSV の取込。 |
| 取込処理は上記と同じ。別 URL で POST できる。 | `POST /{admin_route}/product/shelf_number/import` | 取込処理は上記と同じ。別 URL で POST できる。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | タイトルは商品管理、サブタイトルは「棚番号登録/編集」に相当する翻訳。メニューは `product` と `shelf_number`。上部に「新規登録へ戻る」（編集時のみ）、「CSV出力」「CSV取込」リンク。カード見出しは新規時は登録系ラベル、編集時は「編集」。名称欄と並び順欄は横並び。名称のラベルは翻訳キー `admin.setting.shop.trade_law.header.name`、並び順は `admin.product.format.format_rank`（画面は日本語環境で「名称」「並び順」に相当する文言になる）。下部は一覧表（ID・名称・並び順・編集・削除）と表示件数セレクト、ページャ。フッタ conversion に「登録」ボタンは `form` 属性で上部フォーム `form_storage_code` に紐づく。編集時は隠し入力 `shelfNumbers[id]` が出力されるが、Symfony のフォームデータとは別名であり、保存処理はフォームとパスの `id` に依存する。 |
| JS 挙動 | `.js-page-count` 変更時に現在 URL に `page_count` クエリを付けて `location` を置き換える。 |
| CSS・レイアウト | ページ見出し用のローカルスタイル、CSV ボタン用の小さめパディング。コア管理画面フレームに従う。 |
| モーダル・ポップアップ | 削除リンクはアンカーに `data-method="delete"` と確認メッセージ属性があり、管理画面共通の確認後に DELETE する。 |

補足（画面ラベルと検証メッセージ）: 名称の形式検証メッセージはフォーム種別に日本語で固定文字列として定義されている。

---

## 処理フロー

### 画面を表示する（GET 各ルート）

1. 管理画面の認証・共通制約を通過する。
2. ルートにマスタ行が解決されない場合は新規用の空インスタンスを生成し、解決された場合はその行をフォームに載せる。存在しない数値 `id` の編集 URL は 404 となる。
3. セッション `admin.product.shelf_number.page_no` に、ルート引数 `page_no` があればその値、なければ既存セッション値、なければ 1 を書き込む。
4. クエリ `page_count` があれば整数化してセッション `admin.product.shelf_number.page_count` に格納。無ければセッション値、なければ 10。
5. `dtb_shelf_number` を `sort_no` 昇順でクエリし、ページネータで（上記ページ番号・件数）分割してテンプレートへ渡す。

### 登録・更新する（POST `admin_product_shelf_number_store`）

1. 管理画面の認証・共通制約を通過する。
2. パスに `id` が解決されれば既存行、解決されなければ新規インスタンスでフォームを生成し、`handleRequest` で POST を取り込む。
3. 未送信または検証失敗時、フラッシュに `admin.register.failed` を積み、セッションのページ番号・件数で一覧を再構成して同テンプレートを 200 で返す。
4. 検証成功時、`persist` と `flush` を行う。一意制約違反（主に `name` の重複）を DB 層で捕捉した場合、フラッシュに `admin.error.non_unique` を積み、`admin_product_shelf_number` へリダイレクトする（パスに `id` は付けない実装）。
5. 上記以外の成功時、フラッシュに `admin.register.complete` を積み、`admin_product_shelf_number` へリダイレクトする。リダイレクト引数に保存後の主キー `id` を渡すため、生成 URL にクエリ `?id=` が付く。一覧ルートのパスパラメータに `{id}` が無いため、編集フォームが自動で当該行を開くかはルーティングと引数解決の組み合わせに依存し、利用者は一覧から当該行を開き直す必要が生じ得る。

### 削除する（DELETE `admin_product_shelf_number_delete`）

1. 共通のトークン検証（`isTokenValid`）を通過する。失敗時の HTTP ステータスは管理画面共通の実装に従う。
2. マスタ行が解決されなければ 404。
3. 当該行の `ProductClasses` が空でなければ、フラッシュに `admin.shelf_number.delete.failed` を積み（メッセージは行名などをパラメータ化）、`admin_product_shelf_number` へリダイレクトする。
4. 空であればエンティティを削除して `flush` し、`admin.common.delete_complete` を積んで `admin_product_shelf_number` へリダイレクトする。

### CSV をエクスポートする（GET `admin_product_shelf_number_export`）

1. 認証・共通制約を通過する。
2. 全件を `sort_no` 昇順で取得し、ヘッダー行 `ID,名称,並び順` と各行を CSV サービス経由でストリーム出力する。
3. ファイル名は `shelf_number_YYYYMMDDHHmmss.csv` 形式。`Content-Disposition` で添付扱い。

### マスタ CSV 取込する（POST 各 import ルート）

1. 認証・共通制約を通過する。利用者情報はログ等に渡すために取得される。
2. `CsvImportType` でファイルを検証する。検証失敗・未選択ファイル・行数が抽象コントローラの `ADMIN_CSV_IMPORT_MAX_ROWS`（確認値 5010）以上ならエラーフラッシュを積み、`admin_product_shelf_number_master_csv_upload` へリダイレクトする。
3. `ShelfNumberMasterImportHandler` と汎用 `CsvImporter` で取込する。処理中にエラーがあれば各行メッセージをフラッシュに積む。無ければ `admin.register.complete` を積む。
4. いずれも `admin_product_shelf_number_master_csv_upload` へリダイレクトする。
5. 取込処理のログは「棚番号マスタCSV登録」開始／異常終了／完了（件数）で出力される。

インポート行の論理は次とおりである。ヘッダーに `名称` と `並び順` が必須。`ID` が空または数値 `0` の行は新規 `persist`。正の整数 `ID` が指定された行は数値妥当性とマスタ存在を検証したうえで当該行を更新する。名称の画面上の正規表現チェックと同等のチェックは CSV 側のハンドラには無く、要件上は DB の一意制約と文字列長のみに依存し得る。

---

## 集計条件

本機能では独自の売上や在庫集計は行わない。一覧はマスタを `sort_no` 昇順でページ分割するのみである。

| 指標 | 集計の要点 |
|------|------------|
| 一覧総件数 | `dtb_shelf_number` 全件を `sort_no` 昇順で対象とし、表示件数で分割する。 |

---

## 登録・更新時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | フォーム送信の有無とフィールド検証（CSRF を含む Symfony フォームの妥当性） | 失敗なら `admin.register.failed` と再描画。 |
| 2 | `flush` 時の一意制約 | 違反なら `admin.error.non_unique` と一覧へリダイレクト。 |
| 3 | 上記を満たす | 成功メッセージと一覧ルートへのリダイレクト。 |

---

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| 一覧の並び | `sort_no` 昇順。一覧行のドラッグ並べ替えは無い。 |
| 名称の形式（画面フォーム） | 正規表現 `^[A-Z][-][0-9]{3}$`（先頭 1 文字の大写字母、ハイフン、小数 3 桁）に一致する必要がある。 |
| 並び順（画面フォーム） | 整数型入力。フォーム種別には上下限や符号なし検証が無く、実際の許容値は整数型・DB の符号なし定義と整合させる運用となる。 |

本機能では売上計算や税計算を行わない。

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 名称 | 必須 | Symfony の長さ制約はフォームに無い。DB 列 `dtb_shelf_number.name` は長さ 255、一意制約。形式は正規表現で検証される。フォーム送信キーは `shelf_number[name]`。 | 新規は空、編集は当該行の `name` | `dtb_shelf_number.name`。 |
| 並び順 | 必須 | 整数入力種別に従う。DB は `dtb_shelf_number.sort_no` 符号なし整数。フォーム送信キーは `shelf_number[sortNo]`。 | 新規はウィジェット未入力、編集は当該行の `sort_no` | `dtb_shelf_number.sort_no`。 |

### エッジケース

| ケース | 扱い |
|--------|------|
| 二名が同じ名称をほぼ同時に送信 | DB 側の一意制約で一方が捕捉され、`admin.error.non_unique` が積まれる場合がある。楽観ロックは無い。 |
| CSV で名称フォーマット規則外の文字列 | 画面フォーム同等の Regex 検証は取込ハンドラに無いため、規則外の名称が保存され得る。このとき画面からの再編集は Regex で弾かれる可能性がある。 |
| 削除時に規格から参照されている | DB を削除しない。フラッシュのみ。 |
| 成功後リダイレクトでクエリに `id` のみが付く | 編集画面が自動では開けない。この場合は一覧からリンクで開き直す。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 本画面と商品規格 | マスタの更新・削除は規格側の自動再割当を行わない。規格が参照している `name` が変われば表示は次回参照時に変わる。 |
| CSV 取込と画面 | CSV は同一テーブルを一括書き換えし得る。画面で見た結果とドラフト入力の一致は保証しない。 |

---

## API/バッチ結果

本機能では外部公開 API は扱わない。マスタ CSV 取のみバッチ様の一括処理に相当する。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | GET は主にパスの `id` と `page_no`。POST 登録は `shelf_number[_token]`・`shelf_number[name]`・`shelf_number[sortNo]`。編集時は主に `/store/{id}`。 DELETE は `_token` をクエリ本体に載せる。 |
| CSV 入力 | `CsvImportType` のファイルフィールド。ヘッダーは `ID`（任意）、`名称`、`並び順`（後二者はマスタ側の必須定義）。 |
| 成功時出力 | リダイレクトとフラッシュ、または CSV のバイナリ応答。 |
| 副作用 | `dtb_shelf_number` の insert/update/delete、フラッシュ、`flush` に伴う永続化。マスタ CSV 取込では取込サービス共通のログと履歴（実装有無は汎用 `CsvImporter` 側を正とする）。 |

---

## DBカラム

| テーブル | 列 | メモ |
|----------|-----|------|
| `dtb_shelf_number` | `id` | 主キー自動採番。 |
| `dtb_shelf_number` | `name` | 一意。画面入力は Regex 付き、CSV はハンドラの Regex と独立。 |
| `dtb_shelf_number` | `sort_no` | 一覧並びおよび CSV 並び順。 |

削除は参照される商品規格が無い場合に限り行が消える。

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_shelf_number | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| 名称 | 必須。Regex およびメッセージはフォーム種別にハードコード。 |
| 並び順 | 必須。整数型への変換に従う。 |
| CSRF | Symfony フォームのデフォルトトークン。 |
| DELETE | 共通 `isTokenValid`。 |

---

## 権限・認可

| 利用者状態 | 棚番号登録/編集 |
|------------|----------------|
| 管理画面にログインし当ルートへ到達できる運用者 | 当画面および同一コントローラの CSV 入出力へ到達し得る。 |
| 未到達の主体 | 管理画面共通の認証により拒否される。 |

個別 YAML でのルート単位ロール分割は本文では確定しない。

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| ナビ項目 | `GET admin_product_shelf_number` |
| POST 検証成功 | `GET admin_product_shelf_number`（クエリやパラメータに保存後 ID を載せる実装） |
| POST 検証失敗 | 同一 URL（POST 送信先とは別にもどるのではなく、`store` が再描画のため HTML は一覧付きフォームパターン） |
| DELETE 結果 | `GET admin_product_shelf_number` |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| GET のたびに | ページ番号・表示件数をセッションに書く | 以降の POST 失敗時の再描画でも同セッション値でページ分割する。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| 存在しない編集 `id` | 404。 |
| フォーム検証失敗 | 200 で再描画、`admin.register.failed`。 |
| 一意制約違反 | 一覧へリダイレクト、`admin.error.non_unique`。 |
| DELETE で参照あり | 一覧へリダイレクト、`admin.shelf_number.delete.failed`。 |
| DELETE CSRF 不正 | 共通処理に従う。 |
| CSV 行数上限超過 | 取込画面へ戻し、件数上限メッセージ。 |

---

## 試行制限

本機能ではログイン試行回数のような制限は扱わない。

---

## ログ・監査

マスタ CSV 取込は開始・異常終了・完了（件数）をアプリログに残す。画面の登録・削除は当コントローラに専用の成功ログは無い。

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークン
- Cookie 値
- セッション ID の完全値
- Remember Me トークンの原値

---

## セッション

ページ番号と表示件数をセッションに保持する。フラッシュは管理画面共通の仕組みを用いる。

### セッションへ保存しない情報

下書きの名称・並び順をセッションに自動保存する処理は無い。検証失敗時は POST 直後のフォーム状態がレスポンスに載る。

---

## Cookie

本機能特有の Cookie 操作は扱わない。

---

## 排他制御・トランザクション

単行の `flush` や CSV 取込のトランザクション境界は汎用インポータに従う。楽観的版本列や `SELECT FOR UPDATE` は用いない。

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|
| M03-21-MSG-001 | 管理画面上部フラッシュ | 登録できませんでした。 | 登録ボタン押下時、フォームが未送信またはバリデーション不正（同一画面を再表示） | 棚番号登録/編集画面に留まる |
| M03-21-MSG-002 | 管理画面上部フラッシュ | 値が重複しています。 | 登録ボタン押下時、棚番号保存で一意制約違反（UniqueConstraintViolationException）が発生（一覧へリダイレクト） | 棚番号登録/編集画面に遷移する |
| M03-21-MSG-003 | 管理画面上部フラッシュ | 登録が完了しました。 | 登録ボタン押下時、棚番号の保存が正常終了（一覧へリダイレクト） | 棚番号登録/編集画面に遷移する |
| M03-21-MSG-004 | 管理画面上部フラッシュ | 商品で使用されているため、「%name%」の棚番号は削除することができません。 | 削除リンク押下時、対象棚番号が商品規格で使用中（一覧へリダイレクト） | 棚番号登録/編集画面に遷移する |
| M03-21-MSG-005 | 管理画面上部フラッシュ | 削除しました | 削除リンク押下時、紐付く商品がなく削除が正常終了（一覧へリダイレクト） | 棚番号登録/編集画面に遷移する |
| M03-21-MSG-006 | 管理画面上部フラッシュ | 要ソース確認 | CSVアップロード時、フォームが不正（ファイル未選択・File 制約違反・CSRF トークン不正のいずれか）。$error->getMessage() をそのまま addError するため単一文言に確定不可（`getErrors(true)` が NotBlank/File 制約由来とフォーム直下の CSRF エラーを列挙。取込画面へリダイレクト） | 要ソース確認 |
| M03-21-MSG-007 | 管理画面上部フラッシュ | CSVのフォーマットが一致しません | CSVアップロード時、有効なフォーム送信後にアップロードファイルが null（取込画面へリダイレクト） | 棚番号登録CSVアップロード画面に遷移する |
| M03-21-MSG-008 | 管理画面上部フラッシュ | %maxRecord% 行を超えるCSVファイルは登録できません。 | CSVアップロード時、CSV 行数が上限（ADMIN_CSV_IMPORT_MAX_ROWS）以上（取込画面へリダイレクト） | 棚番号登録CSVアップロード画面に遷移する |
| M03-21-MSG-009 | 管理画面上部フラッシュ | 要ソース確認 | CSVアップロード時、取込結果にエラーがある。$error['message'] は CsvImportResult 由来の可変値で単一文言に確定不可（取込画面へリダイレクト） | 要ソース確認 |
| M03-21-MSG-010 | 管理画面上部フラッシュ | 登録が完了しました。 | CSVアップロード時、取込結果にエラーがない（取込画面へリダイレクト） | 棚番号登録CSVアップロード画面に遷移する |
| M03-21-MSG-011 | 画面中央の確認ダイアログ（ブラウザ confirm） | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 削除リンク押下時（`a[token-for-anchor]` にバインドされた共通ハンドラ。`data-confirm` 未指定のため confirm を表示。OK で `_method=delete` の隠しフォームを送信、キャンセルで中止） | 確認後に削除処理を実行し、棚番号登録/編集画面に遷移する。キャンセル時は棚番号登録/編集画面に留まる |
| M03-21-MSG-012 | フォーム項目下インライン | ※名称は大文字アルファベットと-(ハイフン)と3桁の数値の形式のみ登録可能です。 | 登録ボタン押下時、名称が正規表現 `^[A-Z][-][0-9]{3}$` に不一致（同一画面を再表示。MSG-001 のフラッシュと同時に表示され得る） | 棚番号登録/編集画面に留まる |
| M03-21-MSG-013 | フォーム項目下インライン | 入力されていません。 | 登録ボタン押下時、名称または並び順が未入力（NotBlank 違反。同一画面を再表示。MSG-001 のフラッシュと同時に表示され得る） | 棚番号登録/編集画面に留まる |
| M03-21-MSG-014 | フォーム項目下インライン | 整数で入力してください。 | 登録ボタン押下時、並び順に整数として解釈できない値を送信（IntegerType の変換エラー。同一画面を再表示。MSG-001 のフラッシュと同時に表示され得る） | 棚番号登録/編集画面に留まる |

固定文言の出典は `messages.ja.yaml`（`admin.register.failed`/`admin.error.non_unique`/`admin.register.complete`/`admin.shelf_number.delete.failed`/`admin.common.delete_complete`/`admin.common.csv_invalid_format`/`admin.csv.error.upload.maxrecord`/`admin.common.delete_modal__message`）、`validators.ja.yaml`（NotBlank 既定訳）、`ShelfNumberType.php`（名称 Regex メッセージのハードコード）と `ShelfNumberController.php`。MSG-011 の確認文言は `shelf_number.twig` の `data-message` 属性経由で管理画面共通 JS（`function.js` の confirm）が表示する。MSG-006/009 は例外・制約由来の可変文言のため単一文言に確定できない（MSG-009 の候補は `admin.csv.error.format.header`/`format.body`/`data.empty`/`data.require`/`data.not_registered`/`product.invalid`/`product.over_zero`/`shelf_number.name_duplicate`。fable5 レビューで `admin.csv.error.product.not_exists`〔データ行に定義列が無い場合、`BaseCsvImportHandler` の `addColumnNotExistsError` 経由〕を候補に追加。MSG-006 は CSRF トークン不正時の「CSRFトークンが無効です、再送信してください。」〔vendor/symfony/form の validators.ja.xlf〕も候補）。MSG-014 は IntegerType の既定 invalid_message「Please enter an integer.」の Symfony 同梱訳（`vendor/symfony/form/Resources/translations/validators.ja.xlf`）で、並び順欄の `form_errors` にインライン表示される（fable5 レビュー追加・抜け漏れ）。

---

## 調査補助（grep 向け）

ルートと画面は `src/Eccube/Controller/Admin/Product/ShelfNumberController.php`、Twig は `src/Eccube/Resource/template/admin/Product/shelf_number.twig` と `csv_product_shelf_number.twig`、フォームは `Form/Type/Admin/ShelfNumberType.php`、エンティティは `Entity/DtbShelfNumber.php`、CSV 取込ハンドラは `Service/Csv/Importer/Event/ShelfNumberMasterImportHandler.php`、ナビは `app/config/eccube/packages/eccube_nav.yaml` の `shelf_number`。商品コードと棚番号 ID の更新は `ProductShelfNumberCsvController.php` を参照する。

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_product_shelf_number_edit_page` … `GET` … `/{admin_route}/product/shelf_number/{id}/page/{page_no}`（編集モードで一覧の指定ページを表示する。`id` と `page_no` は 10 進数字。）
- `admin_product_shelf_number_page` … `GET` … `/{admin_route}/product/shelf_number/page/{page_no}`（新規モードで一覧の指定ページを表示する。）
- `admin_product_shelf_number_edit` … `GET` … `/{admin_route}/product/shelf_number/{id}`（指定行をフォームに載せ、一覧とあわせて表示する。）
- `admin_product_shelf_number` … `GET` … `/{admin_route}/product/shelf_number`（新規用の空インスタンスをフォームに載せ、一覧とあわせて表示する。）
- `admin_product_shelf_number_store` … `POST` … `/{admin_route}/product/shelf_number/store`（フォーム送信による登録・更新。）
- `admin_product_shelf_number_delete` … `DELETE` … `/{admin_route}/product/shelf_number/{id}/delete`（棚番号マスタの削除。商品規格に参照されている行は削除しない。）
- `admin_product_shelf_number_export` … `GET` … `/{admin_route}/product/shelf_number/export`（マスタ全体を CSV でダウンロードする。）
- `admin_product_shelf_number_master_csv_template` … `GET` … `/{admin_route}/product/shelf_number/master_csv_template`（マスタ CSV 用のヘッダー雛形をダウンロードする。）
- `admin_product_shelf_number_master_csv_upload` … `GET` … `/{admin_route}/product/shelf_number/master_csv_upload`（マスタ CSV アップロード画面を表示する。）
- `admin_product_shelf_number_csv` … `GET` … `/{admin_route}/product/shelf_number/csv`（上記と同一画面だが別 URL（後方互換用）。アップロード画面を表示する。）
- `admin_product_shelf_number_master_import` … `POST` … `/{admin_route}/product/shelf_number/master_import`（マスタ CSV の取込。）
- `admin_product_shelf_number_import` … `POST` … `/{admin_route}/product/shelf_number/import`（取込処理は上記と同じ。別 URL で POST できる。）
