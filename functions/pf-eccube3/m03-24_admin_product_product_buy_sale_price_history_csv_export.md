# 商品管理 — 買取/販売価格履歴 CSV 出力

## 概要

管理画面「商品管理」配下の「買取/販売価格履歴」一覧で、直近にセッションへ保存した検索条件と同一の抽出条件で `dtb_price_history` を走査し、文字コード変換済みの CSV をストリーム応答として返す機能である。一覧はページ分割するが、CSV はページングを掛けずにクエリ結果を列方向にすべて出力する。

検索フォーム・一覧・セッションキー全体の説明は別設計 `m03-23_admin_product_product_buy_sale_price_history.md` を正とする。本書は CSV ダウンロードの入口、前提条件、出力形式、一覧との差分を中心にする。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。

本機能のカスタマイズ区分は現行踏襲である。現行挙動は pf-eccube3 の実装を参照し、永続化に関わるテーブル名・列名などのDB関連は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面のみとする。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

DB関連の記述は ec-cube-enterprise の実装を正とする。現行（pf-eccube3）と移行先（ec-cube-enterprise）の差は次のとおり。

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|---------------------|-------------------------------|
| 価格履歴テーブル | `dtb_price_history`（列 `sell_price` `old_sell_price` `buy_price` `old_buy_price` `standard_price` `old_standard_price` `create_date` `member_id`） | 同一スキーマ。列名・構成は一致する。 |
| 規格の商品コード列 | Doctrine プロパティ `code` が列 `product_code` にマップされる | 列名は `product_code`。エンティティ上も `product_code`。商品コードを指す列は移行先でも `dtb_product_class.product_code` とする。 |
| 規格の状態・備考列 | `dtb_product_class.memo` 等 | 同一スキーマ（`memo`）。 |

CSV 出力の挙動・列順・文字コード処理は現行（pf-eccube3）を参照し、移行先でも同等の標準実装が ec-cube-enterprise に取り込まれている。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| 一覧で 1 件以上ヒットしたあと「CSVダウンロード」をクリック | `GET /{admin_route}/product/buy_sale_price_history/export` | 現在の検索条件に一致する全履歴が CSV としてダウンロードされる。 |
| 検索結果 0 件で CSV リンクが描画されていない状態から、手動で同じ URL にアクセス | `GET /{admin_route}/product/buy_sale_price_history/export` | 検索実行済みでセッションに検索ビューデータが残っていれば、ヘッダ行のみの CSV が返る。セッションが無ければ一覧初期 URL へリダイレクトされフラッシュに文言が出る。 |
| 初回表示のみで検索していない | （リンクは一覧未表示だが）`GET …/export` に直接アクセス | セッションキー欠落としてリダイレクト。 |

一覧テンプレートでは `pagination.totalItemCount > 0` のときだけ「CSVダウンロード」ボタンを出すため、画面からは「結果なしでもセッションだけある」状態ではボタンが見えない。URL 直叩きは上表のとおり別扱いになる。

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | CSV 用の独自ウィジェットはない。「CSVダウンロード」は結果ヘッダ右側の通常リンク（別タブ指定なし）。 |
| JS 挙動 | CSV 送信前の二重押し防止やクライアント側検証はない。クリックで単純に GET 遷移する。 |
| CSS・レイアウト | 一覧側のスタイルのみ。CSV 専用 CSS はない。 |
| モーダル・ポップアップ | 出力確認ダイアログはない。 |

---

## 処理フロー

### CSV をダウンロードする（GET `m03-23_admin_product_product_buy_sale_price_history_export`）

1. 管理画面の認証および共通処理を通過する。
2. セッションからキー `eccube.admin.product.buy_sale_price_history.search` を読む。値が `null` のみエラーとし、管理向けフラッシュに「検索条件を指定してからCSVをダウンロードしてください。」を積み、`GET /{admin_route}/product/buy_sale_price_history` へリダイレクトして終了する。
3. `set_time_limit(0)` で PHP の実行時間上限を実質無制限に寄せる。
4. エクスポート用に、`BuySalePriceHistorySearchType` のビルダだけ `csrf_protection` を無効にしたうえで、手順 2 の配列を `FormUtil::submitAndGetData` に渡し、正規化済み検索データを得る。
5. `dtb_price_history` 向けリポジトリの `getQueryBuilderBySearchData` でクエリビルダを得る。一覧検索と同一の結合・絞り込み・並び（履歴の `create_date` 降順、`id` 降順）になる。
6. ストリーム応答のコールバック外までに `getQuery()` を終えておく（コールバック開始後にセッションが閉じる実装を想定したコメントに基づく）。
7. コールバック内で共通 CSV エクスポートサービスの `fopen`・1 行目ヘッダ出力・`Query::toIterable` で得た各履歴エンティティを行配列に変換して `fputcsv`・`fclose` を行う。
8. 応答ヘッダに `Content-Type: application/octet-stream` と `Content-Disposition: attachment; filename=buy_sale_price_{YmdHis}.csv` を付与する（日時はサーバの実行時刻）。

