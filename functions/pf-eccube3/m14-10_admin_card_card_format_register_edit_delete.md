# カード管理 — フォーマット新規登録・編集・削除

## 概要

HareruyaEc プラグインが管理画面「カード管理」配下で提供する、対戦フォーマットマスタ（レギュレーション名・枚数上限・紐付けセット・禁止／制限カードなど）の一覧表示、新規登録、編集、削除である。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。pf-eccube3 に配置された HareruyaEc プラグインのソースを確認値とする。

本機能のカスタマイズ区分はカスタマイズである。挙動は現行リポ（pf-eccube3 の HareruyaEc プラグイン）を参照し、DB関連は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。

コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

- ec-cube-enterprise にフォーマット関連テーブル一式が実装されており、本機能の永続化先は移行先に存在する。
- フォーマットマスタ（`mtb_format`）は、主キー `id` と列（`name_jp`、`name_en`、`code`、`rank`、`certification_id`、`main_max_card_count`、`main_min_card_count`、`side_max_card_count`、`side_min_card_count`、`rule_jp`、`rule_en`、`meta_range`、各種フラグ列、`deleted_at`）が現行 pf-eccube3 と同一スキーマである。
- 並び順キーは現行・移行先とも `rank`（予約語のためバッククォート付き）であり、`sort_no` への改称はない。
- 論理削除列 `deleted_at` を現行・移行先とも持つ。
- 関連テーブルは、枚数ルールのフォーマットボード（`dtb_format_board`、列 `format_id`、`board_id`、`count_board_id`、`max_card_count`、`min_card_count`、`deleted_at`）、フォーマットとカードセットの中間（`dtb_format_cardset`、列 `format_id`、`cardset_id`）、禁止・制限・リーガルのカードフォーマット（`dtb_card_format`、列 `card_id`、`format_id`、`restriction_id`）で、いずれも移行先に存在し同一スキーマである。
- 移行先 `mtb_format` には現行に無い列（イベント表示フラグ `is_shown_in_event` 等）が追加されているが、本書の入力項目では参照しない。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|--------------------|
| サイドバー「カード管理」→「フォーマット管理」 | GET `/{admin_route}/format` | フォーマット一覧が並び順・ID 昇順で表示される。 |
| 一覧右上「新規登録」 | GET `/{admin_route}/format/new` | 空のフォーマット登録画面が表示される。 |
| 一覧のフォーマット名リンクまたは「編集」 | GET `/{admin_route}/format/{formatId}/edit` | 既存値が載った編集画面が表示される。 |
| 登録画面で「フォーマット登録」送信 | POST `/{admin_route}/format/new` | 検証成功時は保存後、当該 ID の編集画面へリダイレクトする。 |
| 編集画面で「フォーマット更新」送信 | POST `/{admin_route}/format/{formatId}/edit` | 検証成功時は保存後、同一編集画面へリダイレクトする。 |
| 一覧または編集の「削除」（確認後） | DELETE `/{admin_route}/format/{formatId}/delete` | 関連データが無ければ削除し一覧へ戻る。関連があればエラーメッセージを出してリファラへ戻る。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | 一覧は「フォーマット名」「略称（コード）」「認定」列と行メニュー（編集・削除）。編集画面はアコーディオン見出し「フォーマット情報」内にフォーム項目を縦並び。右カラムに登録／更新・削除（編集時のみ）・一覧へ戻る。 |
| JS 挙動 | `format.js` がセット選択・禁止カード・制限カードの複数選択を Select2 で表示する。「統率でカードを使用する」チェックのオンオフで、「統率のカードをメインボード枚数に含む」「統率上限枚数」「統率下限枚数」を disabled に切り替える（オフ時は POST に含まれない）。`required.js` がフォームの必須項目ラベルへ「※必須」を追記する。 |
| CSS・レイアウト | `format.css` を一覧・編集の双方で読み込む。編集画面は Select2 の CDN CSS を読み込む。 |
| モーダル・ポップアップ | 削除リンクはアンカー用 CSRF と `data-method="delete"`・確認メッセージ（翻訳キー `admin.confirm.delete` にフォーマット表示名を埋め込む）により、送信前に確認ダイアログを出す実装に依存する。 |

---

## 処理フロー

### 一覧を表示する（GET `m14-09_admin_card_format_list`）

