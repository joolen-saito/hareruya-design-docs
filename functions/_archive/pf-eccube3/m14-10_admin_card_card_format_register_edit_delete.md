# m14-10_admin_card_card_format_register_edit_delete — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

---

## 副作用（設計書からは削除・2026-08-19）

| 副作用 | DB の INSERT／UPDATE／DELETE（およびソフトデリートの場合は `deleted_at` 更新）。セッションにフラッシュメッセージ。CSRF トークン更新（POST フォーム検証時）。 |

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

#### エッジケース
| ケース | 扱い |
|--------|------|
| 編集対象 ID が存在しない | GET／POST とも HTTP 404。 |
| CSRF 無効 | POST はフォームトークン単位で HTTP 403。DELETE は既定トークンで HTTP 403。 |
| 大会・デッキ・アーキタイプのいずれかが紐付く状態で削除 | 削除せずエラーフラッシュしリファラへリダイレクト。 |
| 統率チェックオフで送信 | 統率関連入力は disabled のため POST に含まれない。サーバは統率ボード行を削除し、`use_command_flg` はフォームのチェック状態で更新される。 |
| リーガル状態の `dtb_card_format` がバッチ等で存在する | 保存時、リーガルかつ禁止・制限リストに含まれないカードの行は削除ルールに該当しないため残る。禁止・制限として選んだカードのリーガル行は集合に含まれるため一旦削除され、禁止または制限として再作成される。 |
| フォーマットコード欄を空のまま送信する | フォームは `required` ではないが Length の最小が 1 のため、空文字は検証エラーになりうる（実装どおり）。 |
---
### データ整合性
| 観点 | 内容 |
|------|------|
| 一覧と編集 | 一覧はリポジトリの `findBy` の結果である。編集は ID での再取得である。一覧表示から編集を開くまでに他管理者が更新した場合、編集開始時点の DB 値が載る（楽観ロックはない）。 |
| 禁止・制限とリーガル | 画面上の禁止・制限は `dtb_card_format` の一部のみを編集する。リーガル行はフォームの禁止・制限集合と削除条件により一部が削除されうるが、集合外のリーガル行は維持される。 |
| 削除 | 関連する大会・デッキ・アーキタイプが無い場合のみフォーマット本体を削除する。`dtb_card_format` は事前にすべて削除する。 |
---

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

