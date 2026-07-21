# m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）

## 概要

管理画面「商品管理」にある「略称タグ登録／編集」機能である。`mtb_storage_code` に対応するマスタ一行を画面上部のフォームで新規作成または更新し、下部に同一マスタを並び順でページ分割した一覧を表示する。一覧のリンクから編集モードへ切り替え、同じ送信ボタンで更新する。
同一 Twig 上には CSV 出力・CSV インポート画面へのリンクと、行ごとの削除導線もあるが、そのうち削除の論理と CSV／エクスポートのストリーム仕様は本書では深掘りしない。
本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。
ec-cube-enterprise のコア管理画面におけるルート `admin_product_storage_code*` 系、テンプレート `admin/Product/storage_code.twig`、フォーム型 `storage_code`、`mtb_storage_code` を確認値とする。カスタマイズ区分は現行踏襲であり、現行挙動は pf-eccube3 を参照し、DB関連（テーブル名・列名・型・制約・関連）は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド単位の解剖は本文の主説明としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

現行（pf-eccube3）と移行先（ec-cube-enterprise）のDBスキーマを比較した結果は次のとおり。相違が判明した場合は ec-cube-enterprise 実装を正とする。

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 略称タグ本体 | `mtb_storage_code`（`id`・`name`・`` `rank` ``・`alphabet_sort_flg`） | 同一スキーマ。`name` は文字列長 255。 |
| 並び順キー | `` `rank` `` 昇順 | 同一。現行・移行先で `rank` を用い、`sort_no` への置き換えは無い。 |
| 削除方式 | 紐付け商品が無いとき物理削除 | 同一。論理削除列は持たない。 |

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| ナビから略称タグ登録／編集 | `GET /{admin_route}/product/storage` | 上部に登録フォーム、下部に一覧。ページおよび表示件数はセッションまたは既定に従う。 |
| 一覧ページ送りのみ | `GET /{admin_route}/product/storage/page/{page_no}` | 一覧のページが切り替わる。現在のページ番号はセッション `admin.product.storage.page_no` に書き込む。 |
| 行の id または名称または「変更」 | `GET /{admin_route}/product/storage/{id}` | 上部フォームが当該行の内容になり、一覧は表示される。「新規登録へ戻る」がヘッダ付近に出る場合がある。 |
| 編集中のページ送り | `GET /{admin_route}/product/storage/{id}/page/{page_no}` | 編集状態を維持したまま一覧ページだけ変える。ページャはこのルート名を使ってリンクする。 |
| 画面下部「登録」 | `POST /{admin_route}/product/storage_code/store`（新規時）または `POST /{admin_route}/product/storage_code/store/{id}`（編集時） | フォームに載った名称・並び順・チェックの内容が検証される。妥当なら保存し、成功フラッシュのあと `GET …/product/storage` にリダイレクトされる（実装ソースは同名ルートを指し、そのルート既定に `page_no` などがあるのみで、復帰先パス末尾に編集 `{id}` を付けない）。妥当でなければ同じ一覧トップ向けへのリダイレクトであり失敗フラッシュのみとなる。一覧に新規行があるなら一覧から再度編集を開ける。 |
| 表示件数プルダウン | `GET`（現在のパス維持）にクエリ `page_count=` を追加 | `.js-page-count` の変更でクエリのみ付いて再読込。許容リストは `[10, 50, 100, 300, 500, 1000]`。選択値はセッション `admin.product.storage.page_count`。 |
| 行の削除（window.confirm 確認ダイアログ経由） | `DELETE /{admin_route}/product/storage_code/{id}/delete` | コアの共通トークン名で CSRF が検証される。関連商品がある略称タグは削除されずメッセージ鍵ベースで訳文がフラッシュされる。無関係な略称タグは DELETE 済みフラッシュあり。一覧トップへ戻るリダイレクト。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | `menus = ['product', 'storage_code']`。タイトル「商品管理」、サブタイトルは新規または編集で切替。親カードの見出しは翻訳キー `admin.common.registration__add` または `admin.common.edit`。名称ラベルは翻訳キー `admin.setting.shop.trade_law.header.name`（日本語確認値は「名称」）、並び順は `admin.product.format.format_rank`。チェック項目はフォーム型のラベル文字列どおり画面上にチェックボックスとして出る（日本語環境での文言はソース上「アルファベット順ソートフラグ」。一覧表の並び順列はチェック状態に応じて「アルファベット」「コレクター番号」と表示のみで固定文案）。画面上の送信ボタン文言は Twig 側で固定の「登録」（翻訳キーには結び付けていない）。一覧は id・名称へ編集へのリンク、`admin.common.edit` ボタン、`admin.common.delete` ボタン（モーダル文言は `admin.common.delete_modal__message`）。ヘッダ右に CSV 出力・インポート画面へのリンク。編集中表示の「新規登録へ戻る」は `admin.common.back_to_new_registration`。 |
| JS 挙動 | `.js-page-count` の change でクエリに `page_count` をセットしてページ全体を読み込み直す。削除リンクは共通スクリプトにより `DELETE` メソッド化と確認ダイアログが付く想定であり、詳細は管理画面共通部品とする。 |
| CSS・レイアウト | テンプレート内にページ見出し用の細い書式のみ。コンテンツレイアウトは `default_frame.twig` 系へ準拠。 |
| モーダル・ポップアップ | 削除前の確認のみ（削除共通）。登録送信前に独自の確認は無い。 |

