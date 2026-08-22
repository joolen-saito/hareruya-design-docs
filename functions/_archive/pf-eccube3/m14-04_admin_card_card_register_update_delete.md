# m14-04_admin_card_card_register_update_delete — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

---

## 副作用（設計書からは削除・2026-08-19）

| 副作用 | DB の INSERT／UPDATE／DELETE、オブジェクトストレージへのファイル PUT、支店通知、ログ出力。 |

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

#### エッジケース
| ケース | 扱い |
|--------|------|
| 編集 GET で ID が存在しない | HTTP 404。 |
| 更新 POST でパス ID のカードが無い | HTTP 403。 |
| 画像のみ追加しファイルを付けない | 送信データから当該画像エントリが落ち、検証・永続化対象外になり得る。 |
| DOM 上でリーガリティ行・詳細・画像ブロックを削除して送信 | そのブロックに対応するフィールドが POST に含まれないため、永続化時に既存子が削除扱いになり得る。 |
| カード詳細が商品規格に引用されている | Twig 上で「この詳細情報を削除」ボタンを出さず、説明文のみ表示。送信でコレクションから落ちた場合の扱いは ORM の削除経路に従う（利用者が開発者ツールで強制送信した場合の整合は運用外）。 |
| カード本体を削除しようとするがデッキ採用または未削除商品がある | 削除せずエラーメッセージし、リファラへ戻る。 |
| 支店通知が失敗 | 画面は登録／削除成功メッセージのまま。ログと支店更新エラー永続化に残す実装とする。 |
---
### データ整合性
| 観点 | 内容 |
|------|------|
| 一覧と詳細 | 一覧は検索画面のクエリ時点、詳細は表示時点の DB 値。同時編集の排他は持たない。 |
| 削除直後の一覧 | リダイレクトで検索画面に戻るが、検索条件はセッションの前回状態に依存する（別設計）。 |
| 商品との外部キー | カード削除直前に、当該カードの全詳細にぶら下がる規格 `dtb_product_sub.card_detail_id` を `NULL` に更新する。これにより商品行は残り、カード詳細参照だけ外れる。 |
---

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

#### 入力項目
| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| カード名(日) | 任意 | 255 文字（`HareruyaEc.const.card.length.name`） | 新規は空、編集は `mtb_card.name_jp` | `mtb_card.name_jp`。Symfony Length のみ。 |
| カード名(英) | 必須 | 同上 | 新規は空、編集は `mtb_card.name_en` | `mtb_card.name_en`。NotBlank＋Length。 |
| アリーナカード名(日) | 任意 | 同上 | DB 現行値または空 | `mtb_card.arena_format_name_jp`。 |
| アリーナカード名(英) | 任意 | 同上 | DB 現行値または空 | `mtb_card.arena_format_name_en`。 |
| ルールテキスト(日) | 任意 | 1024 文字（`HareruyaEc.const.card.length.text`） | DB 現行値または空 | `mtb_card.text_jp`。複数行 textarea。 |
| ルールテキスト(英) | 任意 | 同上 | DB 現行値または空 | `mtb_card.text_en`。 |
| マナ・コスト | 任意 | 64 文字（`HareruyaEc.const.card.length.manaCost`） | DB 現行値または空 | `mtb_card.mana_cost`。 |
| 点数で見たマナコスト | 必須 | テキスト入力だが桁は実データ依存（DB は float 系） | DB 現行値 | `mtb_card.cmc`。NotBlank＋数値形式の Regex。 |
| パワー（基本） | 任意 | 16 文字（`HareruyaEc.const.card.length.power`） | DB 現行値または空 | `mtb_card.power`。 |
| タフネス（基本） | 任意 | 16 文字（`HareruyaEc.const.card.length.toughness`） | DB 現行値または空 | `mtb_card.toughness`。 |
| 忠誠度 | 任意 | 16 文字（`HareruyaEc.const.card.length.loyalty`） | DB 現行値または空 | `mtb_card.loyalty`。Length＋記号形式 Regex。 |
| カラー | 任意 | — | チェック無し～複数 | `mtb_card` と色マスタの多対多。 |
| 固有色 | 任意 | — | 同上 | 同上。 |
| カードタイプ | 任意 | — | 同上 | `mtb_card` とカードタイプマスタの多対多。 |
| サブタイプ | 任意 | — | 同上 | サブタイプマスタ多対多。 |
| 特殊タイプ | 任意 | — | 同上 | 特殊タイプマスタ多対多。 |
| 色順 | 任意 | — | 未選択可 | `mtb_card.color_sequence_id`（色順マスタへの外部キー）。 |
| ステッカーフラグ | 任意 | — | オフ既定 | `mtb_card.is_sticker`。 |
| フォーマット（リーガリティ各行） | 必須（行を残す場合） | — | 編集は各行の現行値 | `dtb_card_format.format_id`。 |
| リーガリティ（制限区分、各行） | 必須（行を残す場合） | — | 編集は各行の現行値 | `dtb_card_format.restriction_id`。empty_value は無し。 |
| 現行の日本語商品ID／現行の英語商品ID | 任意 | 各 20 文字（`old_product_id`／`old_en_product_id`） | 非表示項目。DB 現行値 | `mtb_card` の該当列。英数字・`-`・`_` のみ Regex。 |
| コレクターNo | 任意 | 16 文字（`HareruyaEc.const.cardDetail.length.card_no`） | 詳細ごと | `mtb_card_detail` のカード番号列。 |
| 裏面カード詳細ID | 任意 | 最大 6 桁の数字のみ許容する Regex（空も可） | 詳細ごと | `mtb_card_detail` の裏面参照。integer ウィジェット。 |
| ルールテキスト(日)（詳細） | 任意 | 1024 文字（`cardDetail.length.text`） | 詳細ごと | `mtb_card_detail.text_jp`。 |
| ルールテキスト(英)（詳細） | 任意 | 同上 | 詳細ごと | `mtb_card_detail.text_en`。 |
| フレーバーテキスト(日) | 任意 | 1024 文字（`cardDetail.length.flavor`） | 詳細ごと | `mtb_card_detail.flavor_jp`。 |
| フレーバーテキスト(英) | 任意 | 同上 | 詳細ごと | `mtb_card_detail.flavor_en`。 |
| パワー（詳細） | 任意 | 16 文字 | 詳細ごと  | `mtb_card_detail.power`。 |
| タフネス（詳細） | 任意 | 16 文字 | 詳細ごと | `mtb_card_detail.toughness`。 |
| カードセット | 任意 | — | 詳細ごと | `mtb_card_detail.cardset_id`。 |
| レアリティ | 必須 | — | プレースホルダ「レアリティ選択」から選択 | `mtb_card_detail.rarity_id`。 |
| レイアウト | 必須 | — | プレースホルダ「レイアウト選択」 | `mtb_card_detail.card_layout_id`。 |
| イラストレーター | 任意 | — | プレースホルダ「イラストレーター選択」 | `mtb_card_detail.illustrator_id`。 |
| Foil | 任意 | — | チェック | `mtb_card_detail.foil_flg`。 |
| プロモ | 任意 | — | チェック | `mtb_card_detail.promotion_flg`。 |
| プロモ種別 | 必須 | — | プレースホルダ「プロモーション選択」 | `mtb_card_detail.promotion_id`。 |
| 言語（画像各行） | 必須 | — | 言語マスタのラジオ | `mtb_card_image.language_id`。 |
| 表面／裏面（画像各行） | 必須 | — | 定数 `HareruyaEc.const.cardImage.face` のラベル（表面／裏面） | `mtb_card_image.back_flg`（0＝表面、1＝裏面の論理値）。 |
| 画像ファイル（画像各行） | 任意 | 5MB、JPEG/GIF/PNG | 空 | アップロード時に一時保存後オブジェクトストレージへ送り、戻りパスを hidden の URL に格納。 |
| 画像 URL（hidden） | 条件付き | DB 定義上 128 文字（`mtb_card_image.url`） | 既存 URL またはアップロード後のパス | 新規画像でも少なくとも最終的に非空が必要なスキーマ。ファイルと既存 URL がともに無い行は送信直前にデータから除去される。 |
プラグイン `config.yml` の数値はデフォルトの確認値である。運用でプラグイン設定を上書きしている場合はその環境の値が正とする。

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