1. 管理画面の認証・共通制約を通過する。
2. フォーマットを並び順昇順、次に ID 昇順で全件取得する（ソフトデリート除外は ORM／Gedmo の既定に従う）。
3. 一覧テンプレートを返す。

### 新規登録画面を表示する（GET `admin_format_new`）

1. 管理画面の認証・共通制約を通過する。
2. PHP のメモリ上限を 500M に引き上げる。
3. 新規のフォーマットエンティティでフォームを生成する。禁止カード・制限カードの補助フィールドは空配列をセットする。統率ボードが無いため「統率をメインに含む」チェックはエンティティの算出結果に従う。
4. 編集テンプレートを返す（画面上のサブタイトルは「フォーマット登録」）。

### 編集画面を表示する（GET `admin_format_edit`）

1. 管理画面の認証・共通制約を通過する。
2. パス `formatId` に対応する行が無ければ HTTP 404 とする。
3. PHP のメモリ上限を 500M に引き上げる。
4. 当該フォーマット ID の `dtb_card_format` 行を読み、禁止 ID のものから禁止カード一覧を、制限 ID のものから制限カード一覧を組み立てる。リーガル ID の行はこの補助フィールドには載せない。
5. フォームにエンティティをバインドし、禁止・制限リストと統率関連の初期値（統率ボードの上下限、「統率をメイン枚数に含む」の判定）をセットする。
6. 編集テンプレートを返す（サブタイトルは「フォーマット詳細」）。

### 登録または更新する（POST `admin_format_create` / `admin_format_update`）

1. 管理画面の認証・共通制約を通過する。
2. 更新の場合、パス ID の行が無ければ HTTP 404 とする。
3. フォーム名に紐づく CSRF トークンを検証する。無効ならアクセス拒否（HTTP 403）とする。検証後はトークンを更新する。
4. リクエストをフォームに取り込み、Symfony の検証を実行する。
5. 検証に失敗した場合、管理フラッシュに `admin.register.failed` を積み、入力済みのフォームで編集テンプレートを再表示する。
6. 検証に成功した場合、フォーマットエンティティを永続化して flush し、主キーを確定する。
7. フォームに載った禁止カード ID と制限カード ID をマージした集合を求める。
8. 当該フォーマットに紐づく `dtb_card_format` の各行について、次のいずれかを満たす行を削除する。条件は実装どおりである。
   - 制限種別がリーガル以外である。
   - またはカード ID が手順 7 の集合に含まれる。
   リーガルかつ集合に含まれない行は残す。
9. 禁止カード・制限カードそれぞれについて、対応する制限マスタ ID を付与した `dtb_card_format` 行を新規永続化する。
10. メイン・サイドのフォーマットボード行を、フォームの上下限で作成または更新する。カウント対象ボード ID は null にする。
11. 「統率でカードを使用する」が真のとき、統率ボード行を作成または更新する。「統率のカードをメインボード枚数に含む」が真のときはメイン側フォーマットボードへの参照をセットし、偽のときは参照を null にする。
12. 「統率でカードを使用する」が偽で、既に統率ボード行があればその行を削除する。
13. flush する。
14. 管理フラッシュに `admin.register.complete` を積み、保存後のフォーマット ID の編集画面へ HTTP リダイレクトする（新規でも更新でも同じ）。

### 削除する（DELETE `admin_format_delete`）

1. 管理画面の認証・共通制約を通過する。
2. アンカー用 CSRF（フォーム名によらない既定トークン）を検証する。無効なら HTTP 403 とする。
3. パス ID の行が無ければ HTTP 404 とする。
4. フォーマットに紐づく大会（多対多）、デッキ、いずれかのアーキタイプのコレクションが空でなければ、管理フラッシュに `admin.format.error.delete.event` を積み、`Referer` へリダイレクトする（削除は行わない）。
5. 当該フォーマットの `dtb_card_format` をすべて削除する。
6. フォーマットエンティティを削除し flush する（ソフトデリートか物理削除かはマッピングと Gedmo を確認値とする）。
7. 管理フラッシュに `admin.delete.complete` を積み、一覧へリダイレクトする。

---

## 集計条件