---

## 処理フロー

### 新規一覧とフォームを表示する（`GET admin_product_storage_code` および `GET admin_product_storage_code_page`）

1. 管理画面共通の認証を通過する。
2. パラメータ `StorageCode` を渡さないため、処理内では新規エンティティを生成してフォームのデータモデルとする。
3. フォーム型 `storage_code` でフォームビルダを構成し、そのままフォームオブジェクト生成。
4. セッションにページ番号（キー確認値 `admin.product.storage.page_no`）および表示件数（キー確認値 `admin.product.storage.page_count`）を保存する。クエリまたはパスにある `page_no`・`page_count` が優先される。
5. リポジトリの並び順 `rank` 昇順のクエリをページネーションに渡して一覧を用意する。
6. Twig で `form` と `pagination` と `id = null`、`page_no`、`page_count` を渡して描画。フォーム `action` は `admin_product_storage_code_store` とし `id` 引数は null（生成 URL は末尾セグメントなしの `/storage_code/store`）。

### 編集一覧とフォームを表示する（`GET admin_product_storage_code_edit` および `GET admin_product_storage_code_edit_page`）

1. ルートコンバータが id に対応する行を読めないとき HTTP 404。
2. 同上でフォームを組み、その行をデータモデルとしてバインド。
3. セッションのページおよび件数処理は新規一覧と同一。
4. Twig の `id` は当該行の主キー。ページャへの route 名だけ `admin_product_storage_code_edit_page` になり、`params` に `id` が含まれる。フォーム `action` は `admin_product_storage_code_store` に `id`。

### 略称タグを保存する（`POST admin_product_storage_code_store`）

1. ルート末尾に `{id}` があるとき、コンバータが当該行を渡す。末尾が無ければデータモデルを null のままビルダに渡し、その後 `handleRequest` で投入される。
2. `handleRequest` 後、未送信または `isValid` が偽ならフラッシュ種別エラーとして `admin.register.failed` を積む（日本語環境での確認文言は「登録できませんでした。」）。
3. 失敗時は `GET …/product/storage` へ HTTP 302。編集入力の復元や同一画面でのフィールド直下エラー表示はしない。
4. `isValid` が真なら、フォームデータのエンティティをそのまま `persist` と `flush` とする。
5. 成功時はフラッシュ `admin.register.complete`（日本語環境での確認文言は「登録が完了しました。」）。
6. 成功後のコードは `redirectToRoute('admin_product_storage_code', ['id' => 保存済みエンティティの主鍵])` とある。この名前だけを指しているため復帰先は `/{admin_route}/product/storage` である。サイトルートに `{id}` セグメントが無く、Doctrineのエンティティ引数解決は `{id}` プレースホルダに結びつかないため、`$StorageCode` 引数は null のまま `index` に入り、処理先頭で新規オブジェクトへ置き換えられる。画面上部フォームとサブタイトル文言は一覧トップ側の新規状態に読み換わる。`redirectToRoute` に渡している `id` キーはSymfonyのサイトルートと一致しない余剰キーとなるためクエリだけへ反映されても画面上の自動編集状態とは結びつかない運用となる。一覧で保存済み一行を確認し、継続編集には `GET …/storage/{id}` のリンクへ戻る。
7. 明示的なトランザクション境界はソース上は ORM の `flush` に任せている。

