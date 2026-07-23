# カード管理 — カードセット新規登録・編集・削除

## 概要

HareruyaEc プラグインが管理画面の「カードセット管理」に提供する、カードセットマスタ（`mtb_cardset`）の新規作成・更新・単体削除を行う機能である。一覧・ページング・画像一括 ZIP とは別ルートで、詳細テンプレート上のフォーム POST と、一覧または詳細から辿る DELETE リンクで完結する。

本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。pf-eccube3 に配置された HareruyaEc プラグインのソースを確認値とする。一覧の URL・セッション・並びは別設計「カード管理 — カードセット一覧」を正とする。

本機能のカスタマイズ区分はカスタマイズである。挙動は現行リポ（pf-eccube3 の HareruyaEc プラグイン）を参照し、DB関連は ec-cube-enterprise を正とする。

対象はブラウザ経由の管理画面に限定する。コントローラのメソッド名は本文の主説明としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。

---

## リニューアル移行時の扱い

- ec-cube-enterprise にカードセットマスタ一式が実装されており、本機能の永続化先は移行先に存在する。
- カードセットマスタ（`mtb_cardset`）は、主キー `id` と列構成（`name_jp`、`name_en`、`code`、`cardsetblock_id`、`category_id`、`release_date`、`rank`、`special_flg`、`display_side_menu_flg`、`branch_display_flg`、`arena_legal_flg`、`rarity_display_flg`、`single_and_packbox_display_flg`、`free_area_jp`、`free_area_en`、`symbol_image`）が現行 pf-eccube3 と同一スキーマである。
- 並び順キーは現行・移行先とも `rank`（予約語のためバッククォート付き）であり、`sort_no` への改称はない。
- カードセット本体の削除方式は物理削除であり、現行・移行先とも `mtb_cardset` に論理削除列 `deleted_at` を持たない。
- 削除可否判定で参照する子テーブルはカード明細マスタ（`mtb_card_detail`、`cardset_id` 保持）で、移行先にも存在する。
- カテゴリ参照（`category_id`）はコアの商品カテゴリ行への外部キーで、現行・移行先とも同じ関連である。

---

## 利用者視点の入口

| 入口 | URLエンドポイント | 期待されるふるまい |
|------|--------------------|---------------------|
| 一覧見出し「新規登録」 | `GET /{admin_route}/cardset/new` | ID を持たない入力フォームが表示される。送信ボタンは「登録」。削除導線は無い。 |
| 一覧表メニュー「編集」 | `GET /{admin_route}/cardset/{id}/edit` | 既存値が埋まったフォームが表示される。送信ボタンは「更新」。収録カードリストと削除導線がある。 |
| 新規で入力し「登録」を押す | `POST /{admin_route}/cardset/edit` | 検証を通れば INSERT し、登録完了フラッシュ付きで `GET /{admin_route}/cardset/{新ID}/edit` にリダイレクトする。 |
| 編集で入力し「更新」を押す | `POST /{admin_route}/cardset/edit` | 検証を通れば UPDATE し、同様に完了フラッシュ付きで `GET /{admin_route}/cardset/{id}/edit` にリダイレクトする。 |
| 編集画面の「削除」（確認後） | `DELETE /{admin_route}/cardset/{id}/delete` | 収録カードが無ければ削除し、成功フラッシュで一覧ページへ。あればエラーフラッシュで直前の参照元へ。 |
| 一覧表メニュー「削除」（確認後） | `DELETE /{admin_route}/cardset/{id}/delete` | 同上。 |
| フッタ「検索画面に戻る」 | `GET /{admin_route}/cardset/{page_no}?resume=1`（`page_no` はセッションの `eccube.admin.cardset.page_no`、無ければ既定） | 一覧がセッション保持の件数・並びで再表示される（一覧側の `resume` ルールに従う）。 |

---

## フロント挙動

