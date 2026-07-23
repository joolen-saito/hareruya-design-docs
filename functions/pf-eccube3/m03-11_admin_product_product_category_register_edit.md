# 商品管理 — カテゴリ登録・編集

## 概要

管理画面「商品管理」において、既存カテゴリの子として新規ノードを追加したり、既存ノードの属性を更新したりする機能である。同一の Twig テンプレート上に兄弟一覧や階層ツリーも描画されるが、本書ではフォーム送信に関わる新規作成（`POST …/category/{parent_id}`）と更新（`POST …/category/{id}/edit`）、およびそれらに紐づく GET のフォーム表示に範囲を限定する。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。ec-cube-enterprise の管理画面ルート `admin_product_category_show`・`admin_product_category_edit`・`admin_product_category_create`・`admin_product_category_update` に紐づく処理、フォーム型、永続化を確認値とする。

本機能のカスタマイズ区分はカスタマイズである。画面・処理の挙動は現行リポ（pf-eccube3）の実装を参照し、DB関連（テーブル名・列名・保存先・副作用のDB更新）は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。一覧のドラッグ並べ替え、削除、カテゴリ CSV のストリーム出力、CSV 取込・一括アップロード画面の導線の業務定義の全部は本書では正としない。一覧やツリーと同一画面に載る点のふるまい概要は必要最小限に触れる。

コントローラのメソッド名は本文の主説明としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。画面上の兄弟一覧・並べ替え・削除・CSV の詳細仕様は `m03-45_admin_product_product_category_list.md` を正とする。

---

## リニューアル移行時の扱い

登録・編集フォームが書き込む `dtb_category` の列は、移行先 ec-cube-enterprise ですべて実在を確認した。現行 pf-eccube3 では一部の拡張列を補助表に分離している。

### Excel基本設計により廃止された仕様（刷新後は実装不要）

本書は現行実装からのリバースであり、以下は現行挙動として記述しているが、Excel基本設計が廃止を宣言している。刷新後は実装しない。

- 商品コード（優先表示商品）（※Excel基本設計 0204 識別ID:12 により廃止。刷新後は実装しない）。削除。

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 英語名・拡張列 | 補助表 `dtb_category_sub`（英語名は `name_en`、非表示フラグ等） | `dtb_category` に統合（`category_name_en`・`front_search_hide_flg`・`branch_hide_flg`・`banner_image`・`icon_image`・`html_ja`・`html_en`・`search_parameters` を実在確認） |
| 新規保存時の並び順キー | `rank` を用いる経路がある | `dtb_category.sort_no` を採番・繰り上げ（実在確認済み） |
| 階層・親子 | `parent_category_id`・`hierarchy` | 同一 |

並び順キーは現行が `rank`、移行先が `sort_no` であり取り違えない。基本設計が描く本機能固有の追加仕様は無い。現行側の補助表と移行先列の正確な対応は pf-eccube3 実装で要確認とする。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| 親を選んだ子一覧 | `GET /{admin_route}/product/category/{parent_id}` | 上部に新規用フォーム（子カテゴリ作成）。送信先は `POST` の同パス。 |
| 行の編集アイコン | `GET /{admin_route}/product/category/{id}/edit` | 上部に編集用フォーム。送信先は `POST` の同パス。 |
| 子カテゴリ作成の送信 | `POST /{admin_route}/product/category/{parent_id}` | 検証と画像処理のあと保存し、成功なら `GET …/category/{parent_id}` へリダイレクトする。 |
| カテゴリ更新の送信 | `POST /{admin_route}/product/category/{id}/edit` | 検証後保存し、成功なら親がいれば `GET …/category/{parent_id}`、ルートカテゴリなら `GET …/product/category` へリダイレクトする。 |

---

## フロント挙動（登録・編集に関係する範囲）

| 観点 | 内容 |
|------|------|
| 表示要素 | 親がいる一覧または編集モードのとき、カード内にフォーム。日本語名・英語名、フロント非表・支店非表示の 2 チェック、埋め込み HTML（日・英）の複数行テキスト（行数 6）、検索パラメーターの一行テキスト。新規のみバナー・アイコンの隠し file とドロップゾーン・プレビュー。編集では登録済み画像があれば同一ラベル領域に読み取り専用で表示し、未登録なら文言のみ。画面下部の変換ボタンは「子カテゴリ作成」または「カテゴリ更新」のいずれか。 |
| JS 挙動 | 新規時のみ、バナー・アイコンそれぞれで file の change、ドロップゾーンの dragover／drop、クリックで隠し file を開く、プレビュー img。クライアント側で MIME が `image/` かつ拡張子が gif／jpg／jpeg／png のみ通す。 |
| CSS・レイアウト | 横型 Bootstrap フォームテーマ。ドロップゾーンは破線枠・淡色背景。 |
| モーダル・ポップアップ | 登録・編集フォーム自体はモーダルにしない。 |

