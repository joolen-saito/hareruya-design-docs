# 商品管理 — 部門登録／編集

## 概要

管理画面「商品管理」配下の「部門登録／編集」は、`mtb_section` を一覧し、同一画面上部のフォームで新規登録または既存行の編集を行い、下部に部門コード昇順の一覧を表示する機能である。送信に成功すると一覧のみが再表示され、画面上部のフォームは新規登録向けに戻る。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。実装の確認値は ec-cube-enterprise コアの管理画面部門ルート（`Controller/Admin/Product` 配下）、部門用フォーム定義（`Form/Type/Admin/ProductDepartmentType.php`）、テンプレート `section.twig`、永続化先 `mtb_section` とする。本ドキュメントは設計資産として `pf-eccube3` 配下に置く。

本機能のカスタマイズ区分はカスタマイズである。挙動の参照は現行リポ pf-eccube3 の HareruyaEc プラグイン実装を正とし、DB関連は ec-cube-enterprise を正とする。現行と移行先のスキーマ差は「リニューアル移行時の扱い」へ集約する。

対象はブラウザ経由の管理画面に限定する。

本文では Symfony のコントローラ型名やメソッド名を主説明としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

DB関連の正典は ec-cube-enterprise とする。挙動は現行リポ pf-eccube3 の HareruyaEc プラグインを正とし、移行先との差は本節へ集約する。

| 観点 | 現行（pf-eccube3） | 移行先（ec-cube-enterprise） |
|------|--------------------|------------------------------|
| 部門マスタの列構成 | `mtb_section` は部門ID・部門名（`name` 128）・部門コード（`code` 128）・表示フラグ（`visible`）のみを持つ。免税区分・スマレジ部門IDの列は無い。 | `mtb_section` に免税区分（`tax_free_division`、既定 0）とスマレジ部門ID（`smaregi_category_id`、32 桁、null 許容）が加わる。 |
| 本書が扱う免税区分・スマレジ連携 | 現行では免税区分入力・スマレジ部門 upsert は当画面の対象外。 | 移行先で確定する仕様であり、本書の入力項目・DBカラム・副作用は移行先の列名（`tax_free_division`／`smaregi_category_id`）を正とする。 |
| 削除時の参照判定 | 現行は商品規格サブ等の参照有無で削除可否を判定する。 | 移行先は商品規格（`dtb_product_class`）の参照有無で判定する。 |
| 削除方式・並び順 | 部門は物理削除、一覧は部門コード（`code`）昇順。両者で同じ。 | 同左。 |