| 観点 | 内容 |
|------|------|
| 表示要素 | ページタイトルは「カードセット詳細」。`card_set` フォームを `POST` 先 `admin_cardset_update`、横並び Bootstrap テーマ。カードセット ID は `hidden`。ブロック・カテゴリはプルダウン。リリース日は単一テキスト（`yyyy-MM-dd`）。フリーエリア日英は複数行入力。各種チェックボックス。シンボルはファイル入力のほか、既存キーは hidden、プレビュー img または「画像未登録」見出し。編集時のみ収録カードリスト（各リンクは `admin_card_edit` を新規タブ）。フッタに一覧へ戻る。 |
| JS 挙動 | `required.js` を読み込む。カテゴリの `select` に select2（幅 100%）を当てる。 |
| CSS・レイアウト | select2 の CDN CSS。管理画面共通フレーム。 |
| モーダル・ポップアップ | 専用モーダルは無し。削除リンクはアンカーに共通の DELETE＋CSRF 用属性と、固定文言の確認（「このカードセットを削除してもよろしいですか？」）を付与する実装に委ねる。 |

---

## 処理フロー

### 新規フォームを表示する（GET `admin_cardset_new`）

1. 管理画面の認証・共通制約を通過する。
2. フォーム種別名 `card_set` をエンティティ無しで生成する。
3. `card_set_detail.twig` を描画する。`id` は Twig 変数として `null`、収録カードリストは `null`。

### 編集フォームを表示する（GET `admin_cardset_edit`）

1. 管理画面の認証・共通制約を通過する。
2. ORM の soft delete フィルタから、論理削除対象からコアの商品カテゴリ行のみ除外設定を行う（当 GET のみのスコープ）。
3. パス `id` でカードセットを `findOneById` 相当で取得する。得られなければ HTTP 404 を返す。
4. フォーム `card_set` を取得したエンティティで生成する。
5. 同一カードセット ID に紐づくカードの一覧をリポジトリの `selectCardsetId` で取得し、`cardlists` として渡す。
6. `card_set_detail.twig` を描画する。`id` はパスの整数。

### 新規登録または更新を送信する（POST `admin_cardset_update`）

1. 管理画面の認証・共通制約を通過する。
2. フォーム `card_set` をデフォルト生成し、`handleRequest` する（POST 時も初期は未バインドのビルダ起点）。
3. 共有トレイトの手順で、フォーム名に紐づく CSRF を検証し、無効なら拒否例外となる。検証後はトークンを更新する。
4. Symfony のフォーム `isValid` が偽の場合、管理画面エラーメッセージキー `admin.register.failed` を積み、同テンプレートを再描画する。収録リストは、送信データに ID があればその ID で再取得し、無ければ空配列とする。
5. 有効な場合、送信配列を取得する。
6. シンボル画像ファイルが指定されていれば、クライアント元ファイル名を環境に応じた文字コード変換したうえでユーザー保存ディレクトリ直下のファイル名とし、一時パスを組み立てる。ファイルが指定されていなければ、送信に残っている文字列のシンボル画像キーを引き継ぐ（更新時の既存画像維持）。
7. 送信の ID が空なら新規エンティティを生成し、そうでなければ該当 ID を再読込する。
8. 日本語名・英語名・略称・ブロック ID・リリース日・並び順・各チェック・カテゴリ・フリーエリア日英を setter で上書きする。リリース日は日付部分のみで組み立て直す。並び順は整数化する。
9. アップロードファイルがある場合、同名既存ローカルファイルがあれば削除し、ユーザー保存ディレクトリへ移動する。オブジェクトストレージ配置サービスに拡張子と実ファイルパスを渡し、返却パスで `symbol_image` を更新する。
10. エンティティを `persist` し `flush` する（新規の場合 ID はここで採番される）。
11. 成功メッセージキー `admin.register.complete` を積む。
12. `GET /{admin_route}/cardset/{永続化後 ID}/edit` へリダイレクトする。

### 単体削除を実行する（DELETE `admin_cardset_delete`）