### データ行を組み立てるときの付加読込

イテレーションではルートエイティティのみを逐次 hydrate し、行ビルド時に商品規格・商品・言語・状態・登録者を都度参照する。一覧側で `addSelect` による eager を増やさない方針とコメント上一致し、件数に応じた付加クエリは許容される。

---

## 集計条件

本機能は件数集計や売上計算をしない。CSV の行数は、手順 5 のクエリに一致した `dtb_price_history` 行数に等しい。ページ番号や `page_count` はクエリには渡されない。

| 指標 | 集計の要点 |
|------|------------|
| 出力行数 | 検索条件を満たす履歴 1 行につき CSV データ行 1 行。0 件ならヘッダのみ。 |

---

## 出力仕様（ヘッダ・列とデータ源）

ヘッダ行はコントローラ定数の日本語ラベル配列をそのまま 1 行目に書く。データ行は次の順で値を並べる。整数として有効な価格は十進文字列にし、NULL は空文字にする。

| CSV 列（ヘッダ文言） | 内容 |
|----------------------|------|
| 商品コード | 規格の `code`。NULL 相当は空文字にキャスト。 |
| 言語 | 規格の言語マスタがあれば日本語名。無ければ空。 |
| 商品名 | 商品の名称。 |
| 状態 | 規格 `memo` が非空ならその文字列。空ならカード状態マスタがあればその `code` 文字列。いずれも無ければ空。 |
| 変更前基準価格 | 履歴 `old_standard_price`。NULL は空セル。 |
| 変更後基準価格 | 履歴 `standard_price`。NULL は空セル。 |
| 変更前販売価格 | 履歴 `old_sell_price`。NULL は空セル。 |
| 変更後販売価格 | 履歴 `sell_price`。NULL は空セル。 |
| 変更前買取価格 | 履歴 `old_buy_price`。NULL は空セル。 |
| 変更後買取価格 | 履歴 `buy_price`。NULL は空セル。 |
| 登録日 | 履歴 `create_date` を `Y/m/d H:i` 形式。 |
| 登録者 | 履歴に紐づく会員がいればその表示名。無ければ空。 |

一覧テーブルの列順は「商品コード・商品名・言語・状態…」だが、CSV は「商品コード・言語・商品名・状態…」と名称 2 列の順が入れ替わる（実装を確認値とする）。

---

## 文字コード・区切り・BOM

共通 CSV エクスポートサービスに従う。

- 出力ストリームは `php://output` に開く。
- 設定 `eccube_csv_export_encoding`（未設定時の確認値はソース上 `SJIS-win`）へ UTF-8 から `mb_convert_encoding` する。
- エンコーディングが UTF-8（大文字小文字無視）のときのみ、先頭に BOM（`\xEF\xBB\xBF`）を書く。
- 区切り文字は設定 `eccube_csv_export_separator`。フィールドは `fputcsv` の規則でダブルクォート囲み、エスケープはバックスラッシュを指定する実装になっている。

応答の `Content-Type` は `application/octet-stream` のみで、`charset=` は付けない（実装を確認値とする）。

---

## 業務ルール・計算

本 CSV 機能は金額の再計算や丸めを行わない。DB に格納された履歴値を列に写すのみである。

価格レンジによる絞り込みは検索データの `product` 配下で、履歴の変更後側（`sell_price`・`buy_price`・`standard_price`）に対してのみ適用される。変更前のみ有意な行は、販売・買取下限などを付けたときヒットしにくい（SQL の NULL 比較）。詳細は親設計書の「エッジケース」を正とする。

### 入力項目

CSV 専用の入力欄はない。検索条件は親画面のフォームとセッションに依存する。項目一覧・最大長・保存先は `m03-23_admin_product_product_buy_sale_price_history.md` の「### 入力項目」を正とする。

### エッジケース