`mtb_section` の `name`／`code`／`visible` の列名・桁は現行と移行先で同一スキーマである（追加列を除く）。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| ナビ「部門登録／編集」 | `GET /{admin_route}/product/section` | 上部に新規フォーム、下部に一覧。 |
| 一覧の ID・部門名・「編集」 | `GET /{admin_route}/product/section/{id}` | 該当部門がフォームに読み込まれる。 |
| 「登録」ボタン（新規） | `POST /{admin_route}/product/section/store`（パス末尾の `/{id}` は付けない実装） | 検証成功時は保存し、成功メッセージの後に `GET …/product/section` へ移る。 |
| 「登録」ボタン（編集モード） | `POST /{admin_route}/product/section/store/{id}` | 同上。保存対象は当該 `id` の行。 |
| CSV 出力／CSV 取込リンク | `GET` 各別ルート | 本書の主題外の画面またはダウンロード。 |
| 一覧の「削除」 | `DELETE /{admin_route}/product/section/{id}/delete` | 参照がなければ削除し一覧へ。参照があればエラー表示のまま一覧へ（別処理）。 |
| 存在しない `{id}` で編集を開く | `GET /{admin_route}/product/section/{id}` | 404。 |
| 部門一覧の CSV ダウンロード（本書の主題外だが同一画面からリンクされる）。 | `GET /{admin_route}/product/section/export` | 部門一覧の CSV ダウンロード（本書の主題外だが同一画面からリンクされる）。 |
| 部門マスタ用 CSV 雛形のダウンロード（本書の主題外）。 | `GET /{admin_route}/product/section/master_csv_template` | 部門マスタ用 CSV 雛形のダウンロード（本書の主題外）。 |
| 部門マスタ CSV アップロード画面の表示（本書の主題外）。 | `GET /{admin_route}/product/section/master_csv_upload` | 部門マスタ CSV アップロード画面の表示（本書の主題外）。 |
| 部門マスタ CSV の取込POST（本書の主題外）。 | `POST /{admin_route}/product/section/master_import` | 部門マスタ CSV の取込POST（本書の主題外）。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | 画面タイトルは翻訳鍵 `admin.product.section_management` の日本語確認値「部門登録／編集」。サブタイトルは「商品管理」。ヘッダに「CSV 出力」「CSV 取込」、編集モード時のみ「新規登録に戻る」。主カードの見出しは新規時「新規登録」、編集時「編集」。入力ブロックは4列（部門名・部門コード・免税区分・MTGBuyer表示）。下部にテーブル（ID リンク、部門名リンク、部門コード、免税区分の表示文言、表示／非表示、編集ボタン、削除ボタン）。画面下端のコンバージョンエリアに「登録」ボタンがあり、`form` 属性で上部の `form_section` に紐づく。 |
| JS 挙動 | 削除リンクに `data-method="delete"` と確認メッセージ用の `data-message` が付く。管理画面共通スクリプトによる疑似 DELETE 送信と CSRF 付与が前提（当テンプレート専用の入力マスクや Ajax は無い）。 |
| CSS・レイアウト | ページヘッダ帯に CSV 系ボタン用の狭いパディングクラス。本文はコアの管理画面フレームに従う。 |
| モーダル・ポップアップ | 本機能の登録フォーム自体は確認モーダルなし。削除のみ共通の確認ダイアログ経由。 |

補足: テーブル内の免税区分は `admin.product.section_tax_free_division.{0,1,2}` を用いて表示する。MTGBuyer表示は `visible` が真なら「表示」、偽なら「非表示」の翻訳。

---

## 処理フロー

### 新規画面を表示する（GET `m03-18_admin_product_product_section`）

1. 管理画面の認証・共通制約を通過する。
2. 空の部門行にバインドした部門用管理フォームを生成する。
3. `mtb_section` を部門コード昇順で全件取得し、テンプレートに渡す。
4. Twig で上部フォームと下部一覧を描画する。`id` は null（新規モード）。フォームの `action` は `m03-18_admin_product_product_section_store` をパラメータ無しで解決した POST URL になる。

### 編集画面を表示する（GET `m03-18_admin_product_product_section_edit`）

1. 管理画面の認証・共通制約を通過する。
2. パスの `{id}` に対応する行が存在しなければ 404 応答とする。
3. 当該行にバインドしたフォームを生成する。
4. 一覧は新規同様、部門コード昇順で取得する。
5. `id` に該当主キーを渡し、`action` は `m03-18_admin_product_product_section_store` に `{id}` を付与した POST URL とする。編集時のみ「新規登録に戻る」リンクを表示する。

### 登録・更新する（POST `m03-18_admin_product_product_section_store`）

1. 管理画面の認証・共通制約を通過する。
2. パスに `{id}` が含まれる場合は、その行を読み込む。含まれない場合は新規の空行からフォームを組み立てる。
3. `handleRequest` で POST を束ねる。
4. 送信が無い、または Symfony のフォーム妥当性検証に失敗した場合、エラーメッセージ鍵 `admin.register.failed`（日本語確認値「登録できませんでした。」）を積み、同一テンプレートを 200 で再表示する。一覧は再取得する。
5. 妥当ならフォームデータを永続化キューに載せたうえで `flush` する。
6. スマレジ連携向けサービスで、当該部門の upsert をメッセージに載せて投入する（内部でジョブ行の作成・追加 flush を行う）。ここで例外が上がると成功レスポンスに到達しない実装である。
7. 成功メッセージ鍵 `admin.common.save_complete`（日本語確認値「保存しました」）を積む。
8. `GET /{admin_route}/product/section` へリダイレクトする（編集モードを終え、新規フォームが出る）。