---

## 処理フロー

### 子一覧で新規フォームを表示する（`GET admin_product_category_show`）

1. パスの `parent_id` が存在しない行に対応するとき 404 とする。
2. 新規用のカテゴリ行を用意し、親・階層をセットする。
3. 管理者向けカテゴリフォームでフォームを組み、`allow_image_upload` を真、アクションを `admin_product_category_create` にする。
4. イベント `ADMIN_PRODUCT_CATEGORY_INDEX_INITIALIZE` でビルダを拡張し得る。
5. 兄弟一覧・ツリー等のビューデータとともに Twig を返す。失敗した POST 後の再表示も同系のビューデータになる。

### 編集フォームを表示する（`GET admin_product_category_edit`）

1. パス id のカテゴリを読み、その親を得る。
2. 管理者向けカテゴリフォームでフォームを組み、`allow_image_upload` を偽、アクションを `admin_product_category_update` にする。
3. `isCategoryEdit` を真にし、変換ボタン文言を更新側にする。

### 子カテゴリを新規保存する（`POST admin_product_category_create`）

1. 親 id が実在しない場合はルーティング層で解決しないため、ここでは到達しない前提とする。
2. フォームに `handleRequest` する。未送信または検証 NG のとき、`GET show` と同様の構成で Twig を 200 で返す。
3. 検証済みのあと、階層が `eccube_category_nest_level` を超えないことを検証し、超えるなら HTTP 400 とする。同種の検証は保存完了処理の側でも行う。
4. バナー・アイコン file 項目があるとき、`save_image` 直下に `category` ディレクトリを用意し、各 `UploadedFile` を MIME・拡張子・Symfony `Image` 制約・移動成否で検証する。失敗時は該当フィールドにアップロードエラー、既に移動したファイルは `save_image` 配下に限り unlink してから再表示する。
5. 永続化に失敗し例外が上がった場合、新規で先に移動済みの画像パスだけを同様に unlink してから例外を再送出する。
6. リポジトリ `save` で INSERT（および PostgreSQL 時はシーケンス整合やロックを含み得る）。成功ログ後、イベント `ADMIN_PRODUCT_CATEGORY_INDEX_COMPLETE`、成功フラッシュ `admin.common.save_complete`、`CacheUtil::clearDoctrineCache`。
7. HTTP 302 で `GET …/category/{parent_id}` へ遷移する。

### 既存カテゴリを更新する（`POST admin_product_category_update`）

1. `handleRequest` し、未送信または検証 NG のとき編集画面と同構成の Twig を 200 で返す。
2. 新規と異なり、`processCategoryImageUploads` は呼ばれない。画像パスは既存値のまま維持される（本画面からの差し替えは行わない）。
3. 階層上限チェックのうえ `save` を呼ぶ。成功時のイベント・フラッシュ・キャッシュ破棄は新規と同型。
4. 親がいれば `GET …/category/{parent_id}`、親が null（ルートカテゴリ）なら `GET …/product/category` へリダイレクトする。

---

## 集計条件

本機能の登録・更新処理では一覧件数の集計や金額計算を行わない。

---

## 保存時の判定順序（階層）

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | フォーム送信と Symfony 検証 | 不備なら同一 Twig 200。 |
| 2 | `hierarchy` が `eccube_category_nest_level`（確認値 5）以下か（実装は `eccube_category_nest_level < hierarchy` を異常とする） | 異常なら HTTP 400。 |
| 3 | 新規のみ画像処理 | 失敗ならエラー付きで同一 Twig 200。 |

---

## 業務ルール・計算

新規保存時、リポジトリは親の `sort_no` に応じて新規行の `sort_no` を決め、それより大きい `sort_no` を持つ行を一括で繰り上げる更新を先行させてから INSERT する。ルート直下の新規は本画面のフォーム経路では提供されない（詳細は `m03-45_admin_product_product_category_list.md`）。