本機能では件数集計や売上集計は行わない。

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|
| M14-10-MSG-001 | 入力項目直下 | 半角英数字、アンダースコア、ハイフン、スペースのみ入力できます。 | POST送信時、nameEnが /^[a-zA-Z0-9_\- ]+$/ に一致しない | フォーマット新規登録・編集画面に留まる |
| M14-10-MSG-002 | 入力項目直下 | 半角英数字、アンダースコア、ハイフン、スペースのみ入力できます。 | POST送信時、codeが /^[a-zA-Z0-9_\- ]+$/ に一致しない | フォーマット新規登録・編集画面に留まる |

## 業務ルール・計算

本機能では売上や在庫の業務計算は行わない。禁止／制限リスト更新時の削除判定は「処理フロー」に従う。

### 入力項目

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

### エッジケース

| ケース | 扱い |
|--------|------|
| 編集対象 ID が存在しない | GET／POST とも HTTP 404。 |
| CSRF 無効 | POST はフォームトークン単位で HTTP 403。DELETE は既定トークンで HTTP 403。 |
| 大会・デッキ・アーキタイプのいずれかが紐付く状態で削除 | 削除せずエラーフラッシュしリファラへリダイレクト。 |
| 統率チェックオフで送信 | 統率関連入力は disabled のため POST に含まれない。サーバは統率ボード行を削除し、`use_command_flg` はフォームのチェック状態で更新される。 |
| リーガル状態の `dtb_card_format` がバッチ等で存在する | 保存時、リーガルかつ禁止・制限リストに含まれないカードの行は削除ルールに該当しないため残る。禁止・制限として選んだカードのリーガル行は集合に含まれるため一旦削除され、禁止または制限として再作成される。 |
| フォーマットコード欄を空のまま送信する | フォームは `required` ではないが Length の最小が 1 のため、空文字は検証エラーになりうる（実装どおり）。 |

---

## データ整合性

| 観点 | 内容 |
|------|------|
| 一覧と編集 | 一覧はリポジトリの `findBy` の結果である。編集は ID での再取得である。一覧表示から編集を開くまでに他管理者が更新した場合、編集開始時点の DB 値が載る（楽観ロックはない）。 |
| 禁止・制限とリーガル | 画面上の禁止・制限は `dtb_card_format` の一部のみを編集する。リーガル行はフォームの禁止・制限集合と削除条件により一部が削除されうるが、集合外のリーガル行は維持される。 |
| 削除 | 関連する大会・デッキ・アーキタイプが無い場合のみフォーマット本体を削除する。`dtb_card_format` は事前にすべて削除する。 |

---

## API/バッチ結果

本機能では API 呼び出し・バッチ実行を扱わない。

---

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | GET はパスパラメータ `formatId`。POST はフォームフィールドと CSRF。DELETE は CSRF（クエリまたはボディは実装のフロントに従う）。 |
| 成功時出力 | HTML 画面またはリダイレクト応答。成功フラッシュは登録・更新で `admin.register.complete`、削除で `admin.delete.complete`。 |
| 失敗時出力 | バリデーション失敗時は同一フォーム再表示と `admin.register.failed`。削除不可時は `admin.format.error.delete.event`。 |
| 副作用 | DB の INSERT／UPDATE／DELETE（およびソフトデリートの場合は `deleted_at` 更新）。セッションにフラッシュメッセージ。CSRF トークン更新（POST フォーム検証時）。 |

---

## DBカラム

機能に直接関係する主な列・テーブル関係のみ示す。型の細部は Doctrine の yml を参照する。

| テーブル | 列または関係 | メモ |
|---------|----------------|------|
| `mtb_format` | `name_jp`, `name_en`, `code`, `rank`, メイン／サイド枚数、各種フラグ、`meta_range`, `rule_jp`, `rule_en`, `certification_id`, `deleted_at` | フォーマット本体。 |
| `dtb_format_board` | `format_id`, ボード種別、上下限、カウント対象ボード参照 | メイン・サイド・統率の枚数ルール。 |
| `dtb_format_cardset` | 中間テーブル | フォーマットとカードセットの多対多。 |
| `dtb_card_format` | `format_id`, `card_id`, `restriction_id` | 禁止・制限・リーガル等。保存時に禁止・制限行が差し替わる。 |

### DB操作

永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。

| 操作種別 | 対象テーブル | 契機・条件 |
|---------|--------------|------------|
| 登録/更新 | dtb_card_format / dtb_format_board / dtb_format_cardset / mtb_format | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |

---

## バリデーション

入力項目表および Symfony の制約に従う。フォーマット名（英）・コードは英数字・アンダースコア・ハイフン・半角スペースのみを許す正規表現がある。

---

## 権限・認可

| 利用者状態 | 一覧・編集・登録・削除 |
|------------|------------------------|
| 管理画面にログインし当ナビゲーションに到達できる管理者 | 実装されたルートへアクセスできる（コアの管理画面認可とロール設定を正とする）。 |
| 未ログインまたは権限不足 | コアの管理画面セキュリティにより拒否またはログインへ誘導される（詳細は別設計）。 |

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 一覧で新規登録を押す | GET 新規編集画面 |
| 一覧で名称または編集を押す | GET 既存編集画面 |
| 新規／編集で送信成功 | 該当フォーマットの編集画面へリダイレクト |
| 送信バリデーション失敗 | 同一編集画面を再表示 |
| 編集で削除成功 | 一覧へリダイレクト |
| 一覧または編集で削除拒否 | `Referer` へリダイレクト |
| 編集で戻る | 一覧 GET |

### 遷移時に引き継ぐ状態

| 起点 | 遷移前の処理 | 遷移後の初期状態 |
|------|--------------|------------------|
| 削除失敗 | エラーフラッシュを積む | リファラの画面を再表示しフラッシュを見せる |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| CSRF 無効 | HTTP 403（アクセス拒否例外）。 |
| 対象フォーマットなし | HTTP 404。 |
| フォーム検証エラー | `admin.register.failed` を積みフォーム再表示。 |
| 削除時に大会・デッキ・アーキタイプのいずれかが関連 | `admin.format.error.delete.event` を積みリファラへ。 |

---

## 試行制限

本機能では試行制限を扱わない。

---

## ログ・監査

本機能専用の業務ログ出力はコード上は主眼としない。コアの HTTP／アクセスログは環境に依存する。

### ログに出してはいけないもの

- パスワード
- なりすまし対策トークン
- Cookie 値
- セッション ID の完全値
- Remember Me トークンの原値

---

## セッション

管理フラッシュメッセージ用のセッション領域が成功・失敗時に更新される。詳細はコアのフラッシュ実装を正とする。

### セッションへ保存しない情報

フォームの全項目をセッションキーとして別途保持する処理は本機能では行わない。

---

## Cookie

本機能固有の Cookie は使わない。管理画面のセッション Cookie はコアに従う。

---

## 排他制御・トランザクション

明示の楽観ロックはない。更新・削除はリクエスト単位の flush に依存する。複数管理者の同時更新の衝突は最後の flush が優先する形になりうる。

---

## 調査補助（grep 用）

実装ファイルの所在を示す。本文の主説明とは切り離して参照する。

- `app/Plugin/HareruyaEc/ServiceProvider/Admin/FormatServiceProvider.php`
- `app/Plugin/HareruyaEc/Controller/Admin/FormatController.php`
- `app/Plugin/HareruyaEc/Form/Type/Admin/Format/FormatType.php`
- `app/Plugin/HareruyaEc/Resource/template/admin/Format/format.twig`
- `app/Plugin/HareruyaEc/Resource/template/admin/Format/formatedit.twig`
- `app/Plugin/HareruyaEc/Resource/template/admin/assets/js/format.js`
- `app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.MtbFormat.dcm.yml`

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `m14-09_admin_card_format_list` … `GET` … `/{admin_route}/format`（フォーマット一覧を表示する。）
- `admin_format_new` … `GET` … `/{admin_route}/format/new`（新規フォーマットの入力画面を表示する。）
- `admin_format_create` … `POST` … `/{admin_route}/format/new`（新規フォーマットを登録する。）
- `admin_format_edit` … `GET` … `/{admin_route}/format/{formatId}/edit`（既存フォーマットの編集画面を表示する。`formatId` は 1 以上の整数（正規表現 `^[1-9][0-9]*$`）。）
- `admin_format_update` … `POST` … `/{admin_route}/format/{formatId}/edit`（既存フォーマットを更新する。）
- `admin_format_delete` … `DELETE` … `/{admin_route}/format/{formatId}/delete`（フォーマットを削除する。）