### 略称タグを削除する（`DELETE admin_product_storage_code_delete`）

1. 基底コントローラのトークン検証を通す。共通トークン名のパラメータまたはヘッダ `ECCUBE-CSRF-TOKEN` と照合され、無効時はフレームワークがアクセス拒否（HTTP 403）となる。
2. 当該略称タグが 1 件でも商品へ参照されているとき、メッセージ鍵は `admin.storage.delete.failed`。プレースホルダ `%name%` は略称タグの名称。この翻訳文面は環境ロードセットに依存する。エラーとしてフラッシュ処理し一覧トップへ戻り、削除は起こらない。
3. 関連商品が 0 件なら削除し、成功フラッシュ `admin.common.delete_complete` と一覧トップへのリダイレクト。
4. 明示的ログの埋め込みはこのメソッド内には無い。

---

## 集計条件

本機能では金額集計などを行わない。一覧ページネーションのみで、並び順のキーは `rank` 昇順の全件クエリ結果をウィンドウに切るだけである。

---

## 保存および削除時の判定順序（登録送信）

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 送信後のSymfonyフォーム妥当性判定 | 不備時はフラッシュのみで `GET …/product/storage` へリダイレクト。 |
| 2 | 妥当で永続化 | `redirectToRoute('admin_product_storage_code', …)` で成功フラッシュ。上部フォームは新規用に再描画される（理由は処理フロー項を正とする）。 |

（フォーム側 CSRF トークンの不一致についてはSymfonyフォーム処理の側で異常となる。本文では HTTP 状態や例外の細部まで固定しない）

### 削除

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 共通 CSRF | 無効時は Symfony アクセス拒否（HTTP 403）。 |
| 2 | `getProducts` のコレクション件数が 0 より大きいか | はいなら削除せずフラッシュのみ。|
| 3 | （上記に該当しなければ）物理削除および flush |

---

## 業務ルール・計算

名称の重複や並び順の重複について、画面フォームとコントローラ単体にはアプリ独自のチェックロジックは無く、DB にユニーク制約があるかは別途スキーマを見ることとする。
アルファベットフラグ自体は並び順数値とは独立した列であり、画面上の一覧「並び順」列はフラグ状態のラベルを表示しているだけであり、並び順数値とは別項目である。
本機能はコア機能に属し、プラグインフォームイベントで拡張され得る点はソース差分での確認値とする。

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 名称 | 必須 | フォーム型にSymfony `Length` 制約無し。永続先列はDoctrineで文字列長確認値255 | 新規は未入力状態でウィジェットだけ描画される。編集は `mtb_storage_code.name`。 | Symfony `NotBlank`。キー `storage_code[name]`。列 `mtb_storage_code.name`。 |
| 並び順 | 必須 | 整数入力。検証として `Range` 最小0最大32767。`notInRangeMessage` は StorageCodeType.php:51 の直書きリテラル `並び順は {{ min }} から {{ max }} の間で入力してください。`（翻訳キーではない。M03-14-MSG-011）。 | 編集時は現在のランク。 | キー `storage_code[rank]`。列 `mtb_storage_code.rank`（マッピング上は名前付きランクカラム）。 Symfony `IntegerType` と `NotBlank`。 |
| アルファベット順ソートフラグ | 任意 | チェックオンオフ論理値 | `false`。編集は列の現在値。 | キー `storage_code[alphabetSortFlg]`。列 `mtb_storage_code.alphabet_sort_flg`。チェックオンで真、送信に含まれずならSymfonyチェック種の既定により偽側と解釈される。|

### エッジケース