親の `sort_no` が null のデータが混在する場合の挙動は、運用データとリポジトリ実装を正とする。

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| カテゴリ名（日） | 必須 | `eccube_stext_len`（確認値 255、`NotBlank` と `Length`） | 新規は空、編集は DB の `category_name` | `dtb_category.category_name`。キー `name`。 |
| カテゴリ名（英） | 任意 | `eccube_stext_len`（確認値 255、`Length` のみ） | 新規は空、編集は DB の `category_name_en` | `dtb_category.category_name_en`。キー `category_name_en`。 |
| フロント非表フラグ | 任意 | チェック（論理値） | DB 現在値 | `dtb_category.front_search_hide_flg`。キー `front_search_hide_flg`。 |
| 支店非表示フラグ | 任意 | チェック（論理値） | DB 現在値 | `dtb_category.branch_hide_flg`。キー `branch_hide_flg`。 |
| 最新セット用バナー画像 | 任意（新規フォームのみ file あり） | 画像ファイル。Symfony `Image` で最大サイズ 10M、MIME jpeg／png／gif。サーバ側で `image/` 接頭 MIME と拡張子 gif／jpg／jpeg／png | 未選択 | 新規のみ `dtb_category.banner_image` に相対パス `category/{ファイル名}`。アップロード用キー `banner_image_file`（`mapped` 偽）。編集画面ではファイル入力なし。 |
| カテゴリアイコン画像 | 任意（新規のみ file あり） | バナーと同じ画像制約 | 未選択 | 新規のみ `dtb_category.icon_image`。キー `icon_image_file`（`mapped` 偽）。編集では差し替え不可。 |
| 埋め込みHTML（日） | 任意 | フォームに Symfony `Length` なし。DB は TEXT | 編集は DB の `html_ja`、新規は空に近い状態 | `dtb_category.html_ja`。textarea 行数 6。キー `html_ja`。 |
| 埋め込みHTML（英） | 任意 | 同上 | 同上 | `dtb_category.html_en`。キー `html_en`。 |
| 検索パラメーター | 任意 | `eccube_ltext_len`（確認値 3000、`Length`） | 編集は DB の `search_parameters` | `dtb_category.search_parameters`。キー `search_parameters`。 |

最大長の数値は `app/config/eccube/packages/eccube.yaml` の確認値を記載する。運用環境で上書きされている場合はその環境の値が正とする。

### エッジケース

| ケース | 扱い |
|--------|------|
| ルート直下一覧のみ（親 null） | 登録フォームカードは出ない。新規 POST は `admin_product_category` にはマップされない。 |
| 編集で画像を差し替えたい | 本画面の実装では不可。CSV 等の別経路を正とする。 |
| 永続化失敗（新規）で画像だけ先に移動済み | コントローラが移動済み絶対パス一覧を unlink してから例外を伝播する。 |

---

## データ整合性

保存成功後はリダイレクト先の GET でリポジトリ経由の最新行が読まれる。一覧のクエリキャッシュは `CacheUtil::clearDoctrineCache` で破棄するため、通常の保存直後にキャッシュのみ古い値が残り続ける設計にはならない。

---

## API/バッチ結果

本機能では管理画面外の公開 API 呼び出しやバッチ起動本体を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | GET は親 id または編集 id。POST はフォーム名 `admin_category`、CSRF、新規時は `multipart` と画像バイナリ。 |
| 成功時出力 | 302 リダイレクトと成功フラッシュ。 |
| 失敗時出力 | 検証失敗や画像失敗は 200 で同一 Twig。階層超過は HTTP 400。 |
| 副作用 | DB 更新、ファイル作成（新規かつ画像選択時）、失敗時の限定 unlink、処理ログ、イベント通知、Doctrine キャッシュ破棄。 |

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M03-11-MSG-001 | 管理画面上部 | 保存しました | 保存しました | カテゴリの登録・編集内容を保存したとき | 管理画面_商品管理_カテゴリ一覧画面に遷移する |
| M03-11-MSG-002 | 管理画面上部 | 削除しました | Deleted | カテゴリを削除したとき | 管理画面_商品管理_カテゴリ一覧画面に遷移する |
| M03-11-MSG-003 | 管理画面上部 | 関連するデータがあるため「%name%」を削除できませんでした | Sorry, we are unable to delete %name%, because it has related data. | 関連するデータがあるカテゴリを削除しようとしたとき | 管理画面_商品管理_カテゴリ一覧画面に遷移する |
| M03-11-MSG-004 | 管理画面上部 | 既に削除されています | No data to delete | すでに削除されたカテゴリを削除しようとしたとき | 管理画面_商品管理_カテゴリ一覧画面に遷移する |
| M03-11-MSG-007 | 入力項目直下 | JPEG / PNG / GIF の画像ファイルのみアップロードできます。 | JPEG / PNG / GIF の画像ファイルのみアップロードできます。 | 要ソース確認 | 要ソース確認 |
| M03-11-MSG-008 | 入力項目直下 | 画像ファイルのサイズが大きすぎます（最大 {{ limit }} {{ suffix }}）。 | 画像ファイルのサイズが大きすぎます（最大 {{ limit }} {{ suffix }}）。 | 要ソース確認 | 要ソース確認 |
| M03-11-MSG-009 | 入力項目直下 | 画像として読み取れない、または破損したファイルです。 | 画像として読み取れない、または破損したファイルです。 | 要ソース確認 | 要ソース確認 |
| M03-11-MSG-010 | 入力項目直下 | 入力されていません。 | This value should not be blank. | 必須項目が未入力のまま送信したとき | 管理画面_商品管理_カテゴリ登録・編集画面に留まる |
| M03-11-MSG-011 | 入力項目直下 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | This value is too long. It should have {{ limit }} character or less.\|This value is too long. It should have {{ limit }} characters or less. | 入力項目が最大文字数を超えたまま送信したとき | 管理画面_商品管理_カテゴリ登録・編集画面に留まる |

