# m03-11_admin_product_product_category_register_edit — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## セルフレビュー

設計スキル `reverse-design` の CHECKLIST に照らし、入口 HTTP 表、扱う／扱わないこと、入力項目 5 列表、階層超過時の HTTP 400、新規のみ画像、編集時画像差し替え不可を実装と突き合わせて記載した。

---

## 副作用（設計書からは削除・2026-08-19）

| 副作用 | DB 更新、ファイル作成（新規かつ画像選択時）、失敗時の限定 unlink、処理ログ、イベント通知、Doctrine キャッシュ破棄。 |

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

#### エッジケース
| ケース | 扱い |
|--------|------|
| ルート直下一覧のみ（親 null） | 登録フォームカードは出ない。新規 POST は `admin_product_category` にはマップされない。 |
| 編集で画像を差し替えたい | 本画面の実装では不可。CSV 等の別経路を正とする。 |
| 永続化失敗（新規）で画像だけ先に移動済み | コントローラが移動済み絶対パス一覧を unlink してから例外を伝播する。 |
---
### データ整合性
保存成功後はリダイレクト先の GET でリポジトリ経由の最新行が読まれる。一覧のクエリキャッシュは `CacheUtil::clearDoctrineCache` で破棄するため、通常の保存直後にキャッシュのみ古い値が残り続ける設計にはならない。
---

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

#### 入力項目
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

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

### ログ・監査
| タイミング | 記録内容 |
|------------|----------|
| 保存開始・完了 | 日本語短文とカテゴリ id（完了時）。 |
#### ログに出してはいけないもの
- アップロード画像のバイナリ原データ
- CSRF トークンやセッション識別子の完全値
- パスワード原値
---
### 権限・認可
| 利用者状態 | 新規・編集の GET と POST |
|------------|--------------------------|
| 未ログイン | 管理画面共通のログイン誘導に従う。 |
| 管理メンバーでログイン済み | アクセス制御リストが URL を許可するときのみ到達する。店舗のみ許可される主体では一覧と同様に拒否され得る（テスト参照）。 |
---
### セッション
検索条件のように一覧状態をセッションに載せない。成功・エラーフラッシュは管理画面共通の仕組みに依存する。
---
### Cookie
管理画面のセッション Cookie のみを正とし、本機能用の追加 Cookie は定義しない。
---
### 排他制御・トランザクション
フォーム保存はリポジトリの `save` に任せる。PostgreSQL で新規 INSERT する場合はテーブルロックとシーケンス補正を同一トランザクションにまとめる分岐がある。画面側に楽観ロックの版情報は無い。
---
### 業務ルール・計算