### ログ・監査
| タイミング | 記録内容 |
|------------|----------|
| 支店連携成功／失敗 | アプリケーションログにカード ID 列と成否・失敗時 JSON メッセージを出力する実装とする。 |
#### ログに出してはいけないもの
- パスワード
- なりすまし対策トークン
- Cookie 値
- セッション ID の完全値
- Remember Me トークンの原値
---
### 権限・認可
| 利用者状態 | 詳細フォーム表示・POST・DELETE |
|------------|----------------------------------|
| 管理画面にログインし当ルートへ到達できる主体 | 画面を表示し送信・単体削除のリンクを実行できる（細かいロールはコアの管理画面認可に従う）。 |
| 未ログインまたは管理画面外の主体 | 管理画面共通の認証により当ルートへ到達しない。 |
---
### セッション
#### 本機能におけるセッション
| 観点 | 内容 |
|------|------|
| 戻るボタン | 参照のみ。`admin.card.search.page_no` を読み検索 URL を組み立てる。 |
| 単体削除後のリダイレクト | 同上キーがあればそのページ番号の検索へ、無ければ一覧初期ルートへ。 |
#### セッションへ保存しない情報
フォーム本体の入力値をセッションに退避する処理は持たない（送信失敗時は同一レスポンスで再表示）。
---
### Cookie
本機能が独自に Cookie を読み書きしない。セッション Cookie は管理画面共通の仕組みに従う。
---
### 業務ルール・計算

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

### 入力項目の制約
| 項目 | 必須／任意 | 制約 |
| --- | --- | --- |
| カードID（新規） | — | 登録時に採番する |
| カードID（編集） | — | 画面が保持するIDで既存のカードを識別する |
| 旧商品ID（日） | 任意 | 英数字・ハイフン・アンダースコアだけを許す |
| 旧商品ID（英） | 任意 | 英数字・ハイフン・アンダースコアだけを許す |
| リーガリティの重複 | — | 同一フォーマットを重複して選んだときは画面上で拒み、選んだ内容を空へ戻す |
| 入力項目の制約 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Card/CardType.php:229 |
| 入力項目の制約 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.MtbCard.dcm.yml:20 |
| 入力項目の制約 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/assets/js/card-detail.js:76 |