#### 入力項目
| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|------------|--------|--------|----------------|
| フォーマット名(日) | 必須 | 64 文字（プラグイン設定 `HareruyaEc.const.construct_format.name.min` が 1、`max` が 64） | 新規はエンティティ初期値、編集は `mtb_format.name_jp` | `mtb_format.name_jp`。NotBlank、Length。 |
| フォーマット名(英) | 必須 | 64 文字（同上） | 同上 | `mtb_format.name_en`。NotBlank、英数字・アンダースコア・ハイフン・半角スペースのみの Regex、Length。 |
| フォーマットコード | 任意 | 10 文字（`construct_format.code` の min 1・max 10。未入力時は Symfony の検証が空文字をどう扱うかは実装確認値とする） | 同上 | `mtb_format.code`（NULL 可）。Regex・Length。 |
| 並び順 | 必須 | 整数レンジ 1～10000（`construct_format.meta_range` の min・max をフォームの整数項目が共用している） | 新規は NULL のうえフォーム必須のため利用者入力が前提 | `mtb_format.rank`。NotBlank、Range。 |
| メイン上限枚数 | 任意 | 整数 0～4096（`construct_format.board`） | DB 現行値 | `mtb_format.main_max_card_count` およびメイン用 `dtb_format_board.max_card_count`。Range。 |
| メイン下限枚数 | 任意 | 同上 | DB 現行値 | `mtb_format.main_min_card_count` およびメイン用 `dtb_format_board.min_card_count`。Range。 |
| サイド上限枚数 | 任意 | 同上 | DB 現行値 | `mtb_format.side_max_card_count` およびサイド用 `dtb_format_board`。Range。 |
| サイド下限枚数 | 任意 | 同上 | DB 現行値 | `mtb_format.side_min_card_count` およびサイド用 `dtb_format_board`。Range。 |
| カードセット | 任意 | 複数選択（検索可能 UI） | DB 現行の関連 | `dtb_format_cardset` 経由の `mtb_cardset` 多対多。 |
| 認定 | 任意 | 単一選択 | DB 現行値 | `mtb_format.certification_id`／認定マスタ参照。 |
| デッキ検索条件に表示 | 任意 | チェックボックス | DB 現行値 | `mtb_format.search_flg`。 |
| 商品検索条件に表示 | 任意 | チェックボックス | DB 現行値 | `mtb_format.product_search_flg`。 |
| ランキング表示 | 任意 | チェックボックス | DB 現行値 | `mtb_format.ranking_flg`。 |
| メタ分布簡易化 | 任意 | チェックボックス | DB 現行値 | `mtb_format.other_meta_flg`。 |
| MTG ARENAで導入済 | 任意 | チェックボックス | DB 現行値 | `mtb_format.arena_legal_flg`。 |
| 採用枚数ランキングに基本土地を含める | 任意 | チェックボックス | DB 現行値 | `mtb_format.include_basic_flg`。 |
| デッキビルダーで利用 | 任意 | チェックボックス | DB 現行値 | `mtb_format.deckbuilder_flg`。 |
| メタゲーム分析日数 | 必須 | 整数 1～10000（同上 `meta_range` キー） | 新規エンティティは定数上 14 日が既定（実装のプロパティ既定） | `mtb_format.meta_range`。NotBlank、Range。 |
| ルール説明(日) | 任意 | 65535 文字（`construct_format.text` の max。DB は text） | DB 現行値 | `mtb_format.rule_jp`。Length。 |
| ルール説明(英) | 任意 | 同上 | DB 現行値 | `mtb_format.rule_en`。Length。 |
| 禁止カード | 任意 | 複数選択（検索可能 UI） | 編集時は禁止 ID の `dtb_card_format` から復元 | フォームでは `mapped` ではない。保存時に禁止マスタ ID で `dtb_card_format` を追加。既存の禁止／制限／対象 ID のリーガル行は処理フローの削除ルールに従う。 |
| 制限カード | 任意 | 複数選択 | 編集時は制限 ID の行から復元 | 同上（制限マスタ ID）。 |
| 統率でカードを使用する（統率者や策略等） | 任意 | チェック（内部では 1／0） | DB 現行値 | `mtb_format.use_command_flg`。整数真偽変換トランスフォーマ付き。オフ時は統率用 `dtb_format_board` を削除。 |
| 統率のカードをメインボード枚数に含む | 任意 | チェック | 編集時は統率ボードの参照先から算出 | フォームでは `mapped` ではない。統率ボード行の参照ボードにメインを繋ぐか否か。統率オフ時は disabled で POST されない。 |
| 統率上限枚数 | 任意 | 整数 0～4096 | 編集時は統率ボードの現行値 | `mapped` ではない。統率ボードの `max_card_count`。 |
| 統率下限枚数 | 任意 | 整数 0～4096 | 同上 | 統率ボードの `min_card_count`。 |
| 基本土地でないカードは各1枚まで（ハイランダー） | 任意 | チェック（内部では 1／0） | DB 現行値 | `mtb_format.highlander_flg`。整数真偽変換トランスフォーマ付き。 |
補足: 長さ・レンジの数値はプラグイン `config.yml` の `HareruyaEc.const.construct_format` を確認値とする。環境で上書きされている場合はその値に従う。

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

### ログ・監査
本機能専用の業務ログ出力はコード上は主眼としない。コアの HTTP／アクセスログは環境に依存する。
#### ログに出してはいけないもの
- パスワード
- なりすまし対策トークン
- Cookie 値
- セッション ID の完全値
- Remember Me トークンの原値
---
### 権限・認可
| 利用者状態 | 一覧・編集・登録・削除 |
|------------|------------------------|
| 管理画面にログインし当ナビゲーションに到達できる管理者 | 実装されたルートへアクセスできる（コアの管理画面認可とロール設定を正とする）。 |
| 未ログインまたは権限不足 | コアの管理画面セキュリティにより拒否またはログインへ誘導される（詳細は別設計）。 |
---
### Cookie
本機能固有の Cookie は使わない。管理画面のセッション Cookie はコアに従う。
---
### 排他制御・トランザクション
明示の楽観ロックはない。更新・削除はリクエスト単位の flush に依存する。複数管理者の同時更新の衝突は最後の flush が優先する形になりうる。
---
### 業務ルール・計算