1. 管理画面の認証・共通制約を通過する。
2. CSRF をフォーム無しモードで検証する（共有トレイトのデフォルトトークン名）。
3. パス `id` が空、またはカードセットが取得できない場合、HTTP 404 を返す。
4. カードセットに紐づくカード詳細コレクションの件数が正の場合、翻訳キー `admin.cardset.delete.failed`（第 1 引数に日本語セット名）のメッセージをエラーとして積み、`Referer` があればそこへ HTTP リダイレクトし、無ければ実装依存とする。
5. 再取得したエンティティを `remove` し `flush` する。
6. 成功メッセージキー `admin.delete.complete` を積む。
7. `GET /{admin_route}/cardset/{page_no}` にリダイレクトする。`page_no` はセッション `eccube.admin.cardset.page_no` があればそれであり、無ければ `1`。

---

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M14-08-MSG-001 | 入力項目直下 | 半角英数字・記号（ASCII文字）のみ入力できます。 | Only ASCII characters are allowed. | 新規登録または編集で、略称に半角英数字・記号以外を入力して送信したとき | カードセット新規登録・編集・削除画面に留まる |
| M14-08-MSG-002 | 管理画面上部 | 削除しました | Deleted | カードセットを削除したとき | カードセット一覧画面に遷移する |
| M14-08-MSG-003 | 管理画面上部 | 既にカードセットにカードが登録されているため、%name% のカードセット情報は削除することができません。 | 既にカードセットにカードが登録されているため、%name% のカードセット情報は削除することができません。 | 登録済みのカードがあるカードセットを削除したとき | カードセット一覧画面に遷移する |
| M14-08-MSG-004 | 管理画面上部 | 削除に失敗しました | Failed to delete | カードセットの削除中にエラーが起きたとき | カードセット一覧画面に遷移する |
| M14-08-MSG-005 | 管理画面上部 | 保存しました | 保存しました | カードセットを新規登録して保存したとき | カードセット新規登録・編集・削除画面に遷移する |
| M14-08-MSG-006 | 管理画面上部 | 保存しました | 保存しました | カードセットを編集して保存したとき | カードセット新規登録・編集・削除画面に遷移する |
| M14-08-MSG-007 | 該当フォーム項目直下 | 半角文字のみ入力できます。 | Only ASCII characters are allowed. | 略称に半角文字以外を入力して登録したとき | カードセット新規登録・編集・削除画面に留まる |

## 業務ルール・計算

| 項目 | 内容 |
|------|------|
| カードセット ID | 新規は INSERT 時に採番。編集は hidden の ID で既存行を識別し、再読込してから全フィールドを上書きする。 |
| シンボル画像 | ファイル POST があるときだけオブジェクトストレージへ送り `symbol_image` を更新する。無いときは更新処理がこの列を触らないため、編集では DB の既存値が残る。 |
| 削除可否 | `mtb_card_detail` が当該 `cardset_id` で 1 件でも存在すれば削除しない。ORM 上は親の `cardDetails` コレクション件数で見る。 |

### 入力項目

| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
|--------|-----------|--------|--------|----------------|
| カードセットID | 画面上は非表示のため区分不要 | 該当なし | 新規は空、編集は `mtb_cardset.id` | 主キー。新規 INSERT 時は採番され、フォームは hidden の `id` 経由で更新判別に使う。 |
| カードセット名日本語 | 必須 | 64 文字（NotBlank、Length max） | 編集は DB の `name_jp` | `mtb_cardset.name_jp` |
| カードセット名英語 | 必須 | 64 文字 | 編集は DB の `name_en` | `mtb_cardset.name_en` |
| 略称 | 必須 | フォーム上 50 文字、半角 ASCII のみ（Regex）。列は 10 文字（実装の整合は DB 側エラーもあり得る） | 編集は DB の `code` | `mtb_cardset.code` |
| ブロック選択 | 任意 | 該当なし（選択肢はマスタ） | プルダウン「未指定」 | `mtb_cardset.cardsetblock_id`（nullable） |
| リリース日 | 必須 | 日付 1 件（年は当年から当年＋2 の範囲でウィジェット生成） | 編集は DB の `release_date` | `mtb_cardset.release_date` |
| 並び順 | 必須 | 8 桁相当（先頭ゼロを除く非負整数文字列、Regex、Length max） | 編集は DB の `rank` | `mtb_cardset.rank` |
| カテゴリ | 任意 | 該当なし | プルダウン「未指定」 | `mtb_cardset.category_id`（コアの商品カテゴリテーブル行への外部キー、nullable） |
| フリーエリア(日) | 任意 | スキーマ上 `text`（実装は maxlength 無し） | 編集は DB の `free_area_jp` | `mtb_cardset.free_area_jp` |
| フリーエリア(英) | 任意 | 同上 | 編集は DB の `free_area_en` | `mtb_cardset.free_area_en` |
| 特殊セットフラグ | 任意 | 該当なし | 編集は DB の `special_flg` | `mtb_cardset.special_flg` |
| サイドメニュー表示フラグ | 任意 | 該当なし | 編集は DB の `display_side_menu_flg` | `mtb_cardset.display_side_menu_flg` |
| 支店表示フラグ | 任意 | 該当なし | 編集は DB の `branch_display_flg` | `mtb_cardset.branch_display_flg` |
| MTG ARENA で導入済 | 任意 | 該当なし | 編集は DB の `arena_legal_flg`。ラベルは翻訳キー `form.format.arena_legal_flg.label`（日本語は「MTG ARENAで導入済」） | `mtb_cardset.arena_legal_flg`。フォームのチェックボックスは `value` が文字列 `false` に設定されている（Symfony のチェック時送信値）。永続化は実装の型変換に依存する。 |
| レアリティ別に表示させない | 任意 | 該当なし | 編集は DB の `rarity_display_flg` | `mtb_cardset.rarity_display_flg`（ラベル文言どおり「表示させない」の意味で保持する列である） |
| レアリティ別に表示させない（【未開封品】パック・ボックスは表示する） | 任意 | 該当なし | 編集は DB の `single_and_packbox_display_flg` | `mtb_cardset.single_and_packbox_display_flg` |
| シンボル画像（ファイル） | 任意 | ファイル入力（accept 制限はフォーム型デフォルト） | 無選択 | 指定時のみユーザー保存領域へ保存のうえオブジェクトストレージへ送り、返却キーを `mtb_cardset.symbol_image` に保存。未指定時は新規は NULL、更新は再 POST で上書きしないため DB 既存値が維持される。 |
| シンボル画像（hidden） | 任意 | 128 文字（列定義） | 編集はストレージ上の相対キー | フォームは `symbol_image` 名の text を hidden で保持。更新 POST でファイル無しのときの母艦。 |

フォーム種別名は `card_set`（型クラスは調査補助を参照）。検証は同一型定義に基づく。文字の最大長はフォームの `Assert\Length` と、`mtb_cardset` の Doctrine マッピング `length` が衝突する場合がある。略称はフォーム上 50 文字・半角 ASCII 正規表現と、列定義 10 文字の差がある。

---

### エッジケース

- 略称のフォーム上限（50）と DB 列長（10）が一致しない。長文は検証で止まるか、DB で失敗するかは入力内容に依存する。
- `arena_legal_flg` のチェックボックスは送信値が文字列 `false` に設定されている。ブール列へどう結びつくかは PHP の型付けと setter の実装を確認値とする。
- 削除禁止は、当該カードセットに紐づくカード詳細の件数が 0 より大きいときのみ（ORM のコレクション `count`）。一覧側のメッセージは日本語セット名を 1 引数に取る翻訳文「既にカードセットにカードが登録されているため、%s のカードセット情報は削除することができません。」となる。
- バリデーション失敗時の収録リスト再取得は、フォームデータに ID が載っていればその ID を使う。新規初回送信で全体失敗した場合は空表示になり得る。
- 削除が失敗した場合のリダイレクト先は `Referer` ヘッダの値をそのまま使う。ヘッダ欠落時の挙動はフレームワークのリダイレクト応答に依存する。

---

## 画面遷移

| 条件 | 遷移先 |
|------|--------|
| 新規または編集の送信が成功 | `GET /{admin_route}/cardset/{id}/edit`（登録直後は採番された ID） |
| 送信の検証失敗 | 同一 `card_set_detail` テンプレートを再描画（URL は POST のまま視覚的に変わらない） |
| 削除が成功 | `GET /{admin_route}/cardset/{page_no}`（`page_no` はセッション `eccube.admin.cardset.page_no` 既定 1） |
| 削除が不可（カード詳細が 1 件以上） | `Referer` が示す URL へ HTTP リダイレクト（通常は一覧または編集のいずれか） |
| 「検索画面に戻る」 | `GET /{admin_route}/cardset/{page_no}?resume=1` |