| ケース | 扱い |
|--------|------|
| 検索結果は 0 件だが検索ビューデータはセッションにある | 自動テストはセッションを直注入していないが、実装どおりならヘッダ 1 行のみのファイルが返る。 |
| セッションにキーが無い | フラッシュと一覧初期 URL へのリダイレクト。 |
| 長大な件数 | `set_time_limit(0)` とストリーム逐次出力。メモリに全行を載せないイテレーション方針。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧同条件との一致 | セッションの検索ビューデータから同じ `getQueryBuilderBySearchData` を使うため、抽出集合は一覧の全件集合と一致する（一覧はページ分割のみ異なる）。 |
| 表示のタイミング | ダウンロード要求時点の DB 内容を読む。実行中に他処理が履歴を増やしても、既に開いたクエリの結果範囲は実装・分離レベルに依存する（通常はスナップショット一貫性は保証しない）。 |

---

## API/バッチ結果

本機能では公開 JSON API およびバッチ実行を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | HTTP GET のみ。クエリパラメータは解釈しない。ボディはない。有効性はセッションの検索ビューデータの有無と内容に依存。 |
| 成功時出力 | `Content-Type: application/octet-stream`、ファイル名 `buy_sale_price_{YmdHis}.csv`、本文は CSV ストリーム。 |
| 失敗時出力 | セッション欠落時は HTTP リダイレクトとフラッシュメッセージ。 |

---

## DBカラム

CSV の行に直接効く主な列のみ示す。型の細部はスキーマを正とする。

| テーブル | 列 | メモ |
|----------|-----|------|
| `dtb_price_history` | `sell_price` `old_sell_price` `buy_price` `old_buy_price` `standard_price` `old_standard_price` | 変更後列が NULL の行があり得る。 |
| `dtb_price_history` | `create_date` | CSV の登録日時列。 |
| `dtb_price_history` | `member_id` | 登録者名解決。 |
| `dtb_product_class` | `product_code`（現行プロパティ `code`）`memo`、言語・状態への参照 | コード・状態表示列。商品コード列は ec-cube-enterprise では `product_code`。 |

### DB操作

本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 検索 | dtb_price_history / dtb_product_class | 検索条件に合致するレコードを抽出する。抽出結果を所定フォーマットでファイル出力する。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| CSV リクエスト本体 | GET に対する CSRF は要求しない。 |
| 検索データの正規化 | エクスポート直前にフォームへ再投入されるため、親画面と同じ型制約・変換が掛かる。 |

---

## 権限・認可

| 利用者状態 | CSV ダウンロード |
|------------|------------------|
| 管理画面ログイン済み（`/{admin_route}/` 配下の共通セキュリティ境界内） | 到達できる。本パスの個別ロールアノテーションは置かれていない。細目は環境設定を正とする。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| CSV リンククリック（検索済み・件数 1 以上の画面） | 同一タブでファイルダウンロード応答。ブラウザの挙動に依存。 |
| セッション検索データ欠落 | `GET /{admin_route}/product/buy_sale_price_history` へリダイレクト。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| セッションキー `eccube.admin.product.buy_sale_price_history.search` が `null` | 固定日本語メッセージをフラッシュに積み、一覧初期ルートへリダイレクト。 |

---

## 試行制限

本機能では API レートリミットや試行回数制限を設けない。

---

## ログ・監査

CSV 送出専用の追加ログ出力はソース上目立たない。共通 CSV サービスや Web サーバアクセスログの範囲に留まる。

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークンの原値
- Cookie 値およびセッション ID の全桁
- Remember Me トークンの原値

---

## セッション

### 本機能におけるセッション

| 観点 | 内容 |
|------|------|
| CSV 成否 | キー `eccube.admin.product.buy_sale_price_history.search` が存在するかだけを見る。空配列でも `null` ではない限りエクスポート処理に入る（実装を確認値とする）。 |

### セッションへ保存しない情報

CSV 処理が独自に新しい検索キーを書き込むことはない。

---

## Cookie

本機能専用 Cookie はない。セッション Cookie は Symfony 共通。

---

## 排他制御・トランザクション

読取およびストリーム出力のみであり、履歴行を画面から更新しない。悲観ロックは使わない。

---

## 調査補助

読み取りの手がかりとして、おおむね次のパスにある。

`src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php`（定数 `EXPORT_HEADER`、`export`、`buildPriceHistoryCsvRow`）
`src/Eccube/Service/CsvExportService.php`（`fopen` `fputcsv` `fclose`）
`tests/Eccube/Tests/Web/Admin/Product/BuySalePriceHistoryControllerTest.php`（エクスポート正常系・セッション欠落系）

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `m03-23_admin_product_product_buy_sale_price_history_export` … `GET` … `/{admin_route}/product/buy_sale_price_history/export`（セッションに検索ビューデータが存在するとき、同一条件の全件を CSV ストリームで返す。無いときはフラッシュとリダイレクト。）
