# m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）

## 概要

管理画面の商品一覧から、チェックした商品について、NM 規格を基点に買取価格と基準価格をまとめて入力し、同一商品・同一言語の通常規格（`high_price_code` が無い規格）すべてに対して買取価格と基準価格を更新する機能である。画面見出し・ボタン文言はロケール上「買取・基準価格一括編集」であり、基準価格は `dtb_product_class.standard_price` に対応する。販売価格（`dtb_product_class.price02`）は当画面からは保存せず、フォーム検証で買取価格の上限比較にのみ使う。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。ec-cube-enterprise のコア実装を確認値とする。

本機能のカスタマイズ区分はカスタマイズである。画面・処理の挙動は現行リポ（pf-eccube3）の実装を参照し、DB関連（テーブル名・列名・保存先・副作用のDB更新）は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。

本文ではコントローラのメソッド単位の解剖を主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

本機能が読み書きする価格列・履歴・買取価格表は、移行先 ec-cube-enterprise で実在を確認した。

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 基準価格・高額商品コード | `dtb_product_class.standard_price`・`high_price_code` | 同一（`dtb_product_class` に実在） |
| 買取価格 | 補助表 `dtb_product_sub_class` に持つ実装がある | `dtb_product_class.buy_price` に統合（実在確認済み）。列の所在が現行と異なる |
| 価格履歴 | `dtb_price_history`（`buy_price`・`old_buy_price`・`standard_price`・`old_standard_price`） | 同一スキーマ |
| 買取価格表 | `mtb_buy_price_list`（`nm_price`・`price`・`special_flg`、`MAX_NM_PRICE`＝10000） | 同一スキーマ |

本機能では `dtb_product_class.price02`（販売価格）を書き換えず、検証時の上限比較にのみ用いる点は現行・移行先で同じ。基本設計が描く本機能固有の追加仕様は無い。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| 商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押す | `POST /{admin_route}/product/edit_bulk_update_buy_price`（ボディに `ids[]`） | 選択商品について編集表が開く。 |
| 編集画面をブックマーク相当で開く | `GET /{admin_route}/product/edit_bulk_update_buy_price?ids[]=…` | 同上。複数 ID は `ids[]` を繰り返す。 |
| `ids` を付けずに編集 URL へ入る | `GET /{admin_route}/product/edit_bulk_update_buy_price`（`ids` 空） | エラーフラッシュのうえ、セッションの `eccube.admin.product.search.page_no` を使って `GET /{admin_route}/product/page/{page_no}` へリダイレクトする。 |
| 「登録」で確定 | `POST /{admin_route}/product/bulk_update_buy_price` | 検証成功時は更新後、セッションのページ番号と `resume=1` 付きで一覧へリダイレクトする。失敗時は同一編集テンプレートを返す。 |
| 「商品一覧」リンク | `GET /{admin_route}/product/page/{page_no}` | セッションの `eccube.admin.product.search.page_no`（無ければ 1）へ遷移。保存はしない。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | メニューは `product` と `product_edit`。タイトルは商品管理＋副題で一括編集文言。表は商品 ID、商品名、言語、買取価格(NM)、在庫数（NM〜HP）、価格比率（買取-基準の注記付き）、2 行構成で第 2 行は基準価格 (NM〜HP)。公開ステータスが廃止（ID 3）の列は在庫セルを描画しない。規格 ID が 0 の状態列は在庫を 0 表記し、基準価格は `-`。 |
| JS 挙動 | `.js-buy-price` と `.js-base-price`（NM 基準価格）の入力で価格比率を再計算。初期表示時も NM 買取各行に対して一度計算する。 |
| CSS・レイアウト | 管理画面共通フレーム。表は縦スクロール上限約 70vh、表頭は sticky。 |
| モーダル・ポップアップ | なし。 |

補足: カードヘッダ内の「表示切替」に見える select は `name` を持たず、送信もサーバー処理も伴わない。

---

## 処理フロー

### 編集画面を表示する（`m03-02_admin_product_product_edit_bulk_update_buy_price`）

1. 管理画面の認証・共通制約を通過する。
2. `ids` を取得する。空ならキー `eccube.admin.error` で `admin.product.not_select` をフラッシュし、`eccube.admin.product.search.page_no`（無ければ 1）へ `admin_product_page` へリダイレクトする。
3. リポジトリの集約クエリで、各商品 ID・言語の通常規格のみを横持ちした行配列を得る。
4. フォーム種別 `BulkUpdateProductPriceType` に `product_classes` として渡し、フォームビューを描画する。隠しフィールド `productIds` にはカンマ区切りの商品 ID を載せる（一覧で選択した ID の列挙。言語展開後の行数とは一致しない）。