---

## フォーム送信時の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | ルートとパラメータ束ねが Symfony の規約に合うか | 編集 URL の主キーが不正なら 404（表示側）。POST は対象行の特定に用いる。 |
| 2 | フォーム CSRF が有効か | 無効なら Symfony のエラー処理（通常は HTTP 403）に従う。 |
| 3 | フォーム制約（必須・最大長・選択肢の範囲）を満たすか | 否なら `admin.register.failed` を積み、同一画面を再表示。 |
| 4 | 永続化とスマレジ連携用メッセージ投入 | 成功なら成功フラッシュと一覧 GET へリダイレクト。 |

---

## 集計条件

本機能では売上・件数などの集計を行わない。一覧はマスタの全行抽出をコード昇順で表示するのみである。

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|
| M03-18-MSG-001 | 管理画面上部 | 登録できませんでした。 | 部門の登録・編集で、保存が受け付けられなかったとき | 部門登録／編集画面に留まる |
| M03-18-MSG-002 | 管理画面上部 | 保存しました | 部門を登録・編集して保存したとき | 部門一覧画面に遷移する |
| M03-18-MSG-003 | 管理画面上部 | 削除に失敗しました | 削除しようとした部門が見つからないとき | 部門一覧画面に遷移する |
| M03-18-MSG-004 | 管理画面上部 | 要ソース確認（variable: $message） | 要ソース確認 | 要ソース確認 |
| M03-18-MSG-005 | 管理画面上部 | 要ソース確認（variable: $message） | 要ソース確認 | 要ソース確認 |
| M03-18-MSG-006 | 管理画面上部 | 要ソース確認（variable: $message） | 要ソース確認 | 要ソース確認 |
| M03-18-MSG-007 | 管理画面上部 | 要ソース確認（variable: $message） | 要ソース確認 | 要ソース確認 |
| M03-18-MSG-008 | 管理画面上部 | 削除しました | 部門を削除したとき | 部門一覧画面に遷移する |
| M03-18-MSG-009 | 管理画面上部 | 要ソース確認（variable: $message） | 要ソース確認 | 要ソース確認 |
| M03-18-MSG-010 | 管理画面上部 | 要ソース確認（variable: $error->getMessage()） | 要ソース確認 | 要ソース確認 |
| M03-18-MSG-011 | 管理画面上部 | CSVのフォーマットが一致しません | 部門CSVを登録するとき、CSVファイルが選択されていないとき | 部門マスタCSVアップロード画面に遷移する |
| M03-18-MSG-012 | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | 部門CSVを登録するとき、5,010行以上のCSVファイルを指定したとき | 部門マスタCSVアップロード画面に遷移する |
| M03-18-MSG-013 | 管理画面上部 | 要ソース確認（variable: $error['message']） | 要ソース確認 | 要ソース確認 |
| M03-18-MSG-014 | 管理画面上部 | 登録が完了しました。 | 部門CSVを登録し、エラーなく完了したとき | 部門マスタCSVアップロード画面に遷移する |

## 業務ルール・計算

送信で更新されるのはフォームに現れる4項目に対応する列のみである。`smaregi_category_id` などフォームに無い列は、編集時は既存行を読み込んだまま残り、新規時は定義上 null のままである。

免税区分の選択肢と永続化値の対応は次のとおり。

| 画面上の意味 | 永続化値 |
|----------------|----------|
| 対象外（メッセージ鍵 `admin.product.section_tax_free_division.0`） | 0 |
| 一般品（`admin.product.section_tax_free_division.1`） | 1 |
| 消耗品（`admin.product.section_tax_free_division.2`） | 2 |