| ケース | 扱い |
|--------|------|
| 登録送信で入力不備があったとき | 編集中であっても `GET …/product/storage` へ戻る。入力エラー一覧はフラッシュのみで一覧トップ状態の画面が返るため、入力途中の復元には向かない。 |
| 登録送信が成功した直後も `GET …/product/storage` へリダイレクトされ、上部フォームは新規状態として再レイアウトされる。一覧側で結果を確認し、必要なら編集へのリンクへ戻る。 |
| `/product/storage/{存在しない id}` に GET | 404。|
| DELETE で商品と紐づいた略称タグ | メッセージ鍵のみ確定、そのまま一覧トップへ。 |
| CSV 出力・インポート | 詳細処理は別。画面からは単に別ルートへ遷移する。 |

---

## データ整合性

保存後のリダイレクト先も結局 `GET …/product/storage` 側の一覧と一覧上のウィンドウ位置はセッションとページ情報に従い再クエリされる。データベース上の値はフラッシュ適用より前で既に確定済みになる。
画面上部フォームに表示されるのは、このGETで新しく組んだ未永続エンティティに基づくため、一覧の各行の名前・並び順と上部フォーム表示は自動では一致しない点に注意する。
他画面で同じ略称タグを同時変更したときのロックやバージョン列はソース上読み取れず、競合結果はデータベース最終勝ちに近い挙動とする（別途楽観鎖フラグがある場合は本体スキーマを見る）。
一覧のページ番号はセッションに残るので、一覧と編集状態の論理的な一致はユーザー操作順に依存する。

---

## API/バッチ結果

管理画面経由でのCSVエクスポート・インポートはそれぞれ別ルートに属する。登録送信自体はブラウザPOSTのみであり、公開APIやキューバッチの起動とは無関係として本節対象にしない。
本機能の登録処理が外部APIを明示的には呼んでいないことを確認値として記載するのみとする。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | GET 側はページ番号、表示件数、編集対象の id（任意）、POST はフォーム複数項目とSymfonyフォーム用トークン。DELETE は共通 CSRF パラメータ。 |
| 成功時出力 | HTML 一覧とフォームまたはリダイレクトによる再GET。フラッシュ種別により完了・失敗のメッセージ帯がある。CSV系はバイナリストリーム。 |
| 失敗時出力 | バリデーション失敗でもHTMLは一覧トップ向けのみ。異常応答コードはSymfonyとルーターに従う。 |
| 副作用 | INSERT または UPDATE により `mtb_storage_code`。DELETE で同一行削除。セッションのページ状態更新。フラッシュスタックへの積増。削除で関連チェックのみ、カスケードの詳細はリレーション側のCascade定義および商品側コードを確認する。 |

---

## DBカラム

| テーブル | 列 | メモ |
|----------|-----|------|
| `mtb_storage_code` | `id` | 主キー自動採番。 |
| `mtb_storage_code` | `name` | 略称タグ名称。画面上「名称」とラベル付け。 |
| `mtb_storage_code` | `` `rank` `` | 並び順。昇順クエリおよびCSV見出しの「並び順」と対応。 |
| `mtb_storage_code` | `alphabet_sort_flg` | 並び順列のユーザー向け表示と、各種並べ替えSQLで参照される（業務的意味の網羅は本書対象外）。 |

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | mtb_storage_code | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| 名称 | Symfony `NotBlank`。 Length 明示なしでも255列に対して保存時運用環境およびDB側に従う。 |
| 並び順 | `NotBlank` と `IntegerType` と 0〜32767 の Range。エラーコメントはソース上日本語ひな型。 |
| アルファベットフラグ | 必須制約無しのチェック。 |
| DELETE | 共通CSRFのみ加え、アプリ側は関連商品個数のみを見て拒否または実行。 |

---

## 権限・認可