### 確定する（`admin_product_bulk_update_buy_price`）

1. 管理画面の認証・共通制約を通過する。
2. POST の `productIds` をカンマ分割し、再度集約クエリで `product_classes` を構築してフォームに束ねる。
3. `handleRequest` 後、未送信または検証失敗なら、フォームのエラーを管理画面へ積み、同一テンプレートを 200 で返す。
4. 検証成功なら、送信された各行について次を行う（全体を 1 トランザクションにまとめない）。
5. `product_class_id_nm` が空（0 含む）の行はスキップする。
6. 当該 NM 規格 ID の行が DB に無ければ例外メッセージ `admin.product.to_show_complete` を投げ、画面へエラー表示して終える（当行までのコミット済み更新はロールバックされない）。
7. 商品に買取減額率が無く、入力買取が 0 以外かつ 10000 以下のとき、`mtb_buy_price_list` に入力買取を `nm_price` とする行が無ければ例外 `admin.product.not_found_nm_price`。
8. 価格履歴の一括 INSERT（販売価格の新旧は NULL）の後、通常規格すべてへ買取・基準価格を更新するネイティブ UPDATE を実行する。1 商品行ごとにトランザクションをコミットする。
9. 全行で成功したら成功フラッシュ `admin.register.complete` を積み、`admin_product_page` へ `?resume=1` でリダイレクトする。

---

## 集計条件

編集表 1 行は「商品 ID × 言語」のグループに対応する。リポジトリの抽出条件は次のとおり。

| 指標 | 集計の要点 |
|------|------------|
| 対象規格 | `dtb_product_class` を商品・言語で結合し、`high_price_code` が NULL のものに限定する。 |
| 横持ち | 条件 ID 1〜4 について、規格 ID・基準価格・在庫合計・ステータス・割引率・買取価格を条件付き集約する。 |
| NM の販売価格 | 条件 1 の `price02` を `sell_price_nm` として 1 つ取る（検証専用）。 |
| 並び | 商品 ID 降順、言語昇順。 |

---

## 業務ルール・計算

### 保存時の買取価格の決め方

- 入力された NM 買取（`nmPrice`）が 0 の場合、分岐上は「高額用の率計算」側に進み、状態別に式で 0 に近い値へ丸められる。
- `nmPrice` が 1 以上かつ `MtbBuyPriceList::MAX_NM_PRICE`（10000）以下で、商品に買取減額率が無い場合、UPDATE は `mtb_buy_price_list` を NM 価格・状態・Foil/プロモ相当の `special_flg` で参照し、見つかればその `price`、見つからなければ `nmPrice` を各規格の `buy_price` にセットする SQL パスを使う。
- それ以外（高額帯、または買取減額率あり）は、Foil/プロモか否かと状態 ID に応じた率配列で `nmPrice` から切り上げ演算し `buy_price` を決める。率は商品の買取減額率マスタが優先し、無ければ定数既定値を使う。

### 基準価格