MTGBuyer表示はチェックボックスで、チェック時に真、未チェック時に偽としてマップされる。

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| 部門名 | 必須 | 128 文字（`NotBlank` および `Length max=128`。ウィジェット属性に 128 の上限） | 新規は空の一行テキスト。編集は `mtb_section.name` | `mtb_section.name`。POST 名は `product_department[name]`。 |
| 部門コード | 必須 | 128 文字（同上） | 新規は空。編集は `mtb_section.code` | `mtb_section.code`。POST 名は `product_department[code]`。 |
| 免税区分 | 必須 | 選択式（任意長の入力ではない） | 編集は現行の区分値。新規はフォームの先頭選択肢に相当する値（0） | `mtb_section.tax_free_division`。POST 名は `product_department[tax_free_division]`。 |
| MTGBuyer表示フラグ | 任意 | チェックボックス | 編集は現行の真偽。新規は未チェックに相当する偽 | `mtb_section.visible`。POST 名は `product_department[visible]`（未チェック時はフィールド欠落により偽に落ちる挙動）。 |

### エッジケース

| ケース | 扱い |
|--------|------|
| 二名が同一部門を同時に編集する | 楽観ロックは無い。後に保存した内容で上書きされる。 |
| 削除時に商品規格等が参照している | 削除は拒否され、部門名を含むエラーメッセージを積んで一覧へリダイレクトする。 |
| スマレジ連携メッセージ投入が例外で失敗する | 当該 POST は完了画面に到達せず、フレームワークの例外応答に委ねる。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧とフォーム | GET のたびに一覧を再取得する。成功した POST の後は必ず一覧 GET に戻るため、一覧は保存結果と整合する。 |
| 他画面の部門プルダウン | それらが別トランザクションで読む限り、タイミングにより当事者と見えるリストが一秒以内に一致しない場合がある（一般的な読取分離の範囲）。 |
| スマレジ側 | メッセージ投入成功が店舗端末反映までを保証しない。ジョブ行とメッセージ基盤の設計を正とする。 |

---

## API/バッチ結果

本機能の画面からは店頭 API やバッチを直接呼ばない。スマレジ連携は内部メッセージ経路であり、画面は成功時点でジョブ完了を待たない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力（POST） | `product_department[_token]` および各フィールドキー。新規は `POST …/product/section/store`、編集は `POST …/product/section/store/{id}`。 |
| 成功時出力 | `GET …/product/section` への 302 前後のリダイレクトと成功フラッシュ。 |
| 失敗時出力 | フォームエラー時は同一 HTML。CSRF 失敗は 403。主キー不正な GET は 404。 |
| 副作用 | `mtb_section` の insert または更新、`dtb_messenger_job` へのジョブ行追加とスマレジ部門 upsert 向けメッセージ dispatch、成功フラッシュ。 |

---

## DBカラム

本画面のフォームが直接書き換える列は次のとおり。

| テーブル | 列 | メモ |
|----------|-----|------|
| `mtb_section` | `name` | 必須入力。 |
| `mtb_section` | `code` | 必須入力。一覧ソートに使う。 |
| `mtb_section` | `tax_free_division` | 0／1／2。 |
| `mtb_section` | `visible` | 真偽。 |

フォームに無いが行に存在し得る列の例は `smaregi_category_id` である。本フォームの保存では上書きしない。

### DB操作

永続化の正は ec-cube-enterprise。商品系は承認ワークフローを介さず persist/flush で直接確定する（在庫の承認ワークフローとは別系統。`ProductController`・各CSVサービスで確認）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | mtb_section | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

| 項目 | 内容 |
|------|------|
| 部門名・部門コード | `NotBlank`、`Length` 最大 128。 |
| 免税区分 | プルダウンで 0・1・2 のみ。必須。 |
| MTGBuyer表示 | チェックボックス任意。 |
| CSRF | フォームブロック名 `product_department` に紐づくトークン。 |

---

## 権限・認可