| 利用者状態 | 画面上の一覧・編集フォームおよび登録POST |
|------------|--------------------------------------------|
| 未ログイン | ファイアウォールにより管理画面共通の認証チャレンジへ進むまで本ルートのアクション処理には入らない。 |
| 管理画面ログイン済み運用者 | ルート単位のアノテーションにより追加の許可フラグ情報はソース上読み取っておらず、商品管理へ辿れる主体はいずれも当画面を再利用し得る。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 一覧の編集へのリンクまたは id または名称リンク | `GET …/product/storage/{id}` |
| 「新規登録へ戻る」リンク | `GET …/product/storage` |
| 「登録」押下後成功または失敗 | いずれも `GET admin_product_storage_code`（サイトルート上は `/{admin_route}/product/storage`）。成功時のみ成功フラッシュ。失敗時は失敗フラッシュ。 |
| 「CSV 出力」「CSV に取込」 | それぞれ `GET …/export` と `GET …/csv`。詳細フォーマットも含め処理は別。 |
| 削除実行後成功または商品紐づけ失敗 | `GET …/product/storage` |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| GET 一覧／編集 | ページおよび件数をセッションに書き込む（キー確認値は本文の処理フローに記載） | 一覧のウィンドウ位置と入力欄の内容が揃っている（失敗復帰の例外は一覧トップに落とすのみ） |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| フォーム入力不備 | フラッシュ種別エラー、`admin.register.failed`。リダイレクト先一覧トップ。フィールド側のSymfonyエラー一覧は画面上に復元されず捨てられる構造となる。|
| DELETE 時に関連商品がある | メッセージ鍵ベースでエラーフラッシュ。一覧トップへ。データは削除されない。 |
| DELETE 時共通CSRF が無効 | Symfony アクセス拒否（HTTP 403）。詳細応答体裁は共通実装による。|

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 |
|--------------|----------|--------------|----------|
| M03-14-MSG-001 | 管理画面上部フラッシュ | 登録できませんでした。 | 略称タグ登録／編集の送信後、フォーム未送信またはバリデーション不正のとき（`admin.register.failed`）。一覧トップへリダイレクト |
| M03-14-MSG-002 | 管理画面上部フラッシュ | 登録が完了しました。 | 略称タグの persist・flush が完了したとき（`admin.register.complete`）。`admin_product_storage_code` へリダイレクト（id パラメータ付き。同ルートのパスに `{id}` は無い: StorageCodeController.php:69） |
| M03-14-MSG-003 | 管理画面上部フラッシュ | 商品で使用されているため、「%name%」の略称タグは削除することができません。 | 削除対象の略称タグが商品で使用されている（`getProducts()>0`）とき（`admin.storage.delete.failed`）。削除中止・一覧トップへリダイレクト |
| M03-14-MSG-004 | 管理画面上部フラッシュ | 削除しました | 関連商品0件で略称タグの削除が成功したとき（`admin.common.delete_complete`）。一覧トップへリダイレクト |
| M03-14-MSG-005 | 管理画面上部フラッシュ | 要ソース確認 | CSVインポートフォームがバリデーション不正（`checkFormValid()` 偽）のとき。フォームエラーごとに1件フラッシュ。テンポラリデータ削除のうえ CSVアップロード画面へリダイレクト。文言は可変（`$error->getMessage()`：CsvImportType の import_file NotBlank／File maxSize 等。StorageCodeController.php:257-266）で単一の逐語文言に確定不可 |
| M03-14-MSG-006 | 管理画面上部フラッシュ | CSVのフォーマットが一致しません | アップロードファイルが取得できない（null）とき（`admin.common.csv_invalid_format`）。CSVアップロード画面へリダイレクト |
| M03-14-MSG-007 | 管理画面上部フラッシュ | CSVのフォーマットが一致しません | インポートデータ取得に失敗した（`$data===false`）とき（`admin.common.csv_invalid_format`）。CSVアップロード画面へリダイレクト |
| M03-14-MSG-008 | 管理画面上部フラッシュ | 要ソース確認 | CSVヘッダー・データ件数・登録処理中に例外（`\Throwable`）が発生したとき。テンポラリデータ削除・インポート中止のうえ CSVアップロード画面へリダイレクト。文言は可変（`$e->getMessage()`：ヘッダー不一致／データ空／並び順・名称重複／DB例外等。StorageCodeController.php:288-302）で単一の逐語文言に確定不可 |
| M03-14-MSG-009 | 管理画面上部フラッシュ | 登録が完了しました。 | CSV登録処理が例外なく完了したとき（`admin.register.complete`）。テンポラリデータ削除のうえ CSVアップロード画面へリダイレクト |
| M03-14-MSG-010 | ブラウザ確認ダイアログ（window.confirm） | この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？ | 一覧の「削除」ボタンクリック時（`admin.common.delete_modal__message` を data-message 経由で表示。function.js:161-179）。OKで DELETE 送信、キャンセルで中止 |
| M03-14-MSG-011 | 要ソース確認 | 並び順は {{ min }} から {{ max }} の間で入力してください。 | 並び順が0〜32767の範囲外で送信されたとき（`Range` 制約 `notInRangeMessage` 直書きリテラル、StorageCodeType.php:48-52）。表示位置・後続処理は要ソース確認: store() は `!isSubmitted()||!isValid()` 時に `admin_product_storage_code` へリダイレクトする（StorageCodeController.php:115-118）ため、`form_errors(form.rank)`（storage_code.twig:92）へ到達する再描画経路がソース上確認できない |