- 入力された `standard_price_nm` を、同一商品・同一言語・通常規格のすべての行の `standard_price` に同じ値で書き込む。状態別に基準価格を分けた更新にはならない。

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 買取価格(NM) | 必須（整数型） | ウィジェット属性で `step` 10、`max` 9999999999。フォーム型は Symfony `IntegerType`。 | 集約クエリの NM 買取 | 保存時は上記ルールで全通常規格の `dtb_product_class.buy_price` を再計算・更新。キーは `bulk_update_product_price[product_classes][n][buy_price_nm]`。 |
| 基準価格 (NM) | 任意（整数型） | `min` 0、`step` 10、上限 9999999999（実装内 10 桁の 9 連結）。 | 集約クエリの NM 基準価格 | `dtb_product_class.standard_price` を対象規格すべて同一値で更新。キーは `…[standard_price_nm]`。 |
| 基準価格 (SP) | 任意だが readonly | 同上（readonly） | 集約値 | POST 値は読み取り専用。保存処理は `standard_price_nm` のみ用い、SP 列の入力値は更新計算に使わない。 |
| 基準価格 (MP) | 同上 | 同上 | 同上 | 同上 |
| 基準価格 (HP) | 同上 | 同上 | 同上 | 同上 |
| 商品 ID（表示兼隠し） | 隠し | 文字列長の個別制約は Form 型に無い | 集約の商品 ID | `…[product_id]`。更新キーではなく表示と POST 再構築用。 |
| 言語（隠し） | 隠し | 同上 | 集約の言語名 | `…[language]`。検証メッセージに含める。 |
| NM 規格 ID（隠し） | 隠し | 同上 | 集約の NM 規格 ID または 0 | `…[product_class_id_nm]`。保存の基点 ID。0 の行は保存スキップ。 |
| SP / MP / HP 規格 ID（隠し） | 隠し | 同上 | 各状態の規格 ID または 0 | テンプレートの有無判定に使う。保存処理の主経路では参照しない。 |
| 状態ステータス（隠し） | 隠し | 同上 | 各状態の公開ステータス ID | テンプレートで廃止時の空白表示に使う。 |
| 割引率（隠し） | 隠し | 同上 | 集約の率 | 保存時の率計算は商品に紐づく買取減額率を優先し、フォームの rate は主説明から外れる。 |
| 販売価格（NM）（隠し） | 隠し | 同上 | NM の `price02` | 更新しない。検証コールバックで買取との大小比較に使用。キー `…[sell_price_nm]`。 |
| CSRF トークン | 必須 | トークン長はフレームワーク任せ | セッション発行 | `…[_token]`。 |
| 対象商品 ID 列（隠し） | 実質必須 | カンマ区切り文字列 | 編集画面で選択 ID を連結 | フィールド名 `productIds`。再検索に使う。 |
| 価格比率 | 表示のみ | 入力不可 | 空→JS が計算 | サーバーへ送らない。 |

### エッジケース

| ケース | 扱い |
|--------|------|
| 複数行送信の途中で例外 | それ以前にコミットした商品グループは保存済みのまま。以降は未処理。 |
| 一覧と別タブで同一規格を編集 | 楽観ロックは無い。後勝ち。 |
| NM 規格が無い商品・言語 | `product_class_id_nm` が 0 となり保存スキップ。表では基準・在庫が `-` 寄りに見える。 |
| 買取 0 | マスタ存在チェックをスキップし、率 SQL 側の分岐へ進む。 |

---

## フォーム送信時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | POST のフォームが送信済みかつ妥当か | 否ならエラーをフラッシュし編集画面を再表示。 |
| 2 | 各行の CSRF 等を含む型レベル検証 | コールバックで買取が販売（NM）または基準（NM）を超えないか。 |
| 3 | `product_class_id_nm` が空／0 | 当行は保存ループをスキップ。 |
| 4 | 規格 ID の実在 | 無ければ例外メッセージをフラッシュし再表示。 |
| 5 | マスタ整合（低額帯・減額率なし） | `mtb_buy_price_list` に該当なしなら例外メッセージをフラッシュし再表示。 |
| 6 | DB 更新 | 成功時は当行コミット。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧との表示差 | 成功後は一覧へ戻り `resume` でセッション検索を再利用するため、通常は最新の検索結果に反映される。 |
| 販売価格 | 当機能では `price02` を書き換えない。検証は送信時点の値に依存する。 |
| 価格履歴 | 対象規格ごとに INSERT される。本経路では販売価格の新旧列は NULL。 |

---

## API/バッチ結果

本機能では外部 API やバッチを扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 編集: `ids` 配列。確定: `productIds` と `bulk_update_product_price[...]` 一式。 |
| 成功時出力 | 商品一覧ページへの HTTP リダイレクトと成功フラッシュ。 |
| 失敗時出力 | 編集 HTML 200 とエラーフラッシュ、または一覧へのリダイレクトとエラーフラッシュ（`ids` 空）。 |

---

## DBカラム

当機能で主に触る列は次のとおり（履歴は INSERT）。

| テーブル | 列 | メモ |
|----------|-----|------|
| `dtb_product_class` | `buy_price` | 条件別に再計算され更新。 |
| `dtb_product_class` | `standard_price` | 入力 `standard_price_nm` が全通常規格行に反映。 |
| `dtb_price_history` | `buy_price`, `old_buy_price`, `standard_price`, `old_standard_price` 等 | 一括 INSERT。販売関連列は NULL。 |

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_price_history / dtb_product_class | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| 買取 vs 販売（NM） | 買取が販売を超えると `admin.product_class.buyprice_valid_bulk`（日本語確認値は販売価格との比較文）。 |
| 買取 vs 基準（NM） | 買取が基準を超えると `admin.product.buy_price_exceeds_standard`。 |
| 整数・上限 | `IntegerType` とテンプレート属性の組み合わせ。 |