---

## DBカラム

登録・編集フォームが直接扱い得る列の代表例。型の細部はスキーマを参照する。

| テーブル | 列 | メモ |
|---------|-----|------|
| `dtb_category` | `category_name`、`category_name_en` | 名前入力。 |
| `dtb_category` | `front_search_hide_flg`、`branch_hide_flg` | チェック。 |
| `dtb_category` | `banner_image`、`icon_image` | 新規時のファイルパス。 |
| `dtb_category` | `html_ja`、`html_en`、`search_parameters` | テキスト系。 |
| `dtb_category` | `parent_category_id`、`hierarchy`、`sort_no` | 新規時にサーバ・リポジトリが設定または更新。 |

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_category | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| カテゴリ名（日） | `NotBlank`、`Length`（`eccube_stext_len`）。 |
| カテゴリ名（英） | `Length` のみ（未入力可）。 |
| 検索パラメーター | `Length`（`eccube_ltext_len`）。 |
| バナー・アイコン（新規） | Symfony `Image` に加え、サーバで MIME 接頭と拡張子、移動・ディレクトリ作成の成否。 |

---

## 権限・認可

| 利用者状態 | 新規・編集の GET と POST |
|------------|--------------------------|
| 未ログイン | 管理画面共通のログイン誘導に従う。 |
| 管理メンバーでログイン済み | アクセス制御リストが URL を許可するときのみ到達する。店舗のみ許可される主体では一覧と同様に拒否され得る（テスト参照）。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 新規保存成功 | `GET /{admin_route}/product/category/{parent_id}` |
| 更新保存成功かつ親あり | `GET /{admin_route}/product/category/{parent_id}` |
| 更新保存成功かつ親なし | `GET /{admin_route}/product/category` |
| 検証失敗・画像失敗 | 同一 URL のフォーム表示に相当する Twig を 200 で再描画 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| Symfony フォーム検証 | 同一 Twig 200、フィールドエラー表示。 |
| 画像アップロードまたはディレクトリ作成失敗 | 共通アップロードエラー文言を該当フィールドまたはフォームに付与。移動済みファイルは削除。 |
| 階層上限超過 | HTTP 400。 |

---

## 試行制限

本機能単体のレート制限は持たない。ログイン枠の共通制限を正とする。

---

## ログ・監査

| タイミング | 記録内容 |
|------------|----------|
| 保存開始・完了 | 日本語短文とカテゴリ id（完了時）。 |

### ログに出してはいけないもの

- アップロード画像のバイナリ原データ
- CSRF トークンやセッション識別子の完全値
- パスワード原値

---

## セッション

検索条件のように一覧状態をセッションに載せない。成功・エラーフラッシュは管理画面共通の仕組みに依存する。

---

## Cookie

管理画面のセッション Cookie のみを正とし、本機能用の追加 Cookie は定義しない。

---

## 排他制御・トランザクション

フォーム保存はリポジトリの `save` に任せる。PostgreSQL で新規 INSERT する場合はテーブルロックとシーケンス補正を同一トランザクションにまとめる分岐がある。画面側に楽観ロックの版情報は無い。

---

## 調査補助（grep）

論理説明と切り離し、ソース照合用。

```
src/Eccube/Controller/Admin/Product/CategoryController.php
src/Eccube/Resource/template/admin/Product/category.twig
src/Eccube/Form/Type/Admin/CategoryType.php
src/Eccube/Repository/CategoryRepository.php
```

---


### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_product_category_show` … `GET` … `/{admin_route}/product/category/{parent_id}`（指定親の子一覧と、空の新規フォームを表示する。親が存在しない id なら 404。）
- `admin_product_category_edit` … `GET` … `/{admin_route}/product/category/{id}/edit`（指定 id の編集フォームを表示する。）
- `admin_product_category_create` … `POST` … `/{admin_route}/product/category/{parent_id}`（子カテゴリ新規の送信。）
- `admin_product_category_update` … `POST` … `/{admin_route}/product/category/{id}/edit`（既存カテゴリ更新の送信。）

## セルフレビュー

設計スキル `reverse-design` の CHECKLIST に照らし、入口 HTTP 表、扱う／扱わないこと、入力項目 5 列表、階層超過時の HTTP 400、新規のみ画像、編集時画像差し替え不可を実装と突き合わせて記載した。