---

## 試行制限

本機能ではレートリミットやロックアウトを設けず、Symfonyセッションを使うのみである。

---

## ログ・監査

一覧画面の単純参照や単行保存処理にアプリ側で詳細ログを明示的に出力するコードパスは薄い一方、一覧画面とは別にあるCSVインポートのコントローラメソッドはログ関数にメッセージを出す。この登録送信パスだけを見れば、保存成功でも失敗でも管理画面共通の開発ログとは別個のイベントログ強制はソース上読み取れない。

### ログに出してはいけないもの

- パスワード値
- なりすまし対策用のCSRFまたはセッションIDのすべて
- Remember Me に関わる不可逆トークンの原データ
- 利用者入力のCSV内部の全部（CSV機能用のログを書くなら項目設計側で検討すること）

---

## セッション

### 本機能におけるセッション

| 観点 | 内容 |
|------|------|
| GET 一覧または編集 | `admin.product.storage.page_no` と `admin.product.storage.page_count` が更新または初期化される。 |

### セッションへ保存しない情報

略称タグの名称入力途中の復元状態は検証NG時にもセッションに残さず、フラッシュのみに頼っている。

---

## Cookie

Symfonyセッション用Cookieのみで、機能固有Cookieは増やしていない。この画面がセッションIDを読むときのCookie名体裁は共通フレームに従い、機能個別値はソース上ここだけからは固定しない。

---

## 排他制御・トランザクション

明示的楽観バージョン列はソース上読み取れない。Doctrineの `persist` と `flush` に任せ単行更新となる。

---

## 調査補助（ソース照合用）

Symfonyルートおよびコントローラは `StorageCodeController`、Twig は `src/Eccube/Resource/template/admin/Product/storage_code.twig`、フォームは `storage_code` と `StorageCodeType`、一覧メニューの URL は eccube_nav の `abbreviation_tags` と `admin_product_storage_code`。テストクラスがあり登録および検証エラーおよび削除関連の自動検証がある。

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_product_storage_code` … `GET` … `/{admin_route}/product/storage`（新規用フォーム（未保存エンティティ）と一覧の初期表示、既定ページ 1。）
- `admin_product_storage_code_page` … `GET` … `/{admin_route}/product/storage/page/{page_no}`（同上、`page_no` は 1 以上の整数。）
- `admin_product_storage_code_edit` … `GET` … `/{admin_route}/product/storage/{id}`（対象 id の編集フォームと一覧。対象不存在時は HTTP 404。）
- `admin_product_storage_code_edit_page` … `GET` … `/{admin_route}/product/storage/{id}/page/{page_no}`（編集モードのままページ送りした一覧表示。）
- `admin_product_storage_code_store` … `POST` … `/{admin_route}/product/storage_code/store/{id}`（フォームの登録送信。前者は新規、後者は対象 id 更新時の `action` に使われる。）
- `admin_product_storage_code_delete` … `DELETE` … `/{admin_route}/product/storage_code/{id}/delete`（略称タグ一行の削除（同一画面からのリンク）。）