---

## 権限・認可

| 利用者状態 | 当機能 |
|------------|--------|
| 管理画面にログインし当ルートへ到達できる運用者 | 当画面の操作が可能である（ルート単体のロール制約は本紙では YAML を網羅しない）。 |
| 未到達の主体 | 管理画面共通の認証により拒否される。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 一覧から一括編集へ | `GET/POST m03-02_admin_product_product_edit_bulk_update_buy_price` |
| 確定成功 | `GET admin_product_page` に `resume` クエリ |
| 確定失敗・例外 | 同一編集テンプレート |
| `ids` 空で編集 URL | `admin_product_page` |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| 確定成功 | 成功フラッシュを積む | 一覧はセッションのページ番号と `resume` で再検索表示。 |
| `ids` 空 | エラーフラッシュ | 一覧はセッションのページ番号へ。 |

---

## エラー処理

| 事象 | 利用者へ見える結果 |
|------|---------------------|
| フォーム検証失敗 | 編集画面再表示＋エラーメッセージ |
| 規格 ID 不正・削除済み | 編集画面再表示＋ `admin.product.to_show_complete` |
| 買取がマスタに無い（条件を満たす低額帯） | 編集画面再表示＋ `admin.product.not_found_nm_price` |
| `ids` 未選択 | 一覧へ＋ `admin.product.not_select` |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|
| M03-10-MSG-001 | 管理画面上部 | 1つ以上の商品を選択してください | 商品を選択せずに一括編集画面を開いたとき | 商品一覧画面に遷移する |
| M03-10-MSG-002 | 管理画面上部 | 要ソース確認 | 要ソース確認 | 要ソース確認 |
| M03-10-MSG-003 | 管理画面上部 | 要ソース確認 | 一括編集で価格を更新中にエラーが起きたとき | 要ソース確認 |
| M03-10-MSG-004 | 管理画面上部 | 登録が完了しました。 | 一括編集で価格を更新したとき | 商品一覧画面に遷移する |

文言は `ProductBulkUpdateBuyPriceController` のフラッシュ設定と `messages.ja.yaml`（1962/1963/1964/1965/1966）を正とする。可変部（`%…%`）はフォーム検証／例外由来。

---

## 副作用・ログ

| 種類 | 内容 |
|------|------|
| DB | 上記 UPDATE・履歴 INSERT。行単位コミット。 |
| フラッシュ | 成功・エラー・警告メッセージ。 |
| 監査ログ専用出力 | 本機能固有のファイルログは主題としない。 |

---

## 調査補助（grep）

ソース上の受け口は `ProductBulkUpdateBuyPriceController`、`ProductBulkUpdateBuyPriceStoreAction`、`BulkUpdateProductPriceType`、`getProductClassForPriceUpdate`、`updateBuyPriceForAllConditions`、`insertBuyPriceHistoryForAllConditions` などで交差確認できる。

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `m03-02_admin_product_product_edit_bulk_update_buy_price` … `GET, POST` … `/{admin_route}/product/edit_bulk_update_buy_price`（クエリ（またはボディ）の `ids` で指定した商品について、言語×商品ごとの一括編集フォームを表示する。`ids` が空ならエラーフラッシュのうえ商品一覧へリダイレクトする。）
- `admin_product_bulk_update_buy_price` … `POST` … `/{admin_route}/product/bulk_update_buy_price`（一括編集フォームの確定。検証成功時は価格更新・価格履歴登録のうえ、セッションに保存された一覧ページへクエリ `resume=1` 付きでリダイレクトする。）

---

## 排他制御・トランザクション

| 観点 | 内容 |
|------|------|
| トランザクション境界 | 保存ループは商品行ごとに価格履歴INSERTと通常規格UPDATEを行い、1商品行ごとにコミットする。全行一括の原子性は持たない。 |
| ロック | 対象規格への行ロック・悲観ロック・楽観ロック・ロックファイルは使用しない。同じ規格を同時に更新した場合は後から確定した値が残る。 |
| 例外時 | ある行で例外が起きても、それ以前にコミット済みの商品行はロールバックされない。例外行以降は未処理となる。 |