| 利用者状態 | 部門登録／編集 |
|------------|----------------|
| 管理画面にログインし当ルートへ到達できる運用者 | 当画面の閲覧・登録・編集・削除リンクの表示が可能である（テナント単体店舗向けテストではテナント制約が前置される）。 |
| 未到達の主体 | 管理画面共通の認証・認可により拒否される。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| ナビから開く、登録成功後 | `GET m03-18_admin_product_product_section` |
| 一覧から編集 | `GET m03-18_admin_product_product_section_edit` |
| 編集中に「新規登録に戻る」 | `GET m03-18_admin_product_product_section` |
| CSV 出力 | `GET m03-18_admin_product_product_section_export`（ダウンロード応答） |
| CSV 取込画面 | `GET m03-18_admin_product_product_section_master_csv_upload` |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| 登録成功 | 成功フラッシュを積む | 新規フォームと最新一覧。セッションに検索条件は持たない。 |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| フォーム検証失敗 | `admin.register.failed` を積み、同一内容を再表示。 |
| CSRF 不正 | HTTP 403（フレームワーク既定）。 |
| 編集 GET の主キー不存在 | 404。 |
| 削除時の参照存在 | 該当するエラーメッセージを積み、一覧へリダイレクト。 |
| 削除のその他失敗 | 汎用削除エラー表示。 |

---

## 試行制限

本機能ではログイン試行制限を扱わない。

---

## ログ・監査

コントローラは登録・更新の成功時に業務ログを出さない。削除の開始・完了・例外時にはログ識別子付きで info／error を出す。スマレジ連携サービスは失敗時に logger へ書く。

### ログに出してはいけないもの

- パスワード
- CSRF トークン原値
- Cookie 値
- セッション ID の完全値
- Remember Me トークンの原値

---

## セッション

検索条件や入力下書きをセッションに保存しない。フラッシュメッセージのみ管理画面共通の仕組みを用いる。

### セッションへ保存しない情報

入力の永続化先は POST 成功時のデータベースのみである。

---

## Cookie

本機能特有の Cookie 操作は扱わない。

---

## 排他制御・トランザクション

単一行の保存であっても、アプリケーション層で明示の楽観ロックや `SELECT FOR UPDATE` は用いない。削除も同様。

---

## 調査補助（grep 向け）

ルートは `SectionController` の属性、`eccube_nav.yaml` の `url: m03-18_admin_product_product_section`。フォームは `Form/Type/Admin/ProductDepartmentType.php`。テンプレートは `Resource/template/admin/Product/section.twig`。永続化は `Repository/Master/MtbSectionRepository` の経由で `mtb_section` へ。スマレジは `Service/Smaregi/SmaregiSectionEventService.php`。

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `m03-18_admin_product_product_section` … `GET` … `/{admin_route}/product/section`（新規登録フォームと、部門マスタ一覧（コード昇順）を表示する。）
- `m03-18_admin_product_product_section_edit` … `GET` … `/{admin_route}/product/section/{id}`（主キー `{id}` の行をフォームに載せ、同じく一覧を表示する（編集モード）。）
- `m03-18_admin_product_product_section_store` … `POST` … `/{admin_route}/product/section/store/{id}`（`id` セグメントは省略可能（新規登録時は省略）。フォーム送信を受けて検証・永続化し、一覧へリダイレクトする。）
- `m03-18_admin_product_product_section_delete` … `DELETE` … `/{admin_route}/product/section/{id}/delete`（一覧の削除操作から呼ばれ、参照制約を満たせば行を削除する（登録／編集の送信とは別系統）。）
- `m03-18_admin_product_product_section_export` … `GET` … `/{admin_route}/product/section/export`（部門一覧の CSV ダウンロード（本書の主題外だが同一画面からリンクされる）。）
- `m03-18_admin_product_product_section_master_csv_template` … `GET` … `/{admin_route}/product/section/master_csv_template`（部門マスタ用 CSV 雛形のダウンロード（本書の主題外）。）
- `m03-18_admin_product_product_section_master_csv_upload` … `GET` … `/{admin_route}/product/section/master_csv_upload`（部門マスタ CSV アップロード画面の表示（本書の主題外）。）
- `m03-18_admin_product_product_section_master_import` … `POST` … `/{admin_route}/product/section/master_import`（部門マスタ CSV の取込POST（本書の主題外）。）