---

## エラー処理

| エラー内容 | 処理 |
|------------|------|
| CSRF 不正 | アクセス拒否（HTTP）。共有トレイトが例外を投げる。 |
| Symfony フォーム検証エラー | `admin.register.failed` をエラーフラッシュに積み、詳細テンプレートへ戻す。 |
| 編集 GET でカードセットが存在しない | HTTP 404。 |
| 削除で ID が空または対象が存在しない | HTTP 404。 |
| 削除で子のカード詳細が存在 | `admin.cardset.delete.failed`（第 1 引数に日本語セット名）をエラーフラッシュに積み、`Referer` へリダイレクト。 |

---

## 試行制限

本機能では試行制限を扱わない。

---

## 集計・判定・計算

本機能は売上集計やスコア計算を行わない。削除可否は「紐づくカード詳細の有無」だけを判定する。

---

## データ整合性

- 一覧の並び・ページはセッションキー `eccube.admin.cardset.*` で一覧側と共有する。詳細から登録・更新して戻ると、直近の一覧ページへは自動で飛ばず、編集 URL に留まる。
- 更新処理は常にフォーム送信値で主要フィールドを上書きする。シンボル画像はファイル送信が無い限り、手順 9 の upload ブロックに入らないため、DB 上の既存キーはそのまま残る（再表示は次回 GET で読み込んだ値）。

---

## API／バッチ結果

本機能では扱わない。

---

## 副作用

- 成功時は管理画面の成功フラッシュ（登録完了系キー）を積む。失敗時は登録失敗キーまたは削除失敗メッセージを積む。
- シンボル画像を上げた場合、ローカルユーザー保存ディレクトリに同名があれば削除してから移動し、オブジェクトストレージへ PUT する。
- DELETE 成功時はセッション保持の一覧ページ番号へ戻る。DELETE 失敗時は Referer へ戻り、フラッシュを見せる。
- CSRF 検証のたびにトークンを更新する共有実装がある。

---

## 調査補助（grep 用）

- ルート定義: `app/Plugin/HareruyaEc/ServiceProvider/Admin/CardsetServiceProvider.php`
- 画面・送信処理: `app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php`
- フォーム型: `app/Plugin/HareruyaEc/Form/Type/Admin/Cardset/CardSetType.php`
- 詳細テンプレート: `app/Plugin/HareruyaEc/Resource/template/admin/Cardset/card_set_detail.twig`
- マッピング: `app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.MtbCardset.dcm.yml`

### HTTPルート名とパス（コード探索用・旧入口節より退避）

- `admin_cardset_new` … `GET` … `/{admin_route}/cardset/new`（新規用の空フォーム表示。）
- `admin_cardset_edit` … `GET` … `/{admin_route}/cardset/{id}/edit`（既存カードセットの編集フォーム表示。）
- `admin_cardset_update` … `POST` … `/{admin_route}/cardset/edit`（新規登録および更新の送信処理（パスに ID は含めない）。）
- `admin_cardset_delete` … `DELETE` … `/{admin_route}/cardset/{id}/delete`（単一カードセットの削除。）

---

## 排他制御・トランザクション

| 観点 | 内容 |
|------|------|
| トランザクション境界 | 明示的なトランザクション境界が実装にある場合は処理フローの保存処理を正とする。明示境界が無い更新はフォーム処理またはCSV取込後の永続化処理と`flush`単位で確定する。 |
| ロック | 行ロック・悲観ロック・楽観ロック・ロックファイルを使用しない。競合時は後から確定した更新が残る。 |
| 例外時 | 検証エラーまたは保存前の例外では対象更新を確定しない。保存処理中の例外はエラー処理の節を正とし、未確定の永続化対象はロールバックまたは未flushのまま確定しない。 |
